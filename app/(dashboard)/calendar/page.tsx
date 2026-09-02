import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
  type JournalCalendarOfflineViewModel,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { CalendarClient } from "./calendar-client";
import { emptyCalendarData, withCalendarDataRuntime } from "./calendar-data";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  journalScopeCurrentWeek,
  readJournalDemoScopeClock,
} from "@/src/modules/journal/server/demo/journal-demo-scope-clock";
import type {
  CalendarDirectionFilter,
  CalendarData,
  CalendarFilterInput,
  CalendarPerformanceFilter,
  CalendarPnlFilter,
  CalendarSessionFilter,
  CalendarTradeCountFilter,
  CalendarView,
  CalendarWeekOption,
} from "./calendar-types";

export const metadata: Metadata = {
  title: "Trading Calendar | TraderLink Platform",
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

function calendarNavigationOptions(
  catalogData: CalendarData,
  query: Record<string, string | string[] | undefined>,
  currentWeek: string,
): Readonly<{
  availableMonths: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  availableWeeks: readonly string[];
  currentWeek: string;
  selectedMonth: string;
  selectedWeek: string;
}> {
  const activityDates = catalogData.days
    .filter((day) => day.tradeCount > 0)
    .map((day) => day.date);
  const activityMonths = [...new Set(activityDates.map((date) => date.slice(0, 7)))];
  const availableMonths = [...new Set([...activityMonths, currentWeek.slice(0, 7)])].sort();
  const availableWeeks = [...new Set([...activityDates.map(weekStart), currentWeek])].sort();
  const availableWeekOptions: readonly CalendarWeekOption[] = availableWeeks.map((week) => Object.freeze({
    months: Object.freeze([...new Set([
      ...activityDates
        .filter((date) => weekStart(date) === week)
        .map((date) => date.slice(0, 7)),
      ...(week === currentWeek ? [currentWeek.slice(0, 7)] : []),
    ])]),
    week,
  }));
  const requestedMonth = value(query.month);
  const requestedWeek = validDate(value(query.week));
  return Object.freeze({
    availableMonths,
    availableWeekOptions,
    availableWeeks,
    currentWeek,
    selectedMonth: requestedMonth && availableMonths.includes(requestedMonth)
      ? requestedMonth
      : activityMonths.at(-1) ?? currentWeek.slice(0, 7),
    selectedWeek: requestedWeek && availableWeeks.includes(weekStart(requestedWeek))
      ? weekStart(requestedWeek)
      : currentWeek,
  });
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
  const scope = await requireTraderLinkPlatformPageScope();
  const demoClock = readJournalDemoScopeClock(scope);
  const calendar = reviewLayout
    ? (() => {
      const navigation = calendarNavigationOptions(
        emptyCalendarData(),
        query,
        journalScopeCurrentWeek(demoClock, "America/New_York"),
      );
      return Object.freeze({
        ...navigation,
        initialData: emptyCalendarData(),
      });
    })()
    : await withCalendarDataRuntime(scope, (read) => {
      const catalog = read({
        ...selectedFilters,
        endDate: "",
        startDate: "",
      });
      const navigation = calendarNavigationOptions(
        catalog,
        query,
        journalScopeCurrentWeek(demoClock, catalog.timezone ?? "America/New_York"),
      );
      return Object.freeze({
        ...navigation,
        initialData: read(initialView === "month"
          ? {
            ...selectedFilters,
            endDate: monthEnd(navigation.selectedMonth),
            startDate: monthStart(navigation.selectedMonth),
          }
          : {
            ...selectedFilters,
            endDate: weekEnd(navigation.selectedWeek),
            startDate: navigation.selectedWeek,
          }),
      });
    });
  const {
    availableMonths,
    availableWeekOptions,
    availableWeeks,
    currentWeek,
    initialData,
    selectedMonth,
    selectedWeek,
  } = calendar;
  const initialFilters: CalendarFilterInput = {
    ...selectedFilters,
    currency: selectedFilters.currency === "all"
      ? initialData.currency ?? "all"
      : selectedFilters.currency,
    endDate: initialView === "month" ? monthEnd(selectedMonth) : weekEnd(selectedWeek),
    startDate: initialView === "month" ? monthStart(selectedMonth) : selectedWeek,
  };
  const offlineModel: JournalCalendarOfflineViewModel = Object.freeze({
    availableMonths,
    availableWeekOptions,
    availableWeeks,
    initialData,
    initialFilters,
    initialView,
    kind: "calendar",
    selectedMonth,
    selectedWeek,
    version: 1,
  });

  return (
    <>
    {reviewLayout ? null : <OfflineSavedViewCapture
      accountTimezone={initialData.timezone}
      calculationVersion="journal-calendar-v1"
      coverage={journalOfflineRouteCoverage("calendar")}
      generatedAtUtc={new Date().toISOString()}
      model={offlineModel}
      pathname="/calendar"
      queryIdentity={`view:${initialView}:${selectedMonth}:${selectedWeek}`}
      reportingCurrency={initialData.currency}
      routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS.calendar}
    />}
    <CalendarClient
      key={`${initialView}:${selectedMonth}:${selectedWeek}:${JSON.stringify(initialFilters)}`}
      availableMonths={availableMonths}
      availableWeeks={availableWeeks}
      availableWeekOptions={availableWeekOptions}
      currentWeek={currentWeek}
      expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
      initialData={initialData}
      initialFilters={initialFilters}
      initialView={initialView}
      selectedMonth={selectedMonth}
      selectedWeek={selectedWeek}
    />
    </>
  );
}
