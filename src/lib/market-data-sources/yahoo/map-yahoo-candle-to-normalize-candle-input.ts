// 2026-04-12 10:01 AM America/Toronto
// PURPOSE:
// Maps Yahoo-specific candle data into the NormalizeCandleInput shape expected by the raw timeline normalizer.
// This file keeps Yahoo-specific response handling outside the raw trade timeline layer.

import type { NormalizeCandleInput } from "../../raw-trade-timeline/normalizers/normalize-candle";
import type {
  YahooCandleRow,
  YahooChartResponse,
  YahooChartResult,
} from "./yahoo-candle-types";

export interface MapYahooCandleRowToNormalizeCandleInputArgs {
  row: YahooCandleRow;
}

export interface MapYahooChartResponseToNormalizeCandleInputsArgs {
  response: YahooChartResponse;
  symbol?: string;
  timeframe: string;
  source?: string;
  sessionBucketResolver?: (timestampIso: string) => string | undefined;
  includePartialRows?: boolean;
}

function toIsoFromUnixSeconds(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

function assertFiniteNumber(value: number | null | undefined, fieldName: string, index: number): number {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    throw new Error(
      `Invalid Yahoo candle row at index ${index}: ${fieldName} is missing or not finite.`,
    );
  }

  return value;
}

function mapYahooChartResultToRows(
  result: YahooChartResult,
  fallbackSymbol: string | undefined,
  timeframe: string,
  source: string,
  sessionBucketResolver?: (timestampIso: string) => string | undefined,
  includePartialRows = false,
): YahooCandleRow[] {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];

  if (!quote) {
    throw new Error("Invalid Yahoo chart response: quote data is missing.");
  }

  const symbol = (fallbackSymbol ?? result.meta?.symbol ?? "").trim().toUpperCase();

  if (!symbol) {
    throw new Error("Invalid Yahoo chart response: symbol is missing.");
  }

  if (!timeframe.trim()) {
    throw new Error("Invalid Yahoo chart response mapping: timeframe is empty.");
  }

  const rows: YahooCandleRow[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index];
    const open = quote.open?.[index] ?? null;
    const high = quote.high?.[index] ?? null;
    const low = quote.low?.[index] ?? null;
    const close = quote.close?.[index] ?? null;
    const volume = quote.volume?.[index] ?? null;

    const hasMissingField =
      timestamp === null ||
      timestamp === undefined ||
      open === null ||
      high === null ||
      low === null ||
      close === null ||
      volume === null;

    if (hasMissingField && !includePartialRows) {
      continue;
    }

    if (timestamp === null || timestamp === undefined || !Number.isFinite(timestamp)) {
      throw new Error(
        `Invalid Yahoo candle row at index ${index}: timestamp is missing or not finite.`,
      );
    }

    const timestampIso = toIsoFromUnixSeconds(timestamp);

    rows.push({
      symbol,
      timestamp,
      timeframe,
      open: assertFiniteNumber(open, "open", index),
      high: assertFiniteNumber(high, "high", index),
      low: assertFiniteNumber(low, "low", index),
      close: assertFiniteNumber(close, "close", index),
      volume: assertFiniteNumber(volume, "volume", index),
      source,
      sessionBucket: sessionBucketResolver?.(timestampIso),
    });
  }

  return rows;
}

export function mapYahooCandleRowToNormalizeCandleInput(
  args: MapYahooCandleRowToNormalizeCandleInputArgs,
): NormalizeCandleInput {
  const { row } = args;

  return {
    symbol: row.symbol.trim().toUpperCase(),
    timestamp: new Date(row.timestamp * 1000).toISOString(),
    timeframe: row.timeframe.trim(),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
    source: row.source ?? "yahoo",
    sessionBucket: row.sessionBucket ?? undefined,
  };
}

export function mapYahooChartResponseToNormalizeCandleInputs(
  args: MapYahooChartResponseToNormalizeCandleInputsArgs,
): NormalizeCandleInput[] {
  const { response, symbol, timeframe, sessionBucketResolver, includePartialRows = false } = args;
  const source = args.source?.trim() || "yahoo";

  const results = response.chart?.result;

  if (!results || results.length === 0) {
    const errorDescription = response.chart?.error?.description?.trim();

    if (errorDescription) {
      throw new Error(`Yahoo chart response error: ${errorDescription}`);
    }

    throw new Error("Yahoo chart response does not contain any chart results.");
  }

  const rows = mapYahooChartResultToRows(
    results[0],
    symbol?.trim().toUpperCase(),
    timeframe,
    source,
    sessionBucketResolver,
    includePartialRows,
  );

  return rows.map((row) => mapYahooCandleRowToNormalizeCandleInput({ row }));
}