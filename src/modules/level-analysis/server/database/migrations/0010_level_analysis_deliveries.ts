import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

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
    ${column} IS NULL OR (
      length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
      AND ${column} NOT GLOB '*[^a-z0-9_-]*'
    )
  )`;
}

function symbolCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64
    AND ${column} = upper(trim(${column}))
    AND ${column} NOT GLOB '*[^A-Z0-9.-]*'
  )`;
}

const sql = `CREATE TABLE level_analysis_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (
    length(delivery_id) = 20
    AND (substr(delivery_id, 1, 4) = 'lad_' OR substr(delivery_id, 1, 4) = 'laq_')
    AND substr(delivery_id, 5) = lower(substr(delivery_id, 5))
    AND substr(delivery_id, 5) NOT GLOB '*[^0-9a-f]*'
  ),
  contract_version TEXT NOT NULL CHECK (
    contract_version = 'journal_level_analysis_delivery_persistence_contract_v1'
  ),
  raw_payload_sha256 TEXT NOT NULL UNIQUE ${prefixedSha256Check("raw_payload_sha256")},
  source_system TEXT NOT NULL CHECK (source_system = 'levels-system'),
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('single_snapshot_v1', 'packaged_review_delivery')
  ),
  source_schema_version TEXT NOT NULL CHECK (
    length(trim(source_schema_version)) BETWEEN 1 AND 128
  ),
  source_artifact_path TEXT CHECK (
    source_artifact_path IS NULL OR length(trim(source_artifact_path)) BETWEEN 1 AND 512
  ),
  source_artifact_commit TEXT CHECK (
    source_artifact_commit IS NULL OR length(trim(source_artifact_commit)) BETWEEN 1 AND 128
  ),
  source_commit TEXT CHECK (
    source_commit IS NULL OR length(trim(source_commit)) BETWEEN 1 AND 128
  ),
  provider TEXT ${providerCheck("provider")},
  generated_at_utc TEXT ${utcCheck("generated_at_utc")},
  received_at_utc TEXT NOT NULL ${requiredUtcCheck("received_at_utc")},
  reviewed_symbol_count INTEGER NOT NULL CHECK (reviewed_symbol_count >= 0),
  reviewed_symbols_json TEXT NOT NULL CHECK (
    json_valid(reviewed_symbols_json) AND json_type(reviewed_symbols_json) = 'array'
    AND json_array_length(reviewed_symbols_json) = reviewed_symbol_count
  ),
  reviewed_symbols_sha256 TEXT NOT NULL ${sha256Check("reviewed_symbols_sha256")},
  baseline_mismatch_count INTEGER CHECK (
    baseline_mismatch_count IS NULL OR baseline_mismatch_count >= 0
  ),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('accepted', 'quarantined')),
  prohibited_language_status TEXT NOT NULL CHECK (
    prohibited_language_status IN ('clear', 'hits_present', 'unknown')
  ),
  raw_payload_json TEXT NOT NULL CHECK (json_valid(raw_payload_json)),
  raw_payload_json_sha256 TEXT NOT NULL ${sha256Check("raw_payload_json_sha256")},
  compact_summary_json TEXT CHECK (
    compact_summary_json IS NULL
    OR (json_valid(compact_summary_json) AND json_type(compact_summary_json) = 'object')
  ),
  compact_summary_sha256 TEXT ${sha256Check("compact_summary_sha256")},
  safety_flags_json TEXT NOT NULL CHECK (json_valid(safety_flags_json)),
  safety_flags_sha256 TEXT NOT NULL ${sha256Check("safety_flags_sha256")},
  limitations_json TEXT NOT NULL CHECK (
    json_valid(limitations_json) AND json_type(limitations_json) = 'array'
  ),
  limitations_sha256 TEXT NOT NULL ${sha256Check("limitations_sha256")},
  quarantine_reasons_json TEXT NOT NULL CHECK (
    json_valid(quarantine_reasons_json) AND json_type(quarantine_reasons_json) = 'array'
  ),
  quarantine_reasons_sha256 TEXT NOT NULL ${sha256Check("quarantine_reasons_sha256")},
  audit_trail_json TEXT NOT NULL CHECK (
    json_valid(audit_trail_json) AND json_type(audit_trail_json) = 'array'
  ),
  audit_trail_sha256 TEXT NOT NULL ${sha256Check("audit_trail_sha256")},
  record_json TEXT NOT NULL CHECK (
    json_valid(record_json) AND json_type(record_json) = 'object'
  ),
  record_sha256 TEXT NOT NULL ${sha256Check("record_sha256")},
  CHECK (
    (validation_status = 'accepted' AND compact_summary_json IS NOT NULL
      AND compact_summary_sha256 IS NOT NULL AND json_array_length(quarantine_reasons_json) = 0)
    OR
    (validation_status = 'quarantined' AND compact_summary_json IS NULL
      AND compact_summary_sha256 IS NULL
      AND json_array_length(quarantine_reasons_json) > 0)
  )
) STRICT;

CREATE INDEX level_analysis_deliveries_latest_accepted
  ON level_analysis_deliveries(provider, received_at_utc DESC, delivery_id)
  WHERE validation_status = 'accepted';

CREATE TABLE level_analysis_delivery_symbol_facts (
  delivery_id TEXT NOT NULL,
  normalized_symbol TEXT NOT NULL ${symbolCheck("normalized_symbol")},
  provider TEXT ${providerCheck("provider")},
  as_of_timestamp INTEGER NOT NULL CHECK (as_of_timestamp > 0),
  as_of_utc TEXT ${utcCheck("as_of_utc")},
  fifteen_minute_context_only_status TEXT NOT NULL CHECK (
    fifteen_minute_context_only_status IN (
      'context_only', 'not_supplied', 'not_declared_by_single_snapshot_v1'
    )
  ),
  summary_json TEXT NOT NULL CHECK (
    json_valid(summary_json) AND json_type(summary_json) = 'object'
  ),
  summary_sha256 TEXT NOT NULL ${sha256Check("summary_sha256")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  PRIMARY KEY (delivery_id, normalized_symbol),
  FOREIGN KEY (delivery_id) REFERENCES level_analysis_deliveries(delivery_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX level_analysis_symbol_facts_latest
  ON level_analysis_delivery_symbol_facts(
    normalized_symbol, provider, as_of_timestamp DESC, delivery_id
  );

CREATE TRIGGER level_analysis_symbol_facts_accepted_delivery
BEFORE INSERT ON level_analysis_delivery_symbol_facts
WHEN NOT EXISTS (
  SELECT 1 FROM level_analysis_deliveries delivery
  WHERE delivery.delivery_id = NEW.delivery_id
    AND delivery.validation_status = 'accepted'
)
BEGIN
  SELECT RAISE(ABORT, 'level_analysis_symbol_fact_requires_accepted_delivery');
END;

CREATE TRIGGER level_analysis_deliveries_no_update
BEFORE UPDATE ON level_analysis_deliveries BEGIN
  SELECT RAISE(ABORT, 'level_analysis_delivery_immutable');
END;
CREATE TRIGGER level_analysis_deliveries_no_delete
BEFORE DELETE ON level_analysis_deliveries BEGIN
  SELECT RAISE(ABORT, 'level_analysis_delivery_immutable');
END;
CREATE TRIGGER level_analysis_delivery_symbol_facts_no_update
BEFORE UPDATE ON level_analysis_delivery_symbol_facts BEGIN
  SELECT RAISE(ABORT, 'level_analysis_symbol_fact_immutable');
END;
CREATE TRIGGER level_analysis_delivery_symbol_facts_no_delete
BEFORE DELETE ON level_analysis_delivery_symbol_facts BEGIN
  SELECT RAISE(ABORT, 'level_analysis_symbol_fact_immutable');
END`;

export const levelAnalysisDeliveriesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0010_level_analysis_deliveries",
  executionOrder: 10,
  statements: Object.freeze([sql]),
});
