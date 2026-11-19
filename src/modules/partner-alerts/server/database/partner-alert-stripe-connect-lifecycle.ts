import type Database from "better-sqlite3";

export type StripeErasureRoleScope = Readonly<{ community_id: string; buyer_user_id: string; mapping_id: string }>;
type VerifyStripeErasureRoleClosure = (scope: StripeErasureRoleScope) => boolean;

export const PARTNER_ALERT_STRIPE_UNBOUND_RETENTION_MS = 7 * 86_400_000;
export const PARTNER_ALERT_STRIPE_UNBOUND_SWEEP_LIMIT = 250;

export function readPartnerAlertStripeErasureRoleScopes(database: Database.Database, userId: string) {
  if (!database.inTransaction || !userId) throw new Error("Stripe role scope requires a current writer.");
  return database.prepare(`WITH affected_claims AS (
      SELECT c.claim_id,c.community_id,c.buyer_user_id,c.offer_id,c.offer_version
      FROM partner_alert_stripe_checkout_claims c
      JOIN partner_alert_stripe_sellers s ON s.seller_id=c.seller_id
      WHERE c.buyer_user_id=? OR s.owner_user_id=?
    )
    SELECT c.community_id AS community_id,c.buyer_user_id AS buyer_user_id,m.mapping_id AS mapping_id
    FROM affected_claims c
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    WHERE EXISTS (SELECT 1 FROM partner_alert_stripe_paid_terms t WHERE t.claim_id=c.claim_id)
    UNION
    SELECT c.community_id,c.buyer_user_id,r.mapping_id
    FROM affected_claims c JOIN partner_alert_stripe_role_reconciliations r
      ON r.claim_id=c.claim_id AND r.community_id=c.community_id AND r.buyer_user_id=c.buyer_user_id
    ORDER BY community_id,buyer_user_id,mapping_id`).all(userId,userId) as StripeErasureRoleScope[];
}

/** Candidate Paid participant. The admitted erasure writer must establish any
 * external Discord-role disposition before starting this ordered database work. */
export function erasePartnerAlertStripeUser(database: Database.Database, userId: string, atMs: number,
  verifyRoleClosure?: VerifyStripeErasureRoleClosure) {
  if (!database.inTransaction || !userId || !Number.isSafeInteger(atMs) || atMs <= 0) {
    throw new Error("Stripe erasure requires an admitted writer and valid time.");
  }
  const roleScopes = readPartnerAlertStripeErasureRoleScopes(database, userId);
  for (const scope of roleScopes) {
    if (verifyRoleClosure?.(Object.freeze(scope)) !== true) throw new Error("Stripe Discord role disposition is unverified.");
  }
  const buyerClaims = "SELECT claim_id FROM partner_alert_stripe_checkout_claims WHERE buyer_user_id=?";
  for (const table of ["role_reconciliations", "review_decisions", "paid_terms", "events"]) {
    database.prepare(`DELETE FROM partner_alert_stripe_${table} WHERE claim_id IN (${buyerClaims})`).run(userId);
  }
  database.prepare("DELETE FROM partner_alert_stripe_checkout_claims WHERE buyer_user_id=?").run(userId);
  database.prepare(`UPDATE partner_alert_stripe_sellers SET state='disconnected',owner_user_id=NULL,
    owner_erased_at_ms=?,updated_at_ms=? WHERE owner_user_id=?`).run(atMs, atMs, userId);
  database.prepare(`UPDATE partner_alert_stripe_review_decisions SET reviewer_user_id=NULL,reviewer_erased_at_ms=?
    WHERE reviewer_user_id=?`).run(atMs, userId);
}

/** Unmatched event references have no access authority. Pending evidence
 * already attached to a claim follows the claim and review lifecycle. */
export function expirePartnerAlertStripeUnboundEvents(database: Database.Database, atMs: number) {
  if (!database.inTransaction || !Number.isSafeInteger(atMs) || atMs <= 0) {
    throw new Error("Stripe sweep requires an admitted writer and valid time.");
  }
  return database.prepare(`DELETE FROM partner_alert_stripe_events
    WHERE (environment,stripe_account_id,event_id) IN (
      SELECT environment,stripe_account_id,event_id FROM partner_alert_stripe_events
      WHERE claim_id IS NULL AND kind!='account.disconnected' AND received_at_ms<=?
      ORDER BY received_at_ms,environment,stripe_account_id,event_id LIMIT ?
    )`).run(atMs - PARTNER_ALERT_STRIPE_UNBOUND_RETENTION_MS, PARTNER_ALERT_STRIPE_UNBOUND_SWEEP_LIMIT).changes;
}
