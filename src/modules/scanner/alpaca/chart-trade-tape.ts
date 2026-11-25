import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { easternClock } from "../live/sessions";
import { easternDayStart } from "./candles";
import type { AlpacaChartCalendar } from "./chart-calendar-provider";
import type { AlpacaRestData } from "./rest-data";
import { alpacaMinuteTradeRules } from "./session-book";

export type ChartTapeTrade = Readonly<{ position: number; time: string; price: number }>;
export type ChartTapeFrame =
  | { kind: "snapshot"; stream: string; through: number; trades: ChartTapeTrade[];
      symbol: string; feed: "sip"; session: "regular"; date: string; start: string; cutoff: string }
  | { kind: "batch"; stream: string; after: number; through: number; trades: ChartTapeTrade[] }
  | { kind: "reset"; stream: string };
type TapeStatus = "warming" | "unavailable" | "limit" | "closed";
type TapeReader = { tape(frame: ChartTapeFrame): void; status(state: TapeStatus): void; close(): void };
type UnpositionedPrint = { key: string; time: string; order: bigint; price: number; eligible: boolean };
type Print = UnpositionedPrint & { arrival: number };
type Correction = { key: string; kind: "correct"; replacement: string; originalPrice: number; price: number; eligible: boolean };
type Mutation =
  | { key: string; kind: "cancel" }
  | Correction;
type Window = { date: string; start: number; end: number; cutoff: number };
const limit = 50_000;
const maxPages = 10;
const bootstrapTimeout = 25_000;
const retryMs = 5_000;
const ns = (milliseconds: number) => BigInt(milliseconds) * BigInt(1_000_000);

function timestamp(value: unknown) {
  if (typeof value !== "string") throw Error("unavailable");
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/u.exec(value);
  if (!match) throw Error("unavailable");
  const second = Date.parse(match[1] + "Z");
  if (!Number.isFinite(second) || new Date(second).toISOString().slice(0, 19) !== match[1]) throw Error("unavailable");
  return ns(second) + BigInt((match[2] ?? "").padEnd(9, "0"));
}

function tradeKey(value: Record<string, unknown>, id: unknown) {
  if (typeof value.x !== "string" || !/^[A-Z]$/u.test(value.x) || typeof value.z !== "string" ||
    !/^[ABC]$/u.test(value.z) || (typeof id !== "number" || !Number.isSafeInteger(id) || id < 0) &&
    (typeof id !== "string" || !/^(?:0|[1-9]\d{0,19})$/u.test(id))) throw Error("unavailable");
  return value.z + ":" + value.x + ":" + id;
}

function tradePrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw Error("unavailable");
  return value;
}

function priceEligible(conditions: unknown, tape: unknown) {
  if (!Array.isArray(conditions) || conditions.some(item => typeof item !== "string")) throw Error("unavailable");
  const rules = alpacaMinuteTradeRules({ c: conditions, z: String(tape) });
  if (!rules.known) throw Error("unavailable");
  return rules.prices;
}

function tradePrint(value: Record<string, unknown>, order: bigint): UnpositionedPrint {
  return { key: tradeKey(value, value.i), time: String(value.t), order,
    price: tradePrice(value.p), eligible: priceEligible(value.c, value.z) };
}

function readMutation(value: Record<string, unknown>): Mutation {
  if (value.T === "x" && (value.a === "C" || value.a === "E")) return { key: tradeKey(value, value.i), kind: "cancel" };
  if (value.T !== "c") throw Error("unavailable");
  return { kind: "correct", key: tradeKey(value, value.oi), replacement: tradeKey(value, value.ci),
    originalPrice: tradePrice(value.op), price: tradePrice(value.cp), eligible: priceEligible(value.cc, value.z) };
}

const chronological = (a: Print, b: Print) => a.order < b.order ? -1 : a.order > b.order ? 1 : a.arrival - b.arrival;
const samePrint = (a: UnpositionedPrint, b: UnpositionedPrint) => a.order === b.order && a.price === b.price && a.eligible === b.eligible;

class TradeTape {
  readonly records = new Map<string, Print>();
  readonly mutations: Mutation[] = [];
  private seenMutations = new Set<string>();
  private retired = new Set<string>();
  private deferredCorrections = new Map<string, Correction>();
  private nextArrival = 0;
  ordered: Print[] = [];
  additions: Print[] = [];
  rebuild = true;

  observe(value: Record<string, unknown>, window: Window) {
    if (value.T !== "t") {
      this.mutate(readMutation(value));
      return;
    }
    const time = timestamp(value.t);
    if (time >= ns(window.start) && time < ns(window.end)) this.insert(tradePrint(value, time));
  }

  insert(value: UnpositionedPrint, arrival?: number) {
    const print = { ...value, arrival: arrival ?? this.nextArrival++ };
    if (this.retired.has(print.key)) return;
    const correction = this.deferredCorrections.get(print.key);
    if (correction) {
      this.deferredCorrections.delete(print.key);
      this.replace(print, correction);
      return;
    }
    const prior = this.records.get(print.key);
    if (prior) {
      if (!samePrint(prior, print)) throw Error("unavailable");
      return;
    }
    if (this.records.size + this.retired.size >= limit) throw Error("limit");
    this.records.set(print.key, print);
    if (print.eligible) this.additions.push(print);
  }

  mutate(mutation: Mutation) {
    const signature = JSON.stringify(mutation);
    if (this.seenMutations.has(signature)) return;
    if (this.mutations.length >= limit || this.retired.size >= limit) throw Error("limit");
    const original = this.records.get(mutation.key);
    if (mutation.kind === "correct") {
      const corrected = this.records.get(mutation.replacement);
      if (corrected && mutation.key !== mutation.replacement &&
        (corrected.price !== mutation.price || corrected.eligible !== mutation.eligible ||
          (original && original.order !== corrected.order))) throw Error("unavailable");
      if (original) this.replace(original, mutation);
      else if (corrected) this.retired.add(mutation.key);
      else if (!this.retired.has(mutation.key)) this.deferredCorrections.set(mutation.key, mutation);
    } else {
      this.retired.add(mutation.key);
      this.deferredCorrections.delete(mutation.key);
      this.records.delete(mutation.key);
    }
    this.seenMutations.add(signature);
    this.mutations.push(mutation);
    if (original) this.rebuild = true;
  }

  private replace(original: Print, correction: Correction) {
    if (original.price !== correction.originalPrice &&
      !(correction.key === correction.replacement && original.price === correction.price)) throw Error("unavailable");
    this.records.delete(original.key);
    if (original.key !== correction.replacement) this.retired.add(original.key);
    const corrected = { ...original, key: correction.replacement, price: correction.price, eligible: correction.eligible };
    const prior = this.records.get(corrected.key);
    if (prior && !samePrint(prior, corrected)) throw Error("unavailable");
    this.records.delete(corrected.key);
    this.insert(corrected, original.arrival);
  }

  flush() {
    const next = this.additions.sort(chronological);
    const last = this.ordered.at(-1);
    if (this.rebuild || (last && next.length && chronological(next[0], last) < 0)) {
      this.ordered = [...this.records.values()].filter(print => print.eligible).sort(chronological);
      this.additions = [];
      this.rebuild = false;
      return { replace: true, after: 0, prints: this.ordered };
    }
    const after = this.ordered.length;
    this.ordered.push(...next);
    this.additions = [];
    return { replace: false, after, prints: next };
  }
}

async function history(rest: Pick<AlpacaRestData, "get">, symbol: string, window: Window, signal: AbortSignal) {
  const tape = new TradeTape();
  const seenTokens = new Set<string>();
  const query = new URLSearchParams({ symbols: symbol, feed: "sip", sort: "asc", asof: "-",
    limit: "10000", start: new Date(window.start).toISOString(), end: new Date(window.cutoff).toISOString() });
  let count = 0, previous = ns(window.start);
  for (let page = 0; page < maxPages; page++) {
    const value = await rest.get("/v2/stocks/trades", query, signal) as {
      trades?: Record<string, unknown>; next_page_token?: unknown;
    };
    if (!value?.trades || Array.isArray(value.trades) || typeof value.trades !== "object" ||
      Object.keys(value.trades).some(key => key !== symbol)) throw Error("unavailable");
    const rows = value.trades[symbol] ?? [];
    if (!Array.isArray(rows) || rows.length > 10_000) throw Error("unavailable");
    count += rows.length;
    if (count > limit) throw Error("limit");
    for (const row of rows) {
      if (!row || typeof row !== "object") throw Error("unavailable");
      const time = timestamp(row.t);
      if (time < previous || time > ns(window.cutoff)) throw Error("unavailable");
      previous = time;
      if (time < ns(window.end)) tape.insert(tradePrint(row, time));
    }
    const token = value.next_page_token;
    if (token === null) return tape;
    if (typeof token !== "string" || !token || token.length > 4_096 || seenTokens.has(token)) throw Error("unavailable");
    if (count === limit) throw Error("limit");
    seenTokens.add(token);
    query.set("page_token", token);
  }
  throw Error("limit");
}

type Entry = { readers: Set<TapeReader>; window?: Window; tape?: TradeTape; stream?: string; status: TapeStatus;
  work?: AbortController; pending: Record<string, unknown>[]; retryAt: number; idleAt: number; date: string };

export class ChartTradeTapeHub {
  private entries = new Map<string, Entry>();
  private confirmed = new Set<string>();
  constructor(private readonly rest: Pick<AlpacaRestData, "get">, private readonly calendar: Pick<AlpacaChartCalendar, "forYear">,
    private readonly changed: (removed?: string) => void, private readonly now: () => number = Date.now) {}

  symbols() { return [...this.entries.keys()]; }

  attach(symbol: string, reader: TapeReader) {
    const total = [...this.entries.values()].reduce((sum, entry) => sum + entry.readers.size, 0);
    let entry = this.entries.get(symbol);
    if (total >= 8 || (!entry && this.entries.size >= 4)) throw Error("busy");
    if (!entry) {
      entry = { readers: new Set(), pending: [], retryAt: 0, idleAt: 0, date: "", status: "warming" };
      this.entries.set(symbol, entry);
    }
    const current = entry;
    current.readers.add(reader);
    current.idleAt = 0;
    this.advance(symbol, current);
    if (current.stream) reader.tape(this.snapshot(symbol, current));
    else reader.status(current.status);
    this.changed();
    return () => {
      current.readers.delete(reader);
      if (!current.readers.size) current.idleAt = this.now() + 15_000;
    };
  }

  acknowledge(trades: unknown, corrections: unknown, cancellations: unknown) {
    const corrected = new Set(Array.isArray(corrections) ? corrections : []);
    const cancelled = new Set(Array.isArray(cancellations) ? cancellations : []);
    this.confirmed = new Set((Array.isArray(trades) ? trades : []).filter(symbol =>
      typeof symbol === "string" && corrected.has(symbol) && cancelled.has(symbol)));
    for (const [symbol, entry] of this.entries) {
      if (!this.confirmed.has(symbol)) this.invalidate(entry, "warming");
      else this.advance(symbol, entry);
    }
  }

  observe(message: Record<string, unknown>) {
    if (typeof message.S !== "string") return;
    const entry = this.entries.get(message.S);
    if (!entry || !this.confirmed.has(message.S) || (!entry.work && !entry.stream)) return;
    try {
      if (entry.work) {
        if (entry.pending.length >= limit) throw Error("limit");
        entry.pending.push(message);
      } else if (entry.tape && entry.window) entry.tape.observe(message, entry.window);
    } catch (error) { this.fail(entry, error); }
  }

  tick() {
    for (const [symbol, entry] of this.entries) {
      if (entry.idleAt && entry.idleAt <= this.now()) {
        entry.work?.abort();
        this.entries.delete(symbol);
        this.changed(symbol);
        continue;
      }
      this.advance(symbol, entry);
      if (entry.stream) this.flush(symbol, entry);
    }
  }

  disconnected() {
    this.confirmed.clear();
    for (const entry of this.entries.values()) this.invalidate(entry, "warming");
  }

  close() {
    const entries = [...this.entries.values()];
    this.entries.clear();
    for (const entry of entries) {
      entry.work?.abort();
      for (const reader of entry.readers) reader.close();
    }
  }

  private advance(symbol: string, entry: Entry) {
    const date = easternClock(this.now()).date;
    if (entry.date !== date) {
      this.invalidate(entry, "warming");
      entry.tape = undefined;
      entry.window = undefined;
      entry.retryAt = 0;
      entry.date = date;
    }
    if (!this.confirmed.has(symbol) || entry.work || entry.stream || this.now() < entry.retryAt || entry.status === "limit") return;
    const controller = new AbortController();
    entry.work = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(bootstrapTimeout)]);
    this.state(entry, "warming");
    void this.load(symbol, date, entry, signal).catch(error => {
      if (entry.work === controller) this.fail(entry, error);
    }).finally(() => {
      if (entry.work === controller) {
        entry.work = undefined;
        entry.pending = [];
      }
    });
  }

  private async load(symbol: string, date: string, entry: Entry, signal: AbortSignal) {
    const calendar = await this.calendar.forYear(Number(date.slice(0, 4)));
    signal.throwIfAborted();
    if (!calendar.available || calendar.start > date || calendar.end < date) throw Error("unavailable");
    const session = calendar.sessions.find(row => row.date === date);
    const midnight = easternDayStart(Date.parse(date + "T12:00:00Z") / 1000) * 1000;
    const at = (clock: string) => midnight + (Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3))) * 60_000;
    if (!session || this.now() < at(session.open)) {
      entry.retryAt = this.now() + retryMs;
      this.state(entry, "closed");
      return;
    }
    const end = at(session.close);
    const window = { date, start: at(session.open), end, cutoff: Math.min(this.now(), end) };
    // The confirmed WebSocket buffers the live side while the REST boundary settles.
    if (window.cutoff < end) await delay(500, undefined, { signal });
    const rebuilt = await history(this.rest, symbol, window, signal);
    signal.throwIfAborted();
    if (entry.date !== easternClock(this.now()).date || !this.confirmed.has(symbol)) throw Error("unavailable");
    for (const mutation of entry.tape?.mutations ?? []) rebuilt.mutate(mutation);
    for (const message of entry.pending) rebuilt.observe(message, window);
    entry.tape = rebuilt;
    entry.window = window;
    this.flush(symbol, entry);
  }

  private state(entry: Entry, status: TapeStatus) {
    if (entry.status === status) return;
    entry.status = status;
    for (const reader of entry.readers) reader.status(status);
  }

  private reset(entry: Entry) {
    const stream = entry.stream;
    entry.stream = undefined;
    if (stream) for (const reader of entry.readers) reader.tape({ kind: "reset", stream });
  }

  private invalidate(entry: Entry, status: TapeStatus) {
    entry.work?.abort();
    entry.work = undefined;
    entry.pending = [];
    this.reset(entry);
    this.state(entry, status);
  }

  private fail(entry: Entry, error: unknown) {
    entry.retryAt = this.now() + retryMs;
    this.invalidate(entry, error instanceof Error && error.message === "limit" ? "limit" : "unavailable");
  }

  private snapshot(symbol: string, entry: Entry): ChartTapeFrame {
    const window = entry.window!, tape = entry.tape!;
    return { kind: "snapshot", stream: entry.stream!, through: tape.ordered.length, trades: project(tape.ordered, 0),
      symbol, feed: "sip", session: "regular", date: window.date,
      start: new Date(window.start).toISOString(), cutoff: new Date(window.cutoff).toISOString() };
  }

  private flush(symbol: string, entry: Entry) {
    if (!entry.tape || !entry.window || (!entry.stream && !entry.work)) return;
    const { replace, prints, after } = entry.tape.flush();
    if (replace) {
      this.reset(entry);
      entry.stream = randomUUID();
      const frame = this.snapshot(symbol, entry);
      for (const reader of entry.readers) reader.tape(frame);
    } else if (entry.stream && prints.length) {
      const stream = entry.stream;
      const frame = { kind: "batch" as const, stream, after, through: after + prints.length, trades: project(prints, after) };
      for (const reader of entry.readers) reader.tape(frame);
    }
  }
}

function project(prints: readonly Print[], after: number): ChartTapeTrade[] {
  return prints.map(({ time, price }, index) => ({ position: after + index + 1, time, price }));
}
