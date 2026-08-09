import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import {
  CoachAiReviewRepository,
  type CoachAiReviewInputV2,
  type CoachAiReviewRequestOperationalStateV2,
} from "./coach-ai-review-repository";
import {
  assessCoachMonthlyEvidenceSufficiencyV2,
  assessCoachPeriodicEvidenceSufficiencyV2,
  type CoachAiReviewEvidenceSufficiencyV2,
} from "./coach-ai-review-evidence-sufficiency";
import { CoachMonthlyAiReviewRunner } from "./coach-monthly-ai-review-runner";
import type { CoachMonthlyReviewPeriodV2 } from "./coach-monthly-review-due-time";
import {
  CoachWeeklyAiReviewRunner,
  type CoachPeriodicReviewPlanV2,
} from "./coach-weekly-ai-review-runner";
import type { CoachPeriodicReviewPeriodV2 } from "./coach-weekly-review-due-time";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";

type ReviewStatus = "reviewed" | "incomplete";

type ReviewCoverage = Readonly<{
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewStatusByDate: ReadonlyMap<string, ReviewStatus | null>;
}>;

export type CoachTradeTrackerReviewDayAvailabilityV2 = Readonly<{
  marketDate: string;
  state: "completed" | "not_complete";
}>;

type EvidenceAvailability = Readonly<{
  readyClosedTradeCount: number;
  substantiveReflectionCount: number;
  savedTagCount: number;
  reviewedRuleOutcomeCount: number;
}>;

export type CoachPeriodicReviewAvailabilityV2 = Readonly<{
  period: CoachPeriodicReviewPeriodV2;
  state: "waiting_for_period" | "waiting_for_seal" | "insufficient_evidence" |
    "manual_available" | "automatic_ready" | "already_requested";
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewDays: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
  evidence: EvidenceAvailability;
  automaticAtUtc: string | null;
  requestState: CoachAiReviewRequestOperationalStateV2 | null;
}>;

export type CoachMonthlyReviewAvailabilityV2 = Readonly<{
  period: CoachMonthlyReviewPeriodV2;
  state: "waiting_for_delivery" | "insufficient_evidence" |
    "manual_available" | "automatic_ready" | "already_requested";
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewDays: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
  evidence: EvidenceAvailability;
  automaticAtUtc: string | null;
  requestState: CoachAiReviewRequestOperationalStateV2 | null;
}>;

export type CoachAiReviewAvailabilityV2 = Readonly<{
  periodic: CoachPeriodicReviewAvailabilityV2 | null;
  monthly: CoachMonthlyReviewAvailabilityV2 | null;
}>;

function activeAccountId(scope: WorkspaceAccessScope): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function readCoverage(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  marketDates: readonly string[],
): ReviewCoverage {
  if (marketDates.length === 0) {
    return Object.freeze({
      completedReviewCount: 0,
      incompleteReviewCount: 0,
      reviewStatusByDate: new Map<string, ReviewStatus | null>(),
    });
  }
  const accountId = activeAccountId(scope);
  const rows = database.prepare(`SELECT day.trading_date, review.review_status
FROM journal_trading_days day
LEFT JOIN journal_trading_day_reviews review
  ON review.workspace_id = day.workspace_id
 AND review.account_id = day.account_id
 AND review.trading_day_id = day.trading_day_id
WHERE day.workspace_id = ? AND day.account_id = ?
  AND day.status = 'active' AND day.trading_timezone = 'America/New_York'
  AND day.trading_date IN (${marketDates.map(() => "?").join(", ")})`)
    .all(scope.workspaceId, accountId, ...marketDates) as readonly Readonly<{
      trading_date: string;
      review_status: ReviewStatus | null;
    }>[];
  const completedReviewCount = rows.filter((row) => row.review_status === "reviewed").length;
  return Object.freeze({
    completedReviewCount,
    incompleteReviewCount: rows.length - completedReviewCount,
    reviewStatusByDate: new Map(rows.map((row) => [
      row.trading_date,
      row.review_status,
    ] as const)),
  });
}

function requestedCoverage(input: CoachAiReviewInputV2): ReviewCoverage {
  const rows = input.reflectionCoverage.filter((coverage) =>
    coverage.reflectionState === "completed" || coverage.reflectionState === "incomplete");
  const completedReviewCount = rows
    .filter((coverage) => coverage.reflectionState === "completed").length;
  return Object.freeze({
    completedReviewCount,
    incompleteReviewCount: rows.length - completedReviewCount,
    reviewStatusByDate: new Map(rows.map((coverage) => [
      coverage.reviewMarketDate,
      coverage.reflectionState === "completed" ? "reviewed" as const : "incomplete" as const,
    ])),
  });
}

function reviewDays(
  dates: readonly string[],
  coverage: ReviewCoverage,
): readonly CoachTradeTrackerReviewDayAvailabilityV2[] {
  return Object.freeze(dates.flatMap((marketDate) => {
    if (!coverage.reviewStatusByDate.has(marketDate)) return [];
    return [Object.freeze({
      marketDate,
      state: coverage.reviewStatusByDate.get(marketDate) === "reviewed"
        ? "completed" as const
        : "not_complete" as const,
    })];
  }));
}

function evidenceAvailability(
  evidence: CoachAiReviewEvidenceSufficiencyV2,
): EvidenceAvailability {
  return Object.freeze({
    readyClosedTradeCount: evidence.readyClosedTradeCount,
    substantiveReflectionCount: evidence.substantiveReflectionCount,
    savedTagCount: evidence.savedTagCount,
    reviewedRuleOutcomeCount: evidence.reviewedRuleOutcomeCount,
  });
}

function visiblePeriodicState(
  state: CoachPeriodicReviewPlanV2["state"],
): CoachPeriodicReviewAvailabilityV2["state"] {
  if (state === "suppressed_monthly_only") {
    throw new Error("TRADERLINK_COACH_MONTHLY_ONLY_PERIODIC_PLAN_VISIBLE");
  }
  return state;
}

function periodicInput(input: CoachAiReviewInputV2) {
  if (!("reviewPeriodMarketFacts" in input)) {
    throw new Error("TRADERLINK_COACH_PERIODIC_REVIEW_INPUT_MISMATCH");
  }
  return input;
}

function monthlyInput(input: CoachAiReviewInputV2) {
  if (!("calendarMonthFacts" in input)) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INPUT_MISMATCH");
  }
  return input;
}

/**
 * Read-only availability. It builds the same exact evidence plan used by the
 * request service so UI readiness cannot diverge from server-side eligibility.
 */
export class CoachAiReviewAvailabilityService {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope, now = new Date()): CoachAiReviewAvailabilityV2 {
    const requests = new CoachAiReviewRepository(this.database);
    const calendar = new CoachUsEquitiesCalendarRepository(this.database).calendar();
    const periodicCandidate = new CoachWeeklyAiReviewRunner(this.database)
      .planAccountV2(scope, now).at(0) ?? null;
    const periodicPlan = periodicCandidate?.state === "suppressed_monthly_only"
      ? null
      : periodicCandidate;
    const monthlyPlan = new CoachMonthlyAiReviewRunner(this.database)
      .planAccountV2(scope, now).at(0) ?? null;

    const periodic = periodicPlan ? (() => {
      const storedInput = periodicPlan.existingRequestId
        ? periodicInput(requests.readInputV2(scope, periodicPlan.existingRequestId))
        : null;
      const input = periodicPlan.snapshot?.input ?? storedInput;
      if (!input) throw new Error("TRADERLINK_COACH_PERIODIC_REVIEW_INPUT_MISSING");
      const evidence = periodicPlan.evidence ?? assessCoachPeriodicEvidenceSufficiencyV2(input);
      const marketDates = periodicPlan.period.cohorts.flatMap((cohort) =>
        cohort.openSessionDates);
      const liveCoverage = readCoverage(this.database, scope, marketDates);
      const displayedCoverage = storedInput ? requestedCoverage(storedInput) : liveCoverage;
      return Object.freeze({
        period: periodicPlan.period,
        state: visiblePeriodicState(periodicPlan.state),
        completedReviewCount: displayedCoverage.completedReviewCount,
        incompleteReviewCount: displayedCoverage.incompleteReviewCount,
        reviewDays: reviewDays(marketDates, displayedCoverage),
        evidence: evidenceAvailability(evidence),
        automaticAtUtc: periodicPlan.automaticAtUtc,
        requestState: periodicPlan.existingRequestId
          ? requests.readPeriodRequestOperationalStateV2(
              scope,
              periodicPlan.existingRequestId,
            )
          : null,
      });
    })() : null;

    const monthly = monthlyPlan ? (() => {
      const storedInput = monthlyPlan.existingRequestId
        ? monthlyInput(requests.readInputV2(scope, monthlyPlan.existingRequestId))
        : null;
      const input = monthlyPlan.snapshot?.input ?? storedInput;
      if (!input) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INPUT_MISSING");
      const evidence = monthlyPlan.evidence ?? assessCoachMonthlyEvidenceSufficiencyV2(input);
      const dates: string[] = [];
      for (
        let date = monthlyPlan.period.coverageStartDate;
        date <= monthlyPlan.period.coverageEndDate;
        date = shiftDate(date, 1)
      ) {
        if (calendar.session(date).state === "open") dates.push(date);
      }
      const liveCoverage = readCoverage(this.database, scope, dates);
      const displayedCoverage = storedInput ? requestedCoverage(storedInput) : liveCoverage;
      return Object.freeze({
        period: monthlyPlan.period,
        state: monthlyPlan.state,
        completedReviewCount: displayedCoverage.completedReviewCount,
        incompleteReviewCount: displayedCoverage.incompleteReviewCount,
        reviewDays: reviewDays(dates, displayedCoverage),
        evidence: evidenceAvailability(evidence),
        automaticAtUtc: monthlyPlan.automaticAtUtc,
        requestState: monthlyPlan.existingRequestId
          ? requests.readPeriodRequestOperationalStateV2(
              scope,
              monthlyPlan.existingRequestId,
            )
          : null,
      });
    })() : null;

    return Object.freeze({ periodic, monthly });
  }
}
