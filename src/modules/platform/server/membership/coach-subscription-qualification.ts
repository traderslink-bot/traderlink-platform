import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../database/platform-migration-contract";

/** Read reconciled Membership facts only. Scoped commission/exemption policy and
 * tool authorization belong to Coaching. Global enforcement OFF is not proof of
 * a subscription when that scoped arrangement explicitly requires one.
 * Refund reconciliation can replace an entitlement with a residual accepted
 * version without changing its provider offer; the owned source link remains
 * authoritative and must not require equal offer/entitlement versions.
 */
export function readCoachSubscriptionQualification(database: Database.Database, input: Readonly<{
  coachUserId: string; atUtc: string;
}>): Readonly<{ version: 1; qualified: boolean }> {
  assertCanonicalUuidV4(input.coachUserId, "coachUserId");
  assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
  const row = database.prepare(`SELECT 1 FROM platform_membership_entitlements e
    JOIN platform_membership_plan_features f ON f.plan_version_id=e.plan_version_id
    JOIN platform_membership_provider_subscriptions s ON s.user_id=e.user_id
      AND s.external_subscription_ref=e.source_ref
    JOIN platform_membership_offers o ON o.offer_id=s.offer_id AND o.provider=s.provider
    WHERE e.user_id=? AND e.source_type='subscription' AND e.status='active'
      AND e.starts_at_utc<=? AND (e.ends_at_utc IS NULL OR e.ends_at_utc>?)
      AND f.feature_key='coaching.coach_account' AND f.feature_kind='boolean'
      AND s.lifecycle_state IN ('active','trialing','cancel_at_period_end')
    LIMIT 1`).get(input.coachUserId, input.atUtc, input.atUtc);
  return { version: 1, qualified: Boolean(row) };
}
