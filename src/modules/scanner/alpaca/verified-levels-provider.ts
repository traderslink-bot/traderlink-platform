import { createHash, randomUUID } from "node:crypto";
import type { QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { easternClock } from "../live/sessions";
import { AlpacaChartCalendar } from "./chart-calendar-provider";
import { calendarDate, type ChartCalendar } from "./chart-calendar";
import { alpacaCandle, chartSymbol, easternDayStart, type Candle } from "./candles";
import { AlpacaRestData, type AlpacaHistoryRequest, type AlpacaHistoryResult } from "./rest-data";
import { missingAlpacaDailyIntervals, prepareVerifiedAlpacaRegularHistory, qualifyAlpacaNativeDailyHistory } from "./verify-regular-history";
import type { EffectiveDailySplit } from "./verified-daily-split";
import type { ScannerLevelsObserveInterval } from "./verified-levels-monitor";

type Credentials = Readonly<{ keyId: string; secretKey: string }>;
const wallTimeMs = 75_000;
type SplitAction = EffectiveDailySplit & Readonly<{
  kind: "forward_splits" | "reverse_splits"; id: string; processDate: string;
  oldCusip?: string; newCusip?: string; newSymbol?: string;
}>;
type RenameAction = Readonly<{
  id: string; processDate: string; oldSymbol: string; newSymbol: string; oldCusip: string; newCusip: string;
}>;
const validSymbol = (symbol: unknown): symbol is string =>
  typeof symbol === "string" && /^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol);
const cusip = (value: unknown): string | undefined =>
  typeof value === "string" && /^[A-Z0-9]{9}$/u.test(value) ? value : undefined;
const basisHash = (...parts: unknown[]) => createHash("sha256").update(JSON.stringify(parts)).digest("hex");
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

export function createAlpacaVerifiedLevelsProvider(credentials: Credentials, transport: typeof fetch = fetch) {
  let active = 0;

  async function asset(symbol: string, signal: AbortSignal) {
    const response = await transport(new URL("/v2/assets/" + encodeURIComponent(symbol), "https://paper-api.alpaca.markets"), {
      headers: { "APCA-API-KEY-ID": credentials.keyId, "APCA-API-SECRET-KEY": credentials.secretKey },
      signal, redirect: "error",
    });
    const body: unknown = response.ok ? await response.json() : undefined;
    if (!record(body) || body.symbol !== symbol || body.class !== "us_equity" || body.status !== "active" ||
      typeof body.id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(body.id) ||
      typeof body.exchange !== "string" ||
      !["NASDAQ", "NYSE", "AMEX", "ARCA", "BATS", "NYSEARCA"].includes(body.exchange)) return;
    return { instrumentId: body.id, symbol, venue: body.exchange };
  }

  async function corporateActions(data: AlpacaRestData, symbol: string, date: string, signal: AbortSignal) {
    const splits = new Map<string, SplitAction>();
    const renames = new Map<string, RenameAction>();
    const pages = new Set<string>();
    let token: string | undefined;
    for (let page = 0; page < 2; page++) {
      const query = new URLSearchParams({ symbols: symbol, types: "forward_split,reverse_split,name_change",
        start: "1970-01-01", end: date, data_quality: "complete", limit: "1000", sort: "asc" });
      if (token) query.set("page_token", token);
      const body = await data.get("/v1/corporate-actions", query, signal);
      if (!record(body) || !record(body.corporate_actions)) return;
      let pageRows = 0;
      for (const [kind, rows] of Object.entries(body.corporate_actions)) {
        if (!Array.isArray(rows) || (pageRows += rows.length) > 1000) return;
        for (const row of rows) {
          if (!record(row) || typeof row.id !== "string" || !row.id || row.id.length > 128 ||
            !calendarDate(row.process_date) || row.process_date > date) return;
          const oldCusip = cusip(row.old_cusip);
          const newCusip = cusip(row.new_cusip);
          const newSymbol = validSymbol(row.new_symbol) ? row.new_symbol : undefined;
          if ((row.old_cusip && !oldCusip) || (row.new_cusip && !newCusip)) return;
          if (kind === "name_changes") {
            if (!oldCusip || !newCusip || !validSymbol(row.old_symbol) || !validSymbol(row.new_symbol) ||
              row.old_symbol === row.new_symbol || (row.old_symbol !== symbol && row.new_symbol !== symbol) || splits.has(row.id)) return;
            const action = { id: row.id, processDate: row.process_date, oldSymbol: row.old_symbol,
              newSymbol: row.new_symbol, oldCusip, newCusip };
            if (renames.has(row.id) && JSON.stringify(renames.get(row.id)) !== JSON.stringify(action)) return;
            renames.set(row.id, action);
            continue;
          }
          if ((kind !== "forward_splits" && kind !== "reverse_splits") || row.symbol !== symbol || !calendarDate(row.ex_date) ||
            typeof row.old_rate !== "number" || row.old_rate <= 0 || !Number.isFinite(row.old_rate) ||
            typeof row.new_rate !== "number" || row.new_rate <= 0 || !Number.isFinite(row.new_rate) ||
            (row.new_symbol && !newSymbol) || renames.has(row.id)) return;
          const action: SplitAction = { kind, id: row.id, exDate: row.ex_date, processDate: row.process_date,
            oldRate: row.old_rate, newRate: row.new_rate, oldCusip, newCusip, newSymbol };
          if (splits.has(row.id) && JSON.stringify(splits.get(row.id)) !== JSON.stringify(action)) return;
          splits.set(row.id, action);
        }
      }
      if (body.next_page_token === null || body.next_page_token === undefined) {
        return { splits: [...splits.values()], renames: [...renames.values()] };
      }
      if (typeof body.next_page_token !== "string" || !body.next_page_token ||
        body.next_page_token.length > 512 || pages.has(body.next_page_token)) return;
      token = body.next_page_token;
      pages.add(token);
    }
  }

  async function splitLineage(data: AlpacaRestData, symbol: string, date: string, signal: AbortSignal) {
    const evidence = new Map<string, string>();
    const effectiveSplits: EffectiveDailySplit[] = [];
    const visited = new Set<string>();
    let ticker = symbol;
    let successor: RenameAction | undefined;
    for (let depth = 0; depth < 5; depth++) {
      if (visited.has(ticker)) return;
      visited.add(ticker);
      const actions = await corporateActions(data, ticker, date, signal);
      if (!actions || (successor && !actions.renames.some(action =>
        JSON.stringify(action) === JSON.stringify(successor)))) return;
      const incoming = actions.renames.filter(action => action.newSymbol === ticker &&
        (!successor || action.processDate < successor.processDate));
      if (incoming.length > 1) return;
      const predecessor = incoming[0];
      if (predecessor && predecessor.oldCusip !== predecessor.newCusip) return;
      const inLineage = (day: string) => (!predecessor || predecessor.processDate <= day) &&
        (!successor || day < successor.processDate);
      if (actions.renames.some(action => action.oldSymbol === ticker && inLineage(action.processDate))) return;
      const splits = actions.splits.filter(action => inLineage(action.exDate)).sort((a, b) => a.exDate.localeCompare(b.exDate));
      if (splits.some((action, index) => (action.newSymbol && action.newSymbol !== ticker) ||
        (index > 0 && (action.exDate === splits[index - 1].exDate ||
          (action.oldCusip && splits[index - 1].newCusip && action.oldCusip !== splits[index - 1].newCusip))))) return;
      if ((predecessor && splits.length > 0 && splits[0].oldCusip !== predecessor.newCusip) ||
        (successor && splits.length > 0 && splits.at(-1)?.newCusip !== successor.oldCusip) ||
        (predecessor && successor && !splits.length && predecessor.newCusip !== successor.oldCusip)) return;
      for (const action of splits) {
        if (evidence.has(action.id)) return;
        evidence.set(action.id, JSON.stringify([action.kind, action.exDate, action.processDate,
          action.oldRate, action.newRate, action.oldCusip ?? null, action.newCusip ?? null]));
        if (action.exDate <= date) effectiveSplits.push(action);
      }
      if (!predecessor) return {
        evidence: [...evidence.entries()].sort(([left], [right]) => left.localeCompare(right)),
        effectiveSplits,
      };
      if (evidence.has(predecessor.id)) return;
      evidence.set(predecessor.id, JSON.stringify(["name_change", predecessor]));
      successor = predecessor;
      ticker = predecessor.oldSymbol;
    }
  }

  async function officialCalendars(year: number, sourceFetch: typeof fetch) {
    const provider = new AlpacaChartCalendar(credentials, sourceFetch);
    const years: ChartCalendar[] = [];
    for (let value = year - 2; value <= year; value++) {
      const year = await provider.forYear(value);
      if (!year.available) return;
      years.push(year);
    }
    return years;
  }

  async function bars(data: AlpacaRestData, request: AlpacaHistoryRequest, timeframe: "1Day" | "1Min" | "30Min",
    adjustment: "raw" | "split", date: string, signal: AbortSignal): Promise<AlpacaHistoryResult | undefined> {
    const candles = new Map<number, Candle>();
    const pages = new Set<string>();
    let token: string | undefined;
    for (let page = 0; page < (timeframe === "1Day" ? 2 : 8); page++) {
      const query = new URLSearchParams({ symbols: request.symbol, timeframe, start: new Date(request.start).toISOString(),
        end: new Date(request.end - 1).toISOString(), asof: date, feed: "sip", adjustment, limit: "10000", sort: "asc" });
      if (token) query.set("page_token", token);
      const body = await data.get("/v2/stocks/bars", query, signal);
      if (!record(body) || !record(body.bars) || Object.keys(body.bars).some(symbol => symbol !== request.symbol)) return;
      const rows = body.bars[request.symbol] ?? [];
      if (!Array.isArray(rows) || rows.length > 10_000) return;
      for (const row of rows) {
        const candle = alpacaCandle(row);
        if (!candle || candle.time * 1_000 < request.start || candle.time * 1_000 >= request.end || candles.has(candle.time)) return;
        candles.set(candle.time, candle);
      }
      if (body.next_page_token === undefined || body.next_page_token === null) {
        return { symbol: request.symbol, feed: "sip", adjustment, basisDate: date, complete: true, nextPageToken: null,
          bars: [...candles.values()].sort((left, right) => left.time - right.time) };
      }
      if (typeof body.next_page_token !== "string" || !body.next_page_token ||
        body.next_page_token.length > 512 || pages.has(body.next_page_token)) return;
      token = body.next_page_token;
      pages.add(token);
    }
  }

  async function observe(request: AlpacaHistoryRequest, originalSignal: AbortSignal) {
    const symbol = chartSymbol(request.symbol);
    const now = Date.now();
    const date = easternClock(now).date;
    const year = Number(date.slice(0, 4));
    const requestMs = request.end - request.start;
    if (originalSignal.aborted || active >= 2 || request.end > now || requestMs <= 0 ||
      requestMs > (request.timeframe === "1Day" ? 750 : 62) * 86_400_000) return;
    const timeframe = request.timeframe === "1Day" ? "1Day" : "1Min";
    // Alpaca filters native Daily bars by their timestamp, so a partial final date could leak into this read.
    const providerEnd = timeframe === "1Day" ? easternDayStart(request.end / 1_000) * 1_000 : request.end;
    if (providerEnd <= request.start) return;
    const providerRequest = { ...request, symbol, end: providerEnd };
    const signal = AbortSignal.any([originalSignal, AbortSignal.timeout(wallTimeMs)]);
    const sourceFetch: typeof fetch = (input, options) =>
      transport(input, { ...options, signal: options?.signal ? AbortSignal.any([signal, options.signal]) : signal });
    const data = new AlpacaRestData(credentials, sourceFetch);
    active++;
    try {
      const [listing, splits, calendar] = await Promise.all([
        asset(symbol, signal), splitLineage(data, symbol, date, signal), officialCalendars(year, sourceFetch),
      ]);
      if (!listing || !splits || !calendar || signal.aborted) return;
      const acceptedCutoffMs = Date.now();
      const [raw, split, nativeHalfHours] = await Promise.all([
        bars(data, providerRequest, timeframe, "raw", date, signal),
        bars(data, providerRequest, timeframe, "split", date, signal),
        timeframe === "1Min" ? bars(data, providerRequest, "30Min", "raw", date, signal) : undefined,
      ]);
      if (!raw || !split || (timeframe === "1Min" && !nativeHalfHours) || signal.aborted) return;
      const window = { symbol, raw, split, nativeHalfHours, calendar, startMs: request.start, endMs: request.end };
      const firstDate = split.bars.length ? easternClock(split.bars[0].time * 1_000).date : date;
      const effectiveSplits = splits.effectiveSplits.filter(action => action.exDate > firstDate);
      let nativeDailyProof;
      if (timeframe === "1Day") {
        const missing = missingAlpacaDailyIntervals(window);
        if (!missing || effectiveSplits.length > 32) return;
        const repeatedSplit = effectiveSplits.length ? await bars(data, providerRequest, "1Day", "split", date, signal) : undefined;
        if ((effectiveSplits.length && !repeatedSplit) || signal.aborted) return;
        const emptyStarts: number[] = [];
        for (const interval of missing) {
          const quietRequest = { ...providerRequest, start: interval.start, end: interval.end };
          const [quietMinutes, quietHalfHours] = await Promise.all([
            bars(data, quietRequest, "1Min", "raw", date, signal),
            bars(data, quietRequest, "30Min", "raw", date, signal),
          ]);
          if (!quietMinutes || !quietHalfHours || quietMinutes.bars.length || quietHalfHours.bars.length || signal.aborted) return;
          emptyStarts.push(...interval.starts);
        }
        nativeDailyProof = { effectiveSplits, repeatedSplit, emptyStarts };
      }
      const [listingAfter, splitsAfter, calendarAfter] = await Promise.all([
        asset(symbol, signal), splitLineage(data, symbol, date, signal), officialCalendars(year, sourceFetch),
      ]);
      const availableAtMs = Date.now();
      const priceBasisId = basisHash("alpaca-sip-split-v1", listing, splits.evidence);
      const calendarRevision = basisHash("alpaca-regular-calendar-v1", calendar);
      if (!listingAfter || !splitsAfter || !calendarAfter || signal.aborted || easternClock(availableAtMs).date !== date ||
        raw.basisDate !== date || split.basisDate !== date ||
        priceBasisId !== basisHash("alpaca-sip-split-v1", listingAfter, splitsAfter.evidence) ||
        calendarRevision !== basisHash("alpaca-regular-calendar-v1", calendarAfter)) return;
      return { window: { ...window, nativeDailyProof },
        basis: { ...listing, priceBasisId, calendarRevision, acceptedCutoffMs, availableAtMs } };
    } catch {
      return undefined;
    } finally {
      active--;
    }
  }

  async function readHistory(request: AlpacaHistoryRequest, signal: AbortSignal) {
    if (!request.acceptedEvidence || (request.timeframe === "4Hour" ? request.sessionMode !== "regular" : request.timeframe !== "1Day")) return;
    const observed = await observe(request, signal);
    if (!observed || signal.aborted) return;
    const { window, basis } = observed;
    if (request.timeframe === "4Hour") return prepareVerifiedAlpacaRegularHistory(request, window, basis);
    const qualified: QualifiedInputSeries | undefined = qualifyAlpacaNativeDailyHistory(request, window, basis);
    if (qualified) return { history: window.split, qualified, calendars: window.calendar };
  }

  const observeInterval: ScannerLevelsObserveInterval = async ({ basis: prior, interval, operationId, signal }) => {
    const observed = await observe({ symbol: prior.symbol, timeframe: "4Hour", sessionMode: "regular",
      acceptedEvidence: true, start: interval.startMs, end: interval.endMs }, signal);
    if (!observed || signal.aborted) return;
    const { basis } = observed;
    if (basis.instrumentId !== prior.instrumentId || basis.venue !== prior.venue ||
      basis.priceBasisId !== prior.priceBasisId || basis.calendarRevision !== prior.calendarRevision) return;
    return { ...observed, request: { ...interval, operationId, requestId: randomUUID(), kind: "4h", symbol: prior.symbol, wire: false } };
  };

  return { readHistory, observeInterval };
}
