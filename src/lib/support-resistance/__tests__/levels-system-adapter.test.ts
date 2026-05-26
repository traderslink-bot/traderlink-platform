import { describe, expect, it } from "vitest";
import { buildSupportResistanceContextForSymbol } from "levels-system-phase1/support-resistance-engine";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import {
  createRawTradeTimeline,
  createRawTradeTimelineWithLevelsSystem,
} from "../../raw-trade-timeline/builders/create-raw-trade-timeline";
import {
  buildLevelsSystemSupportResistanceContext,
  mapFinalLevelZoneToStructuralLevel,
} from "../levels-system-adapter";
import type { FinalLevelZone } from "levels-system-phase1/support-resistance-engine";

function buildFinalLevelZone(
  overrides: Partial<FinalLevelZone> = {},
): FinalLevelZone {
  return {
    id: "ABCD-support-zone-1",
    symbol: "ABCD",
    kind: "support",
    timeframeBias: "daily",
    zoneLow: 4.9,
    zoneHigh: 5.1,
    representativePrice: 5,
    strengthScore: 8,
    strengthLabel: "strong",
    touchCount: 4,
    confluenceCount: 3,
    sourceTypes: ["premarket_low", "swing_low"],
    timeframeSources: ["daily", "4h"],
    reactionQualityScore: 6,
    rejectionScore: 2,
    displacementScore: 1,
    sessionSignificanceScore: 5,
    followThroughScore: 3,
    sourceEvidenceCount: 2,
    firstTimestamp: 1_714_923_600_000,
    lastTimestamp: 1_714_927_200_000,
    sessionDate: "2024-04-12",
    isExtension: false,
    freshness: "fresh",
    notes: [],
    ...overrides,
  };
}

describe("levels-system adapter", () => {
  it("maps a public FinalLevelZone into the local StructuralLevel contract", () => {
    const structuralLevel = mapFinalLevelZoneToStructuralLevel(
      buildFinalLevelZone(),
    );

    expect(structuralLevel).toEqual({
      levelId: "ABCD-support-zone-1",
      price: 5,
      side: "support",
      score: 8,
      strengthBucket: "strong",
      sourceStrengthLabel: "strong",
      timeframeSources: ["daily", "4h"],
      pivotSources: ["reference_level", "strict_pivot"],
      touchCount: 4,
      touchClusterCount: 2,
      reactionStrength: "moderate",
      confluenceCount: 3,
      isMandatoryAnchor: true,
      referenceLabel: "premarket_low",
      sourcePrices: [4.9, 5, 5.1],
    });
  });

  it("maps levels-system strength labels into local support/resistance buckets", () => {
    expect(
      mapFinalLevelZoneToStructuralLevel(
        buildFinalLevelZone({ strengthLabel: "major" }),
      ).strengthBucket,
    ).toBe("strong");
    expect(
      mapFinalLevelZoneToStructuralLevel(
        buildFinalLevelZone({ strengthLabel: "major" }),
      ).sourceStrengthLabel,
    ).toBe("major");
    expect(
      mapFinalLevelZoneToStructuralLevel(
        buildFinalLevelZone({ strengthLabel: "strong" }),
      ).strengthBucket,
    ).toBe("strong");
    expect(
      mapFinalLevelZoneToStructuralLevel(
        buildFinalLevelZone({ strengthLabel: "moderate" }),
      ).strengthBucket,
    ).toBe("medium");
    expect(
      mapFinalLevelZoneToStructuralLevel(
        buildFinalLevelZone({ strengthLabel: "weak" }),
      ).strengthBucket,
    ).toBe("weak");
  });

  it("imports the public package boundary and builds mapped context with the shared stub provider", async () => {
    expect(buildSupportResistanceContextForSymbol).toBeTypeOf("function");

    const rawResult = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);
    const context = await buildLevelsSystemSupportResistanceContext({
      timeline: rawResult.timeline,
      preferredProvider: "stub",
      asOfTimestamp: "2026-05-01T15:45:00.000Z",
      sessionDate: "2026-05-01",
      lookbackBars: {
        daily: 80,
        "4h": 80,
        "5m": 40,
      },
    });

    expect(
      context.supportLevels.length + context.resistanceLevels.length,
    ).toBeGreaterThan(0);
    expect(
      [...context.supportLevels, ...context.resistanceLevels].every((level) =>
        level.timeframeSources.some(
          (timeframe) => timeframe === "daily" || timeframe === "4h",
        ),
      ),
    ).toBe(true);
    expect(context.dynamicLevels.vwap).not.toBeNull();
    expect(context.dynamicLevels.ema9).not.toBeNull();
    expect(context.dynamicLevels.ema20).not.toBeNull();
    expect(context.experimentalMarketStructure.symbol).toBe("ABCD");
    expect(context.experimentalMarketStructure.timeframe).toBe("5m");
    expect(context.experimentalMarketStructure.state).toBeTruthy();
    expect(context.executionLevelRelations).toHaveLength(
      rawResult.timeline.executions.length,
    );
    expect(context.sharedEngineDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "fetched_candle_group",
          severity: "info",
        }),
      ]),
    );
  });

  it("can build a raw timeline result with shared-engine structural context", async () => {
    const result = await createRawTradeTimelineWithLevelsSystem(
      sampleCreateRawTradeTimelineInput,
      {
        preferredProvider: "stub",
        asOfTimestamp: "2026-05-01T15:45:00.000Z",
        sessionDate: "2026-05-01",
        lookbackBars: {
          daily: 80,
          "4h": 80,
          "5m": 40,
        },
      },
    );

    expect(
      (result.supportLevels?.length ?? 0) +
        (result.resistanceLevels?.length ?? 0),
    ).toBeGreaterThan(0);
    expect(
      [...(result.supportLevels ?? []), ...(result.resistanceLevels ?? [])].every(
        (level) =>
          level.timeframeSources.some(
            (timeframe) => timeframe === "daily" || timeframe === "4h",
          ),
      ),
    ).toBe(true);
    expect(result.executionLevelRelations).toHaveLength(
      result.timeline.executions.length,
    );
    expect(result.dynamicLevels).toMatchObject({
      vwap: expect.any(Number),
      ema9: expect.any(Number),
      ema20: expect.any(Number),
    });
    expect(result.experimentalMarketStructure).toMatchObject({
      symbol: "ABCD",
      timeframe: "5m",
      state: expect.any(String),
    });
  });
});
