import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateTradeIndicatorSeries } from "./trend-momentum-indicators";
import { tradeIndicatorContextAt } from "./trend-momentum-context";

const start = 1_800_000_000;
const scenarios = [
  ["rising", (i: number) => 1 + i * 0.002 + Math.sin(i * 0.7) * 0.1],
  ["falling", (i: number) => 10 - i * 0.003 + Math.sin(i * 0.31) * 0.3],
  ["volatile penny", (i: number) => 0.1 + Math.exp(Math.sin(i * 0.051) * 1.2) * 0.2],
  ["slower stock", (i: number) => 200 + Math.sin(i * 0.015) * 0.8 + Math.cos(i * 0.3) * 0.1],
  ["flat", (_i: number) => 10],
] as const;

test("200 returned bars converge against 2000-bar references on bounded varied-price fixtures", () => {
  const worst = { ema9Relative: 0, ema20Relative: 0, rsiPoints: 0 };
  for (const [name, price] of scenarios) {
    const candles = Array.from({ length: 2000 }, (_, i) => ({ time: start + i * 60,
      open: price(i), high: price(i), low: price(i), close: price(i), volume: 100, turnover: price(i) * 100 }));
    const input = { candles, asOf: start + 2000 * 60, completedRanges: [{ start, endExclusive: start + 2000 * 60 }] };
    const full = calculateTradeIndicatorSeries(input, "1m").at(-1)!;
    const shorter = calculateTradeIndicatorSeries({ ...input, candles: candles.slice(-200) }, "1m").at(-1)!;
    const ema9Window = calculateTradeIndicatorSeries({ ...input, candles: candles.slice(-100) }, "1m").at(-1)!;
    const e9 = Math.abs(full.ema9! - ema9Window.ema9!) / full.close;
    const e20 = Math.abs(full.ema20! - shorter.ema20!) / full.close;
    const rsi = Math.abs(full.rsi14! - shorter.rsi14!);
    assert.ok(e9 <= 0.00001, `${name}: EMA9`);
    assert.ok(e20 <= 0.00001, `${name}: EMA20`);
    assert.ok(rsi <= 0.1, `${name}: RSI`);
    worst.ema9Relative = Math.max(worst.ema9Relative, e9);
    worst.ema20Relative = Math.max(worst.ema20Relative, e20);
    worst.rsiPoints = Math.max(worst.rsiPoints, rsi);
  }
  console.info("Synthetic warm-up convergence:", worst);
});

test("flat recent history is not proof that Wilder RSI has converged", () => {
  const candles = Array.from({ length: 1000 }, (_, i) => {
    const close = i < 500 ? 1 + i * 0.01 : 6;
    return { time: start + i * 60, open: close, high: close, low: close, close, volume: 100, turnover: close * 100 };
  });
  const input = { candles, asOf: start + 1000 * 60, completedRanges: [{ start, endExclusive: start + 1000 * 60 }] };
  assert.equal(calculateTradeIndicatorSeries(input, "1m").at(-1)!.rsi14, 100);
  assert.equal(calculateTradeIndicatorSeries({ ...input, candles: candles.slice(-200) }, "1m").at(-1)!.rsi14, 50);
  for (const data of [input, { ...input, candles: candles.slice(-200) }]) {
    const context = tradeIndicatorContextAt({ series: calculateTradeIndicatorSeries(data, "1m"),
      at: input.asOf, interval: "1m", completedRanges: data.completedRanges, resetTimes: [],
      policy: { version: "fixture", minimumBars: { ema9: 100, ema20: 200, rsi14: 200 },
        maxAgeSeconds: 120, emaChangePercent: 0.02, rsiChangePoints: 2 } })!;
    assert.equal(context.rsi14, null);
    assert.equal(context.rsiBand, null);
    assert.equal(context.rsiUnavailableReason, "no_recent_price_change");
  }
});
