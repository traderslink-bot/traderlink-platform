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

function tokenCheck(column: string, maximumLength = 64): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND ${maximumLength}
    AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function encryptedTextCheck(column: string, maximumLength: number): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND ${maximumLength}
    AND ${column} NOT GLOB '*[^A-Za-z0-9_-]*'
  )`;
}

const sql = `CREATE TABLE journal_daily_tracker_settings (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  tracker_start_date TEXT NOT NULL ${dateCheck("tracker_start_date")},
  analyzer_eligibility_policy TEXT NOT NULL CHECK (
    analyzer_eligibility_policy = 'active_paid_trading_dates'
  ),
  historical_review_policy TEXT NOT NULL CHECK (historical_review_policy = 'no_obligation'),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (workspace_id, account_id),
  CHECK (updated_at_utc >= created_at_utc),
  FOREIGN KEY (workspace_id, account_id)
    REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_trade_analyzer_entitlement_intervals (
  analyzer_entitlement_interval_id TEXT PRIMARY KEY ${uuidCheck("analyzer_entitlement_interval_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  eligibility_start_date TEXT NOT NULL ${dateCheck("eligibility_start_date")},
  eligibility_end_date TEXT ${dateCheck("eligibility_end_date")},
  interval_state TEXT NOT NULL CHECK (interval_state IN ('active', 'closed')),
  entitlement_source TEXT NOT NULL CHECK (entitlement_source = 'paid_plan'),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (eligibility_end_date IS NULL OR eligibility_end_date >= eligibility_start_date),
  CHECK (
    (interval_state = 'active' AND eligibility_end_date IS NULL)
    OR (interval_state = 'closed' AND eligibility_end_date IS NOT NULL)
  ),
  CHECK (updated_at_utc >= created_at_utc),
  FOREIGN KEY (user_id, workspace_id)
    REFERENCES platform_workspace_memberships(user_id, workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX journal_trade_analyzer_one_active_entitlement
  ON journal_trade_analyzer_entitlement_intervals(user_id, workspace_id)
  WHERE interval_state = 'active';

CREATE INDEX journal_trade_analyzer_entitlement_coverage
  ON journal_trade_analyzer_entitlement_intervals(
    user_id, workspace_id, eligibility_start_date, eligibility_end_date
  );

CREATE TABLE journal_broker_account_links (
  broker_account_link_id TEXT PRIMARY KEY ${uuidCheck("broker_account_link_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  source_identity_id TEXT NOT NULL ${uuidCheck("source_identity_id")},
  connection_id TEXT NOT NULL ${uuidCheck("connection_id")},
  provider TEXT NOT NULL CHECK (provider = 'moomoo'),
  privacy_safe_label TEXT NOT NULL CHECK (
    length(trim(privacy_safe_label)) BETWEEN 1 AND 120
  ),
  account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'margin', 'unknown')),
  enabled_markets_json TEXT NOT NULL CHECK (
    length(enabled_markets_json) BETWEEN 2 AND 1000
    AND json_valid(enabled_markets_json)
    AND json_type(enabled_markets_json) = 'array'
  ),
  private_key_version TEXT NOT NULL ${tokenCheck("private_key_version")},
  private_initialization_vector TEXT NOT NULL ${encryptedTextCheck("private_initialization_vector", 32)},
  private_ciphertext TEXT NOT NULL ${encryptedTextCheck("private_ciphertext", 4096)},
  private_authentication_tag TEXT NOT NULL ${encryptedTextCheck("private_authentication_tag", 32)},
  link_state TEXT NOT NULL CHECK (link_state IN ('active', 'unavailable', 'disconnected')),
  first_seen_at_utc TEXT NOT NULL ${utcCheck("first_seen_at_utc")},
  last_seen_at_utc TEXT NOT NULL ${utcCheck("last_seen_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  CHECK (updated_at_utc >= first_seen_at_utc),
  UNIQUE (workspace_id, account_id, source_identity_id),
  UNIQUE (connection_id, source_identity_id),
  UNIQUE (workspace_id, account_id, broker_account_link_id),
  FOREIGN KEY (workspace_id, account_id, source_identity_id)
    REFERENCES journal_account_source_identities(workspace_id, account_id, source_identity_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (connection_id)
    REFERENCES platform_broker_connections(connection_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_broker_account_links_connection_state
  ON journal_broker_account_links(connection_id, link_state, updated_at_utc DESC);

CREATE TABLE journal_broker_import_jobs (
  broker_import_job_id TEXT PRIMARY KEY ${uuidCheck("broker_import_job_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  broker_account_link_id TEXT NOT NULL ${uuidCheck("broker_account_link_id")},
  import_kind TEXT NOT NULL CHECK (import_kind IN ('initial_history', 'older_history', 'incremental_sync')),
  job_state TEXT NOT NULL CHECK (
    job_state IN ('queued', 'running', 'waiting_retry', 'completed', 'failed', 'cancelled')
  ),
  requested_start_date TEXT NOT NULL ${dateCheck("requested_start_date")},
  cutoff_at_utc TEXT NOT NULL ${utcCheck("cutoff_at_utc")},
  exact_start_microseconds INTEGER NOT NULL CHECK (exact_start_microseconds > 0),
  exact_end_microseconds INTEGER NOT NULL CHECK (exact_end_microseconds > exact_start_microseconds),
  total_work_units INTEGER NOT NULL CHECK (total_work_units > 0),
  completed_work_units INTEGER NOT NULL DEFAULT 0 CHECK (
    completed_work_units BETWEEN 0 AND total_work_units
  ),
  received_fill_count INTEGER NOT NULL DEFAULT 0 CHECK (received_fill_count >= 0),
  accepted_execution_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_execution_count >= 0),
  existing_execution_count INTEGER NOT NULL DEFAULT 0 CHECK (existing_execution_count >= 0),
  decision_required_count INTEGER NOT NULL DEFAULT 0 CHECK (decision_required_count >= 0),
  safe_error_code TEXT ${tokenCheck("safe_error_code")},
  next_attempt_at_utc TEXT ${utcCheck("next_attempt_at_utc")},
  started_at_utc TEXT ${utcCheck("started_at_utc")},
  completed_at_utc TEXT ${utcCheck("completed_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (started_at_utc IS NULL OR started_at_utc >= created_at_utc),
  CHECK (completed_at_utc IS NULL OR completed_at_utc >= created_at_utc),
  CHECK (
    (job_state = 'waiting_retry' AND next_attempt_at_utc IS NOT NULL)
    OR (job_state <> 'waiting_retry' AND next_attempt_at_utc IS NULL)
  ),
  CHECK (
    (job_state = 'completed' AND completed_at_utc IS NOT NULL AND completed_work_units = total_work_units)
    OR (job_state <> 'completed' AND completed_at_utc IS NULL)
  ),
  UNIQUE (workspace_id, account_id, broker_import_job_id),
  FOREIGN KEY (workspace_id, account_id, broker_account_link_id)
    REFERENCES journal_broker_account_links(workspace_id, account_id, broker_account_link_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_broker_import_jobs_claim
  ON journal_broker_import_jobs(job_state, next_attempt_at_utc, created_at_utc);

CREATE INDEX journal_broker_import_jobs_account
  ON journal_broker_import_jobs(workspace_id, account_id, created_at_utc DESC);

CREATE TABLE journal_broker_import_ranges (
  broker_import_range_id TEXT PRIMARY KEY ${uuidCheck("broker_import_range_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  broker_import_job_id TEXT NOT NULL ${uuidCheck("broker_import_job_id")},
  broker_account_link_id TEXT NOT NULL ${uuidCheck("broker_account_link_id")},
  market TEXT NOT NULL CHECK (market IN ('US', 'HK', 'SG', 'JP', 'AU', 'CA', 'BMS', 'SH', 'SZ')),
  work_sequence INTEGER NOT NULL CHECK (work_sequence > 0),
  range_start_microseconds INTEGER NOT NULL CHECK (range_start_microseconds > 0),
  range_end_microseconds INTEGER NOT NULL CHECK (range_end_microseconds > range_start_microseconds),
  range_state TEXT NOT NULL CHECK (
    range_state IN ('queued', 'running', 'waiting_retry', 'received', 'committed', 'failed')
  ),
  page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
  received_fill_count INTEGER NOT NULL DEFAULT 0 CHECK (received_fill_count >= 0),
  committed_fill_count INTEGER NOT NULL DEFAULT 0 CHECK (committed_fill_count >= 0),
  cursor_key_version TEXT ${tokenCheck("cursor_key_version")},
  cursor_initialization_vector TEXT ${encryptedTextCheck("cursor_initialization_vector", 32)},
  cursor_ciphertext TEXT ${encryptedTextCheck("cursor_ciphertext", 4096)},
  cursor_authentication_tag TEXT ${encryptedTextCheck("cursor_authentication_tag", 32)},
  provider_completed INTEGER NOT NULL DEFAULT 0 CHECK (provider_completed IN (0, 1)),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  safe_error_code TEXT ${tokenCheck("safe_error_code")},
  next_attempt_at_utc TEXT ${utcCheck("next_attempt_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  committed_at_utc TEXT ${utcCheck("committed_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (cursor_key_version IS NULL AND cursor_initialization_vector IS NULL
      AND cursor_ciphertext IS NULL AND cursor_authentication_tag IS NULL)
    OR (cursor_key_version IS NOT NULL AND cursor_initialization_vector IS NOT NULL
      AND cursor_ciphertext IS NOT NULL AND cursor_authentication_tag IS NOT NULL)
  ),
  CHECK (
    (range_state = 'waiting_retry' AND next_attempt_at_utc IS NOT NULL)
    OR (range_state <> 'waiting_retry' AND next_attempt_at_utc IS NULL)
  ),
  CHECK (
    (range_state = 'committed' AND provider_completed = 1 AND committed_at_utc IS NOT NULL)
    OR (range_state <> 'committed' AND committed_at_utc IS NULL)
  ),
  UNIQUE (broker_import_job_id, market, work_sequence),
  UNIQUE (broker_import_job_id, market, range_start_microseconds, range_end_microseconds),
  UNIQUE (workspace_id, account_id, broker_import_range_id),
  FOREIGN KEY (workspace_id, account_id, broker_import_job_id)
    REFERENCES journal_broker_import_jobs(workspace_id, account_id, broker_import_job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, broker_account_link_id)
    REFERENCES journal_broker_account_links(workspace_id, account_id, broker_account_link_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_broker_import_ranges_claim
  ON journal_broker_import_ranges(range_state, next_attempt_at_utc, broker_import_job_id, work_sequence);

CREATE TABLE journal_broker_fill_receipts (
  broker_fill_receipt_id TEXT PRIMARY KEY ${uuidCheck("broker_fill_receipt_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  broker_account_link_id TEXT NOT NULL ${uuidCheck("broker_account_link_id")},
  broker_import_job_id TEXT NOT NULL ${uuidCheck("broker_import_job_id")},
  broker_import_range_id TEXT NOT NULL ${uuidCheck("broker_import_range_id")},
  provider_identity_scheme_version TEXT NOT NULL ${tokenCheck("provider_identity_scheme_version")},
  provider_identity_sha256 TEXT NOT NULL ${sha256Check("provider_identity_sha256")},
  provider_created_microseconds INTEGER NOT NULL CHECK (provider_created_microseconds > 0),
  provider_updated_microseconds INTEGER NOT NULL CHECK (
    provider_updated_microseconds >= provider_created_microseconds
  ),
  payload_key_version TEXT NOT NULL ${tokenCheck("payload_key_version")},
  payload_initialization_vector TEXT NOT NULL ${encryptedTextCheck("payload_initialization_vector", 32)},
  payload_ciphertext TEXT NOT NULL ${encryptedTextCheck("payload_ciphertext", 16384)},
  payload_authentication_tag TEXT NOT NULL ${encryptedTextCheck("payload_authentication_tag", 32)},
  receipt_state TEXT NOT NULL CHECK (
    receipt_state IN ('received', 'journal_committed', 'decision_required', 'rejected')
  ),
  journal_execution_id TEXT ${uuidCheck("journal_execution_id")},
  safe_issue_code TEXT ${tokenCheck("safe_issue_code")},
  first_seen_at_utc TEXT NOT NULL ${utcCheck("first_seen_at_utc")},
  last_seen_at_utc TEXT NOT NULL ${utcCheck("last_seen_at_utc")},
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  CHECK (
    (receipt_state = 'journal_committed' AND journal_execution_id IS NOT NULL)
    OR (receipt_state <> 'journal_committed')
  ),
  UNIQUE (broker_account_link_id, provider_identity_scheme_version, provider_identity_sha256),
  FOREIGN KEY (workspace_id, account_id, broker_account_link_id)
    REFERENCES journal_broker_account_links(workspace_id, account_id, broker_account_link_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, broker_import_job_id)
    REFERENCES journal_broker_import_jobs(workspace_id, account_id, broker_import_job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, broker_import_range_id)
    REFERENCES journal_broker_import_ranges(workspace_id, account_id, broker_import_range_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, journal_execution_id)
    REFERENCES journal_executions(workspace_id, account_id, execution_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_broker_fill_receipts_range
  ON journal_broker_fill_receipts(broker_import_range_id, receipt_state, provider_updated_microseconds);

CREATE TABLE journal_broker_import_coverage (
  broker_import_coverage_id TEXT PRIMARY KEY ${uuidCheck("broker_import_coverage_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  broker_account_link_id TEXT NOT NULL ${uuidCheck("broker_account_link_id")},
  market TEXT NOT NULL CHECK (market IN ('US', 'HK', 'SG', 'JP', 'AU', 'CA', 'BMS', 'SH', 'SZ')),
  coverage_start_microseconds INTEGER NOT NULL CHECK (coverage_start_microseconds > 0),
  coverage_end_microseconds INTEGER NOT NULL CHECK (
    coverage_end_microseconds > coverage_start_microseconds
  ),
  completed_by_job_id TEXT NOT NULL ${uuidCheck("completed_by_job_id")},
  completed_at_utc TEXT NOT NULL ${utcCheck("completed_at_utc")},
  UNIQUE (broker_account_link_id, market, coverage_start_microseconds, coverage_end_microseconds),
  FOREIGN KEY (workspace_id, account_id, broker_account_link_id)
    REFERENCES journal_broker_account_links(workspace_id, account_id, broker_account_link_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, completed_by_job_id)
    REFERENCES journal_broker_import_jobs(workspace_id, account_id, broker_import_job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_broker_import_coverage_lookup
  ON journal_broker_import_coverage(
    broker_account_link_id, market, coverage_start_microseconds, coverage_end_microseconds
  );

CREATE TRIGGER journal_broker_import_jobs_guard_immutable_scope
BEFORE UPDATE ON journal_broker_import_jobs
WHEN NEW.broker_import_job_id IS NOT OLD.broker_import_job_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.broker_account_link_id IS NOT OLD.broker_account_link_id
  OR NEW.import_kind IS NOT OLD.import_kind
  OR NEW.requested_start_date IS NOT OLD.requested_start_date
  OR NEW.cutoff_at_utc IS NOT OLD.cutoff_at_utc
  OR NEW.exact_start_microseconds IS NOT OLD.exact_start_microseconds
  OR NEW.exact_end_microseconds IS NOT OLD.exact_end_microseconds
  OR NEW.total_work_units IS NOT OLD.total_work_units
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
BEGIN
  SELECT RAISE(ABORT, 'journal_broker_import_job_scope_immutable');
END;

CREATE TRIGGER journal_trade_analyzer_entitlement_guard
BEFORE UPDATE ON journal_trade_analyzer_entitlement_intervals
WHEN NEW.analyzer_entitlement_interval_id IS NOT OLD.analyzer_entitlement_interval_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.eligibility_start_date IS NOT OLD.eligibility_start_date
  OR NEW.entitlement_source IS NOT OLD.entitlement_source
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR (OLD.interval_state = 'closed' AND NEW.interval_state <> 'closed')
  OR (OLD.eligibility_end_date IS NOT NULL AND NEW.eligibility_end_date IS NOT OLD.eligibility_end_date)
BEGIN
  SELECT RAISE(ABORT, 'journal_trade_analyzer_entitlement_invalid_update');
END;

CREATE TRIGGER journal_broker_import_ranges_guard_immutable_scope
BEFORE UPDATE ON journal_broker_import_ranges
WHEN NEW.broker_import_range_id IS NOT OLD.broker_import_range_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.broker_import_job_id IS NOT OLD.broker_import_job_id
  OR NEW.broker_account_link_id IS NOT OLD.broker_account_link_id
  OR NEW.market IS NOT OLD.market
  OR NEW.work_sequence IS NOT OLD.work_sequence
  OR NEW.range_start_microseconds IS NOT OLD.range_start_microseconds
  OR NEW.range_end_microseconds IS NOT OLD.range_end_microseconds
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
BEGIN
  SELECT RAISE(ABORT, 'journal_broker_import_range_scope_immutable');
END;

CREATE TRIGGER journal_broker_fill_receipts_guard_identity
BEFORE UPDATE ON journal_broker_fill_receipts
WHEN NEW.broker_fill_receipt_id IS NOT OLD.broker_fill_receipt_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.broker_account_link_id IS NOT OLD.broker_account_link_id
  OR NEW.provider_identity_scheme_version IS NOT OLD.provider_identity_scheme_version
  OR NEW.provider_identity_sha256 IS NOT OLD.provider_identity_sha256
  OR NEW.first_seen_at_utc IS NOT OLD.first_seen_at_utc
  OR NEW.last_seen_at_utc < OLD.last_seen_at_utc
BEGIN
  SELECT RAISE(ABORT, 'journal_broker_fill_receipt_identity_immutable');
END;`;

export const moomooExecutionImportFoundationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0047_moomoo_execution_import_foundation",
  executionOrder: 47,
  statements: Object.freeze([sql]),
});
