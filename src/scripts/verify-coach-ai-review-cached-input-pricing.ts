import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import {
  calculateCoachAiReviewEstimatedCost,
} from "@/src/modules/coach/server/coach-ai-review-repository";
import { coachAiReviewCachedInputPricingMigration } from
  "@/src/modules/coach/server/database/migrations/0046_coach_ai_review_cached_input_pricing";

function count(database: Database.Database, table: string): number {
  return database.prepare<[], Readonly<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function hasColumn(database: Database.Database, table: string, column: string): boolean {
  const columns = database.pragma(`table_info(${table})`) as ReadonlyArray<
    Readonly<{ name: string }>
  >;
  return columns.some((candidate) => candidate.name === column);
}

function rejects(operation: () => void, fragment: string): boolean {
  try {
    operation();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(fragment);
  }
}

async function main(): Promise<void> {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-cached-input-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(local.databasePath, { fileMustExist: true, readonly: true });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }
  try {
    const database = new Database(copyPath, { fileMustExist: true });
    try {
      database.pragma("foreign_keys = ON");
      const preservedTables = [
        "journal_executions",
        "coach_ai_review_generation_attempts",
        "coach_ai_review_generation_control_reservations",
        "coach_ai_review_generation_attempt_receipts",
        "coach_ai_review_period_requests_v2",
        "coach_ai_issued_reviews_v2",
      ] as const;
      const before = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const schemaAlreadyCurrent = hasColumn(
        database,
        "coach_ai_provider_settings",
        "cached_input_cost_usd_per_million_tokens",
      );
      if (!schemaAlreadyCurrent) {
        for (const statement of coachAiReviewCachedInputPricingMigration.statements) {
          database.exec(statement);
        }
      }

      const exactCost = calculateCoachAiReviewEstimatedCost(
        Object.freeze({
          inputTokens: 100,
          cachedInputTokens: 40,
          cacheWriteInputTokens: 20,
          outputTokens: 20,
          totalTokens: 120,
        }),
        Object.freeze({
          providerKey: "openai_direct",
          modelId: "gpt-5.6-luna",
          inputCostUsdPerMillionTokens: "1",
          cachedInputCostUsdPerMillionTokens: "0.1",
          cacheWriteInputCostUsdPerMillionTokens: "1.25",
          outputCostUsdPerMillionTokens: "6",
          updatedAtUtc: "2026-08-09T00:00:00.000Z",
        }),
      );

      database.exec("BEGIN IMMEDIATE");
      let cachedPriceRequiredToEnable = false;
      let cachedPriceImmutableAfterEnable = false;
      let reservationPriceImmutable = false;
      let incompleteReceiptRejected = false;
      let exactReceiptStored = false;
      try {
        database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 0
WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND scope_kind = 'platform'`).run();
        database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '100',
  updated_at_utc = strftime(
    '%Y-%m-%dT%H:%M:%fZ',
    julianday(updated_at_utc) + (1.0 / 86400000.0)
  )
WHERE control_key = 'ai_reviews'`).run();
        database.prepare(`UPDATE coach_ai_provider_settings SET
  model_id = 'gpt-5.6-luna', input_cost_usd_per_million_tokens = '1',
  cached_input_cost_usd_per_million_tokens = NULL,
  cache_write_input_cost_usd_per_million_tokens = '1.25',
  output_cost_usd_per_million_tokens = '6',
  updated_at_utc = '2026-08-09T00:00:00.000Z'
WHERE settings_key = 'coach_reviews'`).run();
        cachedPriceRequiredToEnable = rejects(() => {
          database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '100',
  updated_at_utc = '2026-08-09T00:00:00.000Z'
WHERE feature_key = 'weekly_reviews' AND scope_kind = 'platform'`).run();
        }, "coach_ai_feature_control_transition_invalid");
        database.prepare(`UPDATE coach_ai_provider_settings SET
  cached_input_cost_usd_per_million_tokens = '0.1'
WHERE settings_key = 'coach_reviews'`).run();
        database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '100',
  updated_at_utc = '2026-08-09T00:00:00.000Z'
WHERE feature_key = 'weekly_reviews' AND scope_kind = 'platform'`).run();
        cachedPriceImmutableAfterEnable = rejects(() => {
          database.prepare(`UPDATE coach_ai_provider_settings SET
  cached_input_cost_usd_per_million_tokens = NULL
WHERE settings_key = 'coach_reviews'`).run();
        }, "coach_ai_review_provider_prices_required");

        const scope = database.prepare<[], Readonly<{
          user_id: string;
          workspace_id: string;
          account_id: string;
        }>>(`SELECT membership.user_id, membership.workspace_id, account.account_id
FROM platform_workspace_memberships membership
JOIN journal_accounts account ON account.workspace_id = membership.workspace_id
WHERE membership.status = 'active' AND account.status = 'active'
ORDER BY membership.created_at_utc, account.created_at_utc LIMIT 1`).get();
        if (!scope) throw new Error("TRADERLINK_CACHED_INPUT_VERIFY_SCOPE_MISSING");
        const requestId = randomUUID();
        const attemptId = randomUUID();
        const reservationId = randomUUID();
        const receiptId = randomUUID();
        database.prepare(`INSERT INTO coach_weekly_review_requests (
  coach_weekly_review_request_id, user_id, workspace_id, account_id,
  week_start_date, week_end_date, input_contract_version, input_sha256,
  input_json, prior_issued_review_id, state, failure_code, issued_review_id,
  created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, '2026-08-03', '2026-08-07',
  'traderlink_coach_weekly_ai_input_v1', ?, '{}', NULL, 'pending', NULL, NULL,
  '2026-08-09T00:00:00.000Z', NULL)`).run(
          requestId, scope.user_id, scope.workspace_id, scope.account_id, "0".repeat(64),
        );
        database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, 'weekly', ?, 1, 'openai_direct', 'gpt-5.6-luna',
  'pending', NULL, '2026-08-09T00:00:00.000Z', NULL)`).run(
          attemptId, scope.user_id, scope.workspace_id, scope.account_id, requestId,
        );
        database.prepare(`INSERT INTO coach_ai_review_generation_control_reservations (
  coach_ai_review_generation_control_reservation_id,
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  feature_key, eastern_calendar_date, provider_key, model_id,
  input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens,
  reserved_maximum_cost_usd, state, failure_code, reserved_at_utc,
  started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, 'weekly_reviews', '2026-08-09', 'openai_direct',
  'gpt-5.6-luna', '1', '0.1', '1.25', '6', 100, 20, 120, '0.000245',
  'reserved', NULL, '2026-08-09T00:00:00.000Z', NULL, NULL)`).run(
          reservationId, attemptId, scope.user_id, scope.workspace_id, scope.account_id,
        );
        reservationPriceImmutable = rejects(() => {
          database.prepare(`UPDATE coach_ai_review_generation_control_reservations
SET cached_input_cost_usd_per_million_tokens = '0.2'
WHERE coach_ai_review_generation_control_reservation_id = ?`).run(reservationId);
        }, "coach_ai_review_generation_control_reservation_transition_invalid");
        incompleteReceiptRejected = rejects(() => {
          database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, 100, NULL, 20, 20, 120, '1', NULL, '1.25', '6', '0.000189',
  '2026-08-09T00:00:00.000Z')`).run(receiptId, attemptId);
        }, "coach_ai_review_cache_write_usage_required");
        database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  cache_write_input_tokens, output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, 100, 40, 20, 20, 120, '1', '0.1', '1.25', '6', '0.000189',
  '2026-08-09T00:00:00.000Z')`).run(receiptId, attemptId);
        const storedReceipt = database.prepare<[string], Readonly<{
          cached_input_tokens: number;
          cache_write_input_tokens: number;
          cached_rate: string;
          estimated_cost_usd: string;
        }>>(`SELECT cached_input_tokens, cache_write_input_tokens,
  cached_input_cost_usd_per_million_tokens AS cached_rate, estimated_cost_usd
FROM coach_ai_review_generation_attempt_receipts
WHERE coach_ai_review_generation_attempt_receipt_id = ?`).get(receiptId);
        exactReceiptStored = storedReceipt?.cached_input_tokens === 40 &&
          storedReceipt.cache_write_input_tokens === 20 &&
          storedReceipt.cached_rate === "0.1" &&
          storedReceipt.estimated_cost_usd === "0.000189";
      } finally {
        database.exec("ROLLBACK");
      }

      const after = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
      const valid = exactCost === "0.000189" && cachedPriceRequiredToEnable &&
        cachedPriceImmutableAfterEnable && reservationPriceImmutable &&
        incompleteReceiptRejected && exactReceiptStored &&
        JSON.stringify(before) === JSON.stringify(after) &&
        foreignKeyFailures.length === 0;
      process.stdout.write(`${JSON.stringify({
        migrationId: coachAiReviewCachedInputPricingMigration.migrationId,
        schemaAlreadyCurrent,
        exactCost,
        cachedPriceRequiredToEnable,
        cachedPriceImmutableAfterEnable,
        reservationPriceImmutable,
        incompleteReceiptRejected,
        exactReceiptStored,
        unrelatedCountsPreserved: JSON.stringify(before) === JSON.stringify(after),
        foreignKeyFailures: foreignKeyFailures.length,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      database.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
