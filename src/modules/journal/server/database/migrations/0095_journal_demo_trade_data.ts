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

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

function tokenCheck(column: string): string {
  return `CHECK (length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^a-z0-9_-]*')`;
}

const sql = `CREATE TABLE journal_demo_pack_versions (
  demo_pack_version_id TEXT PRIMARY KEY ${uuidCheck("demo_pack_version_id")},
  pack_key TEXT NOT NULL ${tokenCheck("pack_key")},
  pack_version INTEGER NOT NULL CHECK (pack_version > 0),
  manifest_sha256 TEXT NOT NULL ${sha256Check("manifest_sha256")},
  market_data_manifest_sha256 TEXT NOT NULL ${sha256Check("market_data_manifest_sha256")},
  materializer_version TEXT NOT NULL ${tokenCheck("materializer_version")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (pack_key, pack_version),
  UNIQUE (manifest_sha256)
) STRICT;

CREATE TRIGGER journal_demo_pack_versions_immutable_update
BEFORE UPDATE ON journal_demo_pack_versions
BEGIN SELECT RAISE(ABORT, 'journal demo pack versions are immutable'); END;

CREATE TRIGGER journal_demo_pack_versions_immutable_delete
BEFORE DELETE ON journal_demo_pack_versions
BEGIN SELECT RAISE(ABORT, 'journal demo pack versions are immutable'); END;

CREATE TABLE journal_demo_accounts (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  demo_pack_version_id TEXT NOT NULL ${uuidCheck("demo_pack_version_id")},
  created_for_user_id TEXT NOT NULL ${uuidCheck("created_for_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  PRIMARY KEY (workspace_id, account_id),
  UNIQUE (workspace_id, created_for_user_id),
  UNIQUE (workspace_id, account_id, demo_pack_version_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (demo_pack_version_id) REFERENCES journal_demo_pack_versions(demo_pack_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_for_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_demo_accounts_owner_match
BEFORE INSERT ON journal_demo_accounts
WHEN NOT EXISTS (
  SELECT 1 FROM journal_accounts account
  WHERE account.workspace_id = NEW.workspace_id AND account.account_id = NEW.account_id
    AND account.created_by_user_id = NEW.created_for_user_id
)
BEGIN SELECT RAISE(ABORT, 'journal demo account owner does not match account owner'); END;

CREATE TABLE journal_demo_invitations (
  demo_invitation_id TEXT PRIMARY KEY ${uuidCheck("demo_invitation_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  intended_user_id TEXT NOT NULL ${uuidCheck("intended_user_id")},
  demo_pack_version_id TEXT NOT NULL ${uuidCheck("demo_pack_version_id")},
  invitation_state TEXT NOT NULL CHECK (invitation_state IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_account_id TEXT ${uuidCheck("accepted_account_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  expires_at_utc TEXT ${utcCheck("expires_at_utc")},
  accepted_at_utc TEXT ${utcCheck("accepted_at_utc")},
  expired_at_utc TEXT ${utcCheck("expired_at_utc")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc")},
  UNIQUE (workspace_id, intended_user_id, demo_pack_version_id),
  CHECK (
    (invitation_state = 'pending' AND accepted_account_id IS NULL AND accepted_at_utc IS NULL AND expired_at_utc IS NULL AND revoked_at_utc IS NULL)
    OR (invitation_state = 'accepted' AND accepted_account_id IS NOT NULL AND accepted_at_utc IS NOT NULL AND expired_at_utc IS NULL AND revoked_at_utc IS NULL)
    OR (invitation_state = 'expired' AND accepted_account_id IS NULL AND accepted_at_utc IS NULL AND expired_at_utc IS NOT NULL AND revoked_at_utc IS NULL)
    OR (invitation_state = 'revoked' AND accepted_account_id IS NULL AND accepted_at_utc IS NULL AND expired_at_utc IS NULL AND revoked_at_utc IS NOT NULL)
  ),
  FOREIGN KEY (intended_user_id, workspace_id) REFERENCES platform_workspace_memberships(user_id, workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (demo_pack_version_id) REFERENCES journal_demo_pack_versions(demo_pack_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, accepted_account_id, demo_pack_version_id)
    REFERENCES journal_demo_accounts(workspace_id, account_id, demo_pack_version_id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TRIGGER journal_demo_invitations_accepted_account_owner_match
BEFORE INSERT ON journal_demo_invitations
WHEN NEW.invitation_state = 'accepted' AND NOT EXISTS (
  SELECT 1 FROM journal_demo_accounts demo
  WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.accepted_account_id
    AND demo.demo_pack_version_id = NEW.demo_pack_version_id AND demo.created_for_user_id = NEW.intended_user_id
)
BEGIN SELECT RAISE(ABORT, 'accepted demo invitation account owner does not match intended user'); END;

CREATE TRIGGER journal_demo_invitations_lifecycle_only
BEFORE UPDATE ON journal_demo_invitations
WHEN NEW.demo_invitation_id <> OLD.demo_invitation_id OR NEW.workspace_id <> OLD.workspace_id
  OR NEW.intended_user_id <> OLD.intended_user_id OR NEW.demo_pack_version_id <> OLD.demo_pack_version_id
  OR NEW.created_at_utc <> OLD.created_at_utc OR NEW.expires_at_utc IS NOT OLD.expires_at_utc
  OR OLD.invitation_state <> 'pending' OR NEW.invitation_state NOT IN ('accepted', 'expired', 'revoked')
BEGIN SELECT RAISE(ABORT, 'journal demo invitation lifecycle is append-only'); END;

CREATE TRIGGER journal_demo_invitations_accepted_account_owner_match_update
BEFORE UPDATE ON journal_demo_invitations
WHEN NEW.invitation_state = 'accepted' AND NOT EXISTS (
  SELECT 1 FROM journal_demo_accounts demo
  WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.accepted_account_id
    AND demo.demo_pack_version_id = NEW.demo_pack_version_id AND demo.created_for_user_id = NEW.intended_user_id
)
BEGIN SELECT RAISE(ABORT, 'accepted demo invitation account owner does not match intended user'); END;

CREATE TABLE journal_demo_execution_provenance (
  demo_execution_provenance_id TEXT PRIMARY KEY ${uuidCheck("demo_execution_provenance_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  demo_pack_version_id TEXT NOT NULL ${uuidCheck("demo_pack_version_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  execution_version_id TEXT NOT NULL ${uuidCheck("execution_version_id")},
  pack_execution_key TEXT NOT NULL ${tokenCheck("pack_execution_key")},
  execution_fact_sha256 TEXT NOT NULL ${sha256Check("execution_fact_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, execution_id),
  UNIQUE (workspace_id, account_id, execution_version_id),
  UNIQUE (workspace_id, account_id, demo_pack_version_id, pack_execution_key),
  FOREIGN KEY (workspace_id, account_id, demo_pack_version_id)
    REFERENCES journal_demo_accounts(workspace_id, account_id, demo_pack_version_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, account_id, execution_id, execution_version_id)
    REFERENCES journal_execution_versions(workspace_id, account_id, execution_id, execution_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_demo_execution_provenance_immutable_update
BEFORE UPDATE ON journal_demo_execution_provenance
BEGIN SELECT RAISE(ABORT, 'journal demo execution provenance is immutable'); END;

CREATE TRIGGER journal_demo_accounts_block_import_batches
BEFORE INSERT ON journal_import_batches
WHEN EXISTS (SELECT 1 FROM journal_demo_accounts demo WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'demo accounts cannot accept manual or broker imports'); END;

CREATE TRIGGER journal_demo_accounts_block_generic_execution_provenance
BEFORE INSERT ON journal_execution_provenance
WHEN EXISTS (SELECT 1 FROM journal_demo_accounts demo WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'demo executions require demo provenance'); END;`;

export const journalDemoTradeDataMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0095_journal_demo_trade_data",
  executionOrder: 95,
  statements: Object.freeze([sql]),
});
