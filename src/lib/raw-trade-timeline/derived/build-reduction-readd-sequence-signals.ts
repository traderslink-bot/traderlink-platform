// 2026-04-12 11:33 PM America/Toronto
// PURPOSE:
// Builds factual reduction and re-add sequence signals from raw trade timeline data.
// This file stays strictly factual and interpretation free.
// It captures whether an execution occurred after a prior reduction and how
// the trade evolved between those two actions.

import type { Candle } from "../types/candle";
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

function countCandlesStrictlyBetweenTimestamps(
  candles: Candle[],
  startTimestamp: string,
  endTimestamp: string,
): number {
  const startMs = parseTimestampToMs(startTimestamp);
  const endMs = parseTimestampToMs(endTimestamp);

  return candles.filter((candle) => {
    const candleMs = parseTimestampToMs(candle.timestamp);
    return candleMs > startMs && candleMs < endMs;
  }).length;
}

export interface ReductionReaddSequenceSignal {
  executionIndex: number;
  timestamp: string;

  hadPriorReductionBeforeExecution: boolean;
  mostRecentReductionExecutionIndex: number | null;
  mostRecentReductionTimestamp: string | null;
  mostRecentReductionPrice: number | null;

  executionsSinceMostRecentReduction: number | null;
  timeSinceMostRecentReductionSeconds: number | null;
  candlesSinceMostRecentReduction: number | null;

  priceChangeSinceMostRecentReduction: number | null;
  priceChangeSinceMostRecentReductionPct: number | null;

  mostRecentReductionPositionSizeAfterExecution: number | null;
  currentPositionSizeAfterExecution: number;

  executionIsReaddAfterReduction: boolean;
  executionRestoredSizeAboveMostRecentReduction: boolean | null;
}

export interface BuildReductionReaddSequenceSignalsArgs {
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
  tradeCandles: Candle[];
}

export function buildReductionReaddSequenceSignals(
  args: BuildReductionReaddSequenceSignalsArgs,
): ReductionReaddSequenceSignal[] {
  const { positionChangeDerivedSignals, tradeCandles } = args;

  let mostRecentReduction: PositionChangeDerivedSignal | null = null;

  return positionChangeDerivedSignals.map((signal) => {
    const priorReduction = mostRecentReduction;
    const hadPriorReductionBeforeExecution = priorReduction !== null;

    const timeSinceMostRecentReductionSeconds =
      priorReduction !== null
        ? round(
            (parseTimestampToMs(signal.timestamp) -
              parseTimestampToMs(priorReduction.timestamp)) /
              1000,
          )
        : null;

    const candlesSinceMostRecentReduction =
      priorReduction !== null
        ? countCandlesStrictlyBetweenTimestamps(
            tradeCandles,
            priorReduction.timestamp,
            signal.timestamp,
          )
        : null;

    const priceChangeSinceMostRecentReduction =
      priorReduction !== null
        ? round(Math.abs(signal.executionPrice - priorReduction.executionPrice))
        : null;

    const priceChangeSinceMostRecentReductionPct =
      priorReduction !== null && priorReduction.executionPrice > 0
        ? round(
            Math.abs(signal.executionPrice - priorReduction.executionPrice) /
              priorReduction.executionPrice,
          )
        : null;

    const executionIsReaddAfterReduction =
      signal.positionIncreased && hadPriorReductionBeforeExecution;

    const executionRestoredSizeAboveMostRecentReduction =
      executionIsReaddAfterReduction && priorReduction !== null
        ? signal.currentPositionSize > priorReduction.currentPositionSize
        : null;

    const result: ReductionReaddSequenceSignal = {
      executionIndex: signal.executionIndex,
      timestamp: signal.timestamp,

      hadPriorReductionBeforeExecution,
      mostRecentReductionExecutionIndex: priorReduction?.executionIndex ?? null,
      mostRecentReductionTimestamp: priorReduction?.timestamp ?? null,
      mostRecentReductionPrice: priorReduction?.executionPrice ?? null,

      executionsSinceMostRecentReduction:
        priorReduction !== null
          ? signal.executionIndex - priorReduction.executionIndex
          : null,
      timeSinceMostRecentReductionSeconds,
      candlesSinceMostRecentReduction,

      priceChangeSinceMostRecentReduction,
      priceChangeSinceMostRecentReductionPct,

      mostRecentReductionPositionSizeAfterExecution:
        priorReduction?.currentPositionSize ?? null,
      currentPositionSizeAfterExecution: signal.currentPositionSize,

      executionIsReaddAfterReduction,
      executionRestoredSizeAboveMostRecentReduction,
    };

    if (signal.positionDecreased) {
      mostRecentReduction = signal;
    }

    return result;
  });
}
