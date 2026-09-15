import type { IndicatorTimeframe } from "./indicator-engine";
import type { IndicatorRequestCoordinator, IndicatorProvider, IndicatorRequestFailure,
  IndicatorTransportResult } from "./indicator-request-coordinator";

/** Provider timestamps are milliseconds; exchange-session completion is applied downstream. */
export type IndicatorHistoryBar = Readonly<{
  start: number; open: number; high: number; low: number; close: number; volume: number | null;
}>;
export type IndicatorHistoryRequest = Readonly<{
  symbol: string; timeframe: IndicatorTimeframe; start: number; end: number;
}>;
export type IndicatorHistoryPage = Readonly<{
  bars: readonly IndicatorHistoryBar[];
  excludedPoints?: number;
  /** null means the provider did not establish pagination completion. */
  hasMore: boolean | null;
  nextEnd: number | null;
}>;
export type IndicatorHistoryOutcome = Readonly<{
  provider: IndicatorProvider;
  adjustment: "moomoo-forward" | "yahoo-chart-native";
  bars: readonly IndicatorHistoryBar[];
  transportIds: readonly string[];
  pages: number;
  outcome: "complete" | "sufficient_history" | "pagination_unconfirmed" | "budget_exhausted" | "deferred" | IndicatorRequestFailure;
  nextEnd: number | null;
  retryAt?: number;
  excludedPoints?: number;
}>;
/** Shared by all timeframe calls belonging to ONE provider's logical ticker refresh. */
export type IndicatorHistoryBudget = { attemptsRemaining: number; retriesRemaining: number };
export function createIndicatorHistoryBudget(): IndicatorHistoryBudget {
  return { attemptsRemaining: 10, retriesRemaining: 1 };
}

const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
function numeric(value: unknown): number | null {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function bar(start: unknown, values: readonly unknown[], volumePrecision = 0): IndicatorHistoryBar | null {
  const timestamp = numeric(start), fields = values.map(numeric);
  if (timestamp === null || !Number.isSafeInteger(timestamp) || timestamp <= 0 || timestamp % 60_000 !== 0 || fields.slice(0, 4).some(n => n === null)) return null;
  const [open, high, low, close] = fields as number[];
  if (values[4] != null && fields[4] === null) return null;
  const volume = fields[4] === null ? null : fields[4] / 10 ** volumePrecision;
  if (Math.min(open, high, low, close) <= 0 || (volume !== null && (volume < 0 || !Number.isFinite(volume)))
    || high < Math.max(open, close, low) || low > Math.min(open, close)) return null;
  return { start: timestamp, open, high, low, close, volume };
}
function invalid(): IndicatorTransportResult<IndicatorHistoryPage> {
  return { ok: false, reason: "invalid_data", requestAccepted: true };
}
function sortedUnique(bars: readonly IndicatorHistoryBar[]): readonly IndicatorHistoryBar[] | null {
  const result = new Map<number, IndicatorHistoryBar>();
  for (const item of bars) {
    const prior = result.get(item.start);
    if (prior && JSON.stringify(prior) !== JSON.stringify(item)) return null;
    result.set(item.start, item);
  }
  return [...result.values()].sort((a, b) => a.start - b.start);
}

/** No raw vendor errors, symbols from payloads, account IDs or credentials enter results. */
export function parseMoomooIndicatorPage(payload: unknown, timeframe?: IndicatorTimeframe, observedAt = Date.now()): IndicatorTransportResult<IndicatorHistoryPage> {
  const root = object(payload), data = object(root?.data);
  if (!root || typeof root.ret_code !== "number" || !Number.isInteger(root.ret_code)) return invalid();
  if (root?.ret_code !== 0) {
    const reason: IndicatorRequestFailure = root?.ret_code === -3 ? "invalid_request"
      : root?.ret_code === -7 || root?.ret_code === -8 ? "no_data" : "provider_error";
    return { ok: false, reason, requestAccepted: [-3, -7, -8].includes(Number(root?.ret_code)) };
  }
  // Hosted Web API can return a complete intraday date range despite num=370.
  // Retain the decoded-byte cap and a bounded row cap instead of rejecting valid sessions.
  if (!Array.isArray(data?.kline_list) || data.kline_list.length > (timeframe && timeframe !== "1d" ? 12_000 : 370)) return invalid();
  const precision = data.volume_precision ?? 0;
  if (!Number.isInteger(precision) || Number(precision) < 0 || Number(precision) > 8) return invalid();
  const bars: IndicatorHistoryBar[] = [];
  let excludedPoints = 0;
  for (const value of data.kline_list) {
    const row = object(value);
    if (!row) return invalid();
    // Hosted native 1m/5m/15m cover 04:00–20:00 with the interval END label.
    // Internally bars use START. Daily trading-date labels are not shifted.
    const timestamp = numeric(row.time_key);
    // The live endpoint pads the rest of today's session with timestamp-only
    // slots. These are not candles or evidence of zero trading volume.
    if (timeframe && timeframe !== "1d" && timestamp !== null && Number.isSafeInteger(timestamp)
      && timestamp % 60_000 === 0 && timestamp > observedAt
      && [row.open, row.high, row.low, row.close, row.volume].every(value => value == null)) {
      excludedPoints++;
      continue;
    }
    const duration = timeframe ? { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1d": 0 }[timeframe] : 0;
    const normalized = bar(timestamp === null ? null : timestamp - duration,
      [row.open, row.high, row.low, row.close, row.volume], Number(precision));
    if (!normalized) return invalid();
    bars.push(normalized);
  }
  const unique = sortedUnique(bars);
  if (!unique) return invalid();
  const pagination = object(root.pagination);
  // Endpoint docs specify data.next_time; general pagination docs also describe extra.next_time.
  const rawNext = data.next_time ?? object(root.extra)?.next_time;
  const next = numeric(rawNext);
  if (rawNext != null && (next === null || !Number.isSafeInteger(next) || next < 0)) return invalid();
  const nextEnd = next !== null && Number.isSafeInteger(next) && next > 0 ? next : null;
  // A documented continuation cursor establishes another page even without the
  // generic pagination envelope. Missing both remains unknown, never complete.
  const hasMore = typeof pagination?.has_more === "boolean" ? pagination.has_more : nextEnd !== null ? true : next === 0 ? false : null;
  if (hasMore === false && nextEnd !== null) return invalid();
  if (hasMore === true && (nextEnd === null || unique.length === 0)) return invalid();
  return { ok: true, usable: unique.length > 0, requestAccepted: true, data: { bars: unique, hasMore, nextEnd, excludedPoints } };
}

export function parseYahooIndicatorPage(payload: unknown): IndicatorTransportResult<IndicatorHistoryPage> {
  const chart = object(object(payload)?.chart);
  if (chart?.error) return { ok: false, reason: "no_data", requestAccepted: true };
  if (!Array.isArray(chart?.result) || chart.result.length !== 1) return invalid();
  const result = object(chart.result[0]), meta = object(result?.meta);
  if (meta?.exchangeTimezoneName !== "America/New_York") return invalid();
  if (!Array.isArray(result?.timestamp)) return invalid();
  const timestamps = result.timestamp;
  if (timestamps.length > 12_000) return invalid();
  const quotes = object(result.indicators)?.quote;
  if (!Array.isArray(quotes) || quotes.length !== 1) return invalid();
  const quote = object(quotes[0]);
  const fields = [quote?.open, quote?.high, quote?.low, quote?.close, quote?.volume];
  if (!fields.every(field => Array.isArray(field) && field.length === timestamps.length)) return invalid();
  const bars: IndicatorHistoryBar[] = [];
  // Null/missing bars are withheld, never treated as zero-volume or manufactured OHLC.
  let missing = false, excludedPoints = 0;
  for (let i = 0; i < result.timestamp.length; i++) {
    const values = (fields as unknown[][]).map(field => field[i]);
    if (values.every(value => value === null)) { missing = true; continue; }
    const timestamp = numeric(result.timestamp[i]);
    // Yahoo appends a last-trade quote after the candle array. A seconds-level,
    // flat, zero-volume terminal quote is not a candle: retain the actual history
    // without rounding that quote into a fabricated bar. Any other bad row fails.
    const price = numeric(values[0]), priorTimestamp = i > 0 ? numeric(result.timestamp[i - 1]) : null;
    if (i === result.timestamp.length - 1 && bars.length > 0 && timestamp !== null
      && Number.isSafeInteger(timestamp) && timestamp % 60 !== 0 && priorTimestamp !== null && timestamp > priorTimestamp
      && price !== null && price > 0 && values.slice(0, 4).every(value => numeric(value) === price) && numeric(values[4]) === 0) {
      excludedPoints++; continue;
    }
    const normalized = bar(timestamp === null ? null : timestamp * 1000, values);
    if (!normalized) return invalid();
    // Yahoo can publish changing extended-hours OHLC with zero volume. Its
    // zero does not distinguish no trades from unavailable volume; keep prices
    // but withhold volume-dependent calculations. Moomoo zeros are unchanged.
    bars.push(normalized.volume === 0 ? { ...normalized, volume: null } : normalized);
  }
  const unique = sortedUnique(bars);
  if (!unique) return invalid();
  return { ok: true, usable: unique.length > 0, requestAccepted: true,
    data: { bars: unique, hasMore: missing ? null : false, nextEnd: null, excludedPoints } };
}

function newYorkDate(milliseconds: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(milliseconds);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function followingDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
export function indicatorHistoryUrl(provider: IndicatorProvider, input: IndicatorHistoryRequest, nextEnd: number | null = null): string {
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(input.symbol) || !["1m", "5m", "15m", "1d"].includes(input.timeframe)
    || !Number.isSafeInteger(input.start) || !Number.isSafeInteger(input.end) || input.start <= 0 || input.end <= input.start
    || input.end - input.start > (input.timeframe === "1d" ? 370 : input.timeframe === "1m" ? 7 : 31) * 86_400_000
    || (nextEnd !== null && (!Number.isSafeInteger(nextEnd) || nextEnd <= input.start || nextEnd > input.end))) throw new Error("indicator_history_request_invalid");
  if (provider === "moomoo") {
    // These are Web API enum values, NOT OpenD SDK enum values.
    const ktype = { "1m": "1", "5m": "6", "15m": "7", "1d": "2" }[input.timeframe];
    // Native intraday date end is exclusive: same-date start/end returns no bars.
    // Request through the following NY date, then retain only the exact time window.
    const endDate = newYorkDate(input.end - 1);
    const query = new URLSearchParams({ start: newYorkDate(input.start), end: nextEnd === null ? (input.timeframe === "1d" ? endDate : followingDate(endDate)) : String(nextEnd),
      ktype, autype: "1", extended_time: input.timeframe === "1d" ? "0" : "1", num: "370" });
    return `https://webapi.moomoo.com/api/v1.0/quote/US.${encodeURIComponent(input.symbol)}/history-kline?${query}`;
  }
  const query = new URLSearchParams({ interval: input.timeframe, period1: String(Math.floor(input.start / 1000)),
    period2: String(Math.ceil(input.end / 1000)), includePrePost: "true", events: "splits", includeAdjustedClose: "false" });
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(input.symbol)}?${query}`;
}

function retryAfter(value: string | null, now: number): number | undefined {
  if (value === null) return undefined;
  const seconds = /^\d+(?:\.\d+)?$/u.test(value.trim()) ? Number(value) : null;
  const wait = seconds === null ? Date.parse(value) - now : seconds * 1000;
  return Number.isFinite(wait) && wait >= 0 ? wait : undefined;
}
export async function requestIndicatorHistoryPage(input: Readonly<{
  provider: IndicatorProvider; url: string; signal: AbortSignal; accessToken?: string;
  fetcher?: typeof fetch; now?: () => number;
}>): Promise<IndicatorTransportResult<IndicatorHistoryPage>> {
  const url = new URL(input.url);
  if (url.origin !== (input.provider === "moomoo" ? "https://webapi.moomoo.com" : "https://query1.finance.yahoo.com")) {
    return { ok: false, reason: "invalid_request", requestAccepted: false };
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (input.provider === "moomoo") {
    if (!input.accessToken) return { ok: false, reason: "authentication", requestAccepted: false };
    headers.Authorization = `Bearer ${input.accessToken}`;
  }
  const response = await (input.fetcher ?? fetch)(input.url, { headers, cache: "no-store", redirect: "error", signal: input.signal });
  if (!response.ok) {
    const reason: IndicatorRequestFailure = response.status === 429 ? "rate_limited" : response.status === 401 ? "authentication"
      : response.status === 403 ? "permission" : response.status >= 500 ? "provider_error" : "invalid_request";
    return { ok: false, reason, requestAccepted: false, httpStatus: response.status,
      retryAfterMs: response.status === 429 ? retryAfter(response.headers.get("retry-after"), (input.now ?? Date.now)()) : undefined };
  }
  // Cap decoded payload bytes; provider error bodies are neither retained nor logged.
  const reader = response.body?.getReader();
  if (!reader) return invalid();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 4_000_000) { await reader.cancel(); return invalid(); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let payload: unknown;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return invalid(); }
  const timeframe = ({ "1": "1m", "6": "5m", "7": "15m", "2": "1d" } as const)[url.searchParams.get("ktype") as "1" | "6" | "7" | "2"];
  return input.provider === "moomoo" ? parseMoomooIndicatorPage(payload, timeframe, (input.now ?? Date.now)()) : parseYahooIndicatorPage(payload);
}

type HistoryFetchInput = Readonly<{
  provider: IndicatorProvider; request: IndicatorHistoryRequest; coordinator: IndicatorRequestCoordinator;
  scope: string; consumer: string; budget: IndicatorHistoryBudget; accessToken?: string; fetcher?: typeof fetch;
  nextEnd?: number | null;
  /** Stop older paging once warm-up and the requested session start are both covered. */
  sufficientHistory?: Readonly<{ minimumBars: number; coverFrom: number }>;
}>;

function newYorkDayStart(time: number): number {
  const date = newYorkDate(time), noon = Date.parse(`${date}T12:00:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(noon).find(part => part.type === "timeZoneName")?.value;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/u.exec(offset ?? "");
  if (!match) throw Error("indicator_history_timezone_unavailable");
  const minutes = (Number(match[2]) * 60 + Number(match[3] ?? 0)) * (match[1] === "+" ? 1 : -1);
  return Date.parse(`${date}T00:00:00Z`) - minutes * 60_000;
}

/** Moomoo may truncate multi-day 1m to the oldest 1,000 rows with has_more=false.
 * Read bounded single dates newest-first so current-session VWAP is never starved. */
export async function fetchIndicatorHistory(input: HistoryFetchInput): Promise<IndicatorHistoryOutcome> {
  if (input.provider !== "moomoo" || input.request.timeframe !== "1m" || input.nextEnd != null
    || newYorkDate(input.request.start) === newYorkDate(input.request.end - 1)) return fetchIndicatorHistoryRange(input);
  indicatorHistoryUrl(input.provider, input.request); // Validate the original overall bound first.
  let end = input.request.end, pages = 0;
  const bars: IndicatorHistoryBar[] = [], transportIds: string[] = [];
  const finish = (outcome: IndicatorHistoryOutcome["outcome"], retryAt?: number): IndicatorHistoryOutcome => ({
    provider: "moomoo", adjustment: "moomoo-forward", bars: sortedUnique(bars) ?? [], transportIds, pages,
    outcome, nextEnd: end > input.request.start ? end : null, ...(retryAt === undefined ? {} : { retryAt }),
  });
  while (end > input.request.start && input.budget.attemptsRemaining > 0) {
    const start = Math.max(input.request.start, newYorkDayStart(end - 1));
    const result = await fetchIndicatorHistoryRange({ ...input, request: { ...input.request, start, end }, sufficientHistory: undefined });
    bars.push(...result.bars); pages += result.pages; transportIds.push(...result.transportIds);
    if (!["complete", "no_data"].includes(result.outcome)) return finish(result.outcome, result.retryAt);
    end = start;
    const unique = sortedUnique(bars), sufficient = input.sufficientHistory;
    if (!unique) return { ...finish("invalid_data"), bars: [] };
    if (sufficient && unique.length >= sufficient.minimumBars && unique[0].start <= sufficient.coverFrom) return finish("sufficient_history");
  }
  return finish(end > input.request.start ? "budget_exhausted" : bars.length ? "complete" : "no_data");
}

/** Every HTTP page/retry passes through the shared coordinator, not one opaque multi-page call. */
async function fetchIndicatorHistoryRange(input: HistoryFetchInput): Promise<IndicatorHistoryOutcome> {
  let nextEnd = input.nextEnd ?? null, pages = 0, excludedPoints = 0;
  const bars: IndicatorHistoryBar[] = [], transportIds: string[] = [];
  const finish = (outcome: IndicatorHistoryOutcome["outcome"], retryAt?: number): IndicatorHistoryOutcome => ({
    provider: input.provider, adjustment: input.provider === "moomoo" ? "moomoo-forward" : "yahoo-chart-native",
    bars: sortedUnique(bars) ?? [], transportIds, pages, outcome, nextEnd, excludedPoints, ...(retryAt === undefined ? {} : { retryAt }),
  });
  while (input.budget.attemptsRemaining > 0) {
    const url = indicatorHistoryUrl(input.provider, input.request, nextEnd);
    const response = await input.coordinator.request({ provider: input.provider, scope: input.scope, consumer: input.consumer,
      requestKey: url, maxAttempts: input.budget.attemptsRemaining >= 2 && input.budget.retriesRemaining > 0 ? 2 : 1,
      execute: signal => requestIndicatorHistoryPage({ provider: input.provider, url, signal, accessToken: input.accessToken, fetcher: input.fetcher }) });
    transportIds.push(...response.transportIds);
    input.budget.attemptsRemaining -= response.transportIds.length;
    input.budget.retriesRemaining -= Math.max(0, response.transportIds.length - 1);
    if (response.kind === "deferred") return finish("deferred", response.retryAt);
    if (!response.result.ok) return finish(response.result.reason);
    pages++;
    const page = response.result.data;
    excludedPoints += page.excludedPoints ?? 0;
    bars.push(...page.bars.filter(candle => candle.start >= input.request.start && candle.start < input.request.end));
    const uniqueBars = sortedUnique(bars);
    if (!uniqueBars) { bars.length = 0; return finish("invalid_data"); }
    const sufficient = input.sufficientHistory;
    if (sufficient && Number.isInteger(sufficient.minimumBars) && sufficient.minimumBars >= 1
      && uniqueBars.length >= sufficient.minimumBars && uniqueBars[0].start <= sufficient.coverFrom) {
      nextEnd = page.nextEnd;
      return finish("sufficient_history");
    }
    if (page.hasMore === false) { nextEnd = null; return finish(bars.length ? "complete" : "no_data"); }
    if (page.hasMore === null) return finish("pagination_unconfirmed");
    if (page.nextEnd !== null && page.nextEnd <= input.request.start) { nextEnd = null; return finish(bars.length ? "complete" : "no_data"); }
    if (page.nextEnd === null || page.nextEnd >= (nextEnd ?? input.request.end)) return finish("invalid_data");
    nextEnd = page.nextEnd;
  }
  return finish("budget_exhausted");
}
