import "server-only";
import * as oidc from "openid-client";
import { PlatformLoginError } from "./platform-login-service";
let cached:
  | { id: string; secret: string; configuration: Promise<oidc.Configuration> }
  | undefined;
export function googleLoginConfigured(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(
    environment.GOOGLE_CLIENT_ID && environment.GOOGLE_CLIENT_SECRET,
  );
}
export function googleConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const id = environment.GOOGLE_CLIENT_ID;
  const secret = environment.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google sign-in is not configured.");
  if (!cached || cached.id !== id || cached.secret !== secret) {
    const configuration = oidc.discovery(
      new URL("https://accounts.google.com"),
      id,
      secret,
      undefined,
      { timeout: 10, execute: [oidc.enableNonRepudiationChecks] },
    );
    cached = { id, secret, configuration };
    configuration.catch(() => {
      if (cached?.configuration === configuration) cached = undefined;
    });
  }
  return cached.configuration;
}
export type GoogleLoginTransaction = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  created: number;
  linking?: boolean;
};
export async function beginGoogleLogin(
  origin: string,
  returnTo: string,
  configuration?: oidc.Configuration,
) {
  const config = configuration ?? (await googleConfiguration());
  const transaction: GoogleLoginTransaction = {
    state: oidc.randomState(),
    nonce: oidc.randomNonce(),
    verifier: oidc.randomPKCECodeVerifier(),
    returnTo,
    created: Date.now(),
  };
  const url = oidc.buildAuthorizationUrl(config, {
    scope: "openid email profile",
    redirect_uri: new URL("/api/auth/google/callback", origin).href,
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(transaction.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { transaction, url };
}
export async function finishGoogleLogin(
  url: URL,
  transaction: GoogleLoginTransaction,
  configuration?: oidc.Configuration,
) {
  if (
    !transaction ||
    typeof transaction.state !== "string" ||
    typeof transaction.nonce !== "string" ||
    typeof transaction.verifier !== "string" ||
    !Number.isFinite(transaction.created) ||
    Date.now() - transaction.created > 600000 ||
    transaction.created > Date.now()
  )
    throw new PlatformLoginError("invalid");
  const config = configuration ?? (await googleConfiguration());
  const token = await oidc.authorizationCodeGrant(config, url, {
    pkceCodeVerifier: transaction.verifier,
    expectedState: transaction.state,
    expectedNonce: transaction.nonce,
    idTokenExpected: true,
  });
  const claims = token.claims();
  if (
    !claims ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    claims.sub.length > 255
  )
    throw new PlatformLoginError("invalid");
  const name =
    typeof claims.name === "string"
      ? claims.name.normalize("NFKC").trim().slice(0, 120)
      : "Trader";
  return {
    subject: claims.sub,
    displayName: name && !/[\u0000-\u001f\u007f]/u.test(name) ? name : "Trader",
    verifiedEmail:
      claims.email_verified === true && typeof claims.email === "string"
        ? claims.email
        : null,
  };
}
