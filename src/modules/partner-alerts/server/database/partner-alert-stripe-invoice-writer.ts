import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { membershipStripeAmount } from "../../../platform/server/membership/membership-stripe-http";
import type { PartnerAlertStripePaidInvoice } from "../partner-alert-stripe-paid-invoice";
import { hasPartnerStripeAuthorizations, readPartnerStripeOpenAuthorization } from "./partner-alert-stripe-seller-writer";
import { closePartnerAlertStripeCheckoutAttempt, hasPartnerAlertStripeCheckoutClosure } from "./partner-alert-stripe-checkout-attempt";

export type PartnerAlertStripeClaim = Readonly<{
  claim_id: string;
  buyer_user_id: string;
  seller_id: string;
  community_id: string;
  environment: "sandbox" | "live";
  stripe_account_id: string;
  stripe_price_id: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  offer_id: string;
  offer_version: number;
  amount_minor: number;
  currency: string;
  authorization_generation: number;
}>;

export function readPartnerAlertStripeClaim(db: Database.Database, environment: PartnerAlertStripeClaim["environment"],
  accountId: string, claimId: string): PartnerAlertStripeClaim | undefined {
  const generation = hasPartnerStripeAuthorizations(db) ? "c.authorization_generation" : "1";
  return db.prepare(`SELECT c.claim_id,c.buyer_user_id,c.seller_id,c.community_id,c.environment,c.stripe_account_id,
      c.stripe_price_id,c.stripe_session_id,c.stripe_subscription_id,c.stripe_customer_id,c.offer_id,c.offer_version,
      p.amount_minor,p.currency,${generation} AS authorization_generation
    FROM partner_alert_stripe_checkout_claims c JOIN partner_alert_stripe_prices p
      ON p.seller_id=c.seller_id AND p.community_id=c.community_id AND p.environment=c.environment
      AND p.stripe_account_id=c.stripe_account_id AND p.offer_id=c.offer_id AND p.offer_version=c.offer_version
      AND p.stripe_price_id=c.stripe_price_id
    WHERE c.environment=? AND c.stripe_account_id=? AND c.claim_id=?`).get(environment, accountId, claimId) as
    PartnerAlertStripeClaim | undefined;
}

export function isPartnerStripeClaimAuthorized(db: Database.Database, claim: PartnerAlertStripeClaim): boolean {
  return readPartnerStripeOpenAuthorization(db, claim.seller_id)?.generation === claim.authorization_generation
    && Boolean(db.prepare(`SELECT 1 FROM partner_alert_stripe_sellers
      WHERE seller_id=? AND environment=? AND stripe_account_id=? AND state!='disconnected'`)
      .get(claim.seller_id, claim.environment, claim.stripe_account_id));
}

/** Called from the admitted writer after its connected-account evidence read.
 * The claim, signed event, immutable term and exact role intents commit together. */
export function recordPartnerAlertStripePaidInvoice(db: Database.Database,
  claim: PartnerAlertStripeClaim, paid: PartnerAlertStripePaidInvoice,
  event: Readonly<{ id: string; digest: string; atMs: number; subscriptionEnded?: boolean; lossUnderReview?: boolean }>): boolean {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1
    || !Number.isSafeInteger(event.atMs) || event.atMs <= 0) {
    throw new Error("Stripe invoice writer required.");
  }

  const { environment, stripe_account_id: accountId, claim_id: claimId } = claim;
  const current = readPartnerAlertStripeClaim(db, environment, accountId, claimId);
  if (!current || current.stripe_session_id !== paid.sessionId || current.stripe_price_id !== claim.stripe_price_id
    || current.stripe_customer_id !== null && current.stripe_customer_id !== paid.customerId
    || current.stripe_subscription_id !== null && current.stripe_subscription_id !== paid.subscriptionId
    || paid.currency !== current.currency
    || String(paid.stripeAmountMinor) !== membershipStripeAmount(current.amount_minor, current.currency.toUpperCase())) {
    throw new Error("Stripe settlement does not match the approved purchase.");
  }
  // The disconnect may have committed while Stripe's invoice was being read.
  // Keep previously verified terms and never extend them across that fence.
  if (!isPartnerStripeClaimAuthorized(db, current)) return false;

  const inserted = db.prepare(`INSERT INTO partner_alert_stripe_events
    (environment,stripe_account_id,event_id,seller_id,community_id,claim_id,kind,resource_id,body_sha256,received_at_ms,status)
    VALUES(?,?,?,?,?,?,'invoice.paid',?,?,?,'applied') ON CONFLICT(environment,stripe_account_id,event_id) DO NOTHING`)
    .run(environment, accountId, event.id, current.seller_id, current.community_id, claimId, paid.invoiceId, event.digest, event.atMs);
  if (!inserted.changes) {
    const existing = db.prepare(`SELECT 1 FROM partner_alert_stripe_events WHERE environment=? AND stripe_account_id=?
      AND event_id=? AND claim_id=? AND kind='invoice.paid' AND resource_id=? AND body_sha256=? AND status='applied'`)
      .get(environment, accountId, event.id, claimId, paid.invoiceId, event.digest);
    if (!existing) throw new Error("Stripe event changed.");
    return false;
  }

  db.prepare(`UPDATE partner_alert_stripe_checkout_claims SET stripe_customer_id=?,stripe_subscription_id=?
    WHERE claim_id=?`).run(paid.customerId, paid.subscriptionId, claimId);
  if (event.subscriptionEnded && !closePartnerAlertStripeCheckoutAttempt(db, {
    claimId, sessionId: paid.sessionId, reason: "subscription_ended", atMs: event.atMs,
  })) throw new Error("Stripe subscription closure could not be recorded.");
  const term = db.prepare(`INSERT INTO partner_alert_stripe_paid_terms
      (environment,stripe_account_id,claim_id,invoice_id,invoice_payment_id,payment_intent_id,source_event_id,
       starts_at_ms,ends_at_ms,amount_minor,currency)
    VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(environment,stripe_account_id,invoice_id) DO NOTHING`)
    .run(environment, accountId, claimId, paid.invoiceId, paid.invoicePaymentId, paid.paymentIntentId,
      event.id, paid.startsAtMs, paid.endsAtMs, current.amount_minor, current.currency);
  if (!term.changes) {
    const existing = db.prepare(`SELECT 1 FROM partner_alert_stripe_paid_terms WHERE environment=? AND stripe_account_id=?
      AND invoice_id=? AND claim_id=? AND invoice_payment_id=? AND payment_intent_id=?
      AND starts_at_ms=? AND ends_at_ms=? AND amount_minor=? AND currency=?`)
      .get(environment, accountId, paid.invoiceId, claimId, paid.invoicePaymentId, paid.paymentIntentId,
        paid.startsAtMs, paid.endsAtMs, current.amount_minor, current.currency);
    if (!existing) throw new Error("Stripe invoice changed.");
    return false;
  }

  // Keep the monetary record when the subscription has ended or an exact
  // payment adjustment is about to enter access review on this same writer.
  const alreadyEnded = hasPartnerAlertStripeCheckoutClosure(db) && db.prepare(`SELECT 1
    FROM partner_alert_stripe_checkout_claims WHERE claim_id=? AND checkout_close_reason='subscription_ended'`).get(claimId);
  if (alreadyEnded || event.lossUnderReview) return true;

  queuePartnerAlertStripeRoleGrants(db, current, event.id, event.atMs);
  return true;
}

export function queuePartnerAlertStripeRoleGrants(db: Database.Database,
  claim: PartnerAlertStripeClaim, eventId: string, atMs: number): void {
  if (!db.inTransaction) throw new Error("Stripe role grants require an admitted writer.");
  const mappings = db.prepare(`SELECT mapping_id FROM partner_alert_offer_channels
    WHERE community_id=? AND offer_id=? AND offer_version=? ORDER BY mapping_id`)
    .pluck().all(claim.community_id, claim.offer_id, claim.offer_version) as string[];
  const addIntent = db.prepare(`INSERT INTO partner_alert_stripe_role_reconciliations
    (operation_id,environment,stripe_account_id,event_id,claim_id,community_id,buyer_user_id,mapping_id,
     desired_present,status,created_at_ms) VALUES(?,?,?,?,?,?,?,?,1,'pending',?)`);
  for (const mapping of mappings) {
    addIntent.run(randomUUID(), claim.environment, claim.stripe_account_id, eventId, claim.claim_id,
      claim.community_id, claim.buyer_user_id, mapping, atMs);
  }
}
