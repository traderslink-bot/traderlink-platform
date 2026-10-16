import type Database from "better-sqlite3";
import { resolveTraderLinkDiscordGuildId } from "../authentication/platform-discord-configuration";
import { PlatformMembershipRepository } from "./platform-membership-repository";

/** The active login identity is authoritative; an old guild snapshot is not a connection. */
export function readMembershipDiscordConnection(database: Database.Database, userId: string, at?: string) {
  const connected = Boolean(database.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(userId));
  const guildId = resolveTraderLinkDiscordGuildId();
  const joined = connected && Boolean(database.prepare(`SELECT 1 FROM platform_discord_memberships m
    WHERE m.user_id=? AND m.guild_id=? AND NOT EXISTS (
      SELECT 1 FROM platform_membership_audit_events a WHERE a.subject_user_id=m.user_id
        AND a.target_type='discord_membership' AND a.target_id=m.guild_id
        AND a.action='discord.membership.absent' AND a.occurred_at_utc>=m.last_verified_at_utc
    )`).get(userId, guildId));
  const available = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_plan_presentations'").get();
  if (!available) return { connected, joined, required: false };
  const versions = new Set(new PlatformMembershipRepository(database).readEffectiveAccess(userId, at).sources.map(source => source.planVersionId));
  const read = database.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?");
  const required = [...versions].some(version => {
    const row = read.get(version) as { document_json: string } | undefined;
    return row ? (JSON.parse(row.document_json) as { requiresDiscord?: boolean }).requiresDiscord === true : false;
  });
  return { connected, joined, required };
}
