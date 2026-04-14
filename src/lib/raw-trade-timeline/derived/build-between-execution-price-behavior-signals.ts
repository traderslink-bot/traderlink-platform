// 2026-04-12 11:18 PM America/Toronto
// PURPOSE:
// Builds factual price-behavior signals for each gap between executions.
// This file stays strictly factual and interpretation free.
// It captures what price did between one execution and the next execution.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type { TradeDirection } from "../types/trade-timeline-input";

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

function getCandlesBetweenExecutions(
  candles: Candle[],
  fromExecutionTimestamp: string,
  toExecutionTimestamp: string,
): Candle[] {
  const startMs = parseTimestampToMs(fromExecutionTimestamp);
  const endMs = parseTimestampToMs(toExecutionTimestamp);

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

export interface BetweenExecutionPriceBehaviorSignal {
  fromExecutionIndex: number;
  toExecutionIndex: number;

  fromExecutionTimestamp: string;
  toExecutionTimestamp: string;

  fromExecutionPrice: number;
  toExecutionPrice: number;

  candlesBetweenExecutionsCount: number;

  highestPriceBetweenExecutions: number | null;
  lowestPriceBetweenExecutions: number | null;

  netMoveBetweenExecutions: number;
  netMovePctBetweenExecutions: number | null;

  maxFavorableMoveBetweenExecutions: number | null;
  maxAdverseMoveBetweenExecutions: number | null;

  maxFavorableMovePctBetweenExecutions: number | null;
  maxAdverseMovePctBetweenExecutions: number | null;
}

export interface BuildBetweenExecutionPriceBehaviorSignalsArgs {
  executions: Execution[];
  tradeCandles: Candle[];
  tradeDirection: TradeDirection;
}

export function buildBetweenExecutionPriceBehaviorSignals(
  args: BuildBetweenExecutionPriceBehaviorSignalsArgs,
): BetweenExecutionPriceBehaviorSignal[] {
  const { executions, tradeCandles, tradeDirection } = args;

  if (executions.length <= 1) {
    return [];
  }

  const signals: BetweenExecutionPriceBehaviorSignal[] = [];

  for (let index = 0; index < executions.length - 1; index += 1) {
    const fromExecution = executions[index];
    const toExecution = executions[index + 1];

    const candlesBetweenExecutions = getCandlesBetweenExecutions(
      tradeCandles,
      fromExecution.timestamp,
      toExecution.timestamp,
    );

    const highestPriceBetweenExecutions = getMaxHigh(candlesBetweenExecutions);
    const lowestPriceBetweenExecutions = getMinLow(candlesBetweenExecutions);

    const netMoveBetweenExecutions = round(
      Math.abs(toExecution.price - fromExecution.price),
    );
    const netMovePctBetweenExecutions =
      fromExecution.price > 0
        ? round(netMoveBetweenExecutions / fromExecution.price)
        : null;

    let maxFavorableMoveBetweenExecutions: number | null = null;
    let maxAdverseMoveBetweenExecutions: number | null = null;
    let maxFavorableMovePctBetweenExecutions: number | null = null;
    let maxAdverseMovePctBetweenExecutions: number | null = null;

    if (tradeDirection === "long") {
      if (highestPriceBetweenExecutions !== null) {
        maxFavorableMoveBetweenExecutions = round(
          Math.abs(highestPriceBetweenExecutions - fromExecution.price),
        );
        maxFavorableMovePctBetweenExecutions =
          fromExecution.price > 0
            ? round(
                maxFavorableMoveBetweenExecutions / fromExecution.price,
              )
            : null;
      }

      if (lowestPriceBetweenExecutions !== null) {
        maxAdverseMoveBetweenExecutions = round(
          Math.abs(lowestPriceBetweenExecutions - fromExecution.price),
        );
        maxAdverseMovePctBetweenExecutions =
          fromExecution.price > 0
            ? round(
                maxAdverseMoveBetweenExecutions / fromExecution.price,
              )
            : null;
      }
    } else {
      if (lowestPriceBetweenExecutions !== null) {
        maxFavorableMoveBetweenExecutions = round(
          Math.abs(lowestPriceBetweenExecutions - fromExecution.price),
        );
        maxFavorableMovePctBetweenExecutions =
          fromExecution.price > 0
            ? round(
                maxFavorableMoveBetweenExecutions / fromExecution.price,
              )
            : null;
      }

      if (highestPriceBetweenExecutions !== null) {
        maxAdverseMoveBetweenExecutions = round(
          Math.abs(highestPriceBetweenExecutions - fromExecution.price),
        );
        maxAdverseMovePctBetweenExecutions =
          fromExecution.price > 0
            ? round(
                maxAdverseMoveBetweenExecutions / fromExecution.price,
              )
            : null;
      }
    }

    signals.push({
      fromExecutionIndex: fromExecution.executionIndex,
      toExecutionIndex: toExecution.executionIndex,
      fromExecutionTimestamp: fromExecution.timestamp,
      toExecutionTimestamp: toExecution.timestamp,
      fromExecutionPrice: fromExecution.price,
      toExecutionPrice: toExecution.price,
      candlesBetweenExecutionsCount: candlesBetweenExecutions.length,
      highestPriceBetweenExecutions,
      lowestPriceBetweenExecutions,
      netMoveBetweenExecutions,
      netMovePctBetweenExecutions,
      maxFavorableMoveBetweenExecutions,
      maxAdverseMoveBetweenExecutions,
      maxFavorableMovePctBetweenExecutions,
      maxAdverseMovePctBetweenExecutions,
    });
  }

  return signals;
}
