import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachPeriodicAiReviewInputV2 } from
  "../contracts/weekly-ai-review-input-contracts";
import type { CoachMonthlyAiReviewEvidencePacket } from
  "../contracts/coach-monthly-ai-review-evidence-authoring-contracts";

import { buildCoachMonthlyAiReviewEvidencePacketFromPeriodicInputsV2 } from
  "./coach-monthly-ai-review-evidence-packet-builder";
import type { CoachMonthlyReviewPlanV2 } from "./coach-monthly-ai-review-runner";
import { buildCoachPeriodicAiReviewSnapshotV2 } from
  "./coach-weekly-ai-review-input-runtime";
import { CoachReviewDeliveryScheduleRepository } from
  "./coach-weekly-review-schedule-repository";
import { CoachUsEquitiesCalendarRepository } from
  "./market-calendar/coach-us-equities-calendar-repository";

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_DATE_INVALID");
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_DATE_INVALID");
  }
  return shiftDate(value, -((date.getUTCDay() + 6) % 7));
}

function calendarMonthBefore(startDate: string): Readonly<{
  startDate: string;
  endDate: string;
}> {
  const start = new Date(`${startDate}T12:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.getUTCDate() !== 1) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_PERIOD_INVALID");
  }
  start.setUTCMonth(start.getUTCMonth() - 1);
  const previousStart = start.toISOString().slice(0, 10);
  const end = new Date(`${previousStart}T12:00:00.000Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  return Object.freeze({
    startDate: previousStart,
    endDate: end.toISOString().slice(0, 10),
  });
}

function inputsForMonth(input: Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
  startDate: string;
  endDate: string;
  firstEnabledMarketDate: string;
  allowUnavailableCalendarCoverage?: boolean;
}>): readonly CoachPeriodicAiReviewInputV2[] {
  const calendar = new CoachUsEquitiesCalendarRepository(input.database).calendar();
  let coverageStartDate: string;
  try {
    coverageStartDate = calendar.metadataForRange(input.startDate, input.endDate).coverageStartDate;
  } catch (error) {
    if (input.allowUnavailableCalendarCoverage && error instanceof RangeError) {
      return Object.freeze([]);
    }
    throw error;
  }
  const snapshots: CoachPeriodicAiReviewInputV2[] = [];
  let firstMonday = mondayOf(input.startDate);
  if (firstMonday < coverageStartDate) firstMonday = shiftDate(firstMonday, 7);
  for (
    let monday = firstMonday;
    monday <= input.endDate;
    monday = shiftDate(monday, 7)
  ) {
    const cohort = calendar.cohortStarting(monday);
    const metadata = calendar.metadataForRange(cohort.mondayDate, cohort.fridayDate);
    snapshots.push(buildCoachPeriodicAiReviewSnapshotV2(input.database, input.scope, {
      calendar,
      period: Object.freeze({
        cadence: "weekly",
        startDate: cohort.mondayDate,
        endDate: cohort.fridayDate,
        calendarTimezone: "America/New_York",
        calendarId: metadata.calendarId,
        calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
        cohorts: Object.freeze([cohort]),
      }),
      reflectionEligibilityStartDate: input.firstEnabledMarketDate,
    }).input);
  }
  return Object.freeze(snapshots);
}

/**
 * Re-reads exact current and prior calendar-month Journal facts for V4
 * authoring. Unlike the retired monthly narrative path, this deliberately
 * never reads current-month weekly review prose and never removes Analyzer
 * execution-path evidence from a day simply because a weekly review exists.
 */
export function buildCoachMonthlyAiReviewEvidencePacketFromPlanV4(
  database: Database.Database,
  plan: CoachMonthlyReviewPlanV2,
): CoachMonthlyAiReviewEvidencePacket {
  if (!plan.snapshot) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_PLAN_SNAPSHOT_REQUIRED");
  }
  const settings = new CoachReviewDeliveryScheduleRepository(database).readV2(plan.scope);
  if (!settings) throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_SETTINGS_MISSING");
  const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
  const firstEnabledMarketDate = calendar.marketDateAt(new Date(settings.firstEnabledAtUtc));
  const period = Object.freeze({
    calendarMonthStartDate: plan.period.calendarMonthStartDate,
    calendarMonthEndDate: plan.period.calendarMonthEndDate,
    timezone: "America/New_York" as const,
    currency: plan.snapshot.input.calendarMonth.currency ?? "USD",
  });
  const priorBounds = calendarMonthBefore(period.calendarMonthStartDate);
  const priorPeriod = Object.freeze({
    calendarMonthStartDate: priorBounds.startDate,
    calendarMonthEndDate: priorBounds.endDate,
    timezone: "America/New_York" as const,
    currency: period.currency,
  });
  return buildCoachMonthlyAiReviewEvidencePacketFromPeriodicInputsV2({
    period,
    currentMonthWeeks: inputsForMonth({
      database,
      scope: plan.scope,
      startDate: period.calendarMonthStartDate,
      endDate: period.calendarMonthEndDate,
      firstEnabledMarketDate,
    }),
    priorMonthPeriod: priorPeriod,
    priorMonthWeeks: inputsForMonth({
      database,
      scope: plan.scope,
      startDate: priorPeriod.calendarMonthStartDate,
      endDate: priorPeriod.calendarMonthEndDate,
      firstEnabledMarketDate,
      allowUnavailableCalendarCoverage: true,
    }),
  });
}
