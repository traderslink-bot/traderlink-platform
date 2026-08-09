import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

type CandidateRow = Readonly<{
  account_id: string;
  market_session_set_version_id: string | null;
  round_trip_id: string;
  round_trip_version_id: string;
  status: "ready" | "no_coverage" | "provider_unavailable" | "expired" | "pending";
  user_id: string;
  workspace_id: string;
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

loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
const database = openPlatformDatabase({ mode: "runtime" });
try {
  const candidates = database.prepare<[], CandidateRow>(`SELECT
  analysis.user_id,
  analysis.workspace_id,
  analysis.account_id,
  analysis.round_trip_id,
  analysis.round_trip_version_id,
  analysis.status,
  version.market_session_set_version_id
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
WHERE version.analyzer_contract_version <> 'daily_trade_analyzer_v2'
  OR EXISTS (
    SELECT 1
    FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
    WHERE snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
      AND json_extract(snapshot.snapshot_json, '$.fiveMinuteContext') IS NULL
  )
ORDER BY version.created_at_utc, version.daily_trade_analysis_version_id`).all();
  const candleStatement = database.prepare<[string], CandleRow>(`SELECT
  candle_time_utc_seconds, open_decimal, high_decimal, low_decimal, close_decimal,
  volume_decimal, turnover_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  const repository = new DailyTradeAnalyzerRepository(database);
  let rebuilt = 0;
  let skipped = 0;
  let patternContexts = 0;
  let fiveMinuteContexts = 0;
  for (const candidate of candidates) {
    if (!candidate.market_session_set_version_id) {
      skipped += 1;
      continue;
    }
    const scope: AccountScope = Object.freeze({
      accountId: candidate.account_id,
      userId: candidate.user_id,
      workspaceId: candidate.workspace_id,
      workspaceRole: "owner",
    });
    const target = repository.findEligibleTarget(scope, candidate.round_trip_id);
    if (!target || target.roundTripVersionId !== candidate.round_trip_version_id) {
      skipped += 1;
      continue;
    }
    const candles: readonly NormalizedMarketCandle[] = Object.freeze(candleStatement
      .all(candidate.market_session_set_version_id)
      .map((candle) => Object.freeze({
        closeDecimal: candle.close_decimal,
        highDecimal: candle.high_decimal,
        lowDecimal: candle.low_decimal,
        openDecimal: candle.open_decimal,
        time: candle.candle_time_utc_seconds,
        turnoverDecimal: candle.turnover_decimal,
        volumeDecimal: candle.volume_decimal,
      })));
    const analyzed = analyzeDailyTrade({
      candles,
      dailyRanges: [],
      direction: target.direction,
      events: target.events,
    });
    repository.persistAnalysis({
      analyzed,
      marketSessionSetVersionId: candidate.market_session_set_version_id,
      now: new Date(),
      scope,
      status: candidate.status,
      target,
    });
    rebuilt += 1;
    patternContexts += analyzed.eventSnapshots.reduce((total, snapshot) => total + snapshot.patterns.length, 0);
    fiveMinuteContexts += analyzed.eventSnapshots.filter((snapshot) =>
      snapshot.fiveMinuteContext.completedBeforeExecution !== null ||
      snapshot.fiveMinuteContext.containingCandle !== null).length;
  }
  process.stdout.write(`${JSON.stringify({
    candidates: candidates.length,
    fiveMinuteContexts,
    patternContexts,
    rebuilt,
    skipped,
  })}\n`);
  if (skipped > 0 || rebuilt !== candidates.length) process.exitCode = 1;
} finally {
  database.close();
}
