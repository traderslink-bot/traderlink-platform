import "server-only";

import type Database from "better-sqlite3";

import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type CoachAiReviewGenerationContractVersion =
  | "openai_direct_v2"
  | "insight_selection_v3";

export type CoachAiReviewGenerationContractState = Readonly<{
  schemaAvailable: boolean;
  activeGenerationContractVersion: CoachAiReviewGenerationContractVersion;
  minimumReaderContractVersion: CoachAiReviewGenerationContractVersion;
  transitionGeneration: 1 | 2;
  transitionedAtUtc: string | null;
}>;

export type CoachAiReviewCutoverReadiness = Readonly<{
  ready: boolean;
  state: CoachAiReviewGenerationContractState;
  missingSchemaObjectCount: number;
  enabledPlatformFeatureCount: number;
  pendingV2RequestCount: number;
  pendingV2AttemptCount: number;
  activeReservationCount: number;
  unreconciledV2UsageCount: number;
  orphanV2ReceiptCount: number;
  prematureV3RequestCount: number;
  foreignKeyViolationCount: number;
  quickCheckOk: boolean;
}>;

export type CoachAiReviewActivationBoundary = Readonly<{
  state: CoachAiReviewGenerationContractState;
  firstV3RequestId: string | null;
  firstV3RequestCreatedAtUtc: string | null;
  firstV3IssuedReviewId: string | null;
  firstV3IssuedAtUtc: string | null;
}>;

const REQUIRED_SCHEMA_OBJECTS = Object.freeze([
  ["table", "coach_ai_review_generation_contract_state"],
  ["table", "coach_ai_review_dispatch_recovery_state"],
  ["table", "coach_ai_review_insight_snapshots"],
  ["table", "coach_ai_review_insight_provider_dispatches"],
  ["table", "coach_ai_review_insight_selection_audits"],
  ["table", "coach_ai_issued_reviews_v3"],
  ["trigger", "coach_ai_review_generation_contract_state_transition"],
  ["trigger", "coach_ai_review_period_requests_generation_contract_insert"],
  ["trigger", "coach_ai_review_generation_attempts_generation_contract_scope"],
  ["trigger", "coach_ai_issued_reviews_v2_generation_contract_scope"],
  ["trigger", "coach_ai_review_period_requests_issued_generation_scope"],
] as const);

type ContractStateRow = Readonly<{
  active_generation_contract_version: CoachAiReviewGenerationContractVersion;
  minimum_reader_contract_version: CoachAiReviewGenerationContractVersion;
  transition_generation: 1 | 2;
  transitioned_at_utc: string;
}>;

function scalar(database: Database.Database, sql: string): number {
  return database.prepare<[], Readonly<{ count: number }>>(sql).get()?.count ?? 0;
}

export class CoachAiReviewGenerationContractRepository {
  constructor(private readonly database: Database.Database) {}

  read(): CoachAiReviewGenerationContractState {
    if (!this.tableExists("coach_ai_review_generation_contract_state")) {
      return Object.freeze({
        schemaAvailable: false,
        activeGenerationContractVersion: "openai_direct_v2" as const,
        minimumReaderContractVersion: "openai_direct_v2" as const,
        transitionGeneration: 1 as const,
        transitionedAtUtc: null,
      });
    }
    const rows = this.database.prepare<[], ContractStateRow>(`SELECT
  active_generation_contract_version, minimum_reader_contract_version,
  transition_generation, transitioned_at_utc
FROM coach_ai_review_generation_contract_state
WHERE state_key = 'singleton'`).all();
    if (rows.length !== 1) this.integrity("generationContractSingleton");
    const row = rows[0]!;
    const expectedGeneration = row.active_generation_contract_version ===
      "insight_selection_v3" ? 2 : 1;
    if (row.minimum_reader_contract_version !== row.active_generation_contract_version ||
        row.transition_generation !== expectedGeneration) {
      this.integrity("generationContractState");
    }
    return Object.freeze({
      schemaAvailable: true,
      activeGenerationContractVersion: row.active_generation_contract_version,
      minimumReaderContractVersion: row.minimum_reader_contract_version,
      transitionGeneration: row.transition_generation,
      transitionedAtUtc: row.transitioned_at_utc,
    });
  }

  readCutoverReadiness(): CoachAiReviewCutoverReadiness {
    const state = this.read();
    if (!state.schemaAvailable) {
      return Object.freeze({
        ready: false,
        state,
        missingSchemaObjectCount: REQUIRED_SCHEMA_OBJECTS.length,
        enabledPlatformFeatureCount: 0,
        pendingV2RequestCount: 0,
        pendingV2AttemptCount: 0,
        activeReservationCount: 0,
        unreconciledV2UsageCount: 0,
        orphanV2ReceiptCount: 0,
        prematureV3RequestCount: 0,
        foreignKeyViolationCount: 0,
        quickCheckOk: false,
      });
    }
    const missingSchemaObjectCount = REQUIRED_SCHEMA_OBJECTS.filter(([type, name]) =>
      !this.database.prepare<[string, string], Readonly<{ present: number }>>(
        "SELECT 1 AS present FROM sqlite_schema WHERE type = ? AND name = ?",
      ).get(type, name)).length;
    const enabledPlatformFeatureCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_feature_controls
WHERE scope_kind = 'platform' AND feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND enabled <> 0`);
    const pendingV2RequestCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_period_requests_v2
WHERE generation_contract_version = 'openai_direct_v2' AND state = 'pending'`);
    const pendingV2AttemptCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_generation_attempts_v2
WHERE generation_contract_version = 'openai_direct_v2' AND state = 'pending'`);
    const activeReservationCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_generation_control_reservations_v2
WHERE state IN ('reserved', 'started')`);
    const unreconciledV2UsageCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_generation_control_reservations_v2 reservation
JOIN coach_ai_review_generation_attempts_v2 attempt
  ON attempt.coach_ai_review_generation_attempt_id =
    reservation.coach_ai_review_generation_attempt_id
WHERE attempt.generation_contract_version = 'openai_direct_v2'
  AND reservation.started_at_utc IS NOT NULL
  AND (reservation.state NOT IN ('completed', 'failed')
    OR (reservation.state = 'completed' AND NOT EXISTS (
      SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
      WHERE receipt.coach_ai_review_generation_attempt_id =
        reservation.coach_ai_review_generation_attempt_id
    )))`);
    const orphanV2ReceiptCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_generation_attempt_receipts_v2 receipt
LEFT JOIN coach_ai_review_generation_attempts_v2 attempt
  ON attempt.coach_ai_review_generation_attempt_id =
    receipt.coach_ai_review_generation_attempt_id
LEFT JOIN coach_ai_review_generation_control_reservations_v2 reservation
  ON reservation.coach_ai_review_generation_attempt_id =
    receipt.coach_ai_review_generation_attempt_id
WHERE attempt.coach_ai_review_generation_attempt_id IS NULL
  OR reservation.coach_ai_review_generation_control_reservation_id IS NULL
  OR reservation.started_at_utc IS NULL`);
    const prematureV3RequestCount = scalar(this.database, `SELECT COUNT(*) AS count
FROM coach_ai_review_period_requests_v2
WHERE generation_contract_version = 'insight_selection_v3'`);
    const foreignKeyViolationCount = (
      this.database.pragma("foreign_key_check") as readonly unknown[]
    ).length;
    const quickCheck = this.database.pragma("quick_check(1)") as readonly Readonly<{
      quick_check: string;
    }>[];
    const quickCheckOk = quickCheck.length === 1 && quickCheck[0]?.quick_check === "ok";
    const counts = [
      missingSchemaObjectCount,
      enabledPlatformFeatureCount,
      pendingV2RequestCount,
      pendingV2AttemptCount,
      activeReservationCount,
      unreconciledV2UsageCount,
      orphanV2ReceiptCount,
      prematureV3RequestCount,
      foreignKeyViolationCount,
    ];
    return Object.freeze({
      ready: state.activeGenerationContractVersion === "openai_direct_v2" &&
        state.minimumReaderContractVersion === "openai_direct_v2" &&
        state.transitionGeneration === 1 && counts.every((count) => count === 0) &&
        quickCheckOk,
      state,
      missingSchemaObjectCount,
      enabledPlatformFeatureCount,
      pendingV2RequestCount,
      pendingV2AttemptCount,
      activeReservationCount,
      unreconciledV2UsageCount,
      orphanV2ReceiptCount,
      prematureV3RequestCount,
      foreignKeyViolationCount,
      quickCheckOk,
    });
  }

  activateV3(input: Readonly<{
    requestIntakeStopped: true;
    verifiedBackupCompleted: true;
    oldProcessesStopped: true;
    v2ReadReconciliationCompleted: true;
    now?: Date;
  }>): CoachAiReviewGenerationContractState {
    if (input.requestIntakeStopped !== true ||
        input.verifiedBackupCompleted !== true ||
        input.oldProcessesStopped !== true ||
        input.v2ReadReconciliationCompleted !== true) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "aiReviewCutoverConfirmation",
      });
    }
    if (this.database.inTransaction) this.integrity("cutoverRequiresExclusiveTransaction");
    return this.database.transaction(() => {
      const readiness = this.readCutoverReadiness();
      if (!readiness.ready || !readiness.state.transitionedAtUtc) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_generation_contract_state",
          check: "cutoverReadiness",
        });
      }
      const requested = input.now ?? new Date();
      const transitionedAtUtc = createCanonicalUtcTimestamp(new Date(Math.max(
        requested.getTime(),
        new Date(readiness.state.transitionedAtUtc).getTime() + 1,
      )));
      const result = this.database.prepare(`UPDATE coach_ai_review_generation_contract_state
SET active_generation_contract_version = 'insight_selection_v3',
  minimum_reader_contract_version = 'insight_selection_v3',
  transition_generation = 2, transitioned_at_utc = ?
WHERE state_key = 'singleton' AND transition_generation = 1
  AND active_generation_contract_version = 'openai_direct_v2'
  AND minimum_reader_contract_version = 'openai_direct_v2'`).run(transitionedAtUtc);
      if (result.changes !== 1) this.integrity("cutoverWinner");
      return this.read();
    }).exclusive();
  }

  readActivationBoundary(): CoachAiReviewActivationBoundary {
    const state = this.read();
    const request = state.schemaAvailable
      ? this.database.prepare<[], Readonly<{
          coach_ai_review_period_request_id: string;
          created_at_utc: string;
        }>>(`SELECT coach_ai_review_period_request_id, created_at_utc
FROM coach_ai_review_period_requests_v2
WHERE generation_contract_version = 'insight_selection_v3'
ORDER BY created_at_utc, coach_ai_review_period_request_id LIMIT 1`).get()
      : undefined;
    const review = state.schemaAvailable
      ? this.database.prepare<[], Readonly<{
          coach_ai_issued_review_id: string;
          issued_at_utc: string;
        }>>(`SELECT coach_ai_issued_review_id, issued_at_utc
FROM coach_ai_issued_reviews_v3
ORDER BY issued_at_utc, coach_ai_issued_review_id LIMIT 1`).get()
      : undefined;
    return Object.freeze({
      state,
      firstV3RequestId: request?.coach_ai_review_period_request_id ?? null,
      firstV3RequestCreatedAtUtc: request?.created_at_utc ?? null,
      firstV3IssuedReviewId: review?.coach_ai_issued_review_id ?? null,
      firstV3IssuedAtUtc: review?.issued_at_utc ?? null,
    });
  }

  private tableExists(name: string): boolean {
    return Boolean(this.database.prepare<[string], Readonly<{ present: number }>>(
      "SELECT 1 AS present FROM sqlite_schema WHERE type = 'table' AND name = ?",
    ).get(name));
  }

  private integrity(check: string): never {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      table: "coach_ai_review_generation_contract_state",
      check,
    });
  }
}
