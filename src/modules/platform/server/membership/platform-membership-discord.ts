import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, assertCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../database/platform-migration-contract";

// Keep the historical Discord snapshot intact. A newer confirmed absence
// supersedes it for commercial grants and purchase eligibility until reverified.
export function recordMembershipDiscordAbsence(database: Database.Database, userId: string, guildId: string, at: string): void {
  assertCanonicalUuidV4(userId, "userId");
  assertCanonicalUtcTimestamp(at, "atUtc");
  if (!/^[0-9]{1,32}$/u.test(guildId)) throw new Error("Invalid Discord guild ID");
  database.prepare(`INSERT INTO platform_membership_audit_events
    (audit_event_id,actor_user_id,subject_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
    SELECT ?,NULL,?,'discord.membership.absent','discord_membership',?,'{}',?
    WHERE EXISTS (SELECT 1 FROM platform_discord_memberships m WHERE m.user_id=? AND m.guild_id=?)`)
    .run(createCanonicalUuidV4(), userId, guildId, at, userId, guildId);
}

export function readMembershipDiscordGuildIds(database: Database.Database): readonly string[] {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_discord_offer_rules'").get()) return [];
  return (database.prepare(`SELECT DISTINCT r.discord_guild_id FROM platform_membership_discord_offer_rules r
    JOIN platform_membership_offers o ON o.offer_id=r.offer_id JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id
    JOIN platform_membership_plans p ON p.plan_id=v.plan_id WHERE r.status='active' AND o.status='active'
    AND v.lifecycle_state='published' AND p.status='active' ORDER BY r.discord_guild_id`).all() as { discord_guild_id: string }[]).map((row) => row.discord_guild_id);
}

export type DiscordMembershipGrant = {
  ruleId: string; planVersionId: string; endsAtUtc: string; startsAtUtc: string;
};

export function readDiscordMembershipGrants(database: Database.Database, userId: string, at: string, purchaseOfferId?: string): DiscordMembershipGrant[] {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_discord_memberships'").get()) return [];
  const rows = database.prepare(`SELECT r.discord_offer_rule_id,r.offer_id,o.plan_version_id,r.discord_role_ids_json,
    r.membership_max_age_seconds,r.starts_at_utc,r.ends_at_utc,m.role_ids_json,m.last_verified_at_utc
    FROM platform_membership_discord_offer_rules r JOIN platform_membership_offers o ON o.offer_id=r.offer_id
    JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id
    JOIN platform_membership_plans p ON p.plan_id=v.plan_id
    JOIN platform_discord_memberships m ON m.guild_id=r.discord_guild_id AND m.user_id=?
    WHERE r.status='active' AND o.status='active' AND v.lifecycle_state='published' AND p.status='active'
    AND r.access_mode=? AND (r.starts_at_utc IS NULL OR r.starts_at_utc<=?) AND (r.ends_at_utc IS NULL OR r.ends_at_utc>?)
    AND NOT EXISTS (SELECT 1 FROM platform_membership_audit_events absence
      WHERE absence.subject_user_id=m.user_id AND absence.target_type='discord_membership'
        AND absence.target_id=m.guild_id AND absence.action='discord.membership.absent'
        AND absence.occurred_at_utc>=m.last_verified_at_utc)`)
    .all(userId, purchaseOfferId ? "eligible_to_purchase" : "automatic_grant", at, at) as {
      discord_offer_rule_id: string; offer_id: string; plan_version_id: string; discord_role_ids_json: string;
      membership_max_age_seconds: number; starts_at_utc: string | null; ends_at_utc: string | null; role_ids_json: string; last_verified_at_utc: string;
    }[];
  return rows.flatMap((row) => {
    if (purchaseOfferId && row.offer_id !== purchaseOfferId) return [];
    const desired: unknown = JSON.parse(row.discord_role_ids_json);
    const roles: unknown = JSON.parse(row.role_ids_json);
    if (!Array.isArray(desired) || !Array.isArray(roles) || (desired.length && !desired.some((id) => roles.includes(id)))) return [];
    const freshUntil = new Date(Date.parse(row.last_verified_at_utc) + row.membership_max_age_seconds * 1000).toISOString();
    const end = row.ends_at_utc && row.ends_at_utc < freshUntil ? row.ends_at_utc : freshUntil;
    if (end <= at || row.last_verified_at_utc > at) return [];
    return [{ ruleId: row.discord_offer_rule_id, planVersionId: row.plan_version_id,
      startsAtUtc: row.starts_at_utc ?? row.last_verified_at_utc, endsAtUtc: end }];
  });
}
