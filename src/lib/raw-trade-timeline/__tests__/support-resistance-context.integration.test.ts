import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";

describe("support/resistance context integration", () => {
  it("does not build support/resistance, VWAP, or EMA in the local raw timeline path", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

    expect(result.structuralContextWindow).toBeUndefined();
    expect(result.referenceLevels).toBeUndefined();
    expect(result.dynamicLevels).toBeUndefined();
    expect(result.supportLevels).toBeUndefined();
    expect(result.resistanceLevels).toBeUndefined();
    expect(result.executionLevelRelations).toBeUndefined();
    expect(result.gapStructure).toBeUndefined();
    expect(result.hadInsufficientCandleDataForStructure).toBeUndefined();
  });
});
