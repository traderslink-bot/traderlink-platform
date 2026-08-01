import type { PlatformMigration } from "../platform-migration-contract";

export const platformIdentityMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0001_platform_identity",
  executionOrder: 1,
  statements: Object.freeze([
    `CREATE TABLE platform_users (
  user_id TEXT PRIMARY KEY CHECK (
    length(user_id) = 36 AND user_id = lower(user_id)
    AND length(replace(user_id, '-', '')) = 32
    AND replace(user_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(user_id, 9, 1) = '-' AND substr(user_id, 14, 1) = '-'
    AND substr(user_id, 19, 1) = '-' AND substr(user_id, 24, 1) = '-'
    AND substr(user_id, 15, 1) = '4' AND substr(user_id, 20, 1) GLOB '[89ab]'
  ),
  auth_provider TEXT NOT NULL CHECK (
    length(auth_provider) BETWEEN 1 AND 64 AND auth_provider = lower(auth_provider)
    AND auth_provider NOT GLOB '*[^a-z0-9_-]*'
  ),
  auth_subject TEXT NOT NULL CHECK (length(auth_subject) BETWEEN 1 AND 255),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at_utc TEXT NOT NULL CHECK (
    length(created_at_utc) = 24
    AND created_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  updated_at_utc TEXT NOT NULL CHECK (
    length(updated_at_utc) = 24
    AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (auth_provider, auth_subject)
) STRICT`,
    `CREATE TABLE platform_workspaces (
  workspace_id TEXT PRIMARY KEY CHECK (
    length(workspace_id) = 36 AND workspace_id = lower(workspace_id)
    AND length(replace(workspace_id, '-', '')) = 32
    AND replace(workspace_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(workspace_id, 9, 1) = '-' AND substr(workspace_id, 14, 1) = '-'
    AND substr(workspace_id, 19, 1) = '-' AND substr(workspace_id, 24, 1) = '-'
    AND substr(workspace_id, 15, 1) = '4' AND substr(workspace_id, 20, 1) GLOB '[89ab]'
  ),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  default_trading_timezone TEXT NOT NULL CHECK (length(trim(default_trading_timezone)) BETWEEN 1 AND 64),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  created_at_utc TEXT NOT NULL CHECK (
    length(created_at_utc) = 24
    AND created_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  updated_at_utc TEXT NOT NULL CHECK (
    length(updated_at_utc) = 24
    AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  CHECK (updated_at_utc >= created_at_utc)
) STRICT`,
    `CREATE TABLE platform_workspace_memberships (
  workspace_id TEXT NOT NULL CHECK (
    length(workspace_id) = 36 AND workspace_id = lower(workspace_id)
    AND length(replace(workspace_id, '-', '')) = 32
    AND replace(workspace_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(workspace_id, 9, 1) = '-' AND substr(workspace_id, 14, 1) = '-'
    AND substr(workspace_id, 19, 1) = '-' AND substr(workspace_id, 24, 1) = '-'
    AND substr(workspace_id, 15, 1) = '4' AND substr(workspace_id, 20, 1) GLOB '[89ab]'
  ),
  user_id TEXT NOT NULL CHECK (
    length(user_id) = 36 AND user_id = lower(user_id)
    AND length(replace(user_id, '-', '')) = 32
    AND replace(user_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(user_id, 9, 1) = '-' AND substr(user_id, 14, 1) = '-'
    AND substr(user_id, 19, 1) = '-' AND substr(user_id, 24, 1) = '-'
    AND substr(user_id, 15, 1) = '4' AND substr(user_id, 20, 1) GLOB '[89ab]'
  ),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended')),
  created_by_user_id TEXT NOT NULL CHECK (
    length(created_by_user_id) = 36 AND created_by_user_id = lower(created_by_user_id)
    AND length(replace(created_by_user_id, '-', '')) = 32
    AND replace(created_by_user_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(created_by_user_id, 9, 1) = '-' AND substr(created_by_user_id, 14, 1) = '-'
    AND substr(created_by_user_id, 19, 1) = '-' AND substr(created_by_user_id, 24, 1) = '-'
    AND substr(created_by_user_id, 15, 1) = '4' AND substr(created_by_user_id, 20, 1) GLOB '[89ab]'
  ),
  created_at_utc TEXT NOT NULL CHECK (
    length(created_at_utc) = 24
    AND created_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  updated_at_utc TEXT NOT NULL CHECK (
    length(updated_at_utc) = 24
    AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  CHECK (updated_at_utc >= created_at_utc),
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID`,
    `CREATE UNIQUE INDEX platform_workspace_single_active_owner
  ON platform_workspace_memberships(workspace_id)
  WHERE role = 'owner' AND status = 'active'`,
    `CREATE INDEX platform_memberships_active_user
  ON platform_workspace_memberships(user_id, workspace_id)
  WHERE status = 'active'`,
  ]),
});
