import type { PlatformMigration } from "../platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function requiredUtcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function optionalUtcCheck(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ))`;
}

const sql = `CREATE TABLE platform_discord_memberships (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  guild_id TEXT NOT NULL CHECK (
    length(guild_id) BETWEEN 1 AND 32
    AND guild_id NOT GLOB '*[^0-9]*'
  ),
  username TEXT NOT NULL CHECK (
    length(trim(username)) BETWEEN 1 AND 80
    AND username NOT GLOB '*[' || char(0) || '-' || char(31) || char(127) || ']*'
  ),
  global_display_name TEXT CHECK (
    global_display_name IS NULL OR (
      length(trim(global_display_name)) BETWEEN 1 AND 120
      AND global_display_name NOT GLOB '*[' || char(0) || '-' || char(31) || char(127) || ']*'
    )
  ),
  avatar_hash TEXT CHECK (
    avatar_hash IS NULL OR (
      length(avatar_hash) BETWEEN 1 AND 255
      AND avatar_hash NOT GLOB '*[^A-Za-z0-9_]*'
    )
  ),
  role_ids_json TEXT NOT NULL CHECK (
    json_valid(role_ids_json) AND json_type(role_ids_json) = 'array'
  ),
  guild_owner INTEGER NOT NULL CHECK (guild_owner IN (0, 1)),
  joined_at_utc TEXT ${optionalUtcCheck("joined_at_utc")},
  first_verified_at_utc TEXT NOT NULL ${requiredUtcCheck("first_verified_at_utc")},
  last_verified_at_utc TEXT NOT NULL ${requiredUtcCheck("last_verified_at_utc")},
  CHECK (last_verified_at_utc >= first_verified_at_utc),
  PRIMARY KEY (user_id, guild_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_discord_memberships_recent_user
  ON platform_discord_memberships(user_id, last_verified_at_utc DESC, guild_id);

CREATE TRIGGER platform_discord_memberships_validate_insert
BEFORE INSERT ON platform_discord_memberships
WHEN NOT EXISTS (
  SELECT 1 FROM platform_auth_identities identity
  WHERE identity.user_id = NEW.user_id
    AND identity.auth_provider = 'discord'
    AND identity.status = 'active'
) OR EXISTS (
  SELECT 1 FROM json_each(NEW.role_ids_json)
  WHERE type <> 'text'
    OR length(value) NOT BETWEEN 1 AND 32
    OR value GLOB '*[^0-9]*'
) OR EXISTS (
  SELECT 1
  FROM json_each(NEW.role_ids_json) current
  JOIN json_each(NEW.role_ids_json) previous
    ON previous.key = current.key - 1
  WHERE length(previous.value) > length(current.value)
    OR (
      length(previous.value) = length(current.value)
      AND previous.value >= current.value
    )
)
BEGIN
  SELECT RAISE(ABORT, 'platform_discord_membership_invalid');
END;

CREATE TRIGGER platform_discord_memberships_validate_update
BEFORE UPDATE ON platform_discord_memberships
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.guild_id IS NOT OLD.guild_id
  OR NEW.first_verified_at_utc IS NOT OLD.first_verified_at_utc
  OR NEW.last_verified_at_utc < OLD.last_verified_at_utc
  OR NOT EXISTS (
    SELECT 1 FROM platform_auth_identities identity
    WHERE identity.user_id = NEW.user_id
      AND identity.auth_provider = 'discord'
      AND identity.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM json_each(NEW.role_ids_json)
    WHERE type <> 'text'
      OR length(value) NOT BETWEEN 1 AND 32
      OR value GLOB '*[^0-9]*'
  )
  OR EXISTS (
    SELECT 1
    FROM json_each(NEW.role_ids_json) current
    JOIN json_each(NEW.role_ids_json) previous
      ON previous.key = current.key - 1
    WHERE length(previous.value) > length(current.value)
      OR (
        length(previous.value) = length(current.value)
        AND previous.value >= current.value
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'platform_discord_membership_invalid');
END;

CREATE TRIGGER platform_discord_memberships_no_delete
BEFORE DELETE ON platform_discord_memberships BEGIN
  SELECT RAISE(ABORT, 'platform_discord_membership_immutable');
END`;

export const platformDiscordMembershipsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0017_platform_discord_memberships",
    executionOrder: 17,
    statements: Object.freeze([sql]),
  });
