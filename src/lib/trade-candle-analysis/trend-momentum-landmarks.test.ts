import assert from "node:assert/strict";
import { test } from "node:test";
import { tradeIndicatorLandmarks } from "../../modules/level-analysis/server/trend-momentum-landmark-inputs";
import type { DailyTradeAnalyzerInput } from "../../modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { analyzeTradeExecutionIndicators } from "./trend-momentum-executions";
import { scaleTradeIndicatorResult } from "./trend-momentum-reporting";
import { analyzeDailyTrade } from "../../modules/level-analysis/server/daily-trade-analyzer";

const start = Date.parse("2026-09-11T13:30:00.000Z") / 1000;
function source(extreme: boolean) {
  return { direction: "long", dailyRanges: [], candles: Array.from({ length: 30 }, (_, index) => ({
    time: start + index * 60, openDecimal: "10", highDecimal: extreme && index === 25 ? "14" : "10",
    lowDecimal: "10", closeDecimal: extreme && index === 25 ? "13" : "10", volumeDecimal: "100", turnoverDecimal: "1000",
  })), events: [
    { eventId: "entry", sequence: 0, kind: "entry", executedAtUtc: new Date(start * 1000).toISOString(), priceDecimal: "10", quantityDecimal: "100", feesDecimal: "0" },
    { eventId: "exit", sequence: 1, kind: "final_exit", executedAtUtc: new Date((start + 28 * 60 + 30) * 1000).toISOString(), priceDecimal: "13", quantityDecimal: "100", feesDecimal: "0" },
  ] } as unknown as DailyTradeAnalyzerInput;
}
test("financial candle-extreme landmarks use pre-minute context; exact fills retain exact times", () => {
  const candle = tradeIndicatorLandmarks(source(true));
  const zone = candle.find((row) => row.key === "zone:20")!;
  assert.equal(zone.at, start + 26 * 60);
  assert.equal(zone.contextAt, start + 25 * 60);
  assert.equal(zone.precision, "candle_range");
  assert.deepEqual(candle.find((row) => row.key === "green:20"), { ...zone, key: "green:20" });
  const fill = tradeIndicatorLandmarks(source(false)).find((row) => row.key === "zone:20")!;
  assert.equal(fill.at, start + 28 * 60 + 30);
  assert.equal(fill.contextAt, fill.at);
  assert.equal(fill.precision, "execution");
});

test("optional enrichment failure preserves the exact core trade analysis", () => {
  const input = source(true);
  const baseline = analyzeDailyTrade(input);
  const broken = analyzeDailyTrade({ ...input, trendMomentum: {
    history: { candles: [{ time: start, open: 10, high: 9, low: 11, close: 10, volume: 1 }], asOf: start + 1800, completedRanges: [{ start, endExclusive: start + 1800 }] },
    session: { start, endExclusive: start + 1800 }, resetTimes: [], policies: {
      "1m": { version: "bad", minimumBars: { ema9: 0, ema20: 0, rsi14: 0 }, maxAgeSeconds: 0, emaChangePercent: 0, rsiChangePoints: 0 },
      "5m": { version: "bad", minimumBars: { ema9: 0, ema20: 0, rsi14: 0 }, maxAgeSeconds: 0, emaChangePercent: 0, rsiChangePoints: 0 },
    },
  } });
  assert.deepEqual(broken.eventSnapshots, baseline.eventSnapshots);
  assert.deepEqual(broken.greenToRed, baseline.greenToRed);
  assert.deepEqual(broken.finalExitPaths, baseline.finalExitPaths);
  assert.equal(broken.trendMomentum, undefined);
  assert.equal(broken.trendMomentumUnavailableReason, "history_unavailable");
});

test("landmark indicators exclude the later move and scale only saved price values", () => {
  const input = source(true);
  const landmarks = tradeIndicatorLandmarks(input);
  const policy = { version: "fixture", minimumBars: { ema9: 9, ema20: 20, rsi14: 14 }, maxAgeSeconds: 120, emaChangePercent: 0.02, rsiChangePoints: 2 };
  const result = analyzeTradeExecutionIndicators({ landmarks,
    history: { asOf: start + 1800, completedRanges: [{ start, endExclusive: start + 1800 }], candles: input.candles.map((c) => ({
      time: c.time, open: 10, high: Number(c.highDecimal), low: 10, close: Number(c.closeDecimal), volume: 100, turnover: 1000,
    })) }, session: { start, endExclusive: start + 1800 }, resetTimes: [], policies: { "1m": policy, "5m": policy },
  }, []);
  const zone = result.landmarks!.find((row) => row.key === "zone:20")!;
  assert.equal(zone.oneMinute!.ema20, 10);
  assert.equal(zone.oneMinute!.observedAt, start + 1500);
  assert.equal(zone.sessionVwap!.value, 10);
  assert.equal(zone.lastCompletedClose, 10);
  assert.equal(zone.fiveMinute!.ema20, null);
  const reported = scaleTradeIndicatorResult(result, "1.4").landmarks!.find((row) => row.key === "zone:20")!;
  assert.equal(reported.oneMinute!.ema20, 14);
  assert.equal(reported.sessionVwap!.value, 14);
  assert.equal(reported.lastCompletedClose, 14);
  assert.equal(reported.at, zone.at);
  assert.equal(reported.contextAt, zone.contextAt);
  assert.equal(reported.oneMinute!.rsi14, zone.oneMinute!.rsi14);
  assert.equal(zone.oneMinute!.ema20, 10);
});
