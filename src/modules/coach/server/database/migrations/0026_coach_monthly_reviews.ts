import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE coach_review_delivery_settings (
  account_id TEXT PRIMARY KEY ${uuidCheck("account_id")},
  weekly_delivery_day TEXT NOT NULL CHECK (weekly_delivery_day IN ('friday', 'saturday', 'sunday')),
  delivery_time_eastern TEXT NOT NULL CHECK (delivery_time_eastern GLOB '[0-2][0-9]:[0-5][0-9]' AND delivery_time_eastern >= '16:00' AND delivery_time_eastern <= '23:59'),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO coach_review_delivery_settings (
  account_id, weekly_delivery_day, delivery_time_eastern, updated_at_utc
)
SELECT account_id, 'friday', friday_delivery_time_eastern, updated_at_utc
FROM coach_weekly_review_schedules;

CREATE TABLE coach_monthly_review_settings (
  account_id TEXT PRIMARY KEY ${uuidCheck("account_id")},
  enabled_at_utc TEXT NOT NULL ${utcCheck("enabled_at_utc")},
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE coach_monthly_review_requests (
  coach_monthly_review_request_id TEXT PRIMARY KEY ${uuidCheck("coach_monthly_review_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  period_start_date TEXT NOT NULL CHECK (length(period_start_date) = 10 AND period_start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  period_end_date TEXT NOT NULL CHECK (length(period_end_date) = 10 AND period_end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND period_end_date >= period_start_date),
  period_coverage TEXT NOT NULL CHECK (period_coverage IN ('complete_month', 'partial_month')),
  input_contract_version TEXT NOT NULL CHECK (input_contract_version = 'traderlink_coach_monthly_ai_input_v1'),
  input_sha256 TEXT NOT NULL CHECK (length(input_sha256) = 64 AND input_sha256 = lower(input_sha256) AND input_sha256 NOT GLOB '*[^0-9a-f]*'),
  input_json TEXT NOT NULL CHECK (json_valid(input_json) AND json_type(input_json) = 'object'),
  prior_issued_review_id TEXT ${uuidCheck("prior_issued_review_id")},
  state TEXT NOT NULL CHECK (state IN ('pending', 'issued', 'failed')),
  failure_code TEXT,
  issued_review_id TEXT ${uuidCheck("issued_review_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((state = 'pending' AND failure_code IS NULL AND issued_review_id IS NULL AND finalized_at_utc IS NULL) OR (state = 'issued' AND failure_code IS NULL AND issued_review_id IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'failed' AND failure_code IS NOT NULL AND issued_review_id IS NULL AND finalized_at_utc IS NOT NULL)),
  UNIQUE (workspace_id, account_id, period_start_date, period_end_date, input_sha256),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_monthly_review_requests_account_period ON coach_monthly_review_requests(workspace_id, account_id, period_end_date DESC, created_at_utc DESC);

CREATE TABLE coach_monthly_issued_reviews (
  coach_monthly_issued_review_id TEXT PRIMARY KEY ${uuidCheck("coach_monthly_issued_review_id")},
  coach_monthly_review_request_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_monthly_review_request_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct_local'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128),
  output_contract_version TEXT NOT NULL CHECK (output_contract_version = 'traderlink_coach_monthly_ai_output_v1'),
  output_json TEXT NOT NULL CHECK (json_valid(output_json) AND json_type(output_json) = 'object'),
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  issued_at_utc TEXT NOT NULL ${utcCheck("issued_at_utc")},
  FOREIGN KEY (coach_monthly_review_request_id) REFERENCES coach_monthly_review_requests(coach_monthly_review_request_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER coach_monthly_review_requests_no_delete BEFORE DELETE ON coach_monthly_review_requests BEGIN SELECT RAISE(ABORT, 'coach_monthly_review_history_required'); END;
CREATE TRIGGER coach_monthly_review_requests_terminal_immutable BEFORE UPDATE ON coach_monthly_review_requests WHEN OLD.state <> 'pending' BEGIN SELECT RAISE(ABORT, 'coach_monthly_review_request_terminal'); END;
CREATE TRIGGER coach_monthly_review_requests_pending_update_guard BEFORE UPDATE ON coach_monthly_review_requests WHEN OLD.state = 'pending' AND (NEW.coach_monthly_review_request_id <> OLD.coach_monthly_review_request_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.period_start_date <> OLD.period_start_date OR NEW.period_end_date <> OLD.period_end_date OR NEW.period_coverage <> OLD.period_coverage OR NEW.input_contract_version <> OLD.input_contract_version OR NEW.input_sha256 <> OLD.input_sha256 OR NEW.input_json <> OLD.input_json OR NEW.prior_issued_review_id IS NOT OLD.prior_issued_review_id OR NEW.created_at_utc <> OLD.created_at_utc) BEGIN SELECT RAISE(ABORT, 'coach_monthly_review_request_snapshot_immutable'); END;
CREATE TRIGGER coach_monthly_issued_reviews_no_update BEFORE UPDATE ON coach_monthly_issued_reviews BEGIN SELECT RAISE(ABORT, 'coach_monthly_issued_review_immutable'); END;
CREATE TRIGGER coach_monthly_issued_reviews_no_delete BEFORE DELETE ON coach_monthly_issued_reviews BEGIN SELECT RAISE(ABORT, 'coach_monthly_review_history_required'); END;`;

export const coachMonthlyReviewsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0026_coach_monthly_reviews",
  executionOrder: 26,
  statements: Object.freeze([sql]),
});
