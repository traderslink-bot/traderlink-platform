import type { NextRequest } from "next/server";
import { partnerAlertOwnerReviewRequestDenied } from "@/src/modules/partner-alerts/server/partner-alert-owner-review-request";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(request: NextRequest, context: { params: Promise<{ communityId: string }> }): Promise<Response> {
  const denied = partnerAlertOwnerReviewRequestDenied(request);
  if (denied) return denied;
  const { communityId } = await context.params;
  return withPartnerAlertRequestRuntime(request, runtime => runtime.readReceivingOptions(request, communityId, request.nextUrl.searchParams.get("mappingId") ?? ""));
}
