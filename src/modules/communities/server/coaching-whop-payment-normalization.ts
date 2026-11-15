import type { CoachingDirectPurchase, CoachingPurchasePaymentEvidence } from "../contracts/coaching-direct-purchase";
import { coachingDecimalMinor } from "../contracts/coaching-commission-reconciliation";

type Money = Readonly<{ amountMinor: number; currency: string }>;
export type CoachingWhopPaymentBinding = Readonly<{
  /** Verified server-side identity link, never buyer email/name matching. */
  providerUserId: string;
  paymentId: string;
  checkoutId: string | null;
  membershipId: string | null;
  cycle?:Readonly<{invoicePaymentId:string;periodStartAtUtc:string;periodEndAtUtc:string}>;
  /** Persisted provider quote; excludes any unapproved client price/FX assumption. */
  quote: Readonly<{ serviceAmountMinor: number; presentmentTotalMinor: number; currency: string }>;
}>;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Whop native payment shape needs reconciliation.");
  return value as Record<string, unknown>;
}
function money(value: unknown): Money {
  const raw = record(value);
  if (typeof raw.amount !== "string" || typeof raw.currency !== "string" || !/^[a-z]{3}$/i.test(raw.currency)) throw new Error("Whop money shape needs reconciliation.");
  // Current application offers USD/CAD; other native scales require a qualified mapping.
  const currency = raw.currency.toUpperCase();
  if (!["USD", "CAD"].includes(currency)) throw new Error("Qualify this payment's currency precision before normalization.");
  const amountMinor = coachingDecimalMinor(raw.amount, 2);
  if (amountMinor < 0) throw new Error("Unexpected negative payment amount.");
  return Object.freeze({ amountMinor, currency });
}

/** Native2026-10-24 shape only; no legacy numeric fallback, timestamps or paid redirects. */
export function normalizeCoachingWhopPayment(input: Readonly<{
  purchase: CoachingDirectPurchase;
  binding: CoachingWhopPaymentBinding;
  payment: unknown;
}>): Readonly<{ evidence: CoachingPurchasePaymentEvidence; settlementTotal: Money; presentmentTotal: Money; presentmentRefunded: Money }> {
  const { purchase, binding } = input;
  const raw = record(input.payment);
  if (!binding.paymentId || !binding.providerUserId || raw.id !== binding.paymentId || raw.account_id !== purchase.merchantAccountId) throw new Error("Whop payment merchant or payment identity mismatch.");
  if (record(raw.user).id !== binding.providerUserId) throw new Error("Whop payment buyer does not match the verified student identity link.");
  const checkoutMatches = binding.checkoutId !== null && raw.checkout_configuration_id === binding.checkoutId;
  const cycle=purchase.billingCycle;
  const cycleMatches=cycle&&binding.cycle&&binding.membershipId===cycle.membershipId&&raw.membership_id===cycle.membershipId&&raw.billing_reason==='subscription_cycle'&&binding.cycle.invoicePaymentId===raw.id&&cycle.invoicePaymentId===raw.id&&binding.cycle.periodStartAtUtc===cycle.periodStartAtUtc&&binding.cycle.periodEndAtUtc===cycle.periodEndAtUtc&&typeof raw.created_at==='string'&&new Date(raw.created_at).toISOString()>=cycle.periodStartAtUtc&&new Date(raw.created_at).toISOString()<cycle.periodEndAtUtc;
  if (!checkoutMatches&&!cycleMatches) throw new Error("Identify the persisted checkout; membership identity alone does not identify a paid billing cycle.");
  if (raw.metadata !== null && raw.metadata !== undefined) {
    const metadata = record(raw.metadata);
    if (metadata.coaching_purchase_id !== undefined && metadata.coaching_purchase_id !== purchase.purchaseId && metadata.coaching_purchase_id!==purchase.billingCycle?.originPurchaseId) throw new Error("Whop purchase correlation conflicts with the persisted binding.");
  }
  if (!Array.isArray(raw.line_items) || raw.line_items.length !== 1) throw new Error("Qualify mixed-cart payment allocation before normalization.");
  const line = record(raw.line_items[0]);
  if (line.plan_id !== purchase.providerOffer.variantId || line.product_id !== purchase.providerOffer.productId || line.quantity !== 1) throw new Error("Whop payment does not match the purchased coaching variant.");
  const presentmentTotal = money(raw.presentment_total);
  const presentmentRefunded = money(raw.presentment_refunded_amount);
  const settlementTotal = money(raw.total);
  if (!Number.isSafeInteger(binding.quote.serviceAmountMinor) || !Number.isSafeInteger(binding.quote.presentmentTotalMinor) || binding.quote.presentmentTotalMinor < 0 || binding.quote.serviceAmountMinor !== purchase.price.amountMinor || binding.quote.currency !== purchase.price.currency || presentmentTotal.currency !== binding.quote.currency || presentmentRefunded.currency !== presentmentTotal.currency || presentmentTotal.amountMinor !== binding.quote.presentmentTotalMinor || presentmentRefunded.amountMinor > presentmentTotal.amountMinor) throw new Error("Whop payment amount/currency does not match the persisted quote.");
  // Tax/FX refund attribution needs exact provider allocation; do not silently prorate service units.
  if (presentmentRefunded.amountMinor > 0 && presentmentRefunded.amountMinor !== presentmentTotal.amountMinor && binding.quote.presentmentTotalMinor !== purchase.price.amountMinor) throw new Error("Qualify service/tax refund allocation before recording this observation.");
  const knownPaid = ["succeeded", "refunded", "auto_refunded", "partially_refunded", "dispute_warning", "dispute_needs_response", "dispute_under_review", "dispute_won", "dispute_lost", "open_dispute"];
  let status: CoachingPurchasePaymentEvidence["status"];
  if (raw.status === "paid" && knownPaid.includes(String(raw.substatus))) status = "succeeded";
  else if (raw.status === "authorized") status = "authorized";
  else if (["open", "void", "uncollectible"].includes(String(raw.status)) && ["failed", "blocked", "canceled", "uncollectible", "price_too_low"].includes(String(raw.substatus))) status = "failed";
  else if (["draft", "open", "pending", "unresolved"].includes(String(raw.status)) && ["pending", "past_due", "drafted", "incomplete", "unresolved"].includes(String(raw.substatus))) status = "pending";
  else throw new Error("Unknown or inconsistent Whop payment state requires reconciliation.");
  const disputeState: CoachingPurchasePaymentEvidence["disputeState"] = raw.substatus === "dispute_lost" ? "lost" : raw.substatus === "dispute_won" ? "won" : ["dispute_needs_response", "dispute_under_review", "open_dispute"].includes(String(raw.substatus)) ? "open" : "none";
  if (["refunded", "auto_refunded"].includes(String(raw.substatus)) && presentmentRefunded.amountMinor !== presentmentTotal.amountMinor) throw new Error("Whop refund state and amount need reconciliation.");
  if (raw.substatus === "partially_refunded" && !(presentmentRefunded.amountMinor > 0 && presentmentRefunded.amountMinor < presentmentTotal.amountMinor)) throw new Error("Whop partial refund state and amount need reconciliation.");
  return Object.freeze({ settlementTotal, presentmentTotal, presentmentRefunded, evidence: Object.freeze({
    environment: purchase.environment, purchaseId: purchase.purchaseId, paymentId: binding.paymentId,
    merchantAccountId: purchase.merchantAccountId, productId: purchase.providerOffer.productId,
    variantId: purchase.providerOffer.variantId, studentUserId: purchase.studentUserId,
    agreementId: purchase.agreement.agreementId, agreementRevision: purchase.agreement.revision,
    amountMinor: purchase.price.amountMinor, currency: purchase.price.currency, status,
    refundedAmountMinor: presentmentRefunded.amountMinor===presentmentTotal.amountMinor&&presentmentTotal.amountMinor>0?purchase.price.amountMinor:presentmentRefunded.amountMinor, disputeState,
  }) });
}
