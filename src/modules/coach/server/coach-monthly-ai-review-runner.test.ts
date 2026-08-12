import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import {
  COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
  type CoachMonthlyAiReviewInput,
  type CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION } from "../contracts/monthly-ai-review-output-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachMonthlyAiReviewRunner } from "./coach-monthly-ai-review-runner";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

const createdAtUtc = "2026-01-02T12:00:00.000Z";

function setup(enabledAtUtc = createdAtUtc): Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
}> {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => new Date(createdAtUtc),
  });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', 'monthly-runner-owner', 'Monthly runner owner', 'active', ?, ?)`)
    .run(userId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Monthly runner workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Monthly runner account', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, createdAtUtc, createdAtUtc);
  const scope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
  new CoachReviewDeliveryScheduleRepository(database).save(scope, {
    weeklyDeliveryDay: "friday",
    deliveryTimeEastern: "20:00",
  }, new Date(enabledAtUtc));
  new CoachAiProviderSettingsRepository(database).save({
    modelId: "gpt-test",
    inputCostUsdPerMillionTokens: "1",
    cachedInputCostUsdPerMillionTokens: "0.1",
    cacheWriteInputCostUsdPerMillionTokens: "1.25",
    outputCostUsdPerMillionTokens: "2",
  }, new Date(createdAtUtc));
  return Object.freeze({ database, scope });
}

function monthlyInput(
  period: CoachMonthlyAiReviewPeriod,
  readyClosedTradeCount = 1,
  reviewedTradingDayCount = 1,
): CoachMonthlyAiReviewInput {
  const days = Array.from({ length: reviewedTradingDayCount }, (_unused, index) => Object.freeze({
    date: `${period.startDate.slice(0, 8)}${String(Number(period.startDate.slice(8, 10)) + index).padStart(2, "0")}`,
    reviewed: true,
    netPnlDecimal: "10",
    ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    notes: null,
    trades: Object.freeze([]),
  }));
  return Object.freeze({
    contractVersion: COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
    month: Object.freeze({
      ...period,
      timezone: "America/New_York",
      currency: "USD",
    }),
    coverage: Object.freeze({
      periodReadyClosedCount: readyClosedTradeCount,
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
    }),
    summary: Object.freeze({
      tradingDayCount: readyClosedTradeCount === 0 ? 0 : reviewedTradingDayCount,
      readyClosedTradeCount,
      netPnlDecimal: readyClosedTradeCount === 0 ? null : "10",
      winRatePercentDecimal: readyClosedTradeCount === 0 ? null : "100",
    }),
    priorMonthlyReview: null,
    issuedWeeklyReviews: Object.freeze([]),
    currentFocuses: Object.freeze([]),
    days: Object.freeze(days),
  });
}

describe("Coach monthly AI review runner", () => {
  it("issues once for a closed month even when later facts would change the input", async () => {
    const { database, scope } = setup();
    let providerCalls = 0;
    let builderCalls = 0;
    try {
      const runner = new CoachMonthlyAiReviewRunner(
        database,
        (_database, candidateScope, period) => {
          expect(candidateScope).toEqual(scope);
          builderCalls += 1;
          return monthlyInput(period);
        },
        async (_input, options) => {
          expect(options.modelId).toBe("gpt-test");
          providerCalls += 1;
          return Object.freeze({
            output: Object.freeze({
              contractVersion: COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
              monthlyReview: "One saved monthly review.",
              progressAcrossMonth: "One supported improvement.",
              recurringFriction: "One supported friction point.",
              focusFollowThrough: "One supported focus review.",
              nextMonthFocuses: Object.freeze(["Keep one process focus."]),
              incompleteRecord: null,
            }),
            usage: Object.freeze({ inputTokens: 100, cachedInputTokens: 0, cacheWriteInputTokens: 0, outputTokens: 50, totalTokens: 150 }),
          });
        },
      );
      const dueAt = new Date("2026-08-02T00:00:00.000Z");
      await expect(runner.run(dueAt)).resolves.toMatchObject({
        issuedCount: 1,
        reusedCount: 0,
      });
      await expect(runner.run(new Date("2026-08-02T00:05:00.000Z"))).resolves.toMatchObject({
        issuedCount: 0,
        reusedCount: 1,
      });
      expect(providerCalls).toBe(1);
      expect(builderCalls).toBe(1);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_monthly_issued_reviews`).get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("skips a closed month with no completed trades", async () => {
    const { database } = setup();
    let providerCalls = 0;
    try {
      const runner = new CoachMonthlyAiReviewRunner(
        database,
        (_database, _scope, period) => monthlyInput(period, 0, 0),
        async () => {
          providerCalls += 1;
          throw new Error("provider must not be called");
        },
      );
      await expect(runner.run(new Date("2026-08-02T00:00:00.000Z")))
        .resolves.toMatchObject({ skippedNoTradesCount: 1 });
      expect(providerCalls).toBe(0);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_monthly_review_requests`).get())
        .toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it("skips a first partial month without three reviewed trading days", async () => {
    const { database } = setup("2026-07-20T14:00:00.000Z");
    let providerCalls = 0;
    try {
      const runner = new CoachMonthlyAiReviewRunner(
        database,
        (_database, _scope, period) => monthlyInput(period, 1, 2),
        async () => {
          providerCalls += 1;
          throw new Error("provider must not be called");
        },
      );
      await expect(runner.run(new Date("2026-08-02T00:00:00.000Z")))
        .resolves.toMatchObject({ skippedIneligiblePartialCount: 1 });
      expect(providerCalls).toBe(0);
    } finally {
      database.close();
    }
  });
});
