import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { deletePlatformAuthCookie, platformAuthCookieName } from
  "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { loadWhopOAuthRequestConfiguration, createWhopOAuthFlowBinding, requireWhopOAuthRequestIdentity } from
  "@/src/modules/platform/server/billing/whop-ai-review-staging-identity";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  readWhopOAuthSubject,
  WHOP_OAUTH_FLOW_COOKIE,
  WHOP_OAUTH_STATE_COOKIE,
  WHOP_OAUTH_USER_BINDING_COOKIE,
  WHOP_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/billing/whop-ai-review-oauth";
import { bindWhopAiReviewStagingNativeLink } from
  "@/src/modules/platform/server/billing/whop-ai-review-staging-native-link";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function equal(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function finish(request: NextRequest, status: "connected" | "conflict" |
"invalid-state" | "unavailable", nativeHeld = false): NextResponse {
  const response = NextResponse.redirect(new URL(`/account?whop=${status}${nativeHeld ? "&whopNative=held" : ""}`,
    request.nextUrl.origin));
  for (const name of [WHOP_OAUTH_FLOW_COOKIE, WHOP_OAUTH_STATE_COOKIE, WHOP_OAUTH_VERIFIER_COOKIE,
    WHOP_OAUTH_USER_BINDING_COOKIE]) {
    deletePlatformAuthCookie(response, request, name);
  }
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const expectedState = request.cookies.get(platformAuthCookieName(WHOP_OAUTH_STATE_COOKIE))?.value ?? "";
  const verifier = request.cookies.get(platformAuthCookieName(WHOP_OAUTH_VERIFIER_COOKIE))?.value ?? "";
  const expectedUser = request.cookies.get(platformAuthCookieName(WHOP_OAUTH_USER_BINDING_COOKIE))?.value ?? "";
  if (!state || !code || code.length > 2_048 || !expectedState || !verifier ||
      !equal(state, expectedState)) return finish(request, "invalid-state");
  try {
    const identity = requireWhopOAuthRequestIdentity(request);
    const configuration = loadWhopOAuthRequestConfiguration(request, identity.scope.userId);
    if (state.startsWith("sandbox.") !== (configuration.realm === "sandbox")) return finish(request, "invalid-state");
    const currentUser = createWhopPrivacyReference(identity.scope.userId,
      "platform_user", configuration.identityHmacKey);
    if (!expectedUser || !equal(expectedUser, currentUser)) {
      return finish(request, "invalid-state");
    }
    const expectedFlow = request.cookies.get(platformAuthCookieName(WHOP_OAUTH_FLOW_COOKIE))?.value ?? "";
    const currentFlow = createWhopOAuthFlowBinding(configuration, identity.scope.userId);
    if ((configuration.realm === "sandbox" || expectedFlow) && !equal(expectedFlow, currentFlow)) {
      return finish(request, "invalid-state");
    }
    const subject = await readWhopOAuthSubject({ configuration, code, verifier });
    // Revalidate the same session/config/image after external I/O, before linking.
    const latestIdentity = requireWhopOAuthRequestIdentity(request);
    const latestConfiguration = loadWhopOAuthRequestConfiguration(request, latestIdentity.scope.userId);
    if (latestIdentity.scope.userId !== identity.scope.userId || !equal(currentFlow,
      createWhopOAuthFlowBinding(latestConfiguration, latestIdentity.scope.userId))) return finish(request, "invalid-state");
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const link = new WhopAiReviewEntitlementRepository(database).linkUser(
        identity.scope.userId,
        createWhopPrivacyReference(subject, "user", configuration.identityHmacKey),
      );
      if (link === "conflict") return { status: "conflict" as const, nativeHeld: false };
      const native = configuration.realm === "sandbox" ? bindWhopAiReviewStagingNativeLink({
        database, request, linkedUserId: identity.scope.userId, justVerifiedSubject: subject,
      }) : null;
      return { status: "connected" as const, nativeHeld: native?.kind === "held" };
    });
    return finish(request, result.status, result.nativeHeld);
  } catch {
    return finish(request, "unavailable");
  }
}
