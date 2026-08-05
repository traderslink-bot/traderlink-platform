import type { NormalizedMarketCandle } from "./candle-review-contracts";

export const DAILY_TRADE_ANALYZER_CONTRACT_VERSION = "daily_trade_analyzer_v1" as const;
export const DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES = Object.freeze([5, 15, 30, 60] as const);

export type DailyTradeAnalyzerEventKind = "entry" | "add" | "partial_exit" | "final_exit";

export type DailyTradeAnalyzerEvent = Readonly<{
  eventId: string;
  kind: DailyTradeAnalyzerEventKind;
  executedAtUtc: string;
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
  vwap: number | null;
}>;

export type DailyTradeAnalyzerPattern = Readonly<{
  kind: string;
  score: number;
  time: number;
}>;

export type DailyTradeAnalyzerEventSnapshot = Readonly<{
  candleTime: number | null;
  event: DailyTradeAnalyzerEvent;
  indicators: DailyTradeAnalyzerIndicatorSnapshot | null;
  patterns: readonly DailyTradeAnalyzerPattern[];
}>;

export type DailyTradeAnalyzerPostExitPath = Readonly<{
  minutesAfterExit: (typeof DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES)[number];
  favorableMoveDecimal: string | null;
  observedAtCandleTime: number | null;
}>;

export type DailyTradeAnalyzerResult = Readonly<{
  eventSnapshots: readonly DailyTradeAnalyzerEventSnapshot[];
  finalExitPaths: readonly DailyTradeAnalyzerPostExitPath[];
}>;

export type DailyTradeAnalyzerInput = Readonly<{
  candles: readonly NormalizedMarketCandle[];
  dailyRanges: readonly number[];
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
}>;
