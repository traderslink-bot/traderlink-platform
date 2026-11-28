import { decodeGatewayWire, gatewayWireEnabled, gatewayWireUrl } from "../market-data/transport/gateway-wire";
import { easternClock } from "../scanner/live/sessions";
import { parseTradeRevisions, tradeRevisionQuery, type TradeRevisionRequest, type TradeRevisions } from "../scanner/alpaca/trade-revisions";
import { createHash } from "node:crypto";
import { isObject } from "./contracts";
import type { ProviderBar } from "./market-metrics";

const MINUTE = 60_000, BUCKET = 5 * MINUTE;
export type CorrectionHistoryRequest = { symbol: string; start: number; end: number; timeframe?: "1Min" | "5Min" | "15Min" };
export type ScreenerRevisionManifest = TradeRevisions & { generation?: number; unavailableSymbols?: string[] };
export type ScreenerCorrections = {
  revisions(request: TradeRevisionRequest): Promise<ScreenerRevisionManifest>;
  history(request: CorrectionHistoryRequest): Promise<unknown>;
};
type Repair = { revision: string | null; blocked: boolean; replacements: Map<number, ProviderBar | null> };
export type ScreenerCorrectionState = Map<string, Repair>;
export type ScreenerBars = { grouped: Map<string, Map<number, ProviderBar>>; rejected: Set<string> };

/** Worker-safe transport: reuse the shared wire and validator without importing a server-only Platform module. */
export function screenerCorrections(environment: NodeJS.ProcessEnv, signal?: AbortSignal): ScreenerCorrections | undefined {
  const base = environment.TRADERLINK_ALPACA_GATEWAY_URL, token = environment.TRADERLINK_ALPACA_GATEWAY_TOKEN;
  if (!base || !token) return undefined;
  const configured = new URL(base);
  const local = environment.NODE_ENV !== "production" && configured.protocol === "http:" && configured.hostname === "127.0.0.1";
  if (configured.username || configured.password || configured.search || configured.hash || (configured.protocol !== "https:" && !local))
    throw Error("screener_correction_gateway_invalid");
  async function request(path: "trade-revisions" | "history", query: URLSearchParams) {
    const wire = gatewayWireEnabled(environment);
    const url = wire ? gatewayWireUrl(base!, path, query) : new URL(path, base!.endsWith("/") ? base! : base! + "/");
    if (!wire) url.search = query.toString();
    const timeout = AbortSignal.timeout(25_000);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error",
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout });
    if (!response.ok) {
      await response.body?.cancel();
      throw Error(path === "trade-revisions" && response.status === 413 ? "screener_correction_manifest_large" : "screener_correction_gateway_unavailable");
    }
    const payload: unknown = await response.json();
    return wire ? decodeGatewayWire(path, payload) : payload;
  }
  async function revisions(input: TradeRevisionRequest): Promise<ScreenerRevisionManifest> {
    try { return parseScreenerRevisions(await request("trade-revisions", tradeRevisionQuery(input)), input); }
    catch (error) {
      if (!(error instanceof Error) || error.message !== "screener_correction_manifest_large") throw error;
      if (input.symbols.length === 1) {
        // Obtain the ledger generation from a bounded one-minute lookup without
        // representing it as coverage for the overflowing historical window.
        const clock = { ...input, start: Math.max(input.start, input.end - MINUTE) };
        const current = parseScreenerRevisions(await request("trade-revisions", tradeRevisionQuery(clock)), clock);
        return { feed: "sip", symbols: {}, generation: current.generation, unavailableSymbols: [...input.symbols] };
      }
      const middle = Math.ceil(input.symbols.length / 2);
      const left = await revisions({ ...input, symbols: input.symbols.slice(0, middle) });
      const right = await revisions({ ...input, symbols: input.symbols.slice(middle) });
      const generations = [left.generation, right.generation].filter((value): value is number => value !== undefined);
      return { feed: "sip", symbols: { ...left.symbols, ...right.symbols },
        ...(generations.length ? { generation: Math.max(...generations) } : {}),
        unavailableSymbols: [...(left.unavailableSymbols ?? []), ...(right.unavailableSymbols ?? [])] };
    }
  }
  return {
    revisions,
    history: input => request("history", new URLSearchParams({ symbol: input.symbol, timeframe: input.timeframe ?? "1Min", start: String(input.start), end: String(input.end) })),
  };
}

export function parseScreenerRevisions(payload: unknown, request: TradeRevisionRequest): ScreenerRevisionManifest {
  const manifest = parseTradeRevisions(payload, request) as ScreenerRevisionManifest;
  if (manifest.generation !== undefined && (!Number.isSafeInteger(manifest.generation) || manifest.generation < 0))
    throw Error("invalid_trade_revision_response");
  return manifest;
}

export function screenerCorrectionDigest(symbols: readonly string[], manifest: ScreenerRevisionManifest): string | undefined {
  const entries = symbols.flatMap(symbol => {
    const entry = manifest.symbols[symbol];
    return entry?.revision ? [[symbol, entry.revision]] : [];
  }).sort((first, second) => String(first[0]).localeCompare(String(second[0])));
  for (const symbol of (manifest.unavailableSymbols ?? []).filter(symbol => symbols.includes(symbol)).sort()) entries.push([symbol, "coverage_unavailable"]);
  return entries.length || manifest.generation !== undefined
    ? createHash("sha256").update(JSON.stringify(entries)).digest("hex") : undefined;
}

/** A complete sparse window is valid. An omitted cancelled-only minute is not a synthetic zero bar. */
export function correctedMinutes(payload: unknown, request: CorrectionHistoryRequest, basisDate: string): ProviderBar[] {
  if (!isObject(payload) || payload.symbol !== request.symbol || payload.feed !== "sip" || payload.adjustment !== "split"
    || payload.basisDate !== basisDate || payload.complete !== true || payload.nextPageToken !== null || !Array.isArray(payload.bars))
    throw Error("screener_correction_history_incomplete");
  let previous = request.start / 1000 - 1;
  return payload.bars.map((raw): ProviderBar => {
    if (!isObject(raw) || !Number.isSafeInteger(raw.time) || Number(raw.time) % 60 !== 0 || Number(raw.time) <= previous
      || Number(raw.time) * 1000 < request.start || Number(raw.time) * 1000 > request.end
      || ![raw.open, raw.high, raw.low, raw.close].every(value => typeof value === "number" && Number.isFinite(value) && value > 0)
      || typeof raw.volume !== "number" || !Number.isFinite(raw.volume) || raw.volume < 0
      || Number(raw.high) < Math.max(Number(raw.open), Number(raw.close)) || Number(raw.low) > Math.min(Number(raw.open), Number(raw.close))
      || Number(raw.high) < Number(raw.low)) throw Error("screener_correction_history_invalid");
    previous = Number(raw.time);
    return { time: Number(raw.time), open: Number(raw.open), high: Number(raw.high), low: Number(raw.low), close: Number(raw.close), volume: raw.volume,
      ...(typeof raw.vwap === "number" && Number.isFinite(raw.vwap) && raw.vwap > 0 ? { vwap: raw.vwap } : {}) };
  });
}

function bucketBar(start: number, bars: ProviderBar[]): ProviderBar | null {
  if (!bars.length) return null;
  const volume = bars.reduce((sum, bar) => sum + bar.volume, 0);
  const traded = bars.filter(bar => bar.volume > 0);
  const notional = traded.every(bar => bar.vwap !== undefined) ? traded.reduce((sum, bar) => sum + bar.volume * bar.vwap!, 0) : undefined;
  if (!Number.isFinite(volume) || !Number.isFinite(notional ?? 0)) throw Error("screener_correction_totals_invalid");
  return { time: start / 1000, open: bars[0].open, high: Math.max(...bars.map(bar => bar.high)), low: Math.min(...bars.map(bar => bar.low)),
    close: bars.at(-1)!.close, volume, ...(volume > 0 && notional !== undefined ? { vwap: notional / volume } : {}) };
}

/** Keep repairs across raw tail refreshes and failed metadata reads. Empty metadata is not an upstream coverage certificate. */
export async function repairScreenerBars(input: {
  bars: ScreenerBars; symbols: string[]; start: number; end: number; basisDate: string;
  state: ScreenerCorrectionState; reader: ScreenerCorrections;
  timeframe?: "5Min" | "15Min";
  manifest?: ScreenerRevisionManifest; revisionRequest?: TradeRevisionRequest;
}): Promise<ScreenerBars> {
  const { symbols, start, end, basisDate, state, reader } = input;
  const timeframe = input.timeframe ?? "5Min", span = timeframe === "15Min" ? 3 * BUCKET : BUCKET;
  const request = input.revisionRequest ?? { symbols, start, end };
  let manifest = input.manifest;
  try { manifest ??= parseScreenerRevisions(await reader.revisions(request), request); } catch { /* Retain known obligations; do not discard healthy peers. */ }
  for (const symbol of symbols) {
    const entry = manifest?.symbols[symbol];
    const prior = state.get(symbol);
    const coversCurrent = easternClock(start).date <= basisDate && easternClock(end - 1).date >= basisDate;
    const pending = entry?.pending && coversCurrent;
    const minutes = entry?.minutes.filter(minute => minute * 1000 >= start && minute * 1000 < end) ?? [];
    if (!entry || (!pending && (!minutes.length || (prior?.revision === entry.revision && !prior.blocked)))) continue;
    const repair: Repair = { revision: entry.revision, blocked: true, replacements: new Map() };
    state.set(symbol, repair);
    if (pending || !entry.revision) continue;
    try {
      for (const at of new Set(minutes.map(minute => Math.floor(minute * 1000 / span) * span))) {
        if (at < start || at + span > end) throw Error("screener_correction_bucket_incomplete");
        const window = { symbol, start: at, end: at + span - 1, timeframe };
        const bars = correctedMinutes(await reader.history(window), window, basisDate);
        if (bars.length > 1 || bars.some(bar => bar.time !== at / 1000)) throw Error("screener_correction_native_bucket_invalid");
        repair.replacements.set(at / 1000, bucketBar(at, bars));
      }
      const verified = parseScreenerRevisions(await reader.revisions(request), request).symbols[symbol];
      if (!verified || (coversCurrent && verified.pending) || verified.revision !== entry.revision) throw Error("screener_correction_changed");
      repair.blocked = false;
    } catch { /* A known unresolved correction must not publish the superseded high or volume. */ }
  }
  const grouped = new Map(input.bars.grouped), rejected = new Set(input.bars.rejected);
  for (const symbol of manifest?.unavailableSymbols ?? []) if (symbols.includes(symbol)) rejected.add(symbol);
  for (const symbol of symbols) {
    const repair = state.get(symbol);
    if (!repair) continue;
    if (repair.blocked) { rejected.add(symbol); continue; }
    const bars = new Map(grouped.get(symbol));
    for (const [time, bar] of repair.replacements) {
      if (time * 1000 < start || time * 1000 >= end) continue;
      if (bar) bars.set(time, bar); else bars.delete(time);
    }
    grouped.set(symbol, bars);
  }
  return { grouped, rejected };
}
