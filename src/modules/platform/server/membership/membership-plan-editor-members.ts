import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../database/platform-migration-contract";
import { readDiscordMembershipGrants } from "./platform-membership-discord";

export type MembershipPlanMemberImpact = {
  memberCount: number; directGrantCount: number; discordMemberCount: number; subscriptionCount: number;
};

/** Read-only owner preview; no identities or member records are sent to the editor. */
export function readMembershipPlanMemberImpact(db: Database.Database, planId: string, at: string): MembershipPlanMemberImpact {
  assertCanonicalUuidV4(planId, "planId"); assertCanonicalUtcTimestamp(at, "at");
  const direct = db.prepare(`SELECT e.user_id,e.source_type FROM platform_membership_entitlements e
    JOIN platform_membership_plan_versions v ON v.plan_version_id=e.plan_version_id
    WHERE v.plan_id=? AND e.status IN ('active','scheduled') AND (e.ends_at_utc IS NULL OR e.ends_at_utc>?)`).all(planId, at) as
      { user_id: string; source_type: string }[];
  const memberIds = new Set(direct.map(row => row.user_id));
  const discordIds = new Set<string>();
  const versions = new Set((db.prepare("SELECT plan_version_id FROM platform_membership_plan_versions WHERE plan_id=?").all(planId) as
    { plan_version_id: string }[]).map(row => row.plan_version_id));
  if (db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_discord_memberships'").get()) {
    const candidates = db.prepare(`SELECT DISTINCT m.user_id FROM platform_discord_memberships m
      JOIN platform_membership_discord_offer_rules r ON r.discord_guild_id=m.guild_id
      JOIN platform_membership_offers o ON o.offer_id=r.offer_id
      JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id
      WHERE v.plan_id=? AND r.access_mode='automatic_grant'`).all(planId) as { user_id: string }[];
    for (const candidate of candidates) {
      if (readDiscordMembershipGrants(db, candidate.user_id, at).some(grant => versions.has(grant.planVersionId))) {
        discordIds.add(candidate.user_id); memberIds.add(candidate.user_id);
      }
    }
  }
  return { memberCount: memberIds.size, directGrantCount: direct.length, discordMemberCount: discordIds.size,
    subscriptionCount: direct.filter(row => row.source_type === "subscription").length };
}
