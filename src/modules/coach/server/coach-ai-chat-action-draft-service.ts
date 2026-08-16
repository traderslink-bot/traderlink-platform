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
import {
  CoachAiReviewAvailabilityService,
  type CoachAiReviewAvailabilityV2,
} from "./coach-ai-review-availability-service";
import {
  CoachAiReviewGenerationCoordinatorV2,
  type CoachAiReviewGenerationGateV2,
} from "./coach-ai-review-generation-coordinator-v2";
import {
  CoachAiReviewRequestService,
  type CoachAiReviewManualRequestResultV2,
  type CoachAiReviewManualRequestV2,
} from "./coach-ai-review-request-service";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalAccountSelectionRef } from
  "@/src/modules/platform/contracts/journal-account-selection";
import { JournalAnnotationRepository } from
  "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import type { JournalRuleRecord } from
  "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { JournalExecutionVersionRecord } from
  "@/src/modules/journal/contracts/journal-execution-contracts";
import type { JournalDecisionResolution } from
  "@/src/modules/journal/server/decisions/journal-data-decision-service";
import type {
  JournalSwingPositionDetail,
  JournalTrackedPositionDetail,
} from "@/src/modules/journal/contracts/journal-trade-tracker-contracts";
import type {
  JournalSwingDailyNoteChange,
  JournalSwingDailyNoteRecord,
} from "@/src/modules/journal/contracts/journal-swing-note-contracts";
import type {
  JournalTradeStyleChange,
  JournalTradeStyleRecord,
} from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import { JournalExecutionRepository } from
  "@/src/modules/journal/server/executions/journal-execution-repository";
import { createJournalIntegrityRuntime } from
  "@/src/modules/journal/server/journal-integrity-runtime";
import { createJournalDataDecisionResolution } from
  "@/src/modules/journal/server/product/journal-data-decision-resolution";
import { JournalProductReadService } from
  "@/src/modules/journal/server/product/journal-product-read-service";
import {
  JOURNAL_RULE_TEMPLATE_CATALOG,
  mutateJournalTradingRules,
  validateJournalTradingRuleTemplateConfiguration,
} from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import {
  JOURNAL_TAG_PRESET_CATALOG,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
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
  createCanonicalUuidV4,
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

function ruleRef(scope: Readonly<{ workspaceId: string; accountId: string }>, ruleId: string): string {
  return createHash("sha256").update([
    "coach-rule-ref-v1",
    scope.workspaceId,
    scope.accountId,
    ruleId,
  ].join("\u001f"), "utf8").digest("hex");
}

function dataDecisionRef(
  kind: "data-decision" | "data-decision-execution",
  scope: Readonly<{ workspaceId: string; accountId: string }>,
  privateId: string,
): string {
  return createHash("sha256").update([
    `coach-${kind}-ref-v1`,
    scope.workspaceId,
    scope.accountId,
    privateId,
  ].join("\u001f"), "utf8").digest("hex");
}

function accountRosterSha256(accounts: readonly Readonly<{
  selectionRef: string;
  displayName: string;
  baseCurrency: string;
  tradingTimezone: string;
}>[]): string {
  return createHash("sha256").update(accounts.map((account) => [
    account.selectionRef,
    account.displayName,
    account.baseCurrency,
    account.tradingTimezone,
  ].join("\u001e")).sort().join("\u001f"), "utf8").digest("hex");
}

const DATA_DECISION_ACTION_LABELS = Object.freeze({
  confirm_legitimate_open_position: "Confirm this open position",
  reconcile_grouped_fills: "Group the supported fills",
  accept_source_limitation: "Accept the source limitation",
  exclude_execution: "Exclude this execution",
  restore_execution: "Restore this execution",
  keep_distinct: "Keep this execution separate",
  merge_supported_duplicate: "Merge the duplicate execution",
} as const);

const AI_REVIEW_LABELS = Object.freeze({
  weekly: "Weekly Review",
  two_week: "Two-Week Review",
  monthly: "Monthly Review",
} as const);

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

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return Object.freeze(value as string[]);
}

function record(value: unknown, field: string): Readonly<Record<string, unknown>> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return value as Readonly<Record<string, unknown>>;
}

function normalizedRuleText(value: unknown, field: string, maximum: number): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const normalized = value.trim().replace(/\s+/gu, " ").normalize("NFKC");
  if (normalized.length < 1 || normalized.length > maximum) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return normalized;
}

function accountDisplayName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "displayName" });
  }
  const normalized = value.trim().normalize("NFKC");
  if (normalized.length < 1 || normalized.length > 120 || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "displayName" });
  }
  return normalized;
}

function accountCurrency(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "baseCurrency" });
  }
  const normalized = value.trim().toUpperCase();
  if (!Intl.supportedValuesOf("currency").includes(normalized)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "baseCurrency" });
  }
  return normalized;
}

function accountTimezone(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tradingTimezone" });
  }
  const normalized = value.trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(0);
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tradingTimezone" });
  }
  return normalized;
}

function canonicalDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function swingNoteText(value: unknown, field: string, required: boolean): string | null {
  if (value === null && !required) return null;
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const normalized = value.replace(/\r\n?/gu, "\n");
  if (normalized.length > 12_000 || normalized.includes("\u0000") ||
      (required && normalized.trim().length === 0)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return !required && normalized.trim().length === 0 ? null : normalized;
}

function swingNoteSha256(note: JournalSwingDailyNoteRecord | null): string {
  return createHash("sha256").update(note ? [
    String(note.revision),
    note.reviewDate,
    note.note,
    note.nextSessionPlan ?? "",
  ].join("\u001f") : "none", "utf8").digest("hex");
}

const TRADE_STYLE_CLASSIFICATIONS = Object.freeze({
  active_swing: Object.freeze({
    label: "Active swing",
    tradeStyle: "swing" as const,
    openStatus: "swing" as const,
    reason: "reclassified" as const,
  }),
  day_trade_still_open: Object.freeze({
    label: "Day trade still open",
    tradeStyle: "day_trade" as const,
    openStatus: "day_trade_still_open" as const,
    reason: "reclassified" as const,
  }),
  bag_hold: Object.freeze({
    label: "Unplanned hold (bag hold)",
    tradeStyle: "other" as const,
    openStatus: "unplanned_hold" as const,
    reason: "unplanned_hold" as const,
  }),
  long_term_hold: Object.freeze({
    label: "Long-term hold",
    tradeStyle: "other" as const,
    openStatus: "other" as const,
    reason: "other" as const,
  }),
});

function currentTradeStyleLabel(position: JournalTrackedPositionDetail): string {
  const status = position.style?.openStatus;
  if (status === "swing") return "Active swing";
  if (status === "day_trade_still_open") return "Day trade still open";
  if (status === "unplanned_hold") return "Unplanned hold (bag hold)";
  if (status === "other") return "Long-term hold";
  return "Not classified";
}

function tradeStyleSha256(style: JournalTrackedPositionDetail["style"]): string {
  return createHash("sha256").update(style ? [
    String(style.revision),
    style.tradeStyle,
    style.openStatus,
    String(style.plannedFromEntry),
    style.claimedEffectiveAtUtc,
    style.lifecycleState,
  ].join("\u001f") : "none", "utf8").digest("hex");
}

function ruleConfiguration(value: unknown): Readonly<Record<string, string>> {
  const source = record(value, "configuration");
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item !== "string") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "configuration" });
    }
    result[key] = item;
  }
  return Object.freeze(result);
}

function ruleDetails(rule: JournalRuleRecord): readonly string[] {
  return Object.freeze([
    rule.sourceKind === "template" ? "Preset rule" : "Custom rule",
    `Status: ${rule.lifecycleState}`,
    ...(rule.sourceKind === "template"
      ? Object.entries(rule.configuration).map(([key, value]) => `${key}: ${value}`)
      : [
          `Applies to: ${rule.reviewScope === "day" ? "trading day"
            : rule.reviewScope === "trade" ? "trade" : "trading day and trade"}`,
          `Category: ${rule.category}`,
          `Focus rule: ${rule.isFocus ? "yes" : "no"}`,
          rule.statement,
        ]),
  ]);
}

function presetDetails(
  presetKey: string,
  configuration: Readonly<Record<string, string>>,
  status = "active",
): readonly string[] {
  const template = JOURNAL_RULE_TEMPLATE_CATALOG.find((item) => item.templateId === presetKey);
  if (!template) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  return Object.freeze([
    "Preset rule",
    `Status: ${status}`,
    ...template.parameters.map((parameter) =>
      `${parameter.label}: ${configuration[parameter.key]}${parameter.unit ? ` ${parameter.unit}` : ""}`),
  ]);
}

function normalizedTagName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tagNames" });
  }
  const name = value.trim().replace(/\s+/gu, " ").normalize("NFKC");
  if (name.length < 1 || name.length > 40) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tagNames" });
  }
  return name;
}

function tagKey(value: string): string {
  return value.toLocaleLowerCase("en-US");
}

function sameTagSnapshots(
  left: readonly Readonly<{ tagId: string; name: string; revision: number }>[],
  right: readonly Readonly<{ tagId: string; name: string; revision: number }>[],
): boolean {
  return left.length === right.length && left.every((item, index) =>
    item.tagId === right[index]?.tagId && item.name === right[index]?.name &&
    item.revision === right[index]?.revision);
}

function tagSnapshots(value: unknown, field: string): readonly Readonly<{
  tagId: string;
  name: string;
  revision: number;
}>[] {
  if (!Array.isArray(value)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  return Object.freeze(value.map((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
    }
    const record = item as Record<string, unknown>;
    return Object.freeze({
      tagId: string(record.tagId, `${field}.tagId`),
      name: string(record.name, `${field}.name`),
      revision: positiveInteger(record.revision, `${field}.revision`),
    });
  }).sort((left, right) => left.tagId.localeCompare(right.tagId)));
}

type TagTradeRow = Readonly<{ normalized_symbol: string }>;

type DataDecisionResolutionResult = Readonly<{
  decision: Readonly<{ state: string }>;
  rebuildCount: number;
  openedFollowupDecisionIds: readonly string[];
}>;

type CreatedJournalAccount = Readonly<{
  accountId: string;
  displayName: string;
  baseCurrency: string;
  tradingTimezone: string;
}>;

export class CoachAiChatActionDraftService {
  private readonly drafts: CoachAiChatActionDraftRepository;
  private readonly preferences: PlatformUserPreferenceRepository;
  private readonly notifications: PlatformNotificationRepository;
  private readonly profile: PlatformAccountProfileReadService;
  private readonly reviewSchedules: CoachReviewDeliveryScheduleRepository;
  private readonly annotations: JournalAnnotationService;
  private readonly dataDecisions: Pick<JournalProductReadService, "listDataDecisions">;
  private readonly loadExecution: (
    workspaceId: string,
    accountId: string,
    executionId: string,
  ) => JournalExecutionVersionRecord | null;
  private readonly resolveDataDecision: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    resolution: JournalDecisionResolution,
  ) => DataDecisionResolutionResult;
  private readonly createJournalAccount: (
    scope: WorkspaceAccessScope,
    input: Readonly<{
      workspaceId: string;
      displayName: string;
      baseCurrency: string;
      tradingTimezone: string;
      accountId: string;
      now: Date;
    }>,
  ) => CreatedJournalAccount;
  private readonly swingDetail: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    positionRef: string,
    reviewDate: string,
  ) => JournalSwingPositionDetail;
  private readonly positionDetail: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    positionRef: string,
    reviewDate: string,
  ) => JournalTrackedPositionDetail;
  private readonly saveSwingNote: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    input: JournalSwingDailyNoteChange,
    now: Date,
  ) => JournalSwingDailyNoteRecord;
  private readonly changeTradeStyle: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    input: JournalTradeStyleChange,
    now: Date,
  ) => JournalTradeStyleRecord;
  private readonly resolvePositionRoundTripId: (
    scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
    positionRef: string,
  ) => string;
  private readonly reviewAvailability: (
    scope: WorkspaceAccessScope,
    now: Date,
  ) => CoachAiReviewAvailabilityV2;
  private readonly reviewGenerationGate: (
    scope: WorkspaceAccessScope,
  ) => CoachAiReviewGenerationGateV2;
  private readonly requestAiReview: (
    scope: WorkspaceAccessScope,
    input: CoachAiReviewManualRequestV2,
    now: Date,
  ) => CoachAiReviewManualRequestResultV2;

  constructor(
    private readonly database: Database.Database,
    dependencies: Readonly<{
      dataDecisions?: Pick<JournalProductReadService, "listDataDecisions">;
      loadExecution?: (
        workspaceId: string,
        accountId: string,
        executionId: string,
      ) => JournalExecutionVersionRecord | null;
      resolveDataDecision?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        resolution: JournalDecisionResolution,
      ) => DataDecisionResolutionResult;
      createJournalAccount?: (
        scope: WorkspaceAccessScope,
        input: Readonly<{
          workspaceId: string;
          displayName: string;
          baseCurrency: string;
          tradingTimezone: string;
          accountId: string;
          now: Date;
        }>,
      ) => CreatedJournalAccount;
      swingDetail?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        positionRef: string,
        reviewDate: string,
      ) => JournalSwingPositionDetail;
      positionDetail?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        positionRef: string,
        reviewDate: string,
      ) => JournalTrackedPositionDetail;
      saveSwingNote?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        input: JournalSwingDailyNoteChange,
        now: Date,
      ) => JournalSwingDailyNoteRecord;
      changeTradeStyle?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        input: JournalTradeStyleChange,
        now: Date,
      ) => JournalTradeStyleRecord;
      resolvePositionRoundTripId?: (
        scope: ReturnType<typeof narrowWorkspaceAccessToAccount>,
        positionRef: string,
      ) => string;
      reviewAvailability?: (
        scope: WorkspaceAccessScope,
        now: Date,
      ) => CoachAiReviewAvailabilityV2;
      reviewGenerationGate?: (
        scope: WorkspaceAccessScope,
      ) => CoachAiReviewGenerationGateV2;
      requestAiReview?: (
        scope: WorkspaceAccessScope,
        input: CoachAiReviewManualRequestV2,
        now: Date,
      ) => CoachAiReviewManualRequestResultV2;
    }> = Object.freeze({}),
  ) {
    this.drafts = new CoachAiChatActionDraftRepository(database);
    this.preferences = new PlatformUserPreferenceRepository(database);
    this.notifications = new PlatformNotificationRepository(database);
    this.profile = new PlatformAccountProfileReadService(database);
    this.reviewSchedules = new CoachReviewDeliveryScheduleRepository(database);
    this.annotations = new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    );
    this.dataDecisions = dependencies.dataDecisions ?? new JournalProductReadService(database);
    const executions = new JournalExecutionRepository(database);
    this.loadExecution = dependencies.loadExecution ?? ((workspaceId, accountId, executionId) =>
      executions.currentVersion(executionId, workspaceId, accountId));
    this.resolveDataDecision = dependencies.resolveDataDecision ?? ((account, resolution) =>
      createJournalIntegrityRuntime(this.database).decisions.resolve(account, resolution));
    this.createJournalAccount = dependencies.createJournalAccount ?? ((accountScope, input) =>
      createJournalIntegrityRuntime(this.database).accounts.createAccount(accountScope, input));
    this.swingDetail = dependencies.swingDetail ?? ((account, positionRef, reviewDate) =>
      createJournalIntegrityRuntime(this.database).tradeTrackerReads.swingDetail(
        account,
        positionRef,
        reviewDate,
      ));
    this.positionDetail = dependencies.positionDetail ?? ((account, positionRef, reviewDate) =>
      createJournalIntegrityRuntime(this.database).tradeTrackerReads.positionDetail(
        account,
        positionRef,
        reviewDate,
      ));
    this.saveSwingNote = dependencies.saveSwingNote ?? ((account, input, savedAt) =>
      createJournalIntegrityRuntime(this.database).swingNotes.save(account, input, savedAt));
    this.changeTradeStyle = dependencies.changeTradeStyle ?? ((account, input, savedAt) =>
      createJournalIntegrityRuntime(this.database).tradeStyles.change(account, input, savedAt));
    this.resolvePositionRoundTripId = dependencies.resolvePositionRoundTripId ??
      ((account, positionRef) => createJournalIntegrityRuntime(this.database)
        .tradeStyles.resolvePosition(account, positionRef).roundTripId);
    this.reviewAvailability = dependencies.reviewAvailability ??
      ((requestScope, requestedAt) => new CoachAiReviewAvailabilityService(this.database)
        .read(requestScope, requestedAt));
    this.reviewGenerationGate = dependencies.reviewGenerationGate ??
      ((requestScope) => new CoachAiReviewGenerationCoordinatorV2(this.database)
        .readGate(requestScope));
    this.requestAiReview = dependencies.requestAiReview ??
      ((requestScope, request, requestedAt) => new CoachAiReviewRequestService(this.database)
        .requestManualV2(requestScope, request, requestedAt));
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
    } else if (input.extraction.kind === "create_journal_account") {
      const profile = this.profile.get(scope);
      if ((scope.workspaceRole !== "owner" && scope.workspaceRole !== "admin") ||
          profile.journalAccounts.length >= 25) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      const displayName = accountDisplayName(input.extraction.displayName);
      const baseCurrency = accountCurrency(input.extraction.baseCurrency);
      const tradingTimezone = accountTimezone(input.extraction.tradingTimezone);
      const accountId = createCanonicalUuidV4();
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Create Trade Tracker account",
        displayName,
        baseCurrency,
        tradingTimezone,
        becomesActive: true,
      });
      privatePayload = Object.freeze({
        accountId,
        displayName,
        baseCurrency,
        tradingTimezone,
        expectedAccountRosterSha256: accountRosterSha256(profile.journalAccounts),
        proposedSelectionRef: deriveJournalAccountSelectionRef(scope.workspaceId, accountId),
      });
    } else if (input.extraction.kind === "swing_note") {
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
      const positionRef = input.extraction.positionRef;
      if (!/^[0-9a-f]{64}$/u.test(positionRef)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "positionRef" });
      }
      const reviewDate = canonicalDate(input.extraction.reviewDate, "reviewDate");
      const detail = this.swingDetail(account, positionRef, reviewDate);
      const current = detail.notes.find((note) => note.reviewDate === reviewDate) ?? null;
      const note = swingNoteText(input.extraction.note, "note", true)!;
      const nextSessionPlan = swingNoteText(
        input.extraction.nextSessionPlan,
        "nextSessionPlan",
        false,
      );
      if (current?.note === note && current.nextSessionPlan === nextSessionPlan) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Save swing note",
        ticker: detail.symbol,
        reviewDate,
        currentNote: current?.note ?? null,
        currentNextSessionPlan: current?.nextSessionPlan ?? null,
        proposedNote: note,
        proposedNextSessionPlan: nextSessionPlan,
      });
      privatePayload = Object.freeze({
        positionRef,
        reviewDate,
        expectedRevision: current?.revision ?? null,
        expectedNoteSha256: swingNoteSha256(current),
        note,
        nextSessionPlan,
      });
    } else if (input.extraction.kind === "trade_style") {
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
      const positionRef = input.extraction.positionRef;
      if (!/^[0-9a-f]{64}$/u.test(positionRef)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "positionRef" });
      }
      const classification = TRADE_STYLE_CLASSIFICATIONS[input.extraction.classification];
      const detail = this.positionDetail(account, positionRef, now.toISOString().slice(0, 10));
      if (detail.projectionState !== "legitimate_open") {
        platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
      }
      if (detail.style?.tradeStyle === classification.tradeStyle &&
          detail.style.openStatus === classification.openStatus) {
        platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Change open position type",
        ticker: detail.symbol,
        currentLabel: currentTradeStyleLabel(detail),
        proposedLabel: classification.label,
      });
      privatePayload = Object.freeze({
        positionRef,
        classification: input.extraction.classification,
        expectedRevision: detail.style?.revision ?? null,
        expectedStyleSha256: tradeStyleSha256(detail.style),
        claimedEffectiveAtUtc: createCanonicalUtcTimestamp(now),
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
    } else if (input.extraction.kind === "ai_review_account_setting") {
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
    } else if (input.extraction.kind === "ai_review_request") {
      const reviewKind = input.extraction.reviewKind;
      const periodStartDate = canonicalDate(
        input.extraction.periodStartDate,
        "periodStartDate",
      );
      const periodEndDate = canonicalDate(input.extraction.periodEndDate, "periodEndDate");
      const gate = this.reviewGenerationGate(scope);
      if (gate.state !== "available") {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      const availability = this.reviewAvailability(scope, now);
      const candidate = reviewKind === "monthly"
        ? availability.monthly
        : availability.periodic;
      const candidateMatches = reviewKind === "monthly"
        ? candidate !== null &&
          "calendarMonthStartDate" in candidate.period &&
          candidate.period.calendarMonthStartDate === periodStartDate &&
          candidate.period.calendarMonthEndDate === periodEndDate
        : candidate !== null &&
          "cadence" in candidate.period &&
          candidate.period.cadence === reviewKind &&
          candidate.period.startDate === periodStartDate &&
          candidate.period.endDate === periodEndDate;
      if (!candidateMatches || !candidate ||
          (candidate.state !== "manual_available" && candidate.state !== "automatic_ready")) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Request AI Review",
        reviewLabel: AI_REVIEW_LABELS[reviewKind],
        periodStartDate,
        periodEndDate,
      });
      privatePayload = Object.freeze({ reviewKind, periodStartDate, periodEndDate });
    } else if (input.extraction.kind === "trade_tags") {
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
      const hasRoundTripId = input.extraction.roundTripId !== null;
      const hasPositionRef = input.extraction.positionRef !== null;
      if (hasRoundTripId === hasPositionRef) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tradeTarget" });
      }
      let roundTripId: string;
      let ticker: string;
      if (input.extraction.positionRef !== null) {
        const positionRef = input.extraction.positionRef;
        if (!/^[0-9a-f]{64}$/u.test(positionRef)) {
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
            field: "positionRef",
          });
        }
        const detail = this.positionDetail(account, positionRef, now.toISOString().slice(0, 10));
        roundTripId = this.resolvePositionRoundTripId(account, positionRef);
        ticker = detail.symbol;
      } else {
        const requestedRoundTripId = input.extraction.roundTripId!;
        const trade = this.database.prepare<[string, string, string], TagTradeRow>(`SELECT
 instrument.normalized_symbol
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'`).get(
        account.workspaceId,
        account.accountId,
        requestedRoundTripId,
      );
        if (!trade) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        roundTripId = requestedRoundTripId;
        ticker = trade.normalized_symbol;
      }
      const requestedNames = input.extraction.tagNames.map(normalizedTagName);
      const requestedKeys = requestedNames.map(tagKey);
      if (requestedNames.length > 10 || new Set(requestedKeys).size !== requestedNames.length) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tagNames" });
      }
      const activeTags = this.annotations.listTags(account)
        .filter((tag) => tag.lifecycleState === "active");
      const activeByName = new Map(activeTags.map((tag) => [tagKey(tag.name), tag]));
      const presetByName = new Map(JOURNAL_TAG_PRESET_CATALOG.map((preset) =>
        [tagKey(preset.name), preset]));
      const proposedExisting = [] as Array<Readonly<{
        tagId: string;
        name: string;
        revision: number;
      }>>;
      const proposedPresetKeys: string[] = [];
      const proposedTagNames: string[] = [];
      for (const key of requestedKeys) {
        const active = activeByName.get(key);
        if (active) {
          proposedExisting.push(Object.freeze({
            tagId: active.tagId,
            name: active.name,
            revision: active.revision,
          }));
          proposedTagNames.push(active.name);
          continue;
        }
        const preset = presetByName.get(key);
        if (!preset) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT", { field: "tagNames" });
        }
        proposedPresetKeys.push(preset.presetKey);
        proposedTagNames.push(preset.name);
      }
      const current = (this.annotations.listTagsForRoundTrips(
        account,
        [roundTripId],
      )[roundTripId] ?? []).map((tag) => Object.freeze({
        tagId: tag.tagId,
        name: tag.name,
        revision: tag.revision,
      })).sort((left, right) => left.tagId.localeCompare(right.tagId));
      if (sameStrings(
        current.map((tag) => tagKey(tag.name)).sort(),
        proposedTagNames.map(tagKey).sort(),
      )) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Change trade tags",
        ticker,
        currentTagNames: Object.freeze(current.map((tag) => tag.name)
          .sort((left, right) => left.localeCompare(right))),
        proposedTagNames: Object.freeze([...proposedTagNames]
          .sort((left, right) => left.localeCompare(right))),
      });
      privatePayload = Object.freeze({
        roundTripId,
        currentTags: current,
        proposedExistingTags: Object.freeze(proposedExisting
          .sort((left, right) => left.tagId.localeCompare(right.tagId))),
        proposedPresetKeys: Object.freeze([...proposedPresetKeys].sort()),
      });
    } else if (input.extraction.kind === "rule_change") {
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
      const operation = input.extraction.operation;
      const rules = this.annotations.listRules(account);
      if (operation.kind === "create_preset") {
        const template = JOURNAL_RULE_TEMPLATE_CATALOG.find((item) =>
          item.templateId === operation.presetKey);
        if (!template || rules.some((rule) => rule.templateKey === operation.presetKey &&
            rule.lifecycleState !== "retired")) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const configuration = validateJournalTradingRuleTemplateConfiguration(
          operation.presetKey,
          operation.configuration,
        );
        preview = Object.freeze({
          kind: input.extraction.kind,
          title: "Add trading rule",
          ruleTitle: template.label,
          currentDetails: Object.freeze([]),
          proposedDetails: presetDetails(operation.presetKey, configuration),
        });
        privatePayload = Object.freeze({
          operation: operation.kind,
          presetKey: operation.presetKey,
          configuration,
        });
      } else if (operation.kind === "create_custom") {
        const title = normalizedRuleText(operation.title, "title", 100);
        const statement = normalizedRuleText(operation.statement, "statement", 1_000);
        preview = Object.freeze({
          kind: input.extraction.kind,
          title: "Add trading rule",
          ruleTitle: title,
          currentDetails: Object.freeze([]),
          proposedDetails: Object.freeze([
            "Custom rule",
            "Status: active",
            `Applies to: ${operation.reviewScope === "day_session" ? "trading day"
              : operation.reviewScope === "trade" ? "trade" : "trading day and trade"}`,
            `Category: ${operation.category}`,
            `Focus rule: ${operation.isFocus ? "yes" : "no"}`,
            statement,
          ]),
        });
        privatePayload = Object.freeze({
          operation: operation.kind,
          title,
          statement,
          category: operation.category,
          reviewScope: operation.reviewScope,
          isFocus: operation.isFocus,
        });
      } else {
        if (!/^[0-9a-f]{64}$/u.test(operation.ruleRef)) {
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "ruleRef" });
        }
        const matches = rules.filter((rule) => ruleRef(account, rule.ruleId) === operation.ruleRef);
        if (matches.length !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        const current = matches[0]!;
        let proposedDetails: readonly string[];
        let proposed: Readonly<Record<string, unknown>>;
        if (operation.kind === "revise_preset") {
          if (current.sourceKind !== "template" || current.lifecycleState !== "active" ||
              !current.templateKey) {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
          const configuration = validateJournalTradingRuleTemplateConfiguration(
            current.templateKey,
            operation.configuration,
          );
          if (JSON.stringify(current.configuration) === JSON.stringify(configuration)) {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
          proposedDetails = presetDetails(current.templateKey, configuration);
          proposed = Object.freeze({ configuration });
        } else if (operation.kind === "revise_custom") {
          if (current.sourceKind !== "custom" || current.lifecycleState !== "active") {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
          const title = normalizedRuleText(operation.title, "title", 100);
          const statement = normalizedRuleText(operation.statement, "statement", 1_000);
          proposedDetails = Object.freeze([
            "Custom rule",
            "Status: active",
            `Applies to: ${operation.reviewScope === "day_session" ? "trading day"
              : operation.reviewScope === "trade" ? "trade" : "trading day and trade"}`,
            `Category: ${operation.category}`,
            `Focus rule: ${operation.isFocus ? "yes" : "no"}`,
            statement,
          ]);
          proposed = Object.freeze({
            title,
            statement,
            category: operation.category,
            reviewScope: operation.reviewScope,
            isFocus: operation.isFocus,
          });
          if (current.title === title && current.statement === statement &&
              current.category === operation.category &&
              current.reviewScope === (operation.reviewScope === "day_session"
                ? "day" : operation.reviewScope) && current.isFocus === operation.isFocus) {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
        } else {
          const allowed = (current.lifecycleState === "active" &&
              (operation.newStatus === "paused" || operation.newStatus === "retired")) ||
            (current.lifecycleState === "paused" &&
              (operation.newStatus === "active" || operation.newStatus === "retired"));
          if (!allowed) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          proposedDetails = Object.freeze([
            ...ruleDetails(current).filter((detail) => !detail.startsWith("Status:")),
            `Status: ${operation.newStatus}`,
          ]);
          proposed = Object.freeze({ newStatus: operation.newStatus });
        }
        preview = Object.freeze({
          kind: input.extraction.kind,
          title: "Change trading rule",
          ruleTitle: operation.kind === "revise_custom"
            ? string(proposed.title, "title") : current.title,
          currentDetails: ruleDetails(current),
          proposedDetails,
        });
        privatePayload = Object.freeze({
          operation: operation.kind,
          ruleId: current.ruleId,
          expectedRevision: current.revision,
          expectedStatus: current.lifecycleState,
          ...proposed,
        });
      }
    } else {
      const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
      const dataDecisionExtraction = input.extraction as Extract<
        CoachAiChatActionDraftExtraction,
        Readonly<{ kind: "data_decision" }>
      >;
      if (!/^[0-9a-f]{64}$/u.test(dataDecisionExtraction.decisionRef)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "decisionRef" });
      }
      const decisions = this.dataDecisions.listDataDecisions(account).pending.filter((decision) =>
        dataDecisionRef("data-decision", account, decision.decisionId) ===
          dataDecisionExtraction.decisionRef);
      if (decisions.length !== 1) platformFailure("TRADERLINK_DATA_DECISION_CONFLICT");
      const decision = decisions[0]!;
      const requested = dataDecisionExtraction.resolution;
      const body: Record<string, unknown> = { action: requested.action };
      const details: string[] = [];
      const executionForRef = (opaqueExecutionRef: string) => {
        if (!/^[0-9a-f]{64}$/u.test(opaqueExecutionRef)) {
          platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
            field: "executionRef",
          });
        }
        const matches = decision.executions.filter((execution) =>
          dataDecisionRef("data-decision-execution", account, execution.executionId) ===
            opaqueExecutionRef);
        if (matches.length !== 1) platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
        return matches[0]!;
      };
      if (requested.action === "confirm_legitimate_open_position") {
        if (!decision.openPositionConfirmation) {
          platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
        }
        body.positionFactId = decision.openPositionConfirmation.supportedPositionFactId;
        details.push(
          `Supported open quantity: ${decision.openPositionConfirmation.supportedQuantityDecimal}`,
        );
      } else if (requested.action === "exclude_execution" ||
          requested.action === "restore_execution" || requested.action === "keep_distinct") {
        const execution = executionForRef(requested.executionRef);
        body.executionId = execution.executionId;
        if (requested.action === "exclude_execution") {
          body.exclusionReason = requested.exclusionReason;
        }
        details.push(
          `${execution.executedAtUtc} · ${execution.side} ${execution.quantityDecimal}` +
            ` ${execution.symbol} at ${execution.priceDecimal ?? "price unavailable"}`,
        );
      } else if (requested.action === "merge_supported_duplicate") {
        const duplicate = executionForRef(requested.duplicateExecutionRef);
        const retained = executionForRef(requested.retainedExecutionRef);
        if (duplicate.executionId === retained.executionId) {
          platformFailure("TRADERLINK_DATA_DECISION_INVALID_ACTION");
        }
        body.duplicateExecutionId = duplicate.executionId;
        body.retainedExecutionId = retained.executionId;
        details.push(
          `Remove duplicate: ${duplicate.executedAtUtc} · ${duplicate.side}` +
            ` ${duplicate.quantityDecimal} ${duplicate.symbol}`,
          `Keep: ${retained.executedAtUtc} · ${retained.side}` +
            ` ${retained.quantityDecimal} ${retained.symbol}`,
        );
      }
      createJournalDataDecisionResolution(
        decision,
        body,
        (executionId) => this.loadExecution(account.workspaceId, account.accountId, executionId),
      );
      preview = Object.freeze({
        kind: input.extraction.kind,
        title: "Resolve data decision",
        ticker: decision.symbol,
        question: decision.question,
        actionLabel: DATA_DECISION_ACTION_LABELS[requested.action],
        details: Object.freeze(details),
      });
      privatePayload = Object.freeze({
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        resolutionBody: Object.freeze(body),
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
        const accountSelectionRef = draft.preview.kind === "select_journal_account" ||
            draft.preview.kind === "create_journal_account"
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
      } else if (draft.preview.kind === "create_journal_account") {
        const accountPreview = draft.preview;
        const profile = this.profile.get(scope);
        const expectedRoster = string(
          payload.expectedAccountRosterSha256,
          "expectedAccountRosterSha256",
        );
        if ((scope.workspaceRole !== "owner" && scope.workspaceRole !== "admin") ||
            profile.journalAccounts.length >= 25 ||
            accountRosterSha256(profile.journalAccounts) !== expectedRoster) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const accountId = string(payload.accountId, "accountId");
        accountSelectionRef = string(payload.proposedSelectionRef, "proposedSelectionRef");
        if (deriveJournalAccountSelectionRef(scope.workspaceId, accountId) !== accountSelectionRef) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "proposedSelectionRef" });
        }
        command = "journal_account_create";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const created = this.createJournalAccount(scope, {
          workspaceId: scope.workspaceId,
          accountId,
          displayName: accountDisplayName(payload.displayName),
          baseCurrency: accountCurrency(payload.baseCurrency),
          tradingTimezone: accountTimezone(payload.tradingTimezone),
          now,
        });
        if (created.accountId !== accountId || created.displayName !== accountPreview.displayName ||
            created.baseCurrency !== accountPreview.baseCurrency ||
            created.tradingTimezone !== accountPreview.tradingTimezone) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "journalAccountCreate" });
        }
        reference = `journal_account:${createHash("sha256").update([
          scope.workspaceId,
          accountId,
        ].join("\u001f"), "utf8").digest("hex")}`;
      } else if (draft.preview.kind === "swing_note") {
        const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
        const positionRef = string(payload.positionRef, "positionRef");
        const reviewDate = canonicalDate(payload.reviewDate, "reviewDate");
        const current = this.swingDetail(account, positionRef, reviewDate).notes
          .find((note) => note.reviewDate === reviewDate) ?? null;
        if (swingNoteSha256(current) !== string(payload.expectedNoteSha256, "expectedNoteSha256") ||
            (current?.revision ?? null) !== (payload.expectedRevision ?? null)) {
          platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
        }
        command = "journal_swing_note_save";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const saved = this.saveSwingNote(account, {
          positionRef,
          reviewDate,
          note: swingNoteText(payload.note, "note", true)!,
          nextSessionPlan: swingNoteText(payload.nextSessionPlan, "nextSessionPlan", false),
          expectedRevision: current?.revision ?? null,
          idempotencyKey: `ai-chat-swing-note:${input.draftId}`,
        }, now);
        reference = `swing_note:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          positionRef,
          reviewDate,
          String(saved.revision),
        ].join("\u001f"), "utf8").digest("hex")}`;
      } else if (draft.preview.kind === "trade_style") {
        const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
        const positionRef = string(payload.positionRef, "positionRef");
        const currentDetail = this.positionDetail(
          account,
          positionRef,
          now.toISOString().slice(0, 10),
        );
        if (currentDetail.projectionState !== "legitimate_open" ||
            tradeStyleSha256(currentDetail.style) !==
              string(payload.expectedStyleSha256, "expectedStyleSha256") ||
            (currentDetail.style?.revision ?? null) !== (payload.expectedRevision ?? null)) {
          platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
        }
        const classificationKey = string(payload.classification, "classification") as
          keyof typeof TRADE_STYLE_CLASSIFICATIONS;
        const classification = TRADE_STYLE_CLASSIFICATIONS[classificationKey];
        if (!classification) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "classification" });
        }
        command = "journal_trade_style_change";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const saved = this.changeTradeStyle(account, {
          positionRef,
          expectedRevision: currentDetail.style?.revision ?? null,
          tradeStyle: classification.tradeStyle,
          openStatus: classification.openStatus,
          plannedFromEntry: false,
          claimedEffectiveAtUtc: string(payload.claimedEffectiveAtUtc, "claimedEffectiveAtUtc"),
          reason: classification.reason,
          sourceUi: "ai_chat",
          idempotencyKey: `ai-chat-trade-style:${input.draftId}`,
        }, now);
        reference = `trade_style:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          positionRef,
          String(saved.revision),
          saved.tradeStyle,
          saved.openStatus,
        ].join("\u001f"), "utf8").digest("hex")}`;
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
      } else if (draft.preview.kind === "ai_review_account_setting") {
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
      } else if (draft.preview.kind === "ai_review_request") {
        const gate = this.reviewGenerationGate(scope);
        if (gate.state !== "available") {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const reviewKind = string(payload.reviewKind, "reviewKind");
        if (reviewKind !== "weekly" && reviewKind !== "two_week" &&
            reviewKind !== "monthly") {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "reviewKind" });
        }
        const reviewRequest = Object.freeze({
          reviewKind,
          periodStartDate: canonicalDate(payload.periodStartDate, "periodStartDate"),
          periodEndDate: canonicalDate(payload.periodEndDate, "periodEndDate"),
        });
        command = "coach_ai_review_request_create";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const requested = this.requestAiReview(scope, reviewRequest, now);
        if (requested.state === "not_available") {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        reference = `ai_review_request:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          requested.requestId,
        ].join("\u001f"), "utf8").digest("hex")}`;
      } else if (draft.preview.kind === "trade_tags") {
        const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
        const roundTripId = string(payload.roundTripId, "roundTripId");
        const current = (this.annotations.listTagsForRoundTrips(
          account,
          [roundTripId],
        )[roundTripId] ?? []).map((tag) => Object.freeze({
          tagId: tag.tagId,
          name: tag.name,
          revision: tag.revision,
        })).sort((left, right) => left.tagId.localeCompare(right.tagId));
        const expectedCurrent = tagSnapshots(payload.currentTags, "currentTags");
        if (!sameTagSnapshots(current, expectedCurrent)) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const proposedExisting = tagSnapshots(
          payload.proposedExistingTags,
          "proposedExistingTags",
        );
        const active = new Map(this.annotations.listTags(account)
          .filter((tag) => tag.lifecycleState === "active")
          .map((tag) => [tag.tagId, tag]));
        if (proposedExisting.some((expected) => {
          const found = active.get(expected.tagId);
          return !found || found.name !== expected.name || found.revision !== expected.revision;
        })) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
        }
        const presetKeys = stringArray(payload.proposedPresetKeys, "proposedPresetKeys");
        if (presetKeys.some((key) => !JOURNAL_TAG_PRESET_CATALOG.some((preset) =>
          preset.presetKey === key))) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "proposedPresetKeys" });
        }
        command = "journal_trade_tags_replace";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const saved = this.annotations.replaceRoundTripTagsWithPresets(account, {
          roundTripId,
          tagIds: proposedExisting.map((tag) => tag.tagId),
          presetKeys,
          now,
        });
        reference = `trade_tags:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          roundTripId,
          ...saved.map((tag) => tag.tagId).sort(),
        ].join("\u001f"), "utf8").digest("hex")}`;
      } else if (draft.preview.kind === "rule_change") {
        const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
        const operation = string(payload.operation, "operation");
        const rules = this.annotations.listRules(account);
        let mutation: Readonly<Record<string, unknown> & { action: string }>;
        if (operation === "create_preset") {
          const presetKey = string(payload.presetKey, "presetKey");
          if (rules.some((rule) => rule.templateKey === presetKey &&
              rule.lifecycleState !== "retired")) {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
          mutation = Object.freeze({
            action: "create",
            templateId: presetKey,
            configuration: ruleConfiguration(payload.configuration),
          });
        } else if (operation === "create_custom") {
          mutation = Object.freeze({
            action: "create_manual",
            title: string(payload.title, "title"),
            statement: string(payload.statement, "statement"),
            category: string(payload.category, "category"),
            reviewScope: string(payload.reviewScope, "reviewScope"),
            isFocus: boolean(payload.isFocus, "isFocus"),
          });
        } else {
          const ruleId = string(payload.ruleId, "ruleId");
          const current = rules.find((rule) => rule.ruleId === ruleId);
          const expectedRevision = positiveInteger(payload.expectedRevision, "expectedRevision");
          const expectedStatus = string(payload.expectedStatus, "expectedStatus");
          if (!current || current.revision !== expectedRevision ||
              current.lifecycleState !== expectedStatus) {
            platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
          }
          if (operation === "revise_preset") {
            mutation = Object.freeze({
              action: "revise",
              ruleInstanceId: ruleId,
              expectedRevision,
              configuration: ruleConfiguration(payload.configuration),
            });
          } else if (operation === "revise_custom") {
            mutation = Object.freeze({
              action: "revise_manual",
              ruleId,
              expectedRevision,
              title: string(payload.title, "title"),
              statement: string(payload.statement, "statement"),
              category: string(payload.category, "category"),
              reviewScope: string(payload.reviewScope, "reviewScope"),
              isFocus: boolean(payload.isFocus, "isFocus"),
            });
          } else if (operation === "transition") {
            mutation = Object.freeze({
              action: current.sourceKind === "custom" ? "transition_manual" : "transition",
              ...(current.sourceKind === "custom"
                ? { ruleId }
                : { ruleInstanceId: ruleId }),
              expectedRevision,
              expectedCurrentStatus: current.lifecycleState,
              newStatus: string(payload.newStatus, "newStatus"),
            });
          } else {
            platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "operation" });
          }
        }
        command = "journal_trading_rules_mutate";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        mutateJournalTradingRules(this.annotations, account, mutation);
        reference = `trading_rule:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          input.draftId,
          operation,
        ].join("\u001f"), "utf8").digest("hex")}`;
      } else {
        const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId!);
        const decisionId = string(payload.decisionId, "decisionId");
        const expectedRevision = positiveInteger(payload.expectedRevision, "expectedRevision");
        const current = this.dataDecisions.listDataDecisions(account).pending.find((decision) =>
          decision.decisionId === decisionId && decision.revision === expectedRevision);
        if (!current) platformFailure("TRADERLINK_DATA_DECISION_CONFLICT");
        const body = record(payload.resolutionBody, "resolutionBody");
        const resolution = createJournalDataDecisionResolution(
          current,
          { ...body },
          (executionId) => this.loadExecution(account.workspaceId, account.accountId, executionId),
        );
        command = "journal_data_decision_resolve";
        draft = this.drafts.beginConfirm(scope, input.draftId, command, now);
        const resolved = this.resolveDataDecision(account, resolution);
        reference = `data_decision:${createHash("sha256").update([
          scope.workspaceId,
          scope.activeAccountId,
          decisionId,
          resolved.decision.state,
          String(resolved.rebuildCount),
          String(resolved.openedFollowupDecisionIds.length),
        ].join("\u001f"), "utf8").digest("hex")}`;
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
