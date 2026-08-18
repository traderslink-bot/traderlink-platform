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
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function noControlCharactersCheck(column: string): string {
  const codes = [...Array.from({ length: 32 }, (_, index) => index), 127];
  return `CHECK (${codes.map((code) => `instr(${column}, char(${code})) = 0`).join(" AND ")})`;
}

const sql = `CREATE TABLE journal_trade_explorer_comparison_studies (
  study_id TEXT PRIMARY KEY ${uuidCheck("study_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'retired')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, study_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, study_id, current_version_id) REFERENCES journal_trade_explorer_comparison_study_versions(workspace_id, account_id, study_id, study_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_trade_explorer_comparison_studies_account_state
  ON journal_trade_explorer_comparison_studies(workspace_id, account_id, lifecycle_state, updated_at_utc DESC, study_id);

CREATE TABLE journal_trade_explorer_comparison_study_versions (
  study_version_id TEXT PRIMARY KEY ${uuidCheck("study_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  study_id TEXT NOT NULL ${uuidCheck("study_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('created', 'updated', 'retired')),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80) ${noControlCharactersCheck("name")},
  study_version TEXT NOT NULL CHECK (study_version = 'trade_explorer_comparison_study_v1'),
  normalized_study_json TEXT NOT NULL CHECK (
    length(normalized_study_json) BETWEEN 2 AND 131072
    AND json_valid(normalized_study_json)
    AND json_type(normalized_study_json) = 'object'
  ),
  study_sha256 TEXT NOT NULL ${sha256Check("study_sha256")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'retired')),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (event_kind IN ('created', 'updated') AND lifecycle_state = 'active')
    OR (event_kind = 'retired' AND lifecycle_state = 'retired')
  ),
  UNIQUE (workspace_id, account_id, study_id, version_number),
  UNIQUE (workspace_id, account_id, study_id, study_version_id),
  FOREIGN KEY (workspace_id, account_id, study_id) REFERENCES journal_trade_explorer_comparison_studies(workspace_id, account_id, study_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_trade_explorer_comparison_studies_max_active_insert
BEFORE INSERT ON journal_trade_explorer_comparison_studies
WHEN NEW.lifecycle_state = 'active'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*) FROM journal_trade_explorer_comparison_studies
    WHERE workspace_id = NEW.workspace_id AND account_id = NEW.account_id
      AND lifecycle_state = 'active'
  ) >= 50 THEN RAISE(ABORT, 'journal_trade_explorer_comparison_study_limit') END;
END;

CREATE TRIGGER journal_trade_explorer_comparison_studies_no_reactivation
BEFORE UPDATE OF lifecycle_state ON journal_trade_explorer_comparison_studies
WHEN OLD.lifecycle_state = 'retired' AND NEW.lifecycle_state = 'active'
BEGIN
  SELECT RAISE(ABORT, 'journal_trade_explorer_comparison_study_retired');
END;

CREATE TRIGGER journal_trade_explorer_comparison_studies_no_delete
BEFORE DELETE ON journal_trade_explorer_comparison_studies
BEGIN
  SELECT RAISE(ABORT, 'journal_trade_explorer_comparison_study_immutable');
END;

CREATE TRIGGER journal_trade_explorer_comparison_study_versions_no_update
BEFORE UPDATE ON journal_trade_explorer_comparison_study_versions
BEGIN
  SELECT RAISE(ABORT, 'journal_trade_explorer_comparison_study_version_immutable');
END;

CREATE TRIGGER journal_trade_explorer_comparison_study_versions_no_delete
BEFORE DELETE ON journal_trade_explorer_comparison_study_versions
BEGIN
  SELECT RAISE(ABORT, 'journal_trade_explorer_comparison_study_version_immutable');
END`;

export const tradeExplorerComparisonStudiesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0060_trade_explorer_comparison_studies",
  executionOrder: 60,
  statements: Object.freeze([sql]),
});
