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

const sql = `ALTER TABLE community_profiles
  ADD COLUMN description TEXT NOT NULL DEFAULT ''
    CHECK (length(description) <= 180 AND instr(description, char(0)) = 0);

ALTER TABLE community_profiles
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'visible'
    CHECK (visibility IN ('visible', 'hidden'));

CREATE TABLE community_profile_follows (
  profile_follow_id TEXT PRIMARY KEY ${uuidCheck("profile_follow_id")},
  followed_user_id TEXT NOT NULL ${uuidCheck("followed_user_id")},
  follower_user_id TEXT NOT NULL ${uuidCheck("follower_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (followed_user_id, follower_user_id),
  CHECK (followed_user_id <> follower_user_id),
  FOREIGN KEY (followed_user_id) REFERENCES community_profiles(user_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (follower_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX community_profile_follows_by_followed
  ON community_profile_follows(followed_user_id, created_at_utc DESC);
CREATE INDEX community_profile_follows_by_follower
  ON community_profile_follows(follower_user_id, created_at_utc DESC);`;

export const communityProfilesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0086_community_profiles",
  executionOrder: 86,
  statements: Object.freeze([sql]),
});
