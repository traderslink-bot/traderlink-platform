import { createHash } from "node:crypto";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewOutput,
} from "../contracts/weekly-ai-review-output-contracts";
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

export type CoachWeeklyReviewRequestRecord = Readonly<{
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

export type CoachAiGenerationUsage = Readonly<{
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

export type CoachWeeklyAttemptStart =
  | Readonly<{ state: "started"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "in_progress"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "already_issued"; review: CoachWeeklyIssuedReviewRecord }>;

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

function requestRecord(row: WeeklyRequestRow): CoachWeeklyReviewRequestRecord {
  return Object.freeze({
    requestId: row.coach_weekly_review_request_id,
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
  const outputTokens = nonnegativeToken(usage.outputTokens, "outputTokens");
  const totalTokens = nonnegativeToken(usage.totalTokens, "totalTokens");
  if ((inputTokens === null) !== (outputTokens === null) ||
      (inputTokens === null) !== (totalTokens === null) ||
      (inputTokens !== null && outputTokens !== null && totalTokens !== inputTokens + outputTokens)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tokenUsage" });
  }
  return Object.freeze({ inputTokens, outputTokens, totalTokens });
}

function estimatedCost(
  usage: CoachAiGenerationUsage,
  settings: CoachAiProviderSettings,
): string | null {
  if (usage.inputTokens === null || usage.outputTokens === null ||
      settings.inputCostUsdPerMillionTokens === null ||
      settings.outputCostUsdPerMillionTokens === null) return null;
  return new ExactDecimal(usage.inputTokens)
    .times(settings.inputCostUsdPerMillionTokens)
    .plus(new ExactDecimal(usage.outputTokens).times(settings.outputCostUsdPerMillionTokens))
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
        const cost = estimatedCost(usage, settings);
        this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, output_tokens,
  total_tokens, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          createCanonicalUuidV4(),
          attemptId,
          usage.inputTokens,
          usage.outputTokens,
          usage.totalTokens,
          cost === null ? null : settings.inputCostUsdPerMillionTokens,
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
      const cost = estimatedCost(usage, settings);
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, output_tokens,
  total_tokens, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        attemptId,
        usage.inputTokens,
        usage.outputTokens,
        usage.totalTokens,
        cost === null ? null : settings.inputCostUsdPerMillionTokens,
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
}
