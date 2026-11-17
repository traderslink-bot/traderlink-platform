import { parseCalendarSessions } from "../scanner/alpaca/chart-calendar";
import { easternDayStart } from "../scanner/alpaca/candles";
import { easternClock } from "../scanner/live/sessions";
import { isObject, MAX_LISTINGS, type Candidate, type Listing, type MarketPack, type MarketSession, type Snapshot } from "./contracts";
import { decodeBar, marketWindows, sessionBounds, sessionMetrics, type ProviderBar } from "./market-metrics";
import { relativeVolumeAtTime, relativeVolumeHistory, relativeVolumeSchedule } from "./relative-volume";

type Data = { get(path: string, params: URLSearchParams): Promise<unknown> };
const DAY = 86_400_000;
const BATCH_SIZE = 100;
type SymbolData<T> = { grouped: Map<string, T>; rejected: Set<string> };
type Bars = SymbolData<Map<number, ProviderBar>>;
type IntradayBatch = { start: number; end: number; bars: Bars };
export type BarCache = {
  provider?: string;
  key: string; daily: Map<string, Bars>; intraday: Map<string, IntradayBatch>;
  intradayBasisDate?: string;
  relativeVolume?: { key: string; series: Map<string, SymbolData<Float64Array>> };
};

export async function loadBars(data: Data, symbols: string[], timeframe: "1Day" | "5Min" | "15Min", start: number, end: number, asOf: string): Promise<Bars> {
  const grouped = new Map<string, Map<number, ProviderBar>>();
  const rejected = new Set<string>();
  if (!symbols.length || end < start) return { grouped, rejected };
  const requested = new Set(symbols);
  const params = new URLSearchParams({
    feed: "sip", symbols: symbols.join(","), timeframe, start: new Date(start).toISOString(),
    end: new Date(end).toISOString(), adjustment: "split", limit: "10000", asof: asOf,
  });
  const tokens = new Set<string>();
  for (let page = 0; page < 25; page++) {
    const payload = await data.get("/v2/stocks/bars", params);
    if (!isObject(payload) || !isObject(payload.bars)) throw Error("bars_unavailable");
    for (const [symbol, rows] of Object.entries(payload.bars)) {
      if (!requested.has(symbol) || !Array.isArray(rows)) throw Error("bars_invalid");
      const bars = grouped.get(symbol) ?? new Map<number, ProviderBar>();
      grouped.set(symbol, bars);
      for (const value of rows) {
        const bar = decodeBar(value);
        if (!bar) {
          rejected.add(symbol);
          continue;
        }
        if (bar.time * 1000 < start || bar.time * 1000 > end) continue;
        if (bars.has(bar.time)) throw Error("bars_duplicate");
        bars.set(bar.time, bar);
      }
    }
    const token = payload.next_page_token;
    if (!token && (token === null || token === undefined || token === "")) return { grouped, rejected };
    if (typeof token !== "string" || tokens.has(token)) throw Error("bars_pagination_invalid");
    tokens.add(token);
    params.set("page_token", token);
  }
  throw Error("bars_pagination_incomplete");
}

async function readHistory<T>(
  symbols: string[], previous: SymbolData<T> | undefined, fetch: (requested: string[]) => Promise<Bars>,
  group: (bars: Bars) => Map<string, T>,
): Promise<SymbolData<T> | null> {
  if (previous && !previous.rejected.size) return previous;
  const requested = previous ? [...previous.rejected] : symbols;
  const response = await fetch(requested).catch(() => null);
  if (!response) return previous ?? null;
  const observed = group(response);
  if (!previous) return { grouped: observed, rejected: response.rejected };
  const grouped = new Map(previous.grouped);
  for (const symbol of requested) {
    const recovered = observed.get(symbol);
    if (recovered !== undefined) grouped.set(symbol, recovered);
    else if (!response.rejected.has(symbol)) grouped.delete(symbol);
  }
  return { grouped, rejected: response.rejected };
}

async function refreshIntraday(
  symbols: string[], previous: IntradayBatch | undefined, minimum: number, maximum: number,
  fetch: (requested: string[], start: number) => Promise<Bars>,
): Promise<Bars | null> {
  if (!previous) return fetch(symbols, minimum).catch(() => null);
  const prior = previous.bars;
  const sameCutoff = previous.end === maximum;
  if (sameCutoff && !prior.rejected.size && previous.start === minimum) return prior;
  const healthy = symbols.filter(symbol => !prior.rejected.has(symbol));
  const refreshFrom = sameCutoff ? maximum + 1 : Math.max(minimum, previous.end + 1 - 15 * 60_000);
  const tail = await fetch(healthy, refreshFrom).catch(() => null);
  if (!tail) return null;
  const repair = prior.rejected.size ? await fetch([...prior.rejected], minimum).catch(() => null) : null;
  const grouped: Bars["grouped"] = new Map();
  for (const symbol of healthy) {
    const bars = new Map(tail.grouped.get(symbol));
    for (const [time, bar] of prior.grouped.get(symbol) ?? []) {
      if (time * 1000 >= minimum && time * 1000 < refreshFrom) bars.set(time, bar);
    }
    if (bars.size) grouped.set(symbol, bars);
  }
  for (const symbol of prior.rejected) {
    const bars = repair?.grouped.get(symbol) ?? (!repair ? prior.grouped.get(symbol) : undefined);
    if (bars) grouped.set(symbol, bars);
  }
  return { grouped, rejected: new Set([...tail.rejected, ...(repair?.rejected ?? prior.rejected)]) };
}

export async function collectMarketPack(input: {
  data: Data; calendar: unknown; stocks: readonly Listing[]; universeDate: string; now: number;
  clock?: () => number;
  cache?: BarCache;
  partialCaps?: boolean;
  onBatch?: (count: number) => void;
  source?: "Alpaca SIP" | "Moomoo";
}): Promise<MarketPack> {
  const { data, now, universeDate } = input;
  const calendarStart = new Date(now - 540 * DAY).toISOString().slice(0, 10);
  const calendarEnd = new Date(now + 3 * DAY).toISOString().slice(0, 10);
  const days = parseCalendarSessions(input.calendar, calendarStart, calendarEnd);
  if (days.length < 300) throw Error("calendar_incomplete");
  const { latest, windows } = marketWindows(days, now);
  const entries = Object.entries(windows) as [MarketSession, typeof windows[MarketSession]][];
  const stocks = input.stocks;
  if (!stocks.length || stocks.length > MAX_LISTINGS || new Set(stocks.map(stock => stock.symbol)).size !== stocks.length) throw Error("universe_unavailable");
  const asOfDate = easternClock(now).date;
  const dayEnd = easternDayStart(Date.parse(windows.last_regular.date + "T12:00:00Z") / 1000) * 1000;
  const lastRegularDay = days.find(day => day.date === windows.last_regular.date)!;
  const minimum = Math.min(sessionBounds(lastRegularDay, "premarket").from, ...entries.map(([, window]) => window.from));
  const maximum = Math.max(...entries.map(([, window]) => window.asOf)) - 1;
  const historyStart = dayEnd - 435 * DAY;
  const dailyKey = asOfDate + "/" + dayEnd;
  const relativeVolume = relativeVolumeSchedule(days, windows, asOfDate);
  const cache = input.cache;
  const source = input.source ?? "Alpaca SIP";
  if (cache && cache.provider !== source) {
    cache.provider = source;
    cache.key = "";
    cache.daily.clear();
    cache.intraday.clear();
    cache.relativeVolume = undefined;
  }
  if (cache && cache.key !== dailyKey) {
    cache.key = dailyKey;
    cache.daily.clear();
  }
  if (cache && cache.intradayBasisDate !== asOfDate) {
    cache.intradayBasisDate = asOfDate;
    cache.intraday.clear();
  }
  const relativeKey = [asOfDate, relativeVolume.from, relativeVolume.until].join("/");
  if (cache && cache.relativeVolume?.key !== relativeKey) cache.relativeVolume = { key: relativeKey, series: new Map() };
  const slices = Array.from({ length: Math.ceil(stocks.length / BATCH_SIZE) }, (_, index) =>
    stocks.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE));
  const snapshots = Object.fromEntries(entries.map(([session, window]) => [session, {
    version: 2, source, session, date: window.date, universeDate,
    asOf: window.asOf, capturedAt: now, closed: window.closed, partial: Boolean(input.partialCaps), rows: [],
  }])) as unknown as Record<MarketSession, Snapshot>;

  // Use a single background collector with two workers. The app reads the finished file.
  let next = 0;
  async function worker() {
    for (;;) {
      const batch = slices[next++];
      if (!batch) return;
      const symbols = batch.map(stock => stock.symbol);
      const batchKey = symbols.join(",");
      const daily = await readHistory(symbols, cache?.daily.get(batchKey),
        requested => loadBars(data, requested, "1Day", historyStart, dayEnd, asOfDate), bars => bars.grouped);
      if (cache && daily && (cache.daily.has(batchKey) || cache.daily.size < 150)) cache.daily.set(batchKey, daily);
      const previous = cache?.intraday.get(batchKey);
      const compatible = previous && previous.start <= minimum && previous.end <= maximum ? previous : undefined;
      const intraday = await refreshIntraday(symbols, compatible, minimum, maximum,
        (requested, from) => loadBars(data, requested, "5Min", from, maximum, asOfDate));
      if (cache && intraday && (cache.intraday.has(batchKey) || cache.intraday.size < 150)) {
        cache.intraday.set(batchKey, { start: minimum, end: maximum, bars: intraday });
      }
      const series = cache?.relativeVolume?.series;
      const volumeHistory = relativeVolume.plans.size ? await readHistory(symbols, series?.get(batchKey),
        requested => loadBars(data, requested, "15Min", relativeVolume.from, relativeVolume.until - 1, asOfDate),
        bars => relativeVolumeHistory(bars.grouped, bars.rejected, relativeVolume.slots)) : null;
      const incompleteVolumeHistory = !volumeHistory || volumeHistory.rejected.size > 0;
      if (series && volumeHistory && (series.has(batchKey) || series.size < Math.ceil(MAX_LISTINGS / BATCH_SIZE))) {
        series.set(batchKey, volumeHistory);
      }
      const quoteResponse = windows[latest].closed ? null : await data.get("/v2/stocks/snapshots",
        new URLSearchParams({ symbols: symbols.join(","), feed: "sip" })).catch(() => null);
      const capturedAt = (input.clock ?? (() => now))();
      for (const [session, window] of entries) {
        const results = snapshots[session];
        const volumePlan = relativeVolume.plans.get(session);
        if (!daily || !intraday || (volumePlan && incompleteVolumeHistory)
          || (session === latest && !window.closed && !isObject(quoteResponse))) results.partial = true;
        for (const stock of batch) {
          const dailyBars = daily?.grouped.get(stock.symbol);
          const intradayBars = (intraday ?? compatible?.bars)?.grouped.get(stock.symbol);
          const observations = [...(intradayBars?.values() ?? [])].sort((a, b) => a.time - b.time);
          const observation = isObject(quoteResponse) ? quoteResponse[stock.symbol] : null;
          const quote = isObject(observation) ? observation.latestQuote : undefined;
          if (daily?.rejected.has(stock.symbol) || intraday?.rejected.has(stock.symbol)) results.partial = true;
          const candidate: Candidate = {
            symbol: stock.symbol, exchange: stock.exchange, name: stock.name,
            ...sessionMetrics({
              window, days, daily: [...(dailyBars?.values() ?? [])].sort((a, b) => a.time - b.time),
              intraday: observations,
              captureAt: capturedAt, quote: session === latest ? quote : undefined, cap: stock.marketCap,
              dailyComplete: Boolean(daily && !daily.rejected.has(stock.symbol)),
              intradayComplete: Boolean(intraday && !intraday.rejected.has(stock.symbol)),
            }),
          };
          const historicalVolume = volumeHistory?.grouped.get(stock.symbol);
          if (volumePlan && historicalVolume && candidate.values.volume !== undefined) {
            const ratio = relativeVolumeAtTime(window, volumePlan, observations, historicalVolume);
            if (ratio !== undefined) candidate.values.relativeVolume = ratio;
          }
          results.rows.push(candidate);
        }
      }
      input.onBatch?.(batch.length);
    }
  }
  await Promise.all([worker(), worker()]);
  if (!snapshots.last_regular.rows.some(row => row.values.price !== undefined)) throw Error("market_pack_unavailable");
  for (const snapshot of Object.values(snapshots)) {
    snapshot.capturedAt = (input.clock ?? (() => now))();
    snapshot.rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
  return { latest, snapshots };
}
