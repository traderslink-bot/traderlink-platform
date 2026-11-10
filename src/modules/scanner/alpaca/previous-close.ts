import { alpacaCandle, chartSymbol } from "./candles";
import { easternClock } from "../live/sessions";
import type { AlpacaRestData } from "./rest-data";

export const PREVIOUS_CLOSE_TTL_MS = 5 * 60_000;
const PREVIOUS_CLOSE_REFRESH_MS = PREVIOUS_CLOSE_TTL_MS - 120_000;
const PREVIOUS_CLOSE_RETRY_MS = 10_000;
export type SplitAdjustedPreviousClose = Readonly<{
  symbol: string; price: number; barAt: number; adjustment: "split"; basisDate: string; fetchedAt: number;
}>;

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
  private queue: Array<{ symbols: readonly string[]; date: string; finish: () => void }> = [];
  private workers = 0;
  constructor(private readonly rest: Pick<AlpacaRestData, "get">) {}

  peek(symbol: string, date: string, now = Date.now()): SplitAdjustedPreviousClose | null {
    const cached = this.cache.get(`${date}:${symbol}`);
    return cached && usablePreviousClose(cached.value, symbol, date, now) ? cached.value : null;
  }

  async read(symbols: readonly string[], date: string, now = Date.now()): Promise<Record<string, SplitAdjustedPreviousClose | null>> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(now) || easternClock(now).date !== date) throw Error("invalid_previous_close_date");
    const wanted = [...new Set(symbols.map(chartSymbol))].sort();
    if (wanted.length > 4000) throw Error("invalid_symbol");
    const missing = wanted.filter(symbol => {
      const cached = this.cache.get(`${date}:${symbol}`);
      if (!cached) return true;
      if (now - cached.at < PREVIOUS_CLOSE_RETRY_MS) return false;
      return !usablePreviousClose(cached.value, symbol, date, now)
        || now - cached.value.fetchedAt >= PREVIOUS_CLOSE_REFRESH_MS;
    });
    const waiting = new Set<Promise<void>>();
    const unscheduled: string[] = [];
    for (const symbol of missing) {
      const existing = this.pending.get(`${date}:${symbol}`);
      if (existing) waiting.add(existing);
      else unscheduled.push(symbol);
    }
    // Small provider batches avoid slow 200-symbol calls. Queue every symbol,
    // share overlapping renewals and bound active provider work to four loads.
    for (let offset = 0; offset < unscheduled.length; offset += 50) {
      const batch = unscheduled.slice(offset, offset + 50);
      let finish!: () => void;
      const operation = new Promise<void>(resolve => { finish = resolve; });
      for (const symbol of batch) this.pending.set(`${date}:${symbol}`, operation);
      this.queue.push({ symbols: batch, date, finish });
      waiting.add(operation);
    }
    this.pump();
    await Promise.all(waiting);
    while (this.cache.size > 5000) this.cache.delete(this.cache.keys().next().value!);
    return Object.fromEntries(wanted.map(symbol => [symbol, this.peek(symbol, date, Date.now())]));
  }

  private pump(): void {
    while (this.workers < 4 && this.queue.length) {
      const task = this.queue.shift()!;
      this.workers++;
      void this.load(task.symbols, task.date).catch(() => {
        const failedAt = Date.now();
        for (const symbol of task.symbols) {
          const key = `${task.date}:${symbol}`, cached = this.cache.get(key);
          this.cache.set(key, { at: failedAt,
            value: usablePreviousClose(cached?.value, symbol, task.date, failedAt) ? cached!.value : null });
        }
      }).finally(() => {
        for (const symbol of task.symbols) this.pending.delete(`${task.date}:${symbol}`);
        this.workers--; task.finish(); this.pump();
      });
    }
  }

  private async load(symbols: readonly string[], date: string) {
    const end = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(end)) throw Error("invalid_previous_close_date");
    const latest = new Map<string, { price: number; barAt: number }>();
    const invalid = new Set<string>();
    let token: string | null = null, complete = false;
    const tokens = new Set<string>();
    for (let page = 0; page < 20; page++) {
      const query = new URLSearchParams({ symbols: symbols.join(","), timeframe: "1Day", feed: "sip", adjustment: "split",
        start: new Date(end - 14 * 86_400_000).toISOString(), end: new Date(end).toISOString(), sort: "desc", limit: "10000" });
      if (token) query.set("page_token", token);
      const result = await this.rest.get("/v2/stocks/bars", query) as { bars?: Record<string, unknown[]>; next_page_token?: unknown };
      if (!result.bars || typeof result.bars !== "object" || Array.isArray(result.bars)) throw Error("invalid_previous_close_history");
      for (const symbol of symbols) {
        const bars = result.bars[symbol] ?? [];
        if (!Array.isArray(bars)) { invalid.add(symbol); continue; }
        for (const raw of bars) {
          const bar = alpacaCandle(raw);
          if (!bar || bar.close <= 0) { invalid.add(symbol); continue; }
          const barAt = bar.time * 1000;
          if (barAt < end - 14 * 86_400_000 || barAt > end || easternClock(barAt).date >= date) continue;
          const previous = latest.get(symbol);
          if (previous?.barAt === barAt && previous.price !== bar.close) { invalid.add(symbol); continue; }
          if (!previous || barAt > previous.barAt) latest.set(symbol, { price: bar.close, barAt });
        }
      }
      if (result.next_page_token !== null && result.next_page_token !== undefined && typeof result.next_page_token !== "string") throw Error("invalid_previous_close_history");
      token = typeof result.next_page_token === "string" && result.next_page_token ? result.next_page_token : null;
      if (!token) { complete = true; break; }
      if (tokens.has(token)) throw Error("invalid_previous_close_history");
      tokens.add(token);
    }
    if (!complete) throw Error("incomplete_previous_close_history");
    const publishedAt = Date.now();
    if (easternClock(publishedAt).date !== date) throw Error("previous_close_basis_changed");
    for (const symbol of symbols) {
      const value = invalid.has(symbol) ? undefined : latest.get(symbol);
      this.cache.set(`${date}:${symbol}`, { at: publishedAt, value: value ? {
        symbol, ...value, adjustment: "split", basisDate: date, fetchedAt: publishedAt,
      } : null });
    }
  }
}
