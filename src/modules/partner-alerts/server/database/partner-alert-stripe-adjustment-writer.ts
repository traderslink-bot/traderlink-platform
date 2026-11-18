import type Database from "better-sqlite3";
import { closePartnerAlertStripeCheckoutAttempt } from "./partner-alert-stripe-checkout-attempt";
import { queuePartnerAlertStripeRoleGrants, readPartnerAlertStripeClaim, type PartnerAlertStripeClaim }
  from "./partner-alert-stripe-invoice-writer";
import type { PartnerAlertStripeCheckoutIdentity } from "../partner-alert-stripe-paid-invoice";

export type PartnerStripeAdjustmentKind = "invoice.payment_failed" | "charge.refunded" |
  "charge.dispute.created" | "charge.dispute.closed" | "customer.subscription.deleted";
type StripeAdjustmentEvent = Readonly<{ id: string; digest: string; atMs: number; kind: PartnerStripeAdjustmentKind }>;

export type PartnerStripeAdjustment = Readonly<{
  claim: PartnerAlertStripeClaim;
  resourceId: string;
  affectedInvoiceId: string | null;
  disposition: "retain" | "review" | "remove_candidate";
  endedCheckout?: PartnerAlertStripeCheckoutIdentity;
}>;

export type PartnerStripePendingInvoiceAdjustment = Readonly<{
  pendingInvoice: true; claim: PartnerAlertStripeClaim; resourceId: string;
}>;

function saveAdjustmentEvent(db: Database.Database, claim: PartnerAlertStripeClaim, resourceId: string,
  event: StripeAdjustmentEvent, status: "pending" | "applied" | "review"): boolean {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1
    || !Number.isSafeInteger(event.atMs) || event.atMs <= 0) throw new Error("Stripe adjustment writer required.");
  const { environment, stripe_account_id: accountId, claim_id: claimId } = claim;
  const saved = db.prepare(`INSERT INTO partner_alert_stripe_events
    (environment,stripe_account_id,event_id,seller_id,community_id,claim_id,kind,resource_id,body_sha256,received_at_ms,status)
    VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(environment,stripe_account_id,event_id) DO UPDATE SET status=excluded.status
    WHERE partner_alert_stripe_events.status='pending' AND excluded.status!='pending'
      AND partner_alert_stripe_events.claim_id=excluded.claim_id AND partner_alert_stripe_events.kind=excluded.kind
      AND partner_alert_stripe_events.resource_id=excluded.resource_id AND partner_alert_stripe_events.body_sha256=excluded.body_sha256`)
    .run(environment, accountId, event.id, claim.seller_id, claim.community_id, claimId, event.kind, resourceId,
      event.digest, event.atMs, status);
  if (saved.changes) return true;

  const existing = db.prepare(`SELECT 1 FROM partner_alert_stripe_events WHERE environment=? AND stripe_account_id=?
    AND event_id=? AND claim_id=? AND kind=? AND resource_id=? AND body_sha256=?`)
    .get(environment, accountId, event.id, claimId, event.kind, resourceId, event.digest);
  if (!existing) throw new Error("Stripe adjustment event changed.");
  return false;
}

export function recordPendingPartnerAlertStripeAdjustment(db: Database.Database, adjustment: PartnerStripePendingInvoiceAdjustment,
  event: StripeAdjustmentEvent): void {
  const { claim, resourceId } = adjustment;
  const current = readPartnerAlertStripeClaim(db, claim.environment, claim.stripe_account_id, claim.claim_id);
  if (!current || current.stripe_session_id !== claim.stripe_session_id) throw new Error("Stripe adjustment scope changed.");
  saveAdjustmentEvent(db, current, resourceId, event, "pending");
}

export function readPendingPartnerAlertStripeAdjustments(db: Database.Database, claim: PartnerAlertStripeClaim) {
  const rows = db.prepare(`SELECT event_id AS id,body_sha256 AS digest,received_at_ms AS atMs,kind,resource_id AS resourceId
    FROM partner_alert_stripe_events WHERE environment=? AND stripe_account_id=? AND claim_id=? AND status='pending'
      AND kind IN ('charge.refunded','charge.dispute.created','charge.dispute.closed') ORDER BY event_id LIMIT 101`)
    .all(claim.environment, claim.stripe_account_id, claim.claim_id) as (StripeAdjustmentEvent & { resourceId: string })[];
  if (rows.length > 100) throw new Error("Too many pending Stripe adjustments for this checkout.");
  return rows;
}

/** Detect a payment adjustment committed while Stripe was being read. */
export function readPartnerAlertStripeAdjustmentRevision(db: Database.Database, environment: PartnerAlertStripeClaim["environment"],
  accountId: string, resourceId: string): number {
  return db.prepare(`SELECT count(*) FROM partner_alert_stripe_events WHERE environment=? AND stripe_account_id=?
    AND kind IN ('charge.refunded','charge.dispute.created','charge.dispute.closed') AND resource_id=? AND status!='pending'`)
    .pluck().get(environment, accountId, resourceId) as number;
}

export function recordPartnerAlertStripeAdjustment(db: Database.Database, adjustment: PartnerStripeAdjustment,
  event: StripeAdjustmentEvent): boolean {
  const { claim, resourceId, disposition, affectedInvoiceId, endedCheckout } = adjustment;
  const { environment, stripe_account_id: accountId, claim_id: claimId } = claim;
  const current = readPartnerAlertStripeClaim(db, environment, accountId, claimId);
  if (!current) throw new Error("Stripe adjustment scope changed.");
  // The verified terminal subscription already identifies the buyer and all
  // ended terms. Payment-specific exceptions still use the review queue.
  const subscriptionEnded = event.kind === "customer.subscription.deleted" && disposition === "remove_candidate";
  if (endedCheckout) {
    if (!subscriptionEnded || endedCheckout.subscriptionId !== resourceId || current.stripe_session_id !== endedCheckout.sessionId
      || (current.stripe_subscription_id !== null && current.stripe_subscription_id !== endedCheckout.subscriptionId)
      || (current.stripe_customer_id !== null && current.stripe_customer_id !== endedCheckout.customerId)) {
      throw new Error("Stripe adjustment scope changed.");
    }
  } else if (!current.stripe_subscription_id || current.stripe_subscription_id !== claim.stripe_subscription_id
    || current.stripe_customer_id !== claim.stripe_customer_id) {
    throw new Error("Stripe adjustment scope changed.");
  }
  const refund = event.kind === "charge.refunded" && affectedInvoiceId !== null;
  const dispute = event.kind.startsWith("charge.dispute.") && affectedInvoiceId !== null;
  const relatedKinds = refund ? "('charge.refunded')" : "('charge.dispute.created','charge.dispute.closed')";
  const sameReview = (refund || dispute) && disposition !== "retain" && db.prepare(`SELECT 1 FROM partner_alert_stripe_events e
    JOIN partner_alert_stripe_review_decisions r USING(environment,stripe_account_id,event_id,claim_id)
    WHERE e.environment=? AND e.stripe_account_id=? AND e.claim_id=? AND e.kind IN ${relatedKinds} AND e.resource_id=?
      AND e.status='review' AND r.affected_paid_invoice_id=? AND r.disposition=? LIMIT 1`)
    .get(environment, accountId, claimId, resourceId, affectedInvoiceId, disposition);
  const status = disposition === "retain" || subscriptionEnded || sameReview ? "applied" : "review";
  if (!saveAdjustmentEvent(db, current, resourceId, event, status)) return false;

  db.prepare(`INSERT INTO partner_alert_stripe_review_decisions
    (environment,stripe_account_id,event_id,claim_id,affected_paid_invoice_id,disposition,decision)
    VALUES(?,?,?,?,?,?,'pending')`).run(environment, accountId, event.id, claimId, affectedInvoiceId, disposition);
  // Retire the older action for this exact refund or dispute and keep its audit entry.
  const retireReview = (prior: "review" | "remove_candidate") => db.prepare(`UPDATE partner_alert_stripe_events AS e SET status='ignored'
    WHERE e.environment=? AND e.stripe_account_id=? AND e.claim_id=? AND e.kind IN ${relatedKinds} AND e.resource_id=?
    AND e.status IN ('review','applied') AND EXISTS (SELECT 1 FROM partner_alert_stripe_review_decisions r
      WHERE r.environment=e.environment AND r.stripe_account_id=e.stripe_account_id AND r.event_id=e.event_id
        AND r.claim_id=e.claim_id AND r.affected_paid_invoice_id=? AND r.disposition=?)`)
    .run(environment, accountId, claimId, resourceId, affectedInvoiceId, prior).changes;
  if (dispute && disposition !== "review") retireReview("review");
  if ((refund && disposition !== "remove_candidate") || (dispute && disposition === "retain")) {
    if (retireReview("remove_candidate")) queuePartnerAlertStripeRoleGrants(db, current, event.id, event.atMs);
  }
  if (endedCheckout) {
    db.prepare(`UPDATE partner_alert_stripe_checkout_claims SET stripe_customer_id=?,stripe_subscription_id=? WHERE claim_id=?`)
      .run(endedCheckout.customerId, endedCheckout.subscriptionId, claimId);
  }
  if (subscriptionEnded && current.stripe_session_id) {
    closePartnerAlertStripeCheckoutAttempt(db, { claimId, sessionId: current.stripe_session_id,
      reason: "subscription_ended", atMs: event.atMs });
  }
  return true;
}
