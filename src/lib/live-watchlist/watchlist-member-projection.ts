import type { LiveWatchlistSymbolState } from "./live-watchlist-types";

export function watchlistDetailProjection(state: LiveWatchlistSymbolState, analysisAllowed: boolean): LiveWatchlistSymbolState {
  const cards = { ...state.cards };
  if (!analysisAllowed) {
    delete cards.tradersLinkAiRead;
    delete cards.liveTraderRead;
  }
  return { ...state, cards, membershipAnalysisAllowed: analysisAllowed,
    ...(!analysisAllowed ? { latestTraderReadHeadline: null, tradersLinkAiReadStatus: undefined,
      tradersLinkAiReadStatusUpdatedAt: undefined } : {}) };
}
