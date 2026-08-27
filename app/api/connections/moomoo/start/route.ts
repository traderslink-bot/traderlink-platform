import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
  setPlatformAuthCookie,
  setPlatformSessionAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  MOOMOO_OAUTH_PENDING_ATTEMPT_RETENTION_MILLISECONDS,
  MOOMOO_OAUTH_PENDING_ATTEMPT_TTL_MILLISECONDS,
  MoomooOAuthPendingAttemptRepository,
  hashMoomooOAuthState,
} from "@/src/modules/platform/server/broker-connections/moomoo-oauth-pending-attempt-repository";
import {
  MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE,
  MOOMOO_OAUTH_ONBOARDING_RETURN_VALUE,
  MOOMOO_OAUTH_STATE_COOKIE,
  MOOMOO_OAUTH_VERIFIER_COOKIE,
} from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { buildMoomooAuthorizeUrl, createMoomooPkce, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
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
    const pkce = createMoomooPkce();
    const now = new Date();
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    const expiresAtUtc = createCanonicalUtcTimestamp(new Date(
      now.getTime() + MOOMOO_OAUTH_PENDING_ATTEMPT_TTL_MILLISECONDS,
    ));
    const retentionCutoffUtc = createCanonicalUtcTimestamp(new Date(
      now.getTime() - MOOMOO_OAUTH_PENDING_ATTEMPT_RETENTION_MILLISECONDS,
    ));
    withPlatformDatabase({ mode: "runtime" }, (database) => database.transaction(() => {
      const attempts = new MoomooOAuthPendingAttemptRepository(database);
      attempts.cleanupExpiredBefore(retentionCutoffUtc);
      attempts.create({
        createdAtUtc,
        expiresAtUtc,
        platformSessionId: identity.sessionId,
        scope: identity.scope,
        stateSha256: hashMoomooOAuthState(pkce.state),
      });
    }).immediate());
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
    return response;
  } catch (error) {
    let reportedToAdmin = false;
    try {
      reportedToAdmin = withPlatformDatabase({ mode: "runtime" }, (database) =>
        recordMoomooOperationFailure({ database, error, stage: "oauth_start" }));
    } catch {
      // The user still receives the connection failure when diagnostics cannot open storage.
    }
    const destination = new URL("/account?moomoo=unavailable", publicOrigin);
    if (reportedToAdmin) destination.searchParams.set("reported", "1");
    return NextResponse.redirect(destination);
  }
}
