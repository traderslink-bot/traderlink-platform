import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

export const journalAccountBoundaryMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0002_journal_account_boundary",
  executionOrder: 2,
  statements: Object.freeze([
    `CREATE TABLE journal_accounts (
  account_id TEXT PRIMARY KEY CHECK (
    length(account_id) = 36 AND account_id = lower(account_id)
    AND length(replace(account_id, '-', '')) = 32
    AND replace(account_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(account_id, 9, 1) = '-' AND substr(account_id, 14, 1) = '-'
    AND substr(account_id, 19, 1) = '-' AND substr(account_id, 24, 1) = '-'
    AND substr(account_id, 15, 1) = '4' AND substr(account_id, 20, 1) GLOB '[89ab]'
  ),
  workspace_id TEXT NOT NULL CHECK (
    length(workspace_id) = 36 AND workspace_id = lower(workspace_id)
    AND length(replace(workspace_id, '-', '')) = 32
    AND replace(workspace_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(workspace_id, 9, 1) = '-' AND substr(workspace_id, 14, 1) = '-'
    AND substr(workspace_id, 19, 1) = '-' AND substr(workspace_id, 24, 1) = '-'
    AND substr(workspace_id, 15, 1) = '4' AND substr(workspace_id, 20, 1) GLOB '[89ab]'
  ),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  base_currency TEXT NOT NULL CHECK (
    length(base_currency) = 3 AND base_currency = upper(base_currency)
    AND base_currency NOT GLOB '*[^A-Z]*'
  ),
  trading_timezone TEXT NOT NULL CHECK (length(trim(trading_timezone)) BETWEEN 1 AND 64),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
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
  UNIQUE (workspace_id, account_id),
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT`,
    `CREATE INDEX journal_accounts_active_workspace
  ON journal_accounts(workspace_id, account_id)
  WHERE status = 'active'`,
    `CREATE TABLE journal_account_source_identities (
  source_identity_id TEXT PRIMARY KEY CHECK (
    length(source_identity_id) = 36 AND source_identity_id = lower(source_identity_id)
    AND length(replace(source_identity_id, '-', '')) = 32
    AND replace(source_identity_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(source_identity_id, 9, 1) = '-' AND substr(source_identity_id, 14, 1) = '-'
    AND substr(source_identity_id, 19, 1) = '-' AND substr(source_identity_id, 24, 1) = '-'
    AND substr(source_identity_id, 15, 1) = '4' AND substr(source_identity_id, 20, 1) GLOB '[89ab]'
  ),
  workspace_id TEXT NOT NULL CHECK (
    length(workspace_id) = 36 AND workspace_id = lower(workspace_id)
    AND length(replace(workspace_id, '-', '')) = 32
    AND replace(workspace_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(workspace_id, 9, 1) = '-' AND substr(workspace_id, 14, 1) = '-'
    AND substr(workspace_id, 19, 1) = '-' AND substr(workspace_id, 24, 1) = '-'
    AND substr(workspace_id, 15, 1) = '4' AND substr(workspace_id, 20, 1) GLOB '[89ab]'
  ),
  account_id TEXT NOT NULL CHECK (
    length(account_id) = 36 AND account_id = lower(account_id)
    AND length(replace(account_id, '-', '')) = 32
    AND replace(account_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(account_id, 9, 1) = '-' AND substr(account_id, 14, 1) = '-'
    AND substr(account_id, 19, 1) = '-' AND substr(account_id, 24, 1) = '-'
    AND substr(account_id, 15, 1) = '4' AND substr(account_id, 20, 1) GLOB '[89ab]'
  ),
  source_system TEXT NOT NULL CHECK (
    length(source_system) BETWEEN 1 AND 64 AND source_system = lower(source_system)
    AND source_system NOT GLOB '*[^a-z0-9_-]*'
  ),
  fingerprint_scheme_version TEXT NOT NULL CHECK (fingerprint_scheme_version = 'hmac-sha256-v1'),
  source_account_canonicalization_version TEXT NOT NULL CHECK (
    length(source_account_canonicalization_version) BETWEEN 1 AND 64
    AND source_account_canonicalization_version = lower(source_account_canonicalization_version)
    AND source_account_canonicalization_version NOT GLOB '*[^a-z0-9_-]*'
  ),
  hmac_key_version TEXT NOT NULL CHECK (
    length(hmac_key_version) BETWEEN 1 AND 64 AND hmac_key_version = lower(hmac_key_version)
    AND hmac_key_version NOT GLOB '*[^a-z0-9_-]*'
  ),
  source_account_fingerprint TEXT NOT NULL CHECK (
    length(source_account_fingerprint) = 64
    AND source_account_fingerprint = lower(source_account_fingerprint)
    AND source_account_fingerprint NOT GLOB '*[^0-9a-f]*'
  ),
  privacy_safe_display TEXT NOT NULL CHECK (length(trim(privacy_safe_display)) BETWEEN 1 AND 120),
  status TEXT NOT NULL CHECK (status IN ('active_current', 'retained_previous', 'superseded')),
  first_seen_at_utc TEXT NOT NULL CHECK (
    length(first_seen_at_utc) = 24
    AND first_seen_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  last_seen_at_utc TEXT NOT NULL CHECK (
    length(last_seen_at_utc) = 24
    AND last_seen_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (
    workspace_id, source_system, fingerprint_scheme_version,
    source_account_canonicalization_version, hmac_key_version, source_account_fingerprint
  )
) STRICT`,
    `CREATE INDEX journal_account_source_identities_account
  ON journal_account_source_identities(workspace_id, account_id, source_system)`,
  ]),
});
