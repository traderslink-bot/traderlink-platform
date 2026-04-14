// 2026-04-12 10:01 AM America/Toronto
// PURPOSE:
// Defines Yahoo-specific candle response shapes and flattened Yahoo candle row types.
// These types remain outside the raw trade timeline layer so Yahoo can be replaced later.

export interface YahooChartQuote {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
}

export interface YahooChartAdjclose {
  adjclose?: Array<number | null>;
}

export interface YahooChartIndicators {
  quote?: YahooChartQuote[];
  adjclose?: YahooChartAdjclose[];
}

export interface YahooChartMeta {
  symbol?: string;
  exchangeName?: string;
  instrumentType?: string;
  gmtoffset?: number;
  timezone?: string;
  exchangeTimezoneName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  scale?: number;
  priceHint?: number;
  currentTradingPeriod?: Record<string, unknown>;
  dataGranularity?: string;
  range?: string;
  validRanges?: string[];
}

export interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: YahooChartIndicators;
}

export interface YahooChartError {
  code?: string;
  description?: string;
}

export interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: YahooChartError | null;
  };
}

export interface YahooCandleRow {
  symbol: string;
  timestamp: number;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source?: string | null;
  sessionBucket?: string | null;
}