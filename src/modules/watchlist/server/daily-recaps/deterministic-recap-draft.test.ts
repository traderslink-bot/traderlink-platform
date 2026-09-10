import { describe, expect, it } from "vitest";

import { buildDeterministicWatchlistRecapDraft } from "./deterministic-recap-draft";

const POSTED_AT = Date.parse("2026-09-08T14:12:00.000Z");

describe("buildDeterministicWatchlistRecapDraft", () => {
  it("uses the Watchlist posted fact as the only performance baseline", () => {
    const draft = buildDeterministicWatchlistRecapDraft({
      highPrice: 3.25,
      highPriceAtMs: Date.parse("2026-09-08T19:00:00.000Z"),
      latestPrice: 3.25,
      latestPriceAtMs: Date.parse("2026-09-08T19:00:00.000Z"),
      postedAtMs: POSTED_AT,
      postedPrice: 2.12,
      symbol: "CELU",
    });

    expect(draft.scenario).toBe("follow_through");
    expect(draft.maximumGainPct).toBeCloseTo(53.3018868);
    expect(draft.text).toBe(
      "CELU was posted to the Watchlist at 10:12 AM EDT. Price reached a high of $3.25 for a potential gain of 53.3%.",
    );
  });

  it("reports a later factual fade without implying an exit", () => {
    const draft = buildDeterministicWatchlistRecapDraft({
      highPrice: 3.25,
      highPriceAtMs: Date.parse("2026-09-08T19:00:00.000Z"),
      latestPrice: 2.8,
      latestPriceAtMs: Date.parse("2026-09-08T19:15:00.000Z"),
      postedAtMs: POSTED_AT,
      postedPrice: 2.12,
      symbol: "CELU",
    });

    expect(draft.scenario).toBe("follow_through_then_fade");
    expect(draft.text).toContain("It later traded at $2.80.");
    expect(draft.text).not.toMatch(/sold|exit|captured/i);
  });

  it("rejects observations that predate the Watchlist post", () => {
    expect(() => buildDeterministicWatchlistRecapDraft({
      highPrice: 3.25,
      highPriceAtMs: POSTED_AT - 1,
      latestPrice: 2.8,
      latestPriceAtMs: POSTED_AT,
      postedAtMs: POSTED_AT,
      postedPrice: 2.12,
      symbol: "CELU",
    })).toThrow("watchlist_daily_recap_observation_precedes_post");
  });
});
