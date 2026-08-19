import type { NormalizedMarketCandle } from "./candle-review-contracts";

export const DAILY_TRADE_ANALYZER_CONTRACT_VERSION = "daily_trade_analyzer_v2" as const;
export const DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES = Object.freeze([5, 15, 30, 60] as const);

export type DailyTradeAnalyzerEventKind = "entry" | "add" | "partial_exit" | "final_exit";

export type DailyTradeAnalyzerEvent = Readonly<{
  eventId: string;
  sequence: number;
  kind: DailyTradeAnalyzerEventKind;
  executedAtUtc: string;
  feesDecimal?: string | null;
  priceDecimal: string;
  quantityDecimal: string;
}>;

export type DailyTradeAnalyzerDirection = "long" | "short";

export type DailyTradeAnalyzerIndicatorSnapshot = Readonly<{
  adr20: number | null;
  atr14: number | null;
  ema9: number | null;
  ema20: number | null;
  macd: number | null;
  macdHistogram: number | null;
  macdSignal: number | null;
  relativeVolume: number | null;
  rsi14: number | null;
  rsi14CalculationVersion?: "wilder_rsi_14_v1";
  vwap: number | null;
}>;

export type DailyTradeAnalyzerPattern = Readonly<{
  availableAtExecution: boolean;
  candlesBeforeExecution: 0 | 1 | 2;
  kind: string;
  knownAtTime: number;
  score: number;
  time: number;
  timeframe: "1m" | "5m" | "15m";
}>;

export type DailyTradeAnalyzerReferenceDistance = Readonly<{
  anchorDecimal: string;
  signedDistanceDecimal: string;
  signedDistancePercent: number;
}>;

export type DailyTradeAnalyzerFiveMinuteContext = Readonly<{
  completedBeforeExecution: Readonly<{
    candleTime: number;
    ema9Distance: DailyTradeAnalyzerReferenceDistance | null;
    relativeVolume: number | null;
    turnoverDecimal: string | null;
    volumeDecimal: string;
  }> | null;
  containingCandle: Readonly<{
    candleLocationRatio: number | null;
    candleTime: number;
    ema9Distance: DailyTradeAnalyzerReferenceDistance | null;
    executionEdgeDistanceDecimal: string | null;
    relativeVolume: number | null;
    turnoverDecimal: string | null;
    volumeDecimal: string;
  }> | null;
  preExecutionPartial: Readonly<{
    completedMinuteCount: number;
    turnoverDecimal: string | null;
    volumeDecimal: string;
  }> | null;
}>;

export type DailyTradeAnalyzerEventPath = Readonly<{
  minutesAfterEvent: (typeof DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES)[number];
  observedAtCandleTime: number | null;
  oppositeDirectionMoveDecimal: string | null;
  tradeDirectionMoveDecimal: string | null;
}>;

export type DailyTradeAnalyzerEventMetrics = Readonly<{
  averageEntryPriceAfterDecimal: string | null;
  candleLocationRatio: number | null;
  candleTurnoverDecimal: string | null;
  candleVolumeDecimal: string | null;
  cumulativeSessionTurnoverDecimal: string | null;
  cumulativeSessionVolumeDecimal: string | null;
  ema9Distance: DailyTradeAnalyzerReferenceDistance | null;
  executionEdgeDistanceDecimal: string | null;
  excursionUntilFlat: Readonly<{
    adverseMoveDecimal: string;
    favorableMoveDecimal: string;
    minutesUntilFlat: number;
    observedThroughCandleTime: number | null;
  }> | null;
  positionQuantityAfterDecimal: string;
  positionQuantityBeforeDecimal: string;
  postEventPaths: readonly DailyTradeAnalyzerEventPath[];
  priorFavorableExtremePriceDecimal: string | null;
  givebackFromPriorFavorableExtremeDecimal: string | null;
  vwapDistance: DailyTradeAnalyzerReferenceDistance | null;
}>;

export type DailyTradeAnalyzerEventSnapshot = Readonly<{
  candleTime: number | null;
  event: DailyTradeAnalyzerEvent;
  fiveMinuteContext: DailyTradeAnalyzerFiveMinuteContext;
  indicators: DailyTradeAnalyzerIndicatorSnapshot | null;
  metrics: DailyTradeAnalyzerEventMetrics;
  patterns: readonly DailyTradeAnalyzerPattern[];
}>;

export type DailyTradeAnalyzerPostExitPath = Readonly<{
  minutesAfterExit: (typeof DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES)[number];
  favorableMoveDecimal: string | null;
  observedAtCandleTime: number | null;
}>;

export type DailyTradeGreenToRedStatus =
  | "unavailable"
  | "never_green"
  | "green_no_red"
  | "green_to_red_ended_red"
  | "green_to_red_recovered"
  | "green_to_red_ended_flat";

export type DailyTradeProfitOpportunityWindow = Readonly<{
  closesAtOrAboveStrongThresholdCount: number;
  completedCloseCount: number;
  durationMinutes: number;
  endedAtUtcSeconds: number;
  lowestPnlDecimal: string;
  peakAtUtcSeconds: number;
  peakPnlDecimal: string;
  peakToFinalReversalDecimal: string;
  startedAtUtcSeconds: number;
}>;

export type DailyTradeGreenToRedAnalysis = Readonly<{
  addedAfterPeakCount: number;
  bestProfitOpportunityIndex: number | null;
  completedClosePeakAtUtcSeconds: number | null;
  completedClosePeakPnlDecimal: string | null;
  feesComplete: boolean;
  finalPnlDecimal: string | null;
  firstGreenAtUtcSeconds: number | null;
  firstRedAtUtcSeconds: number | null;
  firstRedPnlDecimal: string | null;
  firstRecoveryAtUtcSeconds: number | null;
  minutesFromPeakToRed: number | null;
  partialExitBeforeRedCount: number;
  peakAtUtcSeconds: number | null;
  peakPnlDecimal: string | null;
  peakToFinalReversalDecimal: string | null;
  peakToRedReversalDecimal: string | null;
  positionQuantityAtPeakDecimal: string | null;
  positionQuantityAtRedDecimal: string | null;
  profitOpportunities: readonly DailyTradeProfitOpportunityWindow[];
  profitOpportunityThresholdDecimal: string | null;
  status: DailyTradeGreenToRedStatus;
  strongOpportunityThresholdDecimal: string | null;
}>;

export type DailyTradeAnalyzerResult = Readonly<{
  eventSnapshots: readonly DailyTradeAnalyzerEventSnapshot[];
  finalExitPaths: readonly DailyTradeAnalyzerPostExitPath[];
  greenToRed: DailyTradeGreenToRedAnalysis;
}>;

export type DailyTradeAnalyzerInput = Readonly<{
  candles: readonly NormalizedMarketCandle[];
  dailyRanges: readonly number[];
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
}>;
