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

const sql = `DROP TRIGGER coach_ai_provider_settings_enabled_price_guard;
DROP TRIGGER coach_ai_feature_controls_enable_guard;
DROP TRIGGER coach_ai_feature_controls_update_guard;
DROP TRIGGER coach_ai_review_generation_control_reservations_update_guard;
DROP TRIGGER coach_ai_review_generation_control_reservations_v2_update_guard;

ALTER TABLE coach_ai_provider_settings
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_control_reservations
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_control_reservations_v2
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_attempt_receipts
ADD COLUMN cached_input_tokens INTEGER
  CHECK (cached_input_tokens IS NULL OR cached_input_tokens >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cached_input_cost_usd_per_million_tokens")};

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN cached_input_tokens INTEGER
  CHECK (cached_input_tokens IS NULL OR cached_input_tokens >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN cached_input_cost_usd_per_million_tokens TEXT
  ${nullableMoneyRate("cached_input_cost_usd_per_million_tokens")};

CREATE TRIGGER coach_ai_provider_settings_enabled_price_guard
BEFORE UPDATE ON coach_ai_provider_settings
WHEN (
  NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
) AND EXISTS (
  SELECT 1 FROM coach_ai_feature_controls
  WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
    AND scope_kind = 'platform' AND enabled = 1
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_prices_required'); END;

CREATE TRIGGER coach_ai_feature_controls_enable_guard
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.enabled = 1 AND (
  NEW.daily_request_cap IS NULL
  OR NEW.daily_token_cap IS NULL
  OR NEW.daily_estimated_spend_cap_usd IS NULL
  OR (
    NEW.scope_kind = 'platform' AND (
      (
        NEW.feature_key IN ('ai_chat', 'daily_companion')
        AND NOT EXISTS (
          SELECT 1 FROM coach_ai_chat_provider_settings
          WHERE settings_key = 'ai_chat'
            AND input_cost_usd_per_million_tokens IS NOT NULL
            AND output_cost_usd_per_million_tokens IS NOT NULL
        )
      )
      OR (
        NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
        AND NOT EXISTS (
          SELECT 1 FROM coach_ai_provider_settings
          WHERE settings_key = 'coach_reviews'
            AND input_cost_usd_per_million_tokens IS NOT NULL
            AND cached_input_cost_usd_per_million_tokens IS NOT NULL
            AND output_cost_usd_per_million_tokens IS NOT NULL
        )
      )
    )
  )
  OR (
    NEW.scope_kind = 'account' AND NOT EXISTS (
      SELECT 1 FROM coach_ai_feature_controls platform
      WHERE platform.feature_key = NEW.feature_key
        AND platform.scope_kind = 'platform'
        AND platform.enabled = 1
        AND platform.daily_request_cap IS NOT NULL
        AND platform.daily_token_cap IS NOT NULL
        AND platform.daily_estimated_spend_cap_usd IS NOT NULL
    )
  )
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_caps_required'); END;

CREATE TRIGGER coach_ai_feature_controls_update_guard
BEFORE UPDATE ON coach_ai_feature_controls
WHEN NEW.coach_ai_feature_control_id <> OLD.coach_ai_feature_control_id
  OR NEW.feature_key <> OLD.feature_key
  OR NEW.scope_kind <> OLD.scope_kind
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR (NEW.enabled = 1 AND (
    NEW.daily_request_cap IS NULL
    OR NEW.daily_token_cap IS NULL
    OR NEW.daily_estimated_spend_cap_usd IS NULL
    OR (
      NEW.scope_kind = 'platform' AND (
        (
          NEW.feature_key IN ('ai_chat', 'daily_companion')
          AND NOT EXISTS (
            SELECT 1 FROM coach_ai_chat_provider_settings
            WHERE settings_key = 'ai_chat'
              AND input_cost_usd_per_million_tokens IS NOT NULL
              AND output_cost_usd_per_million_tokens IS NOT NULL
          )
        )
        OR (
          NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
          AND NOT EXISTS (
            SELECT 1 FROM coach_ai_provider_settings
            WHERE settings_key = 'coach_reviews'
              AND input_cost_usd_per_million_tokens IS NOT NULL
              AND cached_input_cost_usd_per_million_tokens IS NOT NULL
              AND output_cost_usd_per_million_tokens IS NOT NULL
          )
        )
      )
    )
    OR (
      NEW.scope_kind = 'account' AND NOT EXISTS (
        SELECT 1 FROM coach_ai_feature_controls platform
        WHERE platform.feature_key = NEW.feature_key
          AND platform.scope_kind = 'platform'
          AND platform.enabled = 1
          AND platform.daily_request_cap IS NOT NULL
          AND platform.daily_token_cap IS NOT NULL
          AND platform.daily_estimated_spend_cap_usd IS NOT NULL
      )
    )
  ))
BEGIN SELECT RAISE(ABORT, 'coach_ai_feature_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_update_guard
BEFORE UPDATE ON coach_ai_review_generation_control_reservations
WHEN NEW.coach_ai_review_generation_control_reservation_id <> OLD.coach_ai_review_generation_control_reservation_id
  OR NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id
  OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id
  OR NEW.account_id <> OLD.account_id OR NEW.feature_key <> OLD.feature_key
  OR NEW.eastern_calendar_date <> OLD.eastern_calendar_date
  OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id
  OR NEW.input_cost_usd_per_million_tokens IS NOT OLD.input_cost_usd_per_million_tokens
  OR NEW.cached_input_cost_usd_per_million_tokens IS NOT OLD.cached_input_cost_usd_per_million_tokens
  OR NEW.output_cost_usd_per_million_tokens IS NOT OLD.output_cost_usd_per_million_tokens
  OR NEW.reserved_max_input_tokens <> OLD.reserved_max_input_tokens
  OR NEW.reserved_max_output_tokens <> OLD.reserved_max_output_tokens
  OR NEW.reserved_max_total_tokens <> OLD.reserved_max_total_tokens
  OR NEW.reserved_maximum_cost_usd IS NOT OLD.reserved_maximum_cost_usd
  OR NEW.reserved_at_utc <> OLD.reserved_at_utc
  OR (OLD.state = 'reserved' AND NOT (
    (NEW.state = 'started' AND NEW.failure_code IS NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NULL)
    OR (NEW.state IN ('failed', 'blocked') AND NEW.failure_code IS NOT NULL
      AND NEW.started_at_utc IS NULL AND NEW.finalized_at_utc IS NOT NULL)
  ))
  OR (OLD.state = 'started' AND NOT (
    (NEW.state = 'completed' AND NEW.failure_code IS NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL)
    OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL)
  ))
  OR OLD.state IN ('completed', 'failed', 'blocked')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_update_guard
BEFORE UPDATE ON coach_ai_review_generation_control_reservations_v2
WHEN NEW.coach_ai_review_generation_control_reservation_id <> OLD.coach_ai_review_generation_control_reservation_id
  OR NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id
  OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id
  OR NEW.account_id <> OLD.account_id OR NEW.feature_key <> OLD.feature_key
  OR NEW.eastern_calendar_date <> OLD.eastern_calendar_date
  OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id
  OR NEW.input_cost_usd_per_million_tokens IS NOT OLD.input_cost_usd_per_million_tokens
  OR NEW.cached_input_cost_usd_per_million_tokens IS NOT OLD.cached_input_cost_usd_per_million_tokens
  OR NEW.output_cost_usd_per_million_tokens IS NOT OLD.output_cost_usd_per_million_tokens
  OR NEW.reserved_max_input_tokens <> OLD.reserved_max_input_tokens
  OR NEW.reserved_max_output_tokens <> OLD.reserved_max_output_tokens
  OR NEW.reserved_max_total_tokens <> OLD.reserved_max_total_tokens
  OR NEW.reserved_maximum_cost_usd IS NOT OLD.reserved_maximum_cost_usd
  OR NEW.reserved_at_utc <> OLD.reserved_at_utc
  OR (OLD.state = 'reserved' AND NOT (
    (NEW.state = 'started' AND NEW.failure_code IS NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NULL)
    OR (NEW.state IN ('failed', 'blocked') AND NEW.failure_code IS NOT NULL
      AND NEW.started_at_utc IS NULL AND NEW.finalized_at_utc IS NOT NULL)
  ))
  OR (OLD.state = 'started' AND NOT (
    (NEW.state = 'completed' AND NEW.failure_code IS NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL)
    OR (NEW.state = 'failed' AND NEW.failure_code IS NOT NULL
      AND NEW.started_at_utc IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL)
  ))
  OR OLD.state IN ('completed', 'failed', 'blocked')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_attempt_receipts_cached_usage_guard
BEFORE INSERT ON coach_ai_review_generation_attempt_receipts
WHEN NEW.input_tokens IS NOT NULL AND (
  NEW.cached_input_tokens IS NULL
  OR NEW.cached_input_tokens > NEW.input_tokens
  OR NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
  OR NEW.estimated_cost_usd IS NULL
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_cached_input_usage_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempt_receipts_v2_cached_usage_guard
BEFORE INSERT ON coach_ai_review_generation_attempt_receipts_v2
WHEN NEW.input_tokens IS NOT NULL AND (
  NEW.cached_input_tokens IS NULL
  OR NEW.cached_input_tokens > NEW.input_tokens
  OR NEW.input_cost_usd_per_million_tokens IS NULL
  OR NEW.cached_input_cost_usd_per_million_tokens IS NULL
  OR NEW.output_cost_usd_per_million_tokens IS NULL
  OR NEW.estimated_cost_usd IS NULL
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_cached_input_usage_required'); END;`;

export const coachAiReviewCachedInputPricingMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0046_coach_ai_review_cached_input_pricing",
    executionOrder: 46,
    statements: Object.freeze([sql]),
  });
