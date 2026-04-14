// 2026-04-12 09:03 AM America/Toronto
// PURPOSE:
// Normalizes raw candle-like input into the canonical Candle shape used by the
// raw trade timeline system.
// This file stays strictly factual and interpretation free.

// filename normalize-candle.ts 

import type { Candle } from "../types/candle";
import { normalizeOptionalSessionBucketValue } from "../session/normalize-session-bucket";

export interface NormalizeCandleInput {
  symbol: string;
  timestamp: string | Date;
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

function normalizeTimestamp(value: string | Date, fieldName: string): string {
  if (value instanceof Date) {
    const iso = value.toISOString();

    if (!iso) {
      throw new Error(`Invalid ${fieldName}: unable to convert Date to ISO string.`);
    }

    return iso;
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Invalid ${fieldName}: value is empty.`);
  }

  const parsedTime = Date.parse(normalized);

  if (Number.isNaN(parsedTime)) {
    throw new Error(`Invalid ${fieldName}: "${value}" is not a valid date/time.`);
  }

  return new Date(parsedTime).toISOString();
}

function normalizeRequiredNumber(
  value: number | string,
  fieldName: string,
): number {
  const normalized =
    typeof value === "number" ? value : Number.parseFloat(value.trim());

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid ${fieldName}: "${String(value)}" is not a valid number.`);
  }

  return normalized;
}

function normalizeOptionalNumber(
  value: number | string | null | undefined,
  fieldName: string,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  const normalized =
    typeof value === "number" ? value : Number.parseFloat(value.trim());

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid ${fieldName}: "${String(value)}" is not a valid number.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeCandle(input: NormalizeCandleInput): Candle {
  const symbol = input.symbol.trim().toUpperCase();
  const timeframe = input.timeframe.trim();

  if (!symbol) {
    throw new Error("Invalid candle symbol: value is empty.");
  }

  if (!timeframe) {
    throw new Error("Invalid candle timeframe: value is empty.");
  }

  const open = normalizeRequiredNumber(input.open, "open");
  const high = normalizeRequiredNumber(input.high, "high");
  const low = normalizeRequiredNumber(input.low, "low");
  const close = normalizeRequiredNumber(input.close, "close");
  const volume = normalizeRequiredNumber(input.volume, "volume");

  if (high < low) {
    throw new Error(`Invalid candle range: high (${high}) is below low (${low}).`);
  }

  if (open < low || open > high) {
    throw new Error(`Invalid candle open: ${open} is outside candle range ${low} to ${high}.`);
  }

  if (close < low || close > high) {
    throw new Error(`Invalid candle close: ${close} is outside candle range ${low} to ${high}.`);
  }

  if (volume < 0) {
    throw new Error(`Invalid candle volume: ${volume} cannot be negative.`);
  }

  return {
    symbol,
    timestamp: normalizeTimestamp(input.timestamp, "timestamp"),
    timeframe,
    open,
    high,
    low,
    close,
    volume,
    vwap: normalizeOptionalNumber(input.vwap, "vwap"),
    tradeCount: normalizeOptionalNumber(input.tradeCount, "tradeCount"),
    source: normalizeOptionalString(input.source),
    sessionBucket: normalizeOptionalSessionBucketValue(input.sessionBucket),
  };
}

export function normalizeCandles(inputs: NormalizeCandleInput[]): Candle[] {
  return inputs
    .map((input) => normalizeCandle(input))
    .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));
}
