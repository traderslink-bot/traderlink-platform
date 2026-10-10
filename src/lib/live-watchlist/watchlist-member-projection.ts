import { buildPremiumAnalysisPreview } from "./premium-analysis-preview";
import { parseTradersLinkAiRead } from "./traderslink-ai-read";
import type { LiveWatchlistSymbolState } from "./live-watchlist-types";

export function watchlistDetailProjection(state: LiveWatchlistSymbolState, analysisAllowed: boolean, pricesAllowed = state.premiumAnalysisPricesAllowed !== false, levelsAllowed = state.premiumLevelsAllowed !== false, upgradeLinks = state.watchlistUpgradeLinks): LiveWatchlistSymbolState {
  const cards = { ...state.cards };
  if (!levelsAllowed) {
    delete cards.fullLadder;
    delete cards.nearestSupportResistance;
    // Preserve only the price/date shell. Never forward HTML, prose or metadata containing levels.
    if(cards.levelMap) cards.levelMap={source:cards.levelMap.source,title:'Potential Path',body:'',updatedAt:cards.levelMap.updatedAt,priceWhenPosted:cards.levelMap.priceWhenPosted};
  }
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
  return { ...state, cards, watchlistUpgradeLinks: upgradeLinks, premiumLevelsAllowed: levelsAllowed,
    ...(!levelsAllowed ? {nearestSupport:null,nearestResistance:null,nearestSupportLabel:null,nearestResistanceLabel:null,
      levelMap:state.levelMap ? {currentPrice:state.levelMap.currentPrice,rangeState:state.levelMap.rangeState,
        overnightReference:state.levelMap.overnightReference,nearestSupport:null,nearestResistance:null,nextStrongSupport:null,nextStrongResistance:null,supportLevels:[],resistanceLevels:[]} : null} : {}),
    premiumAnalysisPricesAllowed: pricesAllowed, premiumAnalysisPreview, membershipAnalysisAllowed: analysisAllowed,
    ...(!analysisAllowed || !pricesAllowed || premiumAnalysisPreview ? { latestTraderReadHeadline: null, tradersLinkAiReadStatus: undefined,
      tradersLinkAiReadStatusUpdatedAt: undefined } : {}) };
}
