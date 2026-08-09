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
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";

const BASE = new Date("2026-08-09T16:00:00.000Z");

function createScope(database: Database.Database, sequence: number): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const at = new Date(BASE.getTime() + sequence * 1_000).toISOString();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, ?, 'active', ?, ?)`).run(
    userId, `subscriber-budget-${sequence}-${userId}`, `Subscriber ${sequence}`, at, at,
  );
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'America/New_York', 'active', ?, ?)`).run(
    workspaceId, `Subscriber ${sequence}`, at, at,
  );
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(
    workspaceId, userId, userId, at, at,
  );
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(
    accountId, workspaceId, `Subscriber ${sequence}`, userId, at, at,
  );
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function addPaidPeriod(database: Database.Database, scope: WorkspaceAccessScope, digit: string): boolean {
  const repository = new WhopAiReviewEntitlementRepository(database);
  const userRef = digit.repeat(64);
  repository.linkUser(scope.userId, userRef, BASE);
  repository.applyMembershipEvent(Object.freeze({
    webhookIdSha256: String(Number(digit) + 2).repeat(64),
    payloadSha256: String(Number(digit) + 4).repeat(64),
    eventType: "membership.activated" as const,
    eventAtUtc: BASE.toISOString(),
    membershipRefHmac: String(Number(digit) + 1).repeat(64),
    whopUserRefHmac: userRef,
    companyRefHmac: "a".repeat(64),
    productRefHmac: "b".repeat(64),
    membershipState: "active" as const,
    cancelAtPeriodEnd: false,
    renewalPeriodStartUtc: "2026-08-01T00:00:00.000Z",
    renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
  }), BASE);
  const access = repository.readAccess(scope.userId);
  return access.renewalPeriodStartUtc === "2026-08-01T00:00:00.000Z" &&
    access.renewalPeriodEndUtc === "2026-09-01T00:00:00.000Z";
}

function insertAttempt(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  sequence: number,
): string {
  const requestId = createCanonicalUuidV4();
  const attemptId = createCanonicalUuidV4();
  const digest = createCanonicalUuidV4().replace(/-/gu, "").repeat(2);
  database.prepare(`INSERT INTO coach_weekly_review_requests (
  coach_weekly_review_request_id, user_id, workspace_id, account_id,
  week_start_date, week_end_date, input_contract_version, input_sha256,
  input_json, prior_issued_review_id, state, failure_code, issued_review_id,
  created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'traderlink_coach_weekly_ai_input_v1', ?, '{}',
  NULL, 'pending', NULL, NULL, ?, NULL)`).run(
    requestId, scope.userId, scope.workspaceId, scope.activeAccountId,
    `2026-07-${String(1 + sequence * 2).padStart(2, "0")}`,
    `2026-07-${String(2 + sequence * 2).padStart(2, "0")}`,
    digest, BASE.toISOString(),
  );
  database.prepare(`INSERT INTO coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id, user_id, workspace_id, account_id,
  review_kind, review_request_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, 'weekly', ?, 1, 'openai_direct', 'gpt-5.6-luna',
  'pending', NULL, ?, NULL)`).run(
    attemptId, scope.userId, scope.workspaceId, scope.activeAccountId,
    requestId, BASE.toISOString(),
  );
  return attemptId;
}

function failureCode(database: Database.Database, attemptId: string): string | null {
  return database.prepare<[string], Readonly<{ failure_code: string | null }>>(`SELECT failure_code
FROM coach_ai_review_generation_control_reservations
WHERE coach_ai_review_generation_attempt_id = ?`).get(attemptId)?.failure_code ?? null;
}

function main(): void {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest,
      now: () => BASE,
    });
    const beforeRows = database.prepare<[], Readonly<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM coach_ai_review_budget_controls",
    ).get()?.count ?? -1;
    const budget = database.prepare<[], Readonly<{
      subscriber_cap: string;
      emergency_cap: string | null;
    }>>(`SELECT per_subscriber_paid_cycle_estimated_spend_cap_usd AS subscriber_cap,
  emergency_trailing_30_day_estimated_spend_cap_usd AS emergency_cap
FROM coach_ai_review_budget_controls WHERE control_key = 'ai_reviews'`).get();
    const afterRows = database.prepare<[], Readonly<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM coach_ai_review_budget_controls",
    ).get()?.count ?? -2;

    database.prepare(`UPDATE coach_ai_provider_settings SET
  input_cost_usd_per_million_tokens = '1',
  cached_input_cost_usd_per_million_tokens = '0.1',
  cache_write_input_cost_usd_per_million_tokens = '1.25',
  output_cost_usd_per_million_tokens = '6', updated_at_utc = ?
WHERE settings_key = 'coach_reviews'`).run("2026-08-09T16:00:01.000Z");
    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '0.001',
  per_subscriber_paid_cycle_estimated_spend_cap_usd = '0.01',
  emergency_trailing_30_day_estimated_spend_cap_usd = NULL,
  updated_at_utc = '2026-08-09T16:00:02.000Z'
WHERE control_key = 'ai_reviews'`).run();
    database.prepare(`UPDATE coach_ai_feature_controls SET enabled = 1,
  daily_request_cap = 100, daily_token_cap = 1000000,
  daily_estimated_spend_cap_usd = '10', updated_at_utc = ?
WHERE scope_kind = 'platform'
  AND feature_key IN ('weekly_reviews', 'monthly_reviews')`)
      .run("2026-08-09T16:00:03.000Z");

    const firstScope = createScope(database, 1);
    const secondScope = createScope(database, 2);
    const paidPeriodsReadable = addPaidPeriod(database, firstScope, "1") &&
      addPaidPeriod(database, secondScope, "2");
    const controls = new CoachAiReviewProviderControlsRepository(database);

    const firstAttempt = insertAttempt(database, firstScope, 0);
    const first = controls.reserveReviewGeneration(firstScope, {
      attemptId: firstAttempt, reviewKind: "weekly",
      providerInputText: "first subscriber review", maxOutputTokens: 1_000,
    }, new Date("2026-08-09T16:00:04.000Z"));
    const sameSubscriberAttempt = insertAttempt(database, firstScope, 1);
    const sameSubscriber = controls.reserveReviewGeneration(firstScope, {
      attemptId: sameSubscriberAttempt, reviewKind: "weekly",
      providerInputText: "same subscriber second review", maxOutputTokens: 1_000,
    }, new Date("2026-08-09T16:00:05.000Z"));
    const differentSubscriberAttempt = insertAttempt(database, secondScope, 2);
    const differentSubscriber = controls.reserveReviewGeneration(secondScope, {
      attemptId: differentSubscriberAttempt, reviewKind: "weekly",
      providerInputText: "different subscriber review", maxOutputTokens: 1_000,
    }, new Date("2026-08-09T16:00:06.000Z"));

    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  per_subscriber_paid_cycle_estimated_spend_cap_usd = '0.10',
  emergency_trailing_30_day_estimated_spend_cap_usd = '0.013',
  updated_at_utc = '2026-08-09T16:00:07.000Z'
WHERE control_key = 'ai_reviews'`).run();
    const emergencyAttempt = insertAttempt(database, secondScope, 3);
    const emergency = controls.reserveReviewGeneration(secondScope, {
      attemptId: emergencyAttempt, reviewKind: "weekly",
      providerInputText: "emergency global stop review", maxOutputTokens: 1_000,
    }, new Date("2026-08-09T16:00:08.000Z"));

    const checks = Object.freeze({
      migrationPreservedRow: beforeRows === 1 && afterRows === 1,
      defaultsCorrect: budget?.subscriber_cap === "2.00" && budget.emergency_cap === null,
      paidPeriodsReadable,
      firstSubscriberReserved: first.state === "reserved",
      sameSubscriberBlocked: sameSubscriber.state === "blocked" &&
        failureCode(database, sameSubscriberAttempt) ===
          "TRADERLINK_COACH_REVIEW_SUBSCRIBER_CYCLE_CAP_REACHED",
      warningDidNotBlockOtherSubscriber: differentSubscriber.state === "reserved",
      emergencyGlobalStopWorked: emergency.state === "blocked" &&
        failureCode(database, emergencyAttempt) ===
          "TRADERLINK_COACH_REVIEW_EMERGENCY_GLOBAL_CAP_REACHED",
      foreignKeysClean:
        (database.pragma("foreign_key_check") as unknown[]).length === 0,
    });
    if (Object.values(checks).some((value) => !value)) {
      throw new Error(`subscriber_budget_safeguard_verification_failed:${JSON.stringify(checks)}`);
    }
    process.stdout.write(`${JSON.stringify(checks, null, 2)}\n`);
  } finally {
    database.close();
  }
}

main();
