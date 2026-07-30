export type CalendarView = "month" | "week";
export type CalendarPerformanceFilter = "all" | "profitable" | "losing";
export type CalendarDirectionFilter = "all" | "long" | "short";
export type CalendarSessionFilter = "all" | "premarket" | "regular" | "after_hours";
export type CalendarTradeCountFilter = "all" | "1-3" | "4-6" | "7+";
export type CalendarPnlFilter = "all" | "loss200" | "flat" | "profit200";

export type CalendarFilterInput = {
  direction: CalendarDirectionFilter;
  endDate: string;
  performance: CalendarPerformanceFilter;
  pnlRange: CalendarPnlFilter;
  session: CalendarSessionFilter;
  startDate: string;
  symbol: string;
  tradeCount: CalendarTradeCountFilter;
};

export type CalendarTickerResult = {
  pnl: number;
  symbol: string;
};

export type CalendarDay = {
  date: string;
  peakGiveback: number | null;
  pnl: number | null;
  tickers: CalendarTickerResult[];
  trades: number;
  winRate: number | null;
};

export type CalendarData = {
  activeDate: string;
  currency: string | null;
  days: CalendarDay[];
  maximumDate: string;
  minimumDate: string;
  status: "ready" | "unavailable";
  summary: {
    netPnl: number;
    tradingDays: number;
    trades: number;
    winRate: number | null;
  };
  symbols: string[];
};
