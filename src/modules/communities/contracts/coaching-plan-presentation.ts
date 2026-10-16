import type {TraderLinkCommunityCoachingPlan} from "./traderlink-community-platform-contracts";

/** Stored numeric terms are authoritative; legacy labels remain a fallback. */
export function coachingPlanPriceLabel(plan: Pick<TraderLinkCommunityCoachingPlan,"quoteRequired"|"priceAmountMinor"|"currency"|"priceLabel">):string {
  if(plan.quoteRequired)return "Quote required";
  return plan.priceAmountMinor===null?plan.priceLabel||"Contact coach":`${plan.currency} ${(plan.priceAmountMinor/100).toFixed(2)}`;
}
