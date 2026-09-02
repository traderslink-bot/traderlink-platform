import type {
  JournalCalendarDayReadModel,
  JournalCalendarReadModel,
  JournalCalendarTickerReadModel,
} from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";

export type CalendarView = "month" | "week";
export type CalendarPerformanceFilter = "all" | "profitable" | "losing";
export type CalendarDirectionFilter = "all" | "long" | "short";
export type CalendarSessionFilter = "all" | "premarket" | "regular" | "after_hours";
export type CalendarTradeCountFilter = "all" | "1-3" | "4-6" | "7+";
export type CalendarPnlFilter = "all" | "loss200" | "flat" | "profit200";

export type CalendarWeekOption = Readonly<{
  months: readonly string[];
  week: string;
}>;

export type CalendarFilterInput = {
  currency: string;
  direction: CalendarDirectionFilter;
  endDate: string;
  performance: CalendarPerformanceFilter;
  pnlRange: CalendarPnlFilter;
  session: CalendarSessionFilter;
  startDate: string;
  symbol: string;
  tradeCount: CalendarTradeCountFilter;
};

export type CalendarTickerResult = JournalCalendarTickerReadModel;
export type CalendarDay = JournalCalendarDayReadModel & Readonly<{
  hasDailyTracker: boolean;
  hasSessionReview: boolean;
}>;
export type CalendarData = Omit<JournalCalendarReadModel, "days"> & Readonly<{
  days: readonly CalendarDay[];
}>;
