type CandleTime = Readonly<{ time: number }>;

type ExecutionTime = Readonly<{ executedAtUtc: string }>;

function executionMinute(executedAtUtc: string): number | null {
  const milliseconds = Date.parse(executedAtUtc);
  return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 60_000) * 60 : null;
}

function candleTimes(candles: readonly CandleTime[]): ReadonlySet<number> {
  return new Set(candles.map((candle) => candle.time));
}

/**
 * The Daily Trade Analyzer may proceed only when every execution has a candle
 * for its containing minute. This deliberately does not require every minute
 * of the extended session to exist.
 */
export function hasEveryExecutionMinute(
  candles: readonly CandleTime[],
  executions: readonly ExecutionTime[],
): boolean {
  const times = candleTimes(candles);
  return executions.every((event) => {
    const minute = executionMinute(event.executedAtUtc);
    return minute !== null && times.has(minute);
  });
}

/**
 * A post-execution path is available when its target minute or the immediately
 * preceding minute is present, matching Daily Trade Analyzer path semantics.
 */
export function hasTargetOrPriorMinute(
  candles: readonly CandleTime[],
  executedAtUtc: string,
  minutesAfterExecution: number,
): boolean {
  const minute = executionMinute(executedAtUtc);
  if (minute === null || !Number.isSafeInteger(minutesAfterExecution) || minutesAfterExecution < 1) {
    return false;
  }
  const target = minute + minutesAfterExecution * 60;
  const times = candleTimes(candles);
  return times.has(target) || times.has(target - 60);
}

/**
 * Provider-normalized candles must be strictly ordered and unique by minute.
 */
export function hasStrictlyIncreasingCandleTimes(candles: readonly CandleTime[]): boolean {
  let priorTime: number | null = null;
  for (const candle of candles) {
    if (!Number.isSafeInteger(candle.time) || (priorTime !== null && candle.time <= priorTime)) {
      return false;
    }
    priorTime = candle.time;
  }
  return true;
}
