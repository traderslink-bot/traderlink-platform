import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  CoachMonthlyAiReviewInput,
  CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { buildCoachMonthlyAiReviewInput } from "./coach-monthly-ai-review-input-runtime";
import {
  CoachMonthlyAiReviewIssuanceService,
  type CoachMonthlyReviewGenerator,
} from "./coach-monthly-ai-review-issuance-service";
import { assessCoachFirstPartialMonthEligibility } from "./coach-monthly-ai-review-input-service";
import { generateCoachMonthlyAiReview } from "./coach-monthly-ai-review-openai-adapter";
import { calculateCoachMonthlyReviewDueTime } from "./coach-monthly-review-due-time";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

export type CoachMonthlyReviewRunSummary = Readonly<{
  scheduledAccountCount: number;
  issuedCount: number;
  reusedCount: number;
  failedCount: number;
  inProgressCount: number;
  skippedNoTradesCount: number;
  skippedIneligiblePartialCount: number;
  skippedNotEnabledCount: number;
}>;

type InputBuilder = (
  database: Database.Database,
  scope: WorkspaceAccessScope,
  period: CoachMonthlyAiReviewPeriod,
) => CoachMonthlyAiReviewInput;

export class CoachMonthlyAiReviewRunner {
  constructor(
    private readonly database: Database.Database,
    private readonly buildInput: InputBuilder = buildCoachMonthlyAiReviewInput,
    private readonly generate: CoachMonthlyReviewGenerator = generateCoachMonthlyAiReview,
  ) {}

  async run(now = new Date()): Promise<CoachMonthlyReviewRunSummary> {
    const scheduledAccounts = new CoachReviewDeliveryScheduleRepository(this.database)
      .listEnabledAccounts();
    const reviews = new CoachAiReviewRepository(this.database);
    const issuance = new CoachMonthlyAiReviewIssuanceService(
      reviews,
      new CoachAiProviderSettingsRepository(this.database),
      this.generate,
      new CoachAiReviewProviderControlsRepository(this.database),
    );
    const counts = {
      issuedCount: 0,
      reusedCount: 0,
      failedCount: 0,
      inProgressCount: 0,
      skippedNoTradesCount: 0,
      skippedIneligiblePartialCount: 0,
      skippedNotEnabledCount: 0,
    };

    for (const account of scheduledAccounts) {
      let due = calculateCoachMonthlyReviewDueTime({
        accountTradingTimezone: account.accountTimezone,
        deliveryTimeEastern: account.schedule.deliveryTimeEastern,
        monthlyEnabledAtUtc: account.monthlyEnabledAtUtc,
        now,
      });
      if (due.state === "not_due" && due.reason === "delivery_not_reached") {
        due = calculateCoachMonthlyReviewDueTime({
          accountTradingTimezone: account.accountTimezone,
          deliveryTimeEastern: account.schedule.deliveryTimeEastern,
          monthlyEnabledAtUtc: account.monthlyEnabledAtUtc,
          now,
          periodOffsetMonths: -1,
        });
      }
      if (due.state === "not_due" && due.reason === "enabled_after_period") {
        counts.skippedNotEnabledCount += 1;
        continue;
      }
      if (due.state !== "due") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "prior_month_must_be_due",
        });
      }
      const alreadyIssued = reviews.listIssuedMonthlyReviews(account.scope, 2)
        .some((review) => review.monthStartDate === due.period.startDate &&
          review.monthEndDate === due.period.endDate);
      if (alreadyIssued) {
        counts.reusedCount += 1;
        continue;
      }
      const input = this.buildInput(this.database, account.scope, due.period);
      if (
        input.month.startDate !== due.period.startDate ||
        input.month.endDate !== due.period.endDate ||
        input.month.periodCoverage !== due.period.periodCoverage ||
        input.month.timezone !== due.period.timezone
      ) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "monthly_review_period_mismatch",
        });
      }
      if (input.summary.readyClosedTradeCount === 0) {
        counts.skippedNoTradesCount += 1;
        continue;
      }
      if (input.month.periodCoverage === "partial_month") {
        const reviewedTradingDayCount = input.days.filter((day) => day.reviewed).length;
        const eligibility = assessCoachFirstPartialMonthEligibility({
          aiReviewsEnabledDate: input.month.startDate,
          period: due.period,
          reviewedTradingDayCount,
        });
        if (!eligibility.eligible) {
          counts.skippedIneligiblePartialCount += 1;
          continue;
        }
      }
      const prior = reviews.readLatestIssuedMonthlyReviewBefore(
        account.scope,
        input.month.startDate,
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

    return Object.freeze({ scheduledAccountCount: scheduledAccounts.length, ...counts });
  }
}
