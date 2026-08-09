import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { CoachAiProviderSettingsRepository } from
  "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import {
  CoachAiReviewGenerationCoordinatorV2,
  type CoachAiReviewPaidAccessPolicyV2,
} from "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { CoachAiReviewRepository, calculateCoachAiReviewEstimatedCost } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachReflectionService } from
  "@/src/modules/coach/server/coach-reflection-service";
import { CoachWeeklyAiReviewInputService } from
  "@/src/modules/coach/server/coach-weekly-ai-review-input-service";
import { CoachReviewDeliveryScheduleRepository } from
  "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { CoachUsEquitiesReviewCalendarService } from
  "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from
  "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from
  "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalTradingDayReviewService } from
  "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalDashboardReadModelService } from
  "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";

const CONFIRMATION = "--confirm-disposable-fixture-provider-call";
const PERIOD_START_DATE = "2026-07-20";
const PERIOD_END_DATE = "2026-07-24";
const NOW = new Date("2026-07-25T16:00:00.000Z");

type ReceiptRow = Readonly<{
  attempt_count: number;
  receipt_count: number;
  reservation_count: number;
  reservation_state: string | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  cache_write_input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: string | null;
}>;

function count(database: Database.Database, table: string): number {
  return database.prepare<[], Readonly<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function configureDisposableControls(database: Database.Database): void {
  const budgetAvailable = Boolean(database.prepare<[], Readonly<{ found: number }>>(
    "SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'coach_ai_review_budget_controls'",
  ).get());
  if (budgetAvailable) {
    database.prepare(`UPDATE coach_ai_review_budget_controls SET
  trailing_30_day_estimated_spend_cap_usd = '5',
  updated_at_utc = '2026-08-09T15:59:30.000Z'
WHERE control_key = 'ai_reviews'`).run();
  }
  const controls = new CoachAiChatProviderControlsRepository(database);
  for (const featureKey of ["weekly_reviews", "monthly_reviews"] as const) {
    controls.savePlatformFeatureControl({
      featureKey,
      enabled: true,
      dailyRequestCap: 10,
      dailyTokenCap: 1_000_000,
      dailyEstimatedSpendCapUsd: "5",
    }, NOW);
  }
}

function configureDisposableAccount(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): void {
  const repository = new CoachReviewDeliveryScheduleRepository(database);
  const current = repository.readV2(scope);
  if (!current) {
    repository.saveV2(scope, {
      isEnabled: true,
      currentFrequency: "weekly",
      timingMode: "automatic_after_12_hours",
      twoWeekAnchorMondayDate: null,
      pendingFrequency: null,
      pendingEffectiveMondayDate: null,
      pendingTwoWeekAnchorMondayDate: null,
      expectedRevision: null,
    }, new Date("2026-07-01T12:00:00.000Z"));
    return;
  }
  database.exec("DROP TRIGGER coach_ai_review_account_settings_v2_update_guard");
  database.prepare(`UPDATE coach_ai_review_account_settings_v2 SET
  is_enabled = 1, first_enabled_at_utc = '2026-07-01T12:00:00.000Z',
  current_frequency = 'weekly', review_timing_mode = 'automatic_after_12_hours',
  two_week_anchor_monday_date = NULL, pending_frequency = NULL,
  pending_effective_monday_date = NULL, pending_two_week_anchor_monday_date = NULL,
  revision = revision + 1, updated_at_utc = '2026-08-09T15:59:00.000Z'
WHERE account_id = ?`).run(scope.activeAccountId);
  database.exec(`CREATE TRIGGER coach_ai_review_account_settings_v2_update_guard
BEFORE UPDATE ON coach_ai_review_account_settings_v2
WHEN NEW.account_id <> OLD.account_id
  OR NEW.first_enabled_at_utc IS NOT OLD.first_enabled_at_utc
  OR NEW.revision <> OLD.revision + 1
  OR NEW.updated_at_utc <= OLD.updated_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_settings_transition_invalid'); END`);
}

function fixtureInput(database: Database.Database, scope: WorkspaceAccessScope) {
  const calendar = new CoachUsEquitiesReviewCalendarService();
  const cohort = calendar.cohortStarting(PERIOD_START_DATE);
  const metadata = calendar.metadataForRange(cohort.mondayDate, cohort.fridayDate);
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  const reflections = new CoachReflectionService(
    new JournalDashboardReadModelService(
      new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(database)),
    ),
    annotations,
    new JournalProductReadService(database),
  );
  return new CoachWeeklyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    calendar,
  ).readPeriodicV2(scope, Object.freeze({
    calendar,
    reflectionEligibilityStartDate: cohort.mondayDate,
    period: Object.freeze({
      cadence: "weekly" as const,
      startDate: cohort.mondayDate,
      endDate: cohort.fridayDate,
      calendarTimezone: "America/New_York" as const,
      calendarId: metadata.calendarId,
      calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
      cohorts: Object.freeze([cohort]),
    }),
  }));
}

async function main(): Promise<void> {
  if (process.argv[2] !== CONFIRMATION) {
    throw new Error("ai_review_end_to_end_fixture_confirmation_required");
  }
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("ai_review_end_to_end_fixture_provider_key_missing");
  }
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-ai-review-e2e-"));
  const copyPath = join(temporaryRoot, "fixture-issuance.sqlite");
  const source = new Database(configuration.databasePath, {
    fileMustExist: true,
    readonly: true,
  });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }

  try {
    const database = new Database(copyPath, { fileMustExist: true });
    try {
      database.pragma("foreign_keys = ON");
      const scope = deriveDevelopmentOwnerJournalScope(database).scope;
      const accountId = scope.activeAccountId;
      if (!accountId) throw new Error("ai_review_end_to_end_fixture_account_missing");
      const existing = database.prepare<[string, string, string], Readonly<{
        count: number;
      }>>(`SELECT COUNT(*) AS count FROM coach_ai_review_period_requests_v2
WHERE account_id = ? AND period_start_date = ? AND period_end_date = ?`).get(
        accountId,
        PERIOD_START_DATE,
        PERIOD_END_DATE,
      )!.count;
      if (existing !== 0) {
        throw new Error("ai_review_end_to_end_fixture_period_not_clean");
      }
      const tickers = fixtureInput(database, scope).reviewPeriodMarketFacts.days
        .flatMap((day) => day.trades.map((trade) => trade.ticker));
      const fixtureTickerCount = tickers.filter((ticker) => /^AIR\d+$/u.test(ticker)).length;
      if (tickers.length === 0 || fixtureTickerCount !== tickers.length) {
        throw new Error(
          `ai_review_end_to_end_fixture_non_fixture_evidence_${fixtureTickerCount}_of_${tickers.length}`,
        );
      }

      configureDisposableControls(database);
      configureDisposableAccount(database, scope);
      const paidAccess: CoachAiReviewPaidAccessPolicyV2 = Object.freeze({
        read: () => "available" as const,
      });
      const coordinator = new CoachAiReviewGenerationCoordinatorV2(database, paidAccess);
      const before = Object.freeze({
        attempts: count(database, "coach_ai_review_generation_attempts_v2"),
        receipts: count(database, "coach_ai_review_generation_attempt_receipts_v2"),
        issued: count(database, "coach_ai_issued_reviews_v2"),
      });
      const first = await coordinator.generateNow(scope, {
        reviewKind: "weekly",
        periodStartDate: PERIOD_START_DATE,
        periodEndDate: PERIOD_END_DATE,
      }, NOW);
      if (first.state !== "issued") {
        throw new Error(`ai_review_end_to_end_fixture_not_issued_${first.state}`);
      }
      const request = new CoachAiReviewRepository(database)
        .readPeriodRequestV2(scope, first.requestId);
      if (request.state !== "issued" || !request.issuedReviewId) {
        throw new Error("ai_review_end_to_end_fixture_saved_review_missing");
      }
      const reopened = new CoachAiReviewRepository(database)
        .readIssuedReviewV2(scope, request.issuedReviewId);
      const receipt = database.prepare<[string], ReceiptRow>(`SELECT
  COUNT(DISTINCT attempt.coach_ai_review_generation_attempt_id) AS attempt_count,
  COUNT(DISTINCT receipt.coach_ai_review_generation_attempt_receipt_id) AS receipt_count,
  COUNT(DISTINCT reservation.coach_ai_review_generation_control_reservation_id)
    AS reservation_count,
  MAX(reservation.state) AS reservation_state,
  MAX(receipt.input_tokens) AS input_tokens,
  MAX(receipt.cached_input_tokens) AS cached_input_tokens,
  MAX(receipt.cache_write_input_tokens) AS cache_write_input_tokens,
  MAX(receipt.output_tokens) AS output_tokens,
  MAX(receipt.total_tokens) AS total_tokens,
  MAX(receipt.estimated_cost_usd) AS estimated_cost_usd
FROM coach_ai_review_generation_attempts_v2 attempt
LEFT JOIN coach_ai_review_generation_attempt_receipts_v2 receipt
  ON receipt.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
LEFT JOIN coach_ai_review_generation_control_reservations_v2 reservation
  ON reservation.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
WHERE attempt.coach_ai_review_period_request_id = ?`).get(first.requestId)!;
      if (receipt.input_tokens === null || receipt.cached_input_tokens === null ||
          receipt.cache_write_input_tokens === null ||
          receipt.output_tokens === null || receipt.total_tokens === null) {
        throw new Error("ai_review_end_to_end_fixture_usage_missing");
      }
      const exactCost = calculateCoachAiReviewEstimatedCost(Object.freeze({
        inputTokens: receipt.input_tokens,
        cachedInputTokens: receipt.cached_input_tokens,
        cacheWriteInputTokens: receipt.cache_write_input_tokens,
        outputTokens: receipt.output_tokens,
        totalTokens: receipt.total_tokens,
      }), new CoachAiProviderSettingsRepository(database).read());
      const beforeReopenRequest = Object.freeze({
        attempts: count(database, "coach_ai_review_generation_attempts_v2"),
        receipts: count(database, "coach_ai_review_generation_attempt_receipts_v2"),
        issued: count(database, "coach_ai_issued_reviews_v2"),
      });
      const second = await coordinator.generateNow(scope, {
        reviewKind: "weekly",
        periodStartDate: PERIOD_START_DATE,
        periodEndDate: PERIOD_END_DATE,
      }, NOW);
      const after = Object.freeze({
        attempts: count(database, "coach_ai_review_generation_attempts_v2"),
        receipts: count(database, "coach_ai_review_generation_attempt_receipts_v2"),
        issued: count(database, "coach_ai_issued_reviews_v2"),
      });
      const noSecondCall = second.state === "already_requested" &&
        JSON.stringify(beforeReopenRequest) === JSON.stringify(after);
      const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
      const valid = after.attempts === before.attempts + 1 &&
        after.receipts === before.receipts + 1 && after.issued === before.issued + 1 &&
        receipt.attempt_count === 1 && receipt.receipt_count === 1 &&
        receipt.reservation_count === 1 && receipt.reservation_state === "completed" &&
        receipt.estimated_cost_usd === exactCost &&
        reopened.issuedReviewId === request.issuedReviewId &&
        noSecondCall && foreignKeyFailures.length === 0;
      process.stdout.write(`${JSON.stringify({
        fixtureOnly: true,
        providerCallCount: 1,
        modelId: reopened.modelId,
        receiptComplete: receipt.receipt_count === 1 && exactCost !== null,
        estimatedCostUsd: exactCost,
        savedReviewReopened: reopened.issuedReviewId === request.issuedReviewId,
        secondProviderCallMade: !noSecondCall,
        foreignKeyFailures: foreignKeyFailures.length,
        liveDatabaseMutated: false,
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
