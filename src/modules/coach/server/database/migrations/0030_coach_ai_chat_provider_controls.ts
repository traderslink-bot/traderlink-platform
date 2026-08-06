import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const positiveDecimal = (column: string, maximumLength = 32): string => `(${column} IS NULL OR (length(${column}) BETWEEN 1 AND ${maximumLength} AND ${column} NOT GLOB '*[^0-9.]*' AND ${column} NOT GLOB '*.*.*' AND CAST(${column} AS REAL) > 0))`;

const sql = `CREATE TABLE coach_ai_chat_provider_settings (
  settings_key TEXT PRIMARY KEY CHECK (settings_key = 'ai_chat'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_cost_usd_per_million_tokens TEXT CHECK (${positiveDecimal("input_cost_usd_per_million_tokens", 24)}),
  output_cost_usd_per_million_tokens TEXT CHECK (${positiveDecimal("output_cost_usd_per_million_tokens", 24)}),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL) OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL))
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_chat_provider_settings (
  settings_key, provider_key, model_id,
  input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens, updated_at_utc
) SELECT 'ai_chat', provider_key, model_id,
  input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens, updated_at_utc
FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews';

CREATE TABLE coach_ai_feature_controls (
  coach_ai_feature_control_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_feature_control_id")},
  feature_key TEXT NOT NULL CHECK (feature_key IN ('ai_chat', 'daily_companion', 'weekly_reviews', 'monthly_reviews')),
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('platform', 'account')),
  user_id TEXT ${uuidCheck("user_id")},
  workspace_id TEXT ${uuidCheck("workspace_id")},
  account_id TEXT ${uuidCheck("account_id")},
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  daily_request_cap INTEGER CHECK (daily_request_cap IS NULL OR daily_request_cap > 0),
  daily_token_cap INTEGER CHECK (daily_token_cap IS NULL OR daily_token_cap > 0),
  daily_estimated_spend_cap_usd TEXT CHECK (${positiveDecimal("daily_estimated_spend_cap_usd")}),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK ((scope_kind = 'platform' AND user_id IS NULL AND workspace_id IS NULL AND account_id IS NULL) OR (scope_kind = 'account' AND user_id IS NOT NULL AND workspace_id IS NOT NULL AND account_id IS NOT NULL)),
  CHECK ((daily_request_cap IS NULL AND daily_token_cap IS NULL AND daily_estimated_spend_cap_usd IS NULL) OR (daily_request_cap IS NOT NULL AND daily_token_cap IS NOT NULL AND daily_estimated_spend_cap_usd IS NOT NULL)),
  UNIQUE (feature_key, scope_kind, account_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

INSERT INTO coach_ai_feature_controls (
  coach_ai_feature_control_id, feature_key, scope_kind, user_id, workspace_id, account_id,
  enabled, daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
) VALUES
  ('00000000-0000-4000-8000-000000000030', 'ai_chat', 'platform', NULL, NULL, NULL, 0, NULL, NULL, NULL, '2026-08-05T00:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000031', 'daily_companion', 'platform', NULL, NULL, NULL, 0, NULL, NULL, NULL, '2026-08-05T00:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000032', 'weekly_reviews', 'platform', NULL, NULL, NULL, 0, NULL, NULL, NULL, '2026-08-05T00:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000033', 'monthly_reviews', 'platform', NULL, NULL, NULL, 0, NULL, NULL, NULL, '2026-08-05T00:00:00.000Z');

CREATE TABLE coach_ai_chat_generation_attempts (
  coach_ai_chat_generation_attempt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  coach_ai_chat_message_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_message_id")},
  idempotency_sha256 TEXT NOT NULL CHECK (length(idempotency_sha256) = 64 AND idempotency_sha256 = lower(idempotency_sha256) AND idempotency_sha256 NOT GLOB '*[^0-9a-f]*'),
  eastern_calendar_date TEXT NOT NULL CHECK (length(eastern_calendar_date) = 10 AND eastern_calendar_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_cost_usd_per_million_tokens TEXT NOT NULL CHECK (${positiveDecimal("input_cost_usd_per_million_tokens", 24)}),
  output_cost_usd_per_million_tokens TEXT NOT NULL CHECK (${positiveDecimal("output_cost_usd_per_million_tokens", 24)}),
  reserved_max_input_tokens INTEGER NOT NULL CHECK (reserved_max_input_tokens > 0),
  reserved_max_output_tokens INTEGER NOT NULL CHECK (reserved_max_output_tokens > 0),
  reserved_max_total_tokens INTEGER NOT NULL CHECK (reserved_max_total_tokens = reserved_max_input_tokens + reserved_max_output_tokens),
  reserved_maximum_cost_usd TEXT NOT NULL CHECK (${positiveDecimal("reserved_maximum_cost_usd")} ),
  state TEXT NOT NULL CHECK (state IN ('reserved', 'started', 'completed', 'failed', 'blocked')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  actual_input_tokens INTEGER CHECK (actual_input_tokens IS NULL OR actual_input_tokens >= 0),
  actual_output_tokens INTEGER CHECK (actual_output_tokens IS NULL OR actual_output_tokens >= 0),
  actual_total_tokens INTEGER CHECK (actual_total_tokens IS NULL OR actual_total_tokens = actual_input_tokens + actual_output_tokens),
  actual_cost_usd TEXT CHECK (actual_cost_usd IS NULL OR (length(actual_cost_usd) BETWEEN 1 AND 32 AND actual_cost_usd NOT GLOB '*[^0-9.]*' AND actual_cost_usd NOT GLOB '*.*.*' AND CAST(actual_cost_usd AS REAL) >= 0)),
  reserved_at_utc TEXT NOT NULL ${utcCheck("reserved_at_utc")},
  started_at_utc TEXT ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((actual_input_tokens IS NULL AND actual_output_tokens IS NULL AND actual_total_tokens IS NULL AND actual_cost_usd IS NULL) OR (actual_input_tokens IS NOT NULL AND actual_output_tokens IS NOT NULL AND actual_total_tokens IS NOT NULL AND actual_cost_usd IS NOT NULL)),
  CHECK ((state = 'reserved' AND failure_code IS NULL AND started_at_utc IS NULL AND finalized_at_utc IS NULL) OR (state = 'started' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NULL) OR (state = 'completed' AND failure_code IS NULL AND started_at_utc IS NOT NULL AND finalized_at_utc IS NOT NULL AND actual_total_tokens IS NOT NULL) OR (state = 'failed' AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL) OR (state = 'blocked' AND failure_code IS NOT NULL AND started_at_utc IS NULL AND finalized_at_utc IS NOT NULL AND actual_total_tokens IS NULL)),
  UNIQUE (coach_ai_chat_message_id),
  UNIQUE (account_id, idempotency_sha256),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_chat_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX coach_ai_feature_controls_platform_unique ON coach_ai_feature_controls(feature_key) WHERE scope_kind = 'platform';
CREATE UNIQUE INDEX coach_ai_feature_controls_account_unique ON coach_ai_feature_controls(feature_key, account_id) WHERE scope_kind = 'account';
CREATE INDEX coach_ai_chat_generation_attempts_daily_account ON coach_ai_chat_generation_attempts(account_id, eastern_calendar_date, state);
CREATE INDEX coach_ai_chat_generation_attempts_daily_platform ON coach_ai_chat_generation_attempts(eastern_calendar_date, state);

CREATE TRIGGER coach_ai_chat_provider_settings_no_delete BEFORE DELETE ON coach_ai_chat_provider_settings BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_provider_settings_required'); END;
CREATE TRIGGER coach_ai_chat_provider_settings_enabled_price_guard BEFORE UPDATE ON coach_ai_chat_provider_settings
WHEN (NEW.input_cost_usd_per_million_tokens IS NULL OR NEW.output_cost_usd_per_million_tokens IS NULL) AND EXISTS (SELECT 1 FROM coach_ai_feature_controls WHERE feature_key = 'ai_chat' AND scope_kind = 'platform' AND enabled = 1)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_provider_prices_required'); END;
CREATE TRIGGER coach_ai_feature_controls_scope BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.scope_kind = 'account' AND NOT EXISTS (SELECT 1 FROM journal_accounts account JOIN platform_workspace_memberships membership ON membership.workspace_id = NEW.workspace_id AND membership.user_id = NEW.user_id AND membership.status = 'active' WHERE account.account_id = NEW.account_id AND account.workspace_id = NEW.workspace_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_scope_required'); END;
CREATE TRIGGER coach_ai_feature_controls_enable_guard BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.enabled = 1 AND (NEW.daily_request_cap IS NULL OR NEW.daily_token_cap IS NULL OR NEW.daily_estimated_spend_cap_usd IS NULL OR (NEW.scope_kind = 'platform' AND NOT EXISTS (SELECT 1 FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)) OR (NEW.scope_kind = 'account' AND NOT EXISTS (SELECT 1 FROM coach_ai_feature_controls platform WHERE platform.feature_key = NEW.feature_key AND platform.scope_kind = 'platform' AND platform.enabled = 1 AND platform.daily_request_cap IS NOT NULL AND platform.daily_token_cap IS NOT NULL AND platform.daily_estimated_spend_cap_usd IS NOT NULL)))
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_caps_required'); END;
CREATE TRIGGER coach_ai_feature_controls_no_delete BEFORE DELETE ON coach_ai_feature_controls BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_controls_required'); END;
CREATE TRIGGER coach_ai_feature_controls_update_guard BEFORE UPDATE ON coach_ai_feature_controls
WHEN NEW.coach_ai_feature_control_id <> OLD.coach_ai_feature_control_id OR NEW.feature_key <> OLD.feature_key OR NEW.scope_kind <> OLD.scope_kind OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id OR NEW.account_id IS NOT OLD.account_id OR (NEW.enabled = 1 AND (NEW.daily_request_cap IS NULL OR NEW.daily_token_cap IS NULL OR NEW.daily_estimated_spend_cap_usd IS NULL OR (NEW.scope_kind = 'platform' AND NOT EXISTS (SELECT 1 FROM coach_ai_chat_provider_settings WHERE settings_key = 'ai_chat' AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL)) OR (NEW.scope_kind = 'account' AND NOT EXISTS (SELECT 1 FROM coach_ai_feature_controls platform WHERE platform.feature_key = NEW.feature_key AND platform.scope_kind = 'platform' AND platform.enabled = 1 AND platform.daily_request_cap IS NOT NULL AND platform.daily_token_cap IS NOT NULL AND platform.daily_estimated_spend_cap_usd IS NOT NULL))))
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_chat_generation_attempts_scope BEFORE INSERT ON coach_ai_chat_generation_attempts
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message JOIN coach_ai_chat_conversations conversation ON conversation.coach_ai_chat_conversation_id = message.coach_ai_chat_conversation_id WHERE message.coach_ai_chat_message_id = NEW.coach_ai_chat_message_id AND message.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND message.role = 'assistant' AND message.generation_state = 'pending' AND conversation.user_id = NEW.user_id AND conversation.workspace_id = NEW.workspace_id AND conversation.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_attempt_scope_required'); END;
CREATE TRIGGER coach_ai_chat_generation_attempts_no_delete BEFORE DELETE ON coach_ai_chat_generation_attempts BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_attempt_history_required'); END;
CREATE TRIGGER coach_ai_chat_generation_attempts_update_guard BEFORE UPDATE ON coach_ai_chat_generation_attempts
WHEN NEW.coach_ai_chat_generation_attempt_id <> OLD.coach_ai_chat_generation_attempt_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.coach_ai_chat_message_id <> OLD.coach_ai_chat_message_id OR NEW.idempotency_sha256 <> OLD.idempotency_sha256 OR NEW.eastern_calendar_date <> OLD.eastern_calendar_date OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id OR NEW.input_cost_usd_per_million_tokens <> OLD.input_cost_usd_per_million_tokens OR NEW.output_cost_usd_per_million_tokens <> OLD.output_cost_usd_per_million_tokens OR NEW.reserved_max_input_tokens <> OLD.reserved_max_input_tokens OR NEW.reserved_max_output_tokens <> OLD.reserved_max_output_tokens OR NEW.reserved_max_total_tokens <> OLD.reserved_max_total_tokens OR NEW.reserved_maximum_cost_usd <> OLD.reserved_maximum_cost_usd OR NEW.reserved_at_utc <> OLD.reserved_at_utc OR (OLD.state = 'reserved' AND NOT ((NEW.state = 'started' AND NEW.failure_code IS NULL AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NULL) OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL AND NEW.started_at_utc IS NULL AND NEW.finalized_at_utc IS NOT NULL AND NEW.actual_total_tokens IS NULL))) OR (OLD.state = 'started' AND NOT ((NEW.state = 'completed' AND NEW.failure_code IS NULL AND NEW.finalized_at_utc IS NOT NULL AND NEW.actual_total_tokens IS NOT NULL) OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL))) OR OLD.state IN ('completed', 'failed', 'blocked')
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_attempt_transition_invalid'); END;`;

export const coachAiChatProviderControlsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0030_coach_ai_chat_provider_controls",
  executionOrder: 30,
  statements: Object.freeze([sql]),
});
