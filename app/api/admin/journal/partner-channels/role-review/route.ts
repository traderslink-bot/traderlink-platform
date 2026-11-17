import type { NextRequest } from "next/server";

import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withPartnerAlertRequestRuntime(request, ({ http, writer }) => http.handlePrivateRead(request, {
    kind: "operator_role_review_events", limit: 100,
  }, writer));
}

export async function POST(request: NextRequest): Promise<Response> {
  return withPartnerAlertRequestRuntime(request, ({ reviewSubscriberRole }) => reviewSubscriberRole(request));
}
