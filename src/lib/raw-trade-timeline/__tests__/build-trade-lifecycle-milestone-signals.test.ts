import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { buildTradeLifecycleMilestoneSignals } from "../derived/build-trade-lifecycle-milestone-signals";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";

describe("buildTradeLifecycleMilestoneSignals", () => {
  it("builds factual lifecycle milestones for a long trade", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

    const signals = buildTradeLifecycleMilestoneSignals(result);

    expect(signals).toMatchObject({
      firstTimestampTradeHadOpenProfit: "2024-04-12T13:34:00.000Z",
      firstTimestampTradeHadOpenLoss: "2024-04-12T13:34:00.000Z",
      timestampOfPeakPriceDuringTrade: "2024-04-12T13:38:00.000Z",
      timestampOfWorstPriceDuringTrade: "2024-04-12T13:34:00.000Z",
      timestampOfPeakOpenProfit: "2024-04-12T13:38:00.000Z",
      timestampOfWorstDrawdown: "2024-04-12T13:34:00.000Z",
      peakOpenProfit: 22.75005,
      worstDrawdown: -1.5,
      peakOpenProfitPctOfBasis: 0.125518,
      worstDrawdownPctOfBasis: -0.012658,
    });
  });
});
