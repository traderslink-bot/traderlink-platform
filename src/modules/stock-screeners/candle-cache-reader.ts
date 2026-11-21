import { gatewayWireEnabled } from "../market-data/transport/gateway-wire";
import { candleCacheWireUrl, decodeCandleCacheReply } from "../market-data/transport/candle-cache-wire";
import { easternClock } from "../scanner/live/sessions";
import { isObject, MAX_LISTINGS, tickerPattern } from "./contracts";

const MINUTE_MS = 60_000;
const BATCH_SIZE = 50;

export type ScreenerSeedWindow = { startMs: number; endMs: number };
type VwapTotals = { volume: number; notional: number };
export type ScreenerVwapSeed = VwapTotals & { basisDate: string; completedThroughMs: number };
export type LiveVwapTotals = VwapTotals & { basisDate: string; fromMs: number };
export type SeedCoverage = {
  status: "complete" | "partial";
  completedThroughMs: number | null;
  seed: ScreenerVwapSeed | null;
};

function minuteBoundary(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value % MINUTE_MS === 0;
}

function validTotals({ volume, notional }: VwapTotals) {
  return Number.isFinite(volume) && volume >= 0 && Number.isFinite(notional)
    && (volume > 0 ? notional > 0 : notional === 0);
}

/** Merge the seed only when the live accumulator covers the same basis and starts at the exclusive boundary. */
export function screenerSessionVwap(seed: ScreenerVwapSeed | null, live: LiveVwapTotals): number | null {
  if (!seed || seed.basisDate !== live.basisDate || seed.completedThroughMs !== live.fromMs
    || !validTotals(seed) || !validTotals(live)) return null;
  const totals = { volume: seed.volume + live.volume, notional: seed.notional + live.notional };
  return totals.volume > 0 && validTotals(totals) ? totals.notional / totals.volume : null;
}

function readVwapSeed(
  bars: unknown, coverage: unknown, { startMs, endMs }: ScreenerSeedWindow, basisDate: string,
): SeedCoverage {
  const through = isObject(coverage) ? coverage.completedThroughMs : undefined;
  const completedThroughMs = minuteBoundary(through) && through >= startMs && through <= endMs ? through : null;
  const partial = { status: "partial", completedThroughMs, seed: null } as const;
  if (!isObject(coverage) || coverage.status !== "complete" || completedThroughMs !== endMs || !Array.isArray(bars)) return partial;
  let volume = 0;
  let notional = 0;
  let lastStart = startMs - MINUTE_MS;
  for (const bar of bars) {
    if (!isObject(bar) || typeof bar.time !== "number" || !minuteBoundary(bar.time * 1_000)
      || bar.time * 1_000 <= lastStart || bar.time * 1_000 < startMs || bar.time * 1_000 >= endMs
      || typeof bar.volume !== "number" || !Number.isFinite(bar.volume) || bar.volume < 0) return partial;
    lastStart = bar.time * 1_000;
    if (bar.volume === 0) continue;
    if (typeof bar.vwap !== "number" || !Number.isFinite(bar.vwap) || bar.vwap <= 0) return partial;
    volume += bar.volume;
    notional += bar.vwap * bar.volume;
  }
  if (!validTotals({ volume, notional })) return partial;
  return { status: "complete", completedThroughMs: endMs, seed: { basisDate, completedThroughMs: endMs, volume, notional } };
}

/** Background-only read. Yield completed batches so a later busy response can't discard existing seeds. */
export async function* readScreenerVwapSeeds(
  symbols: readonly string[], window: ScreenerSeedWindow,
  environment: NodeJS.ProcessEnv = process.env, signal?: AbortSignal,
): AsyncGenerator<Map<string, SeedCoverage>, void> {
  const { startMs, endMs } = window;
  if (!symbols.length || symbols.length > MAX_LISTINGS || new Set(symbols).size !== symbols.length
    || !symbols.every(symbol => tickerPattern.test(symbol)) || !minuteBoundary(startMs)
    || !minuteBoundary(endMs) || startMs >= endMs || endMs > Date.now()) throw Error("screener_seed_invalid_request");
  const basisDate = easternClock(startMs).date;
  if (easternClock(endMs - 1).date !== basisDate) throw Error("screener_seed_invalid_request");

  const base = environment.TRADERLINK_ALPACA_GATEWAY_URL;
  const token = environment.TRADERLINK_ALPACA_GATEWAY_TOKEN;
  if (!base || !token) throw Error("screener_seed_gateway_unconfigured");
  if (!URL.canParse(base)) throw Error("screener_seed_gateway_invalid");
  const configured = new URL(base);
  const loopback = environment.NODE_ENV !== "production" && configured.protocol === "http:" && configured.hostname === "127.0.0.1";
  if (configured.username || configured.password || configured.search || configured.hash || (configured.protocol !== "https:" && !loopback))
    throw Error("screener_seed_gateway_invalid");
  const wire=gatewayWireEnabled(environment);
  const url = new URL("screener-candle-bars", base.endsWith("/") ? base : base + "/");

  for (let offset = 0; offset < symbols.length; offset += BATCH_SIZE) {
    const batch = symbols.slice(offset, offset + BATCH_SIZE);
    url.search = new URLSearchParams({ symbols: batch.join(","), frame: "1m", start: String(startMs), end: String(endMs) }).toString();
    const timeout = AbortSignal.timeout(25_000);
    const requestUrl=wire?candleCacheWireUrl(base,url.searchParams):url;
    const response = await fetch(requestUrl, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Error(response.status === 429 || response.status === 503 ? "screener_seed_gateway_busy" : "screener_seed_gateway_unavailable");
    }
    const payload:unknown=await response.json();
    const data: unknown = wire?decodeCandleCacheReply(payload):payload;
    if (!isObject(data) || data.feed !== "sip" || data.adjustment !== "split" || data.frame !== "1m"
      || data.basisDate !== basisDate || data.end !== endMs || !isObject(data.bars) || !isObject(data.coverage))
      throw Error("screener_seed_gateway_invalid_reply");
    const { bars, coverage } = data;
    yield new Map(batch.map(symbol => [symbol, readVwapSeed(bars[symbol], coverage[symbol], window, basisDate)]));
  }
}
