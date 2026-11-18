import { evaluatePartnerAlertChannelAccess } from "../contracts/partner-alert-access-policy";
import type { PartnerAlertRoleAuthority } from "./partner-alert-role-worker";
import { restrictPartnerAlertAccessToOffer, type PartnerAlertSubscriberOffer } from "./partner-alert-subscriber-access";

export async function preparePartnerAlertStripeCheckoutEligibility(target: PartnerAlertSubscriberOffer,
  authority: PartnerAlertRoleAuthority, nowUtc: () => string) {
  if (!authority.inCurrentWriter || target.mappingIds.length === 0) throw new Error("Checkout authority unavailable.");
  const snapshots: Awaited<ReturnType<PartnerAlertRoleAuthority["refresh"]>>[] = [];
  for (const mappingId of target.mappingIds) {
    snapshots.push(await authority.refresh({ communityId: target.communityId, userId: target.userId, mappingId }));
  }

  const assertEligible = () => {
    const now = nowUtc();
    const coveredMappings: string[] = [];
    for (const [index, snapshot] of snapshots.entries()) {
      const { input, ticket } = snapshot;
      if (!authority.isCurrent(ticket) || input.userId !== target.userId || input.communityId !== target.communityId
        || input.mappingId !== target.mappingIds[index]) throw new Error("Checkout eligibility changed.");
      const selected = restrictPartnerAlertAccessToOffer(input, target);
      if (!selected || (!selected.stripeFunding?.noLegacyWhopOffers
        && (input.membershipDiscovery !== "complete" || input.communityCoverageQualification.kind !== "qualified"))) {
        throw new Error("Checkout offer changed.");
      }
      const result = evaluatePartnerAlertChannelAccess({ ...selected, nowUtc: now });
      // This result requires current paid Premium, verified Discord, current
      // approved mapping and definitive absence of the selected offer's access.
      if (result.reason !== "subscription_required") throw new Error("Checkout eligibility could not be confirmed.");
      const whop = input.existingWhopAccess;
      const retainedByAnotherOffer = whop?.kind === "retained" && whop.observedAtUtc <= now && whop.validUntilUtc > now
        && whop.retainedOffers.some(offer => offer.offerId !== target.offerId || offer.offerVersion !== target.offerVersion);
      if (retainedByAnotherOffer || evaluatePartnerAlertChannelAccess({ ...input, nowUtc: now }).allowed) {
        coveredMappings.push(input.mappingId);
      }
    }
    return coveredMappings;
  };
  authority.inCurrentWriter(assertEligible);
  return assertEligible;
}
