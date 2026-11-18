import type Database from "better-sqlite3";

/** null preserves existing access for users without an explicit owner decision. */
export function directAlertPublisherPermission(database: Database.Database, communityId: string, userId: string): boolean | null {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_alert_publisher_permissions'").get()) return null;
  const row = database.prepare("SELECT enabled FROM community_alert_publisher_permissions WHERE community_id=? AND user_id=?").get(communityId, userId) as { enabled: number } | undefined;
  return row ? row.enabled === 1 : null;
}

/** Sharing always requires an explicit individual grant, including the source owner. */
export function isSharedAlertPublisher(database: Database.Database, communityId: string, userId: string, atUtc: string, requireFresh = false): boolean {
  if (directAlertPublisherPermission(database, communityId, userId) !== true) return false;
  return Boolean(database.prepare(`SELECT 1 FROM traderlink_community_memberships m
    JOIN traderlink_communities c ON c.community_id=m.community_id AND c.status='active'
    JOIN platform_users u ON u.user_id=m.user_id AND u.status='active'
    JOIN platform_auth_identities i ON i.user_id=m.user_id AND i.auth_provider='discord' AND i.status='active'
    JOIN platform_discord_memberships d ON d.user_id=m.user_id AND d.guild_id=c.discord_guild_id
    WHERE m.community_id=? AND m.user_id=? AND m.status='active'
      AND d.last_verified_at_utc>=m.discord_verified_at_utc AND (?=0 OR (d.last_verified_at_utc>=? AND d.last_verified_at_utc<=?))`)
    .get(communityId, userId, requireFresh?1:0, new Date(Date.parse(atUtc) - 300000).toISOString(), atUtc));
}
