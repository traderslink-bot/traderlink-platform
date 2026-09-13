import type { NormalizedMarketCandle } from "../../contracts/candle-review-contracts";

/** A partial response proves only the individual minutes actually returned.
 * Never infer that a missing minute had no volume, or cover an entire request.
 * OHLC/duplicate validation remains the indicator aggregator's responsibility.
 */
export function moomooV1ObservedCoverage(
  receipts: readonly NormalizedMarketCandle[],
  range: Readonly<{ start: number; endExclusive: number }>,
): readonly Readonly<{ start: number; endExclusive: number }>[] {
  const times = [...new Set(moomooV1AnalyzerCandles(receipts, range).map(candle => candle.time))].sort((a, b) => a - b);
  const ranges: { start: number; endExclusive: number }[] = [];
  for (const time of times) {
    const last = ranges.at(-1);
    if (last?.endExclusive === time) last.endExclusive = time + 60;
    else ranges.push({ start: time, endExclusive: time + 60 });
  }
  return Object.freeze(ranges.map(value => Object.freeze(value)));
}

/**
 * moomoo_history_kline_v1 receipts preserve native one-minute END timestamps.
 * Keep that immutable storage contract; normalize only the Analyzer input view.
 * Never apply this to Yahoo, Daily bars, or already normalized analysis output.
 * Native evidence: watchlist-deterministic-indicators-progress.md, 2026-09-12.
 */
export function moomooV1AnalyzerCandles(
  receipts: readonly NormalizedMarketCandle[],
  range: Readonly<{ start: number; endExclusive: number }>,
): readonly NormalizedMarketCandle[] {
  if (!Number.isSafeInteger(range.start) || range.start <= 0 || range.start % 60 !== 0 ||
      !Number.isSafeInteger(range.endExclusive) || range.endExclusive <= range.start ||
      range.endExclusive % 60 !== 0) throw new Error("moomoo_analyzer_range_invalid");
  return Object.freeze(receipts.flatMap((receipt) => {
    if (!Number.isSafeInteger(receipt.time) || receipt.time <= 60 || receipt.time % 60 !== 0) {
      throw new Error("moomoo_analyzer_end_timestamp_invalid");
    }
    const time = receipt.time - 60;
    return time >= range.start && receipt.time <= range.endExclusive
      ? [Object.freeze({ ...receipt, time })] : [];
  }));
}
