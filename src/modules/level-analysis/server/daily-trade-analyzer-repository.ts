import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  DAILY_TRADE_ANALYZER_CONTRACT_VERSION,
  type DailyTradeAnalyzerDirection,
  type DailyTradeAnalyzerEvent,
  type DailyTradeAnalyzerEventKind,
  type DailyTradeAnalyzerResult,
} from "../contracts/daily-trade-analyzer-contracts";
import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import { persistDailyTradePathMaterialization } from "./daily-trade-path-materialization-repository";
import { persistDailyTradePatternOccurrences } from "./daily-trade-pattern-occurrence-repository";
import type { DailyTradeExecutionCandleMismatch } from "./daily-trade-execution-candle-validation";
import { dailyTradeFirstResultAt } from "./daily-trade-analyzer-session";

export type DailyTradeAnalyzerTarget = Readonly<{
  assetClass: "stock";
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
  finalExitAtUtc: string;
  openedAtUtc: string;
  providerSymbol: string;
  roundTripId: string;
  roundTripVersionId: string;
  tradingDateNewYork: string;
}>;

export type ClaimedDailyTradeAnalyzerJob = Readonly<{
  attemptCount: number;
  desiredCoverageEndUtc: string;
  jobId: string;
  marketSessionSetId: string;
  scope: AccountScope;
  target: DailyTradeAnalyzerTarget;
}>;

export type DailyTradeMarketDataProviderIdentity = Readonly<{
  adapterVersion: string;
  key: string;
}>;

export type DailyTradeExecutionMismatchConfirmation = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
}>;

type JobRow = Readonly<{
  account_id: string;
  attempt_count: number;
  daily_trade_job_id: string;
  desired_coverage_end_utc: string;
  market_session_set_id: string;
  round_trip_id: string;
  user_id: string;
  workspace_id: string;
}>;

type LegacyFirstResultWakeRow = Readonly<{
  closed_at_utc: string;
  daily_trade_job_id: string;
  desired_coverage_end_utc: string;
}>;

type TargetRow = Readonly<{
  allocation_role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
  allocation_sequence: number;
  asset_class: string;
  closed_at_utc: string | null;
  direction: DailyTradeAnalyzerDirection;
  executed_at_utc: string;
  execution_id: string;
  fees_decimal: string | null;
  normalized_symbol: string;
  opened_at_utc: string;
  price_decimal: string | null;
  quantity_decimal: string;
  round_trip_id: string;
  round_trip_version_id: string;
}>;

function newYorkDate(utc: string): string | null {
  const milliseconds = Date.parse(utc);
  if (!Number.isFinite(milliseconds)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(new Date(milliseconds));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year && values.month && values.day
    ? `${values.year}-${values.month}-${values.day}`
    : null;
}

function eventKind(role: TargetRow["allocation_role"]): DailyTradeAnalyzerEventKind {
  if (role === "opening" || role === "flip_opening") return "entry";
  if (role === "adding") return "add";
  if (role === "reducing") return "partial_exit";
  return "final_exit";
}

function fromRows(rows: readonly TargetRow[]): DailyTradeAnalyzerTarget | null {
  const first = rows[0];
  if (!first || first.asset_class !== "stock" || !first.closed_at_utc || !first.price_decimal) {
    return null;
  }
  const tradingDateNewYork = newYorkDate(first.opened_at_utc);
  if (!tradingDateNewYork || newYorkDate(first.closed_at_utc) !== tradingDateNewYork) return null;
  const events = rows.map((row) => row.price_decimal ? Object.freeze({
    eventId: row.execution_id,
    sequence: row.allocation_sequence,
    kind: eventKind(row.allocation_role),
    executedAtUtc: row.executed_at_utc,
    feesDecimal: row.fees_decimal,
    priceDecimal: row.price_decimal,
    quantityDecimal: row.quantity_decimal,
  }) : null);
  if (events.some((event) => event === null) || events.at(-1)?.kind !== "final_exit") return null;
  return Object.freeze({
    assetClass: "stock",
    direction: first.direction,
    events: Object.freeze(events as DailyTradeAnalyzerEvent[]),
    finalExitAtUtc: first.closed_at_utc,
    openedAtUtc: first.opened_at_utc,
    providerSymbol: first.normalized_symbol,
    roundTripId: first.round_trip_id,
    roundTripVersionId: first.round_trip_version_id,
    tradingDateNewYork,
  });
}

export class DailyTradeAnalyzerRepository {
  constructor(private readonly database: Database.Database) {}

  private supportsExactTurnover(): boolean {
    return this.database.prepare<[], { name: string }>(
      "PRAGMA table_info(level_analysis_market_session_candles)",
    ).all().some((column) => column.name === "turnover_decimal");
  }

  currentAnalysisMatchesProjection(scope: AccountScope, roundTripId: string): boolean {
    const row = this.database.prepare<[string, string, string], {
      matches_projection: 0 | 1;
    }>(`SELECT
  CASE WHEN analyzed_version.projection_fingerprint_sha256 = current_version.projection_fingerprint_sha256
    OR EXISTS (
      SELECT 1
      FROM journal_round_trip_daily_trade_execution_mismatch_sets mismatch_set
      JOIN journal_round_trip_versions mismatch_version
        ON mismatch_version.workspace_id = mismatch_set.workspace_id
        AND mismatch_version.account_id = mismatch_set.account_id
        AND mismatch_version.round_trip_version_id = mismatch_set.round_trip_version_id
      WHERE mismatch_set.workspace_id = round_trip.workspace_id
        AND mismatch_set.account_id = round_trip.account_id
        AND mismatch_set.round_trip_id = round_trip.round_trip_id
        AND mismatch_version.projection_fingerprint_sha256 = current_version.projection_fingerprint_sha256
    )
    THEN 1 ELSE 0 END AS matches_projection
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions current_version
  ON current_version.workspace_id = round_trip.workspace_id
  AND current_version.account_id = round_trip.account_id
  AND current_version.round_trip_version_id = round_trip.current_version_id
LEFT JOIN journal_round_trip_daily_trade_analyses analysis
  ON analysis.workspace_id = round_trip.workspace_id
  AND analysis.account_id = round_trip.account_id
  AND analysis.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_round_trip_versions analyzed_version
  ON analyzed_version.workspace_id = analysis.workspace_id
  AND analyzed_version.account_id = analysis.account_id
  AND analyzed_version.round_trip_version_id = analysis.round_trip_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'`)
      .get(scope.workspaceId, scope.accountId, roundTripId);
    return row?.matches_projection === 1;
  }

  findEligibleTarget(scope: AccountScope, roundTripId: string): DailyTradeAnalyzerTarget | null {
    const rows = this.database.prepare<[string, string, string], TargetRow>(`SELECT
  round_trip.round_trip_id,
  version.round_trip_version_id,
  version.direction,
  version.opened_at_utc,
  version.closed_at_utc,
  instrument.asset_class,
  instrument.normalized_symbol,
  allocation.allocation_sequence,
  allocation.allocation_role,
  execution_version.execution_id,
  execution_version.executed_at_utc,
  execution_version.quantity_decimal,
  execution_version.price_decimal,
  execution_version.fees_decimal
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
  AND version.account_id = round_trip.account_id
  AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
  AND instrument.instrument_id = version.instrument_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = version.workspace_id
  AND allocation.account_id = version.account_id
  AND allocation.round_trip_version_id = version.round_trip_version_id
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
  AND execution_version.account_id = allocation.account_id
  AND execution_version.execution_version_id = allocation.execution_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'
ORDER BY allocation.allocation_sequence ASC`).all(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    );
    return fromRows(rows);
  }

  queueTarget(input: Readonly<{
    scope: AccountScope;
    target: DailyTradeAnalyzerTarget;
    desiredCoverageEndUtc: string;
    provider: DailyTradeMarketDataProviderIdentity;
    now?: Date;
  }>): void {
    const timestamp = createCanonicalUtcTimestamp(input.now ?? new Date());
    const exchangeIdentity = "unknown";
    this.database.prepare(`INSERT INTO level_analysis_market_session_sets (
  market_session_set_id, provider_key, provider_adapter_version, provider_symbol,
  exchange_identity, trading_date_new_york, interval, session_policy,
  current_version_id, current_coverage_end_utc, current_status, lease_expires_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, '1m',
  'america_new_york_extended_0400_2000_v1', NULL, NULL, 'queued', NULL, ?, ?)
ON CONFLICT(provider_key, provider_adapter_version, provider_symbol, exchange_identity, trading_date_new_york, interval, session_policy)
DO NOTHING`).run(
      createCanonicalUuidV4(),
      input.provider.key,
      input.provider.adapterVersion,
      input.target.providerSymbol,
      exchangeIdentity,
      input.target.tradingDateNewYork,
      timestamp,
      timestamp,
    );
    const session = this.database.prepare<[string, string, string, string], { market_session_set_id: string }>(`SELECT market_session_set_id
FROM level_analysis_market_session_sets
WHERE provider_key = ? AND provider_adapter_version = ?
  AND provider_symbol = ? AND exchange_identity = 'unknown'
  AND trading_date_new_york = ? AND interval = '1m'
  AND session_policy = 'america_new_york_extended_0400_2000_v1'`)
      .get(input.provider.key, input.provider.adapterVersion, input.target.providerSymbol, input.target.tradingDateNewYork);
    if (!session) throw new Error("daily_trade_session_cache_missing");
    this.database.prepare(`INSERT INTO level_analysis_daily_trade_jobs (
  daily_trade_job_id, user_id, workspace_id, account_id, round_trip_id,
  round_trip_version_id, market_session_set_id, desired_coverage_end_utc,
  next_attempt_at_utc, status, attempt_count, lease_expires_at_utc, completed_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, ?, ?)
ON CONFLICT(workspace_id, account_id, round_trip_version_id, desired_coverage_end_utc)
DO NOTHING`).run(
      createCanonicalUuidV4(),
      input.scope.userId,
      input.scope.workspaceId,
      input.scope.accountId,
      input.target.roundTripId,
      input.target.roundTripVersionId,
      session.market_session_set_id,
      input.desiredCoverageEndUtc,
      timestamp,
      timestamp,
      timestamp,
    );
  }

  /**
   * Writes an already verified immutable market-session revision without
   * creating a worker job. This is for callers that own complete
   * provider-normalized candle evidence before entering this repository.
   */
  materializeVerifiedSession(input: Readonly<{
    candles: readonly NormalizedMarketCandle[];
    completedAtUtc: string;
    coverageEndUtc: string;
    provider: DailyTradeMarketDataProviderIdentity;
    providerExchangeTimezone: string;
    providerUtcOffsetSeconds: number;
    requestedEndUtc: string;
    requestedStartUtc: string;
    sha256: string;
    target: DailyTradeAnalyzerTarget;
  }>): string {
    const timestamp = input.completedAtUtc;
    this.database.prepare(`INSERT INTO level_analysis_market_session_sets (
  market_session_set_id, provider_key, provider_adapter_version, provider_symbol,
  exchange_identity, trading_date_new_york, interval, session_policy,
  current_version_id, current_coverage_end_utc, current_status, lease_expires_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'unknown', ?, '1m',
  'america_new_york_extended_0400_2000_v1', NULL, NULL, 'queued', NULL, ?, ?)
ON CONFLICT(provider_key, provider_adapter_version, provider_symbol, exchange_identity, trading_date_new_york, interval, session_policy)
DO NOTHING`).run(
      createCanonicalUuidV4(), input.provider.key, input.provider.adapterVersion,
      input.target.providerSymbol, input.target.tradingDateNewYork, timestamp, timestamp,
    );
    const session = this.database.prepare<[string, string, string, string], { market_session_set_id: string }>(`SELECT market_session_set_id
FROM level_analysis_market_session_sets
WHERE provider_key = ? AND provider_adapter_version = ?
  AND provider_symbol = ? AND exchange_identity = 'unknown'
  AND trading_date_new_york = ? AND interval = '1m'
  AND session_policy = 'america_new_york_extended_0400_2000_v1'`)
      .get(input.provider.key, input.provider.adapterVersion, input.target.providerSymbol, input.target.tradingDateNewYork);
    if (!session) throw new Error("daily_trade_verified_session_missing");
    return this.persistMarketSession({
      candles: input.candles,
      completedAtUtc: input.completedAtUtc,
      coverageEndUtc: input.coverageEndUtc,
      failureReasonCode: null,
      marketSessionSetId: session.market_session_set_id,
      outcome: "ready",
      providerExchangeTimezone: input.providerExchangeTimezone,
      providerUtcOffsetSeconds: input.providerUtcOffsetSeconds,
      requestedStartUtc: input.requestedStartUtc,
      requestedEndUtc: input.requestedEndUtc,
      sha256: input.sha256,
    });
  }

  claimNextJob(now: Date): ClaimedDailyTradeAnalyzerJob | null {
    const timestamp = createCanonicalUtcTimestamp(now);
    const row = this.database.transaction(() => {
      this.database.prepare(`UPDATE level_analysis_daily_trade_jobs
SET status = 'expired', completed_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))
  AND EXISTS (
    SELECT 1 FROM journal_demo_accounts demo
    WHERE demo.workspace_id = level_analysis_daily_trade_jobs.workspace_id
      AND demo.account_id = level_analysis_daily_trade_jobs.account_id
  )`).run(timestamp, timestamp, timestamp);
      const legacyFirstResultWakes = this.database.prepare<[], LegacyFirstResultWakeRow>(`SELECT
  job.daily_trade_job_id, job.desired_coverage_end_utc, version.closed_at_utc
FROM level_analysis_daily_trade_jobs job
JOIN journal_round_trip_versions version
  ON version.workspace_id = job.workspace_id
  AND version.account_id = job.account_id
  AND version.round_trip_version_id = job.round_trip_version_id
WHERE job.status = 'queued'
  AND job.next_attempt_at_utc = job.desired_coverage_end_utc
  AND version.closed_at_utc IS NOT NULL
  AND CAST(strftime('%s', job.desired_coverage_end_utc) AS INTEGER) >
    (CAST(strftime('%s', version.closed_at_utc) AS INTEGER) / 60) * 60 + 1800`).all();
      const rescheduleLegacyFirstResult = this.database.prepare(`UPDATE level_analysis_daily_trade_jobs
SET next_attempt_at_utc = ?, updated_at_utc = ?
WHERE daily_trade_job_id = ? AND status = 'queued'
  AND next_attempt_at_utc = desired_coverage_end_utc`);
      for (const legacy of legacyFirstResultWakes) {
        const currentPolicyWake = dailyTradeFirstResultAt(legacy.closed_at_utc);
        if (
          currentPolicyWake !== null &&
          currentPolicyWake.getTime() < Date.parse(legacy.desired_coverage_end_utc)
        ) {
          rescheduleLegacyFirstResult.run(
            createCanonicalUtcTimestamp(currentPolicyWake),
            timestamp,
            legacy.daily_trade_job_id,
          );
        }
      }
      const candidate = this.database.prepare<[string, string], JobRow>(`SELECT daily_trade_job_id, user_id,
  workspace_id, account_id, round_trip_id, market_session_set_id, desired_coverage_end_utc,
  attempt_count
FROM level_analysis_daily_trade_jobs
WHERE (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))
  AND NOT EXISTS (
    SELECT 1 FROM journal_demo_accounts demo
    WHERE demo.workspace_id = level_analysis_daily_trade_jobs.workspace_id
      AND demo.account_id = level_analysis_daily_trade_jobs.account_id
  )
  AND next_attempt_at_utc <= ?
ORDER BY next_attempt_at_utc ASC, created_at_utc ASC
LIMIT 1`).get(timestamp, timestamp);
      if (!candidate) return null;
      const changed = this.database.prepare(`UPDATE level_analysis_daily_trade_jobs
SET status = 'leased', attempt_count = attempt_count + 1,
  lease_expires_at_utc = ?, updated_at_utc = ?
WHERE daily_trade_job_id = ? AND (status = 'queued' OR (status = 'leased' AND lease_expires_at_utc < ?))`)
        .run(new Date(now.getTime() + 120_000).toISOString(), timestamp, candidate.daily_trade_job_id, timestamp);
      return changed.changes === 1 ? candidate : null;
    }).immediate();
    if (!row) return null;
    const scope: AccountScope = Object.freeze({
      userId: row.user_id,
      workspaceId: row.workspace_id,
      workspaceRole: "owner",
      accountId: row.account_id,
    });
    const target = this.findEligibleTarget(scope, row.round_trip_id);
    if (!target) {
      this.finishJob(row.daily_trade_job_id, "expired", now);
      return null;
    }
    return Object.freeze({
      attemptCount: row.attempt_count + 1,
      desiredCoverageEndUtc: row.desired_coverage_end_utc,
      jobId: row.daily_trade_job_id,
      marketSessionSetId: row.market_session_set_id,
      scope,
      target,
    });
  }

  readCurrentCandles(marketSessionSetId: string): readonly NormalizedMarketCandle[] {
    const turnoverSelection = this.supportsExactTurnover()
      ? "turnover_decimal"
      : "NULL AS turnover_decimal";
    const rows = this.database.prepare<[string], {
      candle_time_utc_seconds: number;
      close_decimal: string;
      high_decimal: string;
      low_decimal: string;
      open_decimal: string;
      turnover_decimal: string | null;
      volume_decimal: string;
    }>(`SELECT
  candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal, volume_decimal,
  ${turnoverSelection}
FROM level_analysis_market_session_candles candle
JOIN level_analysis_market_session_sets session
  ON session.current_version_id = candle.market_session_set_version_id
WHERE session.market_session_set_id = ?
ORDER BY candle_time_utc_seconds ASC`).all(marketSessionSetId);
    return Object.freeze(rows.map((row) => Object.freeze({
      time: row.candle_time_utc_seconds,
      openDecimal: row.open_decimal,
      highDecimal: row.high_decimal,
      lowDecimal: row.low_decimal,
      closeDecimal: row.close_decimal,
      volumeDecimal: row.volume_decimal,
      turnoverDecimal: row.turnover_decimal,
    })));
  }

  currentSessionCoverageEnd(marketSessionSetId: string): string | null {
    return this.database.prepare<[string], { current_coverage_end_utc: string | null }>(`SELECT current_coverage_end_utc
FROM level_analysis_market_session_sets WHERE market_session_set_id = ?`)
      .get(marketSessionSetId)?.current_coverage_end_utc ?? null;
  }

  currentSessionVersionId(marketSessionSetId: string): string | null {
    return this.database.prepare<[string], { current_version_id: string | null }>(`SELECT current_version_id
FROM level_analysis_market_session_sets WHERE market_session_set_id = ?`)
      .get(marketSessionSetId)?.current_version_id ?? null;
  }

  currentSessionRetrievedAt(marketSessionSetId: string): string | null {
    return this.database.prepare<[string], { retrieved_at_utc: string | null }>(`SELECT version.retrieved_at_utc
FROM level_analysis_market_session_sets session
LEFT JOIN level_analysis_market_session_set_versions version
  ON version.market_session_set_version_id = session.current_version_id
WHERE session.market_session_set_id = ?`)
      .get(marketSessionSetId)?.retrieved_at_utc ?? null;
  }

  persistMarketSession(input: Readonly<{
    candles: readonly NormalizedMarketCandle[];
    completedAtUtc: string;
    coverageEndUtc: string;
    failureReasonCode: string | null;
    marketSessionSetId: string;
    outcome: "ready" | "no_coverage" | "provider_unavailable";
    providerExchangeTimezone: string | null;
    providerUtcOffsetSeconds: number | null;
    requestedStartUtc: string;
    requestedEndUtc: string;
    sha256: string | null;
  }>): string {
    return this.database.transaction(() => {
      const revision = this.database.prepare<[string], { revision: number }>(`SELECT
  COALESCE(MAX(revision_number), 0) + 1 AS revision
FROM level_analysis_market_session_set_versions
WHERE market_session_set_id = ?`).get(input.marketSessionSetId)?.revision ?? 1;
      const versionId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO level_analysis_market_session_set_versions (
  market_session_set_version_id, market_session_set_id, revision_number,
  requested_start_utc, requested_end_utc, provider_exchange_timezone,
  provider_utc_offset_seconds, outcome, failure_reason_code, candle_sha256, retrieved_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(versionId, input.marketSessionSetId, revision, input.requestedStartUtc,
          input.requestedEndUtc, input.providerExchangeTimezone, input.providerUtcOffsetSeconds,
          input.outcome, input.failureReasonCode, input.sha256, input.completedAtUtc);
      const supportsExactTurnover = this.supportsExactTurnover();
      const insert = this.database.prepare(supportsExactTurnover
        ? `INSERT INTO level_analysis_market_session_candles (
  market_session_set_version_id, candle_time_utc_seconds, open_decimal, high_decimal,
  low_decimal, close_decimal, volume_decimal, turnover_decimal
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO level_analysis_market_session_candles (
  market_session_set_version_id, candle_time_utc_seconds, open_decimal, high_decimal,
  low_decimal, close_decimal, volume_decimal
) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const candle of input.candles) {
        const values = [versionId, candle.time, candle.openDecimal, candle.highDecimal,
          candle.lowDecimal, candle.closeDecimal, candle.volumeDecimal];
        insert.run(...(supportsExactTurnover
          ? [...values, candle.turnoverDecimal ?? null]
          : values));
      }
      this.database.prepare(`UPDATE level_analysis_market_session_sets
SET current_version_id = ?, current_coverage_end_utc = ?, current_status = ?,
  lease_expires_at_utc = NULL, updated_at_utc = ?
WHERE market_session_set_id = ?`)
        .run(versionId, input.coverageEndUtc, input.outcome, input.completedAtUtc, input.marketSessionSetId);
      return versionId;
    }).immediate();
  }

  persistAnalysis(input: Readonly<{
    analyzed: DailyTradeAnalyzerResult;
    marketSessionSetVersionId: string | null;
    scope: AccountScope;
    status: "pending" | "ready" | "no_coverage" | "provider_unavailable" | "expired";
    target: DailyTradeAnalyzerTarget;
    now: Date;
  }>): void {
    const timestamp = createCanonicalUtcTimestamp(input.now);
    this.database.transaction(() => {
      const prior = this.database.prepare<[string, string, string], {
        current_revision: number;
        daily_trade_analysis_id: string;
      }>(`SELECT daily_trade_analysis_id, current_revision
FROM journal_round_trip_daily_trade_analyses
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?`)
        .get(input.scope.workspaceId, input.scope.accountId, input.target.roundTripId);
      const analysisId = prior?.daily_trade_analysis_id ?? createCanonicalUuidV4();
      const revision = (prior?.current_revision ?? 0) + 1;
      const versionId = createCanonicalUuidV4();
      if (!prior) {
        this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_analyses (
  daily_trade_analysis_id, user_id, workspace_id, account_id, round_trip_id,
  round_trip_version_id, market_session_set_version_id, status, current_revision,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(analysisId, input.scope.userId, input.scope.workspaceId, input.scope.accountId,
            input.target.roundTripId, input.target.roundTripVersionId, input.marketSessionSetVersionId,
            input.status, revision, timestamp, timestamp);
      } else {
        this.database.prepare(`UPDATE journal_round_trip_daily_trade_analyses
SET round_trip_version_id = ?, market_session_set_version_id = ?, status = ?,
  current_revision = ?, updated_at_utc = ?
WHERE daily_trade_analysis_id = ?`).run(input.target.roundTripVersionId,
          input.marketSessionSetVersionId, input.status, revision, timestamp, analysisId);
      }
      this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_analysis_versions (
  daily_trade_analysis_version_id, daily_trade_analysis_id, revision_number,
  market_session_set_version_id, status, analyzer_contract_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(versionId, analysisId, revision, input.marketSessionSetVersionId, input.status,
          DAILY_TRADE_ANALYZER_CONTRACT_VERSION, timestamp);
      const insertSnapshot = this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_analysis_event_snapshots (
  daily_trade_analysis_version_id, execution_id, event_kind, candle_time_utc_seconds, snapshot_json
) VALUES (?, ?, ?, ?, ?)`);
      for (const snapshot of input.analyzed.eventSnapshots) {
        insertSnapshot.run(versionId, snapshot.event.eventId, snapshot.event.kind,
          snapshot.candleTime, JSON.stringify(snapshot));
      }
      persistDailyTradePatternOccurrences(this.database, {
        analysisVersionId: versionId,
        analyzed: input.analyzed,
        roundTripId: input.target.roundTripId,
        scope: input.scope,
      });
      const insertPath = this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_analysis_post_exit_paths (
  daily_trade_analysis_version_id, minutes_after_exit, favorable_move_decimal, observed_at_candle_time_utc_seconds
) VALUES (?, ?, ?, ?)`);
      for (const path of input.analyzed.finalExitPaths) {
        insertPath.run(versionId, path.minutesAfterExit, path.favorableMoveDecimal, path.observedAtCandleTime);
      }
      persistDailyTradePathMaterialization(this.database, {
        analysis: input.analyzed.greenToRed,
        analysisVersionId: versionId,
        roundTripVersionId: input.target.roundTripVersionId,
      });
    }).immediate();
  }

  persistExecutionMismatches(input: Readonly<{
    jobId: string;
    marketSessionSetVersionId: string | null;
    mismatches: readonly DailyTradeExecutionCandleMismatch[];
    now: Date;
    scope: AccountScope;
    target: DailyTradeAnalyzerTarget;
  }>): string {
    if (input.mismatches.length === 0) throw new Error("daily_trade_execution_mismatches_required");
    const timestamp = createCanonicalUtcTimestamp(input.now);
    return this.database.transaction(() => {
      const existing = this.database.prepare<[string, string, string], {
        execution_mismatch_set_id: string;
      }>(`SELECT execution_mismatch_set_id
FROM journal_round_trip_daily_trade_execution_mismatch_sets
WHERE workspace_id = ? AND account_id = ? AND round_trip_version_id = ?`)
        .get(input.scope.workspaceId, input.scope.accountId, input.target.roundTripVersionId);
      if (existing) return existing.execution_mismatch_set_id;
      const mismatchSetId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_execution_mismatch_sets (
  execution_mismatch_set_id, daily_trade_job_id, user_id, workspace_id, account_id,
  round_trip_id, round_trip_version_id, market_session_set_version_id, outcome,
  validator_contract_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'execution_mismatch',
  'daily_trade_execution_candle_match_v1', ?)`)
        .run(mismatchSetId, input.jobId, input.scope.userId, input.scope.workspaceId,
          input.scope.accountId, input.target.roundTripId, input.target.roundTripVersionId,
          input.marketSessionSetVersionId, timestamp);
      const insert = this.database.prepare(`INSERT INTO journal_round_trip_daily_trade_execution_mismatches (
  execution_mismatch_set_id, workspace_id, account_id, execution_id,
  execution_sequence, event_kind, side, executed_at_utc, quantity_decimal,
  entered_price_decimal, candle_time_utc_seconds, mismatch_kind,
  candle_low_decimal, candle_high_decimal
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const mismatch of input.mismatches) {
        insert.run(mismatchSetId, input.scope.workspaceId, input.scope.accountId,
          mismatch.event.eventId, mismatch.event.sequence, mismatch.event.kind,
          mismatch.side, mismatch.event.executedAtUtc, mismatch.event.quantityDecimal,
          mismatch.enteredPriceDecimal, mismatch.candleTimeUtcSeconds, mismatch.kind,
          mismatch.candleLowDecimal, mismatch.candleHighDecimal);
      }
      return mismatchSetId;
    }).immediate();
  }

  confirmExecutionMismatch(input: Readonly<{
    mismatchSetId: string;
    now: Date;
    scope: AccountScope;
  }>): DailyTradeExecutionMismatchConfirmation {
    const row = this.database.prepare<[string, string, string, string], {
      round_trip_id: string;
      round_trip_version_id: string;
    }>(`SELECT round_trip_id, round_trip_version_id
FROM journal_round_trip_daily_trade_execution_mismatch_sets
WHERE execution_mismatch_set_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`)
      .get(input.mismatchSetId, input.scope.userId, input.scope.workspaceId, input.scope.accountId);
    if (!row) throw new Error("daily_trade_execution_mismatch_access_denied");
    this.database.prepare(`INSERT OR IGNORE INTO journal_round_trip_daily_trade_execution_mismatch_confirmations (
  execution_mismatch_confirmation_id, execution_mismatch_set_id, user_id,
  workspace_id, account_id, confirmation_kind, confirmed_at_utc
) VALUES (?, ?, ?, ?, ?, 'broker_record_confirmed', ?)`)
      .run(createCanonicalUuidV4(), input.mismatchSetId, input.scope.userId,
        input.scope.workspaceId, input.scope.accountId,
        createCanonicalUtcTimestamp(input.now));
    return Object.freeze({
      roundTripId: row.round_trip_id,
      roundTripVersionId: row.round_trip_version_id,
    });
  }

  finishJob(jobId: string, status: "completed" | "no_coverage" | "provider_unavailable" | "expired", now: Date): void {
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE level_analysis_daily_trade_jobs
SET status = ?, completed_at_utc = ?, lease_expires_at_utc = NULL, updated_at_utc = ?
      WHERE daily_trade_job_id = ?`).run(status, timestamp, timestamp, jobId);
  }

  rescheduleJob(
    jobId: string,
    nextAttemptAt: Date,
    now: Date,
    options: Readonly<{ resetAttempts?: boolean }> = Object.freeze({}),
  ): void {
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE level_analysis_daily_trade_jobs
SET status = 'queued', next_attempt_at_utc = ?, lease_expires_at_utc = NULL,
  attempt_count = CASE WHEN ? = 1 THEN 0 ELSE attempt_count END,
  updated_at_utc = ?
WHERE daily_trade_job_id = ?`).run(
      createCanonicalUtcTimestamp(nextAttemptAt),
      options.resetAttempts === true ? 1 : 0,
      timestamp,
      jobId,
    );
  }
}
