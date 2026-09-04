import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { DailyTradeAnalyzerDirection, DailyTradeAnalyzerEvent } from "../contracts/daily-trade-analyzer-contracts";
import type { JournalLogicalTrade } from "@/src/modules/journal/contracts/journal-logical-trade-contracts";
import type { DailyTradeAnalyzerResult } from "../contracts/daily-trade-analyzer-contracts";
import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import type { DailyTradeExecutionCandleMismatch } from "./daily-trade-execution-candle-validation";

export type ClaimedLogicalTradeAnalyzerJob = Readonly<{
  attemptCount: number;
  createdAtUtc: string;
  desiredCoverageEndUtc: string;
  jobId: string;
  marketSessionSetId: string;
  scope: AccountScope;
  target: LogicalTradeAnalyzerTarget;
}>;

export type LogicalTradeAnalyzerTarget = Readonly<{
  logicalTradeId: string;
  logicalTradeVersionId: string;
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
  finalExitAtUtc: string;
  openedAtUtc: string;
  providerSymbol: string;
  representativeRoundTripId: string;
  tradingDateNewYork: string;
}>;

export type LogicalTradeAnalyzerSavedResult = Readonly<{
  availableAtUtc: string | null;
  analyzed: DailyTradeAnalyzerResult | null;
  candles: readonly NormalizedMarketCandle[];
  logicalTradeVersionId: string;
  mismatches: readonly DailyTradeExecutionCandleMismatch[];
  status: "pending" | "ready" | "correction_required" | "no_coverage" | "provider_unavailable" | "expired" | "stale";
}>;

type AllocationRow = Readonly<{
  allocation_id: string;
  allocation_role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
  member_sequence: number;
  allocation_sequence: number;
  direction: DailyTradeAnalyzerDirection;
  normalized_symbol: string;
  executed_at_utc: string;
  execution_id: string;
  fees_decimal: string | null;
  price_decimal: string | null;
  quantity_decimal: string;
  round_trip_id: string;
}>;

function newYorkDate(timestamp: string): string | null {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year && values.month && values.day ? `${values.year}-${values.month}-${values.day}` : null;
}

export class LogicalTradeAnalyzerRepository {
  constructor(private readonly database: Database.Database) {}

  alreadyRequested(scope: AccountScope, logicalTradeVersionId: string): boolean {
    return Boolean(this.database.prepare(`SELECT 1 FROM level_analysis_logical_trade_jobs
WHERE workspace_id = ? AND account_id = ? AND logical_trade_version_id = ?
 AND status IN ('queued', 'leased', 'completed') LIMIT 1`).get(
      scope.workspaceId, scope.accountId, logicalTradeVersionId,
    ));
  }

  readCurrentByRoundTrip(scope: AccountScope, roundTripId: string): LogicalTradeAnalyzerSavedResult | null {
    const row = this.database.prepare(`SELECT analysis.logical_trade_version_id, analysis.status,
 version.result_json, version.evidence_candles_json, version.execution_mismatches_json,
 (SELECT job.desired_coverage_end_utc FROM level_analysis_logical_trade_jobs job
  WHERE job.workspace_id = analysis.workspace_id AND job.account_id = analysis.account_id
    AND job.logical_trade_id = analysis.logical_trade_id
    AND job.logical_trade_version_id = analysis.logical_trade_version_id
    AND job.status IN ('queued', 'leased')
  ORDER BY job.created_at_utc DESC LIMIT 1) AS available_at_utc
FROM journal_active_logical_trade_memberships membership
JOIN journal_logical_trade_daily_analyses analysis
 ON analysis.workspace_id = membership.workspace_id
 AND analysis.account_id = membership.account_id
 AND analysis.logical_trade_id = membership.logical_trade_id
JOIN journal_logical_trade_daily_analysis_versions version
 ON version.logical_trade_analysis_id = analysis.logical_trade_analysis_id
 AND version.revision_number = analysis.current_revision
WHERE membership.workspace_id = ? AND membership.account_id = ?
 AND membership.round_trip_id = ? AND analysis.logical_trade_version_id = membership.logical_trade_version_id
LIMIT 1`).get(scope.workspaceId, scope.accountId, roundTripId) as
      | { logical_trade_version_id: string; status: LogicalTradeAnalyzerSavedResult["status"];
          result_json: string | null; evidence_candles_json: string | null;
          execution_mismatches_json: string | null; available_at_utc: string | null }
      | undefined;
    if (!row) {
      const state = this.database.prepare(`SELECT membership.logical_trade_id,
 membership.logical_trade_version_id,
 analysis.logical_trade_version_id AS analyzed_version_id,
 (SELECT job.desired_coverage_end_utc FROM level_analysis_logical_trade_jobs job
  WHERE job.workspace_id = membership.workspace_id AND job.account_id = membership.account_id
   AND job.logical_trade_id = membership.logical_trade_id
   AND job.logical_trade_version_id = membership.logical_trade_version_id
   AND job.status IN ('queued', 'leased')
  ORDER BY job.created_at_utc DESC LIMIT 1) AS available_at_utc
FROM journal_active_logical_trade_memberships membership
LEFT JOIN journal_logical_trade_daily_analyses analysis
 ON analysis.workspace_id = membership.workspace_id
 AND analysis.account_id = membership.account_id
 AND analysis.logical_trade_id = membership.logical_trade_id
WHERE membership.workspace_id = ? AND membership.account_id = ?
 AND membership.round_trip_id = ? LIMIT 1`).get(
        scope.workspaceId, scope.accountId, roundTripId,
      ) as | { logical_trade_id: string; logical_trade_version_id: string;
          analyzed_version_id: string | null; available_at_utc: string | null }
        | undefined;
      if (!state) return null;
      if (state.available_at_utc) return Object.freeze({
        availableAtUtc: state.available_at_utc,
        analyzed: null,
        candles: Object.freeze([]),
        logicalTradeVersionId: state.logical_trade_version_id,
        mismatches: Object.freeze([]),
        status: "pending",
      });
      if (state.analyzed_version_id && state.analyzed_version_id !== state.logical_trade_version_id) {
        return Object.freeze({
          availableAtUtc: null,
          analyzed: null,
          candles: Object.freeze([]),
          logicalTradeVersionId: state.logical_trade_version_id,
          mismatches: Object.freeze([]),
          status: "stale",
        });
      }
      return null;
    }
    try {
      return Object.freeze({
        availableAtUtc: row.available_at_utc,
        analyzed: row.result_json ? JSON.parse(row.result_json) as DailyTradeAnalyzerResult : null,
        candles: Object.freeze(row.evidence_candles_json
          ? JSON.parse(row.evidence_candles_json) as NormalizedMarketCandle[] : []),
        logicalTradeVersionId: row.logical_trade_version_id,
        mismatches: Object.freeze(row.execution_mismatches_json
          ? JSON.parse(row.execution_mismatches_json) as DailyTradeExecutionCandleMismatch[] : []),
        status: row.status,
      });
    } catch {
      return null;
    }
  }

  target(scope: AccountScope, trade: JournalLogicalTrade): LogicalTradeAnalyzerTarget | null {
    if (!trade.logicalTradeId || trade.lifecycleState !== "active" || trade.tradeStyle !== "day") return null;
    const version = this.database.prepare(`SELECT current_version_id
FROM journal_logical_trades WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND lifecycle_state = 'active'`).get(scope.workspaceId, scope.accountId, trade.logicalTradeId) as
      | { current_version_id: string }
      | undefined;
    if (!version) return null;
    const rows = this.database.prepare(`SELECT allocation.allocation_id,
 allocation.allocation_role, member.member_sequence, allocation.allocation_sequence,
 round_version.direction, instrument.normalized_symbol,
 execution.executed_at_utc, execution.execution_id, execution.fees_decimal, execution.price_decimal,
 allocation.quantity_decimal, member.round_trip_id
FROM journal_logical_trade_version_members member
JOIN journal_round_trip_versions round_version
 ON round_version.workspace_id = member.workspace_id
 AND round_version.account_id = member.account_id
 AND round_version.round_trip_version_id = member.round_trip_version_id
JOIN journal_instruments instrument
 ON instrument.workspace_id = round_version.workspace_id
 AND instrument.instrument_id = round_version.instrument_id
JOIN journal_round_trip_execution_allocations allocation
 ON allocation.workspace_id = member.workspace_id
 AND allocation.account_id = member.account_id
 AND allocation.round_trip_version_id = member.round_trip_version_id
JOIN journal_execution_versions execution
 ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_version_id = allocation.execution_version_id
WHERE member.workspace_id = ? AND member.account_id = ?
 AND member.logical_trade_id = ? AND member.logical_trade_version_id = ?
ORDER BY execution.executed_at_utc, execution.source_order_key,
 member.member_sequence, allocation.allocation_sequence, allocation.allocation_id`).all(
      scope.workspaceId, scope.accountId, trade.logicalTradeId, version.current_version_id,
    ) as AllocationRow[];
    const first = rows[0];
    if (!first || rows.some((row) => row.price_decimal === null ||
      row.direction !== first.direction || row.normalized_symbol !== first.normalized_symbol)) return null;
    const openedDate = newYorkDate(rows[0]!.executed_at_utc);
    const closedDate = newYorkDate(rows.at(-1)!.executed_at_utc);
    if (!openedDate || openedDate !== closedDate) return null;
    const finalIndex = rows.length - 1;
    const events = rows.map((row, index): DailyTradeAnalyzerEvent => {
      const opens = row.allocation_role === "opening" || row.allocation_role === "flip_opening";
      const adds = row.allocation_role === "adding";
      const kind = index === finalIndex ? "final_exit" as const
        : opens ? "entry" as const
        : adds ? "add" as const
        : row.allocation_role === "closing" || row.allocation_role === "flip_closing"
          ? "temporary_flat" as const : "partial_exit" as const;
      return Object.freeze({
        eventId: row.execution_id,
        sequence: index + 1,
        kind,
        executedAtUtc: row.executed_at_utc,
        feesDecimal: row.fees_decimal,
        priceDecimal: row.price_decimal!,
        quantityDecimal: row.quantity_decimal,
      });
    });
    return Object.freeze({
      logicalTradeId: trade.logicalTradeId,
      logicalTradeVersionId: version.current_version_id,
      direction: first.direction,
      events: Object.freeze(events),
      finalExitAtUtc: rows.at(-1)!.executed_at_utc,
      openedAtUtc: rows[0]!.executed_at_utc,
      providerSymbol: first.normalized_symbol,
      representativeRoundTripId: first.round_trip_id,
      tradingDateNewYork: openedDate,
    });
  }

  targetByVersion(scope: AccountScope, logicalTradeId: string, logicalTradeVersionId: string): LogicalTradeAnalyzerTarget | null {
    const row = this.database.prepare(`SELECT version.trade_style
FROM journal_logical_trade_versions version
JOIN journal_logical_trades trade
 ON trade.workspace_id = version.workspace_id AND trade.account_id = version.account_id
 AND trade.logical_trade_id = version.logical_trade_id
 AND trade.current_version_id = version.logical_trade_version_id
WHERE version.workspace_id = ? AND version.account_id = ? AND version.logical_trade_id = ?
 AND version.logical_trade_version_id = ? AND trade.lifecycle_state = 'active'`).get(
      scope.workspaceId, scope.accountId, logicalTradeId, logicalTradeVersionId,
    ) as { trade_style: "day" | "swing" } | undefined;
    if (!row) return null;
    return this.target(scope, Object.freeze({
      closedAtUtc: "",
      currency: "",
      direction: "long",
      instrumentId: "",
      lifecycleState: "active",
      logicalTradeId,
      members: Object.freeze([]),
      openedAtUtc: "",
      revision: 1,
      symbol: "",
      tradeStyle: row.trade_style,
    }));
  }

  queue(input: Readonly<{
    scope: AccountScope;
    target: LogicalTradeAnalyzerTarget;
    desiredCoverageEndUtc: string;
    now: Date;
  }>): Readonly<{ jobId: string; created: boolean }> {
    const timestamp = createCanonicalUtcTimestamp(input.now);
    this.database.prepare(`INSERT INTO level_analysis_market_session_sets (
 market_session_set_id, provider_key, provider_adapter_version, provider_symbol,
 exchange_identity, trading_date_new_york, interval, session_policy,
 current_version_id, current_coverage_end_utc, current_status, lease_expires_at_utc,
 created_at_utc, updated_at_utc
) VALUES (?, 'moomoo_history_kline', 'moomoo_history_kline_v1', ?, 'unknown', ?,
 '1m', 'america_new_york_extended_0400_2000_v1', NULL, NULL, 'queued', NULL, ?, ?)
ON CONFLICT(provider_key, provider_adapter_version, provider_symbol, exchange_identity,
 trading_date_new_york, interval, session_policy) DO NOTHING`).run(
      createCanonicalUuidV4(), input.target.providerSymbol,
      input.target.tradingDateNewYork, timestamp, timestamp,
    );
    const session = this.database.prepare(`SELECT market_session_set_id
FROM level_analysis_market_session_sets
WHERE provider_key = 'moomoo_history_kline' AND provider_adapter_version = 'moomoo_history_kline_v1'
 AND provider_symbol = ? AND exchange_identity = 'unknown' AND trading_date_new_york = ?
 AND interval = '1m' AND session_policy = 'america_new_york_extended_0400_2000_v1'`).get(
      input.target.providerSymbol, input.target.tradingDateNewYork,
    ) as { market_session_set_id: string } | undefined;
    if (!session) return Object.freeze({ jobId: "", created: false });
    const existing = this.database.prepare(`SELECT logical_trade_job_id
FROM level_analysis_logical_trade_jobs WHERE workspace_id = ? AND account_id = ?
 AND logical_trade_version_id = ? AND desired_coverage_end_utc = ?`).get(
      input.scope.workspaceId, input.scope.accountId,
      input.target.logicalTradeVersionId, input.desiredCoverageEndUtc,
    ) as { logical_trade_job_id: string } | undefined;
    if (existing) return Object.freeze({ jobId: existing.logical_trade_job_id, created: false });
    const jobId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO level_analysis_logical_trade_jobs (
 logical_trade_job_id, user_id, workspace_id, account_id, logical_trade_id,
 logical_trade_version_id, market_session_set_id, desired_coverage_end_utc,
 next_attempt_at_utc, status, attempt_count, lease_expires_at_utc, completed_at_utc,
 created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, ?, ?)`)
      .run(jobId, input.scope.userId, input.scope.workspaceId, input.scope.accountId,
        input.target.logicalTradeId, input.target.logicalTradeVersionId,
        session.market_session_set_id, input.desiredCoverageEndUtc,
        timestamp, timestamp, timestamp);
    return Object.freeze({ jobId, created: true });
  }

  expireUnreservedJob(jobId: string, now: Date): void {
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'expired', completed_at_utc = ?, updated_at_utc = ?
WHERE logical_trade_job_id = ? AND status = 'queued'
 AND NOT EXISTS (SELECT 1 FROM level_analysis_analyzer_reservations
   WHERE logical_trade_job_id = level_analysis_logical_trade_jobs.logical_trade_job_id)`)
      .run(timestamp, timestamp, jobId);
  }

  claimNext(now: Date): ClaimedLogicalTradeAnalyzerJob | null {
    const timestamp = createCanonicalUtcTimestamp(now);
    const row = this.database.transaction(() => {
      // The first shared-worker release judged sparse symbols incomplete when
      // they had no 4:00 AM candle, then could overwrite a usable result with
      // a terminal provider failure. Requeue only jobs whose shared session
      // already proves the requested window was successfully acquired.
      this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'queued', attempt_count = 0, next_attempt_at_utc = ?,
 completed_at_utc = NULL, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE status IN ('no_coverage', 'provider_unavailable')
 AND EXISTS (SELECT 1 FROM level_analysis_market_session_sets session
  WHERE session.market_session_set_id = level_analysis_logical_trade_jobs.market_session_set_id
   AND session.current_status = 'ready' AND session.current_version_id IS NOT NULL
   AND session.current_coverage_end_utc >= level_analysis_logical_trade_jobs.desired_coverage_end_utc)`)
        .run(timestamp, timestamp);
      this.database.prepare(`UPDATE level_analysis_analyzer_reservations
SET status = 'released', updated_at_utc = ?
WHERE status = 'active' AND expires_at_utc < ?`).run(timestamp, timestamp);
      this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'expired', completed_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE status = 'queued' AND NOT EXISTS (
 SELECT 1 FROM level_analysis_analyzer_reservations reservation
 WHERE reservation.logical_trade_job_id = level_analysis_logical_trade_jobs.logical_trade_job_id
   AND reservation.status = 'active'
 ) AND NOT EXISTS (
 SELECT 1 FROM level_analysis_market_session_sets session
 WHERE session.market_session_set_id = level_analysis_logical_trade_jobs.market_session_set_id
  AND session.current_status = 'ready' AND session.current_version_id IS NOT NULL
  AND session.current_coverage_end_utc >= level_analysis_logical_trade_jobs.desired_coverage_end_utc
)`).run(timestamp, timestamp);
      this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'expired', completed_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))
 AND EXISTS (SELECT 1 FROM journal_demo_accounts demo
   WHERE demo.workspace_id = level_analysis_logical_trade_jobs.workspace_id
    AND demo.account_id = level_analysis_logical_trade_jobs.account_id)`).run(timestamp, timestamp, timestamp);
      const candidate = this.database.prepare(`SELECT logical_trade_job_id, user_id,
 workspace_id, account_id, logical_trade_id, logical_trade_version_id,
 market_session_set_id, desired_coverage_end_utc, attempt_count, created_at_utc
FROM level_analysis_logical_trade_jobs
WHERE (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))
 AND next_attempt_at_utc <= ?
 AND NOT EXISTS (SELECT 1 FROM journal_demo_accounts demo
   WHERE demo.workspace_id = level_analysis_logical_trade_jobs.workspace_id
    AND demo.account_id = level_analysis_logical_trade_jobs.account_id)
ORDER BY created_at_utc, logical_trade_job_id LIMIT 1`).get(timestamp, timestamp) as
        | { logical_trade_job_id: string; user_id: string; workspace_id: string; account_id: string;
            logical_trade_id: string; logical_trade_version_id: string; market_session_set_id: string;
            desired_coverage_end_utc: string; attempt_count: number; created_at_utc: string }
        | undefined;
      if (!candidate) return null;
      const changed = this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'leased', attempt_count = attempt_count + 1, lease_expires_at_utc = ?, updated_at_utc = ?
WHERE logical_trade_job_id = ? AND (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))`)
        .run(new Date(now.getTime() + 120_000).toISOString(), timestamp,
          candidate.logical_trade_job_id, timestamp);
      return changed.changes === 1 ? candidate : null;
    }).immediate();
    if (!row) return null;
    const scope = Object.freeze({ userId: row.user_id, workspaceId: row.workspace_id,
      accountId: row.account_id, workspaceRole: "owner" as const });
    const target = this.targetByVersion(scope, row.logical_trade_id, row.logical_trade_version_id);
    if (!target) {
      this.finish(row.logical_trade_job_id, "expired", now);
      return null;
    }
    return Object.freeze({ attemptCount: row.attempt_count + 1,
      createdAtUtc: row.created_at_utc,
      desiredCoverageEndUtc: row.desired_coverage_end_utc, jobId: row.logical_trade_job_id,
      marketSessionSetId: row.market_session_set_id, scope, target });
  }

  persistResult(input: Readonly<{
    analyzed: DailyTradeAnalyzerResult | null;
    evidenceCandles?: readonly NormalizedMarketCandle[];
    executionMismatches?: readonly DailyTradeExecutionCandleMismatch[];
    marketSessionSetVersionId: string | null;
    now: Date;
    scope: AccountScope;
    status: "pending" | "ready" | "correction_required" | "no_coverage" | "provider_unavailable" | "expired";
    target: LogicalTradeAnalyzerTarget;
  }>): void {
    const timestamp = createCanonicalUtcTimestamp(input.now);
    this.database.transaction(() => {
      const prior = this.database.prepare(`SELECT logical_trade_analysis_id, current_revision
FROM journal_logical_trade_daily_analyses
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
        input.scope.workspaceId, input.scope.accountId, input.target.logicalTradeId,
      ) as { logical_trade_analysis_id: string; current_revision: number } | undefined;
      const id = prior?.logical_trade_analysis_id ?? createCanonicalUuidV4();
      const revision = (prior?.current_revision ?? 0) + 1;
      if (!prior) {
        this.database.prepare(`INSERT INTO journal_logical_trade_daily_analyses (
 logical_trade_analysis_id, user_id, workspace_id, account_id, logical_trade_id,
 logical_trade_version_id, current_revision, status, market_session_set_version_id,
 created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          id, input.scope.userId, input.scope.workspaceId, input.scope.accountId,
          input.target.logicalTradeId, input.target.logicalTradeVersionId, revision,
          input.status, input.marketSessionSetVersionId, timestamp, timestamp,
        );
      } else {
        this.database.prepare(`UPDATE journal_logical_trade_daily_analyses
SET logical_trade_version_id = ?, current_revision = ?, status = ?,
 market_session_set_version_id = ?, updated_at_utc = ?
WHERE logical_trade_analysis_id = ?`).run(
          input.target.logicalTradeVersionId, revision, input.status,
          input.marketSessionSetVersionId, timestamp, id,
        );
      }
      this.database.prepare(`INSERT INTO journal_logical_trade_daily_analysis_versions (
 logical_trade_analysis_version_id, logical_trade_analysis_id, revision_number,
 logical_trade_version_id, market_session_set_version_id, status,
 analyzer_contract_version, result_json, evidence_candles_json,
 execution_mismatches_json, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'logical_trade_analyzer_v1', ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(), id, revision, input.target.logicalTradeVersionId,
        input.marketSessionSetVersionId, input.status,
        input.analyzed ? JSON.stringify(input.analyzed) : null,
        input.evidenceCandles ? JSON.stringify(input.evidenceCandles) : null,
        input.executionMismatches ? JSON.stringify(input.executionMismatches) : null,
        timestamp,
      );
    }).immediate();
  }

  finish(jobId: string, status: "completed" | "no_coverage" | "provider_unavailable" | "expired", now: Date): void {
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = ?, completed_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE logical_trade_job_id = ?`).run(status, timestamp, timestamp, jobId);
  }

  reschedule(jobId: string, next: Date, now: Date): void {
    this.database.prepare(`UPDATE level_analysis_logical_trade_jobs
SET status = 'queued', next_attempt_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE logical_trade_job_id = ?`).run(
      createCanonicalUtcTimestamp(next), createCanonicalUtcTimestamp(now), jobId,
    );
  }
}
