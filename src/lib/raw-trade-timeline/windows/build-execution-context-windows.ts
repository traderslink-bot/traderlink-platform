// 2026-04-12 09:03 AM America/Toronto
// PURPOSE:
// Builds raw execution context windows from normalized executions and candles.
// Each window preserves factual candle context immediately before and after an execution.
// This file stays strictly factual and interpretation free.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type { ExecutionContextWindow } from "../types/execution-context-window";

export interface BuildExecutionContextWindowsArgs {
  executions: Execution[];
  allCandles: Candle[];
  candlesBeforeCount?: number;
  candlesAfterCount?: number;
}

function findLastCandleIndexAtOrBeforeTimestamp(
  candles: Candle[],
  timestamp: string,
): number {
  const executionTime = Date.parse(timestamp);
  let matchIndex = -1;

  for (let index = 0; index < candles.length; index += 1) {
    const candleTime = Date.parse(candles[index].timestamp);

    if (candleTime <= executionTime) {
      matchIndex = index;
      continue;
    }

    break;
  }

  return matchIndex;
}

export function buildExecutionContextWindows(
  args: BuildExecutionContextWindowsArgs,
): ExecutionContextWindow[] {
  const candlesBeforeCount = args.candlesBeforeCount ?? 5;
  const candlesAfterCount = args.candlesAfterCount ?? 5;

  if (candlesBeforeCount < 0 || candlesAfterCount < 0) {
    throw new Error("Execution context window sizes cannot be negative.");
  }

  return args.executions.map((execution) => {
    const anchorIndex = findLastCandleIndexAtOrBeforeTimestamp(
      args.allCandles,
      execution.timestamp,
    );

    const beforeStartIndex = Math.max(0, anchorIndex - candlesBeforeCount + 1);
    const candlesBeforeExecution =
      anchorIndex >= 0
        ? args.allCandles.slice(beforeStartIndex, anchorIndex + 1)
        : [];

    const afterStartIndex = anchorIndex >= 0 ? anchorIndex + 1 : 0;
    const candlesAfterExecution = args.allCandles.slice(
      afterStartIndex,
      afterStartIndex + candlesAfterCount,
    );

    return {
      execution,
      candlesBeforeExecution,
      candlesAfterExecution,
    };
  });
}