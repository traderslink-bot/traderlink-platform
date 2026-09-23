import type {
  LiveWatchlistCardContent,
  LiveWatchlistStatePayload,
  LiveWatchlistSymbolState,
} from "./live-watchlist-types";
import { isNewerLiveWatchlistSymbolState } from "./live-watchlist-reconciliation";

/** Transport for the list only. Detail and legacy API consumers keep full state. */
export type LiveWatchlistListSymbol = Pick<LiveWatchlistSymbolState,
  "symbol" | "status" | "updatedAt" | "firstPostedAt" | "watchlistGroup" |
  "watchlistSlotState" | "reversalWatchEligible" | "reversalWatchAttemptReady" |
  "reversalWatchlistVisible" | "topRegularWatchlistVisible" |
  "watchlistLifecycleLabelsVisible" | "watchlistLifecycle" | "latestPrice" |
  "latestPriceObservedAt" | "marketDataRevision"
> & {
  companyInfo?: {
    updatedAt: number;
    country?: NonNullable<LiveWatchlistCardContent["metadata"]>[string];
  };
};

export type LiveWatchlistListPayload = Omit<LiveWatchlistStatePayload, "symbols"> & {
  symbols: LiveWatchlistListSymbol[];
};

export function projectLiveWatchlistListSymbol(state: LiveWatchlistSymbolState): LiveWatchlistListSymbol {
  return {
    symbol: state.symbol,
    status: state.status,
    updatedAt: state.updatedAt,
    firstPostedAt: state.firstPostedAt,
    watchlistGroup: state.watchlistGroup,
    watchlistSlotState: state.watchlistSlotState,
    reversalWatchEligible: state.reversalWatchEligible,
    reversalWatchAttemptReady: state.reversalWatchAttemptReady,
    reversalWatchlistVisible: state.reversalWatchlistVisible,
    topRegularWatchlistVisible: state.topRegularWatchlistVisible,
    watchlistLifecycleLabelsVisible: state.watchlistLifecycleLabelsVisible,
    watchlistLifecycle: state.watchlistLifecycle,
    latestPrice: state.latestPrice,
    latestPriceObservedAt: state.latestPriceObservedAt,
    marketDataRevision: state.marketDataRevision,
    companyInfo: state.cards.companyInfo ? {
      updatedAt: state.cards.companyInfo.updatedAt,
      country: state.cards.companyInfo.metadata?.country,
    } : undefined,
  };
}

export function projectLiveWatchlistList(
  state: LiveWatchlistStatePayload | LiveWatchlistListPayload,
): LiveWatchlistListPayload {
  return {
    ...state,
    // An older server may ignore ?view=list during a rollback. Accept its full
    // response as well, without dropping the flag or keeping detail data.
    symbols: state.symbols.map((symbol) => "cards" in symbol
      ? projectLiveWatchlistListSymbol(symbol) : symbol),
  };
}

function reconcileListSymbol(
  current: LiveWatchlistListSymbol,
  incoming: LiveWatchlistListSymbol,
): LiveWatchlistListSymbol {
  const preferred = isNewerLiveWatchlistSymbolState(current, incoming) ? incoming : current;
  // Country comes from a card, whose revision can be independent of live quotes.
  const companyInfo = current.companyInfo && incoming.companyInfo
    ? (incoming.companyInfo.updatedAt >= current.companyInfo.updatedAt
      ? incoming.companyInfo : current.companyInfo)
    : incoming.companyInfo ?? current.companyInfo;
  return { ...preferred, updatedAt: Math.max(current.updatedAt, incoming.updatedAt), companyInfo };
}

export function reconcileLiveWatchlistListSnapshot(input: {
  current: LiveWatchlistListSymbol[];
  incoming: LiveWatchlistListSymbol[];
  generatedAt: number;
}): LiveWatchlistListSymbol[] {
  const currentBySymbol = new Map(input.current.map((symbol) => [symbol.symbol, symbol]));
  const incomingSymbols = new Set(input.incoming.map((symbol) => symbol.symbol));
  const reconciled = input.incoming.map((incoming) => {
    const current = currentBySymbol.get(incoming.symbol);
    return current ? reconcileListSymbol(current, incoming) : incoming;
  });
  for (const current of input.current) {
    if (!incomingSymbols.has(current.symbol) && current.updatedAt > input.generatedAt) {
      reconciled.push(current);
    }
  }
  return reconciled;
}

export function mergeLiveWatchlistListSymbol(
  symbols: LiveWatchlistListSymbol[], next: LiveWatchlistListSymbol,
): LiveWatchlistListSymbol[] {
  const existing = symbols.find((item) => item.symbol === next.symbol);
  const reconciled = existing ? reconcileListSymbol(existing, next) : next;
  const without = symbols.filter((item) => item.symbol !== next.symbol);
  if (reconciled.status === "deactivated") return without;
  return [reconciled, ...without].sort((left, right) =>
    (right.firstPostedAt ?? right.updatedAt) - (left.firstPostedAt ?? left.updatedAt) ||
    left.symbol.localeCompare(right.symbol));
}
