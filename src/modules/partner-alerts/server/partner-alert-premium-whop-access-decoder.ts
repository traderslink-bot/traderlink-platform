import type {
  PlatformPremiumNativeCurrentAccessCollection,
  PlatformPremiumQualifiedWhopCurrentAccessDecoder,
} from "../../platform/server/membership/platform-premium-whop-current-access";

type Row = Record<string, unknown>;
type Access = "customer" | "absent" | "admin" | "unknown";
type Money = Readonly<{ amount: bigint; decimals: number; currency: string }>;
type Input = Parameters<PlatformPremiumQualifiedWhopCurrentAccessDecoder["decodeHydrated"]>[0];
type Member = PlatformPremiumNativeCurrentAccessCollection["members"][number];

/** Private provider hydration uses these raw API records only in memory. The
 * provider factory must attest their provenance before calling this decoder.
 * This pure function neither mints a prepared receipt nor writes authority. */
export type PartnerAlertPremiumWhopHydration = Readonly<{
  kind: "partner_alert_premium_whop_hydration_v1";
  account: unknown;
  variant: unknown;
  productAccess: Access;
  membershipDiscoveryComplete: boolean;
  discoveredMembershipIds: readonly string[];
  members: readonly Readonly<{
    membership: unknown;
    paymentsComplete: boolean;
    payments: readonly Readonly<{
      payment: unknown;
      refundsComplete: boolean;
      refunds: readonly unknown[];
      disputesComplete: boolean;
      disputes: readonly unknown[];
    }>[];
  }>[];
}>;

function fail(): never { throw new Error("Premium provider facts need verification."); }
const row = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value)
  ? value as Row : fail();
const list = (value: unknown): readonly unknown[] => Array.isArray(value) && value.length <= 250 ? value : fail();
const reference = (value: unknown, prefix: string): string => typeof value === "string"
  && value.startsWith(prefix) && /^[A-Za-z0-9_]{1,160}$/u.test(value) ? value : fail();
const utc = (value: string): string => new Date(value).toISOString() === value ? value : fail();
const currency = (value: unknown): string => typeof value === "string" && /^[a-zA-Z]{3}$/u.test(value)
  ? value.toUpperCase() : fail();

function money(value: unknown, expectedCurrency: string): Money {
  const item = row(value);
  if (currency(item.currency) !== expectedCurrency || !Number.isSafeInteger(item.decimals)
    || Number(item.decimals) < 0 || Number(item.decimals) > 6 || typeof item.amount !== "string"
    || !/^(0|[1-9][0-9]{0,23})(?:\.[0-9]{1,6})?$/u.test(item.amount)) fail();
  const decimals = Number(item.decimals), [whole, fraction = ""] = item.amount.split(".");
  if (fraction.length > decimals) fail();
  return { amount: BigInt(whole + fraction.padEnd(decimals, "0")), decimals, currency: expectedCurrency };
}

function positivePrice(value: unknown): boolean {
  // A price proves the reviewed variant is commercial, never that a buyer paid.
  const text = typeof value === "number" && Number.isFinite(value) ? String(value) : value;
  return typeof text === "string" && /^(0|[1-9][0-9]{0,23})(?:\.[0-9]{1,6})?$/u.test(text)
    && /[1-9]/u.test(text);
}

function status(value: unknown): Member["nativeStatus"] {
  return value === "active" || value === "past_due" || value === "canceled" || value === "expired"
    || value === "trialing" ? value : "unknown";
}

function paymentBasis(input: Readonly<{
  payment: Row; membershipId: string; source: Row; expectedCurrency: string;
  purchase: Input["purchase"]; observedAtUtc: string;
}>): NonNullable<Member["paidBasis"]> {
  const { payment, purchase, source, expectedCurrency } = input;
  const paymentRef = reference(payment.id, "pay_");
  if (payment.account_id !== purchase.offer.accountId || payment.membership_id !== input.membershipId
    || payment.product_id !== purchase.offer.productId || payment.variant_id !== purchase.offer.planId
    || row(payment.user).id !== purchase.payer.whopUserId || currency(payment.currency) !== expectedCurrency) fail();
  const total = money(payment.total, expectedCurrency), subtotal = money(payment.subtotal, expectedCurrency);
  const refunded = money(payment.refunded_amount, expectedCurrency);
  if (total.decimals !== subtotal.decimals || total.decimals !== refunded.decimals
    || subtotal.amount > total.amount || refunded.amount > total.amount) fail();
  const refunds = list(source.refunds), disputes = list(source.disputes);
  // A missing permission, failed page or unfamiliar adjustment is UNKNOWN.
  // This first qualification grants from definitively unadjusted payments only.
  const refund = source.refundsComplete === true && refunds.length === 0 && refunded.amount === BigInt(0)
    ? "none" as const : "unknown" as const;
  const dispute = source.disputesComplete === true && disputes.length === 0
    && payment.dispute_created_at === null && payment.dispute_alerted_at === null
    ? "none" as const : "unknown" as const;
  const paidAt = typeof payment.paid_at === "string" ? utc(payment.paid_at) : null;
  // subscription_create is confirmed by the real pinned API sample. Additional
  // charge reasons need their own native qualification; money alone is not one.
  const paidSubscription = payment.status === "paid" && payment.billing_reason === "subscription_create"
    && paidAt !== null && paidAt <= input.observedAtUtc && subtotal.amount > BigInt(0) && total.amount > BigInt(0);
  return {
    paymentRef,
    settlement: paidSubscription ? "settled" : payment.status === "failed" ? "failed" : "unknown",
    amountMinor: subtotal.amount.toString(), currency: expectedCurrency, refund, dispute,
  };
}

/** Version-specific decoding of real Whop facts. In particular, an old paid
 * purchase plus a free/trial sibling on the product cannot create eligibility.
 * No membership period, payment timestamp or observation deadline is converted
 * into a paid-through date. The shared receipt/reducer owns authorization. */
export function decodePartnerAlertPremiumWhopCurrentAccess(input: Input): PlatformPremiumNativeCurrentAccessCollection | null {
  try {
    const { purchase } = input;
    if (purchase.offer.environment !== "sandbox" || purchase.payer.kind !== "bound") return null;
    const observed = utc(input.observedAtUtc), until = utc(input.validUntilUtc);
    if (until <= observed || Date.parse(until) - Date.parse(observed) > 300_000) return null;
    const hydrated = row(input.hydrated);
    if (hydrated.kind !== "partner_alert_premium_whop_hydration_v1"
      || row(hydrated.account).id !== purchase.offer.accountId) return null;
    const variant = row(hydrated.variant);
    if (variant.id !== purchase.offer.planId || row(variant.account).id !== purchase.offer.accountId
      || row(variant.product).id !== purchase.offer.productId) return null;
    const expectedCurrency = currency(variant.currency);
    const approvedPaidVariant = variant.billing_type === "renewal" && positivePrice(variant.renewal_price)
      && (variant.trial_period_days === null || variant.trial_period_days === 0)
      && Number.isSafeInteger(variant.billing_period) && Number(variant.billing_period) > 0;
    const access: Access = hydrated.productAccess === "customer" || hydrated.productAccess === "absent"
      || hydrated.productAccess === "admin" ? hydrated.productAccess : "unknown";
    const sources = list(hydrated.members).map(row);
    const discovered = list(hydrated.discoveredMembershipIds).map(id => reference(id, "mem_"));
    if (new Set(discovered).size !== discovered.length || new Set(sources.map(source => row(source.membership).id)).size !== sources.length) return null;
    const ids = sources.map(source => reference(row(source.membership).id, "mem_"));
    if (ids.length !== discovered.length || ids.some(id => !discovered.includes(id))) return null;
    const seenPayments = new Set<string>();
    // Until a native membership-specific access signal is separately qualified,
    // any different variant on this product is conservatively ambiguous. Never
    // hide a sibling by filtering membership discovery to the paid variant.
    const ambiguous = sources.some(source => row(source.membership).variant_id !== purchase.offer.planId);
    const members: Member[] = sources.map(source => {
      const membership = row(source.membership), membershipRef = reference(membership.id, "mem_");
      if (membership.user_id !== purchase.payer.whopUserId || membership.product_id !== purchase.offer.productId
        || row(membership.account).id !== purchase.offer.accountId) fail();
      reference(membership.variant_id, "plan_");
      const nativeStatus = status(membership.status), sameVariant = membership.variant_id === purchase.offer.planId;
      const accessKind: Member["accessKind"] = nativeStatus === "trialing" ? "trial"
        : sameVariant && approvedPaidVariant ? "paid_membership" : "unknown";
      const payments = list(source.payments).map(row);
      let basis: Member["paidBasis"] = null;
      for (const paymentSource of payments) {
        const payment = row(paymentSource.payment), paymentRef = reference(payment.id, "pay_");
        if (seenPayments.has(paymentRef) || seenPayments.size >= 250) fail(); seenPayments.add(paymentRef);
        // Siblings are retained as ambiguity facts, never laundered into the
        // selected plan's positive payment scope.
        if (!sameVariant) continue;
        const candidate = paymentBasis({ payment, source: paymentSource, membershipId: membershipRef,
          expectedCurrency, purchase, observedAtUtc: observed });
        if (!basis || (candidate.settlement === "settled" && candidate.refund === "none" && candidate.dispute === "none")) basis = candidate;
      }
      if (source.paymentsComplete !== true) basis = null;
      return { membershipRef, nativeStatus, accessKind, productAccess: access,
        attribution: ambiguous ? "ambiguous" : "exclusive_paid_scope", paidBasis: basis };
    });
    return {
      protocol: "platform_premium_current_paid_access_v1", purchase,
      discovery: hydrated.membershipDiscoveryComplete === true && !(sources.length === 0 && access !== "absent")
        ? "complete" : "incomplete",
      observedAtUtc: observed, validUntilUtc: until, members,
    };
  } catch { return null; }
}
