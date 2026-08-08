import {
  CoachUsEquitiesReviewCalendarService,
  type CoachUsEquitiesReviewCohort,
} from "./market-calendar/coach-us-equities-review-calendar-service";

const EASTERN_TIMEZONE = "America/New_York";

export type CoachWeeklyReviewDeliveryDay = "friday" | "saturday" | "sunday";

export type CoachWeeklyReviewDueTimeInput = Readonly<{
  accountTradingTimezone: string;
  weeklyDeliveryDay: CoachWeeklyReviewDeliveryDay;
  deliveryTimeEastern: string;
  now: Date;
  periodOffsetWeeks?: 0 | -1;
}>;

export type CoachWeeklyReviewPeriod = Readonly<{
  startDate: string;
  endDate: string;
  timezone: string;
}>;

export type CoachWeeklyReviewDueTimeResult =
  | Readonly<{
      state: "due";
      period: CoachWeeklyReviewPeriod;
      scheduledAtUtc: string;
    }>
  | Readonly<{
      state: "not_due";
      reason: "delivery_not_reached";
      period: CoachWeeklyReviewPeriod;
      scheduledAtUtc: string;
    }>;

type CalendarParts = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

type WallClockParts = CalendarParts & Readonly<{
  hour: number;
  minute: number;
  second: number;
}>;

const DELIVERY_DAY_OFFSETS_FROM_MONDAY: Readonly<Record<CoachWeeklyReviewDeliveryDay, number>> = Object.freeze({
  friday: 4,
  saturday: 5,
  sunday: 6,
});

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const wallClockFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timezone: string): Intl.DateTimeFormat {
  const existing = dateFormatterCache.get(timezone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    month: "2-digit",
    numberingSystem: "latn",
    timeZone: timezone,
    year: "numeric",
  });
  dateFormatterCache.set(timezone, created);
  return created;
}

function wallClockFormatter(timezone: string): Intl.DateTimeFormat {
  const existing = wallClockFormatterCache.get(timezone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    numberingSystem: "latn",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  });
  wallClockFormatterCache.set(timezone, created);
  return created;
}

function partsByType(
  formatter: Intl.DateTimeFormat,
  instant: Date,
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(formatter.formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value])));
}

function numericPart(parts: Readonly<Record<string, string>>, name: string): number {
  const value = Number(parts[name]);
  if (!Number.isInteger(value)) {
    throw new RangeError(`Timezone formatter did not return a numeric ${name}`);
  }
  return value;
}

function validateTimezone(timezone: string): void {
  if (typeof timezone !== "string" || timezone.trim() !== timezone || timezone.length === 0) {
    throw new RangeError("A valid IANA timezone is required");
  }
  try {
    dateFormatter(timezone).format(new Date(0));
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timezone}`);
  }
}

function calendarPartsAt(instant: Date, timezone: string): CalendarParts {
  const parts = partsByType(dateFormatter(timezone), instant);
  return Object.freeze({
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
  });
}

function wallClockPartsAt(instant: Date, timezone: string): WallClockParts {
  const parts = partsByType(wallClockFormatter(timezone), instant);
  return Object.freeze({
    ...calendarPartsAt(instant, timezone),
    hour: numericPart(parts, "hour"),
    minute: numericPart(parts, "minute"),
    second: numericPart(parts, "second"),
  });
}

function dateFromParts(parts: CalendarParts): Date {
  const instant = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (!Number.isFinite(instant.getTime()) ||
      instant.getUTCFullYear() !== parts.year ||
      instant.getUTCMonth() !== parts.month - 1 ||
      instant.getUTCDate() !== parts.day) {
    throw new RangeError("Invalid calendar date");
  }
  return instant;
}

function dateString(parts: CalendarParts): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(date: CalendarParts, amount: number): CalendarParts {
  const instant = dateFromParts(date);
  instant.setUTCDate(instant.getUTCDate() + amount);
  return Object.freeze({
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  });
}

function mondayOfWeek(date: CalendarParts): CalendarParts {
  const weekday = dateFromParts(date).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

function parseDeliveryTime(value: string): Readonly<{ hour: number; minute: number }> {
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  const hour = Number(match?.[1]);
  const minute = Number(match?.[2]);
  if (!match || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new RangeError(`Invalid Eastern delivery time: ${value}`);
  }
  return Object.freeze({ hour, minute });
}

function sameWallClock(left: WallClockParts, right: WallClockParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day &&
    left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

/**
 * Converts a local wall-clock value to UTC using the runtime's IANA timezone
 * data. The round-trip check rejects a delivery time that does not exist
 * during a DST transition instead of silently shifting it.
 */
function zonedWallClockToUtc(
  date: CalendarParts,
  time: Readonly<{ hour: number; minute: number }>,
  timezone: string,
): Date {
  const localAsUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, 0, 0);
  let candidate = localAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = wallClockPartsAt(new Date(candidate), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
      0,
    );
    candidate += localAsUtc - actualAsUtc;
  }
  const resolved = new Date(candidate);
  const expected = Object.freeze({ ...date, ...time, second: 0 });
  if (!Number.isFinite(resolved.getTime()) || !sameWallClock(wallClockPartsAt(resolved, timezone), expected)) {
    throw new RangeError(`Eastern delivery time does not exist on ${dateString(date)}`);
  }
  return resolved;
}

/**
 * Returns the schedule for the current account-local Monday-Sunday period.
 * Friday is the effective market-week close; Saturday and Sunday are delayed
 * delivery choices for that same labeled period.
 */
export function calculateCoachWeeklyReviewDueTime(
  input: CoachWeeklyReviewDueTimeInput,
): CoachWeeklyReviewDueTimeResult {
  validateTimezone(input.accountTradingTimezone);
  validateTimezone(EASTERN_TIMEZONE);
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime())) {
    throw new RangeError("A valid current instant is required");
  }
  if (!(input.weeklyDeliveryDay in DELIVERY_DAY_OFFSETS_FROM_MONDAY)) {
    throw new RangeError(`Invalid weekly delivery day: ${input.weeklyDeliveryDay}`);
  }
  const deliveryTime = parseDeliveryTime(input.deliveryTimeEastern);
  const periodOffsetWeeks = input.periodOffsetWeeks ?? 0;
  if (periodOffsetWeeks !== 0 && periodOffsetWeeks !== -1) {
    throw new RangeError(`Invalid weekly period offset: ${periodOffsetWeeks}`);
  }
  const currentLocalDate = calendarPartsAt(input.now, input.accountTradingTimezone);
  const currentWeekStart = mondayOfWeek(currentLocalDate);
  const periodStart = addDays(currentWeekStart, periodOffsetWeeks * 7);
  const periodEnd = addDays(periodStart, 6);
  const period = Object.freeze({
    startDate: dateString(periodStart),
    endDate: dateString(periodEnd),
    timezone: input.accountTradingTimezone,
  });
  const deliveryDate = addDays(periodStart, DELIVERY_DAY_OFFSETS_FROM_MONDAY[input.weeklyDeliveryDay]);
  const scheduledAtUtc = zonedWallClockToUtc(deliveryDate, deliveryTime, EASTERN_TIMEZONE);
  const scheduledAtUtcString = scheduledAtUtc.toISOString();
  if (input.now.getTime() >= scheduledAtUtc.getTime()) {
    return Object.freeze({ state: "due", period, scheduledAtUtc: scheduledAtUtcString });
  }
  return Object.freeze({
    state: "not_due",
    reason: "delivery_not_reached",
    period,
    scheduledAtUtc: scheduledAtUtcString,
  });
}

export type CoachPeriodicReviewCadenceV2 = "weekly" | "two_week";

export type CoachPeriodicReviewDueTimeInputV2 = Readonly<{
  cadence: CoachPeriodicReviewCadenceV2;
  cadenceAnchorMondayDate?: string | null;
  now: Date;
  periodOffset?: 1 | 0 | -1;
  calendar?: CoachUsEquitiesReviewCalendarService;
}>;

export type CoachPeriodicReviewPeriodV2 = Readonly<{
  cadence: CoachPeriodicReviewCadenceV2;
  startDate: string;
  endDate: string;
  timezone: typeof EASTERN_TIMEZONE;
  cohorts: readonly CoachUsEquitiesReviewCohort[];
  calendarId: string;
  calendarEvidenceDigestSha256: string;
}>;

export type CoachPeriodicReviewDueTimeResultV2 =
  | Readonly<{
      state: "due";
      period: CoachPeriodicReviewPeriodV2;
      sealedAtUtc: string;
      scheduledAtUtc: string;
      nextOpenSessionDate: string;
    }>
  | Readonly<{
      state: "not_due";
      reason: "period_not_sealed";
      period: CoachPeriodicReviewPeriodV2;
      sealedAtUtc: string;
      scheduledAtUtc: string;
      nextOpenSessionDate: string;
    }>;

function parseIsoDate(value: string, name: string): CalendarParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match || value.trim() !== value) {
    throw new RangeError(`${name} must be an ISO date`);
  }
  const result = Object.freeze({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
  if (dateString(Object.freeze({
    year: dateFromParts(result).getUTCFullYear(),
    month: dateFromParts(result).getUTCMonth() + 1,
    day: dateFromParts(result).getUTCDate(),
  })) !== value) {
    throw new RangeError(`${name} must be a real calendar date`);
  }
  return result;
}

function wholeWeeksBetween(leftMonday: CalendarParts, rightMonday: CalendarParts): number {
  const elapsedDays = (dateFromParts(rightMonday).getTime() - dateFromParts(leftMonday).getTime()) /
    86_400_000;
  if (!Number.isInteger(elapsedDays) || elapsedDays % 7 !== 0) {
    throw new RangeError("AI Review cadence dates must align to Mondays");
  }
  return elapsedDays / 7;
}

/**
 * Resolves the market-calendar period that contains the current Eastern market
 * date. V2 generation is due at the factual period seal, not at a selected
 * Friday/Saturday/Sunday delivery time. The next open session is returned only
 * for freshness messaging; it never expires the review.
 */
export function calculateCoachPeriodicReviewDueTimeV2(
  input: CoachPeriodicReviewDueTimeInputV2,
): CoachPeriodicReviewDueTimeResultV2 {
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime())) {
    throw new RangeError("A valid current instant is required");
  }
  if (input.cadence !== "weekly" && input.cadence !== "two_week") {
    throw new RangeError(`Invalid AI Review cadence: ${input.cadence}`);
  }
  const offset = input.periodOffset ?? 0;
  if (offset !== 1 && offset !== 0 && offset !== -1) {
    throw new RangeError(`Invalid AI Review period offset: ${offset}`);
  }

  const calendar = input.calendar ?? new CoachUsEquitiesReviewCalendarService();
  const currentMarketDate = parseIsoDate(calendar.marketDateAt(input.now), "current market date");
  const currentMonday = mondayOfWeek(currentMarketDate);
  if (input.cadence === "two_week" && !input.cadenceAnchorMondayDate) {
    throw new RangeError("Two-week AI Reviews require a cadence anchor Monday");
  }
  const anchor = input.cadence === "weekly"
    ? currentMonday
    : parseIsoDate(input.cadenceAnchorMondayDate!, "cadenceAnchorMondayDate");
  if (dateFromParts(anchor).getUTCDay() !== 1) {
    throw new RangeError("cadenceAnchorMondayDate must be a Monday");
  }
  const weeksFromAnchor = wholeWeeksBetween(anchor, currentMonday);
  const cohortsPerPeriod = input.cadence === "weekly" ? 1 : 2;
  const currentPeriodIndex = Math.floor(weeksFromAnchor / cohortsPerPeriod);
  const requestedPeriodIndex = currentPeriodIndex + offset;
  if (
    weeksFromAnchor < 0 ||
    (input.cadence === "two_week" && requestedPeriodIndex < 0)
  ) {
    throw new RangeError("Requested AI Review period predates its cadence anchor");
  }

  const periodStart = addDays(anchor, requestedPeriodIndex * cohortsPerPeriod * 7);
  const cohorts = Object.freeze(Array.from({ length: cohortsPerPeriod }, (_, index) =>
    calendar.cohortStarting(dateString(addDays(periodStart, index * 7)))));
  const finalCohort = cohorts.at(-1);
  if (!finalCohort) throw new RangeError("AI Review period has no market cohort");
  const metadata = calendar.metadata();
  const period = Object.freeze({
    cadence: input.cadence,
    startDate: dateString(periodStart),
    endDate: finalCohort.fridayDate,
    timezone: EASTERN_TIMEZONE,
    cohorts,
    calendarId: metadata.calendarId,
    calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
  });
  const sealedAtUtc = finalCohort.sealedAtUtc;
  const scheduledAtUtc = sealedAtUtc;
  const nextOpenSessionDate = calendar.nextOpenSessionDate(finalCohort.fridayDate);
  if (input.now.getTime() >= new Date(sealedAtUtc).getTime()) {
    return Object.freeze({
      state: "due",
      period,
      sealedAtUtc,
      scheduledAtUtc,
      nextOpenSessionDate,
    });
  }
  return Object.freeze({
    state: "not_due",
    reason: "period_not_sealed",
    period,
    sealedAtUtc,
    scheduledAtUtc,
    nextOpenSessionDate,
  });
}
