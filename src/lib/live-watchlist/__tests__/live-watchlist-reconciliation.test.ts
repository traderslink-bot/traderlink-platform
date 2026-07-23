import { describe, expect, it } from "vitest";

import {
  isNewerLiveWatchlistSymbolState,
  reconcileLiveWatchlistSnapshot,
  reconcileLiveWatchlistSymbolState,
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

  it("accepts a newer AI Read card without rolling a newer live quote backwards", () => {
    const current = symbol({
      updatedAt: 3_000,
      latestPrice: 1.66,
      latestPriceObservedAt: 3_000,
      marketDataRevision: 12,
      tradersLinkAiReadStatus: "analyzing",
      tradersLinkAiReadStatusUpdatedAt: 2_000,
      cards: {},
    });
    const aiRead = {
      title: "TradersLink AI Read",
      body: "Replacement preparation plan.",
      updatedAt: 2_500,
      priceWhenPosted: 1.58,
      source: "traderslink-ai-read",
    };
    const incoming = symbol({
      updatedAt: 2_500,
      latestPrice: 1.58,
      latestPriceObservedAt: 2_500,
      marketDataRevision: 11,
      tradersLinkAiReadStatus: "ready",
      tradersLinkAiReadStatusUpdatedAt: 2_500,
      cards: { tradersLinkAiRead: aiRead },
    });

    const result = reconcileLiveWatchlistSymbolState(current, incoming);

    expect(result.latestPrice).toBe(1.66);
    expect(result.marketDataRevision).toBe(12);
    expect(result.cards.tradersLinkAiRead).toEqual(aiRead);
    expect(result.tradersLinkAiReadStatus).toBe("ready");
  });

  it("does not replace a current AI Read with an older card", () => {
    const currentAiRead = {
      title: "TradersLink AI Read",
      body: "Current preparation plan.",
      updatedAt: 2_800,
      priceWhenPosted: 1.61,
      source: "traderslink-ai-read",
    };
    const incomingAiRead = {
      ...currentAiRead,
      body: "Older preparation plan.",
      updatedAt: 2_500,
    };
    const result = reconcileLiveWatchlistSymbolState(
      symbol({
        updatedAt: 3_000,
        marketDataRevision: 12,
        cards: { tradersLinkAiRead: currentAiRead },
        tradersLinkAiReadStatus: "ready",
      }),
      symbol({
        updatedAt: 2_500,
        marketDataRevision: 11,
        cards: { tradersLinkAiRead: incomingAiRead },
        tradersLinkAiReadStatus: "ready",
      }),
    );

    expect(result.cards.tradersLinkAiRead).toEqual(currentAiRead);
  });

  it("does not revive an AI Read older than the current analyzing state", () => {
    const staleAiRead = {
      title: "TradersLink AI Read",
      body: "Crossed preparation plan.",
      updatedAt: 2_500,
      priceWhenPosted: 1.48,
      source: "traderslink-ai-read",
    };
    const result = reconcileLiveWatchlistSymbolState(
      symbol({
        updatedAt: 3_100,
        marketDataRevision: 12,
        cards: {},
        tradersLinkAiReadStatus: "analyzing",
        tradersLinkAiReadStatusUpdatedAt: 3_000,
      }),
      symbol({
        updatedAt: 2_500,
        marketDataRevision: 11,
        cards: { tradersLinkAiRead: staleAiRead },
        tradersLinkAiReadStatus: "ready",
        tradersLinkAiReadStatusUpdatedAt: 2_500,
      }),
    );

    expect(result.cards.tradersLinkAiRead).toBeUndefined();
    expect(result.tradersLinkAiReadStatus).toBe("analyzing");
  });
});
