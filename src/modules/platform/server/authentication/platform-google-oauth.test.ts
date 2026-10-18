// @vitest-environment node
import { generateKeyPairSync, sign } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import * as oidc from "openid-client";
import { beginGoogleLogin, finishGoogleLogin } from "./platform-google-oauth";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const key = {
  ...publicKey.export({ format: "jwk" }),
  kid: "synthetic-key",
  use: "sig",
  alg: "RS256",
};
let badSignature = false;
let claims: Record<string, unknown> = {};
let expectedVerifier = "";
let issued = false;
function jwt(payload: Record<string, unknown>) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: "synthetic-key" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = header + "." + body;
  return (
    value +
    "." +
    (badSignature
      ? "a".repeat(342)
      : sign("RSA-SHA256", Buffer.from(value), privateKey).toString(
          "base64url",
        ))
  );
}
function config() {
  const c = new oidc.Configuration(
    {
      issuer: "https://accounts.google.com",
      authorization_endpoint: "https://accounts.google.com/auth",
      token_endpoint: "https://accounts.google.com/token",
      jwks_uri: "https://accounts.google.com/keys",
    },
    "synthetic-client",
    "synthetic-secret",
  );
  oidc.enableNonRepudiationChecks(c);
  c[oidc.customFetch] = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/keys")) return Response.json({ keys: [key] });
    const params = new URLSearchParams(String(init?.body));
    if (issued || params.get("code_verifier") !== expectedVerifier)
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    issued = true;
    return Response.json({
      access_token: "synthetic-token",
      token_type: "Bearer",
      id_token: jwt(claims),
    });
  };
  return c;
}
beforeEach(() => {
  issued = false;
  badSignature = false;
  claims = {
    iss: "https://accounts.google.com",
    aud: "synthetic-client",
    sub: "stable-google-subject",
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    email: "trader@example.com",
    email_verified: true,
    name: "Trader",
  };
});
describe("verified Google OIDC flow", () => {
  it.each([false, "true", undefined])("does not treat email_verified=%s as verified mailbox proof", async verified => {
    const c = config();
    const start = await beginGoogleLogin("https://app.traderslink.pro", "/plans", c);
    expectedVerifier = start.transaction.verifier;
    claims.nonce = start.transaction.nonce;
    claims.email_verified = verified;
    const url = new URL("https://app.traderslink.pro/api/auth/google/callback?code=synthetic-code");
    url.searchParams.set("state", start.transaction.state);
    expect(await finishGoogleLogin(url, start.transaction, c)).toMatchObject({
      subject: "stable-google-subject", verifiedEmail: null,
    });
  });
  it("uses PKCE, nonce and state and verifies the signed subject", async () => {
    const c = config();
    const start = await beginGoogleLogin(
      "https://app.traderslink.pro",
      "/plans",
      c,
    );
    expectedVerifier = start.transaction.verifier;
    claims.nonce = start.transaction.nonce;
    expect(start.url.searchParams.get("code_challenge_method")).toBe("S256");
    const url = new URL("https://app.traderslink.pro/api/auth/google/callback");
    url.searchParams.set("code", "synthetic-code");
    url.searchParams.set("state", start.transaction.state);
    expect(await finishGoogleLogin(url, start.transaction, c)).toEqual({
      subject: "stable-google-subject",
      displayName: "Trader",
      verifiedEmail: "trader@example.com",
    });
    await expect(
      finishGoogleLogin(url, start.transaction, c),
    ).rejects.toThrow();
  });
  it.each(["state", "nonce", "issuer", "audience", "expiry", "signature", "transaction-expiry"])(
    "rejects invalid %s",
    async (kind) => {
      const c = config();
      const start = await beginGoogleLogin(
        "https://app.traderslink.pro",
        "/plans",
        c,
      );
      expectedVerifier = start.transaction.verifier;
      claims.nonce = kind === "nonce" ? "wrong" : start.transaction.nonce;
      if (kind === "issuer") claims.iss = "https://untrusted.example.test";
      if (kind === "audience") claims.aud = "wrong-client";
      if (kind === "expiry") claims.exp = 1;
      if (kind === "signature") badSignature = true;
      const transaction = kind === "transaction-expiry"
        ? { ...start.transaction, created: Date.now() - 600001 }
        : start.transaction;
      const url = new URL(
        "https://app.traderslink.pro/api/auth/google/callback?code=synthetic-code",
      );
      url.searchParams.set(
        "state",
        kind === "state" ? "wrong" : start.transaction.state,
      );
      await expect(
        finishGoogleLogin(url, transaction, c),
      ).rejects.toThrow();
    },
  );
});
