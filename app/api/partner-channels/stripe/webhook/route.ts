import type { NextRequest } from "next/server";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<Response> {
  const result = await withPartnerAlertRequestRuntime(request, runtime => runtime.receiveStripeBillingEvent(request));
  if (result.status === 200) {
    try {
      const { startPartnerAlertStripeRoleRuntime } = await import(
        "@/src/modules/partner-alerts/server/partner-alert-stripe-role-runtime"
      );
      startPartnerAlertStripeRoleRuntime();
    } catch { console.error("Partner Channel Stripe role worker could not start."); }
  }
  return result;
}
