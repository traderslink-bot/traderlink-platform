import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function sha256Check(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

const sql = `CREATE TABLE journal_demo_pack_applications (
  demo_pack_application_id TEXT PRIMARY KEY ${uuidCheck("demo_pack_application_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  demo_pack_version_id TEXT NOT NULL ${uuidCheck("demo_pack_version_id")},
  application_kind TEXT NOT NULL CHECK (application_kind IN ('initial', 'upgrade')),
  manifest_sha256 TEXT NOT NULL ${sha256Check("manifest_sha256")},
  market_data_manifest_sha256 TEXT NOT NULL ${sha256Check("market_data_manifest_sha256")},
  applied_at_utc TEXT NOT NULL ${utcCheck("applied_at_utc")},
  UNIQUE (workspace_id, account_id, demo_pack_version_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_demo_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (demo_pack_version_id) REFERENCES journal_demo_pack_versions(demo_pack_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_demo_pack_applications_immutable_update
BEFORE UPDATE ON journal_demo_pack_applications
BEGIN SELECT RAISE(ABORT, 'journal demo pack applications are immutable'); END;

CREATE TABLE journal_demo_pack_application_execution_provenance (
  demo_pack_application_execution_provenance_id TEXT PRIMARY KEY ${uuidCheck("demo_pack_application_execution_provenance_id")},
  demo_pack_application_id TEXT NOT NULL ${uuidCheck("demo_pack_application_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  execution_version_id TEXT NOT NULL ${uuidCheck("execution_version_id")},
  analysis_policy TEXT NOT NULL CHECK (analysis_policy IN ('analyzer_backed', 'journal_only')),
  pack_execution_key TEXT NOT NULL CHECK (length(pack_execution_key) BETWEEN 1 AND 128 AND pack_execution_key = lower(pack_execution_key) AND pack_execution_key NOT GLOB '*[^a-z0-9_-]*'),
  execution_fact_sha256 TEXT NOT NULL ${sha256Check("execution_fact_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (demo_pack_application_id, pack_execution_key),
  UNIQUE (workspace_id, account_id, execution_id),
  UNIQUE (workspace_id, account_id, execution_version_id),
  FOREIGN KEY (demo_pack_application_id) REFERENCES journal_demo_pack_applications(demo_pack_application_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, account_id, execution_id, execution_version_id)
    REFERENCES journal_execution_versions(workspace_id, account_id, execution_id, execution_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_demo_pack_application_execution_provenance_immutable_update
BEFORE UPDATE ON journal_demo_pack_application_execution_provenance
BEGIN SELECT RAISE(ABORT, 'journal demo pack application provenance is immutable'); END;`;

export const journalDemoPackApplicationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0096_journal_demo_pack_applications",
  executionOrder: 96,
  statements: Object.freeze([sql]),
});
