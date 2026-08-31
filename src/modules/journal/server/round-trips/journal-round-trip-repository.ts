import type Database from "better-sqlite3";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { refreshWorkspaceTradeLibraryProjection } from "@/src/modules/journal-analytics/server/workspace-trade-library-projection";

import type {
  JournalAllocationRole,
  JournalRoundTripProjectionState,
} from "../../contracts/journal-round-trip-contracts";
import type { JournalExecutionFacts, JournalExecutionState } from "../../contracts/journal-execution-contracts";

export type JournalExecutionChainRow = JournalExecutionFacts & Readonly<{
  executionId: string;
  executionVersionId: string;
  currentState: JournalExecutionState;
  manualBoundaryConfirmed: boolean;
}>;

export type JournalPositionCheckpointRow = Readonly<{
  positionFactId: string;
  factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
  effectiveLocalDate: string;
  timePrecision: "date" | "day_start" | "day_end" | "exact";
  sourceTimeText: string | null;
  sourceTimezone: string;
  effectiveAtUtc: string | null;
  quantityDecimal: string;
  factSource: "statement" | "trader_correction";
  factVersion: string;
}>;

export type JournalCoverageRow = Readonly<{
  coverageKind: "complete" | "partial" | "point_only" | "unknown";
  localStartDate: string;
  localEndDate: string;
  sourceTimezone: string;
}>;

export type JournalSourceChainLimitation = Readonly<{
  issueCode: string;
  decisionState: "pending" | "accepted_limitation";
  effectiveAtUtc: string | null;
}>;

export type JournalChainDescriptor = Readonly<{
  instrumentId: string;
  assetClass: string;
  tradeCurrency: string;
}>;

export type LatestRebuildRow = Readonly<{
  rebuildId: string;
  algorithmVersion: string;
  orderedInputSha256: string;
  outputSha256: string;
  readyClosedCount: number;
  legitimateOpenCount: number;
  needsDecisionCount: number;
  excludedCount: number;
  coverageState: "complete" | "partial" | "unavailable";
}>;

type ExecutionRow = Readonly<{
  execution_id: string; execution_version_id: string; current_state: JournalExecutionState;
  instrument_id: string; trade_currency: string; source_timestamp_text: string;
  source_timezone: string; time_parser_version: string; executed_at_utc: string;
  source_order_key: string; side: "buy" | "sell"; quantity_decimal: string;
  price_decimal: string | null; fees_decimal: string | null; fee_currency: string | null;
  fee_sign_convention: JournalExecutionFacts["feeSignConvention"];
  fact_completeness: JournalExecutionFacts["factCompleteness"];
  manual_boundary_confirmed: 0 | 1;
}>;

export class JournalRoundTripRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  refreshWorkspaceTradeLibraryProjection(
    scope: Readonly<{ userId: string; workspaceId: string; workspaceRole: "owner" | "admin" | "member"; accountId: string }>,
    refreshedAtUtc: string,
  ): void {
    refreshWorkspaceTradeLibraryProjection(this.database, {
      activeAccountId: scope.accountId,
      allowedAccountIds: Object.freeze([scope.accountId]),
      userId: scope.userId,
      workspaceId: scope.workspaceId,
      workspaceRole: scope.workspaceRole,
    }, refreshedAtUtc);
  }

  accountTimezone(workspaceId: string, accountId: string): string | null {
    return this.database.prepare<[string, string], { trading_timezone: string }>(`
SELECT trading_timezone FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`)
      .get(workspaceId, accountId)?.trading_timezone ?? null;
  }

  hasChainKey(workspaceId: string, accountId: string, chainKeySha256: string): boolean {
    return Boolean(this.database.prepare<[string, string, string], { found: number }>(`
SELECT 1 AS found FROM journal_chain_rebuilds
WHERE workspace_id = ? AND account_id = ? AND chain_key_sha256 = ?
LIMIT 1`).get(workspaceId, accountId, chainKeySha256));
  }

  listChains(workspaceId: string, accountId: string): readonly JournalChainDescriptor[] {
    return Object.freeze(this.database.prepare<[
      string, string, string, string, string, string, string, string,
      string, string,
    ], {
      instrument_id: string;
      asset_class: string;
      trade_currency: string;
    }>(`
SELECT instrument_id, asset_class, trade_currency FROM (
  SELECT DISTINCT v.instrument_id, i.asset_class, v.trade_currency
  FROM journal_executions e
  JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
  JOIN journal_instruments i ON i.instrument_id = v.instrument_id AND i.workspace_id = e.workspace_id
  WHERE e.workspace_id = ? AND e.account_id = ? AND e.current_state <> 'superseded'
  UNION
  SELECT DISTINCT f.instrument_id, i.asset_class, f.currency AS trade_currency
  FROM journal_position_facts f
  JOIN journal_instruments i ON i.instrument_id = f.instrument_id AND i.workspace_id = f.workspace_id
  WHERE f.workspace_id = ? AND f.account_id = ? AND NOT EXISTS (
    SELECT 1 FROM journal_position_facts next
    WHERE next.workspace_id = f.workspace_id AND next.account_id = f.account_id
      AND next.instrument_id = f.instrument_id AND next.currency = f.currency
      AND next.supersedes_position_fact_id = f.position_fact_id
  )
  UNION
  SELECT DISTINCT v.instrument_id, i.asset_class, v.trade_currency
  FROM journal_round_trips r
  JOIN journal_round_trip_versions v
    ON v.round_trip_version_id = r.current_version_id
  JOIN journal_instruments i
    ON i.instrument_id = v.instrument_id AND i.workspace_id = r.workspace_id
  WHERE r.workspace_id = ? AND r.account_id = ?
    AND r.lifecycle_state = 'active'
  UNION
  SELECT DISTINCT issue.instrument_id, instrument.asset_class,
                  issue.trade_currency
  FROM journal_source_row_issues issue
  JOIN journal_instruments instrument
    ON instrument.workspace_id = issue.workspace_id
   AND instrument.instrument_id = issue.instrument_id
  JOIN journal_data_decisions decision
    ON decision.workspace_id = issue.workspace_id
   AND decision.account_id = issue.account_id
   AND decision.target_kind = 'source_issue'
   AND decision.source_issue_id = issue.source_issue_id
  JOIN journal_data_decision_events current_event
    ON current_event.workspace_id = decision.workspace_id
   AND current_event.account_id = decision.account_id
   AND current_event.decision_id = decision.decision_id
   AND current_event.decision_event_id = decision.current_event_id
  WHERE issue.workspace_id = ? AND issue.account_id = ?
    AND issue.instrument_id IS NOT NULL AND issue.trade_currency IS NOT NULL
    AND (
      issue.issue_code IN (
        'execution_required_fact_missing',
        'execution_zero_quantity',
        'execution_time_ambiguous',
        'execution_fact_invalid'
      )
      OR issue.issue_code GLOB 'position_fact_*'
    )
    AND (
      decision.state = 'pending'
      OR (decision.state = 'resolved'
          AND current_event.action = 'accept_source_limitation')
    )
  UNION
  SELECT DISTINCT rebuild.instrument_id, instrument.asset_class,
                  rebuild.trade_currency
  FROM journal_chain_rebuilds rebuild
  JOIN journal_instruments instrument
    ON instrument.workspace_id = rebuild.workspace_id
   AND instrument.instrument_id = rebuild.instrument_id
  WHERE rebuild.workspace_id = ? AND rebuild.account_id = ?
)
ORDER BY instrument_id, trade_currency`).all(
      workspaceId,
      accountId,
      workspaceId,
      accountId,
      workspaceId,
      accountId,
      workspaceId,
      accountId,
      workspaceId,
      accountId,
    ).map((row) => Object.freeze({
      instrumentId: row.instrument_id,
      assetClass: row.asset_class,
      tradeCurrency: row.trade_currency,
    })));
  }

  listChainsForExecutionIds(
    workspaceId: string,
    accountId: string,
    executionIds: readonly string[],
  ): readonly JournalChainDescriptor[] {
    if (executionIds.length === 0) return Object.freeze([]);
    const placeholders = executionIds.map(() => "?").join(", ");
    return Object.freeze(this.database.prepare(`SELECT DISTINCT
  execution_version.instrument_id,
  instrument.asset_class,
  execution_version.trade_currency
FROM journal_executions execution
JOIN journal_execution_versions execution_version
  ON execution_version.execution_version_id = execution.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = execution.workspace_id
 AND instrument.instrument_id = execution_version.instrument_id
WHERE execution.workspace_id = ?
  AND execution.account_id = ?
  AND execution.execution_id IN (${placeholders})
  AND execution.current_state <> 'superseded'
ORDER BY execution_version.instrument_id, execution_version.trade_currency`)
      .all(workspaceId, accountId, ...executionIds)
      .map((row) => row as {
        instrument_id: string;
        asset_class: string;
        trade_currency: string;
      })
      .map((row) => Object.freeze({
        instrumentId: row.instrument_id,
        assetClass: row.asset_class,
        tradeCurrency: row.trade_currency,
      })));
  }

  listSourceChainLimitations(
    workspaceId: string,
    accountId: string,
    instrumentId: string,
    tradeCurrency: string,
  ): readonly JournalSourceChainLimitation[] {
    return Object.freeze(this.database.prepare<[
      string,
      string,
      string,
      string,
    ], {
      issue_code: string;
      decision_state: JournalSourceChainLimitation["decisionState"];
      effective_at_utc: string | null;
    }>(`
SELECT issue.issue_code, issue.effective_at_utc,
       CASE WHEN decision.state = 'pending'
         THEN 'pending' ELSE 'accepted_limitation' END AS decision_state
FROM journal_source_row_issues issue
JOIN journal_data_decisions decision
  ON decision.workspace_id = issue.workspace_id
 AND decision.account_id = issue.account_id
 AND decision.target_kind = 'source_issue'
 AND decision.source_issue_id = issue.source_issue_id
JOIN journal_data_decision_events current_event
  ON current_event.workspace_id = decision.workspace_id
 AND current_event.account_id = decision.account_id
 AND current_event.decision_id = decision.decision_id
 AND current_event.decision_event_id = decision.current_event_id
WHERE issue.workspace_id = ? AND issue.account_id = ?
  AND issue.instrument_id = ? AND issue.trade_currency = ?
  AND (
    issue.issue_code IN (
      'execution_required_fact_missing',
      'execution_zero_quantity',
      'execution_time_ambiguous',
      'execution_fact_invalid'
    )
    OR issue.issue_code GLOB 'position_fact_*'
  )
  AND (
    decision.state = 'pending'
    OR (decision.state = 'resolved'
        AND current_event.action = 'accept_source_limitation')
  )
ORDER BY decision_state, issue.issue_code, issue.source_issue_id`).all(
      workspaceId,
      accountId,
      instrumentId,
      tradeCurrency,
    ).map((row) => Object.freeze({
      issueCode: row.issue_code,
      decisionState: row.decision_state,
      effectiveAtUtc: row.effective_at_utc,
    })));
  }

  listExecutions(workspaceId: string, accountId: string, instrumentId: string, tradeCurrency: string): readonly JournalExecutionChainRow[] {
    return Object.freeze(this.database.prepare<[string, string, string, string], ExecutionRow>(`
SELECT e.execution_id, e.current_state, v.*,
  EXISTS (
    SELECT 1
    FROM journal_execution_provenance provenance
    JOIN journal_source_rows source_row
      ON source_row.workspace_id = provenance.workspace_id
      AND source_row.account_id = provenance.account_id
      AND source_row.source_row_id = provenance.source_row_id
    JOIN journal_manual_trade_boundary_assertions boundary_assertion
      ON boundary_assertion.workspace_id = source_row.workspace_id
      AND boundary_assertion.account_id = source_row.account_id
      AND boundary_assertion.import_batch_id = source_row.import_batch_id
    WHERE provenance.workspace_id = e.workspace_id
      AND provenance.account_id = e.account_id
      AND provenance.execution_id = e.execution_id
  ) AS manual_boundary_confirmed
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE e.workspace_id = ? AND e.account_id = ?
  AND v.instrument_id = ? AND v.trade_currency = ? AND e.current_state <> 'superseded'
  AND NOT EXISTS (
    SELECT 1
    FROM journal_execution_reconciliation_members reconciliation_member
    JOIN journal_execution_reconciliation_sets reconciliation_set
      ON reconciliation_set.workspace_id = reconciliation_member.workspace_id
      AND reconciliation_set.account_id = reconciliation_member.account_id
      AND reconciliation_set.reconciliation_set_id = reconciliation_member.reconciliation_set_id
    WHERE reconciliation_member.workspace_id = e.workspace_id
      AND reconciliation_member.account_id = e.account_id
      AND reconciliation_member.execution_id = e.execution_id
      AND reconciliation_member.member_role = 'provisional_imported_execution'
      AND reconciliation_set.state = 'pending'
  )
ORDER BY v.executed_at_utc, v.source_order_key, v.execution_version_id`).all(
      workspaceId, accountId, instrumentId, tradeCurrency,
    ).map((row) => Object.freeze({
      executionId: row.execution_id,
      executionVersionId: row.execution_version_id,
      currentState: row.current_state,
      manualBoundaryConfirmed: row.manual_boundary_confirmed === 1,
      instrumentId: row.instrument_id,
      tradeCurrency: row.trade_currency,
      sourceTimestampText: row.source_timestamp_text,
      sourceTimezone: row.source_timezone,
      timeParserVersion: row.time_parser_version,
      executedAtUtc: row.executed_at_utc,
      sourceOrderKey: row.source_order_key,
      side: row.side,
      quantityDecimal: row.quantity_decimal,
      priceDecimal: row.price_decimal,
      feesDecimal: row.fees_decimal,
      feeCurrency: row.fee_currency,
      feeSignConvention: row.fee_sign_convention,
      factCompleteness: row.fact_completeness,
    })));
  }

  listCurrentPositionFacts(workspaceId: string, accountId: string, instrumentId: string, currency: string): readonly JournalPositionCheckpointRow[] {
    return Object.freeze(this.database.prepare<[string, string, string, string], {
      position_fact_id: string; fact_kind: JournalPositionCheckpointRow["factKind"];
      effective_local_date: string; time_precision: JournalPositionCheckpointRow["timePrecision"];
      source_time_text: string | null; source_timezone: string; effective_at_utc: string | null;
      quantity_decimal: string; fact_source: JournalPositionCheckpointRow["factSource"];
      fact_version: string;
    }>(`
SELECT f.position_fact_id, f.fact_kind, f.effective_local_date, f.time_precision,
       f.source_time_text, f.source_timezone, f.effective_at_utc, f.quantity_decimal,
       f.fact_source, f.fact_version
FROM journal_position_facts f
WHERE f.workspace_id = ? AND f.account_id = ? AND f.instrument_id = ? AND f.currency = ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_position_facts next
    WHERE next.workspace_id = f.workspace_id AND next.account_id = f.account_id
      AND next.instrument_id = f.instrument_id AND next.currency = f.currency
      AND next.supersedes_position_fact_id = f.position_fact_id
  )
ORDER BY f.effective_local_date, f.time_precision, f.created_at_utc, f.position_fact_id`)
      .all(workspaceId, accountId, instrumentId, currency).map((row) => Object.freeze({
        positionFactId: row.position_fact_id,
        factKind: row.fact_kind,
        effectiveLocalDate: row.effective_local_date,
        timePrecision: row.time_precision,
        sourceTimeText: row.source_time_text,
        sourceTimezone: row.source_timezone,
        effectiveAtUtc: row.effective_at_utc,
        quantityDecimal: row.quantity_decimal,
        factSource: row.fact_source,
        factVersion: row.fact_version,
      })));
  }

  listCoverage(workspaceId: string, accountId: string, assetClass: string): readonly JournalCoverageRow[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      coverage_kind: JournalCoverageRow["coverageKind"]; local_start_date: string;
      local_end_date: string; source_timezone: string;
    }>(`
SELECT coverage_kind, local_start_date, local_end_date, source_timezone
FROM journal_source_coverage_intervals
WHERE workspace_id = ? AND account_id = ? AND asset_class = ?
ORDER BY local_start_date, local_end_date, source_timezone, coverage_interval_id`)
      .all(workspaceId, accountId, assetClass)
      .map((row) => Object.freeze({
        coverageKind: row.coverage_kind,
        localStartDate: row.local_start_date,
        localEndDate: row.local_end_date,
        sourceTimezone: row.source_timezone,
      })));
  }

  latestRebuild(workspaceId: string, accountId: string, instrumentId: string, currency: string): LatestRebuildRow | null {
    const rows = this.database.prepare<[string, string, string, string], {
      rebuild_id: string; algorithm_version: string;
      ordered_input_sha256: string; output_sha256: string;
      ready_closed_count: number; legitimate_open_count: number;
      needs_decision_count: number; excluded_count: number;
      coverage_state: LatestRebuildRow["coverageState"];
    }>(`SELECT rebuild_id, algorithm_version, ordered_input_sha256, output_sha256, ready_closed_count,
 legitimate_open_count, needs_decision_count, excluded_count, coverage_state
FROM journal_chain_rebuilds current
WHERE current.workspace_id = ? AND current.account_id = ?
  AND current.instrument_id = ? AND current.trade_currency = ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_chain_rebuilds next
    WHERE next.workspace_id = current.workspace_id
      AND next.account_id = current.account_id
      AND next.instrument_id = current.instrument_id
      AND next.trade_currency = current.trade_currency
      AND next.previous_rebuild_id = current.rebuild_id
  )
ORDER BY current.rebuild_id`).all(workspaceId, accountId, instrumentId, currency);
    if (rows.length > 1) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "journal_rebuild_history_fork",
      });
    }
    const row = rows[0];
    return row ? Object.freeze({
      rebuildId: row.rebuild_id,
      algorithmVersion: row.algorithm_version,
      orderedInputSha256: row.ordered_input_sha256,
      outputSha256: row.output_sha256,
      readyClosedCount: row.ready_closed_count,
      legitimateOpenCount: row.legitimate_open_count,
      needsDecisionCount: row.needs_decision_count,
      excludedCount: row.excluded_count,
      coverageState: row.coverage_state,
    }) : null;
  }

  findRoundTripByAlias(workspaceId: string, accountId: string, aliasSha256: string): Readonly<{
    roundTripId: string; currentVersionId: string; versionNumber: number;
    projectionState: JournalRoundTripProjectionState; coverageReasonCode: string | null;
  }> | null {
    const row = this.database.prepare<[string, string, string], {
      round_trip_id: string; current_version_id: string; version_number: number;
      projection_state: JournalRoundTripProjectionState; coverage_reason_code: string | null;
    }>(`
SELECT r.round_trip_id, r.current_version_id, v.version_number,
       v.projection_state, v.coverage_reason_code
FROM journal_round_trip_identity_aliases a
JOIN journal_round_trips r ON r.round_trip_id = a.round_trip_id
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE a.workspace_id = ? AND a.account_id = ? AND a.alias_scheme_version = 'round_trip_execution_set_v1'
  AND a.alias_key_sha256 = ? AND a.status = 'active' LIMIT 1`)
      .get(workspaceId, accountId, aliasSha256);
    return row ? Object.freeze({
      roundTripId: row.round_trip_id,
      currentVersionId: row.current_version_id,
      versionNumber: row.version_number,
      projectionState: row.projection_state,
      coverageReasonCode: row.coverage_reason_code,
    }) : null;
  }

  private findOverlapCandidatesByLifecycle(
    workspaceId: string,
    accountId: string,
    executionIds: readonly string[],
    lifecycleState: "active" | "superseded",
  ): readonly string[] {
    const placeholders = executionIds.map(() => "?").join(", ");
    return Object.freeze(this.database.prepare(`SELECT DISTINCT r.round_trip_id
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
JOIN journal_round_trip_execution_allocations a ON a.round_trip_version_id = v.round_trip_version_id
JOIN journal_execution_versions ev ON ev.execution_version_id = a.execution_version_id
WHERE r.workspace_id = ? AND r.account_id = ? AND r.lifecycle_state = ?
  AND ev.execution_id IN (${placeholders})
ORDER BY r.round_trip_id`).all(workspaceId, accountId, lifecycleState, ...executionIds)
      .map((row) => (row as { round_trip_id: string }).round_trip_id));
  }

  findOverlapCandidates(workspaceId: string, accountId: string, executionIds: readonly string[]): readonly string[] {
    if (executionIds.length === 0) return Object.freeze([]);
    const active = this.findOverlapCandidatesByLifecycle(
      workspaceId,
      accountId,
      executionIds,
      "active",
    );
    return active.length > 0
      ? active
      : this.findOverlapCandidatesByLifecycle(
          workspaceId,
          accountId,
          executionIds,
          "superseded",
        );
  }

  roundTripCurrent(roundTripId: string, workspaceId: string, accountId: string): Readonly<{ currentVersionId: string; versionNumber: number }> | null {
    const row = this.database.prepare<[string, string, string], { current_version_id: string; version_number: number }>(`
SELECT r.current_version_id, v.version_number FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE r.round_trip_id = ? AND r.workspace_id = ? AND r.account_id = ?`)
      .get(roundTripId, workspaceId, accountId);
    return row ? Object.freeze({ currentVersionId: row.current_version_id, versionNumber: row.version_number }) : null;
  }

  insertRebuild(input: Readonly<{
    rebuildId: string; workspaceId: string; accountId: string; instrumentId: string;
    tradeCurrency: string; chainKeySha256: string; triggerKind: "import_event" | "decision_event" | "maintenance";
    triggerId: string | null; maintenanceReasonCode: string | null; previousRebuildId: string | null;
    algorithmVersion: string; orderedInputSha256: string; outputSha256: string;
    coverageState: "complete" | "partial" | "unavailable"; readyClosedCount: number;
    legitimateOpenCount: number; needsDecisionCount: number; excludedCount: number;
    firstExecutionAtUtc: string | null; lastExecutionAtUtc: string | null; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_chain_rebuilds (
 rebuild_id, workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256,
 trigger_kind, trigger_import_event_id, trigger_decision_event_id, maintenance_reason_code,
 previous_rebuild_id, algorithm_version, ordered_input_sha256, output_sha256,
 coverage_state, ready_closed_count, legitimate_open_count, needs_decision_count,
 excluded_count, first_execution_at_utc, last_execution_at_utc, completed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.rebuildId, input.workspaceId, input.accountId, input.instrumentId,
        input.tradeCurrency, input.chainKeySha256, input.triggerKind,
        input.triggerKind === "import_event" ? input.triggerId : null,
        input.triggerKind === "decision_event" ? input.triggerId : null,
        input.maintenanceReasonCode, input.previousRebuildId, input.algorithmVersion,
        input.orderedInputSha256, input.outputSha256, input.coverageState,
        input.readyClosedCount, input.legitimateOpenCount, input.needsDecisionCount,
        input.excludedCount, input.firstExecutionAtUtc, input.lastExecutionAtUtc, input.timestamp);
  }

  createRoundTrip(input: Readonly<{
    roundTripId: string; roundTripVersionId: string; workspaceId: string; accountId: string;
    rebuildId: string; instrumentId: string; tradeCurrency: string; chainKeySha256: string;
    direction: "long" | "short"; openedAtUtc: string; closedAtUtc: string | null;
    finalPositionDecimal: string; projectionState: JournalRoundTripProjectionState;
    coverageReasonCode: string | null; projectionFingerprintSha256: string;
    versionNumber: number; timestamp: string;
  }>): void {
    if (input.versionNumber === 1) {
      this.database.prepare(`INSERT INTO journal_round_trips (
 round_trip_id, workspace_id, account_id, current_version_id, lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
        .run(input.roundTripId, input.workspaceId, input.accountId,
          input.roundTripVersionId, input.timestamp, input.timestamp);
    }
    this.database.prepare(`INSERT INTO journal_round_trip_versions (
 round_trip_version_id, workspace_id, account_id, round_trip_id, version_number,
 rebuild_id, instrument_id, trade_currency, chain_key_sha256, direction,
 opened_at_utc, closed_at_utc, final_position_decimal, projection_state,
 coverage_reason_code, projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.roundTripVersionId, input.workspaceId, input.accountId,
        input.roundTripId, input.versionNumber, input.rebuildId, input.instrumentId,
        input.tradeCurrency, input.chainKeySha256, input.direction,
        input.openedAtUtc, input.closedAtUtc, input.finalPositionDecimal,
        input.projectionState, input.coverageReasonCode,
        input.projectionFingerprintSha256, input.timestamp);
    if (input.versionNumber > 1) {
      this.database.prepare(`UPDATE journal_round_trips
SET current_version_id = ?, lifecycle_state = 'active',
 updated_at_utc = CASE
   WHEN updated_at_utc > ? THEN updated_at_utc
   ELSE ?
 END
WHERE round_trip_id = ? AND workspace_id = ? AND account_id = ?`)
        .run(input.roundTripVersionId, input.timestamp, input.timestamp, input.roundTripId,
          input.workspaceId, input.accountId);
    }
  }

  insertAllocation(input: Readonly<{
    allocationId: string; workspaceId: string; accountId: string;
    roundTripVersionId: string; executionVersionId: string; allocationSequence: number;
    allocationRole: JournalAllocationRole; quantityDecimal: string; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_round_trip_execution_allocations (
 allocation_id, workspace_id, account_id, round_trip_version_id,
 execution_version_id, allocation_sequence, allocation_role, quantity_decimal, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.allocationId, input.workspaceId, input.accountId,
        input.roundTripVersionId, input.executionVersionId, input.allocationSequence,
        input.allocationRole, input.quantityDecimal, input.timestamp);
  }

  insertAliasIfMissing(input: Readonly<{
    roundTripAliasId: string; workspaceId: string; accountId: string;
    roundTripId: string; aliasKeySha256: string; timestamp: string;
  }>): void {
    const existing = this.database.prepare<[string, string, string], {
      round_trip_id: string;
    }>(`SELECT round_trip_id FROM journal_round_trip_identity_aliases
WHERE workspace_id = ? AND account_id = ?
  AND alias_scheme_version = 'round_trip_execution_set_v1'
  AND alias_key_sha256 = ?`).get(
      input.workspaceId,
      input.accountId,
      input.aliasKeySha256,
    );
    if (existing) {
      if (existing.round_trip_id !== input.roundTripId) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "round_trip_alias_conflict",
        });
      }
      return;
    }
    this.database.prepare(`INSERT INTO journal_round_trip_identity_aliases (
 round_trip_alias_id, workspace_id, account_id, round_trip_id, alias_scheme_version,
 alias_key_sha256, status, superseded_by_alias_id, created_at_utc
) VALUES (?, ?, ?, ?, 'round_trip_execution_set_v1', ?, 'active', NULL, ?)`)
      .run(input.roundTripAliasId, input.workspaceId, input.accountId,
        input.roundTripId, input.aliasKeySha256, input.timestamp);
  }

  supersedeRoundTripsWhoseExecutionsMovedChains(
    workspaceId: string,
    accountId: string,
    timestamp: string,
  ): void {
    this.database.prepare(`UPDATE journal_round_trips
SET lifecycle_state = 'superseded',
 updated_at_utc = CASE WHEN updated_at_utc > ? THEN updated_at_utc ELSE ? END
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'
  AND EXISTS (
    SELECT 1
    FROM journal_round_trip_versions round_trip_version
    JOIN journal_round_trip_execution_allocations allocation
      ON allocation.round_trip_version_id = round_trip_version.round_trip_version_id
    JOIN journal_execution_versions allocated_execution_version
      ON allocated_execution_version.execution_version_id = allocation.execution_version_id
    JOIN journal_executions execution
      ON execution.workspace_id = allocation.workspace_id
     AND execution.account_id = allocation.account_id
     AND execution.execution_id = allocated_execution_version.execution_id
    JOIN journal_execution_versions current_execution_version
      ON current_execution_version.execution_version_id = execution.current_version_id
    WHERE round_trip_version.round_trip_version_id = journal_round_trips.current_version_id
      AND (
        current_execution_version.instrument_id <> round_trip_version.instrument_id
        OR current_execution_version.trade_currency <> round_trip_version.trade_currency
      )
  )`).run(timestamp, timestamp, workspaceId, accountId);
  }

  supersedeMissingRoundTrips(workspaceId: string, accountId: string, instrumentId: string, currency: string, retainedIds: readonly string[], timestamp: string): void {
    const placeholders = retainedIds.length > 0 ? retainedIds.map(() => "?").join(", ") : "NULL";
    this.database.prepare(`UPDATE journal_round_trips
SET lifecycle_state = 'superseded',
 updated_at_utc = CASE WHEN updated_at_utc > ? THEN updated_at_utc ELSE ? END
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'
  AND current_version_id IN (
    SELECT round_trip_version_id FROM journal_round_trip_versions
    WHERE instrument_id = ? AND trade_currency = ?
  ) AND round_trip_id NOT IN (${placeholders})`)
      .run(timestamp, timestamp, workspaceId, accountId, instrumentId, currency, ...retainedIds);
  }

  upsertTradingDay(input: Readonly<{
    tradingDayId: string; workspaceId: string; accountId: string;
    tradingDate: string; tradingTimezone: string; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_trading_days (
 trading_day_id, workspace_id, account_id, trading_date, trading_timezone,
 status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
ON CONFLICT(workspace_id, account_id, trading_date, trading_timezone)
DO UPDATE SET status = 'active',
 updated_at_utc = CASE
   WHEN journal_trading_days.updated_at_utc > excluded.updated_at_utc
     THEN journal_trading_days.updated_at_utc
   ELSE excluded.updated_at_utc
 END`)
      .run(input.tradingDayId, input.workspaceId, input.accountId,
        input.tradingDate, input.tradingTimezone, input.timestamp, input.timestamp);
  }
}
