import Decimal from "decimal.js";
import type { DaySessionTradeAnalyzer } from "./[sessionDate]/day-session-types";
import type { buildWrittenTradeReview } from "./analyzer-written-review-model";

/** Concise factual summary; no inferred intentions, recommendations or new market-data requests. */
export function tradeSummaryPoints(analysis: DaySessionTradeAnalyzer, review: NonNullable<ReturnType<typeof buildWrittenTradeReview>>, money: (value: string) => string, timeframe: "1m" | "5m" = "1m"): string[] {
  const first = [...analysis.events].sort((a, b) => Date.parse(a.executedAt) - Date.parse(b.executedAt) || a.sequence - b.sequence)
    .find(event => event.kind === "entry" || event.kind === "add");
  const references = ([
    [first?.metrics?.vwapDistance?.signedDistance, 'session VWAP'],
    [timeframe === '5m' ? first?.fiveMinuteContext?.completedBeforeExecution?.ema9Distance?.signedDistance : first?.metrics?.ema9Distance?.signedDistance,
      timeframe === '5m' ? '5-minute EMA 9 from the last completed candle' : '1-minute EMA 9'],
  ] as const).flatMap(([distance, label]) => {
    if (distance == null) return [];
    if (!Number.isFinite(Number(distance)) || distance.trim() === '') return [];
    const value = new Decimal(distance);
    return value.isFinite() ? [`${value.isZero() ? 'at' : value.isNegative() ? 'below' : 'above'} ${label}`] : [];
  });
  const adds = review.fills.filter(fill => fill.label === "Added shares").length;
  const reentries = review.fills.filter(fill => fill.label === "Re-entered").length;
  const entry = `${references.length ? `Your first entry was ${references.join(' and ')}` : 'You opened the position'}.${adds ? ` You added ${adds === 1 ? 'once' : `${adds} times`}.` : ''}${timeframe === '5m' && !first?.fiveMinuteContext?.completedBeforeExecution?.ema9Distance ? ' The saved 5-minute EMA 9 is unavailable for that entry.' : ''}${reentries ? ` You re-entered ${reentries === 1 ? 'once' : `${reentries} times`} within this saved trade.` : ''}`;
  const exits = review.fills.filter(fill => fill.grossPnl !== null);
  const partials = exits.filter(fill => new Decimal(fill.remaining).gt(0)).length;
  const profit = exits.reduce((sum, fill) => sum.plus(Decimal.max(0, fill.grossPnl!)), new Decimal(0));
  const exit = `${partials ? `You scaled out in ${partials} partial ${partials === 1 ? 'exit' : 'exits'}, then closed what remained.` : exits.length === 1 ? 'You closed the position in one full exit.' : `You closed each position in full across ${exits.length} exits.`} ${profit.toDecimalPlaces(2).gt(0) ? `Profitable exits secured ${money(profit.toFixed())} gross before any losing exits were deducted.` : 'No exit secured a profit.'}`;
  const path = review.path;
  const outcome = new Decimal(review.finalPnl).toDecimalPlaces(2);
  const finish = outcome.isZero() ? 'finished at breakeven' : outcome.lt(0) ? 'finished red' : 'finished green';
  const peak = new Decimal(review.peak).toDecimalPlaces(2);
  const journey = path.status === 'unavailable' ? 'The saved candles are not sufficient to summarize the green-to-red path.'
    : path.firstGreenAtUtcSeconds === null ? 'The trade did not turn green at the saved candle closes or executions.'
      : `${peak.gt(0) ? `Peak profit opportunity was ${money(review.peak)}. ` : ''}${path.firstRedAtUtcSeconds === null ? 'After becoming profitable, the trade did not turn red.' : path.firstRecoveryAtUtcSeconds === null ? `It turned red, never recovered above breakeven and ${finish}.` : `It turned red and recovered, then ${finish}.`}`;
  return [entry, journey, exit];
}
