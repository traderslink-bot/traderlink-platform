import Decimal from "decimal.js";

import { detectExecutionPatternContexts } from "@/src/lib/trade-candle-analysis/execution-pattern-context";
import type { DailyTradeAnalyzerEventSnapshot } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";
import { newYorkExtendedSession, postSessionReconciliationAt } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

type AnalysisRow = Readonly<{
  analysis_revision: number;
  analysis_version_count: number;
  daily_trade_analysis_version_id: string;
  direction: "long" | "short";
  job_attempt_count: number | null;
  job_completed_at_utc: string | null;
  job_status: string | null;
  market_session_set_id: string;
  market_session_set_version_id: string;
  requested_end_utc: string;
  requested_start_utc: string;
  retrieved_at_utc: string;
  session_revision: number;
  session_version_count: number;
  symbol: string;
  trading_date_new_york: string;
}>;

type CandleRow = Readonly<{
  candle_time_utc_seconds: number;
  close_decimal: string;
  high_decimal: string;
  low_decimal: string;
  open_decimal: string;
  turnover_decimal: string | null;
  volume_decimal: string;
}>;

type SnapshotRow = Readonly<{ snapshot_json: string }>;

const TARGET_SYMBOLS = Object.freeze(["DSY", "MB", "NAMI", "WWR", "YJ"]);
const targetDate = process.argv[2] ?? "2026-08-07";
const previewV2 = process.argv.includes("--preview-v2");

function easternTime(seconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(seconds * 1000));
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1]! + ordered[middle]!) / 2
    : ordered[middle]!;
}

function ratio(value: number, baseline: number): number | null {
  return baseline > 0 ? Number((value / baseline).toFixed(4)) : null;
}

function signedRatio(value: number, baseline: number): number | null {
  return baseline > 0 ? Number((value / baseline).toFixed(4)) : null;
}

function patternEvidence(
  candles: readonly Readonly<{ close: number; high: number; low: number; open: number; time: number; volume: number }>[],
  pattern: Readonly<{ kind: string; time: number }>,
): Readonly<Record<string, boolean | number | null | string>> {
  const index = candles.findIndex((candle) => candle.time === pattern.time);
  const candle = candles[index];
  const previous = candles[index - 1];
  if (!candle || !previous) return Object.freeze({ kind: pattern.kind, evidenceAvailable: false });
  const active = (item: typeof candle): boolean => item.volume > 0 && item.high > item.low;
  const recent = candles.slice(Math.max(0, index - 10), index).filter(active);
  const ranges = recent.map((item) => item.high - item.low);
  const bodies = recent.map((item) => Math.abs(item.close - item.open)).filter((value) => value > 0);
  const medianRange = median(ranges);
  const medianVolume = median(recent.map((item) => item.volume));
  const candleRange = candle.high - candle.low;
  const candleBody = Math.abs(candle.close - candle.open);
  const bodyBaseline = Math.max(median(bodies), medianRange * 0.15);
  const closeLocation = candleRange > 0 ? (candle.close - candle.low) / candleRange : 0;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const recentThree = candles.slice(Math.max(0, index - 3), index).filter(active);
  const confirmation = candles[index + 1];
  const midpoint = (candle.high + candle.low) / 2;
  const recentDirectionalMove = recentThree.length >= 2
    ? previous.close - recentThree[0]!.open
    : 0;
  return Object.freeze({
    bodyShare: ratio(candleBody, candleRange),
    bodyToBaseline: ratio(candleBody, bodyBaseline),
    closeLocation: Number(closeLocation.toFixed(4)),
    confirmationCloseAboveMidpoint: confirmation ? confirmation.close > midpoint : false,
    confirmationDirectionMatches: confirmation ? confirmation.close > confirmation.open : false,
    evidenceAvailable: recent.length >= 5,
    kind: pattern.kind,
    lowerWickShare: ratio(lowerWick, candleRange),
    priorDirectionalMoveInMedianRanges: signedRatio(recentDirectionalMove, medianRange),
    rangeToMedian: ratio(candleRange, medianRange),
    testedLocalLow: recentThree.length >= 2 && candle.low <= Math.min(...recentThree.map((item) => item.low)),
    timeEastern: easternTime(pattern.time),
    upperWickShare: ratio(upperWick, candleRange),
    volumeToMedian: ratio(candle.volume, medianVolume),
  });
}

loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
const database = openReadonlyPlatformDatabase();
try {
  const analyses = database.prepare<[string], AnalysisRow>(`SELECT
  instrument.normalized_symbol AS symbol,
  round_trip_version.direction,
  session.trading_date_new_york,
  current_version.daily_trade_analysis_version_id,
  current_version.market_session_set_version_id,
  analysis.current_revision AS analysis_revision,
  (SELECT COUNT(*) FROM journal_round_trip_daily_trade_analysis_versions all_analysis_versions
    WHERE all_analysis_versions.daily_trade_analysis_id = analysis.daily_trade_analysis_id) AS analysis_version_count,
  session.market_session_set_id,
  session_version.revision_number AS session_revision,
  (SELECT COUNT(*) FROM level_analysis_market_session_set_versions all_session_versions
    WHERE all_session_versions.market_session_set_id = session.market_session_set_id) AS session_version_count,
  session_version.requested_start_utc,
  session_version.requested_end_utc,
  session_version.retrieved_at_utc,
  job.status AS job_status,
  job.attempt_count AS job_attempt_count,
  job.completed_at_utc AS job_completed_at_utc
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions current_version
  ON current_version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND current_version.revision_number = analysis.current_revision
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.workspace_id = analysis.workspace_id
  AND round_trip_version.account_id = analysis.account_id
  AND round_trip_version.round_trip_version_id = analysis.round_trip_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = round_trip_version.workspace_id
  AND instrument.instrument_id = round_trip_version.instrument_id
JOIN level_analysis_market_session_set_versions session_version
  ON session_version.market_session_set_version_id = current_version.market_session_set_version_id
JOIN level_analysis_market_session_sets session
  ON session.market_session_set_id = session_version.market_session_set_id
LEFT JOIN level_analysis_daily_trade_jobs job
  ON job.workspace_id = analysis.workspace_id
  AND job.account_id = analysis.account_id
  AND job.round_trip_version_id = analysis.round_trip_version_id
  AND job.market_session_set_id = session.market_session_set_id
WHERE session.trading_date_new_york = ?
ORDER BY instrument.normalized_symbol`).all(targetDate).filter((row) => TARGET_SYMBOLS.includes(row.symbol));

  const candleStatement = database.prepare<[string], CandleRow>(`SELECT
  candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal,
  volume_decimal, turnover_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  const snapshotStatement = database.prepare<[string], SnapshotRow>(`SELECT snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id = ?
ORDER BY candle_time_utc_seconds, execution_id`);
  const sessionTimingStatement = database.prepare<[string, string, string], Readonly<{
    after_due: number;
    before_due: number;
  }>>(`SELECT
  SUM(CASE WHEN retrieved_at_utc < ? THEN 1 ELSE 0 END) AS before_due,
  SUM(CASE WHEN retrieved_at_utc >= ? THEN 1 ELSE 0 END) AS after_due
FROM level_analysis_market_session_set_versions
WHERE market_session_set_id = ?`);

  const results = analyses.map((analysis) => {
    const candles = candleStatement.all(analysis.market_session_set_version_id);
    const numericCandles = candles.map((candle) => ({
      close: Number(candle.close_decimal),
      high: Number(candle.high_decimal),
      low: Number(candle.low_decimal),
      open: Number(candle.open_decimal),
      time: candle.candle_time_utc_seconds,
      turnover: candle.turnover_decimal === null ? null : Number(candle.turnover_decimal),
      volume: Number(candle.volume_decimal),
    }));
    const snapshots = snapshotStatement.all(analysis.daily_trade_analysis_version_id)
      .map((row) => JSON.parse(row.snapshot_json) as DailyTradeAnalyzerEventSnapshot);
    const replay = analyzeDailyTrade({
      candles: candles.map((candle) => ({
        closeDecimal: candle.close_decimal,
        highDecimal: candle.high_decimal,
        lowDecimal: candle.low_decimal,
        openDecimal: candle.open_decimal,
        time: candle.candle_time_utc_seconds,
        turnoverDecimal: candle.turnover_decimal,
        volumeDecimal: candle.volume_decimal,
      })),
      dailyRanges: [],
      direction: analysis.direction,
      events: snapshots.map((snapshot) => snapshot.event),
    });
    const expectedContexts = snapshots.map((snapshot) => detectExecutionPatternContexts(
      numericCandles,
      Date.parse(snapshot.event.executedAtUtc) / 1000,
    ));
    const displayedPatterns = (previewV2 ? expectedContexts : snapshots.map((snapshot) => snapshot.patterns))
      .flatMap((patterns) => patterns);
    const patternReplayMatches = snapshots.every((snapshot, index) =>
      JSON.stringify(snapshot.patterns) === JSON.stringify(expectedContexts[index]),
    );
    const fiveMinuteReplayMatches = snapshots.every((snapshot, index) =>
      JSON.stringify(snapshot.fiveMinuteContext) ===
        JSON.stringify(replay.eventSnapshots[index]?.fiveMinuteContext),
    );

    let cumulativeTurnover = new Decimal(0);
    let cumulativeVolume = new Decimal(0);
    const exactVwapByTime = new Map<number, Decimal | null>();
    let turnoverComplete = true;
    for (const candle of candles) {
      if (candle.turnover_decimal === null) turnoverComplete = false;
      else cumulativeTurnover = cumulativeTurnover.plus(candle.turnover_decimal);
      cumulativeVolume = cumulativeVolume.plus(candle.volume_decimal);
      exactVwapByTime.set(
        candle.candle_time_utc_seconds,
        turnoverComplete && cumulativeVolume.gt(0) ? cumulativeTurnover.div(cumulativeVolume) : null,
      );
    }
    const vwapDifferences = snapshots.flatMap((snapshot) => {
      if (snapshot.candleTime === null || snapshot.indicators?.vwap === null || snapshot.indicators === null) return [];
      const exact = exactVwapByTime.get(snapshot.candleTime) ?? null;
      return exact === null ? [] : [exact.minus(snapshot.indicators.vwap).abs()];
    });
    const session = newYorkExtendedSession(analysis.trading_date_new_york);
    const reconciliationAt = session ? postSessionReconciliationAt(session) : null;
    const sessionTiming = reconciliationAt === null
      ? null
      : sessionTimingStatement.get(
          reconciliationAt.toISOString(),
          reconciliationAt.toISOString(),
          analysis.market_session_set_id,
        ) ?? null;
    const reconciledAfterDueTime = reconciliationAt !== null &&
      Date.parse(analysis.retrieved_at_utc) >= reconciliationAt.getTime();

    return Object.freeze({
      analysisRevision: analysis.analysis_revision,
      analysisVersionCount: analysis.analysis_version_count,
      candleCount: candles.length,
      eventCount: snapshots.length,
      fiveMinuteReplayMatches,
      firstCandleEastern: candles[0] ? easternTime(candles[0].candle_time_utc_seconds) : null,
      hadPreAndPostReconciliationVersions: (sessionTiming?.before_due ?? 0) > 0 &&
        (sessionTiming?.after_due ?? 0) > 0,
      jobAttemptCount: analysis.job_attempt_count,
      jobStatus: analysis.job_status,
      lastCandleEastern: candles.at(-1) ? easternTime(candles.at(-1)!.candle_time_utc_seconds) : null,
      maximumEventVwapDifference: vwapDifferences.length === 0
        ? null
        : Decimal.max(...vwapDifferences).toSignificantDigits(12).toString(),
      patternReplayMatches,
      patternEvidence: displayedPatterns
        .filter((pattern) => !("timeframe" in pattern) || pattern.timeframe === "1m")
        .map((pattern) => patternEvidence(numericCandles, pattern)),
      patterns: displayedPatterns.map((pattern) =>
        `${pattern.timeframe} ${pattern.candlesBeforeExecution} before ${pattern.availableAtExecution ? "available" : "retrospective"} ${easternTime(pattern.time)} ${pattern.kind}`),
      reconciledAfterDueTime,
      requestedFullExtendedSession: session !== null &&
        Date.parse(analysis.requested_start_utc) === session.startTime * 1000 &&
        Date.parse(analysis.requested_end_utc) === session.endTime * 1000,
      sessionRevision: analysis.session_revision,
      sessionVersionCount: analysis.session_version_count,
      symbol: analysis.symbol,
      turnoverComplete,
    });
  });

  const analyzedSymbols = [...new Set(results.map((result) => result.symbol))].sort();
  const expectedSymbols = [...TARGET_SYMBOLS].sort();
  const resultsWithJobs = results.filter((result) => result.jobStatus !== null);
  const summary = Object.freeze({
    allPatternReplaysMatch: results.every((result) => result.patternReplayMatches),
    allFiveMinuteReplaysMatch: results.every((result) => result.fiveMinuteReplayMatches),
    allExistingJobsCompleted: resultsWithJobs.every((result) =>
      result.jobStatus === "completed" && (result.jobAttemptCount ?? 0) >= 1),
    allHadPreAndPostReconciliationVersions: results.every((result) => result.hadPreAndPostReconciliationVersions),
    allReconciledAfterDueTime: results.every((result) => result.reconciledAfterDueTime),
    allRequestedFullExtendedSession: results.every((result) => result.requestedFullExtendedSession),
    allTurnoverComplete: results.every((result) => result.turnoverComplete),
    analysisCount: results.length,
    analyzedSymbols,
    expectedSymbols,
    existingJobCount: resultsWithJobs.length,
    maximumEventVwapDifference: Decimal.max(
      ...results.map((result) => new Decimal(result.maximumEventVwapDifference ?? 0)),
    ).toSignificantDigits(12).toString(),
    targetDate,
  });
  process.stdout.write(`${JSON.stringify({ summary, symbols: results }, null, 2)}\n`);
  if (
    JSON.stringify(analyzedSymbols) !== JSON.stringify(expectedSymbols) ||
    (!previewV2 && !summary.allPatternReplaysMatch) ||
    (!previewV2 && !summary.allFiveMinuteReplaysMatch) ||
    !summary.allExistingJobsCompleted ||
    !summary.allHadPreAndPostReconciliationVersions ||
    !summary.allReconciledAfterDueTime ||
    !summary.allRequestedFullExtendedSession ||
    !summary.allTurnoverComplete ||
    !new Decimal(summary.maximumEventVwapDifference).lte("0.000000000001")
  ) process.exitCode = 1;
} finally {
  database.close();
}
