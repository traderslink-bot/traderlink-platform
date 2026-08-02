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

function dateCheck(column: string): string {
  return `CHECK (
    length(${column}) = 10
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function tokenCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function currencyCheck(column: string): string {
  return `CHECK (
    length(${column}) = 3 AND ${column} = upper(${column})
    AND ${column} NOT GLOB '*[^A-Z]*'
  )`;
}

function canonicalSignedDecimalCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*'
    AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.'
    AND ${column} NOT IN ('-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1)
    AND CASE
      WHEN substr(${column}, 1, 1) = '-' THEN length(${column}) > 1
      ELSE 1
    END
    AND CASE
      WHEN instr(${column}, '.') > 0 THEN substr(${column}, -1, 1) <> '0'
      ELSE 1
    END
    AND CASE
      WHEN substr(${column}, 1, 1) = '-' THEN
        substr(${column}, 2, 1) <> '0' OR substr(${column}, 2, 2) = '0.'
      ELSE
        substr(${column}, 1, 1) <> '0' OR ${column} = '0' OR substr(${column}, 1, 2) = '0.'
    END
  )`;
}

const sql = `CREATE UNIQUE INDEX journal_source_identities_scope_identity
  ON journal_account_source_identities(workspace_id, account_id, source_identity_id);

CREATE TABLE journal_instruments (
  instrument_id TEXT PRIMARY KEY ${uuidCheck("instrument_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'option', 'forex', 'future', 'crypto', 'other')),
  normalized_symbol TEXT NOT NULL CHECK (
    length(normalized_symbol) BETWEEN 1 AND 64
    AND normalized_symbol = upper(trim(normalized_symbol))
  ),
  quote_currency TEXT NOT NULL ${currencyCheck("quote_currency")},
  venue TEXT CHECK (venue IS NULL OR length(trim(venue)) BETWEEN 1 AND 64),
  identity_scheme_version TEXT ${tokenCheck("identity_scheme_version")},
  provider_identity_sha256 TEXT ${sha256Check("provider_identity_sha256")},
  status TEXT NOT NULL CHECK (status IN ('active', 'superseded')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (identity_scheme_version IS NULL AND provider_identity_sha256 IS NULL)
    OR (identity_scheme_version IS NOT NULL AND provider_identity_sha256 IS NOT NULL)
  ),
  UNIQUE (workspace_id, instrument_id),
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX journal_instruments_provider_identity
  ON journal_instruments(workspace_id, identity_scheme_version, provider_identity_sha256)
  WHERE provider_identity_sha256 IS NOT NULL;

CREATE INDEX journal_instruments_symbol
  ON journal_instruments(workspace_id, asset_class, normalized_symbol, quote_currency)
  WHERE status = 'active';

CREATE TABLE journal_import_batches (
  import_batch_id TEXT PRIMARY KEY ${uuidCheck("import_batch_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  source_identity_id TEXT ${uuidCheck("source_identity_id")},
  source_kind TEXT NOT NULL CHECK (source_kind IN ('broker_statement', 'manual_batch')),
  source_system TEXT NOT NULL ${tokenCheck("source_system")},
  source_file_sha256 TEXT ${sha256Check("source_file_sha256")},
  source_file_size_bytes INTEGER CHECK (source_file_size_bytes IS NULL OR source_file_size_bytes > 0),
  source_mime_type TEXT CHECK (source_mime_type IS NULL OR length(source_mime_type) BETWEEN 1 AND 120),
  source_encoding TEXT CHECK (source_encoding IS NULL OR length(source_encoding) BETWEEN 1 AND 40),
  source_display_label TEXT NOT NULL CHECK (length(trim(source_display_label)) BETWEEN 1 AND 120),
  evidence_object_key TEXT CHECK (
    evidence_object_key IS NULL OR (
      length(evidence_object_key) BETWEEN 1 AND 255
      AND instr(evidence_object_key, ':') = 0
      AND substr(evidence_object_key, 1, 1) <> '/'
      AND instr(evidence_object_key, char(92)) = 0
      AND instr(evidence_object_key, '..') = 0
    )
  ),
  manual_idempotency_key TEXT CHECK (
    manual_idempotency_key IS NULL OR length(manual_idempotency_key) BETWEEN 16 AND 128
  ),
  adapter_id TEXT NOT NULL ${tokenCheck("adapter_id")},
  adapter_version TEXT NOT NULL ${tokenCheck("adapter_version")},
  parser_version TEXT NOT NULL ${tokenCheck("parser_version")},
  mapping_version TEXT NOT NULL ${tokenCheck("mapping_version")},
  mapping_contract_json TEXT NOT NULL CHECK (
    json_valid(mapping_contract_json) AND json_type(mapping_contract_json) = 'object'
  ),
  statement_period_start_date TEXT ${dateCheck("statement_period_start_date")},
  statement_period_end_date TEXT ${dateCheck("statement_period_end_date")},
  source_timezone TEXT CHECK (source_timezone IS NULL OR length(trim(source_timezone)) BETWEEN 1 AND 64),
  current_state TEXT NOT NULL CHECK (
    current_state IN ('preview', 'blocked', 'accepted', 'accepted_with_decisions', 'superseded')
  ),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  preserved_row_count INTEGER NOT NULL DEFAULT 0 CHECK (preserved_row_count >= 0),
  mapped_execution_count INTEGER NOT NULL DEFAULT 0 CHECK (mapped_execution_count >= 0),
  unsupported_row_count INTEGER NOT NULL DEFAULT 0 CHECK (unsupported_row_count >= 0),
  issue_count INTEGER NOT NULL DEFAULT 0 CHECK (issue_count >= 0),
  pending_decision_count INTEGER NOT NULL DEFAULT 0 CHECK (pending_decision_count >= 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  accepted_at_utc TEXT ${utcCheck("accepted_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (statement_period_start_date IS NULL AND statement_period_end_date IS NULL)
    OR (
      statement_period_start_date IS NOT NULL
      AND statement_period_end_date IS NOT NULL
      AND statement_period_end_date >= statement_period_start_date
    )
  ),
  CHECK (
    (source_kind = 'broker_statement'
      AND source_identity_id IS NOT NULL
      AND source_file_sha256 IS NOT NULL
      AND source_file_size_bytes IS NOT NULL
      AND source_mime_type IS NOT NULL
      AND source_encoding IS NOT NULL
      AND evidence_object_key IS NOT NULL
      AND manual_idempotency_key IS NULL)
    OR
    (source_kind = 'manual_batch'
      AND source_identity_id IS NULL
      AND source_file_sha256 IS NULL
      AND source_file_size_bytes IS NULL
      AND source_mime_type IS NULL
      AND source_encoding IS NULL
      AND evidence_object_key IS NULL
      AND manual_idempotency_key IS NOT NULL)
  ),
  CHECK (
    (current_state IN ('accepted', 'accepted_with_decisions', 'superseded') AND accepted_at_utc IS NOT NULL)
    OR (current_state IN ('preview', 'blocked') AND accepted_at_utc IS NULL)
  ),
  UNIQUE (workspace_id, account_id, import_batch_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, source_identity_id) REFERENCES journal_account_source_identities(workspace_id, account_id, source_identity_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id, current_event_id) REFERENCES journal_import_events(workspace_id, account_id, import_batch_id, import_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_import_batches_file_identity
  ON journal_import_batches(workspace_id, source_system, source_file_sha256)
  WHERE source_kind = 'broker_statement';

CREATE UNIQUE INDEX journal_import_batches_manual_idempotency
  ON journal_import_batches(workspace_id, account_id, manual_idempotency_key)
  WHERE source_kind = 'manual_batch';

CREATE INDEX journal_import_batches_account_state
  ON journal_import_batches(workspace_id, account_id, current_state, created_at_utc);

CREATE TABLE journal_import_events (
  import_event_id TEXT PRIMARY KEY ${uuidCheck("import_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('previewed', 'blocked', 'accepted', 'accepted_with_decisions', 'superseded')
  ),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('system', 'user')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  prior_state TEXT CHECK (
    prior_state IS NULL OR prior_state IN ('preview', 'blocked', 'accepted', 'accepted_with_decisions', 'superseded')
  ),
  new_state TEXT NOT NULL CHECK (
    new_state IN ('preview', 'blocked', 'accepted', 'accepted_with_decisions', 'superseded')
  ),
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK (
    (actor_kind = 'system' AND actor_user_id IS NULL)
    OR (actor_kind = 'user' AND actor_user_id IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, import_batch_id, event_sequence),
  UNIQUE (workspace_id, account_id, import_event_id),
  UNIQUE (workspace_id, account_id, import_batch_id, import_event_id),
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_source_rows (
  source_row_id TEXT PRIMARY KEY ${uuidCheck("source_row_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  record_ordinal INTEGER NOT NULL CHECK (record_ordinal > 0),
  source_record_identity_sha256 TEXT NOT NULL ${sha256Check("source_record_identity_sha256")},
  raw_record_sha256 TEXT NOT NULL ${sha256Check("raw_record_sha256")},
  raw_fields_json TEXT NOT NULL CHECK (json_valid(raw_fields_json) AND json_type(raw_fields_json) = 'array'),
  section_name TEXT CHECK (section_name IS NULL OR length(section_name) BETWEEN 1 AND 120),
  record_type TEXT CHECK (record_type IS NULL OR length(record_type) BETWEEN 1 AND 120),
  asset_category TEXT CHECK (asset_category IS NULL OR length(asset_category) BETWEEN 1 AND 64),
  content_fingerprint_sha256 TEXT NOT NULL ${sha256Check("content_fingerprint_sha256")},
  occurrence_ordinal INTEGER NOT NULL CHECK (occurrence_ordinal > 0),
  initial_classification TEXT NOT NULL CHECK (
    initial_classification IN (
      'mapped_execution', 'mapped_position_fact', 'mapped_coverage_fact',
      'automatic_non_execution',
      'unsupported', 'needs_correction'
    )
  ),
  mapping_version TEXT NOT NULL ${tokenCheck("mapping_version")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, source_row_id),
  UNIQUE (workspace_id, account_id, import_batch_id, source_row_id),
  UNIQUE (workspace_id, account_id, import_batch_id, record_ordinal),
  UNIQUE (workspace_id, source_record_identity_sha256),
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_source_rows_batch_classification
  ON journal_source_rows(workspace_id, account_id, import_batch_id, initial_classification, record_ordinal);

CREATE INDEX journal_source_rows_overlap
  ON journal_source_rows(workspace_id, account_id, content_fingerprint_sha256, occurrence_ordinal);

CREATE TABLE journal_source_row_issues (
  source_issue_id TEXT PRIMARY KEY ${uuidCheck("source_issue_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  source_row_id TEXT ${uuidCheck("source_row_id")},
  instrument_id TEXT ${uuidCheck("instrument_id")},
  trade_currency TEXT ${currencyCheck("trade_currency")},
  effective_at_utc TEXT ${utcCheck("effective_at_utc")},
  issue_scope TEXT NOT NULL CHECK (issue_scope IN ('import', 'row', 'position_fact', 'execution', 'chain')),
  issue_code TEXT NOT NULL ${tokenCheck("issue_code")},
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  is_blocking INTEGER NOT NULL CHECK (is_blocking IN (0, 1)),
  detector_id TEXT NOT NULL ${tokenCheck("detector_id")},
  detector_version TEXT NOT NULL ${tokenCheck("detector_version")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (issue_scope = 'import' AND source_row_id IS NULL)
    OR (issue_scope = 'row' AND source_row_id IS NOT NULL)
    OR issue_scope IN ('position_fact', 'execution', 'chain')
  ),
  CHECK ((instrument_id IS NULL) = (trade_currency IS NULL)),
  UNIQUE (workspace_id, account_id, source_issue_id),
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id, source_row_id) REFERENCES journal_source_rows(workspace_id, account_id, import_batch_id, source_row_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, instrument_id) REFERENCES journal_instruments(workspace_id, instrument_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_source_row_issues_batch
  ON journal_source_row_issues(workspace_id, account_id, import_batch_id, is_blocking, severity);

CREATE INDEX journal_source_row_issues_chain
  ON journal_source_row_issues(workspace_id, account_id, instrument_id, trade_currency, issue_code);

CREATE TABLE journal_source_coverage_intervals (
  coverage_interval_id TEXT PRIMARY KEY ${uuidCheck("coverage_interval_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'option', 'forex', 'future', 'crypto', 'other')),
  coverage_kind TEXT NOT NULL CHECK (coverage_kind IN ('complete', 'partial', 'point_only', 'unknown')),
  local_start_date TEXT NOT NULL ${dateCheck("local_start_date")},
  local_end_date TEXT NOT NULL ${dateCheck("local_end_date")},
  source_timezone TEXT NOT NULL CHECK (length(trim(source_timezone)) BETWEEN 1 AND 64),
  start_at_utc TEXT ${utcCheck("start_at_utc")},
  end_at_utc TEXT ${utcCheck("end_at_utc")},
  assertion_version TEXT NOT NULL ${tokenCheck("assertion_version")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (local_end_date >= local_start_date),
  CHECK (
    (start_at_utc IS NULL AND end_at_utc IS NULL)
    OR (start_at_utc IS NOT NULL AND end_at_utc IS NOT NULL AND end_at_utc >= start_at_utc)
  ),
  CHECK (coverage_kind <> 'point_only' OR local_start_date = local_end_date),
  UNIQUE (workspace_id, account_id, coverage_interval_id),
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_source_coverage_account_period
  ON journal_source_coverage_intervals(workspace_id, account_id, asset_class, local_start_date, local_end_date);

CREATE TABLE journal_position_facts (
  position_fact_id TEXT PRIMARY KEY ${uuidCheck("position_fact_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  source_row_id TEXT ${uuidCheck("source_row_id")},
  instrument_id TEXT NOT NULL ${uuidCheck("instrument_id")},
  currency TEXT NOT NULL ${currencyCheck("currency")},
  fact_kind TEXT NOT NULL CHECK (fact_kind IN ('opening_balance', 'closing_balance', 'open_position', 'current_position')),
  effective_local_date TEXT NOT NULL ${dateCheck("effective_local_date")},
  time_precision TEXT NOT NULL CHECK (time_precision IN ('date', 'day_start', 'day_end', 'exact')),
  source_time_text TEXT CHECK (source_time_text IS NULL OR length(source_time_text) BETWEEN 1 AND 120),
  source_timezone TEXT NOT NULL CHECK (length(trim(source_timezone)) BETWEEN 1 AND 64),
  effective_at_utc TEXT ${utcCheck("effective_at_utc")},
  quantity_decimal TEXT NOT NULL ${canonicalSignedDecimalCheck("quantity_decimal")},
  fact_source TEXT NOT NULL CHECK (fact_source IN ('statement', 'trader_correction')),
  fact_version TEXT NOT NULL ${tokenCheck("fact_version")},
  supersedes_position_fact_id TEXT ${uuidCheck("supersedes_position_fact_id")},
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (fact_source = 'statement' AND source_row_id IS NOT NULL)
    OR (fact_source = 'trader_correction' AND actor_user_id IS NOT NULL)
  ),
  CHECK (time_precision <> 'exact' OR effective_at_utc IS NOT NULL),
  CHECK (supersedes_position_fact_id IS NULL OR supersedes_position_fact_id <> position_fact_id),
  UNIQUE (workspace_id, account_id, position_fact_id),
  UNIQUE (workspace_id, account_id, instrument_id, currency, position_fact_id),
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id, source_row_id) REFERENCES journal_source_rows(workspace_id, account_id, import_batch_id, source_row_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, instrument_id) REFERENCES journal_instruments(workspace_id, instrument_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, instrument_id, currency, supersedes_position_fact_id) REFERENCES journal_position_facts(workspace_id, account_id, instrument_id, currency, position_fact_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_position_facts_chain_time
  ON journal_position_facts(workspace_id, account_id, instrument_id, currency, effective_local_date, created_at_utc);

CREATE UNIQUE INDEX journal_position_facts_one_successor
  ON journal_position_facts(workspace_id, account_id, supersedes_position_fact_id)
  WHERE supersedes_position_fact_id IS NOT NULL`;

export const journalImportEvidenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0003_journal_import_evidence",
  executionOrder: 3,
  statements: Object.freeze([sql]),
});
