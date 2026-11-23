import { alpacaCandle, chartSymbol, easternDayStart, type Candle } from "./candles";
import { easternClock } from "../live/sessions";
import type { AlpacaRestData } from "./rest-data";
import type { AlpacaChartCalendar } from "./chart-calendar-provider";
import { SCANNER_BENCHMARK, SCANNER_DAILY_HISTORY_DAYS, relativeToScannerBenchmark, scannerDailyStatistics,
  type ScannerDailyStatistics } from "./scanner-daily-statistics";

export const PREVIOUS_CLOSE_TTL_MS = 5 * 60_000;
const PREVIOUS_CLOSE_REFRESH_MS = PREVIOUS_CLOSE_TTL_MS - 120_000;
const PREVIOUS_CLOSE_RETRY_MS = 10_000;
export type SplitAdjustedPreviousClose = Readonly<{
  statistics?: ScannerDailyStatistics;
  symbol: string; price: number; high?: number; low?: number; barAt: number; adjustment: "split"; basisDate: string; fetchedAt: number;
}>;
type ArchivedDaily = {
  read: (symbol: string, start: number, end: number) => {
    bars: readonly Candle[];
    missing: Readonly<{ start: number; end: number }> | null;
  } | null;
  remember: (date: string, start: number, end: number, entries: readonly { symbol: string; bars: Candle[] }[]) => void;
};
type DailyReadRequest = { symbol: string; finish: () => void };
type DailyRead = DailyReadRequest & { bars: readonly Candle[]; archived: boolean };
type DailyRange = Readonly<{ start: number; end: number }>;
type DailyReadBatch = { entries: readonly DailyRead[]; missing: DailyRange | null; date: string; firstYear: number };
const DAILY_READ_BATCH_SIZE = 50;
const DAILY_ARCHIVE_YIELD_INTERVAL = 128;

export function usablePreviousClose(value: unknown, symbol: string, date: string, now: number): value is SplitAdjustedPreviousClose {
  if (!value || typeof value !== "object") return false;
  const row = value as SplitAdjustedPreviousClose;
  return row.symbol === symbol && row.adjustment === "split" && row.basisDate === date
    && Number.isFinite(row.price) && row.price > 0 && Number.isSafeInteger(row.barAt) && row.barAt > 0
    && easternClock(row.barAt).date < date && Number.isSafeInteger(row.fetchedAt)
    && row.fetchedAt <= now + 5_000 && now - row.fetchedAt < PREVIOUS_CLOSE_TTL_MS;
}

/** Provider-adjusted reference only: never multiply a live trade or re-adjust historical bars. */
export class AlpacaPreviousCloseBook {
  private cache = new Map<string, { at: number; value: SplitAdjustedPreviousClose | null }>();
  private pending = new Map<string, Promise<void>>();
  private queue: DailyReadBatch[] = [];
  private workers = 0;
  constructor(private readonly rest: Pick<AlpacaRestData, "get">,
    private readonly calendar?: Pick<AlpacaChartCalendar, "forYear">,
    private readonly archive?: ArchivedDaily) {}

  peek(symbol: string, date: string, now = Date.now()): SplitAdjustedPreviousClose | null {
    const cached = this.cache.get(`${date}:${symbol}`);
    if (!cached || !usablePreviousClose(cached.value, symbol, date, now)) return null;
    const value = cached.value;
    const benchmark = this.cache.get(`${date}:${SCANNER_BENCHMARK}`)?.value;
    if (!value.statistics || !usablePreviousClose(benchmark, SCANNER_BENCHMARK, date, now)) return value;
    return { ...value, statistics: {
      ...value.statistics,
      dailyRelativeToSpy: relativeToScannerBenchmark(value.statistics.daily, benchmark.statistics?.daily),
      weeklyRelativeToSpy: relativeToScannerBenchmark(value.statistics.weekly, benchmark.statistics?.weekly),
    } };
  }

  async read(symbols: readonly string[], date: string, now = Date.now()): Promise<Record<string, SplitAdjustedPreviousClose | null>> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(now) || easternClock(now).date !== date) throw Error("invalid_previous_close_date");
    const wanted = [...new Set(symbols.map(chartSymbol))].sort();
    if (wanted.length > 4000) throw Error("invalid_symbol");
    if (!wanted.length) return {};
    const contextSymbols = this.calendar ? [...new Set([...wanted, SCANNER_BENCHMARK])].sort() : wanted;
    const missing = contextSymbols.filter(symbol => {
      const cached = this.cache.get(`${date}:${symbol}`);
      if (!cached) return true;
      if (now - cached.at < PREVIOUS_CLOSE_RETRY_MS) return false;
      return !usablePreviousClose(cached.value, symbol, date, now)
        || now - cached.value.fetchedAt >= PREVIOUS_CLOSE_REFRESH_MS;
    });
    const waiting = new Set<Promise<void>>();
    const unscheduled: DailyReadRequest[] = [];
    for (const symbol of missing) {
      const key = `${date}:${symbol}`;
      let operation = this.pending.get(key);
      if (!operation) {
        let finish!: () => void;
        operation = new Promise<void>(resolve => { finish = resolve; });
        this.pending.set(key, operation);
        unscheduled.push({ symbol, finish });
      }
      waiting.add(operation);
    }
    if (unscheduled.length) {
      void this.enqueue(unscheduled, date).catch(() => {
        this.retainUsableCloses(unscheduled, date);
        this.finish(unscheduled, date);
      });
    }
    await Promise.all(waiting);
    while (this.cache.size > 5000) this.cache.delete(this.cache.keys().next().value!);
    return Object.fromEntries(wanted.map(symbol => [symbol, this.peek(symbol, date, Date.now())]));
  }

  private async enqueue(requests: readonly DailyReadRequest[], date: string) {
    const noon = Date.parse(`${date}T12:00:00Z`) / 1_000;
    if (!Number.isFinite(noon)) throw Error("invalid_previous_close_date");
    const end = easternDayStart(noon);
    const start = easternDayStart(noon - (this.calendar ? SCANNER_DAILY_HISTORY_DAYS : 14) * 86_400);
    const firstYear = new Date(start * 1_000).getUTCFullYear();
    const full = { start, end };
    const groups = new Map<string, { entries: DailyRead[]; missing: DailyRange | null }>();
    for (const [index, request] of requests.entries()) {
      // Large SQLite reads must leave time for the gateway's live feed.
      if (this.archive && index && index % DAILY_ARCHIVE_YIELD_INTERVAL === 0) {
        await new Promise<void>(resolve => setImmediate(resolve));
        if (easternClock(Date.now()).date !== date) throw Error("previous_close_basis_changed");
      }
      let saved: ReturnType<ArchivedDaily["read"]> | undefined;
      try { saved = this.archive?.read(request.symbol, start, end); }
      catch { /* A local archive miss can still use the ordinary adjusted provider read. */ }
      const missing = saved ? saved.missing : full;
      const key = missing ? `${missing.start}:${missing.end}` : "ready";
      const group = groups.get(key) ?? { entries: [], missing };
      group.entries.push({ ...request, bars: saved?.bars ?? [], archived: Boolean(saved) });
      groups.set(key, group);
    }
    // Group matching windows before splitting into provider batches. This sends the
    // same uncovered ranges even when neighboring tickers have different coverage.
    const windows = [...groups.values()].sort((a, b) => Number(!!a.missing) - Number(!!b.missing));
    for (const { entries, missing } of windows) {
      for (let offset = 0; offset < entries.length; offset += DAILY_READ_BATCH_SIZE) {
        this.queue.push({ entries: entries.slice(offset, offset + DAILY_READ_BATCH_SIZE), missing, date, firstYear });
      }
    }
    this.pump();
  }

  private retainUsableCloses(requests: readonly DailyReadRequest[], date: string) {
    const failedAt = Date.now();
    for (const { symbol } of requests) {
      const key = `${date}:${symbol}`, cached = this.cache.get(key);
      this.cache.set(key, { at: failedAt,
        value: usablePreviousClose(cached?.value, symbol, date, failedAt) ? cached!.value : null });
    }
  }

  private finish(requests: readonly DailyReadRequest[], date: string) {
    for (const { symbol, finish } of requests) {
      this.pending.delete(`${date}:${symbol}`);
      finish();
    }
  }

  private pump(): void {
    while (this.workers < 4 && this.queue.length) {
      const task = this.queue.shift()!;
      this.workers++;
      void this.load(task).catch(() => this.retainUsableCloses(task.entries, task.date)).finally(() => {
        this.workers--;
        this.finish(task.entries, task.date);
        this.pump();
      });
    }
  }

  private async load({ entries, missing, date, firstYear }: DailyReadBatch) {
    if (easternClock(Date.now()).date !== date) throw Error("previous_close_basis_changed");
    const year = Number(date.slice(0, 4));
    const calendars = this.calendar ? Promise.all(
      [...new Set([firstYear, year])].map(value => this.calendar!.forYear(value)),
    ).catch(() => []) : Promise.resolve([]);
    const series = new Map<string, Map<string, Candle>>();
    const conflictingBars = new Map<string, Set<string>>();
    const latest = new Map<string, { price: number; high?: number; low?: number; barAt: number }>();
    const invalid = new Set<string>();
    const add = (symbol: string, bar: Candle) => {
      const barAt = bar.time * 1_000;
      const barDate = easternClock(barAt).date;
      if (this.calendar) {
        const list = series.get(symbol) ?? new Map<string, Candle>();
        const conflicting = conflictingBars.get(symbol) ?? new Set<string>();
        const prior = list.get(barDate);
        if (prior && (prior.time !== bar.time || prior.open !== bar.open || prior.close !== bar.close ||
          prior.high !== bar.high || prior.low !== bar.low || prior.volume !== bar.volume)) {
          conflicting.add(barDate);
          conflictingBars.set(symbol, conflicting);
          list.delete(barDate);
        } else if (!conflicting.has(barDate)) list.set(barDate, bar);
        series.set(symbol, list);
      }
      const previous = latest.get(symbol);
      if (previous?.barAt === barAt) {
        if (previous.price !== bar.close) invalid.add(symbol);
        else if (previous.high !== bar.high || previous.low !== bar.low) latest.set(symbol, { price: bar.close, barAt });
      } else if (!previous || barAt > previous.barAt) {
        latest.set(symbol, { price: bar.close, high: bar.high, low: bar.low, barAt });
      }
    };
    for (const { symbol, bars } of entries) for (const bar of bars) add(symbol, bar);
    if (missing) {
      const group = entries.map(({ symbol }) => symbol);
      const from = missing.start * 1_000, to = missing.end * 1_000;
      const fetched = new Map(group.map(symbol => [symbol, new Map<number, Candle>()]));
      await this.readPages(group, from, to, (symbol, raw) => {
        const bar = alpacaCandle(raw);
        if (!bar || bar.close <= 0) { invalid.add(symbol); return; }
        if (bar.time * 1_000 < from || bar.time * 1_000 >= to) return;
        add(symbol, bar);
        fetched.get(symbol)!.set(bar.time, bar);
      }, symbol => invalid.add(symbol));
      if (this.archive && easternClock(Date.now()).date === date) {
        const entries = group.filter(symbol => !invalid.has(symbol) && !conflictingBars.has(symbol))
          .map(symbol => ({ symbol, bars: [...fetched.get(symbol)!.values()] }));
        this.archive.remember(date, from / 1_000, to / 1_000, entries);
      }
    }
    const sessionCalendars = await calendars;
    const publishedAt = Date.now();
    if (easternClock(publishedAt).date !== date) throw Error("previous_close_basis_changed");
    for (const { symbol, archived } of entries) {
      const value = invalid.has(symbol) ? undefined : latest.get(symbol);
      const quiet = archived ? (day: string) => {
        if (conflictingBars.get(symbol)?.has(day)) return false;
        if (!missing) return true;
        const start = easternDayStart(Date.parse(day + "T12:00:00Z") / 1_000);
        return start < missing.start || start >= missing.end;
      } : undefined;
      this.cache.set(`${date}:${symbol}`, { at: publishedAt, value: value ? {
        symbol, ...value, adjustment: "split", basisDate: date, fetchedAt: publishedAt,
        ...(series.has(symbol) ? { statistics: scannerDailyStatistics(date, series.get(symbol)!, sessionCalendars, quiet) } : {}),
      } : null });
    }
  }

  private async readPages(symbols: readonly string[], start: number, end: number,
    add: (symbol: string, raw: unknown) => void, invalidate: (symbol: string) => void) {
    const query = new URLSearchParams({ symbols: symbols.join(","), timeframe: "1Day", feed: "sip", adjustment: "split",
      start: new Date(start).toISOString(), end: new Date(end - 1).toISOString(), sort: "desc", limit: "10000" });
    const tokens = new Set<string>();
    for (let page = 0; page < 20; page++) {
      const result = await this.rest.get("/v2/stocks/bars", query) as {
        bars?: Record<string, unknown[]>; next_page_token?: unknown;
      };
      if (!result.bars || typeof result.bars !== "object" || Array.isArray(result.bars)) throw Error("invalid_previous_close_history");
      for (const symbol of symbols) {
        const bars = result.bars[symbol] ?? [];
        if (!Array.isArray(bars)) { invalidate(symbol); continue; }
        for (const raw of bars) add(symbol, raw);
      }
      const next = result.next_page_token;
      if (next === null || next === undefined || next === "") return;
      if (typeof next !== "string" || tokens.has(next)) throw Error("invalid_previous_close_history");
      tokens.add(next);
      query.set("page_token", next);
    }
    throw Error("incomplete_previous_close_history");
  }
}
