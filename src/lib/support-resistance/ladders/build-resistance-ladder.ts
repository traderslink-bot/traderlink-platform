// 2026-04-14
// PURPOSE:
// Builds the first honest resistance ladder from named references and raw
// pivot candidates. This remains intentionally simple until merge/touch/
// reaction and scoring are implemented.

import type { ReferenceLevelLabel } from "../../raw-trade-timeline/types/reference-level-label";
import type { ReferenceLevels } from "../../raw-trade-timeline/types/reference-levels";
import type { StructuralLevel } from "../../raw-trade-timeline/types/structural-level";
import type { DetectedPivot } from "../pivots/detect-tight-pivots";

function createPivotLevel(pivot: DetectedPivot, timeframe: string): StructuralLevel {
  return {
    levelId: `${pivot.side}_${pivot.pivotSource}_${pivot.timestamp}_${pivot.price.toFixed(6)}`,
    price: pivot.price,
    side: pivot.side,
    score: pivot.pivotSource === "strict_pivot" ? 2 : 1,
    strengthBucket: "weak",
    importance: "weak",
    timeframeSources: [timeframe],
    pivotSources: [pivot.pivotSource],
    touchCount: 0,
    touchClusterCount: 0,
    reactionStrength: "none",
    confluenceCount: 1,
    isMandatoryAnchor: false,
    referenceLabel: null,
    sourcePrices: [pivot.price],
  };
}

function createReferenceLevel(
  price: number,
  label: ReferenceLevelLabel,
  side: "support" | "resistance",
): StructuralLevel {
  return {
    levelId: `${side}_reference_${label}_${price.toFixed(6)}`,
    price,
    side,
    score: 3,
    strengthBucket: "weak",
    importance: "secondary",
    timeframeSources: ["reference"],
    pivotSources: ["reference_level"],
    touchCount: 0,
    touchClusterCount: 0,
    reactionStrength: "none",
    confluenceCount: 1,
    isMandatoryAnchor: true,
    referenceLabel: label,
    sourcePrices: [price],
  };
}

function dedupeLevels(levels: StructuralLevel[]): StructuralLevel[] {
  const byKey = new Map<string, StructuralLevel>();

  levels.forEach((level) => {
    const key = `${level.side}_${level.price.toFixed(6)}`;

    if (!byKey.has(key)) {
      byKey.set(key, level);
    }
  });

  return [...byKey.values()].sort((left, right) => left.price - right.price);
}

export interface BuildResistanceLadderArgs {
  timeframe: string;
  pivots: DetectedPivot[];
  referenceLevels: ReferenceLevels;
}

export function buildResistanceLadder(
  args: BuildResistanceLadderArgs,
): StructuralLevel[] {
  const { timeframe, pivots, referenceLevels } = args;
  const levels: StructuralLevel[] = pivots
    .filter((pivot) => pivot.side === "resistance")
    .map((pivot) => createPivotLevel(pivot, timeframe));

  if (referenceLevels.previousDayHigh !== null) {
    levels.push(
      createReferenceLevel(
        referenceLevels.previousDayHigh,
        "previous_day_high",
        "resistance",
      ),
    );
  }

  if (referenceLevels.previousDayClose !== null) {
    levels.push(
      createReferenceLevel(
        referenceLevels.previousDayClose,
        "previous_day_close",
        "resistance",
      ),
    );
  }

  if (referenceLevels.premarketHigh !== null) {
    levels.push(
      createReferenceLevel(
        referenceLevels.premarketHigh,
        "premarket_high",
        "resistance",
      ),
    );
  }

  return dedupeLevels(levels);
}
