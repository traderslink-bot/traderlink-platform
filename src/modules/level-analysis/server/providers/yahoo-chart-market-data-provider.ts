import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  MarketDataProvider,
  MarketDataProviderResult,
  MarketDataRequest,
  NormalizedMarketCandle,
} from "../../contracts/candle-review-contracts";

const YAHOO_CHART_ORIGIN = "https://query1.finance.yahoo.com";
const MAX_ONE_MINUTE_RANGE_SECONDS = 7 * 24 * 60 * 60;
const MAX_DAILY_RANGE_SECONDS = 370 * 24 * 60 * 60;

type YahooChartResult = Readonly<{
  meta?: Readonly<{
    exchangeTimezoneName?: unknown;
    gmtoffset?: unknown;
  }>;
  timestamp?: unknown;
  indicators?: Readonly<{
    quote?: unknown;
  }>;
}>;

type YahooChartPayload = Readonly<{
  chart?: Readonly<{
    error?: unknown;
    result?: unknown;
  }>;
}>;

function canonicalDecimal(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  try {
    const normalized = new Decimal(value).isZero() ? "0" : new Decimal(value).toFixed();
    return /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/u.test(normalized)
      ? normalized
      : null;
  } catch {
    return null;
  }
}

function failure(
  code: "coverage_unavailable" | "invalid_payload" | "provider_unavailable",
  failureReasonCode: string,
  metadata: Readonly<{ exchangeTimezone: string | null; utcOffsetSeconds: number | null }> = {
    exchangeTimezone: null,
    utcOffsetSeconds: null,
  },
): MarketDataProviderResult {
  return Object.freeze({ ok: false, code, failureReasonCode, ...metadata });
}

function metadata(result: YahooChartResult): Readonly<{
  exchangeTimezone: string | null;
  utcOffsetSeconds: number | null;
}> {
  const timezone = result.meta?.exchangeTimezoneName;
  const offset = result.meta?.gmtoffset;
  return Object.freeze({
    exchangeTimezone:
      typeof timezone === "string" && timezone.trim() === timezone && timezone.length <= 64
        ? timezone
        : null,
    utcOffsetSeconds:
      Number.isInteger(offset) && Number(offset) >= -86400 && Number(offset) <= 86400
        ? Number(offset)
        : null,
  });
}

function normalizeResult(result: YahooChartResult): MarketDataProviderResult {
  const requestMetadata = metadata(result);
  const timestamps = result.timestamp;
  const quotes = result.indicators?.quote;
  if (!Array.isArray(timestamps) || !Array.isArray(quotes) || quotes.length !== 1) {
    return failure("invalid_payload", "provider_shape_invalid", requestMetadata);
  }
  const quote = quotes[0];
  if (!quote || typeof quote !== "object" || Array.isArray(quote)) {
    return failure("invalid_payload", "provider_quote_invalid", requestMetadata);
  }
  const values = quote as Record<string, unknown>;
  const open = values.open;
  const high = values.high;
  const low = values.low;
  const close = values.close;
  const volume = values.volume;
  if (![open, high, low, close, volume].every(Array.isArray)) {
    return failure("invalid_payload", "provider_series_invalid", requestMetadata);
  }

  const candles: NormalizedMarketCandle[] = [];
  let previousTime: number | null = null;
  for (let index = 0; index < timestamps.length; index += 1) {
    const time = timestamps[index];
    if (!Number.isSafeInteger(time) || Number(time) <= 0) {
      return failure("invalid_payload", "provider_timestamp_invalid", requestMetadata);
    }
    if (previousTime !== null && Number(time) <= previousTime) {
      return failure("invalid_payload", "provider_timestamps_not_strictly_increasing", requestMetadata);
    }
    previousTime = Number(time);

    const rawValues = [
      (open as unknown[])[index],
      (high as unknown[])[index],
      (low as unknown[])[index],
      (close as unknown[])[index],
      (volume as unknown[])[index],
    ];
    if (rawValues.some((value) => value === null || value === undefined)) {
      continue;
    }
    const [openDecimal, highDecimal, lowDecimal, closeDecimal, volumeDecimal] =
      rawValues.map((value) => canonicalDecimal(value as number));
    if (!openDecimal || !highDecimal || !lowDecimal || !closeDecimal || !volumeDecimal) {
      return failure("invalid_payload", "provider_candle_decimal_invalid", requestMetadata);
    }
    const highValue = new Decimal(highDecimal);
    const lowValue = new Decimal(lowDecimal);
    if (
      new Decimal(openDecimal).lte(0) || highValue.lte(0) || lowValue.lte(0) ||
      new Decimal(closeDecimal).lte(0) || new Decimal(volumeDecimal).lt(0) ||
      highValue.lt(lowValue) || highValue.lt(openDecimal) || highValue.lt(closeDecimal) ||
      lowValue.gt(openDecimal) || lowValue.gt(closeDecimal)
    ) {
      return failure("invalid_payload", "provider_candle_ohlcv_invalid", requestMetadata);
    }
    candles.push(Object.freeze({
      time: Number(time),
      openDecimal,
      highDecimal,
      lowDecimal,
      closeDecimal,
      volumeDecimal,
    }));
  }
  if (candles.length === 0) {
    return failure("coverage_unavailable", "provider_returned_no_candles", requestMetadata);
  }
  const frozenCandles = Object.freeze(candles);
  const canonical = `${JSON.stringify(frozenCandles)}\n`;
  return Object.freeze({
    ok: true,
    candles: frozenCandles,
    ...requestMetadata,
    normalizedCandleSha256: createHash("sha256").update(canonical, "utf8").digest("hex"),
  });
}

function validRequest(request: MarketDataRequest): boolean {
  const maxRange = request.interval === "1m"
    ? MAX_ONE_MINUTE_RANGE_SECONDS
    : MAX_DAILY_RANGE_SECONDS;
  return /^[A-Z][A-Z0-9.-]{0,15}$/u.test(request.symbol) &&
    Number.isSafeInteger(request.startTime) && Number.isSafeInteger(request.endTime) &&
    request.startTime > 0 && request.endTime > request.startTime &&
    request.endTime - request.startTime <= maxRange && request.includeExtendedHours === true;
}

export class YahooChartMarketDataProvider implements MarketDataProvider {
  constructor(private readonly request: typeof fetch = fetch) {}

  async fetch(input: MarketDataRequest): Promise<MarketDataProviderResult> {
    if (!validRequest(input)) {
      return failure("invalid_payload", "market_data_request_invalid");
    }
    const query = new URLSearchParams({
      includePrePost: "true",
      interval: input.interval,
      period1: String(input.startTime),
      period2: String(input.endTime),
    });
    let response: Response;
    try {
      response = await this.request(
        `${YAHOO_CHART_ORIGIN}/v8/finance/chart/${encodeURIComponent(input.symbol)}?${query}`,
        { cache: "no-store", headers: { Accept: "application/json" } },
      );
    } catch {
      return failure("provider_unavailable", "provider_request_failed");
    }
    let payload: YahooChartPayload;
    try {
      payload = await response.json() as YahooChartPayload;
    } catch {
      return failure("invalid_payload", "provider_json_invalid");
    }
    if (!response.ok) {
      return failure(
        response.status === 404 ? "coverage_unavailable" : "provider_unavailable",
        response.status === 404 ? "provider_symbol_or_range_unavailable" : "provider_http_unavailable",
      );
    }
    if (payload.chart?.error) {
      return failure("coverage_unavailable", "provider_reported_no_coverage");
    }
    const results = payload.chart?.result;
    if (!Array.isArray(results) || results.length !== 1 || !results[0] || typeof results[0] !== "object") {
      return failure("invalid_payload", "provider_result_invalid");
    }
    return normalizeResult(results[0] as YahooChartResult);
  }
}
