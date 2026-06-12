// 2026-04-14
// PURPOSE:
// Merges nearby same-side structural levels into a single factual cluster.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type {
  StructuralLevel,
  StructuralLevelImportance,
  StructuralLevelPivotSource,
} from "../../raw-trade-timeline/types/structural-level";

function areCloseEnough(leftPrice: number, rightPrice: number): boolean {
  const midpoint = (leftPrice + rightPrice) / 2;
  const pctDistance = Math.abs(rightPrice - leftPrice) / midpoint * 100;

  return pctDistance <= SUPPORT_RESISTANCE_CONFIG.mergeDistancePct;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function highestImportance(
  levels: StructuralLevel[],
): StructuralLevelImportance {
  const rank: Record<StructuralLevelImportance, number> = {
    synthetic_extension: 0,
    weak: 1,
    secondary: 2,
    actionable: 3,
    major: 4,
  };

  return levels.reduce((best, level) => {
    return rank[level.importance] > rank[best] ? level.importance : best;
  }, levels[0].importance);
}

function mergeCluster(cluster: StructuralLevel[]): StructuralLevel {
  const anchor = cluster.find((level) => level.isMandatoryAnchor) ?? cluster[0];
  const prices = cluster.map((level) => level.price);
  const weightedPrice =
    cluster.reduce((sum, level) => {
      const weight = Math.max(level.score, 1) + (level.isMandatoryAnchor ? 2 : 0);
      return sum + level.price * weight;
    }, 0) /
    cluster.reduce((sum, level) => {
      return sum + Math.max(level.score, 1) + (level.isMandatoryAnchor ? 2 : 0);
    }, 0);
  const confluenceCount = Math.max(
    cluster.length,
    unique(cluster.flatMap((level) => level.pivotSources)).length +
      unique(cluster.flatMap((level) => level.timeframeSources)).length,
  );

  return {
    levelId: `merged_${anchor.side}_${cluster[0].price.toFixed(6)}_${cluster[cluster.length - 1].price.toFixed(6)}`,
    price: Number(weightedPrice.toFixed(6)),
    side: anchor.side,
    score: Math.max(...cluster.map((level) => level.score)),
    strengthBucket: anchor.strengthBucket,
    sourceStrengthLabel: anchor.sourceStrengthLabel ?? null,
    importance: highestImportance(cluster),
    timeframeBias: anchor.timeframeBias ?? null,
    zoneLow: Math.min(
      ...cluster.map((level) => level.zoneLow ?? level.price),
    ),
    zoneHigh: Math.max(
      ...cluster.map((level) => level.zoneHigh ?? level.price),
    ),
    zoneWidthPct: anchor.zoneWidthPct ?? null,
    isExtension: cluster.some((level) => level.isExtension),
    extensionSource:
      cluster.find((level) => level.extensionSource)?.extensionSource ?? null,
    isSyntheticExtension: cluster.some((level) => level.isSyntheticExtension),
    freshness: anchor.freshness ?? null,
    timeframeSources: unique(cluster.flatMap((level) => level.timeframeSources)),
    pivotSources: unique(
      cluster.flatMap((level) => level.pivotSources),
    ) as StructuralLevelPivotSource[],
    touchCount: Math.max(...cluster.map((level) => level.touchCount)),
    touchClusterCount: Math.max(...cluster.map((level) => level.touchClusterCount)),
    reactionStrength: cluster.find((level) => level.reactionStrength !== "none")?.reactionStrength ?? "none",
    confluenceCount,
    isMandatoryAnchor: cluster.some((level) => level.isMandatoryAnchor),
    referenceLabel: cluster.find((level) => level.referenceLabel !== null)?.referenceLabel ?? null,
    sourcePrices: unique(cluster.flatMap((level) => level.sourcePrices)).sort((left, right) => left - right),
  };
}

export function mergeStructuralLevels(levels: StructuralLevel[]): StructuralLevel[] {
  if (levels.length <= 1) {
    return levels;
  }

  const sortedLevels = [...levels].sort((left, right) => left.price - right.price);
  const merged: StructuralLevel[] = [];
  let cluster: StructuralLevel[] = [sortedLevels[0]];

  for (let index = 1; index < sortedLevels.length; index += 1) {
    const current = sortedLevels[index];
    const previous = cluster[cluster.length - 1];

    if (current.side === previous.side && areCloseEnough(previous.price, current.price)) {
      cluster.push(current);
      continue;
    }

    merged.push(mergeCluster(cluster));
    cluster = [current];
  }

  merged.push(mergeCluster(cluster));
  return merged;
}
