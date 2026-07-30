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

function directionalKind(kind: CandlePatternEvent["kind"]): "bearish" | "bullish" | null {
  if (kind.includes("bullish") || kind === "rejection_lower") return "bullish";
  if (kind.includes("bearish") || kind === "rejection_upper") return "bearish";
  return null;
}

function relativeVolume(candles: readonly TradeCandle[], time: number): number {
  const index = candles.findIndex((candle) => candle.time === time);
  if (index < 0) return 0;
  const prior = candles.slice(Math.max(0, index - 20), index).filter((candle) => candle.volume > 0);
  if (prior.length === 0) return 0;
  const average = prior.reduce((sum, candle) => sum + candle.volume, 0) / prior.length;
  return average > 0 ? candles[index]!.volume / average : 0;
}

function followThroughScore(candles: readonly TradeCandle[], event: CandlePatternEvent): number {
  const index = candles.findIndex((candle) => candle.time === event.time);
  const direction = directionalKind(event.kind);
  if (index < 0 || direction === null || index + 1 >= candles.length) return 0;
  const next = candles.slice(index + 1, index + 4);
  if (next.length === 0) return 0;
  const moved = direction === "bullish"
    ? Math.max(...next.map((candle) => candle.high)) > candles[index]!.high
    : Math.min(...next.map((candle) => candle.low)) < candles[index]!.low;
  return moved ? 1 : 0;
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
    return zones.map(([zone, anchor]) => {
      const candle = args.candles.find((candidate) => candidate.time === event.time);
      const volume = relativeVolume(args.candles, event.time);
      const direction = directionalKind(event.kind);
      const executionPrice = zone === "entry" ? args.trade.entryPrice : args.trade.exitPrice;
      const location = candle && direction !== null
        ? direction === "bullish" ? candle.high >= executionPrice : candle.low <= executionPrice
        : false;
      return {
        kind: event.kind,
        time: event.time,
        zone,
        score: proximityScore(event.time, anchor) * 5 + Math.min(volume, 4) + (location ? 1 : 0) + followThroughScore(args.candles, event),
      };
    });
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
