import type { Metadata } from "next";

import { CalendarClient } from "./calendar-client";
import { emptyCalendarData, getCalendarData } from "./calendar-data";
import type {
  CalendarDirectionFilter,
  CalendarFilterInput,
  CalendarPerformanceFilter,
  CalendarPnlFilter,
  CalendarSessionFilter,
  CalendarTradeCountFilter,
  CalendarView,
} from "./calendar-types";

export const metadata: Metadata = {
  title: "Calendar | TraderLink Platform",
  description: "Daily and ticker-level performance from accepted Journal executions.",
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
  const initialData = reviewLayout ? emptyCalendarData() : await getCalendarData(selectedFilters);
  const initialView: CalendarView = value(query.view) === "week" ? "week" : "month";
  const initialFilters: CalendarFilterInput = {
    ...selectedFilters,
    currency: selectedFilters.currency === "all"
      ? initialData.currency ?? "all"
      : selectedFilters.currency,
    endDate: selectedFilters.endDate || initialData.maximumDate,
    startDate: selectedFilters.startDate || initialData.minimumDate,
  };

  return <CalendarClient initialData={initialData} initialFilters={initialFilters} initialView={initialView} />;
}
