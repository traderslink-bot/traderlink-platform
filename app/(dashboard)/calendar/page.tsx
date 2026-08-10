import type { Metadata } from "next";

import { CalendarClient } from "./calendar-client";
import { emptyCalendarData, getCalendarData } from "./calendar-data";
import { readJournalDataDecisionNoticeRef } from "@/src/modules/journal/server/decisions/journal-data-decision-notice";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type {
  CalendarDirectionFilter,
  CalendarFilterInput,
  CalendarPerformanceFilter,
  CalendarPnlFilter,
  CalendarSessionFilter,
  CalendarTradeCountFilter,
  CalendarView,
  CalendarWeekOption,
} from "./calendar-types";

export const metadata: Metadata = {
  title: "Calendar | TraderLink Platform",
  description: "Daily and ticker-level performance from accepted Trade Tracker executions.",
};

export const dynamic = "force-dynamic";

const performanceFilters = new Set<CalendarPerformanceFilter>(["all", "profitable", "losing"]);
const directionFilters = new Set<CalendarDirectionFilter>(["all", "long", "short"]);
const sessionFilters = new Set<CalendarSessionFilter>(["all", "premarket", "regular", "after_hours"]);
const tradeCountFilters = new Set<CalendarTradeCountFilter>(["all", "1-3", "4-6", "7+"]);
const pnlFilters = new Set<CalendarPnlFilter>(["all", "loss200", "flat", "profit200"]);

function value(input: string | string[] | undefined): string | undefined {
  return typeof input === "string" ? input : undefined;
}

function validDate(input: string | undefined): string | undefined {
  return input && /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : undefined;
}

function monthStart(month: string): string {
  return `${month}-01`;
}

function monthEnd(month: string): string {
  const [year, numericMonth] = month.split("-").map(Number);
  return new Date(Date.UTC(year, numericMonth, 0)).toISOString().slice(0, 10);
}

function weekStart(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

function weekEnd(week: string): string {
  const value = new Date(`${week}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 4);
  return value.toISOString().slice(0, 10);
}

function filters(search: Record<string, string | string[] | undefined>): CalendarFilterInput {
  const performance = value(search.performance);
  const direction = value(search.direction);
  const session = value(search.session);
  const tradeCount = value(search.tradeCount);
  const pnlRange = value(search.pnlRange);
  return {
    currency: value(search.currency)?.toUpperCase() ?? "all",
    direction: directionFilters.has(direction as CalendarDirectionFilter) ? direction as CalendarDirectionFilter : "all",
    endDate: validDate(value(search.endDate)) ?? "",
    performance: performanceFilters.has(performance as CalendarPerformanceFilter) ? performance as CalendarPerformanceFilter : "all",
    pnlRange: pnlFilters.has(pnlRange as CalendarPnlFilter) ? pnlRange as CalendarPnlFilter : "all",
    session: sessionFilters.has(session as CalendarSessionFilter) ? session as CalendarSessionFilter : "all",
    startDate: validDate(value(search.startDate)) ?? "",
    symbol: value(search.symbol) ?? "all",
    tradeCount: tradeCountFilters.has(tradeCount as CalendarTradeCountFilter) ? tradeCount as CalendarTradeCountFilter : "all",
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const selectedFilters = filters(query);
  const reviewLayout = process.env.NODE_ENV !== "production" && value(query.review) === "layout";
  const initialView: CalendarView = value(query.view) === "week" ? "week" : "month";
  const catalogData = reviewLayout
    ? emptyCalendarData()
    : await getCalendarData({
      ...selectedFilters,
      endDate: "",
      startDate: "",
    });
  const activityDates = catalogData.days
    .filter((day) => day.tradeCount > 0)
    .map((day) => day.date);
  const availableMonths = [...new Set(activityDates.map((date) => date.slice(0, 7)))];
  const availableWeeks = [...new Set(activityDates.map(weekStart))];
  const availableWeekOptions: readonly CalendarWeekOption[] = availableWeeks.map((week) => Object.freeze({
    months: Object.freeze([...new Set(activityDates
      .filter((date) => weekStart(date) === week)
      .map((date) => date.slice(0, 7)))]),
    week,
  }));
  const requestedMonth = value(query.month);
  const requestedWeek = validDate(value(query.week));
  const selectedMonth = requestedMonth && availableMonths.includes(requestedMonth)
    ? requestedMonth
    : availableMonths.at(-1) ?? catalogData.activeDate.slice(0, 7);
  const selectedWeek = requestedWeek && availableWeeks.includes(weekStart(requestedWeek))
    ? weekStart(requestedWeek)
    : availableWeeks.at(-1) ?? weekStart(catalogData.activeDate);
  const initialData = reviewLayout
    ? emptyCalendarData()
    : initialView === "month"
      ? await getCalendarData({
        ...selectedFilters,
        endDate: monthEnd(selectedMonth),
        startDate: monthStart(selectedMonth),
      })
      : await getCalendarData({
        ...selectedFilters,
        endDate: weekEnd(selectedWeek),
        startDate: selectedWeek,
      });
  const initialFilters: CalendarFilterInput = {
    ...selectedFilters,
    currency: selectedFilters.currency === "all"
      ? initialData.currency ?? "all"
      : selectedFilters.currency,
    endDate: initialView === "month" ? monthEnd(selectedMonth) : weekEnd(selectedWeek),
    startDate: initialView === "month" ? monthStart(selectedMonth) : selectedWeek,
  };
  const scope = await requireTraderLinkPlatformPageScope();

  return (
    <CalendarClient
      accountSelectionRef={currentJournalAccountSelectionRef(scope)}
      availableMonths={availableMonths}
      availableWeeks={availableWeeks}
      availableWeekOptions={availableWeekOptions}
      decisionNoticeRef={initialData.coverage.needsDecisionCount > 0
        ? readJournalDataDecisionNoticeRef(scope)
        : null}
      initialData={initialData}
      initialFilters={initialFilters}
      initialView={initialView}
      selectedMonth={selectedMonth}
      selectedWeek={selectedWeek}
    />
  );
}
