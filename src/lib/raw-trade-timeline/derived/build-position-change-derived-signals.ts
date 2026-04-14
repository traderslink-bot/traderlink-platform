// 2026-04-12 01:05 PM America/Toronto
// PURPOSE:
// Builds position-change derived signals from the raw trade timeline.
// This file computes factual size and state transitions only.
// No pattern labeling, no scoring, no interpretation.

import type { Execution } from "../types/execution";
import type { TradeStateSnapshot } from "../types/trade-state-snapshot";
import type { TradeDirection } from "../types/trade-timeline-input";

export interface PositionChangeDerivedSignal {
  executionIndex: number;
  timestamp: string;
  side: "buy" | "sell";
  shares: number;
  executionPrice: number;

  previousPositionSize: number;
  currentPositionSize: number;
  positionSizeDelta: number;

  previousAverageEntryPrice: number | null;
  currentAverageEntryPrice: number | null;

  previousRealizedPnl: number;
  currentRealizedPnl: number;
  realizedPnlDelta: number;

  wasFlatBeforeExecution: boolean;
  isFlatAfterExecution: boolean;

  positionIncreased: boolean;
  positionDecreased: boolean;
  positionUnchanged: boolean;

  openedPositionFromFlat: boolean;
  closedPositionToFlat: boolean;

  isBuyExecution: boolean;
  isSellExecution: boolean;

  sizeChangePctOfPreviousPosition: number | null;
  sizeChangePctOfCurrentPosition: number | null;

  executionDirectionMatchesTradeDirection: boolean;
}

export interface BuildPositionChangeDerivedSignalsArgs {
  executions: Execution[];
  tradeStateSnapshots: TradeStateSnapshot[];
  tradeDirection: TradeDirection;
}

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export function buildPositionChangeDerivedSignals(
  args: BuildPositionChangeDerivedSignalsArgs,
): PositionChangeDerivedSignal[] {
  const { executions, tradeStateSnapshots, tradeDirection } = args;

  if (executions.length !== tradeStateSnapshots.length) {
    throw new Error(
      "Cannot build position-change derived signals when executions and tradeStateSnapshots lengths do not match.",
    );
  }

  return executions.map((execution, index) => {
    const currentSnapshot = tradeStateSnapshots[index];
    const previousSnapshot = index > 0 ? tradeStateSnapshots[index - 1] : null;

    const previousPositionSize = previousSnapshot?.positionSize ?? 0;
    const currentPositionSize = currentSnapshot.positionSize;
    const positionSizeDelta = round(currentPositionSize - previousPositionSize);

    const previousAverageEntryPrice = previousSnapshot?.averageEntryPrice ?? null;
    const currentAverageEntryPrice = currentSnapshot.averageEntryPrice;

    const previousRealizedPnl = previousSnapshot?.realizedPnl ?? 0;
    const currentRealizedPnl = currentSnapshot.realizedPnl;
    const realizedPnlDelta = round(currentRealizedPnl - previousRealizedPnl);

    const wasFlatBeforeExecution = previousPositionSize === 0;
    const isFlatAfterExecution = currentSnapshot.isFlat;

    const positionIncreased = positionSizeDelta > 0;
    const positionDecreased = positionSizeDelta < 0;
    const positionUnchanged = positionSizeDelta === 0;

    const openedPositionFromFlat = wasFlatBeforeExecution && currentPositionSize > 0;
    const closedPositionToFlat = previousPositionSize > 0 && isFlatAfterExecution;

    const isBuyExecution = execution.side === "buy";
    const isSellExecution = execution.side === "sell";

    let sizeChangePctOfPreviousPosition: number | null = null;
    let sizeChangePctOfCurrentPosition: number | null = null;

    if (previousPositionSize > 0) {
      sizeChangePctOfPreviousPosition = round(
        Math.abs(positionSizeDelta) / previousPositionSize,
      );
    }

    if (currentPositionSize > 0) {
      sizeChangePctOfCurrentPosition = round(
        Math.abs(positionSizeDelta) / currentPositionSize,
      );
    }

    const executionDirectionMatchesTradeDirection =
      (tradeDirection === "long" && isBuyExecution) ||
      (tradeDirection === "short" && isSellExecution);

    return {
      executionIndex: execution.executionIndex,
      timestamp: execution.timestamp,
      side: execution.side,
      shares: execution.shares,
      executionPrice: execution.price,

      previousPositionSize,
      currentPositionSize,
      positionSizeDelta,

      previousAverageEntryPrice,
      currentAverageEntryPrice,

      previousRealizedPnl,
      currentRealizedPnl,
      realizedPnlDelta,

      wasFlatBeforeExecution,
      isFlatAfterExecution,

      positionIncreased,
      positionDecreased,
      positionUnchanged,

      openedPositionFromFlat,
      closedPositionToFlat,

      isBuyExecution,
      isSellExecution,

      sizeChangePctOfPreviousPosition,
      sizeChangePctOfCurrentPosition,

      executionDirectionMatchesTradeDirection,
    };
  });
}