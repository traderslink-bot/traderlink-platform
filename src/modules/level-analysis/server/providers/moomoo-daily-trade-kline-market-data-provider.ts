import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  MarketDataProvider,
  MarketDataProviderResult,
  MarketDataRequest,
  NormalizedMarketCandle,
} from "../../contracts/candle-review-contracts";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const MAX_ONE_MINUTE_RANGE_SECONDS = 24 * 60 * 60;
const MAX_PAGES = 4;

type MoomooPayload = Readonly<{
  ret_code?: unknown;
  data?: Readonly<{ kline_list?: unknown; next_time?: unknown }>;
  pagination?: Readonly<{ has_more?: unknown }>;
}>;

function unavailable(
  code: "coverage_unavailable" | "invalid_payload" | "provider_unavailable",
  failureReasonCode: string,
): MarketDataProviderResult {
  return Object.freeze({
    ok: false,
    code,
    failureReasonCode,
    exchangeTimezone: "America/New_York",
    utcOffsetSeconds: null,
  });
}

function validRequest(input: MarketDataRequest): boolean {
  return input.interval === "1m" && input.includeExtendedHours === true &&
    /^[A-Z][A-Z0-9.-]{0,15}$/u.test(input.symbol) &&
    Number.isSafeInteger(input.startTime) && Number.isSafeInteger(input.endTime) &&
    input.startTime > 0 && input.endTime > input.startTime &&
    input.endTime - input.startTime <= MAX_ONE_MINUTE_RANGE_SECONDS;
}

function newYorkDate(seconds: number, offsetDays = 0): string | null {
  try {
    const date = new Date(seconds * 1000);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit", month: "2-digit", timeZone: "America/New_York", year: "numeric",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return values.year && values.month && values.day ? `${values.year}-${values.month}-${values.day}` : null;
  } catch {
    return null;
  }
}

function decimal(value: unknown): string | null {
  if ((typeof value !== "string" && typeof value !== "number") || value === "") return null;
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite()) return null;
    const normalized = parsed.isZero() ? "0" : parsed.toFixed();
    return /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/u.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function normalizeCandle(
  value: unknown,
  input: MarketDataRequest,
): NormalizedMarketCandle | null | "invalid" {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "invalid";
  const row = value as Record<string, unknown>;
  const milliseconds = Number(row.time_key);
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0 || milliseconds % 1000 !== 0) return "invalid";
  const time = milliseconds / 1000;
  if (time < input.startTime || time > input.endTime) return null;
  const values = [
    decimal(row.open ?? row.open_price),
    decimal(row.high ?? row.high_price),
    decimal(row.low ?? row.low_price),
    decimal(row.close ?? row.close_price),
    decimal(row.volume),
    decimal(row.turnover),
  ];
  if (values.every((item) => item === null)) return null;
  if (values.some((item) => item === null)) return "invalid";
  const [openDecimal, highDecimal, lowDecimal, closeDecimal, volumeDecimal, turnoverDecimal] = values as string[];
  const high = new Decimal(highDecimal);
  const low = new Decimal(lowDecimal);
  if (
    new Decimal(openDecimal).lte(0) || high.lte(0) || low.lte(0) || new Decimal(closeDecimal).lte(0) ||
    new Decimal(volumeDecimal).lt(0) || new Decimal(turnoverDecimal).lt(0) ||
    high.lt(low) || high.lt(openDecimal) || high.lt(closeDecimal) ||
    low.gt(openDecimal) || low.gt(closeDecimal)
  ) return "invalid";
  return Object.freeze({
    time,
    openDecimal,
    highDecimal,
    lowDecimal,
    closeDecimal,
    volumeDecimal,
    turnoverDecimal,
  });
}

function providerMetadata(items: readonly unknown[]): Readonly<{
  exchangeTimezone: string | null;
  utcOffsetSeconds: number | null;
}> {
  const first = items[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) {
    return Object.freeze({ exchangeTimezone: "America/New_York", utcOffsetSeconds: null });
  }
  const offsetHours = (first as Record<string, unknown>).time_zone;
  return Object.freeze({
    exchangeTimezone: "America/New_York",
    utcOffsetSeconds: Number.isInteger(offsetHours) && Number(offsetHours) >= -14 && Number(offsetHours) <= 14
      ? Number(offsetHours) * 60 * 60
      : null,
  });
}

/** Uses the proven same-day History K-Line request shape and never exposes a credential. */
export class MoomooDailyTradeKlineMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly accessToken: () => Promise<string>,
    private readonly request: typeof fetch = fetch,
    private readonly options: Readonly<{ strictOwnerSession?: boolean }> = {},
  ) {}

  async fetch(input: MarketDataRequest): Promise<MarketDataProviderResult & { partialCandles?: readonly NormalizedMarketCandle[]; partialSha256?: string }> {
    const candles = new Map<number, NormalizedMarketCandle>();
    const requestedUtc = (seconds: number): string | null => Number.isSafeInteger(seconds) && seconds > 0
      ? new Date(seconds * 1000).toISOString() : null;
    const failed = (code: "coverage_unavailable" | "invalid_payload" | "provider_unavailable",
      failureReasonCode: string, details: Readonly<Record<string, number | string | null>> = {}) => {
      console.error("Moomoo History K-Line request failed.", {
        failureReasonCode, requestedEndUtc: requestedUtc(input.endTime),
        requestedStartUtc: requestedUtc(input.startTime),
        symbol: input.symbol, ...details,
      });
      const partial = this.options.strictOwnerSession ? [...candles.values()].sort((a, b) => a.time - b.time) : [];
      return { ...unavailable(code, failureReasonCode), ...(partial.length ? {
        partialCandles: partial,
        partialSha256: createHash("sha256").update(`${JSON.stringify(partial)}\n`, "utf8").digest("hex"),
      } : {}) };
    };
    if (!validRequest(input)) return failed("invalid_payload", "market_data_request_invalid");
    const start = newYorkDate(input.startTime);
    const end = newYorkDate(input.startTime, 1);
    if (!start || !end) return failed("invalid_payload", "market_data_request_date_invalid");
    let token: string;
    try {
      token = await this.accessToken();
    } catch {
      return failed("provider_unavailable", "moomoo_connection_unavailable");
    }
    let cursor: string | null = null;
    let metadata: Readonly<{ exchangeTimezone: string | null; utcOffsetSeconds: number | null }> = Object.freeze({
      exchangeTimezone: "America/New_York",
      utcOffsetSeconds: null,
    });
    const seenCursors = new Set<string>();
    let exhausted = false;
    const pageLimit = this.options.strictOwnerSession ? 128 : MAX_PAGES;
    for (let page = 0; page < pageLimit; page += 1) {
      const query = new URLSearchParams({ start, end, ktype: "1", extended_time: "1", autype: "0", num: "370" });
      if (cursor) query.set("next_time", cursor);
      let response: Response;
      try {
        response = await this.request(
          `${MOOMOO_API_ORIGIN}/api/v1.0/quote/US.${encodeURIComponent(input.symbol)}/history-kline?${query}`,
          { cache: "no-store", ...(this.options.strictOwnerSession ? { signal: AbortSignal.timeout(30_000) } : {}), headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
        );
      } catch {
        return failed("provider_unavailable", "moomoo_request_failed", { page: page + 1 });
      }
      if (this.options.strictOwnerSession && !response.ok) {
        return failed("provider_unavailable", "moomoo_http_unavailable", { httpStatus: response.status, page: page + 1 });
      }
      let payload: MoomooPayload;
      try {
        payload = await response.json() as MoomooPayload;
      } catch {
        return failed("invalid_payload", "moomoo_json_invalid", { httpStatus: response.status, page: page + 1 });
      }
      if (!response.ok) return failed("provider_unavailable", "moomoo_http_unavailable",
        { httpStatus: response.status, page: page + 1 });
      if (this.options.strictOwnerSession) {
        if (!payload || typeof payload !== "object" || typeof payload.ret_code !== "number") return failed("invalid_payload", "moomoo_payload_invalid");
        if (payload.ret_code !== 0) return failed("provider_unavailable", "moomoo_provider_rejected");
        if (!Array.isArray(payload.data?.kline_list)) return failed("invalid_payload", "moomoo_payload_invalid");
      }
      if (payload.ret_code !== 0 || !Array.isArray(payload.data?.kline_list)) {
        return failed("coverage_unavailable", "moomoo_reported_no_coverage", {
          httpStatus: response.status, page: page + 1,
          providerRetCode: typeof payload.ret_code === "number" || typeof payload.ret_code === "string"
            ? String(payload.ret_code).slice(0, 32) : null,
        });
      }
      metadata = providerMetadata(payload.data.kline_list);
      for (const value of payload.data.kline_list) {
        if (this.options.strictOwnerSession && value && typeof value === "object") {
          const row = value as Record<string, unknown>;
          const time = Number(row.time_key) / 1000;
          if (time >= input.startTime && time <= input.endTime &&
            [row.open ?? row.open_price, row.high ?? row.high_price, row.low ?? row.low_price, row.close ?? row.close_price, row.volume, row.turnover].every((item) => decimal(item) === null)) return failed("invalid_payload", "moomoo_candle_invalid");
        }
        const candle = normalizeCandle(value, input);
        if (candle === "invalid") return failed("invalid_payload", "moomoo_candle_invalid", { page: page + 1 });
        if (!candle) continue;
        const prior = candles.get(candle.time);
        if (prior && JSON.stringify(prior) !== JSON.stringify(candle)) {
          if (this.options.strictOwnerSession) candles.delete(candle.time);
          return failed("invalid_payload", "moomoo_duplicate_candle_conflict", { page: page + 1 });
        }
        candles.set(candle.time, candle);
      }
      const next = payload.data.next_time;
      if (this.options.strictOwnerSession) {
        if (payload.pagination?.has_more === false) { exhausted = true; break; }
        if (payload.pagination?.has_more !== true || (typeof next !== "number" && typeof next !== "string") || String(next).trim() === "" || seenCursors.has(String(next))) return failed("invalid_payload", "moomoo_pagination_invalid");
        cursor = String(next);
        seenCursors.add(cursor);
        continue;
      }
      if (payload.pagination?.has_more !== true || (typeof next !== "number" && typeof next !== "string") || String(next).length === 0) break;
      cursor = String(next);
      const earliest = Math.min(...candles.keys());
      if (Number.isFinite(earliest) && earliest <= input.startTime) break;
    }
    if (this.options.strictOwnerSession && !exhausted) return failed("provider_unavailable", "moomoo_pagination_incomplete");
    const normalized = Object.freeze([...candles.values()].sort((left, right) => left.time - right.time));
    if (normalized.length === 0) return failed("coverage_unavailable", "moomoo_returned_no_candles");
    return Object.freeze({
      ok: true,
      candles: normalized,
      ...metadata,
      normalizedCandleSha256: createHash("sha256").update(`${JSON.stringify(normalized)}\n`, "utf8").digest("hex"),
    });
  }
}
