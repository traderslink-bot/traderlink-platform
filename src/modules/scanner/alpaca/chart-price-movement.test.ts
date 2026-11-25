import { describe, expect, it } from "vitest";
import { buildPriceMovementBars } from "./chart-price-movement";

const time = "2026-11-19T14:35:00.123456789Z";
const prints = (...prices: number[]) => prices.map(price => ({ price, time }));

describe("price-movement charts", () => {
  it("builds fixed Renko bricks with a two-brick reversal and distinct positions at the same time", () => {
    const bars = buildPriceMovementBars("renko", prints(0.50, 0.52, 0.51, 0.50, 0.49), 0.01);
    expect(bars.map(bar => [bar.position, bar.open, bar.close, bar.complete])).toEqual([
      [0, 0.50, 0.51, true], [1, 0.51, 0.52, true],
      [2, 0.51, 0.50, true], [3, 0.50, 0.49, true],
    ]);
    expect(bars.every(bar => bar.time === time)).toBe(true);
  });

  it("closes a Range Bar once the high-low reaches the step, even after moving below its open", () => {
    const bars = buildPriceMovementBars("range", prints(0.51, 0.505, 0.515, 0.521), 0.01);
    expect(bars).toEqual([
      { position: 0, time, open: 0.51, low: 0.505, high: 0.515, close: 0.515, complete: true },
      { position: 1, time, open: 0.515, low: 0.515, high: 0.521, close: 0.521, complete: false },
    ]);
  });

  it("keeps the actual order of a sharp move that a single time candle cannot distinguish", () => {
    const upFirst = prints(0.50, 0.53, 0.48, 0.51);
    const downFirst = prints(0.50, 0.48, 0.53, 0.51);
    for (const kind of ["renko", "range"] as const) {
      expect(buildPriceMovementBars(kind, upFirst, 0.01)[0].close).toBe(0.51);
      expect(buildPriceMovementBars(kind, downFirst, 0.01)[0].close).toBe(0.49);
    }
  });

  it("rejects out-of-order nanosecond timestamps even when their JavaScript millisecond is equal", () => {
    expect(() => buildPriceMovementBars("range", [
      { price: 0.50, time }, { price: 0.52, time: "2026-11-19T14:35:00.123456788Z" },
    ], 0.01)).toThrow("unordered_price_movement_trades");
  });

  it("does not accept invalid prices or return a partial result on an oversized gap", () => {
    expect(() => buildPriceMovementBars("renko", prints(0.50, NaN), 0.01)).toThrow("invalid_price_movement_price");
    expect(() => buildPriceMovementBars("renko", prints(0.50, 5), 0.0001)).toThrow("price_movement_bar_limit");
  });
});
