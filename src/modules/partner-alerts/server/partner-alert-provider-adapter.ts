import type { PartnerAlertPricingCapabilities } from "../contracts/partner-alert-publishing-pricing";
import type { PartnerAlertResourceReceipt, PartnerAlertWhopOfferReceipt, PartnerAlertStripeOfferReceipt } from "./partner-alert-authority";
import type { PartnerAlertProviderVerificationResults } from "./partner-alert-provider-facts";
import type {
  PartnerAlertOfferVerificationTarget,
  PartnerAlertStripeOfferVerificationTarget,
  PartnerAlertProviderVerificationPlan,
  PartnerAlertResourceVerificationTarget,
} from "./partner-alert-provider-verification";

export type PartnerAlertProviderVerificationBindings = Readonly<{
  verifyDiscordResources: (target: PartnerAlertResourceVerificationTarget,
    signal: AbortSignal) => Promise<PartnerAlertResourceReceipt>;
  verifyWhopOffer: (target: PartnerAlertOfferVerificationTarget,
    signal: AbortSignal) => Promise<PartnerAlertWhopOfferReceipt>;
  verifyStripeOffer?: (target: PartnerAlertStripeOfferVerificationTarget,
    signal: AbortSignal) => Promise<PartnerAlertStripeOfferReceipt>;
  readPricingCapabilities: (signal: AbortSignal) => Promise<PartnerAlertPricingCapabilities>;
}>;

function current(signal: AbortSignal): void {
  if (signal.aborted) throw new Error("Partner provider verification was cancelled.");
}

/**
 * Isolated composition for already-preauthorized provider work. It owns no
 * credentials, fetch implementation or runtime enablement. Supplied bindings
 * may resolve credentials only when invoked here, after the HTTP writer has
 * authenticated the exact command. Checks run sequentially so cancellation
 * prevents later provider calls and bounds concurrent credential use to one.
 */
export function createPartnerAlertProviderVerifier(bindings: PartnerAlertProviderVerificationBindings) {
  if (typeof bindings.verifyDiscordResources !== "function"
    || typeof bindings.verifyWhopOffer !== "function"
    || typeof bindings.readPricingCapabilities !== "function") {
    throw new Error("Partner provider verification is unavailable.");
  }
  return async (plan: PartnerAlertProviderVerificationPlan,
    signal: AbortSignal): Promise<PartnerAlertProviderVerificationResults> => {
    current(signal);
    const resources: PartnerAlertResourceReceipt[] = [];
    for (const target of plan.resourceChecks) {
      current(signal);
      resources.push(await bindings.verifyDiscordResources(target, signal));
      current(signal);
    }
    const offers: PartnerAlertWhopOfferReceipt[] = [];
    for (const target of plan.offerChecks) {
      current(signal);
      offers.push(await bindings.verifyWhopOffer(target, signal));
      current(signal);
    }
    const stripeOffers: PartnerAlertStripeOfferReceipt[] = [];
    for (const target of plan.stripeOfferChecks ?? []) {
      current(signal);
      if (!bindings.verifyStripeOffer) throw new Error("Stripe offer verification is unavailable.");
      stripeOffers.push(await bindings.verifyStripeOffer(target, signal));
      current(signal);
    }
    let pricing: PartnerAlertPricingCapabilities | null = null;
    if (plan.pricingCapabilitiesRequired) {
      current(signal);
      pricing = await bindings.readPricingCapabilities(signal);
      current(signal);
    }
    return Object.freeze({ resources: Object.freeze(resources), offers: Object.freeze(offers), pricing,
      ...(stripeOffers.length ? { stripeOffers: Object.freeze(stripeOffers) } : {}) });
  };
}
