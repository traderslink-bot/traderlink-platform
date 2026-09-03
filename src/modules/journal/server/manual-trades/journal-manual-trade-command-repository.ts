import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalManualTradeRelationship,
  JournalTradeStyle,
} from "../../contracts/journal-manual-trade-capture-contracts";
import type { JournalOpenPositionStatus } from "../../contracts/journal-trade-style-contracts";

export type JournalManualAllocationTarget = Readonly<{
  executionId: string;
  role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
  quantityDecimal: string;
}>;

export type JournalManualRoundTripTarget = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  version: number;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
}>;

export type JournalManualCommittedSubmission = Readonly<{
  acceptedExecutionCount: number;
  pendingDecisionCount: number;
}>;

function sha256(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f"), "utf8").digest("hex");
}

function factKeyFromManualSourceRow(rawFieldsJson: string): string | null {
  const fields: unknown = JSON.parse(rawFieldsJson);
  if (
    !Array.isArray(fields) ||
    fields.length < 16 ||
    fields[0] !== "manual_execution_v1"
  ) {
    return null;
  }
  const values = [
    fields[1],
    fields[2],
    fields[7],
    fields[14],
    fields[8],
    fields[9],
    fields[10],
    fields[11],
  ];
  return values.every((value) => typeof value === "string")
    ? JSON.stringify(values)
    : null;
}

export class JournalManualTradeCommandRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  findCommittedSubmission(input: Readonly<{
    scope: AccountScope;
    userId: string;
    idempotencyKey: string;
    payloadSha256: string;
  }>): JournalManualCommittedSubmission | null {
    const batch = this.database.prepare<[
      string,
      string,
      string,
      string,
    ], {
      import_batch_id: string;
      pending_decision_count: number;
    }>(`SELECT import_batch_id, pending_decision_count
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND created_by_user_id = ?
  AND source_kind = 'manual_batch' AND manual_idempotency_key = ?`)
      .get(
        input.scope.workspaceId,
        input.scope.accountId,
        input.userId,
        input.idempotencyKey,
      );
    if (!batch) return null;

    const assertions = this.database.prepare<[
      string,
      string,
      string,
      string,
      string,
    ], {
      assertion_count: number;
      mismatched_count: number;
    }>(`SELECT COUNT(*) AS assertion_count,
  SUM(CASE WHEN normalized_payload_sha256 = ? THEN 0 ELSE 1 END) AS mismatched_count
FROM journal_manual_trade_boundary_assertions
WHERE workspace_id = ? AND account_id = ? AND user_id = ?
  AND import_batch_id = ?`)
      .get(
        input.payloadSha256,
        input.scope.workspaceId,
        input.scope.accountId,
        input.userId,
        batch.import_batch_id,
      );
    if (
      !assertions ||
      assertions.assertion_count < 1 ||
      assertions.mismatched_count !== 0
    ) {
      platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
        reason: "offline_idempotency_status_mismatch",
      });
    }

    const executions = this.database.prepare<[
      string,
      string,
      string,
    ], { execution_count: number }>(`SELECT COUNT(DISTINCT execution_id) AS execution_count
FROM journal_execution_provenance
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`)
      .get(
        input.scope.workspaceId,
        input.scope.accountId,
        batch.import_batch_id,
      );
    return Object.freeze({
      acceptedExecutionCount: executions?.execution_count ?? 0,
      pendingDecisionCount: batch.pending_decision_count,
    });
  }

  hasExactManualBatchWithDifferentIdempotency(input: Readonly<{
    scope: AccountScope;
    userId: string;
    idempotencyKey: string;
    factKeys: readonly string[];
  }>): boolean {
    const rows = this.database.prepare<[
      string,
      string,
      string,
      string,
      number,
    ], {
      import_batch_id: string;
      raw_fields_json: string;
    }>(`SELECT batch.import_batch_id, source_row.raw_fields_json
FROM journal_import_batches AS batch
JOIN journal_source_rows AS source_row
  ON source_row.workspace_id = batch.workspace_id
 AND source_row.account_id = batch.account_id
 AND source_row.import_batch_id = batch.import_batch_id
WHERE batch.workspace_id = ? AND batch.account_id = ?
  AND batch.created_by_user_id = ? AND batch.source_kind = 'manual_batch'
  AND batch.manual_idempotency_key <> ?
  AND batch.current_state IN ('accepted', 'accepted_with_decisions')
  AND batch.mapped_execution_count = ?
ORDER BY batch.created_at_utc DESC, batch.import_batch_id, source_row.record_ordinal`)
      .all(
        input.scope.workspaceId,
        input.scope.accountId,
        input.userId,
        input.idempotencyKey,
        input.factKeys.length,
      );
    const expected = [...input.factKeys].sort();
    const candidateKeys = new Map<string, string[]>();
    for (const row of rows) {
      const key = factKeyFromManualSourceRow(row.raw_fields_json);
      if (key === null) continue;
      candidateKeys.set(
        row.import_batch_id,
        [...(candidateKeys.get(row.import_batch_id) ?? []), key],
      );
    }
    return [...candidateKeys.values()].some((keys) => {
      const sorted = keys.sort();
      return sorted.length === expected.length &&
        sorted.every((key, index) => key === expected[index]);
    });
  }

  insertBoundaryAssertion(input: Readonly<{
    scope: AccountScope;
    userId: string;
    importBatchId: string;
    relationship: Exclude<JournalManualTradeRelationship, "not_finished">;
    groupRef: string;
    payloadSha256: string;
    roundTripId: string | null;
    roundTripVersionId: string | null;
    expectedExistingVersion: number | null;
    sourceUi: "day_trade_tracker" | "swing_trade_tracker";
    idempotencyKey: string;
    timestamp: string;
  }>): void {
    const idempotencySha256 = sha256([
      "journal-manual-boundary-idempotency-v1",
      input.scope.workspaceId,
      input.scope.accountId,
      input.userId,
      input.idempotencyKey,
      input.groupRef,
    ]);
    this.database.prepare(`INSERT INTO journal_manual_trade_boundary_assertions (
 boundary_assertion_id, user_id, workspace_id, account_id, import_batch_id,
 round_trip_id, round_trip_version_id, relationship, manual_group_ref_sha256,
 normalized_payload_sha256, expected_existing_version, source_ui,
 idempotency_sha256, asserted_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, user_id, idempotency_sha256) DO NOTHING`)
      .run(
        createCanonicalUuidV4(),
        input.userId,
        input.scope.workspaceId,
        input.scope.accountId,
        input.importBatchId,
        input.roundTripId,
        input.roundTripVersionId,
        input.relationship,
        input.groupRef,
        input.payloadSha256,
        input.expectedExistingVersion,
        input.sourceUi,
        idempotencySha256,
        input.timestamp,
      );
    const row = this.database.prepare<[string, string, string, string], {
      import_batch_id: string;
      relationship: string;
      manual_group_ref_sha256: string;
      normalized_payload_sha256: string;
    }>(`SELECT import_batch_id, relationship, manual_group_ref_sha256,
 normalized_payload_sha256
FROM journal_manual_trade_boundary_assertions
WHERE workspace_id = ? AND account_id = ? AND user_id = ? AND idempotency_sha256 = ?`)
      .get(
        input.scope.workspaceId,
        input.scope.accountId,
        input.userId,
        idempotencySha256,
      );
    if (
      !row ||
      row.import_batch_id !== input.importBatchId ||
      row.relationship !== input.relationship ||
      row.manual_group_ref_sha256 !== input.groupRef ||
      row.normalized_payload_sha256 !== input.payloadSha256
    ) {
      platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
        reason: "boundary_idempotency",
      });
    }
  }

  resolveRoundTripForAllocations(
    scope: AccountScope,
    allocations: readonly JournalManualAllocationTarget[],
  ): JournalManualRoundTripTarget {
    let candidates: Map<string, JournalManualRoundTripTarget> | null = null;
    for (const allocation of allocations) {
      const rows = this.database.prepare<[
        string, string, string, string, string,
      ], {
        round_trip_id: string;
        round_trip_version_id: string;
        version_number: number;
        projection_state: JournalManualRoundTripTarget["projectionState"];
      }>(`SELECT round_trip.round_trip_id, version.round_trip_version_id,
 version.version_number, version.projection_state
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
  AND execution_version.account_id = allocation.account_id
  AND execution_version.execution_version_id = allocation.execution_version_id
JOIN journal_round_trip_versions version
  ON version.workspace_id = allocation.workspace_id
  AND version.account_id = allocation.account_id
  AND version.round_trip_version_id = allocation.round_trip_version_id
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = version.workspace_id
  AND round_trip.account_id = version.account_id
  AND round_trip.round_trip_id = version.round_trip_id
  AND round_trip.current_version_id = version.round_trip_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND execution_version.execution_id = ? AND allocation.allocation_role = ?
  AND allocation.quantity_decimal = ?
  AND round_trip.lifecycle_state = 'active'`)
        .all(
          scope.workspaceId,
          scope.accountId,
          allocation.executionId,
          allocation.role,
          allocation.quantityDecimal,
        );
      const current = new Map(rows.map((row) => [row.round_trip_id, Object.freeze({
        roundTripId: row.round_trip_id,
        roundTripVersionId: row.round_trip_version_id,
        version: row.version_number,
        projectionState: row.projection_state,
      })]));
      if (candidates === null) {
        candidates = current;
      } else {
        const intersection = new Map<string, JournalManualRoundTripTarget>();
        for (const [roundTripId, target] of candidates.entries()) {
          if (current.has(roundTripId)) intersection.set(roundTripId, target);
        }
        candidates = intersection;
      }
    }
    if (!candidates || candidates.size !== 1) {
      platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
        reason: "round_trip_allocation",
      });
    }
    return [...candidates.values()][0]!;
  }

  applyTradeStyle(input: Readonly<{
    scope: AccountScope;
    userId: string;
    target: JournalManualRoundTripTarget;
    style: JournalTradeStyle;
    preserveExistingStyle?: boolean;
    claimedEffectiveAtUtc: string;
    sourceUi: "day_trade_tracker" | "swing_trade_tracker";
    idempotencyKey: string;
    groupRef: string;
    timestamp: string;
  }>): void {
    if (input.target.projectionState === "needs_decision") {
      platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
        reason: "round_trip_needs_review",
      });
    }
    const prior = this.database.prepare<[string, string, string], {
      trade_style_plan_id: string;
      round_trip_version_id: string;
      trade_style: JournalTradeStyle;
      open_status: string;
      lifecycle_state: string;
      current_revision: number;
    }>(`SELECT trade_style_plan_id, round_trip_version_id, trade_style,
 open_status, lifecycle_state, current_revision
FROM journal_trade_style_plans
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?`)
      .get(input.scope.workspaceId, input.scope.accountId, input.target.roundTripId);
    const style = input.preserveExistingStyle && prior
      ? prior.trade_style
      : input.style;
    const lifecycleState = input.target.projectionState === "ready_closed"
      ? "closed" as const
      : "active" as const;
    const openStatus = lifecycleState === "closed"
      ? "closed" as const
      : input.preserveExistingStyle && prior && prior.open_status !== "closed"
        ? prior.open_status as Exclude<JournalOpenPositionStatus, "closed">
      : style === "swing"
        ? "swing" as const
        : style === "day_trade"
          ? "day_trade_still_open" as const
          : "other" as const;
    if (
      prior &&
      prior.round_trip_version_id === input.target.roundTripVersionId &&
      prior.trade_style === style &&
      prior.open_status === openStatus &&
      prior.lifecycle_state === lifecycleState
    ) return;

    const planId = prior?.trade_style_plan_id ?? createCanonicalUuidV4();
    const eventId = createCanonicalUuidV4();
    const revision = (prior?.current_revision ?? 0) + 1;
    const eventType = !prior
      ? "declared" as const
      : prior.trade_style !== style
        ? "reclassified" as const
        : lifecycleState === "closed" && prior.lifecycle_state !== "closed"
          ? "closed" as const
          : "relinked" as const;
    const eventIdempotency = sha256([
      "journal-trade-style-idempotency-v1",
      input.scope.workspaceId,
      input.scope.accountId,
      input.userId,
      input.idempotencyKey,
      input.groupRef,
      String(revision),
    ]);
    if (!prior) {
      this.database.prepare(`INSERT INTO journal_trade_style_plans (
 trade_style_plan_id, user_id, workspace_id, account_id, round_trip_id,
 round_trip_version_id, trade_style, open_status, planned_from_entry,
 claimed_effective_at_utc, declared_at_utc, lifecycle_state, current_revision,
 current_event_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?, ?)`)
        .run(
          planId,
          input.userId,
          input.scope.workspaceId,
          input.scope.accountId,
          input.target.roundTripId,
          input.target.roundTripVersionId,
          style,
          openStatus,
          input.claimedEffectiveAtUtc,
          input.timestamp,
          lifecycleState,
          eventId,
          input.timestamp,
          input.timestamp,
        );
    }
    this.database.prepare(`INSERT INTO journal_trade_style_plan_events (
 trade_style_plan_event_id, workspace_id, account_id, trade_style_plan_id,
 event_sequence, event_type, prior_trade_style, new_trade_style,
 prior_open_status, new_open_status, claimed_effective_at_utc,
 round_trip_version_id, reason_code, source_ui, expected_revision,
 idempotency_sha256, actor_user_id, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        eventId,
        input.scope.workspaceId,
        input.scope.accountId,
        planId,
        revision,
        eventType,
        prior?.trade_style ?? null,
        style,
        prior?.open_status ?? null,
        openStatus,
        input.claimedEffectiveAtUtc,
        input.target.roundTripVersionId,
        eventType === "declared" ? "manual_trade_declared" : "manual_trade_updated",
        input.sourceUi,
        revision - 1,
        eventIdempotency,
        input.userId,
        input.timestamp,
      );
    if (prior) {
      const updated = this.database.prepare(`UPDATE journal_trade_style_plans
SET round_trip_version_id = ?, trade_style = ?, open_status = ?,
 claimed_effective_at_utc = ?, lifecycle_state = ?, current_revision = ?,
 current_event_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND trade_style_plan_id = ?
  AND current_revision = ?`)
        .run(
          input.target.roundTripVersionId,
      style,
          openStatus,
          input.claimedEffectiveAtUtc,
          lifecycleState,
          revision,
          eventId,
          input.timestamp,
          input.scope.workspaceId,
          input.scope.accountId,
          planId,
          prior.current_revision,
        );
      if (updated.changes !== 1) {
        platformFailure("TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT", {
          reason: "trade_style_revision",
        });
      }
    }
  }
}
