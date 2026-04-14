// 2026-04-13 12:56 AM America/Toronto
// PURPOSE:
// Builds factual reduction context signals for executions that decrease position.
// This file stays strictly factual and interpretation free.
// It captures how a reduction related to prior basis, prior execution price,
// and recent local market structure.

import type { ExecutionLocalStructureSignal } from "./build-execution-local-structure-signals";
import type { PositionChangeDerivedSignal } from "./build-position-change-derived-signals";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export interface ReductionContextDerivedSignal {
  executionIndex: number;
  timestamp: string;
  executionPrice: number;

  executionDecreasedPosition: boolean;
  executionClosedToFlat: boolean;

  previousAverageEntryPrice: number | null;
  previousExecutionPrice: number | null;

  executionPriceVsPreviousAverageEntryPct: number | null;
  executionPriceVsPreviousExecutionPct: number | null;

  reductionWasAbovePreviousAverageEntry: boolean | null;
  reductionWasBelowPreviousAverageEntry: boolean | null;
  reductionWasAbovePreviousExecutionPrice: boolean | null;
  reductionWasBelowPreviousExecutionPrice: boolean | null;

  recentRunUpPctBeforeExecution: number | null;
  recentDropPctBeforeExecution: number | null;
  recentNetMovePctBeforeExecution: number | null;
  executionPricePositionInRecentRangePct: number | null;
  distanceFromRecentHighPct: number | null;
  distanceFromRecentLowPct: number | null;
}

export interface BuildReductionContextDerivedSignalsArgs {
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
  executionLocalStructureSignals: ExecutionLocalStructureSignal[];
}

export function buildReductionContextDerivedSignals(
  args: BuildReductionContextDerivedSignalsArgs,
): ReductionContextDerivedSignal[] {
  const { positionChangeDerivedSignals, executionLocalStructureSignals } = args;

  if (
    positionChangeDerivedSignals.length !== executionLocalStructureSignals.length
  ) {
    throw new Error(
      "Cannot build reduction-context derived signals when positionChangeDerivedSignals and executionLocalStructureSignals lengths do not match.",
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

    const executionDecreasedPosition = positionSignal.positionDecreased;
    const executionClosedToFlat = positionSignal.closedPositionToFlat;

    return {
      executionIndex: positionSignal.executionIndex,
      timestamp: positionSignal.timestamp,
      executionPrice: positionSignal.executionPrice,

      executionDecreasedPosition,
      executionClosedToFlat,

      previousAverageEntryPrice,
      previousExecutionPrice,

      executionPriceVsPreviousAverageEntryPct,
      executionPriceVsPreviousExecutionPct,

      reductionWasAbovePreviousAverageEntry:
        executionDecreasedPosition && previousAverageEntryPrice !== null
          ? positionSignal.executionPrice > previousAverageEntryPrice
          : null,
      reductionWasBelowPreviousAverageEntry:
        executionDecreasedPosition && previousAverageEntryPrice !== null
          ? positionSignal.executionPrice < previousAverageEntryPrice
          : null,
      reductionWasAbovePreviousExecutionPrice:
        executionDecreasedPosition && previousExecutionPrice !== null
          ? positionSignal.executionPrice > previousExecutionPrice
          : null,
      reductionWasBelowPreviousExecutionPrice:
        executionDecreasedPosition && previousExecutionPrice !== null
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
