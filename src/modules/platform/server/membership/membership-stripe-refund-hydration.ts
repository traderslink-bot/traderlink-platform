import { z } from "zod";
import { stripeRequest } from "./membership-stripe-http";
import { stripeInvoiceSubscription, stripeReference } from "./membership-addon-amendment-evidence";

const record = z.record(z.string(), z.unknown());
const records = z.array(record);
const amount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export type MembershipStripeRefundEvidence = Readonly<{
  chargeId: string;
  fullyRefunded: boolean;
  invoice: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  session: Record<string, unknown> | null;
}>;

export function isMembershipStripeRefundEvent(type: string): boolean {
  return ["charge.refunded", "refund.created", "refund.updated", "refund.failed"].includes(type);
}

/** Provider reads finish before the SQLite projection transaction starts. */
export async function hydrateMembershipStripeRefund(
  event: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const data = record.parse(record.parse(event.data).object);
  const chargeId = stripeReference(event.type === "charge.refunded" ? data.id : data.charge);
  if (!chargeId) throw new Error("Refund has no charge reference.");
  const charge = await stripeRequest(`charges/${encodeURIComponent(chargeId)}`);
  if (charge.id !== chargeId || charge.livemode !== event.livemode) throw new Error("Refund charge identity mismatch.");
  const captured = amount.parse(charge.amount_captured ?? charge.amount);
  if (!captured) return null;
  const refunds = await stripeRequest(`refunds?charge=${encodeURIComponent(chargeId)}&limit=100`);
  if (refunds.has_more === true) throw new Error("Refund needs complete settlement evidence.");
  const settled = records.parse(refunds.data).reduce((total, refund) => {
    if (stripeReference(refund.charge) !== chargeId) throw new Error("Refund belongs to another charge.");
    return refund.status === "succeeded" ? total + amount.parse(refund.amount) : total;
  }, 0);
  if (!Number.isSafeInteger(settled) || settled > captured) throw new Error("Refund settlement amount is invalid.");
  const fullyRefunded = settled === captured && charge.refunded === true && amount.parse(charge.amount_refunded) >= captured;
  const paymentIntentId = stripeReference(charge.payment_intent);
  if (!paymentIntentId) throw new Error("Refund has no payment reference.");
  const payments = await stripeRequest(`invoice_payments?payment[type]=payment_intent&payment[payment_intent]=${encodeURIComponent(paymentIntentId)}&limit=2`);
  const matches = records.parse(payments.data);
  if (payments.has_more === true || matches.length > 1) throw new Error("Refund invoice is ambiguous.");
  let invoice: Record<string, unknown> | null = null;
  let subscription: Record<string, unknown> | null = null;
  let session: Record<string, unknown> | null = null;
  if (matches.length) {
    const payment = record.parse(matches[0].payment);
    if (payment.type !== "payment_intent" || stripeReference(payment.payment_intent) !== paymentIntentId || matches[0].status !== "paid") {
      throw new Error("Refund invoice payment mismatch.");
    }
    const invoiceId = stripeReference(matches[0].invoice);
    if (!invoiceId) throw new Error("Refund invoice is missing.");
    invoice = await stripeRequest(`invoices/${encodeURIComponent(invoiceId)}`);
    if (invoice.id !== invoiceId || invoice.livemode !== event.livemode ||
      stripeReference(invoice.customer) !== stripeReference(charge.customer) ||
      invoice.currency !== charge.currency || amount.parse(invoice.amount_paid) !== captured) {
      throw new Error("Refund does not cover the exact invoice payment.");
    }
    const subscriptionId = stripeInvoiceSubscription(invoice);
    if (!subscriptionId) return null; // Unrelated Stripe invoices are not Membership purchases.
    subscription = await stripeRequest(`subscriptions/${encodeURIComponent(subscriptionId)}`);
    if (subscription.id !== subscriptionId || subscription.livemode !== event.livemode ||
      stripeReference(subscription.customer) !== stripeReference(charge.customer)) throw new Error("Refund subscription mismatch.");
    if (typeof record.parse(subscription.metadata ?? {}).membership_claim_id !== "string") return null;
  } else {
    const sessions = await stripeRequest(`checkout/sessions?payment_intent=${encodeURIComponent(paymentIntentId)}&limit=2`);
    const candidates = records.parse(sessions.data);
    if (sessions.has_more === true || candidates.length > 1) throw new Error("Refund checkout is ambiguous.");
    if (!candidates.length) return null;
    session = candidates[0];
    if (session.livemode !== event.livemode || stripeReference(session.payment_intent) !== paymentIntentId ||
      session.mode !== "payment" || session.payment_status !== "paid" ||
      session.currency !== charge.currency || amount.parse(session.amount_total) !== captured ||
      (session.customer && stripeReference(session.customer) !== stripeReference(charge.customer))) throw new Error("Refund checkout payment mismatch.");
    if (typeof record.parse(session.metadata ?? {}).membership_claim_id !== "string") return null;
  }
  const evidence: MembershipStripeRefundEvidence = { chargeId, fullyRefunded, invoice, subscription, session };
  return { membershipRefund: evidence };
}
