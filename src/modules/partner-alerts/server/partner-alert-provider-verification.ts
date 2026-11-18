import type { PartnerAlertCheckoutOffer, PartnerAlertOffer, PartnerAlertStripeOffer } from "../contracts/partner-alert-contracts";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { parsePartnerAlertNewStripeOffer, partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import type { PartnerAlertPreparedCommand } from "./partner-alert-request-boundary";
import type { PartnerAlertPrivateView } from "./partner-alert-read-model";

export type PartnerAlertResourceVerificationTarget = Readonly<{
  communityId: string;
  sourceGuildId: string;
  sourceChannelId: string;
  destinationGuildId: string;
  destinationChannelId: string;
  destinationRoleId: string;
}>;

export type PartnerAlertOfferVerificationTarget = Readonly<{
  communityId: string;
  offer: PartnerAlertOffer;
}>;

export type PartnerAlertStripeOfferVerificationTarget = Readonly<{
  communityId: string;
  offer: PartnerAlertStripeOffer;
}>;

export type PartnerAlertProviderVerificationPlan = Readonly<{
  action: PartnerAlertPreparedCommand["command"]["action"];
  communityId: string;
  requestId: string;
  resourceChecks: readonly PartnerAlertResourceVerificationTarget[];
  offerChecks: readonly PartnerAlertOfferVerificationTarget[];
  stripeOfferChecks?: readonly PartnerAlertStripeOfferVerificationTarget[];
  pricingCapabilitiesRequired: boolean;
}>;

function fail(): never {
  throw new PartnerAlertValidationError("providerPreauthorization", "Reload these settings before verification.");
}

function resourceTarget(input: PartnerAlertResourceVerificationTarget): PartnerAlertResourceVerificationTarget {
  return Object.freeze({ ...input });
}

/**
 * Pure exact-plan derivation after the caller has completed the authenticated
 * private read. It performs no I/O and grants no authority. A stale or
 * mismatched command fails before credentials or provider transports are used.
 */
export function planPartnerAlertProviderVerification(
  prepared: PartnerAlertPreparedCommand,
  view: PartnerAlertPrivateView,
  destinationGuildIdValue: string,
): PartnerAlertProviderVerificationPlan {
  const destinationGuildId = partnerAlertSnowflake(destinationGuildIdValue, "destinationGuildId");
  const command = prepared.command;
  if (command.communityId !== view.communityId || command.expectedRevision !== view.revision) fail();
  const resourceChecks: PartnerAlertResourceVerificationTarget[] = [];
  const offerChecks: PartnerAlertOfferVerificationTarget[] = [];
  const stripeOfferChecks: PartnerAlertStripeOfferVerificationTarget[] = [];
  const checkOffer = (offer: PartnerAlertCheckoutOffer) => {
    if ("whop" in offer) offerChecks.push(Object.freeze({ communityId: view.communityId, offer }));
    else stripeOfferChecks.push(Object.freeze({ communityId: view.communityId, offer }));
  };
  let pricingCapabilitiesRequired = false;
  switch (command.action) {
    case "saveOfferVersion":
      checkOffer(parsePartnerAlertNewStripeOffer(command.offer));
      break;
    case "submitRequest":
      for (const current of view.offers) checkOffer(current.offer);
      break;
    case "proposePublishingAgreement":
      pricingCapabilitiesRequired = true;
      break;
    case "approveMapping": {
      const mapping = view.mappings.find((item) => item.mappingId === command.mappingId);
      if (!mapping || mapping.revision !== command.expectedMappingRevision || mapping.reviewState !== "awaiting_approval") fail();
      resourceChecks.push(resourceTarget({
        communityId: view.communityId,
        sourceGuildId: view.sourceGuildId,
        sourceChannelId: mapping.sourceChannelId,
        destinationGuildId,
        destinationChannelId: command.destinationChannelId,
        destinationRoleId: command.destinationRoleId,
      }));
      break;
    }
    case "approveOffer": {
      const current = view.offers.find((item) => item.offer.offerId === command.offerId
        && item.offer.version === command.offerVersion && item.reviewState === "awaiting_approval");
      if (!current) fail();
      checkOffer(current.offer);
      break;
    }
    case "activatePartner":
    case "approvePartner":
      for (const mapping of view.mappings) {
        if (mapping.reviewState === "withdrawn") continue;
        if (mapping.reviewState !== "approved" || mapping.approvedRevision !== mapping.revision
          || !mapping.destinationGuildId || !mapping.destinationChannelId || !mapping.destinationRoleId) fail();
        resourceChecks.push(resourceTarget({
          communityId: view.communityId,
          sourceGuildId: view.sourceGuildId,
          sourceChannelId: mapping.sourceChannelId,
          destinationGuildId: mapping.destinationGuildId,
          destinationChannelId: mapping.destinationChannelId,
          destinationRoleId: mapping.destinationRoleId,
        }));
      }
      for (const current of view.offers) {
        if (current.reviewState !== "approved") fail();
        checkOffer(current.offer);
      }
      break;
    default:
      break;
  }
  return Object.freeze({
    action: command.action,
    communityId: view.communityId,
    requestId: prepared.requestId,
    resourceChecks: Object.freeze(resourceChecks),
    offerChecks: Object.freeze(offerChecks),
    ...(stripeOfferChecks.length ? { stripeOfferChecks: Object.freeze(stripeOfferChecks) } : {}),
    pricingCapabilitiesRequired,
  });
}
