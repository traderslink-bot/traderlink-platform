import { describe, expect, it } from "vitest";
import { filterSpikeOnlyLevels } from "../filtering/filter-spike-only-levels";
import { countLevelTouchClusters } from "../interactions/count-level-touch-clusters";
import { measureLevelReactions } from "../interactions/measure-level-reactions";
import { mergeStructuralLevels } from "../merge/merge-structural-levels";
import { buildExecutionLevelRelations } from "../relations/build-execution-level-relations";
import { scoreStructuralLevels } from "../scoring/score-structural-levels";
import { normalizeCandles } from "../../raw-trade-timeline/normalizers/normalize-candle";
import type { StructuralLevel } from "../../raw-trade-timeline/types/structural-level";

describe("structural evidence modules", () => {
  it("merges nearby levels, attaches touch/reaction evidence, filters weak single prints, and scores the survivors", () => {
    const candles = normalizeCandles([
      { symbol: "ABCD", timestamp: "2024-04-12T13:30:00.000Z", timeframe: "1m", open: 1.0, high: 1.04, low: 0.99, close: 1.03, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:31:00.000Z", timeframe: "1m", open: 1.03, high: 1.07, low: 1.02, close: 1.06, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:32:00.000Z", timeframe: "1m", open: 1.06, high: 1.1, low: 1.05, close: 1.08, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:33:00.000Z", timeframe: "1m", open: 1.08, high: 1.101, low: 1.02, close: 1.04, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:34:00.000Z", timeframe: "1m", open: 1.04, high: 1.05, low: 1.0, close: 1.01, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:35:00.000Z", timeframe: "1m", open: 1.01, high: 1.03, low: 0.98, close: 0.99, volume: 10000 },
    ]);

    const levels: StructuralLevel[] = [
      {
        levelId: "r1",
        price: 1.1,
        side: "resistance",
        score: 1,
        strengthBucket: "weak",
        timeframeSources: ["1m"],
        pivotSources: ["tight_pivot"],
        touchCount: 0,
        touchClusterCount: 0,
        reactionStrength: "none",
        confluenceCount: 1,
        isMandatoryAnchor: false,
        referenceLabel: null,
        sourcePrices: [1.1],
      },
      {
        levelId: "r2",
        price: 1.101,
        side: "resistance",
        score: 2,
        strengthBucket: "weak",
        timeframeSources: ["1m"],
        pivotSources: ["strict_pivot"],
        touchCount: 0,
        touchClusterCount: 0,
        reactionStrength: "none",
        confluenceCount: 1,
        isMandatoryAnchor: false,
        referenceLabel: null,
        sourcePrices: [1.101],
      },
      {
        levelId: "anchor",
        price: 1.14,
        side: "resistance",
        score: 3,
        strengthBucket: "weak",
        timeframeSources: ["reference"],
        pivotSources: ["reference_level"],
        touchCount: 0,
        touchClusterCount: 0,
        reactionStrength: "none",
        confluenceCount: 1,
        isMandatoryAnchor: true,
        referenceLabel: "previous_day_high",
        sourcePrices: [1.14],
      },
    ];

    const merged = mergeStructuralLevels(levels);
    expect(merged).toHaveLength(2);

    const touched = countLevelTouchClusters(merged, candles);
    expect(touched[0].touchCount).toBeGreaterThan(0);

    const reacted = measureLevelReactions(touched, candles);
    expect(reacted[0].reactionStrength).not.toBe("none");

    const filtered = filterSpikeOnlyLevels(reacted);
    expect(filtered).toHaveLength(2);

    const scored = scoreStructuralLevels(filtered);
    expect(scored[0].score).toBeGreaterThan(0);
    expect(scored[0].strengthBucket).toMatch(/weak|medium|strong/);
  });

  it("builds per-execution nearest-level relations without requiring provider-specific data", () => {
    const relations = buildExecutionLevelRelations({
      executions: [
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:33:30.000Z",
          side: "buy",
          shares: 100,
          price: 1.05,
          executionIndex: 0,
        },
      ],
      supportLevels: [
        {
          levelId: "s1",
          price: 1.0,
          side: "support",
          score: 6,
          strengthBucket: "medium",
          timeframeSources: ["1m"],
          pivotSources: ["reference_level"],
          touchCount: 2,
          touchClusterCount: 1,
          reactionStrength: "weak",
          confluenceCount: 1,
          isMandatoryAnchor: true,
          referenceLabel: "premarket_base",
          sourcePrices: [1.0],
        },
      ],
      resistanceLevels: [
        {
          levelId: "r0",
          price: 1.03,
          side: "resistance",
          score: 4,
          strengthBucket: "weak",
          timeframeSources: ["1m"],
          pivotSources: ["tight_pivot"],
          touchCount: 1,
          touchClusterCount: 1,
          reactionStrength: "weak",
          confluenceCount: 1,
          isMandatoryAnchor: false,
          referenceLabel: null,
          sourcePrices: [1.03],
        },
        {
          levelId: "r1",
          price: 1.06,
          side: "resistance",
          score: 5,
          strengthBucket: "medium",
          timeframeSources: ["1m"],
          pivotSources: ["tight_pivot"],
          touchCount: 1,
          touchClusterCount: 1,
          reactionStrength: "weak",
          confluenceCount: 1,
          isMandatoryAnchor: false,
          referenceLabel: null,
          sourcePrices: [1.06],
        },
      ],
    });

    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({
      nearestSupportBelow: expect.objectContaining({ price: 1.0 }),
      nearestResistanceBelow: expect.objectContaining({ price: 1.03 }),
      nearestResistanceAbove: expect.objectContaining({ price: 1.06 }),
      isNearResistance: false,
      clearedNearestResistanceBelow: true,
      hasRoomAboveAfterClearingResistance: true,
      occurredInOpenAir: false,
      hasNearbyStructureOnBothSides: true,
      roomToNearestResistancePct: expect.any(Number),
      roomToNearestSupportPct: expect.any(Number),
      resistanceLevelsAboveWithinClusterCount: 1,
      supportLevelsBelowWithinClusterCount: 0,
      hasStackedResistanceAbove: false,
      hasStackedSupportBelow: false,
      nearestReferenceLevelLabel: "premarket_base",
    });
  });
});
