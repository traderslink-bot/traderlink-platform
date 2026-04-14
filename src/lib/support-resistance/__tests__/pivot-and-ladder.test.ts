import { describe, expect, it } from "vitest";
import { buildResistanceLadder } from "../ladders/build-resistance-ladder";
import { buildSupportLadder } from "../ladders/build-support-ladder";
import { detectStrictPivots } from "../pivots/detect-strict-pivots";
import { detectTightPivots } from "../pivots/detect-tight-pivots";
import { normalizeCandles } from "../../raw-trade-timeline/normalizers/normalize-candle";

describe("pivot detection and first ladders", () => {
  it("detects tight and strict pivots from candle structure and builds support/resistance ladders", () => {
    const candles = normalizeCandles([
      { symbol: "ABCD", timestamp: "2024-04-12T13:30:00.000Z", timeframe: "1m", open: 1.01, high: 1.03, low: 1, close: 1.02, volume: 10000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:31:00.000Z", timeframe: "1m", open: 1.02, high: 1.05, low: 1.01, close: 1.04, volume: 11000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:32:00.000Z", timeframe: "1m", open: 1.04, high: 1.09, low: 1.03, close: 1.08, volume: 12000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:33:00.000Z", timeframe: "1m", open: 1.08, high: 1.13, low: 1.07, close: 1.12, volume: 13000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:34:00.000Z", timeframe: "1m", open: 1.1, high: 1.12, low: 1.02, close: 1.04, volume: 12500 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:35:00.000Z", timeframe: "1m", open: 1.04, high: 1.05, low: 0.98, close: 1, volume: 14000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:36:00.000Z", timeframe: "1m", open: 1, high: 1.02, low: 0.96, close: 0.98, volume: 13500 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:37:00.000Z", timeframe: "1m", open: 0.98, high: 1.01, low: 0.97, close: 1, volume: 12000 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:38:00.000Z", timeframe: "1m", open: 1, high: 1.03, low: 0.99, close: 1.02, volume: 11500 },
      { symbol: "ABCD", timestamp: "2024-04-12T13:39:00.000Z", timeframe: "1m", open: 1.02, high: 1.04, low: 1.01, close: 1.03, volume: 11000 },
    ]);

    const tightPivots = detectTightPivots(candles);
    const strictPivots = detectStrictPivots(candles);
    const combinedPivots = [...strictPivots, ...tightPivots];

    expect(tightPivots.some((pivot) => pivot.side === "resistance" && pivot.price === 1.13)).toBe(true);
    expect(tightPivots.some((pivot) => pivot.side === "support" && pivot.price === 0.96)).toBe(true);
    expect(strictPivots.some((pivot) => pivot.side === "resistance" && pivot.price === 1.13)).toBe(true);
    expect(strictPivots.some((pivot) => pivot.side === "support" && pivot.price === 0.96)).toBe(true);

    const supportLevels = buildSupportLadder({
      timeframe: "1m",
      pivots: combinedPivots,
      referenceLevels: {
        previousDayHigh: null,
        previousDayLow: 0.94,
        previousDayClose: null,
        premarketHigh: null,
        premarketLow: 0.95,
        premarketBase: 0.97,
      },
    });

    const resistanceLevels = buildResistanceLadder({
      timeframe: "1m",
      pivots: combinedPivots,
      referenceLevels: {
        previousDayHigh: 1.14,
        previousDayLow: null,
        previousDayClose: 1.08,
        premarketHigh: 1.12,
        premarketLow: null,
        premarketBase: null,
      },
    });

    expect(supportLevels.some((level) => level.price === 0.96)).toBe(true);
    expect(supportLevels.some((level) => level.referenceLabel === "previous_day_low")).toBe(true);
    expect(resistanceLevels.some((level) => level.price === 1.13)).toBe(true);
    expect(resistanceLevels.some((level) => level.referenceLabel === "previous_day_high")).toBe(true);
  });
});
