import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { deletePlatformAuthCookie } from
  "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { loadWhopAiReviewOAuthConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  readWhopOAuthSubject,
  WHOP_OAUTH_STATE_COOKIE,
  WHOP_OAUTH_USER_BINDING_COOKIE,
  WHOP_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/billing/whop-ai-review-oauth";
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
"invalid-state" | "unavailable"): NextResponse {
  const response = NextResponse.redirect(new URL(`/account?whop=${status}`,
    request.nextUrl.origin));
  for (const name of [WHOP_OAUTH_STATE_COOKIE, WHOP_OAUTH_VERIFIER_COOKIE,
    WHOP_OAUTH_USER_BINDING_COOKIE]) {
    deletePlatformAuthCookie(response, request, name);
  }
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const expectedState = request.cookies.get(WHOP_OAUTH_STATE_COOKIE)?.value ?? "";
  const verifier = request.cookies.get(WHOP_OAUTH_VERIFIER_COOKIE)?.value ?? "";
  const expectedUser = request.cookies.get(WHOP_OAUTH_USER_BINDING_COOKIE)?.value ?? "";
  if (!state || !code || code.length > 2_048 || !expectedState || !verifier ||
      !equal(state, expectedState)) return finish(request, "invalid-state");
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const configuration = loadWhopAiReviewOAuthConfiguration();
    const currentUser = createWhopPrivacyReference(identity.scope.userId,
      "platform_user", configuration.identityHmacKey);
    if (!expectedUser || !equal(expectedUser, currentUser)) {
      return finish(request, "invalid-state");
    }
    const subject = await readWhopOAuthSubject({ configuration, code, verifier });
    const result = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new WhopAiReviewEntitlementRepository(database).linkUser(
        identity.scope.userId,
        createWhopPrivacyReference(subject, "user", configuration.identityHmacKey),
      ));
    return finish(request, result === "conflict" ? "conflict" : "connected");
  } catch {
    return finish(request, "unavailable");
  }
}
