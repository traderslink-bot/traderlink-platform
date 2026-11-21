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
    private readonly signal: AbortSignal, private readonly credentials?: Credentials) {}

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
      data: { get: (path, params) => { this.signal.throwIfAborted(); return data.get(path, params); } },
      onBatch: () => this.signal.throwIfAborted(),
    });
    this.signal.throwIfAborted();
    if (this.quotaStopped) throw Error("provider_budget_reserved");
    if (this.transportUnavailable) throw Error("screener_provider_transport_unavailable");
    return { ...pack, selection: this.selection };
  }

  async initialMoomooPack() {
    if (this.selection.provider !== "moomoo") throw Error("screener_provider_invalid_selection");
    const reference = await this.referenceData();
    const now = Date.now();
    const { start, end } = reference.calendarRange;
    return collectMoomooQuotePack({ now, clock: Date.now, signal: this.signal,
      stocks: reference.listings.stocks, universeDate: reference.listings.listingDate,
      calendar: parseCalendarSessions(reference.calendar, start, end),
      read: async symbols => this.cachedMoomooSnapshots(symbols) });
  }

  observeMoomooSnapshots(payload: unknown, requested: readonly string[]) {
    this.signal.throwIfAborted();
    if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.snapshot_list))
      throw Error("moomoo_quotes_unavailable");
    const allowed = new Set(requested);
    for (const value of payload.data.snapshot_list) {
      if (!isObject(value) || typeof value.code !== "string" || !value.code.startsWith("US.")) continue;
      const symbol = value.code.slice(3);
      if (allowed.has(symbol)) this.moomooSnapshots.set(symbol, value);
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
        try { return await this.transport.moomoo(this.selection, operation, this.signal); }
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
