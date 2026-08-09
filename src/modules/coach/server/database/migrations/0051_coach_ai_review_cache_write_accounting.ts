import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function nullableMoneyRate(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) BETWEEN 1 AND 24
    AND ${column} NOT GLOB '*[^0-9.]*'
    AND ${column} NOT GLOB '*.*.*'
    AND CAST(${column} AS REAL) >= 0
  ))`;
}

const sql = `ALTER TABLE coach_ai_provider_settings
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_control_reservations
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_control_reservations_v2
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_attempt_receipts
ADD COLUMN cache_write_input_tokens INTEGER
  CHECK (cache_write_input_tokens IS NULL OR cache_write_input_tokens >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cache_write_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN cache_write_input_tokens INTEGER
  CHECK (cache_write_input_tokens IS NULL OR cache_write_input_tokens >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN cache_write_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cache_write_input_cost_usd_per_million_tokens")};

UPDATE coach_ai_provider_settings
SET cache_write_input_cost_usd_per_million_tokens = '1.25'
WHERE settings_key = 'coach_reviews'
  AND model_id = 'gpt-5.6-luna'
  AND input_cost_usd_per_million_tokens = '1'
  AND cached_input_cost_usd_per_million_tokens = '0.1'
  AND output_cost_usd_per_million_tokens = '6';

UPDATE coach_ai_review_budget_controls
SET per_subscriber_paid_cycle_estimated_spend_cap_usd = '2.00',
  updated_at_utc = strftime(
    '%Y-%m-%dT%H:%M:%fZ',
    julianday(updated_at_utc) + (1.0 / 86400000.0)
  )
WHERE control_key = 'ai_reviews'
  AND per_subscriber_paid_cycle_estimated_spend_cap_usd = '1.00';

CREATE TRIGGER coach_ai_provider_settings_cache_write_price_guard
BEFORE UPDATE ON coach_ai_provider_settings
WHEN NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
  AND EXISTS (
    SELECT 1 FROM coach_ai_feature_controls
    WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
      AND scope_kind = 'platform' AND enabled = 1
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_prices_required'); END;

CREATE TRIGGER coach_ai_feature_controls_cache_write_insert_guard
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_provider_settings
    WHERE settings_key = 'coach_reviews'
      AND cache_write_input_cost_usd_per_million_tokens IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_caps_required'); END;

CREATE TRIGGER coach_ai_feature_controls_cache_write_update_guard
BEFORE UPDATE ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_provider_settings
    WHERE settings_key = 'coach_reviews'
      AND cache_write_input_cost_usd_per_million_tokens IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_cache_write_update_guard
BEFORE UPDATE ON coach_ai_review_generation_control_reservations
WHEN NEW.cache_write_input_cost_usd_per_million_tokens
  IS NOT OLD.cache_write_input_cost_usd_per_million_tokens
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_cache_write_update_guard
BEFORE UPDATE ON coach_ai_review_generation_control_reservations_v2
WHEN NEW.cache_write_input_cost_usd_per_million_tokens
  IS NOT OLD.cache_write_input_cost_usd_per_million_tokens
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_attempt_receipts_cache_write_usage_guard
BEFORE INSERT ON coach_ai_review_generation_attempt_receipts
WHEN NEW.input_tokens IS NOT NULL AND (
  NEW.cached_input_tokens IS NULL
  OR NEW.cache_write_input_tokens IS NULL
  OR NEW.cached_input_tokens + NEW.cache_write_input_tokens > NEW.input_tokens
  OR NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
  OR NEW.estimated_cost_usd IS NULL
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_cache_write_usage_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempt_receipts_v2_cache_write_usage_guard
BEFORE INSERT ON coach_ai_review_generation_attempt_receipts_v2
WHEN NEW.input_tokens IS NOT NULL AND (
  NEW.cached_input_tokens IS NULL
  OR NEW.cache_write_input_tokens IS NULL
  OR NEW.cached_input_tokens + NEW.cache_write_input_tokens > NEW.input_tokens
  OR NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.cache_write_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
  OR NEW.estimated_cost_usd IS NULL
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_cache_write_usage_required'); END;`;

export const coachAiReviewCacheWriteAccountingMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0051_coach_ai_review_cache_write_accounting",
    executionOrder: 51,
    statements: Object.freeze([sql]),
  });
