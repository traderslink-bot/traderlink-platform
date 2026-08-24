import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE community_watchlist_follows (
  watchlist_follow_id TEXT PRIMARY KEY ${uuidCheck("watchlist_follow_id")},
  watchlist_id TEXT NOT NULL ${uuidCheck("watchlist_id")},
  follower_user_id TEXT NOT NULL ${uuidCheck("follower_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (watchlist_id, follower_user_id),
  FOREIGN KEY (watchlist_id) REFERENCES community_watchlists(watchlist_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (follower_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX community_watchlist_follows_by_watchlist
  ON community_watchlist_follows(watchlist_id, created_at_utc DESC);
CREATE INDEX community_watchlist_follows_by_follower
  ON community_watchlist_follows(follower_user_id, created_at_utc DESC);`;

export const communityWatchlistFollowsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0082_community_watchlist_follows",
  executionOrder: 82,
  statements: Object.freeze([sql]),
});
