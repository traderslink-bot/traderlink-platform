import type Database from "better-sqlite3";
import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { priorIndicatorHistoryRanges } from "@/src/modules/level-analysis/server/trend-momentum-history-ranges";
import type { DemoIndicatorReceipt } from "./journal-demo-trend-momentum-analysis";

type VersionRow = {
  version_id: string; symbol: string; trading_date: string;
  requested_start_utc: string; requested_end_utc: string; candle_sha256: string; failure_reason_code: string | null;
};
const select = `SELECT version.market_session_set_version_id AS version_id,
 session.provider_symbol AS symbol, session.trading_date_new_york AS trading_date,
 version.requested_start_utc, version.requested_end_utc, version.candle_sha256, version.failure_reason_code,
 ROW_NUMBER() OVER (PARTITION BY session.trading_date_new_york
 ORDER BY (version.failure_reason_code IS NULL) DESC, version.requested_start_utc ASC, version.requested_end_utc DESC,
 version.retrieved_at_utc DESC, version.market_session_set_version_id ASC) AS day_rank
 FROM level_analysis_market_session_set_versions version
 JOIN level_analysis_market_session_sets session ON session.market_session_set_id=version.market_session_set_id
 WHERE session.provider_key='moomoo_history_kline'
 AND session.provider_adapter_version='moomoo_history_kline_v1'
 AND session.exchange_identity='unknown' AND session.interval='1m'
 AND session.session_policy='america_new_york_extended_0400_2000_v1'
 AND version.outcome='ready'
 AND version.candle_sha256 IS NOT NULL`;

/** Only public market receipts; caller separately authorizes the Demo account.
 * The core version is pinned to the Demo's existing analysis, never silently
 * replaced by a later provider refresh or a differently adjusted price series.
 */
export function readJournalDemoIndicatorReceipts(database: Database.Database, input: Readonly<{
  symbol: string; tradingDateNewYork: string; coreVersionId: string;
}>) {
  const windows = priorIndicatorHistoryRanges(input.tradingDateNewYork);
  const earliestDate = new Date(windows.at(-1)!.start * 1000).toISOString().slice(0, 10);
  const core = database.prepare(`${select}
 AND version.failure_reason_code IS NULL
 AND version.market_session_set_version_id=? AND session.provider_symbol=?
 AND session.trading_date_new_york=?`).get(input.coreVersionId, input.symbol, input.tradingDateNewYork) as VersionRow | undefined;
  if (!core) return null;
  // At most ten earlier weekday sessions. Pick one immutable version per day;
  // do not merge conflicting revisions. Prefer the widest completed range.
  const earlier = database.prepare(`SELECT * FROM (${select}
 AND (version.failure_reason_code IS NULL OR version.failure_reason_code='partial:moomoo_rows_excluded')
 AND session.provider_symbol=? AND session.trading_date_new_york>=?
 AND session.trading_date_new_york<?) WHERE day_rank=1 ORDER BY trading_date`).all(
    input.symbol, earliestDate, input.tradingDateNewYork,
  ) as VersionRow[];
  const allowed = new Set(windows.map(window => new Date(window.start * 1000).toISOString().slice(0, 10)));
  const byDate = new Map<string, VersionRow>();
  for (const row of earlier) if (allowed.has(row.trading_date) && !byDate.has(row.trading_date)) byDate.set(row.trading_date, row);
  // Keep the original core. A wider completed receipt may supply its missing
  // tail, but the calculator must compare every overlapping saved candle.
  const supplement = database.prepare(`${select}
 AND version.failure_reason_code IS NULL
 AND session.provider_symbol=? AND session.trading_date_new_york=?
 AND version.requested_start_utc<=? AND version.requested_end_utc>?
 ORDER BY version.requested_start_utc ASC,version.requested_end_utc DESC,
 version.retrieved_at_utc DESC,version.market_session_set_version_id ASC LIMIT 1`).get(
    input.symbol, input.tradingDateNewYork, core.requested_start_utc, core.requested_end_utc,
  ) as VersionRow | undefined;
  const selected = [...byDate.values(), core, ...(supplement ? [supplement] : [])];
  const receipts: DemoIndicatorReceipt[] = selected.map(row => {
    const range = { start: Date.parse(row.requested_start_utc) / 1000, endExclusive: Date.parse(row.requested_end_utc) / 1000 };
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.endExclusive) ||
      range.start % 60 !== 0 || range.endExclusive % 60 !== 0 || range.endExclusive <= range.start ||
      range.endExclusive - range.start > 86400) throw new Error("demo_indicator_saved_range_invalid");
    const candles = database.prepare(`SELECT candle_time_utc_seconds AS time,
 open_decimal AS openDecimal,high_decimal AS highDecimal,low_decimal AS lowDecimal,
 close_decimal AS closeDecimal,volume_decimal AS volumeDecimal,turnover_decimal AS turnoverDecimal
 FROM level_analysis_market_session_candles WHERE market_session_set_version_id=?
 ORDER BY candle_time_utc_seconds`).all(row.version_id) as NormalizedMarketCandle[];
    if (!candles.length) throw new Error("demo_indicator_saved_candles_missing");
    return { provider: "moomoo_history_kline", adapterVersion: "moomoo_history_kline_v1",
      symbol: row.symbol, range, complete: row.failure_reason_code === null, candles };
  });
  return { receipts, evidence: selected.map(row => ({ versionId: row.version_id,
    sha256: row.candle_sha256, startUtc: row.requested_start_utc, endUtc: row.requested_end_utc })) };
}
