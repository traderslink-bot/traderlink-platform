import { NextResponse, type NextRequest } from "next/server";

import { setPlatformAuthCookie } from
  "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { loadWhopAiReviewOAuthConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  buildWhopAuthorizeUrl,
  createWhopOAuthPkce,
  WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS,
  WHOP_OAUTH_STATE_COOKIE,
  WHOP_OAUTH_USER_BINDING_COOKIE,
  WHOP_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/billing/whop-ai-review-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const configuration = loadWhopAiReviewOAuthConfiguration();
    const pkce = createWhopOAuthPkce();
    const response = NextResponse.redirect(buildWhopAuthorizeUrl({
      configuration,
      state: pkce.state,
      challenge: pkce.challenge,
    }));
    setPlatformAuthCookie(response, request, WHOP_OAUTH_STATE_COOKIE,
      pkce.state, WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    setPlatformAuthCookie(response, request, WHOP_OAUTH_VERIFIER_COOKIE,
      pkce.verifier, WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    setPlatformAuthCookie(response, request, WHOP_OAUTH_USER_BINDING_COOKIE,
      createWhopPrivacyReference(identity.scope.userId, "platform_user",
        configuration.identityHmacKey), WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?whop=unavailable", request.nextUrl.origin));
  }
}
