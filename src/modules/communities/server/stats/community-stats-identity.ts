import "server-only";
import type Database from "better-sqlite3";
import type { CommunityStatsIdentityResolution } from "../../contracts/community-stats-contracts";
import { TraderLinkCommunityRepository } from "../traderlink-community-repository";
import { assertCanonicalUuidV4 } from "../../../platform/server/database/platform-migration-contract";
import { statsUtcMs } from "./community-stats-coverage";
import {communityStatsStorageReady} from "./community-stats-repository";

const MEMBERSHIP_FRESHNESS_MS = 5 * 60_000;
type IdentityRow = Readonly<{
  community_id: string; discord_guild_id: string; user_id: string; auth_subject: string;
  identity_created_at_utc: string; identity_updated_at_utc: string;
  username: string | null; global_display_name: string | null;
  last_verified_at_utc: string | null; discord_verified_at_utc: string | null;
  membership_status: string | null;
}>;

/** Current evidence only. Historical visits must retain their own bounded identity snapshot. */
function resolveCurrentIdentity(
  database: Database.Database,
  input: Readonly<{ communityId: string; subjectUserId: string; atUtc: string }>,
): CommunityStatsIdentityResolution {
  assertCanonicalUuidV4(input.communityId, "communityId");
  assertCanonicalUuidV4(input.subjectUserId, "subjectUserId");
  const at = statsUtcMs(input.atUtc);
  const rows = database.prepare(`SELECT c.community_id,c.discord_guild_id,i.user_id,i.auth_subject,
    i.created_at_utc AS identity_created_at_utc,i.updated_at_utc AS identity_updated_at_utc,
    d.username,d.global_display_name,d.last_verified_at_utc,
    m.discord_verified_at_utc,m.status AS membership_status
    FROM traderlink_communities c
    JOIN traderlink_community_memberships m ON m.community_id=c.community_id AND m.user_id=?
    JOIN platform_users u ON u.user_id=m.user_id AND u.status='active'
    JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
    LEFT JOIN platform_discord_memberships d ON d.user_id=u.user_id AND d.guild_id=c.discord_guild_id
    WHERE c.community_id=? AND c.status='active'
    AND NOT EXISTS(SELECT 1 FROM traderlink_community_lifecycle l
      WHERE l.community_id=c.community_id AND l.removed_at_utc IS NOT NULL)
    LIMIT 2`).all(input.subjectUserId, input.communityId) as IdentityRow[];
  if (!rows.length) return Object.freeze({ state: "unlinked", reason: "no_discord_identity" });
  if (rows.length !== 1) return Object.freeze({ state: "unavailable", reason: "ambiguous_identity" });
  const row = rows[0];
  if (!/^[0-9]{1,32}$/u.test(row.auth_subject)) return Object.freeze({ state: "unavailable", reason: "ambiguous_identity" });
  if (row.membership_status !== "active" || !row.username || !row.last_verified_at_utc || !row.discord_verified_at_utc) {
    return Object.freeze({ state: "unavailable", reason: "membership_unverified" });
  }
  const observed = statsUtcMs(row.last_verified_at_utc);
  const identityUpdated = statsUtcMs(row.identity_updated_at_utc);
  const linked = statsUtcMs(row.identity_created_at_utc);
  if (observed > at || identityUpdated > at || linked > at) {
    return Object.freeze({ state: "unavailable", reason: "identity_not_yet_observed" });
  }
  // A renamed/relinked account must not inherit another Discord identity's cached profile.
  if (at - observed > MEMBERSHIP_FRESHNESS_MS || observed < identityUpdated
    || observed < statsUtcMs(row.discord_verified_at_utc)) {
    return Object.freeze({ state: "unavailable", reason: "membership_unverified" });
  }
  const native=communityStatsStorageReady(database)?database.prepare(`SELECT n.nickname FROM community_stats_members n JOIN community_stats_source_state s ON s.community_id=n.community_id AND s.source='membership' AND s.status='collecting' WHERE n.community_id=? AND n.discord_user_id=? AND n.active=1 AND s.checked_at_utc>=?`).get(row.community_id,row.auth_subject,new Date(at-MEMBERSHIP_FRESHNESS_MS).toISOString()) as {nickname:string|null}|undefined:undefined;
  return Object.freeze({ state: "verified", identity: Object.freeze({
    communityId: row.community_id, guildId: row.discord_guild_id, platformUserId: row.user_id,
    discordUserId: row.auth_subject, username: row.username, globalDisplayName: row.global_display_name,
    guildNickname: native?.nickname??null, nicknameAvailability: native?"observed":"not_collected",
    linkedAtUtc: row.identity_created_at_utc, identityUpdatedAtUtc: row.identity_updated_at_utc,
    observedAtUtc: row.last_verified_at_utc, source: "verified_platform_discord_membership",
  }) });
}

/** Caller must first complete the existing request-time membership verification. No Discord I/O here. */
export function resolveOwnCommunityStatsIdentity(
  database: Database.Database,
  input: Readonly<{ communityId: string; authenticatedUserId: string; atUtc: string }>,
): CommunityStatsIdentityResolution {
  new TraderLinkCommunityRepository(database).requireCapability(input.communityId, input.authenticatedUserId, "community.view");
  return resolveCurrentIdentity(database, {
    communityId: input.communityId, subjectUserId: input.authenticatedUserId, atUtc: input.atUtc,
  });
}

/** An aggregate grant cannot read another person's Discord username. */
export function readNamedCommunityStatsIdentity(
  database: Database.Database,
  input: Readonly<{ communityId: string; actorUserId: string; subjectUserId: string; atUtc: string }>,
): CommunityStatsIdentityResolution {
  const repository = new TraderLinkCommunityRepository(database);
  repository.requireCapability(input.communityId, input.actorUserId, "community.analytics.view");
  repository.requireCapability(input.communityId, input.actorUserId, "community.member_activity.view");
  return resolveCurrentIdentity(database, input);
}
