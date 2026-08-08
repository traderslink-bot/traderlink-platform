import { createHash } from "node:crypto";

import calendarSnapshotJson from "./us-equities-review-calendar.v1.json";

const CALENDAR_CONTRACT_VERSION =
  "traderlink_us_equities_review_calendar_v1" as const;
const EASTERN_TIMEZONE = "America/New_York" as const;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const WALL_CLOCK_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

type CalendarSourceRole =
  | "primary_holiday_calendar"
  | "normal_extended_session_hours"
  | "normal_and_early_close_extended_session_rule"
  | "holiday_and_early_close_cross_check";

type CalendarSource = Readonly<{
  sourceId: string;
  role: CalendarSourceRole;
  url: string;
}>;

type EarlyCloseSession = Readonly<{
  date: string;
  postMarketEndEastern: string;
}>;

type CalendarSnapshot = Readonly<{
  contractVersion: typeof CALENDAR_CONTRACT_VERSION;
  calendarId: string;
  timezone: typeof EASTERN_TIMEZONE;
  coverage: Readonly<{
    startDate: string;
    endDate: string;
    verificationStatus: "verified";
  }>;
  retrievedAtUtc: string;
  evidenceDigestSha256: string;
  sources: readonly CalendarSource[];
  normalWeekdaySession: Readonly<{
    postMarketEndEastern: string;
  }>;
  closedDates: readonly string[];
  earlyCloseSessions: readonly EarlyCloseSession[];
}>;

export type CoachUsEquitiesReviewSession = Readonly<{
  marketDate: string;
  state: "open" | "closed";
  sessionKind: "normal" | "scheduled_early_close" | "weekend" | "holiday";
  postMarketEndEastern: string | null;
  postMarketEndUtc: string | null;
  calendarId: string;
  evidenceDigestSha256: string;
}>;

export type CoachUsEquitiesReviewCohort = Readonly<{
  mondayDate: string;
  fridayDate: string;
  openSessionDates: readonly string[];
  finalOpenSessionDate: string;
  sealedAtUtc: string;
  calendarId: string;
  evidenceDigestSha256: string;
}>;

type CalendarParts = Readonly<{ year: number; month: number; day: number }>;
type WallClockParts = CalendarParts & Readonly<{
  hour: number;
  minute: number;
  second: number;
}>;

const wallClockFormatter = new Intl.DateTimeFormat("en-US", {
  calendar: "iso8601",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  numberingSystem: "latn",
  second: "2-digit",
  timeZone: EASTERN_TIMEZONE,
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  calendar: "iso8601",
  day: "2-digit",
  month: "2-digit",
  numberingSystem: "latn",
  timeZone: EASTERN_TIMEZONE,
  year: "numeric",
});

function failCalendar(reason: string): never {
  throw new RangeError(`AI Reviews market calendar unavailable: ${reason}`);
}

function record(value: unknown, name: string): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failCalendar(`${name} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function stringValue(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    failCalendar(`${name} must be a non-empty trimmed string`);
  }
  return value;
}

function isoDate(value: unknown, name: string): string {
  const result = stringValue(value, name);
  if (!ISO_DATE_PATTERN.test(result)) failCalendar(`${name} must be an ISO date`);
  const instant = new Date(`${result}T00:00:00.000Z`);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 10) !== result) {
    failCalendar(`${name} must be a real calendar date`);
  }
  return result;
}

function wallClock(value: unknown, name: string): string {
  const result = stringValue(value, name);
  if (!WALL_CLOCK_PATTERN.test(result)) failCalendar(`${name} must be HH:mm`);
  return result;
}

function canonicalEvidenceDigest(value: Readonly<Record<string, unknown>>): string {
  const { evidenceDigestSha256: _excluded, ...evidence } = value;
  return createHash("sha256").update(`${JSON.stringify(evidence)}\n`, "utf8").digest("hex");
}

function source(value: unknown, index: number): CalendarSource {
  const row = record(value, `sources[${index}]`);
  const role = stringValue(row.role, `sources[${index}].role`);
  if (role !== "primary_holiday_calendar" &&
      role !== "normal_extended_session_hours" &&
      role !== "normal_and_early_close_extended_session_rule" &&
      role !== "holiday_and_early_close_cross_check") {
    failCalendar(`sources[${index}].role is unsupported`);
  }
  const url = stringValue(row.url, `sources[${index}].url`);
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    failCalendar(`sources[${index}].url is invalid`);
  }
  if (parsedUrl.protocol !== "https:") failCalendar(`sources[${index}].url must use HTTPS`);
  return Object.freeze({
    sourceId: stringValue(row.sourceId, `sources[${index}].sourceId`),
    role: role as CalendarSourceRole,
    url,
  });
}

function parseSnapshot(value: unknown): CalendarSnapshot {
  const row = record(value, "calendar snapshot");
  if (row.contractVersion !== CALENDAR_CONTRACT_VERSION) {
    failCalendar("contractVersion is unsupported");
  }
  if (row.timezone !== EASTERN_TIMEZONE) failCalendar("timezone must be America/New_York");
  const coverage = record(row.coverage, "coverage");
  if (coverage.verificationStatus !== "verified") failCalendar("coverage is not verified");
  const startDate = isoDate(coverage.startDate, "coverage.startDate");
  const endDate = isoDate(coverage.endDate, "coverage.endDate");
  if (endDate < startDate) failCalendar("coverage range is invalid");

  const retrievedAtUtc = stringValue(row.retrievedAtUtc, "retrievedAtUtc");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(retrievedAtUtc) ||
      !Number.isFinite(new Date(retrievedAtUtc).getTime())) {
    failCalendar("retrievedAtUtc is not canonical UTC");
  }
  const evidenceDigestSha256 = stringValue(
    row.evidenceDigestSha256,
    "evidenceDigestSha256",
  );
  if (!SHA256_PATTERN.test(evidenceDigestSha256) ||
      evidenceDigestSha256 !== canonicalEvidenceDigest(row)) {
    failCalendar("evidence digest does not match the snapshot");
  }

  if (!Array.isArray(row.sources) || row.sources.length < 4) {
    failCalendar("all required official sources are required");
  }
  const sources = Object.freeze(row.sources.map(source));
  const roles = new Set(sources.map((item) => item.role));
  for (const requiredRole of [
    "primary_holiday_calendar",
    "normal_extended_session_hours",
    "normal_and_early_close_extended_session_rule",
    "holiday_and_early_close_cross_check",
  ] as const) {
    if (!roles.has(requiredRole)) failCalendar(`missing source role ${requiredRole}`);
  }

  const normalSession = record(row.normalWeekdaySession, "normalWeekdaySession");
  const normalPostMarketEndEastern = wallClock(
    normalSession.postMarketEndEastern,
    "normalWeekdaySession.postMarketEndEastern",
  );
  if (normalPostMarketEndEastern !== "20:00") {
    failCalendar("normal post-market end must be 20:00 Eastern");
  }

  if (!Array.isArray(row.closedDates)) failCalendar("closedDates must be an array");
  const closedDates = Object.freeze(row.closedDates.map((date, index) =>
    isoDate(date, `closedDates[${index}]`)));
  if (new Set(closedDates).size !== closedDates.length) {
    failCalendar("closedDates contains duplicates");
  }

  if (!Array.isArray(row.earlyCloseSessions)) {
    failCalendar("earlyCloseSessions must be an array");
  }
  const earlyCloseSessions = Object.freeze(row.earlyCloseSessions.map((item, index) => {
    const early = record(item, `earlyCloseSessions[${index}]`);
    const date = isoDate(early.date, `earlyCloseSessions[${index}].date`);
    const postMarketEndEastern = wallClock(
      early.postMarketEndEastern,
      `earlyCloseSessions[${index}].postMarketEndEastern`,
    );
    if (postMarketEndEastern !== "17:00") {
      failCalendar("scheduled early-close post-market end must be 17:00 Eastern");
    }
    return Object.freeze({ date, postMarketEndEastern });
  }));
  if (new Set(earlyCloseSessions.map((item) => item.date)).size !== earlyCloseSessions.length) {
    failCalendar("earlyCloseSessions contains duplicate dates");
  }
  if (earlyCloseSessions.some((item) => closedDates.includes(item.date))) {
    failCalendar("a date cannot be both closed and early-close");
  }

  return Object.freeze({
    contractVersion: CALENDAR_CONTRACT_VERSION,
    calendarId: stringValue(row.calendarId, "calendarId"),
    timezone: EASTERN_TIMEZONE,
    coverage: Object.freeze({ startDate, endDate, verificationStatus: "verified" }),
    retrievedAtUtc,
    evidenceDigestSha256,
    sources,
    normalWeekdaySession: Object.freeze({
      postMarketEndEastern: normalPostMarketEndEastern,
    }),
    closedDates,
    earlyCloseSessions,
  });
}

function dateParts(value: string): CalendarParts {
  const date = isoDate(value, "marketDate");
  return Object.freeze({
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  });
}

function utcDate(parts: CalendarParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function dateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number): string {
  const result = utcDate(dateParts(value));
  result.setUTCDate(result.getUTCDate() + days);
  return dateString(result);
}

function weekday(value: string): number {
  return utcDate(dateParts(value)).getUTCDay();
}

function formatterParts(instant: Date): WallClockParts {
  const values = Object.fromEntries(wallClockFormatter.formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return Object.freeze({
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  });
}

function easternMarketDate(instant: Date): string {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    failCalendar("a valid current instant is required");
  }
  const values = Object.fromEntries(dateFormatter.formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return isoDate(`${values.year}-${values.month}-${values.day}`, "Eastern market date");
}

function zonedWallClockToUtc(date: string, time: string): string {
  const parts = dateParts(date);
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute);
  let candidate = localAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = formatterParts(new Date(candidate));
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
  const actual = formatterParts(result);
  if (actual.year !== parts.year || actual.month !== parts.month || actual.day !== parts.day ||
      actual.hour !== hour || actual.minute !== minute || actual.second !== 0) {
    failCalendar(`Eastern wall clock does not resolve for ${date} ${time}`);
  }
  return result.toISOString();
}

export class CoachUsEquitiesReviewCalendarService {
  readonly #snapshot: CalendarSnapshot;
  readonly #closedDates: ReadonlySet<string>;
  readonly #earlyCloseByDate: ReadonlyMap<string, EarlyCloseSession>;

  constructor(snapshot: unknown = calendarSnapshotJson) {
    this.#snapshot = parseSnapshot(snapshot);
    this.#closedDates = new Set(this.#snapshot.closedDates);
    this.#earlyCloseByDate = new Map(
      this.#snapshot.earlyCloseSessions.map((session) => [session.date, session]),
    );
  }

  metadata(): Readonly<{
    calendarId: string;
    evidenceDigestSha256: string;
    coverageStartDate: string;
    coverageEndDate: string;
  }> {
    return Object.freeze({
      calendarId: this.#snapshot.calendarId,
      evidenceDigestSha256: this.#snapshot.evidenceDigestSha256,
      coverageStartDate: this.#snapshot.coverage.startDate,
      coverageEndDate: this.#snapshot.coverage.endDate,
    });
  }

  marketDateAt(instant: Date): string {
    return easternMarketDate(instant);
  }

  easternWallClockAtUtc(marketDateInput: string, wallClockInput: string): string {
    const marketDate = isoDate(marketDateInput, "marketDate");
    const easternWallClock = wallClock(wallClockInput, "easternWallClock");
    return zonedWallClockToUtc(marketDate, easternWallClock);
  }

  session(marketDateInput: string): CoachUsEquitiesReviewSession {
    const marketDate = isoDate(marketDateInput, "marketDate");
    if (marketDate < this.#snapshot.coverage.startDate ||
        marketDate > this.#snapshot.coverage.endDate) {
      failCalendar(`verified coverage does not include ${marketDate}`);
    }
    const day = weekday(marketDate);
    if (day === 0 || day === 6) {
      return Object.freeze({
        marketDate,
        state: "closed",
        sessionKind: "weekend",
        postMarketEndEastern: null,
        postMarketEndUtc: null,
        calendarId: this.#snapshot.calendarId,
        evidenceDigestSha256: this.#snapshot.evidenceDigestSha256,
      });
    }
    if (this.#closedDates.has(marketDate)) {
      return Object.freeze({
        marketDate,
        state: "closed",
        sessionKind: "holiday",
        postMarketEndEastern: null,
        postMarketEndUtc: null,
        calendarId: this.#snapshot.calendarId,
        evidenceDigestSha256: this.#snapshot.evidenceDigestSha256,
      });
    }
    const earlyClose = this.#earlyCloseByDate.get(marketDate);
    const postMarketEndEastern = earlyClose?.postMarketEndEastern ??
      this.#snapshot.normalWeekdaySession.postMarketEndEastern;
    return Object.freeze({
      marketDate,
      state: "open",
      sessionKind: earlyClose ? "scheduled_early_close" : "normal",
      postMarketEndEastern,
      postMarketEndUtc: zonedWallClockToUtc(marketDate, postMarketEndEastern),
      calendarId: this.#snapshot.calendarId,
      evidenceDigestSha256: this.#snapshot.evidenceDigestSha256,
    });
  }

  cohortForDate(marketDateInput: string): CoachUsEquitiesReviewCohort {
    const marketDate = isoDate(marketDateInput, "marketDate");
    const day = weekday(marketDate);
    const sinceMonday = day === 0 ? 6 : day - 1;
    const mondayDate = shiftDate(marketDate, -sinceMonday);
    const fridayDate = shiftDate(mondayDate, 4);
    const sessions = Object.freeze(Array.from({ length: 5 }, (_, index) =>
      this.session(shiftDate(mondayDate, index))));
    const openSessions = sessions.filter((session) => session.state === "open");
    const finalSession = openSessions.at(-1);
    if (!finalSession?.postMarketEndUtc) {
      failCalendar(`cohort ${mondayDate} through ${fridayDate} has no verified open session`);
    }
    return Object.freeze({
      mondayDate,
      fridayDate,
      openSessionDates: Object.freeze(openSessions.map((session) => session.marketDate)),
      finalOpenSessionDate: finalSession.marketDate,
      sealedAtUtc: finalSession.postMarketEndUtc,
      calendarId: this.#snapshot.calendarId,
      evidenceDigestSha256: this.#snapshot.evidenceDigestSha256,
    });
  }

  cohortStarting(mondayDateInput: string): CoachUsEquitiesReviewCohort {
    const mondayDate = isoDate(mondayDateInput, "mondayDate");
    if (weekday(mondayDate) !== 1) failCalendar(`${mondayDate} is not a Monday`);
    return this.cohortForDate(mondayDate);
  }

  nextOpenSessionDate(afterMarketDateInput: string): string {
    let candidate = shiftDate(isoDate(afterMarketDateInput, "afterMarketDate"), 1);
    for (let attempts = 0; attempts < 14; attempts += 1) {
      if (this.session(candidate).state === "open") return candidate;
      candidate = shiftDate(candidate, 1);
    }
    return failCalendar(`no open session follows ${afterMarketDateInput} within 14 days`);
  }
}
