import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalCountByCode,
  JournalIntegrityCoverageSummary,
  JournalRebuildCoverageRecord,
} from "../contracts/journal-integrity-coverage-contracts";

type GroupedCountRow = Readonly<{ code: string; count: number }>;

function counts(rows: readonly GroupedCountRow[]): JournalCountByCode {
  return Object.freeze(Object.fromEntries(rows.map((row) => [row.code, row.count])));
}

function total(grouped: JournalCountByCode): number {
  return Object.values(grouped).reduce((sum, value) => sum + value, 0);
}

type CoverageIntervalRow = Readonly<{
  asset_class: string;
  coverage_kind: string;
  local_start_date: string;
  local_end_date: string;
  source_timezone: string;
}>;

function nextLocalDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function completeCoverageShape(
  rows: readonly CoverageIntervalRow[],
  tradingTimezone: string,
): Readonly<{
  compatibleCount: number;
  timezoneMismatchCount: number;
  overlapCount: number;
  gapCount: number;
  earliestLocalDate: string | null;
  latestLocalDate: string | null;
}> {
  const compatible = rows.filter((row) =>
    row.coverage_kind === "complete" && row.source_timezone === tradingTimezone);
  let overlapCount = 0;
  let gapCount = 0;
  const byAsset = new Map<string, CoverageIntervalRow[]>();
  for (const row of compatible) {
    const group = byAsset.get(row.asset_class) ?? [];
    group.push(row);
    byAsset.set(row.asset_class, group);
  }
  for (const group of byAsset.values()) {
    const sorted = [...group].sort((left, right) =>
      left.local_start_date.localeCompare(right.local_start_date) ||
      left.local_end_date.localeCompare(right.local_end_date));
    let currentEnd: string | null = null;
    for (const row of sorted) {
      if (currentEnd === null) {
        currentEnd = row.local_end_date;
        continue;
      }
      if (row.local_start_date <= currentEnd) overlapCount += 1;
      else if (row.local_start_date > nextLocalDate(currentEnd)) gapCount += 1;
      if (row.local_end_date > currentEnd) currentEnd = row.local_end_date;
    }
  }
  const starts = rows.map((row) => row.local_start_date).sort();
  const ends = rows.map((row) => row.local_end_date).sort();
  return Object.freeze({
    compatibleCount: compatible.length,
    timezoneMismatchCount: rows.filter((row) =>
      row.source_timezone !== tradingTimezone).length,
    overlapCount,
    gapCount,
    earliestLocalDate: starts[0] ?? null,
    latestLocalDate: ends.at(-1) ?? null,
  });
}

export class JournalIntegrityReadRepository {
  constructor(private readonly database: Database.Database) {}

  coverageSummary(scope: AccountScope): JournalIntegrityCoverageSummary {
    const parameters = [scope.workspaceId, scope.accountId] as const;
    const account = this.database.prepare<[string, string], {
      base_currency: string;
      trading_timezone: string;
    }>(`SELECT base_currency, trading_timezone FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`).get(...parameters);
    if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    const sourceRecords = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT initial_classification AS code, COUNT(*) AS count
FROM journal_source_rows WHERE workspace_id = ? AND account_id = ?
GROUP BY initial_classification ORDER BY initial_classification`).all(...parameters));
    const imports = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT current_state AS code, COUNT(*) AS count
FROM journal_import_batches WHERE workspace_id = ? AND account_id = ?
GROUP BY current_state ORDER BY current_state`).all(...parameters));
    const executions = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT current_state AS code, COUNT(*) AS count
FROM journal_executions WHERE workspace_id = ? AND account_id = ?
GROUP BY current_state ORDER BY current_state`).all(...parameters));
    const decisions = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT state AS code, COUNT(*) AS count
FROM journal_data_decisions WHERE workspace_id = ? AND account_id = ?
GROUP BY state ORDER BY state`).all(...parameters));
    const pendingDecisionReasons = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT issue_code AS code, COUNT(*) AS count
FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND state = 'pending'
GROUP BY issue_code ORDER BY issue_code`).all(...parameters));
    const resolvedDecisionActions = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT event.action AS code, COUNT(*) AS count
FROM journal_data_decisions decision
JOIN journal_data_decision_events event
  ON event.workspace_id = decision.workspace_id
 AND event.account_id = decision.account_id
 AND event.decision_id = decision.decision_id
 AND event.decision_event_id = decision.current_event_id
WHERE decision.workspace_id = ? AND decision.account_id = ?
  AND decision.state = 'resolved'
GROUP BY event.action ORDER BY event.action`).all(...parameters));
    const acceptedSourceLimitations = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT decision.issue_code AS code, COUNT(*) AS count
FROM journal_data_decisions decision
JOIN journal_data_decision_events event
  ON event.workspace_id = decision.workspace_id
 AND event.account_id = decision.account_id
 AND event.decision_id = decision.decision_id
 AND event.decision_event_id = decision.current_event_id
WHERE decision.workspace_id = ? AND decision.account_id = ?
  AND decision.state = 'resolved' AND event.action = 'accept_source_limitation'
GROUP BY decision.issue_code ORDER BY decision.issue_code`).all(...parameters));
    const roundTrips = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT v.projection_state AS code, COUNT(*) AS count
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE r.workspace_id = ? AND r.account_id = ? AND r.lifecycle_state = 'active'
GROUP BY v.projection_state ORDER BY v.projection_state`).all(...parameters));
    const positionFacts = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT f.fact_kind AS code, COUNT(*) AS count
FROM journal_position_facts f
WHERE f.workspace_id = ? AND f.account_id = ? AND NOT EXISTS (
  SELECT 1 FROM journal_position_facts next
  WHERE next.workspace_id = f.workspace_id AND next.account_id = f.account_id
    AND next.instrument_id = f.instrument_id AND next.currency = f.currency
    AND next.supersedes_position_fact_id = f.position_fact_id
)
GROUP BY f.fact_kind ORDER BY f.fact_kind`).all(...parameters));
    const coverage = counts(this.database.prepare<[string, string], GroupedCountRow>(`
SELECT coverage_kind AS code, COUNT(*) AS count
FROM journal_source_coverage_intervals WHERE workspace_id = ? AND account_id = ?
GROUP BY coverage_kind ORDER BY coverage_kind`).all(...parameters));
    const coverageRows = this.database.prepare<[string, string], CoverageIntervalRow>(`
SELECT asset_class, coverage_kind, local_start_date, local_end_date, source_timezone
FROM journal_source_coverage_intervals
WHERE workspace_id = ? AND account_id = ?
ORDER BY asset_class, local_start_date, local_end_date, coverage_interval_id`)
      .all(...parameters);
    const coverageShape = completeCoverageShape(
      coverageRows,
      account.trading_timezone,
    );
    const unsupported = counts(this.database.prepare<[string, string], GroupedCountRow>(`
WITH unsupported_rows AS (
  SELECT CASE lower(replace(replace(trim(ifnull(asset_category, '')), ' ', ''), '-', ''))
    WHEN '' THEN 'unknown'
    WHEN 'stocks' THEN 'stock'
    WHEN 'equityandindexoptions' THEN 'option'
    WHEN 'options' THEN 'option'
    WHEN 'forex' THEN 'forex'
    WHEN 'futures' THEN 'future'
    WHEN 'crypto' THEN 'crypto'
    WHEN 'cryptocurrencies' THEN 'crypto'
    ELSE 'other'
  END AS code
  FROM journal_source_rows
  WHERE workspace_id = ? AND account_id = ? AND initial_classification = 'unsupported'
)
SELECT code, COUNT(*) AS count FROM unsupported_rows
GROUP BY code ORDER BY code`).all(...parameters));
    const latestRebuildRows = this.database.prepare<[string, string], {
      instrument_id: string;
      trade_currency: string;
      chain_key_sha256: string;
      algorithm_version: string;
      ordered_input_sha256: string;
      output_sha256: string;
      coverage_state: JournalRebuildCoverageRecord["coverageState"];
      needs_decision_count: number;
      excluded_count: number;
      completed_at_utc: string;
    }>(`
SELECT instrument_id, trade_currency, chain_key_sha256, algorithm_version,
       ordered_input_sha256, output_sha256, coverage_state, needs_decision_count,
       excluded_count, completed_at_utc
FROM journal_chain_rebuilds current
WHERE current.workspace_id = ? AND current.account_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_chain_rebuilds next
    WHERE next.workspace_id = current.workspace_id
      AND next.account_id = current.account_id
      AND next.instrument_id = current.instrument_id
      AND next.trade_currency = current.trade_currency
      AND next.previous_rebuild_id = current.rebuild_id
  )
ORDER BY chain_key_sha256, rebuild_id`).all(...parameters);
    const latestChainScopes = latestRebuildRows.map((row) => JSON.stringify([
      row.instrument_id,
      row.trade_currency,
    ]));
    if (new Set(latestChainScopes).size !==
      latestRebuildRows.length) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "journal_rebuild_history_fork",
      });
    }
    for (const row of latestRebuildRows) {
      const expectedChainKeySha256 = createHash("sha256").update(JSON.stringify([
        "journal-chain-v1",
        scope.workspaceId,
        scope.accountId,
        row.instrument_id,
        row.trade_currency,
      ]), "utf8").digest("hex");
      if (row.chain_key_sha256 !== expectedChainKeySha256) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "journal_rebuild_chain_key_mismatch",
        });
      }
    }
    const pendingChainKeys = new Set(this.database.prepare<[string, string], {
      chain_key_sha256: string;
    }>(`
SELECT DISTINCT chain_key_sha256
FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ?
  AND state = 'pending' AND target_kind = 'chain'
ORDER BY chain_key_sha256`).all(...parameters).map((row) => row.chain_key_sha256));
    const sourceLimitationChains = new Set(this.database.prepare<[string, string], {
      instrument_id: string;
      trade_currency: string;
    }>(`
SELECT DISTINCT issue.instrument_id, issue.trade_currency
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
ORDER BY issue.instrument_id, issue.trade_currency`).all(...parameters).map((row) =>
      `${row.instrument_id}\u001f${row.trade_currency}`));
    const affectedChainCount = latestRebuildRows.filter((row) =>
      row.needs_decision_count > 0 ||
      pendingChainKeys.has(row.chain_key_sha256) ||
      sourceLimitationChains.has(`${row.instrument_id}\u001f${row.trade_currency}`)).length;
    const unaffectedChainCount = latestRebuildRows.length - affectedChainCount;
    const latestRebuilds = Object.freeze(latestRebuildRows.map((row) => Object.freeze({
      chainKeySha256: row.chain_key_sha256,
      algorithmVersion: row.algorithm_version,
      orderedInputSha256: row.ordered_input_sha256,
      outputSha256: row.output_sha256,
      coverageState: row.coverage_state,
      excludedExecutionCount: row.excluded_count,
      completedAtUtc: row.completed_at_utc,
    })));
    return Object.freeze({
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      accountScope: Object.freeze({
        baseCurrency: account.base_currency,
        tradingTimezone: account.trading_timezone,
      }),
      sourceRecords: Object.freeze({ total: total(sourceRecords), byClassification: sourceRecords }),
      imports: Object.freeze({ total: total(imports), byState: imports }),
      executions: Object.freeze({ total: total(executions), byState: executions }),
      decisions: Object.freeze({
        total: total(decisions),
        byState: decisions,
        pendingByReason: pendingDecisionReasons,
        resolvedByAction: resolvedDecisionActions,
        acceptedSourceLimitationsByIssue: acceptedSourceLimitations,
      }),
      roundTrips: Object.freeze({
        activeTotal: total(roundTrips),
        byProjectionState: roundTrips,
        affectedChainCount,
        unaffectedChainCount,
      }),
      positionFacts: Object.freeze({ currentTotal: total(positionFacts), byKind: positionFacts }),
      coverageIntervals: Object.freeze({
        total: total(coverage),
        byKind: coverage,
        accountTimezoneCompatibleCompleteCount: coverageShape.compatibleCount,
        accountTimezoneMismatchCount: coverageShape.timezoneMismatchCount,
        overlappingCompleteIntervalCount: coverageShape.overlapCount,
        completeCoverageGapCount: coverageShape.gapCount,
        earliestLocalDate: coverageShape.earliestLocalDate,
        latestLocalDate: coverageShape.latestLocalDate,
      }),
      unsupportedSourceRecords: Object.freeze({ total: total(unsupported), byAssetCategory: unsupported }),
      rebuilds: Object.freeze({
        latestByChain: latestRebuilds,
        freshness: latestRebuilds.length > 0 ? "recorded_not_recomputed" : "unavailable",
      }),
    });
  }
}
