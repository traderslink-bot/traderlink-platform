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
  type CoachAiReviewEvidenceSufficiencyV2,
} from "./coach-ai-review-evidence-sufficiency";
import {
  assessCoachPeriodicReviewEligibilityV2,
  type CoachPeriodicReviewEligibilityV2,
} from "./coach-ai-review-eligibility";
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
  type CoachAiReviewAccountSettingsV2,
} from "./coach-weekly-review-schedule-repository";

export {
  assessCoachPeriodicReviewEligibilityV2,
  COACH_PERIODIC_REFLECTION_WINDOW_MILLISECONDS,
} from "./coach-ai-review-eligibility";
export type {
  CoachPeriodicReviewEligibilityV2,
} from "./coach-ai-review-eligibility";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";
import type { CoachUsEquitiesReviewCalendarService } from
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

export type CoachPeriodicReviewPlanV2 = Readonly<{
  scope: WorkspaceAccessScope;
  period: CoachPeriodicReviewPeriodV2;
  state: "suppressed_monthly_only" | "waiting_for_seal" | "insufficient_evidence" |
    "manual_available" | "automatic_ready" | "already_requested";
  snapshot: CoachPeriodicAiReviewSnapshotV2 | null;
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

function safeIssuedReviewRef(value: string): string {
  return `issued_review_sha256:${createHash("sha256")
    .update(`${value}\n`, "utf8").digest("hex")}`;
}

function twoWeekPeriodStarting(
  calendar: CoachUsEquitiesReviewCalendarService,
  startDate: string,
): CoachPeriodicReviewPeriodV2 {
  const firstCohort = calendar.cohortStarting(startDate);
  return calculateCoachPeriodicReviewDueTimeV2({
    cadence: "two_week",
    cadenceAnchorMondayDate: startDate,
    now: new Date(firstCohort.sealedAtUtc),
    calendar,
  }).period;
}

function weeklyPeriodStarting(
  calendar: CoachUsEquitiesReviewCalendarService,
  startDate: string,
): CoachPeriodicReviewPeriodV2 {
  const cohort = calendar.cohortStarting(startDate);
  return calculateCoachPeriodicReviewDueTimeV2({
    cadence: "weekly",
    cadenceAnchorMondayDate: null,
    now: new Date(cohort.sealedAtUtc),
    calendar,
  }).period;
}

function planState(
  eligibility: CoachPeriodicReviewEligibilityV2,
): CoachPeriodicReviewPlanV2["state"] {
  if (eligibility.reason === "period_not_sealed") return "waiting_for_seal";
  if (eligibility.reason === "insufficient_evidence") return "insufficient_evidence";
  return eligibility.generationMode === "automatic"
    ? "automatic_ready"
    : "manual_available";
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
  planAccountV2(
    scope: WorkspaceAccessScope,
    now = new Date(),
  ): readonly CoachPeriodicReviewPlanV2[] {
    return this.planV2(now, scope);
  }

  planV2(
    now = new Date(),
    requestedScope: WorkspaceAccessScope | null = null,
  ): readonly CoachPeriodicReviewPlanV2[] {
    const calendar = new CoachUsEquitiesCalendarRepository(this.database).calendar();
    const scheduleRepository = new CoachReviewDeliveryScheduleRepository(this.database);
    const scheduled: readonly Readonly<{
      scope: WorkspaceAccessScope;
      settings: CoachAiReviewAccountSettingsV2;
    }>[] = requestedScope
      ? (() => {
          const settings = scheduleRepository.readV2(requestedScope);
          return settings?.isEnabled
            ? [Object.freeze({ scope: requestedScope, settings })]
            : [];
        })()
      : scheduleRepository.listEnabledAccountsV2();
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
      const hasPriorCadencePeriod = current.period.cadence === "weekly" ||
        current.period.startDate !== anchor;
      const due = current.state === "due" || !hasPriorCadencePeriod
        ? current
        : calculateCoachPeriodicReviewDueTimeV2({
            cadence: current.period.cadence,
            cadenceAnchorMondayDate: anchor,
            now,
            periodOffset: -1,
            calendar,
          });
      const firstEnabledMarketDate = calendar.marketDateAt(
        new Date(account.settings.firstEnabledAtUtc),
      );
      const existingPlan = (
        period: CoachPeriodicReviewPeriodV2,
      ): CoachPeriodicReviewPlanV2 | null => {
        const existing = reviews.readPeriodRequestByIdentityV2(
          account.scope,
          period.cadence,
          period.startDate,
          period.endDate,
        );
        return existing ? Object.freeze({
          scope: account.scope,
          period,
          state: "already_requested" as const,
          snapshot: null,
          existingRequestId: existing.requestId,
          priorIssuedReviewId: existing.priorIssuedReviewId,
          automaticAtUtc: null,
          evidence: null,
        }) : null;
      };
      const buildPlan = (
        period: CoachPeriodicReviewPeriodV2,
      ): CoachPeriodicReviewPlanV2 => {
        const priorIssued = reviews.listIssuedReviewsV2(account.scope, {
          beforePeriodEndDate: period.startDate,
          reviewKinds: ["weekly", "two_week"],
          limit: 1,
        }).at(0) ?? null;
        const priorOutput = priorIssued?.output.contractVersion ===
          COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION ? priorIssued.output : null;
        const snapshot = buildCoachPeriodicAiReviewSnapshotV2(
          this.database,
          account.scope,
          {
            calendar,
            period: Object.freeze({
              cadence: period.cadence,
              startDate: period.startDate,
              endDate: period.endDate,
              calendarTimezone: period.timezone,
              calendarId: period.calendarId,
              calendarEvidenceDigestSha256: period.calendarEvidenceDigestSha256,
              cohorts: period.cohorts,
            }),
            reflectionEligibilityStartDate: firstEnabledMarketDate,
            carryForwardEvidenceBundles: Object.freeze([]),
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
        const finalCohortMonday = period.cohorts.at(-1)?.mondayDate;
        if (!finalCohortMonday) {
          throw new Error("TRADERLINK_COACH_REVIEW_CALENDAR_COHORT_EMPTY");
        }
        const followingTradingWeek = calendar.cohortStarting(
          shiftDate(finalCohortMonday, 7),
        );
        const eligibility = assessCoachPeriodicReviewEligibilityV2(snapshot, now, {
          mode: account.settings.timingMode,
          followingTradingWeekSealedAtUtc: followingTradingWeek.sealedAtUtc,
        });
        return Object.freeze({
          scope: account.scope,
          period,
          state: planState(eligibility),
          snapshot,
          existingRequestId: null,
          priorIssuedReviewId: priorIssued?.issuedReviewId ?? null,
          automaticAtUtc: eligibility.automaticAtUtc,
          evidence: eligibility.evidence,
        });
      };

      if (due.period.cadence === "weekly") {
        const priorPairStart = shiftDate(due.period.startDate, -7);
        if (priorPairStart >= mondayDate(firstEnabledMarketDate)) {
          const priorPair = twoWeekPeriodStarting(calendar, priorPairStart);
          const priorPairExisting = existingPlan(priorPair);
          if (priorPairExisting) return [priorPairExisting];
          const priorWeekly = weeklyPeriodStarting(calendar, priorPairStart);
          if (!existingPlan(priorWeekly)) {
            const priorWeeklyPlan = buildPlan(priorWeekly);
            if (priorWeeklyPlan.evidence?.deferableSingleTrade) {
              return [buildPlan(priorPair)];
            }
            if (priorWeeklyPlan.evidence?.sufficient &&
                priorWeeklyPlan.state !== "waiting_for_seal") {
              return [priorWeeklyPlan];
            }
          }
        }
      }
      const existing = existingPlan(due.period);
      if (existing) return [existing];
      const basePlan = buildPlan(due.period);
      if (due.period.cadence !== "weekly" || !basePlan.evidence?.deferableSingleTrade) {
        return [basePlan];
      }
      const combinedPeriod = twoWeekPeriodStarting(calendar, due.period.startDate);
      const combinedExisting = existingPlan(combinedPeriod);
      return [combinedExisting ?? buildPlan(combinedPeriod)];
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
