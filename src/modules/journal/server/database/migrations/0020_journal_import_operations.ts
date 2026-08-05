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

function tokenCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

const attemptStates = `'received', 'inspecting', 'awaiting_mapping',
    'preview_ready', 'committing', 'committed', 'committed_with_decisions',
    'duplicate', 'rejected', 'system_failed', 'user_cancelled', 'expired'`;

const candidateStates = `'observed', 'mapping_available', 'ready_for_development',
    'in_development', 'validating', 'supported', 'duplicate', 'rejected'`;

const sql = `CREATE TABLE journal_import_instrumentation_epochs (
  instrumentation_epoch_id TEXT PRIMARY KEY ${uuidCheck("instrumentation_epoch_id")},
  application_version TEXT NOT NULL CHECK (
    length(application_version) BETWEEN 1 AND 120 AND instr(application_version, char(0)) = 0
  ),
  activated_at_utc TEXT NOT NULL ${utcCheck("activated_at_utc")},
  closed_at_utc TEXT ${utcCheck("closed_at_utc")},
  close_reason_code TEXT ${tokenCheck("close_reason_code")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (closed_at_utc IS NULL AND close_reason_code IS NULL)
    OR (closed_at_utc IS NOT NULL AND close_reason_code IS NOT NULL
      AND closed_at_utc >= activated_at_utc)
  )
) STRICT;

CREATE UNIQUE INDEX journal_import_instrumentation_epochs_one_active
  ON journal_import_instrumentation_epochs((1)) WHERE closed_at_utc IS NULL;

CREATE TRIGGER journal_import_instrumentation_epochs_guard_update
BEFORE UPDATE ON journal_import_instrumentation_epochs
WHEN OLD.closed_at_utc IS NOT NULL
  OR NEW.instrumentation_epoch_id IS NOT OLD.instrumentation_epoch_id
  OR NEW.application_version IS NOT OLD.application_version
  OR NEW.activated_at_utc IS NOT OLD.activated_at_utc
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.closed_at_utc IS NULL
  OR NEW.close_reason_code IS NULL
BEGIN
  SELECT RAISE(ABORT, 'journal_import_instrumentation_epoch_transition_invalid');
END;

CREATE TRIGGER journal_import_instrumentation_epochs_no_delete
BEFORE DELETE ON journal_import_instrumentation_epochs BEGIN
  SELECT RAISE(ABORT, 'journal_import_instrumentation_epoch_immutable');
END;

CREATE TABLE journal_import_attempts (
  import_attempt_id TEXT PRIMARY KEY ${uuidCheck("import_attempt_id")},
  instrumentation_epoch_id TEXT NOT NULL ${uuidCheck("instrumentation_epoch_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  request_idempotency_sha256 TEXT NOT NULL ${sha256Check("request_idempotency_sha256")},
  source_file_sha256 TEXT NOT NULL ${sha256Check("source_file_sha256")},
  source_file_size_bytes INTEGER NOT NULL CHECK (source_file_size_bytes BETWEEN 1 AND 52428800),
  file_kind TEXT NOT NULL CHECK (file_kind IN ('csv', 'tsv', 'text_csv')),
  safe_broker_label TEXT CHECK (
    safe_broker_label IS NULL OR (
      length(trim(safe_broker_label)) BETWEEN 1 AND 80
      AND instr(safe_broker_label, char(0)) = 0
    )
  ),
  current_state TEXT NOT NULL CHECK (current_state IN (${attemptStates})),
  revision INTEGER NOT NULL CHECK (revision > 0),
  adapter_id TEXT ${tokenCheck("adapter_id")},
  adapter_version TEXT CHECK (
    adapter_version IS NULL OR (length(adapter_version) BETWEEN 1 AND 120 AND instr(adapter_version, char(0)) = 0)
  ),
  parser_version TEXT CHECK (
    parser_version IS NULL OR (length(parser_version) BETWEEN 1 AND 120 AND instr(parser_version, char(0)) = 0)
  ),
  mapping_version TEXT CHECK (
    mapping_version IS NULL OR (length(mapping_version) BETWEEN 1 AND 120 AND instr(mapping_version, char(0)) = 0)
  ),
  preserved_row_count INTEGER NOT NULL CHECK (preserved_row_count >= 0),
  mapped_execution_count INTEGER NOT NULL CHECK (mapped_execution_count >= 0),
  unsupported_row_count INTEGER NOT NULL CHECK (unsupported_row_count >= 0),
  issue_count INTEGER NOT NULL CHECK (issue_count >= 0),
  pending_decision_count INTEGER NOT NULL CHECK (pending_decision_count >= 0),
  committed_import_batch_id TEXT ${uuidCheck("committed_import_batch_id")},
  failure_code TEXT ${tokenCheck("failure_code")},
  admitted_at_utc TEXT NOT NULL ${utcCheck("admitted_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  resumable_until_utc TEXT ${utcCheck("resumable_until_utc")},
  terminal_at_utc TEXT ${utcCheck("terminal_at_utc")},
  CHECK (updated_at_utc >= admitted_at_utc),
  CHECK (
    (current_state IN ('awaiting_mapping', 'preview_ready') AND resumable_until_utc IS NOT NULL
      AND terminal_at_utc IS NULL)
    OR (current_state NOT IN ('awaiting_mapping', 'preview_ready') AND resumable_until_utc IS NULL)
  ),
  CHECK (
    (current_state IN ('committed', 'committed_with_decisions')
      AND committed_import_batch_id IS NOT NULL AND failure_code IS NULL AND terminal_at_utc IS NOT NULL)
    OR (current_state IN ('duplicate', 'rejected', 'system_failed', 'user_cancelled', 'expired')
      AND terminal_at_utc IS NOT NULL)
    OR (current_state IN ('received', 'inspecting', 'awaiting_mapping', 'preview_ready', 'committing')
      AND terminal_at_utc IS NULL AND committed_import_batch_id IS NULL)
  ),
  CHECK (terminal_at_utc IS NULL OR terminal_at_utc >= admitted_at_utc),
  UNIQUE (workspace_id, account_id, import_attempt_id),
  UNIQUE (user_id, workspace_id, account_id, request_idempotency_sha256),
  FOREIGN KEY (instrumentation_epoch_id) REFERENCES journal_import_instrumentation_epochs(instrumentation_epoch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, committed_import_batch_id)
    REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_import_attempts_state_time
  ON journal_import_attempts(current_state, updated_at_utc, import_attempt_id);

CREATE INDEX journal_import_attempts_user_time
  ON journal_import_attempts(user_id, admitted_at_utc DESC, import_attempt_id);

CREATE INDEX journal_import_attempts_account_time
  ON journal_import_attempts(workspace_id, account_id, admitted_at_utc DESC, import_attempt_id);

CREATE INDEX journal_import_attempts_source_reconciliation
  ON journal_import_attempts(workspace_id, account_id, source_file_sha256, current_state, import_attempt_id);

CREATE TRIGGER journal_import_attempts_no_delete
BEFORE DELETE ON journal_import_attempts BEGIN
  SELECT RAISE(ABORT, 'journal_import_attempt_immutable');
END;

CREATE TABLE journal_import_attempt_events (
  import_attempt_event_id TEXT PRIMARY KEY ${uuidCheck("import_attempt_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_attempt_id TEXT NOT NULL ${uuidCheck("import_attempt_id")},
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  prior_state TEXT CHECK (prior_state IN (${attemptStates})),
  new_state TEXT NOT NULL CHECK (new_state IN (${attemptStates})),
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  safe_counts_json TEXT NOT NULL CHECK (
    length(safe_counts_json) BETWEEN 2 AND 4000
    AND json_valid(safe_counts_json) AND json_type(safe_counts_json) = 'object'
  ),
  correlation_ref_sha256 TEXT NOT NULL ${sha256Check("correlation_ref_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (sequence_number = 1 AND prior_state IS NULL AND new_state = 'received')
    OR (sequence_number > 1 AND prior_state IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, import_attempt_id, sequence_number),
  FOREIGN KEY (workspace_id, account_id, import_attempt_id)
    REFERENCES journal_import_attempts(workspace_id, account_id, import_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_import_attempt_events_chronology
  ON journal_import_attempt_events(workspace_id, account_id, import_attempt_id, sequence_number);

CREATE TRIGGER journal_import_attempt_events_no_update
BEFORE UPDATE ON journal_import_attempt_events BEGIN
  SELECT RAISE(ABORT, 'journal_import_attempt_event_immutable');
END;

CREATE TRIGGER journal_import_attempt_events_no_delete
BEFORE DELETE ON journal_import_attempt_events BEGIN
  SELECT RAISE(ABORT, 'journal_import_attempt_event_immutable');
END;

CREATE TABLE journal_statement_format_candidates (
  statement_format_candidate_id TEXT PRIMARY KEY ${uuidCheck("statement_format_candidate_id")},
  statement_layout_sha256 TEXT NOT NULL UNIQUE ${sha256Check("statement_layout_sha256")},
  canonical_safe_broker_label TEXT CHECK (
    canonical_safe_broker_label IS NULL OR (
      length(trim(canonical_safe_broker_label)) BETWEEN 1 AND 80
      AND instr(canonical_safe_broker_label, char(0)) = 0
    )
  ),
  file_kind TEXT NOT NULL CHECK (file_kind IN ('csv', 'tsv', 'text_csv')),
  normalized_encoding TEXT NOT NULL CHECK (normalized_encoding IN ('utf-8', 'utf-8-bom', 'windows-1252')),
  delimiter TEXT CHECK (delimiter IN (',', char(9), ';', '|')),
  current_state TEXT NOT NULL CHECK (current_state IN (${candidateStates})),
  revision INTEGER NOT NULL CHECK (revision > 0),
  deployed_adapter_id TEXT ${tokenCheck("deployed_adapter_id")},
  deployed_adapter_version TEXT CHECK (
    deployed_adapter_version IS NULL OR (
      length(deployed_adapter_version) BETWEEN 1 AND 120
      AND instr(deployed_adapter_version, char(0)) = 0
    )
  ),
  deployed_fixture_sha256 TEXT ${sha256Check("deployed_fixture_sha256")},
  first_observed_at_utc TEXT NOT NULL ${utcCheck("first_observed_at_utc")},
  last_observed_at_utc TEXT NOT NULL ${utcCheck("last_observed_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (last_observed_at_utc >= first_observed_at_utc),
  CHECK (updated_at_utc >= first_observed_at_utc),
  CHECK (
    (current_state = 'supported' AND deployed_adapter_id IS NOT NULL
      AND deployed_adapter_version IS NOT NULL AND deployed_fixture_sha256 IS NOT NULL)
    OR current_state <> 'supported'
  )
) STRICT;

CREATE INDEX journal_statement_format_candidates_state_time
  ON journal_statement_format_candidates(current_state, last_observed_at_utc DESC, statement_format_candidate_id);

CREATE TRIGGER journal_statement_format_candidates_no_delete
BEFORE DELETE ON journal_statement_format_candidates BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_candidate_immutable');
END;

CREATE TABLE journal_statement_format_candidate_events (
  statement_format_candidate_event_id TEXT PRIMARY KEY ${uuidCheck("statement_format_candidate_event_id")},
  statement_format_candidate_id TEXT NOT NULL ${uuidCheck("statement_format_candidate_id")},
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  prior_state TEXT CHECK (prior_state IN (${candidateStates})),
  new_state TEXT NOT NULL CHECK (new_state IN (${candidateStates})),
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  expected_prior_revision INTEGER CHECK (expected_prior_revision IS NULL OR expected_prior_revision > 0),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  audit_event_id TEXT ${uuidCheck("audit_event_id")},
  deployed_registry_evidence_sha256 TEXT ${sha256Check("deployed_registry_evidence_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (sequence_number = 1 AND prior_state IS NULL AND new_state = 'observed'
      AND expected_prior_revision IS NULL)
    OR (sequence_number > 1 AND prior_state IS NOT NULL AND expected_prior_revision IS NOT NULL)
  ),
  UNIQUE (statement_format_candidate_id, sequence_number),
  FOREIGN KEY (statement_format_candidate_id)
    REFERENCES journal_statement_format_candidates(statement_format_candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (audit_event_id) REFERENCES platform_admin_audit_events(audit_event_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_statement_format_candidate_events_no_update
BEFORE UPDATE ON journal_statement_format_candidate_events BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_candidate_event_immutable');
END;

CREATE TRIGGER journal_statement_format_candidate_events_no_delete
BEFORE DELETE ON journal_statement_format_candidate_events BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_candidate_event_immutable');
END;

CREATE TABLE journal_statement_format_candidate_aliases (
  candidate_alias_id TEXT PRIMARY KEY ${uuidCheck("candidate_alias_id")},
  duplicate_candidate_id TEXT NOT NULL ${uuidCheck("duplicate_candidate_id")},
  retained_candidate_id TEXT NOT NULL ${uuidCheck("retained_candidate_id")},
  expected_duplicate_revision INTEGER NOT NULL CHECK (expected_duplicate_revision > 0),
  expected_retained_revision INTEGER NOT NULL CHECK (expected_retained_revision > 0),
  audit_event_id TEXT NOT NULL ${uuidCheck("audit_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (duplicate_candidate_id <> retained_candidate_id),
  UNIQUE (duplicate_candidate_id),
  FOREIGN KEY (duplicate_candidate_id)
    REFERENCES journal_statement_format_candidates(statement_format_candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (retained_candidate_id)
    REFERENCES journal_statement_format_candidates(statement_format_candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (audit_event_id) REFERENCES platform_admin_audit_events(audit_event_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_statement_format_candidate_aliases_retained
  ON journal_statement_format_candidate_aliases(retained_candidate_id, created_at_utc, candidate_alias_id);

CREATE TRIGGER journal_statement_format_candidate_aliases_no_update
BEFORE UPDATE ON journal_statement_format_candidate_aliases BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_candidate_alias_immutable');
END;

CREATE TRIGGER journal_statement_format_candidate_aliases_no_delete
BEFORE DELETE ON journal_statement_format_candidate_aliases BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_candidate_alias_immutable');
END;

CREATE TABLE journal_statement_format_observations (
  statement_format_observation_id TEXT PRIMARY KEY ${uuidCheck("statement_format_observation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_attempt_id TEXT ${uuidCheck("import_attempt_id")},
  historical_import_batch_id TEXT ${uuidCheck("historical_import_batch_id")},
  statement_format_candidate_id TEXT ${uuidCheck("statement_format_candidate_id")},
  statement_layout_sha256 TEXT ${sha256Check("statement_layout_sha256")},
  table_signatures_json TEXT NOT NULL CHECK (
    length(table_signatures_json) BETWEEN 2 AND 20000
    AND json_valid(table_signatures_json) AND json_type(table_signatures_json) = 'array'
  ),
  sanitized_structure_json TEXT NOT NULL CHECK (
    length(sanitized_structure_json) BETWEEN 2 AND 100000
    AND json_valid(sanitized_structure_json) AND json_type(sanitized_structure_json) = 'object'
  ),
  mapping_contract_json TEXT CHECK (
    mapping_contract_json IS NULL OR (
      length(mapping_contract_json) BETWEEN 2 AND 50000
      AND json_valid(mapping_contract_json) AND json_type(mapping_contract_json) = 'object'
    )
  ),
  observation_outcome TEXT NOT NULL CHECK (observation_outcome IN (
    'known_format', 'saved_mapping', 'manual_mapping', 'awaiting_mapping',
    'unsupported', 'rejected', 'privacy_review_required', 'system_failed'
  )),
  safe_broker_label TEXT CHECK (
    safe_broker_label IS NULL OR (
      length(trim(safe_broker_label)) BETWEEN 1 AND 80
      AND instr(safe_broker_label, char(0)) = 0
    )
  ),
  package_version TEXT NOT NULL CHECK (
    length(package_version) BETWEEN 1 AND 120 AND instr(package_version, char(0)) = 0
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (import_attempt_id IS NOT NULL AND historical_import_batch_id IS NULL)
    OR (import_attempt_id IS NULL AND historical_import_batch_id IS NOT NULL)
  ),
  CHECK (
    (observation_outcome = 'privacy_review_required'
      AND statement_layout_sha256 IS NULL AND statement_format_candidate_id IS NULL)
    OR (observation_outcome <> 'privacy_review_required' AND statement_layout_sha256 IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, import_attempt_id),
  UNIQUE (workspace_id, account_id, historical_import_batch_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_attempt_id)
    REFERENCES journal_import_attempts(workspace_id, account_id, import_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, historical_import_batch_id)
    REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (statement_format_candidate_id)
    REFERENCES journal_statement_format_candidates(statement_format_candidate_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_statement_format_observations_candidate_time
  ON journal_statement_format_observations(statement_format_candidate_id, created_at_utc DESC, statement_format_observation_id);

CREATE INDEX journal_statement_format_observations_outcome_time
  ON journal_statement_format_observations(observation_outcome, created_at_utc DESC, statement_format_observation_id);

CREATE TRIGGER journal_statement_format_observations_no_update
BEFORE UPDATE ON journal_statement_format_observations BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_observation_immutable');
END;

CREATE TRIGGER journal_statement_format_observations_no_delete
BEFORE DELETE ON journal_statement_format_observations BEGIN
  SELECT RAISE(ABORT, 'journal_statement_format_observation_immutable');
END;

CREATE TABLE journal_statement_support_objects (
  support_object_id TEXT PRIMARY KEY ${uuidCheck("support_object_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_attempt_id TEXT NOT NULL ${uuidCheck("import_attempt_id")},
  object_key TEXT NOT NULL CHECK (
    length(object_key) BETWEEN 32 AND 160
    AND object_key NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  source_file_sha256 TEXT NOT NULL ${sha256Check("source_file_sha256")},
  source_file_size_bytes INTEGER NOT NULL CHECK (source_file_size_bytes BETWEEN 1 AND 52428800),
  source_mime_type TEXT NOT NULL CHECK (source_mime_type IN ('text/csv', 'text/plain', 'application/csv')),
  purge_state TEXT NOT NULL CHECK (purge_state IN ('active', 'purge_pending', 'purged', 'purge_failed')),
  expires_at_utc TEXT NOT NULL ${utcCheck("expires_at_utc")},
  purge_receipt_sha256 TEXT ${sha256Check("purge_receipt_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  purged_at_utc TEXT ${utcCheck("purged_at_utc")},
  CHECK (expires_at_utc > created_at_utc),
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (purge_state IN ('active', 'purge_pending') AND purge_receipt_sha256 IS NULL AND purged_at_utc IS NULL)
    OR (purge_state = 'purged' AND purge_receipt_sha256 IS NOT NULL AND purged_at_utc IS NOT NULL)
    OR (purge_state = 'purge_failed' AND purge_receipt_sha256 IS NULL AND purged_at_utc IS NULL)
  ),
  UNIQUE (object_key),
  UNIQUE (workspace_id, account_id, support_object_id),
  UNIQUE (workspace_id, account_id, import_attempt_id),
  FOREIGN KEY (workspace_id, account_id, import_attempt_id)
    REFERENCES journal_import_attempts(workspace_id, account_id, import_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_statement_support_objects_purge_queue
  ON journal_statement_support_objects(purge_state, expires_at_utc, support_object_id);

CREATE TRIGGER journal_statement_support_objects_no_delete
BEFORE DELETE ON journal_statement_support_objects BEGIN
  SELECT RAISE(ABORT, 'journal_statement_support_object_immutable');
END;

CREATE TABLE journal_statement_support_consents (
  support_consent_id TEXT PRIMARY KEY ${uuidCheck("support_consent_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  source_kind TEXT NOT NULL CHECK (source_kind IN ('committed_evidence', 'support_object')),
  import_batch_id TEXT ${uuidCheck("import_batch_id")},
  support_object_id TEXT ${uuidCheck("support_object_id")},
  purpose TEXT NOT NULL CHECK (purpose = 'importer_development'),
  consent_state TEXT NOT NULL CHECK (consent_state IN ('active', 'revoked', 'expired')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  granted_at_utc TEXT NOT NULL ${utcCheck("granted_at_utc")},
  expires_at_utc TEXT NOT NULL ${utcCheck("expires_at_utc")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc")},
  revoke_reason_code TEXT ${tokenCheck("revoke_reason_code")},
  completed_download_count INTEGER NOT NULL CHECK (completed_download_count >= 0),
  latest_download_at_utc TEXT ${utcCheck("latest_download_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (expires_at_utc > granted_at_utc),
  CHECK (
    (source_kind = 'committed_evidence' AND import_batch_id IS NOT NULL AND support_object_id IS NULL)
    OR (source_kind = 'support_object' AND import_batch_id IS NULL AND support_object_id IS NOT NULL)
  ),
  CHECK (
    (consent_state = 'active' AND revoked_at_utc IS NULL AND revoke_reason_code IS NULL)
    OR (consent_state IN ('revoked', 'expired') AND revoked_at_utc IS NOT NULL AND revoke_reason_code IS NOT NULL)
  ),
  CHECK (
    (completed_download_count = 0 AND latest_download_at_utc IS NULL)
    OR (completed_download_count > 0 AND latest_download_at_utc IS NOT NULL)
  ),
  CHECK (updated_at_utc >= granted_at_utc),
  UNIQUE (workspace_id, account_id, support_consent_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id)
    REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, support_object_id)
    REFERENCES journal_statement_support_objects(workspace_id, account_id, support_object_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX journal_statement_support_consents_active_import
  ON journal_statement_support_consents(workspace_id, account_id, import_batch_id, purpose)
  WHERE consent_state = 'active' AND import_batch_id IS NOT NULL;

CREATE UNIQUE INDEX journal_statement_support_consents_active_object
  ON journal_statement_support_consents(workspace_id, account_id, support_object_id, purpose)
  WHERE consent_state = 'active' AND support_object_id IS NOT NULL;

CREATE INDEX journal_statement_support_consents_expiry
  ON journal_statement_support_consents(consent_state, expires_at_utc, support_consent_id);

CREATE TRIGGER journal_statement_support_consents_no_delete
BEFORE DELETE ON journal_statement_support_consents BEGIN
  SELECT RAISE(ABORT, 'journal_statement_support_consent_immutable');
END;

CREATE TABLE journal_statement_support_consent_events (
  support_consent_event_id TEXT PRIMARY KEY ${uuidCheck("support_consent_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  support_consent_id TEXT NOT NULL ${uuidCheck("support_consent_id")},
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'granted', 'revoked', 'expired', 'download_started', 'download_completed', 'download_failed', 'purge_requested', 'purged', 'purge_failed'
  )),
  prior_state TEXT CHECK (prior_state IN ('active', 'revoked', 'expired')),
  new_state TEXT NOT NULL CHECK (new_state IN ('active', 'revoked', 'expired')),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('source_user', 'journal_owner_admin', 'system')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  audit_event_id TEXT ${uuidCheck("audit_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (sequence_number = 1 AND event_kind = 'granted' AND prior_state IS NULL AND new_state = 'active')
    OR (sequence_number > 1 AND prior_state IS NOT NULL)
  ),
  CHECK (
    (actor_kind IN ('source_user', 'journal_owner_admin') AND actor_user_id IS NOT NULL)
    OR (actor_kind = 'system' AND actor_user_id IS NULL)
  ),
  UNIQUE (workspace_id, account_id, support_consent_id, sequence_number),
  FOREIGN KEY (workspace_id, account_id, support_consent_id)
    REFERENCES journal_statement_support_consents(workspace_id, account_id, support_consent_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (audit_event_id) REFERENCES platform_admin_audit_events(audit_event_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_statement_support_consent_events_chronology
  ON journal_statement_support_consent_events(workspace_id, account_id, support_consent_id, sequence_number);

CREATE TRIGGER journal_statement_support_consent_events_no_update
BEFORE UPDATE ON journal_statement_support_consent_events BEGIN
  SELECT RAISE(ABORT, 'journal_statement_support_consent_event_immutable');
END;

CREATE TRIGGER journal_statement_support_consent_events_no_delete
BEFORE DELETE ON journal_statement_support_consent_events BEGIN
  SELECT RAISE(ABORT, 'journal_statement_support_consent_event_immutable');
END`;

export const journalImportOperationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0020_journal_import_operations",
  executionOrder: 20,
  statements: Object.freeze([sql]),
});
