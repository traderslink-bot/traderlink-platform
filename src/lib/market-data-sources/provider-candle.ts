// 2026-04-12 10:01 AM America/Toronto
// PURPOSE:
// Defines provider-facing candle source contracts that live outside the raw trade timeline layer.
// These types represent upstream source data before it is normalized into the system's canonical Candle shape.

export type ProviderCandleTimestamp = string | number | Date;

export interface ProviderCandle {
  symbol: string;
  timestamp: ProviderCandleTimestamp;
  timeframe: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume: number | string;
  vwap?: number | string | null;
  tradeCount?: number | string | null;
  source?: string | null;
  sessionBucket?: string | null;
}

export interface ProviderCandleBatch {
  symbol: string;
  timeframe: string;
  candles: ProviderCandle[];
  source?: string | null;
}