import { partnerAlertRecord } from "../contracts/partner-alert-validation";

export const partnerStripeCheckoutClaimMetadata = "partner_checkout_claim";

export type PartnerAlertStripeRequest = (path: string, fields?: Record<string, string>,
  idempotencyKey?: string) => Promise<Record<string, unknown>>;

export function partnerStripeId(value: unknown, prefix: string): string {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length <= prefix.length
    || value.length > 128 || !/^[A-Za-z0-9_]+$/u.test(value)) throw new Error("Stripe identity mismatch.");
  return value;
}

function completeList(value: unknown) {
  const list = partnerAlertRecord(value, "stripeList");
  if (list.has_more !== false || !Array.isArray(list.data)) throw new Error("Incomplete Stripe list.");
  return list.data.map(item => partnerAlertRecord(item, "stripeItem"));
}

export function partnerStripeInvoiceSubscription(invoice: Record<string, unknown>): string {
  const parent = partnerAlertRecord(invoice.parent, "invoiceParent");
  const details = partnerAlertRecord(parent.subscription_details, "subscriptionDetails");
  return partnerStripeId(details.subscription, "sub_");
}

export type PartnerAlertStripeCheckoutIdentity = Readonly<{
  sessionId: string;
  subscriptionId: string;
  customerId: string;
}>;

export type PartnerAlertStripePaidInvoice = PartnerAlertStripeCheckoutIdentity & Readonly<{
  invoiceId: string;
  invoicePaymentId: string;
  paymentIntentId: string;
  startsAtMs: number;
  endsAtMs: number;
  stripeAmountMinor: number;
  currency: string;
}>;

export function partnerStripeSubscriptionIsEnded(subscription: Record<string, unknown>, atMs: number): boolean {
  if (subscription.status !== "canceled") return false;
  const endedAt = subscription.ended_at;
  if (typeof endedAt !== "number" || !Number.isSafeInteger(endedAt) || endedAt <= 0 || endedAt > atMs / 1000) {
    throw new Error("Stripe cancellation was not verified.");
  }
  return true;
}

export async function verifyPartnerAlertStripeCheckout(input: Readonly<{
  stripe: PartnerAlertStripeRequest; sessionId: string | null; claimId: string;
  subscriptionId: string; customerId: string; livemode: boolean;
}>): Promise<string> {
  const { stripe, claimId, subscriptionId, customerId, livemode } = input;
  const sessionId = partnerStripeId(input.sessionId, livemode ? "cs_live_" : "cs_test_");
  const session = await stripe(`checkout/sessions/${sessionId}`);
  if (session.id !== sessionId || session.client_reference_id !== claimId || session.status !== "complete"
    || session.livemode !== livemode || session.subscription !== subscriptionId || session.customer !== customerId) {
    throw new Error("Unverified Stripe checkout.");
  }
  return sessionId;
}

/** Scope every provider read to the caller's connected Stripe account. The
 * recurring line provides the paid period, and Invoice Payment proves settlement. */
export async function verifyPartnerAlertStripePaidInvoice(input: Readonly<{
  stripe: PartnerAlertStripeRequest;
  invoiceId: string;
  invoice: Record<string, unknown>;
  subscription: Record<string, unknown>;
  claimId: string;
  sessionId: string | null;
  priceId: string;
  livemode: boolean;
}>): Promise<PartnerAlertStripePaidInvoice> {
  const { stripe, invoice, subscription, claimId, livemode } = input;
  const invoiceId = partnerStripeId(input.invoiceId, "in_");
  const subscriptionId = partnerStripeInvoiceSubscription(invoice);
  const customerId = partnerStripeId(invoice.customer, "cus_");
  if (invoice.id !== invoiceId || invoice.livemode !== livemode || invoice.status !== "paid"
    || !["subscription_create", "subscription_cycle"].includes(String(invoice.billing_reason))
    || subscription.id !== subscriptionId || subscription.customer !== customerId || subscription.livemode !== livemode) {
    throw new Error("Unverified Stripe buyer.");
  }
  const sessionId = await verifyPartnerAlertStripeCheckout({ stripe, sessionId: input.sessionId, claimId,
    subscriptionId, customerId, livemode });

  const lines = completeList(await stripe(`invoices/${invoiceId}/lines?limit=100`));
  if (lines.length !== 1) throw new Error("Ambiguous Stripe invoice lines.");
  const line = lines[0]!;
  const parent = partnerAlertRecord(line.parent, "invoiceLineParent");
  const detail = partnerAlertRecord(parent.subscription_item_details, "subscriptionLine");
  const pricing = partnerAlertRecord(partnerAlertRecord(line.pricing, "linePricing").price_details, "priceDetails");
  const period = partnerAlertRecord(line.period, "invoiceLinePeriod");
  const startsAtMs = Number(period.start) * 1000;
  const endsAtMs = Number(period.end) * 1000;
  if (parent.type !== "subscription_item_details" || detail.subscription !== subscriptionId
    || detail.proration !== false || pricing.price !== input.priceId || !Number.isSafeInteger(line.amount)
    || Number(line.amount) <= 0 || line.quantity !== 1 || !Number.isSafeInteger(period.start)
    || !Number.isSafeInteger(period.end) || !Number.isSafeInteger(startsAtMs) || !Number.isSafeInteger(endsAtMs)
    || startsAtMs <= 0 || endsAtMs <= startsAtMs) {
    throw new Error("Unverified Stripe paid period.");
  }

  const payments = completeList(await stripe(`invoice_payments?invoice=${invoiceId}&status=paid&limit=100`));
  if (payments.length !== 1) throw new Error("Ambiguous Stripe invoice payments.");
  const payment = payments[0]!;
  const paymentSource = partnerAlertRecord(payment.payment, "invoicePaymentSource");
  if (payment.status !== "paid" || payment.livemode !== livemode || payment.invoice !== invoiceId
    || paymentSource.type !== "payment_intent" || !Number.isSafeInteger(payment.amount_paid)
    || Number(payment.amount_paid) <= 0 || payment.amount_paid !== invoice.amount_paid
    || payment.amount_paid !== invoice.total || typeof invoice.currency !== "string"
    || !/^[a-z]{3}$/u.test(invoice.currency) || payment.currency !== invoice.currency || line.currency !== invoice.currency) {
    throw new Error("Unverified Stripe settlement.");
  }
  return Object.freeze({ invoiceId, invoicePaymentId: partnerStripeId(payment.id, "inpay_"),
    paymentIntentId: partnerStripeId(paymentSource.payment_intent, "pi_"), sessionId, subscriptionId, customerId,
    startsAtMs, endsAtMs, stripeAmountMinor: Number(payment.amount_paid), currency: invoice.currency });
}
