import assert from "node:assert/strict";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TrendMomentumProjection } from "./trend-momentum-analytics";
import { TrendMomentumExecutionComparison } from "../../../app/(dashboard)/analytics/trend-momentum-execution-comparison";

const projection = { records: [
  { tradeId: "t", direction: "long", executionKind: "partial_exit", executionPriceDecimal: "10", pnlDecimal: null,
    context: { oneMinute: { alignment: "above" }, fiveMinute: { alignment: "below", currentWordingEligible: true, ageSeconds: 90 } } },
  { tradeId: "short", direction: "short", executionKind: "partial_exit", executionPriceDecimal: "10", pnlDecimal: "999",
    context: { fiveMinute: { alignment: "above" } } },
] } as unknown as TrendMomentumProjection;

test("entry/exit indicator comparison restores selections and preserves reporting filters in its link", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumExecutionComparison, { projection, direction: "long", moneyBasis: "net", offline: false,
    money: (value) => value ?? "Unavailable", queryString: "range=custom&start=2026-09-01&end=2026-09-11&indicator_execution=partial_exit&indicator_interval=5m" }));
  for (const value of ["Partial exit", "Below", "Average Net P/L", "Median Net P/L", "Unavailable", "Detailed indicator comparisons",
    "indicator_execution=partial_exit", "indicator_interval=5m", "basis=net", "start=2026-09-01", "direction=long"]) assert.ok(html.includes(value), value);
  assert.ok(!html.includes(">999<"));
  assert.ok(!html.includes("1 of 2 trades"));
});

test("unavailable entry history keeps the comparison usable without inventing observations", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumExecutionComparison, { direction: "long", moneyBasis: "gross", offline: true,
    money: (value) => value ?? "Unavailable", queryString: "indicator_execution=not-real&indicator_interval=15m" }));
  assert.ok(html.includes("Initial entry"));
  assert.ok(html.includes('value="1m"'));
  assert.ok(html.includes("No saved executions"));
  assert.ok(html.includes("Open saved Trend &amp; Momentum"));
  assert.ok(!html.includes("NaN"));
});
