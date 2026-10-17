import { NextRequest, NextResponse } from "next/server";
import { requireTraderLinkPlatformBillingRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";

export const dynamic = "force-dynamic";

/** Authenticate before entering the member layout, preserving the private selection. */
export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const name of ["addonOfferId", "secret"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value) query.set(name, value);
  }
  const destination = `/account/membership?${query}`;
  let target = destination;
  try {
    requireTraderLinkPlatformBillingRequestIdentity(request.headers);
  } catch (error) {
    if (!isTraderLinkPlatformError(error) || !["TRADERLINK_WORKSPACE_ACCESS_DENIED", "TRADERLINK_AUTH_SESSION_INVALID"].includes(error.code)) throw error;
    target = `/login?returnTo=${encodeURIComponent(destination)}`;
  }
  const response = NextResponse.redirect(new URL(target, resolvePlatformPublicOrigin(request)));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
