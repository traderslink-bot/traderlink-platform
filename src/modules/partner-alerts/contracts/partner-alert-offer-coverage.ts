import { PartnerAlertValidationError, type PartnerAlertCheckoutOffer } from "./partner-alert-contracts";
import { PARTNER_ALERT_MAX_SELECTION, parsePartnerAlertCheckoutOffer, partnerAlertId, partnerAlertIds } from "./partner-alert-validation";

/** Submission coverage is the union of individual and package offers. The
 * caller supplies its current, server-owned community/mapping snapshot. This
 * validates coverage only; it grants no approval, payment or provider authority. */
export function requirePartnerAlertOfferCoverage(
  communityIdValue: string,
  mappingIdsValue: readonly string[],
  offerValues: readonly unknown[],
): readonly PartnerAlertCheckoutOffer[] {
  const communityId = partnerAlertId(communityIdValue, "communityId");
  const mappingIds = partnerAlertIds(mappingIdsValue, "mappingIds");
  if (!Array.isArray(offerValues) || offerValues.length === 0 || offerValues.length > PARTNER_ALERT_MAX_SELECTION) {
    throw new PartnerAlertValidationError("offers", "Add a channel subscription or package covering every selected channel.");
  }
  const offers = offerValues.map(parsePartnerAlertCheckoutOffer);
  const available = new Set(mappingIds);
  const covered = new Set<string>();
  const identities = new Set<string>();
  for (const offer of offers) {
    if (offer.communityId !== communityId || identities.has(offer.offerId)
      || offer.mappingIds.some(id => !available.has(id))) {
      throw new PartnerAlertValidationError("offers", "Choose offers for this server’s selected channels only.");
    }
    identities.add(offer.offerId);
    for (const id of offer.mappingIds) covered.add(id);
  }
  if (mappingIds.some(id => !covered.has(id))) {
    throw new PartnerAlertValidationError("offers", "Add a channel subscription or package covering every selected channel.");
  }
  return Object.freeze(offers);
}
