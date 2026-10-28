import {
  PartnerAlertValidationError, type PartnerAlertCurrency,
  type PartnerAlertEnvironment, type PartnerAlertMembershipEvidence, type PartnerAlertOffer,
} from "../contracts/partner-alert-contracts";
import {
  parsePartnerAlertOffer, partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertUtc,
} from "../contracts/partner-alert-validation";
import { partnerAlertAmountToMinor } from "../contracts/partner-alert-publishing-pricing";
import { createPartnerAlertWhopUserReference } from "./partner-alert-credentials";
import type { PartnerAlertWhopOfferReceipt } from "./partner-alert-authority";

const unavailable = () => new PartnerAlertValidationError("whopEvidence", "The Whop subscription needs verification.");
const reference = (value: unknown, prefix: string): string => {
  if (typeof value !== "string" || value.length > 128 || !value.startsWith(prefix)
    || value.length <= prefix.length || !/^[A-Za-z0-9_]+$/u.test(value)) throw unavailable();
  return value;
};
const memberUser = (value: unknown): string => reference(value, "user_");

/** Whop's current Money.amount is an exact major-unit decimal STRING. */
function money(value: unknown, currency: PartnerAlertCurrency): number {
  const data = partnerAlertRecord(value, "money");
  if (data.currency !== currency.code.toLowerCase() || data.decimals !== currency.minorUnitDigits) throw unavailable();
  return partnerAlertAmountToMinor(data.amount, currency);
}
function numericPrice(value: unknown, currency: PartnerAlertCurrency): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw unavailable();
  return partnerAlertAmountToMinor(String(value), currency);
}
function providerUtc(value: unknown): string {
  // Require the provider's canonical UTC contract, not a guessed local timezone.
  return partnerAlertUtc(value, "providerTimestamp");
}
function windowAt(nowUtc: string, maximumAgeMs: number): Readonly<{ observedAtUtc: string; validUntilUtc: string }> {
  const at = partnerAlertUtc(nowUtc, "nowUtc");
  partnerAlertInteger(maximumAgeMs, "maximumEvidenceAgeMs", 1, 86_400_000);
  return { observedAtUtc: at, validUntilUtc: new Date(Date.parse(at) + maximumAgeMs).toISOString() };
}

export type PartnerAlertWhopAccountProof = Readonly<{
  communityId: string; ownerUserId: string; accountId: string; environment: PartnerAlertEnvironment;
  ownerWhopUserRef: string; observedAtUtc: string; validUntilUtc: string;
}>;

/** Standalone partner accounts are supported. No connected-account/parent requirement. */
export function normalizePartnerAlertWhopAccount(input: Readonly<{
  native: unknown; communityId: string; ownerUserId: string; expectedAccountId: string;
  verifiedOwnerWhopUserRef: string; environment: PartnerAlertEnvironment;
  identityKeyBase64: string; nowUtc: string; maximumEvidenceAgeMs: number;
  membershipReadAuthorised: boolean; eventsAuthorised: boolean;
}>): PartnerAlertWhopAccountProof {
  const data = partnerAlertRecord(input.native, "account");
  const communityId = partnerAlertId(input.communityId, "communityId");
  const ownerUserId = partnerAlertId(input.ownerUserId, "ownerUserId");
  const accountId = reference(data.id, "biz_");
  const owner = partnerAlertRecord(data.owner, "accountOwner");
  const ownerRef = createPartnerAlertWhopUserReference({ environment: input.environment,
    whopUserId: memberUser(owner.id), identityKeyBase64: input.identityKeyBase64 });
  if (accountId !== input.expectedAccountId || data.status !== "active"
    || ownerRef !== input.verifiedOwnerWhopUserRef || input.membershipReadAuthorised !== true
    || input.eventsAuthorised !== true) throw unavailable();
  return Object.freeze({ communityId, ownerUserId, accountId, environment: input.environment,
    ownerWhopUserRef: ownerRef, ...windowAt(input.nowUtc, input.maximumEvidenceAgeMs) });
}

/** Verify native price/cadence; channel/package selection remains an owner-reviewed app fact. */
export function normalizePartnerAlertWhopOffer(input: Readonly<{
  native: unknown; offer: unknown; accountProof: PartnerAlertWhopAccountProof;
  allowConfiguredTrial: boolean; nowUtc: string; maximumEvidenceAgeMs: number;
}>): PartnerAlertWhopOfferReceipt {
  const data = partnerAlertRecord(input.native, "variant");
  const offer = parsePartnerAlertOffer(input.offer);
  const at = partnerAlertUtc(input.nowUtc, "nowUtc");
  const proof = input.accountProof;
  if (proof.communityId !== offer.communityId || proof.accountId !== offer.whop.accountId
    || proof.environment !== offer.whop.environment || providerUtc(proof.observedAtUtc) > at
    || providerUtc(proof.validUntilUtc) <= at) throw unavailable();
  const account = partnerAlertRecord(data.account, "account");
  const product = partnerAlertRecord(data.product, "product");
  if (data.id !== offer.whop.planId || account.id !== offer.whop.accountId || product.id !== offer.whop.productId
    || data.currency !== offer.currency.code.toLowerCase() || data.billing_type !== "renewal"
    || offer.cadence.unit !== "day" || data.billing_period !== offer.cadence.count
    || numericPrice(data.initial_price, offer.currency) !== 0
    || numericPrice(data.renewal_price, offer.currency) !== offer.amountMinor
    || data.adaptive_pricing_enabled !== false || data.allow_multiple_quantity !== false
    || data.release_method !== "buy_now" || !["visible", "hidden", "quick_link"].includes(String(data.visibility))
    || data.split_pay_required_payments !== null || typeof input.allowConfiguredTrial !== "boolean") throw unavailable();
  const trialDays = data.trial_period_days === null ? 0 : partnerAlertInteger(data.trial_period_days, "trialDays", 0, 3660);
  if (trialDays > 0 && !input.allowConfiguredTrial) throw unavailable();
  // Money carries authoritative currency precision. An eligible free trial can
  // make checkout due zero; it must not be silently represented as a paid period.
  const due = money(data.initial_price_due, offer.currency);
  if (due !== offer.amountMinor && !(trialDays > 0 && input.allowConfiguredTrial && due === 0)) throw unavailable();
  const window = windowAt(at, input.maximumEvidenceAgeMs);
  return Object.freeze({ communityId: offer.communityId, communityOwnerUserId: proof.ownerUserId,
    binding: offer.whop, offer, membershipVerificationAuthorised: true,
    observedAtUtc: at, validUntilUtc: window.validUntilUtc < proof.validUntilUtc ? window.validUntilUtc : proof.validUntilUtc });
}

export type PartnerAlertWhopPaymentFact = Readonly<{
  environment: PartnerAlertEnvironment;
  paymentId: string; accountId: string; membershipId: string; productId: string; planId: string;
  whopUserRef: string; state: "paid" | "not_paid" | "uncertain";
  paidAtUtc: string | null; amountMinor: number; refundState: "none" | "partial" | "full" | "unknown";
  disputeState: "clear" | "observed" | "unverified"; observedAtUtc: string; validUntilUtc: string;
}>;

/** Discard raw card/customer/email/address/client-secret data immediately. No money movement. */
export function normalizePartnerAlertWhopPayment(input: Readonly<{
  native: unknown; offer: PartnerAlertOffer; environment: PartnerAlertEnvironment;
  verifiedWhopUserRef: string; identityKeyBase64: string; disputeReadAuthorised: boolean;
  nowUtc: string; maximumEvidenceAgeMs: number;
}>): PartnerAlertWhopPaymentFact {
  const data = partnerAlertRecord(input.native, "payment");
  const offer = parsePartnerAlertOffer(input.offer);
  if (offer.whop.environment !== input.environment || data.account_id !== offer.whop.accountId
    || data.product_id !== offer.whop.productId || data.variant_id !== offer.whop.planId) throw unavailable();
  const userRef = createPartnerAlertWhopUserReference({ environment: input.environment,
    whopUserId: memberUser(partnerAlertRecord(data.user, "user").id), identityKeyBase64: input.identityKeyBase64 });
  if (userRef !== input.verifiedWhopUserRef) throw unavailable();
  const window = windowAt(input.nowUtc, input.maximumEvidenceAgeMs);
  const paidAt = data.paid_at === null ? null : providerUtc(data.paid_at);
  if (paidAt !== null && paidAt > window.observedAtUtc) throw unavailable();
  const amount = data.total === null ? 0 : money(data.total, offer.currency);
  let refundState: PartnerAlertWhopPaymentFact["refundState"] = "unknown";
  if (data.refunded_amount !== null && data.refunded_amount !== undefined) {
    const refunded = money(data.refunded_amount, offer.currency);
    refundState = refunded === 0 ? "none" : refunded >= amount ? "full" : "partial";
  }
  const lines = data.line_items;
  const singleMatchingItem = Array.isArray(lines) && lines.length === 1
    && lines[0] !== null && typeof lines[0] === "object" && lines[0].product_id === offer.whop.productId
    && lines[0].variant_id === offer.whop.planId && lines[0].quantity === 1;
  const qualifiedReason = ["subscription_create", "subscription_cycle", "subscription"].includes(String(data.billing_reason));
  const knownDisputeFields = Object.prototype.hasOwnProperty.call(data, "dispute_created_at")
    && Object.prototype.hasOwnProperty.call(data, "dispute_alerted_at");
  const disputeState = input.disputeReadAuthorised !== true || !knownDisputeFields ? "unverified"
    : data.dispute_created_at !== null || data.dispute_alerted_at !== null ? "observed" : "clear";
  const state = data.status === "paid" && paidAt !== null && amount > 0 && singleMatchingItem && qualifiedReason
    ? "paid" : ["draft", "open", "authorized", "pending", "uncollectible", "void"].includes(String(data.status))
      ? "not_paid" : "uncertain";
  return Object.freeze({ environment: input.environment, paymentId: reference(data.id, "pay_"), accountId: offer.whop.accountId,
    membershipId: reference(data.membership_id, "mem_"), productId: offer.whop.productId, planId: offer.whop.planId,
    whopUserRef: userRef, state, paidAtUtc: paidAt, amountMinor: amount,
    refundState, disputeState, ...window });
}

/** Never infer a paid basis from list price, active status, URL return or webhook alone. */
export function normalizePartnerAlertWhopMembership(input: Readonly<{
  native: unknown; userId: string; verifiedWhopUserRef: string; offer: PartnerAlertOffer;
  identityKeyBase64: string; payment: PartnerAlertWhopPaymentFact | null;
  refundPolicy: "any_refund_revokes" | "full_refund_revokes";
  /** Must be explicitly approved before activation; resolution needs separate qualification. */
  disputePolicy: "withhold_observed_dispute";
  nowUtc: string; maximumEvidenceAgeMs: number;
}>): PartnerAlertMembershipEvidence {
  const data = partnerAlertRecord(input.native, "membership");
  const offer = parsePartnerAlertOffer(input.offer);
  const userId = partnerAlertId(input.userId, "userId");
  if (!["any_refund_revokes", "full_refund_revokes"].includes(input.refundPolicy)
    || input.disputePolicy !== "withhold_observed_dispute"
    || partnerAlertRecord(data.account, "account").id !== offer.whop.accountId
    || data.product_id !== offer.whop.productId || data.variant_id !== offer.whop.planId
    || partnerAlertRecord(data.product, "product").id !== offer.whop.productId) throw unavailable();
  const membershipId = reference(data.id, "mem_");
  const userRef = createPartnerAlertWhopUserReference({ environment: offer.whop.environment,
    whopUserId: memberUser(data.user_id), identityKeyBase64: input.identityKeyBase64 });
  if (userRef !== input.verifiedWhopUserRef) throw unavailable();
  const window = windowAt(input.nowUtc, input.maximumEvidenceAgeMs);
  const startsAtUtc = providerUtc(data.current_period_start);
  const periodEnd = providerUtc(data.current_period_end);
  const expires = data.expires_at === null ? periodEnd : providerUtc(data.expires_at);
  let validUntilUtc = [periodEnd, expires, window.validUntilUtc].sort()[0];
  let state: PartnerAlertMembershipEvidence["state"] = data.status === "active" || data.status === "trialing" ? "active"
    : ["canceled", "expired"].includes(String(data.status)) ? "inactive" : "unknown";
  let basis: PartnerAlertMembershipEvidence["basis"] = data.status === "trialing" ? "trial" : "unknown";
  if (startsAtUtc >= periodEnd || startsAtUtc > window.observedAtUtc || validUntilUtc <= window.observedAtUtc) state = "inactive";
  const payment = input.payment;
  if (payment && payment.environment === offer.whop.environment && payment.accountId === offer.whop.accountId && payment.membershipId === membershipId
    && payment.productId === offer.whop.productId && payment.planId === offer.whop.planId
    && payment.whopUserRef === userRef && payment.observedAtUtc <= window.observedAtUtc
    && payment.validUntilUtc > window.observedAtUtc && payment.state === "paid" && payment.paidAtUtc !== null
    && payment.paidAtUtc >= startsAtUtc && payment.paidAtUtc < periodEnd) {
    if (payment.disputeState === "observed" || payment.refundState === "full"
      || (payment.refundState === "partial" && input.refundPolicy === "any_refund_revokes")) state = "inactive";
    else if (payment.disputeState === "clear" && (payment.refundState === "none" || payment.refundState === "partial")) {
      basis = "paid";
      if (payment.validUntilUtc < validUntilUtc) validUntilUtc = payment.validUntilUtc;
    }
  }
  return Object.freeze({ membershipId, userId, whopUserRef: userRef, communityId: offer.communityId,
    offerId: offer.offerId, offerVersion: offer.version, whop: offer.whop, state, basis,
    observedAtUtc: window.observedAtUtc, startsAtUtc, validUntilUtc });
}
