import Decimal from "decimal.js";

import type { DailyTradeAnalyzerEventSnapshot } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

type TargetRow = Readonly<{
  account_id: string;
  daily_trade_analysis_version_id: string;
  market_session_set_version_id: string;
  symbol: string;
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

type SnapshotRow = Readonly<{ snapshot_json: string }>;

const TARGET_SYMBOLS = Object.freeze(["DSY", "MB", "NAMI", "WWR", "YJ"]);
const targetDate = process.argv[2] ?? "2026-08-07";

function candleIdentity(candle: Readonly<{
  closeDecimal: string;
  highDecimal: string;
  lowDecimal: string;
  openDecimal: string;
  time: number;
  turnoverDecimal?: string | null;
  volumeDecimal: string;
}>): string {
  return [candle.time, candle.openDecimal, candle.highDecimal, candle.lowDecimal,
    candle.closeDecimal, candle.volumeDecimal, candle.turnoverDecimal ?? null].join("|");
}

function exactVwapByTime(candles: readonly Readonly<{
  time: number;
  turnoverDecimal?: string | null;
  volumeDecimal: string;
}>[]): ReadonlyMap<number, Decimal | null> {
  let turnover = new Decimal(0);
  let volume = new Decimal(0);
  let complete = true;
  const result = new Map<number, Decimal | null>();
  for (const candle of candles) {
    if (candle.turnoverDecimal === null || candle.turnoverDecimal === undefined) complete = false;
    else turnover = turnover.plus(candle.turnoverDecimal);
    volume = volume.plus(candle.volumeDecimal);
    result.set(candle.time, complete && volume.gt(0) ? turnover.div(volume) : null);
  }
  return result;
}

async function main(): Promise<void> {
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const targets = database.prepare<[string], TargetRow>(`SELECT
  analysis.user_id,
  analysis.workspace_id,
  analysis.account_id,
  instrument.normalized_symbol AS symbol,
  current_version.daily_trade_analysis_version_id,
  current_version.market_session_set_version_id
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
WHERE session.trading_date_new_york = ?
ORDER BY instrument.normalized_symbol`).all(targetDate).filter((row) => TARGET_SYMBOLS.includes(row.symbol));
    const first = targets[0];
    if (!first || targets.length !== TARGET_SYMBOLS.length) throw new Error("fresh_moomoo_target_set_incomplete");
    if (targets.some((target) =>
      target.user_id !== first.user_id ||
      target.workspace_id !== first.workspace_id ||
      target.account_id !== first.account_id
    )) throw new Error("fresh_moomoo_target_scope_mismatch");
    const access = new MoomooConnectionAccessService(new MoomooConnectionRepository(database));
    const token = access.accessToken(Object.freeze({
      activeAccountId: first.account_id,
      allowedAccountIds: Object.freeze([first.account_id]),
      userId: first.user_id,
      workspaceId: first.workspace_id,
      workspaceRole: "owner" as const,
    }));
    const provider = new MoomooDailyTradeKlineMarketDataProvider(() => token);
    const session = newYorkExtendedSession(targetDate);
    if (!session) throw new Error("fresh_moomoo_session_invalid");
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

    const results = [];
    for (const target of targets) {
      const fetched = await provider.fetch({
        endTime: session.endTime,
        includeExtendedHours: true,
        interval: "1m",
        startTime: session.startTime,
        symbol: target.symbol,
      });
      if (!fetched.ok) throw new Error(`fresh_moomoo_fetch_failed_${target.symbol}_${fetched.failureReasonCode}`);
      const saved = candleStatement.all(target.market_session_set_version_id).map((candle) => ({
        closeDecimal: candle.close_decimal,
        highDecimal: candle.high_decimal,
        lowDecimal: candle.low_decimal,
        openDecimal: candle.open_decimal,
        time: candle.candle_time_utc_seconds,
        turnoverDecimal: candle.turnover_decimal,
        volumeDecimal: candle.volume_decimal,
      }));
      const savedIdentities = new Map(saved.map((candle) => [candle.time, candleIdentity(candle)]));
      const freshIdentities = new Map(fetched.candles.map((candle) => [candle.time, candleIdentity(candle)]));
      const timestamps = new Set([...savedIdentities.keys(), ...freshIdentities.keys()]);
      const mismatchedCandles = [...timestamps].filter((time) => savedIdentities.get(time) !== freshIdentities.get(time)).length;
      const freshVwap = exactVwapByTime(fetched.candles);
      const snapshots = snapshotStatement.all(target.daily_trade_analysis_version_id)
        .map((row) => JSON.parse(row.snapshot_json) as DailyTradeAnalyzerEventSnapshot);
      const vwapDifferences = snapshots.flatMap((snapshot) => {
        if (snapshot.candleTime === null || snapshot.indicators?.vwap === null || snapshot.indicators === null) return [];
        const exact = freshVwap.get(snapshot.candleTime) ?? null;
        return exact === null ? [] : [exact.minus(snapshot.indicators.vwap).abs()];
      });
      results.push(Object.freeze({
        freshCandleCount: fetched.candles.length,
        maximumEventVwapDifference: vwapDifferences.length === 0
          ? null
          : Decimal.max(...vwapDifferences).toSignificantDigits(12).toString(),
        mismatchedCandles,
        savedCandleCount: saved.length,
        symbol: target.symbol,
      }));
    }
    const summary = Object.freeze({
      allFreshCandlesMatchSavedFinalizedSession: results.every((result) => result.mismatchedCandles === 0),
      maximumEventVwapDifference: Decimal.max(
        ...results.map((result) => new Decimal(result.maximumEventVwapDifference ?? 0)),
      ).toSignificantDigits(12).toString(),
      symbolsCompared: results.length,
      targetDate,
    });
    process.stdout.write(`${JSON.stringify({ summary, symbols: results }, null, 2)}\n`);
    if (
      results.length !== TARGET_SYMBOLS.length ||
      !summary.allFreshCandlesMatchSavedFinalizedSession ||
      !new Decimal(summary.maximumEventVwapDifference).lte("0.000000000001")
    ) process.exitCode = 1;
  } finally {
    database.close();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "fresh_moomoo_vwap_verification_failed"}\n`);
  process.exitCode = 1;
});
