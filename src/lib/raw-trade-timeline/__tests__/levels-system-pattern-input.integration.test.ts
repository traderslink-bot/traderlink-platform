import { describe, expect, it } from "vitest";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { createRawTradeTimelineWithLevelsSystem } from "../builders/create-raw-trade-timeline";

describe("levels-system PatternInput integration", () => {
  it("feeds shared higher-timeframe support/resistance facts into PatternInput without VWAP or EMA feedback", async () => {
    const rawResult = await createRawTradeTimelineWithLevelsSystem(
      sampleCreateRawTradeTimelineInput,
      buildSampleLevelsSystemSupportResistanceOptions(),
    );

    const patternInput = buildPatternInput(rawResult);
    const context = patternInput.supportResistanceContext;

    expect(rawResult.supportLevels?.length).toBeGreaterThan(0);
    expect(rawResult.resistanceLevels?.length).toBeGreaterThan(0);
    expect(rawResult.executionLevelRelations).toHaveLength(
      rawResult.timeline.executions.length,
    );
    expect(
      rawResult.supportLevels?.every((level) =>
        level.timeframeSources.some(
          (timeframe) => timeframe === "daily" || timeframe === "4h",
        ),
      ),
    ).toBe(true);
    expect(
      rawResult.resistanceLevels?.every((level) =>
        level.timeframeSources.some(
          (timeframe) => timeframe === "daily" || timeframe === "4h",
        ),
      ),
    ).toBe(true);
    expect(rawResult.experimentalMarketStructure).toMatchObject({
      symbol: "ABCD",
      timeframe: "5m",
      state: expect.any(String),
    });
    expect(
      "experimentalMarketStructure" in patternInput.supportResistanceContext,
    ).toBe(false);

    expect(context.hadSupportResistanceContextAvailable).toBe(true);
    expect(context.hadInsufficientCandleDataForStructuralContext).toBe(false);
    expect(context.firstEntryNearestSupportBelowPrice).not.toBeNull();
    expect(context.firstEntryNearestResistanceAbovePrice).not.toBeNull();
    expect(context.firstEntryNearestSupportStrengthBucket).toEqual(
      expect.stringMatching(/^(strong|medium|weak)$/),
    );
    expect(context.firstEntryNearestResistanceStrengthBucket).toEqual(
      expect.stringMatching(/^(strong|medium|weak)$/),
    );
    expect(context.firstEntryNearestSupportSourceStrengthLabel).toEqual(
      expect.stringMatching(/^(major|strong|moderate|weak)$/),
    );
    expect(context.firstEntryNearestResistanceSourceStrengthLabel).toEqual(
      expect.stringMatching(/^(major|strong|moderate|weak)$/),
    );
    expect(context.firstEntryNearestSupportScore).toEqual(expect.any(Number));
    expect(context.firstEntryNearestResistanceScore).toEqual(expect.any(Number));
    expect(context.firstEntryDistanceToNearestSupportPct).not.toBeNull();
    expect(context.firstEntryDistanceToNearestResistancePct).not.toBeNull();
    expect(context.firstEntryDistanceFromVwapPct).toBeNull();
    expect(context.firstEntryDistanceFromEma9Pct).toBeNull();
    expect(context.firstEntryDistanceFromEma20Pct).toBeNull();
    expect(context.firstEntryHasNearbyStructureOnBothSides).toBe(true);
    expect(typeof context.firstEntryOccurredInOpenAir).toBe("boolean");
    expect(context.firstEntryWasAboveVwap).toBe(false);
    expect(context.firstEntryWasBelowVwap).toBe(false);
    expect(context.addsNearSupportCount).toBeGreaterThanOrEqual(0);
    expect(context.addsNearResistanceCount).toBeGreaterThanOrEqual(0);
    expect(context.addsAboveResistanceWithRoomCount).toBeGreaterThanOrEqual(0);
    expect(context.reductionsNearSupportCount).toBeGreaterThanOrEqual(0);
    expect(context.reductionsNearResistanceCount).toBeGreaterThanOrEqual(0);
  });
});
