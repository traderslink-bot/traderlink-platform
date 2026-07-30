export type DaySessionTradeTag = {
  assignmentCount: number;
  name: string;
  revision: string;
  tagId: string;
};

export type DaySessionTradeJournal = {
  ruleStatus: "followed" | "broken" | "not-reviewed";
  ruleSummary: string;
  tags: DaySessionTradeTag[];
  technicalNote: string;
};

export type DaySessionRoundTrip = {
  direction: "long" | "short";
  entryAt: string;
  entryPrice: string | null;
  exitAt: string;
  exitPrice: string | null;
  gainLossPercent: string | null;
  journal: DaySessionTradeJournal;
  netPnl: string;
  roundTripKey: string;
  timezone: string;
};

export type DaySessionTicker = {
  gainLossPercent: string | null;
  netPnl: string;
  roundTrips: DaySessionRoundTrip[];
  stableInstrumentKey: string;
  symbol: string;
};

export type DaySessionRule = {
  applicability: "day" | "trade";
  custom: boolean;
  label: string;
  revision: string | null;
  ruleId: string;
  ruleVersion: string;
  status: "followed" | "broken" | "not-reviewed";
  targetLabel: string | null;
  targetRoundTripKey: string | null;
};

export type DaySessionDailyNote = {
  anythingElse: string;
  revision: string | null;
  technicalRecap: string;
  tomorrowsFocus: string;
  whatNeedsWork: string;
  whatWorked: string;
};

export type DaySessionWeekDay = {
  date: string;
  dailyNote: DaySessionDailyNote;
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
  availableTags: DaySessionTradeTag[];
  currency: string;
  date: string;
  netPnl: string;
  nextSessionDate: string | null;
  previousSessionDate: string | null;
  rules: DaySessionRule[];
  tickers: DaySessionTicker[];
  week: DaySessionWeek;
};
