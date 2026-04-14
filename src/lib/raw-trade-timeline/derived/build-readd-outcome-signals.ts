// 2026-04-13 11:02 AM America/Toronto
// PURPOSE:
// Builds factual post-readd outcome signals until the next execution.
// This file stays strictly factual and interpretation free.
// It captures what price did after a true re-add before the trader acted again.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type { TradeDirection } from "../types/trade-timeline-input";
import type { ReductionReaddSequenceSignal } from "./build-reduction-readd-sequence-signals";

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

export interface ReaddOutcomeSignal {
  executionIndex: number;
  timestamp: string;
  executionPrice: number;

  executionWasReaddAfterReduction: boolean;

  nextExecutionIndex: number | null;
  nextExecutionTimestamp: string | null;
  nextExecutionPrice: number | null;

  candlesUntilNextExecution: number | null;

  maxFavorablePriceAfterReaddBeforeNextExecution: number | null;
  maxAdversePriceAfterReaddBeforeNextExecution: number | null;

  maxFavorableMoveAfterReaddBeforeNextExecution: number | null;
  maxAdverseMoveAfterReaddBeforeNextExecution: number | null;

  maxFavorableMovePctAfterReaddBeforeNextExecution: number | null;
  maxAdverseMovePctAfterReaddBeforeNextExecution: number | null;

  priceAtNextExecutionVsReadd: number | null;
  priceAtNextExecutionVsReaddPct: number | null;
}

export interface BuildReaddOutcomeSignalsArgs {
  executions: Execution[];
  reductionReaddSequenceSignals: ReductionReaddSequenceSignal[];
  tradeCandles: Candle[];
  tradeDirection: TradeDirection;
}

export function buildReaddOutcomeSignals(
  args: BuildReaddOutcomeSignalsArgs,
): ReaddOutcomeSignal[] {
  const {
    executions,
    reductionReaddSequenceSignals,
    tradeCandles,
    tradeDirection,
  } = args;

  if (executions.length !== reductionReaddSequenceSignals.length) {
    throw new Error(
      "Cannot build readd outcome signals when executions and reductionReaddSequenceSignals lengths do not match.",
    );
  }

  return reductionReaddSequenceSignals.map((signal, index) => {
    const execution = executions[index];
    const nextExecution = executions[index + 1] ?? null;

    if (!signal.executionIsReaddAfterReduction || nextExecution === null) {
      return {
        executionIndex: signal.executionIndex,
        timestamp: signal.timestamp,
        executionPrice: execution.price,
        executionWasReaddAfterReduction: signal.executionIsReaddAfterReduction,
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
        maxFavorablePriceAfterReaddBeforeNextExecution: null,
        maxAdversePriceAfterReaddBeforeNextExecution: null,
        maxFavorableMoveAfterReaddBeforeNextExecution: null,
        maxAdverseMoveAfterReaddBeforeNextExecution: null,
        maxFavorableMovePctAfterReaddBeforeNextExecution: null,
        maxAdverseMovePctAfterReaddBeforeNextExecution: null,
        priceAtNextExecutionVsReadd: null,
        priceAtNextExecutionVsReaddPct: null,
      };
    }

    const candlesUntilNextExecution = getCandlesStrictlyBetweenTimestamps(
      tradeCandles,
      signal.timestamp,
      nextExecution.timestamp,
    );

    const maxHigh = getMaxHigh(candlesUntilNextExecution);
    const minLow = getMinLow(candlesUntilNextExecution);

    const maxFavorablePriceAfterReaddBeforeNextExecution =
      tradeDirection === "long" ? maxHigh : minLow;
    const maxAdversePriceAfterReaddBeforeNextExecution =
      tradeDirection === "long" ? minLow : maxHigh;

    const maxFavorableMoveAfterReaddBeforeNextExecution =
      maxFavorablePriceAfterReaddBeforeNextExecution !== null
        ? round(
            Math.abs(
              maxFavorablePriceAfterReaddBeforeNextExecution - execution.price,
            ),
          )
        : null;

    const maxAdverseMoveAfterReaddBeforeNextExecution =
      maxAdversePriceAfterReaddBeforeNextExecution !== null
        ? round(
            Math.abs(
              maxAdversePriceAfterReaddBeforeNextExecution - execution.price,
            ),
          )
        : null;

    const maxFavorableMovePctAfterReaddBeforeNextExecution =
      maxFavorableMoveAfterReaddBeforeNextExecution !== null &&
      execution.price > 0
        ? round(maxFavorableMoveAfterReaddBeforeNextExecution / execution.price)
        : null;

    const maxAdverseMovePctAfterReaddBeforeNextExecution =
      maxAdverseMoveAfterReaddBeforeNextExecution !== null &&
      execution.price > 0
        ? round(maxAdverseMoveAfterReaddBeforeNextExecution / execution.price)
        : null;

    const priceAtNextExecutionVsReadd = round(
      Math.abs(nextExecution.price - execution.price),
    );

    const priceAtNextExecutionVsReaddPct =
      execution.price > 0
        ? round(priceAtNextExecutionVsReadd / execution.price)
        : null;

    return {
      executionIndex: signal.executionIndex,
      timestamp: signal.timestamp,
      executionPrice: execution.price,
      executionWasReaddAfterReduction: signal.executionIsReaddAfterReduction,
      nextExecutionIndex: nextExecution.executionIndex,
      nextExecutionTimestamp: nextExecution.timestamp,
      nextExecutionPrice: nextExecution.price,
      candlesUntilNextExecution: candlesUntilNextExecution.length,
      maxFavorablePriceAfterReaddBeforeNextExecution,
      maxAdversePriceAfterReaddBeforeNextExecution,
      maxFavorableMoveAfterReaddBeforeNextExecution,
      maxAdverseMoveAfterReaddBeforeNextExecution,
      maxFavorableMovePctAfterReaddBeforeNextExecution,
      maxAdverseMovePctAfterReaddBeforeNextExecution,
      priceAtNextExecutionVsReadd,
      priceAtNextExecutionVsReaddPct,
    };
  });
}
