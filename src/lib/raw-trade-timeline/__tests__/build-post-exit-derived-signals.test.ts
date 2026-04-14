import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";

describe("buildPostExitDerivedSignals", () => {
  it("computes richer factual post-exit outcome signals for the final exit window", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);
    const signals = result.postExitDerivedSignals;

    expect(signals).toBeDefined();
    expect(signals?.postExitCandleCount).toBe(1);
    expect(signals?.maxFavorableMovePctAfterExit).toBe(0.011583);
    expect(signals?.maxAdverseMovePctAfterExit).toBe(0.027027);
    expect(signals?.closePriceAtEndOfPostExitWindow).toBe(1.27);
    expect(signals?.netMovePctAtEndOfPostExitWindow).toBe(-0.019305);
  });
});
