import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

import { buildDailyWatchlistAnalysisRecap } from "./daily-analysis-recap-builder";

const postedAtMs = Date.parse("2026-09-08T13:30:00.000Z");
const publishedAtMs = postedAtMs + 60_000;
const read = {
  version: 4,
  mustClear: { price: 0.52 },
  breakoutContinuation: { price: 0.54 },
  pullbackPlans: { shallow: { zoneLow: 0.44, zoneHigh: 0.46 }, deep: null },
  forwardPlan: {
    nearestRealistic: { available: true, price: 0.6 },
    continuedMomentum: { available: true, price: 0.63 },
    strongExpansion: { available: false, price: null },
    extremeMomentum: { available: true, price: 0.7 },
    additionalObservedOutcomes: [],
  },
} as unknown as TradersLinkAiReadPayload;

describe("daily analysis recap builder", () => {
  it("combines pullback recovery and reached AI analysis levels in sentences", () => {
    const text = buildDailyWatchlistAnalysisRecap({
      aiRead: { publishedAtMs, read },
      observations: [
        { observedAtMs: publishedAtMs, price: 0.45 },
        { observedAtMs: publishedAtMs + 60_000, price: 0.54 },
        { observedAtMs: publishedAtMs + 120_000, price: 0.65 },
      ],
      postedAtMs,
      postedPrice: 0.5,
      symbol: "PDSB",
    });
    expect(text).toContain("Analysis included a shallow pullback area");
    expect(text).toContain("44.4% move from the actual pullback price");
    expect(text).toContain("breakout trigger of $0.5400");
    expect(text).toContain("$0.6000, $0.6300");
    expect(text).not.toContain("$0.7000");
  });

  it("still writes a move recap when no analysis level was reached", () => {
    const text = buildDailyWatchlistAnalysisRecap({
      aiRead: { publishedAtMs, read },
      observations: [{ observedAtMs: publishedAtMs, price: 0.53 }],
      postedAtMs,
      postedPrice: 0.5,
      symbol: "PDSB",
    });
    expect(text).toContain("potential gain of 6.0%");
  });

  it("uses setup invalidation only when price did not first produce an upside result", () => {
    const invalidationRead = {
      ...read,
      momentumFailure: { price: 0.4 },
    } as unknown as TradersLinkAiReadPayload;
    const text = buildDailyWatchlistAnalysisRecap({
      aiRead: { publishedAtMs, read: invalidationRead },
      observations: [
        { observedAtMs: publishedAtMs, price: 0.43 },
        { observedAtMs: publishedAtMs + 60_000, price: 0.39 },
      ],
      postedAtMs,
      postedPrice: 0.5,
      symbol: "PDSB",
    });
    expect(text).toContain("failed to hold the $0.4400-$0.4600 pullback area");
    expect(text).toContain("broke below the $0.4000 momentum-failure level");
    expect(text).toContain("invalidating the setup");
  });
});
