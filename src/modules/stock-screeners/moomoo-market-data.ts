import { calendarDate } from "../scanner/alpaca/chart-calendar";
import { easternDayStart } from "../scanner/alpaca/candles";
import { easternClock } from "../scanner/live/sessions";
import { isObject, tickerPattern } from "./contracts";
import type { MoomooScreenerOperation } from "./provider-transport";

type Read = (operation: MoomooScreenerOperation) => Promise<unknown>;
type Split = { date: string; ratio: number };
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

function splits(payload: unknown, basisDate: string): Split[] {
  if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.rehabs))
    throw Error("moomoo_split_history_unavailable");
  const result: Split[] = [];
  const dates = new Set<string>();
  for (const event of payload.data.rehabs) {
    if (!isObject(event) || !calendarDate(event.ex_div_date) || !Array.isArray(event.action_types))
      throw Error("moomoo_split_history_invalid");
    if (event.ex_div_date > basisDate || !event.action_types.some(type => type === "SPLIT" || type === "JOIN")) continue;
    if (!positive(event.split_ratio) || dates.has(event.ex_div_date)) throw Error("moomoo_split_history_invalid");
    dates.add(event.ex_div_date);
    result.push({ date: event.ex_div_date, ratio: event.split_ratio });
  }
  return result;
}

function normalizeBar(value: unknown, adjustment: readonly Split[], daily: boolean, precision: number, intervalMs = 0) {
  if (!isObject(value) || !Number.isSafeInteger(value.time_key) || Number(value.time_key) <= 0
    || Number(value.time_key) % 1_000 !== 0 || ![value.open, value.high, value.low, value.close].every(positive)
    || typeof value.volume !== "number" || !Number.isFinite(value.volume) || value.volume < 0
    || typeof value.turnover !== "number" || !Number.isFinite(value.turnover) || value.turnover < 0)
    throw Error("moomoo_bar_invalid");
  let time = Number(value.time_key) - (daily ? 0 : intervalMs);
  if (daily && value.date !== undefined) {
    const date = String(value.date).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    if (!calendarDate(date)) throw Error("moomoo_bar_invalid");
    time = Date.parse(date + "T12:00:00Z");
  }
  const date = easternClock(time).date;
  const factor = adjustment.filter(split => split.date > date).reduce((ratio, split) => ratio * split.ratio, 1);
  const volume = value.volume / 10 ** precision / factor;
  const prices = [value.open, value.high, value.low, value.close] as number[];
  const [open, high, low, close] = prices.map(price => price * factor);
  if (!positive(factor) || !Number.isFinite(volume) || high < Math.max(open, close) || low > Math.min(open, close) || low > high)
    throw Error("moomoo_bar_invalid");
  return {
    t: new Date(daily ? easternDayStart(time / 1_000) * 1_000 : time).toISOString(),
    o: open, h: high, l: low, c: close, v: volume,
    ...(volume > 0 && value.turnover > 0 ? { vw: value.turnover / volume } : {}),
  };
}

/** Normalize provider pages into the collector's bar/quote input contract. */
export class MoomooScreenerData {
  private readonly adjustments = new Map<string, Promise<Split[]>>();
  constructor(private readonly read: Read, private readonly basisDate: string) {}

  private adjustment(symbol: string) {
    let pending = this.adjustments.get(symbol);
    if (!pending) {
      pending = this.read({ operation: "rehab", symbol }).then(value => splits(value, this.basisDate));
      this.adjustments.set(symbol, pending);
      pending.catch(() => { this.adjustments.delete(symbol); });
    }
    return pending;
  }

  private async history(symbol: string, timeframe: "1Day" | "5Min" | "15Min", start: number, end: number) {
    const adjustment = await this.adjustment(symbol);
    const bars = new Map<string, ReturnType<typeof normalizeBar>>();
    const cursors = new Set<string>();
    let nextTime: number | undefined;
    let pageToken: string | undefined;
    for (let page = 0; page < 160; page++) {
      const payload = await this.read({ operation: "history", symbol, timeframe, start, end, nextTime, pageToken });
      if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.kline_list))
        throw Error("moomoo_history_unavailable");
      const precision = payload.data.volume_precision ?? 0;
      if (!Number.isSafeInteger(precision) || Number(precision) < 0 || Number(precision) > 9) throw Error("moomoo_bar_invalid");
      let earliest = Infinity;
      for (const raw of payload.data.kline_list) {
        if (isObject(raw) && typeof raw.time_key === "number" && raw.time_key > Date.now()
          && [raw.open, raw.high, raw.low, raw.close, raw.volume, raw.turnover].every(value => value === undefined || value === null)) continue;
        // Native history labels intraday candles by their end; Screeners' shared
        // buckets and exclusive cutoffs use starts, as the chart adapter does.
        const bar = normalizeBar(raw, adjustment, timeframe === "1Day", Number(precision), timeframe === "15Min" ? 900_000 : 300_000);
        const at = Date.parse(bar.t);
        earliest = Math.min(earliest, at);
        if (at < start || at > end) continue;
        const prior = bars.get(bar.t);
        if (prior && JSON.stringify(prior) !== JSON.stringify(bar)) throw Error("moomoo_history_conflict");
        bars.set(bar.t, bar);
      }
      const pagination = isObject(payload.pagination) ? payload.pagination : {};
      if (pagination.has_more !== true || earliest <= start) return [...bars.values()];
      if (!payload.data.kline_list.length) throw Error("moomoo_history_incomplete");
      const cursor = payload.data.next_time;
      const token = pagination.next_page_token;
      if (!Number.isSafeInteger(cursor) || Number(cursor) <= 0 || (nextTime !== undefined && Number(cursor) >= nextTime)
        || (token !== undefined && (typeof token !== "string" || !/^[a-f0-9]{48}$/.test(token))))
        throw Error("moomoo_history_pagination_invalid");
      const signature = String(cursor) + "/" + (token ?? "");
      if (cursors.has(signature)) throw Error("moomoo_history_pagination_invalid");
      cursors.add(signature);
      nextTime = Number(cursor);
      pageToken = token as string | undefined;
    }
    throw Error("moomoo_history_incomplete");
  }

  async get(path: string, params: URLSearchParams): Promise<unknown> {
    const symbols = (params.get("symbols") ?? "").split(",");
    if (!symbols.length || symbols.length > 100 || symbols.some(symbol => !tickerPattern.test(symbol))) throw Error("moomoo_request_invalid");
    if (path === "/v2/stocks/snapshots") {
      const payload = await this.read({ operation: "snapshots", symbols });
      if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.snapshot_list))
        throw Error("moomoo_quotes_unavailable");
      const quotes: Record<string, unknown> = {};
      for (const value of payload.data.snapshot_list) {
        if (!isObject(value) || typeof value.code !== "string" || !value.code.startsWith("US.")) continue;
        const symbol = value.code.slice(3);
        if (!symbols.includes(symbol) || !positive(value.bid_price) || !positive(value.ask_price)
          || !Number.isSafeInteger(value.update_time) || Number(value.update_time) <= 0) continue;
        quotes[symbol] = { latestQuote: { bp: value.bid_price, ap: value.ask_price, t: new Date(Number(value.update_time)).toISOString() } };
      }
      return quotes;
    }
    const timeframe = params.get("timeframe");
    const start = Date.parse(params.get("start") ?? ""), end = Date.parse(params.get("end") ?? "");
    if (path !== "/v2/stocks/bars" || !["1Day", "5Min", "15Min"].includes(timeframe ?? "")
      || !Number.isFinite(start) || !Number.isFinite(end) || start > end) throw Error("moomoo_request_invalid");
    const bars: Record<string, unknown[]> = {};
    for (const symbol of symbols) {
      try {
        bars[symbol] = await this.history(symbol, timeframe as "1Day" | "5Min" | "15Min", start, end);
      } catch (error) {
        if (error instanceof Error && error.message === "screener_provider_changed") throw error;
        // An invalid symbol remains visible as missing metrics while valid peers are retained.
        bars[symbol] = [{}];
      }
    }
    return { bars, next_page_token: null };
  }
}
