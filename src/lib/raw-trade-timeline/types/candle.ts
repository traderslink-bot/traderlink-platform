// 2026-04-12 08:20 AM America/Toronto
// PURPOSE:
// Defines the raw normalized candle shape for the trade timeline system.
// This file stays strictly factual and interpretation free.

// file name candle.ts

import type { SessionBucket } from "./session-context";

export type CandleSource = string;

export type CandleSessionBucket = SessionBucket;

export interface Candle {
  symbol: string;
  timestamp: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  tradeCount?: number;
  source?: CandleSource;
  sessionBucket?: CandleSessionBucket;
}
