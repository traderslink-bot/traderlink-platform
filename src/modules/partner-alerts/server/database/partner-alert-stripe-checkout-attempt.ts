import type Database from "better-sqlite3";

export function hasPartnerAlertStripeCheckoutClosure(db: Database.Database): boolean {
  const fields = db.prepare(`SELECT count(*) FROM pragma_table_info('partner_alert_stripe_checkout_claims')
    WHERE name IN ('checkout_closed_at_ms','checkout_close_reason')`).pluck().get();
  if (fields !== 0 && fields !== 2) throw new Error("Incomplete Stripe checkout lifecycle schema.");
  return fields === 2;
}

export function closePartnerAlertStripeCheckoutAttempt(db: Database.Database, input: Readonly<{
  claimId: string;
  reason: "checkout_expired" | "subscription_ended";
  atMs: number;
  sessionId: string;
}>): boolean {
  if (!db.inTransaction || !Number.isSafeInteger(input.atMs) || input.atMs <= 0) throw new Error("Stripe checkout writer required.");
  if (!hasPartnerAlertStripeCheckoutClosure(db)) return false;
  const closed = db.prepare(`UPDATE partner_alert_stripe_checkout_claims SET checkout_closed_at_ms=?,checkout_close_reason=?
    WHERE claim_id=? AND stripe_session_id=? AND checkout_closed_at_ms IS NULL`).run(input.atMs, input.reason, input.claimId, input.sessionId);
  if (!closed.changes) {
    return Boolean(db.prepare(`SELECT 1 FROM partner_alert_stripe_checkout_claims
      WHERE claim_id=? AND stripe_session_id=? AND checkout_close_reason=?`).get(input.claimId, input.sessionId, input.reason));
  }
  return true;
}
