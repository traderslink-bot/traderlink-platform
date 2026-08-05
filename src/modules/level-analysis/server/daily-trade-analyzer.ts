import Decimal from "decimal.js";

import type { TradeCandle } from "@/src/lib/trade-candle-analysis/candle-analysis";
import {
  calculateAdr20,
  calculateIndicatorPoints,
} from "@/src/lib/trade-candle-analysis/indicator-context";
import { detectMicroCapCandlePatterns } from "@/src/lib/trade-candle-analysis/pattern-detection";

import {
  DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES,
  type DailyTradeAnalyzerEvent,
  type DailyTradeAnalyzerEventSnapshot,
  type DailyTradeAnalyzerInput,
  type DailyTradeAnalyzerPattern,
  type DailyTradeAnalyzerPostExitPath,
  type DailyTradeAnalyzerResult,
} from "../contracts/daily-trade-analyzer-contracts";
import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";

function numericCandles(candles: readonly NormalizedMarketCandle[]): readonly TradeCandle[] {
  return Object.freeze(candles.map((candle) => Object.freeze({
    time: candle.time,
    open: Number(candle.openDecimal),
    high: Number(candle.highDecimal),
    low: Number(candle.lowDecimal),
    close: Number(candle.closeDecimal),
    volume: Number(candle.volumeDecimal),
  })));
}

function containingMinute(executedAtUtc: string): number | null {
  const milliseconds = Date.parse(executedAtUtc);
  return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 60_000) * 60 : null;
}

function decimal(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  const result = new Decimal(value);
  return result.isZero() ? "0" : result.toFixed();
}

function relativeVolume(candles: readonly TradeCandle[], index: number): number | null {
  const candidate = candles[index];
  if (!candidate || index < 1 || !Number.isFinite(candidate.volume) || candidate.volume <= 0) {
    return null;
  }
  const earlier = candles.slice(Math.max(0, index - 20), index)
    .map((candle) => candle.volume)
    .filter((volume) => Number.isFinite(volume) && volume > 0);
  if (earlier.length < 5) return null;
  const average = earlier.reduce((total, volume) => total + volume, 0) / earlier.length;
  return average > 0 ? candidate.volume / average : null;
}

function patternsAt(
  patterns: readonly DailyTradeAnalyzerPattern[],
  candleTime: number,
): readonly DailyTradeAnalyzerPattern[] {
  return Object.freeze(patterns.filter((pattern) => pattern.time === candleTime));
}

function eventSnapshot(
  event: DailyTradeAnalyzerEvent,
  candles: readonly TradeCandle[],
  indicatorPoints: ReturnType<typeof calculateIndicatorPoints>,
  adr20: number | null,
  patterns: readonly DailyTradeAnalyzerPattern[],
): DailyTradeAnalyzerEventSnapshot {
  const candleTime = containingMinute(event.executedAtUtc);
  if (candleTime === null) {
    return Object.freeze({ candleTime: null, event, indicators: null, patterns: Object.freeze([]) });
  }
  const index = candles.findIndex((candle) => candle.time === candleTime);
  const point = index >= 0 ? indicatorPoints[index] : null;
  if (!point) {
    return Object.freeze({ candleTime, event, indicators: null, patterns: Object.freeze([]) });
  }
  return Object.freeze({
    candleTime,
    event,
    indicators: Object.freeze({
      adr20,
      atr14: point.atr14,
      ema9: point.ema9,
      ema20: point.ema20,
      macd: point.macd,
      macdHistogram: point.macdHistogram,
      macdSignal: point.macdSignal,
      relativeVolume: relativeVolume(candles, index),
      rsi14: point.rsi14,
      vwap: point.vwap,
    }),
    patterns: patternsAt(patterns, candleTime),
  });
}

function postExitPath(
  event: DailyTradeAnalyzerEvent,
  direction: DailyTradeAnalyzerInput["direction"],
  candles: readonly TradeCandle[],
  minutesAfterExit: DailyTradeAnalyzerPostExitPath["minutesAfterExit"],
): DailyTradeAnalyzerPostExitPath {
  const exitMinute = containingMinute(event.executedAtUtc);
  const exitPrice = new Decimal(event.priceDecimal);
  if (exitMinute === null || !exitPrice.isFinite()) {
    return Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null });
  }
  const target = exitMinute + minutesAfterExit * 60;
  const observed = candles.filter((candle) => candle.time > exitMinute && candle.time <= target);
  const latestObserved = observed.at(-1) ?? null;
  if (!latestObserved || latestObserved.time < target - 60) {
    return Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null });
  }
  const favorable = direction === "long"
    ? Math.max(...observed.map((candle) => candle.high))
    : Math.min(...observed.map((candle) => candle.low));
  const move = direction === "long"
    ? new Decimal(favorable).minus(exitPrice).toNumber()
    : exitPrice.minus(favorable).toNumber();
  return Object.freeze({
    minutesAfterExit,
    favorableMoveDecimal: decimal(move),
    observedAtCandleTime: latestObserved.time,
  });
}

/**
 * Produces only derived market facts. It never changes a Journal execution,
 * round trip, rule, tag, note, or trading-day review.
 */
export function analyzeDailyTrade(input: DailyTradeAnalyzerInput): DailyTradeAnalyzerResult {
  const candles = numericCandles(input.candles);
  const adr20 = calculateAdr20(input.dailyRanges);
  const indicatorPoints = calculateIndicatorPoints(candles);
  const patterns = Object.freeze(detectMicroCapCandlePatterns(candles).map((pattern) => Object.freeze({
    kind: pattern.kind,
    score: 1,
    time: pattern.time,
  })));
  const eventSnapshots = Object.freeze(input.events.map((event) => eventSnapshot(
    event,
    candles,
    indicatorPoints,
    adr20,
    patterns,
  )));
  const finalExit = [...input.events].reverse().find((event) => event.kind === "final_exit") ?? null;
  const finalExitPaths = Object.freeze(DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES.map((minutesAfterExit) =>
    finalExit
      ? postExitPath(finalExit, input.direction, candles, minutesAfterExit)
      : Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null }),
  ));
  return Object.freeze({ eventSnapshots, finalExitPaths });
}
