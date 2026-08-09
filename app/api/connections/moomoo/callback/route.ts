import { NextResponse, type NextRequest } from "next/server";

import { deletePlatformAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { encryptMoomooCredentials, loadMoomooCredentialKeyConfiguration } from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { MOOMOO_OAUTH_STATE_COOKIE, MOOMOO_OAUTH_VERIFIER_COOKIE } from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";
import { exchangeMoomooCode, getMoomooOAuthConfig } from "@/src/modules/platform/server/broker-connections/moomoo-oauth";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { MoomooExecutionImportRepository } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-repository";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function finish(
  request: NextRequest,
  status: "connected" | "failed" | "invalid-state",
  reportedToAdmin = false,
): NextResponse {
  const origin = process.env.NODE_ENV === "production" ? request.nextUrl.origin : "http://127.0.0.1:3010";
  const destination = new URL(`/account?moomoo=${status}`, origin);
  if (reportedToAdmin) destination.searchParams.set("reported", "1");
  const response = NextResponse.redirect(destination);
  deletePlatformAuthCookie(response, request, MOOMOO_OAUTH_STATE_COOKIE);
  deletePlatformAuthCookie(response, request, MOOMOO_OAUTH_VERIFIER_COOKIE);
  return response;
}

function reportFailure(error: unknown, stage: "oauth_state" | "oauth_callback"): boolean {
  try {
    return withPlatformDatabase({ mode: "runtime" }, (database) =>
      recordMoomooOperationFailure({ database, error, stage }));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const expectedState = request.cookies.get(MOOMOO_OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(MOOMOO_OAUTH_VERIFIER_COOKIE)?.value;
  if (!state || !code || !expectedState || !verifier || state !== expectedState) {
    return finish(request, "invalid-state", reportFailure(
      new Error("moomoo_oauth_state_invalid"),
      "oauth_state",
    ));
  }
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const token = await exchangeMoomooCode({ config: getMoomooOAuthConfig(request.nextUrl.origin), code, verifier });
    const now = new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    const expiresAtUtc = createCanonicalUtcTimestamp(new Date(now.getTime() + token.expiresInSeconds * 1000));
    withPlatformDatabase({ mode: "runtime" }, (database) => database.transaction(() => {
      const saved = new MoomooConnectionRepository(database).saveAuthorized(identity.scope, {
        encrypted: encryptMoomooCredentials({ configuration: loadMoomooCredentialKeyConfiguration(), credentials: { accessToken: token.accessToken, refreshToken: token.refreshToken } }),
        accessTokenExpiresAtUtc: expiresAtUtc, authorizedScopes: token.scopes, timestamp,
      });
      new MoomooExecutionImportRepository(database)
        .disconnectLinksForConnection(saved.connectionId, timestamp);
    }).immediate());
    return finish(request, "connected");
  } catch (error) {
    return finish(request, "failed", reportFailure(error, "oauth_callback"));
  }
}
