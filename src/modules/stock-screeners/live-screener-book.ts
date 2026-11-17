import "server-only";
import { easternClock } from "../scanner/live/sessions";
import { isObject, MAX_LISTINGS, tickerPattern, type Candidate, type LiveScreenerFreshness, type MarketSession, type Snapshot, type Values } from "./contracts";
import type { ScreenerLiveUpdate } from "./live-market-worker";

export const LIVE_SCREENER_MAX_BYTES = 3 * 1024 * 1024;
const LIVE_MAX_AGE = 4_000;
const CLOCK_TOLERANCE = 5_000;
type Phase = Exclude<MarketSession, "last_regular">;
export type LiveScreenerWindow = { session: Phase; start: number; end: number };
export type LiveScreenerFrame = LiveScreenerWindow & {
  generation: number;
  sequence: number;
  sentAt: number;
  reset: boolean;
  rows: ScreenerLiveUpdate[];
};
const isPrice = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const isTime = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const isPhase = (value: unknown): value is Phase => value === "premarket" || value === "regular" || value === "after_hours";

export function parseLiveScreenerFrame(value: unknown, now: number): LiveScreenerFrame {
  if (!isObject(value)) throw Error("invalid_live_frame");
  const { session, start, end, generation, sequence, sentAt, reset, rows } = value;
  if (!isPhase(session) || !isTime(start) || !isTime(end) || start > now || now >= end || end - start > 7 * 3_600_000
    || !isTime(generation) || generation < start || !isTime(sequence) || !isTime(sentAt)
    || generation > sentAt || Math.abs(sentAt - now) > CLOCK_TOLERANCE || typeof reset !== "boolean"
    || !Array.isArray(rows) || rows.length > MAX_LISTINGS) throw Error("invalid_live_frame");
  const symbols = new Set<string>();
  const updates = rows.map(row => {
    if (!isObject(row)) throw Error("invalid_live_row");
    const { symbol, price, priceAt, vwap, vwapAt } = row;
    if (typeof symbol !== "string" || !tickerPattern.test(symbol) || symbols.has(symbol)
      || (price === null ? priceAt !== null : !isPrice(price) || !isTime(priceAt) || priceAt < start || priceAt >= end || priceAt > sentAt + CLOCK_TOLERANCE)
      || (vwap !== null && !isPrice(vwap))
      || (vwapAt !== undefined && (vwap === null || !isTime(vwapAt) || vwapAt < start || vwapAt >= end || vwapAt > sentAt + CLOCK_TOLERANCE)))
      throw Error("invalid_live_row");
    symbols.add(symbol);
    return { symbol, price, priceAt, vwap, ...(vwapAt !== undefined ? { vwapAt } : {}) } as ScreenerLiveUpdate;
  });
  return { session, start, end, generation, sequence, sentAt, reset, rows: updates };
}

type Book = LiveScreenerWindow & {
  date: string;
  generation: number;
  sequence: number;
  updatedAt: number;
  rows: Map<string, ScreenerLiveUpdate>;
};
type BookState = typeof globalThis & { traderlinkScreenersLiveBook?: Book };
const state = globalThis as BookState;

export function acceptLiveScreenerFrame(frame: LiveScreenerFrame, now: number): "accepted" | "resync" {
  let book = state.traderlinkScreenersLiveBook;
  if (book && frame.generation < book.generation) return "resync";
  if (book?.generation === frame.generation && frame.sequence <= book.sequence) return "accepted";
  if (!book || book.generation !== frame.generation) {
    if (!frame.reset) return "resync";
    book = { session: frame.session, start: frame.start, end: frame.end, date: easternClock(frame.start).date,
      generation: frame.generation, sequence: 0, updatedAt: 0, rows: new Map() };
  }
  if (book.session !== frame.session || book.start !== frame.start || book.end !== frame.end
    || (!frame.reset && (frame.sequence !== book.sequence + 1 || now - book.updatedAt > LIVE_MAX_AGE))) return "resync";
  const additions = frame.rows.filter(row => !book.rows.has(row.symbol)).length;
  if ((frame.reset ? frame.rows.length : book.rows.size + additions) > MAX_LISTINGS) return "resync";
  if (frame.reset) book.rows.clear();
  for (const row of frame.rows) book.rows.set(row.symbol, row);
  book.sequence = frame.sequence;
  book.updatedAt = now;
  state.traderlinkScreenersLiveBook = book;
  return "accepted";
}

const percent = (price: number, baseline: number) => (price / baseline - 1) * 100;

function withLiveValues(row: Candidate, update: ScreenerLiveUpdate): Candidate {
  const values: Values = { ...row.values };
  let priceAt = row.priceAt;
  if (update.price !== null && update.priceAt !== null && (priceAt === undefined || update.priceAt >= priceAt)) {
    const previous = values.price;
    const change = values.change;
    if (previous !== undefined && change !== undefined && change > -100) {
      values.change = percent(update.price, previous / (1 + change / 100));
    }
    if (isPrice(values.high)) values.high = Math.max(values.high, update.price);
    if (isPrice(values.low)) values.low = Math.min(values.low, update.price);
    if (isPrice(values.high) && isPrice(values.low)) values.range = percent(values.high, values.low);
    for (const [period, level, direction] of [
      ["fromHigh", "high", -1], ["fromLow", "low", 1],
      ["dist20", "sma20", 1], ["dist50", "sma50", 1], ["dist200", "sma200", 1],
      ["below52High", "week52high", -1], ["above52Low", "week52low", 1],
    ] as const) {
      const reference = values[level];
      if (isPrice(reference)) values[period] = direction * percent(update.price, reference) || 0;
    }
    for (const minutes of [5, 15, 30, 60] as const) {
      const high = values[`or${minutes}High`], low = values[`or${minutes}Low`];
      if (high !== undefined && low !== undefined) {
        values[`or${minutes}Position`] = update.price > high ? 1 : update.price < low ? -1 : 0;
      }
    }
    values.price = update.price;
    priceAt = update.priceAt;
  }
  delete values.sessionVwap;
  delete values.vwapPosition;
  delete values.vwapDistance;
  if (update.vwap !== null && values.price !== undefined) {
    values.sessionVwap = update.vwap;
    values.vwapPosition = values.price > update.vwap ? 1 : values.price < update.vwap ? -1 : 0;
    values.vwapDistance = percent(values.price, update.vwap);
  }
  return { ...row, values, priceAt };
}

/** The prepared snapshot still supplies the universe, daily data and completed-bar reads. */
export function applyLiveScreenerBook(snapshot: Snapshot, now: number) {
  const freshness = new Map<string, LiveScreenerFreshness>();
  const book = state.traderlinkScreenersLiveBook;
  if (!book || snapshot.source !== "Alpaca SIP" || snapshot.closed || snapshot.session !== book.session
    || snapshot.date !== book.date || now < book.start || now >= book.end || now - book.updatedAt > LIVE_MAX_AGE)
    return { snapshot, freshness };
  const rows = snapshot.rows.map(row => {
    const update = book.rows.get(row.symbol);
    if (!update) return row;
    const applied = withLiveValues(row, update);
    const priceAt = update.priceAt !== null && applied.priceAt === update.priceAt ? update.priceAt : undefined;
    const vwapAt = applied.values.sessionVwap !== undefined ? update.vwapAt : undefined;
    if (priceAt !== undefined || vwapAt !== undefined) freshness.set(row.symbol, { priceAt, vwapAt });
    return applied;
  });
  return { snapshot: { ...snapshot, rows }, freshness };
}
