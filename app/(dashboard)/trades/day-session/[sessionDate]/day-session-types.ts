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
  netPnl: number;
  roundTripKey: string;
  timezone: string;
};

export type DaySessionTicker = {
  netPnl: number;
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

export type DaySessionData = {
  currency: string;
  date: string;
  netPnl: number;
  rules: DaySessionRule[];
  tickers: DaySessionTicker[];
};
