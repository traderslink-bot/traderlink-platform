export const JOURNAL_CANDLE_REVIEW_CONTRACT_VERSION = "journal_candle_review_v1" as const;
export const YAHOO_CHART_PROVIDER_KEY = "yahoo_chart" as const;
export const YAHOO_CHART_ADAPTER_VERSION = "yahoo_chart_v1" as const;

export type CandleReviewStatus =
  | "ready"
  | "no_coverage"
  | "provider_unavailable"
  | "unsupported";

export type LevelAnalysisInterval = "1m" | "1d";

export type NormalizedMarketCandle = Readonly<{
  time: number;
  openDecimal: string;
  highDecimal: string;
  lowDecimal: string;
  closeDecimal: string;
  volumeDecimal: string;
  /** Exact traded amount when supplied by the provider; null means unavailable. */
  turnoverDecimal?: string | null;
}>;

export type MarketDataRequest = Readonly<{
  symbol: string;
  interval: LevelAnalysisInterval;
  startTime: number;
  endTime: number;
  includeExtendedHours: true;
}>;

export type MarketDataProviderResult =
  | Readonly<{
      ok: true;
      candles: readonly NormalizedMarketCandle[];
      exchangeTimezone: string | null;
      utcOffsetSeconds: number | null;
      normalizedCandleSha256: string;
    }>
  | Readonly<{
      ok: false;
      code: "coverage_unavailable" | "invalid_payload" | "provider_unavailable";
      failureReasonCode: string;
      exchangeTimezone: string | null;
      utcOffsetSeconds: number | null;
    }>;

export interface MarketDataProvider {
  fetch(request: MarketDataRequest): Promise<MarketDataProviderResult>;
}

export type CandleReviewTarget = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  assetClass: string;
  symbol: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  entryPriceDecimal: string;
  exitPriceDecimal: string;
}>;

export type CandleReviewFeedback = Readonly<{
  kind: "finding" | "no_feedback";
  title: string;
  detail: string;
}>;

export type CandleReviewAnalysis = Readonly<{
  entryTiming: CandleReviewFeedback;
  exitTiming: CandleReviewFeedback;
  profitGiveback: CandleReviewFeedback;
}>;

export type CandleReviewObservation = Readonly<{
  kind: string;
  score: number;
  time: number;
  zone: "entry" | "exit" | "held_peak";
}>;

export type CandleReviewIndicator = Readonly<{
  adr20: number | null;
  atr14: number | null;
  ema9: number | null;
  ema20: number | null;
  macd: number | null;
  macdHistogram: number | null;
  macdSignal: number | null;
  phase: "entry" | "exit";
  rsi14: number | null;
  vwap: number | null;
}>;

export type CandleReviewRecord = Readonly<{
  candleReviewId: string;
  revision: number;
  target: CandleReviewTarget;
  status: CandleReviewStatus;
  analysis: CandleReviewAnalysis;
  observations: readonly CandleReviewObservation[];
  indicators: readonly CandleReviewIndicator[];
  candles: readonly NormalizedMarketCandle[];
  analyzedAtUtc: string;
  refreshAvailableAtUtc: string;
}>;

export type CandleReviewPageModel = Readonly<{
  expectedAccountSelectionRef: string;
  target: CandleReviewTarget;
  review: CandleReviewRecord | null;
}>;
