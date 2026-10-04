import { buildPremiumAnalysisPreview } from "./premium-analysis-preview";
import { parseTradersLinkAiRead } from "./traderslink-ai-read";
import type { LiveWatchlistSymbolState } from "./live-watchlist-types";

export function watchlistDetailProjection(state: LiveWatchlistSymbolState, analysisAllowed: boolean, pricesAllowed = state.premiumAnalysisPricesAllowed !== false): LiveWatchlistSymbolState {
  const cards = { ...state.cards };
  let premiumAnalysisPreview = state.premiumAnalysisPreview ?? null;
  if (!analysisAllowed) premiumAnalysisPreview = null;
  if (analysisAllowed && !pricesAllowed) {
    const body = cards.tradersLinkAiRead?.body;
    const read = body ? parseTradersLinkAiRead(body) : null;
    premiumAnalysisPreview = read && state.tradersLinkAiReadCardVisible !== false ? buildPremiumAnalysisPreview(read) : premiumAnalysisPreview;
  }
  if (!analysisAllowed || !pricesAllowed || premiumAnalysisPreview) {
    delete cards.tradersLinkAiRead;
    delete cards.liveTraderRead;
  }
  return { ...state, cards, premiumAnalysisPricesAllowed: pricesAllowed, premiumAnalysisPreview, membershipAnalysisAllowed: analysisAllowed,
    ...(!analysisAllowed || !pricesAllowed || premiumAnalysisPreview ? { latestTraderReadHeadline: null, tradersLinkAiReadStatus: undefined,
      tradersLinkAiReadStatusUpdatedAt: undefined } : {}) };
}
