import { describe, expect, it } from "vitest";

import { formatAiReadSession, parseTradersLinkAiRead } from "../traderslink-ai-read";

function validBody() {
  return JSON.stringify({
    version: 2,
    symbol: "TGHL",
    generatedAt: 3_000,
    dataAsOf: 2_900,
    currentPrice: 1.36,
    marketSession: "postmarket",
    bias: "bullish",
    confidence: "medium",
    currentRead: "Constructive while support holds.",
    needsToHold: { label: "Support", price: 1.25, rationale: "Preserves structure." },
    cautionBelow: { label: "Caution", price: 1.25, rationale: "Momentum begins to weaken." },
    momentumFailure: { label: "Failure", price: 1.2, rationale: "Exposes lower support." },
    mustClear: { label: "Breakout", price: 1.5, rationale: "Confirms continuation." },
    breakoutContinuation: { label: "Continuation", price: 1.68, rationale: "Opens higher targets." },
    targets: [{ label: "Target one", price: 1.8, condition: "After acceptance." }],
    downsideCheckpoints: [
      { label: "First lower support", price: 1.2, condition: "After momentum failure." },
      { label: "Outer lower support", price: 1.05, condition: "If $1.20 fails." },
    ],
    catalystRealityCheck: {
      status: "conditional",
      summary: "A recent filing is the primary catalyst context.",
      dayTradeRelevance: "Price and volume still need to confirm.",
      sourceUrls: ["https://www.sec.gov/Archives/example"],
    },
    dilutionRisk: {
      level: "high",
      summary: "The transaction contemplates substantial new shares.",
      dayTradeRelevance: "Watch supply into momentum spikes.",
      sourceUrls: ["https://www.sec.gov/Archives/example"],
      canCompanyIssueToday: false,
      companyIssuance: {
        status: "conditional",
        earliestDate: "2026-07-18",
        trigger: "merger_closing",
        summary: "Issuance requires the merger to close.",
      },
      publicResale: {
        status: "delayed",
        earliestDate: null,
        trigger: "resale_registration",
        summary: "Public resale requires registration or an exemption.",
      },
    },
    listingStatus: {
      status: "hearing_pending",
      immediacy: "monitor",
      summary: "The appeal is pending under an interim stay.",
      dayTradeRelevance: "Background headline risk while trading remains active.",
      sourceUrls: ["https://www.sec.gov/Archives/example"],
    },
    riskSummary: ["Thin liquidity."],
    sources: [{
      title: "Current report",
      url: "https://www.sec.gov/Archives/example",
      sourceType: "press_release_sec_database",
    }],
    model: "test-model",
    usedWebSearch: true,
    usage: {
      inputTokens: 2_000,
      cachedInputTokens: 200,
      outputTokens: 500,
      totalTokens: 2_500,
      webSearchCallCount: 1,
      tokenCostUsd: 0.01205,
      webSearchCostUsd: 0.01,
      estimatedTotalCostUsd: 0.02205,
      pricing: {
        source: "built_in",
        inputPer1M: 2.5,
        cachedInputPer1M: 0.25,
        outputPer1M: 15,
        webSearchPer1KCalls: 10,
      },
    },
  });
}

describe("TradersLink AI Read parser", () => {
  it("parses the structured card payload", () => {
    const read = parseTradersLinkAiRead(validBody());
    expect(read?.currentPrice).toBe(1.36);
    expect(read?.mustClear.price).toBe(1.5);
    expect(read?.breakoutContinuation.price).toBe(1.68);
    expect(read?.downsideCheckpoints?.map((checkpoint) => checkpoint.price)).toEqual([1.2, 1.05]);
    expect(read?.listingStatus.immediacy).toBe("monitor");
    expect(read?.dilutionRisk.companyIssuance?.earliestDate).toBe("2026-07-18");
    expect(read?.usage?.webSearchCostUsd).toBe(0.01);
    expect(formatAiReadSession(read!.marketSession)).toBe("Postmarket");
  });

  it("rejects malformed payloads and unsafe source URLs", () => {
    expect(parseTradersLinkAiRead("not-json")).toBeNull();
    const unsafe = JSON.parse(validBody()) as { sources: Array<{ url: string }> };
    unsafe.sources[0]!.url = "javascript:alert(1)";
    expect(parseTradersLinkAiRead(JSON.stringify(unsafe))).toBeNull();

    const ungrounded = JSON.parse(validBody()) as {
      catalystRealityCheck: { sourceUrls: string[] };
    };
    ungrounded.catalystRealityCheck.sourceUrls = ["https://unsupported.example/catalyst"];
    expect(parseTradersLinkAiRead(JSON.stringify(ungrounded))).toBeNull();

    const invalidTiming = JSON.parse(validBody()) as {
      dilutionRisk: { companyIssuance: { earliestDate: string } };
    };
    invalidTiming.dilutionRisk.companyIssuance.earliestDate = "soon";
    expect(parseTradersLinkAiRead(JSON.stringify(invalidTiming))).toBeNull();
  });
});
