import type Database from "better-sqlite3";
import { createCanonicalUtcTimestamp, assertCanonicalUtcTimestamp } from "../database/platform-migration-contract";

import { isPlatformMembershipCatalogAvailable } from
  "./platform-membership-catalog-repository";

export type PlatformMembershipAdminSnapshot = Readonly<{
  available: boolean;
  counts: Readonly<{
    plans: number;
    publishedVersions: number;
    activeOffers: number;
    activeEntitlements: number;
    activeTrials: number;
    activeShareLinks: number;
  }>;
  plans: readonly Readonly<{
    planId: string;
    name: string;
    status: string;
    visibility: string;
    versionCount: number;
    offerCount: number;
  }>[];
  offers: readonly Readonly<{ offerId: string; label: string }>[];
}>;

export class PlatformMembershipAdminService {
  constructor(private readonly database: Database.Database) {}

  read(atUtc = createCanonicalUtcTimestamp()): PlatformMembershipAdminSnapshot {
    assertCanonicalUtcTimestamp(atUtc, "atUtc");
    if (!isPlatformMembershipCatalogAvailable(this.database)) {
      return Object.freeze({
        available: false,
        counts: Object.freeze({ plans: 0, publishedVersions: 0, activeOffers: 0,
          activeEntitlements: 0, activeTrials: 0, activeShareLinks: 0 }),
        plans: Object.freeze([]), offers: Object.freeze([]),
      });
    }
    const count = (table: string, where = "1=1") =>
      (this.database.prepare(`SELECT COUNT(*) count FROM ${table} WHERE ${where}`).get() as { count: number }).count;
    const effectiveCount = (table: string, where: string, timestamps = 2) =>
      (this.database.prepare(`SELECT COUNT(*) count FROM ${table} WHERE ${where}`).get(...Array<string>(timestamps).fill(atUtc)) as { count: number }).count;
    const plans = this.database.prepare(`SELECT plan.plan_id planId,plan.name,plan.status,
  plan.visibility,COUNT(DISTINCT version.plan_version_id) versionCount,
  COUNT(DISTINCT offer.offer_id) offerCount
FROM platform_membership_plans plan
LEFT JOIN platform_membership_plan_versions version ON version.plan_id=plan.plan_id
LEFT JOIN platform_membership_offers offer ON offer.plan_version_id=version.plan_version_id
GROUP BY plan.plan_id ORDER BY plan.display_order,plan.name`).all() as PlatformMembershipAdminSnapshot["plans"];
    const offers = this.database.prepare(`SELECT offer.offer_id offerId,
  plan.name||' — '||offer.name||' ('||offer.provider||')' label
FROM platform_membership_offers offer
JOIN platform_membership_plan_versions version ON version.plan_version_id=offer.plan_version_id
JOIN platform_membership_plans plan ON plan.plan_id=version.plan_id
WHERE offer.status IN ('draft','active') ORDER BY plan.name,offer.name`).all() as PlatformMembershipAdminSnapshot["offers"];
    return Object.freeze({
      available: true,
      counts: Object.freeze({
        plans: count("platform_membership_plans"),
        publishedVersions: count("platform_membership_plan_versions", "lifecycle_state='published'"),
        activeOffers: count("platform_membership_offers", "status='active'"),
        activeEntitlements: effectiveCount("platform_membership_entitlements", "status='active' AND starts_at_utc<=? AND (ends_at_utc IS NULL OR ends_at_utc>?)"),
        activeTrials: effectiveCount("platform_membership_trial_campaigns", `status='active'
          AND (enrollment_starts_at_utc IS NULL OR enrollment_starts_at_utc<=?)
          AND (enrollment_ends_at_utc IS NULL OR enrollment_ends_at_utc>?)
          AND (capacity IS NULL OR capacity>(SELECT COUNT(*) FROM platform_membership_claims c
            WHERE c.trial_campaign_id=platform_membership_trial_campaigns.trial_campaign_id
            AND (c.state='fulfilled' OR (c.state='reserved' AND c.expires_at_utc>?))))`, 3),
        activeShareLinks: effectiveCount("platform_membership_share_links", "status='active' AND created_at_utc<=? AND (expires_at_utc IS NULL OR expires_at_utc>?) AND (maximum_claims IS NULL OR claim_count<maximum_claims)"),
      }),
      plans: Object.freeze(plans),
      offers: Object.freeze(offers),
    });
  }
}
