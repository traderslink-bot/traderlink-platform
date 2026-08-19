import { describe, expect, it } from "vitest";

import type { TradeCandle } from "./candle-analysis";
import {
  acceptedRsi14,
  calculateIndicatorPoints,
  RSI_14_CALCULATION_VERSION,
} from "./indicator-context";

function candles(closes: readonly number[]): readonly TradeCandle[] {
  return closes.map((close, index) => Object.freeze({
    close,
    high: close + 0.1,
    low: close - 0.1,
    open: close,
    time: index + 1,
    volume: 1_000,
  }));
}

describe("calculateIndicatorPoints RSI 14", () => {
  it("uses the classic 14-change Wilder seed and smoothing", () => {
    const points = calculateIndicatorPoints(candles([
      54.8, 56.8, 57.85, 59.85, 60.57, 61.1, 62.17, 60.6,
      62.35, 62.15, 62.35, 61.45, 62.8, 61.37, 62.5, 62.57,
    ]));

    expect(points.slice(0, 14).every((point) => point.rsi14 === null)).toBe(true);
    expect(points[14]?.rsi14).toBeCloseTo(74.21383647798743, 10);
    expect(points[15]?.rsi14).toBeCloseTo(74.33551617873653, 10);
    expect(points[15]?.rsi14CalculationVersion).toBe(RSI_14_CALCULATION_VERSION);
  });

  it("returns 100 after fourteen gains with no loss", () => {
    const points = calculateIndicatorPoints(candles(
      Array.from({ length: 15 }, (_, index) => index + 1),
    ));

    expect(points[14]?.rsi14).toBe(100);
  });

  it("returns 0 after fourteen losses with no gain", () => {
    const points = calculateIndicatorPoints(candles(
      Array.from({ length: 15 }, (_, index) => 15 - index),
    ));

    expect(points[14]?.rsi14).toBe(0);
  });

  it("returns neutral RSI after fourteen unchanged closes", () => {
    const points = calculateIndicatorPoints(candles(Array.from({ length: 15 }, () => 10)));

    expect(points[14]?.rsi14).toBe(50);
  });

  it("accepts only finite in-range values carrying the calculation version", () => {
    expect(acceptedRsi14(62.5, RSI_14_CALCULATION_VERSION)).toBe(62.5);
    expect(acceptedRsi14(62.5, null)).toBeNull();
    expect(acceptedRsi14(-1, RSI_14_CALCULATION_VERSION)).toBeNull();
    expect(acceptedRsi14(101, RSI_14_CALCULATION_VERSION)).toBeNull();
    expect(acceptedRsi14(Number.NaN, RSI_14_CALCULATION_VERSION)).toBeNull();
  });
});
