import { PartnerAlertValidationError, type PartnerAlertPublishingQuote, type PartnerAlertWhopBinding } from "../contracts/partner-alert-contracts";
import { partnerAlertAmountToMinor, quotePartnerAlertPublishing, type PartnerAlertPricingCapabilities } from "../contracts/partner-alert-publishing-pricing";
import { parsePartnerAlertCadence, parsePartnerAlertCurrency, parsePartnerAlertPublishingTerms, parsePartnerAlertWhopBinding,
  partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";

/** Declared read observation only; this shape establishes no native provenance. */
export type PartnerAlertPublishingNativeObservation = Readonly<{
  environment: "sandbox" | "live"; accountId: string; requestedId: string;
  apiVersionDate: typeof PARTNER_ALERT_WHOP_API_VERSION; observedAtUtc: string; native: unknown;
}>;
export type PartnerAlertPublishingPaymentInput = Readonly<{
  nowUtc: string; maximumEvidenceAgeMs: number; expectedRulesVersion: number;
  capabilities: PartnerAlertPricingCapabilities;
  agreement: Readonly<{ agreementId: string; communityId: string; version: number; terms: unknown; quote: unknown;
    contractedChannels: number; proposedByUserId: string; proposedAtUtc: string;
    acceptance: Readonly<{ acceptedByUserId: string; acceptedAtUtc: string; rulesVersion: number }> }>;
  /** Actual current owner, acceptance and Whop links still require runtime proof. */
  platformOwner: Readonly<{ userId: string; whopUserId: string }>;
  payer: Readonly<{ userId: string; whopUserId: string; whopUserRef: string; observedAtUtc: string; validUntilUtc: string }>;
  binding: Readonly<{ agreementId: string; agreementVersion: number; communityId: string;
    whop: PartnerAlertWhopBinding; publishingMembershipId: string }>;
  claimedGenerations: Readonly<{ identity: number; agreement: number; connection: number; erasure: number }>;
  policy: Readonly<{ refundPolicy: "any_refund_revokes" | "full_refund_revokes";
    disputePolicy: "withhold_observed_dispute" }>;
  permissionClaims: Readonly<{ membershipRead: boolean; paymentRead: boolean; disputeRead: boolean }>;
  observations: Readonly<{ account: PartnerAlertPublishingNativeObservation; variant: PartnerAlertPublishingNativeObservation;
    membership: PartnerAlertPublishingNativeObservation; payments: readonly PartnerAlertPublishingNativeObservation[];
    paymentsComplete: boolean }>;
}>;
type ReviewReason = "invalid_input" | "agreement_mismatch" | "acceptance_unqualified" | "quote_mismatch"
  | "free_terms_require_separate_authority" | "calendar_month_native_unqualified" | "scope_mismatch"
  | "stale_observation" | "permissions_unqualified" | "provider_shape_unqualified" | "adjustments_unqualified"
  | "trial_unqualified" | "period_or_proration_unqualified" | "payment_discovery_incomplete"
  | "ambiguous_payments" | "refund_or_dispute_unqualified" | "payment_predates_acceptance"
  | "subscription_state_requires_policy";
const QUALIFICATION = Object.freeze([
  "current_platform_owner_community_owner_and_verified_whop_payer_provenance",
  "immutable_accepted_agreement_and_exclusive_membership_binding",
  "actual_native_environment_api_version_permissions_and_complete_receipt_reads",
  "current_identity_agreement_connection_and_erasure_generation_fence",
  "reviewed_native_refund_dispute_policy_and_transactional_application",
] as const);
export type PartnerAlertPublishingPaymentPreparation = Readonly<{
  kind: "prepared_observation" | "needs_review";
  canApply: false;
  provenance: "current_runtime_unbound";
  requiresRuntimeQualification: typeof QUALIFICATION;
  reviewReason: ReviewReason | null;
  observation: Readonly<{
    agreementId: string; agreementVersion: number; communityId: string; whop: PartnerAlertWhopBinding;
    publishingMembershipId: string; payerUserRef: string; quote: PartnerAlertPublishingQuote;
    claimedGenerations: PartnerAlertPublishingPaymentInput["claimedGenerations"];
    /** Native/commercial observation, not an active publishing grant. */
    observedFeeState: "paid_period" | "withheld" | "unknown";
    reason: "paid_receipt" | "subscription_ended" | "period_ended" | "no_settled_receipt" | "refund" | "dispute";
    paymentId: string | null; periodStartUtc: string | null; periodEndUtc: string | null;
    observedAtUtc: string; validUntilUtc: string;
  }> | null;
}>;
class Review extends Error {
  constructor(readonly reason: ReviewReason) { super("The publishing payment needs verification."); }
}
function fail(reason: ReviewReason): never { throw new Review(reason); }
function id(value: unknown, prefix: string): string {
  if (typeof value !== "string" || value.length > 128 || !value.startsWith(prefix)
    || value.length <= prefix.length || !/^[A-Za-z0-9_]+$/u.test(value)) fail("scope_mismatch");
  return value;
}
function money(value: unknown, quote: PartnerAlertPublishingQuote): number {
  const data = partnerAlertRecord(value, "money");
  if (data.currency !== quote.currency.code.toLowerCase() || data.decimals !== quote.currency.minorUnitDigits) fail("adjustments_unqualified");
  return partnerAlertAmountToMinor(data.amount, quote.currency);
}
function price(value: unknown, quote: PartnerAlertPublishingQuote): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail("provider_shape_unqualified");
  return partnerAlertAmountToMinor(String(value), quote.currency);
}
function compareQuote(value: unknown, expected: PartnerAlertPublishingQuote): void {
  const raw = partnerAlertRecord(value, "acceptedQuote");
  partnerAlertExactKeys(raw, Object.keys(expected), "acceptedQuote");
  const currency = parsePartnerAlertCurrency(raw.currency); const cadence = parsePartnerAlertCadence(raw.cadence);
  if (currency.code !== expected.currency.code || currency.minorUnitDigits !== expected.currency.minorUnitDigits
    || cadence.unit !== expected.cadence.unit || cadence.count !== expected.cadence.count) fail("quote_mismatch");
  for (const key of Object.keys(expected) as (keyof PartnerAlertPublishingQuote)[]) {
    if (key !== "currency" && key !== "cadence" && raw[key] !== expected[key]) fail("quote_mismatch");
  }
}

/** Pure composition, never invoked by this source-authoring task. No GET,
 * crypto, DB, persistence, billing write, activation or current-agreement change.
 * It does not create a synthetic subscriber Offer or accept caller observations
 * as authority. Every result remains canApply:false until reviewed integration. */
export function normalizePartnerAlertPublishingPayment(input: PartnerAlertPublishingPaymentInput): PartnerAlertPublishingPaymentPreparation {
  const result = (observation: PartnerAlertPublishingPaymentPreparation["observation"], reviewReason: ReviewReason | null = null): PartnerAlertPublishingPaymentPreparation =>
    Object.freeze({ kind: reviewReason ? "needs_review" : "prepared_observation", canApply: false,
      provenance: "current_runtime_unbound", requiresRuntimeQualification: QUALIFICATION, reviewReason, observation });
  try {
    const now = partnerAlertUtc(input.nowUtc, "nowUtc");
    const maximumAge = partnerAlertInteger(input.maximumEvidenceAgeMs, "maximumEvidenceAgeMs", 1, 86_400_000);
    const terms = parsePartnerAlertPublishingTerms(input.agreement.terms);
    const agreementId = partnerAlertId(input.agreement.agreementId, "agreementId");
    const communityId = partnerAlertId(input.agreement.communityId, "communityId");
    const version = partnerAlertInteger(input.agreement.version, "agreementVersion", 1);
    if (agreementId !== terms.termsId || communityId !== terms.communityId || version !== terms.version) fail("agreement_mismatch");
    if (terms.cadence.unit !== "day") fail("calendar_month_native_unqualified");
    const quote = quotePartnerAlertPublishing({ terms, contractedChannels: input.agreement.contractedChannels, capabilities: input.capabilities });
    compareQuote(input.agreement.quote, quote);
    if (quote.totalMinor === 0) fail("free_terms_require_separate_authority");
    const ownerId = partnerAlertId(input.platformOwner.userId, "platformOwnerUserId");
    const payerId = partnerAlertId(input.payer.userId, "payerUserId");
    const ownerWhopId = id(input.platformOwner.whopUserId, "user_"); const payerWhopId = id(input.payer.whopUserId, "user_");
    if (!/^[0-9a-f]{64}$/u.test(input.payer.whopUserRef)) fail("scope_mismatch");
    const proposed = partnerAlertUtc(input.agreement.proposedAtUtc, "proposedAtUtc");
    const accepted = partnerAlertUtc(input.agreement.acceptance.acceptedAtUtc, "acceptedAtUtc");
    if (input.agreement.proposedByUserId !== ownerId || input.agreement.acceptance.acceptedByUserId !== payerId
      || proposed > accepted || accepted > now || input.agreement.acceptance.rulesVersion
        !== partnerAlertInteger(input.expectedRulesVersion, "expectedRulesVersion", 1)) fail("acceptance_unqualified");
    const whop = parsePartnerAlertWhopBinding(input.binding.whop);
    const membershipId = id(input.binding.publishingMembershipId, "mem_");
    if (input.binding.agreementId !== agreementId || input.binding.agreementVersion !== version
      || input.binding.communityId !== communityId) fail("agreement_mismatch");
    const generations = Object.freeze({ identity: partnerAlertInteger(input.claimedGenerations.identity, "identityGeneration", 1),
      agreement: partnerAlertInteger(input.claimedGenerations.agreement, "agreementGeneration", 1),
      connection: partnerAlertInteger(input.claimedGenerations.connection, "connectionGeneration", 1),
      erasure: partnerAlertInteger(input.claimedGenerations.erasure, "erasureGeneration", 1) });
    if (input.permissionClaims.membershipRead !== true || input.permissionClaims.paymentRead !== true
      || input.permissionClaims.disputeRead !== true) fail("permissions_unqualified");
    if (!["any_refund_revokes", "full_refund_revokes"].includes(input.policy.refundPolicy)
      || input.policy.disputePolicy !== "withhold_observed_dispute") fail("refund_or_dispute_unqualified");
    const observed: string[] = []; const deadlines: string[] = [];
    const window = (observedAt: string): void => {
      const at = partnerAlertUtc(observedAt, "observedAtUtc");
      if (at > now || Date.parse(now) - Date.parse(at) >= maximumAge) fail("stale_observation");
      observed.push(at); deadlines.push(partnerAlertUtc(new Date(Date.parse(at) + maximumAge).toISOString(), "evidenceDeadline"));
    };
    window(input.payer.observedAtUtc);
    const payerUntil = partnerAlertUtc(input.payer.validUntilUtc, "payerValidUntilUtc");
    if (payerUntil <= now || payerUntil <= input.payer.observedAtUtc) fail("stale_observation");
    deadlines.push(payerUntil);
    const read = (observation: PartnerAlertPublishingNativeObservation, requestedId: string): Record<string, unknown> => {
      if (observation.environment !== whop.environment || observation.accountId !== whop.accountId
        || observation.requestedId !== requestedId || observation.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION) fail("scope_mismatch");
      window(observation.observedAtUtc);
      const data = partnerAlertRecord(observation.native, "nativeObservation");
      if (data.id !== requestedId) fail("scope_mismatch");
      return data;
    };
    const account = read(input.observations.account, whop.accountId);
    if (account.status !== "active" || partnerAlertRecord(account.owner, "accountOwner").id !== ownerWhopId) fail("scope_mismatch");
    const variant = read(input.observations.variant, whop.planId);
    if (partnerAlertRecord(variant.account, "variantAccount").id !== whop.accountId
      || partnerAlertRecord(variant.product, "variantProduct").id !== whop.productId) fail("scope_mismatch");
    if (variant.billing_type !== "renewal" || variant.billing_period !== quote.cadence.count
      || variant.currency !== quote.currency.code.toLowerCase() || price(variant.initial_price, quote) !== 0
      || price(variant.renewal_price, quote) !== quote.totalMinor || money(variant.initial_price_due, quote) !== quote.totalMinor) fail("quote_mismatch");
    if (variant.adaptive_pricing_enabled !== false || variant.allow_multiple_quantity !== false
      || variant.split_pay_required_payments !== null || variant.collect_tax !== false || variant.offer_cancel_discount !== false
      || variant.release_method !== "buy_now" || !["visible", "hidden", "quick_link"].includes(String(variant.visibility))) fail("adjustments_unqualified");
    if (variant.trial_period_days !== null && variant.trial_period_days !== 0) fail("trial_unqualified");
    const membership = read(input.observations.membership, membershipId);
    if (partnerAlertRecord(membership.account, "membershipAccount").id !== whop.accountId || membership.user_id !== payerWhopId
      || membership.product_id !== whop.productId || partnerAlertRecord(membership.product, "membershipProduct").id !== whop.productId
      || membership.variant_id !== whop.planId) fail("scope_mismatch");
    if (membership.promo_code_id !== null) fail("adjustments_unqualified");
    if (input.observations.membership.observedAtUtc < accepted
      || input.observations.membership.observedAtUtc < input.payer.observedAtUtc) fail("acceptance_unqualified");
    const prepared = (state: "paid_period" | "withheld" | "unknown", why: NonNullable<PartnerAlertPublishingPaymentPreparation["observation"]>["reason"],
      paymentId: string | null, start: string | null, end: string | null, paidDeadline?: string): PartnerAlertPublishingPaymentPreparation => {
      const until = [...deadlines, ...(paidDeadline ? [paidDeadline] : [])].sort()[0]!;
      if (until <= now) fail("stale_observation");
      return result(Object.freeze({ agreementId, agreementVersion: version, communityId, whop,
        publishingMembershipId: membershipId, payerUserRef: input.payer.whopUserRef, quote, claimedGenerations: generations,
        observedFeeState: state, reason: why, paymentId, periodStartUtc: start, periodEndUtc: end,
        observedAtUtc: [...observed].sort()[0]!, validUntilUtc: until }));
    };
    if (membership.status === "canceled" || membership.status === "expired") {
      return prepared("withheld", "subscription_ended", null, null, null);
    }
    if (membership.status !== "active") fail("subscription_state_requires_policy");
    const start = partnerAlertUtc(membership.current_period_start, "currentPeriodStart");
    const end = partnerAlertUtc(membership.current_period_end, "currentPeriodEnd");
    const expires = membership.expires_at === null ? end : partnerAlertUtc(membership.expires_at, "expiresAtUtc");
    if (membership.billing_period_days !== quote.cadence.count || start >= end || expires < start
      || start > input.observations.membership.observedAtUtc
      || Date.parse(end) - Date.parse(start) !== quote.cadence.count * 86_400_000) fail("period_or_proration_unqualified");
    const paidDeadline = [end, expires].sort()[0]!;
    if (paidDeadline <= now) return prepared("withheld", "period_ended", null, start, end);
    if (input.observations.paymentsComplete !== true) fail("payment_discovery_incomplete");
    if (!Array.isArray(input.observations.payments) || input.observations.payments.length > 100) fail("payment_discovery_incomplete");
    const seen = new Set<string>(); const candidates: { id: string; refund: boolean; dispute: boolean }[] = [];
    for (const observation of input.observations.payments) {
      const paymentId = id(observation.requestedId, "pay_");
      if (seen.has(paymentId)) fail("ambiguous_payments"); seen.add(paymentId);
      const payment = read(observation, paymentId);
      if (payment.account_id !== whop.accountId || payment.membership_id !== membershipId || payment.product_id !== whop.productId
        || payment.variant_id !== whop.planId || partnerAlertRecord(payment.user, "payer").id !== payerWhopId) fail("scope_mismatch");
      if (!Object.hasOwn(payment, "dispute_created_at") || !Object.hasOwn(payment, "dispute_alerted_at")) fail("refund_or_dispute_unqualified");
      const disputed = payment.dispute_created_at !== null || payment.dispute_alerted_at !== null;
      for (const timestamp of [payment.dispute_created_at, payment.dispute_alerted_at]) {
        if (timestamp !== null && partnerAlertUtc(timestamp, "disputeAtUtc") > observation.observedAtUtc) fail("refund_or_dispute_unqualified");
      }
      if (["draft", "open", "authorized", "pending", "uncollectible", "void"].includes(String(payment.status))) {
        if (disputed) fail("refund_or_dispute_unqualified"); continue;
      }
      if (payment.status !== "paid") fail("provider_shape_unqualified");
      const paidAt = partnerAlertUtc(payment.paid_at, "paidAtUtc");
      if (paidAt > observation.observedAtUtc) fail("provider_shape_unqualified");
      if (paidAt < start || paidAt >= end) {
        if (disputed) fail("refund_or_dispute_unqualified"); continue;
      }
      if (paidAt < accepted) fail("payment_predates_acceptance");
      if (payment.promo_code_id !== null || payment.quote_id !== null || payment.financing_installments_count !== null
        || payment.currency !== quote.currency.code.toLowerCase()
        || !["subscription_create", "subscription_cycle", "subscription"].includes(String(payment.billing_reason))) fail("adjustments_unqualified");
      if (!Array.isArray(payment.line_items) || payment.line_items.length !== 1) fail("adjustments_unqualified");
      const line = partnerAlertRecord(payment.line_items[0], "paymentLine");
      if (line.product_id !== whop.productId || line.variant_id !== whop.planId || line.quantity !== 1
        || money(line.subtotal, quote) !== quote.totalMinor || money(payment.subtotal, quote) !== quote.totalMinor
        || money(payment.total, quote) !== quote.totalMinor
        || (payment.tax_amount !== null && money(payment.tax_amount, quote) !== 0)) fail("adjustments_unqualified");
      const refunded = money(payment.refunded_amount, quote);
      if (refunded > quote.totalMinor) fail("refund_or_dispute_unqualified");
      candidates.push({ id: paymentId, dispute: disputed,
        refund: refunded === quote.totalMinor || (refunded > 0 && input.policy.refundPolicy === "any_refund_revokes") });
    }
    if (candidates.length > 1) fail("ambiguous_payments");
    if (!candidates.length) return prepared("unknown", "no_settled_receipt", null, start, end);
    const payment = candidates[0]!;
    return payment.dispute ? prepared("withheld", "dispute", payment.id, start, end)
      : payment.refund ? prepared("withheld", "refund", payment.id, start, end)
      : prepared("paid_period", "paid_receipt", payment.id, start, end, paidDeadline);
  } catch (error) {
    return result(null, error instanceof Review ? error.reason : error instanceof PartnerAlertValidationError ? "provider_shape_unqualified" : "invalid_input");
  }
}
