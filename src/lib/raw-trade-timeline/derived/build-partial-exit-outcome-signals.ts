// 2026-04-13 12:05 AM America/Toronto
// PURPOSE:
// Builds factual post-reduction outcome signals until the next execution.
// This file stays strictly factual and interpretation free.
// It captures what price did after a partial exit before the trader acted again.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
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

function getCandlesStrictlyBetweenTimestamps(
  candles: Candle[],
  startTimestamp: string,
  endTimestamp: string,
): Candle[] {
  const startMs = parseTimestampToMs(startTimestamp);
  const endMs = parseTimestampToMs(endTimestamp);

  return candles.filter((candle) => {
    const candleMs = parseTimestampToMs(candle.timestamp);
    return candleMs > startMs && candleMs < endMs;
  });
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

export interface PartialExitOutcomeSignal {
  executionIndex: number;
  timestamp: string;
  executionPrice: number;

  executionWasReduction: boolean;
  executionWasPartialExit: boolean;
  currentPositionSizeAfterExecution: number;

  nextExecutionIndex: number | null;
  nextExecutionTimestamp: string | null;
  nextExecutionPrice: number | null;

  candlesUntilNextExecution: number | null;

  maxFavorablePriceAfterReductionBeforeNextExecution: number | null;
  maxAdversePriceAfterReductionBeforeNextExecution: number | null;

  maxFavorableMoveAfterReductionBeforeNextExecution: number | null;
  maxAdverseMoveAfterReductionBeforeNextExecution: number | null;

  maxFavorableMovePctAfterReductionBeforeNextExecution: number | null;
  maxAdverseMovePctAfterReductionBeforeNextExecution: number | null;

  priceAtNextExecutionVsReduction: number | null;
  priceAtNextExecutionVsReductionPct: number | null;
}

export interface BuildPartialExitOutcomeSignalsArgs {
  executions: Execution[];
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
  tradeCandles: Candle[];
  tradeDirection: TradeDirection;
}

export function buildPartialExitOutcomeSignals(
  args: BuildPartialExitOutcomeSignalsArgs,
): PartialExitOutcomeSignal[] {
  const {
    executions,
    positionChangeDerivedSignals,
    tradeCandles,
    tradeDirection,
  } = args;

  if (executions.length !== positionChangeDerivedSignals.length) {
    throw new Error(
      "Cannot build partial-exit outcome signals when executions and positionChangeDerivedSignals lengths do not match.",
    );
  }

  return positionChangeDerivedSignals.map((signal, index) => {
    const nextExecution = executions[index + 1] ?? null;
    const executionWasPartialExit =
      signal.positionDecreased && !signal.closedPositionToFlat;

    if (!executionWasPartialExit || nextExecution === null) {
      return {
        executionIndex: signal.executionIndex,
        timestamp: signal.timestamp,
        executionPrice: signal.executionPrice,
        executionWasReduction: signal.positionDecreased,
        executionWasPartialExit,
        currentPositionSizeAfterExecution: signal.currentPositionSize,
        nextExecutionIndex: nextExecution?.executionIndex ?? null,
        nextExecutionTimestamp: nextExecution?.timestamp ?? null,
        nextExecutionPrice: nextExecution?.price ?? null,
        candlesUntilNextExecution:
          nextExecution !== null
            ? getCandlesStrictlyBetweenTimestamps(
                tradeCandles,
                signal.timestamp,
                nextExecution.timestamp,
              ).length
            : null,
        maxFavorablePriceAfterReductionBeforeNextExecution: null,
        maxAdversePriceAfterReductionBeforeNextExecution: null,
        maxFavorableMoveAfterReductionBeforeNextExecution: null,
        maxAdverseMoveAfterReductionBeforeNextExecution: null,
        maxFavorableMovePctAfterReductionBeforeNextExecution: null,
        maxAdverseMovePctAfterReductionBeforeNextExecution: null,
        priceAtNextExecutionVsReduction: null,
        priceAtNextExecutionVsReductionPct: null,
      };
    }

    const candlesUntilNextExecution = getCandlesStrictlyBetweenTimestamps(
      tradeCandles,
      signal.timestamp,
      nextExecution.timestamp,
    );

    const maxHigh = getMaxHigh(candlesUntilNextExecution);
    const minLow = getMinLow(candlesUntilNextExecution);

    const maxFavorablePriceAfterReductionBeforeNextExecution =
      tradeDirection === "long" ? maxHigh : minLow;
    const maxAdversePriceAfterReductionBeforeNextExecution =
      tradeDirection === "long" ? minLow : maxHigh;

    const maxFavorableMoveAfterReductionBeforeNextExecution =
      maxFavorablePriceAfterReductionBeforeNextExecution !== null
        ? round(
            Math.abs(
              maxFavorablePriceAfterReductionBeforeNextExecution -
                signal.executionPrice,
            ),
          )
        : null;

    const maxAdverseMoveAfterReductionBeforeNextExecution =
      maxAdversePriceAfterReductionBeforeNextExecution !== null
        ? round(
            Math.abs(
              maxAdversePriceAfterReductionBeforeNextExecution -
                signal.executionPrice,
            ),
          )
        : null;

    const maxFavorableMovePctAfterReductionBeforeNextExecution =
      maxFavorableMoveAfterReductionBeforeNextExecution !== null &&
      signal.executionPrice > 0
        ? round(
            maxFavorableMoveAfterReductionBeforeNextExecution /
              signal.executionPrice,
          )
        : null;

    const maxAdverseMovePctAfterReductionBeforeNextExecution =
      maxAdverseMoveAfterReductionBeforeNextExecution !== null &&
      signal.executionPrice > 0
        ? round(
            maxAdverseMoveAfterReductionBeforeNextExecution /
              signal.executionPrice,
          )
        : null;

    const priceAtNextExecutionVsReduction = round(
      Math.abs(nextExecution.price - signal.executionPrice),
    );

    const priceAtNextExecutionVsReductionPct =
      signal.executionPrice > 0
        ? round(priceAtNextExecutionVsReduction / signal.executionPrice)
        : null;

    return {
      executionIndex: signal.executionIndex,
      timestamp: signal.timestamp,
      executionPrice: signal.executionPrice,
      executionWasReduction: signal.positionDecreased,
      executionWasPartialExit,
      currentPositionSizeAfterExecution: signal.currentPositionSize,
      nextExecutionIndex: nextExecution.executionIndex,
      nextExecutionTimestamp: nextExecution.timestamp,
      nextExecutionPrice: nextExecution.price,
      candlesUntilNextExecution: candlesUntilNextExecution.length,
      maxFavorablePriceAfterReductionBeforeNextExecution,
      maxAdversePriceAfterReductionBeforeNextExecution,
      maxFavorableMoveAfterReductionBeforeNextExecution,
      maxAdverseMoveAfterReductionBeforeNextExecution,
      maxFavorableMovePctAfterReductionBeforeNextExecution,
      maxAdverseMovePctAfterReductionBeforeNextExecution,
      priceAtNextExecutionVsReduction,
      priceAtNextExecutionVsReductionPct,
    };
  });
}
