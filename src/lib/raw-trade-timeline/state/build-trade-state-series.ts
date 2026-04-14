// 2026-04-12 09:03 AM America/Toronto
// PURPOSE:
// Builds the deterministic trade state series from normalized executions.
// This file stays strictly factual and interpretation free.
// It does not assign behavioral meaning. It only calculates position state
// and realized PnL progression from execution history.

import type { Execution } from "../types/execution";
import type { TradeStateSeries } from "../types/trade-state-series";
import type { TradeStateSnapshot } from "../types/trade-state-snapshot";
import type { TradeDirection } from "../types/trade-timeline-input";

export interface BuildTradeStateSeriesArgs {
  executions: Execution[];
  tradeDirection: TradeDirection;
}

interface LongTradeComputationState {
  positionSize: number;
  averageEntryPrice: number | null;
  realizedPnl: number;
}

interface ShortTradeComputationState {
  positionSize: number;
  averageEntryPrice: number | null;
  realizedPnl: number;
}

function roundToSixDecimals(value: number): number {
  return Number(value.toFixed(6));
}

function buildLongTradeStateSeries(executions: Execution[]): TradeStateSeries {
  const state: LongTradeComputationState = {
    positionSize: 0,
    averageEntryPrice: null,
    realizedPnl: 0,
  };

  const snapshots: TradeStateSnapshot[] = [];

  executions.forEach((execution) => {
    if (execution.side === "buy") {
      const currentCostBasis =
        state.averageEntryPrice !== null ? state.averageEntryPrice * state.positionSize : 0;
      const incomingCostBasis = execution.price * execution.shares;
      const newPositionSize = state.positionSize + execution.shares;

      state.positionSize = newPositionSize;
      state.averageEntryPrice =
        newPositionSize > 0
          ? roundToSixDecimals((currentCostBasis + incomingCostBasis) / newPositionSize)
          : null;
    } else {
      if (state.positionSize <= 0 || state.averageEntryPrice === null) {
        throw new Error(
          `Invalid long trade execution flow at executionIndex ${execution.executionIndex}: sell encountered while flat.`,
        );
      }

      if (execution.shares > state.positionSize) {
        throw new Error(
          `Invalid long trade execution flow at executionIndex ${execution.executionIndex}: sell size exceeds current position.`,
        );
      }

      const realizedDelta = (execution.price - state.averageEntryPrice) * execution.shares;

      state.realizedPnl = roundToSixDecimals(state.realizedPnl + realizedDelta);
      state.positionSize = roundToSixDecimals(state.positionSize - execution.shares);

      if (state.positionSize === 0) {
        state.averageEntryPrice = null;
      }
    }

    snapshots.push({
      executionIndex: execution.executionIndex,
      timestamp: execution.timestamp,
      positionSize: state.positionSize,
      averageEntryPrice: state.averageEntryPrice,
      realizedPnl: state.realizedPnl,
      isFlat: state.positionSize === 0,
    });
  });

  return {
    snapshots,
  };
}

function buildShortTradeStateSeries(executions: Execution[]): TradeStateSeries {
  const state: ShortTradeComputationState = {
    positionSize: 0,
    averageEntryPrice: null,
    realizedPnl: 0,
  };

  const snapshots: TradeStateSnapshot[] = [];

  executions.forEach((execution) => {
    if (execution.side === "sell") {
      const currentEntryValue =
        state.averageEntryPrice !== null ? state.averageEntryPrice * state.positionSize : 0;
      const incomingEntryValue = execution.price * execution.shares;
      const newPositionSize = state.positionSize + execution.shares;

      state.positionSize = newPositionSize;
      state.averageEntryPrice =
        newPositionSize > 0
          ? roundToSixDecimals((currentEntryValue + incomingEntryValue) / newPositionSize)
          : null;
    } else {
      if (state.positionSize <= 0 || state.averageEntryPrice === null) {
        throw new Error(
          `Invalid short trade execution flow at executionIndex ${execution.executionIndex}: buy encountered while flat.`,
        );
      }

      if (execution.shares > state.positionSize) {
        throw new Error(
          `Invalid short trade execution flow at executionIndex ${execution.executionIndex}: buy size exceeds current short position.`,
        );
      }

      const realizedDelta = (state.averageEntryPrice - execution.price) * execution.shares;

      state.realizedPnl = roundToSixDecimals(state.realizedPnl + realizedDelta);
      state.positionSize = roundToSixDecimals(state.positionSize - execution.shares);

      if (state.positionSize === 0) {
        state.averageEntryPrice = null;
      }
    }

    snapshots.push({
      executionIndex: execution.executionIndex,
      timestamp: execution.timestamp,
      positionSize: state.positionSize,
      averageEntryPrice: state.averageEntryPrice,
      realizedPnl: state.realizedPnl,
      isFlat: state.positionSize === 0,
    });
  });

  return {
    snapshots,
  };
}

export function buildTradeStateSeries(
  args: BuildTradeStateSeriesArgs,
): TradeStateSeries {
  if (args.tradeDirection === "long") {
    return buildLongTradeStateSeries(args.executions);
  }

  return buildShortTradeStateSeries(args.executions);
}