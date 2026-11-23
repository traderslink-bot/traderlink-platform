import { buildPremiumAnalysisPreview } from "./premium-analysis-preview";
import { buildPremiumLevelsPreview } from "./premium-level-preview";
import { parseTradersLinkAiRead } from "./traderslink-ai-read";
import { memberWatchlistMarketData, type MemberWatchlistSymbolState as LiveWatchlistSymbolState } from "./watchlist-member-market-data";

export function watchlistDetailProjection(state: LiveWatchlistSymbolState, analysisAllowed: boolean, pricesAllowed = state.premiumAnalysisPricesAllowed !== false, levelsAllowed = state.premiumLevelsAllowed !== false, upgradeLinks = state.watchlistUpgradeLinks, indicatorsAllowed = state.membershipIndicatorsAllowed !== false, premiumIndicatorsAllowed = state.premiumIndicatorsAllowed !== false, membershipLevelsAllowed = state.membershipLevelsAllowed !== false): LiveWatchlistSymbolState {
  indicatorsAllowed = indicatorsAllowed && premiumIndicatorsAllowed;
  const indicatorCardOwnerVisible = state.indicatorCardOwnerVisible ?? (state.indicatorCardVisible !== false);
  const cards = { ...state.cards };
  const premiumLevelsPreview = !levelsAllowed
    ? state.premiumLevelsPreview ?? buildPremiumLevelsPreview(state.levelMap)
    : null;
  if (!indicatorsAllowed) delete cards.technicalContext;
  if (!levelsAllowed) {
    delete cards.fullLadder;
    delete cards.nearestSupportResistance;
    // Preserve only the price/date shell. Never forward HTML, prose or metadata containing levels.
    if(cards.levelMap) cards.levelMap={source:cards.levelMap.source,title:'Potential Path',body:'',updatedAt:cards.levelMap.updatedAt,priceWhenPosted:cards.levelMap.priceWhenPosted};
  }
  let premiumAnalysisPreview = state.tradersLinkAiReadCardVisible === false ? null : !analysisAllowed || !pricesAllowed ? state.premiumAnalysisPreview ?? null : null;
  if (!analysisAllowed || !pricesAllowed) {
    const body = cards.tradersLinkAiRead?.body;
    const read = body ? parseTradersLinkAiRead(body) : null;
    premiumAnalysisPreview = read && state.tradersLinkAiReadCardVisible !== false ? buildPremiumAnalysisPreview(read) : premiumAnalysisPreview;
  }
  if (!analysisAllowed || !pricesAllowed || premiumAnalysisPreview) {
    delete cards.tradersLinkAiRead;
    delete cards.liveTraderRead;
  }
  return memberWatchlistMarketData({ ...state, cards, indicatorCardOwnerVisible, membershipLevelsAllowed, premiumLevelsPreview, premiumIndicatorsAllowed, membershipIndicatorsAllowed: indicatorsAllowed, ...(!indicatorsAllowed ? { indicatorCardVisible: false } : {}), watchlistUpgradeLinks: upgradeLinks, premiumLevelsAllowed: levelsAllowed,
    ...(!levelsAllowed ? {nearestSupport:null,nearestResistance:null,nearestSupportLabel:null,nearestResistanceLabel:null,
      levelMap:state.levelMap ? {currentPrice:state.levelMap.currentPrice,rangeState:state.levelMap.rangeState,
        overnightReference:state.levelMap.overnightReference,nearestSupport:null,nearestResistance:null,nextStrongSupport:null,nextStrongResistance:null,supportLevels:[],resistanceLevels:[]} : null} : {}),
    premiumAnalysisPricesAllowed: pricesAllowed, premiumAnalysisPreview, membershipAnalysisAllowed: analysisAllowed,
    ...(!analysisAllowed || !pricesAllowed || premiumAnalysisPreview ? { latestTraderReadHeadline: null, tradersLinkAiReadStatus: undefined,
      tradersLinkAiReadStatusUpdatedAt: undefined } : {}) });
}
