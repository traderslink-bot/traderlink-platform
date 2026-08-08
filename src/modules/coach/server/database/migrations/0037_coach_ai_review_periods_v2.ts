import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function dateCheck(column: string): string {
  return `CHECK (length(${column}) = 10 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`;
}

function digestCheck(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

function nonnegativeDecimalCheck(column: string, maximumLength = 32): string {
  return `CHECK (${column} IS NULL OR (length(${column}) BETWEEN 1 AND ${maximumLength} AND ${column} NOT GLOB '*[^0-9.]*' AND ${column} NOT GLOB '*.*.*' AND CAST(${column} AS REAL) >= 0))`;
}

const sql = `CREATE TABLE coach_ai_review_account_settings_v2 (
  account_id TEXT PRIMARY KEY ${uuidCheck("account_id")},
  is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
  first_enabled_at_utc TEXT NOT NULL ${utcCheck("first_enabled_at_utc")},
  current_frequency TEXT NOT NULL CHECK (current_frequency IN ('weekly', 'two_week', 'monthly_only')),
  two_week_anchor_monday_date TEXT ${dateCheck("two_week_anchor_monday_date")},
  pending_frequency TEXT CHECK (pending_frequency IS NULL OR pending_frequency IN ('weekly', 'two_week', 'monthly_only')),
  pending_effective_monday_date TEXT ${dateCheck("pending_effective_monday_date")},
  pending_two_week_anchor_monday_date TEXT ${dateCheck("pending_two_week_anchor_monday_date")},
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK ((current_frequency = 'two_week' AND two_week_anchor_monday_date IS NOT NULL) OR (current_frequency <> 'two_week' AND two_week_anchor_monday_date IS NULL)),
  CHECK ((pending_frequency IS NULL AND pending_effective_monday_date IS NULL AND pending_two_week_anchor_monday_date IS NULL) OR (pending_frequency IS NOT NULL AND pending_effective_monday_date IS NOT NULL AND ((pending_frequency = 'two_week' AND pending_two_week_anchor_monday_date = pending_effective_monday_date) OR (pending_frequency <> 'two_week' AND pending_two_week_anchor_monday_date IS NULL)))),
  CHECK (is_enabled = 1 OR pending_frequency IS NULL),
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_review_account_settings_v2 (
  account_id, is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  revision, updated_at_utc
)
SELECT delivery.account_id, 1,
  COALESCE(monthly.enabled_at_utc, delivery.updated_at_utc),
  'weekly', NULL, NULL, NULL, NULL, 1, delivery.updated_at_utc
FROM coach_review_delivery_settings delivery
LEFT JOIN coach_monthly_review_settings monthly
  ON monthly.account_id = delivery.account_id;

CREATE TABLE coach_ai_review_account_setting_revisions_v2 (
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  revision INTEGER NOT NULL CHECK (revision >= 1),
  is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
  first_enabled_at_utc TEXT NOT NULL ${utcCheck("first_enabled_at_utc")},
  current_frequency TEXT NOT NULL CHECK (current_frequency IN ('weekly', 'two_week', 'monthly_only')),
  two_week_anchor_monday_date TEXT ${dateCheck("two_week_anchor_monday_date")},
  pending_frequency TEXT CHECK (pending_frequency IS NULL OR pending_frequency IN ('weekly', 'two_week', 'monthly_only')),
  pending_effective_monday_date TEXT ${dateCheck("pending_effective_monday_date")},
  pending_two_week_anchor_monday_date TEXT ${dateCheck("pending_two_week_anchor_monday_date")},
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  PRIMARY KEY (account_id, revision),
  CHECK ((current_frequency = 'two_week' AND two_week_anchor_monday_date IS NOT NULL) OR (current_frequency <> 'two_week' AND two_week_anchor_monday_date IS NULL)),
  CHECK ((pending_frequency IS NULL AND pending_effective_monday_date IS NULL AND pending_two_week_anchor_monday_date IS NULL) OR (pending_frequency IS NOT NULL AND pending_effective_monday_date IS NOT NULL AND ((pending_frequency = 'two_week' AND pending_two_week_anchor_monday_date = pending_effective_monday_date) OR (pending_frequency <> 'two_week' AND pending_two_week_anchor_monday_date IS NULL)))),
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_review_account_setting_revisions_v2 (
  account_id, revision, is_enabled, first_enabled_at_utc, current_frequency,
  two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  recorded_at_utc
)
SELECT account_id, revision, is_enabled, first_enabled_at_utc,
  current_frequency, two_week_anchor_monday_date, pending_frequency,
  pending_effective_monday_date, pending_two_week_anchor_monday_date,
  updated_at_utc
FROM coach_ai_review_account_settings_v2;

CREATE TABLE coach_ai_review_period_requests_v2 (
  coach_ai_review_period_request_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  review_kind TEXT NOT NULL CHECK (review_kind IN ('weekly', 'two_week', 'monthly')),
  period_start_date TEXT NOT NULL ${dateCheck("period_start_date")},
  period_end_date TEXT NOT NULL ${dateCheck("period_end_date")},
  coverage_start_date TEXT NOT NULL ${dateCheck("coverage_start_date")},
  coverage_end_date TEXT NOT NULL ${dateCheck("coverage_end_date")},
  narrative_owner_month TEXT NOT NULL CHECK (length(narrative_owner_month) = 7 AND narrative_owner_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  calendar_id TEXT NOT NULL CHECK (length(calendar_id) BETWEEN 1 AND 96),
  calendar_evidence_digest_sha256 TEXT NOT NULL ${digestCheck("calendar_evidence_digest_sha256")},
  eligible_at_utc TEXT NOT NULL ${utcCheck("eligible_at_utc")},
  request_origin TEXT NOT NULL CHECK (request_origin IN ('automatic', 'manual')),
  input_contract_version TEXT NOT NULL CHECK ((review_kind IN ('weekly', 'two_week') AND input_contract_version = 'traderlink_coach_periodic_ai_review_input_v2') OR (review_kind = 'monthly' AND input_contract_version = 'traderlink_coach_monthly_ai_review_input_v2')),
  input_sha256 TEXT NOT NULL ${digestCheck("input_sha256")},
  input_json TEXT NOT NULL CHECK (json_valid(input_json) AND json_type(input_json) = 'object'),
  evidence_manifest_sha256 TEXT NOT NULL ${digestCheck("evidence_manifest_sha256")},
  evidence_manifest_json TEXT NOT NULL CHECK (json_valid(evidence_manifest_json) AND json_type(evidence_manifest_json) = 'object'),
  prior_issued_review_id TEXT ${uuidCheck("prior_issued_review_id")},
  state TEXT NOT NULL CHECK (state IN ('pending', 'issued', 'failed', 'stopped')),
  terminal_failure_code TEXT CHECK (terminal_failure_code IS NULL OR (length(terminal_failure_code) BETWEEN 1 AND 96 AND terminal_failure_code NOT GLOB '*[^A-Z0-9_]*')),
  issued_review_id TEXT ${uuidCheck("issued_review_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK (period_end_date >= period_start_date),
  CHECK (coverage_start_date >= period_start_date AND coverage_end_date <= period_end_date AND coverage_end_date >= coverage_start_date),
  CHECK ((state = 'pending' AND terminal_failure_code IS NULL AND issued_review_id IS NULL AND finalized_at_utc IS NULL) OR (state = 'issued' AND terminal_failure_code IS NULL AND issued_review_id IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state IN ('failed', 'stopped') AND terminal_failure_code IS NOT NULL AND issued_review_id IS NULL AND finalized_at_utc IS NOT NULL)),
  UNIQUE (workspace_id, account_id, review_kind, period_start_date, period_end_date),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_period_requests_v2_account_period
ON coach_ai_review_period_requests_v2(workspace_id, account_id, period_end_date DESC, created_at_utc DESC);

CREATE TABLE coach_ai_review_generation_attempts_v2 (
  coach_ai_review_generation_attempt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_attempt_id")},
  coach_ai_review_period_request_id TEXT NOT NULL ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  state TEXT NOT NULL CHECK (state IN ('pending', 'issued', 'failed', 'blocked')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((state = 'pending' AND failure_code IS NULL AND finalized_at_utc IS NULL) OR (state = 'issued' AND failure_code IS NULL AND finalized_at_utc IS NOT NULL) OR (state IN ('failed', 'blocked') AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL)),
  UNIQUE (coach_ai_review_period_request_id, attempt_number),
  FOREIGN KEY (coach_ai_review_period_request_id) REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX coach_ai_review_generation_attempts_v2_one_pending
ON coach_ai_review_generation_attempts_v2(coach_ai_review_period_request_id) WHERE state = 'pending';
CREATE UNIQUE INDEX coach_ai_review_generation_attempts_v2_one_issued
ON coach_ai_review_generation_attempts_v2(coach_ai_review_period_request_id) WHERE state = 'issued';

CREATE TABLE coach_ai_review_generation_control_reservations_v2 (
  coach_ai_review_generation_control_reservation_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_control_reservation_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_review_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  feature_key TEXT NOT NULL CHECK (feature_key IN ('weekly_reviews', 'monthly_reviews')),
  eastern_calendar_date TEXT NOT NULL ${dateCheck("eastern_calendar_date")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_cost_usd_per_million_tokens TEXT ${nonnegativeDecimalCheck("input_cost_usd_per_million_tokens", 24)},
  output_cost_usd_per_million_tokens TEXT ${nonnegativeDecimalCheck("output_cost_usd_per_million_tokens", 24)},
  reserved_max_input_tokens INTEGER NOT NULL CHECK (reserved_max_input_tokens > 0),
  reserved_max_output_tokens INTEGER NOT NULL CHECK (reserved_max_output_tokens > 0),
  reserved_max_total_tokens INTEGER NOT NULL CHECK (reserved_max_total_tokens = reserved_max_input_tokens + reserved_max_output_tokens),
  reserved_maximum_cost_usd TEXT ${nonnegativeDecimalCheck("reserved_maximum_cost_usd")},
  state TEXT NOT NULL CHECK (state IN ('reserved', 'started', 'completed', 'failed', 'blocked')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  reserved_at_utc TEXT NOT NULL ${utcCheck("reserved_at_utc")},
  started_at_utc TEXT ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND reserved_maximum_cost_usd IS NULL) OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND reserved_maximum_cost_usd IS NOT NULL)),
  CHECK (state = 'blocked' OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND reserved_maximum_cost_usd IS NOT NULL)),
  CHECK ((state = 'reserved' AND failure_code IS NULL AND started_at_utc IS NULL AND finalized_at_utc IS NULL) OR (state = 'started' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NULL) OR (state = 'completed' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'failed' AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'blocked' AND failure_code IS NOT NULL AND started_at_utc IS NULL AND finalized_at_utc IS NOT NULL)),
  FOREIGN KEY (coach_ai_review_generation_attempt_id) REFERENCES coach_ai_review_generation_attempts_v2(coach_ai_review_generation_attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_generation_control_reservations_v2_daily_account
ON coach_ai_review_generation_control_reservations_v2(account_id, eastern_calendar_date, feature_key, state);
CREATE INDEX coach_ai_review_generation_control_reservations_v2_daily_platform
ON coach_ai_review_generation_control_reservations_v2(eastern_calendar_date, feature_key, state);

CREATE TABLE coach_ai_issued_reviews_v2 (
  coach_ai_issued_review_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_issued_review_id")},
  coach_ai_review_period_request_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_review_period_request_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  output_contract_version TEXT NOT NULL CHECK (output_contract_version IN ('traderlink_coach_periodic_ai_review_output_v2', 'traderlink_coach_monthly_ai_review_output_v2')),
  output_json TEXT NOT NULL CHECK (json_valid(output_json) AND json_type(output_json) = 'object'),
  issued_at_utc TEXT NOT NULL ${utcCheck("issued_at_utc")},
  FOREIGN KEY (coach_ai_review_period_request_id) REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_review_generation_attempt_receipts_v2 (
  coach_ai_review_generation_attempt_receipt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_attempt_receipt_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_review_generation_attempt_id")},
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  input_cost_usd_per_million_tokens TEXT ${nonnegativeDecimalCheck("input_cost_usd_per_million_tokens", 24)},
  output_cost_usd_per_million_tokens TEXT ${nonnegativeDecimalCheck("output_cost_usd_per_million_tokens", 24)},
  estimated_cost_usd TEXT ${nonnegativeDecimalCheck("estimated_cost_usd")},
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  CHECK ((input_tokens IS NULL AND output_tokens IS NULL AND total_tokens IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND total_tokens = input_tokens + output_tokens)),
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND estimated_cost_usd IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND estimated_cost_usd IS NOT NULL)),
  FOREIGN KEY (coach_ai_review_generation_attempt_id) REFERENCES coach_ai_review_generation_attempts_v2(coach_ai_review_generation_attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_review_carry_consumptions_v2 (
  coach_ai_review_carry_consumption_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_carry_consumption_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  source_evidence_sha256 TEXT NOT NULL ${digestCheck("source_evidence_sha256")},
  source_period_start_date TEXT NOT NULL ${dateCheck("source_period_start_date")},
  source_period_end_date TEXT NOT NULL ${dateCheck("source_period_end_date")},
  destination_request_id TEXT NOT NULL ${uuidCheck("destination_request_id")},
  consumed_at_utc TEXT NOT NULL ${utcCheck("consumed_at_utc")},
  CHECK (source_period_end_date >= source_period_start_date),
  UNIQUE (workspace_id, account_id, source_evidence_sha256),
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (destination_request_id) REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER coach_ai_review_account_settings_v2_no_delete
BEFORE DELETE ON coach_ai_review_account_settings_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_settings_history_required'); END;

CREATE TRIGGER coach_ai_review_account_settings_v2_update_guard
BEFORE UPDATE ON coach_ai_review_account_settings_v2
WHEN NEW.account_id <> OLD.account_id OR NEW.first_enabled_at_utc IS NOT OLD.first_enabled_at_utc OR NEW.revision <> OLD.revision + 1 OR NEW.updated_at_utc <= OLD.updated_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_settings_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_account_setting_revisions_v2_no_update
BEFORE UPDATE ON coach_ai_review_account_setting_revisions_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_settings_history_immutable'); END;
CREATE TRIGGER coach_ai_review_account_setting_revisions_v2_no_delete
BEFORE DELETE ON coach_ai_review_account_setting_revisions_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_settings_history_required'); END;

CREATE TRIGGER coach_ai_review_period_requests_v2_no_delete
BEFORE DELETE ON coach_ai_review_period_requests_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_history_required'); END;

CREATE TRIGGER coach_ai_review_period_requests_v2_terminal_immutable
BEFORE UPDATE ON coach_ai_review_period_requests_v2 WHEN OLD.state <> 'pending'
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_request_terminal'); END;

CREATE TRIGGER coach_ai_review_period_requests_v2_pending_guard
BEFORE UPDATE ON coach_ai_review_period_requests_v2
WHEN OLD.state = 'pending' AND (
  NEW.coach_ai_review_period_request_id <> OLD.coach_ai_review_period_request_id OR
  NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR
  NEW.account_id <> OLD.account_id OR NEW.review_kind <> OLD.review_kind OR
  NEW.period_start_date <> OLD.period_start_date OR NEW.period_end_date <> OLD.period_end_date OR
  NEW.coverage_start_date <> OLD.coverage_start_date OR NEW.coverage_end_date <> OLD.coverage_end_date OR
  NEW.narrative_owner_month <> OLD.narrative_owner_month OR NEW.calendar_id <> OLD.calendar_id OR
  NEW.calendar_evidence_digest_sha256 <> OLD.calendar_evidence_digest_sha256 OR
  NEW.eligible_at_utc <> OLD.eligible_at_utc OR NEW.request_origin <> OLD.request_origin OR
  NEW.input_contract_version <> OLD.input_contract_version OR NEW.input_sha256 <> OLD.input_sha256 OR
  NEW.input_json <> OLD.input_json OR NEW.evidence_manifest_sha256 <> OLD.evidence_manifest_sha256 OR
  NEW.evidence_manifest_json <> OLD.evidence_manifest_json OR
  NEW.prior_issued_review_id IS NOT OLD.prior_issued_review_id OR NEW.created_at_utc <> OLD.created_at_utc
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_request_snapshot_immutable'); END;

CREATE TRIGGER coach_ai_review_period_requests_v2_issued_scope
BEFORE UPDATE ON coach_ai_review_period_requests_v2
WHEN OLD.state = 'pending' AND NEW.state = 'issued' AND NOT EXISTS (
  SELECT 1 FROM coach_ai_issued_reviews_v2 review
  WHERE review.coach_ai_issued_review_id = NEW.issued_review_id
    AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_output_scope_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_v2_scope
BEFORE INSERT ON coach_ai_review_generation_attempts_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id
    AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
    AND request.state = 'pending'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_request_scope_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_v2_no_delete
BEFORE DELETE ON coach_ai_review_generation_attempts_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_history_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_v2_terminal_immutable
BEFORE UPDATE ON coach_ai_review_generation_attempts_v2 WHEN OLD.state <> 'pending'
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_attempt_terminal'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_v2_pending_guard
BEFORE UPDATE ON coach_ai_review_generation_attempts_v2
WHEN OLD.state = 'pending' AND (
  NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id OR
  NEW.coach_ai_review_period_request_id <> OLD.coach_ai_review_period_request_id OR
  NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR
  NEW.account_id <> OLD.account_id OR NEW.attempt_number <> OLD.attempt_number OR
  NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id OR
  NEW.created_at_utc <> OLD.created_at_utc
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_attempt_identity_immutable'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_scope
BEFORE INSERT ON coach_ai_review_generation_control_reservations_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_generation_attempts_v2 attempt
  WHERE attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
    AND attempt.user_id = NEW.user_id AND attempt.workspace_id = NEW.workspace_id
    AND attempt.account_id = NEW.account_id AND attempt.state = 'pending'
    AND ((NEW.feature_key = 'weekly_reviews' AND attempt.review_kind IN ('weekly', 'two_week')) OR (NEW.feature_key = 'monthly_reviews' AND attempt.review_kind = 'monthly'))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_scope_required'); END;
CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_no_delete
BEFORE DELETE ON coach_ai_review_generation_control_reservations_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_history_required'); END;
CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_update_guard
BEFORE UPDATE ON coach_ai_review_generation_control_reservations_v2
WHEN NEW.coach_ai_review_generation_control_reservation_id <> OLD.coach_ai_review_generation_control_reservation_id OR NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.feature_key <> OLD.feature_key OR NEW.eastern_calendar_date <> OLD.eastern_calendar_date OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id OR NEW.input_cost_usd_per_million_tokens IS NOT OLD.input_cost_usd_per_million_tokens OR NEW.output_cost_usd_per_million_tokens IS NOT OLD.output_cost_usd_per_million_tokens OR NEW.reserved_max_input_tokens <> OLD.reserved_max_input_tokens OR NEW.reserved_max_output_tokens <> OLD.reserved_max_output_tokens OR NEW.reserved_max_total_tokens <> OLD.reserved_max_total_tokens OR NEW.reserved_maximum_cost_usd IS NOT OLD.reserved_maximum_cost_usd OR NEW.reserved_at_utc <> OLD.reserved_at_utc OR (OLD.state = 'reserved' AND NOT ((NEW.state = 'started' AND NEW.failure_code IS NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NULL) OR (NEW.state IN ('failed', 'blocked') AND NEW.failure_code IS NOT NULL AND NEW.started_at_utc IS NULL AND NEW.finalized_at_utc IS NOT NULL))) OR (OLD.state = 'started' AND NOT ((NEW.state = 'completed' AND NEW.failure_code IS NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL) OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL))) OR OLD.state IN ('completed', 'failed', 'blocked')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;

CREATE TRIGGER coach_ai_issued_reviews_v2_scope
BEFORE INSERT ON coach_ai_issued_reviews_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.state = 'pending'
    AND ((request.review_kind IN ('weekly', 'two_week') AND NEW.output_contract_version = 'traderlink_coach_periodic_ai_review_output_v2') OR (request.review_kind = 'monthly' AND NEW.output_contract_version = 'traderlink_coach_monthly_ai_review_output_v2'))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_output_scope_required'); END;

CREATE TRIGGER coach_ai_issued_reviews_v2_no_update
BEFORE UPDATE ON coach_ai_issued_reviews_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_issued_review_immutable'); END;
CREATE TRIGGER coach_ai_issued_reviews_v2_no_delete
BEFORE DELETE ON coach_ai_issued_reviews_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_history_required'); END;
CREATE TRIGGER coach_ai_review_generation_attempt_receipts_v2_no_update
BEFORE UPDATE ON coach_ai_review_generation_attempt_receipts_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_receipt_immutable'); END;
CREATE TRIGGER coach_ai_review_generation_attempt_receipts_v2_no_delete
BEFORE DELETE ON coach_ai_review_generation_attempt_receipts_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_history_required'); END;
CREATE TRIGGER coach_ai_review_carry_consumptions_v2_scope
BEFORE INSERT ON coach_ai_review_carry_consumptions_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.destination_request_id
    AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_carry_scope_required'); END;
CREATE TRIGGER coach_ai_review_carry_consumptions_v2_no_update
BEFORE UPDATE ON coach_ai_review_carry_consumptions_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_carry_consumption_immutable'); END;
CREATE TRIGGER coach_ai_review_carry_consumptions_v2_no_delete
BEFORE DELETE ON coach_ai_review_carry_consumptions_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_history_required'); END;`;

export const coachAiReviewPeriodsV2Migration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0037_coach_ai_review_periods_v2",
  executionOrder: 37,
  statements: Object.freeze([sql]),
});
