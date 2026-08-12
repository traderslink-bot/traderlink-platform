import Database from "better-sqlite3";

import { calculateCoachAiReviewEstimatedCost } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import { coachAiReviewCacheWriteAccountingMigration } from
  "@/src/modules/coach/server/database/migrations/0051_coach_ai_review_cache_write_accounting";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";

const BASE = new Date("2026-08-09T20:00:00.000Z");

function hasColumn(
  database: Database.Database,
  table: string,
  column: string,
): boolean {
  return (database.pragma(`table_info(${table})`) as ReadonlyArray<
    Readonly<{ name: string }>
  >).some((candidate) => candidate.name === column);
}

function rejects(operation: () => void, fragment: string): boolean {
  try {
    operation();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(fragment);
  }
}

function main(): void {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    const migrationIndex = platformMigrationManifest.findIndex((migration) =>
      migration.migrationId === coachAiReviewCacheWriteAccountingMigration.migrationId);
    if (migrationIndex < 1) {
      throw new Error("COACH_AI_CACHE_WRITE_MIGRATION_NOT_REGISTERED");
    }
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest.slice(0, migrationIndex),
      now: () => BASE,
    });
    database.prepare(`UPDATE coach_ai_provider_settings SET
  model_id = 'gpt-5.6-luna', input_cost_usd_per_million_tokens = '1',
  cached_input_cost_usd_per_million_tokens = '0.1',
  output_cost_usd_per_million_tokens = '6',
  updated_at_utc = '2026-08-09T20:00:01.000Z'
WHERE settings_key = 'coach_reviews'`).run();
    const beforeBudget = database.prepare<[], Readonly<{
      cap: string;
      updated_at_utc: string;
    }>>(`SELECT per_subscriber_paid_cycle_estimated_spend_cap_usd AS cap,
  updated_at_utc
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    const preservedTables = [
      "journal_executions",
      "coach_ai_review_generation_attempts",
      "coach_ai_review_generation_attempt_receipts",
      "coach_ai_review_period_requests_v2",
      "coach_ai_review_generation_attempts_v2",
      "coach_ai_review_generation_attempt_receipts_v2",
    ] as const;
    const beforeCounts = Object.fromEntries(preservedTables.map((table) => [
      table,
      database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as
        Readonly<{ count: number }>,
    ]));

    for (const statement of coachAiReviewCacheWriteAccountingMigration.statements) {
      database.exec(statement);
    }

    const settings = database.prepare<[], Readonly<{
      cache_write_rate: string | null;
    }>>(`SELECT cache_write_input_cost_usd_per_million_tokens AS cache_write_rate
FROM coach_ai_provider_settings WHERE settings_key = 'coach_reviews'`).get();
    const budget = database.prepare<[], Readonly<{
      cap: string;
      updated_at_utc: string;
    }>>(`SELECT per_subscriber_paid_cycle_estimated_spend_cap_usd AS cap,
  updated_at_utc
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    const columnsPresent = [
      ["coach_ai_provider_settings", "cache_write_input_cost_usd_per_million_tokens"],
      ["coach_ai_review_generation_control_reservations", "cache_write_input_cost_usd_per_million_tokens"],
      ["coach_ai_review_generation_control_reservations_v2", "cache_write_input_cost_usd_per_million_tokens"],
      ["coach_ai_review_generation_attempt_receipts", "cache_write_input_tokens"],
      ["coach_ai_review_generation_attempt_receipts", "cache_write_input_cost_usd_per_million_tokens"],
      ["coach_ai_review_generation_attempt_receipts_v2", "cache_write_input_tokens"],
      ["coach_ai_review_generation_attempt_receipts_v2", "cache_write_input_cost_usd_per_million_tokens"],
    ].every(([table, column]) => hasColumn(database, table!, column!));

    database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 0
WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND scope_kind = 'platform'`).run();
    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '100',
  updated_at_utc = '2026-08-09T20:00:01.000Z'
WHERE control_key = 'ai_reviews'`).run();
    database.prepare(`UPDATE coach_ai_provider_settings SET
  cache_write_input_cost_usd_per_million_tokens = NULL
WHERE settings_key = 'coach_reviews'`).run();
    const cacheWritePriceRequiredToEnable = rejects(() => {
      database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '100',
  updated_at_utc = '2026-08-09T20:00:02.000Z'
WHERE feature_key = 'weekly_reviews' AND scope_kind = 'platform'`).run();
    }, "coach_ai_feature_control_transition_invalid");
    database.prepare(`UPDATE coach_ai_provider_settings SET
  cache_write_input_cost_usd_per_million_tokens = '1.25'
WHERE settings_key = 'coach_reviews'`).run();
    database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '100',
  updated_at_utc = '2026-08-09T20:00:03.000Z'
WHERE feature_key = 'weekly_reviews' AND scope_kind = 'platform'`).run();
    const cacheWritePriceProtectedWhileEnabled = rejects(() => {
      database.prepare(`UPDATE coach_ai_provider_settings SET
  cache_write_input_cost_usd_per_million_tokens = NULL
WHERE settings_key = 'coach_reviews'`).run();
    }, "coach_ai_review_provider_prices_required");
    const incompleteReceiptRejected = rejects(() => {
      database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (
  '10000000-4000-4000-8000-000000000001',
  '10000000-4000-4000-8000-000000000002',
  100, 40, NULL, 20, 120, '1', '0.1', NULL, '6', '0.000164',
  '2026-08-09T20:00:04.000Z'
)`).run();
    }, "coach_ai_review_cache_write_usage_required");
    const overlappingInputBucketsRejected = rejects(() => {
      database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (
  '10000000-4000-4000-8000-000000000003',
  '10000000-4000-4000-8000-000000000004',
  100, 60, 50, 20, 120, '1', '0.1', '1.25', '6', '0.0001885',
  '2026-08-09T20:00:05.000Z'
)`).run();
    }, "coach_ai_review_cache_write_usage_required");

    const exactCost = calculateCoachAiReviewEstimatedCost(Object.freeze({
      inputTokens: 100,
      cachedInputTokens: 40,
      cacheWriteInputTokens: 20,
      outputTokens: 20,
      totalTokens: 120,
    }), Object.freeze({
      providerKey: "openai_direct",
      modelId: "gpt-5.6-luna",
      inputCostUsdPerMillionTokens: "1",
      cachedInputCostUsdPerMillionTokens: "0.1",
      cacheWriteInputCostUsdPerMillionTokens: "1.25",
      outputCostUsdPerMillionTokens: "6",
      updatedAtUtc: "2026-08-09T20:00:00.000Z",
    }));
    const afterCounts = Object.fromEntries(preservedTables.map((table) => [
      table,
      database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as
        Readonly<{ count: number }>,
    ]));
    const countsPreserved = JSON.stringify(beforeCounts) === JSON.stringify(afterCounts);
    const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
    const checks = Object.freeze({
      migrationId: coachAiReviewCacheWriteAccountingMigration.migrationId,
      columnsPresent,
      officialLunaCacheWriteRateBackfilled: settings?.cache_write_rate === "1.25",
      subscriberCycleCapUpdated: beforeBudget?.cap === "1.00" &&
        budget?.cap === "2.00" && budget.updated_at_utc > beforeBudget.updated_at_utc,
      cacheWritePriceRequiredToEnable,
      cacheWritePriceProtectedWhileEnabled,
      incompleteReceiptRejected,
      overlappingInputBucketsRejected,
      exactCostCorrect: exactCost === "0.000189",
      countsPreserved,
      foreignKeysClean: foreignKeyFailures.length === 0,
    });
    if (Object.values(checks).some((value) => value === false)) {
      throw new Error(`cache_write_accounting_verification_failed:${JSON.stringify(checks)}`);
    }
    process.stdout.write(`${JSON.stringify(checks, null, 2)}\n`);
  } finally {
    database.close();
  }
}

main();
