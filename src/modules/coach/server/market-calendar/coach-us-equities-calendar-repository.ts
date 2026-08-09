import { createHash, randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import {
  COACH_NASDAQ_CALENDAR_URL,
  COACH_NYSE_CALENDAR_URL,
  type CoachParsedOfficialCalendarYear,
} from "./coach-us-equities-calendar-source-adapter";
import {
  createCoachUsEquitiesReviewCalendarWithAdditionalSnapshots,
  type CoachUsEquitiesReviewCalendarService,
} from "./coach-us-equities-review-calendar-service";

const NASDAQ_MARKET_HOURS_URL =
  "https://www.nasdaq.com/market-activity/stock-market-holiday-schedule";
const NASDAQ_EXTENDED_SESSION_RULE_URL =
  "https://listingcenter.nasdaq.com/assets/rulebook/nasdaq/filings/SR-NASDAQ-2022-069.pdf";

type VerificationStatus =
  | "awaiting_primary"
  | "source_unavailable"
  | "conflict"
  | "verified";

type VerificationStateRow = Readonly<{
  active_calendar_id: string | null;
  next_check_after_utc: string;
  revision: number;
}>;

type SnapshotRow = Readonly<{
  calendar_id: string;
  snapshot_json: string;
}>;

export type CoachCalendarYearStatus = Readonly<{
  targetYear: number;
  coverageAvailable: boolean;
  status: VerificationStatus | "verified_baseline" | "unverified";
  resultCode: string | null;
  calendarId: string | null;
  lastCheckedAtUtc: string | null;
  nextCheckAfterUtc: string | null;
}>;

export type CoachCalendarVerificationWrite = Readonly<{
  targetYear: number;
  status: VerificationStatus;
  resultCode: string;
  checkedAtUtc: string;
  nextCheckAfterUtc: string;
  nasdaqContentSha256: string | null;
  nyseContentSha256: string | null;
  nasdaqCalendarSha256: string | null;
  nyseCalendarSha256: string | null;
  verifiedCalendar: CoachParsedOfficialCalendarYear | null;
}>;

export type CoachCalendarVerificationRecord = Readonly<{
  targetYear: number;
  status: VerificationStatus;
  resultCode: string;
  calendarId: string | null;
  checkedAtUtc: string;
  nextCheckAfterUtc: string;
}>;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalEvidenceDigest(value: Readonly<Record<string, unknown>>): string {
  const evidence = Object.fromEntries(Object.entries(value).filter(([key]) =>
    key !== "evidenceDigestSha256"));
  return sha256(`${JSON.stringify(evidence)}\n`);
}

function snapshotJson(input: Readonly<{
  calendarId: string;
  version: number;
  calendar: CoachParsedOfficialCalendarYear;
  checkedAtUtc: string;
  nasdaqContentSha256: string;
  nyseContentSha256: string;
}>): Readonly<Record<string, unknown>> {
  const base = Object.freeze({
    contractVersion: "traderlink_us_equities_review_calendar_v1",
    calendarId: input.calendarId,
    timezone: "America/New_York",
    coverage: Object.freeze({
      startDate: `${input.calendar.targetYear}-01-01`,
      endDate: `${input.calendar.targetYear}-12-31`,
      verificationStatus: "verified",
    }),
    retrievedAtUtc: input.checkedAtUtc,
    evidenceDigestSha256: "",
    sources: Object.freeze([
      Object.freeze({
        sourceId: `nasdaq_trader_${input.calendar.targetYear}_calendar`,
        role: "primary_holiday_calendar",
        url: COACH_NASDAQ_CALENDAR_URL,
      }),
      Object.freeze({
        sourceId: "nasdaq_market_hours",
        role: "normal_extended_session_hours",
        url: NASDAQ_MARKET_HOURS_URL,
      }),
      Object.freeze({
        sourceId: "nasdaq_rule_filing_sr_nasdaq_2022_069",
        role: "normal_and_early_close_extended_session_rule",
        url: NASDAQ_EXTENDED_SESSION_RULE_URL,
      }),
      Object.freeze({
        sourceId: `nyse_${input.calendar.targetYear}_calendar`,
        role: "holiday_and_early_close_cross_check",
        url: COACH_NYSE_CALENDAR_URL,
      }),
    ]),
    normalWeekdaySession: Object.freeze({ postMarketEndEastern: "20:00" }),
    closedDates: input.calendar.closedDates,
    earlyCloseSessions: Object.freeze(input.calendar.earlyCloseDates.map((date) =>
      Object.freeze({ date, postMarketEndEastern: "17:00" }))),
    sourceEvidence: Object.freeze({
      verificationVersion: input.version,
      nasdaqContentSha256: input.nasdaqContentSha256,
      nyseContentSha256: input.nyseContentSha256,
      normalizedCalendarSha256: input.calendar.normalizedCalendarSha256,
    }),
  });
  return Object.freeze({ ...base, evidenceDigestSha256: canonicalEvidenceDigest(base) });
}

export class CoachUsEquitiesCalendarRepository {
  constructor(private readonly database: Database.Database) {}

  shouldCheck(targetYear: number, now: Date): boolean {
    const state = this.database.prepare<[number], VerificationStateRow>(`SELECT
  active_calendar_id, next_check_after_utc, revision
FROM coach_us_equities_calendar_verification_state
WHERE target_year = ?`).get(targetYear);
    return !state || state.next_check_after_utc <= now.toISOString();
  }

  readYearStatus(targetYear: number): CoachCalendarYearStatus {
    const state = this.database.prepare<[number], Readonly<{
      latest_status: VerificationStatus;
      latest_result_code: string;
      active_calendar_id: string | null;
      last_checked_at_utc: string;
      next_check_after_utc: string;
    }>>(`SELECT latest_status, latest_result_code, active_calendar_id,
  last_checked_at_utc, next_check_after_utc
FROM coach_us_equities_calendar_verification_state
WHERE target_year = ?`).get(targetYear);
    let coverageAvailable = false;
    try {
      this.calendar().session(`${targetYear}-07-01`);
      coverageAvailable = true;
    } catch {
      coverageAvailable = false;
    }
    return Object.freeze({
      targetYear,
      coverageAvailable,
      status: state?.latest_status ?? (coverageAvailable ? "verified_baseline" : "unverified"),
      resultCode: state?.latest_result_code ?? null,
      calendarId: state?.active_calendar_id ?? null,
      lastCheckedAtUtc: state?.last_checked_at_utc ?? null,
      nextCheckAfterUtc: state?.next_check_after_utc ?? null,
    });
  }

  activeSnapshotJsons(): readonly unknown[] {
    return Object.freeze(this.database.prepare<[], SnapshotRow>(`SELECT
  snapshot.calendar_id, snapshot.snapshot_json
FROM coach_us_equities_calendar_verification_state state
JOIN coach_us_equities_calendar_snapshots snapshot
  ON snapshot.calendar_id = state.active_calendar_id
ORDER BY state.target_year ASC`).all().map((row) => JSON.parse(row.snapshot_json) as unknown));
  }

  calendar(): CoachUsEquitiesReviewCalendarService {
    return createCoachUsEquitiesReviewCalendarWithAdditionalSnapshots(
      this.activeSnapshotJsons(),
    );
  }

  record(input: CoachCalendarVerificationWrite): CoachCalendarVerificationRecord {
    if ((input.status === "verified") !== Boolean(input.verifiedCalendar)) {
      throw new Error("TRADERLINK_COACH_CALENDAR_VERIFICATION_INVALID");
    }
    return this.database.transaction(() => {
      const priorState = this.database.prepare<[number], VerificationStateRow>(`SELECT
  active_calendar_id, next_check_after_utc, revision
FROM coach_us_equities_calendar_verification_state
WHERE target_year = ?`).get(input.targetYear);
      let calendarId: string | null = null;
      if (input.verifiedCalendar && input.nasdaqContentSha256 && input.nyseContentSha256) {
        const existing = this.database.prepare<[number, string], SnapshotRow>(`SELECT
  calendar_id, snapshot_json
FROM coach_us_equities_calendar_snapshots
WHERE target_year = ? AND normalized_calendar_sha256 = ?`).get(
          input.targetYear,
          input.verifiedCalendar.normalizedCalendarSha256,
        );
        if (existing) calendarId = existing.calendar_id;
        else {
          const version = (this.database.prepare<[number], { version: number }>(`SELECT
  COALESCE(MAX(version), 0) + 1 AS version
FROM coach_us_equities_calendar_snapshots
WHERE target_year = ?`).get(input.targetYear)?.version ?? 1);
          calendarId = `us_equities_${input.targetYear}_v${version}`;
          const snapshot = snapshotJson({
            calendarId,
            version,
            calendar: input.verifiedCalendar,
            checkedAtUtc: input.checkedAtUtc,
            nasdaqContentSha256: input.nasdaqContentSha256,
            nyseContentSha256: input.nyseContentSha256,
          });
          const serialized = JSON.stringify(snapshot);
          this.database.prepare(`INSERT INTO coach_us_equities_calendar_snapshots (
  calendar_id, contract_version, target_year, version, timezone,
  coverage_start_date, coverage_end_date, normalized_calendar_sha256,
  evidence_digest_sha256, nasdaq_content_sha256, nyse_content_sha256,
  snapshot_json, retrieved_at_utc, verified_at_utc
) VALUES (?, 'traderlink_us_equities_review_calendar_v1', ?, ?, 'America/New_York',
  ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(
              calendarId,
              input.targetYear,
              version,
              `${input.targetYear}-01-01`,
              `${input.targetYear}-12-31`,
              input.verifiedCalendar.normalizedCalendarSha256,
              snapshot.evidenceDigestSha256,
              input.nasdaqContentSha256,
              input.nyseContentSha256,
              serialized,
              input.checkedAtUtc,
              input.checkedAtUtc,
            );
        }
      }
      const attemptId = randomUUID();
      this.database.prepare(`INSERT INTO coach_us_equities_calendar_verification_attempts (
  calendar_verification_attempt_id, target_year, status, result_code,
  nasdaq_source_url, nyse_source_url, nasdaq_content_sha256, nyse_content_sha256,
  nasdaq_calendar_sha256, nyse_calendar_sha256, calendar_id, checked_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          attemptId,
          input.targetYear,
          input.status,
          input.resultCode,
          COACH_NASDAQ_CALENDAR_URL,
          COACH_NYSE_CALENDAR_URL,
          input.nasdaqContentSha256,
          input.nyseContentSha256,
          input.nasdaqCalendarSha256,
          input.nyseCalendarSha256,
          calendarId,
          input.checkedAtUtc,
        );
      const activeCalendarId = calendarId ?? priorState?.active_calendar_id ?? null;
      const revision = (priorState?.revision ?? 0) + 1;
      this.database.prepare(`INSERT INTO coach_us_equities_calendar_verification_state (
  target_year, latest_status, latest_result_code, latest_attempt_id,
  active_calendar_id, last_checked_at_utc, next_check_after_utc, revision,
  updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(target_year) DO UPDATE SET
  latest_status = excluded.latest_status,
  latest_result_code = excluded.latest_result_code,
  latest_attempt_id = excluded.latest_attempt_id,
  active_calendar_id = excluded.active_calendar_id,
  last_checked_at_utc = excluded.last_checked_at_utc,
  next_check_after_utc = excluded.next_check_after_utc,
  revision = excluded.revision,
  updated_at_utc = excluded.updated_at_utc`)
        .run(
          input.targetYear,
          input.status,
          input.resultCode,
          attemptId,
          activeCalendarId,
          input.checkedAtUtc,
          input.nextCheckAfterUtc,
          revision,
          input.checkedAtUtc,
        );
      return Object.freeze({
        targetYear: input.targetYear,
        status: input.status,
        resultCode: input.resultCode,
        calendarId,
        checkedAtUtc: input.checkedAtUtc,
        nextCheckAfterUtc: input.nextCheckAfterUtc,
      });
    })();
  }
}
