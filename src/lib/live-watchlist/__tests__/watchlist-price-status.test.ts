import { describe, expect, it } from "vitest";
import { watchlistPriceNote } from "@/app/watchlist/watchlist-price-status";

const now = Date.parse("2026-11-09T03:00:00Z");
const ticker = { latestPriceSource: "ticker" as const, latestPriceObservedAt: now - 573 };
describe("truthful Watchlist quote labels", () => {
  it("has no not-live or invented fixed-delay label for a fresh trade in an active feed", () => {
    expect(watchlistPriceNote(ticker, "live", now)).toBe("");
  });
  it("labels an inactive feed and individual old trade with the actual quote time", () => {
    for (const status of ["closed", "offline", "starting", "stale"] as const)
      expect(watchlistPriceNote(ticker, status, now)).toBe("Not live · Last price: Nov 8, 9:59 PM ET");
    expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: now - 180000 }, "live", now)).toBe("Not live · Last price: Nov 8, 9:57 PM ET");
  });
  it("does not substitute publication or receipt time for unavailable source time", () => {
    expect(watchlistPriceNote({ ...ticker, latestPriceSource: "card" }, "live", now)).toBe("Not live · Price time unavailable");
    for (const time of [null, NaN, -1]) expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: time }, "live", now)).toBe("Not live · Price time unavailable");
    expect(watchlistPriceNote({ ...ticker, latestPriceObservedAt: now + 60000 }, "live", now)).not.toBe("");
  });
});
