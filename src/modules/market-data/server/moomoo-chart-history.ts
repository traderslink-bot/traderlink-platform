import "server-only";

import { moomooCalendarSessions } from "../moomoo-calendar";
import { requestMoomooMarketData, moomooDate, type MoomooDataRequest } from "./moomoo-bridge";
import { easternDayStart, type Candle } from "@/src/modules/scanner/alpaca/candles";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import type { ChartCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { VwapCorporateEvents, VwapCorporateAnchor } from "@/src/modules/scanner/alpaca/chart-vwap-events";

type HistoryInput = { symbol: string; timeframe: "1Min" | "1Day"; start: number; end: number; adjustment?: "raw" | "split" };
type Loader = (request: MoomooDataRequest) => Promise<Record<string, unknown>>;
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

export function moomooChartBar(raw: unknown, daily: boolean): Candle | null {
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
  // Moomoo's native minute history is end-labelled. The shared chart uses starts.
  const tradingDate = typeof row.date === "number" && /^\d{8}$/.test(String(row.date)) ? String(row.date).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3") : null;
  const time = daily ? easternDayStart(tradingDate ? Date.parse(tradingDate + "T12:00:00Z") / 1000 : Number(timestamp) / 1000) : Number(timestamp) / 1000 - 60;
  if (!Number.isSafeInteger(time)) throw Error("invalid_moomoo_candle");
  return { time, open, high, low, close, volume };
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
  private calendarCache = new Map<string, Promise<ChartCalendar>>();
  private events = new Map<string, { at: number; payload: Record<string, unknown> }>();
  constructor(private readonly loader: Loader = request => requestMoomooMarketData(request), private readonly now: () => number = Date.now) {}

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

  async history(input: HistoryInput) {
    const key = JSON.stringify([easternClock(this.now()).date, input]), saved = this.cache.get(key);
    if (saved && this.now() - saved.at < 30_000) return saved.value;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const load = this.loadHistory(input).then(value => {
      this.cache.set(key, { at: this.now(), value });
      while (this.cache.size > 64) this.cache.delete(this.cache.keys().next().value!);
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, load);
    return load;
  }

  private async loadHistory(input: HistoryInput) {
    const { adjustment = "split", ...request } = input;
    const basisDate = easternClock(this.now()).date, daily = input.timeframe === "1Day", bars = new Map<number, Candle>();
    const cursors = new Set<string>();
    let nextTime: number | undefined, pageToken: string | undefined, complete = false;
    for (let page = 0; page < 128; page++) {
      const payload = await this.loader({ operation: "history", ...request, ...(nextTime ? { nextTime } : {}), ...(pageToken ? { pageToken } : {}) });
      const data = payload.data as { kline_list?: unknown; next_time?: unknown };
      if (!data || !Array.isArray(data.kline_list) || data.kline_list.length > 370) throw Error("invalid_moomoo_history");
      for (const raw of data.kline_list) {
        const bar = moomooChartBar(raw, daily);
        if (bar && bar.time * 1000 >= input.start && bar.time * 1000 <= input.end) bars.set(bar.time, bar);
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
    const candles = [...bars.values()].sort((a, b) => a.time - b.time);
    const splits = adjustment === "split" ? moomooSplits(await this.corporateActions(input.symbol)) : [];
    if (easternClock(this.now()).date !== basisDate) throw Error("adjustment_basis_changed");
    return { symbol: input.symbol, feed: "moomoo" as const, adjustment, basisDate, complete: true,
      nextPageToken: null, bars: adjustment === "raw" ? candles : adjustMoomooBars(candles, splits, basisDate) };
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
