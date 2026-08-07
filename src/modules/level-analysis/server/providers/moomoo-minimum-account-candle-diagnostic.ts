import Decimal from "decimal.js";

import { newYorkExtendedSession } from "../daily-trade-analyzer-session";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const MAX_SYMBOLS_PER_RUN = 20;
const MAX_PAGES_PER_SYMBOL = 8;

type MoomooKlinePayload = Readonly<{
  ret_code?: unknown;
  ret_msg?: unknown;
  error?: Readonly<{ code?: unknown; message?: unknown }>;
  data?: Readonly<{ kline_list?: unknown; next_time?: unknown }>;
  pagination?: Readonly<{ has_more?: unknown }>;
}>;

export type MoomooMinimumAccountCandleDiagnosticInput = Readonly<{
  accessToken: string;
  date: string;
  symbols: readonly string[];
  maxPages?: number;
  delayMilliseconds?: number;
  request?: typeof fetch;
}>;

type SessionCounts = Readonly<{
  premarket: number;
  regular: number;
  afterHours: number;
  outsideRequestedSession: number;
}>;

export type MoomooMinimumAccountSymbolResult = Readonly<{
  symbol: string;
  status: "confirmed_working" | "confirmed_unavailable" | "unresolved";
  reason: string;
  pagesRequested: number;
  recordsReturned: number;
  validUniqueCandles: number;
  duplicateCandles: number;
  conflictingDuplicateCandles: number;
  firstCandleUtc: string | null;
  lastCandleUtc: string | null;
  sessionCounts: SessionCounts;
  premarketObserved: boolean;
  regularSessionObserved: boolean;
  afterHoursObserved: boolean;
  paginationObserved: boolean;
  paginationCompletedForRequestedSession: boolean;
  responseEvidence: readonly Readonly<{
    page: number;
    httpStatus: number | null;
    providerCode: number | string | null;
    providerMessage: string | null;
    recordsReturned: number;
    hasMore: boolean | null;
    nextTimePresent: boolean;
    quotaMetadata: Readonly<Record<string, string>>;
  }>[];
}>;

export type MoomooMinimumAccountCandleDiagnosticResult = Readonly<{
  contract: "moomoo_minimum_account_daily_trade_tracker_candles_v1";
  accountClassification: "owner_confirmed_unfunded_no_brokerage";
  requestedDate: string;
  requestedKtype: 1;
  requestedExtendedTime: 1;
  requestedMaximumPageSize: 370;
  overnightRequested: false;
  results: readonly MoomooMinimumAccountSymbolResult[];
}>;

function cleanProviderMessage(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/giu, "Bearer [redacted]")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "[redacted-id]")
    .replace(/\b\d{12,}\b/gu, "[redacted-id]")
    .slice(0, 240);
}

function quotaMetadata(headers: Headers): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [name, value] of headers.entries()) {
    if (/^(?:retry-after|x-.*(?:quota|rate|limit|remaining|reset).*)$/iu.test(name)) {
      result[name.toLowerCase()] = value.slice(0, 120);
    }
  }
  return Object.freeze(result);
}

function canonicalSymbols(symbols: readonly string[]): readonly string[] {
  const result = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))];
  if (
    result.length === 0 || result.length > MAX_SYMBOLS_PER_RUN ||
    result.some((symbol) => !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol))
  ) throw new Error("moomoo_diagnostic_symbols_invalid");
  return Object.freeze(result);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function decimal(value: unknown): Decimal | null {
  if ((typeof value !== "number" && typeof value !== "string") || value === "") return null;
  try {
    const result = new Decimal(value);
    return result.isFinite() ? result : null;
  } catch {
    return null;
  }
}

type ValidCandle = Readonly<{
  timeMilliseconds: number;
  signature: string;
}>;

function validCandle(value: unknown): ValidCandle | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const timeMilliseconds = Number(row.time_key);
  const open = decimal(row.open);
  const high = decimal(row.high);
  const low = decimal(row.low);
  const close = decimal(row.close);
  const volume = decimal(row.volume);
  if (
    !Number.isSafeInteger(timeMilliseconds) || timeMilliseconds <= 0 ||
    !open || !high || !low || !close || !volume ||
    open.lte(0) || high.lte(0) || low.lte(0) || close.lte(0) || volume.lt(0) ||
    high.lt(low) || high.lt(open) || high.lt(close) || low.gt(open) || low.gt(close)
  ) return null;
  return Object.freeze({
    timeMilliseconds,
    signature: [open, high, low, close, volume].map((item) => item.toFixed()).join("|"),
  });
}

function newYorkMinute(milliseconds: number): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).formatToParts(new Date(milliseconds));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    return Number.isInteger(hour) && Number.isInteger(minute) ? hour * 60 + minute : null;
  } catch {
    return null;
  }
}

function sessionCounts(candles: readonly ValidCandle[]): SessionCounts {
  let premarket = 0;
  let regular = 0;
  let afterHours = 0;
  let outsideRequestedSession = 0;
  for (const candle of candles) {
    const minute = newYorkMinute(candle.timeMilliseconds);
    if (minute !== null && minute >= 240 && minute < 570) premarket += 1;
    else if (minute !== null && minute >= 570 && minute < 960) regular += 1;
    else if (minute !== null && minute >= 960 && minute < 1200) afterHours += 1;
    else outsideRequestedSession += 1;
  }
  return Object.freeze({ premarket, regular, afterHours, outsideRequestedSession });
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function diagnoseSymbol(input: Readonly<{
  accessToken: string;
  date: string;
  symbol: string;
  maxPages: number;
  request: typeof fetch;
}>): Promise<MoomooMinimumAccountSymbolResult> {
  const session = newYorkExtendedSession(input.date);
  if (!session) throw new Error("moomoo_diagnostic_date_invalid");
  const candles = new Map<number, ValidCandle>();
  const responseEvidence: Array<MoomooMinimumAccountSymbolResult["responseEvidence"][number]> = [];
  let duplicateCandles = 0;
  let conflictingDuplicateCandles = 0;
  let recordsReturned = 0;
  let pageCursor: string | null = null;
  let paginationObserved = false;
  let paginationCompletedForRequestedSession = false;
  let terminalStatus: MoomooMinimumAccountSymbolResult["status"] = "unresolved";
  let terminalReason = "pagination_limit_reached";

  for (let page = 1; page <= input.maxPages; page += 1) {
    const query = new URLSearchParams({
      autype: "0",
      end: input.date,
      extended_time: "1",
      ktype: "1",
      num: "370",
    });
    if (pageCursor) query.set("next_time", pageCursor);
    let response: Response;
    try {
      response = await input.request(
        `${MOOMOO_API_ORIGIN}/api/v1.0/quote/US.${encodeURIComponent(input.symbol)}/history-kline?${query}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json", Authorization: `Bearer ${input.accessToken}` },
        },
      );
    } catch {
      responseEvidence.push(Object.freeze({
        page,
        httpStatus: null,
        providerCode: null,
        providerMessage: "network_request_failed",
        recordsReturned: 0,
        hasMore: null,
        nextTimePresent: false,
        quotaMetadata: Object.freeze({}),
      }));
      terminalReason = "network_request_failed";
      break;
    }

    let payload: MoomooKlinePayload;
    try {
      payload = await response.json() as MoomooKlinePayload;
    } catch {
      responseEvidence.push(Object.freeze({
        page,
        httpStatus: response.status,
        providerCode: null,
        providerMessage: "invalid_json_response",
        recordsReturned: 0,
        hasMore: null,
        nextTimePresent: false,
        quotaMetadata: quotaMetadata(response.headers),
      }));
      terminalReason = "invalid_json_response";
      break;
    }

    const items = Array.isArray(payload.data?.kline_list) ? payload.data.kline_list : [];
    const hasMore = payload.pagination?.has_more === true;
    const nextTime = payload.data?.next_time;
    const nextTimePresent = (typeof nextTime === "number" || typeof nextTime === "string") && String(nextTime).length > 0;
    const providerCode = typeof payload.ret_code === "number" || typeof payload.ret_code === "string"
      ? payload.ret_code
      : typeof payload.error?.code === "number" || typeof payload.error?.code === "string"
        ? payload.error.code
        : null;
    const providerMessage = cleanProviderMessage(payload.ret_msg ?? payload.error?.message);
    responseEvidence.push(Object.freeze({
      page,
      httpStatus: response.status,
      providerCode,
      providerMessage,
      recordsReturned: items.length,
      hasMore,
      nextTimePresent,
      quotaMetadata: quotaMetadata(response.headers),
    }));

    if (!response.ok || payload.ret_code !== 0 || !Array.isArray(payload.data?.kline_list)) {
      terminalStatus = response.status === 401 || response.status === 403 || payload.ret_code !== 0
        ? "confirmed_unavailable"
        : "unresolved";
      terminalReason = response.ok ? "provider_rejected_request" : "http_request_rejected";
      break;
    }

    recordsReturned += items.length;
    let invalidRows = 0;
    for (const item of items) {
      const candle = validCandle(item);
      if (!candle) {
        invalidRows += 1;
        continue;
      }
      if (candle.timeMilliseconds < session.startTime * 1000 || candle.timeMilliseconds > session.endTime * 1000) {
        continue;
      }
      const prior = candles.get(candle.timeMilliseconds);
      if (prior) {
        duplicateCandles += 1;
        if (prior.signature !== candle.signature) conflictingDuplicateCandles += 1;
      } else {
        candles.set(candle.timeMilliseconds, candle);
      }
    }
    if (invalidRows > 0 || conflictingDuplicateCandles > 0) {
      terminalReason = invalidRows > 0 ? "invalid_candle_rows" : "conflicting_duplicate_candles";
      break;
    }

    if (page > 1) paginationObserved = true;
    const earliest = candles.size > 0 ? Math.min(...candles.keys()) : Number.POSITIVE_INFINITY;
    if (earliest <= session.startTime * 1000 || !hasMore || !nextTimePresent) {
      paginationCompletedForRequestedSession = earliest <= session.startTime * 1000 || !hasMore;
      terminalStatus = candles.size > 0 ? "confirmed_working" : "confirmed_unavailable";
      terminalReason = candles.size > 0 ? "valid_one_minute_candles_returned" : "no_candles_returned";
      break;
    }
    pageCursor = String(nextTime);
  }

  const ordered = [...candles.values()].sort((left, right) => left.timeMilliseconds - right.timeMilliseconds);
  const counts = sessionCounts(ordered);
  return Object.freeze({
    symbol: input.symbol,
    status: terminalStatus,
    reason: terminalReason,
    pagesRequested: responseEvidence.length,
    recordsReturned,
    validUniqueCandles: ordered.length,
    duplicateCandles,
    conflictingDuplicateCandles,
    firstCandleUtc: ordered[0] ? new Date(ordered[0].timeMilliseconds).toISOString() : null,
    lastCandleUtc: ordered.at(-1) ? new Date(ordered.at(-1)!.timeMilliseconds).toISOString() : null,
    sessionCounts: counts,
    premarketObserved: counts.premarket > 0,
    regularSessionObserved: counts.regular > 0,
    afterHoursObserved: counts.afterHours > 0,
    paginationObserved,
    paginationCompletedForRequestedSession,
    responseEvidence: Object.freeze(responseEvidence),
  });
}

export async function runMoomooMinimumAccountCandleDiagnostic(
  input: MoomooMinimumAccountCandleDiagnosticInput,
): Promise<MoomooMinimumAccountCandleDiagnosticResult> {
  if (!validDate(input.date) || !input.accessToken) throw new Error("moomoo_diagnostic_input_invalid");
  const symbols = canonicalSymbols(input.symbols);
  const maxPages = input.maxPages ?? 4;
  const delayMilliseconds = input.delayMilliseconds ?? 500;
  if (
    !Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > MAX_PAGES_PER_SYMBOL ||
    !Number.isSafeInteger(delayMilliseconds) || delayMilliseconds < 250 || delayMilliseconds > 5_000
  ) throw new Error("moomoo_diagnostic_input_invalid");
  const request = input.request ?? fetch;
  const results: MoomooMinimumAccountSymbolResult[] = [];
  for (const [index, symbol] of symbols.entries()) {
    if (index > 0) await pause(delayMilliseconds);
    results.push(await diagnoseSymbol({ accessToken: input.accessToken, date: input.date, symbol, maxPages, request }));
  }
  return Object.freeze({
    contract: "moomoo_minimum_account_daily_trade_tracker_candles_v1",
    accountClassification: "owner_confirmed_unfunded_no_brokerage",
    requestedDate: input.date,
    requestedKtype: 1,
    requestedExtendedTime: 1,
    requestedMaximumPageSize: 370,
    overnightRequested: false,
    results: Object.freeze(results),
  });
}
