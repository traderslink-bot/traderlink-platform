import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE journal_account_source_identities_replacement (
  source_identity_id TEXT PRIMARY KEY CHECK (length(source_identity_id) = 36 AND source_identity_id = lower(source_identity_id)),
  workspace_id TEXT NOT NULL CHECK (length(workspace_id) = 36 AND workspace_id = lower(workspace_id)),
  account_id TEXT NOT NULL CHECK (length(account_id) = 36 AND account_id = lower(account_id)),
  source_system TEXT NOT NULL CHECK (length(source_system) BETWEEN 1 AND 64 AND source_system = lower(source_system) AND source_system NOT GLOB '*[^a-z0-9_-]*'),
  fingerprint_scheme_version TEXT NOT NULL CHECK (fingerprint_scheme_version = 'hmac-sha256-v1'),
  source_account_canonicalization_version TEXT NOT NULL CHECK (length(source_account_canonicalization_version) BETWEEN 1 AND 64 AND source_account_canonicalization_version = lower(source_account_canonicalization_version) AND source_account_canonicalization_version NOT GLOB '*[^a-z0-9_-]*'),
  hmac_key_version TEXT NOT NULL CHECK (length(hmac_key_version) BETWEEN 1 AND 64 AND hmac_key_version = lower(hmac_key_version) AND hmac_key_version NOT GLOB '*[^a-z0-9_-]*'),
  source_account_fingerprint TEXT NOT NULL CHECK (length(source_account_fingerprint) = 64 AND source_account_fingerprint = lower(source_account_fingerprint) AND source_account_fingerprint NOT GLOB '*[^0-9a-f]*'),
  privacy_safe_display TEXT NOT NULL CHECK (length(trim(privacy_safe_display)) BETWEEN 1 AND 120),
  status TEXT NOT NULL CHECK (status IN ('active_current', 'retained_previous', 'superseded')),
  first_seen_at_utc TEXT NOT NULL CHECK (length(first_seen_at_utc) = 24),
  last_seen_at_utc TEXT NOT NULL CHECK (length(last_seen_at_utc) = 24),
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (workspace_id, account_id, source_identity_id),
  UNIQUE (workspace_id, account_id, source_system, fingerprint_scheme_version, source_account_canonicalization_version, hmac_key_version, source_account_fingerprint)
) STRICT;

INSERT INTO journal_account_source_identities_replacement SELECT * FROM journal_account_source_identities;
DROP TABLE journal_account_source_identities;
ALTER TABLE journal_account_source_identities_replacement RENAME TO journal_account_source_identities;
CREATE INDEX journal_account_source_identities_account ON journal_account_source_identities(workspace_id, account_id, source_system);
DROP INDEX journal_import_batches_file_identity;
CREATE UNIQUE INDEX journal_import_batches_file_identity ON journal_import_batches(workspace_id, account_id, source_system, source_file_sha256) WHERE source_kind = 'broker_statement';`;

export const journalMultiTrackerStatementImportsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0074_journal_multi_tracker_statement_imports",
  executionOrder: 74,
  requiresForeignKeysDisabled: true,
  statements: Object.freeze(
    sql.split(/(?<=;)\n/gu).filter((statement) => statement.length > 0),
  ),
});
