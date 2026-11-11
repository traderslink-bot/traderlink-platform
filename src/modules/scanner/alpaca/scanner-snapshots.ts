import type { NormalizedSnapshot, ScannerSession } from "../live/contracts";
import type { AlpacaSessionState } from "./session-book";
import { usablePreviousClose, type SplitAdjustedPreviousClose } from "./previous-close";

type Snapshot = { dailyBar?: { t: string; c: number }; prevDailyBar?: { t: string; c: number }; latestQuote?: { bp: number; ap: number; t?:string }; adjustedPreviousClose?: SplitAdjustedPreviousClose | null };
export type AlpacaQuoteReply = { feed: "sip"; connected: boolean; snapshots: Record<string, Snapshot | null>; sessionTotals?: Record<string, AlpacaSessionState | null> };
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

export function normalizeAlpacaScannerBatch(input: { payload: unknown; requestedSymbols: readonly string[]; session: ScannerSession; tradingDate: string; receivedAt: number; maxQuoteAgeMs?:number }) {
  const payload = input.payload as AlpacaQuoteReply | null;
  const snapshots: NormalizedSnapshot[] = [], issues = new Set<string>();
  if (payload?.feed !== "sip" || !payload.connected || !payload.snapshots) throw Error("alpaca_stream_unavailable");
  for (const symbol of input.requestedSymbols) {
    const quote = payload.snapshots[symbol], book = payload.sessionTotals?.[symbol];
    if (!quote || !book?.complete || book.date !== input.tradingDate) { issues.add("alpaca_session_warming"); continue; }
    const current = book.sessions[input.session];
    if (!positive(current.price) || current.providerAt === null) continue;
    const baseline = usablePreviousClose(quote.adjustedPreviousClose, symbol, input.tradingDate, input.receivedAt)
      ? quote.adjustedPreviousClose.price : null;
    if (baseline === null) issues.add("session_baseline_unavailable");
    const included = input.session === "premarket" ? [book.sessions.premarket] : input.session === "regular" ? [book.sessions.premarket, book.sessions.regular] : Object.values(book.sessions);
    const highs = included.flatMap(value => value.high === null ? [] : [value.high]);
    const lows = included.flatMap(value => value.low === null ? [] : [value.low]);
    const bid = quote.latestQuote?.bp, ask = quote.latestQuote?.ap;
    const quoteAt=Date.parse(quote.latestQuote?.t??"");
    const usable = positive(bid) && positive(ask) && ask >= bid && (input.maxQuoteAgeMs===undefined||Number.isFinite(quoteAt)&&quoteAt<=input.receivedAt&&input.receivedAt-quoteAt<=input.maxQuoteAgeMs);
    snapshots.push({ symbol, company: symbol, provider: "alpaca", session: input.session, tradingDate: input.tradingDate, providerAt: current.providerAt, receivedAt: input.receivedAt,
      price: current.price, baseline, priceTimeBasis: "session_observation", volume: current.volume, dollarVolume: current.dollarVolume,
      regularClosePrice: book.sessions.regular.price, premarketHigh: book.sessions.premarket.high, premarketVolume: book.sessions.premarket.volume,
      regularHigh: input.session === "premarket" ? null : book.sessions.regular.high,
      postMarketHigh: input.session === "after_hours" ? book.sessions.after_hours.high : null,
      bid: usable ? bid : null, ask: usable ? ask : null, marketCap: null,
      dayHigh: Math.max(current.price, ...highs), dayLow: Math.min(current.price, ...lows), providerVolumeRatio: null });
  }
  const returned = new Set(snapshots.map(row => row.symbol));
  return { snapshots, missingSymbols: input.requestedSymbols.filter(symbol => !returned.has(symbol)), issues: [...issues] };
}
