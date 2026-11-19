import "server-only";

import { createHash } from "node:crypto";
import type { PlatformPremiumNativePurchase, PlatformPremiumOfferScope } from
  "../../platform/server/membership/platform-premium-whop-native";
import { PlatformPremiumWhopCurrentAccessPreparation,
  type PlatformPremiumQualifiedWhopCurrentAccessDecoder } from
  "../../platform/server/membership/platform-premium-whop-current-access";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";
import { decodePartnerAlertPremiumWhopCurrentAccess, type PartnerAlertPremiumWhopHydration } from
  "./partner-alert-premium-whop-access-decoder";
import { PARTNER_ALERT_WHOP_API_VERSION, PartnerAlertWhopReadClient,
  type PartnerAlertWhopClientConfiguration, type PartnerAlertWhopTransport } from "./partner-alert-whop-client";

type Qualification = PlatformPremiumQualifiedWhopCurrentAccessDecoder["qualification"];
type Row = Record<string, unknown>;
type Prepared = ReturnType<PlatformPremiumWhopCurrentAccessPreparation["prepare"]>;
type Page<T> = Readonly<{ items: readonly T[]; hasNextPage: boolean; endCursor: string | null }>;

export type PartnerAlertPremiumWhopAccessProvider = Readonly<{
  qualification: Qualification;
  assertCurrent: () => void;
  prepare: (input: Readonly<{ purchase: PlatformPremiumNativePurchase;
    knownMembershipIds: readonly string[]; signal?: AbortSignal }>) => Promise<Prepared>;
}>;

function refused(): never { throw new Error("Current paid Premium could not be verified."); }
const object = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value)
  ? value as Row : refused();
const ref = (value: string, prefix: string): string => typeof value === "string" && value.startsWith(prefix)
  && value.length > prefix.length && value.length <= 128 && /^[A-Za-z0-9_]+$/u.test(value) ? value : refused();
const hash = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const sameOffer = (a: PlatformPremiumOfferScope, b: PlatformPremiumOfferScope): boolean =>
  a.scopeRef === b.scopeRef && a.environment === b.environment && a.accountId === b.accountId
  && a.productId === b.productId && a.planId === b.planId;

function projectVariant(raw: Row): Row {
  return { id: raw.id, account: { id: object(raw.account).id }, product: { id: object(raw.product).id },
    currency: raw.currency, billing_type: raw.billing_type, initial_price: raw.initial_price,
    renewal_price: raw.renewal_price, billing_period: raw.billing_period, trial_period_days: raw.trial_period_days };
}
function projectMembership(raw: Row): Row {
  return { id: raw.id, account: { id: object(raw.account).id }, user_id: raw.user_id,
    product_id: raw.product_id, variant_id: raw.variant_id, status: raw.status,
    cancel_at_period_end: raw.cancel_at_period_end, initial_price: raw.initial_price, renewal_price: raw.renewal_price };
}
function projectPayment(raw: Row): Row {
  return { id: raw.id, account_id: raw.account_id, user: { id: object(raw.user).id },
    membership_id: raw.membership_id, product_id: raw.product_id, variant_id: raw.variant_id,
    currency: raw.currency, status: raw.status, billing_reason: raw.billing_reason, paid_at: raw.paid_at,
    total: raw.total, subtotal: raw.subtotal, refunded_amount: raw.refunded_amount,
    dispute_created_at: raw.dispute_created_at, dispute_alerted_at: raw.dispute_alerted_at };
}

/** Read-only preparation for the explicitly qualified isolated sandbox. It
 * cannot install a policy, link a payer, write an observation or grant a role.
 * The caller must persist through recordWhopCurrentAccess with its ORIGINAL V2
 * ticket after this asynchronous work finishes. Normal live behavior is intact. */
export function createPartnerAlertPremiumWhopAccessProvider(input: Readonly<{
  environment: NodeJS.ProcessEnv;
  client: PartnerAlertWhopClientConfiguration;
  qualification: Qualification;
  offer: PlatformPremiumOfferScope;
  nowUtc: () => string;
  transport: PartnerAlertWhopTransport;
}>): PartnerAlertPremiumWhopAccessProvider | null {
  const initial = readPartnerAlertIsolatedStaging(input.environment);
  if (!initial) return null;
  const offer = Object.freeze({ ...input.offer }), configuration = Object.freeze({ ...input.client });
  const qualification: Qualification = Object.freeze({ reviewRef: input.qualification.reviewRef,
    schemaSha256: input.qualification.schemaSha256, apiVersion: input.qualification.apiVersion,
    accountId: input.qualification.accountId, environment: input.qualification.environment });
  if (offer.environment !== "sandbox" || configuration.environment !== "sandbox"
    || qualification.environment !== "sandbox" || configuration.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION
    || qualification.apiVersion !== PARTNER_ALERT_WHOP_API_VERSION || qualification.accountId !== offer.accountId
    || configuration.accountId !== offer.accountId || !/^[a-f0-9]{64}$/u.test(qualification.schemaSha256)
    || !/^[A-Za-z0-9_:-]{1,160}$/u.test(qualification.reviewRef)) refused();
  ref(offer.accountId, "biz_"); ref(offer.productId, "prod_"); ref(offer.planId, "plan_");
  const assertCurrent = () => {
    if (readPartnerAlertIsolatedStaging(input.environment)?.fingerprint !== initial.fingerprint) refused();
  };
  const genuineHydrations = new WeakSet<object>();
  const decoder: PlatformPremiumQualifiedWhopCurrentAccessDecoder = Object.freeze({
    qualification,
    decodeHydrated: (raw: Parameters<PlatformPremiumQualifiedWhopCurrentAccessDecoder["decodeHydrated"]>[0]) => {
      assertCurrent();
      if (!raw.hydrated || typeof raw.hydrated !== "object" || !genuineHydrations.has(raw.hydrated)) return null;
      return decodePartnerAlertPremiumWhopCurrentAccess(raw);
    },
  });
  const preparation = new PlatformPremiumWhopCurrentAccessPreparation(decoder);

  return Object.freeze({ qualification, assertCurrent, prepare: async target => {
    try {
      assertCurrent();
      const purchase = structuredClone(target.purchase), known = [...target.knownMembershipIds];
      if (!sameOffer(purchase.offer, offer) || purchase.payer.kind !== "bound" || known.length > 50
        || new Set(known).size !== known.length) refused();
      ref(purchase.payer.whopUserId, "user_"); known.forEach(id => ref(id, "mem_"));
      const observedAtUtc = input.nowUtc(), started = Date.parse(observedAtUtc);
      if (new Date(started).toISOString() !== observedAtUtc) refused();
      const validUntilUtc = new Date(started + 30_000).toISOString();
      let previous = started, reads = 0;
      const timeout = AbortSignal.timeout(12_000);
      const signal = target.signal ? AbortSignal.any([target.signal, timeout]) : timeout;
      const current = () => {
        assertCurrent();
        const now = Date.parse(input.nowUtc());
        if (!Number.isFinite(now) || now < previous || now - started >= 12_000 || signal.aborted) refused();
        previous = now;
      };
      const transport: PartnerAlertWhopTransport = async (url, options) => {
        current();
        const parsed = new URL(url);
        if (parsed.origin !== "https://sandbox-api.whop.com" || parsed.username || parsed.password || parsed.hash
          || options.method !== "GET" || ++reads > 250) refused();
        const result = await input.transport(url, { ...options, signal, redirect: "manual", cache: "no-store" });
        try { current(); return result; } catch (error) { void result.body?.cancel().catch(() => undefined); throw error; }
      };
      const client = new PartnerAlertWhopReadClient(configuration, transport);
      const pages = async <T>(load: (after?: string) => Promise<Page<T>>, key: (item: T) => string,
        maximum: number): Promise<readonly T[]> => {
        const values: T[] = [], ids = new Set<string>(), cursors = new Set<string>();
        let after: string | undefined;
        for (let page = 0; page < 3; page++) {
          current(); const result = await load(after); current();
          for (const item of result.items) {
            const id = key(item); if (ids.has(id) || values.length >= maximum) refused();
            ids.add(id); values.push(item);
          }
          if (!result.hasNextPage) return values;
          if (!result.endCursor || cursors.has(result.endCursor)) refused();
          after = result.endCursor; cursors.add(after);
        }
        return refused();
      };
      const variant = projectVariant(await client.retrieveVariant(offer.planId, signal)); current();
      // The verified native variant already identifies its merchant. The account
      // aggregate also exposes balances and requires company:balance:read; that
      // financial read is unnecessary for paid-access qualification.
      const account = object(variant.account);
      const discovered = await pages(after => client.listMemberships({ whopUserId: purchase.payer.whopUserId,
        productIds: [offer.productId], after }, signal), member => member.membershipId, 50);
      const membershipIds = [...new Set([...discovered.map(member => member.membershipId), ...known])];
      if (membershipIds.length > 50) refused();
      const members: Array<PartnerAlertPremiumWhopHydration["members"][number]> = [];
      const observedMembers = new Map<string, string>(), allPayments = new Set<string>();
      for (const id of membershipIds) {
        const membership = projectMembership(await client.retrieveMembership(id, signal)); current();
        if (membership.user_id !== purchase.payer.whopUserId || membership.product_id !== offer.productId
          || object(membership.account).id !== offer.accountId) refused();
        observedMembers.set(id, hash(membership));
        // Preserve foreign-plan siblings as ambiguity facts. Never borrow their
        // payment or let a variant filter hide a free/trial grant on the product.
        if (membership.variant_id !== offer.planId) {
          members.push({ membership, paymentsComplete: true, payments: [] }); continue;
        }
        const payments = await pages(async after => {
          const page = await client.listMembershipPayments({ whopUserId: purchase.payer.whopUserId, membershipId: id, after }, signal);
          return { ...page, items: page.paymentIds };
        }, paymentId => paymentId, 100);
        const hydratedPayments: Array<PartnerAlertPremiumWhopHydration["members"][number]["payments"][number]> = [];
        for (const paymentId of payments) {
          if (allPayments.has(paymentId) || allPayments.size >= 100) refused(); allPayments.add(paymentId);
          const payment = projectPayment(await client.retrievePayment(paymentId, signal)); current();
          if (payment.membership_id !== id || payment.account_id !== offer.accountId
            || payment.product_id !== offer.productId || payment.variant_id !== offer.planId
            || object(payment.user).id !== purchase.payer.whopUserId) refused();
          const refunds = await pages(after => client.listPaymentRefunds({ paymentId, after }, signal), item => item.id, 100);
          const disputes = await pages(after => client.listPaymentDisputes({ paymentId, after }, signal), item => item.id, 100);
          hydratedPayments.push({ payment, refundsComplete: true, refunds, disputesComplete: true, disputes });
        }
        members.push({ membership, paymentsComplete: true, payments: hydratedPayments });
      }
      const productAccess = await client.checkProductAccess(purchase.payer.whopUserId, offer.productId, signal); current();
      for (const [id, original] of observedMembers) {
        if (hash(projectMembership(await client.retrieveMembership(id, signal))) !== original) refused(); current();
      }
      if (hash(projectVariant(await client.retrieveVariant(offer.planId, signal))) !== hash(variant)) refused(); current();
      if (await client.checkProductAccess(purchase.payer.whopUserId, offer.productId, signal) !== productAccess) refused(); current();
      const hydrated: PartnerAlertPremiumWhopHydration = {
        kind: "partner_alert_premium_whop_hydration_v1", account: { id: account.id }, variant, productAccess,
        membershipDiscoveryComplete: true, discoveredMembershipIds: membershipIds, members,
      };
      genuineHydrations.add(hydrated);
      current();
      const result = preparation.prepare({ purchase, hydrated, observedAtUtc, validUntilUtc,
        maximumEvidenceAgeMs: 30_000, expectedQualification: qualification });
      current();
      return result;
    } catch {
      return Object.freeze({ kind: "unqualified" as const, reason: "coverage_invalid" as const });
    }
  } });
}
