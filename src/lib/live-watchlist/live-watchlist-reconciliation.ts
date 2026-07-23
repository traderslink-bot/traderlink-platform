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

/**
 * Reconcile card and quote freshness independently. Card publications can
 * arrive from a different server instance after the browser has already
 * received a newer ticker revision. In that case, preserve the newer quote
 * fields while still accepting newer card content.
 */
export function reconcileLiveWatchlistSymbolState(
  current: LiveWatchlistSymbolState,
  incoming: LiveWatchlistSymbolState,
): LiveWatchlistSymbolState {
  const incomingIsNewer = isNewerLiveWatchlistSymbolState(current, incoming);
  const preferred = incomingIsNewer ? incoming : current;
  const currentAiRead = current.cards.tradersLinkAiRead;
  const incomingAiRead = incoming.cards.tradersLinkAiRead;
  const currentAiStatusUpdatedAt =
    current.tradersLinkAiReadStatusUpdatedAt ?? currentAiRead?.updatedAt;
  const incomingAiStatusUpdatedAt =
    incoming.tradersLinkAiReadStatusUpdatedAt ?? incomingAiRead?.updatedAt;
  const cards: LiveWatchlistSymbolState["cards"] = {
    ...current.cards,
    ...incoming.cards,
  };

  for (const kind of new Set([
    ...Object.keys(current.cards),
    ...Object.keys(incoming.cards),
  ])) {
    const cardKind = kind as keyof LiveWatchlistSymbolState["cards"];
    const currentCard = current.cards[cardKind];
    const incomingCard = incoming.cards[cardKind];
    if (currentCard && incomingCard) {
      cards[cardKind] =
        incomingCard.updatedAt >= currentCard.updatedAt ? incomingCard : currentCard;
    }
  }

  if (
    currentAiRead &&
    !incomingAiRead &&
    incoming.tradersLinkAiReadStatus !== "ready" &&
    typeof incomingAiStatusUpdatedAt === "number" &&
    incomingAiStatusUpdatedAt >= currentAiRead.updatedAt
  ) {
    delete cards.tradersLinkAiRead;
  } else if (
    incomingAiRead &&
    !currentAiRead &&
    current.tradersLinkAiReadStatus !== "ready" &&
    typeof currentAiStatusUpdatedAt === "number" &&
    currentAiStatusUpdatedAt >= incomingAiRead.updatedAt
  ) {
    delete cards.tradersLinkAiRead;
  }

  const reconciledAiRead = cards.tradersLinkAiRead;
  let tradersLinkAiReadStatus = preferred.tradersLinkAiReadStatus;
  let tradersLinkAiReadStatusUpdatedAt =
    preferred.tradersLinkAiReadStatusUpdatedAt;
  if (reconciledAiRead) {
    if (incomingAiRead && reconciledAiRead === incomingAiRead) {
      tradersLinkAiReadStatus = incoming.tradersLinkAiReadStatus ?? "ready";
      tradersLinkAiReadStatusUpdatedAt =
        incomingAiStatusUpdatedAt ?? incomingAiRead.updatedAt;
    } else {
      tradersLinkAiReadStatus = current.tradersLinkAiReadStatus ?? "ready";
      tradersLinkAiReadStatusUpdatedAt =
        currentAiStatusUpdatedAt ?? currentAiRead?.updatedAt;
    }
  } else {
    const incomingStatusIsNewer =
      typeof incomingAiStatusUpdatedAt === "number" &&
      (typeof currentAiStatusUpdatedAt !== "number" ||
        incomingAiStatusUpdatedAt >= currentAiStatusUpdatedAt);
    tradersLinkAiReadStatus = incomingStatusIsNewer
      ? incoming.tradersLinkAiReadStatus
      : current.tradersLinkAiReadStatus;
    tradersLinkAiReadStatusUpdatedAt = incomingStatusIsNewer
      ? incomingAiStatusUpdatedAt
      : currentAiStatusUpdatedAt;
  }

  return {
    ...preferred,
    updatedAt: Math.max(current.updatedAt, incoming.updatedAt),
    cards,
    tradersLinkAiReadStatus,
    tradersLinkAiReadStatusUpdatedAt,
  };
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
    return current ? reconcileLiveWatchlistSymbolState(current, incoming) : incoming;
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
