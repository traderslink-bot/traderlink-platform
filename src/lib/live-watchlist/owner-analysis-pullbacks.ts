import type { TradersLinkAiReadPayload, TradersLinkAiReadPullbackScenario } from "./live-watchlist-types";
import { sortPullbacksByPrice } from "./pullback-price-order";

/** Ordered owner list overrides the legacy pair, including an explicitly empty list. */
export function analysisPullbacks(read: TradersLinkAiReadPayload): Array<TradersLinkAiReadPullbackScenario & { hidden?: boolean }> {
  if (read.ownerPullbacks !== undefined) return sortPullbacksByPrice(read.ownerPullbacks,"zoneLow","zoneHigh");
  if (read.version === 2) return [];
  const hidden=new Set(read.ownerHiddenSections ?? []);
  return sortPullbacksByPrice((["shallow","deep"] as const).flatMap(key=>read.pullbackPlans[key]
    ? [{...read.pullbackPlans[key]!,hidden:hidden.has(key)}] : []),"zoneLow","zoneHigh");
}
