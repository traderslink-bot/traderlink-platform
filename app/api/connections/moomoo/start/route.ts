import { NextResponse, type NextRequest } from "next/server";

import { setPlatformAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MOOMOO_OAUTH_STATE_COOKIE, MOOMOO_OAUTH_VERIFIER_COOKIE } from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { buildMoomooAuthorizeUrl, createMoomooPkce, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    requireTraderLinkPlatformRequestIdentity(request.headers);
    const pkce = createMoomooPkce();
    const response = NextResponse.redirect(buildMoomooAuthorizeUrl({ config: getMoomooOAuthConfig(request.nextUrl.origin), state: pkce.state, challenge: pkce.challenge }));
    setPlatformAuthCookie(response, request, MOOMOO_OAUTH_STATE_COOKIE, pkce.state, 600);
    setPlatformAuthCookie(response, request, MOOMOO_OAUTH_VERIFIER_COOKIE, pkce.verifier, 600);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?moomoo=unavailable", request.nextUrl.origin));
  }
}
