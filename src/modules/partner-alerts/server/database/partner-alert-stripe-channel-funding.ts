import type Database from "better-sqlite3";
import type { PartnerAlertEnvironment } from "../../contracts/partner-alert-contracts";
import type { PartnerAlertAccessInput } from "../../contracts/partner-alert-access-policy";
import { parsePartnerAlertCheckoutOffer } from "../../contracts/partner-alert-validation";
import { hasPartnerAlertStripeCheckoutClosure } from "./partner-alert-stripe-checkout-attempt";
import type { PartnerAlertStripeClaim } from "./partner-alert-stripe-invoice-writer";

export type StripeChannelFunding = Readonly<{
  environment: PartnerAlertStripeClaim["environment"];
  whopEnvironment?: PartnerAlertEnvironment;
  userId: string;
  communityId: string;
  mappingId: string;
  atMs: number;
}>;

/** The caller qualifies this connection and composes the result with current
 * paid Premium, Whop access, and the approved Discord mapping and assignment. */
export function readPartnerAlertStripeChannelFunding(db: Database.Database, target: StripeChannelFunding):
  NonNullable<PartnerAlertAccessInput["stripeFunding"]> {
  if (!db.inTransaction || !Number.isSafeInteger(target.atMs) || target.atMs <= 0) {
    throw new Error("Stripe channel funding requires a current writer.");
  }
  const at = target.atMs;
  const whopSandbox = target.environment === "sandbox" && target.whopEnvironment === "sandbox";
  const hasClosure = hasPartnerAlertStripeCheckoutClosure(db);
  const notEnded = hasClosure ? "AND (c.checkout_close_reason IS NOT 'subscription_ended' OR c.checkout_closed_at_ms>?)" : "";
  const closureAt = hasClosure ? [at] : [];
  const paidOffers = db.prepare(`SELECT c.offer_id,c.offer_version,max(t.ends_at_ms) AS paid_through_ms
    FROM partner_alert_stripe_checkout_claims c
    JOIN partner_alert_stripe_paid_terms t ON t.claim_id=c.claim_id
    JOIN partner_alert_stripe_events paid ON paid.environment=t.environment
      AND paid.stripe_account_id=t.stripe_account_id AND paid.event_id=t.source_event_id AND paid.claim_id=t.claim_id
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    JOIN partner_alert_offers o ON o.community_id=c.community_id AND o.offer_id=c.offer_id AND o.version=c.offer_version
    WHERE o.review_state='approved' AND c.environment=? AND c.buyer_user_id=? AND c.community_id=? AND m.mapping_id=?
      AND c.stripe_subscription_id IS NOT NULL AND t.starts_at_ms<=? AND t.ends_at_ms>?
      AND paid.status='applied' AND paid.kind='invoice.paid' AND paid.received_at_ms<=?
      ${notEnded}
      AND NOT EXISTS (
        SELECT 1 FROM partner_alert_stripe_review_decisions r
        JOIN partner_alert_stripe_events e ON e.environment=r.environment
          AND e.stripe_account_id=r.stripe_account_id AND e.event_id=r.event_id AND e.claim_id=r.claim_id
        WHERE r.claim_id=c.claim_id AND r.disposition='remove_candidate' AND e.status!='ignored' AND e.received_at_ms<=?
          AND (r.affected_paid_invoice_id=t.invoice_id OR e.kind='customer.subscription.deleted')
      )
    GROUP BY c.offer_id,c.offer_version
    ORDER BY c.offer_id,c.offer_version LIMIT 101`)
    .all(target.environment, target.userId, target.communityId, target.mappingId, at, at, at, ...closureAt, at) as
    { offer_id: string; offer_version: number; paid_through_ms: number }[];
  if (paidOffers.length > 100) throw new Error("Stripe funding scope is too large.");

  const holdRemoval = Boolean(db.prepare(`SELECT 1 FROM partner_alert_stripe_checkout_claims c
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    JOIN partner_alert_stripe_review_decisions review ON review.claim_id=c.claim_id
    JOIN partner_alert_stripe_events event ON event.environment=review.environment
      AND event.stripe_account_id=review.stripe_account_id AND event.event_id=review.event_id AND event.claim_id=review.claim_id
    WHERE c.environment=? AND c.buyer_user_id=? AND c.community_id=? AND m.mapping_id=?
      AND review.disposition='remove_candidate' AND review.decision!='remove' AND event.status='review'
      AND (review.affected_paid_invoice_id IS NULL OR EXISTS (
        SELECT 1 FROM partner_alert_stripe_paid_terms term
        WHERE term.claim_id=c.claim_id AND term.invoice_id=review.affected_paid_invoice_id
          AND term.starts_at_ms<=? AND term.ends_at_ms>?
      ))
      ${notEnded}
      AND NOT EXISTS (SELECT 1 FROM partner_alert_stripe_events ended
        WHERE ended.claim_id=c.claim_id AND ended.environment=c.environment
          AND ended.kind='customer.subscription.deleted' AND ended.status='applied' AND ended.received_at_ms<=?)
      AND NOT EXISTS (SELECT 1 FROM partner_alert_stripe_review_decisions accepted
        JOIN partner_alert_stripe_events settled ON settled.environment=accepted.environment
          AND settled.stripe_account_id=accepted.stripe_account_id AND settled.event_id=accepted.event_id AND settled.claim_id=accepted.claim_id
        WHERE accepted.claim_id=c.claim_id AND accepted.decision='remove' AND settled.status!='ignored'
          AND (accepted.affected_paid_invoice_id IS NULL OR accepted.affected_paid_invoice_id IS review.affected_paid_invoice_id))
      LIMIT 1`)
    .get(target.environment, target.userId, target.communityId, target.mappingId, at, at, ...closureAt, at));
  const offerRows = db.prepare(`SELECT o.offer_json,o.review_state,json_extract(o.offer_json,'$.billingProvider') AS provider
    FROM partner_alert_offers o JOIN partner_alert_offer_channels m
      ON m.community_id=o.community_id AND m.offer_id=o.offer_id AND m.offer_version=o.version
    WHERE o.community_id=? AND m.mapping_id=? AND o.review_state IN ('approved','withdrawn')
      AND (o.whop_environment IS NULL OR o.whop_environment=?)
    ORDER BY o.offer_id,o.version LIMIT 101`).all(target.communityId, target.mappingId, whopSandbox ? "sandbox" : "live") as
    { offer_json: string; review_state: string; provider: string | null }[];
  if (offerRows.length > 100) throw new Error("Stripe offer scope is too large.");
  const stripeOnlyOffers = offerRows.filter(row => row.provider === "stripe" && row.review_state === "approved").map(row => {
    const offer = parsePartnerAlertCheckoutOffer(JSON.parse(row.offer_json));
    if (!("billingProvider" in offer) || offer.communityId !== target.communityId || !offer.mappingIds.includes(target.mappingId)) {
      throw new Error("Stripe approval scope changed.");
    }
    return { offerId: offer.offerId, offerVersion: offer.version, mappingIds: offer.mappingIds };
  });
  return { holdRemoval, stripeOnlyOffers, ...(whopSandbox ? { whopSandbox: true as const } : {}),
    noLegacyWhopOffers: offerRows.every(row => row.provider === "stripe"),
    paidOffers: paidOffers.map(row => ({ offerId: row.offer_id, offerVersion: row.offer_version,
      paidThroughUtc: new Date(row.paid_through_ms).toISOString() })) };
}

export function readPartnerAlertStripeContextFacts(db: Database.Database, scope: Omit<StripeChannelFunding, "atMs" | "environment">) {
  const rows = db.prepare(`SELECT c.environment,c.stripe_account_id,c.claim_id,c.offer_id,c.offer_version,c.stripe_subscription_id,
      e.event_id,e.kind,e.resource_id,e.body_sha256,e.received_at_ms,e.status,
      r.affected_paid_invoice_id,r.decision,r.disposition,t.invoice_id,t.starts_at_ms,t.ends_at_ms
    FROM partner_alert_stripe_checkout_claims c
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    JOIN partner_alert_stripe_events e ON e.claim_id=c.claim_id
    LEFT JOIN partner_alert_stripe_review_decisions r ON r.environment=e.environment AND r.stripe_account_id=e.stripe_account_id
      AND r.event_id=e.event_id AND r.claim_id=e.claim_id
    LEFT JOIN partner_alert_stripe_paid_terms t ON t.environment=e.environment AND t.stripe_account_id=e.stripe_account_id
      AND t.source_event_id=e.event_id AND t.claim_id=e.claim_id
    WHERE c.community_id=? AND c.buyer_user_id=? AND m.mapping_id=?
    ORDER BY c.claim_id,e.event_id,t.invoice_id LIMIT 1001`)
    .raw().all(scope.communityId, scope.userId, scope.mappingId);
  if (rows.length > 1000) throw new Error("Stripe funding evidence is too large.");
  return rows;
}
