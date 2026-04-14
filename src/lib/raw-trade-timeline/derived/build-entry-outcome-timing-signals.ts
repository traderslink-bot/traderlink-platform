// =========================
// 2026-04-12 07:32 PM America/Toronto
// ENTRY OUTCOME TIMING SIGNALS
// file name: build-entry-outcome-timing-signals.ts
// =========================
//
// PURPOSE:
// Computes factual timing and sequencing of price behavior AFTER initial entry.
//
// This captures:
// - how fast price reached peak
// - how fast price reached worst point
// - candle distance and time distance to both
//
// NO interpretation
// NO scoring
// NO pattern labeling
//
// =========================

import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { Candle } from "../types/candle";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export interface EntryOutcomeTimingSignals {
  entryPrice: number;
  entryTimestamp: string;

  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;

  candlesToPeakFromEntry: number | null;
  candlesToWorstFromEntry: number | null;

  timeToPeakFromEntrySeconds: number | null;
  timeToWorstFromEntrySeconds: number | null;

  timestampOfPeak: string | null;
  timestampOfWorst: string | null;
}

function findFirstIndexByPrice(
  candles: Candle[],
  targetPrice: number,
  type: "high" | "low",
): number | null {
  for (let i = 0; i < candles.length; i++) {
    if (type === "high" && candles[i].high === targetPrice) {
      return i;
    }
    if (type === "low" && candles[i].low === targetPrice) {
      return i;
    }
  }
  return null;
}

export function buildEntryOutcomeTimingSignals(
  result: RawTradeTimelineBuildResult,
): EntryOutcomeTimingSignals {
  const { timeline, tradeDerivedSignals } = result;

  if (!tradeDerivedSignals) {
    throw new Error(
      "buildEntryOutcomeTimingSignals requires tradeDerivedSignals.",
    );
  }

  const executions = timeline.executions;
  const tradeCandles = timeline.tradeCandles;

  if (executions.length === 0) {
    throw new Error("Cannot compute entry timing without executions.");
  }

  const firstExecution = executions[0];

  const entryPrice = firstExecution.price;
  const entryTimestamp = firstExecution.timestamp;

  const peakPriceDuringTrade = tradeDerivedSignals.peakPriceDuringTrade;
  const worstPriceDuringTrade = tradeDerivedSignals.worstPriceDuringTrade;

  if (!tradeCandles || tradeCandles.length === 0) {
    return {
      entryPrice,
      entryTimestamp,
      peakPriceDuringTrade,
      worstPriceDuringTrade,
      candlesToPeakFromEntry: null,
      candlesToWorstFromEntry: null,
      timeToPeakFromEntrySeconds: null,
      timeToWorstFromEntrySeconds: null,
      timestampOfPeak: null,
      timestampOfWorst: null,
    };
  }

  const peakIndex =
    peakPriceDuringTrade !== null
      ? findFirstIndexByPrice(
          tradeCandles,
          peakPriceDuringTrade,
          "high",
        )
      : null;

  const worstIndex =
    worstPriceDuringTrade !== null
      ? findFirstIndexByPrice(
          tradeCandles,
          worstPriceDuringTrade,
          "low",
        )
      : null;

  let candlesToPeakFromEntry: number | null = null;
  let candlesToWorstFromEntry: number | null = null;

  let timeToPeakFromEntrySeconds: number | null = null;
  let timeToWorstFromEntrySeconds: number | null = null;

  let timestampOfPeak: string | null = null;
  let timestampOfWorst: string | null = null;

  if (peakIndex !== null) {
    candlesToPeakFromEntry = peakIndex + 1;

    const peakCandle = tradeCandles[peakIndex];
    timestampOfPeak = peakCandle.timestamp;

    timeToPeakFromEntrySeconds = round(
      (Date.parse(peakCandle.timestamp) -
        Date.parse(entryTimestamp)) /
        1000,
    );
  }

  if (worstIndex !== null) {
    candlesToWorstFromEntry = worstIndex + 1;

    const worstCandle = tradeCandles[worstIndex];
    timestampOfWorst = worstCandle.timestamp;

    timeToWorstFromEntrySeconds = round(
      (Date.parse(worstCandle.timestamp) -
        Date.parse(entryTimestamp)) /
        1000,
    );
  }

  return {
    entryPrice,
    entryTimestamp,
    peakPriceDuringTrade,
    worstPriceDuringTrade,
    candlesToPeakFromEntry,
    candlesToWorstFromEntry,
    timeToPeakFromEntrySeconds,
    timeToWorstFromEntrySeconds,
    timestampOfPeak,
    timestampOfWorst,
  };
}