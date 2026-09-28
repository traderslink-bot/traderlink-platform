import type Database from "better-sqlite3";
import { currencyDecimals } from "../../contracts/platform-membership-pricing";
import { readDiscordMembershipGrants } from "./platform-membership-discord";

import {
  PLATFORM_MEMBERSHIP_FEATURES,
  type PlatformEffectiveMembershipAccess,
  type PlatformMembershipEntitlementSource,
  type PlatformMembershipFeatureGrant,
} from "@/src/modules/platform/contracts/platform-membership-contracts";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type EffectiveFeatureRow = Readonly<{
  entitlement_id: string;
  source_type: PlatformMembershipEntitlementSource;
  plan_version_id: string;
  starts_at_utc: string;
  ends_at_utc: string | null;
  feature_key: string | null;
  feature_kind: "boolean" | "limit" | null;
  limit_value: number | null;
}>;

function requireText(value: string, field: string, maximum = 120): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return normalized;
}

export class PlatformMembershipRepository {
  constructor(private readonly database: Database.Database) {}

  synchronizeBuiltInFeatures(actorUserId: string, atUtc = createCanonicalUtcTimestamp()): void {
    assertCanonicalUuidV4(actorUserId, "actorUserId");
    assertCanonicalUtcTimestamp(atUtc, "atUtc");
    const statement = this.database.prepare(`INSERT INTO platform_membership_feature_definitions (
  feature_key,label,module_key,feature_kind,enforcement_state,owner_selectable,
  created_by_user_id,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,'planned',1,?,?,?)
ON CONFLICT(feature_key) DO NOTHING`);
    this.database.transaction(() => {
      for (const feature of PLATFORM_MEMBERSHIP_FEATURES) {
        statement.run(feature.key, feature.label, feature.module, feature.kind,
          actorUserId, atUtc, atUtc);
      }
      this.insertAudit(actorUserId, null, "feature.builtins_synchronized", "feature_catalog",
        "builtins", { count: String(PLATFORM_MEMBERSHIP_FEATURES.length) }, atUtc);
    }).immediate();
  }

  registerFeature(input: Readonly<{
    actorUserId: string;
    featureKey: string;
    label: string;
    moduleKey: string;
    featureKind: "boolean" | "limit";
    enforcementState: "planned" | "ready" | "paused";
    ownerSelectable?: boolean;
    atUtc?: string;
  }>): void {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUtcTimestamp(at, "atUtc");
    const featureKey = requireText(input.featureKey, "featureKey", 100);
    const moduleKey = requireText(input.moduleKey, "moduleKey", 64);
    if (!/^[a-z][a-z0-9_.-]*$/u.test(featureKey) || !/^[a-z][a-z0-9_-]*$/u.test(moduleKey)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "featureKey" });
    }
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_membership_feature_definitions (
  feature_key,label,module_key,feature_kind,enforcement_state,owner_selectable,
  created_by_user_id,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,?,?,?,?,?)
ON CONFLICT(feature_key) DO UPDATE SET label=excluded.label,module_key=excluded.module_key,
  enforcement_state=excluded.enforcement_state,owner_selectable=excluded.owner_selectable,
  updated_at_utc=excluded.updated_at_utc`).run(
        featureKey, requireText(input.label, "label"), moduleKey, input.featureKind,
        input.enforcementState, input.ownerSelectable === false ? 0 : 1,
        input.actorUserId, at, at,
      );
      this.insertAudit(input.actorUserId, null, "feature.registered", "feature", featureKey,
        { featureKind: input.featureKind, enforcementState: input.enforcementState }, at);
    }).immediate();
  }

  registerProvider(input: Readonly<{
    actorUserId: string;
    providerKey: string;
    label: string;
    integrationMode: "native" | "external_checkout" | "manual" | "free";
    configurationState: "unconfigured" | "test" | "ready" | "paused";
    atUtc?: string;
  }>): void {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUtcTimestamp(at, "atUtc");
    const providerKey = requireText(input.providerKey, "providerKey", 64);
    if (!/^[a-z][a-z0-9_-]*$/u.test(providerKey)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "providerKey" });
    }
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_membership_provider_definitions (
  provider_key,label,integration_mode,configuration_state,created_by_user_id,
  created_at_utc,updated_at_utc
) VALUES (?,?,?,?,?,?,?)
ON CONFLICT(provider_key) DO UPDATE SET label=excluded.label,
  integration_mode=excluded.integration_mode,configuration_state=excluded.configuration_state,
  updated_at_utc=excluded.updated_at_utc`).run(
        providerKey, requireText(input.label, "label"), input.integrationMode,
        input.configurationState, input.actorUserId, at, at,
      );
      this.insertAudit(input.actorUserId, null, "provider.registered", "provider",
        providerKey, { integrationMode: input.integrationMode,
          configurationState: input.configurationState }, at);
    }).immediate();
  }

  createOffer(input: Readonly<{
    actorUserId: string;
    planVersionId: string;
    name: string;
    provider: string;
    channel: "website" | "discord" | "both" | "private";
    billingKind: "free" | "one_time" | "recurring" | "lifetime";
    currency: string | null;
    initialAmountMinor: number | null;
    renewalAmountMinor: number | null;
    billingPeriodDays: number | null;
    billingInterval?: "day" | "week" | "month" | "year" | null;
    billingIntervalCount?: number | null;
    accessDurationDays?: number | null;
    externalProductRef?: string | null;
    externalPriceRef?: string | null;
    externalCheckoutUrl?: string | null;
    atUtc?: string;
  }>): string {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    assertCanonicalUuidV4(input.planVersionId, "planVersionId");
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    const currency = input.currency?.trim().toUpperCase() ?? null;
    const interval = input.billingInterval ?? (input.billingPeriodDays ? "day" : null);
    const intervalCount = input.billingIntervalCount ?? input.billingPeriodDays;
    assertCanonicalUtcTimestamp(at, "atUtc");
    if (input.accessDurationDays != null && (!Number.isSafeInteger(input.accessDurationDays) || input.accessDurationDays < 1 || !["one_time", "free"].includes(input.billingKind))) {
      throw new Error("Enter a positive access duration for a one-time or free offer.");
    }
    if (interval !== null && (!["day", "week", "month", "year"].includes(interval) || !Number.isSafeInteger(intervalCount) || intervalCount! < 1)) {
      throw new Error("Enter a positive whole-number billing interval.");
    }
    if (currency) currencyDecimals(currency);
    if (input.billingKind !== "free" && (!currency || input.initialAmountMinor === null)) {
      throw new Error("Paid offers require a currency and initial price.");
    }
    if (input.billingKind === "recurring" && (input.renewalAmountMinor === null || !interval ||
        !Number.isSafeInteger(intervalCount) || intervalCount! < 1)) {
      throw new Error("Recurring offers require a renewal price and billing interval.");
    }
    if (input.billingKind === "free" && ((input.initialAmountMinor ?? 0) !== 0 || (input.renewalAmountMinor ?? 0) !== 0)) {
      throw new Error("A free offer cannot include a charge.");
    }
    if (input.externalCheckoutUrl) {
      const url = new URL(input.externalCheckoutUrl);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("Checkout must use an HTTPS URL.");
    }
    if ((currency !== null && !/^[A-Z]{3}$/u.test(currency)) ||
        (input.initialAmountMinor !== null && (!Number.isSafeInteger(input.initialAmountMinor) || input.initialAmountMinor < 0)) ||
        (input.renewalAmountMinor !== null && (!Number.isSafeInteger(input.renewalAmountMinor) || input.renewalAmountMinor < 0)) ||
        (input.billingPeriodDays !== null && (!Number.isSafeInteger(input.billingPeriodDays) || input.billingPeriodDays < 1))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "offerTerms" });
    }
    const provider = requireText(input.provider, "provider", 64);
    const offerId = createCanonicalUuidV4();
    this.database.transaction(() => {
      const providerRow = this.database.prepare<[string], { integration_mode: string }>(
        "SELECT integration_mode FROM platform_membership_provider_definitions WHERE provider_key=?",
      ).get(provider);
      if (!providerRow) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "provider" });
      if (providerRow.integration_mode === "free" &&
          (currency !== null || input.initialAmountMinor !== null || input.renewalAmountMinor !== null)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "freeOfferPrice" });
      }
      this.database.prepare(`INSERT INTO platform_membership_offers (
  offer_id,plan_version_id,name,provider,channel,billing_kind,currency,
  initial_amount_minor,renewal_amount_minor,billing_period_days,external_product_ref,
  external_price_ref,external_checkout_url,status,created_at_utc,updated_at_utc,billing_interval,billing_interval_count,access_duration_days
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?,?,?,?,?)`).run(
        offerId, input.planVersionId, requireText(input.name, "name"), provider,
        input.channel, input.billingKind, currency, input.initialAmountMinor,
        input.renewalAmountMinor, input.billingPeriodDays,
        input.externalProductRef?.trim() || null, input.externalPriceRef?.trim() || null,
        input.externalCheckoutUrl?.trim() || null, at, at, interval, intervalCount, input.accessDurationDays ?? null,
      );
      this.insertAudit(input.actorUserId, null, "offer.created", "offer", offerId,
        { provider, planVersionId: input.planVersionId }, at);
    }).immediate();
    return offerId;
  }

  createTrialCampaign(input: Readonly<{
    actorUserId: string;
    offerId: string;
    name: string;
    durationDays: number;
    entryAmountMinor: number | null;
    paymentMethodRequired: boolean;
    eligibilityMode: "once_per_campaign" | "once_ever" | "unlimited" | "owner_only";
    enrollmentStartsAtUtc: string | null;
    enrollmentEndsAtUtc: string | null;
    capacity: number | null;
    atUtc?: string;
  }>): string {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    assertCanonicalUuidV4(input.offerId, "offerId");
    if (!Number.isSafeInteger(input.durationDays) || input.durationDays < 1 ||
        (input.entryAmountMinor !== null && (!Number.isSafeInteger(input.entryAmountMinor) || input.entryAmountMinor < 0)) ||
        (input.capacity !== null && (!Number.isSafeInteger(input.capacity) || input.capacity < 1))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trialTerms" });
    }
    if (input.enrollmentStartsAtUtc) assertCanonicalUtcTimestamp(input.enrollmentStartsAtUtc, "enrollmentStartsAtUtc");
    if (input.enrollmentEndsAtUtc) assertCanonicalUtcTimestamp(input.enrollmentEndsAtUtc, "enrollmentEndsAtUtc");
    if (input.enrollmentStartsAtUtc && input.enrollmentEndsAtUtc &&
        input.enrollmentEndsAtUtc <= input.enrollmentStartsAtUtc) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trialWindow" });
    }
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    const trialCampaignId = createCanonicalUuidV4();
    assertCanonicalUtcTimestamp(at, "atUtc");
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_membership_trial_campaigns (
  trial_campaign_id,offer_id,name,duration_days,entry_amount_minor,
  payment_method_required,eligibility_mode,enrollment_starts_at_utc,
  enrollment_ends_at_utc,capacity,status,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,?,?,?,?,?,?,'draft',?,?)`).run(
        trialCampaignId, input.offerId, requireText(input.name, "name"),
        input.durationDays, input.entryAmountMinor, input.paymentMethodRequired ? 1 : 0,
        input.eligibilityMode, input.enrollmentStartsAtUtc, input.enrollmentEndsAtUtc,
        input.capacity, at, at,
      );
      this.insertAudit(input.actorUserId, null, "trial.created", "trial_campaign",
        trialCampaignId, { offerId: input.offerId }, at);
    }).immediate();
    return trialCampaignId;
  }

  createPlan(input: Readonly<{
    actorUserId: string;
    planKey: string;
    name: string;
    internalNote?: string;
    visibility: "public" | "private" | "unlisted";
    publicDescription?: string;
    features: readonly PlatformMembershipFeatureGrant[];
    atUtc?: string;
  }>): Readonly<{ planId: string; planVersionId: string }> {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUtcTimestamp(at, "atUtc");
    const planKey = requireText(input.planKey, "planKey", 64);
    if (!/^[a-z][a-z0-9-]*$/u.test(planKey)) {
      throw new Error("Enter a plan key starting with a lowercase letter, using only lowercase letters, numbers and hyphens.");
    }
    const planId = createCanonicalUuidV4();
    const planVersionId = createCanonicalUuidV4();
    this.database.transaction(() => {
      this.database.prepare(`INSERT INTO platform_membership_plans (
  plan_id,plan_key,name,internal_note,status,visibility,display_order,
  created_by_user_id,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,'draft',?,0,?,?,?)`).run(
        planId, planKey, requireText(input.name, "name"),
        input.internalNote?.trim() ?? "", input.visibility, input.actorUserId, at, at,
      );
      this.database.prepare(`INSERT INTO platform_membership_plan_versions (
  plan_version_id,plan_id,version_number,public_description,lifecycle_state,
  published_at_utc,retired_at_utc,created_by_user_id,created_at_utc
) VALUES (?,?,1,?,'draft',NULL,NULL,?,?)`).run(
        planVersionId, planId, input.publicDescription?.trim() ?? "", input.actorUserId, at,
      );
      this.replaceDraftFeatures(planVersionId, input.features);
      this.insertAudit(input.actorUserId, null, "plan.created", "plan", planId,
        { planVersionId }, at);
    }).immediate();
    return Object.freeze({ planId, planVersionId });
  }

  replaceDraftFeatures(
    planVersionId: string,
    features: readonly PlatformMembershipFeatureGrant[],
  ): void {
    assertCanonicalUuidV4(planVersionId, "planVersionId");
    const version = this.database.prepare<[string], { lifecycle_state: string }>(
      "SELECT lifecycle_state FROM platform_membership_plan_versions WHERE plan_version_id=?",
    ).get(planVersionId);
    if (version?.lifecycle_state !== "draft") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "publishedPlanImmutable" });
    }
    const seen = new Set<string>();
    const definitions = new Map(this.database.prepare<[], Readonly<{
      feature_key: string;
      feature_kind: "boolean" | "limit";
      owner_selectable: number;
    }>>("SELECT feature_key,feature_kind,owner_selectable FROM platform_membership_feature_definitions")
      .all().map((definition) => [definition.feature_key, definition]));
    for (const grant of features) {
      const feature = definitions.get(grant.featureKey);
      if (!feature || feature.owner_selectable !== 1 || seen.has(grant.featureKey) ||
          (feature.feature_kind === "boolean" && grant.limitValue !== null) ||
          (feature.feature_kind === "limit" && grant.limitValue !== null && (!Number.isSafeInteger(grant.limitValue) || grant.limitValue < 0))) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "features" });
      }
      seen.add(grant.featureKey);
    }
    this.database.transaction(() => {
      this.database.prepare("DELETE FROM platform_membership_plan_features WHERE plan_version_id=?")
        .run(planVersionId);
      const insert = this.database.prepare(`INSERT INTO platform_membership_plan_features
(plan_version_id,feature_key,feature_kind,limit_value) VALUES (?,?,?,?)`);
      for (const grant of features) {
        const feature = definitions.get(grant.featureKey)!;
        insert.run(planVersionId, grant.featureKey, feature.feature_kind, grant.limitValue);
      }
    }).immediate();
  }

  publishPlanVersion(input: Readonly<{
    actorUserId: string;
    planVersionId: string;
    atUtc?: string;
  }>): void {
    assertCanonicalUuidV4(input.actorUserId, "actorUserId");
    assertCanonicalUuidV4(input.planVersionId, "planVersionId");
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    assertCanonicalUtcTimestamp(at, "atUtc");
    this.database.transaction(() => {
      const result = this.database.prepare(`UPDATE platform_membership_plan_versions
SET lifecycle_state='published',published_at_utc=?
WHERE plan_version_id=? AND lifecycle_state='draft'`).run(at, input.planVersionId);
      if (result.changes !== 1) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "planVersionState" });
      }
      this.database.prepare(`UPDATE platform_membership_plans SET status='active',updated_at_utc=?
WHERE plan_id=(SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?)`)
        .run(at, input.planVersionId);
      this.insertAudit(input.actorUserId, null, "plan_version.published", "plan_version",
        input.planVersionId, {}, at);
    }).immediate();
  }

  grantEntitlement(input: Readonly<{
    actorUserId: string;
    userId: string;
    planVersionId: string;
    sourceType: PlatformMembershipEntitlementSource;
    sourceRef: string;
    startsAtUtc: string;
    endsAtUtc: string | null;
    reason?: string;
    atUtc?: string;
  }>): string {
    for (const [field, value] of [["actorUserId", input.actorUserId], ["userId", input.userId],
      ["planVersionId", input.planVersionId]] as const) assertCanonicalUuidV4(value, field);
    assertCanonicalUtcTimestamp(input.startsAtUtc, "startsAtUtc");
    if (input.endsAtUtc) assertCanonicalUtcTimestamp(input.endsAtUtc, "endsAtUtc");
    if (input.endsAtUtc && input.endsAtUtc <= input.startsAtUtc) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "endsAtUtc" });
    }
    const at = input.atUtc ?? createCanonicalUtcTimestamp();
    const entitlementId = createCanonicalUuidV4();
    assertCanonicalUtcTimestamp(at, "atUtc");
    this.database.transaction(() => {
      const published = this.database.prepare<[string], { found: number }>(`SELECT 1 found
FROM platform_membership_plan_versions WHERE plan_version_id=? AND lifecycle_state='published'`)
        .get(input.planVersionId);
      if (!published) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "planVersionId" });
      this.database.prepare(`INSERT INTO platform_membership_entitlements (
  entitlement_id,user_id,plan_version_id,source_type,source_ref,status,starts_at_utc,
  ends_at_utc,granted_by_user_id,reason,created_at_utc,updated_at_utc
) VALUES (?,?,?,?,?,'active',?,?,?,?,?,?)`).run(
        entitlementId, input.userId, input.planVersionId, input.sourceType,
        requireText(input.sourceRef, "sourceRef", 200), input.startsAtUtc,
        input.endsAtUtc, input.actorUserId, input.reason?.trim() ?? "", at, at,
      );
      this.insertAudit(input.actorUserId, input.userId, "entitlement.granted", "entitlement",
        entitlementId, { sourceType: input.sourceType, planVersionId: input.planVersionId }, at);
    }).immediate();
    return entitlementId;
  }

  readEffectiveAccess(userId: string, atUtc = createCanonicalUtcTimestamp()): PlatformEffectiveMembershipAccess {
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUtcTimestamp(atUtc, "atUtc");
    const rows = this.database.prepare<[string, string, string], EffectiveFeatureRow>(`SELECT
  entitlement.entitlement_id,entitlement.source_type,entitlement.plan_version_id,
  entitlement.starts_at_utc,entitlement.ends_at_utc,feature.feature_key,
  feature.feature_kind,feature.limit_value
FROM platform_membership_entitlements entitlement
LEFT JOIN platform_membership_plan_features feature
  ON feature.plan_version_id=entitlement.plan_version_id
WHERE entitlement.user_id=? AND entitlement.status='active'
  AND entitlement.starts_at_utc<=?
  AND (entitlement.ends_at_utc IS NULL OR entitlement.ends_at_utc>?)
ORDER BY entitlement.created_at_utc,feature.feature_key`).all(userId, atUtc, atUtc);
    for (const grant of readDiscordMembershipGrants(this.database, userId, atUtc)) {
      const features = this.database.prepare("SELECT feature_key,feature_kind,limit_value FROM platform_membership_plan_features WHERE plan_version_id=?")
        .all(grant.planVersionId) as Pick<EffectiveFeatureRow, "feature_key" | "feature_kind" | "limit_value">[];
      if (!features.length) features.push({ feature_key: null, feature_kind: null, limit_value: null });
      rows.push(...features.map((feature) => ({ ...feature, entitlement_id: grant.ruleId, source_type: "discord" as const,
        plan_version_id: grant.planVersionId, starts_at_utc: grant.startsAtUtc, ends_at_utc: grant.endsAtUtc })));
    }
    const booleans = new Set<string>();
    const limits: Record<string, number | null> = {};
    const sources = new Map<string, PlatformEffectiveMembershipAccess["sources"][number]>();
    for (const row of rows) {
      if (row.feature_key !== null) {
        if (row.feature_kind === "boolean") booleans.add(row.feature_key);
        else if (row.limit_value === null) limits[row.feature_key] = null;
        else if (limits[row.feature_key] !== null) limits[row.feature_key] = Math.max(limits[row.feature_key] ?? 0, row.limit_value);
      }
      sources.set(row.entitlement_id, Object.freeze({
        entitlementId: row.entitlement_id,
        source: row.source_type,
        planVersionId: row.plan_version_id,
        startsAtUtc: row.starts_at_utc,
        endsAtUtc: row.ends_at_utc,
      }));
    }
    return Object.freeze({
      userId,
      evaluatedAtUtc: atUtc,
      booleanFeatures: Object.freeze([...booleans].sort()) as PlatformEffectiveMembershipAccess["booleanFeatures"],
      limits: Object.freeze(limits),
      sources: Object.freeze([...sources.values()]),
    });
  }

  private insertAudit(
    actorUserId: string,
    subjectUserId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    details: Readonly<Record<string, string>>,
    atUtc: string,
  ): void {
    this.database.prepare(`INSERT INTO platform_membership_audit_events (
  audit_event_id,actor_user_id,subject_user_id,action,target_type,target_id,
  safe_details_json,occurred_at_utc
) VALUES (?,?,?,?,?,?,?,?)`).run(
      createCanonicalUuidV4(), actorUserId, subjectUserId, action, targetType,
      targetId, JSON.stringify(details), atUtc,
    );
  }
}
