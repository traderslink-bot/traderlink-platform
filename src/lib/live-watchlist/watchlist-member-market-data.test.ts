import { expect, it } from "vitest";
import type { LiveWatchlistExtendedQuote, LiveWatchlistSymbolState } from "./live-watchlist-types";
import { watchlistDetailProjection } from "./watchlist-member-projection";
import { projectLiveWatchlistListSymbol } from "./live-watchlist-list";
import { broadcastLiveWatchlistUpdate, createLiveWatchlistStream } from "./live-watchlist-events";
import { reconcileLiveWatchlistSymbolState } from "./live-watchlist-reconciliation";

function fixture(): LiveWatchlistSymbolState {
  const quote: LiveWatchlistExtendedQuote = {
    source: "eodhd_live_v2", providerSymbol: "SHFS.US", symbol: "SHFS", updatedAt: 200, fetchedAt: 201,
    name: "Company", exchange: "NASDAQ", currency: "USD", open: .0277, high: .029, low: .027,
    lastTradePrice: .0288, lastTradeSize: 100, lastTradeTime: 200, bidPrice: .0287, bidSize: 200, bidTime: 200,
    askPrice: .0289, askSize: 300, askTime: 200, volume: 500000, change: .0011, changePercent: 3.97,
    previousClosePrice: .0277, ethPrice: .0288, ethVolume: 5000, ethTime: 200, marketCap: 10000000,
    sharesOutstanding: 20000000, sharesFloat: 10000000, timestamp: 200,
  };
  return {
    symbol: "SHFS", status: "live", updatedAt: 201, firstPostedAt: 100, companyName: "Company",
    latestPrice: .0288, latestPriceSource: "ticker", latestPriceObservedAt: 200, marketDataRevision: 7,
    nearestSupport: .027, nearestResistance: .03, latestTraderReadHeadline: null, extendedQuote: quote,
    cards: {
      companyInfo: { title: "Company", body: "Company description", updatedAt: 100, priceWhenPosted: .0277,
        source: "finnhub_company_profile", metadata: { country: "US", float: 10000000, provider: "finnhub", marketCapSource: "finnhub_profile", sourceUrl: "https://www.sec.gov/Archives/example" } },
      technicalContext: { title: "Technicals", body: "EMA9 above EMA20", updatedAt: 100, priceWhenPosted: .0277, source: "alpaca" },
      fullLadder: { title: "Levels", body: "Support .027", updatedAt: 100, priceWhenPosted: .0277, source: "moomoo" },
    },
  };
}

it("removes supplier metadata from member detail/RSC data without changing saved quotes, facts or citations", () => {
  const state = fixture(), original = JSON.stringify(state);
  const member = watchlistDetailProjection(state, true);
  expect(member.extendedQuote).not.toHaveProperty("source");
  expect(member.extendedQuote).not.toHaveProperty("providerSymbol");
  expect(member.extendedQuote?.lastTradePrice).toBe(.0288);
  expect(member.extendedQuote?.volume).toBe(500000);
  expect(member.marketDataRevision).toBe(7); expect(member.latestPriceObservedAt).toBe(200);
  expect(member.cards.companyInfo?.source).toBe("TradersLink");
  expect(member.cards.companyInfo?.metadata).toEqual({ country: "US", float: 10000000, sourceUrl: "https://www.sec.gov/Archives/example" });
  expect(JSON.stringify(member)).not.toMatch(/eodhd|finnhub|alpaca|moomoo/i);
  expect(JSON.stringify(state)).toBe(original);
  expect(watchlistDetailProjection(member, true)).toEqual(member);
});

it("preserves the existing member gates and quote ordering through client merges", () => {
  const state = fixture(), allowed = watchlistDetailProjection(state, true);
  const older = { ...allowed, latestPrice: .01, latestPriceObservedAt: 100, marketDataRevision: 6, updatedAt: 150 };
  const merged = reconcileLiveWatchlistSymbolState(allowed, older);
  expect(merged.latestPrice).toBe(.0288); expect(merged.marketDataRevision).toBe(7);
  const denied = watchlistDetailProjection(merged, false, false, false, undefined, false);
  expect(denied.cards.technicalContext).toBeUndefined(); expect(denied.indicatorCardVisible).toBe(false);
  expect(denied.cards.fullLadder).toBeUndefined(); expect(denied.nearestSupport).toBeNull();
  expect(denied.premiumAnalysisPricesAllowed).toBe(false);
  expect(state.cards.fullLadder).toBeDefined();
  expect(projectLiveWatchlistListSymbol(allowed)).toEqual(projectLiveWatchlistListSymbol(state));
});

it("preserves resistance format, evidence and notices after the store has applied its historical view", () => {
  const state=fixture(),metadata={resistanceHistoryNotice:"No higher historical resistance detected",resistanceEvidence:'[{"price":0.03,"evidenceCount":2}]',nearestResistance:.03,nearestResistanceLabel:"Daily high",nearestResistanceDistancePct:4.17,nearestResistanceDistanceAtr:1.2,nearestResistanceAtrDistanceState:"normal"};
  state.cards.fullLadder={...state.cards.fullLadder!,source:"level_snapshot",metadata};
  const member=watchlistDetailProjection(state,true);
  expect(member.cards.fullLadder?.source).toBe("level_snapshot");
  expect(member.cards.fullLadder?.metadata).toEqual(metadata);
  expect(state.cards.fullLadder.metadata).toBe(metadata);
});

it("keeps member live updates compact and source-neutral with the same price and clock", async () => {
  const stream = createLiveWatchlistStream(), reader = stream.getReader();
  try {
    await reader.read();
    broadcastLiveWatchlistUpdate(fixture());
    const event = new TextDecoder().decode((await reader.read()).value);
    const symbol = JSON.parse(event.split("data: ")[1].trim());
    expect(symbol.latestPrice).toBe(.0288); expect(symbol.marketDataRevision).toBe(7);
    expect(symbol.latestPriceObservedAt).toBe(200); expect(symbol.latestPriceSource).toBe("ticker");
    expect(symbol).not.toHaveProperty("extendedQuote"); expect(symbol).not.toHaveProperty("cards");
    expect(event).not.toMatch(/eodhd|finnhub|alpaca|moomoo/i);
  } finally { await reader.cancel(); }
});
