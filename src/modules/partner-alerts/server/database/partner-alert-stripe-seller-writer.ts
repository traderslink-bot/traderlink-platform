import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { partnerStripeId } from "../partner-alert-stripe-paid-invoice";

export type PartnerStripeVerifiedSeller = Readonly<{
  communityId: string;
  ownerUserId: string;
  environment: "sandbox" | "live";
  accountId: string;
  state: "onboarding" | "in_review" | "ready" | "restricted";
  atMs: number;
}>;

export function hasPartnerStripeAuthorizations(db: Database.Database): boolean {
  return Boolean(db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table'
    AND name='partner_alert_stripe_authorizations'`).get());
}

export function readPartnerStripeOpenAuthorization(db: Database.Database, sellerId: string) {
  if (!hasPartnerStripeAuthorizations(db)) return { generation: 1, authorized_at_ms: 0 };
  return db.prepare<[string], { generation: number; authorized_at_ms: number }>(
    `SELECT generation,authorized_at_ms FROM partner_alert_stripe_authorizations
      WHERE seller_id=? AND disconnected_at_ms IS NULL`,
  ).get(sellerId);
}

/** Persist one provider-verified connection under the current, admitted owner. */
export function recordPartnerAlertStripeSeller(db: Database.Database, seller: PartnerStripeVerifiedSeller,
  oauthAttempt?: Readonly<{ sellerId: string; startedAtMs: number }>): string {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1
    || !Number.isSafeInteger(seller.atMs) || seller.atMs <= 0) throw new Error("Stripe seller writer required.");
  const accountId = partnerStripeId(seller.accountId, "acct_");
  const current = db.prepare(`SELECT seller_id,owner_user_id,stripe_account_id,updated_at_ms
    FROM partner_alert_stripe_sellers WHERE community_id=? AND environment=? AND state!='disconnected'`)
    .get(seller.communityId, seller.environment) as
    { seller_id: string; owner_user_id: string; stripe_account_id: string | null; updated_at_ms: number } | undefined;
  const owner = db.prepare(`SELECT owner_user_id FROM traderlink_communities
    WHERE community_id=? AND status!='removed'`).pluck().get(seller.communityId);
  if (owner !== seller.ownerUserId || (current && (current.owner_user_id !== seller.ownerUserId
    || current.stripe_account_id !== null && current.stripe_account_id !== accountId))) {
    throw new Error("Stripe seller ownership changed.");
  }

  const disconnected = hasPartnerStripeAuthorizations(db) ? db.prepare(`SELECT seller_id,community_id,owner_user_id,updated_at_ms
    FROM partner_alert_stripe_sellers WHERE environment=? AND stripe_account_id=? AND state='disconnected'`)
    .get(seller.environment, accountId) as
      { seller_id: string; community_id: string; owner_user_id: string | null; updated_at_ms: number } | undefined : undefined;
  if (disconnected) {
    if (!current || current.stripe_account_id !== null || current.seller_id !== oauthAttempt?.sellerId
      || disconnected.community_id !== seller.communityId || disconnected.owner_user_id !== seller.ownerUserId
      || oauthAttempt.startedAtMs < disconnected.updated_at_ms) throw new Error("Stripe reauthorization scope changed.");
    const atMs = Math.max(seller.atMs, disconnected.updated_at_ms + 1);
    db.prepare(`INSERT INTO partner_alert_stripe_authorizations(seller_id,generation,authorized_at_ms)
      SELECT seller_id,max(generation)+1,? FROM partner_alert_stripe_authorizations WHERE seller_id=? GROUP BY seller_id`)
      .run(atMs, disconnected.seller_id);
    if (db.prepare(`UPDATE partner_alert_stripe_sellers SET state='disconnected',updated_at_ms=?
      WHERE seller_id=? AND state='creating' AND stripe_account_id IS NULL`).run(atMs, current.seller_id).changes !== 1) {
      throw new Error("Stripe reauthorization attempt changed.");
    }
    db.prepare("UPDATE partner_alert_stripe_sellers SET state=?,updated_at_ms=? WHERE seller_id=?")
      .run(seller.state, atMs, disconnected.seller_id);
    return disconnected.seller_id;
  }

  const sellerId = current?.seller_id ?? randomUUID();
  if (current) {
    if (seller.atMs < current.updated_at_ms) throw new Error("Stripe seller observation is stale.");
    db.prepare(`UPDATE partner_alert_stripe_sellers SET stripe_account_id=?,state=?,updated_at_ms=?
      WHERE seller_id=?`).run(accountId, seller.state, seller.atMs, sellerId);
  } else {
    db.prepare(`INSERT INTO partner_alert_stripe_sellers
      (seller_id,community_id,owner_user_id,environment,stripe_account_id,state,created_at_ms,updated_at_ms)
      VALUES(?,?,?,?,?,?,?,?)`).run(sellerId, seller.communityId, seller.ownerUserId,
        seller.environment, accountId, seller.state, seller.atMs, seller.atMs);
  }
  return sellerId;
}

export function recordPartnerAlertStripeSellerDisconnect(db: Database.Database, input: Readonly<{
  environment: PartnerStripeVerifiedSeller["environment"];
  accountId: string;
  ownerUserId: string;
  eventId: string;
  digest: string;
  atMs: number;
  occurredAtMs?: number;
}>): boolean {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1
    || !Number.isSafeInteger(input.atMs) || input.atMs <= 0) throw new Error("Stripe seller writer required.");
  const seller = db.prepare(`SELECT seller_id,community_id,owner_user_id,state,updated_at_ms FROM partner_alert_stripe_sellers
    WHERE environment=? AND stripe_account_id=?`).get(input.environment, input.accountId) as
    { seller_id: string; community_id: string; owner_user_id: string | null; state: string; updated_at_ms: number } | undefined;
  if (!seller || seller.owner_user_id !== input.ownerUserId) throw new Error("Stripe seller scope changed.");
  const authorization = readPartnerStripeOpenAuthorization(db, seller.seller_id);
  if (authorization && authorization.generation > 1) {
    if (!Number.isSafeInteger(input.occurredAtMs)) throw new Error("Stripe disconnect event time is unavailable.");
    // Stripe timestamps have second precision. An event in the same second
    // is treated as current because its order cannot be established.
    if (input.occurredAtMs! + 999 < authorization.authorized_at_ms) return false;
  }
  const event = db.prepare(`INSERT INTO partner_alert_stripe_events
    (environment,stripe_account_id,event_id,seller_id,community_id,kind,resource_id,body_sha256,received_at_ms,status)
    VALUES(?,?,?,?,?,'account.disconnected',?,?,?,'applied') ON CONFLICT(environment,stripe_account_id,event_id) DO NOTHING`)
    .run(input.environment, input.accountId, input.eventId, seller.seller_id, seller.community_id,
      input.accountId, input.digest, input.atMs);
  if (!event.changes) {
    const prior = db.prepare(`SELECT 1 FROM partner_alert_stripe_events WHERE environment=? AND stripe_account_id=?
      AND event_id=? AND kind='account.disconnected' AND resource_id=? AND body_sha256=?`)
      .get(input.environment, input.accountId, input.eventId, input.accountId, input.digest);
    if (!prior) throw new Error("Stripe disconnect event changed.");
    return false;
  }
  if (seller.state !== "disconnected") {
    db.prepare(`UPDATE partner_alert_stripe_sellers SET state='disconnected',updated_at_ms=?
      WHERE seller_id=?`).run(Math.max(input.atMs, seller.updated_at_ms), seller.seller_id);
    const at = new Date(input.atMs).toISOString();
    db.prepare(`UPDATE partner_alert_partners SET status='publishing_paused',revision=revision+1,
      updated_at_utc=MAX(updated_at_utc,?) WHERE community_id=? AND owner_user_id=? AND status='active'`)
      .run(at, seller.community_id, input.ownerUserId);
  }
  return true;
}
