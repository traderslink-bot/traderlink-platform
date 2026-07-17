import { describe, expect, it } from "vitest";

import {
  isNewerLiveWatchlistSymbolState,
  reconcileLiveWatchlistSnapshot,
} from "../live-watchlist-reconciliation";
import type { LiveWatchlistSymbolState } from "../live-watchlist-types";

function symbol(overrides: Partial<LiveWatchlistSymbolState> = {}): LiveWatchlistSymbolState {
  return {
    symbol: "TGHL",
    status: "live",
    updatedAt: 1_000,
    firstPostedAt: 900,
    companyName: null,
    latestPrice: 1.36,
    latestPriceSource: "ticker",
    latestPriceObservedAt: 1_000,
    marketDataRevision: 10,
    nearestSupport: null,
    nearestResistance: null,
    latestTraderReadHeadline: null,
    cards: {},
    ...overrides,
  };
}

describe("live watchlist reconciliation", () => {
  it("rejects a late stream event with an older market-data revision", () => {
    expect(isNewerLiveWatchlistSymbolState(
      symbol({ marketDataRevision: 11, latestPriceObservedAt: 2_000, updatedAt: 2_000 }),
      symbol({ marketDataRevision: 10, latestPriceObservedAt: 1_000, updatedAt: 3_000 }),
    )).toBe(false);
  });

  it("keeps an event that arrived after an in-flight multi-instance polling response", () => {
    const current = symbol({ marketDataRevision: 12, latestPriceObservedAt: 2_100, updatedAt: 2_100 });
    const lateSnapshot = symbol({ marketDataRevision: 11, latestPriceObservedAt: 2_000, updatedAt: 2_000 });
    const result = reconcileLiveWatchlistSnapshot({
      current: [current],
      incoming: [lateSnapshot],
      generatedAt: 2_050,
    });
    expect(result).toEqual([current]);
  });

  it("allows a newer canonical poll to replace the earlier stream state", () => {
    const current = symbol({ marketDataRevision: 11, latestPriceObservedAt: 2_000, updatedAt: 2_000 });
    const canonical = symbol({ marketDataRevision: 12, latestPriceObservedAt: 2_100, updatedAt: 2_100 });
    const result = reconcileLiveWatchlistSnapshot({
      current: [current],
      incoming: [canonical],
      generatedAt: 2_150,
    });
    expect(result).toEqual([canonical]);
  });
});
