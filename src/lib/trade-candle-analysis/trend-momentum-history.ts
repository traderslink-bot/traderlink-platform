import type { TradeCandle } from "./candle-analysis";

/** Completed request coverage, not a claim that every minute contained trades. */
export type IndicatorHistoryRange = Readonly<{
  start: number;
  endExclusive: number;
}>;

export type IndicatorHistoryInput = Readonly<{
  candles: readonly TradeCandle[];
  completedRanges: readonly IndicatorHistoryRange[];
  asOf: number;
}>;

function validTime(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function mergedCoverage(ranges: readonly IndicatorHistoryRange[]): IndicatorHistoryRange[] {
  const merged: { start: number; endExclusive: number }[] = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (!validTime(range.start) || !validTime(range.endExclusive) ||
        range.endExclusive <= range.start) throw new Error("indicator_history_range_invalid");
    const previous = merged.at(-1);
    if (previous && range.start <= previous.endExclusive) {
      previous.endExclusive = Math.max(previous.endExclusive, range.endExclusive);
    } else merged.push({ ...range });
  }
  return merged;
}

function covers(ranges: readonly IndicatorHistoryRange[], start: number, end: number): boolean {
  return ranges.some((range) => range.start <= start && range.endExclusive >= end);
}

export function hasCompletedIndicatorCoverage(
  ranges: readonly IndicatorHistoryRange[], start: number, endExclusive: number,
): boolean {
  if (!validTime(start) || !validTime(endExclusive) || endExclusive <= start) return false;
  return covers(mergedCoverage(ranges), start, endExclusive);
}

function validCandle(candle: TradeCandle): boolean {
  return validTime(candle.time) && candle.time % 60 === 0 &&
    [candle.open, candle.high, candle.low, candle.close].every((price) => Number.isFinite(price) && price > 0) &&
    Number.isFinite(candle.volume) && candle.volume >= 0 &&
    candle.high >= Math.max(candle.open, candle.close, candle.low) &&
    candle.low <= Math.min(candle.open, candle.close) &&
    (candle.turnover == null || (Number.isFinite(candle.turnover) && candle.turnover >= 0));
}

/** Isolated from the stricter candle-pattern aggregator. No synthetic candles. */
export function aggregateIndicatorHistory(
  input: IndicatorHistoryInput,
  interval: "1m" | "5m",
): readonly Readonly<TradeCandle>[] {
  if (!validTime(input.asOf)) throw new Error("indicator_history_asof_invalid");
  const ranges = mergedCoverage(input.completedRanges);
  const unique = new Map<number, TradeCandle>();
  for (const candle of input.candles) {
    if (!validCandle(candle)) throw new Error("indicator_history_candle_invalid");
    if (candle.time + 60 > input.asOf || !covers(ranges, candle.time, candle.time + 60)) continue;
    const prior = unique.get(candle.time);
    if (prior && ["open", "high", "low", "close", "volume", "turnover"].some((key) => {
      const field = key as keyof TradeCandle;
      return (prior[field] ?? null) !== (candle[field] ?? null);
    })) throw new Error("indicator_history_duplicate_conflict");
    unique.set(candle.time, { ...candle });
  }
  const ordered = [...unique.values()].sort((a, b) => a.time - b.time);
  if (interval === "1m") return Object.freeze(ordered.map((bar) => Object.freeze(bar)));
  const buckets = new Map<number, TradeCandle>();
  for (const candle of ordered) {
    const start = Math.floor(candle.time / 300) * 300;
    if (start + 300 > input.asOf || !covers(ranges, start, start + 300)) continue;
    const bucket = buckets.get(start);
    if (!bucket) buckets.set(start, { ...candle, time: start });
    else {
      bucket.close = candle.close;
      bucket.high = Math.max(bucket.high, candle.high);
      bucket.low = Math.min(bucket.low, candle.low);
      bucket.volume += candle.volume;
      bucket.turnover = bucket.turnover == null || candle.turnover == null
        ? null : bucket.turnover + candle.turnover;
      if (!Number.isFinite(bucket.volume) || (bucket.turnover != null && !Number.isFinite(bucket.turnover))) {
        throw new Error("indicator_history_volume_overflow");
      }
    }
  }
  return Object.freeze([...buckets.values()].map((bar) => Object.freeze(bar)));
}

export type IndicatorWarmupRequirement = Readonly<{
  interval: "1m" | "5m";
  requiredBars: number;
}>;

/** The calibrated policy supplies the bar target; this module invents no target. */
export function inspectIndicatorWarmup(
  input: IndicatorHistoryInput,
  requirements: readonly IndicatorWarmupRequirement[],
): readonly Readonly<{
  interval: "1m" | "5m";
  availableBars: number;
  missingBars: number;
  lastBarClosedAt: number | null;
  observationAgeSeconds: number | null;
}>[] {
  const frames = new Map<"1m" | "5m", readonly Readonly<TradeCandle>[]>();
  return Object.freeze(requirements.map((requirement) => {
    if (!Number.isSafeInteger(requirement.requiredBars) || requirement.requiredBars < 1) {
      throw new Error("indicator_history_requirement_invalid");
    }
    let candles = frames.get(requirement.interval);
    if (!candles) {
      candles = aggregateIndicatorHistory(input, requirement.interval);
      frames.set(requirement.interval, candles);
    }
    const last = candles.at(-1);
    const closedAt = last ? last.time + (requirement.interval === "1m" ? 60 : 300) : null;
    return Object.freeze({
      interval: requirement.interval,
      availableBars: candles.length,
      missingBars: Math.max(0, requirement.requiredBars - candles.length),
      lastBarClosedAt: closedAt,
      observationAgeSeconds: closedAt === null ? null : input.asOf - closedAt,
    });
  }));
}
