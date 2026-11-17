import { partnerAlertOwnerReviewRequestDenied } from "@/src/modules/partner-alerts/server/partner-alert-owner-review-request";
import type { NextRequest } from "next/server";

import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest): Promise<Response> {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  return withPartnerAlertRequestRuntime(request, ({ http, writer }) => http.handlePrivateRead(request, {
    kind: "operator_review_requests", limit: 100,
  }, writer));
}
