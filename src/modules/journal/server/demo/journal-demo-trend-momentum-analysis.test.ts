import assert from "node:assert/strict";
import { test } from "vitest";
import { prepareJournalDemoTrendMomentum, type DemoIndicatorReceipt } from "./journal-demo-trend-momentum-analysis";
import type { DailyTradeAnalyzerEvent } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";

const start = Date.parse("2026-08-21T08:00:00Z") / 1000;
function receipt(at = start): DemoIndicatorReceipt {
  return { symbol: "TEST", provider: "moomoo_history_kline", adapterVersion: "moomoo_history_kline_v1",
    complete: true, range: { start: at, endExclusive: at + 960 * 60 },
    candles: Array.from({ length: 960 }, (_, index) => ({ time: at + (index + 1) * 60,
      openDecimal: "2", highDecimal: "2.1", lowDecimal: "1.9", closeDecimal: "2", volumeDecimal: "1000", turnoverDecimal: "2000" })),
  };
}
const events: readonly DailyTradeAnalyzerEvent[] = (["entry", "temporary_flat", "entry", "final_exit"] as const)
  .map((kind, index) => ({ kind, eventId: `execution-${index}`, sequence: index + 1,
    executedAtUtc: new Date((start + 6 * 3600 + index * 60 + 2) * 1000).toISOString(),
    priceDecimal: index % 2 ? "2.01" : "2", quantityDecimal: "10", feesDecimal: "-0.01" }));
const target = { symbol: "TEST", tradingDateNewYork: "2026-08-21", direction: "long" as const, events };

test("Demo preparation uses all cycles, preserves receipts/facts, and agrees with normal financial engine", () => {
  const receipts = [receipt(start - 86400), receipt()];
  const before = JSON.stringify({ receipts, events });
  const result = prepareJournalDemoTrendMomentum({ ...target, receipts });
  assert.equal(result.status, "prepared");
  assert.equal(result.analyzed?.trendMomentum?.calculationVersion, "trade_indicator_context_v3");
  assert.equal(result.analyzed?.trendMomentum?.historyOutcome, "complete");
  assert.deepEqual(result.analyzed?.trendMomentum?.executions.map(e => e.eventId), events.map(e => e.eventId));
  assert.ok(result.warmup.every(frame => frame.missingBars === 0));
  assert.equal(result.candles[0].time, start);
  const normal = analyzeDailyTrade({ candles: result.candles, events, direction: "long", dailyRanges: [] });
  assert.deepEqual(result.analyzed?.greenToRed, normal.greenToRed);
  assert.deepEqual(result.analyzed?.finalExitPaths, normal.finalExitPaths);
  assert.equal(JSON.stringify({ receipts, events }), before);
  assert.deepEqual(prepareJournalDemoTrendMomentum({ ...target, receipts }), result);
});

test("Demo preparation distinguishes preferred history from initialized EMA availability", () => {
  const result = prepareJournalDemoTrendMomentum({ ...target, receipts: [receipt()] });
  assert.equal(result.status, "prepared");
  assert.equal(result.analyzed?.trendMomentum?.historyOutcome, "history_unavailable");
  assert.equal(result.warmup[0].missingBars, 0);
  assert.ok(result.warmup[1].missingBars > 0);
  assert.equal(result.analyzed?.trendMomentum?.executions[0].fiveMinute?.ema20, 2);
  assert.equal(result.analyzed?.trendMomentum?.executions[0].fiveMinute?.rsi14, null);
  assert.notEqual(result.analyzed?.trendMomentum?.executions[0].oneMinute?.ema20, null);
});

test("partial response cannot claim a complete Demo session", () => {
  const result = prepareJournalDemoTrendMomentum({ ...target, receipts: [{ ...receipt(), complete: false }] });
  assert.equal(result.status, "session_history_missing");
  assert.equal(result.analyzed, null);
});

test("partial prior history contributes observed minutes but not the five-minute bucket containing a gap", () => {
  const full = receipt(start - 86400);
  const partial = { ...full, complete: false,
    candles: full.candles.filter((_, index) => index !== 330) };
  const before = JSON.stringify(partial);
  const result = prepareJournalDemoTrendMomentum({ ...target, receipts: [partial, receipt()] });
  const baseline = prepareJournalDemoTrendMomentum({ ...target, receipts: [full, receipt()] });
  assert.equal(result.status, "prepared");
  assert.equal(result.warmup[0].availableBars, baseline.warmup[0].availableBars - 1);
  assert.equal(result.warmup[1].availableBars, baseline.warmup[1].availableBars - 1);
  assert.equal(result.analyzed?.trendMomentum?.executions[0].fiveMinute?.ema20, 2);
  assert.equal(JSON.stringify(partial), before);
});

test("conflicting or cross-symbol receipts cannot be combined silently", () => {
  assert.throws(() => prepareJournalDemoTrendMomentum({ ...target, receipts: [{ ...receipt(), symbol: "OTHER" }] }), /identity/);
  const altered = receipt();
  assert.throws(() => prepareJournalDemoTrendMomentum({ ...target, receipts: [receipt(), { ...altered,
    candles: altered.candles.map((bar, index) => index === 0 ? { ...bar, closeDecimal: "2.01" } : bar) }] }), /conflict/);
});

test("equivalent decimal formatting does not replace original saved candles or reject a receipt", () => {
  const core=receipt();
  const baseline=prepareJournalDemoTrendMomentum({...target,receipts:[core]});
  const supplement={...core,candles:core.candles.map(bar=>({...bar,closeDecimal:"2.00",volumeDecimal:"1000.0"}))};
  assert.deepEqual(prepareJournalDemoTrendMomentum({...target,receipts:[core,supplement]}),baseline);
});

test("earlier sessions never enter the current-session core chart or VWAP", () => {
  const prior = receipt(start - 86400);
  const result = prepareJournalDemoTrendMomentum({ ...target, receipts: [{ ...prior,
    candles: prior.candles.map(bar => ({ ...bar, openDecimal: "10", highDecimal: "10.1", lowDecimal: "9.9", closeDecimal: "10", turnoverDecimal: "10000" })) }, receipt()] });
  assert.ok(result.candles.every(bar => bar.time >= start));
  const baseline = prepareJournalDemoTrendMomentum({ ...target, receipts: [receipt()] });
  assert.deepEqual(result.analyzed?.trendMomentum?.executions[0].sessionVwap,
    baseline.analyzed?.trendMomentum?.executions[0].sessionVwap);
});
