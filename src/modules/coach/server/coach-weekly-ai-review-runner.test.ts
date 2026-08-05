import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import {
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import { COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION } from "../contracts/weekly-ai-review-output-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachWeeklyAiReviewRunner } from "./coach-weekly-ai-review-runner";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

const createdAtUtc = "2026-08-05T12:00:00.000Z";

function setup(): Readonly<{
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
) VALUES (?, 'development_local', 'weekly-runner-owner', 'Weekly runner owner', 'active', ?, ?)`)
    .run(userId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Weekly runner workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, createdAtUtc, createdAtUtc);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Weekly runner account', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
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
  }, new Date(createdAtUtc));
  new CoachAiProviderSettingsRepository(database).save({
    modelId: "gpt-test",
    inputCostUsdPerMillionTokens: "1",
    outputCostUsdPerMillionTokens: "2",
  }, new Date(createdAtUtc));
  return Object.freeze({ database, scope });
}

function weeklyInput(
  anchorDate: string,
  readyClosedTradeCount = 1,
): CoachWeeklyAiReviewInput {
  const anchor = new Date(`${anchorDate}T12:00:00.000Z`);
  const day = anchor.getUTCDay();
  anchor.setUTCDate(anchor.getUTCDate() - ((day + 6) % 7));
  const startDate = anchor.toISOString().slice(0, 10);
  anchor.setUTCDate(anchor.getUTCDate() + 6);
  const endDate = anchor.toISOString().slice(0, 10);
  return Object.freeze({
    contractVersion: COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
    week: Object.freeze({
      startDate,
      endDate,
      timezone: "America/New_York",
      currency: "USD",
    }),
    coverage: Object.freeze({
      weekReadyClosedCount: readyClosedTradeCount,
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
    }),
    summary: Object.freeze({
      tradingDayCount: readyClosedTradeCount,
      readyClosedTradeCount,
      netPnlDecimal: readyClosedTradeCount === 0 ? null : "10",
      winRatePercentDecimal: readyClosedTradeCount === 0 ? null : "100",
    }),
    priorReview: null,
    currentFocuses: Object.freeze([]),
    days: Object.freeze([]),
  });
}

describe("Coach weekly AI review runner", () => {
  it("issues once for a due week and reuses the immutable review on later runs", async () => {
    const { database, scope } = setup();
    let providerCalls = 0;
    try {
      const runner = new CoachWeeklyAiReviewRunner(
        database,
        (_database, candidateScope, anchorDate) => {
          expect(candidateScope).toEqual(scope);
          return weeklyInput(anchorDate);
        },
        async (_input, options) => {
          expect(options.modelId).toBe("gpt-test");
          providerCalls += 1;
          return Object.freeze({
            output: Object.freeze({
              contractVersion: COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
              weeklyReview: "One saved weekly review.",
              whatImproved: "One supported improvement.",
              whatHeldYouBack: "One supported limitation.",
              focusFollowThrough: "One supported focus review.",
              nextWeekFocuses: Object.freeze(["Keep one process focus."]),
              incompleteRecord: null,
            }),
            usage: Object.freeze({ inputTokens: 100, outputTokens: 50, totalTokens: 150 }),
          });
        },
      );
      const dueAt = new Date("2026-08-08T00:00:00.000Z");
      await expect(runner.run(dueAt)).resolves.toEqual({
        scheduledAccountCount: 1,
        issuedCount: 1,
        reusedCount: 0,
        failedCount: 0,
        inProgressCount: 0,
        skippedNoTradesCount: 0,
      });
      await expect(runner.run(new Date("2026-08-08T00:05:00.000Z"))).resolves.toEqual({
        scheduledAccountCount: 1,
        issuedCount: 0,
        reusedCount: 1,
        failedCount: 0,
        inProgressCount: 0,
        skippedNoTradesCount: 0,
      });
      expect(providerCalls).toBe(1);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_weekly_issued_reviews`).get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("skips a no-trade period without creating a provider request", async () => {
    const { database } = setup();
    let providerCalls = 0;
    try {
      const runner = new CoachWeeklyAiReviewRunner(
        database,
        (_database, _scope, anchorDate) => weeklyInput(anchorDate, 0),
        async () => {
          providerCalls += 1;
          throw new Error("provider must not be called");
        },
      );
      await expect(runner.run(new Date("2026-08-08T00:00:00.000Z")))
        .resolves.toEqual(expect.objectContaining({ skippedNoTradesCount: 1 }));
      expect(providerCalls).toBe(0);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_weekly_review_requests`).get())
        .toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it("recovers the immediately prior week before the current delivery time", async () => {
    const { database } = setup();
    let anchorDateSeen = "";
    try {
      const runner = new CoachWeeklyAiReviewRunner(
        database,
        (_database, _scope, anchorDate) => {
          anchorDateSeen = anchorDate;
          return weeklyInput(anchorDate);
        },
        async () => Object.freeze({
          output: Object.freeze({
            contractVersion: COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
            weeklyReview: "Recovered review.",
            whatImproved: "Supported.",
            whatHeldYouBack: "Supported.",
            focusFollowThrough: "Supported.",
            nextWeekFocuses: Object.freeze(["One focus."]),
            incompleteRecord: null,
          }),
          usage: Object.freeze({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
        }),
      );
      await expect(runner.run(new Date("2026-08-05T16:00:00.000Z")))
        .resolves.toEqual(expect.objectContaining({ issuedCount: 1 }));
      expect(anchorDateSeen).toBe("2026-08-02");
    } finally {
      database.close();
    }
  });
});
