import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `UPDATE coach_ai_chat_provider_settings
SET model_id = 'gpt-5.6-luna',
  input_cost_usd_per_million_tokens = '0.20',
  cached_input_cost_usd_per_million_tokens = '0.02',
  cache_write_input_cost_usd_per_million_tokens = '0.25',
  output_cost_usd_per_million_tokens = '1.20',
  updated_at_utc = strftime(
    '%Y-%m-%dT%H:%M:%fZ',
    julianday(updated_at_utc) + (1.0 / 86400000.0)
  )
WHERE settings_key = 'ai_chat'
  AND model_id = 'gpt-5.6-sol'
  AND input_cost_usd_per_million_tokens IS NULL
  AND cached_input_cost_usd_per_million_tokens IS NULL
  AND cache_write_input_cost_usd_per_million_tokens IS NULL
  AND output_cost_usd_per_million_tokens IS NULL;`;

export const coachAiChatLunaDefaultMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0069_coach_ai_chat_luna_default",
  executionOrder: 69,
  statements: Object.freeze([sql]),
});
