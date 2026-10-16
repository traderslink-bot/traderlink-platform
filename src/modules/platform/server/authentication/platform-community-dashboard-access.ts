import type Database from "better-sqlite3";

import { assertCanonicalUuidV4 } from "../database/platform-migration-contract";

/**
 * Returns the Discord guild that admits a current Platform user through an
 * onboarded TraderLink Community. This is intentionally membership-based: no
 * Discord role, Premium flag, or owner-configurable feature mapping may remove
 * the general TraderLink dashboard and Journal baseline.
 */
export function findActiveOnboardedCommunityGuild(
  database: Database.Database,
  userId: string,
): string | null {
  assertCanonicalUuidV4(userId, "userId");
  const row = database.prepare(`SELECT community.discord_guild_id
FROM traderlink_communities community
JOIN traderlink_community_memberships member
  ON member.community_id = community.community_id
WHERE member.user_id = ?
  AND member.status = 'active'
  AND community.status IN ('setup', 'active')
ORDER BY member.discord_verified_at_utc DESC
LIMIT 1`).get(userId) as { discord_guild_id: string } | undefined;
  return row?.discord_guild_id ?? null;
}
