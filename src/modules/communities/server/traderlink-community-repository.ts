import type Database from "better-sqlite3";

import {
  TRADERLINK_COMMUNITY_CAPABILITIES,
  TRADERLINK_COMMUNITY_MEMBER_BASELINE_CAPABILITIES,
  isTraderLinkCommunityCapability,
  type TraderLinkCommunity,
  type TraderLinkCommunityAccess,
  type TraderLinkCommunityCapability,
  type TraderLinkCommunityMembership,
  type TraderLinkCommunityMembershipStatus,
  type TraderLinkCommunityRole,
} from "../contracts/traderlink-community-contracts";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "../../platform/server/database/platform-migration-contract";

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;
const COMMUNITY_SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

type CommunityRow = Readonly<{
  community_id: string;
  discord_guild_id: string;
  slug: string;
  display_name: string;
  status: TraderLinkCommunity["status"];
  owner_user_id: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

type MembershipRow = Readonly<{
  community_id: string;
  user_id: string;
  status: TraderLinkCommunityMembershipStatus;
  discord_verified_at_utc: string;
  first_verified_at_utc: string;
  updated_at_utc: string;
}>;

type RoleRow = Readonly<{
  role_id: string;
  community_id: string;
  name: string;
  status: TraderLinkCommunityRole["status"];
  created_by_user_id: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

type DiscordMembershipEvidenceRow = Readonly<{
  last_verified_at_utc: string;
  guild_owner: 0 | 1;
}>;

function normalizeText(value: string, field: string, maximumLength: number): string {
  const normalized = value.normalize("NFKC").trim();
  if (
    normalized.length < 1 ||
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return normalized;
}

function assertDiscordSnowflake(value: string, field: string): void {
  if (!DISCORD_SNOWFLAKE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

function normalizeCommunitySlug(value: string): string {
  const normalized = value.normalize("NFKC").trim().toLowerCase();
  if (
    normalized.length < 3 ||
    normalized.length > 80 ||
    !COMMUNITY_SLUG_PATTERN.test(normalized)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "slug",
    });
  }
  return normalized;
}

function canonicalCapabilities(
  capabilities: readonly TraderLinkCommunityCapability[],
): readonly TraderLinkCommunityCapability[] {
  if (!Array.isArray(capabilities)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "capabilities",
    });
  }
  for (const capability of capabilities) {
    if (!isTraderLinkCommunityCapability(capability)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "capability",
      });
    }
  }
  return Object.freeze(
    [...new Set(capabilities)].sort((left, right) => left.localeCompare(right)),
  );
}

function mapCommunity(row: CommunityRow): TraderLinkCommunity {
  return Object.freeze({
    communityId: row.community_id,
    discordGuildId: row.discord_guild_id,
    slug: row.slug,
    displayName: row.display_name,
    status: row.status,
    ownerUserId: row.owner_user_id,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapMembership(row: MembershipRow): TraderLinkCommunityMembership {
  return Object.freeze({
    communityId: row.community_id,
    userId: row.user_id,
    status: row.status,
    discordVerifiedAtUtc: row.discord_verified_at_utc,
    firstVerifiedAtUtc: row.first_verified_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapRole(row: RoleRow): TraderLinkCommunityRole {
  return Object.freeze({
    roleId: row.role_id,
    communityId: row.community_id,
    name: row.name,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class TraderLinkCommunityRepository {
  constructor(private readonly database: Database.Database) {}

  private runWrite<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  private requireDiscordEvidence(
    userId: string,
    guildId: string,
  ): DiscordMembershipEvidenceRow {
    const evidence = this.database.prepare<
      [string, string],
      DiscordMembershipEvidenceRow
    >(`SELECT membership.last_verified_at_utc, membership.guild_owner
FROM platform_discord_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
WHERE membership.user_id = ?
  AND membership.guild_id = ?
  AND user.status = 'active'`).get(userId, guildId);
    if (!evidence) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return evidence;
  }

  private insertAudit(input: Readonly<{
    communityId: string;
    actorUserId: string;
    targetUserId?: string | null;
    eventType: string;
    objectType: string;
    objectRef: string;
    detail?: Readonly<Record<string, string | number | boolean | null>>;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO traderlink_community_authorization_audit_events (
  audit_event_id, community_id, actor_user_id, target_user_id, event_type,
  object_type, object_ref, detail_json, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(),
      input.communityId,
      input.actorUserId,
      input.targetUserId ?? null,
      input.eventType,
      input.objectType,
      input.objectRef,
      JSON.stringify(input.detail ?? {}),
      input.timestamp,
    );
  }

  createFromVerifiedDiscordOwner(input: Readonly<{
    ownerUserId: string;
    discordGuildId: string;
    slug: string;
    displayName: string;
    timestamp: string;
  }>): TraderLinkCommunity {
    assertCanonicalUuidV4(input.ownerUserId, "ownerUserId");
    assertDiscordSnowflake(input.discordGuildId, "discordGuildId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const slug = normalizeCommunitySlug(input.slug);
    const displayName = normalizeText(input.displayName, "displayName", 120);
    const evidence = this.requireDiscordEvidence(
      input.ownerUserId,
      input.discordGuildId,
    );
    if (evidence.guild_owner !== 1) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    if (evidence.last_verified_at_utc > input.timestamp) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "timestamp",
      });
    }

    const communityId = createCanonicalUuidV4();
    return this.runWrite(() => {
      this.database.prepare(`INSERT INTO traderlink_communities (
  community_id, discord_guild_id, slug, display_name, status, owner_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'setup', ?, ?, ?)`).run(
        communityId,
        input.discordGuildId,
        slug,
        displayName,
        input.ownerUserId,
        input.timestamp,
        input.timestamp,
      );
      this.database.prepare(`INSERT INTO traderlink_community_memberships (
  community_id, user_id, status, discord_verified_at_utc,
  first_verified_at_utc, updated_at_utc
) VALUES (?, ?, 'active', ?, ?, ?)`).run(
        communityId,
        input.ownerUserId,
        evidence.last_verified_at_utc,
        evidence.last_verified_at_utc,
        input.timestamp,
      );
      this.database.prepare(`INSERT INTO traderlink_community_owner_events (
  owner_event_id, community_id, previous_owner_user_id, owner_user_id,
  actor_user_id, event_type, created_at_utc
) VALUES (?, ?, NULL, ?, ?, 'established', ?)`).run(
        createCanonicalUuidV4(),
        communityId,
        input.ownerUserId,
        input.ownerUserId,
        input.timestamp,
      );
      this.insertAudit({
        communityId,
        actorUserId: input.ownerUserId,
        targetUserId: input.ownerUserId,
        eventType: "community.created",
        objectType: "community",
        objectRef: communityId,
        detail: { discordGuildId: input.discordGuildId },
        timestamp: input.timestamp,
      });
      const community = this.findById(communityId);
      if (!community) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      return community;
    });
  }

  findById(communityId: string): TraderLinkCommunity | null {
    assertCanonicalUuidV4(communityId, "communityId");
    const row = this.database.prepare<[string], CommunityRow>(`SELECT
  community_id, discord_guild_id, slug, display_name, status, owner_user_id,
  created_at_utc, updated_at_utc
FROM traderlink_communities
WHERE community_id = ?`).get(communityId);
    return row ? mapCommunity(row) : null;
  }

  listForUser(userId: string): readonly TraderLinkCommunity[] {
    assertCanonicalUuidV4(userId, "userId");
    return Object.freeze(
      this.database.prepare<[string], CommunityRow>(`SELECT
  community.community_id, community.discord_guild_id, community.slug,
  community.display_name, community.status, community.owner_user_id,
  community.created_at_utc, community.updated_at_utc
FROM traderlink_communities community
JOIN traderlink_community_memberships membership
  ON membership.community_id = community.community_id
WHERE membership.user_id = ? AND membership.status = 'active'
ORDER BY community.display_name COLLATE NOCASE, community.community_id`)
        .all(userId)
        .map(mapCommunity),
    );
  }

  setStatus(input: Readonly<{
    communityId: string;
    actorUserId: string;
    status: Extract<TraderLinkCommunity["status"], "active" | "paused">;
    timestamp: string;
  }>): TraderLinkCommunity {
    this.requireCapability(input.communityId, input.actorUserId, "community.manage");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    return this.runWrite(() => {
      const result = this.database.prepare(`UPDATE traderlink_communities
SET status = ?, updated_at_utc = ?
WHERE community_id = ? AND status IN ('setup', 'active', 'paused')`)
        .run(input.status, input.timestamp, input.communityId);
      if (result.changes !== 1) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        eventType: "community.status_changed",
        objectType: "community",
        objectRef: input.communityId,
        detail: { status: input.status },
        timestamp: input.timestamp,
      });
      return this.findById(input.communityId) as TraderLinkCommunity;
    });
  }

  syncActiveMemberFromDiscord(input: Readonly<{
    communityId: string;
    userId: string;
    timestamp: string;
  }>): TraderLinkCommunityMembership {
    assertCanonicalUuidV4(input.communityId, "communityId");
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const community = this.findById(input.communityId);
    if (!community) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    const evidence = this.requireDiscordEvidence(
      input.userId,
      community.discordGuildId,
    );
    if (evidence.last_verified_at_utc > input.timestamp) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "timestamp",
      });
    }

    return this.runWrite(() => {
      this.database.prepare(`INSERT INTO traderlink_community_memberships (
  community_id, user_id, status, discord_verified_at_utc,
  first_verified_at_utc, updated_at_utc
) VALUES (?, ?, 'active', ?, ?, ?)
ON CONFLICT(community_id, user_id) DO UPDATE SET
  status = 'active',
  discord_verified_at_utc = excluded.discord_verified_at_utc,
  updated_at_utc = excluded.updated_at_utc`).run(
        input.communityId,
        input.userId,
        evidence.last_verified_at_utc,
        evidence.last_verified_at_utc,
        input.timestamp,
      );
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.userId,
        targetUserId: input.userId,
        eventType: "membership.verified",
        objectType: "membership",
        objectRef: input.userId,
        timestamp: input.timestamp,
      });
      const membership = this.findMembership(input.communityId, input.userId);
      if (!membership) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      return membership;
    });
  }

  findMembership(
    communityId: string,
    userId: string,
  ): TraderLinkCommunityMembership | null {
    assertCanonicalUuidV4(communityId, "communityId");
    assertCanonicalUuidV4(userId, "userId");
    const row = this.database.prepare<[string, string], MembershipRow>(`SELECT
  community_id, user_id, status, discord_verified_at_utc,
  first_verified_at_utc, updated_at_utc
FROM traderlink_community_memberships
WHERE community_id = ? AND user_id = ?`).get(communityId, userId);
    return row ? mapMembership(row) : null;
  }

  createRole(input: Readonly<{
    communityId: string;
    actorUserId: string;
    name: string;
    capabilities: readonly TraderLinkCommunityCapability[];
    timestamp: string;
  }>): TraderLinkCommunityRole {
    this.requireCapability(input.communityId, input.actorUserId, "community.roles.manage");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const name = normalizeText(input.name, "name", 80);
    const capabilities = canonicalCapabilities(input.capabilities);
    const roleId = createCanonicalUuidV4();
    return this.runWrite(() => {
      this.database.prepare(`INSERT INTO traderlink_community_roles (
  role_id, community_id, name, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'active', ?, ?, ?)`).run(
        roleId,
        input.communityId,
        name,
        input.actorUserId,
        input.timestamp,
        input.timestamp,
      );
      const insertCapability = this.database.prepare(`INSERT INTO traderlink_community_role_capabilities (
  community_id, role_id, capability_key, granted_by_user_id, granted_at_utc
) VALUES (?, ?, ?, ?, ?)`);
      for (const capability of capabilities) {
        insertCapability.run(
          input.communityId,
          roleId,
          capability,
          input.actorUserId,
          input.timestamp,
        );
      }
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        eventType: "role.created",
        objectType: "role",
        objectRef: roleId,
        detail: { name, capabilityCount: capabilities.length },
        timestamp: input.timestamp,
      });
      return mapRole(
        this.database.prepare<[string, string], RoleRow>(`SELECT *
FROM traderlink_community_roles
WHERE community_id = ? AND role_id = ?`).get(input.communityId, roleId) as RoleRow,
      );
    });
  }

  replaceRoleCapabilities(input: Readonly<{
    communityId: string;
    actorUserId: string;
    roleId: string;
    capabilities: readonly TraderLinkCommunityCapability[];
    timestamp: string;
  }>): void {
    this.requireCapability(input.communityId, input.actorUserId, "community.roles.manage");
    assertCanonicalUuidV4(input.roleId, "roleId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const capabilities = canonicalCapabilities(input.capabilities);
    this.runWrite(() => {
      const role = this.database.prepare<[string, string], RoleRow>(`SELECT *
FROM traderlink_community_roles
WHERE community_id = ? AND role_id = ? AND status = 'active'`)
        .get(input.communityId, input.roleId);
      if (!role) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      this.database.prepare(`DELETE FROM traderlink_community_role_capabilities
WHERE community_id = ? AND role_id = ?`).run(input.communityId, input.roleId);
      const insertCapability = this.database.prepare(`INSERT INTO traderlink_community_role_capabilities (
  community_id, role_id, capability_key, granted_by_user_id, granted_at_utc
) VALUES (?, ?, ?, ?, ?)`);
      for (const capability of capabilities) {
        insertCapability.run(
          input.communityId,
          input.roleId,
          capability,
          input.actorUserId,
          input.timestamp,
        );
      }
      this.database.prepare(`UPDATE traderlink_community_roles
SET updated_at_utc = ? WHERE community_id = ? AND role_id = ?`).run(
        input.timestamp,
        input.communityId,
        input.roleId,
      );
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        eventType: "role.capabilities_replaced",
        objectType: "role",
        objectRef: input.roleId,
        detail: { capabilityCount: capabilities.length },
        timestamp: input.timestamp,
      });
    });
  }

  assignRole(input: Readonly<{
    communityId: string;
    actorUserId: string;
    userId: string;
    roleId: string;
    timestamp: string;
  }>): void {
    this.requireCapability(input.communityId, input.actorUserId, "community.roles.manage");
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUuidV4(input.roleId, "roleId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    this.runWrite(() => {
      const eligible = this.database.prepare<
        [string, string, string],
        { present: number }
      >(`SELECT 1 AS present
FROM traderlink_community_roles role
JOIN traderlink_community_memberships membership
  ON membership.community_id = role.community_id
WHERE role.community_id = ? AND role.role_id = ? AND role.status = 'active'
  AND membership.user_id = ? AND membership.status = 'active'`)
        .get(input.communityId, input.roleId, input.userId);
      if (!eligible) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      const active = this.database.prepare<[string, string, string], { assignment_id: string }>(`SELECT assignment_id
FROM traderlink_community_member_role_assignments
WHERE community_id = ? AND role_id = ? AND user_id = ? AND status = 'active'`)
        .get(input.communityId, input.roleId, input.userId);
      if (!active) {
        this.database.prepare(`INSERT INTO traderlink_community_member_role_assignments (
  assignment_id, community_id, role_id, user_id, status,
  assigned_by_user_id, assigned_at_utc, revoked_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?, NULL)`).run(
          createCanonicalUuidV4(),
          input.communityId,
          input.roleId,
          input.userId,
          input.actorUserId,
          input.timestamp,
        );
      }
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        targetUserId: input.userId,
        eventType: "role.assigned",
        objectType: "role",
        objectRef: input.roleId,
        timestamp: input.timestamp,
      });
    });
  }

  mapDiscordRole(input: Readonly<{
    communityId: string;
    actorUserId: string;
    discordRoleId: string;
    roleId: string;
    timestamp: string;
  }>): void {
    this.requireCapability(input.communityId, input.actorUserId, "community.roles.manage");
    assertDiscordSnowflake(input.discordRoleId, "discordRoleId");
    assertCanonicalUuidV4(input.roleId, "roleId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    this.runWrite(() => {
      const activeRole = this.database.prepare<[string, string], { present: number }>(`SELECT 1 AS present
FROM traderlink_community_roles
WHERE community_id = ? AND role_id = ? AND status = 'active'`)
        .get(input.communityId, input.roleId);
      if (!activeRole) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      this.database.prepare(`INSERT INTO traderlink_community_discord_role_mappings (
  mapping_id, community_id, discord_role_id, role_id, status,
  mapped_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
ON CONFLICT(community_id, discord_role_id, role_id) DO UPDATE SET
  status = 'active', mapped_by_user_id = excluded.mapped_by_user_id,
  updated_at_utc = excluded.updated_at_utc`).run(
        createCanonicalUuidV4(),
        input.communityId,
        input.discordRoleId,
        input.roleId,
        input.actorUserId,
        input.timestamp,
        input.timestamp,
      );
      this.insertAudit({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        eventType: "discord_role.mapped",
        objectType: "discord_role",
        objectRef: input.discordRoleId,
        detail: { roleId: input.roleId },
        timestamp: input.timestamp,
      });
    });
  }

  resolveAccess(
    communityId: string,
    userId: string,
  ): TraderLinkCommunityAccess {
    assertCanonicalUuidV4(communityId, "communityId");
    assertCanonicalUuidV4(userId, "userId");
    const community = this.findById(communityId);
    const membership = this.findMembership(communityId, userId);
    if (!community || !membership || membership.status !== "active") {
      return Object.freeze({
        communityId,
        userId,
        isOwner: false,
        membershipStatus: membership?.status ?? null,
        capabilities: Object.freeze([]),
      });
    }

    const activeUser = this.database.prepare<[string], { present: number }>(
      "SELECT 1 AS present FROM platform_users WHERE user_id = ? AND status = 'active'",
    ).get(userId);
    const currentDiscordMembership = this.database.prepare<
      [string, string, string],
      { guild_owner: 0 | 1 }
    >(`SELECT guild_owner
FROM platform_discord_memberships
WHERE user_id = ? AND guild_id = ? AND last_verified_at_utc >= ?`)
      .get(userId, community.discordGuildId, membership.discordVerifiedAtUtc);
    if (!activeUser || !currentDiscordMembership || community.status === "suspended") {
      return Object.freeze({
        communityId,
        userId,
        isOwner: community.ownerUserId === userId,
        membershipStatus: membership.status,
        capabilities: Object.freeze([]),
      });
    }

    if (community.ownerUserId === userId && currentDiscordMembership.guild_owner === 1) {
      return Object.freeze({
        communityId,
        userId,
        isOwner: true,
        membershipStatus: membership.status,
        capabilities: TRADERLINK_COMMUNITY_CAPABILITIES,
      });
    }

    if (community.status !== "active") {
      return Object.freeze({
        communityId,
        userId,
        isOwner: false,
        membershipStatus: membership.status,
        capabilities: Object.freeze([]),
      });
    }

    const rows = this.database.prepare<
      [string, string, string, string, string],
      { capability_key: string }
    >(`SELECT DISTINCT grant_row.capability_key
FROM traderlink_community_role_capabilities grant_row
JOIN traderlink_community_roles role
  ON role.role_id = grant_row.role_id
 AND role.community_id = grant_row.community_id
WHERE grant_row.community_id = ?
  AND role.status = 'active'
  AND grant_row.role_id IN (
    SELECT assignment.role_id
    FROM traderlink_community_member_role_assignments assignment
    WHERE assignment.community_id = ?
      AND assignment.user_id = ?
      AND assignment.status = 'active'
    UNION
    SELECT mapping.role_id
    FROM traderlink_community_discord_role_mappings mapping
    JOIN traderlink_communities mapped_community
      ON mapped_community.community_id = mapping.community_id
    JOIN platform_discord_memberships discord
      ON discord.guild_id = mapped_community.discord_guild_id
     AND discord.user_id = ?
    JOIN json_each(discord.role_ids_json) current_role
      ON current_role.value = mapping.discord_role_id
    WHERE mapping.community_id = ? AND mapping.status = 'active'
  )
ORDER BY grant_row.capability_key`).all(
      communityId,
      communityId,
      userId,
      userId,
      communityId,
    );
    const capabilities = canonicalCapabilities([
      ...TRADERLINK_COMMUNITY_MEMBER_BASELINE_CAPABILITIES,
      ...rows.map((row) => row.capability_key).filter(isTraderLinkCommunityCapability),
    ]);
    return Object.freeze({
      communityId,
      userId,
      isOwner: false,
      membershipStatus: membership.status,
      capabilities,
    });
  }

  requireCapability(
    communityId: string,
    userId: string,
    capability: TraderLinkCommunityCapability,
  ): TraderLinkCommunityAccess {
    const access = this.resolveAccess(communityId, userId);
    if (!access.capabilities.includes(capability)) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    return access;
  }
}
