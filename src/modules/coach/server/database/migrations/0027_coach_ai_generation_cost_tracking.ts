import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE coach_ai_provider_settings (
  settings_key TEXT PRIMARY KEY CHECK (settings_key = 'coach_reviews'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_cost_usd_per_million_tokens TEXT CHECK (input_cost_usd_per_million_tokens IS NULL OR (length(input_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND input_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND input_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(input_cost_usd_per_million_tokens AS REAL) >= 0)),
  output_cost_usd_per_million_tokens TEXT CHECK (output_cost_usd_per_million_tokens IS NULL OR (length(output_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND output_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND output_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(output_cost_usd_per_million_tokens AS REAL) >= 0)),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL) OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL))
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_provider_settings (
  settings_key, provider_key, model_id,
  input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens, updated_at_utc
) VALUES ('coach_reviews', 'openai_direct', 'gpt-5.6-sol', NULL, NULL, '2026-08-05T00:00:00.000Z');

CREATE TABLE coach_ai_generation_cost_receipts (
  coach_ai_generation_cost_receipt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_generation_cost_receipt_id")},
  review_kind TEXT NOT NULL CHECK (review_kind IN ('weekly', 'monthly')),
  review_request_id TEXT NOT NULL ${uuidCheck("review_request_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128),
  input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
  total_tokens INTEGER NOT NULL CHECK (total_tokens = input_tokens + output_tokens),
  input_cost_usd_per_million_tokens TEXT,
  output_cost_usd_per_million_tokens TEXT,
  estimated_cost_usd TEXT,
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND estimated_cost_usd IS NULL) OR (input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND estimated_cost_usd IS NOT NULL)),
  UNIQUE (review_kind, review_request_id)
) STRICT;

CREATE INDEX coach_ai_generation_cost_receipts_recorded ON coach_ai_generation_cost_receipts(recorded_at_utc DESC, coach_ai_generation_cost_receipt_id DESC);
CREATE INDEX coach_ai_generation_cost_receipts_model ON coach_ai_generation_cost_receipts(model_id, recorded_at_utc DESC);

CREATE TRIGGER coach_ai_provider_settings_no_delete BEFORE DELETE ON coach_ai_provider_settings BEGIN SELECT RAISE(ABORT, 'coach_ai_provider_settings_required'); END;
CREATE TRIGGER coach_ai_generation_cost_receipts_no_update BEFORE UPDATE ON coach_ai_generation_cost_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_generation_cost_receipt_immutable'); END;
CREATE TRIGGER coach_ai_generation_cost_receipts_no_delete BEFORE DELETE ON coach_ai_generation_cost_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_generation_cost_history_required'); END;`;

export const coachAiGenerationCostTrackingMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0027_coach_ai_generation_cost_tracking",
  executionOrder: 27,
  statements: Object.freeze([sql]),
});
