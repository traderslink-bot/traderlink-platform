// 2026-04-12 11:53 PM America/Toronto
// PURPOSE:
// Builds factual open-profit and giveback signals before each execution.
// This file stays strictly factual and interpretation free.
// It captures how much favorable open profit existed before an action,
// how much remained at the action, and how much had been given back.

import type { Candle } from "../types/candle";
import type { TradeDirection } from "../types/trade-timeline-input";
import type { PositionChangeDerivedSignal } from "./build-position-change-derived-signals";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function parseTimestampToMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid timestamp: "${timestamp}" could not be parsed.`);
  }

  return parsed;
}

function getCandlesAtOrBeforeTimestamp(
  candles: Candle[],
  timestamp: string,
): Candle[] {
  const executionTimeMs = parseTimestampToMs(timestamp);

  return candles.filter(
    (candle) => parseTimestampToMs(candle.timestamp) <= executionTimeMs,
  );
}

function getBestFavorablePriceBeforeExecution(
  candles: Candle[],
  tradeDirection: TradeDirection,
): number | null {
  if (candles.length === 0) {
    return null;
  }

  if (tradeDirection === "long") {
    return Math.max(...candles.map((candle) => candle.high));
  }

  return Math.min(...candles.map((candle) => candle.low));
}

function getOpenProfitPerShare(args: {
  tradeDirection: TradeDirection;
  basisPrice: number;
  marketPrice: number;
}): number {
  const { tradeDirection, basisPrice, marketPrice } = args;

  if (tradeDirection === "long") {
    return round(Math.max(0, marketPrice - basisPrice));
  }

  return round(Math.max(0, basisPrice - marketPrice));
}

export interface ProfitProtectionDerivedSignal {
  executionIndex: number;
  timestamp: string;
  executionPrice: number;

  previousPositionSize: number;
  previousAverageEntryPrice: number | null;
  currentPositionSize: number;

  executionWasReduction: boolean;
  executionWasFinalExit: boolean;
  executionOccurredWithOpenPosition: boolean;

  bestFavorablePriceBeforeExecution: number | null;

  maxOpenProfitBeforeExecution: number | null;
  maxOpenProfitPctBeforeExecution: number | null;

  openProfitAtExecution: number | null;
  openProfitPctAtExecution: number | null;

  givebackFromPeakOpenProfit: number | null;
  givebackFromPeakOpenProfitPct: number | null;

  hadMeaningfulOpenProfitBeforeExecution: boolean;
}

export interface BuildProfitProtectionDerivedSignalsArgs {
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
  tradeCandles: Candle[];
  tradeDirection: TradeDirection;
}

export function buildProfitProtectionDerivedSignals(
  args: BuildProfitProtectionDerivedSignalsArgs,
): ProfitProtectionDerivedSignal[] {
  const { positionChangeDerivedSignals, tradeCandles, tradeDirection } = args;

  return positionChangeDerivedSignals.map((signal) => {
    const executionOccurredWithOpenPosition =
      signal.previousPositionSize > 0 && signal.previousAverageEntryPrice !== null;

    const candlesBeforeExecution = executionOccurredWithOpenPosition
      ? getCandlesAtOrBeforeTimestamp(tradeCandles, signal.timestamp)
      : [];

    const bestFavorablePriceBeforeExecution = executionOccurredWithOpenPosition
      ? getBestFavorablePriceBeforeExecution(candlesBeforeExecution, tradeDirection)
      : null;

    const maxOpenProfitBeforeExecution =
      executionOccurredWithOpenPosition &&
      signal.previousAverageEntryPrice !== null &&
      bestFavorablePriceBeforeExecution !== null
        ? getOpenProfitPerShare({
            tradeDirection,
            basisPrice: signal.previousAverageEntryPrice,
            marketPrice: bestFavorablePriceBeforeExecution,
          })
        : null;

    const maxOpenProfitPctBeforeExecution =
      maxOpenProfitBeforeExecution !== null &&
      signal.previousAverageEntryPrice !== null &&
      signal.previousAverageEntryPrice > 0
        ? round(maxOpenProfitBeforeExecution / signal.previousAverageEntryPrice)
        : null;

    const openProfitAtExecution =
      executionOccurredWithOpenPosition &&
      signal.previousAverageEntryPrice !== null
        ? getOpenProfitPerShare({
            tradeDirection,
            basisPrice: signal.previousAverageEntryPrice,
            marketPrice: signal.executionPrice,
          })
        : null;

    const openProfitPctAtExecution =
      openProfitAtExecution !== null &&
      signal.previousAverageEntryPrice !== null &&
      signal.previousAverageEntryPrice > 0
        ? round(openProfitAtExecution / signal.previousAverageEntryPrice)
        : null;

    const givebackFromPeakOpenProfit =
      maxOpenProfitBeforeExecution !== null && openProfitAtExecution !== null
        ? round(Math.max(0, maxOpenProfitBeforeExecution - openProfitAtExecution))
        : null;

    const givebackFromPeakOpenProfitPct =
      maxOpenProfitBeforeExecution !== null && maxOpenProfitBeforeExecution > 0 &&
      givebackFromPeakOpenProfit !== null
        ? round(givebackFromPeakOpenProfit / maxOpenProfitBeforeExecution)
        : null;

    return {
      executionIndex: signal.executionIndex,
      timestamp: signal.timestamp,
      executionPrice: signal.executionPrice,

      previousPositionSize: signal.previousPositionSize,
      previousAverageEntryPrice: signal.previousAverageEntryPrice,
      currentPositionSize: signal.currentPositionSize,

      executionWasReduction: signal.positionDecreased,
      executionWasFinalExit: signal.closedPositionToFlat,
      executionOccurredWithOpenPosition,

      bestFavorablePriceBeforeExecution,

      maxOpenProfitBeforeExecution,
      maxOpenProfitPctBeforeExecution,

      openProfitAtExecution,
      openProfitPctAtExecution,

      givebackFromPeakOpenProfit,
      givebackFromPeakOpenProfitPct,

      hadMeaningfulOpenProfitBeforeExecution:
        maxOpenProfitBeforeExecution !== null && maxOpenProfitBeforeExecution > 0,
    };
  });
}
