import type { LiveWatchlistSymbolState } from "./live-watchlist-types";

/**
 * The Server-Sent Event connection is a low-latency hint, not the source of
 * truth. A reconnect can land on another server instance, so the client must
 * never let a late stream event or an in-flight polling response move a symbol
 * backwards. The persisted watchlist state remains authoritative.
 */
export function isNewerLiveWatchlistSymbolState(
  current: LiveWatchlistSymbolState,
  incoming: LiveWatchlistSymbolState,
): boolean {
  const currentRevision = current.marketDataRevision;
  const incomingRevision = incoming.marketDataRevision;
  if (
    typeof currentRevision === "number" &&
    typeof incomingRevision === "number" &&
    currentRevision !== incomingRevision
  ) {
    return incomingRevision > currentRevision;
  }

  const currentObservedAt = current.latestPriceObservedAt;
  const incomingObservedAt = incoming.latestPriceObservedAt;
  if (
    typeof currentObservedAt === "number" &&
    typeof incomingObservedAt === "number" &&
    currentObservedAt !== incomingObservedAt
  ) {
    return incomingObservedAt > currentObservedAt;
  }

  return incoming.updatedAt >= current.updatedAt;
}

export function reconcileLiveWatchlistSnapshot(input: {
  current: LiveWatchlistSymbolState[];
  incoming: LiveWatchlistSymbolState[];
  generatedAt: number;
}): LiveWatchlistSymbolState[] {
  const currentBySymbol = new Map(input.current.map((symbol) => [symbol.symbol, symbol]));
  const incomingSymbols = new Set(input.incoming.map((symbol) => symbol.symbol));
  const reconciled = input.incoming.map((incoming) => {
    const current = currentBySymbol.get(incoming.symbol);
    return current && !isNewerLiveWatchlistSymbolState(current, incoming) ? current : incoming;
  });

  // Keep an SSE update that arrived after this polling response began. A later
  // authoritative poll will either include the symbol or safely remove it.
  for (const current of input.current) {
    if (!incomingSymbols.has(current.symbol) && current.updatedAt > input.generatedAt) {
      reconciled.push(current);
    }
  }
  return reconciled;
}
