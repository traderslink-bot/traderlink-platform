import { NextResponse, type NextRequest } from "next/server";

import { deletePlatformAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { encryptMoomooCredentials, loadMoomooCredentialKeyConfiguration } from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { MOOMOO_OAUTH_STATE_COOKIE, MOOMOO_OAUTH_VERIFIER_COOKIE } from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { exchangeMoomooCode, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function finish(request: NextRequest, status: "connected" | "failed" | "invalid-state", reason?: string): NextResponse {
  const origin = process.env.NODE_ENV === "production" ? request.nextUrl.origin : "http://127.0.0.1:3010";
  const destination = new URL(`/account?moomoo=${status}`, origin);
  if (reason) destination.searchParams.set("reason", reason);
  const response = NextResponse.redirect(destination);
  deletePlatformAuthCookie(response, request, MOOMOO_OAUTH_STATE_COOKIE);
  deletePlatformAuthCookie(response, request, MOOMOO_OAUTH_VERIFIER_COOKIE);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const expectedState = request.cookies.get(MOOMOO_OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(MOOMOO_OAUTH_VERIFIER_COOKIE)?.value;
  if (!state || !code || !expectedState || !verifier || state !== expectedState) return finish(request, "invalid-state");
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const token = await exchangeMoomooCode({ config: getMoomooOAuthConfig(request.nextUrl.origin), code, verifier });
    const now = new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    const expiresAtUtc = createCanonicalUtcTimestamp(new Date(now.getTime() + token.expiresInSeconds * 1000));
    withPlatformDatabase({ mode: "runtime" }, (database) => new MoomooConnectionRepository(database).saveAuthorized(identity.scope, {
      encrypted: encryptMoomooCredentials({ configuration: loadMoomooCredentialKeyConfiguration(), credentials: { accessToken: token.accessToken, refreshToken: token.refreshToken } }),
      accessTokenExpiresAtUtc: expiresAtUtc, authorizedScopes: token.scopes, timestamp,
    }));
    return finish(request, "connected");
  } catch (error) {
    const platformError = isTraderLinkPlatformError(error) ? error : null;
    const reason = platformError?.code === "TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED"
      ? "quote-access-denied"
      : platformError?.code === "TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID"
        ? String(platformError.safeContext.stage ?? "oauth-invalid")
        : "connection-save-failed";
    console.warn("TraderLink Moomoo OAuth callback failed.", {
      code: platformError?.code ?? "TRADERLINK_BROKER_CONNECTION_SAVE_FAILED",
      reason,
      ...(platformError ? platformError.safeContext : {}),
    });
    return finish(request, "failed", reason);
  }
}
