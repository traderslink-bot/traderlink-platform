// 2026-04-12 01:05 PM America/Toronto
// PURPOSE:
// Builds derived execution-level signals from raw trade timeline data.
// This layer computes factual price behavior relative to each execution.
// No pattern labeling, no scoring, no interpretation.

import type { Execution } from "../types/execution";
import type { Candle } from "../types/candle";
import type { ExecutionContextWindow } from "../types/execution-context-window";
import type { TradeDirection } from "../types/trade-timeline-input";

// 2026-04-12 01:20 PM America/Toronto
function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export interface ExecutionDerivedSignal {
  executionIndex: number;
  timestamp: string;

  executionPrice: number;

  maxFavorablePrice: number | null;
  maxAdversePrice: number | null;

  mfe: number | null; // absolute move
  mae: number | null; // absolute move

  mfePct: number | null; // percentage move
  maePct: number | null; // percentage move

  candlesAfterCount: number;
}

export interface BuildExecutionDerivedSignalsArgs {
  executions: Execution[];
  executionContextWindows: ExecutionContextWindow[];
  tradeDirection: TradeDirection;
}

function getMaxHigh(candles: Candle[]): number | null {
  if (candles.length === 0) return null;
  return Math.max(...candles.map((c) => c.high));
}

function getMinLow(candles: Candle[]): number | null {
  if (candles.length === 0) return null;
  return Math.min(...candles.map((c) => c.low));
}

export function buildExecutionDerivedSignals(
  args: BuildExecutionDerivedSignalsArgs,
): ExecutionDerivedSignal[] {
  const { executions, executionContextWindows, tradeDirection } = args;

  return executions.map((execution, index) => {
    const window = executionContextWindows[index];
    const candlesAfter = window.candlesAfterExecution;

    const executionPrice = execution.price;

    const maxHigh = getMaxHigh(candlesAfter);
    const minLow = getMinLow(candlesAfter);

    let maxFavorablePrice: number | null = null;
    let maxAdversePrice: number | null = null;

    if (tradeDirection === "long") {
      maxFavorablePrice = maxHigh;
      maxAdversePrice = minLow;
    } else {
      // short
      maxFavorablePrice = minLow;
      maxAdversePrice = maxHigh;
    }

    let mfe: number | null = null;
    let mae: number | null = null;

    let mfePct: number | null = null;
    let maePct: number | null = null;

    if (maxFavorablePrice !== null) {
  mfe = round(Math.abs(maxFavorablePrice - executionPrice));
  mfePct = round(mfe / executionPrice);
}

if (maxAdversePrice !== null) {
  mae = round(Math.abs(maxAdversePrice - executionPrice));
  maePct = round(mae / executionPrice);
}

    return {
      executionIndex: execution.executionIndex,
      timestamp: execution.timestamp,
      executionPrice,

      maxFavorablePrice,
      maxAdversePrice,

      mfe,
      mae,

      mfePct,
      maePct,

      candlesAfterCount: candlesAfter.length,
    };
  });
}