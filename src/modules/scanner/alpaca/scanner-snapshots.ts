import { SCANNER_OPENING_RANGE_MINUTES, type NormalizedSnapshot, type ScannerSession } from "../live/contracts";
import { easternClock } from "../live/sessions";
import type { AlpacaTradingStatus } from "./trading-status";
import type { AlpacaSessionState } from "./session-book";
import { usablePreviousClose, type SplitAdjustedPreviousClose } from "./previous-close";

type Snapshot = { tradingStatus?: AlpacaTradingStatus | null; dailyBar?: { t: string; c: number }; prevDailyBar?: { t: string; c: number }; latestQuote?: { bp: number; ap: number; t?:string }; adjustedPreviousClose?: SplitAdjustedPreviousClose | null };
export type AlpacaQuoteReply = { feed: "sip"; connected: boolean; snapshots: Record<string, Snapshot | null>; sessionTotals?: Record<string, AlpacaSessionState | null> };
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

export function normalizeAlpacaScannerBatch(input: { payload: unknown; requestedSymbols: readonly string[]; session: ScannerSession; tradingDate: string; receivedAt: number; maxQuoteAgeMs?:number }) {
  const payload = input.payload as AlpacaQuoteReply | null;
  const snapshots: NormalizedSnapshot[] = [], issues = new Set<string>();
  const clock = easternClock(input.receivedAt);
  const canReadOpeningRange = input.session !== "premarket" && clock.date === input.tradingDate;
  if (payload?.feed !== "sip" || !payload.connected || !payload.snapshots) throw Error("alpaca_stream_unavailable");
  for (const symbol of input.requestedSymbols) {
    const quote = payload.snapshots[symbol], book = payload.sessionTotals?.[symbol];
    if (!quote || !book?.complete || book.date !== input.tradingDate) { issues.add("alpaca_session_warming"); continue; }
    const current = book.sessions[input.session];
    if (!positive(current.price) || current.providerAt === null) continue;
    const reference = usablePreviousClose(quote.adjustedPreviousClose, symbol, input.tradingDate, input.receivedAt)
      ? quote.adjustedPreviousClose : undefined;
    const baseline = reference?.price ?? null;
    const status = quote.tradingStatus?.symbol === symbol ? quote.tradingStatus : undefined;
    const statusAt = Date.parse(status?.observedAt ?? "");
    const resumedAt = Date.parse(status?.tradeResumedAt ?? "");
    const statusCurrent = status && Number.isFinite(statusAt) && statusAt <= input.receivedAt &&
      easternClock(statusAt).date === input.tradingDate;
    if (baseline === null) issues.add("session_baseline_unavailable");
    const included = input.session === "premarket" ? [book.sessions.premarket] : input.session === "regular" ? [book.sessions.premarket, book.sessions.regular] : Object.values(book.sessions);
    const highs = included.flatMap(value => value.high === null ? [] : [value.high]);
    const lows = included.flatMap(value => value.low === null ? [] : [value.low]);
    const bid = quote.latestQuote?.bp, ask = quote.latestQuote?.ap;
    const quoteAt=Date.parse(quote.latestQuote?.t??"");
    const usable = positive(bid) && positive(ask) && ask >= bid && (input.maxQuoteAgeMs===undefined||Number.isFinite(quoteAt)&&quoteAt<=input.receivedAt&&input.receivedAt-quoteAt<=input.maxQuoteAgeMs);
    const premarket = book.sessions.premarket;
    const regular = input.session === "premarket" ? null : book.sessions.regular;
    const postMarket = input.session === "after_hours" ? book.sessions.after_hours : null;
    snapshots.push({ symbol, company: symbol, provider: "alpaca", session: input.session, tradingDate: input.tradingDate, providerAt: current.providerAt, receivedAt: input.receivedAt,
      price: current.price, baseline, priceTimeBasis: "session_observation", volume: current.volume, dollarVolume: current.dollarVolume,
      regularClosePrice: book.sessions.regular.price,
      ...(statusCurrent ? { halted:status.halted,
        ...(Number.isFinite(resumedAt) && resumedAt <= input.receivedAt && easternClock(resumedAt).date === input.tradingDate
          ? {tradeResumedAt:resumedAt} : {}) } : {}),
      ...(reference && positive(reference.high) && positive(reference.low) && reference.high >= reference.low
        ? {previousDayHigh:reference.high,previousDayLow:reference.low} : {}),
      ...(reference?.statistics ? {
        averageDailyVolume20:reference.statistics.averageVolume20,
        averageDailyRange20:reference.statistics.averageDailyRange20,
        dailyClosedAt:reference.statistics.dailyClosedAt,weeklyClosedAt:reference.statistics.weeklyClosedAt,
        closedDailyReturn:reference.statistics.daily?.percent,closedWeeklyReturn:reference.statistics.weekly?.percent,
        dailyCloseVsSma20:reference.statistics.dailyCloseVsSma20,weeklyCloseVsSma4:reference.statistics.weeklyCloseVsSma4,
        dailyRelativeToSpy:reference.statistics.dailyRelativeToSpy,weeklyRelativeToSpy:reference.statistics.weeklyRelativeToSpy,
        recentDailyHighs:reference.statistics.recentHighs,
      } : {}),
      ...(positive(current.open) ? {sessionOpen:current.open} : {}),
      ...(book.openingRanges && canReadOpeningRange ? {openingRanges: Object.fromEntries(
        SCANNER_OPENING_RANGE_MINUTES.flatMap(minutes => {
          const range = book.openingRanges?.[minutes];
          return range && clock.minute >= 570 + minutes ? [[minutes, range]] : [];
        }),
      )} : {}),
      premarketHigh: premarket.high, premarketLow: premarket.low, premarketVolume: premarket.volume,
      regularHigh: regular?.high ?? null, regularLow: regular?.low ?? null, regularVolume: regular?.volume ?? null,
      postMarketHigh: postMarket?.high ?? null, postMarketLow: postMarket?.low ?? null, postMarketVolume: postMarket?.volume ?? null,
      bid: usable ? bid : null, ask: usable ? ask : null, marketCap: null,
      ...(usable && Number.isFinite(quoteAt) ? {quoteObservedAt: quoteAt} : {}),
      dayHigh: Math.max(current.price, ...highs), dayLow: Math.min(current.price, ...lows), providerVolumeRatio: null });
  }
  const returned = new Set(snapshots.map(row => row.symbol));
  return { snapshots, missingSymbols: input.requestedSymbols.filter(symbol => !returned.has(symbol)), issues: [...issues] };
}
