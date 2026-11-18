import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { createPartnerAlertNativeStripePriceBinding, type StripeBindingScope } from "./partner-alert-stripe-native-price";
import { partnerStripeCheckoutClaimMetadata, partnerStripeId, type PartnerAlertStripeRequest } from "./partner-alert-stripe-paid-invoice";

export function createPartnerAlertNativeStripeCheckout(input: Parameters<typeof createPartnerAlertNativeStripePriceBinding>[0] & Readonly<{
  origin: string;
  stripeForAccount: (accountId: string) => PartnerAlertStripeRequest;
  authorizeCheckout: (request: Request, communityId: string, offerKey: string) => Promise<StripeBindingScope>;
}>) {
  const origin = new URL(input.origin);
  const livemode = input.environment === "live";
  const sessionPrefix = livemode ? "cs_live_" : "cs_test_";
  if (origin.origin !== input.origin || (origin.protocol !== "https:"
    && !(!livemode && origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname)))) {
    throw new Error("Stripe checkout requires an approved application origin.");
  }
  const { reserve, bindSession, closeExpiredSession } = createPartnerAlertNativeStripePriceBinding(input);
  const returnUrl = new URL("/partner-channels", origin).href;

  return async function checkout(request: Request, communityId: string, offerKey: string): Promise<Response> {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    try {
      requirePlatformMutationRequest(request);
      if (request.headers.get("origin") !== origin.origin) throw new Error("Stripe checkout origin mismatch.");
    } catch { return new Response(null, { status: 403 }); }

    try {
      const scope = await input.authorizeCheckout(request, communityId, offerKey);
      if (scope.communityId !== communityId || `${scope.offerId}:${scope.version}` !== offerKey) {
        return new Response(null, { status: 403 });
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const claim = await reserve(scope);
        if (claim.subscriptionId) return new Response(null, { status: 409 });
        const stripe = input.stripeForAccount(claim.sellerAccount);
        const session = claim.sessionId
          ? await stripe(`checkout/sessions/${partnerStripeId(claim.sessionId, sessionPrefix)}`)
          : await stripe("checkout/sessions", {
            mode: "subscription", "line_items[0][price]": claim.priceId, "line_items[0][quantity]": "1",
            client_reference_id: claim.claimId, [`metadata[${partnerStripeCheckoutClaimMetadata}]`]: claim.claimId,
            [`subscription_data[metadata][${partnerStripeCheckoutClaimMetadata}]`]: claim.claimId,
            success_url: returnUrl, cancel_url: returnUrl,
          }, `partner-checkout-${claim.claimId}`);
        const sessionId = partnerStripeId(session.id, sessionPrefix);
        if ((claim.sessionId && claim.sessionId !== sessionId) || session.client_reference_id !== claim.claimId
          || session.livemode !== livemode || session.mode !== "subscription") throw new Error("Stripe checkout scope changed.");
        if (session.status === "expired" && attempt === 0 && closeExpiredSession(scope, claim)) continue;
        if (session.status !== "open" || claim.historical) return new Response(null, { status: 409 });

        const url = new URL(String(session.url));
        if (url.origin !== "https://checkout.stripe.com" || url.username || url.password) {
          throw new Error("Invalid Stripe checkout link.");
        }
        bindSession(scope, claim, sessionId);
        return Response.json({ url: url.href }, { headers: { "cache-control": "private, no-store", vary: "Cookie" } });
      }
      return new Response(null, { status: 409 });
    } catch { return new Response(null, { status: 503 }); }
  };
}
