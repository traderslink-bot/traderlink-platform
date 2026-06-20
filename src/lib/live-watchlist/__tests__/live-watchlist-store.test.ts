import { afterEach, describe, expect, it } from "vitest";

import {
  LiveWatchlistStore,
  resetLiveWatchlistStoreForTests,
} from "../live-watchlist-store";

describe("LiveWatchlistStore", () => {
  const originalStorage = process.env.LIVE_WATCHLIST_STORAGE;
  const originalPath = process.env.LIVE_WATCHLIST_DB_PATH;

  afterEach(() => {
    process.env.LIVE_WATCHLIST_STORAGE = originalStorage;
    process.env.LIVE_WATCHLIST_DB_PATH = originalPath;
    resetLiveWatchlistStoreForTests();
  });

  it("replaces only the card section included in a patch", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        companyInfo: {
          title: "Example Corp",
          body: "Company: Example Corp",
          updatedAt: 1000,
          priceWhenPosted: 1.2,
          source: "stock_context",
          metadata: { company: "Example Corp" },
        },
      },
    });

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 2000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });

    expect(updated.cards.companyInfo?.title).toBe("Example Corp");
    expect(updated.cards.liveTraderRead?.title).toBe("ABCD testing support");
    expect(updated.companyName).toBe("Example Corp");
    expect(updated.latestPrice).toBe(1.1);
    expect(updated.firstPostedAt).toBe(1000);
  });

  it("stores global market data health without changing ticker cards", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });

    await store.upsertHealth({
      type: "health",
      marketDataStatus: "live",
      marketDataUpdatedAt: 3000,
    });

    const state = await store.listSymbols();
    expect(state.marketDataStatus).toBe("live");
    expect(state.marketDataUpdatedAt).toBe(3000);
    expect(state.symbols[0]?.cards.liveTraderRead?.title).toBe("ABCD testing support");
  });

  it("stores recent news and SEC filings cards independently", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        recentNewsFilings: {
          title: "Known Recent News / SEC Filings",
          body: JSON.stringify({
            articles: [
              {
                title: "Example Corp files an 8-K",
                url: "https://traderslink.pro/news/example-corp-files-8-k",
                publishedAt: "2026-06-19T14:00:00.000Z",
                filingType: "8-K",
              },
            ],
          }),
          updatedAt: 1000,
          priceWhenPosted: null,
          source: "website_article_lookup",
          metadata: { articleCount: 1, businessDays: 5 },
        },
      },
    });

    const stored = await store.getSymbol("ABCD");
    expect(stored?.cards.recentNewsFilings?.title).toBe("Known Recent News / SEC Filings");
    expect(stored?.cards.recentNewsFilings?.metadata?.articleCount).toBe(1);
    expect(stored?.latestTraderReadHeadline).toBeNull();
  });

  it("updates live ticker data without replacing card content", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
        nearestSupportResistance: {
          title: "Nearest support and resistance",
          body: "Price: 1.10\nNearest support: 1.00\nNearest resistance: 1.20",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
          metadata: {
            nearestSupport: 1,
            nearestResistance: 1.2,
          },
        },
      },
    });

    const updated = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 3000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });

    expect(updated.latestPrice).toBe(1.18);
    expect(updated.nearestSupport).toBe(1.1);
    expect(updated.nearestResistance).toBe(1.25);
    expect(updated.updatedAt).toBe(3000);
    expect(updated.latestTraderReadHeadline).toBe("ABCD testing support");
    expect(updated.cards.liveTraderRead?.body).toBe("Price is testing support.");
  });

  it("derives an index headline from generic live trader read cards", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: [
            "Trade map:",
            "Current structure: ABCD is range-bound between support and resistance.",
            "Useful resistance: buyers need acceptance above resistance.",
          ].join("\n"),
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
        },
      },
    });

    expect(updated.latestTraderReadHeadline).toBe(
      "Current structure: ABCD is range-bound between support and resistance.",
    );
  });

  it("prefers explicit live trader read headline metadata", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const updated = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "Live Trader Read",
          body: "Current structure: fallback headline.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "level_snapshot",
          metadata: {
            headline: "ABCD is holding the key support area.",
          },
        },
      },
    });

    expect(updated.latestTraderReadHeadline).toBe(
      "ABCD is holding the key support area.",
    );
  });

  it("does not treat ticker data as the first posted content time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    const dataOnly = await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });
    expect(dataOnly.firstPostedAt).toBeNull();

    const withContent = await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "ABCD first read",
          body: "First published trader read.",
          updatedAt: 2000,
          priceWhenPosted: 1.2,
          source: "live_alert",
        },
      },
    });

    expect(withContent.firstPostedAt).toBe(2000);
    expect(withContent.updatedAt).toBe(2000);
  });

  it("applies status-only patches without clearing ticker content", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "ABCD",
      status: "live",
      updatedAt: 1000,
      cards: {
        liveTraderRead: {
          title: "ABCD testing support",
          body: "Price is testing support.",
          updatedAt: 1000,
          priceWhenPosted: 1.1,
          source: "live_alert",
        },
      },
    });
    await store.upsertTickerData({
      type: "tickerData",
      symbol: "ABCD",
      status: "live",
      updatedAt: 2000,
      latestPrice: 1.18,
      nearestSupport: 1.1,
      nearestResistance: 1.25,
    });

    const deactivated = await store.upsertPatch({
      symbol: "ABCD",
      status: "deactivated",
      updatedAt: 3000,
      cards: {},
    });

    expect(deactivated.status).toBe("deactivated");
    expect(deactivated.latestPrice).toBe(1.18);
    expect(deactivated.nearestSupport).toBe(1.1);
    expect(deactivated.nearestResistance).toBe(1.25);
    expect(deactivated.latestTraderReadHeadline).toBe("ABCD testing support");
    expect(deactivated.cards.liveTraderRead?.body).toBe("Price is testing support.");
  });

  it("keeps deactivated symbols out of the user-facing watchlist list", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
    process.env.LIVE_WATCHLIST_DB_PATH = ":memory:";
    const store = new LiveWatchlistStore();

    await store.upsertPatch({
      symbol: "LIVE",
      status: "live",
      updatedAt: 2000,
      cards: {
        liveTraderRead: {
          title: "LIVE active read",
          body: "Active ticker content.",
          updatedAt: 2000,
          priceWhenPosted: 2,
          source: "live_alert",
        },
      },
    });
    await store.upsertPatch({
      symbol: "GONE",
      status: "deactivated",
      updatedAt: 3000,
      cards: {
        liveTraderRead: {
          title: "GONE old read",
          body: "Old ticker content.",
          updatedAt: 3000,
          priceWhenPosted: 3,
          source: "live_alert",
        },
      },
    });

    const state = await store.listSymbols();
    expect(state.symbols.map((symbol) => symbol.symbol)).toEqual(["LIVE"]);
    expect(await store.getSymbol("GONE")).not.toBeNull();
  });
});
