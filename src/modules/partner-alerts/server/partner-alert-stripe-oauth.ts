import { createHash, randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { requirePartnerAlertStripeKey } from "./partner-alert-stripe-onboarding";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";

export const PARTNER_STRIPE_OAUTH_CALLBACK = "/api/partner-channels/stripe-sandbox/connect/callback";
export const PARTNER_STRIPE_LIVE_OAUTH_CALLBACK = "/api/partner-channels/stripe/connect/callback";
const oauthOrigin = "https://connect.stripe.com";

export function partnerStripeOAuthAuthorizeUrl(clientId: string, origin: string, state: string, environment: PartnerAlertEnvironment) {
  if (!/^ca_[A-Za-z0-9]+$/u.test(clientId)) throw new Error("Stripe Connect client required.");
  const url = new URL("/oauth/authorize", oauthOrigin);
  const callback = environment === "live" ? PARTNER_STRIPE_LIVE_OAUTH_CALLBACK : PARTNER_STRIPE_OAUTH_CALLBACK;
  url.search = new URLSearchParams({ response_type: "code", client_id: clientId, scope: "read_write", state,
    redirect_uri: new URL(callback, origin).href }).toString();
  return url.href;
}

export function validPartnerStripeOAuthCode(code: string): boolean {
  return /^ac_[A-Za-z0-9_]{1,250}$/u.test(code);
}

export async function exchangePartnerStripeOAuth(code: string, key: string, environment: PartnerAlertEnvironment,
  transport: typeof fetch = fetch): Promise<string> {
  requirePartnerAlertStripeKey(key, environment);
  const response = await transport(new URL("/oauth/token", oauthOrigin), {
    method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Basic ${Buffer.from(`${key}:`,"utf8").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code }),
  });
  if (!response.ok) throw new Error("Stripe connection failed.");
  const token = partnerAlertRecord(await response.json(), "stripeOAuth");
  const account = token.stripe_user_id;
  if (token.livemode !== (environment === "live") || token.scope !== "read_write"
    || typeof account !== "string" || !/^acct_[A-Za-z0-9]+$/u.test(account)) throw new Error("Unverified Stripe connected account.");
  return account;
}

function digest(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

type OAuthAttempt = { community_id: string; owner_id: string; slug: string; expires_at: number };

export function createPartnerAlertStripeOAuth(db: Database.Database, config: Readonly<{
  clientId: string; origin: string; key: string; transport?: typeof fetch; nowMs?: () => number;
  verifyAccount: (account: string) => Promise<void>;
}>) {
  if (!/^ca_[A-Za-z0-9]+$/u.test(config.clientId) || !/^(?:sk|rk)_test_[A-Za-z0-9_]+$/u.test(config.key)) {
    throw new Error("Sandbox Stripe OAuth configuration required.");
  }
  db.exec(`CREATE TABLE IF NOT EXISTS qa_partner_stripe_oauth_states (
    state_hash TEXT PRIMARY KEY, community_id TEXT NOT NULL, owner_id TEXT NOT NULL, slug TEXT NOT NULL, expires_at INTEGER NOT NULL
  ) STRICT`);
  const now = config.nowMs ?? Date.now;
  const transport = config.transport ?? fetch;
  return {
    start(communityId: string, ownerId: string, slug: string) {
      const state = randomBytes(32).toString("base64url");
      db.transaction(() => {
        db.prepare("DELETE FROM qa_partner_stripe_oauth_states WHERE expires_at<=? OR (community_id=? AND owner_id=?)")
          .run(now(), communityId, ownerId);
        db.prepare("INSERT INTO qa_partner_stripe_oauth_states VALUES(?,?,?,?,?)")
          .run(digest(state), communityId, ownerId, slug, now() + 10 * 60_000);
      }).immediate();
      return partnerStripeOAuthAuthorizeUrl(config.clientId, config.origin, state, "sandbox");
    },
    async finish(state: string, code: string | null, ownerId: string, stillOwner: (communityId: string, slug: string) => boolean,
      native?: Readonly<{
        authorize: (communityId: string) => Promise<boolean>;
        save: (communityId: string, accountId: string) => Promise<boolean>;
      }>) {
      if (!/^[A-Za-z0-9_-]{43}$/u.test(state) || (code !== null && !validPartnerStripeOAuthCode(code))) return null;
      const attempt = db.transaction(() => {
        const hash = digest(state);
        const row = db.prepare("SELECT * FROM qa_partner_stripe_oauth_states WHERE state_hash=? AND owner_id=? AND expires_at>?")
          .get(hash, ownerId, now()) as OAuthAttempt | undefined;
        if (!row || !stillOwner(row.community_id, row.slug)) return null;
        db.prepare("DELETE FROM qa_partner_stripe_oauth_states WHERE state_hash=?").run(hash);
        return row;
      }).immediate();
      if (!attempt) return null;
      const page = new URL(`/communities/${encodeURIComponent(attempt.slug)}/partner-channels`, config.origin);
      if (code === null) {
        page.searchParams.set("stripe", "link_failed");
        return page.href;
      }
      try {
        if (db.prepare("SELECT 1 FROM qa_partner_stripe_sellers WHERE community_id=?").get(attempt.community_id)) {
          throw new Error("Community already has a Stripe seller.");
        }
        if (native && !await native.authorize(attempt.community_id)) throw new Error("Community owner changed.");
        const account = await exchangePartnerStripeOAuth(code, config.key, "sandbox", transport);
        await config.verifyAccount(account);
        if (!stillOwner(attempt.community_id, attempt.slug)) throw new Error("Community owner changed.");
        if (native && !await native.save(attempt.community_id, account)) throw new Error("Stripe seller could not be saved.");
        db.prepare("INSERT INTO qa_partner_stripe_sellers VALUES(?,?,?,?,?)")
          .run(attempt.community_id, ownerId, randomUUID(), "", account);
      } catch {
        page.searchParams.set("stripe", "link_failed");
      }
      return page.href;
    },
  };
}
