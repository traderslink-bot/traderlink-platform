import type Database from "better-sqlite3";

import {
  COACH_NASDAQ_CALENDAR_URL,
  COACH_NYSE_CALENDAR_URL,
  CoachCalendarSourceError,
  fetchCoachOfficialCalendarSource,
  parseCoachNasdaqCalendarYear,
  parseCoachNyseCalendarYear,
} from "./coach-us-equities-calendar-source-adapter";
import {
  CoachUsEquitiesCalendarRepository,
  type CoachCalendarVerificationRecord,
} from "./coach-us-equities-calendar-repository";

const DAY_MS = 86_400_000;

function easternYear(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
  }).format(now));
}

function nextCheckAt(now: Date, targetYear: number, verified: boolean): string {
  if (verified) return new Date(now.getTime() + 30 * DAY_MS).toISOString();
  const urgentAt = new Date(Date.UTC(targetYear - 1, 10, 17));
  return new Date(now.getTime() + (now >= urgentAt ? 1 : 7) * DAY_MS).toISOString();
}

function sourceCode(error: unknown): string {
  return error instanceof CoachCalendarSourceError
    ? error.code
    : "CALENDAR_SOURCE_UNEXPECTED_FAILURE";
}

export type CoachCalendarVerificationRunResult = Readonly<{
  state: "not_due" | "checked";
  targetYear: number;
  status?: CoachCalendarVerificationRecord["status"];
  resultCode?: string;
  calendarId?: string | null;
  nextCheckAfterUtc?: string;
}>;

export class CoachUsEquitiesCalendarVerificationService {
  readonly #repository: CoachUsEquitiesCalendarRepository;

  constructor(
    database: Database.Database,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.#repository = new CoachUsEquitiesCalendarRepository(database);
  }

  async run(now = new Date()): Promise<CoachCalendarVerificationRunResult> {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      throw new RangeError("A valid calendar verification instant is required");
    }
    const targetYear = easternYear(now) + 1;
    if (!this.#repository.shouldCheck(targetYear, now)) {
      return Object.freeze({ state: "not_due", targetYear });
    }
    const checkedAtUtc = now.toISOString();
    let nasdaqDocument: Awaited<ReturnType<typeof fetchCoachOfficialCalendarSource>> | null = null;
    let nyseDocument: Awaited<ReturnType<typeof fetchCoachOfficialCalendarSource>> | null = null;
    try {
      [nasdaqDocument, nyseDocument] = await Promise.all([
        fetchCoachOfficialCalendarSource(COACH_NASDAQ_CALENDAR_URL, this.fetcher),
        fetchCoachOfficialCalendarSource(COACH_NYSE_CALENDAR_URL, this.fetcher),
      ]);
    } catch (error) {
      return this.#result(this.#repository.record({
        targetYear,
        status: "source_unavailable",
        resultCode: sourceCode(error),
        checkedAtUtc,
        nextCheckAfterUtc: nextCheckAt(now, targetYear, false),
        nasdaqContentSha256: nasdaqDocument?.contentSha256 ?? null,
        nyseContentSha256: nyseDocument?.contentSha256 ?? null,
        nasdaqCalendarSha256: null,
        nyseCalendarSha256: null,
        verifiedCalendar: null,
      }));
    }

    let nyseCalendar;
    try {
      nyseCalendar = parseCoachNyseCalendarYear(nyseDocument.html, targetYear);
    } catch (error) {
      return this.#result(this.#repository.record({
        targetYear,
        status: "source_unavailable",
        resultCode: sourceCode(error),
        checkedAtUtc,
        nextCheckAfterUtc: nextCheckAt(now, targetYear, false),
        nasdaqContentSha256: nasdaqDocument.contentSha256,
        nyseContentSha256: nyseDocument.contentSha256,
        nasdaqCalendarSha256: null,
        nyseCalendarSha256: null,
        verifiedCalendar: null,
      }));
    }

    let nasdaqCalendar;
    try {
      nasdaqCalendar = parseCoachNasdaqCalendarYear(nasdaqDocument.html, targetYear);
    } catch (error) {
      const code = sourceCode(error);
      const awaitingPrimary = code === "NASDAQ_TARGET_YEAR_UNAVAILABLE";
      return this.#result(this.#repository.record({
        targetYear,
        status: awaitingPrimary ? "awaiting_primary" : "source_unavailable",
        resultCode: code,
        checkedAtUtc,
        nextCheckAfterUtc: nextCheckAt(now, targetYear, false),
        nasdaqContentSha256: nasdaqDocument.contentSha256,
        nyseContentSha256: nyseDocument.contentSha256,
        nasdaqCalendarSha256: null,
        nyseCalendarSha256: nyseCalendar.normalizedCalendarSha256,
        verifiedCalendar: null,
      }));
    }

    if (nasdaqCalendar.normalizedCalendarSha256 !== nyseCalendar.normalizedCalendarSha256) {
      return this.#result(this.#repository.record({
        targetYear,
        status: "conflict",
        resultCode: "CALENDAR_SOURCE_CONFLICT",
        checkedAtUtc,
        nextCheckAfterUtc: nextCheckAt(now, targetYear, false),
        nasdaqContentSha256: nasdaqDocument.contentSha256,
        nyseContentSha256: nyseDocument.contentSha256,
        nasdaqCalendarSha256: nasdaqCalendar.normalizedCalendarSha256,
        nyseCalendarSha256: nyseCalendar.normalizedCalendarSha256,
        verifiedCalendar: null,
      }));
    }

    return this.#result(this.#repository.record({
      targetYear,
      status: "verified",
      resultCode: "CALENDAR_VERIFIED",
      checkedAtUtc,
      nextCheckAfterUtc: nextCheckAt(now, targetYear, true),
      nasdaqContentSha256: nasdaqDocument.contentSha256,
      nyseContentSha256: nyseDocument.contentSha256,
      nasdaqCalendarSha256: nasdaqCalendar.normalizedCalendarSha256,
      nyseCalendarSha256: nyseCalendar.normalizedCalendarSha256,
      verifiedCalendar: nasdaqCalendar,
    }));
  }

  #result(record: CoachCalendarVerificationRecord): CoachCalendarVerificationRunResult {
    return Object.freeze({
      state: "checked",
      targetYear: record.targetYear,
      status: record.status,
      resultCode: record.resultCode,
      calendarId: record.calendarId,
      nextCheckAfterUtc: record.nextCheckAfterUtc,
    });
  }
}
