import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { CoachWeeklyAiReviewInput } from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION,
} from "../contracts/weekly-ai-review-output-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import {
  buildCoachPeriodicAiReviewSnapshotV2,
  buildCoachWeeklyAiReviewInput,
  type CoachPeriodicAiReviewSnapshotV2,
} from "./coach-weekly-ai-review-input-runtime";
import {
  CoachWeeklyAiReviewIssuanceService,
  type CoachWeeklyReviewGenerator,
} from "./coach-weekly-ai-review-issuance-service";
import { generateCoachWeeklyAiReview } from "./coach-weekly-ai-review-openai-adapter";
import {
  calculateCoachPeriodicReviewDueTimeV2,
  calculateCoachWeeklyReviewDueTime,
  type CoachPeriodicReviewPeriodV2,
} from "./coach-weekly-review-due-time";
import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
} from "./coach-weekly-review-schedule-repository";
import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";

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

export type CoachPeriodicReviewEligibilityV2 = Readonly<{
  eligible: boolean;
  generationMode: "automatic" | "manual" | null;
  reason: "eligible" | "period_not_sealed" | "no_completed_reflections" |
    "manual_generation_required";
}>;

export function assessCoachPeriodicReviewEligibilityV2(
  snapshot: CoachPeriodicAiReviewSnapshotV2,
  now: Date,
): CoachPeriodicReviewEligibilityV2 {
  const sealedAt = snapshot.input.period.cohorts.at(-1)?.sealedAtUtc;
  if (!sealedAt || now.getTime() < new Date(sealedAt).getTime()) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "period_not_sealed",
    });
  }
  if (snapshot.input.completedDailyReflections.length === 0) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "no_completed_reflections",
    });
  }
  const finalOpenDate = snapshot.input.period.cohorts.at(-1)?.finalOpenSessionDate;
  const finalCoverage = snapshot.input.reflectionCoverage.find((coverage) =>
    coverage.reviewMarketDate === finalOpenDate);
  const hasIncompleteCreatedReview = snapshot.input.reflectionCoverage.some((coverage) =>
    coverage.reflectionState === "incomplete");
  if (finalCoverage?.reflectionState === "completed" && !hasIncompleteCreatedReview) {
    return Object.freeze({ eligible: true, generationMode: "automatic", reason: "eligible" });
  }
  return Object.freeze({
    eligible: true,
    generationMode: "manual",
    reason: "manual_generation_required",
  });
}

export type CoachPeriodicReviewPlanV2 = Readonly<{
  scope: WorkspaceAccessScope;
  period: CoachPeriodicReviewPeriodV2;
  state: "suppressed_monthly_only" | "waiting_for_seal" | "no_completed_reflections" |
    "manual_available" | "automatic_ready" | "already_requested";
  snapshot: CoachPeriodicAiReviewSnapshotV2 | null;
  existingRequestId: string | null;
}>;

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayDate(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  return shiftDate(value, -((date.getUTCDay() + 6) % 7));
}

function safeIssuedReviewRef(value: string): string {
  return `issued_review_sha256:${createHash("sha256")
    .update(`${value}\n`, "utf8").digest("hex")}`;
}

export class CoachWeeklyAiReviewRunner {
  constructor(
    private readonly database: Database.Database,
    private readonly buildInput: InputBuilder = buildCoachWeeklyAiReviewInput,
    private readonly generate: CoachWeeklyReviewGenerator = generateCoachWeeklyAiReview,
  ) {}

  /**
   * Read-only V2 planning. It never creates a request, reserves paid capacity,
   * or calls a provider; a later activation checkpoint may consume the plan.
   */
  planV2(now = new Date()): readonly CoachPeriodicReviewPlanV2[] {
    const calendar = new CoachUsEquitiesReviewCalendarService();
    const scheduled = new CoachReviewDeliveryScheduleRepository(this.database)
      .listEnabledAccountsV2();
    const reviews = new CoachAiReviewRepository(this.database);
    return Object.freeze(scheduled.flatMap<CoachPeriodicReviewPlanV2>((account) => {
      const marketMonday = mondayDate(calendar.marketDateAt(now));
      const effective = resolveCoachEffectiveAiReviewFrequencyV2(
        account.settings,
        marketMonday,
      );
      const anchor = effective.frequency === "two_week"
        ? effective.twoWeekAnchorMondayDate
        : null;
      const current = effective.frequency === "monthly_only" ? null :
        calculateCoachPeriodicReviewDueTimeV2({
          cadence: effective.frequency,
          cadenceAnchorMondayDate: anchor,
          now,
          calendar,
        });
      if (!current) return [];
      const due = current.state === "due" ? current : calculateCoachPeriodicReviewDueTimeV2({
        cadence: effective.frequency as "weekly" | "two_week",
        cadenceAnchorMondayDate: anchor,
        now,
        periodOffset: -1,
        calendar,
      });
      const existing = reviews.readPeriodRequestByIdentityV2(
        account.scope,
        due.period.cadence,
        due.period.startDate,
        due.period.endDate,
      );
      if (existing) return [Object.freeze({
        scope: account.scope,
        period: due.period,
        state: "already_requested" as const,
        snapshot: null,
        existingRequestId: existing.requestId,
      })];
      const priorDue = due.period.cadence === "two_week" &&
        due.period.startDate === anchor ? null : calculateCoachPeriodicReviewDueTimeV2({
          cadence: due.period.cadence,
          cadenceAnchorMondayDate: anchor,
          now: new Date(due.period.cohorts[0]!.sealedAtUtc),
          periodOffset: -1,
          calendar,
        });
      const priorSnapshot = priorDue ? buildCoachPeriodicAiReviewSnapshotV2(
        this.database,
        account.scope,
        { period: Object.freeze({
          cadence: priorDue.period.cadence,
          startDate: priorDue.period.startDate,
          endDate: priorDue.period.endDate,
          calendarTimezone: priorDue.period.timezone,
          calendarId: priorDue.period.calendarId,
          calendarEvidenceDigestSha256: priorDue.period.calendarEvidenceDigestSha256,
          cohorts: priorDue.period.cohorts,
        }), reflectionEligibilityStartDate: calendar.marketDateAt(
          new Date(account.settings.firstEnabledAtUtc),
        ) },
      ) : null;
      const priorRequest = priorDue ? reviews.readPeriodRequestByIdentityV2(
        account.scope,
        priorDue.period.cadence,
        priorDue.period.startDate,
        priorDue.period.endDate,
      ) : null;
      const priorIssued = priorRequest?.issuedReviewId
        ? reviews.readIssuedReviewV2(account.scope, priorRequest.issuedReviewId)
        : null;
      const priorOutput = priorIssued?.output.contractVersion ===
        COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION ? priorIssued.output : null;
      const carry = priorDue && priorSnapshot &&
        priorSnapshot.input.completedDailyReflections.length >= 1 &&
        priorSnapshot.input.completedDailyReflections.length <= 2
        ? priorSnapshot.input.completedDailyReflections.map((reflection) => Object.freeze({
            evidenceRef: reflection.evidenceRef,
            sourcePeriodStartDate: priorDue.period.startDate,
            sourcePeriodEndDate: priorDue.period.endDate,
            destinationPeriodStartDate: due.period.startDate,
            destinationPeriodEndDate: due.period.endDate,
            reflection,
            representedByPriorReviewRef: priorIssued
              ? safeIssuedReviewRef(priorIssued.issuedReviewId)
              : null,
            evidenceWeight: "single_observation" as const,
            statisticalUse: "prohibited" as const,
          }))
        : [];
      const snapshot = buildCoachPeriodicAiReviewSnapshotV2(
        this.database,
        account.scope,
        {
          period: Object.freeze({
            cadence: due.period.cadence,
            startDate: due.period.startDate,
            endDate: due.period.endDate,
            calendarTimezone: due.period.timezone,
            calendarId: due.period.calendarId,
            calendarEvidenceDigestSha256: due.period.calendarEvidenceDigestSha256,
            cohorts: due.period.cohorts,
          }),
          reflectionEligibilityStartDate: calendar.marketDateAt(
            new Date(account.settings.firstEnabledAtUtc),
          ),
          carryForwardEvidenceBundles: carry,
          priorIssuedReview: priorIssued && priorOutput ? Object.freeze({
            reviewRef: safeIssuedReviewRef(priorIssued.issuedReviewId),
            cadence: priorIssued.reviewKind as "weekly" | "two_week",
            periodStartDate: priorIssued.periodStartDate,
            periodEndDate: priorIssued.periodEndDate,
            reviewSummary: priorOutput.reviewSummary,
            whatImproved: priorOutput.whatImproved,
            whatHeldYouBack: priorOutput.whatHeldYouBack,
            focusFollowThrough: priorOutput.focusFollowThrough,
            nextPeriodFocuses: Object.freeze([...priorOutput.nextPeriodFocuses]),
            incompleteRecord: priorOutput.incompleteRecord,
            representedEvidenceRefs: Object.freeze([...priorIssued.representedEvidenceRefs]),
          }) : null,
        },
      );
      const eligibility = assessCoachPeriodicReviewEligibilityV2(snapshot, now);
      const state = eligibility.reason === "period_not_sealed"
        ? "waiting_for_seal" as const
        : eligibility.reason === "no_completed_reflections"
          ? "no_completed_reflections" as const
          : eligibility.generationMode === "automatic"
            ? "automatic_ready" as const
            : "manual_available" as const;
      return [Object.freeze({
        scope: account.scope,
        period: due.period,
        state,
        snapshot,
        existingRequestId: null,
      })];
    }));
  }

  async run(now = new Date()): Promise<CoachWeeklyReviewRunSummary> {
    const scheduledAccounts = new CoachReviewDeliveryScheduleRepository(this.database)
      .listEnabledAccounts();
    const reviews = new CoachAiReviewRepository(this.database);
    const issuance = new CoachWeeklyAiReviewIssuanceService(
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
      const alreadyIssued = reviews.listIssuedWeeklyReviews(account.scope, 2)
        .some((review) => review.weekStartDate === due.period.startDate &&
          review.weekEndDate === due.period.endDate);
      if (alreadyIssued) {
        counts.reusedCount += 1;
        continue;
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
