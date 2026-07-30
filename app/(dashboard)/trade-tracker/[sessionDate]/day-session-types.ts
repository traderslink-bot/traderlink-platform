export type DaySessionTradeJournal = {
  ruleStatus: "followed" | "broken" | "not-reviewed";
  ruleSummary: string;
  tags: string[];
  technicalNote: string;
};

export type DaySessionRoundTrip = {
  direction: "long" | "short";
  entryAt: string;
  exitAt: string;
  journal: DaySessionTradeJournal;
  netPnl: string;
  roundTripKey: string;
  timezone: string;
};

export type DaySessionTicker = {
  netPnl: string;
  roundTrips: DaySessionRoundTrip[];
  stableInstrumentKey: string;
  symbol: string;
};

export type DaySessionRule = {
  applicability: "day" | "trade";
  custom: boolean;
  label: string;
  status: "followed" | "broken" | "not-reviewed";
};

export type DaySessionWeekDay = {
  date: string;
  netPnl: string;
  tickerCount: number;
  tradeCount: number;
};

export type DaySessionWeek = {
  currentSessionDate: string;
  days: DaySessionWeekDay[];
  netPnl: string;
  tickerCount: number;
  tradeCount: number;
};

export type DaySessionData = {
  currency: string;
  date: string;
  netPnl: string;
  nextSessionDate: string | null;
  previousSessionDate: string | null;
  rules: DaySessionRule[];
  tickers: DaySessionTicker[];
  week: DaySessionWeek;
};
