import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from
  "@/src/modules/platform/server/notifications/platform-notification-repository";

import type {
  CoachMonthlyAiReviewAuthoredOutput,
  CoachMonthlyAiReviewEvidencePacket,
} from "../contracts/coach-monthly-ai-review-evidence-authoring-contracts";
import type {
  CoachWeeklyAiReviewAuthoredOutput,
  CoachWeeklyAiReviewEvidencePacket,
} from "../contracts/coach-weekly-ai-review-evidence-authoring-contracts";
import type { CoachAiReviewKindV2 } from "./coach-ai-review-repository";
import {
  calculateCoachAiReviewEstimatedCost,
  type CoachAiGenerationUsage,
} from "./coach-ai-review-repository";
import type {
  CoachAiReviewEvidenceAuthoringCallKind,
} from "./coach-ai-review-evidence-authoring-observer";
import { CoachAiReviewProviderControlsRepository } from
  "./coach-ai-review-provider-controls-repository";

export const COACH_AI_REVIEW_AUTHORED_CONTRACT_VERSION =
  "evidence_authoring_v4" as const;

export type CoachAiReviewAuthoredPacket =
  | CoachWeeklyAiReviewEvidencePacket
  | CoachMonthlyAiReviewEvidencePacket;

export type CoachAiReviewAuthoredOutput =
  | CoachWeeklyAiReviewAuthoredOutput
  | CoachMonthlyAiReviewAuthoredOutput;

export type CoachAiReviewAuthoredSnapshotRecord = Readonly<{
  requestId: string;
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
  modelId: string;
  packet: CoachAiReviewAuthoredPacket;
  packetSha256: string;
  createdAtUtc: string;
}>;

export type CoachAiReviewAuthoredIssuedRecord = Readonly<{
  issuedReviewId: string;
  requestId: string;
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
  modelId: string;
  output: CoachAiReviewAuthoredOutput;
  issuedAtUtc: string;
}>;

export type CoachAiReviewAuthoredCallHandle = Readonly<{
  callId: string;
  attemptId: string;
  requestId: string;
  kind: CoachAiReviewEvidenceAuthoringCallKind;
}>;

function accountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function digest(value: string): string {
  return createHash("sha256").update(`${value}\n`, "utf8").digest("hex");
}

function validUsage(usage: CoachAiGenerationUsage): usage is Required<CoachAiGenerationUsage> {
  const values = [
    usage.inputTokens,
    usage.cachedInputTokens,
    usage.cacheWriteInputTokens,
    usage.outputTokens,
    usage.totalTokens,
  ];
  return values.every((value) => typeof value === "number" &&
    Number.isSafeInteger(value) && value >= 0) &&
    usage.cachedInputTokens! + usage.cacheWriteInputTokens! <= usage.inputTokens! &&
    usage.inputTokens! + usage.outputTokens! === usage.totalTokens!;
}

function failureCode(value: string): string {
  return /^[A-Z][A-Z0-9_]{0,95}$/u.test(value)
    ? value
    : "TRADERLINK_COACH_AUTHORING_PROVIDER_FAILED";
}

function parsePacket(value: string, reviewKind: CoachAiReviewKindV2): CoachAiReviewAuthoredPacket {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("TRADERLINK_COACH_AUTHORING_PACKET_JSON_INVALID");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("TRADERLINK_COACH_AUTHORING_PACKET_INVALID");
  }
  const record = parsed as Record<string, unknown>;
  const version = record.packetVersion;
  const expected = reviewKind === "monthly"
    ? "traderlink_coach_monthly_ai_review_evidence_packet_v1"
    : "traderlink_coach_weekly_ai_review_evidence_packet_v1";
  if (version !== expected) throw new Error("TRADERLINK_COACH_AUTHORING_PACKET_VERSION_INVALID");
  return parsed as CoachAiReviewAuthoredPacket;
}

function parseOutput(value: string, reviewKind: CoachAiReviewKindV2): CoachAiReviewAuthoredOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("TRADERLINK_COACH_AUTHORING_OUTPUT_JSON_INVALID");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("TRADERLINK_COACH_AUTHORING_OUTPUT_INVALID");
  }
  const record = parsed as Record<string, unknown>;
  const expected = reviewKind === "monthly"
    ? "traderlink_coach_monthly_ai_review_authored_output_v1"
    : "traderlink_coach_weekly_ai_review_authored_output_v1";
  if (record.contractVersion !== expected) {
    throw new Error("TRADERLINK_COACH_AUTHORING_OUTPUT_VERSION_INVALID");
  }
  return parsed as CoachAiReviewAuthoredOutput;
}

export class CoachAiReviewAuthoredPersistenceRepository {
  constructor(private readonly database: Database.Database) {}

  tablesAvailable(): boolean {
    const rows = this.database.prepare<[], Readonly<{ name: string }>>(`SELECT name
FROM sqlite_master WHERE type = 'table' AND name IN (
  'coach_ai_review_authored_snapshots_v4',
  'coach_ai_review_authored_provider_calls_v4',
  'coach_ai_issued_reviews_v4'
)`).all();
    return rows.length === 3;
  }

  createOrRead(input: Readonly<{
    scope: WorkspaceAccessScope;
    reviewKind: CoachAiReviewKindV2;
    periodStartDate: string;
    periodEndDate: string;
    coverageStartDate: string;
    coverageEndDate: string;
    calendarId: string;
    calendarEvidenceDigestSha256: string;
    eligibleAtUtc: string;
    requestOrigin: "automatic" | "manual";
    inputContractVersion: string;
    inputJson: string;
    evidenceManifestJson: string;
    priorIssuedReviewId: string | null;
    packet: CoachAiReviewAuthoredPacket;
    modelId: string;
    now?: Date;
  }>): Readonly<{ state: "created" | "existing_authored" | "existing_legacy"; requestId: string }> {
    if (!this.tablesAvailable()) throw new Error("TRADERLINK_COACH_AUTHORING_SCHEMA_UNAVAILABLE");
    const now = input.now ?? new Date();
    const scopeAccountId = accountId(input.scope);
    const packetJson = canonicalJson(input.packet);
    const packetSha256 = digest(packetJson);
    const inputSha256 = digest(input.inputJson);
    const manifestSha256 = digest(input.evidenceManifestJson);
    const timestamp = createCanonicalUtcTimestamp(now);
    return this.transaction(() => {
      const existing = this.database.prepare<[string, string, string, string, string, string], Readonly<{
        coach_ai_review_period_request_id: string;
      }>>(`SELECT coach_ai_review_period_request_id
FROM coach_ai_review_period_requests_v2
WHERE user_id = ? AND workspace_id = ? AND account_id = ? AND review_kind = ?
  AND period_start_date = ? AND period_end_date = ?`).get(
        input.scope.userId,
        input.scope.workspaceId,
        scopeAccountId,
        input.reviewKind,
        input.periodStartDate,
        input.periodEndDate,
      );
      if (existing) {
        const authored = this.readSnapshotOrNull(input.scope,
          existing.coach_ai_review_period_request_id);
        return Object.freeze({
          state: authored ? "existing_authored" as const : "existing_legacy" as const,
          requestId: existing.coach_ai_review_period_request_id,
        });
      }
      const requestId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_period_requests_v2 (
  coach_ai_review_period_request_id, user_id, workspace_id, account_id,
  review_kind, period_start_date, period_end_date, coverage_start_date,
  coverage_end_date, narrative_owner_month, calendar_id,
  calendar_evidence_digest_sha256, eligible_at_utc, request_origin,
  input_contract_version, input_sha256, input_json,
  evidence_manifest_sha256, evidence_manifest_json, prior_issued_review_id,
  state, terminal_failure_code, issued_review_id, created_at_utc,
  finalized_at_utc, generation_contract_version
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  'pending', NULL, NULL, ?, NULL, 'insight_selection_v3')`).run(
        requestId,
        input.scope.userId,
        input.scope.workspaceId,
        scopeAccountId,
        input.reviewKind,
        input.periodStartDate,
        input.periodEndDate,
        input.coverageStartDate,
        input.coverageEndDate,
        input.periodEndDate.slice(0, 7),
        input.calendarId,
        input.calendarEvidenceDigestSha256,
        input.eligibleAtUtc,
        input.requestOrigin,
        input.inputContractVersion,
        inputSha256,
        input.inputJson,
        manifestSha256,
        input.evidenceManifestJson,
        input.priorIssuedReviewId,
        timestamp,
      );
      this.database.prepare(`INSERT INTO coach_ai_review_authored_snapshots_v4 (
  coach_ai_review_authored_snapshot_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, authoring_contract_version,
  packet_contract_version, provider_key, model_id, packet_sha256, packet_json,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, 'evidence_authoring_v4', ?, 'openai_direct', ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        requestId,
        input.scope.userId,
        input.scope.workspaceId,
        scopeAccountId,
        input.packet.packetVersion,
        input.modelId,
        packetSha256,
        packetJson,
        timestamp,
      );
      return Object.freeze({ state: "created" as const, requestId });
    });
  }

  readSnapshot(scope: WorkspaceAccessScope, requestId: string): CoachAiReviewAuthoredSnapshotRecord {
    const snapshot = this.readSnapshotOrNull(scope, requestId);
    if (!snapshot) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return snapshot;
  }

  readSnapshotOrNull(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewAuthoredSnapshotRecord | null {
    assertCanonicalUuidV4(requestId, "requestId");
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      review_kind: CoachAiReviewKindV2;
      period_start_date: string;
      period_end_date: string;
      model_id: string;
      packet_sha256: string;
      packet_json: string;
      created_at_utc: string;
    }>>(`SELECT request.review_kind, request.period_start_date, request.period_end_date,
  snapshot.model_id, snapshot.packet_sha256, snapshot.packet_json,
  snapshot.created_at_utc
FROM coach_ai_review_authored_snapshots_v4 snapshot
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = snapshot.coach_ai_review_period_request_id
 AND request.user_id = snapshot.user_id AND request.workspace_id = snapshot.workspace_id
 AND request.account_id = snapshot.account_id
WHERE snapshot.coach_ai_review_period_request_id = ? AND snapshot.user_id = ?
  AND snapshot.workspace_id = ? AND snapshot.account_id = ?`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId(scope),
      );
    if (!row) return null;
    if (digest(row.packet_json) !== row.packet_sha256) {
      throw new Error("TRADERLINK_COACH_AUTHORING_PACKET_DIGEST_INVALID");
    }
    return Object.freeze({
      requestId,
      reviewKind: row.review_kind,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      modelId: row.model_id,
      packet: parsePacket(row.packet_json, row.review_kind),
      packetSha256: row.packet_sha256,
      createdAtUtc: row.created_at_utc,
    });
  }

  beginProviderCall(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestId: string;
    kind: CoachAiReviewEvidenceAuthoringCallKind;
    system: string;
    prompt: string;
    providerInputTokens?: number | null;
    maximumOutputTokens: number;
    now?: Date;
  }>): CoachAiReviewAuthoredCallHandle {
    const now = input.now ?? new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    const snapshot = this.readSnapshot(input.scope, input.requestId);
    const scopeAccountId = accountId(input.scope);
    const reservationText = JSON.stringify({ system: input.system, prompt: input.prompt });
    return this.transaction(() => {
      const request = this.database.prepare<[string, string, string, string], Readonly<{
        state: "pending" | "issued" | "failed" | "stopped";
      }>>(`SELECT state FROM coach_ai_review_period_requests_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        input.requestId, input.scope.userId, input.scope.workspaceId, scopeAccountId,
      );
      if (!request || request.state !== "pending") {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      const pending = this.database.prepare<[string], Readonly<{ present: number }>>(`SELECT 1 AS present
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ? AND state = 'pending'`).get(input.requestId);
      if (pending) throw new Error("TRADERLINK_COACH_AUTHORING_CALL_ALREADY_RUNNING");
      const next = this.database.prepare<[string], Readonly<{ maximum: number }>>(`SELECT
COALESCE(MAX(attempt_number), 0) AS maximum
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ?`).get(input.requestId)?.maximum ?? 0;
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempts_v2 (
  coach_ai_review_generation_attempt_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc,
  generation_contract_version
) VALUES (?, ?, ?, ?, ?, ?, 'openai_direct', ?, 'pending', NULL, ?, NULL,
  'insight_selection_v3')`).run(
        attemptId,
        input.requestId,
        input.scope.userId,
        input.scope.workspaceId,
        scopeAccountId,
        next + 1,
        snapshot.modelId,
        timestamp,
      );
      const controls = new CoachAiReviewProviderControlsRepository(this.database);
      const reservation = controls.reserveReviewGenerationV2(input.scope, {
        attemptId,
        reviewKind: snapshot.reviewKind,
        providerInputText: reservationText,
        providerInputTokens: input.providerInputTokens,
        maxOutputTokens: input.maximumOutputTokens,
      }, now);
      if (reservation.state === "blocked") {
        this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'blocked', failure_code = 'TRADERLINK_COACH_REVIEW_UNAVAILABLE',
  finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
          timestamp, attemptId,
        );
        throw new Error("TRADERLINK_COACH_REVIEW_UNAVAILABLE");
      }
      controls.markProviderStartedV2(input.scope, attemptId, now);
      const callId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_authored_provider_calls_v4 (
  coach_ai_review_authored_provider_call_id, coach_ai_review_period_request_id,
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  call_sequence, call_kind, prompt_sha256, prompt_byte_length,
  maximum_output_tokens, state, provider_response_id, input_tokens,
  cached_input_tokens, cache_write_input_tokens, output_tokens, total_tokens,
  failure_code, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'started', NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, ?, NULL)`).run(
        callId,
        input.requestId,
        attemptId,
        input.scope.userId,
        input.scope.workspaceId,
        scopeAccountId,
        next + 1,
        input.kind,
        digest(reservationText),
        Buffer.byteLength(reservationText, "utf8"),
        input.maximumOutputTokens,
        timestamp,
      );
      return Object.freeze({ callId, attemptId, requestId: input.requestId, kind: input.kind });
    });
  }

  completeProviderCall(
    scope: WorkspaceAccessScope,
    handle: CoachAiReviewAuthoredCallHandle,
    usage: CoachAiGenerationUsage,
    providerResponseId: string | null,
    now = new Date(),
  ): void {
    if (!validUsage(usage) || !providerResponseId) {
      this.failProviderCall(scope, handle, "TRADERLINK_COACH_AUTHORING_USAGE_UNKNOWN", now);
      throw new Error("TRADERLINK_COACH_AUTHORING_USAGE_UNKNOWN");
    }
    const timestamp = createCanonicalUtcTimestamp(now);
    const scopeAccountId = accountId(scope);
    this.transaction(() => {
      const call = this.database.prepare<[string, string, string, string], Readonly<{
        state: "started" | "completed" | "failed" | "unknown";
      }>>(`SELECT state FROM coach_ai_review_authored_provider_calls_v4
WHERE coach_ai_review_authored_provider_call_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        handle.callId, scope.userId, scope.workspaceId, scopeAccountId,
      );
      if (!call || call.state !== "started") platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      this.database.prepare(`UPDATE coach_ai_review_authored_provider_calls_v4
SET state = 'completed', provider_response_id = ?, input_tokens = ?,
  cached_input_tokens = ?, cache_write_input_tokens = ?, output_tokens = ?,
  total_tokens = ?, failure_code = NULL, finalized_at_utc = ?
WHERE coach_ai_review_authored_provider_call_id = ? AND state = 'started'`).run(
        providerResponseId,
        usage.inputTokens,
        usage.cachedInputTokens,
        usage.cacheWriteInputTokens,
        usage.outputTokens,
        usage.totalTokens,
        timestamp,
        handle.callId,
      );
      this.insertReceipt(scope, handle.attemptId, usage, timestamp);
      const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = 'TRADERLINK_COACH_AUTHORING_CALL_RECORDED',
  finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
        timestamp, handle.attemptId,
      );
      if (attempt.changes !== 1) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_generation_attempts_v2",
      });
      new CoachAiReviewProviderControlsRepository(this.database).finalizeFromReviewReceiptV2(
        scope,
        handle.attemptId,
        "failed",
        "TRADERLINK_COACH_AUTHORING_CALL_RECORDED",
        now,
      );
    });
  }

  failProviderCall(
    scope: WorkspaceAccessScope,
    handle: CoachAiReviewAuthoredCallHandle | undefined,
    code: string,
    now = new Date(),
  ): void {
    if (!handle) return;
    const timestamp = createCanonicalUtcTimestamp(now);
    const failure = failureCode(code);
    const scopeAccountId = accountId(scope);
    this.transaction(() => {
      this.database.prepare(`UPDATE coach_ai_review_authored_provider_calls_v4
SET state = 'unknown', provider_response_id = NULL, input_tokens = NULL,
  cached_input_tokens = NULL, cache_write_input_tokens = NULL,
  output_tokens = NULL, total_tokens = NULL, failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_authored_provider_call_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'started'`).run(
        failure, timestamp, handle.callId, scope.userId, scope.workspaceId, scopeAccountId,
      );
      const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ? AND state = 'pending'`).run(
        failure, timestamp, handle.attemptId,
      );
      if (attempt.changes === 1) {
        new CoachAiReviewProviderControlsRepository(this.database).failStartedWithoutUsageV2(
          scope,
          handle.attemptId,
          failure,
          now,
        );
      }
    });
  }

  issue(
    scope: WorkspaceAccessScope,
    requestId: string,
    output: CoachAiReviewAuthoredOutput,
    now = new Date(),
  ): CoachAiReviewAuthoredIssuedRecord {
    const snapshot = this.readSnapshot(scope, requestId);
    const expected = snapshot.reviewKind === "monthly"
      ? "traderlink_coach_monthly_ai_review_authored_output_v1"
      : "traderlink_coach_weekly_ai_review_authored_output_v1";
    if (output.contractVersion !== expected) {
      throw new Error("TRADERLINK_COACH_AUTHORING_OUTPUT_KIND_MISMATCH");
    }
    const outputJson = canonicalJson(output);
    const timestamp = createCanonicalUtcTimestamp(now);
    const issuedReviewId = createCanonicalUuidV4();
    const scopeAccountId = accountId(scope);
    return this.transaction(() => {
      const existing = this.readIssuedByRequestOrNull(scope, requestId);
      if (existing) return existing;
      this.database.prepare(`INSERT INTO coach_ai_issued_reviews_v4 (
  coach_ai_issued_review_id, coach_ai_review_period_request_id, user_id,
  workspace_id, account_id, authoring_contract_version, provider_key, model_id,
  output_contract_version, output_sha256, output_json, issued_at_utc
) VALUES (?, ?, ?, ?, ?, 'evidence_authoring_v4', 'openai_direct', ?, ?, ?, ?, ?)`).run(
        issuedReviewId,
        requestId,
        scope.userId,
        scope.workspaceId,
        scopeAccountId,
        snapshot.modelId,
        output.contractVersion,
        digest(outputJson),
        outputJson,
        timestamp,
      );
      const request = this.database.prepare(`UPDATE coach_ai_review_period_requests_v2
SET state = 'issued', terminal_failure_code = NULL, issued_review_id = ?,
  finalized_at_utc = ?
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).run(
        issuedReviewId,
        timestamp,
        requestId,
        scope.userId,
        scope.workspaceId,
        scopeAccountId,
      );
      if (request.changes !== 1) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_period_requests_v2",
      });
      new PlatformNotificationRepository(this.database).create({
        category: "ai_review",
        destinationPath: "/ai-reviews",
        journalAccountId: scopeAccountId,
        kind: "ai_review_ready",
        occurredAtUtc: timestamp,
        scope,
        sourceEventKey: `ai_review_ready_${issuedReviewId}`,
        summary: `Your ${snapshot.reviewKind === "monthly" ? "monthly" : "weekly"} AI Review is ready to read.`,
        title: "Your AI Review is ready",
      });
      return this.readIssued(scope, issuedReviewId);
    });
  }

  readIssued(scope: WorkspaceAccessScope, issuedReviewId: string): CoachAiReviewAuthoredIssuedRecord {
    assertCanonicalUuidV4(issuedReviewId, "issuedReviewId");
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_ai_review_period_request_id: string;
      review_kind: CoachAiReviewKindV2;
      period_start_date: string;
      period_end_date: string;
      model_id: string;
      output_sha256: string;
      output_json: string;
      issued_at_utc: string;
    }>>(`SELECT review.coach_ai_review_period_request_id, request.review_kind,
  request.period_start_date, request.period_end_date, review.model_id,
  review.output_sha256, review.output_json, review.issued_at_utc
FROM coach_ai_issued_reviews_v4 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
 AND request.user_id = review.user_id AND request.workspace_id = review.workspace_id
 AND request.account_id = review.account_id
WHERE review.coach_ai_issued_review_id = ? AND review.user_id = ?
  AND review.workspace_id = ? AND review.account_id = ?`).get(
        issuedReviewId, scope.userId, scope.workspaceId, accountId(scope),
      );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    if (digest(row.output_json) !== row.output_sha256) {
      throw new Error("TRADERLINK_COACH_AUTHORING_OUTPUT_DIGEST_INVALID");
    }
    return Object.freeze({
      issuedReviewId,
      requestId: row.coach_ai_review_period_request_id,
      reviewKind: row.review_kind,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      modelId: row.model_id,
      output: parseOutput(row.output_json, row.review_kind),
      issuedAtUtc: row.issued_at_utc,
    });
  }

  listIssued(
    scope: WorkspaceAccessScope,
    input: Readonly<{ beforePeriodEndDate?: string; limit?: number }> = {},
  ): readonly CoachAiReviewAuthoredIssuedRecord[] {
    const limit = input.limit ?? 100;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const rows = this.database.prepare<[string, string, string, string, number], Readonly<{
      coach_ai_issued_review_id: string;
    }>>(`SELECT review.coach_ai_issued_review_id
FROM coach_ai_issued_reviews_v4 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
 AND request.user_id = review.user_id AND request.workspace_id = review.workspace_id
 AND request.account_id = review.account_id
WHERE review.user_id = ? AND review.workspace_id = ? AND review.account_id = ?
  AND request.period_end_date < ?
ORDER BY request.period_end_date DESC, review.issued_at_utc DESC
LIMIT ?`).all(
        scope.userId,
        scope.workspaceId,
        accountId(scope),
        input.beforePeriodEndDate ?? "9999-12-31",
        limit,
      );
    return Object.freeze(rows.map((row) => this.readIssued(scope,
      row.coach_ai_issued_review_id)));
  }

  private readIssuedByRequestOrNull(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewAuthoredIssuedRecord | null {
    const row = this.database.prepare<[string, string, string, string], Readonly<{
      coach_ai_issued_review_id: string;
    }>>(`SELECT coach_ai_issued_review_id FROM coach_ai_issued_reviews_v4
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        requestId, scope.userId, scope.workspaceId, accountId(scope),
      );
    return row ? this.readIssued(scope, row.coach_ai_issued_review_id) : null;
  }

  private insertReceipt(
    scope: WorkspaceAccessScope,
    attemptId: string,
    usage: Required<CoachAiGenerationUsage>,
    timestamp: string,
  ): void {
    const reservation = this.database.prepare<[string, string, string, string], Readonly<{
      provider_key: "openai_direct";
      model_id: string;
      input_cost_usd_per_million_tokens: string;
      cached_input_cost_usd_per_million_tokens: string;
      cache_write_input_cost_usd_per_million_tokens: string;
      output_cost_usd_per_million_tokens: string;
    }>>(`SELECT provider_key, model_id, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens
FROM coach_ai_review_generation_control_reservations_v2
WHERE coach_ai_review_generation_attempt_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        attemptId, scope.userId, scope.workspaceId, accountId(scope),
      );
    if (!reservation) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const estimatedCost = calculateCoachAiReviewEstimatedCost(usage, {
      providerKey: reservation.provider_key,
      modelId: reservation.model_id,
      inputCostUsdPerMillionTokens: reservation.input_cost_usd_per_million_tokens,
      cachedInputCostUsdPerMillionTokens: reservation.cached_input_cost_usd_per_million_tokens,
      cacheWriteInputCostUsdPerMillionTokens:
        reservation.cache_write_input_cost_usd_per_million_tokens,
      outputCostUsdPerMillionTokens: reservation.output_cost_usd_per_million_tokens,
      updatedAtUtc: timestamp,
    });
    if (estimatedCost === null) {
      throw new Error("TRADERLINK_COACH_AUTHORING_RECEIPT_COST_UNAVAILABLE");
    }
    this.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts_v2 (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc,
  reservation_overrun, input_token_overrun, output_token_overrun,
  total_token_overrun, cost_overrun_usd
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, NULL)`).run(
      createCanonicalUuidV4(),
      attemptId,
      usage.inputTokens,
      usage.cachedInputTokens,
      usage.cacheWriteInputTokens,
      usage.outputTokens,
      usage.totalTokens,
      reservation.input_cost_usd_per_million_tokens,
      reservation.cached_input_cost_usd_per_million_tokens,
      reservation.cache_write_input_cost_usd_per_million_tokens,
      reservation.output_cost_usd_per_million_tokens,
      estimatedCost,
      timestamp,
    );
  }

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }
}
