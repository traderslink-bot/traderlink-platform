import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compareIndicatorLandmarks } from "./trend-momentum-landmark-comparisons";
import type { TrendMomentumProjection } from "./trend-momentum-analytics";
import { createJournalTradeAnalyzerOfflineViewModel } from "../../modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import { TrendMomentumLandmarkComparison } from "../../../app/(dashboard)/analytics/trend-momentum-landmark-comparison";

function projection(): TrendMomentumProjection {
  return { records: [], trades: [{ tradeId: "private-trade", representativeRoundTripId: "private-round-trip", pnlDecimal: "12", returnPercentDecimal: "4",
    indicators: { executions: [], landmarks: [{ key: "green:20", at: 160, contextAt: 100, precision: "candle_range", lastCompletedClose: 10,
      oneMinute: { alignment: "above", rsiBand: "above_70", currentWordingEligible: true, ageSeconds: 0, lookbackSpanSeconds: 180 },
      fiveMinute: null, sessionVwap: { value: 9 } }] } }] } as unknown as TrendMomentumProjection;
}

test("landmark comparisons retain financial eligibility and never substitute a later observation", () => {
  const input = projection();
  const result = compareIndicatorLandmarks(input, [
    { tradeId: "private-trade", key: "green:20", at: 160, outcome: "Later turned red" },
    { tradeId: "other", key: "green:20", at: 200, outcome: "Did not later turn red" },
  ], "1m", "alignment");
  assert.equal(result.tradeCount, 2);
  assert.equal(result.coveredTradeCount, 1);
  assert.equal(result.rows.find((row) => row.value === "above")!.summary.totalPnlDecimal, "12");
  assert.equal(result.rows.find((row) => row.value === null)!.summary.tradeCount, 1);
  const stale = compareIndicatorLandmarks(input, [{ tradeId: "private-trade", key: "green:20", at: 159, outcome: "Later turned red" }], "1m", "alignment");
  assert.equal(stale.coveredTradeCount, 0);
  assert.equal(stale.rows[0].summary.totalPnlDecimal, "12");
  assert.equal(compareIndicatorLandmarks(input, [{ tradeId: "private-trade", key: "red:after20", at: 160, outcome: "Recovery" }], "1m", "alignment").coveredTradeCount, 0);
  assert.equal(compareIndicatorLandmarks(input, [{ tradeId: "private-trade", key: "green:20", at: 160, outcome: "Red" }], "5m", "alignment").coveredTradeCount, 0);
});

test("landmark VWAP uses the pre-point close and duplicate trade points are rejected", () => {
  const candidate = { tradeId: "private-trade", key: "green:20", at: 160, outcome: "Later turned red" };
  assert.equal(compareIndicatorLandmarks(projection(), [candidate], "1m", "vwapSide").rows[0].value, "above");
  assert.throws(() => compareIndicatorLandmarks(projection(), [candidate, candidate], "1m", "alignment"), /duplicate_trade/);
});

test("offline financial and indicator identities remain joined without exposing original IDs", () => {
  const trade = { tradeId: "private-trade", roundTripId: "private-round-trip" };
  const model = { trendMomentum: projection(), eventPaths: [], executionContextRows: [], excursions: [],
    greenToRedOpportunity: { rows: [trade] }, meaningfulProfit: { rows: [] },
    profitZones: { recordsByDirection: { long: [trade], short: [] } }, scalingOut: { rows: [] }, trades: [] };
  const input = { model, dateRange: { kind: "all", startDate: null, endDate: null }, evidenceQuery: {}, view: "green-to-red" } as unknown as Parameters<typeof createJournalTradeAnalyzerOfflineViewModel>[0];
  const saved = createJournalTradeAnalyzerOfflineViewModel(input);
  const id = saved.model.trendMomentum!.trades[0].tradeId;
  assert.equal(saved.model.greenToRedOpportunity.rows[0].tradeId, id);
  assert.equal(saved.model.profitZones.recordsByDirection.long[0].tradeId, id);
  assert.ok(!JSON.stringify(saved).includes("private-trade"));
  assert.ok(!JSON.stringify(saved).includes("private-round-trip"));
  assert.equal(model.greenToRedOpportunity.rows[0].tradeId, "private-trade");
});

test("cross-page card explains pre-point coverage and distinguishes later outcomes", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumLandmarkComparison, {
    mode: "green-to-red", projection: projection(), greenRows: [
      { tradeId: "private-trade", firstReachedTwentyAtUtcSeconds: 160, firstRedAfterTwentyAtUtcSeconds: 180, recoveredAfterTurningRed: false },
    ] as Parameters<typeof TrendMomentumLandmarkComparison>[0]["greenRows"], zoneRows: [], moneyBasis: "net", money: (value) => value ?? "Unavailable",
  }));
  for (const text of ["First +20%", "Later turned red", "Explain Indicator coverage", "Average Net P/L", "Observations"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("NaN"));
});
