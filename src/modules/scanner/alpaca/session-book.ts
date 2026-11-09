import type { AlpacaRestData } from "./rest-data";
import { easternClock } from "../live/sessions";

export type AlpacaSessionTotal = { volume: number; dollarVolume: number; high: number | null; low: number | null; price: number | null; providerAt: number | null };
export type AlpacaSessionState = { date: string; regularClose: number; complete: boolean; sessions: Record<"premarket" | "regular" | "after_hours", AlpacaSessionTotal> };
type Trade = { T?: string; S?: string; t: string; p: number; s: number; i: number | string; x: string; c?: string[]; z?: string };
type Entry = { state: AlpacaSessionState; pending: Trade[]; cutoff: number | null; coveredThrough: number | null; overflow: boolean; working: boolean; retryAt: number };
function afterCutoff(timestamp: string, cutoff: number): boolean {
  const milliseconds = Date.parse(timestamp);
  if (!Number.isFinite(milliseconds)) return false;
  const fraction = /\.(\d+)Z$/.exec(timestamp)?.[1] ?? "";
  const remainder = Number(fraction.padEnd(9, "0").slice(3, 9));
  return milliseconds > cutoff || milliseconds === cutoff && remainder > 0;
}
const empty = (): AlpacaSessionTotal => ({ volume: 0, dollarVolume: 0, high: null, low: null, price: null, providerAt: null });
const fresh = (date: string, regularClose: number): AlpacaSessionState => ({ date, regularClose, complete: false, sessions: { premarket: empty(), regular: empty(), after_hours: empty() } });
const KNOWN = new Set([" ", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "O", "P", "Q", "R", "T", "U", "V", "W", "X", "Y", "Z", "4", "5", "6", "7", "9"]);
export function alpacaMinuteTradeRules(trade: Pick<Trade, "c" | "z">) {
  const conditions = trade.c?.length ? trade.c : [trade.z === "C" ? "@" : " "];
  return {
    known: conditions.every(condition => KNOWN.has(condition)),
    volume: !conditions.some(condition => ["M", "Q", "9"].includes(condition)),
    prices: !conditions.some(condition => ["C", "G", "H", "I", "M", "N", "P", "Q", "R", "U", "V", "W", "Z", "4", "7", "9"].includes(condition) || (condition === "B" && trade.z !== "C")),
  };
}

/** SIP trade-condition rules: Alpaca Market Data FAQ, stock minute-bar rules. */
export function applyAlpacaTrade(state: AlpacaSessionState, trade: Trade): boolean {
  const time = Date.parse(trade.t);
  if (!Number.isFinite(time) || !Number.isFinite(trade.p) || trade.p <= 0 || !Number.isSafeInteger(trade.s) || trade.s < 0) return false;
  const clock = easternClock(time);
  if (clock.date !== state.date || clock.minute < 240 || clock.minute >= 1200) return true;
  const rules = alpacaMinuteTradeRules(trade);
  if (!rules.known) return false;
  const session = clock.minute < 570 ? "premarket" : clock.minute < state.regularClose ? "regular" : "after_hours";
  const total = state.sessions[session];
  const { volume, prices } = rules;
  if (volume) { total.volume += trade.s; total.dollarVolume += trade.p * trade.s; }
  if (prices) {
    total.high = Math.max(total.high ?? trade.p, trade.p); total.low = Math.min(total.low ?? trade.p, trade.p);
    if (total.providerAt === null || time >= total.providerAt) { total.price = trade.p; total.providerAt = time; }
  }
  return true;
}

/** No minute-volume approximation: incomplete startup/gap coverage stays unavailable. */
export class AlpacaSessionBook {
  private readonly entries = new Map<string, Entry>();
  private readonly queue: string[] = [];
  private readonly seen = new Map<string, true>();
  private workers = 0;
  private generation = 0;
  constructor(private readonly rest: AlpacaRestData,private readonly changed?:(symbol:string)=>void) {}
  invalidate() {
    this.generation++;
    for (const entry of this.entries.values()) { entry.state.complete = false; entry.overflow = true; }
  }
  observe(message: unknown) {
    const trade = message as Trade;
    if (!trade?.S) return;
    const entry = this.entries.get(trade.S); if (!entry) return;
    if (trade.T === "c" || trade.T === "x") { entry.state.complete = false; entry.overflow = true; return; }
    if (trade.T !== "t") return;
    if (entry.working && entry.cutoff !== null) {
      if (Date.parse(trade.t) >= entry.cutoff) entry.pending.push(trade);
      if (entry.pending.length > 50_000) { entry.pending.length = 0; entry.overflow = true; }
      return;
    }
    if (!entry.state.complete) return;
    if (entry.coveredThrough !== null && !afterCutoff(trade.t, entry.coveredThrough)) return;
    const key = `${trade.S}:${trade.x}:${trade.i}:${trade.t}`;
    if (this.seen.has(key)) return;
    this.seen.set(key, true);
    while (this.seen.size > 100_000) this.seen.delete(this.seen.keys().next().value!);
    if (!applyAlpacaTrade(entry.state, trade)) { entry.state.complete = false; entry.overflow = true; }
  }
  read(symbol: string, date: string, regularClose: number): AlpacaSessionState {
    let entry = this.entries.get(symbol);
    if (!entry || entry.state.date !== date || entry.state.regularClose !== regularClose) {
      entry = { state: fresh(date, regularClose), pending: [], cutoff: null, coveredThrough: null, overflow: false, working: false, retryAt: 0 };
      this.entries.set(symbol, entry);
    }
    if (!entry.state.complete && !entry.working && entry.retryAt <= Date.now() && !this.queue.includes(symbol)) this.queue.push(symbol);
    this.pump(); return structuredClone(entry.state);
  }
  remove(symbol: string) { this.entries.delete(symbol); }
  private pump() {
    while (this.workers < 4 && this.queue.length) {
      const symbol = this.queue.shift()!, entry = this.entries.get(symbol);
      if (!entry || entry.working) continue;
      entry.working = true; this.workers++;
      void this.warm(symbol, entry).finally(() => { entry.working = false; this.workers--; this.pump(); });
    }
  }
  private async warm(symbol: string, entry: Entry) {
    const generation = this.generation;
    const cutoff = Date.now(); entry.cutoff = cutoff; entry.pending = []; entry.overflow = false;
    const rebuilt = fresh(entry.state.date, entry.state.regularClose);
    const boundary = new Set<string>();
    try {
      let token: string | null = null, complete = false;
      for (let page = 0; page < 200; page++) {
        if (generation !== this.generation || this.entries.get(symbol) !== entry) return;
        const query = new URLSearchParams({ symbols: symbol, start: `${rebuilt.date}T00:00:00Z`, end: new Date(cutoff).toISOString(), feed: "sip", sort: "asc", limit: "10000" });
        if (token) query.set("page_token", token);
        const response = await this.rest.get("/v2/stocks/trades", query) as { trades?: Record<string, Trade[]>; next_page_token?: unknown };
        if (!response.trades || !Array.isArray(response.trades[symbol] ?? [])) throw Error("invalid_trade_history");
        for (const trade of response.trades[symbol] ?? []) {
          if (!applyAlpacaTrade(rebuilt, trade)) throw Error("unrecognized_trade");
          if (Date.parse(trade.t) >= cutoff) boundary.add(`${symbol}:${trade.x}:${trade.i}:${trade.t}`);
        }
        const next = response.next_page_token;
        if (next === null || next === undefined || next === "") { complete = true; break; }
        if (typeof next !== "string" || next === token) throw Error("invalid_pagination");
        token = next;
      }
      if (!complete || entry.overflow || generation !== this.generation || this.entries.get(symbol) !== entry) return;
      for (const trade of entry.pending) {
        const key = `${symbol}:${trade.x}:${trade.i}:${trade.t}`;
        if (boundary.has(key)) continue;
        boundary.add(key);
        if (!applyAlpacaTrade(rebuilt, trade)) return;
        this.seen.set(key, true);
      }
      while (this.seen.size > 100_000) this.seen.delete(this.seen.keys().next().value!);
      rebuilt.complete = true; entry.state = rebuilt; entry.coveredThrough = cutoff;this.changed?.(symbol);
    } catch { /* Never substitute a partial prefix as the full session counter. */ }
    finally { entry.pending = []; entry.cutoff = null; entry.retryAt = Date.now() + 30_000; }
  }
}
