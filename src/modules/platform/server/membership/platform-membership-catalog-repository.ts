import { createHash, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import { membershipWhopConfiguration } from "./platform-membership-provider-readiness";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type PlatformMembershipCatalogOffer = Readonly<{
  offerId: string;
  name: string;
  provider: string;
  providerLabel: string;
  channel: string;
  billingKind: string;
  currency: string | null;
  initialAmountMinor: number | null;
  renewalAmountMinor: number | null;
  billingPeriodDays: number | null;
  billingInterval: string | null;
  billingIntervalCount: number | null;
  accessDurationDays: number | null;
  externalCheckoutUrl: string | null;
  automaticConfirmation: boolean;
  trials: readonly { id: string; name: string; durationDays: number; amount: number; paymentMethodRequired: boolean }[];
}>;

export type PlatformMembershipCatalogPlan = Readonly<{
  planId: string;
  planVersionId: string;
  name: string;
  description: string;
  features: readonly Readonly<{ label: string; kind: string; limitValue: number | null }>[];
  offers: readonly PlatformMembershipCatalogOffer[];
}>;

type CatalogRow = Readonly<{
  plan_id: string;
  plan_version_id: string;
  plan_name: string;
  public_description: string;
  feature_label: string | null;
  feature_kind: string | null;
  limit_value: number | null;
  offer_id: string;
  offer_name: string;
  provider: string;
  provider_label: string;
  channel: string;
  billing_kind: string;
  currency: string | null;
  initial_amount_minor: number | null;
  renewal_amount_minor: number | null;
  billing_period_days: number | null;
  billing_interval: string | null;
  billing_interval_count: number | null;
  access_duration_days: number | null;
  external_checkout_url: string | null;
}>;

const REQUIRED_TABLES = Object.freeze([
  "platform_membership_plans",
  "platform_membership_plan_versions",
  "platform_membership_plan_features",
  "platform_membership_offers",
  "platform_membership_feature_definitions",
  "platform_membership_claims",
  "platform_membership_version_changes",
  "platform_membership_recurring_grants",
  "platform_membership_feature_policies",
  "platform_membership_trial_checkouts",
] as const);

export function isPlatformMembershipCatalogAvailable(database: Database.Database): boolean {
  const placeholders = REQUIRED_TABLES.map(() => "?").join(",");
  const rows = database.prepare(`SELECT name FROM sqlite_schema
WHERE type='table' AND name IN (${placeholders})`).all(...REQUIRED_TABLES) as { name: string }[];
  return rows.length === REQUIRED_TABLES.length;
}

function shape(rows: readonly CatalogRow[]): readonly PlatformMembershipCatalogPlan[] {
  const plans = new Map<string, {
    planId: string;
    planVersionId: string;
    name: string;
    description: string;
    features: Map<string, { label: string; kind: string; limitValue: number | null }>;
    offers: Map<string, PlatformMembershipCatalogOffer>;
  }>();
  for (const row of rows) {
    const plan = plans.get(row.plan_version_id) ?? {
      planId: row.plan_id,
      planVersionId: row.plan_version_id,
      name: row.plan_name,
      description: row.public_description,
      features: new Map(),
      offers: new Map(),
    };
    if (row.feature_label) {
      plan.features.set(`${row.feature_label}:${row.limit_value ?? ""}`, {
        label: row.feature_label,
        kind: row.feature_kind ?? "boolean",
        limitValue: row.limit_value,
      });
    }
    plan.offers.set(row.offer_id, Object.freeze({
      offerId: row.offer_id,
      name: row.offer_name,
      provider: row.provider,
      providerLabel: row.provider_label,
      channel: row.channel,
      billingKind: row.billing_kind,
      currency: row.currency,
      initialAmountMinor: row.initial_amount_minor,
      renewalAmountMinor: row.renewal_amount_minor,
      billingPeriodDays: row.billing_period_days,
      billingInterval: row.billing_interval,
      billingIntervalCount: row.billing_interval_count,
      accessDurationDays: row.access_duration_days,
      externalCheckoutUrl: row.external_checkout_url,
      automaticConfirmation: row.provider === "stripe" || (row.provider === "whop" && membershipWhopConfiguration().automaticConfirmation),
      trials: [],
    }));
    plans.set(row.plan_version_id, plan);
  }
  return Object.freeze([...plans.values()].map((plan) => Object.freeze({
    planId: plan.planId,
    planVersionId: plan.planVersionId,
    name: plan.name,
    description: plan.description,
    features: Object.freeze([...plan.features.values()]),
    offers: Object.freeze([...plan.offers.values()]),
  })));
}

const CATALOG_SELECT = `SELECT plan.plan_id,version.plan_version_id,plan.name plan_name,
  version.public_description,definition.label feature_label,feature.feature_kind,feature.limit_value,
  offer.offer_id,offer.name offer_name,offer.provider,provider.label provider_label,offer.channel,offer.billing_kind,
  offer.currency,offer.initial_amount_minor,offer.renewal_amount_minor,
  offer.billing_period_days,offer.billing_interval,offer.billing_interval_count,offer.access_duration_days,offer.external_checkout_url
FROM platform_membership_plans plan
JOIN platform_membership_plan_versions version ON version.plan_id=plan.plan_id
JOIN platform_membership_offers offer ON offer.plan_version_id=version.plan_version_id
JOIN platform_membership_provider_definitions provider ON provider.provider_key=offer.provider AND provider.configuration_state IN ('test','ready')
LEFT JOIN platform_membership_plan_features feature ON feature.plan_version_id=version.plan_version_id
LEFT JOIN platform_membership_feature_definitions definition ON definition.feature_key=feature.feature_key`;

export class PlatformMembershipCatalogRepository {
  constructor(private readonly database: Database.Database) {}

  readSharedPageTitle(secret: string): string {
    const row = this.database.prepare("SELECT name FROM platform_membership_share_links WHERE secret_sha256=?")
      .get(createHash("sha256").update(secret, "utf8").digest("hex")) as { name: string } | undefined;
    return row?.name ?? "Plans";
  }

  readPublicPlans(): readonly PlatformMembershipCatalogPlan[] {
    if (!isPlatformMembershipCatalogAvailable(this.database)) return Object.freeze([]);
    const rows = this.database.prepare(`${CATALOG_SELECT}
WHERE plan.status='active' AND plan.visibility='public'
  AND version.lifecycle_state='published' AND offer.status='active'
  AND offer.channel IN ('website','both')
ORDER BY plan.display_order,plan.name,offer.name,definition.label`).all() as CatalogRow[];
    return this.withTrials(shape(rows), createCanonicalUtcTimestamp());
  }

  readSharedPlans(secret: string, atUtc = createCanonicalUtcTimestamp()): readonly PlatformMembershipCatalogPlan[] | null {
    if (!isPlatformMembershipCatalogAvailable(this.database) ||
        !this.tableExists("platform_membership_share_links")) return null;
    const hash = createHash("sha256").update(secret, "utf8").digest("hex");
    const link = this.database.prepare<[string, string], { share_link_id: string }>(`SELECT share_link_id
FROM platform_membership_share_links
WHERE secret_sha256=? AND status='active' AND (expires_at_utc IS NULL OR expires_at_utc>?)
  AND (maximum_claims IS NULL OR claim_count<maximum_claims)`).get(hash, atUtc);
    if (!link) return null;
    const rows = this.database.prepare(`${CATALOG_SELECT}
JOIN platform_membership_share_link_offers shared ON shared.offer_id=offer.offer_id
WHERE shared.share_link_id=? AND plan.status='active'
  AND version.lifecycle_state='published' AND offer.status='active'
ORDER BY shared.display_order,plan.name,offer.name,definition.label`).all(link.share_link_id) as CatalogRow[];
    return this.withTrials(shape(rows), atUtc);
  }

  createShareLink(input: Readonly<{
    actorUserId: string;
    name: string;
    audienceNote?: string;
    offerIds: readonly string[];
    expiresAtUtc: string | null;
    maximumClaims: number | null;
    atUtc?: string;
  }>): Readonly<{ shareLinkId: string; secret: string }> {
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    assertCanonicalUtcTimestamp(at, "atUtc");
    if (input.expiresAtUtc) assertCanonicalUtcTimestamp(input.expiresAtUtc, "expiresAtUtc");
    if (!input.name.trim() || input.name.trim().length > 120 ||
        new Set(input.offerIds).size !== input.offerIds.length ||
        input.offerIds.some((offerId) => !/^[0-9a-f-]{36}$/u.test(offerId)) ||
        (input.expiresAtUtc !== null && input.expiresAtUtc <= at) ||
        (input.maximumClaims !== null && (!Number.isSafeInteger(input.maximumClaims) || input.maximumClaims < 1))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "shareLink" });
    }
    const secret = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(secret, "utf8").digest("hex");
    const shareLinkId = createCanonicalUuidV4();
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_membership_share_links (
  share_link_id,name,secret_sha256,audience_note,expires_at_utc,maximum_claims,
  claim_count,status,created_by_user_id,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,?,?,0,'active',?,?,?)`).run(
        shareLinkId, input.name.trim(), hash, input.audienceNote?.trim() ?? "",
        input.expiresAtUtc, input.maximumClaims, input.actorUserId, at, at,
      );
      const insert = this.database.prepare(`INSERT INTO platform_membership_share_link_offers
(share_link_id,offer_id,display_order) VALUES (?,?,?)`);
      input.offerIds.forEach((offerId, index) => insert.run(shareLinkId, offerId, index));
    }).immediate();
    return Object.freeze({ shareLinkId, secret });
  }

  private tableExists(name: string): boolean {
    return Boolean(this.database.prepare<[string], { found: number }>(
      "SELECT 1 found FROM sqlite_schema WHERE type='table' AND name=?",
    ).get(name));
  }

  private withTrials(plans: readonly PlatformMembershipCatalogPlan[], at: string): readonly PlatformMembershipCatalogPlan[] {
    const read = this.database.prepare(`SELECT trial_campaign_id id,name,duration_days durationDays,COALESCE(entry_amount_minor,0) amount,
      EXISTS(SELECT 1 FROM platform_membership_trial_checkouts x WHERE x.trial_campaign_id=t.trial_campaign_id) hasCheckout,
      payment_method_required paymentMethodRequired FROM platform_membership_trial_campaigns t
      WHERE offer_id=? AND status='active' AND eligibility_mode<>'owner_only'
      AND (enrollment_starts_at_utc IS NULL OR enrollment_starts_at_utc<=?)
      AND (enrollment_ends_at_utc IS NULL OR enrollment_ends_at_utc>?)
      AND (capacity IS NULL OR capacity>(SELECT COUNT(*) FROM platform_membership_claims c WHERE c.trial_campaign_id=t.trial_campaign_id
        AND (c.state='fulfilled' OR (c.state='reserved' AND c.expires_at_utc>?))))`);
    return plans.map((plan) => ({ ...plan, offers: plan.offers.map((offer) => ({ ...offer,
      trials: (read.all(offer.offerId, at, at, at) as { id: string; name: string; durationDays: number; amount: number; paymentMethodRequired: number; hasCheckout: number }[])
        .filter((trial) => offer.provider === "stripe" || (trial.amount === 0 && trial.paymentMethodRequired === 0) || trial.hasCheckout === 1)
        .map((trial) => ({ id: trial.id, name: trial.name, durationDays: trial.durationDays, amount: trial.amount, paymentMethodRequired: trial.paymentMethodRequired === 1 })),
    })) }));
  }
}
