// 2026-04-12 01:18 PM America/Toronto
// PURPOSE:
// Builds timeline relationship derived signals from the raw trade timeline.
// This file computes factual timing and spacing relationships only.
// No pattern labeling, no scoring, no interpretation.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";

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

export interface ExecutionGapRelationshipSignal {
  fromExecutionIndex: number;
  toExecutionIndex: number;

  fromExecutionTimestamp: string;
  toExecutionTimestamp: string;

  timeBetweenExecutionsMs: number;
  timeBetweenExecutionsSeconds: number;
  timeBetweenExecutionsMinutes: number;

  candlesBetweenExecutions: number;

  hadNoCandlesBetweenExecutions: boolean;
  hadOneCandleBetweenExecutions: boolean;
  hadMultipleCandlesBetweenExecutions: boolean;
}

export interface TimelineRelationshipSignals {
  executionGapSignals: ExecutionGapRelationshipSignal[];

  executionCount: number;
  executionGapCount: number;

  firstExecutionTimestamp: string | null;
  lastExecutionTimestamp: string | null;

  totalTradeDurationMs: number | null;
  totalTradeDurationSeconds: number | null;
  totalTradeDurationMinutes: number | null;

  averageTimeBetweenExecutionsMs: number | null;
  averageTimeBetweenExecutionsSeconds: number | null;
  averageTimeBetweenExecutionsMinutes: number | null;

  minimumTimeBetweenExecutionsMs: number | null;
  maximumTimeBetweenExecutionsMs: number | null;

  averageCandlesBetweenExecutions: number | null;
  minimumCandlesBetweenExecutions: number | null;
  maximumCandlesBetweenExecutions: number | null;

  executionsPerMinute: number | null;
}

export interface BuildTimelineRelationshipSignalsArgs {
  executions: Execution[];
  tradeCandles: Candle[];
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

export function buildTimelineRelationshipSignals(
  args: BuildTimelineRelationshipSignalsArgs,
): TimelineRelationshipSignals {
  const { executions, tradeCandles } = args;

  if (executions.length === 0) {
    return {
      executionGapSignals: [],
      executionCount: 0,
      executionGapCount: 0,
      firstExecutionTimestamp: null,
      lastExecutionTimestamp: null,
      totalTradeDurationMs: null,
      totalTradeDurationSeconds: null,
      totalTradeDurationMinutes: null,
      averageTimeBetweenExecutionsMs: null,
      averageTimeBetweenExecutionsSeconds: null,
      averageTimeBetweenExecutionsMinutes: null,
      minimumTimeBetweenExecutionsMs: null,
      maximumTimeBetweenExecutionsMs: null,
      averageCandlesBetweenExecutions: null,
      minimumCandlesBetweenExecutions: null,
      maximumCandlesBetweenExecutions: null,
      executionsPerMinute: null,
    };
  }

  const executionGapSignals: ExecutionGapRelationshipSignal[] = [];

  for (let index = 0; index < executions.length - 1; index += 1) {
    const currentExecution = executions[index];
    const nextExecution = executions[index + 1];

    const currentMs = parseTimestampToMs(currentExecution.timestamp);
    const nextMs = parseTimestampToMs(nextExecution.timestamp);

    const gapMs = nextMs - currentMs;

    if (gapMs < 0) {
      throw new Error(
        `Execution sequence is invalid: execution ${currentExecution.executionIndex} occurs after execution ${nextExecution.executionIndex}.`,
      );
    }

    const candlesBetweenExecutions = countCandlesStrictlyBetweenTimestamps(
      tradeCandles,
      currentExecution.timestamp,
      nextExecution.timestamp,
    );

    executionGapSignals.push({
      fromExecutionIndex: currentExecution.executionIndex,
      toExecutionIndex: nextExecution.executionIndex,
      fromExecutionTimestamp: currentExecution.timestamp,
      toExecutionTimestamp: nextExecution.timestamp,
      timeBetweenExecutionsMs: gapMs,
      timeBetweenExecutionsSeconds: round(gapMs / 1000),
      timeBetweenExecutionsMinutes: round(gapMs / 60000),
      candlesBetweenExecutions,
      hadNoCandlesBetweenExecutions: candlesBetweenExecutions === 0,
      hadOneCandleBetweenExecutions: candlesBetweenExecutions === 1,
      hadMultipleCandlesBetweenExecutions: candlesBetweenExecutions > 1,
    });
  }

  const firstExecutionTimestamp = executions[0].timestamp;
  const lastExecutionTimestamp = executions[executions.length - 1].timestamp;

  const firstExecutionMs = parseTimestampToMs(firstExecutionTimestamp);
  const lastExecutionMs = parseTimestampToMs(lastExecutionTimestamp);

  const totalTradeDurationMs = lastExecutionMs - firstExecutionMs;
  const totalTradeDurationSeconds = round(totalTradeDurationMs / 1000);
  const totalTradeDurationMinutes = round(totalTradeDurationMs / 60000);

  const gapDurationsMs = executionGapSignals.map(
    (signal) => signal.timeBetweenExecutionsMs,
  );
  const gapCandleCounts = executionGapSignals.map(
    (signal) => signal.candlesBetweenExecutions,
  );

  const averageTimeBetweenExecutionsMs =
    gapDurationsMs.length > 0
      ? round(
          gapDurationsMs.reduce((sum, value) => sum + value, 0) /
            gapDurationsMs.length,
        )
      : null;

  const averageTimeBetweenExecutionsSeconds =
    averageTimeBetweenExecutionsMs !== null
      ? round(averageTimeBetweenExecutionsMs / 1000)
      : null;

  const averageTimeBetweenExecutionsMinutes =
    averageTimeBetweenExecutionsMs !== null
      ? round(averageTimeBetweenExecutionsMs / 60000)
      : null;

  const minimumTimeBetweenExecutionsMs =
    gapDurationsMs.length > 0 ? Math.min(...gapDurationsMs) : null;

  const maximumTimeBetweenExecutionsMs =
    gapDurationsMs.length > 0 ? Math.max(...gapDurationsMs) : null;

  const averageCandlesBetweenExecutions =
    gapCandleCounts.length > 0
      ? round(
          gapCandleCounts.reduce((sum, value) => sum + value, 0) /
            gapCandleCounts.length,
        )
      : null;

  const minimumCandlesBetweenExecutions =
    gapCandleCounts.length > 0 ? Math.min(...gapCandleCounts) : null;

  const maximumCandlesBetweenExecutions =
    gapCandleCounts.length > 0 ? Math.max(...gapCandleCounts) : null;

  const executionsPerMinute =
    totalTradeDurationMinutes > 0
      ? round(executions.length / totalTradeDurationMinutes)
      : null;

  return {
    executionGapSignals,
    executionCount: executions.length,
    executionGapCount: executionGapSignals.length,
    firstExecutionTimestamp,
    lastExecutionTimestamp,
    totalTradeDurationMs,
    totalTradeDurationSeconds,
    totalTradeDurationMinutes,
    averageTimeBetweenExecutionsMs,
    averageTimeBetweenExecutionsSeconds,
    averageTimeBetweenExecutionsMinutes,
    minimumTimeBetweenExecutionsMs,
    maximumTimeBetweenExecutionsMs,
    averageCandlesBetweenExecutions,
    minimumCandlesBetweenExecutions,
    maximumCandlesBetweenExecutions,
    executionsPerMinute,
  };
}