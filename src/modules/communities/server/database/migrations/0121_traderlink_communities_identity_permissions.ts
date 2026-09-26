import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

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

function snowflakeCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 32
    AND ${column} NOT GLOB '*[^0-9]*'
  )`;
}

const sql = `CREATE TABLE traderlink_communities (
  community_id TEXT PRIMARY KEY ${uuidCheck("community_id")},
  discord_guild_id TEXT NOT NULL UNIQUE ${snowflakeCheck("discord_guild_id")},
  slug TEXT NOT NULL UNIQUE CHECK (
    length(slug) BETWEEN 3 AND 80
    AND slug = lower(slug)
    AND slug GLOB '[a-z][a-z0-9-]*'
    AND slug NOT LIKE '%--%'
    AND substr(slug, -1) <> '-'
  ),
  display_name TEXT NOT NULL CHECK (
    length(trim(display_name)) BETWEEN 1 AND 120
    AND display_name NOT GLOB '*[' || char(0) || '-' || char(31) || char(127) || ']*'
  ),
  status TEXT NOT NULL CHECK (status IN ('setup', 'active', 'paused', 'suspended')),
  owner_user_id TEXT NOT NULL ${uuidCheck("owner_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (community_id, discord_guild_id),
  FOREIGN KEY (owner_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER traderlink_communities_verified_owner_insert
BEFORE INSERT ON traderlink_communities
WHEN NOT EXISTS (
  SELECT 1
  FROM platform_users user
  JOIN platform_discord_memberships membership
    ON membership.user_id = user.user_id
  WHERE user.user_id = NEW.owner_user_id
    AND user.status = 'active'
    AND membership.guild_id = NEW.discord_guild_id
    AND membership.guild_owner = 1
)
BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_owner_not_verified');
END;

CREATE TRIGGER traderlink_communities_verified_owner_update
BEFORE UPDATE OF owner_user_id ON traderlink_communities
WHEN NOT EXISTS (
  SELECT 1
  FROM platform_users user
  JOIN platform_discord_memberships membership
    ON membership.user_id = user.user_id
  WHERE user.user_id = NEW.owner_user_id
    AND user.status = 'active'
    AND membership.guild_id = NEW.discord_guild_id
    AND membership.guild_owner = 1
)
BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_owner_not_verified');
END;

CREATE TABLE traderlink_community_memberships (
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
  discord_verified_at_utc TEXT NOT NULL ${requiredUtcCheck("discord_verified_at_utc")},
  first_verified_at_utc TEXT NOT NULL ${requiredUtcCheck("first_verified_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  CHECK (discord_verified_at_utc >= first_verified_at_utc),
  CHECK (updated_at_utc >= first_verified_at_utc),
  PRIMARY KEY (community_id, user_id),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX traderlink_community_memberships_active_user
  ON traderlink_community_memberships(user_id, community_id)
  WHERE status = 'active';

CREATE TRIGGER traderlink_community_memberships_verify_active_insert
BEFORE INSERT ON traderlink_community_memberships
WHEN NEW.status = 'active' AND NOT EXISTS (
  SELECT 1
  FROM traderlink_communities community
  JOIN platform_discord_memberships discord
    ON discord.guild_id = community.discord_guild_id
   AND discord.user_id = NEW.user_id
  JOIN platform_users user ON user.user_id = NEW.user_id
  WHERE community.community_id = NEW.community_id
    AND user.status = 'active'
    AND discord.last_verified_at_utc >= NEW.discord_verified_at_utc
)
BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_membership_not_verified');
END;

CREATE TRIGGER traderlink_community_memberships_verify_active_update
BEFORE UPDATE ON traderlink_community_memberships
WHEN NEW.community_id IS NOT OLD.community_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.first_verified_at_utc IS NOT OLD.first_verified_at_utc
  OR NEW.discord_verified_at_utc < OLD.discord_verified_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR (NEW.status = 'active' AND NOT EXISTS (
    SELECT 1
    FROM traderlink_communities community
    JOIN platform_discord_memberships discord
      ON discord.guild_id = community.discord_guild_id
     AND discord.user_id = NEW.user_id
    JOIN platform_users user ON user.user_id = NEW.user_id
    WHERE community.community_id = NEW.community_id
      AND user.status = 'active'
      AND discord.last_verified_at_utc >= NEW.discord_verified_at_utc
  ))
BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_membership_invalid');
END;

CREATE TABLE traderlink_community_capability_catalog (
  capability_key TEXT PRIMARY KEY CHECK (
    length(capability_key) BETWEEN 3 AND 80
    AND capability_key = lower(capability_key)
    AND capability_key NOT GLOB '*[^a-z0-9._]*'
  ),
  catalog_version INTEGER NOT NULL CHECK (catalog_version = 1),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 240)
) STRICT, WITHOUT ROWID;

INSERT INTO traderlink_community_capability_catalog (
  capability_key, catalog_version, description
) VALUES
  ('community.view', 1, 'Open the active Discord community and allowed content.'),
  ('community.manage', 1, 'Manage community identity and ordinary settings.'),
  ('community.team.manage', 1, 'Manage community staff assignments.'),
  ('community.roles.manage', 1, 'Manage community roles and capability grants.'),
  ('community.members.view', 1, 'View the community member directory.'),
  ('community.member_activity.view', 1, 'View named community activity.'),
  ('community.analytics.view', 1, 'View aggregate community analytics.'),
  ('community.discord.manage', 1, 'Manage Discord mappings and destinations.'),
  ('community.alerts.create', 1, 'Create and publish the author''s alerts.'),
  ('community.alerts.manage_all', 1, 'Manage every alert in the community.'),
  ('community.watchlists.share_own', 1, 'Share the member''s own Community Watchlists.'),
  ('community.watchlists.publish_staff', 1, 'Publish staff watchlists for the community.'),
  ('community.watchlists.manage_all', 1, 'Manage all community watchlist placements.'),
  ('community.coaching.offer', 1, 'Publish the coach''s offers.'),
  ('community.coaching.students', 1, 'Open the coach''s approved relationships.'),
  ('community.coaching.manage_all', 1, 'Manage community coach eligibility and access roles.'),
  ('community.referrals.view', 1, 'View Tier 2 referral and earnings reporting.');

CREATE TABLE traderlink_community_roles (
  role_id TEXT PRIMARY KEY ${uuidCheck("role_id")},
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  name TEXT NOT NULL CHECK (
    length(trim(name)) BETWEEN 1 AND 80
    AND name NOT GLOB '*[' || char(0) || '-' || char(31) || char(127) || ']*'
  ),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (role_id, community_id),
  UNIQUE (community_id, name COLLATE NOCASE),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_role_capabilities (
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  role_id TEXT NOT NULL ${uuidCheck("role_id")},
  capability_key TEXT NOT NULL,
  granted_by_user_id TEXT NOT NULL ${uuidCheck("granted_by_user_id")},
  granted_at_utc TEXT NOT NULL ${requiredUtcCheck("granted_at_utc")},
  PRIMARY KEY (role_id, capability_key),
  FOREIGN KEY (role_id, community_id)
    REFERENCES traderlink_community_roles(role_id, community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (capability_key)
    REFERENCES traderlink_community_capability_catalog(capability_key)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (granted_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_member_role_assignments (
  assignment_id TEXT PRIMARY KEY ${uuidCheck("assignment_id")},
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  role_id TEXT NOT NULL ${uuidCheck("role_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  assigned_by_user_id TEXT NOT NULL ${uuidCheck("assigned_by_user_id")},
  assigned_at_utc TEXT NOT NULL ${requiredUtcCheck("assigned_at_utc")},
  revoked_at_utc TEXT ${optionalUtcCheck("revoked_at_utc")},
  CHECK (
    (status = 'active' AND revoked_at_utc IS NULL)
    OR (status = 'revoked' AND revoked_at_utc IS NOT NULL AND revoked_at_utc >= assigned_at_utc)
  ),
  FOREIGN KEY (role_id, community_id)
    REFERENCES traderlink_community_roles(role_id, community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (community_id, user_id)
    REFERENCES traderlink_community_memberships(community_id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX traderlink_community_member_roles_one_active
  ON traderlink_community_member_role_assignments(community_id, role_id, user_id)
  WHERE status = 'active';

CREATE TABLE traderlink_community_discord_role_mappings (
  mapping_id TEXT PRIMARY KEY ${uuidCheck("mapping_id")},
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  discord_role_id TEXT NOT NULL ${snowflakeCheck("discord_role_id")},
  role_id TEXT NOT NULL ${uuidCheck("role_id")},
  status TEXT NOT NULL CHECK (status IN ('active', 'paused')),
  mapped_by_user_id TEXT NOT NULL ${uuidCheck("mapped_by_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (community_id, discord_role_id, role_id),
  FOREIGN KEY (role_id, community_id)
    REFERENCES traderlink_community_roles(role_id, community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (mapped_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX traderlink_community_discord_role_mappings_active
  ON traderlink_community_discord_role_mappings(community_id, discord_role_id)
  WHERE status = 'active';

CREATE TABLE traderlink_community_owner_events (
  owner_event_id TEXT PRIMARY KEY ${uuidCheck("owner_event_id")},
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  previous_owner_user_id TEXT ${uuidCheck("previous_owner_user_id")},
  owner_user_id TEXT NOT NULL ${uuidCheck("owner_user_id")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  event_type TEXT NOT NULL CHECK (event_type IN ('established', 'transferred', 'reverified')),
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (previous_owner_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (owner_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_authorization_audit_events (
  audit_event_id TEXT PRIMARY KEY ${uuidCheck("audit_event_id")},
  community_id TEXT NOT NULL ${uuidCheck("community_id")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  target_user_id TEXT ${uuidCheck("target_user_id")},
  event_type TEXT NOT NULL CHECK (
    length(event_type) BETWEEN 3 AND 80
    AND event_type = lower(event_type)
    AND event_type NOT GLOB '*[^a-z0-9._]*'
  ),
  object_type TEXT NOT NULL CHECK (
    length(object_type) BETWEEN 3 AND 40
    AND object_type = lower(object_type)
    AND object_type NOT GLOB '*[^a-z0-9_]*'
  ),
  object_ref TEXT NOT NULL CHECK (length(object_ref) BETWEEN 1 AND 120),
  detail_json TEXT NOT NULL CHECK (json_valid(detail_json) AND json_type(detail_json) = 'object'),
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (target_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX traderlink_community_authorization_audit_recent
  ON traderlink_community_authorization_audit_events(community_id, created_at_utc DESC);

CREATE TRIGGER traderlink_community_owner_events_no_update
BEFORE UPDATE ON traderlink_community_owner_events BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_owner_event_immutable');
END;
CREATE TRIGGER traderlink_community_owner_events_no_delete
BEFORE DELETE ON traderlink_community_owner_events BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_owner_event_immutable');
END;
CREATE TRIGGER traderlink_community_authorization_audit_no_update
BEFORE UPDATE ON traderlink_community_authorization_audit_events BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_authorization_audit_immutable');
END;
CREATE TRIGGER traderlink_community_authorization_audit_no_delete
BEFORE DELETE ON traderlink_community_authorization_audit_events BEGIN
  SELECT RAISE(ABORT, 'traderlink_community_authorization_audit_immutable');
END;`;

export const traderLinkCommunitiesIdentityPermissionsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "community",
    migrationId: "0121_traderlink_communities_identity_permissions",
    executionOrder: 121,
    statements: Object.freeze([sql]),
  });
