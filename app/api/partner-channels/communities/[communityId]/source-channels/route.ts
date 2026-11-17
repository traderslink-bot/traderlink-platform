import type { NextRequest } from "next/server";

import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest,
  context: { params: Promise<{ communityId: string }> }): Promise<Response> {
  const { communityId } = await context.params;
  return withPartnerAlertRequestRuntime(request, runtime => runtime.readSourceChannels(request, communityId));
}

export async function POST(request: NextRequest,
  context: { params: Promise<{ communityId: string }> }): Promise<Response> {
  const { communityId } = await context.params;
  return withPartnerAlertRequestRuntime(request, runtime => runtime.readSourceChannels(request, communityId));
}
