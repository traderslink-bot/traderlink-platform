import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";

describe("support/resistance context integration", () => {
  it("attaches the first factual structural-context bundle to the raw trade timeline result", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

    expect(result.structuralContextWindow).toBeDefined();
    expect(result.referenceLevels).toBeDefined();
    expect(result.dynamicLevels).toBeDefined();
    expect(result.supportLevels).toBeDefined();
    expect(result.resistanceLevels).toBeDefined();
    expect(Array.isArray(result.supportLevels)).toBe(true);
    expect(Array.isArray(result.resistanceLevels)).toBe(true);
    expect(result.executionLevelRelations).toHaveLength(
      result.timeline.executions.length,
    );
    expect(result.executionLevelRelations?.[0]).toMatchObject({
      executionIndex: 0,
      occurredInOpenAir: expect.any(Boolean),
    });
    expect(result.gapStructure).toEqual({
      gapAbove: null,
      gapBelow: null,
    });

    expect(result.structuralContextWindow).toMatchObject({
      firstExecutionTimestamp: "2024-04-12T13:33:30.000Z",
      lastExecutionTimestamp: "2024-04-12T13:39:10.000Z",
      includedTimeframes: ["1m"],
    });

    expect(result.dynamicLevels?.vwap).not.toBeNull();
    expect(result.dynamicLevels?.ema9).not.toBeNull();
    expect(result.dynamicLevels?.ema20).not.toBeNull();
    expect(result.hadInsufficientCandleDataForStructure).toBe(false);
  });
});
