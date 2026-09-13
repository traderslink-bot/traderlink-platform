import assert from "node:assert/strict";
import { test } from "vitest";
import { buildTradeIndicatorInput } from "./trend-momentum-input";
import { analyzeTradeExecutionIndicators } from "@/src/lib/trade-candle-analysis/trend-momentum-executions";
import { hasCurrentTradeIndicatorContext } from "@/src/lib/trade-candle-analysis/trend-momentum-version";

test.each(["1m", "5m"] as const)("EMA initialization and later execution recovery use completed %s candles", (interval) => {
  const start = Date.parse("2026-09-11T08:00:00Z") / 1000;
  const step = interval === "1m" ? 60 : 300;
  // Actual supplied bars, including zero-volume bars with valid prices.
  const candles = Array.from({ length: 24 * step / 60 }, (_, i) => ({
    time: start + i * 60, open: 2, high: 2, low: 2, close: 2, volume: 0, turnover: 0,
  }));
  const input = buildTradeIndicatorInput("2026-09-11", { candles,
    completedRanges: [{ start, endExclusive: start + 24 * step }], asOf: start + 24 * step });
  const counts = [8, 9, 19, 20, 23];
  const result = analyzeTradeExecutionIndicators(input, counts.map(count => ({
    eventId: String(count), executedAtUtc: new Date((start + count * step) * 1000).toISOString(),
  })));
  const points = result.executions.map(e => interval === "1m" ? e.oneMinute : e.fiveMinute);
  assert.equal(points[0]?.ema9, null);
  assert.equal(points[1]?.ema9, 2);
  assert.equal(points[2]?.ema20, null);
  assert.equal(points[3]?.ema20, 2);
  assert.equal(points[3]?.ema20Direction, null);
  assert.equal(points[4]?.ema20Direction, "little_change");
  assert.equal(points[4]?.rsi14, null);
  const chart = interval === "1m" ? result.chartSeries.oneMinute : result.chartSeries.fiveMinute;
  assert.equal(chart.find(p => p.at === start + 20 * step)?.ema20, points[3]?.ema20);
  assert.equal(result.executions[3].sessionVwap?.unavailableReason, "no_traded_volume");
  assert.equal(hasCurrentTradeIndicatorContext(result), true);
  assert.equal(hasCurrentTradeIndicatorContext({ calculationVersion: "trade_indicator_context_v2" }), false);
});

test("shared input preserves history and identical normal/Demo indicator policy", () => {
  const start = Date.parse("2026-09-11T08:00:00Z") / 1000;
  const history = Object.freeze({ candles: Object.freeze([]), completedRanges: Object.freeze([]), asOf: start + 3600 });
  const input = buildTradeIndicatorInput("2026-09-11", history);
  assert.equal(input.history, history);
  assert.deepEqual(input.session, { start, endExclusive: start + 16 * 3600 });
  assert.deepEqual(input.resetTimes, [start, start + 5.5 * 3600, start + 12 * 3600]);
  for (const interval of ["1m", "5m"] as const) {
    assert.deepEqual(input.policies[interval].minimumBars, { ema9: 9, ema20: 20, rsi14: 200 });
    assert.equal(input.policies[interval].version, "trade_indicator_policy_v2");
  }
  assert.equal(input.policies["1m"].maxAgeSeconds, 120);
  assert.equal(input.policies["5m"].maxAgeSeconds, 600);
});

test("shared input respects New York winter session and does not invent sparse history", () => {
  const start = Date.parse("2026-01-05T09:00:00Z") / 1000;
  const input = buildTradeIndicatorInput("2026-01-05", {
    candles: [], completedRanges: [{ start, endExclusive: start + 3600 }], asOf: start + 3600,
  });
  assert.equal(input.session.start, start);
  const result = analyzeTradeExecutionIndicators(input, [{ eventId: "entry", executedAtUtc: new Date((start + 3600) * 1000).toISOString() }]);
  assert.equal(result.chartSeries.oneMinute.length, 0);
  assert.equal(result.chartSeries.fiveMinute.length, 0);
  assert.equal(result.executions[0].oneMinute, null);
  assert.equal(result.executions[0].fiveMinute, null);
});
