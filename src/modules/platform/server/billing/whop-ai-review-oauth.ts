import { createHash, randomBytes } from "node:crypto";

import type { WhopAiReviewOAuthConfiguration } from
  "./whop-ai-review-configuration";

export const WHOP_OAUTH_STATE_COOKIE = "traderlink_whop_oauth_state";
export const WHOP_OAUTH_VERIFIER_COOKIE = "traderlink_whop_oauth_verifier";
export const WHOP_OAUTH_USER_BINDING_COOKIE = "traderlink_whop_oauth_user";
export const WHOP_OAUTH_COOKIE_MAX_AGE_SECONDS = 600;

function base64Url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

export function createWhopOAuthPkce(): Readonly<{
  state: string;
  verifier: string;
  challenge: string;
}> {
  const verifier = base64Url(randomBytes(32));
  return Object.freeze({
    state: base64Url(randomBytes(24)),
    verifier,
    challenge: createHash("sha256").update(verifier, "utf8").digest("base64url"),
  });
}

export function buildWhopAuthorizeUrl(input: Readonly<{
  configuration: WhopAiReviewOAuthConfiguration;
  state: string;
  challenge: string;
}>): URL {
  const url = new URL("https://api.whop.com/oauth/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: input.configuration.clientId,
    redirect_uri: input.configuration.redirectUri,
    scope: "openid",
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url;
}

async function jsonResponse(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok || !value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("TRADERLINK_WHOP_OAUTH_FAILED");
  }
  return value as Record<string, unknown>;
}

export async function readWhopOAuthSubject(input: Readonly<{
  configuration: WhopAiReviewOAuthConfiguration;
  code: string;
  verifier: string;
}>): Promise<string> {
  const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.configuration.redirectUri,
      client_id: input.configuration.clientId,
      code_verifier: input.verifier,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const token = await jsonResponse(tokenResponse);
  const accessToken = token.access_token;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("TRADERLINK_WHOP_OAUTH_FAILED");
  }
  const userResponse = await fetch("https://api.whop.com/oauth/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const user = await jsonResponse(userResponse);
  if (typeof user.sub !== "string" || !user.sub.trim()) {
    throw new Error("TRADERLINK_WHOP_OAUTH_FAILED");
  }
  return user.sub;
}
