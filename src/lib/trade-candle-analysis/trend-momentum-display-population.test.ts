import assert from "node:assert/strict";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildTrendMomentumProjection, type TrendMomentumTrade } from "./trend-momentum-analytics";
import { analyzedIndicatorPopulation } from "./trend-momentum-display-population";
import { TrendMomentumAnalysis } from "../../../app/(dashboard)/analytics/trend-momentum-analysis";

function fixture() {
  return buildTrendMomentumProjection(Array.from({ length: 509 }, (_, index) => ({
    tradeId: String(index), representativeRoundTripId: String(index), symbol: "TEST",
    direction: index === 1 ? "short" : "long", closeDate: "2026-09-11", trackerDate: "2026-09-11",
    pnlDecimal: "10", analysis: index < 2 ? { eventSnapshots: [{ event: {
      eventId: String(index), kind: "entry", sequence: 0, priceDecimal: "10",
      executedAtUtc: "2026-09-11T14:00:00.000Z",
    } }] } : null,
  })) as unknown as TrendMomentumTrade[]);
}

test("509 journal trades with two old analyzed results display only those two", () => {
  const original = fixture();
  const result = analyzedIndicatorPopulation(original);
  assert.equal(result.tradeCount, 2);
  assert.equal(result.analyzedTradeCount, 2);
  assert.equal(result.indicatorTradeCount, 0);
  assert.equal(result.records.length, 2);
  assert.equal(result.trades.filter((trade) => trade.direction === "short").length, 1);
  assert.equal(original.trades.length, 509);
  assert.deepEqual(result.records, original.records);
});

test("older offline snapshots without analyzed metadata retain saved executions", () => {
  const original = fixture();
  const legacy = { ...original, trades: original.trades.map((trade) => { const copy = { ...trade }; delete copy.analyzed; return copy; }) };
  assert.equal(analyzedIndicatorPopulation(legacy).tradeCount, 2);
});

test("analyzed records without snapshots remain counted using explicit metadata", () => {
  const original = fixture();
  assert.equal(analyzedIndicatorPopulation({ ...original, records: [] }).tradeCount, 2);
});

for (const offline of [false, true]) for (const interval of ["1m", "5m"]) {
  test(`rendered ${offline ? "offline" : "online"} ${interval} tables never compare with 509 journal trades`, () => {
    const original = fixture();
    const projection = { ...original, trades: original.trades.map((trade) => ({ ...trade, direction: "long" as const })),
      records: original.records.map((record) => ({ ...record, direction: "long" as const })) };
    const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, {
      projection, direction: "long", currency: "USD", timezone: "America/New_York", offline,
      queryString: `indicator_interval=${interval}`,
    }));
    assert.ok(html.includes("0 of 2 analyzed trades have data for this comparison."));
    assert.ok(html.includes("2 of 2 analyzed trades have the selected execution type."));
    assert.ok(!html.includes("507 trades"));
    assert.ok(!html.includes("of 509"));
    assert.ok(!html.includes("trades have saved indicator context"));
  });
}
