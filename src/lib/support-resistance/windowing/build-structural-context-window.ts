// 2026-04-14
// PURPOSE:
// Builds the factual trade-relevant structural context window for the current
// support/resistance lane.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Candle } from "../../raw-trade-timeline/types/candle";
import type { Execution } from "../../raw-trade-timeline/types/execution";
import type { StructuralContextWindow } from "../../raw-trade-timeline/types/structural-context-window";

export interface BuildStructuralContextWindowArgs {
  timeframe: string;
  executions: Execution[];
  preTradeCandles: Candle[];
  postTradeCandles: Candle[];
}

function getFirstTimestamp(candles: Candle[]): string | null {
  return candles.length > 0 ? candles[0].timestamp : null;
}

function getLastTimestamp(candles: Candle[]): string | null {
  return candles.length > 0 ? candles[candles.length - 1].timestamp : null;
}

export function buildStructuralContextWindow(
  args: BuildStructuralContextWindowArgs,
): StructuralContextWindow {
  const { timeframe, executions, preTradeCandles, postTradeCandles } = args;

  if (executions.length === 0) {
    throw new Error("Cannot build structural context window without executions.");
  }

  const firstExecutionTimestamp = executions[0].timestamp;
  const lastExecutionTimestamp = executions[executions.length - 1].timestamp;

  return {
    firstExecutionTimestamp,
    lastExecutionTimestamp,
    preEntryContextStartTimestamp:
      getFirstTimestamp(preTradeCandles) ?? firstExecutionTimestamp,
    postExitContextEndTimestamp:
      getLastTimestamp(postTradeCandles) ?? lastExecutionTimestamp,
    includedTimeframes: timeframe
      ? [timeframe, ...SUPPORT_RESISTANCE_CONFIG.defaultIncludedTimeframes]
      : [...SUPPORT_RESISTANCE_CONFIG.defaultIncludedTimeframes],
  };
}
