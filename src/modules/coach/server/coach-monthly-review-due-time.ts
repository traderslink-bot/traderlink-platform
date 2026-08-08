import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";

const EASTERN_TIMEZONE = "America/New_York";

export type CoachMonthlyReviewPeriod = Readonly<{
  startDate: string;
  endDate: string;
  periodCoverage: "complete_month" | "partial_month";
  timezone: string;
}>;

export type CoachMonthlyReviewDueTimeInput = Readonly<{
  accountTradingTimezone: string;
  deliveryTimeEastern: string;
  monthlyEnabledAtUtc: string;
  now: Date;
  periodOffsetMonths?: 0 | -1;
}>;

export type CoachMonthlyReviewDueTimeResult =
  | Readonly<{
      state: "due";
      period: CoachMonthlyReviewPeriod;
      scheduledAtUtc: string;
    }>
  | Readonly<{
      state: "not_due";
      reason: "delivery_not_reached" | "enabled_after_period";
      period: CoachMonthlyReviewPeriod;
      scheduledAtUtc: string;
    }>;

type CalendarParts = Readonly<{ year: number; month: number; day: number }>;
type WallClockParts = CalendarParts & Readonly<{ hour: number; minute: number; second: number }>;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timezone: string): Intl.DateTimeFormat {
  const existing = dateFormatters.get(timezone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    month: "2-digit",
    numberingSystem: "latn",
    timeZone: timezone,
    year: "numeric",
  });
  dateFormatters.set(timezone, created);
  return created;
}

function wallClockFormatter(timezone: string): Intl.DateTimeFormat {
  const existing = wallClockFormatters.get(timezone);
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
  wallClockFormatters.set(timezone, created);
  return created;
}

function validateTimezone(timezone: string): void {
  if (typeof timezone !== "string" || timezone.trim() !== timezone || !timezone) {
    throw new RangeError("A valid IANA timezone is required");
  }
  try {
    dateFormatter(timezone).format(new Date(0));
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timezone}`);
  }
}

function parts(
  formatter: Intl.DateTimeFormat,
  instant: Date,
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(formatter.formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value])));
}

function numericPart(values: Readonly<Record<string, string>>, name: string): number {
  const value = Number(values[name]);
  if (!Number.isInteger(value)) throw new RangeError(`Missing ${name}`);
  return value;
}

function calendarPartsAt(instant: Date, timezone: string): CalendarParts {
  const values = parts(dateFormatter(timezone), instant);
  return Object.freeze({
    year: numericPart(values, "year"),
    month: numericPart(values, "month"),
    day: numericPart(values, "day"),
  });
}

function wallClockPartsAt(instant: Date, timezone: string): WallClockParts {
  const values = parts(wallClockFormatter(timezone), instant);
  return Object.freeze({
    year: numericPart(values, "year"),
    month: numericPart(values, "month"),
    day: numericPart(values, "day"),
    hour: numericPart(values, "hour"),
    minute: numericPart(values, "minute"),
    second: numericPart(values, "second"),
  });
}

function dateString(value: CalendarParts): string {
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function shiftMonth(value: CalendarParts, offset: number): CalendarParts {
  const instant = new Date(Date.UTC(value.year, value.month - 1 + offset, 1));
  return Object.freeze({
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: 1,
  });
}

function monthEnd(value: CalendarParts): CalendarParts {
  const instant = new Date(Date.UTC(value.year, value.month, 0));
  return Object.freeze({
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  });
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

function zonedWallClockToUtc(
  date: CalendarParts,
  time: Readonly<{ hour: number; minute: number }>,
  timezone: string,
): Date {
  const localAsUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
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
    );
    candidate += localAsUtc - actualAsUtc;
  }
  const result = new Date(candidate);
  const expected = Object.freeze({ ...date, ...time, second: 0 });
  if (!Number.isFinite(result.getTime()) ||
      !sameWallClock(wallClockPartsAt(result, timezone), expected)) {
    throw new RangeError(`Eastern delivery time does not exist on ${dateString(date)}`);
  }
  return result;
}

/**
 * Resolves the latest closed calendar month. A monthly review becomes due on
 * the first day after that month at the account's selected Eastern delivery
 * time. The first month starts on the account-local enablement date.
 */
export function calculateCoachMonthlyReviewDueTime(
  input: CoachMonthlyReviewDueTimeInput,
): CoachMonthlyReviewDueTimeResult {
  validateTimezone(input.accountTradingTimezone);
  validateTimezone(EASTERN_TIMEZONE);
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime())) {
    throw new RangeError("A valid current instant is required");
  }
  const enabledAt = new Date(input.monthlyEnabledAtUtc);
  if (!Number.isFinite(enabledAt.getTime())) {
    throw new RangeError("A valid monthly enablement instant is required");
  }
  const offset = input.periodOffsetMonths ?? 0;
  if (offset !== 0 && offset !== -1) {
    throw new RangeError(`Invalid monthly period offset: ${offset}`);
  }
  const nowLocal = calendarPartsAt(input.now, input.accountTradingTimezone);
  const currentMonthStart = Object.freeze({ ...nowLocal, day: 1 });
  const candidateMonthStart = shiftMonth(currentMonthStart, -1 + offset);
  const candidateMonthEnd = monthEnd(candidateMonthStart);
  const enabledDate = calendarPartsAt(enabledAt, input.accountTradingTimezone);
  const completeStartDate = dateString(candidateMonthStart);
  const endDate = dateString(candidateMonthEnd);
  const enabledDateString = dateString(enabledDate);
  const startsInsideCandidate = enabledDateString > completeStartDate && enabledDateString <= endDate;
  const period = Object.freeze({
    startDate: startsInsideCandidate ? enabledDateString : completeStartDate,
    endDate,
    periodCoverage: startsInsideCandidate ? "partial_month" as const : "complete_month" as const,
    timezone: input.accountTradingTimezone,
  });
  const deliveryDate = shiftMonth(candidateMonthStart, 1);
  const scheduledAt = zonedWallClockToUtc(
    deliveryDate,
    parseDeliveryTime(input.deliveryTimeEastern),
    EASTERN_TIMEZONE,
  );
  const scheduledAtUtc = scheduledAt.toISOString();
  if (enabledDateString > endDate) {
    return Object.freeze({
      state: "not_due",
      reason: "enabled_after_period",
      period,
      scheduledAtUtc,
    });
  }
  if (input.now.getTime() < scheduledAt.getTime()) {
    return Object.freeze({
      state: "not_due",
      reason: "delivery_not_reached",
      period,
      scheduledAtUtc,
    });
  }
  return Object.freeze({ state: "due", period, scheduledAtUtc });
}

const MONTHLY_REVIEW_TIME_EASTERN_V2 = "08:00" as const;

export type CoachMonthlyReviewDueTimeInputV2 = Readonly<{
  monthlyEnabledAtUtc: string;
  now: Date;
  periodOffsetMonths?: 1 | 0 | -1;
  calendar?: CoachUsEquitiesReviewCalendarService;
}>;

export type CoachMonthlyReviewPeriodV2 = Readonly<{
  calendarMonthStartDate: string;
  calendarMonthEndDate: string;
  coverageStartDate: string;
  coverageEndDate: string;
  periodCoverage: "complete_month" | "partial_month";
  timezone: typeof EASTERN_TIMEZONE;
  calendarId: string;
  calendarEvidenceDigestSha256: string;
}>;

export type CoachMonthlyReviewDueTimeResultV2 =
  | Readonly<{
      state: "due";
      period: CoachMonthlyReviewPeriodV2;
      scheduledAtUtc: string;
      scheduledTimeEastern: typeof MONTHLY_REVIEW_TIME_EASTERN_V2;
    }>
  | Readonly<{
      state: "not_due";
      reason: "delivery_not_reached" | "enabled_after_period";
      period: CoachMonthlyReviewPeriodV2;
      scheduledAtUtc: string;
      scheduledTimeEastern: typeof MONTHLY_REVIEW_TIME_EASTERN_V2;
    }>;

function parseIsoDateV2(value: string, name: string): CalendarParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match || value.trim() !== value) {
    throw new RangeError(`${name} must be an ISO date`);
  }
  const result = Object.freeze({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
  const checked = new Date(Date.UTC(result.year, result.month - 1, result.day));
  if (!Number.isFinite(checked.getTime()) || checked.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`${name} must be a real calendar date`);
  }
  return result;
}

/**
 * Resolves the latest completed Eastern calendar month. V2 always schedules
 * one snapshot at 8:00 AM Eastern on the next calendar day, including weekends
 * and market holidays. The first enabled month keeps its calendar identity but
 * exposes an honest partial coverage range.
 */
export function calculateCoachMonthlyReviewDueTimeV2(
  input: CoachMonthlyReviewDueTimeInputV2,
): CoachMonthlyReviewDueTimeResultV2 {
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime())) {
    throw new RangeError("A valid current instant is required");
  }
  const enabledAt = new Date(input.monthlyEnabledAtUtc);
  if (!Number.isFinite(enabledAt.getTime())) {
    throw new RangeError("A valid monthly enablement instant is required");
  }
  const offset = input.periodOffsetMonths ?? 0;
  if (offset !== 1 && offset !== 0 && offset !== -1) {
    throw new RangeError(`Invalid monthly period offset: ${offset}`);
  }

  const calendar = input.calendar ?? new CoachUsEquitiesReviewCalendarService();
  const nowEastern = parseIsoDateV2(calendar.marketDateAt(input.now), "current Eastern date");
  const currentMonthStart = Object.freeze({ ...nowEastern, day: 1 });
  const calendarMonthStart = shiftMonth(currentMonthStart, -1 + offset);
  const calendarMonthEnd = monthEnd(calendarMonthStart);
  const calendarMonthStartDate = dateString(calendarMonthStart);
  const calendarMonthEndDate = dateString(calendarMonthEnd);
  calendar.session(calendarMonthEndDate);

  const enabledDate = calendar.marketDateAt(enabledAt);
  const coverageStartDate = enabledDate > calendarMonthStartDate
    ? enabledDate
    : calendarMonthStartDate;
  const metadata = calendar.metadata();
  const period = Object.freeze({
    calendarMonthStartDate,
    calendarMonthEndDate,
    coverageStartDate,
    coverageEndDate: calendarMonthEndDate,
    periodCoverage: coverageStartDate > calendarMonthStartDate
      ? "partial_month" as const
      : "complete_month" as const,
    timezone: EASTERN_TIMEZONE,
    calendarId: metadata.calendarId,
    calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
  });
  const deliveryDate = dateString(shiftMonth(calendarMonthStart, 1));
  const scheduledAtUtc = calendar.easternWallClockAtUtc(
    deliveryDate,
    MONTHLY_REVIEW_TIME_EASTERN_V2,
  );
  const resultFields = Object.freeze({
    period,
    scheduledAtUtc,
    scheduledTimeEastern: MONTHLY_REVIEW_TIME_EASTERN_V2,
  });
  if (enabledDate > calendarMonthEndDate) {
    return Object.freeze({
      state: "not_due",
      reason: "enabled_after_period",
      ...resultFields,
    });
  }
  if (input.now.getTime() < new Date(scheduledAtUtc).getTime()) {
    return Object.freeze({
      state: "not_due",
      reason: "delivery_not_reached",
      ...resultFields,
    });
  }
  return Object.freeze({ state: "due", ...resultFields });
}
