import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { LiveWatchlistListPayload, LiveWatchlistListSymbol } from "@/src/lib/live-watchlist/live-watchlist-list";
import { canViewWatchlistTicker, readWatchlistTickerPolicy } from "./watchlist-analysis-visibility";

// Opaque per-process keys identify placeholders, never a reversible ticker encoding.
const placeholderSalt = randomBytes(32);
export function concealWatchlistTicker(item: LiveWatchlistListSymbol): LiveWatchlistListSymbol {
  return {
    symbol: "premium-" + createHmac("sha256", placeholderSalt).update(item.symbol).digest("hex").slice(0,24),
    premiumTickerHidden: true,
    status: item.status,
    updatedAt: item.updatedAt,
    firstPostedAt: null,
    latestPrice: null,
    watchlistGroup: item.watchlistGroup,
    watchlistSlotState: item.watchlistSlotState,
    reversalWatchEligible: item.reversalWatchEligible,
    reversalWatchlistVisible: item.reversalWatchlistVisible,
    topRegularWatchlistVisible: item.topRegularWatchlistVisible,
  };
}

export function projectWatchlistTickerForViewer(item: LiveWatchlistListSymbol, headers: Headers): LiveWatchlistListSymbol {
  return canViewWatchlistTicker(headers, item.symbol) ? item : concealWatchlistTicker(item);
}

export function projectWatchlistTickersForViewer(payload: LiveWatchlistListPayload, headers: Headers): LiveWatchlistListPayload {
  const policy = readWatchlistTickerPolicy(headers);
  return { ...payload, symbols: payload.symbols.map(item => policy && (policy.all || !policy.restricted.has(item.symbol)) ? item : concealWatchlistTicker(item)) };
}
