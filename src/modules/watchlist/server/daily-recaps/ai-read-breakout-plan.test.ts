import { describe, expect, it } from "vitest";

import { breakoutPlanFromAiRead } from "./ai-read-breakout-plan";

const body = JSON.stringify({
  version: 4, symbol: "PDSB", generatedAt: 1, dataAsOf: 1, currentPrice: 0.5,
  marketSession: "regular", bias: "bullish", confidence: "medium", currentRead: "x",
  needsToHold: { label: "hold", price: 0.48, rationale: "x" }, cautionBelow: { label: "caution", price: 0.47, rationale: "x" },
  momentumFailure: { label: "failure", price: 0.46, rationale: "x" }, mustClear: { label: "clear", price: 0.52, rationale: "x" },
  breakoutContinuation: { label: "trigger", price: 0.54, rationale: "x" }, targets: [], downsideCheckpoints: [],
  catalystRealityCheck: { summary: "x", status: "none", dayTradeRelevance: "x", sourceUrls: [] },
  dilutionRisk: { level: "none", summary: "x", dayTradeRelevance: "x", sourceUrls: [] },
  listingStatus: { status: "none", immediacy: "background", summary: "x", dayTradeRelevance: "x", sourceUrls: [] },
  riskSummary: [], sources: [], model: "x", usedWebSearch: false, generationId: "x",
  forwardPlan: { nearestRealistic: { available: true, price: 0.6, condition: "x", basisType: "observed_intraday", basisSummary: "x", sourceFacts: [], unavailableReasonCode: null, unavailableReason: null }, continuedMomentum: { available: true, price: 0.63, condition: "x", basisType: "observed_intraday", basisSummary: "x", sourceFacts: [], unavailableReasonCode: null, unavailableReason: null }, strongExpansion: { available: false, price: null, condition: "x", basisType: "unavailable", basisSummary: "x", sourceFacts: [], unavailableReasonCode: "insufficient_history", unavailableReason: "x" }, extremeMomentum: { available: true, price: 0.7, condition: "x", basisType: "observed_intraday", basisSummary: "x", sourceFacts: [], unavailableReasonCode: null, unavailableReason: null }, additionalObservedOutcomes: [] }, pullbackPlans: { shallow: null, deep: null }, failureRecovery: null,
});

describe("AI Read breakout plan", () => {
  it("uses only published Where the trade could go next levels", async () => {
    const { parseTradersLinkAiRead } = await import("@/src/lib/live-watchlist/traderslink-ai-read");
    const read = parseTradersLinkAiRead(body);
    expect(read && breakoutPlanFromAiRead(read, 1_000)).toMatchObject({
      clearedPrice: 0.52, breakoutTriggerPrice: 0.54, nextLevelPrices: [0.6, 0.63, 0.7],
    });
  });
});
