import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { isDeepStrictEqual } from "node:util";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { analyzeDailyTradeGreenToRed } from "@/src/modules/level-analysis/server/daily-trade-green-to-red-analyzer";
import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { readDailyTradePathMaterialization } from "@/src/modules/level-analysis/server/daily-trade-path-materialization-repository";

type AnalysisRow = Readonly<{
  account_id: string;
  daily_trade_analysis_version_id: string;
  market_session_set_version_id: string | null;
  round_trip_id: string;
  round_trip_version_id: string;
  user_id: string;
  workspace_id: string;
}>;

loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });

const tradingDate = process.argv[2] ?? null;
const database = openPlatformDatabase({ mode: "runtime" });
try {
  const rows = database.prepare<[], AnalysisRow>(`SELECT
  analysis.user_id,
  analysis.workspace_id,
  analysis.account_id,
  analysis.round_trip_id,
  analysis.round_trip_version_id,
  version.daily_trade_analysis_version_id,
  version.market_session_set_version_id
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
ORDER BY version.created_at_utc, version.daily_trade_analysis_version_id`).all();
  const candles = database.prepare<[string], {
    candle_time_utc_seconds: number;
    close_decimal: string;
  }>(`SELECT candle_time_utc_seconds, close_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  const analyzerRepository = new DailyTradeAnalyzerRepository(database);
  let compared = 0;
  let matched = 0;
  let skipped = 0;
  for (const row of rows) {
    const scope: AccountScope = Object.freeze({
      accountId: row.account_id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      workspaceRole: "owner",
    });
    const target = analyzerRepository.findEligibleTarget(scope, row.round_trip_id);
    if (
      !target || target.roundTripVersionId !== row.round_trip_version_id ||
      (tradingDate !== null && target.tradingDateNewYork !== tradingDate)
    ) {
      if (tradingDate === null || target === null || target.tradingDateNewYork === tradingDate) {
        skipped += 1;
      }
      continue;
    }
    const savedCandles = row.market_session_set_version_id
      ? candles.all(row.market_session_set_version_id).map((candle) => Object.freeze({
          closeDecimal: candle.close_decimal,
          time: candle.candle_time_utc_seconds,
        }))
      : [];
    const recalculated = analyzeDailyTradeGreenToRed({
      candles: savedCandles,
      direction: target.direction,
      events: target.events,
    });
    const stored = readDailyTradePathMaterialization(
      database,
      row.daily_trade_analysis_version_id,
    );
    compared += 1;
    if (
      stored?.roundTripVersionId === row.round_trip_version_id &&
      isDeepStrictEqual(stored.path, recalculated)
    ) {
      matched += 1;
    }
  }
  process.stdout.write(`${JSON.stringify({ compared, matched, skipped, tradingDate })}\n`);
  if (compared === 0 || matched !== compared || skipped !== 0) process.exitCode = 1;
} finally {
  database.close();
}
