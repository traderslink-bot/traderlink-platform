import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { LiveWatchlistListPayload, LiveWatchlistListSymbol } from "@/src/lib/live-watchlist/live-watchlist-list";
import { readWatchlistTickerPolicy } from "./watchlist-analysis-visibility";

// Opaque per-process keys identify placeholders, never a reversible ticker encoding.
const placeholderSalt = randomBytes(32);
export function concealWatchlistTicker(item: LiveWatchlistListSymbol, showAdded = false): LiveWatchlistListSymbol {
  return {
    symbol: "premium-" + createHmac("sha256", placeholderSalt).update(item.symbol).digest("hex").slice(0,24),
    premiumTickerHidden: true,
    status: item.status,
    updatedAt: item.updatedAt,
    firstPostedAt: showAdded && typeof item.firstPostedAt === "number" && Number.isFinite(item.firstPostedAt) && item.firstPostedAt > 0 ? item.firstPostedAt : null,
    latestPrice: null,
    watchlistGroup: item.watchlistGroup,
    watchlistSlotState: item.watchlistSlotState,
    reversalWatchEligible: item.reversalWatchEligible,
    reversalWatchlistVisible: item.reversalWatchlistVisible,
    topRegularWatchlistVisible: item.topRegularWatchlistVisible,
  };
}

export function projectWatchlistTickerForViewer(item: LiveWatchlistListSymbol, headers: Headers): LiveWatchlistListSymbol | null {
  const policy=readWatchlistTickerPolicy(headers);
  if(!policy || (!policy.owner && (item.watchlistGroup === "private" || policy.privateSymbols.has(item.symbol)))) return {symbol:"watchlist-refresh",status:"deactivated",updatedAt:0,firstPostedAt:null,latestPrice:null};
  if (!policy.owner && policy.hiddenRows.has(item.symbol)) return policy.showAddedDates.has(item.symbol) ? concealWatchlistTicker(item, true) : null;
  return policy.all || !policy.restricted.has(item.symbol) ? item : concealWatchlistTicker(item, policy.showAddedDates.has(item.symbol));
}

export function projectWatchlistTickersForViewer(payload: LiveWatchlistListPayload, headers: Headers): LiveWatchlistListPayload {
  const policy = readWatchlistTickerPolicy(headers);
  const symbols = payload.symbols.flatMap(item => {
    if (!policy || (!policy.owner && (item.watchlistGroup === "private" || policy.privateSymbols.has(item.symbol)))) return [];
    if (!policy.owner && policy.hiddenRows.has(item.symbol)) return policy.showAddedDates.has(item.symbol) ? [concealWatchlistTicker(item, true)] : [];
    return [policy.all || !policy.restricted.has(item.symbol) ? item : concealWatchlistTicker(item, policy.showAddedDates.has(item.symbol))];
  });
  return { ...payload, symbols };
}
