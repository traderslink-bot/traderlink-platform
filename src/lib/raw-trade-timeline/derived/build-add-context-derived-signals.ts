// 2026-04-13 12:46 AM America/Toronto
// PURPOSE:
// Builds factual add/scaling context signals for executions that increase position.
// This file stays strictly factual and interpretation free.
// It captures how an add related to prior basis, prior execution price, and
// recent local market structure.

import type { ExecutionLocalStructureSignal } from "./build-execution-local-structure-signals";
import type { PositionChangeDerivedSignal } from "./build-position-change-derived-signals";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export interface AddContextDerivedSignal {
  executionIndex: number;
  timestamp: string;
  executionPrice: number;

  executionIncreasedPosition: boolean;
  executionOpenedFromFlat: boolean;

  previousAverageEntryPrice: number | null;
  previousExecutionPrice: number | null;

  executionPriceVsPreviousAverageEntryPct: number | null;
  executionPriceVsPreviousExecutionPct: number | null;

  addWasAbovePreviousAverageEntry: boolean | null;
  addWasBelowPreviousAverageEntry: boolean | null;
  addWasAbovePreviousExecutionPrice: boolean | null;
  addWasBelowPreviousExecutionPrice: boolean | null;

  recentRunUpPctBeforeExecution: number | null;
  recentDropPctBeforeExecution: number | null;
  recentNetMovePctBeforeExecution: number | null;
  executionPricePositionInRecentRangePct: number | null;
  distanceFromRecentHighPct: number | null;
  distanceFromRecentLowPct: number | null;
}

export interface BuildAddContextDerivedSignalsArgs {
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
  executionLocalStructureSignals: ExecutionLocalStructureSignal[];
}

export function buildAddContextDerivedSignals(
  args: BuildAddContextDerivedSignalsArgs,
): AddContextDerivedSignal[] {
  const { positionChangeDerivedSignals, executionLocalStructureSignals } = args;

  if (
    positionChangeDerivedSignals.length !== executionLocalStructureSignals.length
  ) {
    throw new Error(
      "Cannot build add-context derived signals when positionChangeDerivedSignals and executionLocalStructureSignals lengths do not match.",
    );
  }

  return positionChangeDerivedSignals.map((positionSignal, index) => {
    const localSignal = executionLocalStructureSignals[index];
    const previousPositionSignal =
      index > 0 ? positionChangeDerivedSignals[index - 1] : null;

    const previousAverageEntryPrice = positionSignal.previousAverageEntryPrice;
    const previousExecutionPrice = previousPositionSignal?.executionPrice ?? null;

    const executionPriceVsPreviousAverageEntryPct =
      previousAverageEntryPrice !== null && previousAverageEntryPrice > 0
        ? round(
            (positionSignal.executionPrice - previousAverageEntryPrice) /
              previousAverageEntryPrice,
          )
        : null;

    const executionPriceVsPreviousExecutionPct =
      previousExecutionPrice !== null && previousExecutionPrice > 0
        ? round(
            (positionSignal.executionPrice - previousExecutionPrice) /
              previousExecutionPrice,
          )
        : null;

    const executionIncreasedPosition = positionSignal.positionIncreased;
    const executionOpenedFromFlat = positionSignal.openedPositionFromFlat;

    return {
      executionIndex: positionSignal.executionIndex,
      timestamp: positionSignal.timestamp,
      executionPrice: positionSignal.executionPrice,

      executionIncreasedPosition,
      executionOpenedFromFlat,

      previousAverageEntryPrice,
      previousExecutionPrice,

      executionPriceVsPreviousAverageEntryPct,
      executionPriceVsPreviousExecutionPct,

      addWasAbovePreviousAverageEntry:
        executionIncreasedPosition && previousAverageEntryPrice !== null
          ? positionSignal.executionPrice > previousAverageEntryPrice
          : null,
      addWasBelowPreviousAverageEntry:
        executionIncreasedPosition && previousAverageEntryPrice !== null
          ? positionSignal.executionPrice < previousAverageEntryPrice
          : null,
      addWasAbovePreviousExecutionPrice:
        executionIncreasedPosition && previousExecutionPrice !== null
          ? positionSignal.executionPrice > previousExecutionPrice
          : null,
      addWasBelowPreviousExecutionPrice:
        executionIncreasedPosition && previousExecutionPrice !== null
          ? positionSignal.executionPrice < previousExecutionPrice
          : null,

      recentRunUpPctBeforeExecution: localSignal.recentRunUpPctBeforeExecution,
      recentDropPctBeforeExecution: localSignal.recentDropPctBeforeExecution,
      recentNetMovePctBeforeExecution: localSignal.recentNetMovePctBeforeExecution,
      executionPricePositionInRecentRangePct:
        localSignal.executionPricePositionInRecentRangePct,
      distanceFromRecentHighPct: localSignal.distanceFromRecentHighPct,
      distanceFromRecentLowPct: localSignal.distanceFromRecentLowPct,
    };
  });
}
