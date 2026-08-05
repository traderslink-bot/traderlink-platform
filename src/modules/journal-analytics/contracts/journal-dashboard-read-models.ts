export type JournalDashboardCoverage = Readonly<{
  readyClosedCount: number;
  legitimateOpenCount: number;
  needsDecisionCount: number;
  feeCompleteCount: number;
  feeIncompleteCount: number;
  limitationReasonCodes: readonly string[];
}>;

export type JournalCalendarFilterInput = Readonly<{
  currency: string | null;
  startDate: string | null;
  endDate: string | null;
  symbol: string | null;
  direction: "long" | "short" | null;
  performance: "profitable" | "losing" | null;
  pnlBand: "loss200" | "flat" | "profit200" | null;
  tradeCountBand: "1-3" | "4-6" | "7+" | null;
  session: "premarket" | "regular" | "after_hours" | null;
}>;

export type JournalCalendarTickerReadModel = Readonly<{
  instrumentId: string;
  symbol: string;
  pnlDecimal: string | null;
  pnlSign: -1 | 0 | 1 | null;
  noteCount: number;
  ruleReviewCount: number;
  tagCount: number;
  trades: readonly JournalCalendarTradeReadModel[];
}>;

export type JournalCalendarTradeReadModel = Readonly<{
  executions: readonly JournalCalendarTradeExecutionReadModel[];
  notes: readonly string[];
  roundTripId: string;
  pnlDecimal: string | null;
  pnlSign: -1 | 0 | 1 | null;
  tags: readonly string[];
}>;

export type JournalCalendarTradeExecutionReadModel = Readonly<{
  executedAtUtc: string;
  priceDecimal: string | null;
  quantityDecimal: string;
  side: "buy" | "sell";
}>;

export type JournalCalendarDayReadModel = Readonly<{
  date: string;
  peakGivebackDecimal: string | null;
  pnlDecimal: string | null;
  pnlSign: -1 | 0 | 1 | null;
  tickers: readonly JournalCalendarTickerReadModel[];
  tradeCount: number;
  reviewStatus: "reviewed" | "needs_review" | null;
  winRatePercentDecimal: string | null;
}>;

export type JournalCalendarReadModel = Readonly<{
  state: "ready" | "empty" | "unavailable";
  currency: string | null;
  availableCurrencies: readonly string[];
  timezone: string | null;
  activeDate: string;
  minimumDate: string;
  maximumDate: string;
  days: readonly JournalCalendarDayReadModel[];
  symbols: readonly string[];
  summary: Readonly<{
    netPnlDecimal: string | null;
    netPnlSign: -1 | 0 | 1 | null;
    tradeCount: number;
    tradingDayCount: number;
    winRatePercentDecimal: string | null;
  }>;
  coverage: JournalDashboardCoverage;
}>;

export type JournalTickerHistoryRow = Readonly<{
  instrumentId: string;
  symbol: string;
  currency: string;
  tradingDayCount: number;
  roundTripCount: number;
  longCount: number;
  shortCount: number;
  netPnlDecimal: string | null;
  netPnlSign: -1 | 0 | 1 | null;
  winRatePercentDecimal: string | null;
}>;

export type JournalTickerHistoryReadModel = Readonly<{
  rows: readonly JournalTickerHistoryRow[];
  coverage: JournalDashboardCoverage;
  factSetRevisionSha256: string;
}>;

export type JournalOpenPositionRow = Readonly<{
  roundTripId: string;
  instrumentId: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  remainingQuantityDecimal: string;
  averageEntryPriceDecimal: string | null;
  ageMilliseconds: number;
}>;

export type JournalPendingPositionDecision = Readonly<{
  roundTripId: string;
  symbol: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  reasonCodes: readonly string[];
}>;

export type JournalOpenPositionsReadModel = Readonly<{
  positions: readonly JournalOpenPositionRow[];
  decisions: readonly JournalPendingPositionDecision[];
  coverage: JournalDashboardCoverage;
  asOfUtc: string;
  factSetRevisionSha256: string;
}>;

export type JournalTradingDayRoundTrip = Readonly<{
  roundTripId: string;
  instrumentId: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  entryAtUtc: string;
  exitAtUtc: string;
  entryPriceDecimal: string | null;
  exitPriceDecimal: string | null;
  netPnlDecimal: string | null;
  gainLossPercentDecimal: string | null;
}>;

export type JournalTradingDayTicker = Readonly<{
  instrumentId: string;
  symbol: string;
  currency: string;
  netPnlDecimal: string | null;
  gainLossPercentDecimal: string | null;
  roundTrips: readonly JournalTradingDayRoundTrip[];
}>;

export type JournalTradingDaySummary = Readonly<{
  date: string;
  currency: string | null;
  netPnlDecimal: string | null;
  tickerCount: number;
  tradeCount: number;
}>;

export type JournalTradingDayDecisionActivity = Readonly<{
  roundTripId: string;
  symbol: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  executionCountOnDate: number;
  reasonCodes: readonly string[];
}>;

export type JournalTradingDayExecutionActivity = Readonly<{
  executionId: string;
  executionVersionId: string;
  instrumentId: string;
  symbol: string;
  currency: string;
  executedAtUtc: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  projectionStates: readonly (
    | "ready_closed"
    | "legitimate_open"
    | "needs_decision"
  )[];
  roundTripIds: readonly string[];
  needsDecision: boolean;
}>;

export type JournalTradingDayPositionSnapshot = Readonly<{
  roundTripId: string;
  instrumentId: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  openingQuantityDecimal: string;
  closingQuantityDecimal: string;
  averageEntryPriceDecimal: string | null;
  state:
    | "opened_and_carried_out"
    | "carried_in_and_closed"
    | "carried_through";
}>;

export type JournalTradingDayReadModel = Readonly<{
  state: "ready" | "empty";
  date: string;
  currency: string | null;
  availableCurrencies: readonly string[];
  timezone: string | null;
  netPnlDecimal: string | null;
  decisionActivity: readonly JournalTradingDayDecisionActivity[];
  availableTradingDates: readonly string[];
  executionActivity: readonly JournalTradingDayExecutionActivity[];
  previousTradingDate: string | null;
  nextTradingDate: string | null;
  latestTradingDate: string | null;
  tickers: readonly JournalTradingDayTicker[];
  openPositions: readonly JournalOpenPositionRow[];
  positionSnapshots: readonly JournalTradingDayPositionSnapshot[];
  week: Readonly<{
    startDate: string;
    endDate: string;
    days: readonly JournalTradingDaySummary[];
    netPnlDecimal: string | null;
    tickerCount: number;
    tradeCount: number;
  }>;
  coverage: JournalDashboardCoverage;
  factSetRevisionSha256: string;
}>;
