import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { platformFailure } from "../database/platform-migration-contract";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const QUOTE_READ_SCOPE = "quote:read";

export type MoomooOAuthConfig = Readonly<{
  clientId: string;
  redirectUri: string;
}>;

export function getMoomooOAuthConfig(origin: string): MoomooOAuthConfig {
  const clientId = process.env.TRADERLINK_MOOMOO_OAUTH_CLIENT_ID?.trim();
  if (!clientId || clientId.length > 255) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_CONFIGURATION_INVALID");
  }
  const localOrigin = "http://127.0.0.1:3010";
  const redirectUri = process.env.NODE_ENV === "production"
    ? new URL("/api/connections/moomoo/callback", origin).toString()
    : new URL("/api/connections/moomoo/callback", localOrigin).toString();
  return Object.freeze({ clientId, redirectUri });
}

export function createMoomooPkce(): Readonly<{ state: string; verifier: string; challenge: string }> {
  const verifier = randomBytes(48).toString("base64url");
  return Object.freeze({
    state: randomBytes(24).toString("base64url"),
    verifier,
    challenge: createHash("sha256").update(verifier, "utf8").digest("base64url"),
  });
}

export function buildMoomooAuthorizeUrl(input: Readonly<{
  config: MoomooOAuthConfig; state: string; challenge: string;
}>): URL {
  const url = new URL("/oauth2/authorize/confirm", MOOMOO_API_ORIGIN);
  url.search = new URLSearchParams({
    client_id: input.config.clientId,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
    redirect_uri: input.config.redirectUri,
    response_type: "code",
    state: input.state,
  }).toString();
  return url;
}

export async function exchangeMoomooCode(input: Readonly<{
  config: MoomooOAuthConfig; code: string; verifier: string;
}>): Promise<Readonly<{ accessToken: string; refreshToken: string; expiresInSeconds: number; scopes: readonly string[] }>> {
  const body = new URLSearchParams({ grant_type: "authorization_code", code: input.code, client_id: input.config.clientId, redirect_uri: input.config.redirectUri, code_verifier: input.verifier });
  let response: Response;
  try { response = await fetch(`${MOOMOO_API_ORIGIN}/oauth2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" }); } catch { platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { stage: "network" }); }
  let payload: unknown;
  try { payload = await response!.json(); } catch { platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { httpStatus: response!.status, stage: "response_json" }); }
  if (!response!.ok) {
    const providerError = payload && typeof payload === "object" && !Array.isArray(payload) &&
      typeof (payload as Record<string, unknown>).error === "string" &&
      /^[a-z][a-z0-9_-]{0,63}$/u.test((payload as Record<string, unknown>).error as string)
      ? (payload as Record<string, string>).error
      : "provider_error";
    platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", {
      httpStatus: response!.status,
      providerError,
      stage: "provider_rejected",
    });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { stage: "response_shape" });
  }
  const token = payload as Record<string, unknown>;
  if (typeof token.access_token !== "string" || typeof token.refresh_token !== "string" || !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0 || typeof token.scope !== "string") {
    platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", {
      accessTokenPresent: typeof token.access_token === "string",
      expiryValid: Number.isSafeInteger(token.expires_in) && Number(token.expires_in) > 0,
      refreshTokenPresent: typeof token.refresh_token === "string",
      scopePresent: typeof token.scope === "string",
      stage: "token_fields",
    });
  }
  const scopes = token.scope.split(" ").filter(Boolean);
  if (!scopes.includes(QUOTE_READ_SCOPE)) platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", { stage: "quote_scope" });
  return Object.freeze({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresInSeconds: token.expires_in, scopes: Object.freeze(scopes) });
}

export async function refreshMoomooAccessToken(input: Readonly<{
  clientId: string;
  refreshToken: string;
}>): Promise<Readonly<{ accessToken: string; expiresInSeconds: number; scopes: readonly string[] }> | null> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: input.refreshToken,
    client_id: input.clientId,
  });
  let response: Response;
  try {
    response = await fetch(`${MOOMOO_API_ORIGIN}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch {
    return null;
  }
  let payload: unknown;
  try { payload = await response.json(); } catch { return null; }
  if (!response.ok || !payload || typeof payload !== "object") return null;
  const token = payload as Record<string, unknown>;
  if (
    typeof token.access_token !== "string" ||
    !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0 ||
    typeof token.scope !== "string"
  ) return null;
  const scopes = token.scope.split(" ").filter(Boolean);
  if (!scopes.includes(QUOTE_READ_SCOPE)) return null;
  return Object.freeze({
    accessToken: token.access_token,
    expiresInSeconds: token.expires_in,
    scopes: Object.freeze(scopes),
  });
}
