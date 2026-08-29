import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
  setPlatformAuthCookie,
  setPlatformSessionAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE,
  MOOMOO_OAUTH_ONBOARDING_RETURN_VALUE,
  MOOMOO_OAUTH_STATE_COOKIE,
  MOOMOO_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { buildMoomooAuthorizeUrl, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import {
  MoomooOAuthPendingAttemptService,
  recordMoomooOAuthPendingOutcome,
} from "@/src/modules/platform/server/broker-connections/moomoo-oauth-pending-attempt-service";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestHostname(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim() || request.nextUrl.host;
  return host.replace(/:\d+$/u, "").toLowerCase();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const publicOrigin = resolvePlatformPublicOrigin(request);
  const isWorkspaceOnboarding = request.nextUrl.searchParams.get("from") === "workspace-onboarding";
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (process.env.NODE_ENV !== "production" && requestHostname(request) !== "127.0.0.1") {
      const destination = new URL("http://127.0.0.1:3010/api/connections/moomoo/start");
      if (isWorkspaceOnboarding) destination.searchParams.set("from", "workspace-onboarding");
      return NextResponse.redirect(destination);
    }
    const pkce = withPlatformDatabase({ mode: "runtime" }, (database) =>
      database.transaction(() => new MoomooOAuthPendingAttemptService(database).prepare({
        scope: identity.scope,
        platformSessionId: identity.sessionId,
        cookieState: request.cookies.get(MOOMOO_OAUTH_STATE_COOKIE)?.value ?? null,
        cookieVerifier: request.cookies.get(MOOMOO_OAUTH_VERIFIER_COOKIE)?.value ?? null,
      })).immediate());
    const response = NextResponse.redirect(buildMoomooAuthorizeUrl({ config: getMoomooOAuthConfig(publicOrigin), state: pkce.state, challenge: pkce.challenge }));
    setPlatformSessionAuthCookie(response, request, MOOMOO_OAUTH_STATE_COOKIE, pkce.state);
    setPlatformSessionAuthCookie(response, request, MOOMOO_OAUTH_VERIFIER_COOKIE, pkce.verifier);
    if (isWorkspaceOnboarding) {
      setPlatformAuthCookie(
        response,
        request,
        MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE,
        MOOMOO_OAUTH_ONBOARDING_RETURN_VALUE,
        10 * 60,
      );
    } else {
      deletePlatformAuthCookie(response, request, MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE);
    }
    recordMoomooOAuthPendingOutcome(pkce.outcome);
    return response;
  } catch (error) {
    let reportedToAdmin = false;
    try {
      reportedToAdmin = withPlatformDatabase({ mode: "runtime" }, (database) =>
        recordMoomooOperationFailure({ database, error, stage: "oauth_start" }));
    } catch {
      // The user still receives the connection failure when diagnostics cannot open storage.
    }
    const destination = new URL("/account/trading?moomoo=unavailable", publicOrigin);
    if (reportedToAdmin) destination.searchParams.set("reported", "1");
    return NextResponse.redirect(destination);
  }
}
