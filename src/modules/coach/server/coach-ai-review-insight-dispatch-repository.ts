import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { CoachAiReviewOpenAiTransportAudit } from
  "./ai-review-insights/coach-ai-review-openai-plan-selector";

const FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,95}$/u;
const MINIMUM_LEASE_DURATION_MS = 5_000;
const MAXIMUM_LEASE_DURATION_MS = 10 * 60 * 1_000;

type DispatchRow = Readonly<{
  coach_ai_review_insight_provider_dispatch_id: string;
  coach_ai_review_period_request_id: string;
  coach_ai_review_generation_attempt_id: string;
  recovery_epoch: string;
  lease_generation: number;
  fencing_token_sha256: string;
  lease_acquired_at_utc: string;
  lease_expires_at_utc: string;
  transport_may_have_started_at_utc: string | null;
  selection_terminal_at_utc: string | null;
  request_body_digest_sha256: string | null;
  request_body_byte_length: number | null;
  provider_response_id: string | null;
  lease_state: "leased" | "transport_authorized" | "selection_terminal" | "settled";
  usage_settlement_state:
    | "not_dispatched"
    | "no_usage"
    | "receipt_recorded"
    | "unknown_after_dispatch"
    | "reconciled_no_usage"
    | "reconciled_receipt";
  failure_code: string | null;
  created_at_utc: string;
  updated_at_utc: string;
}>;

export type CoachAiReviewInsightDispatchRecord = Readonly<{
  dispatchId: string;
  requestId: string;
  attemptId: string;
  recoveryEpoch: string;
  leaseGeneration: number;
  leaseAcquiredAtUtc: string;
  leaseExpiresAtUtc: string;
  transportMayHaveStartedAtUtc: string | null;
  selectionTerminalAtUtc: string | null;
  requestBodyDigestSha256: string | null;
  requestBodyByteLength: number | null;
  providerResponseId: string | null;
  leaseState: DispatchRow["lease_state"];
  usageSettlementState: DispatchRow["usage_settlement_state"];
  failureCode: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type CoachAiReviewInsightDispatchLease = Readonly<{
  dispatch: CoachAiReviewInsightDispatchRecord;
  fencingToken: string;
}>;

export type CoachAiReviewInsightDispatchFence = Readonly<{
  dispatchId: string;
  requestId: string;
  attemptId: string;
  recoveryEpoch: string;
  leaseGeneration: number;
  fencingToken: string;
}>;

const DISPATCH_SELECT = `SELECT
  coach_ai_review_insight_provider_dispatch_id,
  coach_ai_review_period_request_id, coach_ai_review_generation_attempt_id,
  recovery_epoch, lease_generation, fencing_token_sha256,
  lease_acquired_at_utc, lease_expires_at_utc,
  transport_may_have_started_at_utc, selection_terminal_at_utc,
  request_body_digest_sha256, request_body_byte_length,
  provider_response_id, lease_state, usage_settlement_state, failure_code,
  created_at_utc, updated_at_utc
FROM coach_ai_review_insight_provider_dispatches`;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function assertFailureCode(value: string): void {
  if (!FAILURE_CODE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "failureCode",
    });
  }
}

function fencingTokenDigest(token: string): string {
  return createHash("sha256")
    .update(`traderlink_coach_ai_review_dispatch_fence_v1\n${token}\n`, "utf8")
    .digest("hex");
}

function newFencingToken(): string {
  return randomBytes(32).toString("base64url");
}

function monotonicTimestamp(now: Date, previous: string): string {
  const actual = now.getTime();
  const prior = new Date(previous).getTime();
  return createCanonicalUtcTimestamp(new Date(Math.max(actual, prior + 1)));
}

function record(row: DispatchRow): CoachAiReviewInsightDispatchRecord {
  return Object.freeze({
    dispatchId: row.coach_ai_review_insight_provider_dispatch_id,
    requestId: row.coach_ai_review_period_request_id,
    attemptId: row.coach_ai_review_generation_attempt_id,
    recoveryEpoch: row.recovery_epoch,
    leaseGeneration: row.lease_generation,
    leaseAcquiredAtUtc: row.lease_acquired_at_utc,
    leaseExpiresAtUtc: row.lease_expires_at_utc,
    transportMayHaveStartedAtUtc: row.transport_may_have_started_at_utc,
    selectionTerminalAtUtc: row.selection_terminal_at_utc,
    requestBodyDigestSha256: row.request_body_digest_sha256,
    requestBodyByteLength: row.request_body_byte_length,
    providerResponseId: row.provider_response_id,
    leaseState: row.lease_state,
    usageSettlementState: row.usage_settlement_state,
    failureCode: row.failure_code,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class CoachAiReviewInsightDispatchRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  acquire(
    scope: WorkspaceAccessScope,
    requestId: string,
    attemptId: string,
    leaseDurationMs: number,
    now = new Date(),
  ): Readonly<{
    state: "acquired" | "in_progress" | "selection_terminal" | "recovery_required";
    lease: CoachAiReviewInsightDispatchLease | null;
    dispatch: CoachAiReviewInsightDispatchRecord;
  }> {
    assertCanonicalUuidV4(requestId, "requestId");
    assertCanonicalUuidV4(attemptId, "attemptId");
    if (!Number.isSafeInteger(leaseDurationMs) ||
        leaseDurationMs < MINIMUM_LEASE_DURATION_MS ||
        leaseDurationMs > MAXIMUM_LEASE_DURATION_MS) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "leaseDurationMs",
      });
    }
    const accountId = activeAccountId(scope);
    return this.transaction(() => {
      const recovery = this.database.prepare<[], Readonly<{
        recovery_epoch: string;
      }>>(`SELECT recovery_epoch FROM coach_ai_review_dispatch_recovery_state
WHERE state_key = 'singleton'`).get();
      if (!recovery) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_dispatch_recovery_state",
      });
      const current = this.database.prepare<[
        string, string, string, string
      ], DispatchRow>(`${DISPATCH_SELECT}
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
ORDER BY lease_generation DESC LIMIT 1`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      const nowUtc = createCanonicalUtcTimestamp(now);
      if (current && (current.lease_state === "selection_terminal" ||
          current.usage_settlement_state === "unknown_after_dispatch" ||
          (current.transport_may_have_started_at_utc !== null &&
            current.lease_state === "settled"))) {
        return Object.freeze({
          state: "selection_terminal" as const,
          lease: null,
          dispatch: record(current),
        });
      }
      if (current && current.lease_state !== "settled" &&
          current.recovery_epoch !== recovery.recovery_epoch) {
        return Object.freeze({
          state: "recovery_required" as const,
          lease: null,
          dispatch: record(current),
        });
      }
      if (current && current.lease_state === "transport_authorized") {
        return Object.freeze({
          state: current.lease_expires_at_utc > nowUtc
            ? "in_progress" as const
            : "recovery_required" as const,
          lease: null,
          dispatch: record(current),
        });
      }
      if (current && current.lease_state === "leased" &&
          current.lease_expires_at_utc > nowUtc) {
        return Object.freeze({
          state: "in_progress" as const,
          lease: null,
          dispatch: record(current),
        });
      }
      if (current && current.lease_state === "leased" &&
          current.coach_ai_review_generation_attempt_id !== attemptId) {
        return Object.freeze({
          state: "recovery_required" as const,
          lease: null,
          dispatch: record(current),
        });
      }
      const fencingToken = newFencingToken();
      const fencingDigest = fencingTokenDigest(fencingToken);
      if (current && current.lease_state === "leased") {
        const acquiredAtUtc = monotonicTimestamp(now, current.updated_at_utc);
        const leaseExpiresAtUtc = createCanonicalUtcTimestamp(new Date(
          new Date(acquiredAtUtc).getTime() + leaseDurationMs,
        ));
        const update = this.database.prepare(`UPDATE
  coach_ai_review_insight_provider_dispatches
SET recovery_epoch = ?, lease_generation = lease_generation + 1,
  fencing_token_sha256 = ?, lease_acquired_at_utc = ?,
  lease_expires_at_utc = ?, updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND lease_state = 'leased' AND lease_expires_at_utc <= ?`).run(
          recovery.recovery_epoch,
          fencingDigest,
          acquiredAtUtc,
          leaseExpiresAtUtc,
          acquiredAtUtc,
          current.coach_ai_review_insight_provider_dispatch_id,
          scope.userId,
          scope.workspaceId,
          accountId,
          nowUtc,
        );
        if (update.changes !== 1) platformFailure(
          "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
          { table: "coach_ai_review_insight_provider_dispatches" },
        );
        const dispatch = this.read(scope,
          current.coach_ai_review_insight_provider_dispatch_id);
        return Object.freeze({
          state: "acquired" as const,
          lease: Object.freeze({ dispatch, fencingToken }),
          dispatch,
        });
      }
      const maximum = this.database.prepare<[string], Readonly<{
        maximum: number;
      }>>(`SELECT COALESCE(MAX(lease_generation), 0) AS maximum
FROM coach_ai_review_insight_provider_dispatches
WHERE coach_ai_review_period_request_id = ?`).get(requestId)?.maximum ?? 0;
      const createdAtUtc = nowUtc;
      const expiresAtUtc = createCanonicalUtcTimestamp(new Date(
        now.getTime() + leaseDurationMs,
      ));
      const dispatchId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_insight_provider_dispatches (
  coach_ai_review_insight_provider_dispatch_id,
  coach_ai_review_period_request_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, recovery_epoch, lease_generation,
  fencing_token_sha256, lease_acquired_at_utc, lease_expires_at_utc,
  transport_may_have_started_at_utc, selection_terminal_at_utc,
  request_body_digest_sha256, request_body_byte_length,
  provider_response_id, lease_state, usage_settlement_state, failure_code,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL,
  NULL, 'leased', 'not_dispatched', NULL, ?, ?)`).run(
        dispatchId,
        requestId,
        attemptId,
        scope.userId,
        scope.workspaceId,
        accountId,
        recovery.recovery_epoch,
        maximum + 1,
        fencingDigest,
        createdAtUtc,
        expiresAtUtc,
        createdAtUtc,
        createdAtUtc,
      );
      const dispatch = this.read(scope, dispatchId);
      return Object.freeze({
        state: "acquired" as const,
        lease: Object.freeze({ dispatch, fencingToken }),
        dispatch,
      });
    });
  }

  authorizeTransport(
    scope: WorkspaceAccessScope,
    fence: CoachAiReviewInsightDispatchFence,
    audit: CoachAiReviewOpenAiTransportAudit,
    now = new Date(),
  ): CoachAiReviewInsightDispatchRecord {
    if (audit.fetchCount !== 1 ||
        !Number.isSafeInteger(audit.requestBodyByteLength) ||
        audit.requestBodyByteLength < 1 ||
        !/^[0-9a-f]{64}$/u.test(audit.requestBodyDigestSha256)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "transportAudit",
      });
    }
    return this.transition(scope, fence, now, (timestamp, tokenDigest) =>
      this.database.prepare(`UPDATE coach_ai_review_insight_provider_dispatches
SET lease_state = 'transport_authorized',
  transport_may_have_started_at_utc = ?, request_body_digest_sha256 = ?,
  request_body_byte_length = ?, updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND coach_ai_review_period_request_id = ?
  AND coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND recovery_epoch = ? AND lease_generation = ?
  AND fencing_token_sha256 = ? AND lease_state = 'leased'
  AND lease_expires_at_utc > ?`).run(
        timestamp,
        audit.requestBodyDigestSha256,
        audit.requestBodyByteLength,
        timestamp,
        fence.dispatchId,
        fence.requestId,
        fence.attemptId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
        fence.recoveryEpoch,
        fence.leaseGeneration,
        tokenDigest,
        createCanonicalUtcTimestamp(now),
      ));
  }

  settleBeforeTransport(
    scope: WorkspaceAccessScope,
    fence: CoachAiReviewInsightDispatchFence,
    failureCode: string,
    now = new Date(),
  ): CoachAiReviewInsightDispatchRecord {
    assertFailureCode(failureCode);
    return this.transition(scope, fence, now, (timestamp, tokenDigest) => {
      const accountId = activeAccountId(scope);
      const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
        failureCode,
        timestamp,
        fence.attemptId,
        fence.requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      const reservation = this.database.prepare(`UPDATE
  coach_ai_review_generation_control_reservations_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state IN ('reserved', 'started')`).run(
        failureCode,
        timestamp,
        fence.attemptId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      if (attempt.changes !== 1 || reservation.changes !== 1) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_generation_attempts_v2",
        });
      }
      return this.database.prepare(`UPDATE coach_ai_review_insight_provider_dispatches
SET lease_state = 'settled', selection_terminal_at_utc = ?,
  usage_settlement_state = 'no_usage', failure_code = ?, updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND coach_ai_review_period_request_id = ?
  AND coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND recovery_epoch = ? AND lease_generation = ?
  AND fencing_token_sha256 = ? AND lease_state = 'leased'`).run(
        timestamp,
        failureCode,
        timestamp,
        fence.dispatchId,
        fence.requestId,
        fence.attemptId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
        fence.recoveryEpoch,
        fence.leaseGeneration,
        tokenDigest,
      );
    });
  }

  markSelectionTerminalWithUnknownUsage(
    scope: WorkspaceAccessScope,
    fence: CoachAiReviewInsightDispatchFence,
    failureCode: string,
    providerResponseId: string | null,
    now = new Date(),
  ): CoachAiReviewInsightDispatchRecord {
    assertFailureCode(failureCode);
    if (providerResponseId !== null && !/^[A-Za-z0-9_-]{1,160}$/u.test(providerResponseId)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "providerResponseId",
      });
    }
    return this.transition(scope, fence, now, (timestamp, tokenDigest) => {
      const accountId = activeAccountId(scope);
      const dispatch = this.database.prepare(`UPDATE coach_ai_review_insight_provider_dispatches
SET lease_state = 'selection_terminal', selection_terminal_at_utc = ?,
  provider_response_id = ?, usage_settlement_state = 'unknown_after_dispatch',
  failure_code = ?, updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND coach_ai_review_period_request_id = ?
  AND coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND recovery_epoch = ? AND lease_generation = ?
  AND fencing_token_sha256 = ? AND lease_state = 'transport_authorized'`).run(
        timestamp,
        providerResponseId,
        failureCode,
        timestamp,
        fence.dispatchId,
        fence.requestId,
        fence.attemptId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
        fence.recoveryEpoch,
        fence.leaseGeneration,
        tokenDigest,
      );
      if (dispatch.changes !== 1) return dispatch;
      const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
        failureCode,
        timestamp,
        fence.attemptId,
        fence.requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      if (attempt.changes !== 1) platformFailure(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
        { table: "coach_ai_review_generation_attempts_v2" },
      );
      return dispatch;
    });
  }

  read(
    scope: WorkspaceAccessScope,
    dispatchId: string,
  ): CoachAiReviewInsightDispatchRecord {
    assertCanonicalUuidV4(dispatchId, "dispatchId");
    const row = this.database.prepare<[
      string, string, string, string
    ], DispatchRow>(`${DISPATCH_SELECT}
WHERE coach_ai_review_insight_provider_dispatch_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        dispatchId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
      );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return record(row);
  }

  private transition(
    scope: WorkspaceAccessScope,
    fence: CoachAiReviewInsightDispatchFence,
    now: Date,
    update: (
      timestamp: string,
      tokenDigest: string,
    ) => Database.RunResult,
  ): CoachAiReviewInsightDispatchRecord {
    assertCanonicalUuidV4(fence.dispatchId, "dispatchId");
    assertCanonicalUuidV4(fence.requestId, "requestId");
    assertCanonicalUuidV4(fence.attemptId, "attemptId");
    if (!/^[0-9a-f]{64}$/u.test(fence.recoveryEpoch) ||
        !Number.isSafeInteger(fence.leaseGeneration) ||
        fence.leaseGeneration < 1 || fence.fencingToken.length < 32) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "dispatchFence",
      });
    }
    return this.transaction(() => {
      const row = this.database.prepare<[
        string, string, string, string
      ], DispatchRow>(`${DISPATCH_SELECT}
WHERE coach_ai_review_insight_provider_dispatch_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        fence.dispatchId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
      );
      if (!row || row.coach_ai_review_period_request_id !== fence.requestId ||
          row.coach_ai_review_generation_attempt_id !== fence.attemptId ||
          row.recovery_epoch !== fence.recoveryEpoch ||
          row.lease_generation !== fence.leaseGeneration ||
          row.fencing_token_sha256 !== fencingTokenDigest(fence.fencingToken)) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      const timestamp = monotonicTimestamp(now, row.updated_at_utc);
      const result = update(timestamp, row.fencing_token_sha256);
      if (result.changes !== 1) platformFailure(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
        { table: "coach_ai_review_insight_provider_dispatches" },
      );
      return this.read(scope, fence.dispatchId);
    });
  }
}
