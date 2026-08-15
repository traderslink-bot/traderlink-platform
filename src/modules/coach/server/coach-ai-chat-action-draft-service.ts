import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  CoachAiChatActionCanonicalCommand,
  CoachAiChatActionDraft,
  CoachAiChatActionDraftExtraction,
  CoachAiChatActionDraftPreview,
} from "../contracts/ai-chat-action-draft-contracts";
import { CoachReviewDeliveryScheduleRepository } from
  "./coach-weekly-review-schedule-repository";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  PLATFORM_NOTIFICATION_CATEGORIES,
  type PlatformNotificationCategory,
} from "@/src/modules/platform/contracts/platform-notification-contracts";
import { PlatformAccountProfileReadService } from
  "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import {
  parsePlatformReportingCurrency,
  PlatformUserPreferenceRepository,
} from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { PlatformNotificationRepository } from
  "@/src/modules/platform/server/notifications/platform-notification-repository";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiChatActionDraftRepository } from "./coach-ai-chat-action-draft-repository";

function notificationRef(scope: WorkspaceAccessScope, privateId: string): string {
  return createHash("sha256").update([
    "coach-notification-ref-v1",
    scope.workspaceId,
    scope.userId,
    privateId,
  ].join("\u001f"), "utf8").digest("hex");
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return value;
}

const NOTIFICATION_CATEGORY_LABELS: Readonly<Record<PlatformNotificationCategory, string>> =
  Object.freeze({
    ai_review: "AI Reviews",
    broker_import: "Broker imports",
    chart_update: "Chart updates",
    statement_import: "Statement imports",
  });

function notificationCategories(value: unknown): readonly PlatformNotificationCategory[] {
  if (!Array.isArray(value) || value.some((item) =>
    typeof item !== "string" ||
    !PLATFORM_NOTIFICATION_CATEGORIES.includes(item as PlatformNotificationCategory))) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "discordDmCategories",
    });
  }
  const selected = new Set(value as PlatformNotificationCategory[]);
  return Object.freeze(PLATFORM_NOTIFICATION_CATEGORIES.filter((category) => selected.has(category)));
}

function categoryLabels(categories: readonly PlatformNotificationCategory[]): readonly string[] {
  return Object.freeze(categories.map((category) => NOTIFICATION_CATEGORY_LABELS[category]));
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return value;
}

function positiveInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return Number(value);
}

export class CoachAiChatActionDraftService {
  private readonly drafts: CoachAiChatActionDraftRepository;
  private readonly preferences: PlatformUserPreferenceRepository;
  private readonly notifications: PlatformNotificationRepository;
  private readonly profile: PlatformAccountProfileReadService;
  private readonly reviewSchedules: CoachReviewDeliveryScheduleRepository;

  constructor(private readonly database: Database.Database) {
    this.drafts = new CoachAiChatActionDraftRepository(database);
    this.preferences = new PlatformUserPreferenceRepository(database);
    this.notifications = new PlatformNotificationRepository(database);
    this.profile = new PlatformAccountProfileReadService(database);
    this.reviewSchedules = new CoachReviewDeliveryScheduleRepository(database);
  }

  create(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      extraction: CoachAiChatActionDraftExtraction;
    }>,
    now = new Date(),
  ): CoachAiChatActionDraft {
    let preview: CoachAiChatActionDraftPreview;
    let privatePayload: Readonly<Record<string, unknown>>;
    if (input.extraction.kind === "reporting_currency") {
      const current = this.preferences.getActiveUserReportingCurrency(scope.userId);
      const proposed = parsePlatformReportingCurrency(input.extraction.reportingCurrency);
      if (current === proposed) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Change reporting currency",
        currentReportingCurrency: current,
        proposedReportingCurrency: proposed,
      });
      privatePayload = Object.freeze({ currentReportingCurrency: current, proposedReportingCurrency: proposed });
    } else if (input.extraction.kind === "mark_notification_read") {
      if (!/^[0-9a-f]{64}$/u.test(input.extraction.notificationRef)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationRef" });
      }
      const opaqueNotificationRef = input.extraction.notificationRef;
      const item = this.notifications.list(scope, 100).find((candidate) =>
        notificationRef(scope, candidate.notificationRef) === opaqueNotificationRef);
      if (!item || item.readAtUtc !== null) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Mark notification as read",
        notificationTitle: item.title,
        notificationSummary: item.summary,
        occurredAtUtc: item.occurredAtUtc,
      });
      privatePayload = Object.freeze({ notificationId: item.notificationRef });
    } else if (input.extraction.kind === "select_journal_account") {
      const accountDisplayName = input.extraction.accountDisplayName.trim();
      const profile = this.profile.get(scope);
      const matches = profile.journalAccounts.filter((account) =>
        account.displayName.localeCompare(accountDisplayName, undefined, { sensitivity: "accent" }) === 0);
      if (matches.length !== 1 || matches[0]!.active) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      const current = profile.journalAccounts.find((account) => account.active);
      if (!current) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "activeAccount" });
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Switch Journal account",
        currentAccountDisplayName: current.displayName,
        proposedAccountDisplayName: matches[0]!.displayName,
      });
      privatePayload = Object.freeze({
        currentSelectionRef: current.selectionRef,
        proposedSelectionRef: matches[0]!.selectionRef,
      });
    } else if (input.extraction.kind === "notification_preferences") {
      const current = this.notifications.readPreferences(scope).discordDmCategories;
      const proposed = notificationCategories(input.extraction.discordDmCategories);
      if (sameStrings(current, proposed)) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Change Discord notifications",
        currentCategoryLabels: categoryLabels(current),
        proposedCategoryLabels: categoryLabels(proposed),
      });
      privatePayload = Object.freeze({
        currentCategories: current,
        proposedCategories: proposed,
      });
    } else {
      const current = this.reviewSchedules.readV2(scope);
      if (!current || current.isEnabled === input.extraction.isEnabled) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Change AI Reviews",
        currentEnabled: current.isEnabled,
        proposedEnabled: input.extraction.isEnabled,
      });
      privatePayload = Object.freeze({
        currentRevision: current.revision,
        proposedEnabled: input.extraction.isEnabled,
      });
    }
    return this.drafts.create(scope, {
      conversationId: input.conversationId,
      sourceMessageId: input.sourceMessageId,
      preview,
      privatePayload,
    }, now);
  }

  list(scope: WorkspaceAccessScope, conversationId: string): readonly CoachAiChatActionDraft[] {
    return this.drafts.list(scope, conversationId);
  }

  readForSourceMessage(
    scope: WorkspaceAccessScope,
    conversationId: string,
    sourceMessageId: string,
  ): CoachAiChatActionDraft | null {
    return this.drafts.readForSourceMessage(scope, conversationId, sourceMessageId);
  }

  confirm(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; draftId: string }>,
    now = new Date(),
  ): Readonly<{ draft: CoachAiChatActionDraft; accountSelectionRef: string | null }> {
    return this.drafts.runAtomically(() => {
      let draft = this.drafts.read(scope, input.draftId);
      if (draft.conversationId !== input.conversationId) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      if (draft.disposition === "confirmed" && draft.writeState === "committed") {
        const accountSelectionRef = draft.preview.kind === "select_journal_account"
          ? string(
              this.drafts.readPrivatePayload(scope, input.draftId).proposedSelectionRef,
              "proposedSelectionRef",
            )
          : null;
        return Object.freeze({ draft, accountSelectionRef });
      }
      if (draft.disposition === "expired" || now.toISOString() >= draft.expiresAtUtc) {
        draft = this.drafts.expire(scope, input.draftId, now);
        return Object.freeze({ draft, accountSelectionRef: null });
      }
      const payload = this.drafts.readPrivatePayload(scope, input.draftId);
      let command: CoachAiChatActionCanonicalCommand;
      let reference: string;
      let accountSelectionRef: string | null = null;
      if (draft.preview.kind === "reporting_currency") {
        const current = this.preferences.getActiveUserReportingCurrency(scope.userId);
        if (current !== string(payload.currentReportingCurrency, "currentReportingCurrency")) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        command = "platform_reporting_currency_update";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const proposed = this.preferences.updateActiveUserReportingCurrency({
          userId: scope.userId,
          reportingCurrency: payload.proposedReportingCurrency,
          updatedAtUtc: createCanonicalUtcTimestamp(now),
        });
        reference = `reporting_currency:${proposed}`;
      } else if (draft.preview.kind === "mark_notification_read") {
        command = "platform_notification_mark_read";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const privateId = string(payload.notificationId, "notificationId");
        this.notifications.markRead(scope, privateId, createCanonicalUtcTimestamp(now));
        reference = `notification:${notificationRef(scope, privateId)}`;
      } else if (draft.preview.kind === "select_journal_account") {
        const profile = this.profile.get(scope);
        const active = profile.journalAccounts.find((account) => account.active);
        if (!active || active.selectionRef !== string(payload.currentSelectionRef, "currentSelectionRef")) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        accountSelectionRef = string(payload.proposedSelectionRef, "proposedSelectionRef");
        if (!profile.journalAccounts.some((account) => account.selectionRef === accountSelectionRef)) {
          platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
        }
        command = "platform_account_selection";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        reference = `account_selection:${createHash("sha256").update(accountSelectionRef, "utf8").digest("hex")}`;
      } else if (draft.preview.kind === "notification_preferences") {
        const current = this.notifications.readPreferences(scope).discordDmCategories;
        const expected = notificationCategories(payload.currentCategories);
        const proposed = notificationCategories(payload.proposedCategories);
        if (!sameStrings(current, expected)) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        command = "platform_notification_preferences_update";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const saved = this.notifications.replaceDiscordDmCategories({
          categories: proposed,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(now),
        });
        reference = `notification_preferences:${createHash("sha256")
          .update(saved.discordDmCategories.join("\u001f"), "utf8").digest("hex")}`;
      } else {
        const current = this.reviewSchedules.readV2(scope);
        if (!current || current.revision !== positiveInteger(payload.currentRevision, "currentRevision")) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const proposedEnabled = boolean(payload.proposedEnabled, "proposedEnabled");
        command = "coach_ai_review_account_setting_save";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const saved = this.reviewSchedules.saveV2(scope, {
          isEnabled: proposedEnabled,
          currentFrequency: current.currentFrequency,
          timingMode: current.timingMode,
          twoWeekAnchorMondayDate: current.twoWeekAnchorMondayDate,
          pendingFrequency: proposedEnabled ? current.pendingFrequency : null,
          pendingEffectiveMondayDate: proposedEnabled
            ? current.pendingEffectiveMondayDate
            : null,
          pendingTwoWeekAnchorMondayDate: proposedEnabled
            ? current.pendingTwoWeekAnchorMondayDate
            : null,
          expectedRevision: current.revision,
        }, now);
        reference = `ai_review_settings:${saved.revision}`;
      }
      draft = this.drafts.markCommitted(scope, input.draftId, reference);
      return Object.freeze({ draft, accountSelectionRef });
    });
  }

  reject(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; draftId: string }>,
    now = new Date(),
  ): CoachAiChatActionDraft {
    return this.drafts.runAtomically(() => {
      const draft = this.drafts.read(scope, input.draftId);
      if (draft.conversationId !== input.conversationId) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      return this.drafts.reject(scope, input.draftId, now);
    });
  }
}
