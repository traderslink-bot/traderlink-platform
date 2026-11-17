import { createHash, randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { PartnerAlertEnvironment } from "../../contracts/partner-alert-contracts";

type StripeSellerScope = Readonly<{ communityId: string; ownerUserId: string; environment: PartnerAlertEnvironment }>;
type StripeAttempt = Readonly<{
  seller_id: string;
  method: "hosted" | "oauth";
  country: string | null;
  oauth_state_sha256: string | null;
  created_at_ms: number;
  expires_at_ms: number | null;
  consumed_at_ms: number | null;
}>;
type StripeSeller = Readonly<{ seller_id: string; stripe_account_id: string | null; state: string }>;

const oauthTtlMs = 10 * 60_000;
const oauthExchangeMs = 60_000;
const hostedIdempotencyMs = 30 * 24 * 60 * 60_000;

function oauthDigest(state: string) {
  // A restore can resurrect an unconsumed state. Only this process can claim a state it issued.
  return createHash("sha256").update(`${process.pid}:${performance.timeOrigin}:${state}`).digest("hex");
}

function requireWriter(database: Database.Database) {
  if (!database.inTransaction || database.pragma("foreign_keys", { simple: true }) !== 1) {
    throw new Error("Stripe onboarding writer required.");
  }
}

export function readPartnerStripeSetupSeller(database: Database.Database, scope: StripeSellerScope) {
  return database.prepare<[string, string, string], StripeSeller>(
    `SELECT seller_id,stripe_account_id,state FROM partner_alert_stripe_sellers
     WHERE community_id=? AND owner_user_id=? AND environment=? AND state!='disconnected'`,
  ).get(scope.communityId, scope.ownerUserId, scope.environment);
}

function readAttempt(database: Database.Database, sellerId: string) {
  return database.prepare<[string], StripeAttempt>(
    "SELECT * FROM partner_alert_stripe_onboarding_attempts WHERE seller_id=?",
  ).get(sellerId);
}

export function beginPartnerStripeSetup(database: Database.Database, scope: StripeSellerScope,
  method: StripeAttempt["method"], country: string, nowMs: number) {
  requireWriter(database);
  const seller = readPartnerStripeSetupSeller(database, scope);
  if (seller && (seller.state !== "creating" || seller.stripe_account_id)) throw new Error("Stripe seller already connected.");
  const sellerId = seller?.seller_id ?? randomUUID();
  const prior = seller ? readAttempt(database, sellerId) : undefined;
  if (prior?.method === "hosted") {
    if (method !== "hosted" || nowMs - prior.created_at_ms >= hostedIdempotencyMs) {
      throw new Error("Stripe seller setup requires review.");
    }
    return { attempt: prior, oauthState: null };
  }
  if (prior?.consumed_at_ms != null && nowMs - prior.consumed_at_ms < oauthExchangeMs) {
    throw new Error("Stripe seller connection is in progress.");
  }
  if (method === "hosted" && prior?.consumed_at_ms != null) throw new Error("Retry the existing Stripe account connection.");
  if (method === "hosted" && !/^[A-Z]{2}$/u.test(country)) throw new Error("Country code required.");
  if (!seller) database.prepare(`INSERT INTO partner_alert_stripe_sellers
    (seller_id,community_id,owner_user_id,environment,state,created_at_ms,updated_at_ms)
    VALUES(?,?,?,?,'creating',?,?)`).run(sellerId, scope.communityId, scope.ownerUserId, scope.environment, nowMs, nowMs);
  const oauthState = method === "oauth" ? randomBytes(32).toString("base64url") : null;
  if (prior) database.prepare("DELETE FROM partner_alert_stripe_onboarding_attempts WHERE seller_id=?").run(sellerId);
  database.prepare(`INSERT INTO partner_alert_stripe_onboarding_attempts
    (seller_id,method,country,oauth_state_sha256,created_at_ms,expires_at_ms) VALUES(?,?,?,?,?,?)`)
    .run(sellerId, method, method === "hosted" ? country : null, oauthState ? oauthDigest(oauthState) : null,
      nowMs, oauthState ? nowMs + oauthTtlMs : null);
  return { attempt: readAttempt(database, sellerId)!, oauthState };
}

export function findPartnerStripeOAuthScope(database: Database.Database, state: string, ownerUserId: string,
  environment: PartnerAlertEnvironment, nowMs: number) {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(state)) return undefined;
  return database.prepare<[string, string, string, number], { community_id: string; slug: string; seller_id: string }>(
    `SELECT s.community_id,c.slug,s.seller_id FROM partner_alert_stripe_onboarding_attempts a
     JOIN partner_alert_stripe_sellers s ON s.seller_id=a.seller_id
     JOIN traderlink_communities c ON c.community_id=s.community_id AND c.owner_user_id=s.owner_user_id
     WHERE a.oauth_state_sha256=? AND s.owner_user_id=? AND s.environment=? AND a.expires_at_ms>?
       AND a.consumed_at_ms IS NULL AND s.state='creating' AND c.status!='removed'`,
  ).get(oauthDigest(state), ownerUserId, environment, nowMs);
}

export function claimPartnerStripeOAuth(database: Database.Database, state: string, sellerId: string, nowMs: number) {
  requireWriter(database);
  const claimed = database.prepare(`UPDATE partner_alert_stripe_onboarding_attempts SET consumed_at_ms=?
    WHERE seller_id=? AND oauth_state_sha256=? AND consumed_at_ms IS NULL AND expires_at_ms>?`)
    .run(nowMs, sellerId, oauthDigest(state), nowMs).changes;
  return claimed ? readAttempt(database, sellerId) : undefined;
}

export function requirePartnerStripeSetupAttempt(database: Database.Database, scope: StripeSellerScope, attempt: StripeAttempt) {
  const seller = readPartnerStripeSetupSeller(database, scope);
  if (seller?.seller_id !== attempt.seller_id || seller.state !== "creating" || seller.stripe_account_id
    || JSON.stringify(readAttempt(database, attempt.seller_id)) !== JSON.stringify(attempt)) {
    throw new Error("Stripe seller setup changed.");
  }
}
