import { createHash } from "node:crypto";
import { z } from "zod";
import type Database from "better-sqlite3";
import { createWhopPrivacyReference } from "../billing/whop-ai-review-identity";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { PlatformMembershipClaims } from "./platform-membership-claims";
import { applyMembershipRenewalChanges } from "./platform-membership-renewal";

const record = z.record(z.string(), z.unknown());
const text = z.string().min(1);
const at = (value: unknown) => z.iso.datetime({ offset: true }).parse(value);

/** Fetch only after the route has verified the signed raw body. */
export async function hydrateMembershipWhopPayment(raw: string, companyId: string): Promise<Record<string, unknown> | null> {
  const event = record.parse(JSON.parse(raw));
  if (event.company_id !== companyId) throw new Error("Whop event scope mismatch.");
  if (!["payment.succeeded", "membership.activated", "membership.deactivated", "membership.cancel_at_period_end_changed"].includes(String(event.type))) return null;
  const payment = record.parse(event.data);
  if (event.type === "payment.succeeded" && !payment.membership) return null;
  const id = event.type === "payment.succeeded" ? text.parse(record.parse(payment.membership).id) : text.parse(payment.id);
  const key = process.env.WHOP_API_KEY;
  if (!key) throw new Error("Whop membership reconciliation is not configured.");
  const response = await fetch(`https://api.whop.com/api/v1/memberships/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Whop membership reconciliation failed.");
  const membership = record.parse(await response.json());
  if (membership.id !== id || record.parse(membership.company).id !== companyId) throw new Error("Whop membership scope mismatch.");
  for (const field of ["user", "plan", "product"] as const) {
    if (text.parse(record.parse(membership[field]).id) !== text.parse(record.parse(payment[field]).id)) throw new Error("Whop payment identity mismatch.");
  }
  return membership;
}

// Only invoked after signature verification. No email or display-name matching.
export function applyMembershipWhopEvent(database: Database.Database, raw: string, webhookId: string,
  config: { companyId: string; identityKey: string; apiVersionDate: string }, hydratedPaymentMembership: Record<string, unknown> | null = null): string {
  const event = record.parse(JSON.parse(raw));
  if (event.id !== webhookId || event.company_id !== config.companyId || event.api_version !== "v1" || event.api_version_date !== config.apiVersionDate) throw new Error("Whop event scope mismatch.");
  const type = text.parse(event.type);
  const eventAt = new Date(at(event.timestamp)).toISOString();
  const eventHash = createHash("sha256").update(webhookId).digest("hex");
  const payloadHash = createHash("sha256").update(raw).digest("hex");
  return database.transaction(() => {
    const prior = database.prepare("SELECT payload_sha256 FROM platform_membership_provider_event_receipts WHERE provider='whop' AND external_event_ref_hash=?").get(eventHash) as { payload_sha256: string } | undefined;
    if (prior) {
      if (prior.payload_sha256 !== payloadHash) throw new Error("Whop event conflict.");
      return "duplicate";
    }
    let result = "ignored";
    if (["membership.activated", "membership.deactivated", "membership.cancel_at_period_end_changed"].includes(type) || (type === "payment.succeeded" && hydratedPaymentMembership)) {
      const data = hydratedPaymentMembership ? record.parse(hydratedPaymentMembership) : record.parse(event.data);
      const memberRef = createWhopPrivacyReference(text.parse(data.id), "membership", config.identityKey);
      const userRef = createWhopPrivacyReference(text.parse(record.parse(data.user).id), "user", config.identityKey);
      const user = database.prepare("SELECT user_id FROM platform_whop_user_links WHERE whop_user_ref_hmac=? AND link_state='active'").get(userRef) as { user_id: string } | undefined;
      if (!user) throw new Error("Whop identity not linked yet.");
      const existing = database.prepare(`SELECT s.*,e.entitlement_id,e.starts_at_utc entitlement_start,COALESCE(e.plan_version_id,o.plan_version_id) plan_version_id,o.billing_kind,o.access_duration_days FROM platform_membership_provider_subscriptions s
        JOIN platform_membership_offers o ON o.offer_id=s.offer_id
        LEFT JOIN platform_membership_entitlements e ON e.user_id=s.user_id AND e.source_type='subscription' AND e.source_ref=s.external_subscription_ref
        WHERE s.provider='whop' AND s.external_subscription_ref=?`).get(memberRef) as {
          user_id: string; offer_id: string; plan_version_id: string; last_provider_event_at_utc: string; entitlement_id: string | null; billing_kind: string; lifecycle_state: string; access_duration_days: number | null; entitlement_start: string | null;
        } | undefined;
      if (existing && existing.user_id !== user.user_id) throw new Error("Whop identity conflict.");
      // A freshly fetched provider snapshot is current even when its triggering event is late.
      if (!hydratedPaymentMembership && existing && existing.last_provider_event_at_utc > eventAt) result = "stale";
      else {
        const planRef = text.parse(record.parse(data.plan).id);
        const productRef = text.parse(record.parse(data.product).id);
        const offers = database.prepare(`SELECT o.offer_id,o.plan_version_id,o.billing_kind,o.access_duration_days,p.visibility,o.channel FROM platform_membership_offers o
          JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id JOIN platform_membership_plans p ON p.plan_id=v.plan_id
          WHERE o.provider='whop' AND o.external_price_ref=? AND o.external_product_ref=? AND o.status='active' AND v.lifecycle_state='published' AND p.status='active'`)
          .all(planRef, productRef) as { offer_id: string; plan_version_id: string; billing_kind: string; access_duration_days: number | null; visibility: string; channel: string }[];
        const offer = existing ? { ...existing, visibility: "existing", channel: "existing" } : offers.length === 1 ? offers[0] : null;
        if (!offer) throw new Error("Whop offer mapping is missing or ambiguous.");
        const active = hydratedPaymentMembership ? ["active", "trialing"].includes(text.parse(data.status))
          : type === "membership.deactivated" ? false
          : type === "membership.cancel_at_period_end_changed" && existing ? existing.lifecycle_state !== "inactive"
          : ["active", "trialing"].includes(text.parse(data.status));
        if (active && !existing?.entitlement_id) {
          const claims = database.prepare("SELECT claim_id,state FROM platform_membership_claims WHERE user_id=? AND offer_id=? AND state='reserved' ORDER BY created_at_utc DESC")
            .all(user.user_id, offer.offer_id) as { claim_id: string; state: string }[];
          if (claims.length > 1) throw new Error("Whop checkout claim is ambiguous.");
          if (claims.length === 1) new PlatformMembershipClaims(database).complete(claims[0].claim_id, eventAt);
          else if (offer.visibility !== "public" || !["website", "both"].includes(offer.channel)) throw new Error("Whop private offer requires its claim.");
        }
        const start = data.renewal_period_start ? new Date(at(data.renewal_period_start)).toISOString() : eventAt;
        const end = offer.access_duration_days
          ? new Date(Date.parse(existing?.entitlement_start ?? start) + offer.access_duration_days * 86_400_000).toISOString()
          : data.renewal_period_end ? new Date(at(data.renewal_period_end)).toISOString() : null;
        if (active && offer.billing_kind === "recurring" && !end) throw new Error("Whop has not supplied the recurring access period.");
        database.prepare(`INSERT INTO platform_membership_provider_subscriptions
          (provider_subscription_id,user_id,offer_id,provider,external_subscription_ref,lifecycle_state,current_period_start_utc,current_period_end_utc,cancel_at_period_end,last_provider_event_at_utc,created_at_utc,updated_at_utc)
          VALUES (?,?,?,'whop',?,?,?,?,?,?,?,?) ON CONFLICT(provider,external_subscription_ref) DO UPDATE SET
          lifecycle_state=excluded.lifecycle_state,current_period_start_utc=excluded.current_period_start_utc,current_period_end_utc=excluded.current_period_end_utc,
          cancel_at_period_end=excluded.cancel_at_period_end,last_provider_event_at_utc=MAX(COALESCE(platform_membership_provider_subscriptions.last_provider_event_at_utc,''),excluded.last_provider_event_at_utc),updated_at_utc=MAX(platform_membership_provider_subscriptions.updated_at_utc,excluded.updated_at_utc)`)
          .run(createCanonicalUuidV4(), user.user_id, offer.offer_id, memberRef, active ? data.cancel_at_period_end ? "cancel_at_period_end" : "active" : "inactive",
            start, end, data.cancel_at_period_end ? 1 : 0, eventAt, eventAt, eventAt);
        if (existing?.entitlement_id) database.prepare("UPDATE platform_membership_entitlements SET status=?,ends_at_utc=?,updated_at_utc=? WHERE user_id=? AND source_type='subscription' AND source_ref=?")
          .run(active ? "active" : "revoked", end, eventAt, user.user_id, memberRef);
        else if (active) new PlatformMembershipRepository(database).grantEntitlement({ actorUserId: user.user_id, userId: user.user_id,
          planVersionId: offer.plan_version_id, sourceType: "subscription", sourceRef: memberRef, startsAtUtc: start, endsAtUtc: end, atUtc: eventAt });
        if (active && ["membership.activated", "payment.succeeded"].includes(type)) applyMembershipRenewalChanges(database, user.user_id, memberRef, end, eventAt);
        result = "applied";
      }
    }
    database.prepare("INSERT INTO platform_membership_provider_event_receipts VALUES ('whop',?,?,?,?,?,?)").run(eventHash, payloadHash, type, eventAt, result, new Date().toISOString());
    return result;
  }).immediate();
}
