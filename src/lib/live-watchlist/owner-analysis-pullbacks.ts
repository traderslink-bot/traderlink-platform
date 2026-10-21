import type { TradersLinkAiReadPayload, TradersLinkAiReadPullbackScenario } from "./live-watchlist-types";

/** Ordered owner list overrides the legacy pair, including an explicitly empty list. */
export function analysisPullbacks(read: TradersLinkAiReadPayload): Array<TradersLinkAiReadPullbackScenario & { hidden?: boolean }> {
  if (read.ownerPullbacks !== undefined) return read.ownerPullbacks;
  if (read.version === 2) return [];
  const hidden=new Set(read.ownerHiddenSections ?? []);
  return (["shallow","deep"] as const).flatMap(key=>read.pullbackPlans[key]
    ? [{...read.pullbackPlans[key]!,hidden:hidden.has(key)}] : []);
}
