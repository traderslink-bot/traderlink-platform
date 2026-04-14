// =========================
// 2026-04-12 08:02 PM America/Toronto
// EXECUTION LOCAL STRUCTURE SIGNALS
// file name: build-execution-local-structure-signals.ts
// =========================
//
// PURPOSE:
// Builds factual local candle-structure signals around each execution.
//
// This is a pure Layer 1 derived-signal builder.
// It converts nearby candle context into reusable raw measurements so that
// higher layers do not need to rescan candle arrays.
//
// NO interpretation
// NO scoring
// NO coaching
// NO pattern labeling
//
// SOURCE OF TRUTH:
// - RawTradeTimelineBuildResult.timeline.executionContextWindows
//
// OUTPUT EXAMPLES:
// - recent local high / low before execution
// - distance from recent high / low
// - price position within recent local range
// - recent run-up / drop before execution
// - local range expansion context
//
// =========================

import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { Candle } from "../types/candle";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function getMaxHigh(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.max(...candles.map((candle) => candle.high));
}

function getMinLow(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.min(...candles.map((candle) => candle.low));
}

function getAverageRange(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const total = candles.reduce((sum, candle) => {
    return sum + (candle.high - candle.low);
  }, 0);

  return round(total / candles.length);
}

function getExecutionPricePositionInRangePct(args: {
  executionPrice: number;
  localHigh: number | null;
  localLow: number | null;
}): number | null {
  const { executionPrice, localHigh, localLow } = args;

  if (localHigh === null || localLow === null) {
    return null;
  }

  const range = localHigh - localLow;

  if (range <= 0) {
    return null;
  }

  return round((executionPrice - localLow) / range);
}

function getDistanceFromHighPct(
  executionPrice: number,
  localHigh: number | null,
): number | null {
  if (localHigh === null || localHigh <= 0) {
    return null;
  }

  return round((localHigh - executionPrice) / localHigh);
}

function getDistanceFromLowPct(
  executionPrice: number,
  localLow: number | null,
): number | null {
  if (localLow === null || executionPrice <= 0) {
    return null;
  }

  return round((executionPrice - localLow) / executionPrice);
}

function countBullishCandles(candles: Candle[]): number {
  return candles.filter((candle) => candle.close > candle.open).length;
}

function countBearishCandles(candles: Candle[]): number {
  return candles.filter((candle) => candle.close < candle.open).length;
}

function getRecentRunUpPct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const highestHigh = getMaxHigh(candles);

  if (highestHigh === null || firstOpen <= 0) {
    return null;
  }

  return round((highestHigh - firstOpen) / firstOpen);
}

function getRecentDropPct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const lowestLow = getMinLow(candles);

  if (lowestLow === null || firstOpen <= 0) {
    return null;
  }

  return round((firstOpen - lowestLow) / firstOpen);
}

function getNetMovePct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const lastClose = candles[candles.length - 1].close;

  if (firstOpen <= 0) {
    return null;
  }

  return round((lastClose - firstOpen) / firstOpen);
}

export interface ExecutionLocalStructureSignal {
  executionIndex: number;
  executionTimestamp: string;
  executionPrice: number;

  candlesBeforeExecutionCount: number;
  candlesAfterExecutionCount: number;

  recentLocalHighBeforeExecution: number | null;
  recentLocalLowBeforeExecution: number | null;
  recentLocalRangeBeforeExecution: number | null;
  averageCandleRangeBeforeExecution: number | null;

  distanceFromRecentHighPct: number | null;
  distanceFromRecentLowPct: number | null;
  executionPricePositionInRecentRangePct: number | null;

  recentRunUpPctBeforeExecution: number | null;
  recentDropPctBeforeExecution: number | null;
  recentNetMovePctBeforeExecution: number | null;

  bullishCandlesBeforeExecutionCount: number;
  bearishCandlesBeforeExecutionCount: number;

  immediateNextCandleRange: number | null;
  immediateNextCandleRangePctOfExecutionPrice: number | null;
  immediateNextCandleWasBullish: boolean | null;
  immediateNextCandleWasBearish: boolean | null;

  averageCandleRangeAfterExecution: number | null;
  maxHighAfterExecution: number | null;
  minLowAfterExecution: number | null;
}

export function buildExecutionLocalStructureSignals(
  result: RawTradeTimelineBuildResult,
): ExecutionLocalStructureSignal[] {
  const { timeline } = result;
  const executionContextWindows = timeline.executionContextWindows ?? [];

  return executionContextWindows.map((window) => {
    const execution = window.execution;
    const candlesBefore = window.candlesBeforeExecution ?? [];
    const candlesAfter = window.candlesAfterExecution ?? [];

    const recentLocalHighBeforeExecution = getMaxHigh(candlesBefore);
    const recentLocalLowBeforeExecution = getMinLow(candlesBefore);

    const recentLocalRangeBeforeExecution =
      recentLocalHighBeforeExecution !== null &&
      recentLocalLowBeforeExecution !== null
        ? round(recentLocalHighBeforeExecution - recentLocalLowBeforeExecution)
        : null;

    const averageCandleRangeBeforeExecution = getAverageRange(candlesBefore);

    const distanceFromRecentHighPct = getDistanceFromHighPct(
      execution.price,
      recentLocalHighBeforeExecution,
    );

    const distanceFromRecentLowPct = getDistanceFromLowPct(
      execution.price,
      recentLocalLowBeforeExecution,
    );

    const executionPricePositionInRecentRangePct =
      getExecutionPricePositionInRangePct({
        executionPrice: execution.price,
        localHigh: recentLocalHighBeforeExecution,
        localLow: recentLocalLowBeforeExecution,
      });

    const recentRunUpPctBeforeExecution = getRecentRunUpPct(candlesBefore);
    const recentDropPctBeforeExecution = getRecentDropPct(candlesBefore);
    const recentNetMovePctBeforeExecution = getNetMovePct(candlesBefore);

    const bullishCandlesBeforeExecutionCount = countBullishCandles(candlesBefore);
    const bearishCandlesBeforeExecutionCount = countBearishCandles(candlesBefore);

    const firstCandleAfter = candlesAfter.length > 0 ? candlesAfter[0] : null;

    const immediateNextCandleRange =
      firstCandleAfter !== null
        ? round(firstCandleAfter.high - firstCandleAfter.low)
        : null;

    const immediateNextCandleRangePctOfExecutionPrice =
      firstCandleAfter !== null && execution.price > 0
        ? round((firstCandleAfter.high - firstCandleAfter.low) / execution.price)
        : null;

    const immediateNextCandleWasBullish =
      firstCandleAfter !== null ? firstCandleAfter.close > firstCandleAfter.open : null;

    const immediateNextCandleWasBearish =
      firstCandleAfter !== null ? firstCandleAfter.close < firstCandleAfter.open : null;

    const averageCandleRangeAfterExecution = getAverageRange(candlesAfter);
    const maxHighAfterExecution = getMaxHigh(candlesAfter);
    const minLowAfterExecution = getMinLow(candlesAfter);

    return {
      executionIndex: execution.executionIndex,
      executionTimestamp: execution.timestamp,
      executionPrice: execution.price,

      candlesBeforeExecutionCount: candlesBefore.length,
      candlesAfterExecutionCount: candlesAfter.length,

      recentLocalHighBeforeExecution,
      recentLocalLowBeforeExecution,
      recentLocalRangeBeforeExecution,
      averageCandleRangeBeforeExecution,

      distanceFromRecentHighPct,
      distanceFromRecentLowPct,
      executionPricePositionInRecentRangePct,

      recentRunUpPctBeforeExecution,
      recentDropPctBeforeExecution,
      recentNetMovePctBeforeExecution,

      bullishCandlesBeforeExecutionCount,
      bearishCandlesBeforeExecutionCount,

      immediateNextCandleRange,
      immediateNextCandleRangePctOfExecutionPrice,
      immediateNextCandleWasBullish,
      immediateNextCandleWasBearish,

      averageCandleRangeAfterExecution,
      maxHighAfterExecution,
      minLowAfterExecution,
    };
  });
}