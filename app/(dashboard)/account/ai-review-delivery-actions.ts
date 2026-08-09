"use server";

import { revalidatePath } from "next/cache";

import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
  type CoachAiReviewAccountSettingsV2,
  type CoachAiReviewFrequencyV2,
  type CoachAiReviewTimingModeV2,
} from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { CoachUsEquitiesReviewCalendarService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { CoachUsEquitiesCalendarRepository } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { calculateCoachPeriodicReviewDueTimeV2 } from "@/src/modules/coach/server/coach-weekly-review-due-time";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

const FREQUENCIES = new Set<CoachAiReviewFrequencyV2>([
  "weekly",
  "two_week",
  "monthly_only",
]);
const TIMING_MODES = new Set<CoachAiReviewTimingModeV2>([
  "automatic_after_12_hours",
  "wait_for_tracker_input",
]);

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseFrequency(value: unknown): CoachAiReviewFrequencyV2 | null {
  return typeof value === "string" && FREQUENCIES.has(value as CoachAiReviewFrequencyV2)
    ? value as CoachAiReviewFrequencyV2
    : null;
}

function parseTimingMode(value: unknown): CoachAiReviewTimingModeV2 | null {
  return typeof value === "string" && TIMING_MODES.has(value as CoachAiReviewTimingModeV2)
    ? value as CoachAiReviewTimingModeV2
    : null;
}

function parseExpectedRevision(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1
    ? value
    : undefined;
}

function nextFrequencyStart(
  current: CoachAiReviewAccountSettingsV2,
  now: Date,
  calendar: CoachUsEquitiesReviewCalendarService,
): string {
  const cohort = calendar.cohortForDate(calendar.marketDateAt(now));
  const firstOpenSessionDate = cohort.openSessionDates[0];
  if (!firstOpenSessionDate) throw new Error("TRADERLINK_COACH_REVIEW_CALENDAR_COHORT_EMPTY");
  const firstPremarketAtUtc = calendar.easternWallClockAtUtc(firstOpenSessionDate, "04:00");
  if (now.getTime() < new Date(firstPremarketAtUtc).getTime()) return cohort.mondayDate;

  const effective = resolveCoachEffectiveAiReviewFrequencyV2(current, cohort.mondayDate);
  if (effective.frequency !== "two_week") return shiftDate(cohort.mondayDate, 7);
  const period = calculateCoachPeriodicReviewDueTimeV2({
    cadence: "two_week",
    cadenceAnchorMondayDate: effective.twoWeekAnchorMondayDate,
    now,
    calendar,
  }).period;
  return shiftDate(period.endDate, 3);
}

export type SaveAiReviewFrequencyResult =
  | Readonly<{ ok: true; settings: CoachAiReviewAccountSettingsV2 }>
  | Readonly<{ ok: false; message: string }>;

export async function saveAiReviewSettings(input: Readonly<{
  isEnabled: unknown;
  frequency: unknown;
  timingMode: unknown;
  expectedRevision: unknown;
}>): Promise<SaveAiReviewFrequencyResult> {
  const frequency = parseFrequency(input.frequency);
  const timingMode = parseTimingMode(input.timingMode);
  const expectedRevision = parseExpectedRevision(input.expectedRevision);
  if (typeof input.isEnabled !== "boolean" || !frequency || !timingMode ||
      expectedRevision === undefined) {
    return Object.freeze({ ok: false, message: "Choose valid AI Review settings." });
  }
  const isEnabled = input.isEnabled;

  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const settings = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const repository = new CoachReviewDeliveryScheduleRepository(database);
      const current = repository.readV2(scope);
      const now = new Date();
      const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
      if (current && !input.isEnabled) {
        return repository.saveV2(scope, {
          isEnabled: false,
          currentFrequency: current.currentFrequency,
          timingMode,
          twoWeekAnchorMondayDate: current.twoWeekAnchorMondayDate,
          pendingFrequency: null,
          pendingEffectiveMondayDate: null,
          pendingTwoWeekAnchorMondayDate: null,
          expectedRevision,
        }, now);
      }
      if (!current || !current.isEnabled) {
        const cohortMonday = calendar.cohortForDate(calendar.marketDateAt(now)).mondayDate;
        return repository.saveV2(scope, {
          isEnabled,
          currentFrequency: frequency,
          timingMode,
          twoWeekAnchorMondayDate: frequency === "two_week" ? cohortMonday : null,
          pendingFrequency: null,
          pendingEffectiveMondayDate: null,
          pendingTwoWeekAnchorMondayDate: null,
          expectedRevision,
        }, now);
      }

      const effectiveMonday = nextFrequencyStart(current, now, calendar);
      const currentEffective = resolveCoachEffectiveAiReviewFrequencyV2(
        current,
        calendar.cohortForDate(calendar.marketDateAt(now)).mondayDate,
      );
      if (frequency === currentEffective.frequency) {
        return repository.saveV2(scope, {
          isEnabled: true,
          currentFrequency: currentEffective.frequency,
          timingMode,
          twoWeekAnchorMondayDate: currentEffective.frequency === "two_week"
            ? currentEffective.twoWeekAnchorMondayDate
            : null,
          pendingFrequency: null,
          pendingEffectiveMondayDate: null,
          pendingTwoWeekAnchorMondayDate: null,
          expectedRevision,
        }, now);
      }
      return repository.saveV2(scope, {
        isEnabled: true,
        currentFrequency: currentEffective.frequency,
        timingMode,
        twoWeekAnchorMondayDate: currentEffective.frequency === "two_week"
          ? currentEffective.twoWeekAnchorMondayDate
          : null,
        pendingFrequency: frequency,
        pendingEffectiveMondayDate: effectiveMonday,
        pendingTwoWeekAnchorMondayDate: frequency === "two_week" ? effectiveMonday : null,
        expectedRevision,
      }, now);
    });
    revalidatePath("/account");
    revalidatePath("/ai-reviews");
    return Object.freeze({ ok: true, settings });
  } catch (error) {
    const conflict = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT";
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false,
      message: conflict
          ? "These settings changed in another window. Refresh and try again."
          : invalid
          ? "Choose valid AI Review settings."
          : "Your AI Review settings could not be saved. Try again.",
    });
  }
}
