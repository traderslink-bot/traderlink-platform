import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;
const DISCORD_AVATAR_HASH_PATTERN = /^[A-Za-z0-9_]{1,255}$/u;

export type PlatformDiscordMembership = Readonly<{
  userId: string;
  guildId: string;
  username: string;
  globalDisplayName: string | null;
  avatarHash: string | null;
  roleIds: readonly string[];
  guildOwner: boolean;
  joinedAtUtc: string | null;
  firstVerifiedAtUtc: string;
  lastVerifiedAtUtc: string;
}>;

type MembershipRow = Readonly<{
  user_id: string;
  guild_id: string;
  username: string;
  global_display_name: string | null;
  avatar_hash: string | null;
  role_ids_json: string;
  guild_owner: 0 | 1;
  joined_at_utc: string | null;
  first_verified_at_utc: string;
  last_verified_at_utc: string;
}>;

function assertSnowflake(value: string, field: string): void {
  if (!DISCORD_SNOWFLAKE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", { field });
  }
}

function normalizeText(
  value: string,
  field: string,
  maximumLength: number,
): string {
  const normalized = value.normalize("NFKC").trim();
  if (
    normalized.length < 1 ||
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", { field });
  }
  return normalized;
}

function normalizeOptionalText(
  value: string | null,
  field: string,
  maximumLength: number,
): string | null {
  return value === null ? null : normalizeText(value, field, maximumLength);
}

function canonicalRoleIds(values: readonly string[]): readonly string[] {
  if (values.length > 250) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
      field: "roleIds",
    });
  }
  const unique = new Set<string>();
  for (const value of values) {
    assertSnowflake(value, "roleId");
    unique.add(value);
  }
  return Object.freeze([...unique].sort((left, right) => {
    if (left.length !== right.length) return left.length - right.length;
    return left.localeCompare(right, "en");
  }));
}

function mapMembership(row: MembershipRow): PlatformDiscordMembership {
  const roleIds = JSON.parse(row.role_ids_json) as unknown;
  if (!Array.isArray(roleIds) || roleIds.some((roleId) => typeof roleId !== "string")) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
      field: "roleIds",
    });
  }
  return Object.freeze({
    userId: row.user_id,
    guildId: row.guild_id,
    username: row.username,
    globalDisplayName: row.global_display_name,
    avatarHash: row.avatar_hash,
    roleIds: Object.freeze([...roleIds]),
    guildOwner: row.guild_owner === 1,
    joinedAtUtc: row.joined_at_utc,
    firstVerifiedAtUtc: row.first_verified_at_utc,
    lastVerifiedAtUtc: row.last_verified_at_utc,
  });
}

export class PlatformDiscordMembershipRepository {
  constructor(private readonly database: Database.Database) {}

  upsertCurrent(input: Readonly<{
    userId: string;
    guildId: string;
    username: string;
    globalDisplayName: string | null;
    avatarHash: string | null;
    roleIds: readonly string[];
    guildOwner: boolean;
    joinedAtUtc: string | null;
    verifiedAtUtc: string;
  }>): PlatformDiscordMembership {
    assertCanonicalUuidV4(input.userId, "userId");
    assertSnowflake(input.guildId, "guildId");
    const username = normalizeText(input.username, "username", 80);
    const globalDisplayName = normalizeOptionalText(
      input.globalDisplayName,
      "globalDisplayName",
      120,
    );
    if (input.avatarHash !== null && !DISCORD_AVATAR_HASH_PATTERN.test(input.avatarHash)) {
      platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
        field: "avatarHash",
      });
    }
    if (input.joinedAtUtc !== null) {
      assertCanonicalUtcTimestamp(input.joinedAtUtc, "joinedAtUtc");
    }
    assertCanonicalUtcTimestamp(input.verifiedAtUtc, "verifiedAtUtc");
    const roleIdsJson = JSON.stringify(canonicalRoleIds(input.roleIds));
    try {
      this.database.prepare(`INSERT INTO platform_discord_memberships (
  user_id, guild_id, username, global_display_name, avatar_hash,
  role_ids_json, guild_owner, joined_at_utc,
  first_verified_at_utc, last_verified_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, guild_id) DO UPDATE SET
  username = excluded.username,
  global_display_name = excluded.global_display_name,
  avatar_hash = excluded.avatar_hash,
  role_ids_json = excluded.role_ids_json,
  guild_owner = excluded.guild_owner,
  joined_at_utc = excluded.joined_at_utc,
  last_verified_at_utc = excluded.last_verified_at_utc`)
        .run(
          input.userId,
          input.guildId,
          username,
          globalDisplayName,
          input.avatarHash,
          roleIdsJson,
          input.guildOwner ? 1 : 0,
          input.joinedAtUtc,
          input.verifiedAtUtc,
          input.verifiedAtUtc,
        );
    } catch (error) {
      platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {}, error);
    }
    const membership = this.findCurrent(input.userId, input.guildId);
    if (!membership) platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID");
    return membership;
  }

  findCurrent(userId: string, guildId: string): PlatformDiscordMembership | null {
    assertCanonicalUuidV4(userId, "userId");
    assertSnowflake(guildId, "guildId");
    const row = this.database.prepare<[string, string], MembershipRow>(`SELECT
  user_id, guild_id, username, global_display_name, avatar_hash,
  role_ids_json, guild_owner, joined_at_utc,
  first_verified_at_utc, last_verified_at_utc
FROM platform_discord_memberships
WHERE user_id = ? AND guild_id = ?`)
      .get(userId, guildId);
    return row ? mapMembership(row) : null;
  }

  listCurrentForUser(userId: string): readonly PlatformDiscordMembership[] {
    assertCanonicalUuidV4(userId, "userId");
    return Object.freeze(
      this.database.prepare<[string], MembershipRow>(`SELECT
  user_id, guild_id, username, global_display_name, avatar_hash,
  role_ids_json, guild_owner, joined_at_utc,
  first_verified_at_utc, last_verified_at_utc
FROM platform_discord_memberships
WHERE user_id = ?
ORDER BY guild_id`)
        .all(userId)
        .map(mapMembership),
    );
  }
}
