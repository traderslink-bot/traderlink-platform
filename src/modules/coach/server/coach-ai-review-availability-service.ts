import type Database from "better-sqlite3";

import {
  CoachAiReviewRepository,
  type CoachAiReviewInputV2,
} from "./coach-ai-review-repository";
import {
  calculateCoachMonthlyReviewDueTimeV2,
  type CoachMonthlyReviewPeriodV2,
} from "./coach-monthly-review-due-time";
import {
  calculateCoachPeriodicReviewDueTimeV2,
  type CoachPeriodicReviewPeriodV2,
} from "./coach-weekly-review-due-time";
import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
} from "./coach-weekly-review-schedule-repository";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

type ReviewStatus = "reviewed" | "incomplete";

type ReviewCoverage = Readonly<{
  completedAtCutoffCount: number;
  completedDates: ReadonlySet<string>;
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewStatusByDate: ReadonlyMap<string, ReviewStatus | null>;
}>;

export type CoachTradeTrackerReviewDayAvailabilityV2 = Readonly<{
  marketDate: string;
  state: "completed" | "not_complete";
}>;

export type CoachPeriodicReviewAvailabilityV2 = Readonly<{
  period: CoachPeriodicReviewPeriodV2;
  state: "waiting_for_period" | "waiting_for_seal" | "no_completed_reflections" |
    "manual_available" | "automatic_ready" | "already_requested";
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewDays: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
}>;

export type CoachMonthlyReviewAvailabilityV2 = Readonly<{
  period: CoachMonthlyReviewPeriodV2;
  state: "waiting_for_delivery" | "no_completed_reflections" |
    "manual_available" | "automatic_ready" | "already_requested";
  completedReviewCount: number;
  incompleteReviewCount: number;
  reviewDays: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
}>;

export type CoachAiReviewAvailabilityV2 = Readonly<{
  periodic: CoachPeriodicReviewAvailabilityV2 | null;
  monthly: CoachMonthlyReviewAvailabilityV2 | null;
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

function activeAccountId(scope: WorkspaceAccessScope): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

function readCoverage(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  marketDates: readonly string[],
  completedCutoffUtc: string | null = null,
): ReviewCoverage {
  if (marketDates.length === 0) {
    return Object.freeze({
      completedAtCutoffCount: 0,
      completedDates: new Set<string>(),
      completedReviewCount: 0,
      incompleteReviewCount: 0,
      reviewStatusByDate: new Map<string, ReviewStatus | null>(),
    });
  }
  const accountId = activeAccountId(scope);
  const rows = database.prepare(`SELECT day.trading_date,
  review.trading_day_review_id, review.current_revision, review.review_status
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
      trading_day_review_id: string | null;
      current_revision: number | null;
      review_status: ReviewStatus | null;
    }>[];
  const completedRows = rows.filter((row) => row.review_status === "reviewed");
  let completedAtCutoffCount = 0;
  if (completedCutoffUtc) {
    const readCompletion = database.prepare<[string, string, string, number, string], {
      completed: number;
    }>(`SELECT EXISTS(SELECT 1
FROM journal_trading_day_review_events
WHERE workspace_id = ? AND account_id = ? AND trading_day_review_id = ?
  AND revision_number = ? AND review_status = 'reviewed'
  AND occurred_at_utc <= ?) AS completed`);
    completedAtCutoffCount = completedRows.filter((row) =>
      row.trading_day_review_id !== null && row.current_revision !== null &&
      readCompletion.get(
        scope.workspaceId,
        accountId,
        row.trading_day_review_id,
        row.current_revision,
        completedCutoffUtc,
      )?.completed === 1).length;
  }
  return Object.freeze({
    completedAtCutoffCount,
    completedDates: new Set(completedRows.map((row) => row.trading_date)),
    completedReviewCount: completedRows.length,
    incompleteReviewCount: rows.length - completedRows.length,
    reviewStatusByDate: new Map(rows.map((row) => [
      row.trading_date,
      row.review_status,
    ] as const)),
  });
}

function requestedCoverage(input: CoachAiReviewInputV2): ReviewCoverage {
  const rows = input.reflectionCoverage.filter((coverage) =>
    coverage.reflectionState === "completed" || coverage.reflectionState === "incomplete");
  const completedDates = new Set(rows
    .filter((coverage) => coverage.reflectionState === "completed")
    .map((coverage) => coverage.reviewMarketDate));
  return Object.freeze({
    completedAtCutoffCount: completedDates.size,
    completedDates,
    completedReviewCount: completedDates.size,
    incompleteReviewCount: rows.length - completedDates.size,
    reviewStatusByDate: new Map(rows.map((coverage) => [
      coverage.reviewMarketDate,
      coverage.reflectionState === "completed" ? "reviewed" as const : "incomplete" as const,
    ])),
  });
}

function weekdayDates(startDate: string, endDate: string): readonly string[] {
  const result: string[] = [];
  for (let date = startDate; date <= endDate; date = shiftDate(date, 1)) {
    const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    if (weekday >= 1 && weekday <= 5) result.push(date);
  }
  return Object.freeze(result);
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

function monthlyWeekdayDates(
  period: CoachMonthlyReviewPeriodV2,
): readonly string[] {
  return weekdayDates(period.coverageStartDate, period.coverageEndDate);
}

/**
 * Lightweight page availability. It reads only review status/date rows and
 * request identity; immutable analytics/evidence snapshots remain generation-time work.
 */
export class CoachAiReviewAvailabilityService {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope, now = new Date()): CoachAiReviewAvailabilityV2 {
    const settings = new CoachReviewDeliveryScheduleRepository(this.database).readV2(scope);
    if (!settings?.isEnabled) {
      return Object.freeze({ periodic: null, monthly: null });
    }
    const calendar = new CoachUsEquitiesCalendarRepository(this.database).calendar();
    const requests = new CoachAiReviewRepository(this.database);
    const firstEnabledMarketDate = calendar.marketDateAt(new Date(settings.firstEnabledAtUtc));
    const currentMarketDate = calendar.marketDateAt(now);
    const marketMonday = mondayDate(currentMarketDate);
    const effective = resolveCoachEffectiveAiReviewFrequencyV2(settings, marketMonday);

    let periodic: CoachPeriodicReviewAvailabilityV2 | null = null;
    if (effective.frequency !== "monthly_only") {
      const anchor = effective.frequency === "two_week"
        ? effective.twoWeekAnchorMondayDate
        : null;
      const current = calculateCoachPeriodicReviewDueTimeV2({
        cadence: effective.frequency,
        cadenceAnchorMondayDate: anchor,
        now,
        calendar,
      });
      const hasPriorCadencePeriod = current.period.cadence === "weekly" ||
        current.period.startDate !== anchor;
      let due = current.state === "due" || !hasPriorCadencePeriod
        ? current
        : calculateCoachPeriodicReviewDueTimeV2({
            cadence: current.period.cadence,
            cadenceAnchorMondayDate: anchor,
            now,
            periodOffset: -1,
            calendar,
          });
      if (due.period.endDate < firstEnabledMarketDate) {
        due = calculateCoachPeriodicReviewDueTimeV2({
          cadence: current.period.cadence,
          cadenceAnchorMondayDate: anchor,
          now,
          periodOffset: 1,
          calendar,
        });
      }
      const marketDates = due.period.cohorts
        .flatMap((cohort) => cohort.openSessionDates)
        .filter((date) => date >= firstEnabledMarketDate);
      const coverage = readCoverage(this.database, scope, marketDates);
      const existing = requests.readPeriodRequestByIdentityV2(
        scope,
        due.period.cadence,
        due.period.startDate,
        due.period.endDate,
      );
      const displayedCoverage = existing
        ? requestedCoverage(requests.readInputV2(scope, existing.requestId))
        : coverage;
      const finalOpenSessionDate = due.period.cohorts.at(-1)?.finalOpenSessionDate;
      const state = existing
        ? "already_requested" as const
        : due.period.startDate > currentMarketDate
          ? "waiting_for_period" as const
          : due.state === "not_due"
            ? "waiting_for_seal" as const
            : coverage.completedReviewCount === 0
              ? "no_completed_reflections" as const
              : finalOpenSessionDate && coverage.completedDates.has(finalOpenSessionDate) &&
                  coverage.incompleteReviewCount === 0
                ? "automatic_ready" as const
                : "manual_available" as const;
      periodic = Object.freeze({
        period: due.period,
        state,
        completedReviewCount: displayedCoverage.completedReviewCount,
        incompleteReviewCount: displayedCoverage.incompleteReviewCount,
        reviewDays: reviewDays(marketDates, displayedCoverage),
      });
    }

    let monthlyDue = calculateCoachMonthlyReviewDueTimeV2({
      monthlyEnabledAtUtc: settings.firstEnabledAtUtc,
      now,
      calendar,
    });
    if (monthlyDue.state === "not_due" && monthlyDue.reason === "delivery_not_reached") {
      const prior = calculateCoachMonthlyReviewDueTimeV2({
        monthlyEnabledAtUtc: settings.firstEnabledAtUtc,
        now,
        periodOffsetMonths: -1,
        calendar,
      });
      if (!(prior.state === "not_due" && prior.reason === "enabled_after_period")) {
        monthlyDue = prior;
      }
    } else if (monthlyDue.state === "not_due" && monthlyDue.reason === "enabled_after_period") {
      monthlyDue = calculateCoachMonthlyReviewDueTimeV2({
        monthlyEnabledAtUtc: settings.firstEnabledAtUtc,
        now,
        periodOffsetMonths: 1,
        calendar,
      });
    }
    const monthlyDates = monthlyWeekdayDates(monthlyDue.period)
      .filter((date) => calendar.session(date).state === "open");
    const monthlyCoverage = readCoverage(
      this.database,
      scope,
      monthlyDates,
      monthlyDue.scheduledAtUtc,
    );
    const existingMonthly = requests.readPeriodRequestByIdentityV2(
      scope,
      "monthly",
      monthlyDue.period.calendarMonthStartDate,
      monthlyDue.period.calendarMonthEndDate,
    );
    const displayedMonthlyCoverage = existingMonthly
      ? requestedCoverage(requests.readInputV2(scope, existingMonthly.requestId))
      : monthlyCoverage;
    const monthlyState = existingMonthly
      ? "already_requested" as const
      : monthlyDue.state === "not_due"
        ? "waiting_for_delivery" as const
        : monthlyCoverage.completedReviewCount === 0
          ? "no_completed_reflections" as const
          : monthlyCoverage.completedAtCutoffCount > 0
            ? "automatic_ready" as const
            : "manual_available" as const;
    const monthly = Object.freeze({
      period: monthlyDue.period,
      state: monthlyState,
      completedReviewCount: displayedMonthlyCoverage.completedReviewCount,
      incompleteReviewCount: displayedMonthlyCoverage.incompleteReviewCount,
      reviewDays: reviewDays(monthlyDates, displayedMonthlyCoverage),
    });
    return Object.freeze({ periodic, monthly });
  }
}
