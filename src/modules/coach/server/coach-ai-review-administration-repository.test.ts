import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewAdministrationRepository } from "./coach-ai-review-administration-repository";

const at = "2026-08-06T12:00:00.000Z";
const userId = "00000000-0000-4000-8000-000000000101";
const workspaceId = "00000000-0000-4000-8000-000000000102";
const accountId = "00000000-0000-4000-8000-000000000103";
const weeklyRequestId = "00000000-0000-4000-8000-000000000104";
const monthlyRequestId = "00000000-0000-4000-8000-000000000105";
const weeklyAttemptId = "00000000-0000-4000-8000-000000000106";
const monthlyAttemptId = "00000000-0000-4000-8000-000000000107";
const weeklyReservationId = "00000000-0000-4000-8000-000000000108";
const monthlyReservationId = "00000000-0000-4000-8000-000000000109";

function scope(): JournalAdminScope {
  return Object.freeze({
    userId,
    role: "development_journal_owner_admin",
    mode: "local_development_owner",
    authorizedAtUtc: at,
    discordOwnerVerifiedAtUtc: null,
    permissions: Object.freeze([]),
  });
}

function setup(): Readonly<{ database: Database.Database; repository: CoachAiReviewAdministrationRepository }> {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(at) });
  database.exec(`INSERT INTO platform_users VALUES ('${userId}', 'development_local', 'review-admin-owner', 'Owner', 'active', '${at}', '${at}');
INSERT INTO platform_workspaces VALUES ('${workspaceId}', 'Review admin workspace', 'America/New_York', 'active', '${at}', '${at}');
INSERT INTO platform_workspace_memberships VALUES ('${workspaceId}', '${userId}', 'owner', 'active', '${userId}', '${at}', '${at}');
INSERT INTO journal_accounts VALUES ('${accountId}', '${workspaceId}', 'Primary', 'USD', 'America/New_York', 'active', '${userId}', '${at}', '${at}');
INSERT INTO coach_review_delivery_settings VALUES ('${accountId}', 'friday', '16:00', '${at}');
INSERT INTO coach_weekly_review_requests VALUES ('${weeklyRequestId}', '${userId}', '${workspaceId}', '${accountId}', '2026-08-03', '2026-08-07', 'traderlink_coach_weekly_ai_input_v1', '${"a".repeat(64)}', '{}', NULL, 'pending', NULL, NULL, '${at}', NULL);
INSERT INTO coach_monthly_review_requests VALUES ('${monthlyRequestId}', '${userId}', '${workspaceId}', '${accountId}', '2026-08-01', '2026-08-31', 'complete_month', 'traderlink_coach_monthly_ai_input_v1', '${"b".repeat(64)}', '{}', NULL, 'pending', NULL, NULL, '${at}', NULL);`);
  new CoachAiProviderSettingsRepository(database).save({
    modelId: "gpt-review-test",
    inputCostUsdPerMillionTokens: "1",
    cachedInputCostUsdPerMillionTokens: "0.1",
    cacheWriteInputCostUsdPerMillionTokens: "1.25",
    outputCostUsdPerMillionTokens: "2",
  });
  const budgetAvailable = Boolean(database.prepare<[], Readonly<{ found: number }>>(
    "SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'coach_ai_review_budget_controls'",
  ).get());
  if (budgetAvailable) {
    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '10',
  updated_at_utc = '2026-08-10T00:00:00.000Z'
WHERE control_key = 'ai_reviews'`).run();
  }
  return Object.freeze({ database, repository: new CoachAiReviewAdministrationRepository({ database, scope: scope() }) });
}

function insertAttempt(database: Database.Database, input: Readonly<{
  attemptId: string;
  requestId: string;
  kind: "weekly" | "monthly";
  state: "pending" | "issued" | "failed";
}>): void {
  database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 1, 'openai_direct', 'gpt-review-test', ?, ?, ?, ?)`).run(
    input.attemptId, userId, workspaceId, accountId, input.kind, input.requestId,
    input.state, input.state === "failed" ? "PROVIDER_FAILED" : null, at,
    input.state === "pending" ? null : at,
  );
}

function insertReservation(database: Database.Database, input: Readonly<{
  reservationId: string;
  attemptId: string;
  featureKey: "weekly_reviews" | "monthly_reviews";
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  failureCode: string | null;
}>): void {
  database.prepare(`INSERT INTO coach_ai_review_generation_control_reservations (
  coach_ai_review_generation_control_reservation_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, feature_key, eastern_calendar_date,
  provider_key, model_id, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  state, failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, '2026-08-06', 'openai_direct', 'gpt-review-test', '1', '2', 100, 50, 150, '0.001', ?, ?, ?, ?, ?)`).run(
    input.reservationId, input.attemptId, userId, workspaceId, accountId, input.featureKey,
    input.state, input.failureCode, at,
    input.state === "completed" || input.state === "failed" ? at : null,
    input.state === "completed" || input.state === "failed" || input.state === "blocked" ? at : null,
  );
}

describe("Coach AI review administration repository", () => {
  it("keeps weekly and monthly controls independent and reports privacy-safe aggregates", () => {
    const fixture = setup();
    try {
      fixture.repository.savePlatformControl({
        featureKey: "weekly_reviews", enabled: true, dailyRequestCap: 10, dailyTokenCap: 10_000, dailyEstimatedSpendCapUsd: "10",
      });
      fixture.repository.savePlatformControl({
        featureKey: "monthly_reviews", enabled: false, dailyRequestCap: null, dailyTokenCap: null, dailyEstimatedSpendCapUsd: null,
      });
      insertAttempt(fixture.database, { attemptId: weeklyAttemptId, requestId: weeklyRequestId, kind: "weekly", state: "pending" });
      insertReservation(fixture.database, { reservationId: weeklyReservationId, attemptId: weeklyAttemptId, featureKey: "weekly_reviews", state: "blocked", failureCode: "DAILY_CAP_REACHED" });
      insertAttempt(fixture.database, { attemptId: monthlyAttemptId, requestId: monthlyRequestId, kind: "monthly", state: "pending" });
      insertReservation(fixture.database, { reservationId: monthlyReservationId, attemptId: monthlyAttemptId, featureKey: "monthly_reviews", state: "failed", failureCode: "PROVIDER_FAILED" });
      fixture.database.prepare(`UPDATE coach_ai_review_generation_attempts
SET state = 'failed', failure_code = 'PROVIDER_FAILED', finalized_at_utc = ?
WHERE coach_ai_review_generation_attempt_id = ?`).run(at, monthlyAttemptId);

      const state = fixture.repository.read();
      expect(state.weekly.control.enabled).toBe(true);
      expect(state.monthly.control.enabled).toBe(false);
      expect(state.weekly.metrics).toMatchObject({ requestCount: 1, reservationCount: 1, blockedCount: 1, failedCount: 0, completedOrIssuedCount: 0, deliveryScheduleCount: 1 });
      expect(state.monthly.metrics).toMatchObject({ requestCount: 1, reservationCount: 1, blockedCount: 0, failedCount: 1, completedOrIssuedCount: 0, deliveryScheduleCount: 1 });
    } finally {
      fixture.database.close();
    }
  });
});
