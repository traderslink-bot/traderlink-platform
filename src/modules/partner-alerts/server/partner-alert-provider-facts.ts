import type { PartnerAlertPricingCapabilities } from "../contracts/partner-alert-publishing-pricing";
import { parsePartnerAlertCurrency, parsePartnerAlertOffer, parsePartnerAlertCheckoutOffer } from "../contracts/partner-alert-validation";
import type {
  PartnerAlertResourceReceipt,
  PartnerAlertWhopOfferReceipt,
  PartnerAlertStripeOfferReceipt,
} from "./partner-alert-authority";
import type {
  PartnerAlertOfferVerificationTarget,
  PartnerAlertStripeOfferVerificationTarget,
  PartnerAlertProviderVerificationPlan,
  PartnerAlertResourceVerificationTarget,
} from "./partner-alert-provider-verification";

export type PartnerAlertProviderVerificationResults = Readonly<{
  resources: readonly PartnerAlertResourceReceipt[];
  offers: readonly PartnerAlertWhopOfferReceipt[];
  stripeOffers?: readonly PartnerAlertStripeOfferReceipt[];
  pricing: PartnerAlertPricingCapabilities | null;
}>;

export type PartnerAlertProviderFactSet = Readonly<{
  plan: PartnerAlertProviderVerificationPlan;
  requireResources: (target: PartnerAlertResourceVerificationTarget) => PartnerAlertResourceReceipt;
  requireWhopOffer: (communityId: string, offer: PartnerAlertOfferVerificationTarget["offer"]) => PartnerAlertWhopOfferReceipt;
  requireStripeOffer: (communityId: string, offer: PartnerAlertStripeOfferVerificationTarget["offer"]) => PartnerAlertStripeOfferReceipt;
  pricingCapabilities: () => PartnerAlertPricingCapabilities;
  destroy: () => void;
}>;

const liveFactSets = new WeakSet<object>();

function fail(): never {
  throw new Error("Partner provider verification is unavailable.");
}

function resourceKey(value: PartnerAlertResourceVerificationTarget): string {
  return JSON.stringify([value.communityId, value.sourceGuildId, value.sourceChannelId,
    value.destinationGuildId, value.destinationChannelId, value.destinationRoleId]);
}

function offerKey(value: PartnerAlertOfferVerificationTarget | PartnerAlertStripeOfferVerificationTarget): string {
  return JSON.stringify([value.communityId, value.offer]);
}

function verifiedResource(receipt: PartnerAlertResourceReceipt): PartnerAlertResourceReceipt {
  if ([receipt.sourceTextChannel, receipt.sourceReadable, receipt.messageContentAvailable,
    receipt.destinationReadOnly, receipt.destinationPrivate, receipt.destinationRoleManageable,
    receipt.destinationRoleExclusiveToTradersLink].some(value => value !== true)) fail();
  return Object.freeze({ ...receipt });
}

function verifiedOffer(receipt: PartnerAlertWhopOfferReceipt): PartnerAlertWhopOfferReceipt {
  const offer = parsePartnerAlertOffer(structuredClone(receipt.offer));
  const binding = Object.freeze({ ...receipt.binding });
  if (receipt.membershipVerificationAuthorised !== true
    || binding.environment !== offer.whop.environment
    || binding.accountId !== offer.whop.accountId
    || binding.productId !== offer.whop.productId
    || binding.planId !== offer.whop.planId) fail();
  return Object.freeze({ ...receipt, binding, offer });
}

/**
 * Converts one complete provider response into synchronous request-local facts.
 * Every planned fact must appear exactly once and no unplanned fact is accepted.
 * The returned capability is authentic only while live and is destroyed after
 * the owning mutation attempt, whether that attempt applies or fails.
 */
export function createPartnerAlertProviderFactSet(
  plan: PartnerAlertProviderVerificationPlan,
  results: PartnerAlertProviderVerificationResults,
): PartnerAlertProviderFactSet {
  if (!Array.isArray(results.resources) || !Array.isArray(results.offers)
    || results.resources.length !== plan.resourceChecks.length
    || results.offers.length !== plan.offerChecks.length
    || (results.stripeOffers?.length ?? 0) !== (plan.stripeOfferChecks?.length ?? 0)
    || (results.pricing === null) === plan.pricingCapabilitiesRequired) fail();

  const resources = new Map<string, PartnerAlertResourceReceipt>();
  for (const receipt of results.resources) {
    const value = verifiedResource(receipt);
    const key = resourceKey(value);
    if (resources.has(key) || !plan.resourceChecks.some(target => resourceKey(target) === key)) fail();
    resources.set(key, value);
  }
  const offers = new Map<string, PartnerAlertWhopOfferReceipt>();
  for (const receipt of results.offers) {
    const value = verifiedOffer(receipt);
    const key = offerKey({ communityId: value.communityId, offer: value.offer });
    if (offers.has(key) || !plan.offerChecks.some(target => offerKey(target) === key)) fail();
    offers.set(key, value);
  }
  if (plan.resourceChecks.some(target => !resources.has(resourceKey(target)))
    || plan.offerChecks.some(target => !offers.has(offerKey(target)))) fail();

  const stripeOffers = new Map<string, PartnerAlertStripeOfferReceipt>();
  for (const receipt of results.stripeOffers ?? []) {
    const offer = parsePartnerAlertCheckoutOffer(structuredClone(receipt.offer));
    if (!("billingProvider" in offer) || !/^acct_[A-Za-z0-9_]{1,123}$/u.test(receipt.sellerAccountId)
      || receipt.environment !== "sandbox" && receipt.environment !== "live") fail();
    const key = offerKey({ communityId: receipt.communityId, offer });
    if (stripeOffers.has(key) || !plan.stripeOfferChecks?.some(target => offerKey(target) === key)) fail();
    stripeOffers.set(key, Object.freeze({ ...receipt, offer }));
  }
  const pricing = results.pricing === null ? null : Object.freeze({
    currencies: Object.freeze(results.pricing.currencies.map(parsePartnerAlertCurrency)),
    calendarMonthCadence: results.pricing.calendarMonthCadence,
  });
  if (pricing && typeof pricing.calendarMonthCadence !== "boolean") fail();

  let active = true;
  const current = (): void => {
    if (!active || !liveFactSets.has(factSet)) fail();
  };
  const factSet: PartnerAlertProviderFactSet = Object.freeze({
    plan,
    requireResources: target => {
      current();
      return resources.get(resourceKey(target)) ?? fail();
    },
    requireWhopOffer: (communityId, offer) => {
      current();
      return offers.get(offerKey({ communityId, offer })) ?? fail();
    },
    requireStripeOffer: (communityId, offer) => {
      current();
      return stripeOffers.get(offerKey({ communityId, offer })) ?? fail();
    },
    pricingCapabilities: () => {
      current();
      return pricing ?? fail();
    },
    destroy: () => {
      if (!active) return;
      active = false;
      resources.clear(); offers.clear(); stripeOffers.clear(); liveFactSets.delete(factSet);
    },
  });
  liveFactSets.add(factSet);
  return factSet;
}

export function requirePartnerAlertProviderFactSet(
  value: PartnerAlertProviderFactSet,
  plan: PartnerAlertProviderVerificationPlan,
): PartnerAlertProviderFactSet {
  if (!liveFactSets.has(value) || value.plan !== plan) fail();
  return value;
}
