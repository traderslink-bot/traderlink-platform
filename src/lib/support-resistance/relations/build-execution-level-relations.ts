// 2026-04-14
// PURPOSE:
// Relates each execution to the current structural level map.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Execution } from "../../raw-trade-timeline/types/execution";
import type { ExecutionLevelRelation } from "../../raw-trade-timeline/types/execution-level-relation";
import type { StructuralLevel } from "../../raw-trade-timeline/types/structural-level";

function getPctDistance(price: number, reference: number | null): number | null {
  if (reference === null) {
    return null;
  }

  return Number((((Math.abs(price - reference)) / price) * 100).toFixed(6));
}

function pickNearestReferenceLabel(
  support: StructuralLevel | null,
  resistance: StructuralLevel | null,
  distanceToSupportPct: number | null,
  distanceToResistancePct: number | null,
) {
  if (support?.referenceLabel && resistance?.referenceLabel) {
    if ((distanceToSupportPct ?? Number.POSITIVE_INFINITY) <= (distanceToResistancePct ?? Number.POSITIVE_INFINITY)) {
      return support.referenceLabel;
    }

    return resistance.referenceLabel;
  }

  return support?.referenceLabel ?? resistance?.referenceLabel ?? null;
}

export interface BuildExecutionLevelRelationsArgs {
  executions: Execution[];
  supportLevels: StructuralLevel[];
  resistanceLevels: StructuralLevel[];
}

export function buildExecutionLevelRelations(
  args: BuildExecutionLevelRelationsArgs,
): ExecutionLevelRelation[] {
  const { executions, supportLevels, resistanceLevels } = args;

  return executions.map((execution) => {
    const stackedLevelClusterDistancePct =
      SUPPORT_RESISTANCE_CONFIG.stackedLevelClusterDistancePct;
    const nearestSupportBelow =
      [...supportLevels]
        .filter((level) => level.price <= execution.price)
        .sort((left, right) => right.price - left.price)[0] ?? null;
    const nearestResistanceBelow =
      [...resistanceLevels]
        .filter((level) => level.price <= execution.price)
        .sort((left, right) => right.price - left.price)[0] ?? null;
    const nearestResistanceAbove =
      [...resistanceLevels]
        .filter((level) => level.price >= execution.price)
        .sort((left, right) => left.price - right.price)[0] ?? null;

    const distanceToNearestSupportPct = getPctDistance(
      execution.price,
      nearestSupportBelow?.price ?? null,
    );
    const distanceAboveNearestResistanceBelowPct = getPctDistance(
      execution.price,
      nearestResistanceBelow?.price ?? null,
    );
    const distanceToNearestResistancePct = getPctDistance(
      execution.price,
      nearestResistanceAbove?.price ?? null,
    );

    const isNearSupport =
      distanceToNearestSupportPct !== null &&
      distanceToNearestSupportPct <= SUPPORT_RESISTANCE_CONFIG.touchTolerancePct;
    const isNearResistance =
      distanceToNearestResistancePct !== null &&
      distanceToNearestResistancePct <= SUPPORT_RESISTANCE_CONFIG.touchTolerancePct;

    const nearestDistance = Math.min(
      distanceToNearestSupportPct ?? Number.POSITIVE_INFINITY,
      distanceToNearestResistancePct ?? Number.POSITIVE_INFINITY,
    );
    const resistanceLevelsAboveWithinClusterCount = resistanceLevels.filter((level) => {
      const distancePct = getPctDistance(execution.price, level.price);

      return (
        level.price > execution.price &&
        distancePct !== null &&
        distancePct <= stackedLevelClusterDistancePct
      );
    }).length;
    const supportLevelsBelowWithinClusterCount = supportLevels.filter((level) => {
      const distancePct = getPctDistance(execution.price, level.price);

      return (
        level.price < execution.price &&
        distancePct !== null &&
        distancePct <= stackedLevelClusterDistancePct
      );
    }).length;
    const clearedNearestResistanceBelow =
      nearestResistanceBelow !== null &&
      execution.price > nearestResistanceBelow.price;
    const hasRoomAboveAfterClearingResistance =
      clearedNearestResistanceBelow &&
      (distanceToNearestResistancePct === null ||
        distanceToNearestResistancePct >
          SUPPORT_RESISTANCE_CONFIG.touchTolerancePct);
    const hasNearbyStructureOnBothSides =
      nearestSupportBelow !== null && nearestResistanceAbove !== null;
    const distanceBetweenNearestSupportAndResistancePct =
      hasNearbyStructureOnBothSides
        ? getPctDistance(
            nearestSupportBelow!.price,
            nearestResistanceAbove!.price,
          )
        : null;

    return {
      executionIndex: execution.executionIndex,
      executionTimestamp: execution.timestamp,
      executionPrice: execution.price,
      nearestSupportBelow,
      nearestResistanceBelow,
      nearestResistanceAbove,
      distanceToNearestSupportPct,
      distanceAboveNearestResistanceBelowPct,
      distanceToNearestResistancePct,
      isNearSupport,
      isNearResistance,
      clearedNearestResistanceBelow,
      hasRoomAboveAfterClearingResistance,
      occurredBelowNearestSupport:
        nearestSupportBelow !== null && execution.price < nearestSupportBelow.price,
      occurredInOpenAir:
        nearestDistance === Number.POSITIVE_INFINITY ||
        nearestDistance > SUPPORT_RESISTANCE_CONFIG.openAirThresholdPct,
      hasNearbyStructureOnBothSides,
      distanceBetweenNearestSupportAndResistancePct,
      roomToNearestResistancePct:
        clearedNearestResistanceBelow ? distanceToNearestResistancePct : null,
      roomToNearestSupportPct: distanceToNearestSupportPct,
      resistanceLevelsAboveWithinClusterCount,
      supportLevelsBelowWithinClusterCount,
      hasStackedResistanceAbove:
        resistanceLevelsAboveWithinClusterCount >=
        SUPPORT_RESISTANCE_CONFIG.stackedLevelMinimumCount,
      hasStackedSupportBelow:
        supportLevelsBelowWithinClusterCount >=
        SUPPORT_RESISTANCE_CONFIG.stackedLevelMinimumCount,
      nearestReferenceLevelLabel: pickNearestReferenceLabel(
        nearestSupportBelow,
        nearestResistanceAbove,
        distanceToNearestSupportPct,
        distanceToNearestResistancePct,
      ),
    };
  });
}
