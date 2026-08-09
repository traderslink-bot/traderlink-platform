import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";

const initialTime = "2026-08-06T12:00:00.000Z";

type Fixture = Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
  controls: CoachAiReviewProviderControlsRepository;
}>;

function setup(): Fixture {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(initialTime) });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc)
VALUES (?, 'development_local', ?, 'Test user', 'active', ?, ?)`).run(userId, `review-controls-${userId}`, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspaces (workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc)
VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`).run(workspaceId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, initialTime, initialTime);
  database.prepare(`INSERT INTO journal_accounts (account_id, workspace_id, display_name, base_currency, trading_timezone, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(accountId, workspaceId, userId, initialTime, initialTime);
  return Object.freeze({
    database,
    scope: Object.freeze({ userId, workspaceId, workspaceRole: "owner" as const, allowedAccountIds: Object.freeze([accountId]), activeAccountId: accountId }),
    controls: new CoachAiReviewProviderControlsRepository(database),
  });
}

function configurePlatform(fixture: Fixture, featureKey: "weekly_reviews" | "monthly_reviews", requestCap = 10): void {
  fixture.database.prepare(`UPDATE coach_ai_provider_settings SET input_cost_usd_per_million_tokens = '1',
  cached_input_cost_usd_per_million_tokens = '0.1',
  cache_write_input_cost_usd_per_million_tokens = '1.25',
  output_cost_usd_per_million_tokens = '2', updated_at_utc = ? WHERE settings_key = 'coach_reviews'`).run(initialTime);
  const budgetAvailable = Boolean(fixture.database.prepare<[], Readonly<{
    found: number;
  }>>(`SELECT 1 AS found FROM sqlite_schema
WHERE type = 'table' AND name = 'coach_ai_review_budget_controls'`).get());
  if (budgetAvailable) {
    fixture.database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '10',
  updated_at_utc = '2026-08-10T00:00:00.000Z'
WHERE control_key = 'ai_reviews'`).run();
  }
  fixture.database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1, daily_request_cap = ?,
  daily_token_cap = 100000, daily_estimated_spend_cap_usd = '10', updated_at_utc = ?
WHERE feature_key = ? AND scope_kind = 'platform'`).run(requestCap, initialTime, featureKey);
}

function insertPendingAttempt(fixture: Fixture, reviewKind: "weekly" | "monthly"): string {
  const requestId = createCanonicalUuidV4();
  const attemptId = createCanonicalUuidV4();
  const inputDigest = createCanonicalUuidV4().replace(/-/gu, "").repeat(2);
  const { userId, workspaceId, activeAccountId } = fixture.scope;
  if (!activeAccountId) throw new Error("missing test account");
  if (reviewKind === "weekly") {
    fixture.database.prepare(`INSERT INTO coach_weekly_review_requests (
  coach_weekly_review_request_id, user_id, workspace_id, account_id, week_start_date, week_end_date,
  input_contract_version, input_sha256, input_json, prior_issued_review_id, state, failure_code,
  issued_review_id, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, '2026-08-03', '2026-08-07', 'traderlink_coach_weekly_ai_input_v1', ?, '{}', NULL, 'pending', NULL, NULL, ?, NULL)`).run(
      requestId, userId, workspaceId, activeAccountId, inputDigest, initialTime,
    );
  } else {
    fixture.database.prepare(`INSERT INTO coach_monthly_review_requests (
  coach_monthly_review_request_id, user_id, workspace_id, account_id, period_start_date, period_end_date,
  period_coverage, input_contract_version, input_sha256, input_json, prior_issued_review_id, state,
  failure_code, issued_review_id, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, '2026-08-01', '2026-08-31', 'complete_month', 'traderlink_coach_monthly_ai_input_v1', ?, '{}', NULL, 'pending', NULL, NULL, ?, NULL)`).run(
      requestId, userId, workspaceId, activeAccountId, inputDigest, initialTime,
    );
  }
  fixture.database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id, review_kind,
  review_request_id, attempt_number, provider_key, model_id, state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 1, 'openai_direct', 'gpt-5.6-sol', 'pending', NULL, ?, NULL)`).run(
    attemptId, userId, workspaceId, activeAccountId, reviewKind, requestId, initialTime,
  );
  return attemptId;
}

function markIssuedWithReceipt(fixture: Fixture, attemptId: string): void {
  fixture.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id, coach_ai_review_generation_attempt_id,
  input_tokens, cached_input_tokens, cache_write_input_tokens,
  output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, 1, 0, 0, 2, 3, '1', '0.1', '1.25', '2', '0.000005', ?)`).run(createCanonicalUuidV4(), attemptId, initialTime);
  fixture.database.prepare(`UPDATE coach_ai_review_generation_attempts SET state = 'issued', finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?`).run("2026-08-06T12:01:00.000Z", attemptId);
}

describe("Coach AI Review provider controls repository", () => {
  it("records a safe blocked reservation before review pricing or a platform control is available", () => {
    const fixture = setup();
    try {
      const attemptId = insertPendingAttempt(fixture, "weekly");
      expect(fixture.controls.readPlatformAvailability("weekly")).toEqual({ featureKey: "weekly_reviews", enabled: false });
      const reservation = fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId, reviewKind: "weekly", providerInputText: "The private review envelope", maxOutputTokens: 4_096,
      });
      expect(reservation).toMatchObject({ state: "blocked", reservation: {
        attemptId, state: "blocked", inputCostUsdPerMillionTokens: null, maximumCostUsd: null,
      } });
      expect(JSON.stringify(reservation)).not.toContain("private review envelope");
    } finally { fixture.database.close(); }
  });

  it("inherits a platform control when no account override exists, uses separate feature caps, and keeps idempotency", () => {
    const fixture = setup();
    try {
      configurePlatform(fixture, "weekly_reviews", 1);
      configurePlatform(fixture, "monthly_reviews", 1);
      const weeklyAttempt = insertPendingAttempt(fixture, "weekly");
      const first = fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId: weeklyAttempt, reviewKind: "weekly", providerInputText: "weekly envelope", maxOutputTokens: 4_096,
      });
      expect(first).toMatchObject({ state: "reserved", reservation: { featureKey: "weekly_reviews", maximumInputTokens: 15 } });
      expect(fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId: weeklyAttempt, reviewKind: "weekly", providerInputText: "weekly envelope", maxOutputTokens: 4_096,
      })).toMatchObject({ state: "idempotent", reservation: { reservationId: first.reservation.reservationId } });
      const blockedWeekly = fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId: insertPendingAttempt(fixture, "weekly"), reviewKind: "weekly", providerInputText: "another weekly envelope", maxOutputTokens: 4_096,
      });
      expect(blockedWeekly).toMatchObject({ state: "blocked", reservation: { state: "blocked" } });
      expect(fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId: insertPendingAttempt(fixture, "monthly"), reviewKind: "monthly", providerInputText: "monthly envelope", maxOutputTokens: 4_096,
      })).toMatchObject({ state: "reserved", reservation: { featureKey: "monthly_reviews" } });
    } finally { fixture.database.close(); }
  });

  it("uses an account override when present and validates completed receipt facts against the immutable reservation", () => {
    const fixture = setup();
    try {
      configurePlatform(fixture, "weekly_reviews");
      const accountId = fixture.scope.activeAccountId!;
      fixture.database.prepare(`INSERT INTO coach_ai_feature_controls (
  coach_ai_feature_control_id, feature_key, scope_kind, user_id, workspace_id, account_id, enabled,
  daily_request_cap, daily_token_cap, daily_estimated_spend_cap_usd, updated_at_utc
) VALUES (?, 'weekly_reviews', 'account', ?, ?, ?, 0, NULL, NULL, NULL, ?)`).run(
        createCanonicalUuidV4(), fixture.scope.userId, fixture.scope.workspaceId, accountId, initialTime,
      );
      expect(fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId: insertPendingAttempt(fixture, "weekly"), reviewKind: "weekly", providerInputText: "blocked by account", maxOutputTokens: 4_096,
      })).toMatchObject({ state: "blocked" });
      fixture.database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1, daily_request_cap = 10,
  daily_token_cap = 100000, daily_estimated_spend_cap_usd = '10' WHERE feature_key = 'weekly_reviews'
  AND scope_kind = 'account' AND account_id = ?`).run(accountId);
      const attemptId = insertPendingAttempt(fixture, "weekly");
      const reservation = fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId, reviewKind: "weekly", providerInputText: "complete envelope", maxOutputTokens: 4_096,
      });
      fixture.controls.markProviderStarted(fixture.scope, attemptId);
      markIssuedWithReceipt(fixture, attemptId);
      expect(fixture.controls.finalizeFromReviewReceipt(fixture.scope, attemptId, "completed", null))
        .toMatchObject({ reservationId: reservation.reservation.reservationId, state: "completed" });
    } finally { fixture.database.close(); }
  });

  it("fails closed on incompatible receipts and conservatively retains a started failure", () => {
    const fixture = setup();
    try {
      configurePlatform(fixture, "weekly_reviews");
      const attemptId = insertPendingAttempt(fixture, "weekly");
      fixture.controls.reserveReviewGeneration(fixture.scope, {
        attemptId, reviewKind: "weekly", providerInputText: "bounded envelope", maxOutputTokens: 4_096,
      });
      fixture.controls.markProviderStarted(fixture.scope, attemptId);
      fixture.database.prepare(`INSERT INTO coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id, coach_ai_review_generation_attempt_id,
  input_tokens, cached_input_tokens, cache_write_input_tokens,
  output_tokens, total_tokens, input_cost_usd_per_million_tokens,
  cached_input_cost_usd_per_million_tokens,
  cache_write_input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, estimated_cost_usd, recorded_at_utc
) VALUES (?, ?, 999999, 0, 0, 2, 1000001, '1', '0.1', '1.25', '2', '10', ?)`).run(createCanonicalUuidV4(), attemptId, initialTime);
      fixture.database.prepare(`UPDATE coach_ai_review_generation_attempts SET state = 'failed', failure_code = 'TRADERLINK_COACH_PROVIDER_FAILED', finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?`).run("2026-08-06T12:01:00.000Z", attemptId);
      expect(() => fixture.controls.finalizeFromReviewReceipt(fixture.scope, attemptId, "failed", "TRADERLINK_COACH_PROVIDER_FAILED"))
        .toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      expect(fixture.controls.failStartedWithoutUsage(fixture.scope, attemptId, "TRADERLINK_COACH_PROVIDER_FAILED"))
        .toMatchObject({ state: "failed" });
      try {
        fixture.controls.markProviderStarted({ ...fixture.scope, activeAccountId: createCanonicalUuidV4(), allowedAccountIds: Object.freeze([]) }, attemptId);
        throw new Error("expected scoped failure");
      } catch (error) {
        expect(isTraderLinkPlatformError(error)).toBe(true);
      }
    } finally { fixture.database.close(); }
  });
});
