// 2026-04-14
// PURPOSE:
// Defines the per-execution relation facts between an execution and the current
// structural support/resistance map.

import type { ReferenceLevelLabel } from "./reference-level-label";
import type { StructuralLevel } from "./structural-level";

export interface ExecutionLevelRelation {
  executionIndex: number;
  executionTimestamp: string;
  executionPrice: number;
  nearestSupportBelow: StructuralLevel | null;
  nearestResistanceBelow: StructuralLevel | null;
  nearestResistanceAbove: StructuralLevel | null;
  distanceToNearestSupportPct: number | null;
  distanceAboveNearestResistanceBelowPct: number | null;
  distanceToNearestResistancePct: number | null;
  isNearSupport: boolean;
  isNearResistance: boolean;
  clearedNearestResistanceBelow: boolean;
  hasRoomAboveAfterClearingResistance: boolean;
  occurredBelowNearestSupport: boolean;
  occurredInOpenAir: boolean;
  hasNearbyStructureOnBothSides: boolean;
  distanceBetweenNearestSupportAndResistancePct: number | null;
  roomToNearestResistancePct: number | null;
  roomToNearestSupportPct: number | null;
  resistanceLevelsAboveWithinClusterCount: number;
  supportLevelsBelowWithinClusterCount: number;
  hasStackedResistanceAbove: boolean;
  hasStackedSupportBelow: boolean;
  nearestReferenceLevelLabel: ReferenceLevelLabel | null;
}
