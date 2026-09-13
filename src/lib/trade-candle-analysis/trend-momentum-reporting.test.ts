import assert from "node:assert/strict";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { analyzeTradeExecutionIndicators } from "./trend-momentum-executions";
import { scaleTradeIndicatorResult } from "./trend-momentum-reporting";
import { TradeIndicatorContext } from "../../../app/(dashboard)/trade-tracker/trade-indicator-context";
import type { DaySessionTradeAnalyzer } from "../../../app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import { tradeSummaryPoints } from "../../../app/(dashboard)/trade-tracker/analyzer-trade-summary";
import { savedTradeIndicatorChart } from "./trend-momentum-chart";

function fixture() {
  const start = 1_800_000_000, end = start + 120 * 60;
  const policy = { version: "fixture", minimumBars: { ema9: 9, ema20: 20, rsi14: 15 },
    maxAgeSeconds: 60, emaChangePercent: 0.02, rsiChangePoints: 2 };
  const candles = Array.from({ length: 120 }, (_, i) => { const close = 10 + Math.sin(i / 3);
    return { time: start + i * 60, open: close, high: close, low: close, close, volume: 100, turnover: close * 100 }; });
  const events = [{ eventId: "entry", executedAtUtc: new Date((start + 50 * 60) * 1000).toISOString() }];
  return analyzeTradeExecutionIndicators({ history: { candles, asOf: end, completedRanges: [{ start, endExclusive: end }] },
    policies: { "1m": policy, "5m": policy }, session: { start, endExclusive: end }, resetTimes: [], direction: "long",
    positionCycles: [{ openedAt: start + 50 * 60, closedAt: end, closingPrice: 10 }] }, events);
}
test("reporting currency scales all price fields but never RSI, percentages or time", () => {
  const source = fixture(), before = JSON.stringify(source), result = scaleTradeIndicatorResult(source, "2");
  const a = source.executions[0], b = result.executions[0];
  assert.equal(b.oneMinute!.ema20, a.oneMinute!.ema20! * 2);
  assert.equal(b.oneMinute!.rsi14, a.oneMinute!.rsi14);
  assert.equal(b.oneMinute!.separationPercent, a.oneMinute!.separationPercent);
  assert.equal(b.oneMinute!.observedAt, a.oneMinute!.observedAt);
  assert.equal(b.sessionVwap!.value, a.sessionVwap!.value! * 2);
  assert.equal(result.chartSeries.oneMinute[30].ema20, source.chartSeries.oneMinute[30].ema20! * 2);
  assert.equal(result.chartSeries.oneMinute[30].rsi14, source.chartSeries.oneMinute[30].rsi14);
  assert.ok(source.duringTrade.oneMinute!.episodes.length > 0);
  assert.ok(source.duringTrade.oneMinute!.episodes.some((episode) => episode.reclaimStudy));
  result.duringTrade.oneMinute!.episodes.forEach((episode, i) => {
    const old = source.duringTrade.oneMinute!.episodes[i];
    assert.equal(episode.price, old.price * 2);
    assert.equal(episode.untilClosure.changePerShare, old.untilClosure.changePerShare * 2);
    assert.equal(episode.untilClosure.changePercent, old.untilClosure.changePercent);
    assert.equal(episode.reclaimedAt, old.reclaimedAt);
    if (old.reclaimStudy) {
      assert.equal(episode.reclaimStudy!.price, old.reclaimStudy.price * 2);
      assert.equal(episode.reclaimStudy!.untilClosure.changePerShare, old.reclaimStudy.untilClosure.changePerShare * 2);
      assert.equal(episode.reclaimStudy!.untilClosure.changePercent, old.reclaimStudy.untilClosure.changePercent);
      assert.equal(episode.reclaimStudy!.context?.rsi14, old.reclaimStudy.context?.rsi14);
      assert.equal(episode.reclaimStudy!.at, old.reclaimStudy.at);
      assert.equal(episode.reclaimStudy!.context!.ema20, old.reclaimStudy.context!.ema20! * 2);
    }
  });
  assert.equal(JSON.stringify(source), before);
  assert.equal(scaleTradeIndicatorResult(source, "1"), source);
  assert.throws(() => scaleTradeIndicatorResult(source, "0"));
});

test("chart and execution context share the same saved calculation without timeframe substitution", () => {
  const result = fixture(), event = result.executions[0];
  for (const [interval, frame, duration] of [["1m", "oneMinute", 60], ["5m", "fiveMinute", 300]] as const) {
    const context = event[frame]!;
    const time = context.observedAt - duration;
    const chart = savedTradeIndicatorChart(result, interval, [time, time + 86400])!;
    assert.equal(chart.ema9[0].value ?? null, context.ema9);
    assert.equal(chart.ema20[0].value ?? null, context.ema20);
    assert.equal(chart.rsi14[0].value ?? null, context.rsi14);
    assert.deepEqual(chart.ema9[1], { time: time + 86400 });
    assert.equal(chart.vwap[0].value, event.sessionVwap!.value);
  }
  assert.equal(savedTradeIndicatorChart(undefined, "1m", []), null);
  assert.deepEqual(savedTradeIndicatorChart(result, "15m", [100])!.ema9, [{ time: 100 }]);
});
test("individual card switches saved timeframe and retains partial indicator availability", () => {
  const trendMomentum = fixture();
  const analysis = { trendMomentum, events: [{ eventId: "entry", kind: "entry", price: "10",
    executedAt: trendMomentum.executions[0].executedAtUtc }] } as DaySessionTradeAnalyzer;
  const render = (timeframe: "1m" | "5m") => renderToStaticMarkup(createElement(TradeIndicatorContext, {
    analysis, timeframe, currency: "USD", timezone: "America/New_York",
  }));
  const one = render("1m"), five = render("5m");
  assert.match(one, /RSI 14:/);
  assert.match(five, /RSI unavailable/);
  assert.match(five, /Not enough earlier candle data for EMA 20/);
  assert.match(five, /Session VWAP/);
  assert.match(one, /Last completed candle/);
  assert.ok(!one.includes("NaN"));
  for (const html of [one, five]) {
    let depth = 0;
    for (const match of html.matchAll(/<button\b[^>]*>|<\/button>/g)) {
      if (match[0].startsWith("</")) depth--;
      else { assert.equal(depth, 0, "Individual indicator card nests a button"); depth++; }
    }
    assert.equal(depth, 0);
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /aria-label="Explain Trend &amp; Momentum"/);
  }
});

test("trade summary uses the same new context and never substitutes conflicting legacy values", () => {
  const trendMomentum = fixture();
  const analysis = { trendMomentum, events: [{ eventId: "entry", kind: "entry", price: "20", sequence: 1,
    executedAt: trendMomentum.executions[0].executedAtUtc,
    metrics: { vwapDistance: { signedDistance: "-1" }, ema9Distance: { signedDistance: "-1" } },
  }] } as DaySessionTradeAnalyzer;
  const review = { fills: [], finalPnl: "0", peak: "0", path: { status: "unavailable" } } as unknown as Parameters<typeof tradeSummaryPoints>[1];
  const first = tradeSummaryPoints(analysis, review, (value) => value)[0];
  assert.match(first, /above session VWAP from completed minutes before entry/);
  assert.match(first, /above 1-minute EMA 9 from the last completed candle/);
  const missing = { ...analysis, trendMomentum: { ...trendMomentum,
    executions: trendMomentum.executions.map((event) => ({ ...event, oneMinute: null, sessionVwap: null })),
  } };
  const unavailable = tradeSummaryPoints(missing, review, (value) => value)[0];
  assert.ok(!unavailable.includes("below"));
  assert.match(unavailable, /EMA 9 is unavailable/);
});
