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
    ${column} IS NULL OR (
      length(${column}) = 24
      AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    )
  )`;
}

function requiredUtcCheck(column: string): string {
  return utcCheck(column).replace(`${column} IS NULL OR (`, "(");
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function prefixedSha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 71 AND substr(${column}, 1, 7) = 'sha256:'
    AND substr(${column}, 8) = lower(substr(${column}, 8))
    AND substr(${column}, 8) NOT GLOB '*[^0-9a-f]*'
  )`;
}

function providerCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function symbolCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64
    AND ${column} = upper(trim(${column}))
    AND ${column} NOT GLOB '*[^A-Z0-9.-]*'
  )`;
}

const sql = `CREATE TABLE journal_round_trip_level_analysis_links (
  level_analysis_link_id TEXT PRIMARY KEY ${uuidCheck("level_analysis_link_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state = 'active'),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id),
  UNIQUE (workspace_id, account_id, level_analysis_link_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_id)
    REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, level_analysis_link_id, current_version_id)
    REFERENCES journal_round_trip_level_analysis_link_versions(
      workspace_id, account_id, level_analysis_link_id, level_analysis_link_version_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_round_trip_level_analysis_link_versions (
  level_analysis_link_version_id TEXT PRIMARY KEY ${uuidCheck("level_analysis_link_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  level_analysis_link_id TEXT NOT NULL ${uuidCheck("level_analysis_link_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  delivery_id TEXT NOT NULL,
  normalized_symbol TEXT NOT NULL ${symbolCheck("normalized_symbol")},
  provider TEXT NOT NULL ${providerCheck("provider")},
  raw_payload_sha256 TEXT NOT NULL ${prefixedSha256Check("raw_payload_sha256")},
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('single_snapshot_v1', 'packaged_review_delivery')
  ),
  delivery_generated_at_utc TEXT ${utcCheck("delivery_generated_at_utc")},
  symbol_summary_as_of_timestamp INTEGER NOT NULL CHECK (symbol_summary_as_of_timestamp > 0),
  symbol_summary_as_of_utc TEXT ${utcCheck("symbol_summary_as_of_utc")},
  link_source TEXT NOT NULL CHECK (
    link_source IN ('manual_review', 'resolver', 'import_batch_hint')
  ),
  match_policy_json TEXT NOT NULL CHECK (
    json_valid(match_policy_json) AND json_type(match_policy_json) = 'object'
  ),
  match_policy_sha256 TEXT NOT NULL ${sha256Check("match_policy_sha256")},
  match_result_json TEXT NOT NULL CHECK (
    json_valid(match_result_json) AND json_type(match_result_json) = 'object'
  ),
  match_result_sha256 TEXT NOT NULL ${sha256Check("match_result_sha256")},
  linked_symbol_summary_json TEXT NOT NULL CHECK (
    json_valid(linked_symbol_summary_json)
    AND json_type(linked_symbol_summary_json) = 'object'
  ),
  linked_symbol_summary_sha256 TEXT NOT NULL ${sha256Check("linked_symbol_summary_sha256")},
  limitations_json TEXT NOT NULL CHECK (
    json_valid(limitations_json) AND json_type(limitations_json) = 'array'
  ),
  limitations_sha256 TEXT NOT NULL ${sha256Check("limitations_sha256")},
  safety_flags_json TEXT NOT NULL CHECK (json_valid(safety_flags_json)),
  safety_flags_sha256 TEXT NOT NULL ${sha256Check("safety_flags_sha256")},
  record_json TEXT NOT NULL CHECK (
    json_valid(record_json) AND json_type(record_json) = 'object'
  ),
  record_sha256 TEXT NOT NULL ${sha256Check("record_sha256")},
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, level_analysis_link_id, version_number),
  UNIQUE (
    workspace_id, account_id, level_analysis_link_id, level_analysis_link_version_id
  ),
  FOREIGN KEY (workspace_id, account_id, level_analysis_link_id)
    REFERENCES journal_round_trip_level_analysis_links(
      workspace_id, account_id, level_analysis_link_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(
      workspace_id, account_id, round_trip_id, round_trip_version_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (delivery_id, normalized_symbol)
    REFERENCES level_analysis_delivery_symbol_facts(delivery_id, normalized_symbol)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_level_analysis_links_round_trip
  ON journal_round_trip_level_analysis_links(
    workspace_id, account_id, round_trip_id, updated_at_utc DESC
  );

CREATE INDEX journal_level_analysis_link_versions_delivery
  ON journal_round_trip_level_analysis_link_versions(delivery_id, normalized_symbol);

CREATE TRIGGER journal_level_analysis_links_valid_update
BEFORE UPDATE ON journal_round_trip_level_analysis_links
WHEN NEW.level_analysis_link_id IS NOT OLD.level_analysis_link_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.round_trip_id IS NOT OLD.round_trip_id
  OR NEW.lifecycle_state IS NOT OLD.lifecycle_state
  OR NEW.created_by_user_id IS NOT OLD.created_by_user_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.revision <> OLD.revision + 1
  OR NEW.updated_at_utc < OLD.updated_at_utc
BEGIN
  SELECT RAISE(ABORT, 'journal_level_analysis_link_invalid_update');
END;

CREATE TRIGGER journal_level_analysis_links_no_delete
BEFORE DELETE ON journal_round_trip_level_analysis_links BEGIN
  SELECT RAISE(ABORT, 'journal_level_analysis_link_immutable');
END;
CREATE TRIGGER journal_level_analysis_link_versions_no_update
BEFORE UPDATE ON journal_round_trip_level_analysis_link_versions BEGIN
  SELECT RAISE(ABORT, 'journal_level_analysis_link_version_immutable');
END;
CREATE TRIGGER journal_level_analysis_link_versions_no_delete
BEFORE DELETE ON journal_round_trip_level_analysis_link_versions BEGIN
  SELECT RAISE(ABORT, 'journal_level_analysis_link_version_immutable');
END`;

export const journalLevelAnalysisLinksMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0011_journal_level_analysis_links",
  executionOrder: 11,
  statements: Object.freeze([sql]),
});
