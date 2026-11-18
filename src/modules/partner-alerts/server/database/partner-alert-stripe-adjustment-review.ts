import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { PartnerAlertStripeClaim } from "./partner-alert-stripe-invoice-writer";

/** The owner request boundary supplies the verified reviewer on this writer.
 * A removal here schedules a candidate. The role worker must still verify
 * funding from both providers and a previously owned Discord assignment. */
export function recordPartnerAlertStripeAdjustmentReview(db: Database.Database, input: Readonly<{
  environment: PartnerAlertStripeClaim["environment"];
  accountId: string;
  eventId: string;
  reviewerUserId: string;
  decision: "keep" | "remove";
  atMs: number;
}>): boolean {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1
    || !Number.isSafeInteger(input.atMs) || input.atMs <= 0) throw new Error("Stripe review writer required.");

  const review = db.prepare(`SELECT r.disposition,r.decision,r.reviewer_user_id,e.received_at_ms,e.status,
      c.claim_id,c.community_id,c.buyer_user_id,c.offer_id,c.offer_version
    FROM partner_alert_stripe_review_decisions r
    JOIN partner_alert_stripe_events e ON e.environment=r.environment AND e.stripe_account_id=r.stripe_account_id
      AND e.event_id=r.event_id AND e.claim_id=r.claim_id
    JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=r.claim_id
    WHERE r.environment=? AND r.stripe_account_id=? AND r.event_id=?`).get(input.environment, input.accountId, input.eventId) as
    { disposition: string; decision: string; reviewer_user_id: string | null; received_at_ms: number; status: string;
      claim_id: string; community_id: string; buyer_user_id: string; offer_id: string; offer_version: number } | undefined;
  if (!review || review.status !== "review" || input.atMs < review.received_at_ms
    || (input.decision === "remove" && review.disposition !== "remove_candidate")) {
    throw new Error("Stripe review cannot authorize that decision.");
  }
  if (review.decision !== "pending") {
    if (review.decision === input.decision && review.reviewer_user_id === input.reviewerUserId) return false;
    throw new Error("Stripe adjustment was already reviewed.");
  }

  db.prepare(`UPDATE partner_alert_stripe_review_decisions SET decision=?,reviewer_user_id=?,reviewed_at_ms=?
    WHERE environment=? AND stripe_account_id=? AND event_id=?`)
    .run(input.decision, input.reviewerUserId, input.atMs, input.environment, input.accountId, input.eventId);
  if (input.decision === "remove") {
    const mappings = db.prepare(`SELECT mapping_id FROM partner_alert_offer_channels
      WHERE community_id=? AND offer_id=? AND offer_version=? ORDER BY mapping_id`)
      .pluck().all(review.community_id, review.offer_id, review.offer_version);
    const addIntent = db.prepare(`INSERT INTO partner_alert_stripe_role_reconciliations
      (operation_id,environment,stripe_account_id,event_id,claim_id,community_id,buyer_user_id,mapping_id,
       desired_present,status,created_at_ms) VALUES(?,?,?,?,?,?,?,?,0,'pending',?)`);
    for (const mapping of mappings) {
      addIntent.run(randomUUID(), input.environment, input.accountId, input.eventId, review.claim_id,
        review.community_id, review.buyer_user_id, mapping, input.atMs);
    }
  }
  return true;
}
