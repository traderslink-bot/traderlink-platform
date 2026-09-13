import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TrendMomentumAnalysis } from "../../../app/(dashboard)/analytics/trend-momentum-analysis";
import { buildTrendMomentumProjection } from "./trend-momentum-analytics";

test("unavailable saved indicator view renders an explicit message", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, {
    projection: undefined, currency: "USD", direction: "long", timezone: "America/New_York",
  }));
  assert.match(html, /Indicator results have not been saved/);
});
test("empty selection renders controls, explanatory column controls and exclusive horizon categories", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, {
    projection: buildTrendMomentumProjection([]), currency: "USD", direction: "long", timezone: "America/New_York",
  }));
  for (const text of ["Candle timeframe", "Execution context", "During the trade", "Recorded events",
    "Explain Average trade P/L", "Explain Closed before", "Explain Closed at this time", "Explain Missing endpoint",
    "Explain Timing unavailable", "No saved initial entry indicator records", "Combined conditions",
    "Required indicator data missing", "Explain Median trade P/L", "Explain RSI range"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("NaN"));
});

test("URL selections restore timeframe and execution without a browser router", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, {
    projection: buildTrendMomentumProjection([]), currency: "USD", direction: "long", timezone: "America/New_York",
    queryString: "indicator_interval=5m&indicator_execution=re_entry&indicator_reference=vwap&indicator_alignment=below",
  }));
  assert.ok(html.includes("No saved re-entry indicator records"));
  assert.ok(html.includes('value="5m"'));
  assert.ok(html.includes('value="vwap"'));
  assert.ok(html.includes('value="below"'));
});
