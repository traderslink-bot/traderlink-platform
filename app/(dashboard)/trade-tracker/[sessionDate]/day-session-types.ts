export type DaySessionTradeTag = {
  assignmentCount: number;
  name: string;
  revision: string;
  tagId: string;
};

export type DaySessionTradeJournal = {
  noteRevision: string | null;
  ruleStatus: "followed" | "broken" | "not-reviewed";
  ruleSummary: string;
  tags: DaySessionTradeTag[];
  technicalNote: string;
  tradeNote: string;
};

export type DaySessionRoundTrip = {
  direction: "long" | "short";
  entryAt: string;
  entryPrice: string | null;
  exitAt: string;
  exitPrice: string | null;
  gainLossPercent: string | null;
  journal: DaySessionTradeJournal;
  netPnl: string | null;
  roundTripKey: string;
  timezone: string;
};

export type DaySessionTicker = {
  gainLossPercent: string | null;
  netPnl: string | null;
  roundTrips: DaySessionRoundTrip[];
  stableInstrumentKey: string;
  symbol: string;
};

export type DaySessionOpenPosition = {
  averageEntryPrice: string | null;
  direction: "long" | "short";
  openedAt: string;
  positionKey: string;
  remainingQuantity: string;
  stableInstrumentKey: string;
  symbol: string;
  timezone: string;
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
  netPnl: string | null;
  tickerCount: number;
  tradeCount: number;
};

export type DaySessionWeek = {
  currentSessionDate: string;
  days: DaySessionWeekDay[];
  netPnl: string | null;
  tickerCount: number;
  tradeCount: number;
};

export type DaySessionData = {
  availableTags: DaySessionTradeTag[];
  currency: string;
  dailyNote: DaySessionDailyNote;
  date: string;
  decisionActivity: Array<{
    direction: "long" | "short";
    executionCount: number;
    openedAt: string;
    reasonCodes: readonly string[];
    roundTripKey: string;
    symbol: string;
  }>;
  executionActivity: Array<{
    executedAt: string;
    executionKey: string;
    needsDecision: boolean;
    price: string | null;
    quantity: string;
    side: "buy" | "sell";
    symbol: string;
  }>;
  expectedAccountSelectionRef: string;
  netPnl: string | null;
  needsDecisionCount: number;
  nextSessionDate: string | null;
  openPositions: DaySessionOpenPosition[];
  positionSnapshots: Array<{
    averageEntryPrice: string | null;
    closingQuantity: string;
    direction: "long" | "short";
    openingQuantity: string;
    positionKey: string;
    state: "opened_and_carried_out" | "carried_in_and_closed" | "carried_through";
    symbol: string;
  }>;
  previousSessionDate: string | null;
  rules: DaySessionRule[];
  tickers: DaySessionTicker[];
  timezone: string;
  week: DaySessionWeek;
};
