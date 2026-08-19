import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type Database from "better-sqlite3";

import { createCanonicalUtcTimestamp, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const RECOVERED_BEFORE_TRANSPORT =
  "TRADERLINK_COACH_DISPATCH_RECOVERED_BEFORE_TRANSPORT" as const;
const UNKNOWN_AFTER_TRANSPORT =
  "TRADERLINK_COACH_USAGE_UNKNOWN_AFTER_DISPATCH" as const;

type RecoveryStateRow = Readonly<{
  recovery_epoch: string;
  recovery_generation: number;
  transitioned_at_utc: string;
}>;

type RecoverableDispatchRow = Readonly<{
  coach_ai_review_insight_provider_dispatch_id: string;
  coach_ai_review_period_request_id: string;
  coach_ai_review_generation_attempt_id: string;
  user_id: string;
  workspace_id: string;
  account_id: string;
  lease_state: "leased" | "transport_authorized";
  updated_at_utc: string;
}>;

function nextTimestamp(now: Date, previous: string): string {
  return createCanonicalUtcTimestamp(new Date(Math.max(
    now.getTime(),
    new Date(previous).getTime() + 1,
  )));
}

function recoveryFenceDigest(): string {
  return createHash("sha256").update(Buffer.concat([
    Buffer.from("traderlink_coach_ai_review_recovery_fence_v1\n", "utf8"),
    randomBytes(32),
  ])).digest("hex");
}

export type CoachAiReviewDispatchStartupRecovery = Readonly<{
  previousRecoveryEpoch: string;
  recoveryEpoch: string;
  recoveryGeneration: number;
  recoveredBeforeTransportCount: number;
  unknownAfterTransportCount: number;
  transitionedAtUtc: string;
}>;

export class CoachAiReviewInsightDispatchRecovery {
  constructor(private readonly database: Database.Database) {}

  rotateEpochAndReconcile(
    now = new Date(),
  ): CoachAiReviewDispatchStartupRecovery {
    if (this.database.inTransaction) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "dispatch_recovery_requires_exclusive_transaction",
      });
    }
    return this.database.transaction(() => {
      const previous = this.database.prepare<[], RecoveryStateRow>(`SELECT
  recovery_epoch, recovery_generation, transitioned_at_utc
FROM coach_ai_review_dispatch_recovery_state
WHERE state_key = 'singleton'`).get();
      if (!previous) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        table: "coach_ai_review_dispatch_recovery_state",
      });
      const recoveryEpoch = randomBytes(32).toString("hex");
      const transitionedAtUtc = nextTimestamp(now, previous.transitioned_at_utc);
      const stateUpdate = this.database.prepare(`UPDATE
  coach_ai_review_dispatch_recovery_state
SET recovery_epoch = ?, recovery_generation = recovery_generation + 1,
  transitioned_at_utc = ?
WHERE state_key = 'singleton' AND recovery_epoch = ?
  AND recovery_generation = ?`).run(
        recoveryEpoch,
        transitionedAtUtc,
        previous.recovery_epoch,
        previous.recovery_generation,
      );
      if (stateUpdate.changes !== 1) platformFailure(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
        { table: "coach_ai_review_dispatch_recovery_state" },
      );

      const rows = this.database.prepare<[], RecoverableDispatchRow>(`SELECT
  coach_ai_review_insight_provider_dispatch_id,
  coach_ai_review_period_request_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, lease_state, updated_at_utc
FROM coach_ai_review_insight_provider_dispatches
WHERE lease_state IN ('leased', 'transport_authorized')
ORDER BY created_at_utc, coach_ai_review_insight_provider_dispatch_id`).all();
      let recoveredBeforeTransportCount = 0;
      let unknownAfterTransportCount = 0;
      let logicalTimestamp = transitionedAtUtc;
      for (const row of rows) {
        logicalTimestamp = nextTimestamp(now, logicalTimestamp > row.updated_at_utc
          ? logicalTimestamp
          : row.updated_at_utc);
        if (row.lease_state === "leased") {
          this.recoverBeforeTransport(row, recoveryEpoch, logicalTimestamp);
          recoveredBeforeTransportCount += 1;
        } else {
          this.recoverAfterTransport(row, recoveryEpoch, logicalTimestamp);
          unknownAfterTransportCount += 1;
        }
      }
      return Object.freeze({
        previousRecoveryEpoch: previous.recovery_epoch,
        recoveryEpoch,
        recoveryGeneration: previous.recovery_generation + 1,
        recoveredBeforeTransportCount,
        unknownAfterTransportCount,
        transitionedAtUtc,
      });
    }).exclusive();
  }

  private recoverBeforeTransport(
    row: RecoverableDispatchRow,
    recoveryEpoch: string,
    timestamp: string,
  ): void {
    const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
      RECOVERED_BEFORE_TRANSPORT,
      timestamp,
      row.coach_ai_review_generation_attempt_id,
      row.coach_ai_review_period_request_id,
      row.user_id,
      row.workspace_id,
      row.account_id,
    );
    const reservation = this.database.prepare(`UPDATE
  coach_ai_review_generation_control_reservations_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND state IN ('reserved', 'started')`).run(
      RECOVERED_BEFORE_TRANSPORT,
      timestamp,
      row.coach_ai_review_generation_attempt_id,
      row.user_id,
      row.workspace_id,
      row.account_id,
    );
    const dispatch = this.database.prepare(`UPDATE
  coach_ai_review_insight_provider_dispatches
SET recovery_epoch = ?, lease_generation = lease_generation + 1,
  fencing_token_sha256 = ?, lease_state = 'settled',
  selection_terminal_at_utc = ?, usage_settlement_state = 'no_usage',
  failure_code = ?, updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND lease_state = 'leased'`).run(
      recoveryEpoch,
      recoveryFenceDigest(),
      timestamp,
      RECOVERED_BEFORE_TRANSPORT,
      timestamp,
      row.coach_ai_review_insight_provider_dispatch_id,
    );
    if (attempt.changes !== 1 || reservation.changes !== 1 ||
        dispatch.changes !== 1) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "dispatch_recovery_before_transport",
      });
    }
  }

  private recoverAfterTransport(
    row: RecoverableDispatchRow,
    recoveryEpoch: string,
    timestamp: string,
  ): void {
    const dispatch = this.database.prepare(`UPDATE
  coach_ai_review_insight_provider_dispatches
SET recovery_epoch = ?, lease_generation = lease_generation + 1,
  retired_fencing_token_sha256 = fencing_token_sha256,
  fencing_token_sha256 = ?, lease_state = 'selection_terminal',
  selection_terminal_at_utc = ?,
  usage_settlement_state = 'unknown_after_dispatch', failure_code = ?,
  updated_at_utc = ?
WHERE coach_ai_review_insight_provider_dispatch_id = ?
  AND lease_state = 'transport_authorized'`).run(
      recoveryEpoch,
      recoveryFenceDigest(),
      timestamp,
      UNKNOWN_AFTER_TRANSPORT,
      timestamp,
      row.coach_ai_review_insight_provider_dispatch_id,
    );
    const attempt = this.database.prepare(`UPDATE coach_ai_review_generation_attempts_v2
SET state = 'failed', failure_code = ?, finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?
  AND coach_ai_review_period_request_id = ?
  AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND generation_contract_version = 'insight_selection_v3'
  AND state = 'pending'`).run(
      UNKNOWN_AFTER_TRANSPORT,
      timestamp,
      row.coach_ai_review_generation_attempt_id,
      row.coach_ai_review_period_request_id,
      row.user_id,
      row.workspace_id,
      row.account_id,
    );
    if (dispatch.changes !== 1 || attempt.changes !== 1) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "dispatch_recovery_after_transport",
      });
    }
  }
}
