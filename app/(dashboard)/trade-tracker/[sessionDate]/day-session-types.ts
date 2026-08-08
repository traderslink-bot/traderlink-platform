export type DaySessionTradeTag = {
  assignmentCount: number;
  category?: import("@/src/modules/journal/contracts/journal-tag-preset-catalog").JournalTagPresetCategory | "custom";
  name: string;
  presetKey?: string;
  revision: string;
  tagId: string;
};

export type DaySessionTradeJournal = {
  noteRevision: string | null;
  ruleStatus: "followed" | "broken" | "not-reviewed" | "n/a";
  ruleSummary: string;
  tags: DaySessionTradeTag[];
  technicalNote: string;
  tradeNote: string;
};

export type DaySessionRoundTrip = {
  analyzer: DaySessionTradeAnalyzer | null;
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

export type DaySessionTradeAnalyzer = {
  candles: Array<{
    close: string;
    high: string;
    low: string;
    open: string;
    time: number;
    turnover: string | null;
    volume: string;
  }>;
  events: Array<{
    candleTime: number | null;
    eventId: string;
    executedAt: string;
    fees: string | null;
    indicators: {
      adr20: number | null;
      atr14: number | null;
      ema9: number | null;
      ema20: number | null;
      macd: number | null;
      macdHistogram: number | null;
      macdSignal: number | null;
      relativeVolume: number | null;
      rsi14: number | null;
      vwap: number | null;
    } | null;
    kind: "entry" | "add" | "partial_exit" | "final_exit";
    metrics: {
      available: boolean;
      averageEntryPriceAfter: string | null;
      candleLocationRatio: number | null;
      candleTurnover: string | null;
      candleVolume: string | null;
      cumulativeSessionTurnover: string | null;
      cumulativeSessionVolume: string | null;
      ema9Distance: {
        anchor: string;
        signedDistance: string;
        signedDistancePercent: number;
      } | null;
      executionEdgeDistance: string | null;
      excursionUntilFlat: {
        adverseMove: string;
        favorableMove: string;
        minutesUntilFlat: number;
        observedThrough: number | null;
      } | null;
      givebackFromPriorFavorableExtreme: string | null;
      positionQuantityAfter: string;
      positionQuantityBefore: string;
      postEventPaths: Array<{
        minutesAfterEvent: 5 | 15 | 30 | 60;
        observedAt: number | null;
        oppositeDirectionMove: string | null;
        tradeDirectionMove: string | null;
      }>;
      priorFavorableExtremePrice: string | null;
      vwapDistance: {
        anchor: string;
        signedDistance: string;
        signedDistancePercent: number;
      } | null;
    };
    patterns: Array<{ kind: string; score: number; time: number }>;
    price: string;
    quantity: string;
    sequence: number;
  }>;
  finalExitPaths: Array<{
    favorableMove: string | null;
    minutesAfterExit: 5 | 15 | 30 | 60;
    observedAt: number | null;
  }>;
  greenToRed: import("@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts").DailyTradeGreenToRedAnalysis;
  status: "ready" | "no_coverage" | "provider_unavailable" | "expired" | "pending";
};

export type DaySessionExecutionActivity = {
  analysisEventKey?: string;
  executedAt: string;
  executionKey: string;
  manualEdit: {
    editRef: string;
    fees: string | null;
    localDate: string;
    localTime: string;
    sourceTimezone: string;
    tradeCurrency: string;
  } | null;
  needsDecision: boolean;
  price: string | null;
  quantity: string;
  roundTripKeys: readonly string[];
  side: "buy" | "sell";
  symbol: string;
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
  executions: DaySessionExecutionActivity[];
  journal: DaySessionTradeJournal;
  openedAt: string;
  positionKey: string;
  positionRef: string | null;
  remainingQuantity: string;
  stableInstrumentKey: string;
  style: JournalTradeStyleRecord | null;
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
  status: "followed" | "broken" | "not-reviewed" | "n/a";
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
  availableSessionDates: string[];
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
  executionActivity: DaySessionExecutionActivity[];
  expectedAccountSelectionRef: string;
  factSetRevisionSha256: string;
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
  review: {
    revision: number | null;
    status: "reviewed" | "incomplete" | null;
    unclassifiedOpenPositionCount: number;
    updatedAtUtc: string | null;
  };
  rules: DaySessionRule[];
  tickers: DaySessionTicker[];
  timezone: string;
  week: DaySessionWeek;
};
import type { JournalTradeStyleRecord } from "@/src/modules/journal/contracts/journal-trade-style-contracts";
