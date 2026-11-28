import { parseCalendarSessions } from "../scanner/alpaca/chart-calendar";
import { easternDayStart } from "../scanner/alpaca/candles";
import { easternClock } from "../scanner/live/sessions";
import { isObject, MAX_LISTINGS, type Candidate, type Listing, type MarketPack, type MarketSession, type Snapshot } from "./contracts";
import { decodeBar, marketWindows, sessionBounds, sessionMetrics, type ProviderBar } from "./market-metrics";
import { relativeVolumeAtTime, relativeVolumeHistory, relativeVolumeSchedule } from "./relative-volume";
import { parseScreenerRevisions, repairScreenerBars, screenerCorrectionDigest, type ScreenerCorrections, type ScreenerCorrectionState, type ScreenerRevisionManifest } from "./trade-corrections";
import type { TradeRevision } from "../scanner/alpaca/trade-revisions";

type Data = { get(path: string, params: URLSearchParams): Promise<unknown> };
export type ScreenerCalendarRange = { start: string; end: string };
const DAY = 86_400_000;
const BATCH_SIZE = 100;
type SymbolData<T> = { grouped: Map<string, T>; rejected: Set<string> };
type Bars = SymbolData<Map<number, ProviderBar>>;
type IntradayBatch = { start: number; end: number; bars: Bars };
export type BarCache = {
  provider?: string;
  key: string; daily: Map<string, Bars>; intraday: Map<string, IntradayBatch>;
  intradayBasisDate?: string;
  corrections?: ScreenerCorrectionState;
  volumeCorrections?: ScreenerCorrectionState;
  knownCorrections?: Map<string, TradeRevision>;
  correctionGeneration?: number;
  moomooCorrections?: Map<string, string>;
  unavailableCorrections?: Set<string>;
  relativeVolume?: { key: string; series: Map<string, SymbolData<Float64Array>>; bars?: Map<string, Bars> };
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
    if (payload.partial_symbols !== undefined) {
      if (!Array.isArray(payload.partial_symbols) || !payload.partial_symbols.every(symbol => typeof symbol === "string" && requested.has(symbol)))
        throw Error("bars_invalid");
      for (const symbol of payload.partial_symbols) rejected.add(symbol);
    }
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
  data: Data; calendar: unknown; calendarRange?: ScreenerCalendarRange;
  stocks: readonly Listing[]; universeDate: string; now: number;
  clock?: () => number;
  cache?: BarCache;
  partialCaps?: boolean;
  onBatch?: (count: number) => void;
  source?: "Alpaca SIP" | "Moomoo";
  corrections?: ScreenerCorrections;
}): Promise<MarketPack> {
  const { data, now, universeDate } = input;
  // Cached calendars must be validated against their original request, even
  // when UTC midnight passes before the Eastern trading date changes.
  const calendarStart = input.calendarRange?.start ?? new Date(now - 540 * DAY).toISOString().slice(0, 10);
  const calendarEnd = input.calendarRange?.end ?? new Date(now + 3 * DAY).toISOString().slice(0, 10);
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
    cache.corrections = undefined;
    cache.volumeCorrections = undefined;
    cache.knownCorrections = undefined;
    cache.correctionGeneration = undefined;
    cache.moomooCorrections = undefined;
    cache.unavailableCorrections = undefined;
  }
  if (cache && cache.key !== dailyKey) {
    cache.key = dailyKey;
    cache.daily.clear();
  }
  if (cache && cache.intradayBasisDate !== asOfDate) {
    cache.intradayBasisDate = asOfDate;
    cache.intraday.clear();
    cache.corrections = undefined;
    cache.volumeCorrections = undefined;
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
  const corrections = cache ? (cache.corrections ??= new Map()) : new Map();
  const volumeCorrections = cache ? (cache.volumeCorrections ??= new Map()) : new Map();
  const known: Map<string, TradeRevision> = cache ? (cache.knownCorrections ??= new Map()) : new Map();
  const moomooCorrections = cache ? (cache.moomooCorrections ??= new Map()) : new Map<string, string>();
  const unavailable: Set<string> = cache ? (cache.unavailableCorrections ??= new Set()) : new Set();
  let correctionGeneration = cache?.correctionGeneration;
  for (const [symbol, entry] of known) {
    const minutes = entry.minutes.filter(minute => minute * 1000 >= historyStart && minute * 1000 <= maximum);
    if (minutes.length || entry.pending) known.set(symbol, { ...entry, minutes }); else known.delete(symbol);
  }
  async function worker() {
    for (;;) {
      const batch = slices[next++];
      if (!batch) return;
      const symbols = batch.map(stock => stock.symbol);
      const batchKey = symbols.join(",");
      const revisionRequest = { symbols, start: historyStart, end: maximum + 1 };
      let revisionUnavailable = false;
      if (input.corrections) {
        try {
          const observed = parseScreenerRevisions(await input.corrections.revisions(revisionRequest), revisionRequest);
          if (observed.generation === undefined || correctionGeneration === undefined || observed.generation >= correctionGeneration) {
            for (const [symbol, entry] of Object.entries(observed.symbols)) if (entry) known.set(symbol, entry);
            for (const symbol of symbols) {
              if (observed.unavailableSymbols?.includes(symbol)) unavailable.add(symbol); else unavailable.delete(symbol);
            }
            if (observed.generation !== undefined) correctionGeneration = observed.generation;
          }
        } catch { revisionUnavailable = true; /* Existing known corrections still apply during a metadata outage. */ }
      }
      const manifest: ScreenerRevisionManifest = { feed: "sip", symbols: Object.fromEntries(symbols.flatMap(symbol => known.has(symbol) ? [[symbol, known.get(symbol)!]] : [])),
        unavailableSymbols: symbols.filter(symbol => unavailable.has(symbol)),
        ...(correctionGeneration === undefined ? {} : { generation: correctionGeneration }) };
      if (source === "Moomoo") {
        for (const symbol of symbols) {
          const entry = manifest.symbols[symbol];
          if (!entry) continue;
          const revision = JSON.stringify([entry.revision, entry.pending]);
          if (moomooCorrections.get(symbol) === revision) continue;
          moomooCorrections.set(symbol, revision);
          // Only refresh the linked provider's own observations. SIP source
          // values are never passed into the Moomoo collector.
          cache?.daily.get(batchKey)?.rejected.add(symbol);
          if (entry.pending || entry.minutes.some(minute => minute * 1000 >= minimum && minute * 1000 <= maximum))
            cache?.intraday.get(batchKey)?.bars.rejected.add(symbol);
          if (entry.minutes.some(minute => minute * 1000 >= relativeVolume.from && minute * 1000 < relativeVolume.until))
            cache?.relativeVolume?.bars?.get(batchKey)?.rejected.add(symbol);
        }
      }
      let daily = await readHistory(symbols, cache?.daily.get(batchKey),
        requested => loadBars(data, requested, "1Day", historyStart, dayEnd, asOfDate), bars => bars.grouped);
      let dailyPartial = Object.values(manifest.symbols).some(entry => entry?.minutes.some(minute => {
        const date = easternClock(minute * 1000).date;
        return date >= easternClock(historyStart).date && date <= windows.last_regular.date;
      }));
      if (daily && source === "Alpaca SIP") {
        const grouped = new Map(daily.grouped);
        for (const symbol of symbols) {
          const entry = manifest.symbols[symbol];
          if (!entry) continue;
          const dates = new Set(entry.minutes.map(minute => easternClock(minute * 1000).date));
          if (entry.pending) dates.add(asOfDate);
          if ([...dates].some(date => date >= easternClock(historyStart).date && date <= windows.last_regular.date)) dailyPartial = true;
          const bars = grouped.get(symbol);
          if (!bars) continue;
          const qualified = new Map(bars);
          for (const [time] of bars) if (dates.has(easternClock(time * 1000).date)) { qualified.delete(time); dailyPartial = true; }
          grouped.set(symbol, qualified);
        }
        daily = { grouped, rejected: daily.rejected };
      }
      if (cache && daily && (cache.daily.has(batchKey) || cache.daily.size < 150)) cache.daily.set(batchKey, daily);
      const previous = cache?.intraday.get(batchKey);
      const compatible = previous && previous.start <= minimum && previous.end <= maximum ? previous : undefined;
      let intraday = await refreshIntraday(symbols, compatible, minimum, maximum,
        (requested, from) => loadBars(data, requested, "5Min", from, maximum, asOfDate));
      if (intraday && input.corrections && source === "Alpaca SIP") {
        intraday = await repairScreenerBars({ bars: intraday, symbols, start: minimum, end: maximum + 1,
          basisDate: asOfDate, state: corrections, reader: input.corrections, manifest, revisionRequest });
      }
      if (cache && intraday && (cache.intraday.has(batchKey) || cache.intraday.size < 150)) {
        cache.intraday.set(batchKey, { start: minimum, end: maximum, bars: intraday });
      }
      const series = cache?.relativeVolume?.series;
      const rawVolumeCache = cache?.relativeVolume ? (cache.relativeVolume.bars ??= new Map()) : undefined;
      let volumeBars = relativeVolume.plans.size ? await readHistory(symbols, rawVolumeCache?.get(batchKey),
        requested => loadBars(data, requested, "15Min", relativeVolume.from, relativeVolume.until - 1, asOfDate),
        bars => bars.grouped) : null;
      if (volumeBars && input.corrections && source === "Alpaca SIP") volumeBars = await repairScreenerBars({
        bars: volumeBars, symbols, start: relativeVolume.from, end: relativeVolume.until, basisDate: asOfDate,
        state: volumeCorrections, reader: input.corrections, timeframe: "15Min", manifest, revisionRequest });
      if (rawVolumeCache && volumeBars && (rawVolumeCache.has(batchKey) || rawVolumeCache.size < 150)) rawVolumeCache.set(batchKey, volumeBars);
      const volumeHistory = volumeBars ? { grouped: relativeVolumeHistory(volumeBars.grouped, volumeBars.rejected, relativeVolume.slots), rejected: volumeBars.rejected } : null;
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
        if (revisionUnavailable || !daily || dailyPartial || !intraday || (volumePlan && incompleteVolumeHistory)
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
      if (input.corrections) {
        try {
          const verified = parseScreenerRevisions(await input.corrections.revisions(revisionRequest), revisionRequest);
          if (correctionGeneration === undefined || verified.generation === undefined || verified.generation >= correctionGeneration) {
            const changed = new Set(symbols.filter(symbol => {
              const previous = manifest.symbols[symbol], current = verified.symbols[symbol];
              return current && JSON.stringify([previous?.revision, previous?.pending]) !== JSON.stringify([current.revision, current.pending]);
            }));
            for (const [symbol, entry] of Object.entries(verified.symbols)) if (entry) known.set(symbol, entry);
            for (const symbol of symbols) {
              if (verified.unavailableSymbols?.includes(symbol)) { unavailable.add(symbol); changed.add(symbol); }
              else unavailable.delete(symbol);
            }
            if (verified.generation !== undefined) correctionGeneration = verified.generation;
            // A late correction is a new source revision. Do not publish a
            // result computed on the superseded revision while other tickers
            // remain usable. The next ordinary cycle repairs these cache rows.
            for (const snapshot of Object.values(snapshots)) for (const row of snapshot.rows) if (changed.has(row.symbol)) {
              row.values = row.values.cap === undefined ? {} : { cap: row.values.cap };
              delete row.priceAt; delete row.quoteAt; snapshot.partial = true;
            }
          }
        } catch { for (const snapshot of Object.values(snapshots)) snapshot.partial = true; }
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
  if (cache) cache.correctionGeneration = correctionGeneration;
  const manifest: ScreenerRevisionManifest = { feed: "sip", symbols: Object.fromEntries(known),
    unavailableSymbols: [...unavailable],
    ...(correctionGeneration === undefined ? {} : { generation: correctionGeneration }) };
  const correctionRevision = screenerCorrectionDigest(stocks.map(stock => stock.symbol), manifest);
  return { latest, snapshots, ...(correctionRevision ? { correctionRevision,
    ...(correctionGeneration === undefined ? {} : { correctionGeneration }) } : {}) };
}
