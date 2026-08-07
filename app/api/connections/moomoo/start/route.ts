import { NextResponse, type NextRequest } from "next/server";

import { setPlatformSessionAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MOOMOO_OAUTH_STATE_COOKIE, MOOMOO_OAUTH_VERIFIER_COOKIE } from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { buildMoomooAuthorizeUrl, createMoomooPkce, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestHostname(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  return host.replace(/:\d+$/u, "").toLowerCase();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    requireTraderLinkPlatformRequestIdentity(request.headers);
    if (process.env.NODE_ENV !== "production" && requestHostname(request) !== "127.0.0.1") {
      return NextResponse.redirect("http://127.0.0.1:3010/api/connections/moomoo/start");
    }
    const pkce = createMoomooPkce();
    const response = NextResponse.redirect(buildMoomooAuthorizeUrl({ config: getMoomooOAuthConfig(request.nextUrl.origin), state: pkce.state, challenge: pkce.challenge }));
    setPlatformSessionAuthCookie(response, request, MOOMOO_OAUTH_STATE_COOKIE, pkce.state);
    setPlatformSessionAuthCookie(response, request, MOOMOO_OAUTH_VERIFIER_COOKIE, pkce.verifier);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?moomoo=unavailable", request.nextUrl.origin));
  }
}
