import type Database from "better-sqlite3";
import { readDiscordMembershipGrants } from "./platform-membership-discord";
import { carryMembershipUsage } from "./membership-plan-usage";

export function snapshotMembershipPlanMembers(db: Database.Database, planId: string, at: string) {
  const direct = db.prepare(`SELECT e.entitlement_id,e.user_id,e.plan_version_id FROM platform_membership_entitlements e
    JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE v.plan_id=?
    AND e.status IN ('active','scheduled') AND (e.ends_at_utc IS NULL OR e.ends_at_utc>?)`).all(planId, at) as
      { entitlement_id: string; user_id: string; plan_version_id: string }[];
  const versions = new Set((db.prepare("SELECT plan_version_id FROM platform_membership_plan_versions WHERE plan_id=?").all(planId) as
    { plan_version_id: string }[]).map(row => row.plan_version_id));
  const discord: { userId: string; ruleId: string; versionId: string }[] = [];
  if (db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_discord_memberships'").get()) {
    const candidates = db.prepare(`SELECT DISTINCT m.user_id FROM platform_discord_memberships m
      JOIN platform_membership_discord_offer_rules r ON r.discord_guild_id=m.guild_id
      JOIN platform_membership_offers o ON o.offer_id=r.offer_id JOIN platform_membership_plan_versions v USING(plan_version_id)
      WHERE v.plan_id=? AND r.access_mode='automatic_grant'`).all(planId) as { user_id: string }[];
    for (const user of candidates) for (const grant of readDiscordMembershipGrants(db, user.user_id, at)) {
      if (versions.has(grant.planVersionId)) discord.push({ userId: user.user_id, ruleId: grant.ruleId, versionId: grant.planVersionId });
    }
  }
  return { direct, discord };
}

/** Caller holds the publication transaction. No billing record or expiry is changed. */
export function applyMembershipPlanMembers(db: Database.Database, planId: string, target: string, apply: boolean,
  snapshot: ReturnType<typeof snapshotMembershipPlanMembers>, at: string): number {
  if (!apply) {
    for (const member of snapshot.discord) db.prepare(`INSERT OR IGNORE INTO platform_membership_discord_retained_access
      (user_id,plan_id,rule_id,created_at_utc) VALUES (?,?,?,?)`).run(member.userId, planId, member.ruleId, at);
    return 0;
  }
  const byUser = new Map<string, Set<string>>();
  for (const row of [...snapshot.direct.map(m => ({ userId: m.user_id, versionId: m.plan_version_id })), ...snapshot.discord]) {
    const versions = byUser.get(row.userId) ?? new Set<string>(); versions.add(row.versionId); byUser.set(row.userId, versions);
  }
  for (const [user, versions] of byUser) carryMembershipUsage(db, user, [...versions], target, at);
  for (const grant of snapshot.direct) {
    db.prepare("UPDATE platform_membership_entitlements SET plan_version_id=?,updated_at_utc=? WHERE entitlement_id=?")
      .run(target, at, grant.entitlement_id);
    db.prepare("DELETE FROM platform_membership_version_changes WHERE entitlement_id=? AND applied_at_utc IS NULL").run(grant.entitlement_id);
  }
  db.prepare("DELETE FROM platform_membership_discord_retained_access WHERE plan_id=?").run(planId);
  return byUser.size;
}
