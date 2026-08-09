import Decimal from "decimal.js";
import Database from "better-sqlite3";

import type { DailyTradeAnalyzerEventSnapshot } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";

type Candle = Readonly<{
  close: Decimal;
  high: Decimal;
  low: Decimal;
  open: Decimal;
  time: number;
  turnover: Decimal;
  volume: Decimal;
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

type TargetRow = Readonly<{
  daily_trade_analysis_version_id: string;
  market_session_set_version_id: string;
  symbol: string;
}>;

type SnapshotRow = Readonly<{ snapshot_json: string }>;

type Timeframe = "1m" | "5m" | "15m" | "1h";

const TIMEFRAMES: readonly Timeframe[] = Object.freeze(["1m", "5m", "15m", "1h"]);
const TIMEFRAME_SECONDS: Readonly<Record<Timeframe, number>> = Object.freeze({
  "1h": 60 * 60,
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
});
const TARGET_SYMBOLS = new Set(["DSY", "MB", "NAMI", "WWR", "YJ"]);
const targetDate = process.argv[2] ?? "2026-08-07";
const summaryOnly = process.argv.includes("--summary");

function easternTime(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

function aggregate(candles: readonly Candle[], timeframe: Timeframe): readonly Candle[] {
  if (timeframe === "1m") return candles;
  const seconds = TIMEFRAME_SECONDS[timeframe];
  const buckets = new Map<number, {
    close: Decimal;
    high: Decimal;
    low: Decimal;
    open: Decimal;
    time: number;
    turnover: Decimal;
    volume: Decimal;
  }>();
  for (const candle of candles) {
    const time = Math.floor(candle.time / seconds) * seconds;
    const current = buckets.get(time);
    if (!current) {
      buckets.set(time, { ...candle, time });
      continue;
    }
    current.close = candle.close;
    current.high = Decimal.max(current.high, candle.high);
    current.low = Decimal.min(current.low, candle.low);
    current.turnover = current.turnover.plus(candle.turnover);
    current.volume = current.volume.plus(candle.volume);
  }
  return Object.freeze([...buckets.values()].map((candle) => Object.freeze(candle)));
}

function cumulativeVwap(
  candles: readonly Candle[],
  method: "exact_turnover" | "typical_price",
): ReadonlyMap<number, Decimal | null> {
  let numerator = new Decimal(0);
  let volume = new Decimal(0);
  const result = new Map<number, Decimal | null>();
  for (const candle of candles) {
    const typicalPrice = candle.high.plus(candle.low).plus(candle.close).div(3);
    numerator = numerator.plus(method === "exact_turnover"
      ? candle.turnover
      : typicalPrice.times(candle.volume));
    volume = volume.plus(candle.volume);
    result.set(candle.time, volume.gt(0) ? numerator.div(volume) : null);
  }
  return result;
}

function ema9(candles: readonly Candle[]): ReadonlyMap<number, Decimal> {
  let current: Decimal | null = null;
  const result = new Map<number, Decimal>();
  for (const candle of candles) {
    current = current === null
      ? candle.close
      : candle.close.times(0.2).plus(current.times(0.8));
    result.set(candle.time, current);
  }
  return result;
}

function rounded(value: Decimal | null | undefined): string | null {
  return value ? value.toDecimalPlaces(6).toFixed() : null;
}

function maximum(values: readonly Decimal[]): string {
  return values.length === 0 ? "0" : Decimal.max(...values).toSignificantDigits(12).toString();
}

const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
const database = new Database(configuration.databasePath, { fileMustExist: true, readonly: true });
try {
  const targets = database.prepare<[string], TargetRow>(`SELECT
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
ORDER BY instrument.normalized_symbol`).all(targetDate)
    .filter((row) => TARGET_SYMBOLS.has(row.symbol));

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

  const sessionCache = new Map<string, Readonly<{
    ema9: Readonly<Record<Timeframe, ReadonlyMap<number, Decimal>>>;
    exact: Readonly<Record<Timeframe, ReadonlyMap<number, Decimal | null>>>;
    finalExact: Readonly<Record<Timeframe, Decimal | null>>;
    finalTypical: Readonly<Record<Timeframe, Decimal | null>>;
    symbol: string;
    typical: Readonly<Record<Timeframe, ReadonlyMap<number, Decimal | null>>>;
  }>>();
  const executionRows: Record<string, unknown>[] = [];
  const savedDifferences: Decimal[] = [];
  const savedEmaDifferences: Decimal[] = [];
  const finalExactDifferences: Decimal[] = [];
  const finalTypicalDifferences: Decimal[] = [];
  const finalTypicalDifferencePercents: Decimal[] = [];
  const executionMethodDifferences = Object.fromEntries(
    TIMEFRAMES.map((timeframe) => [timeframe, [] as Decimal[]]),
  ) as Record<Timeframe, Decimal[]>;
  const executionMethodDifferencePercents = Object.fromEntries(
    TIMEFRAMES.map((timeframe) => [timeframe, [] as Decimal[]]),
  ) as Record<Timeframe, Decimal[]>;

  for (const target of targets) {
    let session = sessionCache.get(target.market_session_set_version_id);
    if (!session) {
      const candles = candleStatement.all(target.market_session_set_version_id).map((row) => {
        if (row.turnover_decimal === null) throw new Error(`missing_turnover_${target.symbol}`);
        return Object.freeze({
          close: new Decimal(row.close_decimal),
          high: new Decimal(row.high_decimal),
          low: new Decimal(row.low_decimal),
          open: new Decimal(row.open_decimal),
          time: row.candle_time_utc_seconds,
          turnover: new Decimal(row.turnover_decimal),
          volume: new Decimal(row.volume_decimal),
        });
      });
      const exact = Object.fromEntries(TIMEFRAMES.map((timeframe) => [
        timeframe,
        cumulativeVwap(aggregate(candles, timeframe), "exact_turnover"),
      ])) as Record<Timeframe, ReadonlyMap<number, Decimal | null>>;
      const ema9Points = Object.fromEntries(TIMEFRAMES.map((timeframe) => [
        timeframe,
        ema9(aggregate(candles, timeframe)),
      ])) as Record<Timeframe, ReadonlyMap<number, Decimal>>;
      const typical = Object.fromEntries(TIMEFRAMES.map((timeframe) => [
        timeframe,
        cumulativeVwap(aggregate(candles, timeframe), "typical_price"),
      ])) as Record<Timeframe, ReadonlyMap<number, Decimal | null>>;
      const finalExact = Object.fromEntries(TIMEFRAMES.map((timeframe) => [
        timeframe,
        [...exact[timeframe].values()].at(-1) ?? null,
      ])) as Record<Timeframe, Decimal | null>;
      const finalTypical = Object.fromEntries(TIMEFRAMES.map((timeframe) => [
        timeframe,
        [...typical[timeframe].values()].at(-1) ?? null,
      ])) as Record<Timeframe, Decimal | null>;
      for (const timeframe of TIMEFRAMES.slice(1)) {
        if (finalExact["1m"] && finalExact[timeframe]) {
          finalExactDifferences.push(finalExact["1m"].minus(finalExact[timeframe]).abs());
        }
        if (finalTypical["1m"] && finalTypical[timeframe]) {
          const difference = finalTypical["1m"].minus(finalTypical[timeframe]).abs();
          finalTypicalDifferences.push(difference);
          if (!finalTypical["1m"].isZero()) {
            finalTypicalDifferencePercents.push(difference.div(finalTypical["1m"]).times(100));
          }
        }
      }
      session = Object.freeze({
        ema9: ema9Points,
        exact,
        finalExact,
        finalTypical,
        symbol: target.symbol,
        typical,
      });
      sessionCache.set(target.market_session_set_version_id, session);
    }

    const snapshots = snapshotStatement.all(target.daily_trade_analysis_version_id)
      .map((row) => JSON.parse(row.snapshot_json) as DailyTradeAnalyzerEventSnapshot);
    for (const snapshot of snapshots) {
      if (snapshot.candleTime === null) continue;
      const candleTime = snapshot.candleTime;
      const saved = snapshot.indicators?.vwap === null || snapshot.indicators === null
        ? null
        : new Decimal(snapshot.indicators.vwap);
      const savedEma = snapshot.indicators?.ema9 === null || snapshot.indicators === null
        ? null
        : new Decimal(snapshot.indicators.ema9);
      const values = Object.fromEntries(TIMEFRAMES.flatMap((timeframe) => {
        const bucket = Math.floor(candleTime / TIMEFRAME_SECONDS[timeframe]) * TIMEFRAME_SECONDS[timeframe];
        const exact = session.exact[timeframe].get(bucket) ?? null;
        const typical = session.typical[timeframe].get(bucket) ?? null;
        if (exact && typical) {
          const difference = exact.minus(typical).abs();
          executionMethodDifferences[timeframe].push(difference);
          if (!exact.isZero()) {
            executionMethodDifferencePercents[timeframe].push(difference.div(exact).times(100));
          }
        }
        return [
          [`ema9_${timeframe}`, rounded(session.ema9[timeframe].get(bucket))],
          [`exact_${timeframe}`, rounded(exact)],
          [`typical_${timeframe}`, rounded(typical)],
        ];
      }));
      const exactOneMinute = session.exact["1m"].get(candleTime) ?? null;
      const emaOneMinute = session.ema9["1m"].get(candleTime) ?? null;
      if (saved && exactOneMinute) savedDifferences.push(saved.minus(exactOneMinute).abs());
      if (savedEma && emaOneMinute) savedEmaDifferences.push(savedEma.minus(emaOneMinute).abs());
      executionRows.push({
        executedAtEastern: easternTime(snapshot.event.executedAtUtc),
        executionPrice: snapshot.event.priceDecimal,
        savedAnalyzerEma9: rounded(savedEma),
        savedAnalyzerVwap: rounded(saved),
        symbol: target.symbol,
        ...values,
      });
    }
  }

  const uniqueSessions = [...sessionCache.values()];
  const sessionFinals = uniqueSessions.map((session) => ({
    symbol: session.symbol,
    ...Object.fromEntries(TIMEFRAMES.flatMap((timeframe) => [
      [`final_exact_${timeframe}`, rounded(session.finalExact[timeframe])],
      [`final_typical_${timeframe}`, rounded(session.finalTypical[timeframe])],
    ])),
  }));
  const summary = Object.freeze({
    executionCount: executionRows.length,
    maximumFinalExactTimeframeDifference: maximum(finalExactDifferences),
    maximumFinalTypicalTimeframeDifference: maximum(finalTypicalDifferences),
    maximumFinalTypicalTimeframeDifferencePercent: maximum(finalTypicalDifferencePercents),
    maximumSavedVsCalculatedOneMinuteEma9Difference: maximum(savedEmaDifferences),
    maximumSavedVsExactOneMinuteDifference: maximum(savedDifferences),
    maximumTypicalVsExactAtExecutions: Object.fromEntries(TIMEFRAMES.map((timeframe) => [
      timeframe,
      maximum(executionMethodDifferences[timeframe]),
    ])),
    maximumTypicalVsExactAtExecutionsPercent: Object.fromEntries(TIMEFRAMES.map((timeframe) => [
      timeframe,
      maximum(executionMethodDifferencePercents[timeframe]),
    ])),
    sessionCount: uniqueSessions.length,
    targetDate,
  });
  const output = summaryOnly
    ? {
        namiAt0630: executionRows.find((row) =>
          row.symbol === "NAMI" && row.executedAtEastern === "06:30:00") ?? null,
        sessionFinals,
        summary,
      }
    : { executions: executionRows, sessionFinals, summary };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (
    uniqueSessions.length !== TARGET_SYMBOLS.size ||
    executionRows.length === 0 ||
    new Decimal(summary.maximumSavedVsCalculatedOneMinuteEma9Difference).gt("0.000000000001") ||
    new Decimal(summary.maximumSavedVsExactOneMinuteDifference).gt("0.000000000001") ||
    new Decimal(summary.maximumFinalExactTimeframeDifference).gt("0.000000000001")
  ) process.exitCode = 1;
} finally {
  database.close();
}
