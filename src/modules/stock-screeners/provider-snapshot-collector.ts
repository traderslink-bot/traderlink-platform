import { setTimeout as delay } from "node:timers/promises";
import { AlpacaRestData } from "../scanner/alpaca/rest-data";
import { parseCalendarSessions } from "../scanner/alpaca/chart-calendar";
import { easternClock } from "../scanner/live/sessions";
import { collectMarketPack, type BarCache, type ScreenerCalendarRange } from "./collect-market";
import { collectListings } from "./listings";
import { MoomooScreenerData } from "./moomoo-market-data";
import { collectMoomooQuotePack } from "./moomoo-quote-pack";
import { isObject, type ScreenerProviderSelection } from "./contracts";
import type { ScreenerProviderTransport } from "./provider-transport";
import { screenerCorrections } from "./trade-corrections";
import type { ScreenerLiveUpdate } from "./live-market-worker";
import { sessionBounds } from "./market-metrics";

type Reference = { date: string; listings: Awaited<ReturnType<typeof collectListings>>;
  calendar: unknown; calendarRange: ScreenerCalendarRange; spacingMs?: number };
const DAY = 86_400_000;
type Credentials = { keyId: string; secretKey: string };

export class ScreenerSnapshotCollector {
  private readonly cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
  private reference: Reference | undefined;
  private referenceReadAt = 0;
  private readonly moomooSnapshots = new Map<string, Record<string, unknown>>();
  private pendingReference: { date: string; result: Promise<Reference> } | undefined;
  private quotaStopped = false;
  private transportUnavailable = false;
  private moomoo: { date: string; data: MoomooScreenerData } | undefined;
  private nextRequest = 0;

  constructor(private readonly transport: ScreenerProviderTransport, private readonly selection: ScreenerProviderSelection,
    private readonly signal: AbortSignal, private readonly credentials?: Credentials,
    private readonly environment: NodeJS.ProcessEnv = process.env) {}

  async referenceData(): Promise<Reference> {
    const now = Date.now(), date = easternClock(now).date;
    if (this.reference?.date === date && (this.selection.provider === "alpaca" || now - this.referenceReadAt < 5_000)) return this.reference;
    if (this.pendingReference?.date === date) return this.pendingReference.result;
    const result = this.loadReference(now, date);
    this.pendingReference = { date, result };
    try { return await result; }
    finally { if (this.pendingReference?.result === result) this.pendingReference = undefined; }
  }

  private async loadReference(now: number, date: string): Promise<Reference> {
    this.signal.throwIfAborted();
    const start = new Date(now - 540 * DAY).toISOString().slice(0, 10);
    const end = new Date(now + 3 * DAY).toISOString().slice(0, 10);
    if (this.reference?.date !== date || this.selection.provider === "moomoo") {
      if (this.selection.provider === "moomoo") {
        const listings = await this.transport.universe(this.selection, date, this.signal);
        let calendar = this.reference?.date === date ? this.reference.calendar : undefined;
        let calendarRange = this.reference?.date === date ? this.reference.calendarRange : { start, end };
        if (!calendar) {
          const payload = await this.transport.moomoo(this.selection, { operation: "calendar", start, end }, this.signal);
          const { moomooCalendarSessions } = await import("../market-data/moomoo-calendar");
          calendar = moomooCalendarSessions(payload, start, end);
          calendarRange = { start, end };
        }
        const eligible = new Set(listings.stocks.map(stock => stock.symbol));
        for (const symbol of this.moomooSnapshots.keys()) if (!eligible.has(symbol)) this.moomooSnapshots.delete(symbol);
        this.reference = { date, listings, calendar, calendarRange, spacingMs: listings.spacingMs };
      } else {
        const credentials = this.requireCredentials();
        const headers = { "APCA-API-KEY-ID": credentials.keyId, "APCA-API-SECRET-KEY": credentials.secretKey };
        const url = new URL("https://paper-api.alpaca.markets/v2/calendar");
        url.search = new URLSearchParams({ start, end }).toString();
        const response = await fetch(url, { headers, redirect: "error", signal: AbortSignal.any([this.signal, AbortSignal.timeout(12_000)]) });
        if (!response.ok) throw Error("calendar_unavailable");
        this.reference = { date, listings: await collectListings(headers), calendar: await response.json(), calendarRange: { start, end } };
      }
    }
    this.referenceReadAt = Date.now();
    return this.reference!;
  }

  async collect() {
    this.signal.throwIfAborted();
    const reference = await this.referenceData();
    const now = Date.now(), date = easternClock(now).date;
    this.quotaStopped = false;
    this.transportUnavailable = false;
    if (this.selection.provider === "alpaca" && (reference.listings.listingDate > date
      || Date.parse(date + "T12:00:00Z") - Date.parse(reference.listings.listingDate + "T12:00:00Z") > 7 * DAY))
      throw Error("listings_outdated");
    const data = this.selection.provider === "moomoo" ? this.moomooData(date) : this.alpacaData();
    const pack = await collectMarketPack({
      now, clock: Date.now, source: this.selection.provider === "alpaca" ? "Alpaca SIP" : "Moomoo",
      stocks: reference.listings.stocks, universeDate: reference.listings.listingDate, partialCaps: reference.listings.partialCaps,
      calendar: reference.calendar, calendarRange: reference.calendarRange, cache: this.cache,
      corrections: screenerCorrections(this.environment, this.signal),
      data: { get: (path, params) => { this.signal.throwIfAborted(); return data.get(path, params); } },
      onBatch: () => this.signal.throwIfAborted(),
    });
    this.signal.throwIfAborted();
    if (this.quotaStopped) throw Error("provider_budget_reserved");
    if (this.transportUnavailable) throw Error("screener_provider_transport_unavailable");
    if (this.selection.provider === "moomoo") {
      const corrected = new Set(this.moomoo?.data.correctedSymbols());
      const days = parseCalendarSessions(reference.calendar, reference.calendarRange.start, reference.calendarRange.end);
      for (const snapshot of Object.values(pack.snapshots)) {
        const prefix = snapshot.session === "premarket" ? "pre_" : snapshot.session === "after_hours" ? "after_" : "";
        const day = days.find(day => day.date === snapshot.date);
        const bounds = day && sessionBounds(day, snapshot.session);
        for (const row of snapshot.rows) {
          // The confirmed canonical source takes precedence over a differing
          // native quote aggregate in the affected session.
          if (corrected.has(row.symbol) && bounds && this.moomooCorrectionAffects(row.symbol, { start: bounds.from, end: bounds.until })) continue;
          const quote = this.moomooSnapshots.get(row.symbol);
          const high = quote?.[prefix + "high_price"], volume = quote?.[prefix + "volume"];
          if (!quote || quote.data_date !== snapshot.date || typeof quote.update_time !== "number" || quote.update_time < snapshot.asOf) continue;
          if ((typeof high === "number" && high > 0 && row.values.high !== undefined && row.values.high > high)
            || (typeof volume === "number" && volume >= 0 && row.values.volume !== undefined && row.values.volume > volume)) {
            // The broker's history has not caught up with its own newer correction.
            // Keep independent peers and retry this symbol's history next pass.
            row.values = row.values.cap === undefined ? {} : { cap: row.values.cap };
            delete row.priceAt;
            delete row.quoteAt;
            snapshot.partial = true;
            for (const [key, batch] of this.cache.intraday) if (key.split(",").includes(row.symbol)) batch.bars.rejected.add(row.symbol);
          }
        }
      }
    }
    const eligible = new Set(reference.listings.stocks.map(stock => stock.symbol));
    const corrected = this.moomoo?.data.correctedSymbols().filter(symbol => eligible.has(symbol));
    return { ...pack, selection: this.selection,
      ...(corrected?.length ? { correctionProvenance: { source: "alpaca-sip" as const, symbols: corrected } } : {}) };
  }

  async initialMoomooPack() {
    if (this.selection.provider !== "moomoo") throw Error("screener_provider_invalid_selection");
    const reference = await this.referenceData();
    const now = Date.now();
    const { start, end } = reference.calendarRange;
    const days = parseCalendarSessions(reference.calendar, start, end);
    const pack = await collectMoomooQuotePack({ now, clock: Date.now, signal: this.signal,
      stocks: reference.listings.stocks, universeDate: reference.listings.listingDate,
      calendar: days,
      read: async symbols => this.cachedMoomooSnapshots(symbols) });
    for (const snapshot of Object.values(pack.snapshots)) {
      const day = days.find(day => day.date === snapshot.date);
      if (!day) continue;
      const bounds = sessionBounds(day, snapshot.session);
      for (const row of snapshot.rows) if (this.moomooCorrectionAffects(row.symbol, { start: bounds.from, end: bounds.until })) {
        for (const field of ["high", "low", "range", "fromHigh", "fromLow", "volume", "dollarVolume", "sessionVwap", "vwapPosition", "vwapDistance"] as const)
          delete row.values[field];
        snapshot.partial = true;
      }
    }
    return { ...pack, selection: this.selection };
  }

  private moomooCorrectionAffects(symbol: string, window: { start: number; end: number }) {
    const entry = this.cache.knownCorrections?.get(symbol);
    return entry?.minutes.some(minute => minute * 1000 >= window.start && minute * 1000 < window.end)
      || (entry?.pending && easternClock(window.start).date === easternClock(Date.now()).date);
  }

  guardMoomooLiveRows(rows: readonly ScreenerLiveUpdate[], window: { start: number; end: number }): ScreenerLiveUpdate[] {
    return rows.map(row => {
      if (!this.moomooCorrectionAffects(row.symbol, window)) return row;
      return { symbol: row.symbol, price: row.price, priceAt: row.priceAt, vwap: null };
    });
  }

  observeMoomooSnapshots(payload: unknown, requested: readonly string[]) {
    this.signal.throwIfAborted();
    if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.snapshot_list))
      throw Error("moomoo_quotes_unavailable");
    const allowed = new Set(requested);
    for (const value of payload.data.snapshot_list) {
      if (!isObject(value) || typeof value.code !== "string" || !value.code.startsWith("US.")) continue;
      const symbol = value.code.slice(3);
      if (!allowed.has(symbol)) continue;
      const previous = this.moomooSnapshots.get(symbol);
      if (previous && typeof previous.update_time === "number" &&
        (typeof value.update_time !== "number" || value.update_time < previous.update_time)) continue;
      // A broker-reported shrinking range/volume can revise an old bucket outside
      // the rolling tail. Re-read that ticker's own broker history, never SIP prices.
      if (previous && ["", "pre_", "after_"].some(prefix => ["high_price", "volume"].some(field => {
        const old = previous[prefix + field], next = value[prefix + field];
        return typeof old === "number" && typeof next === "number" && next >= 0 && next < old;
      }))) {
        for (const [key, batch] of this.cache.intraday) if (key.split(",").includes(symbol)) batch.bars.rejected.add(symbol);
        for (const [key, batch] of this.cache.daily) if (key.split(",").includes(symbol)) batch.rejected.add(symbol);
        for (const [key, batch] of this.cache.relativeVolume?.series ?? []) if (key.split(",").includes(symbol)) batch.rejected.add(symbol);
        for (const [key, batch] of this.cache.relativeVolume?.bars ?? []) if (key.split(",").includes(symbol)) batch.rejected.add(symbol);
      }
      this.moomooSnapshots.set(symbol, value);
    }
  }

  private cachedMoomooSnapshots(symbols: readonly string[]) {
    return { ret_code: 0, data: { snapshot_list: symbols.flatMap(symbol => {
      const quote = this.moomooSnapshots.get(symbol);
      return quote ? [quote] : [];
    }) } };
  }

  private requireCredentials() {
    if (!this.credentials?.keyId || !this.credentials.secretKey) throw Error("screener_alpaca_credentials_unavailable");
    return this.credentials;
  }

  private moomooData(date: string) {
    if (this.moomoo?.date !== date) this.moomoo = {
      date, data: new MoomooScreenerData(async operation => {
        this.signal.throwIfAborted();
        if (operation.operation === "snapshots") return this.cachedMoomooSnapshots(operation.symbols);
        if (this.transportUnavailable) throw Error("screener_provider_transport_unavailable");
        const entry = operation.operation === "history" ? this.cache.knownCorrections?.get(operation.symbol) : undefined;
        if (operation.operation === "history" && entry?.pending && operation.timeframe !== "1Day"
          && easternClock(operation.start).date <= date && easternClock(operation.end).date >= date)
          throw Error("screener_correction_pending");
        const revision = operation.operation === "history" && entry?.minutes.some(minute => minute * 1000 >= operation.start
          && minute * 1000 <= operation.end + (operation.timeframe === "1Day" ? DAY : 0)) ? entry.revision : undefined;
        try { return await this.transport.moomoo(this.selection,
          operation.operation === "history" && revision ? { ...operation, correctionRevision: revision } : operation, this.signal); }
        catch (error) {
          if (error instanceof Error && error.message === "screener_provider_transport_unavailable") this.transportUnavailable = true;
          throw error;
        }
      }, date),
    };
    return this.moomoo.data;
  }

  private alpacaData() {
    const rest = new AlpacaRestData(this.requireCredentials(), async (url, init) => {
      this.signal.throwIfAborted();
      const response = await fetch(url, { ...init, signal: AbortSignal.any([this.signal, AbortSignal.timeout(25_000)]) });
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (response.status === 429 || (remaining !== null && Number(remaining) < 500)) {
        this.quotaStopped = true;
        await response.body?.cancel();
        throw Error("provider_budget_reserved");
      }
      return response;
    });
    return { get: async (path: string, params: URLSearchParams) => {
      if (this.quotaStopped) throw Error("provider_budget_reserved");
      const startAt = Math.max(Date.now(), this.nextRequest);
      this.nextRequest = startAt + 500;
      await delay(Math.max(0, startAt - Date.now()), undefined, { signal: this.signal });
      if (this.quotaStopped) throw Error("provider_budget_reserved");
      return rest.get(path, params);
    } };
  }
}
