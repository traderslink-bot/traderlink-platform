import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { CoachWeeklyAiReviewInput } from "../contracts/weekly-ai-review-input-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { buildCoachWeeklyAiReviewInput } from "./coach-weekly-ai-review-input-runtime";
import {
  CoachWeeklyAiReviewIssuanceService,
  type CoachWeeklyReviewGenerator,
} from "./coach-weekly-ai-review-issuance-service";
import { generateCoachWeeklyAiReview } from "./coach-weekly-ai-review-openai-adapter";
import { calculateCoachWeeklyReviewDueTime } from "./coach-weekly-review-due-time";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

export type CoachWeeklyReviewRunSummary = Readonly<{
  scheduledAccountCount: number;
  issuedCount: number;
  reusedCount: number;
  failedCount: number;
  inProgressCount: number;
  skippedNoTradesCount: number;
}>;

type InputBuilder = (
  database: Database.Database,
  scope: WorkspaceAccessScope,
  anchorDate: string,
) => CoachWeeklyAiReviewInput;

export class CoachWeeklyAiReviewRunner {
  constructor(
    private readonly database: Database.Database,
    private readonly buildInput: InputBuilder = buildCoachWeeklyAiReviewInput,
    private readonly generate: CoachWeeklyReviewGenerator = generateCoachWeeklyAiReview,
  ) {}

  async run(now = new Date()): Promise<CoachWeeklyReviewRunSummary> {
    const scheduledAccounts = new CoachReviewDeliveryScheduleRepository(this.database)
      .listEnabledAccounts();
    const reviews = new CoachAiReviewRepository(this.database);
    const issuance = new CoachWeeklyAiReviewIssuanceService(
      reviews,
      new CoachAiProviderSettingsRepository(this.database),
      this.generate,
    );
    const counts = {
      issuedCount: 0,
      reusedCount: 0,
      failedCount: 0,
      inProgressCount: 0,
      skippedNoTradesCount: 0,
    };

    for (const account of scheduledAccounts) {
      let due = calculateCoachWeeklyReviewDueTime({
        accountTradingTimezone: account.accountTimezone,
        weeklyDeliveryDay: account.schedule.weeklyDeliveryDay,
        deliveryTimeEastern: account.schedule.deliveryTimeEastern,
        now,
      });
      if (due.state === "not_due") {
        due = calculateCoachWeeklyReviewDueTime({
          accountTradingTimezone: account.accountTimezone,
          weeklyDeliveryDay: account.schedule.weeklyDeliveryDay,
          deliveryTimeEastern: account.schedule.deliveryTimeEastern,
          now,
          periodOffsetWeeks: -1,
        });
      }
      if (due.state !== "due") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "prior_week_must_be_due",
        });
      }
      const input = this.buildInput(this.database, account.scope, due.period.endDate);
      if (input.week.startDate !== due.period.startDate ||
          input.week.endDate !== due.period.endDate ||
          input.week.timezone !== due.period.timezone) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "weekly_review_period_mismatch",
        });
      }
      if (input.summary.readyClosedTradeCount === 0) {
        counts.skippedNoTradesCount += 1;
        continue;
      }
      const prior = reviews.readLatestIssuedWeeklyReviewBefore(
        account.scope,
        input.week.startDate,
      );
      const result = await issuance.issue(
        account.scope,
        input,
        prior?.issuedReviewId ?? null,
        now,
      );
      if (result.state === "failed") counts.failedCount += 1;
      if (result.state === "in_progress") counts.inProgressCount += 1;
      if (result.state === "issued" && result.reused) counts.reusedCount += 1;
      if (result.state === "issued" && !result.reused) counts.issuedCount += 1;
    }

    return Object.freeze({
      scheduledAccountCount: scheduledAccounts.length,
      ...counts,
    });
  }
}
