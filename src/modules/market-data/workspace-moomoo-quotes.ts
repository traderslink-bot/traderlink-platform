import type { ScannerSession } from "@/src/modules/scanner/live/contracts";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { normalizeSnapshotBatch } from "@/src/modules/scanner/live/snapshots";

export type WorkspaceQuoteSession = Readonly<{
  date: string;
  session: ScannerSession;
  regularCloseMinute: number;
}>;

export type WorkspaceMoomooQuote = Readonly<{
  symbol: string;
  observedAt: number;
  price: number;
  previousClose: number | null;
  regularClose: number | null;
  premarketVolume: number | null;
  regularVolume: number | null;
  postMarketVolume: number | null;
  sessionTurnover: number | null;
  premarketHigh: number | null;
  regularHigh: number | null;
  postMarketHigh: number | null;
  dayHigh: number | null;
  dayLow: number | null;
}>;

export type WorkspaceMoomooBook = Readonly<{
  observedAt: number;
  bid: number;
  ask: number;
}>;

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function positive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function volume(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function turnover(value: unknown): number | null {
  return value === 0 ? 0 : positive(value);
}

function matchesSession(at: unknown, context: WorkspaceQuoteSession, receivedAt: number): at is number {
  if (typeof at !== "number" || !Number.isSafeInteger(at) || at <= 0 || at > receivedAt + 2_000) return false;
  const { date, minute } = easternClock(at);
  if (date !== context.date) return false;
  if (context.session === "premarket") return minute >= 240 && minute < 570;
  if (context.session === "regular") return minute >= 570 && minute < context.regularCloseMinute;
  return minute >= context.regularCloseMinute && minute < context.regularCloseMinute + 240;
}

export function readWorkspacePushQuote(symbol: string, payload: unknown, context: WorkspaceQuoteSession, receivedAt: number): WorkspaceMoomooQuote | null {
  const data = record(payload);
  if (!data) return null;
  const pre = record(data.pre_market);
  const post = record(data.after_market);
  const active = context.session === "premarket" ? pre : context.session === "after_hours" ? post : data;
  if (!active) return null;
  const observedAt = active.data_time_ms ?? data.data_time_ms;
  if (!matchesSession(observedAt, context, receivedAt)) return null;
  const price = positive(context.session === "regular" ? active.last_price : active.price);
  if (price === null) return null;
  const day = context.session === "premarket" ? [pre] : context.session === "regular" ? [pre, data] : [pre, data, post];
  const highs = day.flatMap(part => positive(part?.high_price) ?? []);
  const lows = day.flatMap(part => positive(part?.low_price) ?? []);
  return {
    symbol, observedAt, price,
    previousClose: positive(context.session === "premarket" ? data.last_price : data.prev_close_price),
    regularClose: context.session === "after_hours" ? positive(data.last_price) : null,
    premarketVolume: volume(pre?.volume),
    regularVolume: context.session !== "premarket" ? volume(data.volume) : null,
    postMarketVolume: context.session === "after_hours" ? volume(post?.volume) : null,
    sessionTurnover: turnover(active.turnover),
    premarketHigh: positive(pre?.high_price),
    regularHigh: context.session !== "premarket" ? positive(data.high_price) : null,
    postMarketHigh: context.session === "after_hours" ? positive(post?.high_price) : null,
    dayHigh: highs.length ? Math.max(price, ...highs) : null,
    dayLow: lows.length ? Math.min(price, ...lows) : null,
  };
}

export function readWorkspacePushBook(payload: unknown, context: WorkspaceQuoteSession, receivedAt: number): WorkspaceMoomooBook | null {
  const data = record(payload);
  if (!data || !matchesSession(data.data_time_ms, context, receivedAt)) return null;
  const bid = positive(Array.isArray(data.bid_list) ? record(data.bid_list[0])?.price : undefined);
  const ask = positive(Array.isArray(data.ask_list) ? record(data.ask_list[0])?.price : undefined);
  return bid !== null && ask !== null && ask >= bid ? { observedAt: data.data_time_ms, bid, ask } : null;
}

export function readWorkspaceRestQuotes(payload: unknown, requestedSymbols: readonly string[], context: WorkspaceQuoteSession, receivedAt: number) {
  const { snapshots } = normalizeSnapshotBatch({
    payload, requestedSymbols, session: context.session, tradingDate: context.date, receivedAt,
    qualification: { sessionTimestampVerified: true, sessionCountersVerified: true,
      afterHoursRegularCloseVerified: false, priceTimeBasis: "session_observation" },
  });
  const values = record(record(payload)?.data)?.snapshot_list;
  const raw = new Map((Array.isArray(values) ? values : []).flatMap(value => {
    const row = record(value);
    return row && typeof row.code === "string" ? [[row.code, row] as const] : [];
  }));
  return snapshots.flatMap(row => {
    if (!matchesSession(row.providerAt, context, receivedAt)) return [];
    const source = raw.get(`US.${row.symbol}`);
    const quote: WorkspaceMoomooQuote = {
      symbol: row.symbol, observedAt: row.providerAt, price: row.price,
      previousClose: row.baseline, regularClose: row.regularClosePrice ?? null,
      premarketVolume: row.premarketVolume ?? null,
      regularVolume: context.session !== "premarket" ? volume(source?.volume) : null,
      postMarketVolume: context.session === "after_hours" ? row.volume : null,
      sessionTurnover: row.dollarVolume,
      premarketHigh: row.premarketHigh ?? null,
      regularHigh: context.session !== "premarket" ? positive(source?.high_price) : null,
      postMarketHigh: context.session === "after_hours" ? positive(source?.after_high_price) : null,
      dayHigh: row.dayHigh, dayLow: row.dayLow,
    };
    // Snapshot bid/ask can lack a session-specific timestamp in extended hours.
    const book: WorkspaceMoomooBook | null = context.session === "regular" && row.bid !== null && row.ask !== null
      ? { observedAt: row.providerAt, bid: row.bid, ask: row.ask } : null;
    return [{ quote, book }];
  });
}
