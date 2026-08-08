import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import { analyzeDailyTradeGreenToRed } from "./daily-trade-green-to-red-analyzer";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import {
  hasDailyTradePathMaterializationSchema,
  persistDailyTradePathMaterialization,
} from "./daily-trade-path-materialization-repository";

type CandidateRow = Readonly<{
  account_id: string;
  created_at_utc: string;
  daily_trade_analysis_version_id: string;
  market_session_set_version_id: string | null;
  round_trip_id: string;
  round_trip_version_id: string;
  user_id: string;
  workspace_id: string;
}>;

export type DailyTradePathBackfillCursor = Readonly<{
  createdAtUtc: string;
  analysisVersionId: string;
}>;

export type DailyTradePathBackfillResult = Readonly<{
  materialized: number;
  nextCursor: DailyTradePathBackfillCursor | null;
  scanned: number;
  skipped: number;
}>;

/**
 * Materializes only the current analyzer revision. Historical analyzer rows do
 * not preserve their exact round-trip version, so reconstructing them would
 * risk attaching later Journal facts to an earlier analysis.
 */
export function backfillCurrentDailyTradePathMaterializations(
  database: Database.Database,
  options: Readonly<{
    batchSize?: number;
    cursor?: DailyTradePathBackfillCursor | null;
  }> = {},
): DailyTradePathBackfillResult {
  if (!hasDailyTradePathMaterializationSchema(database)) {
    throw new Error("daily_trade_path_materialization_schema_missing");
  }
  const batchSize = options.batchSize ?? 100;
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new Error("daily_trade_path_backfill_batch_size_invalid");
  }
  const cursor = options.cursor ?? null;
  const rows = database.prepare<[
    string | null,
    string | null,
    string | null,
    string | null,
    number,
  ], CandidateRow>(`SELECT
  analysis.user_id,
  analysis.workspace_id,
  analysis.account_id,
  analysis.round_trip_id,
  analysis.round_trip_version_id,
  version.daily_trade_analysis_version_id,
  version.market_session_set_version_id,
  version.created_at_utc
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
LEFT JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
WHERE summary.daily_trade_analysis_version_id IS NULL
  AND (
    ? IS NULL OR version.created_at_utc > ? OR
    (version.created_at_utc = ? AND version.daily_trade_analysis_version_id > ?)
  )
ORDER BY version.created_at_utc, version.daily_trade_analysis_version_id
LIMIT ?`).all(
    cursor?.createdAtUtc ?? null,
    cursor?.createdAtUtc ?? null,
    cursor?.createdAtUtc ?? null,
    cursor?.analysisVersionId ?? null,
    batchSize,
  );
  const analyzerRepository = new DailyTradeAnalyzerRepository(database);
  const candles = database.prepare<[string], {
    candle_time_utc_seconds: number;
    close_decimal: string;
  }>(`SELECT candle_time_utc_seconds, close_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  let materialized = 0;
  let skipped = 0;
  for (const row of rows) {
    const scope: AccountScope = Object.freeze({
      accountId: row.account_id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      workspaceRole: "owner",
    });
    const target = analyzerRepository.findEligibleTarget(scope, row.round_trip_id);
    if (!target || target.roundTripVersionId !== row.round_trip_version_id) {
      skipped += 1;
      continue;
    }
    const savedCandles = row.market_session_set_version_id
      ? candles.all(row.market_session_set_version_id).map((candle) => Object.freeze({
          closeDecimal: candle.close_decimal,
          time: candle.candle_time_utc_seconds,
        }))
      : [];
    const path = analyzeDailyTradeGreenToRed({
      candles: savedCandles,
      direction: target.direction,
      events: target.events,
    });
    const inserted = database.transaction(() => persistDailyTradePathMaterialization(database, {
      analysis: path,
      analysisVersionId: row.daily_trade_analysis_version_id,
      roundTripVersionId: row.round_trip_version_id,
    })).immediate();
    if (inserted) materialized += 1;
  }
  const last = rows.at(-1);
  return Object.freeze({
    materialized,
    nextCursor: rows.length === batchSize && last
      ? Object.freeze({
          analysisVersionId: last.daily_trade_analysis_version_id,
          createdAtUtc: last.created_at_utc,
        })
      : null,
    scanned: rows.length,
    skipped,
  });
}
