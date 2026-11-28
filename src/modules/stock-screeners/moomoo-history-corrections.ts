import "server-only";
import { createHash } from "node:crypto";
import { easternClock } from "../scanner/live/sessions";
import { readAlpacaTradeCorrectionEvidence } from "../scanner/alpaca/client";
import { correctionCoverage, projectConfirmedRawDaily, projectConfirmedRawInterval, projectConfirmedRawMinutes, type AppliedTradeCorrections, type DurableTradeCorrections } from "../scanner/alpaca/durable-trade-corrections";
import type { Candle } from "../scanner/alpaca/candles";
import { moomooChartBar } from "../market-data/server/moomoo-chart-history";
import { requestMoomooMarketData, type MoomooDataRequest } from "../market-data/server/moomoo-bridge";
import { isObject } from "./contracts";

type History = Extract<MoomooDataRequest, { operation: "history" }>;
type Dependencies = { readEvidence: typeof readAlpacaTradeCorrectionEvidence; readNative: typeof requestMoomooMarketData };
const defaults: Dependencies = { readEvidence: readAlpacaTradeCorrectionEvidence, readNative: requestMoomooMarketData };
const spans = { "1Min": 60, "5Min": 300, "15Min": 900, "1Day": 0 };
type NativeMinute = Candle & { turnover?: number };
type Bucket = { bar: Candle | null; turnover: number | null };
const state = globalThis as typeof globalThis & { traderlinkMoomooCanonicalBuckets?: Map<string, Bucket> };
const buckets = state.traderlinkMoomooCanonicalBuckets ??= new Map();

function data(payload: unknown) {
  if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.kline_list))
    throw Error("screener_native_history_unavailable");
  const precision = payload.data.volume_precision ?? 0;
  if (!Number.isSafeInteger(precision) || Number(precision) < 0 || Number(precision) > 9) throw Error("screener_native_history_invalid");
  return { payload, details: payload.data, rows: payload.data.kline_list, precision: Number(precision) };
}

function rawBar(value: unknown, precision: number, daily: boolean, seconds: number): NativeMinute | null {
  if (!isObject(value)) throw Error("screener_native_history_invalid");
  const row = { ...value, ...(typeof value.volume === "number" ? { volume: value.volume / 10 ** precision } : {}) };
  const bar = moomooChartBar(row, daily, seconds);
  if (!bar) return null;
  const turnover = value.turnover;
  const weighted = typeof turnover === "number" && Number.isFinite(turnover) && (bar.volume > 0 ? turnover > 0 : turnover === 0);
  return { ...bar, ...(weighted ? { turnover: turnover as number } : {}) };
}

async function completeMinutes(operation: History, start: number, end: number, environment: NodeJS.ProcessEnv,
  signal: AbortSignal, read: Dependencies["readNative"]): Promise<NativeMinute[] | null> {
  const result = new Map<number, NativeMinute>(), cursors = new Set<string>();
  let nextTime: number | undefined, pageToken: string | undefined;
  for (let page = 0; page < 160; page++) {
    signal.throwIfAborted();
    const loaded = data(await read({ operation: "history", symbol: operation.symbol, timeframe: "1Min", start, end: end - 1,
      ...(nextTime === undefined ? {} : { nextTime }), ...(pageToken ? { pageToken } : {}) }, environment, signal));
    let earliest = Infinity;
    for (const value of loaded.rows) {
      const bar = rawBar(value, loaded.precision, false, 60);
      if (!bar) continue;
      earliest = Math.min(earliest, bar.time * 1000);
      if (bar.time * 1000 < start || bar.time * 1000 >= end) continue;
      const previous = result.get(bar.time);
      if (previous && JSON.stringify(previous) !== JSON.stringify(bar)) return null;
      result.set(bar.time, bar);
    }
    const pagination = isObject(loaded.payload.pagination) ? loaded.payload.pagination : {};
    if (pagination.has_more !== true || earliest <= start) return [...result.values()].sort((a, b) => a.time - b.time);
    const next = loaded.details.next_time, token = pagination.next_page_token;
    if (!loaded.rows.length || !Number.isSafeInteger(next) || Number(next) <= 0 || (nextTime !== undefined && Number(next) >= nextTime)
      || (token !== undefined && (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token)))) return null;
    const cursor = String(next) + "/" + (token ?? "");
    if (cursors.has(cursor)) return null;
    cursors.add(cursor); nextTime = Number(next); pageToken = token as string | undefined;
  }
  return null;
}

function intervalTurnover(minutes: readonly NativeMinute[], evidence: DurableTradeCorrections, symbol: string, start: number, end: number): number | null {
  const canonical = new Set(evidence.rows.filter(row => row.minute * 1000 >= start && row.minute * 1000 < end).map(row => row.minute));
  const projected = projectConfirmedRawMinutes(minutes, evidence, { symbol, start, end }).bars;
  const native = new Map(minutes.map(bar => [bar.time, bar]));
  let total = 0;
  for (const bar of projected) {
    if (bar.volume === 0) continue;
    // Confirmed OHLCV does not provide the corrected trade-weighted notional.
    // Even an equal native candle cannot prove its turnover is post-correction.
    if (canonical.has(bar.time)) return null;
    const turnover = native.get(bar.time)?.turnover;
    if (turnover === undefined) return null;
    total += turnover;
  }
  return Number.isFinite(total) ? total : null;
}

/** This runs after linked-provider authorization, before native fields leave Railway. */
export async function correctMoomooScreenerHistory(operation: MoomooDataRequest & { correctionRevision?: unknown }, payload: unknown,
  environment: NodeJS.ProcessEnv, signal: AbortSignal, dependencies = defaults, now = Date.now()): Promise<unknown> {
  // Ordinary SDK reads have no extra correction/evidence or native-minute requests.
  if (operation.operation !== "history" || operation.correctionRevision === undefined) return payload;
  if (typeof operation.correctionRevision !== "string" || !/^[a-f0-9]{64}$/.test(operation.correctionRevision))
    throw Error("invalid_market_data_request");
  const loaded = data(payload), seconds = spans[operation.timeframe];
  const range = { symbol: operation.symbol, start: operation.start,
    end: Math.min(now + 1, operation.end + (seconds || 86_400) * 1000 + 1), ...(operation.timeframe === "1Day" ? { daily: true as const } : {}) };
  const evidence: DurableTradeCorrections | undefined = await dependencies.readEvidence(range, environment, signal);
  if (!evidence) throw Error("screener_correction_evidence_unavailable");
  if (!evidence.rows.length) return payload;
  const window = { symbol: operation.symbol, start: operation.start, end: operation.end + 1 };
  const native = new Map<number, { bar: NativeMinute; row: Record<string, unknown> }>();
  const outside: unknown[] = [];
  for (const value of loaded.rows) {
    const bar = rawBar(value, loaded.precision, operation.timeframe === "1Day", seconds);
    if (!bar || bar.time * 1000 < window.start || bar.time * 1000 >= window.end) { outside.push(value); continue; }
    if (native.has(bar.time) && JSON.stringify(native.get(bar.time)!.bar) !== JSON.stringify(bar)) throw Error("screener_native_history_invalid");
    native.set(bar.time, { bar, row: value as Record<string, unknown> });
  }
  const projected = new Map<number, Candle>([...native].map(([time, value]) => [time, value.bar]));
  const turnover = new Map<number, number | null>();
  let provenance: AppliedTradeCorrections | undefined;
  if (operation.timeframe === "1Min" || operation.timeframe === "1Day") {
    const result = operation.timeframe === "1Day"
      ? projectConfirmedRawDaily([...projected.values()], evidence, window)
      : projectConfirmedRawMinutes([...projected.values()], evidence, window);
    projected.clear();
    for (const bar of result.bars) projected.set(bar.time, bar);
    provenance = result.corrections;
    for (const time of provenance?.times ?? []) turnover.set(time, projected.get(time)?.volume === 0 ? 0 : null);
  } else {
    const affected = new Set(evidence.rows.map(row => Math.floor(row.minute / seconds) * seconds)
      .filter(time => time * 1000 >= window.start && time * 1000 < window.end));
    const times: number[] = [], pending: number[] = [];
    let budget = 24;
    for (const time of [...affected].sort((a, b) => a - b)) {
      const changes = evidence.rows.filter(row => row.minute >= time && row.minute < time + seconds);
      const key = createHash("sha256").update(JSON.stringify(["canonical", operation.symbol, seconds, time, native.get(time)?.bar ?? null, changes])).digest("hex");
      let bucket = buckets.get(key);
      if (!bucket) {
        let minutes: NativeMinute[] | null = null;
        const bar = await projectConfirmedRawInterval(time, seconds, evidence, async (from, until) => {
          if (--budget < 0) return null;
          minutes = await completeMinutes(operation, from, until, environment, signal, dependencies.readNative);
          return minutes;
        }, now);
        if (bar === undefined) { pending.push(time); projected.delete(time); continue; }
        bucket = { bar, turnover: bar && minutes ? intervalTurnover(minutes, evidence, operation.symbol, time * 1000, (time + seconds) * 1000) : null };
        buckets.set(key, bucket);
        while (buckets.size > 2048) buckets.delete(buckets.keys().next().value!);
      }
      times.push(time);
      if (bucket.bar) { projected.set(time, bucket.bar); turnover.set(time, bucket.turnover); }
      else projected.delete(time);
    }
    provenance = correctionCoverage(times, pending);
  }
  const changed = new Set(provenance?.times ?? []);
  const rows = [...outside, ...[...projected.values()].sort((a, b) => a.time - b.time).map(bar => {
    const previous = native.get(bar.time)?.row;
    if (previous && !changed.has(bar.time)) return previous;
    const date = easternClock(bar.time * 1000).date;
    return { ...previous, time_key: previous?.time_key ?? (operation.timeframe === "1Day" ? Date.parse(date + "T00:00:00Z") : (bar.time + seconds) * 1000),
      ...(operation.timeframe === "1Day" ? { date: Number(date.replaceAll("-", "")) } : {}),
      open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume * 10 ** loaded.precision, turnover: turnover.get(bar.time) ?? null };
  })].sort((a, b) => Number((a as Record<string, unknown>)?.time_key ?? 0) - Number((b as Record<string, unknown>)?.time_key ?? 0));
  const verified = await dependencies.readEvidence(range, environment, signal);
  if (!verified || verified.generation !== evidence.generation) throw Error("screener_correction_changed");
  return { ...loaded.payload, data: { ...loaded.details, kline_list: rows, ...(provenance ? { corrections: provenance } : {}) } };
}
