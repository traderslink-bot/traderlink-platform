import { describe, expect, it } from "vitest";

import { formatLevelMarketDataProvenance } from "../live-watchlist-level-provenance";
import type { LiveWatchlistLevelMapLevel } from "../live-watchlist-types";

function level(
  marketDataProvenance?: LiveWatchlistLevelMapLevel["marketDataProvenance"],
): LiveWatchlistLevelMapLevel {
  return {
    side: "resistance",
    price: 4.82,
    distancePct: 0.04,
    label: "$4.82",
    marketDataProvenance,
  };
}

describe("formatLevelMarketDataProvenance", () => {
  const formedAt = Date.parse("2026-07-08T14:00:00Z");
  const confirmedAt = Date.parse("2026-07-10T15:00:00Z");
  const testedAt = Date.parse("2026-07-14T16:00:00Z");

  it("renders formation-only and confirmed provenance in New York market dates", () => {
    expect(formatLevelMarketDataProvenance(level({ formedAt, sourceLastSeenAt: formedAt })))
      .toBe("Formed Jul 8");
    expect(formatLevelMarketDataProvenance(level({
      formedAt,
      sourceLastSeenAt: formedAt,
      lastConfirmedAt: confirmedAt,
      lastTestedAt: confirmedAt,
    }))).toBe("Formed Jul 8 · Confirmed Jul 10");
  });

  it("shows a later unresolved test after the prior confirmation", () => {
    expect(formatLevelMarketDataProvenance(level({
      formedAt,
      sourceLastSeenAt: formedAt,
      lastConfirmedAt: confirmedAt,
      lastTestedAt: testedAt,
    }))).toBe("Confirmed Jul 10 · Tested Jul 14");
  });

  it("stays hidden for old payloads without provenance", () => {
    expect(formatLevelMarketDataProvenance(level())).toBeNull();
  });
});
