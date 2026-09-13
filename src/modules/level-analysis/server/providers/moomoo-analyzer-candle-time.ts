import type { NormalizedMarketCandle } from "../../contracts/candle-review-contracts";

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
