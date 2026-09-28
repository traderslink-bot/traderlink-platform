import type Database from "better-sqlite3";

/** Call inside a verified successful renewal transaction, never on browser return. */
export function applyMembershipRenewalChanges(database: Database.Database, userId: string, sourceRef: string, coveredUntil: string | null, at: string): void {
  if (!coveredUntil) return;
  const pending = database.prepare(`SELECT c.entitlement_id,c.target_plan_version_id FROM platform_membership_version_changes c
    JOIN platform_membership_entitlements e ON e.entitlement_id=c.entitlement_id
    WHERE e.user_id=? AND e.source_type='subscription' AND e.source_ref=? AND e.status='active'
      AND c.applied_at_utc IS NULL AND c.renewal_after_utc<?`).all(userId, sourceRef, coveredUntil) as { entitlement_id: string; target_plan_version_id: string }[];
  for (const change of pending) {
    database.prepare("UPDATE platform_membership_entitlements SET plan_version_id=?,updated_at_utc=? WHERE entitlement_id=?").run(change.target_plan_version_id, at, change.entitlement_id);
    database.prepare("UPDATE platform_membership_version_changes SET applied_at_utc=? WHERE entitlement_id=?").run(at, change.entitlement_id);
  }
}
