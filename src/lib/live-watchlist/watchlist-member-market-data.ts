import { publicMarketMetadata } from "@/src/modules/market-data/public-market-metadata";
import type { LiveWatchlistArchiveSnapshot, LiveWatchlistCardContent, LiveWatchlistExtendedQuote, LiveWatchlistSymbolState } from "./live-watchlist-types";

export type MemberWatchlistQuote = Omit<LiveWatchlistExtendedQuote, "source" | "providerSymbol">;
export type MemberWatchlistSymbolState = Omit<LiveWatchlistSymbolState, "extendedQuote"> & {
  extendedQuote?: MemberWatchlistQuote | null;
};
export type MemberWatchlistArchiveSnapshot = Omit<LiveWatchlistArchiveSnapshot, "state"> & { state: MemberWatchlistSymbolState };

const cardFormats = new Set(["level_snapshot", "live_level_map", "level_extension"]);

function memberCard(card: LiveWatchlistCardContent): LiveWatchlistCardContent {
  return {
    ...card,
    ...(typeof card.source === "string" ? { source: cardFormats.has(card.source) ? card.source : "TradersLink" } : {}),
    ...(card.metadata ? { metadata: publicMarketMetadata(card.metadata) } : {}),
  };
}

function memberQuote(quote: MemberWatchlistQuote): MemberWatchlistQuote {
  // Explicit facts preserve prices, clocks and statistics without forwarding
  // upstream identity or future raw transport fields from stored quotes.
  const { symbol, updatedAt, fetchedAt, name, exchange, currency, open, high, low,
    lastTradePrice, lastTradeSize, lastTradeTime, bidPrice, bidSize, bidTime,
    askPrice, askSize, askTime, volume, change, changePercent, previousClosePrice,
    ethPrice, ethVolume, ethTime, marketCap, sharesOutstanding, sharesFloat, timestamp } = quote;
  return { symbol, updatedAt, fetchedAt, name, exchange, currency, open, high, low,
    lastTradePrice, lastTradeSize, lastTradeTime, bidPrice, bidSize, bidTime,
    askPrice, askSize, askTime, volume, change, changePercent, previousClosePrice,
    ethPrice, ethVolume, ethTime, marketCap, sharesOutstanding, sharesFloat, timestamp };
}

/** Pure and idempotent: used by member HTTP/RSC and the client's gated merge. */
export function memberWatchlistMarketData(state: MemberWatchlistSymbolState): MemberWatchlistSymbolState {
  const cards: MemberWatchlistSymbolState["cards"] = {};
  for (const [kind, card] of Object.entries(state.cards)) {
    if (card) cards[kind as keyof typeof cards] = memberCard(card);
  }
  return { ...state, cards,
    ...("extendedQuote" in state ? { extendedQuote: state.extendedQuote ? memberQuote(state.extendedQuote) : state.extendedQuote } : {}),
  };
}
