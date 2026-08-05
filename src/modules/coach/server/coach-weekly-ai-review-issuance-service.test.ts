import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import {
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewOutput,
} from "../contracts/weekly-ai-review-output-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { CoachWeeklyAiReviewIssuanceService } from "./coach-weekly-ai-review-issuance-service";

const createdAtUtc = "2026-08-05T12:00:00.000Z";

function setup(): Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
  secondAccountScope: WorkspaceAccessScope;
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
  const secondAccountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', 'coach-review-test-owner', 'Test owner', 'active', ?, ?)`).run(
    userId, createdAtUtc, createdAtUtc,
  );
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Test workspace', 'America/New_York', 'active', ?, ?)`).run(
    workspaceId, createdAtUtc, createdAtUtc,
  );
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(
    workspaceId, userId, userId, createdAtUtc, createdAtUtc,
  );
  const insertAccount = database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`);
  insertAccount.run(accountId, workspaceId, "Primary", userId, createdAtUtc, createdAtUtc);
  insertAccount.run(secondAccountId, workspaceId, "Second", userId, createdAtUtc, createdAtUtc);
  return Object.freeze({
    database,
    scope: Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner",
      allowedAccountIds: Object.freeze([accountId, secondAccountId]),
      activeAccountId: accountId,
    }),
    secondAccountScope: Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner",
      allowedAccountIds: Object.freeze([accountId, secondAccountId]),
      activeAccountId: secondAccountId,
    }),
  });
}

function input(): CoachWeeklyAiReviewInput {
  return Object.freeze({
    contractVersion: COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
    week: Object.freeze({
      startDate: "2026-08-03",
      endDate: "2026-08-09",
      timezone: "America/New_York",
      currency: "USD",
    }),
    coverage: Object.freeze({
      weekReadyClosedCount: 1,
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
    }),
    summary: Object.freeze({
      tradingDayCount: 1,
      readyClosedTradeCount: 1,
      netPnlDecimal: "25",
      winRatePercentDecimal: "100",
    }),
    currentFocuses: Object.freeze([]),
    days: Object.freeze([]),
  });
}

function output(): CoachWeeklyAiReviewOutput {
  return Object.freeze({
    contractVersion: COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
    weeklyReview: "A factual weekly review.",
    whatImproved: "The saved record supports one improvement.",
    whatHeldYouBack: "The saved record supports one limitation.",
    focusFollowThrough: "No Current Focus was available.",
    nextWeekFocuses: Object.freeze(["Keep the next focus specific."]),
    incompleteRecord: null,
  });
}

describe("Coach weekly AI review issuance", () => {
  it("records failed attempts, retries the same immutable request, and reuses the issued review", async () => {
    const { database, scope, secondAccountScope } = setup();
    try {
      const settings = new CoachAiProviderSettingsRepository(database);
      settings.save({
        modelId: "gpt-test",
        inputCostUsdPerMillionTokens: "2.5",
        outputCostUsdPerMillionTokens: "10",
      }, new Date(createdAtUtc));
      const reviews = new CoachAiReviewRepository(database);
      let calls = 0;
      const service = new CoachWeeklyAiReviewIssuanceService(
        reviews,
        settings,
        async (_input, options) => {
          expect(options.modelId).toBe("gpt-test");
          calls += 1;
          if (calls === 1) {
            const error = Object.assign(new Error("provider failed"), {
              usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
            });
            throw error;
          }
          return Object.freeze({
            output: output(),
            usage: Object.freeze({ inputTokens: 200, outputTokens: 100, totalTokens: 300 }),
          });
        },
      );

      const first = await service.issue(scope, input(), null, new Date(createdAtUtc));
      expect(first).toEqual(expect.objectContaining({ state: "failed", retryAvailable: true }));
      expect(database.prepare(`SELECT state FROM coach_weekly_review_requests`).get()).toEqual({
        state: "pending",
      });
      expect(database.prepare(`SELECT state, failure_code FROM coach_ai_review_generation_attempts`).get())
        .toEqual({ state: "failed", failure_code: "TRADERLINK_COACH_PROVIDER_FAILED" });

      const second = await service.issue(
        scope,
        input(),
        null,
        new Date("2026-08-05T12:01:00.000Z"),
      );
      expect(second.state).toBe("issued");
      if (second.state !== "issued") throw new Error("expected issued review");
      expect(second.reused).toBe(false);
      expect(second.review.output.weeklyReview).toBe("A factual weekly review.");

      const third = await service.issue(
        scope,
        input(),
        null,
        new Date("2026-08-05T12:02:00.000Z"),
      );
      expect(third).toEqual(expect.objectContaining({ state: "issued", reused: true }));
      expect(calls).toBe(2);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_weekly_review_requests`).get())
        .toEqual({ count: 1 });
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_review_generation_attempts`).get())
        .toEqual({ count: 2 });
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_weekly_issued_reviews`).get())
        .toEqual({ count: 1 });
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_review_generation_attempt_receipts`).get())
        .toEqual({ count: 2 });
      expect(settings.readCostSummary()).toEqual({
        generationCount: 2,
        totalTokens: 450,
        estimatedCostUsd: "0.002250",
      });
      expect(reviews.listIssuedWeeklyReviews(scope)).toEqual([
        expect.objectContaining({
          issuedReviewId: second.review.issuedReviewId,
          weekStartDate: "2026-08-03",
          weekEndDate: "2026-08-09",
        }),
      ]);
      expect(reviews.readLatestIssuedWeeklyReviewBefore(scope, "2026-08-10"))
        .toEqual(expect.objectContaining({ issuedReviewId: second.review.issuedReviewId }));
      expect(reviews.readLatestIssuedWeeklyReviewBefore(scope, "2026-08-03")).toBeNull();
      expect(reviews.listIssuedWeeklyReviews(secondAccountScope)).toEqual([]);
      expect(() => reviews.readIssuedWeeklyReview(
        secondAccountScope,
        second.review.issuedReviewId,
      )).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      database.close();
    }
  });

  it("does not start a second provider call while the same request attempt is pending", () => {
    const { database, scope } = setup();
    try {
      const settings = new CoachAiProviderSettingsRepository(database);
      const reviews = new CoachAiReviewRepository(database);
      const request = reviews.createOrReadWeeklyRequest(scope, input(), null, new Date(createdAtUtc));
      const first = reviews.beginWeeklyAttempt(scope, request.requestId, settings.read(), new Date(createdAtUtc));
      const second = reviews.beginWeeklyAttempt(
        scope,
        request.requestId,
        settings.read(),
        new Date("2026-08-05T12:01:00.000Z"),
      );
      expect(first).toEqual(expect.objectContaining({ state: "started", attemptNumber: 1 }));
      expect(second).toEqual(expect.objectContaining({ state: "in_progress", attemptNumber: 1 }));
    } finally {
      database.close();
    }
  });

  it("records a failed attempt without inventing missing provider usage", async () => {
    const { database, scope } = setup();
    try {
      const settings = new CoachAiProviderSettingsRepository(database);
      const service = new CoachWeeklyAiReviewIssuanceService(
        new CoachAiReviewRepository(database),
        settings,
        async () => {
          throw Object.assign(new Error("provider failed"), {
            usage: { totalTokens: 150 },
          });
        },
      );

      await expect(service.issue(scope, input(), null, new Date(createdAtUtc)))
        .resolves.toEqual(expect.objectContaining({ state: "failed", retryAvailable: true }));
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM coach_ai_review_generation_attempt_receipts`).get()).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });
});
