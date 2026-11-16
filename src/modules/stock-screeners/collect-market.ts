import { parseCalendarSessions } from "../scanner/alpaca/chart-calendar";
import { easternDayStart } from "../scanner/alpaca/candles";
import { easternClock } from "../scanner/live/sessions";
import { isObject, MAX_LISTINGS, type Candidate, type Listing, type MarketPack, type MarketSession, type Snapshot } from "./contracts";
import { decodeBar, marketWindows, sessionBounds, sessionMetrics, type ProviderBar } from "./market-metrics";
import { relativeVolumeAtTime, relativeVolumeHistory, relativeVolumeSchedule } from "./relative-volume";

type Data = { get(path: string, params: URLSearchParams): Promise<unknown> };
const DAY = 86_400_000;
const BATCH_SIZE = 100;
type Bars = Awaited<ReturnType<typeof loadBars>>;
type IntradayBatch = { start: number; end: number; bars: Bars };
export type BarCache = {
  key: string; daily: Map<string, Bars>; intraday: Map<string, IntradayBatch>;
  relativeVolume?: { key: string; series: Map<string, ReturnType<typeof relativeVolumeHistory>> };
};

export async function loadBars(data: Data, symbols: string[], timeframe: "1Day" | "5Min" | "15Min", start: number, end: number, asOf: string) {
  const grouped = new Map<string, Map<number, ProviderBar>>();
  const rejected = new Set<string>();
  if (end < start) return { grouped, rejected };
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
        if (!bar || bar.time * 1000 < start || bar.time * 1000 > end) {
          rejected.add(symbol);
          continue;
        }
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

export async function collectMarketPack(input: {
  data: Data; calendar: unknown; stocks: readonly Listing[]; universeDate: string; now: number;
  clock?: () => number;
  cache?: BarCache;
  partialCaps?: boolean;
  onBatch?: (count: number) => void;
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
  if (cache && cache.key !== dailyKey) {
    cache.key = dailyKey;
    cache.daily.clear();
    cache.intraday.clear();
  }
  const relativeKey = [asOfDate, relativeVolume.from, relativeVolume.until].join("/");
  if (cache && cache.relativeVolume?.key !== relativeKey) cache.relativeVolume = { key: relativeKey, series: new Map() };
  const slices = Array.from({ length: Math.ceil(stocks.length / BATCH_SIZE) }, (_, index) =>
    stocks.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE));
  const snapshots = Object.fromEntries(entries.map(([session, window]) => [session, {
    version: 2, source: "Alpaca SIP", session, date: window.date, universeDate,
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
      const cached = cache?.daily.get(batchKey);
      const daily = cached ?? await loadBars(data, symbols, "1Day", historyStart, dayEnd, asOfDate).catch(() => null);
      if (cache && !cached && daily && !daily.rejected.size && cache.daily.size < 150) cache.daily.set(batchKey, daily);
      const previous = cache?.intraday.get(batchKey);
      const compatible = previous && previous.start === minimum && previous.end <= maximum ? previous : undefined;
      const refreshFrom = compatible ? Math.max(minimum, compatible.end + 1 - 15 * 60_000) : minimum;
      const intraday = compatible?.end === maximum ? compatible.bars : await loadBars(data, symbols, "5Min", refreshFrom, maximum, asOfDate)
        .then(bars => {
          // Replace the overlap so provider corrections and dropped bars are reflected.
          if (compatible) for (const [symbol, priorBars] of compatible.bars.grouped) {
            const merged = bars.grouped.get(symbol) ?? new Map<number, ProviderBar>();
            for (const [time, bar] of priorBars) if (time * 1_000 < refreshFrom) merged.set(time, bar);
            bars.grouped.set(symbol, merged);
          }
          return bars;
        }).catch(() => null);
      if (cache && intraday && !intraday.rejected.size && cache.intraday.size < 150) {
        cache.intraday.set(batchKey, { start: minimum, end: maximum, bars: intraday });
      }
      let volumeHistory = cache?.relativeVolume?.series.get(batchKey);
      let incompleteVolumeHistory = false;
      if (!volumeHistory && relativeVolume.plans.size) {
        const history = await loadBars(data, symbols, "15Min", relativeVolume.from, relativeVolume.until - 1, asOfDate).catch(() => null);
        incompleteVolumeHistory = !history || history.rejected.size > 0;
        if (history) {
          volumeHistory = relativeVolumeHistory(history.grouped, history.rejected, relativeVolume.slots);
          const series = cache?.relativeVolume?.series;
          if (series && !incompleteVolumeHistory && series.size < Math.ceil(MAX_LISTINGS / BATCH_SIZE)) series.set(batchKey, volumeHistory);
        }
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
          const intradayBars = intraday?.grouped.get(stock.symbol);
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
          const historicalVolume = volumeHistory?.get(stock.symbol);
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
