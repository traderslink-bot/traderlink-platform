import { createHash } from "node:crypto";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { coachAiReviewLongContextMultipliers } from
  "./coach-ai-review-model-limits";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachPeriodicAiReviewInputV2,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
  COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2,
  type CoachMonthlyAiReviewInputV2,
  type CoachMonthlyAiReviewInput,
} from "../contracts/monthly-ai-review-input-contracts";
import {
  COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION,
  COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachPeriodicAiReviewOutputV2,
  type CoachWeeklyAiReviewOutput,
} from "../contracts/weekly-ai-review-output-contracts";
import {
  COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
  COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2,
  type CoachMonthlyAiReviewOutputV2,
  type CoachMonthlyAiReviewOutput,
} from "../contracts/monthly-ai-review-output-contracts";
import type { CoachAiProviderSettings } from "./coach-ai-provider-settings-repository";

const ExactDecimal = Decimal.clone({ precision: 80, toExpNeg: -1000, toExpPos: 1000 });
const ATTEMPT_TIMEOUT_MS = 15 * 60 * 1000;

type WeeklyRequestRow = Readonly<{
  coach_weekly_review_request_id: string;
  input_sha256: string;
  input_json: string;
  state: "pending" | "issued" | "failed";
  issued_review_id: string | null;
}>;

type MonthlyRequestRow = Readonly<{
  coach_monthly_review_request_id: string;
  input_sha256: string;
  input_json: string;
  state: "pending" | "issued" | "failed";
  issued_review_id: string | null;
}>;

export type CoachWeeklyReviewRequestRecord = Readonly<{
  requestId: string;
  inputSha256: string;
  inputJson: string;
  state: "pending" | "issued" | "failed";
  issuedReviewId: string | null;
}>;

export type CoachMonthlyReviewRequestRecord = Readonly<{
  requestId: string;
  inputSha256: string;
  inputJson: string;
  state: "pending" | "issued" | "failed";
  issuedReviewId: string | null;
}>;

export type CoachWeeklyIssuedReviewRecord = Readonly<{
  issuedReviewId: string;
  requestId: string;
  weekStartDate: string;
  weekEndDate: string;
  output: CoachWeeklyAiReviewOutput;
  modelId: string;
  issuedAtUtc: string;
}>;

export type CoachMonthlyIssuedReviewRecord = Readonly<{
  issuedReviewId: string;
  requestId: string;
  monthStartDate: string;
  monthEndDate: string;
  periodCoverage: "complete_month" | "partial_month";
  output: CoachMonthlyAiReviewOutput;
  modelId: string;
  issuedAtUtc: string;
}>;

export type CoachAiGenerationUsage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

export type CoachWeeklyAttemptStart =
  | Readonly<{ state: "started"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "in_progress"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "already_issued"; review: CoachWeeklyIssuedReviewRecord }>;

export type CoachMonthlyAttemptStart =
  | Readonly<{ state: "started"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "in_progress"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "already_issued"; review: CoachMonthlyIssuedReviewRecord }>;

export type CoachAiReviewKindV2 = "weekly" | "two_week" | "monthly";
export type CoachAiReviewInputV2 = CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2;
export type CoachAiReviewOutputV2 = CoachPeriodicAiReviewOutputV2 | CoachMonthlyAiReviewOutputV2;

export type CoachAiReviewEvidenceManifestV2 = Readonly<{
  contractVersion: "traderlink_coach_ai_review_evidence_manifest_v2";
  evidence: readonly Readonly<{
    evidenceRef: string;
    tradingDayReviewId: string;
    reviewedStatusRevision: number;
    reviewStatus?: "reviewed" | "incomplete";
    dailyNoteRevisionId: string | null;
    tradeNoteRevisionIds: readonly string[];
    reviewMarketDate: string;
    sourcePeriodStartDate: string;
    sourcePeriodEndDate: string;
    narrativeOwnerMonth: string;
    carryDestinationPeriodStartDate: string | null;
    carryDestinationPeriodEndDate: string | null;
    representedByRequestId: string | null;
  }>[];
}>;

export type CoachAiReviewPeriodRequestRecordV2 = Readonly<{
  requestId: string;
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
  coverageStartDate: string;
  coverageEndDate: string;
  narrativeOwnerMonth: string;
  calendarId: string;
  calendarEvidenceDigestSha256: string;
  eligibleAtUtc: string;
  requestOrigin: "automatic" | "manual";
  inputSha256: string;
  inputJson: string;
  evidenceManifestSha256: string;
  evidenceManifestJson: string;
  priorIssuedReviewId: string | null;
  state: "pending" | "issued" | "failed" | "stopped";
  terminalFailureCode: string | null;
  issuedReviewId: string | null;
  createdAtUtc: string;
  finalizedAtUtc: string | null;
}>;

export type CoachAiIssuedReviewRecordV2 = Readonly<{
  issuedReviewId: string;
  requestId: string;
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
  output: CoachAiReviewOutputV2;
  representedEvidenceRefs: readonly string[];
  modelId: string;
  issuedAtUtc: string;
}>;

export type CoachAiReviewAttemptStartV2 =
  | Readonly<{ state: "started"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "in_progress"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "already_issued"; review: CoachAiIssuedReviewRecordV2 }>;

export type CoachAiReviewRequestOperationalStateV2 =
  "pending" | "generating" | "retrying" | "issued" | "stopped";

type PeriodRequestRowV2 = Readonly<{
  coach_ai_review_period_request_id: string;
  review_kind: CoachAiReviewKindV2;
  period_start_date: string;
  period_end_date: string;
  coverage_start_date: string;
  coverage_end_date: string;
  narrative_owner_month: string;
  calendar_id: string;
  calendar_evidence_digest_sha256: string;
  eligible_at_utc: string;
  request_origin: "automatic" | "manual";
  input_sha256: string;
  input_json: string;
  evidence_manifest_sha256: string;
  evidence_manifest_json: string;
  prior_issued_review_id: string | null;
  state: "pending" | "issued" | "failed" | "stopped";
  terminal_failure_code: string | null;
  issued_review_id: string | null;
  created_at_utc: string;
  finalized_at_utc: string | null;
}>;

const PERIOD_REQUEST_SELECT_V2 = `SELECT
  coach_ai_review_period_request_id, review_kind, period_start_date,
  period_end_date, coverage_start_date, coverage_end_date,
  narrative_owner_month, calendar_id, calendar_evidence_digest_sha256,
  eligible_at_utc, request_origin, input_sha256, input_json,
  evidence_manifest_sha256, evidence_manifest_json, prior_issued_review_id,
  state, terminal_failure_code, issued_review_id, created_at_utc, finalized_at_utc
FROM coach_ai_review_period_requests_v2`;

function accountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function snapshot(input: CoachWeeklyAiReviewInput): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(canonicalize(input));
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function monthlySnapshot(input: CoachMonthlyAiReviewInput): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(canonicalize(input));
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function immutableSnapshot(value: unknown): Readonly<{ json: string; sha256: string }> {
  const json = JSON.stringify(canonicalize(value));
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function validateV2Input(
  reviewKind: CoachAiReviewKindV2,
  input: CoachAiReviewInputV2,
): void {
  const valid = reviewKind === "monthly"
    ? input.contractVersion === COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2
    : input.contractVersion === COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION;
  if (!valid || (reviewKind !== "monthly" &&
      (input as CoachPeriodicAiReviewInputV2).period.cadence !== reviewKind)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "inputContractVersion",
    });
  }
}

function validateEvidenceManifestV2(
  manifest: CoachAiReviewEvidenceManifestV2,
  inputJson: string,
): void {
  if (manifest.contractVersion !== "traderlink_coach_ai_review_evidence_manifest_v2") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "evidenceManifestVersion",
    });
  }
  const evidenceRefs = new Set<string>();
  for (const [index, evidence] of manifest.evidence.entries()) {
    if (!/^(?:reflection_[0-9]{3}|daily_reflection_sha256:[0-9a-f]{64})$/u
      .test(evidence.evidenceRef) || evidenceRefs.has(evidence.evidenceRef) ||
      !Number.isSafeInteger(evidence.reviewedStatusRevision) ||
      evidence.reviewedStatusRevision < 1 ||
      (evidence.reviewStatus !== undefined &&
        evidence.reviewStatus !== "reviewed" && evidence.reviewStatus !== "incomplete")) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: `evidence[${index}]`,
      });
    }
    evidenceRefs.add(evidence.evidenceRef);
    assertCanonicalUuidV4(evidence.tradingDayReviewId, `evidence[${index}].tradingDayReviewId`);
    if (evidence.dailyNoteRevisionId) {
      assertCanonicalUuidV4(evidence.dailyNoteRevisionId, `evidence[${index}].dailyNoteRevisionId`);
    }
    for (const revisionId of evidence.tradeNoteRevisionIds) {
      assertCanonicalUuidV4(revisionId, `evidence[${index}].tradeNoteRevisionIds`);
    }
    if (evidence.representedByRequestId) {
      assertCanonicalUuidV4(
        evidence.representedByRequestId,
        `evidence[${index}].representedByRequestId`,
      );
    }
    const privateIds = [
      evidence.tradingDayReviewId,
      evidence.dailyNoteRevisionId,
      ...evidence.tradeNoteRevisionIds,
      evidence.representedByRequestId,
    ].filter((value): value is string => value !== null);
    if (privateIds.some((privateId) => inputJson.includes(privateId))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "providerInputPrivateIdentifier",
      });
    }
  }
}

function periodRequestRecordV2(row: PeriodRequestRowV2): CoachAiReviewPeriodRequestRecordV2 {
  return Object.freeze({
    requestId: row.coach_ai_review_period_request_id,
    reviewKind: row.review_kind,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    coverageStartDate: row.coverage_start_date,
    coverageEndDate: row.coverage_end_date,
    narrativeOwnerMonth: row.narrative_owner_month,
    calendarId: row.calendar_id,
    calendarEvidenceDigestSha256: row.calendar_evidence_digest_sha256,
    eligibleAtUtc: row.eligible_at_utc,
    requestOrigin: row.request_origin,
    inputSha256: row.input_sha256,
    inputJson: row.input_json,
    evidenceManifestSha256: row.evidence_manifest_sha256,
    evidenceManifestJson: row.evidence_manifest_json,
    priorIssuedReviewId: row.prior_issued_review_id,
    state: row.state,
    terminalFailureCode: row.terminal_failure_code,
    issuedReviewId: row.issued_review_id,
    createdAtUtc: row.created_at_utc,
    finalizedAtUtc: row.finalized_at_utc,
  });
}

export function coachAiReviewRepresentedEvidenceRefs(
  inputJson: string,
): readonly string[] {
  const input = JSON.parse(inputJson) as CoachAiReviewInputV2;
  const refs = input.contractVersion === COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION
    ? [
        ...input.completedDailyReflections.map((reflection) => reflection.evidenceRef),
        ...(input.savedDailyReflections ?? []).map((reflection) => reflection.evidenceRef),
        ...input.carryForwardEvidenceBundles.map((bundle) => bundle.evidenceRef),
      ]
    : [
        ...input.reviewNarrativeContext.flatMap((review) => review.representedEvidenceRefs),
        ...input.rawReflectionContext.map((context) => context.reflection.evidenceRef),
      ];
  return Object.freeze([...new Set(refs)].sort((left, right) => left.localeCompare(right)));
}

function parseOutputV2(reviewKind: CoachAiReviewKindV2, value: string): CoachAiReviewOutputV2 {
  const output = JSON.parse(value) as CoachAiReviewOutputV2;
  const valid = reviewKind === "monthly"
    ? output.contractVersion === COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2
    : output.contractVersion === COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION;
  if (!valid || !Array.isArray(output.nextPeriodFocuses) || output.nextPeriodFocuses.length > 3) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      field: "v2OutputContractVersion",
    });
  }
  return Object.freeze({
    ...output,
    nextPeriodFocuses: Object.freeze([...output.nextPeriodFocuses]),
  });
}

function requestRecord(row: WeeklyRequestRow): CoachWeeklyReviewRequestRecord {
  return Object.freeze({
    requestId: row.coach_weekly_review_request_id,
    inputSha256: row.input_sha256,
    inputJson: row.input_json,
    state: row.state,
    issuedReviewId: row.issued_review_id,
  });
}

function monthlyRequestRecord(row: MonthlyRequestRow): CoachMonthlyReviewRequestRecord {
  return Object.freeze({
    requestId: row.coach_monthly_review_request_id,
    inputSha256: row.input_sha256,
    inputJson: row.input_json,
    state: row.state,
    issuedReviewId: row.issued_review_id,
  });
}

function nonnegativeToken(value: number | null, field: string): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function normalizedUsage(usage: CoachAiGenerationUsage): CoachAiGenerationUsage {
  const inputTokens = nonnegativeToken(usage.inputTokens, "inputTokens");
  const cachedInputTokens = nonnegativeToken(
    usage.cachedInputTokens ?? null,
    "cachedInputTokens",
  );
  const cacheWriteInputTokens = nonnegativeToken(
    usage.cacheWriteInputTokens ?? null,
    "cacheWriteInputTokens",
  );
  const outputTokens = nonnegativeToken(usage.outputTokens, "outputTokens");
  const totalTokens = nonnegativeToken(usage.totalTokens, "totalTokens");
  if ((inputTokens === null) !== (outputTokens === null) ||
      (inputTokens === null) !== (totalTokens === null) ||
      (inputTokens === null) !== (cachedInputTokens === null) ||
      (inputTokens === null) !== (cacheWriteInputTokens === null) ||
      (inputTokens !== null && cachedInputTokens !== null &&
        cacheWriteInputTokens !== null &&
        cachedInputTokens + cacheWriteInputTokens > inputTokens) ||
      (inputTokens !== null && outputTokens !== null && totalTokens !== inputTokens + outputTokens)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tokenUsage" });
  }
  return Object.freeze({
    inputTokens,
    cachedInputTokens,
    cacheWriteInputTokens,
    outputTokens,
    totalTokens,
  });
}

export function calculateCoachAiReviewEstimatedCost(
  usage: CoachAiGenerationUsage,
  settings: CoachAiProviderSettings,
): string | null {
  if (usage.inputTokens === null || usage.cachedInputTokens === null ||
      usage.cachedInputTokens === undefined ||
      usage.cacheWriteInputTokens === null ||
      usage.cacheWriteInputTokens === undefined || usage.outputTokens === null ||
      settings.inputCostUsdPerMillionTokens === null ||
      settings.cachedInputCostUsdPerMillionTokens === null ||
      settings.cacheWriteInputCostUsdPerMillionTokens === null ||
      settings.outputCostUsdPerMillionTokens === null) return null;
  const multipliers = coachAiReviewLongContextMultipliers(
    settings.modelId,
    usage.inputTokens,
  );
  return new ExactDecimal(
    usage.inputTokens - usage.cachedInputTokens - usage.cacheWriteInputTokens,
  )
    .times(settings.inputCostUsdPerMillionTokens)
    .times(multipliers.input)
    .plus(new ExactDecimal(usage.cachedInputTokens)
      .times(settings.cachedInputCostUsdPerMillionTokens)
      .times(multipliers.input))
    .plus(new ExactDecimal(usage.cacheWriteInputTokens)
      .times(settings.cacheWriteInputCostUsdPerMillionTokens)
      .times(multipliers.input))
    .plus(new ExactDecimal(usage.outputTokens)
      .times(settings.outputCostUsdPerMillionTokens)
      .times(multipliers.output))
    .dividedBy(1_000_000)
    .toFixed(12)
    .replace(/\.?0+$/u, "") || "0";
}

function parseWeeklyOutput(value: string): CoachWeeklyAiReviewOutput {
  const parsed = JSON.parse(value) as CoachWeeklyAiReviewOutput;
  if (parsed.contractVersion !== COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_weekly_issued_reviews" });
  }
  return Object.freeze({ ...parsed, nextWeekFocuses: Object.freeze([...parsed.nextWeekFocuses]) });
}

function parseMonthlyOutput(value: string): CoachMonthlyAiReviewOutput {
  const parsed = JSON.parse(value) as CoachMonthlyAiReviewOutput;
  if (
    parsed.contractVersion !== COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION ||
    !Array.isArray(parsed.nextMonthFocuses) ||
    parsed.nextMonthFocuses.length > 3
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_monthly_issued_reviews" });
  }
  return Object.freeze({ ...parsed, nextMonthFocuses: Object.freeze([...parsed.nextMonthFocuses]) });
}

export class CoachAiReviewRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  private readWeeklyRequest(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachWeeklyReviewRequestRecord {
    const row = this.database.prepare<[string, string, string, string], WeeklyRequestRow>(`SELECT
  coach_weekly_review_request_id, input_sha256, input_json, state, issued_review_id
FROM coach_weekly_review_requests
WHERE coach_weekly_review_request_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      requestId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return requestRecord(row);
  }

  createOrReadWeeklyRequest(
    scope: WorkspaceAccessScope,
    input: CoachWeeklyAiReviewInput,
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): CoachWeeklyReviewRequestRecord {
    const activeAccountId = accountId(scope);
    if (input.contractVersion !== COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "inputContractVersion" });
    }
    const immutableInput = snapshot(input);
    return this.transaction(() => {
      if (priorIssuedReviewId) {
        const prior = this.database.prepare<[string, string, string, string]>(`SELECT 1
FROM coach_weekly_issued_reviews issued
JOIN coach_weekly_review_requests request
  ON request.coach_weekly_review_request_id = issued.coach_weekly_review_request_id
WHERE issued.coach_weekly_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
          priorIssuedReviewId,
          scope.userId,
          scope.workspaceId,
          activeAccountId,
        );
        if (!prior) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      const existing = this.database.prepare<[string, string, string, string, string], WeeklyRequestRow>(`SELECT
  coach_weekly_review_request_id, input_sha256, input_json, state, issued_review_id
FROM coach_weekly_review_requests
WHERE workspace_id = ? AND account_id = ? AND week_start_date = ?
  AND week_end_date = ? AND input_sha256 = ?`).get(
        scope.workspaceId,
        activeAccountId,
        input.week.startDate,
        input.week.endDate,
        immutableInput.sha256,
      );
      if (existing) return requestRecord(existing);
      const requestId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_weekly_review_requests (
  coach_weekly_review_request_id, user_id, workspace_id, account_id,
  week_start_date, week_end_date, input_contract_version, input_sha256,
  input_json, prior_issued_review_id, state, failure_code, issued_review_id,
  created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, NULL)`).run(
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        input.week.startDate,
        input.week.endDate,
        COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
        immutableInput.sha256,
        immutableInput.json,
        priorIssuedReviewId,
        createCanonicalUtcTimestamp(now),
      );
      return this.readWeeklyRequest(scope, requestId);
    });
  }

  private readMonthlyRequest(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachMonthlyReviewRequestRecord {
    const row = this.database.prepare<[string, string, string, string], MonthlyRequestRow>(`SELECT
  coach_monthly_review_request_id, input_sha256, input_json, state, issued_review_id
FROM coach_monthly_review_requests
WHERE coach_monthly_review_request_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      requestId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return monthlyRequestRecord(row);
  }

  createOrReadMonthlyRequest(
    scope: WorkspaceAccessScope,
    input: CoachMonthlyAiReviewInput,
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): CoachMonthlyReviewRequestRecord {
    const activeAccountId = accountId(scope);
    if (input.contractVersion !== COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "inputContractVersion" });
    }
    const immutableInput = monthlySnapshot(input);
    return this.transaction(() => {
      if (priorIssuedReviewId) {
        const prior = this.database.prepare<[string, string, string, string]>(`SELECT 1
FROM coach_monthly_issued_reviews issued
JOIN coach_monthly_review_requests request
  ON request.coach_monthly_review_request_id = issued.coach_monthly_review_request_id
WHERE issued.coach_monthly_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
          priorIssuedReviewId,
          scope.userId,
          scope.workspaceId,
          activeAccountId,
        );
        if (!prior) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      const existing = this.database.prepare<[string, string, string, string, string], MonthlyRequestRow>(`SELECT
  coach_monthly_review_request_id, input_sha256, input_json, state, issued_review_id
FROM coach_monthly_review_requests
WHERE workspace_id = ? AND account_id = ? AND period_start_date = ?
  AND period_end_date = ? AND input_sha256 = ?`).get(
        scope.workspaceId,
        activeAccountId,
        input.month.startDate,
        input.month.endDate,
        immutableInput.sha256,
      );
      if (existing) return monthlyRequestRecord(existing);
      const requestId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_monthly_review_requests (
  coach_monthly_review_request_id, user_id, workspace_id, account_id,
  period_start_date, period_end_date, period_coverage, input_contract_version,
  input_sha256, input_json, prior_issued_review_id, state, failure_code,
  issued_review_id, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, NULL)`).run(
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        input.month.startDate,
        input.month.endDate,
        input.month.periodCoverage,
        COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
        immutableInput.sha256,
        immutableInput.json,
        priorIssuedReviewId,
        createCanonicalUtcTimestamp(now),
      );
      return this.readMonthlyRequest(scope, requestId);
    });
  }

  readIssuedWeeklyReview(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachWeeklyIssuedReviewRecord {
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_weekly_issued_review_id: string;
      coach_weekly_review_request_id: string;
      week_start_date: string;
      week_end_date: string;
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT issued.coach_weekly_issued_review_id,
  issued.coach_weekly_review_request_id, request.week_start_date,
  request.week_end_date, issued.output_json,
  issued.model_id, issued.issued_at_utc
FROM coach_weekly_issued_reviews issued
JOIN coach_weekly_review_requests request
  ON request.coach_weekly_review_request_id = issued.coach_weekly_review_request_id
WHERE issued.coach_weekly_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return Object.freeze({
      issuedReviewId: row.coach_weekly_issued_review_id,
      requestId: row.coach_weekly_review_request_id,
      weekStartDate: row.week_start_date,
      weekEndDate: row.week_end_date,
      output: parseWeeklyOutput(row.output_json),
      modelId: row.model_id,
      issuedAtUtc: row.issued_at_utc,
    });
  }

  readIssuedMonthlyReview(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachMonthlyIssuedReviewRecord {
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_monthly_issued_review_id: string;
      coach_monthly_review_request_id: string;
      period_start_date: string;
      period_end_date: string;
      period_coverage: "complete_month" | "partial_month";
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT issued.coach_monthly_issued_review_id,
  issued.coach_monthly_review_request_id, request.period_start_date,
  request.period_end_date, request.period_coverage, issued.output_json,
  issued.model_id, issued.issued_at_utc
FROM coach_monthly_issued_reviews issued
JOIN coach_monthly_review_requests request
  ON request.coach_monthly_review_request_id = issued.coach_monthly_review_request_id
WHERE issued.coach_monthly_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return Object.freeze({
      issuedReviewId: row.coach_monthly_issued_review_id,
      requestId: row.coach_monthly_review_request_id,
      monthStartDate: row.period_start_date,
      monthEndDate: row.period_end_date,
      periodCoverage: row.period_coverage,
      output: parseMonthlyOutput(row.output_json),
      modelId: row.model_id,
      issuedAtUtc: row.issued_at_utc,
    });
  }

  listIssuedWeeklyReviews(
    scope: WorkspaceAccessScope,
    limit = 100,
  ): readonly CoachWeeklyIssuedReviewRecord[] {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const rows = this.database.prepare<[string, string, string, number], Readonly<{
      coach_weekly_issued_review_id: string;
      coach_weekly_review_request_id: string;
      week_start_date: string;
      week_end_date: string;
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT issued.coach_weekly_issued_review_id,
  issued.coach_weekly_review_request_id, request.week_start_date,
  request.week_end_date, issued.output_json, issued.model_id, issued.issued_at_utc
FROM coach_weekly_issued_reviews issued
JOIN coach_weekly_review_requests request
  ON request.coach_weekly_review_request_id = issued.coach_weekly_review_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
ORDER BY request.week_end_date DESC, issued.issued_at_utc DESC
LIMIT ?`).all(scope.userId, scope.workspaceId, accountId(scope), limit);
    return Object.freeze(rows.map((row) => Object.freeze({
      issuedReviewId: row.coach_weekly_issued_review_id,
      requestId: row.coach_weekly_review_request_id,
      weekStartDate: row.week_start_date,
      weekEndDate: row.week_end_date,
      output: parseWeeklyOutput(row.output_json),
      modelId: row.model_id,
      issuedAtUtc: row.issued_at_utc,
    })));
  }

  listIssuedMonthlyReviews(
    scope: WorkspaceAccessScope,
    limit = 100,
  ): readonly CoachMonthlyIssuedReviewRecord[] {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const rows = this.database.prepare<[string, string, string, number], Readonly<{
      coach_monthly_issued_review_id: string;
      coach_monthly_review_request_id: string;
      period_start_date: string;
      period_end_date: string;
      period_coverage: "complete_month" | "partial_month";
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT issued.coach_monthly_issued_review_id,
  issued.coach_monthly_review_request_id, request.period_start_date,
  request.period_end_date, request.period_coverage, issued.output_json,
  issued.model_id, issued.issued_at_utc
FROM coach_monthly_issued_reviews issued
JOIN coach_monthly_review_requests request
  ON request.coach_monthly_review_request_id = issued.coach_monthly_review_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
ORDER BY request.period_end_date DESC, issued.issued_at_utc DESC
LIMIT ?`).all(scope.userId, scope.workspaceId, accountId(scope), limit);
    return Object.freeze(rows.map((row) => Object.freeze({
      issuedReviewId: row.coach_monthly_issued_review_id,
      requestId: row.coach_monthly_review_request_id,
      monthStartDate: row.period_start_date,
      monthEndDate: row.period_end_date,
      periodCoverage: row.period_coverage,
      output: parseMonthlyOutput(row.output_json),
      modelId: row.model_id,
      issuedAtUtc: row.issued_at_utc,
    })));
  }

  readLatestIssuedWeeklyReviewBefore(
    scope: WorkspaceAccessScope,
    weekStartDate: string,
  ): CoachWeeklyIssuedReviewRecord | null {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(weekStartDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "weekStartDate" });
    }
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_weekly_issued_review_id: string;
    }>>(`SELECT issued.coach_weekly_issued_review_id
FROM coach_weekly_issued_reviews issued
JOIN coach_weekly_review_requests request
  ON request.coach_weekly_review_request_id = issued.coach_weekly_review_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
  AND request.week_end_date < ?
ORDER BY request.week_end_date DESC, issued.issued_at_utc DESC
LIMIT 1`).get(scope.userId, scope.workspaceId, accountId(scope), weekStartDate);
    return row ? this.readIssuedWeeklyReview(scope, row.coach_weekly_issued_review_id) : null;
  }

  readLatestIssuedMonthlyReviewBefore(
    scope: WorkspaceAccessScope,
    periodStartDate: string,
  ): CoachMonthlyIssuedReviewRecord | null {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(periodStartDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "periodStartDate" });
    }
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_monthly_issued_review_id: string;
    }>>(`SELECT issued.coach_monthly_issued_review_id
FROM coach_monthly_issued_reviews issued
JOIN coach_monthly_review_requests request
  ON request.coach_monthly_review_request_id = issued.coach_monthly_review_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
  AND request.period_end_date < ?
ORDER BY request.period_end_date DESC, issued.issued_at_utc DESC
LIMIT 1`).get(scope.userId, scope.workspaceId, accountId(scope), periodStartDate);
    return row ? this.readIssuedMonthlyReview(scope, row.coach_monthly_issued_review_id) : null;
  }

  beginWeeklyAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachWeeklyAttemptStart {
    return this.transaction(() => {
      const request = this.readWeeklyRequest(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return Object.freeze({
          state: "already_issued" as const,
          review: this.readIssuedWeeklyReview(scope, request.issuedReviewId),
        });
      }
      if (request.state === "failed") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "legacy_failed_review_request" });
      }
      const activeAccountId = accountId(scope);
      const nowUtc = createCanonicalUtcTimestamp(now);
      const staleBeforeUtc = createCanonicalUtcTimestamp(new Date(now.getTime() - ATTEMPT_TIMEOUT_MS));
      this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'failed', failure_code = 'TRADERLINK_COACH_ATTEMPT_TIMED_OUT', finalized_at_utc = ?
WHERE review_kind = 'weekly' AND review_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending' AND created_at_utc < ?`).run(
        nowUtc,
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        staleBeforeUtc,
      );
      const pending = this.database.prepare<[string, string, string, string], Readonly<{
        coach_ai_review_generation_attempt_id: string;
        attempt_number: number;
      }>>(`SELECT coach_ai_review_generation_attempt_id, attempt_number
FROM coach_ai_review_generation_attempts
WHERE review_kind = 'weekly' AND review_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
      );
      if (pending) return Object.freeze({
        state: "in_progress" as const,
        attemptId: pending.coach_ai_review_generation_attempt_id,
        attemptNumber: pending.attempt_number,
      });
      const previous = this.database.prepare<[string], Readonly<{ maximum: number }>>(`SELECT
  COALESCE(MAX(attempt_number), 0) AS maximum
FROM coach_ai_review_generation_attempts
WHERE review_kind = 'weekly' AND review_request_id = ?`).get(requestId);
      const attemptNumber = (previous?.maximum ?? 0) + 1;
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, 'weekly', ?, ?, ?, ?, 'pending', NULL, ?, NULL)`).run(
        attemptId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        requestId,
        attemptNumber,
        settings.providerKey,
        settings.modelId,
        nowUtc,
      );
      return Object.freeze({ state: "started" as const, attemptId, attemptNumber });
    });
  }

  failWeeklyAttempt(
    scope: WorkspaceAccessScope,
    attemptId: string,
    failureCode: string,
    usageInput: CoachAiGenerationUsage | null = null,
    settings: CoachAiProviderSettings | null = null,
    now = new Date(),
  ): void {
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    this.transaction(() => {
      const result = this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND review_kind = 'weekly'
  AND user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'pending'`).run(
        failureCode,
        createCanonicalUtcTimestamp(now),
        attemptId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      if (usageInput && settings) {
        const usage = normalizedUsage(usageInput);
        const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
        this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          createCanonicalUuidV4(),
          attemptId,
          usage.inputTokens,
          usage.cachedInputTokens,
          usage.cacheWriteInputTokens,
          usage.outputTokens,
          usage.totalTokens,
          cost === null ? null : settings.inputCostUsdPerMillionTokens,
          cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
          cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
          cost === null ? null : settings.outputCostUsdPerMillionTokens,
          cost,
          createCanonicalUtcTimestamp(now),
        );
      }
    });
  }

  issueWeeklyAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
    output: CoachWeeklyAiReviewOutput,
    usageInput: CoachAiGenerationUsage,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachWeeklyIssuedReviewRecord {
    if (output.contractVersion !== COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "outputContractVersion" });
    }
    const usage = normalizedUsage(usageInput);
    return this.transaction(() => {
      const request = this.readWeeklyRequest(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return this.readIssuedWeeklyReview(scope, request.issuedReviewId);
      }
      if (request.state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: request.state });
      }
      const attempt = this.database.prepare<[string, string, string, string, string], Readonly<{
        model_id: string;
        provider_key: "openai_direct";
      }>>(`SELECT model_id, provider_key FROM coach_ai_review_generation_attempts
WHERE coach_ai_review_generation_attempt_id = ? AND review_kind = 'weekly'
  AND review_request_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND state = 'pending'`).get(
        attemptId,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (!attempt || attempt.model_id !== settings.modelId || attempt.provider_key !== settings.providerKey) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_attempts" });
      }
      const issuedAtUtc = createCanonicalUtcTimestamp(now);
      const issuedReviewId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_weekly_issued_reviews (
  coach_weekly_issued_review_id, coach_weekly_review_request_id,
  provider_key, model_id, output_contract_version, output_json,
  input_tokens, output_tokens, total_tokens, issued_at_utc
) VALUES (?, ?, 'openai_direct_local', ?, ?, ?, ?, ?, ?, ?)`).run(
        issuedReviewId,
        requestId,
        settings.modelId,
        COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
        JSON.stringify(output),
        usage.inputTokens,
        usage.outputTokens,
        usage.totalTokens,
        issuedAtUtc,
      );
      const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        attemptId,
        usage.inputTokens,
        usage.cachedInputTokens,
        usage.cacheWriteInputTokens,
        usage.outputTokens,
        usage.totalTokens,
        cost === null ? null : settings.inputCostUsdPerMillionTokens,
        cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
        cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
        cost === null ? null : settings.outputCostUsdPerMillionTokens,
        cost,
        issuedAtUtc,
      );
      this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'issued', failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
        issuedAtUtc,
        attemptId,
      );
      this.database.prepare(`UPDATE coach_weekly_review_requests
SET state = 'issued', failure_code = NULL, issued_review_id = ?, finalized_at_utc = ?
WHERE coach_weekly_review_request_id = ? AND state = 'pending'`).run(
        issuedReviewId,
        issuedAtUtc,
        requestId,
      );
      return this.readIssuedWeeklyReview(scope, issuedReviewId);
    });
  }

  beginMonthlyAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachMonthlyAttemptStart {
    return this.transaction(() => {
      const request = this.readMonthlyRequest(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return Object.freeze({
          state: "already_issued" as const,
          review: this.readIssuedMonthlyReview(scope, request.issuedReviewId),
        });
      }
      if (request.state === "failed") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "legacy_failed_review_request" });
      }
      const activeAccountId = accountId(scope);
      const nowUtc = createCanonicalUtcTimestamp(now);
      const staleBeforeUtc = createCanonicalUtcTimestamp(new Date(now.getTime() - ATTEMPT_TIMEOUT_MS));
      this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'failed', failure_code = 'TRADERLINK_COACH_ATTEMPT_TIMED_OUT', finalized_at_utc = ?
WHERE review_kind = 'monthly' AND review_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending' AND created_at_utc < ?`).run(
        nowUtc,
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        staleBeforeUtc,
      );
      const pending = this.database.prepare<[string, string, string, string], Readonly<{
        coach_ai_review_generation_attempt_id: string;
        attempt_number: number;
      }>>(`SELECT coach_ai_review_generation_attempt_id, attempt_number
FROM coach_ai_review_generation_attempts
WHERE review_kind = 'monthly' AND review_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
      );
      if (pending) return Object.freeze({
        state: "in_progress" as const,
        attemptId: pending.coach_ai_review_generation_attempt_id,
        attemptNumber: pending.attempt_number,
      });
      const previous = this.database.prepare<[string], Readonly<{ maximum: number }>>(`SELECT
  COALESCE(MAX(attempt_number), 0) AS maximum
FROM coach_ai_review_generation_attempts
WHERE review_kind = 'monthly' AND review_request_id = ?`).get(requestId);
      const attemptNumber = (previous?.maximum ?? 0) + 1;
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, 'monthly', ?, ?, ?, ?, 'pending', NULL, ?, NULL)`).run(
        attemptId,
        scope.userId,
        scope.workspaceId,
        activeAccountId,
        requestId,
        attemptNumber,
        settings.providerKey,
        settings.modelId,
        nowUtc,
      );
      return Object.freeze({ state: "started" as const, attemptId, attemptNumber });
    });
  }

  failMonthlyAttempt(
    scope: WorkspaceAccessScope,
    attemptId: string,
    failureCode: string,
    usageInput: CoachAiGenerationUsage | null = null,
    settings: CoachAiProviderSettings | null = null,
    now = new Date(),
  ): void {
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "failureCode" });
    }
    this.transaction(() => {
      const result = this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND review_kind = 'monthly'
  AND user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'pending'`).run(
        failureCode,
        createCanonicalUtcTimestamp(now),
        attemptId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      if (usageInput && settings) {
        const usage = normalizedUsage(usageInput);
        const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
        this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          createCanonicalUuidV4(),
          attemptId,
          usage.inputTokens,
          usage.cachedInputTokens,
          usage.cacheWriteInputTokens,
          usage.outputTokens,
          usage.totalTokens,
          cost === null ? null : settings.inputCostUsdPerMillionTokens,
          cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
          cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
          cost === null ? null : settings.outputCostUsdPerMillionTokens,
          cost,
          createCanonicalUtcTimestamp(now),
        );
      }
    });
  }

  issueMonthlyAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
    output: CoachMonthlyAiReviewOutput,
    usageInput: CoachAiGenerationUsage,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachMonthlyIssuedReviewRecord {
    if (
      output.contractVersion !== COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION ||
      !Array.isArray(output.nextMonthFocuses) ||
      output.nextMonthFocuses.length > 3
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "outputContractVersion" });
    }
    const usage = normalizedUsage(usageInput);
    return this.transaction(() => {
      const request = this.readMonthlyRequest(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return this.readIssuedMonthlyReview(scope, request.issuedReviewId);
      }
      if (request.state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: request.state });
      }
      const attempt = this.database.prepare<[string, string, string, string, string], Readonly<{
        model_id: string;
        provider_key: "openai_direct";
      }>>(`SELECT model_id, provider_key FROM coach_ai_review_generation_attempts
WHERE coach_ai_review_generation_attempt_id = ? AND review_kind = 'monthly'
  AND review_request_id = ? AND user_id = ? AND workspace_id = ?
  AND account_id = ? AND state = 'pending'`).get(
        attemptId,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (!attempt || attempt.model_id !== settings.modelId || attempt.provider_key !== settings.providerKey) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { table: "coach_ai_review_generation_attempts" });
      }
      const issuedAtUtc = createCanonicalUtcTimestamp(now);
      const issuedReviewId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_monthly_issued_reviews (
  coach_monthly_issued_review_id, coach_monthly_review_request_id,
  provider_key, model_id, output_contract_version, output_json,
  input_tokens, output_tokens, total_tokens, issued_at_utc
) VALUES (?, ?, 'openai_direct_local', ?, ?, ?, ?, ?, ?, ?)`).run(
        issuedReviewId,
        requestId,
        settings.modelId,
        COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
        JSON.stringify(output),
        usage.inputTokens,
        usage.outputTokens,
        usage.totalTokens,
        issuedAtUtc,
      );
      const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        attemptId,
        usage.inputTokens,
        usage.cachedInputTokens,
        usage.cacheWriteInputTokens,
        usage.outputTokens,
        usage.totalTokens,
        cost === null ? null : settings.inputCostUsdPerMillionTokens,
        cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
        cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
        cost === null ? null : settings.outputCostUsdPerMillionTokens,
        cost,
        issuedAtUtc,
      );
      this.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'issued', failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
        issuedAtUtc,
        attemptId,
      );
      this.database.prepare(`UPDATE coach_monthly_review_requests
SET state = 'issued', failure_code = NULL, issued_review_id = ?, finalized_at_utc = ?
WHERE coach_monthly_review_request_id = ? AND state = 'pending'`).run(
        issuedReviewId,
        issuedAtUtc,
        requestId,
      );
      return this.readIssuedMonthlyReview(scope, issuedReviewId);
    });
  }

  readPeriodRequestV2(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewPeriodRequestRecordV2 {
    assertCanonicalUuidV4(requestId, "requestId");
    const row = this.database.prepare<[string, string, string, string], PeriodRequestRowV2>(
      `${PERIOD_REQUEST_SELECT_V2}
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`,
    ).get(requestId, scope.userId, scope.workspaceId, accountId(scope));
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return periodRequestRecordV2(row);
  }

  readEvidenceManifestV2(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewEvidenceManifestV2 {
    const request = this.readPeriodRequestV2(scope, requestId);
    const parsed = JSON.parse(request.evidenceManifestJson) as CoachAiReviewEvidenceManifestV2;
    validateEvidenceManifestV2(parsed, request.inputJson);
    return Object.freeze({
      contractVersion: parsed.contractVersion,
      evidence: Object.freeze(parsed.evidence.map((evidence) => Object.freeze({
        ...evidence,
        tradeNoteRevisionIds: Object.freeze([...evidence.tradeNoteRevisionIds]),
      }))),
    });
  }

  readInputV2(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewInputV2 {
    const request = this.readPeriodRequestV2(scope, requestId);
    const parsed = JSON.parse(request.inputJson) as CoachAiReviewInputV2;
    validateV2Input(request.reviewKind, parsed);
    const checked = immutableSnapshot(parsed);
    if (checked.json !== request.inputJson || checked.sha256 !== request.inputSha256) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_period_requests_v2",
      });
    }
    return parsed;
  }

  readPeriodRequestByIdentityV2(
    scope: WorkspaceAccessScope,
    reviewKind: CoachAiReviewKindV2,
    periodStartDate: string,
    periodEndDate: string,
  ): CoachAiReviewPeriodRequestRecordV2 | null {
    const row = this.database.prepare<[
      string, string, string, CoachAiReviewKindV2, string, string
    ], PeriodRequestRowV2>(`${PERIOD_REQUEST_SELECT_V2}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND review_kind = ? AND period_start_date = ? AND period_end_date = ?`).get(
      scope.userId,
      scope.workspaceId,
      accountId(scope),
      reviewKind,
      periodStartDate,
      periodEndDate,
    );
    return row ? periodRequestRecordV2(row) : null;
  }

  listPendingPeriodRequestsV2(
    scope: WorkspaceAccessScope,
  ): readonly CoachAiReviewPeriodRequestRecordV2[] {
    const rows = this.database.prepare<[
      string, string, string
    ], PeriodRequestRowV2>(`${PERIOD_REQUEST_SELECT_V2}
WHERE user_id = ? AND workspace_id = ? AND account_id = ? AND state = 'pending'
ORDER BY eligible_at_utc ASC, created_at_utc ASC,
  coach_ai_review_period_request_id ASC`).all(
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    return Object.freeze(rows.map(periodRequestRecordV2));
  }

  readPeriodRequestOperationalStateV2(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewRequestOperationalStateV2 {
    const request = this.readPeriodRequestV2(scope, requestId);
    if (request.state === "issued") return "issued";
    if (request.state === "stopped" || request.state === "failed") return "stopped";
    const attempts = this.database.prepare<[
      string, string, string, string
    ], Readonly<{ state: "pending" | "issued" | "failed" }>>(`SELECT state
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
ORDER BY attempt_number DESC`).all(
      requestId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (attempts.some((attempt) => attempt.state === "pending")) return "generating";
    if (attempts.some((attempt) => attempt.state === "failed")) return "retrying";
    return "pending";
  }

  createOrReadPeriodRequestV2(
    scope: WorkspaceAccessScope,
    input: CoachAiReviewInputV2,
    evidenceManifest: CoachAiReviewEvidenceManifestV2,
    requestOrigin: "automatic" | "manual",
    priorIssuedReviewId: string | null,
    now = new Date(),
  ): CoachAiReviewPeriodRequestRecordV2 {
    const reviewKind: CoachAiReviewKindV2 =
      input.contractVersion === COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2
        ? "monthly"
        : input.period.cadence;
    validateV2Input(reviewKind, input);
    if (requestOrigin !== "automatic" && requestOrigin !== "manual") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestOrigin",
      });
    }
    if (priorIssuedReviewId) assertCanonicalUuidV4(priorIssuedReviewId, "priorIssuedReviewId");
    const inputSnapshot = immutableSnapshot(input);
    validateEvidenceManifestV2(evidenceManifest, inputSnapshot.json);
    const manifestSnapshot = immutableSnapshot(evidenceManifest);
    const identity = reviewKind === "monthly"
      ? (() => {
          const monthly = input as CoachMonthlyAiReviewInputV2;
          return Object.freeze({
            periodStartDate: monthly.calendarMonth.calendarMonthStartDate,
            periodEndDate: monthly.calendarMonth.calendarMonthEndDate,
            coverageStartDate: monthly.calendarMonth.coverageStartDate,
            coverageEndDate: monthly.calendarMonth.coverageEndDate,
            calendarId: monthly.calendarMonth.calendarId,
            calendarEvidenceDigestSha256:
              monthly.calendarMonth.calendarEvidenceDigestSha256,
            eligibleAtUtc: monthly.calendarMonth.scheduledAtUtc,
          });
        })()
      : (() => {
          const periodic = input as CoachPeriodicAiReviewInputV2;
          return Object.freeze({
            periodStartDate: periodic.period.startDate,
            periodEndDate: periodic.period.endDate,
            coverageStartDate: periodic.period.startDate,
            coverageEndDate: periodic.period.endDate,
            calendarId: periodic.period.calendarId,
            calendarEvidenceDigestSha256:
              periodic.period.calendarEvidenceDigestSha256,
            eligibleAtUtc: periodic.period.cohorts.at(-1)?.sealedAtUtc ?? "",
          });
        })();
    const eligibleAtUtc = createCanonicalUtcTimestamp(new Date(identity.eligibleAtUtc));
    if (eligibleAtUtc !== identity.eligibleAtUtc) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "eligibleAtUtc",
      });
    }
    const narrativeOwnerMonth = identity.periodEndDate.slice(0, 7);
    return this.transaction(() => {
      const existing = this.readPeriodRequestByIdentityV2(
        scope,
        reviewKind,
        identity.periodStartDate,
        identity.periodEndDate,
      );
      if (existing) return existing;
      if (priorIssuedReviewId) {
        const allowedPriorKinds: readonly CoachAiReviewKindV2[] = reviewKind === "monthly"
          ? ["monthly"]
          : ["weekly", "two_week"];
        const prior = this.database.prepare(`SELECT request.period_end_date
FROM coach_ai_issued_reviews_v2 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
WHERE review.coach_ai_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?
  AND request.review_kind IN (${allowedPriorKinds.map(() => "?").join(", ")})`)
          .get(
            priorIssuedReviewId,
            scope.userId,
            scope.workspaceId,
            accountId(scope),
            ...allowedPriorKinds,
          ) as Readonly<{ period_end_date: string }> | undefined;
        if (!prior || prior.period_end_date >= identity.periodStartDate) {
          platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
        }
      }
      const requestId = createCanonicalUuidV4();
      const createdAtUtc = createCanonicalUtcTimestamp(now);
      const result = this.database.prepare(`INSERT OR IGNORE INTO coach_ai_review_period_requests_v2 (
  coach_ai_review_period_request_id, user_id, workspace_id, account_id,
  review_kind, period_start_date, period_end_date, coverage_start_date,
  coverage_end_date, narrative_owner_month, calendar_id,
  calendar_evidence_digest_sha256, eligible_at_utc, request_origin,
  input_contract_version, input_sha256, input_json,
  evidence_manifest_sha256, evidence_manifest_json, prior_issued_review_id,
  state, terminal_failure_code, issued_review_id, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  'pending', NULL, NULL, ?, NULL)`).run(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
        reviewKind,
        identity.periodStartDate,
        identity.periodEndDate,
        identity.coverageStartDate,
        identity.coverageEndDate,
        narrativeOwnerMonth,
        identity.calendarId,
        identity.calendarEvidenceDigestSha256,
        eligibleAtUtc,
        requestOrigin,
        input.contractVersion,
        inputSnapshot.sha256,
        inputSnapshot.json,
        manifestSnapshot.sha256,
        manifestSnapshot.json,
        priorIssuedReviewId,
        createdAtUtc,
      );
      const saved = result.changes === 1
        ? this.readPeriodRequestV2(scope, requestId)
        : this.readPeriodRequestByIdentityV2(
            scope,
            reviewKind,
            identity.periodStartDate,
            identity.periodEndDate,
          );
      if (!saved) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_period_requests_v2",
      });
      if (result.changes === 1 &&
          input.contractVersion === COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION) {
        for (const carry of input.carryForwardEvidenceBundles) {
          const sourceEvidenceSha256 = carry.evidenceRef.startsWith("daily_reflection_sha256:")
            ? carry.evidenceRef.slice("daily_reflection_sha256:".length)
            : createHash("sha256").update(`${carry.evidenceRef}\n`, "utf8").digest("hex");
          const consumptionId = createCanonicalUuidV4();
          this.database.prepare(`INSERT OR IGNORE INTO coach_ai_review_carry_consumptions_v2 (
  coach_ai_review_carry_consumption_id, workspace_id, account_id,
  source_evidence_sha256, source_period_start_date, source_period_end_date,
  destination_request_id, consumed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
            consumptionId,
            scope.workspaceId,
            accountId(scope),
            sourceEvidenceSha256,
            carry.sourcePeriodStartDate,
            carry.sourcePeriodEndDate,
            saved.requestId,
            createdAtUtc,
          );
          const consumption = this.database.prepare<[
            string, string, string
          ], Readonly<{ destination_request_id: string }>>(`SELECT destination_request_id
FROM coach_ai_review_carry_consumptions_v2
WHERE workspace_id = ? AND account_id = ? AND source_evidence_sha256 = ?`).get(
            scope.workspaceId,
            accountId(scope),
            sourceEvidenceSha256,
          );
          if (consumption?.destination_request_id !== saved.requestId) {
            platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
              check: "coach_ai_review_carry_already_consumed",
            });
          }
        }
      }
      return saved;
    });
  }

  readIssuedReviewV2(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachAiIssuedReviewRecordV2 {
    assertCanonicalUuidV4(issuedReviewId, "issuedReviewId");
    const row = this.database.prepare<[
      string, string, string, string
    ], Readonly<{
      coach_ai_issued_review_id: string;
      coach_ai_review_period_request_id: string;
      review_kind: CoachAiReviewKindV2;
      period_start_date: string;
      period_end_date: string;
      input_json: string;
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT review.coach_ai_issued_review_id,
  review.coach_ai_review_period_request_id, request.review_kind,
  request.period_start_date, request.period_end_date, request.input_json,
  review.output_json, review.model_id, review.issued_at_utc
FROM coach_ai_issued_reviews_v2 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
WHERE review.coach_ai_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return Object.freeze({
      issuedReviewId: row.coach_ai_issued_review_id,
      requestId: row.coach_ai_review_period_request_id,
      reviewKind: row.review_kind,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      output: parseOutputV2(row.review_kind, row.output_json),
      representedEvidenceRefs: coachAiReviewRepresentedEvidenceRefs(row.input_json),
      modelId: row.model_id,
      issuedAtUtc: row.issued_at_utc,
    });
  }

  listIssuedReviewsV2(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      beforePeriodEndDate?: string;
      reviewKinds?: readonly CoachAiReviewKindV2[];
      limit?: number;
    }> = {},
  ): readonly CoachAiIssuedReviewRecordV2[] {
    const limit = input.limit ?? 100;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const allowedKinds = new Set(input.reviewKinds ?? ["weekly", "two_week", "monthly"]);
    const rows = this.database.prepare<[
      string, string, string, string, number
    ], Readonly<{
      coach_ai_issued_review_id: string;
      coach_ai_review_period_request_id: string;
      review_kind: CoachAiReviewKindV2;
      period_start_date: string;
      period_end_date: string;
      input_json: string;
      output_json: string;
      model_id: string;
      issued_at_utc: string;
    }>>(`SELECT review.coach_ai_issued_review_id,
  review.coach_ai_review_period_request_id, request.review_kind,
  request.period_start_date, request.period_end_date, request.input_json,
  review.output_json, review.model_id, review.issued_at_utc
FROM coach_ai_issued_reviews_v2 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
  AND request.period_end_date < ?
ORDER BY request.period_end_date DESC, review.issued_at_utc DESC
LIMIT ?`).all(
      scope.userId,
      scope.workspaceId,
      accountId(scope),
      input.beforePeriodEndDate ?? "9999-12-31",
      limit,
    );
    return Object.freeze(rows
      .filter((row) => allowedKinds.has(row.review_kind))
      .map((row) => Object.freeze({
        issuedReviewId: row.coach_ai_issued_review_id,
        requestId: row.coach_ai_review_period_request_id,
        reviewKind: row.review_kind,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        output: parseOutputV2(row.review_kind, row.output_json),
        representedEvidenceRefs: coachAiReviewRepresentedEvidenceRefs(row.input_json),
        modelId: row.model_id,
        issuedAtUtc: row.issued_at_utc,
      })));
  }

  beginAttemptV2(
    scope: WorkspaceAccessScope,
    requestId: string,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachAiReviewAttemptStartV2 {
    return this.transaction(() => {
      const request = this.readPeriodRequestV2(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return Object.freeze({
          state: "already_issued" as const,
          review: this.readIssuedReviewV2(scope, request.issuedReviewId),
        });
      }
      if (request.state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: request.state });
      }
      const nowUtc = createCanonicalUtcTimestamp(now);
      const staleBeforeUtc = createCanonicalUtcTimestamp(
        new Date(now.getTime() - ATTEMPT_TIMEOUT_MS),
      );
      this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = 'TRADERLINK_COACH_ATTEMPT_TIMED_OUT',
  finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'
  AND created_at_utc < ?`).run(
        nowUtc,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
        staleBeforeUtc,
      );
      const pending = this.database.prepare<[
        string, string, string, string
      ], Readonly<{
        coach_ai_review_generation_attempt_id: string;
        attempt_number: number;
      }>>(`SELECT coach_ai_review_generation_attempt_id, attempt_number
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (pending) return Object.freeze({
        state: "in_progress" as const,
        attemptId: pending.coach_ai_review_generation_attempt_id,
        attemptNumber: pending.attempt_number,
      });
      const previous = this.database.prepare<[string], Readonly<{ maximum: number }>>(`SELECT
  COALESCE(MAX(attempt_number), 0) AS maximum
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ?`).get(requestId);
      const attemptNumber = (previous?.maximum ?? 0) + 1;
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempts_v2 (
  coach_ai_review_generation_attempt_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, NULL)`).run(
        attemptId,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
        attemptNumber,
        settings.providerKey,
        settings.modelId,
        nowUtc,
      );
      return Object.freeze({ state: "started" as const, attemptId, attemptNumber });
    });
  }

  failAttemptV2(
    scope: WorkspaceAccessScope,
    attemptId: string,
    failureCode: string,
    usageInput: CoachAiGenerationUsage | null = null,
    settings: CoachAiProviderSettings | null = null,
    now = new Date(),
  ): void {
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(failureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "failureCode",
      });
    }
    this.transaction(() => {
      const finalizedAtUtc = createCanonicalUtcTimestamp(now);
      const result = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).run(
        failureCode,
        finalizedAtUtc,
        attemptId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      if (usageInput && settings) {
        const usage = normalizedUsage(usageInput);
        const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
        this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts_v2 (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          createCanonicalUuidV4(), attemptId, usage.inputTokens,
          usage.cachedInputTokens, usage.cacheWriteInputTokens,
          usage.outputTokens, usage.totalTokens,
          cost === null ? null : settings.inputCostUsdPerMillionTokens,
          cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
          cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
          cost === null ? null : settings.outputCostUsdPerMillionTokens,
          cost, finalizedAtUtc,
        );
      }
    });
  }

  issueAttemptV2(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
    output: CoachAiReviewOutputV2,
    usageInput: CoachAiGenerationUsage,
    settings: CoachAiProviderSettings,
    now = new Date(),
  ): CoachAiIssuedReviewRecordV2 {
    const usage = normalizedUsage(usageInput);
    return this.transaction(() => {
      const request = this.readPeriodRequestV2(scope, requestId);
      if (request.state === "issued" && request.issuedReviewId) {
        return this.readIssuedReviewV2(scope, request.issuedReviewId);
      }
      if (request.state !== "pending") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: request.state });
      }
      const parsedOutput = parseOutputV2(request.reviewKind, JSON.stringify(output));
      const attempt = this.database.prepare<[
        string, string, string, string, string
      ], Readonly<{ model_id: string; provider_key: "openai_direct" }>>(
        `SELECT model_id, provider_key
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`,
      ).get(
        attemptId,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
      if (!attempt || attempt.model_id !== settings.modelId ||
          attempt.provider_key !== settings.providerKey) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_generation_attempts_v2",
        });
      }
      const issuedAtUtc = createCanonicalUtcTimestamp(now);
      const issuedReviewId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_issued_reviews_v2 (
  coach_ai_issued_review_id, coach_ai_review_period_request_id,
  provider_key, model_id, output_contract_version, output_json, issued_at_utc
) VALUES (?, ?, 'openai_direct', ?, ?, ?, ?)`).run(
        issuedReviewId,
        requestId,
        settings.modelId,
        parsedOutput.contractVersion,
        JSON.stringify(parsedOutput),
        issuedAtUtc,
      );
      const cost = calculateCoachAiReviewEstimatedCost(usage, settings);
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts_v2 (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(), attemptId, usage.inputTokens,
        usage.cachedInputTokens, usage.cacheWriteInputTokens,
        usage.outputTokens, usage.totalTokens,
        cost === null ? null : settings.inputCostUsdPerMillionTokens,
        cost === null ? null : settings.cachedInputCostUsdPerMillionTokens,
        cost === null ? null : settings.cacheWriteInputCostUsdPerMillionTokens,
        cost === null ? null : settings.outputCostUsdPerMillionTokens,
        cost, issuedAtUtc,
      );
      const attemptUpdate = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'issued', failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
        issuedAtUtc,
        attemptId,
      );
      const requestUpdate = this.database.prepare(`UPDATE coach_ai_review_period_requests_v2
SET state = 'issued', terminal_failure_code = NULL, issued_review_id = ?,
  finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND state = 'pending'`).run(
        issuedReviewId,
        issuedAtUtc,
        requestId,
      );
      if (attemptUpdate.changes !== 1 || requestUpdate.changes !== 1) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_period_requests_v2",
        });
      }
      const reviewLabel = request.reviewKind === "two_week"
        ? "two-week"
        : request.reviewKind;
      new PlatformNotificationRepository(this.database).create({
        category: "ai_review",
        destinationPath: "/ai-reviews",
        journalAccountId: accountId(scope),
        kind: "ai_review_ready",
        occurredAtUtc: issuedAtUtc,
        scope,
        sourceEventKey: `ai_review_ready_${issuedReviewId}`,
        summary: `Your ${reviewLabel} AI Review is ready to read.`,
        title: "Your AI Review is ready",
      });
      return this.readIssuedReviewV2(scope, issuedReviewId);
    });
  }

  finalizePeriodRequestV2(
    scope: WorkspaceAccessScope,
    requestId: string,
    state: "failed" | "stopped",
    terminalFailureCode: string,
    now = new Date(),
  ): CoachAiReviewPeriodRequestRecordV2 {
    if (!/^[A-Z][A-Z0-9_]{0,95}$/u.test(terminalFailureCode)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "terminalFailureCode",
      });
    }
    const result = this.database.prepare(`UPDATE coach_ai_review_period_requests_v2
SET state = ?, terminal_failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).run(
      state,
      terminalFailureCode,
      createCanonicalUtcTimestamp(now),
      requestId,
      scope.userId,
      scope.workspaceId,
      accountId(scope),
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return this.readPeriodRequestV2(scope, requestId);
  }
}
