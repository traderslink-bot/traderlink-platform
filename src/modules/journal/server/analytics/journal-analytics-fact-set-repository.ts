import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  JournalAnalyticsAccountFact,
  JournalAnalyticsAllocationFact,
  JournalAnalyticsAssetClass,
  JournalAnalyticsFactSet,
  JournalAnalyticsFactSetRequest,
  JournalAnalyticsFeePolicyCandidate,
  JournalAnalyticsPendingDecisionFact,
  JournalAnalyticsRoundTripFact,
} from "../../contracts/journal-analytics-fact-set";
import {
  JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
  JOURNAL_ANALYTICS_MAX_SELECTED_ACCOUNTS,
} from "../../contracts/journal-analytics-fact-set";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalSha256,
  assertJournalTimezone,
  assertJournalTradingDate,
  assertJournalUtcTimestamp,
} from "../../contracts/journal-storage-values";
import { JournalIntegrityReadRepository } from "../../server/journal-integrity-read-repository";
import {
  addDecimal,
  compareDecimal,
  negateDecimal,
} from "../round-trips/journal-decimal-math";

type AccountRow = Readonly<{
  account_id: string;
  base_currency: string;
  trading_timezone: string;
}>;

type LatestRebuildRow = Readonly<{
  account_id: string;
  instrument_id: string;
  trade_currency: string;
  rebuild_id: string;
  chain_key_sha256: string;
  algorithm_version: string;
  ordered_input_sha256: string;
  output_sha256: string;
  coverage_state: "complete" | "partial" | "unavailable";
  ready_closed_count: number;
  legitimate_open_count: number;
  needs_decision_count: number;
  excluded_count: number;
  completed_at_utc: string;
}>;

type RoundTripRow = Readonly<{
  round_trip_id: string;
  round_trip_version_id: string;
  version_number: number;
  account_id: string;
  instrument_id: string;
  normalized_symbol: string;
  asset_class: JournalAnalyticsAssetClass;
  trade_currency: string;
  direction: "long" | "short";
  opened_at_utc: string;
  closed_at_utc: string | null;
  final_position_decimal: string;
  projection_state: JournalAnalyticsRoundTripFact["projectionState"];
  coverage_reason_code: string | null;
  projection_fingerprint_sha256: string;
  rebuild_id: string;
  chain_key_sha256: string;
}>;

type AllocationRow = Readonly<{
  allocation_id: string;
  round_trip_version_id: string;
  account_id: string;
  allocation_sequence: number;
  allocation_role: JournalAnalyticsAllocationFact["allocationRole"];
  quantity_decimal: string;
  execution_id: string;
  execution_version_id: string;
  current_execution_version_id: string;
  current_state: string;
  executed_at_utc: string;
  source_order_key: string;
  side: "buy" | "sell";
  execution_quantity_decimal: string;
  price_decimal: string | null;
  fees_decimal: string | null;
  fee_currency: string | null;
  fee_sign_convention: JournalAnalyticsAllocationFact["feeSignConvention"];
  fact_completeness: JournalAnalyticsAllocationFact["factCompleteness"];
}>;

type CurrentExecutionRow = Readonly<{
  account_id: string;
  execution_id: string;
  current_version_id: string;
  current_state: "accepted" | "needs_decision";
  quantity_decimal: string;
}>;

type ProvenanceRow = Readonly<{
  account_id: string;
  execution_version_id: string;
  provenance_kind: JournalAnalyticsFeePolicyCandidate["provenanceKind"];
  source_system: string;
  adapter_id: string;
  adapter_version: string;
}>;

type DecisionRow = Readonly<{
  decision_id: string;
  account_id: string;
  issue_code: string;
  effect_code: string;
  revision: number;
  target_kind: JournalAnalyticsPendingDecisionFact["targetKind"];
  chain_key_sha256: string | null;
  execution_id: string | null;
  instrument_id: string | null;
  trade_currency: string | null;
  updated_at_utc: string;
}>;

function integrityFailure(check: string): never {
  platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check });
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function chainScopeKey(
  accountId: string,
  instrumentId: string,
  tradeCurrency: string,
): string {
  return JSON.stringify([accountId, instrumentId, tradeCurrency]);
}

function executionVersionScopeKey(
  accountId: string,
  executionVersionId: string,
): string {
  return JSON.stringify([accountId, executionVersionId]);
}

function expectedChainKey(
  workspaceId: string,
  accountId: string,
  instrumentId: string,
  tradeCurrency: string,
): string {
  return sha256Json([
    "journal-chain-v1",
    workspaceId,
    accountId,
    instrumentId,
    tradeCurrency,
  ]);
}

function requireFactSetRequest(
  scope: WorkspaceAccessScope,
  request: JournalAnalyticsFactSetRequest,
): JournalAnalyticsFactSetRequest {
  assertCanonicalUuidV4(scope.userId, "scope.userId");
  assertCanonicalUuidV4(scope.workspaceId, "scope.workspaceId");
  if (scope.workspaceRole !== "owner" && scope.workspaceRole !== "admin") {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  if (
    request.accountIds.length < 1 ||
    request.accountIds.length > JOURNAL_ANALYTICS_MAX_SELECTED_ACCOUNTS
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "accountIds",
    });
  }
  const accountIds = [...new Set(request.accountIds)].sort();
  if (accountIds.length !== request.accountIds.length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "accountIds",
    });
  }
  for (const accountId of accountIds) {
    assertCanonicalUuidV4(accountId, "accountId");
    if (!scope.allowedAccountIds.includes(accountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
  }
  if (request.closingDateRange.kind === "inclusive_closing_date") {
    assertJournalTradingDate(request.closingDateRange.startDate, "startDate");
    assertJournalTradingDate(request.closingDateRange.endDate, "endDate");
    if (request.closingDateRange.endDate < request.closingDateRange.startDate) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "closingDateRange",
      });
    }
  }
  if (request.currencySelection.kind === "single_currency") {
    assertJournalCurrency(request.currencySelection.currency, "currency");
  }
  return Object.freeze({
    accountIds: freezeArray(accountIds),
    closingDateRange: Object.freeze({ ...request.closingDateRange }),
    currencySelection: Object.freeze({ ...request.currencySelection }),
  });
}

function requireNonNegativeInteger(value: number, check: string): void {
  if (!Number.isSafeInteger(value) || value < 0) integrityFailure(check);
}

function sortedUnique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function relevantDecision(
  decision: JournalAnalyticsPendingDecisionFact,
  row: RoundTripRow,
  executionIds: ReadonlySet<string>,
): boolean {
  return decision.accountId === row.account_id && (
    decision.chainKeySha256 === row.chain_key_sha256 ||
    (decision.executionId !== null && executionIds.has(decision.executionId)) ||
    (
      decision.instrumentId === row.instrument_id &&
      decision.tradeCurrency === row.trade_currency
    )
  );
}

export class JournalAnalyticsFactSetRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet {
    const normalizedRequest = requireFactSetRequest(scope, request);
    return this.database.transaction(() =>
      this.readSnapshot(scope, normalizedRequest)).deferred();
  }

  private readSnapshot(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet {
    const placeholders = request.accountIds.map(() => "?").join(", ");
    const parameters = [scope.workspaceId, ...request.accountIds] as const;
    const accountRows = this.database.prepare(`
SELECT account_id, base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id IN (${placeholders}) AND status = 'active'
ORDER BY account_id`).all(...parameters) as AccountRow[];
    if (accountRows.length !== request.accountIds.length) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    for (const account of accountRows) {
      assertCanonicalUuidV4(account.account_id, "accountId");
      assertJournalCurrency(account.base_currency, "baseCurrency");
      assertJournalTimezone(account.trading_timezone, "tradingTimezone");
    }

    const latestRebuildRows = this.database.prepare(`
SELECT current.account_id, current.instrument_id, current.trade_currency,
       current.rebuild_id, current.chain_key_sha256, current.algorithm_version,
       current.ordered_input_sha256, current.output_sha256,
       current.coverage_state, current.ready_closed_count,
       current.legitimate_open_count, current.needs_decision_count,
       current.excluded_count, current.completed_at_utc
FROM journal_chain_rebuilds current
WHERE current.workspace_id = ? AND current.account_id IN (${placeholders})
  AND current.rebuild_id NOT IN (
    SELECT seeded_round_trip_version.rebuild_id
    FROM journal_round_trip_versions seeded_round_trip_version
    JOIN journal_round_trip_execution_allocations seeded_allocation
      ON seeded_allocation.round_trip_version_id = seeded_round_trip_version.round_trip_version_id
    JOIN journal_execution_provenance seeded_provenance
      ON seeded_provenance.workspace_id = seeded_allocation.workspace_id
     AND seeded_provenance.account_id = seeded_allocation.account_id
     AND seeded_provenance.execution_version_id = seeded_allocation.execution_version_id
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM journal_chain_rebuilds next
    WHERE next.workspace_id = current.workspace_id
      AND next.account_id = current.account_id
      AND next.instrument_id = current.instrument_id
      AND next.trade_currency = current.trade_currency
      AND next.previous_rebuild_id = current.rebuild_id
  )
ORDER BY current.account_id, current.instrument_id, current.trade_currency,
         current.rebuild_id`).all(...parameters) as LatestRebuildRow[];
    const rebuildByChain = new Map<string, LatestRebuildRow>();
    for (const rebuild of latestRebuildRows) {
      const key = chainScopeKey(
        rebuild.account_id,
        rebuild.instrument_id,
        rebuild.trade_currency,
      );
      if (rebuildByChain.has(key)) integrityFailure("journal_rebuild_history_fork");
      assertJournalCurrency(rebuild.trade_currency, "tradeCurrency");
      assertJournalSha256(rebuild.chain_key_sha256, "chainKeySha256");
      assertJournalSha256(rebuild.ordered_input_sha256, "orderedInputSha256");
      assertJournalSha256(rebuild.output_sha256, "outputSha256");
      assertJournalUtcTimestamp(rebuild.completed_at_utc, "completedAtUtc");
      requireNonNegativeInteger(rebuild.ready_closed_count, "analytics_rebuild_counts");
      requireNonNegativeInteger(rebuild.legitimate_open_count, "analytics_rebuild_counts");
      requireNonNegativeInteger(rebuild.needs_decision_count, "analytics_rebuild_counts");
      requireNonNegativeInteger(rebuild.excluded_count, "analytics_rebuild_counts");
      if (
        rebuild.chain_key_sha256 !== expectedChainKey(
          scope.workspaceId,
          rebuild.account_id,
          rebuild.instrument_id,
          rebuild.trade_currency,
        )
      ) {
        integrityFailure("journal_rebuild_chain_key_mismatch");
      }
      rebuildByChain.set(key, rebuild);
    }

    const roundTripRows = this.database.prepare(`
SELECT round_trip.round_trip_id, version.round_trip_version_id,
       version.version_number, round_trip.account_id, version.instrument_id,
       instrument.normalized_symbol, instrument.asset_class,
       version.trade_currency, version.direction, version.opened_at_utc,
       version.closed_at_utc, version.final_position_decimal,
       version.projection_state, version.coverage_reason_code,
       version.projection_fingerprint_sha256, version.rebuild_id,
       version.chain_key_sha256
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ?
  AND round_trip.account_id IN (${placeholders})
  AND round_trip.lifecycle_state = 'active'
  AND version.round_trip_version_id NOT IN (
    SELECT seeded_allocation.round_trip_version_id
    FROM journal_round_trip_execution_allocations seeded_allocation
    JOIN journal_execution_provenance seeded_provenance
      ON seeded_provenance.workspace_id = seeded_allocation.workspace_id
     AND seeded_provenance.account_id = seeded_allocation.account_id
     AND seeded_provenance.execution_version_id = seeded_allocation.execution_version_id
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )
ORDER BY round_trip.account_id, version.opened_at_utc,
         version.round_trip_version_id`).all(...parameters) as RoundTripRow[];

    const allocationRows = this.database.prepare(`
SELECT allocation.allocation_id, allocation.round_trip_version_id,
       allocation.account_id, allocation.allocation_sequence,
       allocation.allocation_role, allocation.quantity_decimal,
       version.execution_id, version.execution_version_id,
       execution.current_version_id AS current_execution_version_id,
       execution.current_state, version.executed_at_utc,
       version.source_order_key, version.side,
       version.quantity_decimal AS execution_quantity_decimal,
       version.price_decimal, version.fees_decimal, version.fee_currency,
       version.fee_sign_convention, version.fact_completeness
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = round_trip.current_version_id
 AND round_trip_version.workspace_id = round_trip.workspace_id
 AND round_trip_version.account_id = round_trip.account_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.round_trip_version_id = round_trip_version.round_trip_version_id
 AND allocation.workspace_id = round_trip.workspace_id
 AND allocation.account_id = round_trip.account_id
JOIN journal_execution_versions version
  ON version.execution_version_id = allocation.execution_version_id
 AND version.workspace_id = allocation.workspace_id
 AND version.account_id = allocation.account_id
JOIN journal_executions execution
  ON execution.execution_id = version.execution_id
 AND execution.workspace_id = version.workspace_id
 AND execution.account_id = version.account_id
WHERE round_trip.workspace_id = ?
  AND round_trip.account_id IN (${placeholders})
  AND round_trip.lifecycle_state = 'active'
  AND round_trip_version.round_trip_version_id NOT IN (
    SELECT seeded_allocation.round_trip_version_id
    FROM journal_round_trip_execution_allocations seeded_allocation
    JOIN journal_execution_provenance seeded_provenance
      ON seeded_provenance.workspace_id = seeded_allocation.workspace_id
     AND seeded_provenance.account_id = seeded_allocation.account_id
     AND seeded_provenance.execution_version_id = seeded_allocation.execution_version_id
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )
ORDER BY allocation.account_id, allocation.round_trip_version_id,
         allocation.allocation_sequence, allocation.allocation_id`).all(
      ...parameters,
    ) as AllocationRow[];

    const currentExecutionRows = this.database.prepare(`
SELECT execution.account_id, execution.execution_id,
       execution.current_version_id, execution.current_state,
       version.quantity_decimal
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_id = execution.execution_id
 AND version.execution_version_id = execution.current_version_id
WHERE execution.workspace_id = ?
  AND execution.account_id IN (${placeholders})
  AND execution.current_state IN ('accepted', 'needs_decision')
  AND execution.current_version_id NOT IN (
    SELECT seeded_provenance.execution_version_id
    FROM journal_execution_provenance seeded_provenance
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )
ORDER BY execution.account_id, execution.current_version_id`).all(
      ...parameters,
    ) as CurrentExecutionRow[];

    const provenanceRows = this.database.prepare(`
SELECT provenance.account_id, provenance.execution_version_id,
       provenance.provenance_kind, import_batch.source_system,
       import_batch.adapter_id, import_batch.adapter_version
FROM journal_execution_provenance provenance
JOIN journal_import_batches import_batch
  ON import_batch.workspace_id = provenance.workspace_id
 AND import_batch.account_id = provenance.account_id
 AND import_batch.import_batch_id = provenance.import_batch_id
JOIN journal_executions execution
  ON execution.workspace_id = provenance.workspace_id
 AND execution.account_id = provenance.account_id
 AND execution.execution_id = provenance.execution_id
 AND execution.current_version_id = provenance.execution_version_id
WHERE provenance.workspace_id = ?
  AND provenance.account_id IN (${placeholders})
ORDER BY provenance.account_id, provenance.execution_version_id,
         provenance.provenance_kind, import_batch.source_system,
         import_batch.adapter_id, import_batch.adapter_version`).all(
      ...parameters,
    ) as ProvenanceRow[];

    const decisionRows = this.database.prepare(`
SELECT decision.decision_id, decision.account_id, decision.issue_code,
       decision.effect_code, decision.revision, decision.target_kind,
       decision.chain_key_sha256, decision.execution_id,
       coalesce(issue.instrument_id, position.instrument_id,
                execution_version.instrument_id) AS instrument_id,
       coalesce(issue.trade_currency, position.currency,
                execution_version.trade_currency) AS trade_currency,
       decision.updated_at_utc
FROM journal_data_decisions decision
LEFT JOIN journal_source_row_issues issue
  ON decision.target_kind = 'source_issue'
 AND issue.workspace_id = decision.workspace_id
 AND issue.account_id = decision.account_id
 AND issue.source_issue_id = decision.source_issue_id
LEFT JOIN journal_position_facts position
  ON decision.target_kind = 'position_fact'
 AND position.workspace_id = decision.workspace_id
 AND position.account_id = decision.account_id
 AND position.position_fact_id = decision.position_fact_id
LEFT JOIN journal_executions execution
  ON decision.target_kind = 'execution'
 AND execution.workspace_id = decision.workspace_id
 AND execution.account_id = decision.account_id
 AND execution.execution_id = decision.execution_id
LEFT JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = execution.workspace_id
 AND execution_version.account_id = execution.account_id
 AND execution_version.execution_version_id = execution.current_version_id
WHERE decision.workspace_id = ?
  AND decision.account_id IN (${placeholders})
  AND decision.state = 'pending'
ORDER BY decision.account_id, decision.decision_id`).all(
      ...parameters,
    ) as DecisionRow[];

    const pendingDecisions = freezeArray(decisionRows.map((row) => {
      assertCanonicalUuidV4(row.decision_id, "decisionId");
      assertJournalUtcTimestamp(row.updated_at_utc, "decisionUpdatedAtUtc");
      if (!Number.isSafeInteger(row.revision) || row.revision < 1) {
        integrityFailure("analytics_decision_revision");
      }
      if (row.chain_key_sha256 !== null) {
        assertJournalSha256(row.chain_key_sha256, "decisionChainKeySha256");
      }
      if (row.trade_currency !== null) {
        assertJournalCurrency(row.trade_currency, "decisionTradeCurrency");
      }
      return Object.freeze({
        decisionId: row.decision_id,
        accountId: row.account_id,
        issueCode: row.issue_code,
        effectCode: row.effect_code,
        revision: row.revision,
        targetKind: row.target_kind,
        chainKeySha256: row.chain_key_sha256,
        executionId: row.execution_id,
        instrumentId: row.instrument_id,
        tradeCurrency: row.trade_currency,
        updatedAtUtc: row.updated_at_utc,
      });
    }));

    const provenanceByExecution = new Map<string, ProvenanceRow[]>();
    for (const row of provenanceRows) {
      const key = executionVersionScopeKey(
        row.account_id,
        row.execution_version_id,
      );
      const values = provenanceByExecution.get(key) ?? [];
      values.push(row);
      provenanceByExecution.set(key, values);
    }

    const currentExecutionByVersion = new Map<string, CurrentExecutionRow>();
    for (const execution of currentExecutionRows) {
      assertCanonicalJournalDecimal(
        execution.quantity_decimal,
        "executionQuantityDecimal",
        { positive: true },
      );
      const key = executionVersionScopeKey(
        execution.account_id,
        execution.current_version_id,
      );
      if (currentExecutionByVersion.has(key)) {
        integrityFailure("analytics_execution_version_duplicate");
      }
      currentExecutionByVersion.set(key, execution);
    }

    const allocationsByRoundTripVersion = new Map<string, AllocationRow[]>();
    const allocatedByExecutionVersion = new Map<string, string>();
    for (const allocation of allocationRows) {
      if (
        allocation.current_execution_version_id !== allocation.execution_version_id ||
        (allocation.current_state !== "accepted" &&
          allocation.current_state !== "needs_decision")
      ) {
        integrityFailure("analytics_allocation_not_current");
      }
      assertCanonicalJournalDecimal(
        allocation.quantity_decimal,
        "allocatedQuantityDecimal",
        { positive: true },
      );
      assertCanonicalJournalDecimal(
        allocation.execution_quantity_decimal,
        "executionQuantityDecimal",
        { positive: true },
      );
      assertJournalUtcTimestamp(allocation.executed_at_utc, "executedAtUtc");
      if (allocation.price_decimal !== null) {
        assertCanonicalJournalDecimal(allocation.price_decimal, "priceDecimal", {
          positive: true,
        });
      }
      if (allocation.fees_decimal !== null) {
        assertCanonicalJournalDecimal(allocation.fees_decimal, "feesDecimal");
      }
      if (allocation.fee_currency !== null) {
        assertJournalCurrency(allocation.fee_currency, "feeCurrency");
      }
      const group = allocationsByRoundTripVersion.get(
        allocation.round_trip_version_id,
      ) ?? [];
      group.push(allocation);
      allocationsByRoundTripVersion.set(allocation.round_trip_version_id, group);
      const key = executionVersionScopeKey(
        allocation.account_id,
        allocation.execution_version_id,
      );
      allocatedByExecutionVersion.set(
        key,
        addDecimal(
          allocatedByExecutionVersion.get(key) ?? "0",
          allocation.quantity_decimal,
        ),
      );
    }
    for (const [key, execution] of currentExecutionByVersion) {
      if (
        compareDecimal(
          allocatedByExecutionVersion.get(key) ?? "0",
          execution.quantity_decimal,
        ) !== 0
      ) {
        integrityFailure("analytics_allocation_conservation");
      }
    }
    for (const key of allocatedByExecutionVersion.keys()) {
      if (!currentExecutionByVersion.has(key)) {
        integrityFailure("analytics_allocation_unknown_execution");
      }
    }

    const roundTrips = freezeArray(roundTripRows.map((row) => {
      assertCanonicalJournalDecimal(
        row.final_position_decimal,
        "finalPositionDecimal",
      );
      assertJournalCurrency(row.trade_currency, "tradeCurrency");
      assertJournalUtcTimestamp(row.opened_at_utc, "openedAtUtc");
      if (row.closed_at_utc !== null) {
        assertJournalUtcTimestamp(row.closed_at_utc, "closedAtUtc");
      }
      assertJournalSha256(
        row.projection_fingerprint_sha256,
        "projectionFingerprintSha256",
      );
      const rebuild = rebuildByChain.get(chainScopeKey(
        row.account_id,
        row.instrument_id,
        row.trade_currency,
      ));
      if (
        !rebuild ||
        rebuild.rebuild_id !== row.rebuild_id ||
        rebuild.chain_key_sha256 !== row.chain_key_sha256
      ) {
        integrityFailure("analytics_round_trip_rebuild_stale");
      }
      const rawAllocations = allocationsByRoundTripVersion.get(
        row.round_trip_version_id,
      ) ?? [];
      rawAllocations.forEach((allocation, index) => {
        if (allocation.allocation_sequence !== index + 1) {
          integrityFailure("analytics_allocation_sequence");
        }
      });
      if (row.projection_state === "ready_closed") {
        if (
          rawAllocations.length === 0 ||
          row.closed_at_utc === null ||
          row.final_position_decimal !== "0" ||
          row.coverage_reason_code !== null ||
          rawAllocations.some((allocation) =>
            allocation.price_decimal === null ||
            allocation.fact_completeness !== "complete")
        ) {
          integrityFailure("analytics_ready_closed_invariant");
        }
        const signedQuantity = rawAllocations.reduce(
          (sum, allocation) => addDecimal(
            sum,
            allocation.side === "buy"
              ? allocation.quantity_decimal
              : negateDecimal(allocation.quantity_decimal),
          ),
          "0",
        );
        if (compareDecimal(signedQuantity, "0") !== 0) {
          integrityFailure("analytics_ready_closed_position_path");
        }
      } else if (row.projection_state === "legitimate_open") {
        if (
          row.closed_at_utc !== null ||
          row.final_position_decimal === "0" ||
          row.coverage_reason_code !== null
        ) {
          integrityFailure("analytics_legitimate_open_invariant");
        }
      } else if (row.coverage_reason_code === null) {
        integrityFailure("analytics_needs_decision_invariant");
      }
      for (const allocation of rawAllocations) {
        const increases = new Set(["opening", "adding", "flip_opening"])
          .has(allocation.allocation_role);
        const expectedSide = row.direction === "long"
          ? (increases ? "buy" : "sell")
          : (increases ? "sell" : "buy");
        if (allocation.side !== expectedSide) {
          integrityFailure("analytics_allocation_direction");
        }
      }
      const allocations = freezeArray(rawAllocations.map((allocation) => {
        const provenanceRowsForExecution = provenanceByExecution.get(
          executionVersionScopeKey(
            allocation.account_id,
            allocation.execution_version_id,
          ),
        ) ?? [];
        const provenanceKinds = sortedUnique(
          provenanceRowsForExecution.map((entry) => entry.provenance_kind),
        );
        const candidateByKey = new Map<string, JournalAnalyticsFeePolicyCandidate>();
        for (const provenance of provenanceRowsForExecution) {
          const candidate = Object.freeze({
            sourceSystem: provenance.source_system,
            adapterId: provenance.adapter_id,
            adapterVersion: provenance.adapter_version,
            provenanceKind: provenance.provenance_kind,
          });
          candidateByKey.set(JSON.stringify(candidate), candidate);
        }
        return Object.freeze({
          allocationId: allocation.allocation_id,
          allocationSequence: allocation.allocation_sequence,
          allocationRole: allocation.allocation_role,
          executionId: allocation.execution_id,
          executionVersionId: allocation.execution_version_id,
          executionState: allocation.current_state as "accepted" | "needs_decision",
          executedAtUtc: allocation.executed_at_utc,
          sourceOrderKey: allocation.source_order_key,
          side: allocation.side,
          allocatedQuantityDecimal: allocation.quantity_decimal,
          executionQuantityDecimal: allocation.execution_quantity_decimal,
          priceDecimal: allocation.price_decimal,
          feesDecimal: allocation.fees_decimal,
          feeCurrency: allocation.fee_currency,
          feeSignConvention: allocation.fee_sign_convention,
          factCompleteness: allocation.fact_completeness,
          provenanceKinds,
          feePolicyCandidates: freezeArray(
            [...candidateByKey.entries()]
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([, candidate]) => candidate),
          ),
        });
      }));
      const executionIds = new Set(
        allocations.map((allocation) => allocation.executionId),
      );
      const decisions = pendingDecisions.filter((decision) =>
        relevantDecision(decision, row, executionIds));
      return Object.freeze({
        roundTripId: row.round_trip_id,
        roundTripVersionId: row.round_trip_version_id,
        versionNumber: row.version_number,
        accountId: row.account_id,
        instrumentId: row.instrument_id,
        displayedSymbol: row.normalized_symbol,
        assetClass: row.asset_class,
        tradeCurrency: row.trade_currency,
        direction: row.direction,
        openedAtUtc: row.opened_at_utc,
        closedAtUtc: row.closed_at_utc,
        finalPositionDecimal: row.final_position_decimal,
        projectionState: row.projection_state,
        coverageReasonCode: row.coverage_reason_code,
        projectionFingerprintSha256: row.projection_fingerprint_sha256,
        rebuild: Object.freeze({
          rebuildId: rebuild.rebuild_id,
          chainKeySha256: rebuild.chain_key_sha256,
          algorithmVersion: rebuild.algorithm_version,
          orderedInputSha256: rebuild.ordered_input_sha256,
          outputSha256: rebuild.output_sha256,
          coverageState: rebuild.coverage_state,
          readyClosedCount: rebuild.ready_closed_count,
          legitimateOpenCount: rebuild.legitimate_open_count,
          needsDecisionCount: rebuild.needs_decision_count,
          excludedCount: rebuild.excluded_count,
          completedAtUtc: rebuild.completed_at_utc,
        }),
        allocations,
        pendingDecisionIds: freezeArray(decisions.map((entry) => entry.decisionId)),
        pendingDecisionReasonCodes: sortedUnique(
          decisions.map((entry) => entry.issueCode),
        ),
      });
    }));

    for (const rebuild of latestRebuildRows) {
      const rows = roundTrips.filter((roundTrip) =>
        roundTrip.rebuild.rebuildId === rebuild.rebuild_id);
      if (
        rows.filter((row) => row.projectionState === "ready_closed").length !==
          rebuild.ready_closed_count ||
        rows.filter((row) => row.projectionState === "legitimate_open").length !==
          rebuild.legitimate_open_count ||
        rows.filter((row) => row.projectionState === "needs_decision").length !==
          rebuild.needs_decision_count
      ) {
        integrityFailure("analytics_rebuild_projection_counts");
      }
    }

    const coverageRepository = new JournalIntegrityReadRepository(this.database);
    const accounts = freezeArray(accountRows.map((account) => {
      const coverage = coverageRepository.coverageSummary(Object.freeze({
        userId: scope.userId,
        workspaceId: scope.workspaceId,
        workspaceRole: scope.workspaceRole,
        accountId: account.account_id,
      }));
      return Object.freeze({
        accountId: account.account_id,
        baseCurrency: account.base_currency,
        tradingTimezone: account.trading_timezone,
        earliestAvailableLocalDate: coverage.coverageIntervals.earliestLocalDate,
        latestAvailableLocalDate: coverage.coverageIntervals.latestLocalDate,
        coverage,
      }) satisfies JournalAnalyticsAccountFact;
    }));
    const earliestDates = accounts
      .map((account) => account.earliestAvailableLocalDate)
      .filter((value): value is string => value !== null)
      .sort();
    const latestDates = accounts
      .map((account) => account.latestAvailableLocalDate)
      .filter((value): value is string => value !== null)
      .sort();
    const sourceRevisionSha256 = sha256Json({
      contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
      workspaceId: scope.workspaceId,
      requestedAccountIds: request.accountIds,
      accounts: accounts.map((account) => ({
        accountId: account.accountId,
        baseCurrency: account.baseCurrency,
        tradingTimezone: account.tradingTimezone,
        coverage: account.coverage,
      })),
      roundTrips,
      pendingDecisions,
    });
    const generatedAtUtc = createCanonicalUtcTimestamp(this.now());
    return Object.freeze({
      contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
      workspaceId: scope.workspaceId,
      requestedAccountIds: request.accountIds,
      requestedClosingDateRange: request.closingDateRange,
      requestedCurrencySelection: request.currencySelection,
      generatedAtUtc,
      sourceRevisionSha256,
      earliestAvailableLocalDate: earliestDates[0] ?? null,
      latestAvailableLocalDate: latestDates.at(-1) ?? null,
      accounts,
      roundTrips,
      pendingDecisions,
    });
  }
}
