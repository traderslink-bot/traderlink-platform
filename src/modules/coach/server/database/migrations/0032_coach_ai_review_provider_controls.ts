import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const positiveDecimal = (column: string, maximumLength = 32): string => `(${column} IS NULL OR (length(${column}) BETWEEN 1 AND ${maximumLength} AND ${column} NOT GLOB '*[^0-9.]*' AND ${column} NOT GLOB '*.*.*' AND CAST(${column} AS REAL) > 0))`;

const sql = `DROP TRIGGER coach_ai_chat_provider_settings_enabled_price_guard;
DROP TRIGGER coach_ai_feature_controls_enable_guard;
DROP TRIGGER coach_ai_feature_controls_update_guard;

CREATE TABLE coach_ai_review_generation_control_reservations (
  coach_ai_review_generation_control_reservation_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_control_reservation_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_review_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  feature_key TEXT NOT NULL CHECK (feature_key IN ('weekly_reviews', 'monthly_reviews')),
  eastern_calendar_date TEXT NOT NULL CHECK (length(eastern_calendar_date) = 10 AND eastern_calendar_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_cost_usd_per_million_tokens TEXT CHECK (${positiveDecimal("input_cost_usd_per_million_tokens", 24)}),
  output_cost_usd_per_million_tokens TEXT CHECK (${positiveDecimal("output_cost_usd_per_million_tokens", 24)}),
  reserved_max_input_tokens INTEGER NOT NULL CHECK (reserved_max_input_tokens > 0),
  reserved_max_output_tokens INTEGER NOT NULL CHECK (reserved_max_output_tokens > 0),
  reserved_max_total_tokens INTEGER NOT NULL CHECK (reserved_max_total_tokens = reserved_max_input_tokens + reserved_max_output_tokens),
  reserved_maximum_cost_usd TEXT CHECK (${positiveDecimal("reserved_maximum_cost_usd")} ),
  state TEXT NOT NULL CHECK (state IN ('reserved', 'started', 'completed', 'failed', 'blocked')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  reserved_at_utc TEXT NOT NULL ${utcCheck("reserved_at_utc")},
  started_at_utc TEXT ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND reserved_maximum_cost_usd IS NULL) OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND reserved_maximum_cost_usd IS NOT NULL)),
  CHECK (state = 'blocked' OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND reserved_maximum_cost_usd IS NOT NULL)),
  CHECK ((state = 'reserved' AND failure_code IS NULL AND started_at_utc IS NULL AND finalized_at_utc IS NULL) OR (state = 'started' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NULL) OR (state = 'completed' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'failed' AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'blocked' AND failure_code IS NOT NULL AND started_at_utc IS NULL AND finalized_at_utc IS NOT NULL)),
  FOREIGN KEY (coach_ai_review_generation_attempt_id) REFERENCES coach_ai_review_generation_attempts(coach_ai_review_generation_attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_generation_control_reservations_daily_account ON coach_ai_review_generation_control_reservations(account_id, eastern_calendar_date, feature_key, state);
CREATE INDEX coach_ai_review_generation_control_reservations_daily_platform ON coach_ai_review_generation_control_reservations(eastern_calendar_date, feature_key, state);

CREATE TRIGGER coach_ai_chat_provider_settings_enabled_price_guard BEFORE UPDATE ON coach_ai_chat_provider_settings
WHEN (NEW.input_cost_usd_per_million_tokens IS NULL OR NEW.output_cost_usd_per_million_tokens IS NULL) AND EXISTS (SELECT 1 FROM coach_ai_feature_controls WHERE feature_key IN ('ai_chat', 'daily_companion') AND scope_kind = 'platform' AND enabled = 1)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_provider_prices_required'); END;

CREATE TRIGGER coach_ai_provider_settings_enabled_price_guard BEFORE UPDATE ON coach_ai_provider_settings
WHEN (NEW.input_cost_usd_per_million_tokens IS NULL OR NEW.output_cost_usd_per_million_tokens IS NULL) AND EXISTS (SELECT 1 FROM coach_ai_feature_controls WHERE feature_key IN ('weekly_reviews', 'monthly_reviews') AND scope_kind = 'platform' AND enabled = 1)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_prices_required'); END;

CREATE TRIGGER coach_ai_feature_controls_enable_guard BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.enabled = 1 AND (NEW.daily_request_cap IS NULL OR NEW.daily_token_cap IS NULL OR NEW.daily_estimated_spend_cap_usd IS NULL OR (NEW.scope_kind = 'platform' AND ((NEW.feature_key IN ('ai_chat', 'daily_companion') AND NOT EXISTS (SELECT 1 FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)) OR (NEW.feature_key IN ('weekly_reviews', 'monthly_reviews') AND NOT EXISTS (SELECT 1 FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)))) OR (NEW.scope_kind = 'account' AND NOT EXISTS (SELECT 1 FROM coach_ai_feature_controls platform WHERE platform.feature_key = NEW.feature_key AND platform.scope_kind = 'platform' AND platform.enabled = 1 AND platform.daily_request_cap IS NOT NULL AND platform.daily_token_cap IS NOT NULL AND platform.daily_estimated_spend_cap_usd IS NOT NULL)))
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_caps_required'); END;

CREATE TRIGGER coach_ai_feature_controls_update_guard BEFORE UPDATE ON coach_ai_feature_controls
WHEN NEW.coach_ai_feature_control_id <> OLD.coach_ai_feature_control_id OR NEW.feature_key <> OLD.feature_key OR NEW.scope_kind <> OLD.scope_kind OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id OR NEW.account_id IS NOT OLD.account_id OR (NEW.enabled = 1 AND (NEW.daily_request_cap IS NULL OR NEW.daily_token_cap IS NULL OR NEW.daily_estimated_spend_cap_usd IS NULL OR (NEW.scope_kind = 'platform' AND ((NEW.feature_key IN ('ai_chat', 'daily_companion') AND NOT EXISTS (SELECT 1 FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)) OR (NEW.feature_key IN ('weekly_reviews', 'monthly_reviews') AND NOT EXISTS (SELECT 1 FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)))) OR (NEW.scope_kind = 'account' AND NOT EXISTS (SELECT 1 FROM coach_ai_feature_controls platform WHERE platform.feature_key = NEW.feature_key AND platform.scope_kind = 'platform' AND platform.enabled = 1 AND platform.daily_request_cap IS NOT NULL AND platform.daily_token_cap IS NOT NULL AND platform.daily_estimated_spend_cap_usd IS NOT NULL))))
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_scope BEFORE INSERT ON coach_ai_review_generation_control_reservations
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_review_generation_attempts attempt WHERE attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id AND attempt.user_id = NEW.user_id AND attempt.workspace_id = NEW.workspace_id AND attempt.account_id = NEW.account_id AND attempt.state = 'pending' AND ((NEW.feature_key = 'weekly_reviews' AND attempt.review_kind = 'weekly') OR (NEW.feature_key = 'monthly_reviews' AND attempt.review_kind = 'monthly')))
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_scope_required'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_no_delete BEFORE DELETE ON coach_ai_review_generation_control_reservations BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_history_required'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_update_guard BEFORE UPDATE ON coach_ai_review_generation_control_reservations
WHEN NEW.coach_ai_review_generation_control_reservation_id <> OLD.coach_ai_review_generation_control_reservation_id OR NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.feature_key <> OLD.feature_key OR NEW.eastern_calendar_date <> OLD.eastern_calendar_date OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id OR NEW.input_cost_usd_per_million_tokens <> OLD.input_cost_usd_per_million_tokens OR NEW.output_cost_usd_per_million_tokens <> OLD.output_cost_usd_per_million_tokens OR NEW.reserved_max_input_tokens <> OLD.reserved_max_input_tokens OR NEW.reserved_max_output_tokens <> OLD.reserved_max_output_tokens OR NEW.reserved_max_total_tokens <> OLD.reserved_max_total_tokens OR NEW.reserved_maximum_cost_usd <> OLD.reserved_maximum_cost_usd OR NEW.reserved_at_utc <> OLD.reserved_at_utc OR (OLD.state = 'reserved' AND NOT ((NEW.state = 'started' AND NEW.failure_code IS NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NULL) OR (NEW.state IN ('failed', 'blocked') AND NEW.failure_code IS NOT NULL AND NEW.started_at_utc IS NULL AND NEW.finalized_at_utc IS NOT NULL))) OR (OLD.state = 'started' AND NOT ((NEW.state = 'completed' AND NEW.failure_code IS NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL) OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL))) OR OLD.state IN ('completed', 'failed', 'blocked')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;`;

export const coachAiReviewProviderControlsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0032_coach_ai_review_provider_controls",
  executionOrder: 32,
  statements: Object.freeze([sql]),
});
