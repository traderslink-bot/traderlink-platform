import "server-only";

import type { TradeCandle } from "./candle-analysis";

const YAHOO_CHART_ORIGIN = "https://query1.finance.yahoo.com";
const MAX_RANGE_SECONDS = 7 * 24 * 60 * 60;
const MAX_DAILY_RANGE_SECONDS = 370 * 24 * 60 * 60;

type YahooChartPayload = {
  chart?: {
    error?: { description?: string } | null;
    result?: Array<{
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          open?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
      timestamp?: number[];
    }>;
  };
};

export type YahooCandleResult =
  | { ok: true; candles: readonly TradeCandle[] }
  | {
      ok: false;
      code:
        | "coverage_unavailable"
        | "invalid_request"
        | "provider_unavailable";
    };

function isSupportedSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol);
}

function normalizeYahooCandles(payload: YahooChartPayload): readonly TradeCandle[] | null {
  const result = payload.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp;
  if (!result || !quote || !timestamps || payload.chart?.error) return null;
  const candles: TradeCandle[] = [];
  for (let index = 0; index < timestamps.length; index += 1) {
    const candle = {
      time: timestamps[index],
      open: quote.open?.[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      close: quote.close?.[index],
      volume: quote.volume?.[index],
    };
    if (
      !Number.isInteger(candle.time) ||
      ![candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite)
    ) continue;
    candles.push(candle as TradeCandle);
  }
  candles.sort((left, right) => left.time - right.time);
  return candles;
}

async function fetchYahooCandles(args: {
  endTime: number;
  interval: "1m" | "1d";
  maxRange: number;
  startTime: number;
  symbol: string;
}): Promise<YahooCandleResult> {
  const { endTime, startTime } = args;
  const symbol = args.symbol.trim().toUpperCase();
  if (!isSupportedSymbol(symbol) || !Number.isInteger(startTime) || !Number.isInteger(endTime) || endTime <= startTime || endTime - startTime > args.maxRange) {
    return { ok: false, code: "invalid_request" };
  }
  const query = new URLSearchParams({
    includePrePost: "false",
    interval: args.interval,
    period1: String(startTime),
    period2: String(endTime),
  });
  let response: Response;
  try {
    response = await fetch(`${YAHOO_CHART_ORIGIN}/v8/finance/chart/${encodeURIComponent(symbol)}?${query}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    return { ok: false, code: "provider_unavailable" };
  }
  try {
    const payload = (await response.json()) as YahooChartPayload;
    if (payload.chart?.error) {
      return { ok: false, code: "coverage_unavailable" };
    }
    if (!response.ok) return { ok: false, code: "provider_unavailable" };
    const candles = normalizeYahooCandles(payload);
    return candles === null ? { ok: false, code: "provider_unavailable" } : { ok: true, candles };
  } catch {
    return { ok: false, code: "provider_unavailable" };
  }
}

export async function fetchYahooOneMinuteCandles(args: {
  endTime: number;
  startTime: number;
  symbol: string;
}): Promise<YahooCandleResult> {
  return fetchYahooCandles({ ...args, interval: "1m", maxRange: MAX_RANGE_SECONDS });
}

export async function fetchYahooDailyCandles(args: {
  endTime: number;
  startTime: number;
  symbol: string;
}): Promise<YahooCandleResult> {
  return fetchYahooCandles({ ...args, interval: "1d", maxRange: MAX_DAILY_RANGE_SECONDS });
}
