import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type Database from "better-sqlite3";
import { PlatformMembershipClaims } from "./platform-membership-claims";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { applyMembershipRenewalChanges } from "./platform-membership-renewal";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";

const object = z.record(z.string(), z.unknown());
const string = z.string().min(1);
const epoch = z.number().int().positive();
const time = (value: unknown) => new Date(epoch.parse(value) * 1000).toISOString();
const reference = (value: unknown): string => typeof value === "string" ? string.parse(value) : string.parse(object.parse(value).id);

// Stripe retains two-decimal charge units for ISK/UGX although our stored ISO
// currency amounts have zero decimals. https://docs.stripe.com/currencies
export function membershipStripeAmount(amount: number, currency: string): string {
  const converted = amount * (["ISK", "UGX"].includes(currency) ? 100 : 1);
  if (!Number.isSafeInteger(converted)) throw new Error("This price cannot be sent to Stripe exactly.");
  return String(converted);
}

export function membershipAppOrigin(): string {
  const url = new URL(process.env.TRADERLINK_MEMBERSHIP_APP_ORIGIN ?? "https://app.traderslink.pro");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) throw new Error("Configure a valid membership app origin.");
  return url.origin;
}

async function stripeRequest(path: string, values?: Record<string, string>, idempotencyKey?: string): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not connected yet.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: values ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(values ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: values ? new URLSearchParams(values) : undefined, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Stripe could not complete this request. Check the provider configuration and try again.");
  return object.parse(await response.json());
}

export async function createMembershipStripeCheckout(reserved: ReturnType<PlatformMembershipClaims["reserve"]>): Promise<{ id: string; url: string }> {
  const { offer, claimId, trialDays, trialAmount } = reserved;
  if (offer.provider_configuration_state === "test" && process.env.STRIPE_SECRET_KEY && !/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY)) {
    throw new Error("This offer is in test mode, but Stripe has a live key configured.");
  }
  const recurring = offer.billing_kind === "recurring";
  const initial = trialDays ? trialAmount ?? 0 : offer.initial_amount_minor;
  if (!offer.currency || initial === null) throw new Error("This offer has no payment terms.");
  const origin = membershipAppOrigin();
  const values: Record<string, string> = {
    mode: recurring ? "subscription" : "payment",
    success_url: `${origin}/account/membership`, cancel_url: `${origin}/plans`,
    client_reference_id: claimId, "metadata[membership_claim_id]": claimId,
    expires_at: String(Math.floor(Date.now() / 1000) + 45 * 60),
    "line_items[0][price_data][currency]": offer.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": offer.name,
    "line_items[0][price_data][unit_amount]": membershipStripeAmount(recurring ? offer.renewal_amount_minor! : initial, offer.currency),
    "line_items[0][quantity]": "1",
  };
  if (!recurring && trialDays && initial === 0 && reserved.paymentMethodRequired) {
    values.mode = "setup";
    values.currency = offer.currency.toLowerCase();
    for (const key of Object.keys(values)) if (key.startsWith("line_items[")) delete values[key];
  }
  if (recurring) {
    if (!offer.billing_interval || !offer.billing_interval_count || offer.renewal_amount_minor === null) throw new Error("This offer has no renewal period.");
    values["line_items[0][price_data][recurring][interval]"] = offer.billing_interval;
    values["line_items[0][price_data][recurring][interval_count]"] = String(offer.billing_interval_count);
    values["subscription_data[metadata][membership_claim_id]"] = claimId;
    if (trialDays) values["subscription_data[trial_end]"] = String(Math.floor(Date.now() / 1000) + trialDays * 86_400);
    const firstCharge = trialDays ? 0 : offer.renewal_amount_minor;
    if (initial < firstCharge) {
      const coupon = await stripeRequest("coupons", { duration: "once", amount_off: membershipStripeAmount(firstCharge - initial, offer.currency), currency: offer.currency.toLowerCase() }, `membership-coupon-${claimId}`);
      values["discounts[0][coupon]"] = string.parse(coupon.id);
    } else if (initial > firstCharge) {
      values["line_items[1][price_data][currency]"] = offer.currency.toLowerCase();
      values["line_items[1][price_data][product_data][name]"] = trialDays ? "Trial entry" : "Initial payment adjustment";
      values["line_items[1][price_data][unit_amount]"] = membershipStripeAmount(initial - firstCharge, offer.currency);
      values["line_items[1][quantity]"] = "1";
    }
  }
  const session = await stripeRequest("checkout/sessions", values, `membership-checkout-${claimId}`);
  const url = new URL(string.parse(session.url));
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Stripe returned an invalid checkout address.");
  return { id: string.parse(session.id), url: url.href };
}

export async function createMembershipStripePortal(customerId: string): Promise<string> {
  const session = await stripeRequest("billing_portal/sessions", { customer: customerId, return_url: `${membershipAppOrigin()}/account/membership` });
  const url = new URL(string.parse(session.url));
  if (url.protocol !== "https:" || url.hostname !== "billing.stripe.com") throw new Error("Invalid billing portal URL.");
  return url.href;
}

export async function setMembershipStripeCancellation(subscriptionId: string, cancel: boolean): Promise<void> {
  await stripeRequest(`subscriptions/${encodeURIComponent(subscriptionId)}`, { cancel_at_period_end: String(cancel) });
}

export function verifyMembershipStripeEvent(raw: string, header: string, secret: string, now = Date.now()): Record<string, unknown> {
  const values = header.split(",").map((part) => part.split("="));
  const timestamp = values.find(([key]) => key === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) throw new Error("Invalid Stripe signature timestamp.");
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest();
  const valid = values.some(([key, value]) => key === "v1" && /^[a-f0-9]{64}$/.test(value ?? "") && timingSafeEqual(Buffer.from(value, "hex"), expected));
  if (!valid) throw new Error("Invalid Stripe signature.");
  return object.parse(JSON.parse(raw));
}

// Network hydration happens before the SQLite transaction. No asynchronous work
// can escape the single-writer transaction.
export async function hydrateMembershipStripeEvent(event: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const type = string.parse(event.type);
  const data = object.parse(object.parse(event.data).object);
  const readSubscription = async (value: unknown) => {
    const id = reference(value);
    const current = await stripeRequest(`subscriptions/${encodeURIComponent(id)}`);
    if (reference(current.id) !== id) throw new Error("Stripe subscription identity mismatch.");
    return current;
  };
  if (type.startsWith("checkout.session.")) {
    return data.subscription ? readSubscription(data.subscription) : null;
  }
  if (type.startsWith("invoice.")) {
    const parent = data.parent ? object.parse(data.parent) : null;
    const details = parent?.subscription_details ? object.parse(parent.subscription_details) : null;
    const subscription = data.subscription ?? details?.subscription;
    return subscription ? readSubscription(subscription) : null;
  }
  return type.startsWith("customer.subscription.") ? readSubscription(data.id) : null;
}

export function applyMembershipStripeEvent(database: Database.Database, event: Record<string, unknown>, subscription: Record<string, unknown> | null, raw: string): string {
  const type = string.parse(event.type);
  const eventAt = time(event.created);
  const hash = createHash("sha256").update(string.parse(event.id)).digest("hex");
  const payloadHash = createHash("sha256").update(raw).digest("hex");
  const data = object.parse(object.parse(event.data).object);
  return database.transaction(() => {
    const prior = database.prepare("SELECT payload_sha256 FROM platform_membership_provider_event_receipts WHERE provider='stripe' AND external_event_ref_hash=?").get(hash) as { payload_sha256: string } | undefined;
    if (prior) {
      if (prior.payload_sha256 !== payloadHash) throw new Error("Conflicting Stripe event.");
      return "duplicate";
    }
    let result = "ignored";
    const metadata = object.parse((type.startsWith("checkout.session.") ? data.metadata : subscription?.metadata) ?? {});
    const claimId = metadata.membership_claim_id;
    if (typeof claimId === "string") {
      const claim = database.prepare(`SELECT c.*,o.plan_version_id,o.billing_kind,o.provider,COALESCE(t.duration_days,o.access_duration_days) duration_days FROM platform_membership_claims c
        JOIN platform_membership_offers o ON o.offer_id=c.offer_id LEFT JOIN platform_membership_trial_campaigns t ON t.trial_campaign_id=c.trial_campaign_id WHERE c.claim_id=?`)
        .get(claimId) as { user_id: string; offer_id: string; plan_version_id: string; billing_kind: string; provider: string; external_session_ref: string | null; trial_campaign_id: string | null; duration_days: number | null; state: string } | undefined;
      if (!claim || claim.provider !== "stripe") throw new Error("Unknown membership checkout.");
      if (type.startsWith("checkout.session.") && claim.external_session_ref !== data.id) throw new Error("Checkout session does not match its claim.");
      if (type === "checkout.session.completed" && data.payment_status === "unpaid") {
        // Keep a seat reserved while the provider settles a delayed payment.
        database.prepare("UPDATE platform_membership_claims SET expires_at_utc='9999-12-31T23:59:59.999Z' WHERE claim_id=? AND state='reserved'").run(claimId);
        result = "applied";
      }
      if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(type)) {
        new PlatformMembershipClaims(database).release(claimId);
        result = "applied";
      }
      const paid = (type === "checkout.session.async_payment_succeeded" && data.payment_status === "paid") || type === "invoice.paid" ||
        (type === "checkout.session.completed" && ["paid", "no_payment_required"].includes(String(data.payment_status)));
      const subId = subscription ? reference(subscription.id) : null;
      const previous = subId ? database.prepare("SELECT lifecycle_state FROM platform_membership_provider_subscriptions WHERE provider='stripe' AND external_subscription_ref=?").get(subId) as { lifecycle_state: string } | undefined : undefined;
      // Stripe cancellation is terminal for this subscription ID. Event time is
      // not a delivery ordering token; paid coverage is reconciled independently.
      const ended = type === "customer.subscription.deleted" || subscription?.status === "canceled" || previous?.lifecycle_state === "inactive";
      if (type === "customer.subscription.updated" && previous && subscription && !ended) {
        database.prepare(`UPDATE platform_membership_provider_subscriptions SET cancel_at_period_end=?,
          lifecycle_state=?,last_provider_event_at_utc=MAX(COALESCE(last_provider_event_at_utc,''),?),updated_at_utc=MAX(updated_at_utc,?) WHERE provider='stripe' AND external_subscription_ref=?`)
          .run(subscription.cancel_at_period_end ? 1 : 0,
            subscription.cancel_at_period_end ? "cancel_at_period_end" : subscription.status === "past_due" ? "past_due" : subscription.status === "trialing" ? "trialing" : "active",
            eventAt, eventAt, subId);
        result = "applied";
      } else if (paid || ended) {
        if (paid && claim.state !== "fulfilled") new PlatformMembershipClaims(database).completeStripePayment(claimId, eventAt);
        let end: string | null = null;
        let grantStart = eventAt;
        if (subscription) {
          const items = object.parse(subscription.items);
          const item = object.parse(z.array(object).parse(items.data)[0]);
          end = time(subscription.current_period_end ?? item.current_period_end);
          let start = time(subscription.current_period_start ?? item.current_period_start);
          if (type === "invoice.paid") {
            const lines = z.array(object).parse(object.parse(data.lines).data);
            const paidEnds = lines.flatMap((line) => {
              const period = line.period ? object.parse(line.period) : null;
              return period?.end ? [epoch.parse(period.end)] : [];
            });
            if (!paidEnds.length) throw new Error("Paid invoice has no covered period.");
            end = time(Math.max(...paidEnds));
            const paidStarts = lines.flatMap((line) => {
              const period = line.period ? object.parse(line.period) : null;
              return period?.start ? [epoch.parse(period.start)] : [];
            });
            if (!paidStarts.length) throw new Error("Paid invoice has no coverage start.");
            start = time(Math.min(...paidStarts));
          }
          grantStart = start;
          database.prepare(`INSERT INTO platform_membership_provider_subscriptions
            (provider_subscription_id,user_id,offer_id,provider,external_customer_ref,external_subscription_ref,lifecycle_state,current_period_start_utc,current_period_end_utc,cancel_at_period_end,last_provider_event_at_utc,created_at_utc,updated_at_utc)
            VALUES (?,?,?,'stripe',?,?,?,?,?,?,?,?,?) ON CONFLICT(provider,external_subscription_ref) DO UPDATE SET
            lifecycle_state=excluded.lifecycle_state,
            current_period_start_utc=CASE WHEN current_period_end_utc IS NULL OR excluded.current_period_end_utc>current_period_end_utc THEN excluded.current_period_start_utc ELSE current_period_start_utc END,
            current_period_end_utc=MAX(COALESCE(current_period_end_utc,''),excluded.current_period_end_utc),
            cancel_at_period_end=excluded.cancel_at_period_end,last_provider_event_at_utc=MAX(COALESCE(last_provider_event_at_utc,''),excluded.last_provider_event_at_utc),updated_at_utc=MAX(updated_at_utc,excluded.updated_at_utc)`)
            .run(createCanonicalUuidV4(), claim.user_id, claim.offer_id, reference(subscription.customer), subId,
              ended ? "inactive" : subscription.cancel_at_period_end ? "cancel_at_period_end" : subscription.status === "past_due" ? "past_due" : subscription.status === "trialing" ? "trialing" : "active",
              start, end, subscription.cancel_at_period_end ? 1 : 0, eventAt, eventAt, eventAt);
        } else if (claim.duration_days) end = new Date(Date.parse(eventAt) + claim.duration_days * 86_400_000).toISOString();
        const sourceRef = subId ?? claimId;
        const sourceType = subId ? "subscription" : claim.trial_campaign_id ? "trial" : "lifetime_purchase";
        const existing = database.prepare("SELECT entitlement_id FROM platform_membership_entitlements WHERE user_id=? AND source_type=? AND source_ref=?").get(claim.user_id, sourceType, sourceRef);
        if (ended) database.prepare("UPDATE platform_membership_entitlements SET status='revoked',updated_at_utc=? WHERE user_id=? AND source_type=? AND source_ref=?").run(eventAt, claim.user_id, sourceType, sourceRef);
        else if (existing) database.prepare("UPDATE platform_membership_entitlements SET status='active',ends_at_utc=CASE WHEN ends_at_utc>? THEN ends_at_utc ELSE ? END,updated_at_utc=? WHERE user_id=? AND source_type=? AND source_ref=?").run(end, end, eventAt, claim.user_id, sourceType, sourceRef);
        else new PlatformMembershipRepository(database).grantEntitlement({ actorUserId: claim.user_id, userId: claim.user_id,
          planVersionId: claim.plan_version_id, sourceType, sourceRef, startsAtUtc: grantStart, endsAtUtc: end, atUtc: eventAt });
        if (paid && !ended && subId) applyMembershipRenewalChanges(database, claim.user_id, subId, end, eventAt);
        result = "applied";
      }
    }
    database.prepare(`INSERT INTO platform_membership_provider_event_receipts VALUES ('stripe',?,?,?,?,?,?)`).run(hash, payloadHash, type, eventAt, result, new Date().toISOString());
    return result;
  }).immediate();
}
