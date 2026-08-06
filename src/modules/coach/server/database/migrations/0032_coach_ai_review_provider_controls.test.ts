import Database from "better-sqlite3";

import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const at = "2026-08-06T12:00:00.000Z";
const later = "2026-08-06T12:01:00.000Z";
const userId = "00000000-0000-4000-8000-000000000001";
const workspaceId = "00000000-0000-4000-8000-000000000002";
const accountId = "00000000-0000-4000-8000-000000000003";
const weeklyRequestId = "00000000-0000-4000-8000-000000000004";
const monthlyRequestId = "00000000-0000-4000-8000-000000000005";
const weeklyAttemptId = "00000000-0000-4000-8000-000000000006";
const monthlyAttemptId = "00000000-0000-4000-8000-000000000007";
const weeklyReservationId = "00000000-0000-4000-8000-000000000008";
const monthlyReservationId = "00000000-0000-4000-8000-000000000009";

function setup(): Database.Database {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(at) });
  database.exec(`INSERT INTO platform_users VALUES ('${userId}', 'development_local', 'review-control-test', 'Test owner', 'active', '${at}', '${at}');
INSERT INTO platform_workspaces VALUES ('${workspaceId}', 'Test workspace', 'America/New_York', 'active', '${at}', '${at}');
INSERT INTO platform_workspace_memberships VALUES ('${workspaceId}', '${userId}', 'owner', 'active', '${userId}', '${at}', '${at}');
INSERT INTO journal_accounts VALUES ('${accountId}', '${workspaceId}', 'Primary', 'USD', 'America/New_York', 'active', '${userId}', '${at}', '${at}');
INSERT INTO coach_weekly_review_requests VALUES ('${weeklyRequestId}', '${userId}', '${workspaceId}', '${accountId}', '2026-08-03', '2026-08-07', 'traderlink_coach_weekly_ai_input_v1', '${"a".repeat(64)}', '{}', NULL, 'pending', NULL, NULL, '${at}', NULL);
INSERT INTO coach_monthly_review_requests VALUES ('${monthlyRequestId}', '${userId}', '${workspaceId}', '${accountId}', '2026-08-01', '2026-08-31', 'complete_month', 'traderlink_coach_monthly_ai_input_v1', '${"b".repeat(64)}', '{}', NULL, 'pending', NULL, NULL, '${at}', NULL);`);
  return database;
}

function enablePlatformFeature(database: Database.Database, featureKey: string): void {
  database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 10, daily_token_cap = 10000, daily_estimated_spend_cap_usd = '10', updated_at_utc = ?
  WHERE feature_key = ? AND scope_kind = 'platform'`).run(at, featureKey);
}

function insertAttempt(database: Database.Database, attemptId: string, kind: "weekly" | "monthly", requestId: string): void {
  database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 1, 'openai_direct', 'gpt-5.6-sol', 'pending', NULL, ?, NULL)`).run(
    attemptId, userId, workspaceId, accountId, kind, requestId, at,
  );
}

function insertReservation(database: Database.Database, reservationId: string, attemptId: string, featureKey: "weekly_reviews" | "monthly_reviews"): void {
  database.prepare(`INSERT INTO coach_ai_review_generation_control_reservations (
  coach_ai_review_generation_control_reservation_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, feature_key, eastern_calendar_date,
  provider_key, model_id, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  state, failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, '2026-08-06', 'openai_direct', 'gpt-5.6-sol', '1', '2', 100, 50, 150, '0.001', 'reserved', NULL, ?, NULL, NULL)`).run(
    reservationId, attemptId, userId, workspaceId, accountId, featureKey, at,
  );
}

function insertBlockedReservationWithoutPricing(database: Database.Database, reservationId: string, attemptId: string): void {
  database.prepare(`INSERT INTO coach_ai_review_generation_control_reservations (
  coach_ai_review_generation_control_reservation_id, coach_ai_review_generation_attempt_id,
  user_id, workspace_id, account_id, feature_key, eastern_calendar_date,
  provider_key, model_id, input_cost_usd_per_million_tokens,
  output_cost_usd_per_million_tokens, reserved_max_input_tokens,
  reserved_max_output_tokens, reserved_max_total_tokens, reserved_maximum_cost_usd,
  state, failure_code, reserved_at_utc, started_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, 'monthly_reviews', '2026-08-06', 'openai_direct', 'gpt-5.6-sol', NULL, NULL, 100, 50, 150, NULL, 'blocked', 'AI_REVIEW_PRICING_MISSING', ?, NULL, ?)`).run(
    reservationId, attemptId, userId, workspaceId, accountId, at, later,
  );
}

describe("0032 Coach AI review provider controls", () => {
  it("keeps Chat and AI Review pricing controls separate and protects enabled features", () => {
    const database = setup();
    try {
      database.prepare(`UPDATE coach_ai_provider_settings SET input_cost_usd_per_million_tokens = '1', output_cost_usd_per_million_tokens = '2', updated_at_utc = ? WHERE settings_key = 'coach_reviews'`).run(at);
      enablePlatformFeature(database, "weekly_reviews");
      expect(() => enablePlatformFeature(database, "daily_companion")).toThrowError("coach_ai_feature_control_transition_invalid");
      expect(() => database.prepare(`UPDATE coach_ai_provider_settings SET input_cost_usd_per_million_tokens = NULL, output_cost_usd_per_million_tokens = NULL WHERE settings_key = 'coach_reviews'`).run()).toThrowError("coach_ai_review_provider_prices_required");
      database.prepare(`UPDATE coach_ai_chat_provider_settings SET input_cost_usd_per_million_tokens = '1', output_cost_usd_per_million_tokens = '2', updated_at_utc = ? WHERE settings_key = 'ai_chat'`).run(at);
      enablePlatformFeature(database, "daily_companion");
      expect(() => database.prepare(`UPDATE coach_ai_chat_provider_settings SET input_cost_usd_per_million_tokens = NULL, output_cost_usd_per_million_tokens = NULL WHERE settings_key = 'ai_chat'`).run()).toThrowError("coach_ai_chat_provider_prices_required");
    } finally {
      database.close();
    }
  });

  it("enforces scoped one-to-one reservations and guarded lifecycle transitions", () => {
    const database = setup();
    try {
      insertAttempt(database, weeklyAttemptId, "weekly", weeklyRequestId);
      insertReservation(database, weeklyReservationId, weeklyAttemptId, "weekly_reviews");
      expect(() => database.prepare(`UPDATE coach_ai_review_generation_control_reservations SET state = 'completed', finalized_at_utc = ? WHERE coach_ai_review_generation_control_reservation_id = ?`).run(later, weeklyReservationId)).toThrowError("coach_ai_review_generation_control_reservation_transition_invalid");
      database.prepare(`UPDATE coach_ai_review_generation_control_reservations SET state = 'started', started_at_utc = ? WHERE coach_ai_review_generation_control_reservation_id = ?`).run(later, weeklyReservationId);
      database.prepare(`UPDATE coach_ai_review_generation_control_reservations SET state = 'completed', finalized_at_utc = ? WHERE coach_ai_review_generation_control_reservation_id = ?`).run("2026-08-06T12:02:00.000Z", weeklyReservationId);
      expect(() => database.prepare(`UPDATE coach_ai_review_generation_control_reservations SET state = 'failed', failure_code = 'PROVIDER_FAILED', finalized_at_utc = ? WHERE coach_ai_review_generation_control_reservation_id = ?`).run("2026-08-06T12:03:00.000Z", weeklyReservationId)).toThrowError("coach_ai_review_generation_control_reservation_transition_invalid");
      expect(() => database.prepare(`DELETE FROM coach_ai_review_generation_control_reservations WHERE coach_ai_review_generation_control_reservation_id = ?`).run(weeklyReservationId)).toThrowError("coach_ai_review_generation_control_reservation_history_required");
      insertAttempt(database, monthlyAttemptId, "monthly", monthlyRequestId);
      expect(() => insertReservation(database, monthlyReservationId, monthlyAttemptId, "weekly_reviews")).toThrowError("coach_ai_review_generation_control_reservation_scope_required");
      insertBlockedReservationWithoutPricing(database, monthlyReservationId, monthlyAttemptId);
    } finally {
      database.close();
    }
  });
});
