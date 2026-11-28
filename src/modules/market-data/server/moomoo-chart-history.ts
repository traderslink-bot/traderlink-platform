import "server-only";

import {
  correctionCoverage, projectConfirmedRawDaily, projectConfirmedRawInterval, projectConfirmedRawMinutes,
  type CorrectedRawHistory, type DurableTradeCorrections, type TradeCorrectionRange,
} from "@/src/modules/scanner/alpaca/durable-trade-corrections";
import { readAlpacaTradeCorrectionEvidence } from "@/src/modules/scanner/alpaca/client";
import { moomooCalendarSessions } from "../moomoo-calendar";
import { requestMoomooMarketData, moomooDate, type MoomooDataRequest } from "./moomoo-bridge";
import { easternDayStart, type Candle } from "@/src/modules/scanner/alpaca/candles";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import type { ChartCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { VwapCorporateEvents, VwapCorporateAnchor } from "@/src/modules/scanner/alpaca/chart-vwap-events";

type HistoryInput = { symbol: string; timeframe: "1Min" | "15Min" | "1Day"; start: number; end: number; adjustment?: "raw" | "split" };
type ReadCorrectionEvidence = (range: TradeCorrectionRange) => Promise<DurableTradeCorrections | undefined>;
type Loader = (request: MoomooDataRequest) => Promise<Record<string, unknown>>;
// The service has returned up to 1,000 rows despite the 370-row request limit.
const MAX_HISTORY_RESPONSE_ROWS = 1000;

export type SplitEvent = { date: string; ratio: number };
export function moomooSplits(payload: Record<string, unknown>): SplitEvent[] {
  const rows = (payload.data as { rehabs?: unknown } | undefined)?.rehabs;
  if (!Array.isArray(rows)) throw Error("moomoo_split_history_unavailable");
  const seen = new Map<string, number>();
  return rows.flatMap(row => {
    if (!row || typeof row !== "object" || !Array.isArray(row.action_types)) throw Error("invalid_moomoo_split");
    if (!row.action_types.some((value: string) => value === "SPLIT" || value === "JOIN")) return [];
    if (typeof row.ex_div_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.ex_div_date)
      || !Number.isFinite(Date.parse(row.ex_div_date)) || new Date(row.ex_div_date).toISOString().slice(0, 10) !== row.ex_div_date
      || typeof row.split_ratio !== "number" || !Number.isFinite(row.split_ratio) || row.split_ratio <= 0) throw Error("invalid_moomoo_split");
    const previous = seen.get(row.ex_div_date);
    if (previous !== undefined && previous !== row.split_ratio) throw Error("conflicting_moomoo_split");
    if (previous !== undefined) return [];
    seen.set(row.ex_div_date, row.split_ratio);
    return [{ date: row.ex_div_date, ratio: row.split_ratio }];
  });
}

function candleStart(row: Record<string, unknown>, daily: boolean, intradaySeconds: number): number {
  const timestamp = row.time_key ?? row.time_ms;
  if (!Number.isSafeInteger(timestamp) || Number(timestamp) <= 0) throw Error("invalid_moomoo_candle");
  // Moomoo's native minute history is end-labelled. The shared chart uses starts.
  const tradingDate = typeof row.date === "number" && /^\d{8}$/.test(String(row.date)) ? String(row.date).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3") : null;
  const time = daily ? easternDayStart(tradingDate ? Date.parse(tradingDate + "T12:00:00Z") / 1000 : Number(timestamp) / 1000) : Number(timestamp) / 1000 - intradaySeconds;
  if (!Number.isSafeInteger(time)) throw Error("invalid_moomoo_candle");
  return time;
}

export function moomooChartBar(raw: unknown, daily: boolean, intradaySeconds = 60): Candle | null {
  if (!raw || typeof raw !== "object") throw Error("invalid_moomoo_candle");
  const row = raw as Record<string, unknown>;
  const timestamp = row.time_key ?? row.time_ms;
  if (!Number.isSafeInteger(timestamp) || Number(timestamp) <= 0) throw Error("invalid_moomoo_candle");
  const values = [row.open ?? row.open_price, row.high ?? row.high_price, row.low ?? row.low_price, row.close ?? row.close_price, row.volume];
  // Native current-day history contains timestamp-only future slots.
  if (values.every(value => value === null || value === undefined) && Number(timestamp) > Date.now()) return null;
  if (values.some(value => typeof value !== "number" || !Number.isFinite(value))) throw Error("invalid_moomoo_candle");
  const [open, high, low, close, volume] = values as number[];
  if (low <= 0 || high < Math.max(open, close) || low > Math.min(open, close) || volume < 0) throw Error("invalid_moomoo_candle");
  return { time: candleStart(row, daily, intradaySeconds), open, high, low, close, volume };
}

export function adjustMoomooBars(bars: readonly Candle[], splits: readonly SplitEvent[], basisDate: string): Candle[] {
  return bars.map(bar => {
    const date = moomooDate(bar.time * 1000);
    const factor = splits.filter(event => event.date > date && event.date <= basisDate).reduce((value, event) => value * event.ratio, 1);
    const next = { ...bar, open: bar.open * factor, high: bar.high * factor, low: bar.low * factor, close: bar.close * factor, volume: bar.volume / factor };
    if (Object.values(next).some(value => !Number.isFinite(value)) || next.low <= 0) throw Error("invalid_moomoo_adjustment");
    return next;
  });
}

export class MoomooChartHistory {
  private cache = new Map<string, { at: number; value: Awaited<ReturnType<MoomooChartHistory["loadHistory"]>> }>();
  private pending = new Map<string, Promise<Awaited<ReturnType<MoomooChartHistory["loadHistory"]>>>>();
  private projecting = new Map<string, Promise<Awaited<ReturnType<MoomooChartHistory["projectHistory"]>>>>();
  private calendarCache = new Map<string, Promise<ChartCalendar>>();
  private events = new Map<string, { at: number; payload: Record<string, unknown> }>();
  constructor(private readonly loader: Loader = request => requestMoomooMarketData(request), private readonly now: () => number = Date.now,
    private readonly readCorrectionEvidence: ReadCorrectionEvidence = readAlpacaTradeCorrectionEvidence) {}

  async corporateActions(symbol: string) {
    const saved = this.events.get(symbol);
    if (saved && this.now() - saved.at < 300_000) return saved.payload;
    const payload = await this.loader({ operation: "rehab", symbol });
    moomooSplits(payload);
    this.events.set(symbol, { at: this.now(), payload });
    while (this.events.size > 128) this.events.delete(this.events.keys().next().value!);
    return payload;
  }

  async readEvents(symbol: string, anchor: VwapCorporateAnchor): Promise<VwapCorporateEvents> {
    const payload = await this.corporateActions(symbol);
    const rows = (payload.data as { rehabs: Record<string, unknown>[] }).rehabs;
    const basisDate = easternClock(this.now()).date;
    const dates = anchor === "Splits" ? moomooSplits(payload).map(event => event.date) : rows
      .filter(row => Array.isArray(row.action_types) && row.action_types.some(value => value === "DIVIDEND" || value === "SPECIALDIVIDEND"))
      .map(row => String(row.ex_div_date));
    if (dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date))) throw Error("invalid_moomoo_event");
    return { symbol, anchor, basisDate, dates: [...new Set(dates.filter(date => date <= basisDate))].sort() };
  }

  history(input: HistoryInput, allowPartial = false) {
    const key = JSON.stringify([easternClock(this.now()).date,input,allowPartial]);
    const pending = this.projecting.get(key);
    if (pending) return pending;
    const next = this.projectHistory(input,allowPartial).finally(()=>this.projecting.delete(key));
    this.projecting.set(key,next);
    return next;
  }

  private async projectHistory(input: HistoryInput, allowPartial: boolean) {
    const { adjustment = "split", ...request } = input;
    const raw = await this.rawHistory(request,allowPartial);
    const projected = request.timeframe === "15Min"
      ? await this.correctRawIntervals(request, raw.bars, raw.basisDate, allowPartial)
      : await this.correctRawHistory({ ...request, timeframe: request.timeframe }, raw.bars);
    const splits = adjustment === "split" ? moomooSplits(await this.corporateActions(input.symbol)) : [];
    if (easternClock(this.now()).date !== raw.basisDate) throw Error("adjustment_basis_changed");
    return { ...raw, ...projected, complete: raw.complete && !projected.corrections?.pending.length, adjustment,
      bars: adjustment === "raw" ? projected.bars : adjustMoomooBars(projected.bars, splits, raw.basisDate) };
  }

  /** Re-project cache hits so a confirmed correction can supersede a stale native row. */
  async correctRawHistory(input: Pick<HistoryInput, "symbol" | "start" | "end"> & { timeframe: "1Min" | "1Day" },
    bars: readonly Candle[]): Promise<CorrectedRawHistory> {
    const { symbol, start, end } = input;
    const window = { symbol, start, end: end + 1 };
    const daily = input.timeframe === "1Day";
    const evidence = await this.readCorrectionEvidence(daily ? { ...window, daily: true, replayDaily: true } : window);
    if (!evidence) return { bars: [...bars] };
    return daily ? projectConfirmedRawDaily(bars, evidence, window) : projectConfirmedRawMinutes(bars, evidence, window);
  }

  async correctRawMinutes(input: Pick<HistoryInput, "symbol" | "start" | "end">, bars: readonly Candle[]) {
    return (await this.correctRawHistory({ ...input, timeframe: "1Min" }, bars)).bars;
  }

  private async correctRawIntervals(input: HistoryInput, bars: readonly Candle[], basisDate: string,
    allowPartial: boolean): Promise<CorrectedRawHistory> {
    const interval = 900;
    const evidence = await this.readCorrectionEvidence({
      symbol: input.symbol, start: input.start, end: Math.min(this.now() + 60_000, input.end + interval * 1_000),
    });
    if (!evidence?.rows.length) return { bars: [...bars] };
    const projected = new Map(bars.map(bar => [bar.time, bar]));
    const buckets = [...new Set(evidence.rows.map(row => Math.floor(row.minute / interval) * interval))].sort((a, b) => a - b);
    const times: number[] = [], pending: number[] = [];
    let budget = 16;
    for (const time of buckets) {
      if (time * 1_000 < input.start || time * 1_000 > input.end) continue;
      projected.delete(time);
      const bar = budget-- > 0 ? await projectConfirmedRawInterval(time, interval, evidence, async (start, end) => {
        const minutes = await this.rawHistory({ symbol: input.symbol, timeframe: "1Min", start, end: end - 1 }, allowPartial);
        return minutes.complete && minutes.basisDate === basisDate ? minutes.bars : null;
      }, this.now()) : undefined;
      if (bar === undefined) pending.push(time);
      else {
        times.push(time);
        if (bar) projected.set(time, bar);
      }
    }
    return { bars: [...projected.values()].sort((a, b) => a.time - b.time), corrections: correctionCoverage(times, pending) };
  }

  async rawHistory(input: Omit<HistoryInput,"adjustment">, allowPartial = false) {
    const key = JSON.stringify([easternClock(this.now()).date, input, allowPartial]), saved = this.cache.get(key);
    if (saved && this.now() - saved.at < 30_000) return saved.value;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const load = this.loadHistory(input, allowPartial).then(value => {
      if (value.complete) this.cache.set(key, { at: this.now(), value });
      while (this.cache.size > 64) this.cache.delete(this.cache.keys().next().value!);
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, load);
    return load;
  }

  private async loadHistory(input: HistoryInput, allowPartial: boolean) {
    const request = input;
    const basisDate = easternClock(this.now()).date, daily = input.timeframe === "1Day", bars = new Map<number, Candle>();
    const cursors = new Set<string>();
    const invalid = new Set<number>();
    const interval = input.timeframe === "15Min" ? 900 : 60;
    let nextTime: number | undefined, pageToken: string | undefined, complete = false;
    for (let page = 0; page < 128; page++) {
      const payload = await this.loader({ operation: "history", ...request, ...(nextTime ? { nextTime } : {}), ...(pageToken ? { pageToken } : {}) });
      const data = payload.data as { kline_list?: unknown; next_time?: unknown };
      if (!data || !Array.isArray(data.kline_list) || data.kline_list.length > MAX_HISTORY_RESPONSE_ROWS) throw Error("invalid_moomoo_history");
      for (const raw of data.kline_list) {
        try {
          const bar = moomooChartBar(raw, daily, interval);
          if (bar && bar.time * 1000 >= input.start && bar.time * 1000 <= input.end) bars.set(bar.time, bar);
        } catch (error) {
          if (!allowPartial || !raw || typeof raw !== "object" || !(error instanceof Error) || error.message !== "invalid_moomoo_candle") throw error;
          const time = candleStart(raw, daily, interval);
          if (time * 1000 >= input.start && time * 1000 <= input.end) invalid.add(time);
        }
      }
      const pagination = payload.pagination as { has_more?: unknown; next_page_token?: unknown } | undefined;
      const cursor = data.next_time;
      if (pagination?.has_more === false || (cursor === undefined || cursor === null || cursor === 0) && !pagination?.next_page_token) { complete = true; break; }
      if (Number.isSafeInteger(cursor) && Number(cursor) > 0) {
        if (Number(cursor) <= input.start) { complete = true; break; }
        nextTime = Number(cursor);
      } else if (!pagination?.next_page_token) throw Error("invalid_moomoo_cursor");
      const token = pagination?.next_page_token;
      if (token !== undefined && token !== null && (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token))) throw Error("invalid_moomoo_cursor");
      pageToken = token ? String(token) : undefined;
      const signature = JSON.stringify([nextTime, pageToken]);
      if (cursors.has(signature)) throw Error("repeated_moomoo_cursor");
      cursors.add(signature);
    }
    if (!complete) throw Error("moomoo_history_incomplete");
    const hasMissingCandle = [...invalid].some(time => !bars.has(time));
    const candles = [...bars.values()].sort((a, b) => a.time - b.time);
    if (easternClock(this.now()).date !== basisDate) throw Error("adjustment_basis_changed");
    return { symbol: input.symbol, feed: "moomoo" as const, basisDate, complete: !hasMissingCandle,
      nextPageToken: null, bars: candles };
  }

  async calendar(start: string, end: string): Promise<ChartCalendar> {
    const key = JSON.stringify([easternClock(this.now()).date, start, end]);
    const pending = this.calendarCache.get(key);
    if (pending) return pending;
    const load = this.loader({ operation: "calendar", start, end }).then(payload => {
      const sessions = moomooCalendarSessions(payload, start, end);
      return { available: true as const, start, end, sessions };
    }).catch(error => { this.calendarCache.delete(key); throw error; });
    this.calendarCache.set(key, load);
    while (this.calendarCache.size > 24) this.calendarCache.delete(this.calendarCache.keys().next().value!);
    return load;
  }

  async forYear(year: number): Promise<ChartCalendar> {
    if (!Number.isInteger(year) || year < 1970 || year > 9999) throw Error("invalid_calendar_year");
    return this.calendar(`${year}-01-01`, `${year}-12-31`);
  }

  async forHistory(bars: readonly Candle[]): Promise<ChartCalendar[]> {
    if (!bars.length) return [];
    const first = Number(moomooDate(bars[0].time * 1000).slice(0, 4));
    const last = Number(moomooDate(bars.at(-1)!.time * 1000).slice(0, 4));
    const result: ChartCalendar[] = [];
    for (let year = first; year <= last; year++) result.push(await this.forYear(year));
    return result;
  }

  async forBars(bars: readonly Candle[]): Promise<ChartCalendar> {
    if (!bars.length) return { available: false };
    return this.calendar(moomooDate(bars[0].time * 1000), moomooDate(bars.at(-1)!.time * 1000));
  }
}
