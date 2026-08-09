import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";
import { CoachAiReviewProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-review-provider-controls-repository";
import { coachAiReviewRollingSpendGuardMigration } from
  "@/src/modules/coach/server/database/migrations/0049_coach_ai_review_rolling_spend_guard";
import { platformWhopAiReviewReconciliationMigration } from
  "@/src/modules/platform/server/database/migrations/0048_platform_whop_ai_review_reconciliation";

const BASE = new Date("2026-08-09T16:00:00.000Z");

function addSeconds(seconds: number): Date {
  return new Date(BASE.getTime() + seconds * 1_000);
}

function setup(database: Database.Database): WorkspaceAccessScope {
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => BASE,
  });
  const supplementalMigrations = [
    [platformWhopAiReviewReconciliationMigration, "platform_whop_reconciliation_runs"],
    [coachAiReviewRollingSpendGuardMigration, "coach_ai_review_budget_controls"],
  ] as const;
  for (const [migration, table] of supplementalMigrations) {
    const present = database.prepare<[string], Readonly<{ present: number }>>(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?",
    ).get(table);
    if (!present) {
      for (const statement of migration.statements) database.exec(statement);
    }
  }
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Rolling spend fixture', 'active', ?, ?)`)
    .run(userId, `rolling-spend-${userId}`, BASE.toISOString(), BASE.toISOString());
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Rolling spend fixture', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, BASE.toISOString(), BASE.toISOString());
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, BASE.toISOString(), BASE.toISOString());
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Rolling spend fixture', 'USD', 'America/New_York',
  'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, BASE.toISOString(), BASE.toISOString());
  database.prepare(`UPDATE coach_ai_provider_settings SET
  input_cost_usd_per_million_tokens = '1',
  cached_input_cost_usd_per_million_tokens = '0.1',
  output_cost_usd_per_million_tokens = '6',
  updated_at_utc = ? WHERE settings_key = 'coach_reviews'`).run(addSeconds(1).toISOString());
  database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '0.01', updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(addSeconds(1).toISOString());
  database.prepare(`UPDATE coach_ai_feature_controls SET
  enabled = 1, daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '10', updated_at_utc = ?
WHERE scope_kind = 'platform'
  AND feature_key IN ('weekly_reviews', 'monthly_reviews')`)
    .run(addSeconds(2).toISOString());
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function insertPendingAttempt(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  reviewKind: "weekly" | "monthly",
  sequence: number,
): string {
  const requestId = createCanonicalUuidV4();
  const attemptId = createCanonicalUuidV4();
  const digest = createCanonicalUuidV4().replace(/-/gu, "").repeat(2);
  const accountId = scope.activeAccountId;
  if (!accountId) throw new Error("rolling_spend_fixture_account_missing");
  if (reviewKind === "weekly") {
    const startDay = String(3 + sequence * 7).padStart(2, "0");
    const endDay = String(7 + sequence * 7).padStart(2, "0");
    database.prepare(`INSERT INTO coach_weekly_review_requests (
  coach_weekly_review_request_id, user_id, workspace_id, account_id,
  week_start_date, week_end_date, input_contract_version, input_sha256,
  input_json, prior_issued_review_id, state, failure_code, issued_review_id,
  created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'traderlink_coach_weekly_ai_input_v1', ?, '{}',
  NULL, 'pending', NULL, NULL, ?, NULL)`).run(
      requestId, scope.userId, scope.workspaceId, accountId,
      `2026-08-${startDay}`, `2026-08-${endDay}`, digest, BASE.toISOString(),
    );
  } else {
    database.prepare(`INSERT INTO coach_monthly_review_requests (
  coach_monthly_review_request_id, user_id, workspace_id, account_id,
  period_start_date, period_end_date, period_coverage, input_contract_version,
  input_sha256, input_json, prior_issued_review_id, state, failure_code,
  issued_review_id, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, '2026-07-01', '2026-07-31', 'complete_month',
  'traderlink_coach_monthly_ai_input_v1', ?, '{}', NULL, 'pending', NULL,
  NULL, ?, NULL)`).run(
      requestId, scope.userId, scope.workspaceId, accountId, digest, BASE.toISOString(),
    );
  }
  database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 1, 'openai_direct', 'gpt-5.6-luna',
  'pending', NULL, ?, NULL)`).run(
    attemptId, scope.userId, scope.workspaceId, accountId,
    reviewKind, requestId, BASE.toISOString(),
  );
  return attemptId;
}

function finalizeWithExactReceipt(
  database: Database.Database,
  controls: CoachAiReviewProviderControlsRepository,
  scope: WorkspaceAccessScope,
  attemptId: string,
): void {
  controls.markProviderStarted(scope, attemptId, addSeconds(4));
  database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id,
  coach_ai_review_generation_attempt_id, input_tokens, cached_input_tokens,
  output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, 5, 2, 5, 10, '1', '0.1', '6', '0.0000332', ?)`)
    .run(createCanonicalUuidV4(), attemptId, addSeconds(5).toISOString());
  database.prepare(`UPDATE coach_ai_review_generation_attempts SET
  state = 'issued', finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?`)
    .run(addSeconds(5).toISOString(), attemptId);
  controls.finalizeFromReviewReceipt(
    scope, attemptId, "completed", null, addSeconds(5),
  );
}

function outstandingReservationRemainsCounted(): boolean {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    const scope = setup(database);
    const controls = new CoachAiReviewProviderControlsRepository(database);
    const firstAttempt = insertPendingAttempt(database, scope, "weekly", 0);
    const first = controls.reserveReviewGeneration(scope, {
      attemptId: firstAttempt,
      reviewKind: "weekly",
      providerInputText: "old outstanding envelope",
      maxOutputTokens: 1_000,
    }, addSeconds(3));
    const secondAttempt = insertPendingAttempt(database, scope, "monthly", 1);
    const second = controls.reserveReviewGeneration(scope, {
      attemptId: secondAttempt,
      reviewKind: "monthly",
      providerInputText: "new envelope after 30 days",
      maxOutputTokens: 1_000,
    }, new Date(BASE.getTime() + 31 * 24 * 60 * 60 * 1_000));
    const blockedCode = database.prepare<[string], Readonly<{
      failure_code: string | null;
    }>>(`SELECT failure_code FROM coach_ai_review_generation_control_reservations
WHERE coach_ai_review_generation_attempt_id = ?`).get(secondAttempt)?.failure_code;
    return first.state === "reserved" && second.state === "blocked" &&
      blockedCode ===
        "TRADERLINK_COACH_REVIEW_ROLLING_SPEND_CAP_REACHED";
  } finally {
    database.close();
  }
}

function main(): void {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    const scope = setup(database);
    const controls = new CoachAiReviewProviderControlsRepository(database);
    const firstAttempt = insertPendingAttempt(database, scope, "weekly", 0);
    const first = controls.reserveReviewGeneration(scope, {
      attemptId: firstAttempt,
      reviewKind: "weekly",
      providerInputText: "first envelope",
      maxOutputTokens: 1_000,
    }, addSeconds(3));
    const secondAttempt = insertPendingAttempt(database, scope, "monthly", 1);
    const second = controls.reserveReviewGeneration(scope, {
      attemptId: secondAttempt,
      reviewKind: "monthly",
      providerInputText: "second envelope",
      maxOutputTokens: 1_000,
    }, addSeconds(3));
    const blockedCode = database.prepare<[string], Readonly<{
      failure_code: string | null;
    }>>(`SELECT failure_code FROM coach_ai_review_generation_control_reservations
WHERE coach_ai_review_generation_attempt_id = ?`).get(secondAttempt)?.failure_code;

    finalizeWithExactReceipt(database, controls, scope, firstAttempt);
    const thirdAttempt = insertPendingAttempt(database, scope, "weekly", 2);
    const third = controls.reserveReviewGeneration(scope, {
      attemptId: thirdAttempt,
      reviewKind: "weekly",
      providerInputText: "third envelope",
      maxOutputTokens: 1_000,
    }, addSeconds(6));

    let clearWhileEnabledRejected = false;
    try {
      database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = NULL, updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(addSeconds(7).toISOString());
    } catch {
      clearWhileEnabledRejected = true;
    }
    database.prepare(`UPDATE coach_ai_feature_controls SET
  enabled = 0, updated_at_utc = ?
WHERE scope_kind = 'platform'
  AND feature_key IN ('weekly_reviews', 'monthly_reviews')`)
      .run(addSeconds(8).toISOString());
    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = NULL, updated_at_utc = ?
WHERE control_key = 'ai_reviews'`).run(addSeconds(9).toISOString());
    let enableWithoutBudgetRejected = false;
    try {
      database.prepare(`UPDATE coach_ai_feature_controls SET
  enabled = 1, updated_at_utc = ?
WHERE scope_kind = 'platform' AND feature_key = 'weekly_reviews'`)
        .run(addSeconds(10).toISOString());
    } catch {
      enableWithoutBudgetRejected = true;
    }
    const outstandingLiabilityProtected = outstandingReservationRemainsCounted();
    const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
    const valid = first.state === "reserved" && second.state === "blocked" &&
      blockedCode === "TRADERLINK_COACH_REVIEW_ROLLING_SPEND_CAP_REACHED" &&
      third.state === "reserved" && clearWhileEnabledRejected &&
      enableWithoutBudgetRejected && outstandingLiabilityProtected &&
      foreignKeyFailures.length === 0;
    process.stdout.write(`${JSON.stringify({
      migrationId: coachAiReviewRollingSpendGuardMigration.migrationId,
      combinedCadenceCeiling: second.state === "blocked",
      blockedBeforeProviderCode: blockedCode,
      exactReceiptReleasesConservativeRoom: third.state === "reserved",
      outstandingLiabilityProtected,
      clearWhileEnabledRejected,
      enableWithoutBudgetRejected,
      foreignKeyFailures: foreignKeyFailures.length,
      valid,
    })}\n`);
    if (!valid) process.exitCode = 1;
  } finally {
    database.close();
  }
}

main();
