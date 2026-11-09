import { describe, expect, it } from "vitest";
import { watchlistPriceNote, hasFreshWatchlistPrice } from "@/app/watchlist/watchlist-price-status";

const now = Date.parse("2026-11-09T03:00:00Z");
const ticker = { latestPriceSource: "ticker" as const, latestPriceObservedAt: now - 573 };
describe("truthful Watchlist quote labels", () => {
  it("has no not-live or invented fixed-delay label for a fresh trade in an active feed", () => {
    expect(watchlistPriceNote(ticker, "live", now)).toBe("");
  });
  it("labels an inactive feed with the actual quote time, not an unchanged trade on a healthy feed", () => {
    for (const status of ["closed", "offline", "starting", "stale"] as const)
      expect(watchlistPriceNote(ticker, status, now)).toBe("Not live · Last price: Nov 8, 9:59 PM ET");
    expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: now - 180000 }, "live", now)).toBe("");
  });
  it("does not substitute publication or receipt time for unavailable source time", () => {
    expect(watchlistPriceNote({ ...ticker, latestPriceSource: "card" }, "offline", now)).toBe("Not live · Price time unavailable");
    for (const time of [null, NaN, -1]) expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: time }, "offline", now)).toBe("Not live · Price time unavailable");
  });
  it("keeps quote freshness independent for level reference replacement", () => {
    expect(hasFreshWatchlistPrice(ticker, now)).toBe(true);
    for (const time of [null, NaN, -1, now - 180000, now + 60000]) {
      expect(hasFreshWatchlistPrice({ ...ticker, latestPriceObservedAt: time }, now)).toBe(false);
      expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: time }, "live", now)).toBe("");
    }
  });
});
