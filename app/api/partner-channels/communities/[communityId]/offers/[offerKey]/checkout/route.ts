import { partnerAlertOwnerReviewRequestDenied } from "@/src/modules/partner-alerts/server/partner-alert-owner-review-request";
import type { NextRequest } from "next/server";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
import { partnerAlertStripeSandbox } from "@/src/modules/partner-alerts/server/partner-alert-stripe-sandbox-runtime";
import { readPartnerAlertStripeBillingConfiguration } from "@/src/modules/partner-alerts/server/partner-alert-stripe-billing-runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ communityId: string; offerKey: string }> }) {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  const sandbox = partnerAlertStripeSandbox(request);
  const { communityId, offerKey } = await context.params;
  if (sandbox) return sandbox.service.checkout(request, communityId, offerKey);
  if (!readPartnerAlertStripeBillingConfiguration()) return new Response(null, { status: 404 });
  return withPartnerAlertRequestRuntime(request, runtime => runtime.startStripeCheckout(request, communityId, offerKey));
}
