import assert from "node:assert/strict";
import { test } from "node:test";
import type { TradeCandle } from "./candle-analysis";
import { aggregateIndicatorHistory, inspectIndicatorWarmup } from "./trend-momentum-history";
import { calculateTradeIndicatorSeries, calculateTradeSessionVwap } from "./trend-momentum-indicators";
import { planIndicatorHistoryAcquisition } from "./trend-momentum-acquisition";
import { tradeIndicatorContextAt } from "./trend-momentum-context";
import { analyzeTradeExecutionIndicators } from "./trend-momentum-executions";

const start = 1_800_000_000;
const mixedCloses = Array.from({ length: 180 }, (_, i) =>
  4 + i * 0.007 + Math.sin(i * 0.61) * 0.7 + Math.cos(i * 0.17) * 0.3);
function near(actual: number | null, expected: number) {
  assert.notEqual(actual, null);
  assert.ok(Math.abs(actual! - expected) < 1e-10, `${actual} differs from ${expected}`);
}
function bar(index: number, close = 10): TradeCandle {
  return { time: start + index * 60, open: close, high: close, low: close, close, volume: 100, turnover: close * 100 };
}
function input(candles: TradeCandle[], end = start + 3600) {
  return { candles, asOf: end, completedRanges: [{ start, endExclusive: end }] };
}

test("sparse closed buckets retain real bars without fabricating missing ones", () => {
  const data = input([bar(0, 10), bar(4, 12)], start + 300);
  const five = aggregateIndicatorHistory(data, "5m");
  assert.equal(five.length, 1);
  assert.deepEqual(five[0], { ...bar(0), high: 12, close: 12, volume: 200, turnover: 2200 });
  assert.equal(aggregateIndicatorHistory({ ...data, asOf: start + 299 }, "5m").length, 0);
  assert.equal(inspectIndicatorWarmup(data, [{ interval: "1m", requiredBars: 20 }])[0].missingBars, 18);
});

test("incomplete request coverage and conflicting duplicate bars are not sparse success", () => {
  const data = input([bar(0), bar(4)]);
  assert.equal(aggregateIndicatorHistory({ ...data, completedRanges: [{ start, endExclusive: start + 60 }] }, "5m").length, 0);
  assert.throws(() => aggregateIndicatorHistory(input([bar(0), bar(0, 11)]), "1m"), /duplicate_conflict/);
  assert.equal(aggregateIndicatorHistory(input([bar(0), bar(0)]), "1m").length, 1);
});

test("SMA-seeded EMA and Wilder RSI have separate initialization boundaries", () => {
  const series = calculateTradeIndicatorSeries(input(Array.from({ length: 21 }, (_, i) => bar(i, i + 1))), "1m");
  assert.equal(series[7].ema9, null);
  assert.equal(series[8].ema9, 5);
  assert.equal(series[19].ema20, 10.5);
  assert.equal(series[20].ema20, 11.5);
  assert.equal(series[13].rsi14, null);
  assert.equal(series[14].rsi14, 100);
  assert.equal(series[20].availableAt, start + 21 * 60);
  const flat = calculateTradeIndicatorSeries(input(Array.from({ length: 20 }, (_, i) => bar(i))), "1m");
  assert.equal(flat[19].rsi14, 50);
});

test("prior-history prices never enter the requested session VWAP", () => {
  const data = input([bar(0, 500), bar(5, 10), bar(7, 20)], start + 600);
  const vwap = calculateTradeSessionVwap(data, { start: start + 300, endExclusive: start + 600 });
  assert.equal(vwap.value, 15);
  assert.equal(vwap.bars, 2);
  assert.equal(vwap.lastBarClosedAt, start + 480);
  assert.equal(calculateTradeSessionVwap({ ...data, completedRanges: [] }, { start, endExclusive: start + 600 }).unavailableReason, "coverage_incomplete");
});

test("missing turnover does not silently switch VWAP methods", () => {
  const data = input([{ ...bar(0), turnover: null }]);
  const session = { start, endExclusive: start + 3600 };
  assert.equal(calculateTradeSessionVwap(data, session).unavailableReason, "turnover_incomplete");
  assert.equal(calculateTradeSessionVwap(data, session, "typical_price").value, 10);
});

test("acquisition reuses sufficient bars and otherwise requests the newest missing range", () => {
  const older = { start: start - 86400, endExclusive: start - 3600 };
  const args = { history: input([bar(0)]), requirements: [{ interval: "1m" as const, requiredBars: 2 }],
    requiredAt: start + 3600, candidateRanges: [older], receipts: [], maxRanges: 5, maxAttemptsPerRange: 3, now: start + 3600 };
  assert.equal(planIndicatorHistoryAcquisition(args).action, "fetch_range");
  assert.equal(planIndicatorHistoryAcquisition({ ...args, history: input([bar(0), bar(1)]) }).action, "enough_bars");
  const sparseComplete = { ...args.history, completedRanges: [...args.history.completedRanges, older] };
  assert.equal(planIndicatorHistoryAcquisition({ ...args, history: sparseComplete }).action, "history_exhausted");
});

test("acquisition does not turn a request failure into low-volume history exhaustion", () => {
  const range = { start: start - 86400, endExclusive: start - 3600 };
  const args = { history: input([]), requirements: [{ interval: "1m" as const, requiredBars: 20 }],
    candidateRanges: [range], receipts: [{ range, status: "retryable_failure" as const, attempts: 1, retryAt: start + 7200 }],
    requiredAt: start + 3600, maxRanges: 5, maxAttemptsPerRange: 3, now: start + 3600 };
  assert.equal(planIndicatorHistoryAcquisition(args).action, "wait");
  assert.equal(planIndicatorHistoryAcquisition({ ...args, now: start + 7200 }).action, "fetch_range");
  assert.equal(planIndicatorHistoryAcquisition({ ...args, receipts: [{ ...args.receipts[0], attempts: 3 }] }).action, "request_failed");
});

test("context selects completed bars only and retains old-observation age", () => {
  const data = input(Array.from({ length: 30 }, (_, i) => bar(i, i + 1)));
  const series = calculateTradeIndicatorSeries(data, "1m");
  const args = { series, at: start + 25 * 60 + 30, interval: "1m" as const,
    completedRanges: data.completedRanges, resetTimes: [],
    policy: { version: "fixture", minimumBars: { ema9: 9, ema20: 20, rsi14: 15 },
      maxAgeSeconds: 60, emaChangePercent: 0.02, rsiChangePoints: 2 } };
  const context = tradeIndicatorContextAt(args)!;
  assert.equal(context.observedAt, start + 25 * 60);
  assert.equal(context.historyBars, 25);
  assert.equal(context.spacing, "standard");
  assert.equal(context.alignment, "above");
  assert.equal(tradeIndicatorContextAt({ ...args, at: start + 3600 })!.currentWordingEligible, false);
  assert.equal(tradeIndicatorContextAt({ ...args, resetTimes: [start + 24 * 60] })!.ema9Direction, null);
});

test("EMA matches an independent closed-form weighted sum on mixed prices", () => {
  const series = calculateTradeIndicatorSeries(input(mixedCloses.map((c, i) => bar(i, c)), start + 180 * 60), "1m");
  for (const period of [9, 20] as const) {
    const alpha = 2 / (period + 1);
    const seed = mixedCloses.slice(0, period).reduce((sum, c) => sum + c, 0) / period;
    for (let index = period - 1; index < mixedCloses.length; index++) {
      let expected = seed * (1 - alpha) ** (index - period + 1);
      for (let j = period; j <= index; j++) {
        expected += alpha * mixedCloses[j] * (1 - alpha) ** (index - j);
      }
      near(period === 9 ? series[index].ema9 : series[index].ema20, expected);
    }
  }
});

test("Wilder RSI matches independently weighted gains and losses on mixed prices", () => {
  const series = calculateTradeIndicatorSeries(input(mixedCloses.map((c, i) => bar(i, c)), start + 180 * 60), "1m");
  const changes = mixedCloses.slice(1).map((c, i) => c - mixedCloses[i]);
  const seedGain = changes.slice(0, 14).reduce((sum, change) => sum + Math.max(change, 0), 0) / 14;
  const seedLoss = changes.slice(0, 14).reduce((sum, change) => sum + Math.max(-change, 0), 0) / 14;
  for (let index = 14; index < mixedCloses.length; index++) {
    let gain = seedGain * (13 / 14) ** (index - 14);
    let loss = seedLoss * (13 / 14) ** (index - 14);
    for (let j = 14; j < index; j++) {
      const weight = (13 / 14) ** (index - 1 - j) / 14;
      gain += Math.max(changes[j], 0) * weight;
      loss += Math.max(-changes[j], 0) * weight;
    }
    near(series[index].rsi14, 100 - 100 / (1 + gain / loss));
  }
});

test("penny prices and consistently adjusted history retain EMA, RSI and VWAP scale relationships", () => {
  const original = mixedCloses.map((close, i) => ({ ...bar(i, close), volume: 100 + i,
    turnover: close * (100 + i) }));
  const end = start + original.length * 60;
  const session = { start, endExclusive: end };
  for (const interval of ["1m", "5m"] as const) {
    const baseline = calculateTradeIndicatorSeries(input(original, end), interval);
    for (const factor of [0.001, 0.1, 10, 100] as const) {
      // All historical prices share one adjustment basis; this does not model
      // a raw split discontinuity or claim to verify provider adjustment flags.
      const adjusted = original.map(c => ({ ...c, open: c.open * factor,
        high: c.high * factor, low: c.low * factor, close: c.close * factor,
        volume: c.volume / factor, turnover: c.turnover }));
      const result = calculateTradeIndicatorSeries(input(adjusted, end), interval);
      assert.equal(result.length, baseline.length);
      result.forEach((point, i) => {
        for (const key of ["ema9", "ema20"] as const) {
          if (baseline[i][key] === null) assert.equal(point[key], null);
          else near(point[key]! / factor, baseline[i][key]!);
        }
        if (baseline[i].rsi14 === null) assert.equal(point.rsi14, null);
        else near(point.rsi14, baseline[i].rsi14!);
      });
      near(calculateTradeSessionVwap(input(adjusted, end), session).value! / factor,
        calculateTradeSessionVwap(input(original, end), session).value!);
    }
  }
});

test("sparse five-minute history uses returned bucket closes without synthetic empty buckets", () => {
  const closes = mixedCloses.slice(0, 60);
  // One real candle in each observed bucket, with alternate buckets empty.
  const sparse = closes.map((close, i) => bar(i * 10 + 2, close));
  const end = start + 600 * 60;
  const actual = calculateTradeIndicatorSeries(input(sparse, end), "5m");
  const compact = calculateTradeIndicatorSeries(input(closes.map((c, i) => bar(i, c)), end), "1m");
  assert.equal(actual.length, closes.length);
  actual.forEach((point, i) => {
    assert.equal(point.time, start + i * 600);
    assert.equal(point.availableAt, start + i * 600 + 300);
    assert.equal(point.historyBars, i + 1);
    for (const key of ["ema9", "ema20", "rsi14"] as const) {
      assert.equal(point[key], compact[i][key]);
    }
  });
});

test("execution enrichment preserves identities and excludes future candles from both timeframes and VWAP", () => {
  const history = input(Array.from({ length: 60 }, (_, i) => bar(i, i < 30 ? 10 : 500)));
  const policy = { version: "fixture", minimumBars: { ema9: 9, ema20: 20, rsi14: 15 },
    maxAgeSeconds: 60, emaChangePercent: 0.02, rsiChangePoints: 2 };
  const args = { history, session: { start, endExclusive: start + 3600 }, resetTimes: [],
    policies: { "1m": policy, "5m": policy } };
  const events = [{ eventId: "first-cycle-entry", executedAtUtc: new Date((start + 30 * 60) * 1000).toISOString() },
    { eventId: "second-cycle-entry", executedAtUtc: new Date((start + 40 * 60) * 1000).toISOString() }];
  const result = analyzeTradeExecutionIndicators(args, events);
  assert.deepEqual(result.executions.map((e) => e.eventId), events.map((e) => e.eventId));
  assert.equal(result.executions[0].oneMinute!.ema20, 10);
  assert.equal(result.executions[0].fiveMinute!.observedAt, start + 30 * 60);
  assert.equal(result.executions[0].fiveMinute!.ema20, null);
  assert.equal(result.executions[0].sessionVwap!.value, 10);
  assert.equal(result.executions[1].sessionVwap!.value, 132.5);
  assert.throws(() => analyzeTradeExecutionIndicators(args, [events[0], events[0]]), /execution_invalid/);
  const truncated = analyzeTradeExecutionIndicators({ ...args, history: { ...history, asOf: start + 35 * 60 } }, events);
  assert.equal(truncated.executions[1].oneMinute, null);
  assert.equal(truncated.executions[1].sessionVwap, null);
});

test("later session candles cannot satisfy an early entry's warm-up requirement", () => {
  const history = input(Array.from({ length: 60 }, (_, i) => bar(i)));
  const decision = planIndicatorHistoryAcquisition({ history, requiredAt: start + 9 * 60,
    requirements: [{ interval: "1m", requiredBars: 20 }],
    candidateRanges: [{ start: start - 86400, endExclusive: start - 3600 }],
    receipts: [], maxRanges: 5, maxAttemptsPerRange: 3, now: start + 3600 });
  assert.equal(decision.action, "fetch_range");
  assert.equal(decision.inventory[0].missingBars, 11);
});
