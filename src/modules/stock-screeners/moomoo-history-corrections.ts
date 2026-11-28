import "server-only";
import { createHash } from "node:crypto";
import { easternClock } from "../scanner/live/sessions";
import { readAlpacaTradeCorrectionEvidence } from "../scanner/alpaca/client";
import { projectComparableRawDaily, projectComparableRawInterval, projectComparableRawMinutes, type DurableTradeCorrections } from "../scanner/alpaca/durable-trade-corrections";
import type { Candle } from "../scanner/alpaca/candles";
import { moomooChartBar } from "../market-data/server/moomoo-chart-history";
import { requestMoomooMarketData, type MoomooDataRequest } from "../market-data/server/moomoo-bridge";
import { isObject } from "./contracts";

type History = Extract<MoomooDataRequest, { operation: "history" }>;
type Dependencies = { readEvidence: typeof readAlpacaTradeCorrectionEvidence; readNative: typeof requestMoomooMarketData };
const defaults: Dependencies = { readEvidence: readAlpacaTradeCorrectionEvidence, readNative: requestMoomooMarketData };
const spans = { "1Min": 60, "5Min": 300, "15Min": 900, "1Day": 0 };
const state = globalThis as typeof globalThis & { traderlinkMoomooScreenerCorrectionBuckets?: Map<string, Candle | null> };
const buckets = state.traderlinkMoomooScreenerCorrectionBuckets ??= new Map();

function data(payload: unknown) {
  if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.kline_list))
    throw Error("screener_native_history_unavailable");
  const precision = payload.data.volume_precision ?? 0;
  if (!Number.isSafeInteger(precision) || Number(precision) < 0 || Number(precision) > 9) throw Error("screener_native_history_invalid");
  return { payload, details: payload.data, rows: payload.data.kline_list, precision: Number(precision) };
}

function rawBar(value: unknown, precision: number, daily: boolean, seconds: number) {
  if (!isObject(value)) throw Error("screener_native_history_invalid");
  const row = { ...value, ...(typeof value.volume === "number" ? { volume: value.volume / 10 ** precision } : {}) };
  return moomooChartBar(row, daily, seconds);
}

async function completeMinutes(operation: History, start: number, end: number, environment: NodeJS.ProcessEnv,
  signal: AbortSignal, read: Dependencies["readNative"]): Promise<Candle[] | null> {
  const result = new Map<number, Candle>(), cursors = new Set<string>();
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
  let budget = 24;
  const rows: unknown[] = [];
  for (const value of loaded.rows) {
    const bar = rawBar(value, loaded.precision, operation.timeframe === "1Day", seconds);
    if (!bar || bar.time * 1000 < operation.start || bar.time * 1000 > operation.end) { rows.push(value); continue; }
    let next: Candle | null | undefined = bar;
    if (operation.timeframe === "1Day") {
      const date = easternClock(bar.time * 1000).date;
      const affected = evidence.rows.some(row => easternClock(row.minute * 1000).date === date);
      if (affected && !evidence.nativeDays?.some(day => day.day === bar.time)) next = null;
      else next = projectComparableRawDaily([bar], evidence)[0] ?? null;
    } else if (operation.timeframe === "1Min") next = projectComparableRawMinutes([bar], evidence)[0] ?? null;
    else {
      const affected = evidence.rows.filter(row => row.minute >= bar.time && row.minute < bar.time + seconds);
      if (affected.length) {
        const key = createHash("sha256").update(JSON.stringify([operation.symbol, seconds, bar, affected])).digest("hex");
        if (buckets.has(key)) next = buckets.get(key)!;
        else {
          next = await projectComparableRawInterval(bar, seconds, evidence, async (from, until) => {
            if (--budget < 0) return null;
            return completeMinutes(operation, from, until, environment, signal, dependencies.readNative);
          }, now);
          if (next !== undefined) {
            buckets.set(key, next);
            while (buckets.size > 2048) buckets.delete(buckets.keys().next().value!);
          }
        }
      }
    }
    if (next === undefined) throw Error("screener_native_correction_unqualified");
    if (!next) continue;
    if (next === bar || (next.time === bar.time && next.open === bar.open && next.high === bar.high && next.low === bar.low
      && next.close === bar.close && next.volume === bar.volume)) rows.push(value);
    else rows.push({ ...(value as Record<string, unknown>), open: next.open, high: next.high, low: next.low, close: next.close,
      volume: next.volume * 10 ** loaded.precision, turnover: 0 });
  }
  const verified = await dependencies.readEvidence(range, environment, signal);
  if (!verified || verified.generation !== evidence.generation) throw Error("screener_correction_changed");
  return { ...loaded.payload, data: { ...loaded.details, kline_list: rows } };
}
