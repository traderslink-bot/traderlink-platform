import "server-only";

import type { NextRequest } from "next/server";
import { partnerAlertOwnerReviewRequestDenied } from "./partner-alert-owner-review-request";

import { withPartnerAlertRequestRuntime } from "./partner-alert-request-runtime";
import { readPartnerAlertStripeBillingConfiguration } from "./partner-alert-stripe-billing-runtime";
import { stripeOnboardingConfiguration, withStripeOnboarding } from "./partner-alert-stripe-onboarding-runtime";
import { requireTraderLinkPlatformRequestScope } from "../../platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "../../platform/server/database/open-readonly-platform-database";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";

export async function partnerAlertStripeConnectCallback(request: NextRequest, environment: PartnerAlertEnvironment): Promise<Response> {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  const native = readPartnerAlertStripeBillingConfiguration();
  const preview = environment === "sandbox" && !native && !process.env.PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET
    ? stripeOnboardingConfiguration() : null;
  const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  if (!(native?.environment === environment && native.clientId) && !preview?.clientId) {
    return new Response(null, { status: 404, headers });
  }
  try {
    const owner = requireTraderLinkPlatformRequestScope(request.headers, { environment: process.env }).userId;
    const query = new URL(request.url).searchParams;
    const state = query.get("state") ?? "";
    const code = query.get("code");
    const location = preview
      ? await withStripeOnboarding(preview, (_service, oauth) =>
        oauth?.finish(state, code, owner, (communityId, slug) => withReadonlyPlatformDatabase({}, db => Boolean(db.prepare(
          "SELECT 1 FROM traderlink_communities WHERE community_id=? AND slug=? AND owner_user_id=? AND status!='removed'",
        ).get(communityId, slug, owner)))) ?? Promise.resolve(null))
      : await withPartnerAlertRequestRuntime(request, runtime => runtime.completeStripeSellerSetup(request, owner, state, code),
        undefined, () => null);
    return location ? new Response(null, { status: 303, headers: { ...headers, Location: location } })
      : new Response(null, { status: 403, headers });
  } catch {
    return new Response(null, { status: 403, headers });
  }
}
