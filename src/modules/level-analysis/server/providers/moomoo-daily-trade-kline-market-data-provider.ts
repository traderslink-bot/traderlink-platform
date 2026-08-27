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
  const offsetMinutes = (first as Record<string, unknown>).time_zone;
  const numericOffsetMinutes = typeof offsetMinutes === "number"
    ? offsetMinutes
    : typeof offsetMinutes === "string" && offsetMinutes.trim() !== ""
      ? Number(offsetMinutes)
      : Number.NaN;
  return Object.freeze({
    exchangeTimezone: "America/New_York",
    utcOffsetSeconds: Number.isInteger(numericOffsetMinutes) && numericOffsetMinutes >= -840 && numericOffsetMinutes <= 840
      ? numericOffsetMinutes * 60
      : null,
  });
}

/** Uses the proven same-day History K-Line request shape and never exposes a credential. */
export class MoomooDailyTradeKlineMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly accessToken: () => Promise<string>,
    private readonly request: typeof fetch = fetch,
  ) {}

  async fetch(input: MarketDataRequest): Promise<MarketDataProviderResult> {
    if (!validRequest(input)) return unavailable("invalid_payload", "market_data_request_invalid");
    const start = newYorkDate(input.startTime);
    const end = newYorkDate(input.startTime, 1);
    if (!start || !end) return unavailable("invalid_payload", "market_data_request_date_invalid");
    let token: string;
    try {
      token = await this.accessToken();
    } catch {
      return unavailable("provider_unavailable", "moomoo_connection_unavailable");
    }
    const candles = new Map<number, NormalizedMarketCandle>();
    let cursor: string | null = null;
    let metadata: Readonly<{ exchangeTimezone: string | null; utcOffsetSeconds: number | null }> = Object.freeze({
      exchangeTimezone: "America/New_York",
      utcOffsetSeconds: null,
    });
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const query = new URLSearchParams({ start, end, ktype: "1", extended_time: "1", autype: "0", num: "370" });
      if (cursor) query.set("next_time", cursor);
      let response: Response;
      try {
        response = await this.request(
          `${MOOMOO_API_ORIGIN}/api/v1.0/quote/US.${encodeURIComponent(input.symbol)}/history-kline?${query}`,
          { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
        );
      } catch {
        return unavailable("provider_unavailable", "moomoo_request_failed");
      }
      let payload: MoomooPayload;
      try {
        payload = await response.json() as MoomooPayload;
      } catch {
        return unavailable("invalid_payload", "moomoo_json_invalid");
      }
      if (!response.ok) return unavailable("provider_unavailable", "moomoo_http_unavailable");
      if (payload.ret_code !== 0 || !Array.isArray(payload.data?.kline_list)) {
        return unavailable("coverage_unavailable", "moomoo_reported_no_coverage");
      }
      metadata = providerMetadata(payload.data.kline_list);
      for (const value of payload.data.kline_list) {
        const candle = normalizeCandle(value, input);
        if (candle === "invalid") return unavailable("invalid_payload", "moomoo_candle_invalid");
        if (!candle) continue;
        const prior = candles.get(candle.time);
        if (prior && JSON.stringify(prior) !== JSON.stringify(candle)) {
          return unavailable("invalid_payload", "moomoo_duplicate_candle_conflict");
        }
        candles.set(candle.time, candle);
      }
      const next = payload.data.next_time;
      if (payload.pagination?.has_more !== true || (typeof next !== "number" && typeof next !== "string") || String(next).length === 0) break;
      cursor = String(next);
      const earliest = Math.min(...candles.keys());
      if (Number.isFinite(earliest) && earliest <= input.startTime) break;
    }
    const normalized = Object.freeze([...candles.values()].sort((left, right) => left.time - right.time));
    if (normalized.length === 0) return unavailable("coverage_unavailable", "moomoo_returned_no_candles");
    return Object.freeze({
      ok: true,
      candles: normalized,
      ...metadata,
      normalizedCandleSha256: createHash("sha256").update(`${JSON.stringify(normalized)}\n`, "utf8").digest("hex"),
    });
  }
}
