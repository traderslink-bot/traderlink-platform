import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  CoachMonthlyAiReviewInputV2,
  CoachMonthlyAiReviewInput,
  CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { CoachAiProviderSettingsRepository } from "./coach-ai-provider-settings-repository";
import { CoachAiReviewProviderControlsRepository } from "./coach-ai-review-provider-controls-repository";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import {
  assessCoachMonthlyEvidenceSufficiencyV2,
  type CoachAiReviewEvidenceSufficiencyV2,
} from "./coach-ai-review-evidence-sufficiency";
import {
  buildCoachMonthlyAiReviewInput,
  buildCoachMonthlyAiReviewSnapshotV2,
  type CoachMonthlyAiReviewSnapshotV2,
  type CoachMonthlyNarrativePeriodV2,
} from "./coach-monthly-ai-review-input-runtime";
import {
  CoachMonthlyAiReviewIssuanceService,
  type CoachMonthlyReviewGenerator,
} from "./coach-monthly-ai-review-issuance-service";
import { assessCoachFirstPartialMonthEligibility } from "./coach-monthly-ai-review-input-service";
import { generateCoachMonthlyAiReview } from "./coach-monthly-ai-review-openai-adapter";
import {
  calculateCoachMonthlyReviewDueTime,
  calculateCoachMonthlyReviewDueTimeV2,
  type CoachMonthlyReviewPeriodV2,
} from "./coach-monthly-review-due-time";
import {
  calculateCoachPeriodicReviewDueTimeV2,
} from "./coach-weekly-review-due-time";
import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
  type CoachAiReviewAccountSettingsV2,
  type CoachAiReviewAccountSettingsRevisionV2,
} from "./coach-weekly-review-schedule-repository";
import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";

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

export type CoachMonthlyReviewEligibilityV2 = Readonly<{
  eligible: boolean;
  generationMode: "automatic" | "manual" | null;
  reason: "eligible" | "delivery_not_reached" | "insufficient_evidence" |
    "manual_generation_required";
  automaticAtUtc: string | null;
  evidence: CoachAiReviewEvidenceSufficiencyV2;
}>;

export function assessCoachMonthlyReviewEligibilityV2(
  input: CoachMonthlyAiReviewInputV2,
  now: Date,
  _completedAtScheduledSnapshotCount = 0,
): CoachMonthlyReviewEligibilityV2 {
  void _completedAtScheduledSnapshotCount;
  const evidence = assessCoachMonthlyEvidenceSufficiencyV2(input);
  if (now.getTime() < new Date(input.calendarMonth.scheduledAtUtc).getTime()) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "delivery_not_reached",
      automaticAtUtc: input.calendarMonth.scheduledAtUtc,
      evidence,
    });
  }
  if (!evidence.sufficient) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "insufficient_evidence",
      automaticAtUtc: null,
      evidence,
    });
  }
  return Object.freeze({
    eligible: true,
    generationMode: "automatic",
    reason: "eligible",
    automaticAtUtc: input.calendarMonth.scheduledAtUtc,
    evidence,
  });
}

export type CoachMonthlyReviewPlanV2 = Readonly<{
  scope: WorkspaceAccessScope;
  period: CoachMonthlyReviewPeriodV2;
  state: "waiting_for_delivery" | "insufficient_evidence" |
    "manual_available" | "automatic_ready" | "already_requested";
  snapshot: CoachMonthlyAiReviewSnapshotV2 | null;
  existingRequestId: string | null;
  priorIssuedReviewId: string | null;
  automaticAtUtc: string | null;
  evidence: CoachAiReviewEvidenceSufficiencyV2 | null;
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

function narrativePeriods(
  settingsHistory: readonly CoachAiReviewAccountSettingsRevisionV2[],
  period: CoachMonthlyReviewPeriodV2,
  calendar: CoachUsEquitiesReviewCalendarService,
): readonly CoachMonthlyNarrativePeriodV2[] {
  const result = new Map<string, CoachMonthlyNarrativePeriodV2>();
  const verifiedCoverageStartDate = calendar.metadataForRange(
    period.coverageStartDate,
    period.coverageEndDate,
  ).coverageStartDate;
  let firstMonday = mondayDate(period.coverageStartDate);
  // A calendar snapshot may begin mid-week. There is no verified complete
  // weekly period before its first Monday, so exclude that partial boundary
  // from monthly narrative context rather than asking the calendar for
  // unavailable earlier sessions.
  if (firstMonday < verifiedCoverageStartDate) firstMonday = shiftDate(firstMonday, 7);
  for (
    let monday = firstMonday;
    monday <= period.coverageEndDate;
    monday = shiftDate(monday, 7)
  ) {
    const cohort = calendar.cohortStarting(monday);
    const revisionCutoff = calendar.easternWallClockAtUtc(
      shiftDate(cohort.fridayDate, 1),
      "00:00",
    );
    const settings = settingsHistory
      .filter((revision) => revision.updatedAtUtc < revisionCutoff)
      .at(-1) ?? settingsHistory[0];
    if (!settings) throw new Error("TRADERLINK_COACH_REVIEW_SETTINGS_HISTORY_MISSING");
    const effective = resolveCoachEffectiveAiReviewFrequencyV2(settings, monday);
    if (effective.frequency === "monthly_only") {
      const route = Object.freeze({
        cadence: "monthly_only" as const,
        periodStartDate: period.coverageStartDate,
        periodEndDate: period.coverageEndDate,
      });
      result.set(`monthly:${period.coverageStartDate}`, route);
      continue;
    }
    const due = calculateCoachPeriodicReviewDueTimeV2({
      cadence: effective.frequency,
      cadenceAnchorMondayDate: effective.twoWeekAnchorMondayDate,
      now: new Date(`${monday}T16:00:00.000Z`),
      calendar,
    });
    result.set(`${due.period.cadence}:${due.period.startDate}`, Object.freeze({
      cadence: due.period.cadence,
      periodStartDate: due.period.startDate,
      periodEndDate: due.period.endDate,
    }));
  }
  return Object.freeze([...result.values()]);
}

export class CoachMonthlyAiReviewRunner {
  constructor(
    private readonly database: Database.Database,
    private readonly buildInput: InputBuilder = buildCoachMonthlyAiReviewInput,
    private readonly generate: CoachMonthlyReviewGenerator = generateCoachMonthlyAiReview,
  ) {}

  /** Read-only V2 planning; no request write, paid reservation, or provider call. */
  planAccountV2(
    scope: WorkspaceAccessScope,
    now = new Date(),
  ): readonly CoachMonthlyReviewPlanV2[] {
    return this.planV2(now, scope);
  }

  planV2(
    now = new Date(),
    requestedScope: WorkspaceAccessScope | null = null,
  ): readonly CoachMonthlyReviewPlanV2[] {
    const calendar = new CoachUsEquitiesCalendarRepository(this.database).calendar();
    const settingsRepository = new CoachReviewDeliveryScheduleRepository(this.database);
    const accounts: readonly Readonly<{
      scope: WorkspaceAccessScope;
      settings: CoachAiReviewAccountSettingsV2;
    }>[] = requestedScope
      ? (() => {
          const settings = settingsRepository.readV2(requestedScope);
          return settings?.isEnabled
            ? [Object.freeze({ scope: requestedScope, settings })]
            : [];
        })()
      : settingsRepository.listEnabledAccountsV2();
    const reviews = new CoachAiReviewRepository(this.database);
    return Object.freeze(accounts.flatMap<CoachMonthlyReviewPlanV2>((account) => {
      let due = calculateCoachMonthlyReviewDueTimeV2({
        monthlyEnabledAtUtc: account.settings.firstEnabledAtUtc,
        now,
        calendar,
      });
      if (due.state === "not_due" && due.reason === "delivery_not_reached") {
        const prior = calculateCoachMonthlyReviewDueTimeV2({
          monthlyEnabledAtUtc: account.settings.firstEnabledAtUtc,
          now,
          periodOffsetMonths: -1,
          calendar,
        });
        if (!(prior.state === "not_due" && prior.reason === "enabled_after_period")) {
          due = prior;
        }
      }
      if (due.state === "not_due" && due.reason === "enabled_after_period") {
        due = calculateCoachMonthlyReviewDueTimeV2({
          monthlyEnabledAtUtc: account.settings.firstEnabledAtUtc,
          now,
          periodOffsetMonths: 1,
          calendar,
        });
      }
      const existing = reviews.readPeriodRequestByIdentityV2(
        account.scope,
        "monthly",
        due.period.calendarMonthStartDate,
        due.period.calendarMonthEndDate,
      );
      if (existing) return [Object.freeze({
        scope: account.scope,
        period: due.period,
        state: "already_requested" as const,
        snapshot: null,
        existingRequestId: existing.requestId,
        priorIssuedReviewId: existing.priorIssuedReviewId,
        automaticAtUtc: null,
        evidence: null,
      })];
      const priorIssued = due.period.periodCoverage === "partial_month"
        ? null
        : reviews.listIssuedReviewsV2(account.scope, {
            beforePeriodEndDate: due.period.calendarMonthStartDate,
            reviewKinds: ["monthly"],
            limit: 1,
          }).at(0) ?? null;
      const snapshot = buildCoachMonthlyAiReviewSnapshotV2(
        this.database,
        account.scope,
        {
          period: due.period,
          scheduledAtUtc: due.scheduledAtUtc,
          firstEnabledMarketDate: calendar.marketDateAt(
            new Date(account.settings.firstEnabledAtUtc),
          ),
          narrativePeriods: narrativePeriods(
            settingsRepository.listRevisionsV2(account.scope),
            due.period,
            calendar,
          ),
          calendar,
        },
      );
      const eligibility = assessCoachMonthlyReviewEligibilityV2(
        snapshot.input,
        now,
      );
      const state = eligibility.reason === "delivery_not_reached"
        ? "waiting_for_delivery" as const
        : eligibility.reason === "insufficient_evidence"
          ? "insufficient_evidence" as const
          : eligibility.generationMode === "automatic"
            ? "automatic_ready" as const
            : "manual_available" as const;
      return [Object.freeze({
        scope: account.scope,
        period: due.period,
        state,
        snapshot,
        existingRequestId: null,
        priorIssuedReviewId: priorIssued?.issuedReviewId ?? null,
        automaticAtUtc: eligibility.automaticAtUtc,
        evidence: eligibility.evidence,
      })];
    }));
  }

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
