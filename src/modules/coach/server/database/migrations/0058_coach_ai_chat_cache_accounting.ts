import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function nullablePositiveRate(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) BETWEEN 1 AND 24
    AND ${column} NOT GLOB '*[^0-9.]*'
    AND ${column} NOT GLOB '*.*.*'
    AND CAST(${column} AS REAL) > 0
  ))`;
}

const sql = `DROP TRIGGER coach_ai_chat_provider_settings_enabled_price_guard;

ALTER TABLE coach_ai_chat_provider_settings
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_chat_provider_settings
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_chat_generation_attempts
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_chat_generation_attempts
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_chat_generation_attempts
ADD COLUMN actual_cached_input_tokens INTEGER
  CHECK (actual_cached_input_tokens IS NULL OR actual_cached_input_tokens >= 0);

ALTER TABLE coach_ai_chat_generation_attempts
ADD COLUMN actual_cache_write_input_tokens INTEGER
  CHECK (actual_cache_write_input_tokens IS NULL OR actual_cache_write_input_tokens >= 0);

ALTER TABLE coach_ai_chat_generation_receipts
ADD COLUMN cached_input_tokens INTEGER
  CHECK (cached_input_tokens IS NULL OR cached_input_tokens >= 0);

ALTER TABLE coach_ai_chat_generation_receipts
ADD COLUMN cache_write_input_tokens INTEGER
  CHECK (cache_write_input_tokens IS NULL OR cache_write_input_tokens >= 0);

ALTER TABLE coach_ai_chat_generation_receipts
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_chat_generation_receipts
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullablePositiveRate("cache_write_input_cost_usd_per_million_tokens")};

CREATE TRIGGER coach_ai_chat_provider_settings_enabled_price_guard
BEFORE UPDATE ON coach_ai_chat_provider_settings
WHEN (
  NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
) AND EXISTS (
  SELECT 1 FROM coach_ai_feature_controls
  WHERE feature_key IN ('ai_chat', 'daily_companion')
    AND scope_kind = 'platform' AND enabled = 1
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_provider_prices_required'); END;

CREATE TRIGGER coach_ai_chat_provider_settings_price_set_guard
BEFORE UPDATE ON coach_ai_chat_provider_settings
WHEN (NEW.input_cost_usd_per_million_tokens IS NULL)
    <> (NEW.cached_input_cost_usd_per_million_tokens IS NULL)
  OR (NEW.input_cost_usd_per_million_tokens IS NULL)
    <> (NEW.cache_write_input_cost_usd_per_million_tokens IS NULL)
  OR (NEW.input_cost_usd_per_million_tokens IS NULL)
    <> (NEW.output_cost_usd_per_million_tokens IS NULL)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_provider_price_set_required'); END;

CREATE TRIGGER coach_ai_feature_controls_chat_cache_insert_guard
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('ai_chat', 'daily_companion')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_chat_provider_settings
    WHERE settings_key = 'ai_chat'
      AND input_cost_usd_per_million_tokens IS NOT NULL
      AND cached_input_cost_usd_per_million_tokens IS NOT NULL
      AND cache_write_input_cost_usd_per_million_tokens IS NOT NULL
      AND output_cost_usd_per_million_tokens IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_caps_required'); END;

CREATE TRIGGER coach_ai_feature_controls_chat_cache_update_guard
BEFORE UPDATE ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('ai_chat', 'daily_companion')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_chat_provider_settings
    WHERE settings_key = 'ai_chat'
      AND input_cost_usd_per_million_tokens IS NOT NULL
      AND cached_input_cost_usd_per_million_tokens IS NOT NULL
      AND cache_write_input_cost_usd_per_million_tokens IS NOT NULL
      AND output_cost_usd_per_million_tokens IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_chat_generation_attempts_cache_insert_guard
BEFORE INSERT ON coach_ai_chat_generation_attempts
WHEN NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_attempt_prices_required'); END;

CREATE TRIGGER coach_ai_chat_generation_attempts_cache_update_guard
BEFORE UPDATE ON coach_ai_chat_generation_attempts
WHEN NEW.cached_input_cost_usd_per_million_tokens
    IS NOT OLD.cached_input_cost_usd_per_million_tokens
  OR NEW.cache_write_input_cost_usd_per_million_tokens
    IS NOT OLD.cache_write_input_cost_usd_per_million_tokens
  OR (NEW.actual_input_tokens IS NULL) <> (NEW.actual_cached_input_tokens IS NULL)
  OR (NEW.actual_input_tokens IS NULL) <> (NEW.actual_cache_write_input_tokens IS NULL)
  OR (NEW.actual_input_tokens IS NOT NULL
    AND NEW.actual_cached_input_tokens + NEW.actual_cache_write_input_tokens
      > NEW.actual_input_tokens)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_attempt_transition_invalid'); END;

CREATE TRIGGER coach_ai_chat_generation_receipts_cache_usage_guard
BEFORE INSERT ON coach_ai_chat_generation_receipts
WHEN (NEW.input_tokens IS NULL AND (
    NEW.cached_input_tokens IS NOT NULL
    OR NEW.cache_write_input_tokens IS NOT NULL
    OR NEW.cached_input_cost_usd_per_million_tokens IS NOT NULL
    OR NEW.cache_write_input_cost_usd_per_million_tokens IS NOT NULL
  )) OR (NEW.input_tokens IS NOT NULL AND (
    NEW.cached_input_tokens IS NULL
    OR NEW.cache_write_input_tokens IS NULL
    OR NEW.cached_input_tokens + NEW.cache_write_input_tokens > NEW.input_tokens
    OR NEW.input_cost_usd_per_million_tokens IS NULL
    OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
    OR NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
    OR NEW.output_cost_usd_per_million_tokens IS NULL
    OR NEW.estimated_cost_usd IS NULL
  ))
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_cache_usage_required'); END;`;

export const coachAiChatCacheAccountingMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0058_coach_ai_chat_cache_accounting",
    executionOrder: 58,
    statements: Object.freeze([sql]),
  });
