import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `UPDATE coach_ai_provider_settings
SET input_cost_usd_per_million_tokens = '0.20',
  cached_input_cost_usd_per_million_tokens = '0.02',
  cache_write_input_cost_usd_per_million_tokens = '0.25',
  output_cost_usd_per_million_tokens = '1.20',
  updated_at_utc = strftime(
    '%Y-%m-%dT%H:%M:%fZ',
    julianday(updated_at_utc) + (1.0 / 86400000.0)
  )
WHERE settings_key = 'coach_reviews'
  AND model_id = 'gpt-5.6-luna'
  AND input_cost_usd_per_million_tokens = '1'
  AND cached_input_cost_usd_per_million_tokens = '0.1'
  AND cache_write_input_cost_usd_per_million_tokens = '1.25'
  AND output_cost_usd_per_million_tokens = '6';`;

export const coachAiReviewLunaPricingRefreshMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0062_coach_ai_review_luna_pricing_refresh",
    executionOrder: 62,
    statements: Object.freeze([sql]),
  });
