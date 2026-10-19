import type { PlatformMembershipCatalogPlan } from "./platform-membership-catalog-repository";

type Offer = PlatformMembershipCatalogPlan["offers"][number];
const supportsAddon = (offer: Offer) => offer.accessDurationDays === null &&
  (offer.billingKind === "free" || (offer.provider === "stripe" && offer.billingKind === "recurring" &&
    offer.billingInterval === "month" && offer.billingIntervalCount === 1));

/** Inputs must already be public and filtered for any ticker-specific policy.
 * Matching add-ons need a selectable base; contextual bases do not claim the
 * requested feature themselves. Never widen the matching add-on selection.
 */
export function membershipUpgradeCatalog(
  matching: readonly PlatformMembershipCatalogPlan[],
  publicCatalog: readonly PlatformMembershipCatalogPlan[],
): readonly PlatformMembershipCatalogPlan[] {
  const addonPrices = matching.filter(plan => plan.packageType === "addon")
    .flatMap(plan => plan.offers.filter(supportsAddon));
  if (!addonPrices.length) return matching;
  const selected = new Set(matching.map(plan => plan.planVersionId));
  return publicCatalog.filter(plan => selected.has(plan.planVersionId) ||
    (plan.packageType !== "addon" && plan.offers.some(base => supportsAddon(base) &&
      addonPrices.some(addon => base.billingKind === "free" || addon.billingKind === "free" || base.currency === addon.currency))));
}
