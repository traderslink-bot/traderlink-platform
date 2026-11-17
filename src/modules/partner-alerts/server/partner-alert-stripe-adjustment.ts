import type Database from "better-sqlite3";
import { membershipStripeAmount } from "../../platform/server/membership/membership-stripe-http";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import type { PartnerStripeAdjustment, PartnerStripeAdjustmentKind,
  PartnerStripePendingInvoiceAdjustment } from "./database/partner-alert-stripe-adjustment-writer";
import { readPartnerAlertStripeClaim, type PartnerAlertStripeClaim } from "./database/partner-alert-stripe-invoice-writer";
import { partnerStripeCheckoutClaimMetadata, partnerStripeId, partnerStripeInvoiceSubscription,
  partnerStripeSubscriptionIsEnded, verifyPartnerAlertStripeCheckout,
  type PartnerAlertStripePaidInvoice, type PartnerAlertStripeRequest } from "./partner-alert-stripe-paid-invoice";

export function partnerStripeAdjustmentKind(value: unknown): PartnerStripeAdjustmentKind | null {
  if (value === "refund.created" || value === "refund.updated" || value === "refund.failed") return "charge.refunded";
  if (value === "charge.dispute.updated" || value === "charge.dispute.funds_reinstated") return "charge.dispute.closed";
  return value === "invoice.payment_failed" || value === "charge.refunded" || value === "charge.dispute.created"
    || value === "charge.dispute.closed" || value === "customer.subscription.deleted" ? value : null;
}

export function partnerStripeAdjustmentResource(kind: PartnerStripeAdjustmentKind, resource: Record<string, unknown>): string {
  if (kind === "invoice.payment_failed") return partnerStripeId(resource.id, "in_");
  if (kind === "customer.subscription.deleted") return partnerStripeId(resource.id, "sub_");
  if (kind === "charge.refunded") return partnerStripeId(resource.id, "ch_");
  return partnerStripeId(resource.id, String(resource.id).startsWith("du_") ? "du_" : "dp_");
}

const refundStatuses = new Set(["pending", "requires_action", "succeeded", "failed", "canceled"]);

async function readSucceededRefundAmount(stripe: PartnerAlertStripeRequest,
  charge: Readonly<{ id: string; paymentIntentId: string; currency: string; amount: number }>): Promise<number> {
  const ids = new Set<string>();
  const query = new URLSearchParams({ charge: charge.id, limit: "100" });
  let succeeded = 0;
  for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
    const page = await stripe(`refunds?${query}`);
    if (!Array.isArray(page.data) || page.data.length > 100 || typeof page.has_more !== "boolean") {
      throw new Error("Stripe refunds are incomplete.");
    }
    let lastId: string | undefined;
    for (const value of page.data) {
      const refund = partnerAlertRecord(value, "stripeRefund");
      const id = partnerStripeId(refund.id, String(refund.id).startsWith("pyr_") ? "pyr_" : "re_");
      if (ids.has(id) || refund.charge !== charge.id || refund.currency !== charge.currency
        || refund.payment_intent !== charge.paymentIntentId && refund.payment_intent !== null
        || typeof refund.amount !== "number" || !Number.isSafeInteger(refund.amount)
        || refund.amount <= 0 || refund.amount > charge.amount
        || typeof refund.status !== "string" || !refundStatuses.has(refund.status)) {
        throw new Error("Stripe refund does not match the exact charge.");
      }
      if (refund.status === "succeeded") succeeded += refund.amount;
      if (succeeded > charge.amount) throw new Error("Stripe refund total exceeds the original charge.");
      ids.add(id);
      lastId = id;
    }
    if (!page.has_more && ids.size) return succeeded;
    if (!lastId) throw new Error("Stripe refunds are incomplete.");
    query.set("starting_after", lastId);
  }
  throw new Error("Stripe refunds are incomplete.");
}

/** Hydrate on the connected seller's account before entering the writer. */
export async function readPartnerAlertStripeAdjustment(input: Readonly<{
  database: Database.Database;
  stripe: PartnerAlertStripeRequest;
  environment: PartnerAlertStripeClaim["environment"];
  accountId: string;
  kind: PartnerStripeAdjustmentKind;
  resourceId: string;
  nowMs: number;
  terminalDisputeOnly?: boolean;
  settlingInvoice?: Readonly<{ claim: PartnerAlertStripeClaim; paid: PartnerAlertStripePaidInvoice }>;
}>): Promise<PartnerStripeAdjustment | PartnerStripePendingInvoiceAdjustment | "unsettled" | null> {
  const { database: db, stripe, environment, accountId, kind, resourceId } = input;
  const live = environment === "live";
  const unpaidAppClaim = (subscription: Record<string, unknown>) => {
    if (subscription.livemode !== live) throw new Error("Stripe subscription mode changed.");
    const metadata = partnerAlertRecord(subscription.metadata, "stripeSubscriptionMetadata");
    const claimId = metadata[partnerStripeCheckoutClaimMetadata];
    return typeof claimId === "string" && /^[0-9a-f-]{36}$/ui.test(claimId)
      ? readPartnerAlertStripeClaim(db, environment, accountId, claimId) : undefined;
  };
  const readClaimForSubscription = (subscriptionId: string) => {
    const claimId = db.prepare(`SELECT claim_id FROM partner_alert_stripe_checkout_claims
      WHERE environment=? AND stripe_account_id=? AND stripe_subscription_id=?`)
      .pluck().get(environment, accountId, subscriptionId);
    return typeof claimId === "string" ? readPartnerAlertStripeClaim(db, environment, accountId, claimId) : undefined;
  };

  if (kind === "invoice.payment_failed") {
    const invoice = await stripe(`invoices/${resourceId}`);
    if (invoice.id !== resourceId || invoice.livemode !== live) throw new Error("Stripe renewal invoice changed.");
    if (invoice.billing_reason !== "subscription_cycle") return null;
    const subscriptionId = partnerStripeInvoiceSubscription(invoice);
    const claim = readClaimForSubscription(subscriptionId);
    if (!claim) {
      const subscription = await stripe(`subscriptions/${subscriptionId}`);
      if (subscription.id !== subscriptionId) throw new Error("Stripe subscription changed.");
      return unpaidAppClaim(subscription) ? "unsettled" : null;
    }
    if (claim.stripe_customer_id !== invoice.customer) throw new Error("Stripe renewal buyer changed.");
    // A failed attempt never changes an existing paid term. A late failure
    // delivered after payment records that current access was retained.
    return { claim, resourceId, affectedInvoiceId: null, disposition: invoice.status === "paid" ? "retain" : "review" };
  }

  if (kind === "customer.subscription.deleted") {
    const subscription = await stripe(`subscriptions/${resourceId}`);
    if (subscription.id !== resourceId || subscription.livemode !== live || !partnerStripeSubscriptionIsEnded(subscription, input.nowMs)) {
      throw new Error("Stripe cancellation was not verified.");
    }
    const claimed = unpaidAppClaim(subscription);
    const claim = readClaimForSubscription(resourceId);
    if (!claim) {
      if (!claimed) return null;
      if (!claimed.stripe_session_id) return "unsettled";
      const customerId = partnerStripeId(subscription.customer, "cus_");
      const sessionId = await verifyPartnerAlertStripeCheckout({ stripe, sessionId: claimed.stripe_session_id,
        claimId: claimed.claim_id, subscriptionId: resourceId, customerId, livemode: live });
      return { claim: claimed, resourceId, affectedInvoiceId: null, disposition: "remove_candidate",
        endedCheckout: { sessionId, subscriptionId: resourceId, customerId } };
    }
    if (claimed?.claim_id !== claim.claim_id || subscription.customer !== claim.stripe_customer_id) {
      throw new Error("Stripe cancellation buyer changed.");
    }
    return { claim, resourceId, affectedInvoiceId: null, disposition: "remove_candidate" };
  }

  let chargeId = resourceId;
  let disputeDisposition: PartnerStripeAdjustment["disposition"] = "review";
  if (kind !== "charge.refunded") {
    const dispute = await stripe(`disputes/${resourceId}`);
    if (dispute.id !== resourceId || dispute.livemode !== live) throw new Error("Stripe dispute changed.");
    chargeId = partnerStripeId(dispute.charge, "ch_");
    if (dispute.status === "lost") disputeDisposition = "remove_candidate";
    if (dispute.status === "won" || dispute.status === "warning_closed" || dispute.status === "prevented") {
      disputeDisposition = "retain";
    }
    if (input.terminalDisputeOnly && disputeDisposition === "review") return null;
  }
  const charge = await stripe(`charges/${chargeId}`);
  if (charge.id !== chargeId || charge.livemode !== live || charge.paid !== true) throw new Error("Stripe charge changed.");
  const intentId = partnerStripeId(charge.payment_intent, "pi_");
  const storedTerm = db.prepare(`SELECT claim_id,invoice_id,amount_minor,currency FROM partner_alert_stripe_paid_terms
    WHERE environment=? AND stripe_account_id=? AND payment_intent_id=?`).get(environment, accountId, intentId) as
    { claim_id: string; invoice_id: string; amount_minor: number; currency: string } | undefined;
  const settling = input.settlingInvoice;
  const matchesSettlingInvoice = settling?.paid.paymentIntentId === intentId && settling.claim.environment === environment
    && settling.claim.stripe_account_id === accountId;
  const term = storedTerm ?? (matchesSettlingInvoice ? { claim_id: settling.claim.claim_id, invoice_id: settling.paid.invoiceId,
    amount_minor: settling.claim.amount_minor, currency: settling.paid.currency } : undefined);
  if (!term) {
    if (settling) return "unsettled";
    const query = new URLSearchParams({ "payment[type]": "payment_intent", "payment[payment_intent]": intentId, status: "paid", limit: "2" });
    const payments = await stripe(`invoice_payments?${query}`);
    if (!Array.isArray(payments.data) || payments.has_more !== false || payments.data.length > 1) {
      throw new Error("Stripe adjustment payment is ambiguous.");
    }
    if (!payments.data.length) return null;
    const payment = partnerAlertRecord(payments.data[0], "stripeAdjustmentPayment");
    const source = partnerAlertRecord(payment.payment, "stripeAdjustmentPaymentSource");
    if (source.type !== "payment_intent" || source.payment_intent !== intentId
      || payment.status !== "paid" || payment.livemode !== live) throw new Error("Stripe adjustment payment changed.");
    const invoiceId = partnerStripeId(payment.invoice, "in_");
    const invoice = await stripe(`invoices/${invoiceId}`);
    if (invoice.id !== invoiceId || invoice.livemode !== live) throw new Error("Stripe adjustment invoice changed.");
    if (!["subscription_create", "subscription_cycle"].includes(String(invoice.billing_reason))) return null;
    const subscriptionId = partnerStripeInvoiceSubscription(invoice);
    const subscription = await stripe(`subscriptions/${subscriptionId}`);
    if (subscription.id !== subscriptionId) throw new Error("Stripe adjustment subscription changed.");
    const claim = unpaidAppClaim(subscription);
    return claim ? { pendingInvoice: true, claim, resourceId } : null;
  }
  const claim = readPartnerAlertStripeClaim(db, environment, accountId, term.claim_id);
  const stripeAmount = membershipStripeAmount(term.amount_minor, term.currency.toUpperCase());
  const customerId = !storedTerm && matchesSettlingInvoice ? settling.paid.customerId : claim?.stripe_customer_id;
  if (!claim || charge.customer !== customerId || charge.currency !== term.currency
    || String(charge.amount) !== stripeAmount || String(charge.amount_captured) !== stripeAmount) {
    throw new Error("Stripe adjustment does not match the exact payment.");
  }

  if (kind === "charge.refunded") {
    const succeeded = await readSucceededRefundAmount(stripe, { id: chargeId, paymentIntentId: intentId,
      currency: term.currency, amount: Number(stripeAmount) });
    const disposition = succeeded === Number(stripeAmount) ? "remove_candidate" : succeeded > 0 ? "review" : "retain";
    return { claim, resourceId, affectedInvoiceId: term.invoice_id, disposition };
  }
  return { claim, resourceId, affectedInvoiceId: term.invoice_id, disposition: disputeDisposition };
}
