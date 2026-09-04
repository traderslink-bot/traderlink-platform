import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuid(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}
function utc(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE level_analysis_shared_analyzer_settings (
  settings_key TEXT PRIMARY KEY CHECK (settings_key = 'beta'),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  default_daily_limit INTEGER NOT NULL CHECK (default_daily_limit >= 0),
  default_period_limit INTEGER NOT NULL CHECK (default_period_limit >= 0),
  global_rolling_24h_limit INTEGER NOT NULL CHECK (global_rolling_24h_limit >= 0),
  request_spacing_seconds INTEGER NOT NULL CHECK (request_spacing_seconds BETWEEN 0 AND 3600),
  designated_user_id TEXT ${uuid("designated_user_id")},
  designated_workspace_id TEXT ${uuid("designated_workspace_id")},
  designated_account_id TEXT ${uuid("designated_account_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  CHECK ((designated_user_id IS NULL) = (designated_workspace_id IS NULL)
    AND (designated_user_id IS NULL) = (designated_account_id IS NULL)),
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (designated_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (designated_workspace_id, designated_account_id)
    REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE level_analysis_user_allowance_cycles (
  allowance_cycle_id TEXT PRIMARY KEY ${uuid("allowance_cycle_id")},
  user_id TEXT NOT NULL ${uuid("user_id")},
  starts_on_new_york_date TEXT NOT NULL CHECK (length(starts_on_new_york_date) = 10),
  ends_on_new_york_date TEXT NOT NULL CHECK (length(ends_on_new_york_date) = 10),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  CHECK (ends_on_new_york_date >= starts_on_new_york_date),
  UNIQUE (user_id, starts_on_new_york_date),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_user_allowance_cycles_current
  ON level_analysis_user_allowance_cycles(user_id, ends_on_new_york_date DESC);

CREATE TABLE level_analysis_user_allowance_overrides (
  user_id TEXT PRIMARY KEY ${uuid("user_id")},
  daily_limit INTEGER CHECK (daily_limit IS NULL OR daily_limit >= 0),
  period_limit INTEGER CHECK (period_limit IS NULL OR period_limit >= 0),
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  CHECK (daily_limit IS NOT NULL OR period_limit IS NOT NULL),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE level_analysis_user_allowance_resets (
  allowance_reset_id TEXT PRIMARY KEY ${uuid("allowance_reset_id")},
  user_id TEXT NOT NULL ${uuid("user_id")},
  reset_kind TEXT NOT NULL CHECK (reset_kind IN ('daily', 'period')),
  effective_new_york_date TEXT NOT NULL CHECK (length(effective_new_york_date) = 10),
  allowance_cycle_id TEXT ${uuid("allowance_cycle_id")},
  reset_by_user_id TEXT NOT NULL ${uuid("reset_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (reset_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (allowance_cycle_id) REFERENCES level_analysis_user_allowance_cycles(allowance_cycle_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_user_allowance_resets_lookup
  ON level_analysis_user_allowance_resets(user_id, reset_kind, created_at_utc DESC);

CREATE TABLE level_analysis_shared_analyzer_admin_events (
  analyzer_admin_event_id TEXT PRIMARY KEY ${uuid("analyzer_admin_event_id")},
  actor_user_id TEXT NOT NULL ${uuid("actor_user_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN ('settings_saved', 'override_saved', 'override_removed', 'usage_reset')),
  target_user_id TEXT ${uuid("target_user_id")},
  details_json TEXT NOT NULL CHECK (json_valid(details_json) AND json_type(details_json) = 'object'),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (target_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_daily_analyses (
  logical_trade_analysis_id TEXT PRIMARY KEY ${uuid("logical_trade_analysis_id")},
  user_id TEXT NOT NULL ${uuid("user_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  logical_trade_version_id TEXT NOT NULL ${uuid("logical_trade_version_id")},
  current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'correction_required', 'no_coverage', 'provider_unavailable', 'expired', 'stale')),
  market_session_set_version_id TEXT ${uuid("market_session_set_version_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    REFERENCES journal_logical_trade_versions(workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_version_id)
    REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_daily_analysis_versions (
  logical_trade_analysis_version_id TEXT PRIMARY KEY ${uuid("logical_trade_analysis_version_id")},
  logical_trade_analysis_id TEXT NOT NULL ${uuid("logical_trade_analysis_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  logical_trade_version_id TEXT NOT NULL ${uuid("logical_trade_version_id")},
  market_session_set_version_id TEXT ${uuid("market_session_set_version_id")},
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'correction_required', 'no_coverage', 'provider_unavailable', 'expired', 'stale')),
  analyzer_contract_version TEXT NOT NULL CHECK (analyzer_contract_version = 'logical_trade_analyzer_v1'),
  result_json TEXT CHECK (result_json IS NULL OR (json_valid(result_json) AND json_type(result_json) = 'object')),
  evidence_candles_json TEXT CHECK (evidence_candles_json IS NULL OR (json_valid(evidence_candles_json) AND json_type(evidence_candles_json) = 'array')),
  execution_mismatches_json TEXT CHECK (execution_mismatches_json IS NULL OR (json_valid(execution_mismatches_json) AND json_type(execution_mismatches_json) = 'array')),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  CHECK ((status = 'ready' AND result_json IS NOT NULL) OR (status <> 'ready')),
  UNIQUE (logical_trade_analysis_id, revision_number),
  FOREIGN KEY (logical_trade_analysis_id) REFERENCES journal_logical_trade_daily_analyses(logical_trade_analysis_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_version_id) REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE level_analysis_logical_trade_jobs (
  logical_trade_job_id TEXT PRIMARY KEY ${uuid("logical_trade_job_id")},
  user_id TEXT NOT NULL ${uuid("user_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  logical_trade_version_id TEXT NOT NULL ${uuid("logical_trade_version_id")},
  market_session_set_id TEXT NOT NULL ${uuid("market_session_set_id")},
  desired_coverage_end_utc TEXT NOT NULL ${utc("desired_coverage_end_utc")},
  next_attempt_at_utc TEXT NOT NULL ${utc("next_attempt_at_utc")},
  status TEXT NOT NULL CHECK (status IN ('queued', 'leased', 'completed', 'no_coverage', 'provider_unavailable', 'expired')),
  attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0),
  lease_expires_at_utc TEXT ${utc("lease_expires_at_utc")},
  completed_at_utc TEXT ${utc("completed_at_utc")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_version_id, desired_coverage_end_utc),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    REFERENCES journal_logical_trade_versions(workspace_id, account_id, logical_trade_id, logical_trade_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_id) REFERENCES level_analysis_market_session_sets(market_session_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_logical_trade_jobs_available
  ON level_analysis_logical_trade_jobs(status, next_attempt_at_utc, lease_expires_at_utc, created_at_utc);

CREATE TABLE level_analysis_analyzer_reservations (
  reservation_id TEXT PRIMARY KEY ${uuid("reservation_id")},
  user_id TEXT NOT NULL ${uuid("user_id")},
  logical_trade_job_id TEXT NOT NULL ${uuid("logical_trade_job_id")},
  allowance_cycle_id TEXT NOT NULL ${uuid("allowance_cycle_id")},
  daily_new_york_date TEXT NOT NULL CHECK (length(daily_new_york_date) = 10),
  status TEXT NOT NULL CHECK (status IN ('active', 'released', 'consumed')),
  correction_waiver INTEGER NOT NULL CHECK (correction_waiver IN (0, 1)),
  expires_at_utc TEXT NOT NULL ${utc("expires_at_utc")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE (logical_trade_job_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (logical_trade_job_id) REFERENCES level_analysis_logical_trade_jobs(logical_trade_job_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (allowance_cycle_id) REFERENCES level_analysis_user_allowance_cycles(allowance_cycle_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_analyzer_reservations_balance
  ON level_analysis_analyzer_reservations(user_id, status, daily_new_york_date, allowance_cycle_id);

CREATE TABLE level_analysis_analyzer_acquisitions (
  acquisition_id TEXT PRIMARY KEY ${uuid("acquisition_id")},
  market_session_set_id TEXT NOT NULL ${uuid("market_session_set_id")},
  charged_user_id TEXT ${uuid("charged_user_id")},
  reservation_id TEXT ${uuid("reservation_id")},
  charge_kind TEXT NOT NULL CHECK (charge_kind IN ('user_charged', 'correction_waived')),
  started_at_utc TEXT NOT NULL ${utc("started_at_utc")},
  completed_at_utc TEXT ${utc("completed_at_utc")},
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('ready', 'no_coverage', 'provider_unavailable')),
  FOREIGN KEY (market_session_set_id) REFERENCES level_analysis_market_session_sets(market_session_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (charged_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (reservation_id) REFERENCES level_analysis_analyzer_reservations(reservation_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_analyzer_acquisitions_usage
  ON level_analysis_analyzer_acquisitions(started_at_utc, charged_user_id, charge_kind);

CREATE TABLE level_analysis_analyzer_correction_opportunities (
  correction_opportunity_id TEXT PRIMARY KEY ${uuid("correction_opportunity_id")},
  acquisition_id TEXT NOT NULL ${uuid("acquisition_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  source_logical_trade_version_id TEXT NOT NULL ${uuid("source_logical_trade_version_id")},
  status TEXT NOT NULL CHECK (status IN ('available', 'claimed')),
  claimed_logical_trade_job_id TEXT ${uuid("claimed_logical_trade_job_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  claimed_at_utc TEXT ${utc("claimed_at_utc")},
  UNIQUE (acquisition_id),
  FOREIGN KEY (acquisition_id) REFERENCES level_analysis_analyzer_acquisitions(acquisition_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (claimed_logical_trade_job_id) REFERENCES level_analysis_logical_trade_jobs(logical_trade_job_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_notes (
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  technical_note_text TEXT NOT NULL DEFAULT '' CHECK (length(technical_note_text) <= 20000),
  note_text TEXT NOT NULL CHECK (length(note_text) <= 20000),
  revision INTEGER NOT NULL CHECK (revision > 0),
  authored_by_user_id TEXT NOT NULL ${uuid("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  PRIMARY KEY (workspace_id, account_id, logical_trade_id),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_note_events (
  logical_trade_note_event_id TEXT PRIMARY KEY ${uuid("logical_trade_note_event_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  technical_note_text TEXT NOT NULL DEFAULT '' CHECK (length(technical_note_text) <= 20000),
  note_text TEXT NOT NULL CHECK (length(note_text) <= 20000),
  authored_by_user_id TEXT NOT NULL ${uuid("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id, revision_number),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_tag_assignments (
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  tag_id TEXT NOT NULL ${uuid("tag_id")},
  assignment_state TEXT NOT NULL CHECK (assignment_state IN ('assigned', 'removed')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  PRIMARY KEY (workspace_id, account_id, logical_trade_id, tag_id),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_id) REFERENCES journal_tags(workspace_id, account_id, tag_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_rule_reviews (
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  rule_id TEXT NOT NULL ${uuid("rule_id")},
  rule_version_id TEXT NOT NULL ${uuid("rule_version_id")},
  status TEXT NOT NULL CHECK (status IN ('followed', 'broken', 'not_reviewed')),
  note_text TEXT NOT NULL DEFAULT '' CHECK (length(note_text) <= 4000),
  revision INTEGER NOT NULL CHECK (revision > 0),
  reviewed_by_user_id TEXT NOT NULL ${uuid("reviewed_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  PRIMARY KEY (workspace_id, account_id, logical_trade_id, rule_id),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, rule_id, rule_version_id) REFERENCES journal_rule_versions(workspace_id, account_id, rule_id, rule_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_tag_assignment_events (
  logical_trade_tag_assignment_event_id TEXT PRIMARY KEY ${uuid("logical_trade_tag_assignment_event_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  tag_id TEXT NOT NULL ${uuid("tag_id")},
  assignment_state TEXT NOT NULL CHECK (assignment_state IN ('assigned', 'removed')),
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id, tag_id, revision_number),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, tag_id) REFERENCES journal_tags(workspace_id, account_id, tag_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_logical_trade_rule_review_events (
  logical_trade_rule_review_event_id TEXT PRIMARY KEY ${uuid("logical_trade_rule_review_event_id")},
  workspace_id TEXT NOT NULL ${uuid("workspace_id")},
  account_id TEXT NOT NULL ${uuid("account_id")},
  logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
  rule_id TEXT NOT NULL ${uuid("rule_id")},
  rule_version_id TEXT NOT NULL ${uuid("rule_version_id")},
  status TEXT NOT NULL CHECK (status IN ('followed', 'broken', 'not_reviewed')),
  note_text TEXT NOT NULL DEFAULT '' CHECK (length(note_text) <= 4000),
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  reviewed_by_user_id TEXT NOT NULL ${uuid("reviewed_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  UNIQUE (workspace_id, account_id, logical_trade_id, rule_id, revision_number),
  FOREIGN KEY (workspace_id, account_id, logical_trade_id) REFERENCES journal_logical_trades(workspace_id, account_id, logical_trade_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, rule_id, rule_version_id) REFERENCES journal_rule_versions(workspace_id, account_id, rule_id, rule_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER journal_logical_trade_daily_analysis_versions_no_update BEFORE UPDATE ON journal_logical_trade_daily_analysis_versions BEGIN SELECT RAISE(ABORT, 'logical_trade_analysis_version_immutable'); END;
CREATE TRIGGER journal_logical_trade_daily_analysis_versions_no_delete BEFORE DELETE ON journal_logical_trade_daily_analysis_versions BEGIN SELECT RAISE(ABORT, 'logical_trade_analysis_history_required'); END;
CREATE TRIGGER level_analysis_logical_trade_jobs_no_delete BEFORE DELETE ON level_analysis_logical_trade_jobs BEGIN SELECT RAISE(ABORT, 'logical_trade_job_history_required'); END;
CREATE TRIGGER level_analysis_analyzer_acquisitions_no_delete BEFORE DELETE ON level_analysis_analyzer_acquisitions BEGIN SELECT RAISE(ABORT, 'analyzer_acquisition_history_required'); END;`;

export const sharedTradeAnalyzerBetaMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0119_shared_trade_analyzer_beta",
  executionOrder: 119,
  statements: Object.freeze([sql]),
});
