import type { NextRequest } from "next/server";

import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest,
  context: { params: Promise<{ communityId: string; offerKey: string }> }): Promise<Response> {
  const { communityId, offerKey } = await context.params;
  return withPartnerAlertRequestRuntime(request,
    runtime => runtime.checkSubscriberAccess(request, communityId, offerKey));
}
