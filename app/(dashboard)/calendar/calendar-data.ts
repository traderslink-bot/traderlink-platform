import "server-only";

import type Database from "better-sqlite3";

import {
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { JournalLogicalTradeRepository } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-repository";
import { addExactDecimals, compareExactDecimals, percentageExactDecimals } from "@/src/modules/journal-analytics/server/exact-analytics-math";

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
  database: Database.Database,
  scope: WorkspaceAccessScope,
  timezone: string,
): CalendarAnnotationEvidence {
  const accountId = scope.activeAccountId;
  if (!accountId) return Object.freeze({
    annotations: new Map<string, Readonly<AnnotationTotal>>(),
    dailyTrackerDates: new Set<string>(),
    reviewStatusByDate: new Map<string, "reviewed" | "needs_review">(),
  });
  const evidence = Object.freeze({
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
  });
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
  if (!data.timezone || !annotationEvidence) return Object.freeze({
    ...data,
    days: Object.freeze(data.days.map((day) => Object.freeze({
      ...day,
      hasDailyTracker: false,
    }))),
  });
  const evidence = annotationEvidence;
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

function logicalCalendarModel(database: Database.Database, scope: WorkspaceAccessScope,
  data: JournalCalendarReadModel): JournalCalendarReadModel {
  if (!scope.activeAccountId || !data.timezone) return data;
  const logical = new JournalLogicalTradeRepository(database).list(Object.freeze({
    userId: scope.userId, workspaceId: scope.workspaceId, accountId: scope.activeAccountId,
    workspaceRole: scope.workspaceRole,
  })).filter((trade) => trade.members.length > 1);
  if (logical.length === 0) return data;
  const days = data.days.map((day) => ({ ...day, tickers: day.tickers.map((ticker) => ({
    ...ticker, trades: [...ticker.trades],
  })) }));
  let removed = 0;
  for (const logicalTrade of logical) {
    const located = logicalTrade.members.map((member) => {
      for (const day of days) for (const ticker of day.tickers) {
        const trade = ticker.trades.find((candidate) => candidate.roundTripId === member.roundTripId);
        if (trade) return { day, ticker, trade };
      }
      return null;
    });
    if (located.some((item) => item === null)) continue;
    const members = located as Array<NonNullable<(typeof located)[number]>>;
    for (const item of members) item.ticker.trades = item.ticker.trades.filter((trade) => trade.roundTripId !== item.trade.roundTripId);
    const finalDate = localDate(logicalTrade.closedAtUtc, data.timezone);
    const targetDay = days.find((day) => day.date === finalDate) ?? members.at(-1)!.day;
    const targetTicker = targetDay.tickers.find((ticker) => ticker.instrumentId === members[0]!.ticker.instrumentId) ?? members.at(-1)!.ticker;
    const pnl = members.every((item) => item.trade.pnlDecimal !== null)
      ? members.reduce((total, item) => addExactDecimals(total, item.trade.pnlDecimal!), "0") : null;
    const logicalNote = database.prepare(`SELECT note_text FROM journal_logical_trade_notes
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
      scope.workspaceId, scope.activeAccountId, logicalTrade.logicalTradeId,
    ) as { note_text: string } | undefined;
    const logicalTags = database.prepare(`SELECT tag.current_name
FROM journal_logical_trade_tag_assignments assignment
JOIN journal_tags tag ON tag.workspace_id = assignment.workspace_id
 AND tag.account_id = assignment.account_id AND tag.tag_id = assignment.tag_id
WHERE assignment.workspace_id = ? AND assignment.account_id = ?
 AND assignment.logical_trade_id = ? AND assignment.assignment_state = 'assigned'
ORDER BY tag.normalized_name, tag.tag_id`).all(
      scope.workspaceId, scope.activeAccountId, logicalTrade.logicalTradeId,
    ) as readonly { current_name: string }[];
    targetTicker.trades.push(Object.freeze({ ...members[0]!.trade,
      executions: Object.freeze(members.flatMap((item) => item.trade.executions)
        .sort((left, right) => left.executedAtUtc.localeCompare(right.executedAtUtc))),
      notes: Object.freeze([...members.flatMap((item) => item.trade.notes),
        ...(logicalNote?.note_text ? [logicalNote.note_text] : [])]),
      pnlDecimal: pnl,
      pnlSign: pnl === null ? null : compareExactDecimals(pnl, "0") as -1 | 0 | 1,
      tags: Object.freeze([...new Set([...members.flatMap((item) => item.trade.tags),
        ...logicalTags.map((tag) => tag.current_name)])]),
    }));
    removed += members.length - 1;
  }
  if (removed === 0) return data;
  let wins = 0; let trades = 0;
  const frozenDays = days.map((day) => {
    const tickers = day.tickers.map((ticker) => {
      const pnls = ticker.trades.map((trade) => trade.pnlDecimal);
      const pnl = pnls.length > 0 && pnls.every((value) => value !== null)
        ? (pnls as string[]).reduce(addExactDecimals, "0") : null;
      return Object.freeze({ ...ticker, pnlDecimal: pnl,
        pnlSign: pnl === null ? null : compareExactDecimals(pnl, "0") as -1 | 0 | 1,
        trades: Object.freeze(ticker.trades) });
    });
    const dayTrades = tickers.flatMap((ticker) => ticker.trades);
    const dayWins = dayTrades.filter((trade) => trade.pnlDecimal !== null && compareExactDecimals(trade.pnlDecimal, "0") > 0).length;
    wins += dayWins; trades += dayTrades.length;
    return Object.freeze({ ...day, tickers: Object.freeze(tickers), tradeCount: dayTrades.length,
      winRatePercentDecimal: dayTrades.length === 0 ? null : percentageExactDecimals(String(dayWins), String(dayTrades.length)).roundedDecimal });
  });
  return Object.freeze({ ...data, days: Object.freeze(frozenDays), summary: Object.freeze({
    ...data.summary, tradeCount: trades,
    winRatePercentDecimal: trades === 0 ? null : percentageExactDecimals(String(wins), String(trades)).roundedDecimal,
  }) });
}

function calendarDateWindow(
  data: JournalCalendarReadModel,
  startDate: string | null,
  endDate: string | null,
): JournalCalendarReadModel {
  const days = data.days.filter((day) =>
    (!startDate || day.date >= startDate) && (!endDate || day.date <= endDate));
  const trades = days.flatMap((day) => day.tickers.flatMap((ticker) => ticker.trades));
  const tradePnls = trades.map((trade) => trade.pnlDecimal);
  const netPnl = tradePnls.length > 0 && tradePnls.every((value) => value !== null)
    ? (tradePnls as string[]).reduce(addExactDecimals, "0")
    : null;
  const wins = trades.filter((trade) => trade.pnlDecimal !== null &&
    compareExactDecimals(trade.pnlDecimal, "0") > 0).length;
  return Object.freeze({
    ...data,
    activeDate: days.at(-1)?.date ?? data.activeDate,
    days: Object.freeze(days),
    maximumDate: days.at(-1)?.date ?? endDate ?? data.maximumDate,
    minimumDate: days[0]?.date ?? startDate ?? data.minimumDate,
    summary: Object.freeze({
      ...data.summary,
      netPnlDecimal: netPnl,
      netPnlSign: netPnl === null ? null : compareExactDecimals(netPnl, "0") as -1 | 0 | 1,
      tradeCount: trades.length,
      tradingDayCount: days.filter((day) => day.tradeCount > 0).length,
      winRatePercentDecimal: trades.length === 0 ? null :
        percentageExactDecimals(String(wins), String(trades.length)).roundedDecimal,
    }),
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
  database: Database.Database,
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
  const dashboardInput = {
    currency: input.currency === "all" ? null : input.currency,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    symbol: input.symbol === "all" ? null : input.symbol,
    direction: input.direction === "all" ? null : input.direction,
    performance: input.performance === "all" ? null : input.performance,
    pnlBand: input.pnlRange === "all" ? null : input.pnlRange,
    tradeCountBand: input.tradeCount === "all" ? null : input.tradeCount,
    session: input.session === "all" ? null : input.session,
  } as const;
  const rawData = dashboard.getCalendar(scope, dashboardInput);
  const needsEarlierSwingMembers = Boolean(scope.activeAccountId && rawData.timezone && dashboardInput.startDate &&
    new JournalLogicalTradeRepository(database).list(Object.freeze({
      userId: scope.userId, workspaceId: scope.workspaceId, accountId: scope.activeAccountId!,
      workspaceRole: scope.workspaceRole,
    })).some((trade) => trade.members.length > 1 && trade.tradeStyle === "swing" &&
      localDate(trade.closedAtUtc, rawData.timezone!) >= dashboardInput.startDate! &&
      (!dashboardInput.endDate || localDate(trade.closedAtUtc, rawData.timezone!) <= dashboardInput.endDate) &&
      localDate(trade.openedAtUtc, rawData.timezone!) < dashboardInput.startDate!));
  const logicalInput = needsEarlierSwingMembers
    ? dashboard.getCalendar(scope, { ...dashboardInput, startDate: null })
    : rawData;
  const logicalData = logicalCalendarModel(database, scope, logicalInput);
  const data = needsEarlierSwingMembers
    ? calendarDateWindow(logicalData, dashboardInput.startDate, dashboardInput.endDate)
    : logicalData;
  const annotationEvidence = data.timezone
    ? annotationEvidenceByTimezone.get(data.timezone) ??
      calendarAnnotationEvidence(database, scope, data.timezone)
    : undefined;
  if (data.timezone && annotationEvidence) {
    annotationEvidenceByTimezone.set(data.timezone, annotationEvidence);
  }
  return withCalendarAnnotations(scope, data, input, annotationEvidence);
}

export async function withCalendarDataRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (runtime: Readonly<{
    database: Database.Database;
    read: (input: CalendarFilterInput) => CalendarData;
  }>) => T | Promise<T>,
): Promise<T> {
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ database, dashboard }) => {
    const annotationEvidenceByTimezone = new Map<string, CalendarAnnotationEvidence>();
    return operation(Object.freeze({
      database,
      read: (input) => readCalendarData(
        scope,
        input,
        database,
        dashboard,
        annotationEvidenceByTimezone,
      ),
    }));
  }, { prefetchAllFactSet: true });
}

export async function getCalendarData(input: CalendarFilterInput): Promise<CalendarData> {
  const scope = await requireTraderLinkPlatformPageScope();
  return withCalendarDataRuntime(scope, ({ read }) => read(input));
}
