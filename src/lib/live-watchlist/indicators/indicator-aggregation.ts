import type { IndicatorCandle } from "./indicator-engine";

export type IndicatorSessionWindow = Readonly<{
  key: string;
  /** Exchange-calendar supplied UTC milliseconds; never inferred from a UTC date. */
  start: number;
  end: number;
}>;
export type IndicatorAggregation = Readonly<{
  candles: readonly IndicatorCandle[];
  missingMinutes: readonly number[];
  incompleteBuckets: readonly number[];
}>;

/**
 * Aggregate one-minute evidence inside a single real exchange session.
 * Confirmed no-trade slots may complete coverage, but never manufacture OHLC.
 * Unknown missing slots withhold only the affected bucket.
 */
export function aggregateIndicatorMinutes(input: Readonly<{
  candles: readonly IndicatorCandle[];
  session: IndicatorSessionWindow;
  timeframe: "5m" | "15m";
  completedThrough: number;
  confirmedNoTradeMinutes?: readonly number[];
}>): IndicatorAggregation {
  const { session } = input;
  if (![session.start, session.end, input.completedThrough].every(Number.isSafeInteger) ||
      session.start <= 0 || session.end <= session.start || !session.key ||
      session.start % 60_000 !== 0 || session.end % 60_000 !== 0 ||
      !["5m", "15m"].includes(input.timeframe)) {
    throw new Error("watchlist_indicator_invalid_aggregation_window");
  }
  const byStart = new Map<number, IndicatorCandle>();
  for (const c of input.candles) {
    if (!Number.isSafeInteger(c.start) || c.start % 60_000 !== 0 || c.end !== c.start + 60_000 ||
        c.start < session.start || c.end > session.end || c.sessionKey !== session.key ||
        ![c.open, c.high, c.low, c.close].every(Number.isFinite) ||
        Math.min(c.open, c.high, c.low, c.close) <= 0 || (c.volume !== null && (!Number.isFinite(c.volume) || c.volume < 0)) ||
        c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close) || c.high < c.low ||
        byStart.has(c.start)) {
      throw new Error("watchlist_indicator_invalid_aggregation_candle");
    }
    byStart.set(c.start, c);
  }
  const noTrade = new Set(input.confirmedNoTradeMinutes ?? []);
  for (const time of noTrade) {
    if (!Number.isSafeInteger(time) || time % 60_000 !== 0 || time < session.start || time >= session.end || byStart.has(time)) {
      throw new Error("watchlist_indicator_invalid_no_trade_evidence");
    }
  }
  const duration = input.timeframe === "5m" ? 300_000 : 900_000;
  const candles: IndicatorCandle[] = [];
  const missingMinutes: number[] = [];
  const incompleteBuckets: number[] = [];
  for (let start = session.start; start < Math.min(session.end, input.completedThrough); start += duration) {
    const end = start + duration;
    // A shortened bucket is not relabeled as a full five/fifteen-minute candle.
    if (end > session.end || end > input.completedThrough) { incompleteBuckets.push(start); continue; }
    const members: IndicatorCandle[] = [];
    let missing = false;
    for (let time = start; time < end; time += 60_000) {
      const candle = byStart.get(time);
      if (candle) members.push(candle);
      else if (!noTrade.has(time)) { missingMinutes.push(time); missing = true; }
    }
    if (missing || members.length === 0) continue;
    candles.push({ start, end, sessionKey: session.key,
      open: members[0].open, close: members.at(-1)!.close,
      high: Math.max(...members.map(c => c.high)), low: Math.min(...members.map(c => c.low)),
      volume: members.some(c => c.volume === null) ? null : members.reduce((sum, c) => sum + c.volume!, 0),
    });
  }
  return { candles, missingMinutes, incompleteBuckets };
}
