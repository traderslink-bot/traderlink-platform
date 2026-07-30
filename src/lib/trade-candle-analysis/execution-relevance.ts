import type { CandleAnalysisTrade, TradeCandle } from "./candle-analysis";
import type { CandlePatternEvent } from "./pattern-detection";

export type ExecutionZone = "entry" | "exit" | "held_peak";

export type RelevantCandleObservation = {
  kind: CandlePatternEvent["kind"];
  score: number;
  time: number;
  zone: ExecutionZone;
};

function peakTime(candles: readonly TradeCandle[], trade: CandleAnalysisTrade): number | null {
  const held = candles.filter((candle) => candle.time >= trade.entryTime && candle.time <= trade.exitTime);
  if (!held.length) return null;
  return held.reduce((best, candle) =>
    trade.direction === "long"
      ? candle.high > best.high ? candle : best
      : candle.low < best.low ? candle : best,
  ).time;
}

function proximityScore(time: number, anchor: number): number {
  return Math.max(0, 1 - Math.abs(time - anchor) / (15 * 60));
}

export function selectExecutionRelevantPatterns(args: {
  candles: readonly TradeCandle[];
  events: readonly CandlePatternEvent[];
  trade: CandleAnalysisTrade;
  limit?: number;
}): readonly RelevantCandleObservation[] {
  const peak = peakTime(args.candles, args.trade);
  const ranked = args.events.flatMap((event) => {
    const zones: Array<[ExecutionZone, number]> = [];
    if (event.time >= args.trade.entryTime - 10 * 60 && event.time <= args.trade.entryTime + 15 * 60) zones.push(["entry", args.trade.entryTime]);
    if (event.time >= args.trade.exitTime - 10 * 60 && event.time <= args.trade.exitTime + 30 * 60) zones.push(["exit", args.trade.exitTime]);
    if (peak !== null && event.time >= peak - 10 * 60 && event.time <= peak + 5 * 60) zones.push(["held_peak", peak]);
    return zones.map(([zone, anchor]) => ({ kind: event.kind, time: event.time, zone, score: proximityScore(event.time, anchor) }));
  });
  const seen = new Set<string>();
  return ranked
    .sort((left, right) => right.score - left.score)
    .filter((event) => {
      const key = `${event.zone}:${event.kind}:${event.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, args.limit ?? 3);
}
