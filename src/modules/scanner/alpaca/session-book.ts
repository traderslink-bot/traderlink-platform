import type { AlpacaRestData } from "./rest-data";
import { easternDayStart, type Candle } from "./candles";
import { SCANNER_OPENING_RANGE_MINUTES, type ScannerOpeningRanges } from "../live/contracts";
import { easternClock } from "../live/sessions";

export type AlpacaSessionTotal = { volume: number; dollarVolume: number; high: number | null; low: number | null; price: number | null; providerAt: number | null; open?: number; largestTradeShares?: number; largestTradeDollars?: number; firstTradeAt?: string; lastTradeAt?: string };
export type AlpacaSessionState = { date: string; regularClose: number; complete: boolean; correctionRevision?: number; openingRanges?: ScannerOpeningRanges; sessions: Record<"premarket" | "regular" | "after_hours", AlpacaSessionTotal> };
type Trade = { u?: string; T?: string; S?: string; t: string; p: number; s: number; i: number | string; x: string; c?: string[]; z?: string };
type OpeningBars = (symbol: string, date: string, start: number, end: number) => readonly Pick<Candle, "time" | "high" | "low">[] | null;
type OpeningRead = { checkedAt: number; requestedMinutes: number; verifiedMinutes: number; ranges: ScannerOpeningRanges };
type Entry = { state: AlpacaSessionState; pending: Trade[]; cutoff: number | null; coveredThrough: number | null; overflow: boolean; working: boolean; retryAt: number; openingRead?: OpeningRead };
const openingReadIntervalMs = 30_000;
function fractionNanoseconds(timestamp: string) {
  return Number((/\.(\d+)(?:Z|[+-]\d{2}:?\d{2})$/iu.exec(timestamp)?.[1] ?? "").slice(0, 9).padEnd(9, "0"));
}
function afterCutoff(timestamp: string, cutoff: number): boolean {
  const milliseconds = Date.parse(timestamp);
  if (!Number.isFinite(milliseconds)) return false;
  const remainder = fractionNanoseconds(timestamp) % 1_000_000;
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

function extendOpeningRanges(state: AlpacaSessionState, minute: number, price: number) {
  if (minute < 570 || minute >= 600 || minute >= state.regularClose) return false;
  const ranges = state.openingRanges ??= {};
  let changed = false;
  for (const minutes of SCANNER_OPENING_RANGE_MINUTES) {
    if (minute >= 570 + minutes) continue;
    const range = ranges[minutes];
    if (range && price >= range.low && price <= range.high) continue;
    ranges[minutes] = { high: Math.max(range?.high ?? price, price), low: Math.min(range?.low ?? price, price) };
    changed = true;
  }
  return changed;
}

function lateOpeningTradeMinute(state: AlpacaSessionState, trade: Trade) {
  const at = Date.parse(trade.t);
  if (!Number.isFinite(at) || !Number.isFinite(trade.p) || trade.p <= 0 || !Number.isSafeInteger(trade.s) || trade.s < 0) return;
  const clock = easternClock(at);
  if (clock.date !== state.date || clock.minute < 570 || clock.minute >= Math.min(600, state.regularClose)) return;
  const rules = alpacaMinuteTradeRules(trade);
  if (rules.known && rules.prices) return clock.minute;
}

/** SIP trade-condition rules: Alpaca Market Data FAQ, stock minute-bar rules. */
export function applyAlpacaTrade(state: AlpacaSessionState, trade: Trade): boolean {
  // Historical SIP pages retain canceled prints and superseded originals.
  if (trade.u === "canceled" || trade.u === "incorrect") return true;
  if (trade.u !== undefined && trade.u !== "corrected") return false;
  const time = Date.parse(trade.t);
  if (!Number.isFinite(time) || !Number.isFinite(trade.p) || trade.p <= 0 || !Number.isSafeInteger(trade.s) || trade.s < 0) return false;
  const clock = easternClock(time);
  if (clock.date !== state.date || clock.minute < 240 || clock.minute >= 1200) return true;
  const rules = alpacaMinuteTradeRules(trade);
  if (!rules.known) return false;
  const session = clock.minute < 570 ? "premarket" : clock.minute < state.regularClose ? "regular" : "after_hours";
  const total = state.sessions[session];
  const { volume, prices } = rules;
  if (volume) {
    total.volume += trade.s;
    const dollars = trade.p * trade.s;
    total.dollarVolume += dollars;
    total.largestTradeShares = Math.max(total.largestTradeShares ?? 0, trade.s);
    total.largestTradeDollars = Math.max(total.largestTradeDollars ?? 0, dollars);
  }
  if (prices) {
    total.high = Math.max(total.high ?? trade.p, trade.p); total.low = Math.min(total.low ?? trade.p, trade.p);
    if (session === "regular") extendOpeningRanges(state, clock.minute, trade.p);
    const first = total.firstTradeAt;
    const firstMs = first ? Date.parse(first) : undefined;
    if (firstMs === undefined || time < firstMs || (time === firstMs &&
      fractionNanoseconds(trade.t) < fractionNanoseconds(first!))) {
      total.open = trade.p;
      total.firstTradeAt = trade.t;
    }
    if (total.providerAt === null || time > total.providerAt || (time === total.providerAt &&
      (!total.lastTradeAt || fractionNanoseconds(trade.t) >= fractionNanoseconds(total.lastTradeAt)))) {
      total.price = trade.p;
      total.providerAt = time;
      total.lastTradeAt = trade.t;
    }
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
  private openingSession?: { date: string; start: number };
  constructor(private readonly rest: AlpacaRestData, private readonly changed?: (symbol: string) => void,
    private readonly readOpeningBars?: OpeningBars) {}
  invalidate() {
    this.generation++;
    for (const entry of this.entries.values()) { entry.state.complete = false; entry.overflow = true; entry.retryAt = 0; }
  }
  observe(message: unknown) {
    const trade = message as Trade;
    if (!trade?.S) return;
    const entry = this.entries.get(trade.S); if (!entry) return;
    if (trade.T === "c" || trade.T === "x") { entry.state.complete = false; entry.overflow = true; return; }
    if (trade.T !== "t") return;
    if (entry.working && entry.cutoff !== null) {
      if (Date.parse(trade.t) >= entry.cutoff || lateOpeningTradeMinute(entry.state, trade) !== undefined) entry.pending.push(trade);
      if (entry.pending.length > 50_000) { entry.pending.length = 0; entry.overflow = true; }
      return;
    }
    if (!entry.state.complete) return;
    if (entry.coveredThrough !== null && !afterCutoff(trade.t, entry.coveredThrough)) {
      const minute = lateOpeningTradeMinute(entry.state, trade);
      // A late price can extend a range even if history omitted that execution.
      // Keep volume and other session counters on the deduplicated history boundary.
      if (minute !== undefined && extendOpeningRanges(entry.state, minute, trade.p)) this.changed?.(trade.S);
      return;
    }
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
    this.pump();
    const snapshot = structuredClone(entry.state);
    if (snapshot.complete && this.readOpeningBars) this.reconcileOpeningRanges(symbol, entry, snapshot, this.readOpeningBars);
    return snapshot;
  }

  private reconcileOpeningRanges(symbol: string, entry: Entry, snapshot: AlpacaSessionState, readBars: OpeningBars) {
    const now = Date.now();
    if (this.openingSession?.date !== snapshot.date) {
      const midnight = easternDayStart(Date.parse(snapshot.date + "T12:00:00Z") / 1_000);
      this.openingSession = { date: snapshot.date, start: midnight + 570 * 60 };
    }
    const open = this.openingSession.start;
    const closed = SCANNER_OPENING_RANGE_MINUTES.filter(minutes => (open + minutes * 60) * 1_000 <= now);
    const requestedMinutes = closed.at(-1);
    if (!requestedMinutes) return;

    let verified = entry.openingRead;
    if (!verified || verified.requestedMinutes !== requestedMinutes || now - verified.checkedAt >= openingReadIntervalMs) {
      verified = { checkedAt: now, requestedMinutes, verifiedMinutes: 0, ranges: {} };
      for (const minutes of [...closed].reverse()) {
        const bars = readBars(symbol, snapshot.date, open, open + minutes * 60);
        if (!bars) continue;
        verified.verifiedMinutes = minutes;
        for (const period of closed) {
          if (period > minutes) break;
          const inside = bars.filter(bar => bar.time < open + period * 60);
          if (inside.length) verified.ranges[period] = {
            high: Math.max(...inside.map(bar => bar.high)), low: Math.min(...inside.map(bar => bar.low)),
          };
        }
        break;
      }
      entry.openingRead = verified;
    }

    if (!verified.verifiedMinutes) return;
    const ranges = snapshot.openingRanges ??= {};
    for (const minutes of closed) {
      if (minutes > verified.verifiedMinutes) break;
      const range = verified.ranges[minutes];
      if (range) ranges[minutes] = { ...range };
      else delete ranges[minutes];
    }
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
        if (Date.parse(trade.t) < cutoff) {
          const minute = lateOpeningTradeMinute(rebuilt, trade);
          if (minute !== undefined) extendOpeningRanges(rebuilt, minute, trade.p);
          continue;
        }
        const key = `${symbol}:${trade.x}:${trade.i}:${trade.t}`;
        if (boundary.has(key)) continue;
        boundary.add(key);
        if (!applyAlpacaTrade(rebuilt, trade)) return;
        this.seen.set(key, true);
      }
      while (this.seen.size > 100_000) this.seen.delete(this.seen.keys().next().value!);
      rebuilt.complete = true; entry.state = rebuilt; entry.coveredThrough = cutoff;this.changed?.(symbol);
    } catch { /* Never substitute a partial prefix as the full session counter. */ }
    finally { entry.pending = []; entry.cutoff = null; entry.retryAt = generation === this.generation ? Date.now() + 30_000 : 0; }
  }
}
