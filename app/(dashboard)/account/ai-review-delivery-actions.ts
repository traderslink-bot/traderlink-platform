"use server";

import { revalidatePath } from "next/cache";

import {
  CoachReviewDeliveryScheduleRepository,
  resolveCoachEffectiveAiReviewFrequencyV2,
  type CoachAiReviewAccountSettingsV2,
  type CoachAiReviewFrequencyV2,
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

export async function saveAiReviewFrequency(input: Readonly<{
  frequency: unknown;
  expectedRevision: unknown;
}>): Promise<SaveAiReviewFrequencyResult> {
  const frequency = parseFrequency(input.frequency);
  const expectedRevision = parseExpectedRevision(input.expectedRevision);
  if (!frequency || expectedRevision === undefined) {
    return Object.freeze({ ok: false, message: "Choose a valid AI Review frequency." });
  }

  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const settings = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const repository = new CoachReviewDeliveryScheduleRepository(database);
      const current = repository.readV2(scope);
      const now = new Date();
      const calendar = new CoachUsEquitiesCalendarRepository(database).calendar();
      if (!current || !current.isEnabled) {
        const cohortMonday = calendar.cohortForDate(calendar.marketDateAt(now)).mondayDate;
        return repository.saveV2(scope, {
          isEnabled: true,
          currentFrequency: frequency,
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
          ? "Choose a valid AI Review frequency."
          : "Your AI Review frequency could not be saved. Try again.",
    });
  }
}
