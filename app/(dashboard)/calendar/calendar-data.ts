import "server-only";

import {
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";

import type {
  CalendarData,
  CalendarDay,
  CalendarFilterInput,
  CalendarTickerResult,
} from "./calendar-types";

type AnnotationRow = Readonly<{
  round_trip_id: string;
  instrument_id: string;
  normalized_symbol: string;
  trade_currency: string;
  closed_at_utc: string;
  note_count: number;
  rule_review_count: number;
  tag_count: number;
}>;

type SwingAnnotationRow = Readonly<{
  round_trip_id: string;
  instrument_id: string;
  normalized_symbol: string;
  trade_currency: string;
  review_date: string;
  rule_review_count: number;
  tag_count: number;
}>;

type TradingDayReviewRow = Readonly<{
  trading_date: string;
  review_status: "reviewed" | "incomplete";
}>;

type ManualExecutionDateRow = Readonly<{
  executed_at_utc: string;
}>;

type AnnotationTotal = {
  currency: string;
  date: string;
  instrumentId: string;
  symbol: string;
  noteCount: number;
  ruleReviewCount: number;
  tagCount: number;
};

type CalendarAnnotationEvidence = Readonly<{
  annotations: ReadonlyMap<string, Readonly<AnnotationTotal>>;
  dailyTrackerDates: ReadonlySet<string>;
  reviewStatusByDate: ReadonlyMap<string, "reviewed" | "needs_review">;
}>;

type MutableCalendarDay = Omit<CalendarDay, "tickers"> & Readonly<{
  tickers: CalendarTickerResult[];
}>;

function localDate(utc: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(utc));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function calendarAnnotationEvidence(
  scope: WorkspaceAccessScope,
  timezone: string,
): CalendarAnnotationEvidence {
  const accountId = scope.activeAccountId;
  if (!accountId) return Object.freeze({
    annotations: new Map<string, Readonly<AnnotationTotal>>(),
    dailyTrackerDates: new Set<string>(),
    reviewStatusByDate: new Map<string, "reviewed" | "needs_review">(),
  });
  const evidence = withReadonlyPlatformDatabase({}, (database) => Object.freeze({
    roundTrips: database.prepare<[string, string], AnnotationRow>(`SELECT
 version.round_trip_id,
 version.instrument_id,
 instrument.normalized_symbol,
 version.trade_currency,
 version.closed_at_utc,
 (SELECT COUNT(*) FROM journal_round_trip_notes note
   WHERE note.workspace_id = version.workspace_id
     AND note.account_id = version.account_id
     AND note.round_trip_id = version.round_trip_id) AS note_count,
 (SELECT COUNT(*) FROM journal_rule_reviews review
   WHERE review.workspace_id = version.workspace_id
     AND review.account_id = version.account_id
     AND review.round_trip_id = version.round_trip_id
     AND review.target_kind = 'round_trip') AS rule_review_count,
 (SELECT COUNT(*) FROM journal_round_trip_tag_assignments assignment
   WHERE assignment.workspace_id = version.workspace_id
     AND assignment.account_id = version.account_id
     AND assignment.round_trip_id = version.round_trip_id
     AND assignment.assignment_state = 'assigned') AS tag_count
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'
  AND version.closed_at_utc IS NOT NULL`).all(scope.workspaceId, accountId),
    swingNotes: database.prepare<[string, string], SwingAnnotationRow>(`SELECT
 note.round_trip_id,
 note.review_date,
 version.instrument_id,
 instrument.normalized_symbol,
 version.trade_currency,
 (SELECT COUNT(*) FROM journal_rule_reviews review
   WHERE review.workspace_id = note.workspace_id
     AND review.account_id = note.account_id
     AND review.round_trip_id = note.round_trip_id
     AND review.target_kind = 'round_trip') AS rule_review_count,
 (SELECT COUNT(*) FROM journal_round_trip_tag_assignments assignment
   WHERE assignment.workspace_id = note.workspace_id
     AND assignment.account_id = note.account_id
     AND assignment.round_trip_id = note.round_trip_id
     AND assignment.assignment_state = 'assigned') AS tag_count
FROM journal_swing_daily_notes note
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = note.workspace_id
 AND round_trip.account_id = note.account_id
 AND round_trip.round_trip_id = note.round_trip_id
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE note.workspace_id = ? AND note.account_id = ?
  AND round_trip.lifecycle_state = 'active'`).all(scope.workspaceId, accountId),
    reviews: database.prepare<[string, string], TradingDayReviewRow>(`SELECT
 day.trading_date,
 review.review_status
FROM journal_trading_day_reviews review
JOIN journal_trading_days day
  ON day.workspace_id = review.workspace_id
 AND day.account_id = review.account_id
 AND day.trading_day_id = review.trading_day_id
WHERE review.workspace_id = ? AND review.account_id = ?`).all(scope.workspaceId, accountId),
    manualExecutions: database.prepare<[string, string], ManualExecutionDateRow>(`SELECT
 version.executed_at_utc
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_id = execution.execution_id
 AND version.execution_version_id = execution.current_version_id
JOIN journal_execution_identity_aliases alias
  ON alias.workspace_id = execution.workspace_id
 AND alias.account_id = execution.account_id
 AND alias.execution_id = execution.execution_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND execution.current_state = 'accepted'
  AND alias.alias_type = 'manual_entry'
  AND alias.status = 'active'`).all(scope.workspaceId, accountId),
  }));
  const totals = new Map<string, AnnotationTotal>();
  const closedRoundTripDates = new Set<string>();
  for (const row of evidence.roundTrips) {
    const date = localDate(row.closed_at_utc, timezone);
    const key = JSON.stringify([date, row.instrument_id]);
    closedRoundTripDates.add(JSON.stringify([row.round_trip_id, date]));
    const current = totals.get(key) ?? {
      currency: row.trade_currency,
      date,
      instrumentId: row.instrument_id,
      symbol: row.normalized_symbol,
      noteCount: 0,
      ruleReviewCount: 0,
      tagCount: 0,
    };
    current.noteCount += row.note_count;
    current.ruleReviewCount += row.rule_review_count;
    current.tagCount += row.tag_count;
    totals.set(key, current);
  }
  for (const row of evidence.swingNotes) {
    const key = JSON.stringify([row.review_date, row.instrument_id]);
    const roundTripAlreadyRepresented = closedRoundTripDates.has(JSON.stringify([
      row.round_trip_id,
      row.review_date,
    ]));
    const current = totals.get(key) ?? {
      currency: row.trade_currency,
      date: row.review_date,
      instrumentId: row.instrument_id,
      symbol: row.normalized_symbol,
      noteCount: 0,
      ruleReviewCount: 0,
      tagCount: 0,
    };
    current.noteCount += 1;
    if (!roundTripAlreadyRepresented) {
      current.ruleReviewCount += row.rule_review_count;
      current.tagCount += row.tag_count;
    }
    totals.set(key, current);
  }
  return Object.freeze({
    annotations: totals,
    dailyTrackerDates: new Set(evidence.manualExecutions.map((row) =>
      localDate(row.executed_at_utc, timezone))),
    reviewStatusByDate: new Map<string, "reviewed" | "needs_review">(
      evidence.reviews.map((row) => [
      row.trading_date,
      row.review_status === "reviewed" ? "reviewed" : "needs_review",
      ] as const)),
  });
}

function withCalendarAnnotations(
  scope: WorkspaceAccessScope,
  data: JournalCalendarReadModel,
  input: CalendarFilterInput,
  annotationEvidence?: CalendarAnnotationEvidence,
): CalendarData {
  if (!data.timezone) return Object.freeze({
    ...data,
    days: Object.freeze(data.days.map((day) => Object.freeze({
      ...day,
      hasDailyTracker: false,
    }))),
  });
  const evidence = annotationEvidence ?? calendarAnnotationEvidence(scope, data.timezone);
  const index = evidence.annotations;
  const days: MutableCalendarDay[] = data.days.map((day) => ({
    ...day,
    hasDailyTracker: evidence.dailyTrackerDates.has(day.date),
    reviewStatus: day.tradeCount > 0
      ? evidence.reviewStatusByDate.get(day.date) ?? "needs_review"
      : null,
    tickers: day.tickers.map((ticker) => ({
      ...ticker,
      ...(index.get(JSON.stringify([day.date, ticker.instrumentId])) ?? {
        noteCount: 0,
        ruleReviewCount: 0,
        tagCount: 0,
      }),
    })),
  }));
  const dayByDate = new Map(days.map((day) => [day.date, day]));
  const annotationOnlyAllowed = input.direction === "all" &&
    input.performance === "all" && input.pnlRange === "all" &&
    input.session === "all" && input.tradeCount === "all";
  if (annotationOnlyAllowed) {
    for (const annotation of index.values()) {
      if ((input.startDate && annotation.date < input.startDate) ||
          (input.endDate && annotation.date > input.endDate) ||
          (input.currency !== "all" && annotation.currency !== input.currency) ||
          (input.symbol !== "all" && annotation.symbol !== input.symbol)) continue;
      const day = dayByDate.get(annotation.date) ?? {
        date: annotation.date,
        hasDailyTracker: false,
        peakGivebackDecimal: null,
        pnlDecimal: null,
        pnlSign: null,
        tickers: [],
        tradeCount: 0,
        reviewStatus: null,
        winRatePercentDecimal: null,
      };
      if (!day.tickers.some((ticker) => ticker.instrumentId === annotation.instrumentId)) {
        day.tickers.push({
          instrumentId: annotation.instrumentId,
          symbol: annotation.symbol,
          pnlDecimal: null,
          pnlSign: null,
          noteCount: annotation.noteCount,
          ruleReviewCount: annotation.ruleReviewCount,
          tagCount: annotation.tagCount,
          trades: [],
        });
      }
      dayByDate.set(annotation.date, day);
    }
  }
  const annotatedDays = [...dayByDate.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => Object.freeze({
      ...day,
      tickers: Object.freeze([...day.tickers].sort((left, right) =>
        left.symbol.localeCompare(right.symbol))),
    }));
  const dates = annotatedDays.map((day) => day.date);
  return Object.freeze({
    ...data,
    activeDate: annotationOnlyAllowed ? dates.at(-1) ?? data.activeDate : data.activeDate,
    days: Object.freeze(annotatedDays),
    maximumDate: dates.at(-1) ?? data.maximumDate,
    minimumDate: dates[0] ?? data.minimumDate,
    state: annotatedDays.length > 0 ? "ready" : data.state,
    symbols: Object.freeze([...new Set([
      ...data.symbols,
      ...annotatedDays.flatMap((day) => day.tickers.map((ticker) => ticker.symbol)),
    ])].sort()),
  });
}

export function emptyCalendarData(): CalendarData {
  const today = new Date().toISOString().slice(0, 10);
  return Object.freeze({
    state: "unavailable",
    currency: null,
    availableCurrencies: Object.freeze([]),
    timezone: null,
    activeDate: today,
    minimumDate: today,
    maximumDate: today,
    days: Object.freeze([]),
    symbols: Object.freeze([]),
    summary: Object.freeze({
      netPnlDecimal: null,
      netPnlSign: null,
      tradeCount: 0,
      tradingDayCount: 0,
      winRatePercentDecimal: null,
    }),
    coverage: Object.freeze({
      readyClosedCount: 0,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      feeCompleteCount: 0,
      feeIncompleteCount: 0,
      limitationReasonCodes: Object.freeze(["review_layout_only"]),
    }),
  });
}

function readCalendarData(
  scope: WorkspaceAccessScope,
  input: CalendarFilterInput,
  dashboard: Readonly<{
    getCalendar(
      scope: WorkspaceAccessScope,
      input: Readonly<{
        currency: string | null;
        startDate: string | null;
        endDate: string | null;
        symbol: string | null;
        direction: "long" | "short" | null;
        performance: "profitable" | "losing" | null;
        pnlBand: "loss200" | "flat" | "profit200" | null;
        tradeCountBand: "1-3" | "4-6" | "7+" | null;
        session: "premarket" | "regular" | "after_hours" | null;
      }>,
    ): JournalCalendarReadModel;
  }>,
  annotationEvidenceByTimezone: Map<string, CalendarAnnotationEvidence>,
): CalendarData {
  const data = dashboard.getCalendar(scope, {
    currency: input.currency === "all" ? null : input.currency,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    symbol: input.symbol === "all" ? null : input.symbol,
    direction: input.direction === "all" ? null : input.direction,
    performance: input.performance === "all" ? null : input.performance,
    pnlBand: input.pnlRange === "all" ? null : input.pnlRange,
    tradeCountBand: input.tradeCount === "all" ? null : input.tradeCount,
    session: input.session === "all" ? null : input.session,
  });
  const annotationEvidence = data.timezone
    ? annotationEvidenceByTimezone.get(data.timezone) ??
      calendarAnnotationEvidence(scope, data.timezone)
    : undefined;
  if (data.timezone && annotationEvidence) {
    annotationEvidenceByTimezone.set(data.timezone, annotationEvidence);
  }
  return withCalendarAnnotations(scope, data, input, annotationEvidence);
}

export async function withCalendarDataRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (read: (input: CalendarFilterInput) => CalendarData) => T | Promise<T>,
): Promise<T> {
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard }) => {
    const annotationEvidenceByTimezone = new Map<string, CalendarAnnotationEvidence>();
    return operation((input) => readCalendarData(
      scope,
      input,
      dashboard,
      annotationEvidenceByTimezone,
    ));
  }, { prefetchAllFactSet: true });
}

export async function getCalendarData(input: CalendarFilterInput): Promise<CalendarData> {
  const scope = await requireTraderLinkPlatformPageScope();
  return withCalendarDataRuntime(scope, (read) => read(input));
}
