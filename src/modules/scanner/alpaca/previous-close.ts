import { alpacaCandle, chartSymbol } from "./candles";
import { easternClock } from "../live/sessions";
import type { AlpacaRestData } from "./rest-data";

export const PREVIOUS_CLOSE_TTL_MS = 5 * 60_000;
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
      return !cached || now - cached.at >= (cached.value ? PREVIOUS_CLOSE_TTL_MS : 10_000);
    });
    // Separate requests stay bounded; identical concurrent batches share one load.
    for (let offset = 0; offset < missing.length; offset += 200) {
      const batch = missing.slice(offset, offset + 200), key = JSON.stringify([date, batch]);
      let request = this.pending.get(key);
      if (!request) {
        if (this.pending.size >= 4) continue;
        request = this.load(batch, date, now).catch(() => {
          for (const symbol of batch) this.cache.set(`${date}:${symbol}`, { at: now, value: null });
        }).finally(() => this.pending.delete(key));
        this.pending.set(key, request);
      }
      await request;
    }
    while (this.cache.size > 5000) this.cache.delete(this.cache.keys().next().value!);
    return Object.fromEntries(wanted.map(symbol => [symbol, this.peek(symbol, date, Date.now())]));
  }

  private async load(symbols: readonly string[], date: string, now: number) {
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
    for (const symbol of symbols) {
      const value = invalid.has(symbol) ? undefined : latest.get(symbol);
      this.cache.set(`${date}:${symbol}`, { at: now, value: value ? {
        symbol, ...value, adjustment: "split", basisDate: date, fetchedAt: now,
      } : null });
    }
  }
}
