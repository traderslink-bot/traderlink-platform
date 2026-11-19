import { partnerAlertOwnerReviewRequestDenied } from "@/src/modules/partner-alerts/server/partner-alert-owner-review-request";
import type { NextRequest } from "next/server";

import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest,
  context: { params: Promise<{ communityId: string }> }): Promise<Response> {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  const { communityId } = await context.params;
  const query = request.nextUrl.searchParams;
  return withPartnerAlertRequestRuntime(request, ({ http, writer }) => http.handlePrivateRead(request, query.has("activity") ? {
    kind: "community_alert_activity", communityId, messageId: query.get("message"),
  } : {
    kind: "community_partner", communityId,
  }, writer));
}

export async function POST(request: NextRequest,
  context: { params: Promise<{ communityId: string }> }): Promise<Response> {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  const { communityId } = await context.params;
  return withPartnerAlertRequestRuntime(request, ({ http }) => http.handleMutation(request, {
    kind: "community_owner", communityId,
  }, communityId));
}
