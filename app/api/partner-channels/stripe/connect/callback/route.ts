import type { NextRequest } from "next/server";
import { partnerAlertStripeConnectCallback } from "@/src/modules/partner-alerts/server/partner-alert-stripe-connect-callback";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return partnerAlertStripeConnectCallback(request, "live");
}
