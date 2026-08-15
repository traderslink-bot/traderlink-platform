import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  CoachAiChatActionDraft,
  CoachAiChatActionDraftExtraction,
  CoachAiChatActionDraftPreview,
} from "../contracts/ai-chat-action-draft-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
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

export class CoachAiChatActionDraftService {
  private readonly drafts: CoachAiChatActionDraftRepository;
  private readonly preferences: PlatformUserPreferenceRepository;
  private readonly notifications: PlatformNotificationRepository;
  private readonly profile: PlatformAccountProfileReadService;

  constructor(private readonly database: Database.Database) {
    this.drafts = new CoachAiChatActionDraftRepository(database);
    this.preferences = new PlatformUserPreferenceRepository(database);
    this.notifications = new PlatformNotificationRepository(database);
    this.profile = new PlatformAccountProfileReadService(database);
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
    } else {
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
      let command: "platform_reporting_currency_update" | "platform_notification_mark_read" | "platform_account_selection";
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
      } else {
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
