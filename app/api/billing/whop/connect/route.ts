import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { NextResponse, type NextRequest } from "next/server";

import { setPlatformAuthCookie } from
  "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { loadWhopOAuthRequestConfiguration, createWhopOAuthFlowBinding, requireWhopOAuthRequestIdentity } from
  "@/src/modules/platform/server/billing/whop-ai-review-staging-identity";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  buildWhopAuthorizeUrl,
  createWhopOAuthPkce,
  WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS,
  WHOP_OAUTH_FLOW_COOKIE,
  WHOP_OAUTH_STATE_COOKIE,
  WHOP_OAUTH_USER_BINDING_COOKIE,
  WHOP_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/billing/whop-ai-review-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = requireWhopOAuthRequestIdentity(request);
    const configuration = loadWhopOAuthRequestConfiguration(request, identity.scope.userId);
    const pkce = createWhopOAuthPkce();
    const state = configuration.realm === "sandbox" ? `sandbox.${pkce.state}` : pkce.state;
    const response = NextResponse.redirect(buildWhopAuthorizeUrl({
      configuration,
      state,
      challenge: pkce.challenge,
    }));
    setPlatformAuthCookie(response, request, WHOP_OAUTH_STATE_COOKIE,
      state, WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    setPlatformAuthCookie(response, request, WHOP_OAUTH_VERIFIER_COOKIE,
      pkce.verifier, WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    setPlatformAuthCookie(response, request, WHOP_OAUTH_USER_BINDING_COOKIE,
      createWhopPrivacyReference(identity.scope.userId, "platform_user",
        configuration.identityHmacKey), WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    setPlatformAuthCookie(response, request, WHOP_OAUTH_FLOW_COOKIE,
      createWhopOAuthFlowBinding(configuration, identity.scope.userId), WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?whop=unavailable", resolvePlatformPublicOrigin(request)));
  }
}
