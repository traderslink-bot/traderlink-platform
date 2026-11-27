import "server-only";

import { sharedMoomooFetch } from "@/src/modules/platform/server/broker-connections/moomoo-shared-transport";
import { withWatchlistIndicatorMoomooAccess } from "@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge";
import { chartSymbol } from "@/src/modules/scanner/alpaca/candles";

export type MoomooDataRequest =
  | { operation: "snapshots"; symbols: readonly string[] }
  | { operation: "history"; symbol: string; timeframe: "1Min" | "5Min" | "15Min" | "1Day"; start: number; end: number; nextTime?: number; pageToken?: string }
  | { operation: "rehab"; symbol: string }
  | { operation: "calendar"; start: string; end: string };

const day = 86_400_000;
const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
export function moomooDate(timestamp: number) { return dateFormat.format(timestamp); }
function followingDate(date: string) { return new Date(Date.parse(date + "T12:00:00Z") + day).toISOString().slice(0, 10); }

export function moomooRequest(input: MoomooDataRequest): { url: string; body?: string } {
  const origin = "https://webapi.moomoo.com/api/v1.0/quote/";
  if (input.operation === "snapshots") {
    if (!Array.isArray(input.symbols) || input.symbols.length < 1 || input.symbols.length > 400) throw Error("invalid_market_data_request");
    return { url: origin + "snapshot", body: JSON.stringify({ code_list: [...new Set(input.symbols.map(chartSymbol))].map(symbol => "US." + symbol) }) };
  }
  if (input.operation === "calendar") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start) || !/^\d{4}-\d{2}-\d{2}$/.test(input.end)
      || !Number.isFinite(Date.parse(input.start)) || !Number.isFinite(Date.parse(input.end))
      || new Date(input.start).toISOString().slice(0, 10) !== input.start || new Date(input.end).toISOString().slice(0, 10) !== input.end
      || input.start > input.end || Date.parse(input.end) - Date.parse(input.start) > 550 * day) throw Error("invalid_market_data_request");
    return { url: origin + "trading-days?" + new URLSearchParams({ market: "US", start: input.start, end: input.end }) };
  }
  const symbol = chartSymbol(input.symbol);
  if (input.operation === "rehab") return { url: origin + "US." + symbol + "/corporate-actions/rehab?divi_mode=exclude_divi" };
  if (input.operation !== "history" || !["1Min", "5Min", "15Min", "1Day"].includes(input.timeframe)
    || !Number.isSafeInteger(input.start) || !Number.isSafeInteger(input.end) || input.start < Date.UTC(2016, 0, 1)
    || input.end <= input.start || input.end > Date.now() + day || input.end - input.start > 3_660 * day
    || input.nextTime !== undefined && (!Number.isSafeInteger(input.nextTime) || input.nextTime <= 0 || input.nextTime > input.end + day)
    || input.pageToken !== undefined && !/^[a-f0-9]{48}$/.test(input.pageToken)) throw Error("invalid_market_data_request");
  const query = new URLSearchParams({
    start: moomooDate(input.start), end: input.timeframe === "1Day" ? moomooDate(input.end) : followingDate(moomooDate(input.end)),
    ktype: { "1Min": "1", "5Min": "6", "15Min": "7", "1Day": "2" }[input.timeframe],
    autype: "0", num: "370", extended_time: input.timeframe === "1Day" ? "0" : "1",
  });
  if (input.nextTime !== undefined) query.set("next_time", String(input.nextTime));
  if (input.pageToken !== undefined) query.set("page_token", input.pageToken);
  return { url: origin + "US." + symbol + "/history-kline?" + query };
}

export async function requestMoomooMarketData(input: MoomooDataRequest, environment: NodeJS.ProcessEnv = process.env,
  signal?: AbortSignal, priority: "scanner" | "other" = "other"): Promise<Record<string, unknown>> {
  const request = moomooRequest(input);
  return withWatchlistIndicatorMoomooAccess(({ token }) => fetchMoomooMarketData(request, token, environment, signal, priority), environment);
}

export function requestAuthorizedMoomooMarketData(input: MoomooDataRequest, token: string,
  environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal): Promise<Record<string, unknown>> {
  return fetchMoomooMarketData(moomooRequest(input), token, environment, signal, "other");
}

export class MoomooMarketDataRateLimit extends Error {
  constructor(readonly retryAfter: string | null) { super("moomoo_market_data_rate_limited"); }
}

async function fetchMoomooMarketData(request: ReturnType<typeof moomooRequest>, token: string, environment: NodeJS.ProcessEnv,
  signal: AbortSignal | undefined, priority: "scanner" | "other"): Promise<Record<string, unknown>> {
  let value: Record<string, unknown> | undefined;
  const response = await sharedMoomooFetch(request.url, {
    method: request.body ? "POST" : "GET", cache: "no-store", redirect: "error",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000),
    headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(request.body ? { "Content-Type": "application/json" } : {}) },
    ...(request.body ? { body: request.body } : {}),
  }, {
    priority, environment: { ...environment, TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED: "true" }, requireEnabled: true,
    async fetcher(url, init) {
      const upstream = await fetch(url, init);
      if (!upstream.ok || !upstream.body) return upstream;
      value = await readMarketDataBody(upstream.body);
      // Treat the provider's HTTP-200 quota envelope like a transport 429
      // before the shared budget commits its decision for this request.
      return value?.ret_code === -11 || value?.code === -11
        ? new Response(null, { status: 429, headers: upstream.headers }) : upstream;
    },
  });
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 429) {
      const hint = response.headers.get("Retry-After")?.trim() ?? "";
      throw new MoomooMarketDataRateLimit(/^\d{1,9}$/.test(hint) || Number.isFinite(Date.parse(hint)) ? hint : null);
    }
  }
  if (!response.ok || !value || value.ret_code !== 0) throw Error("moomoo_market_data_unavailable");
  return value;
}

async function readMarketDataBody(body: ReadableStream<Uint8Array>): Promise<Record<string, unknown> | undefined> {
  const reader = body.getReader(), chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4_000_000) { await reader.cancel(); throw Error("invalid_market_data_response"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}
