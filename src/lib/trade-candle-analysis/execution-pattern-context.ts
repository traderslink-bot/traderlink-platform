import type { TradeCandle } from "./candle-analysis";
import {
  detectMicroCapCandlePatterns,
  type CandlePatternKind,
} from "./pattern-detection";

export const EXECUTION_PATTERN_TIMEFRAMES = Object.freeze(["1m", "5m", "15m"] as const);

export type ExecutionPatternTimeframe = (typeof EXECUTION_PATTERN_TIMEFRAMES)[number];

export type ExecutionPatternContext = Readonly<{
  availableAtExecution: boolean;
  candlesBeforeExecution: 0 | 1 | 2;
  kind: CandlePatternKind;
  knownAtTime: number;
  score: number;
  time: number;
  timeframe: ExecutionPatternTimeframe;
}>;

const TIMEFRAME_SECONDS: Readonly<Record<ExecutionPatternTimeframe, number>> = Object.freeze({
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
});

const FOLLOWING_CANDLE_CONFIRMATION = new Set<CandlePatternKind>([
  "hammer_bullish",
  "high_volume_exhaustion",
  "shooting_star_bearish",
]);

export function executionTimeframeBucketTime(
  time: number,
  timeframe: ExecutionPatternTimeframe,
): number {
  const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
  return Math.floor(time / intervalSeconds) * intervalSeconds;
}

export function aggregateCompleteExecutionTimeframeCandles(
  candles: readonly TradeCandle[],
  timeframe: ExecutionPatternTimeframe,
): readonly TradeCandle[] {
  if (timeframe === "1m") return candles;
  const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
  const expectedSourceCount = intervalSeconds / 60;
  const buckets = new Map<number, TradeCandle & { sourceCount: number }>();
  for (const candle of candles) {
    const time = executionTimeframeBucketTime(candle.time, timeframe);
    const current = buckets.get(time);
    if (!current) {
      buckets.set(time, {
        ...candle,
        sourceCount: 1,
        time,
      });
      continue;
    }
    current.close = candle.close;
    current.high = Math.max(current.high, candle.high);
    current.low = Math.min(current.low, candle.low);
    current.sourceCount += 1;
    current.volume += candle.volume;
    current.turnover = current.turnover == null || candle.turnover == null
      ? null
      : current.turnover + candle.turnover;
  }
  return Object.freeze([...buckets.values()]
    .filter((candle) => candle.sourceCount === expectedSourceCount)
    .map((candle) => Object.freeze({
      close: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      time: candle.time,
      turnover: candle.turnover,
      volume: candle.volume,
    })));
}

function detectContinuousPatterns(
  candles: readonly TradeCandle[],
  intervalSeconds: number,
): ReturnType<typeof detectMicroCapCandlePatterns> {
  const runs = candles.reduce<TradeCandle[][]>((result, candle) => {
    const current = result.at(-1);
    const prior = current?.at(-1);
    if (!prior || candle.time === prior.time + intervalSeconds) {
      if (current) current.push(candle);
      else result.push([candle]);
    } else {
      result.push([candle]);
    }
    return result;
  }, []);
  return Object.freeze(runs.flatMap((run) => detectMicroCapCandlePatterns(run)));
}

/**
 * Returns only the execution candle and two preceding candles for each
 * supported timeframe. Patterns remain anchored to their source candle and
 * record when the completed evidence was actually knowable.
 */
export function detectExecutionPatternContexts(
  candles: readonly TradeCandle[],
  executedAtUtcSeconds: number,
): readonly ExecutionPatternContext[] {
  if (!Number.isFinite(executedAtUtcSeconds)) return Object.freeze([]);
  const executionMinute = Math.floor(executedAtUtcSeconds / 60) * 60;
  const contexts = EXECUTION_PATTERN_TIMEFRAMES.flatMap((timeframe) => {
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    const timeframeCandles = aggregateCompleteExecutionTimeframeCandles(candles, timeframe);
    const executionBucket = executionTimeframeBucketTime(executionMinute, timeframe);
    const executionIndex = timeframeCandles.findIndex((candle) => candle.time === executionBucket);
    if (executionIndex < 0) return [];
    const patternsByTime = new Map(detectContinuousPatterns(timeframeCandles, intervalSeconds)
      .map((pattern) => [pattern.time, pattern] as const));
    return ([0, 1, 2] as const).flatMap((candlesBeforeExecution) => {
      const candle = timeframeCandles[executionIndex - candlesBeforeExecution];
      const pattern = candle ? patternsByTime.get(candle.time) : null;
      if (!pattern) return [];
      const knownAtTime = pattern.time + intervalSeconds *
        (FOLLOWING_CANDLE_CONFIRMATION.has(pattern.kind) ? 2 : 1);
      return [Object.freeze({
        availableAtExecution: knownAtTime <= executedAtUtcSeconds,
        candlesBeforeExecution,
        kind: pattern.kind,
        knownAtTime,
        score: 1 - candlesBeforeExecution * 0.15,
        time: pattern.time,
        timeframe,
      })];
    });
  });
  return Object.freeze(contexts);
}
