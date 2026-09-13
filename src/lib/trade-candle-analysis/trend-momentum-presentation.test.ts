import assert from "node:assert/strict";
import { test, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@mui/material/styles";
import { createTraderMaterialTheme } from "../../../app/mui-theme";
import { TrendMomentumAnalysis } from "../../../app/(dashboard)/analytics/trend-momentum-analysis";
import { buildTrendMomentumProjection } from "./trend-momentum-analytics";
import { buildIndicatorSupportingPage } from "./trend-momentum-cohorts";
import type { TrendMomentumProjection } from "./trend-momentum-analytics";
import { TrendMomentumSupportingTrades } from "../../../app/(dashboard)/analytics/trend-momentum-supporting-trades";

test("standalone saved-context caption emits its theme text color in both appearances", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);
  vi.stubGlobal("ResizeObserver",class { observe() {} unobserve() {} disconnect() {} });
  try {
  for (const appearance of ["light", "dark"] as const) {
    const theme=createTraderMaterialTheme(appearance);
    const cache=createCache({key:`caption-${appearance}`});
    const container=document.createElement("div");document.body.append(container);
    const root=createRoot(container);
    try {
    await act(async()=>root.render(createElement(CacheProvider,{value:cache},createElement(ThemeProvider,{theme},createElement(TrendMomentumAnalysis,{
      projection:buildTrendMomentumProjection([]),currency:"USD",direction:"long",timezone:"America/New_York",
    })))));
    const caption=[...container.querySelectorAll("p")].find(el=>el.textContent==="0 of 0 trades have saved indicator context.");
    assert.ok(caption, "Expected coverage caption");
    const expected=document.createElement("span");expected.style.color=theme.palette.text.secondary;
    assert.equal(getComputedStyle(caption).color,expected.style.color, "Caption must emit its own theme color");
    } finally { await act(async()=>root.unmount());container.remove();cache.sheet.flush(); }
  }
  } finally { vi.unstubAllGlobals(); }
});

for (const direction of ["long", "short"] as const) {
  for (const interval of ["1m", "5m"] as const) {
    test(`explanation headings survive ${direction} ${interval} Net offline reclaim selection`, () => {
      const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, {
        projection: buildTrendMomentumProjection([]), currency: "USD", direction,
        timezone: "America/New_York", moneyBasis: "net", offline: true,
        queryString: `indicator_interval=${interval}&indicator_event=reclaim&indicator_coverage=incomplete&indicator_execution=position_close`,
      }));
      assert.ok(html.includes('value="'+interval+'"'));
      assert.ok(html.includes('value="position_close"'));
      assert.ok(html.includes("Explain Average Net P/L"));
      assert.ok(html.includes(direction === "long" ? "Return above reference" : "Return below reference"));
      assert.ok(html.includes("includes observed returns only"));
      assert.ok(!html.includes("Recorded return rate:"));
      assert.ok(!html.includes("NaN"));
      const headers = [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)];
      assert.ok(headers.length >= 50);
      for (const [,header] of headers) assert.match(header,/aria-label="Explain [^"]+"/);
    });
  }
}

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
  for (const text of ["EMA 9 &amp; EMA 20", "Session VWAP", "Explain Average Gross P/L", "Explain Median Gross P/L"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("NaN"));
  const headers = [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)];
  assert.ok(headers.length >= 50, "Expected the integrated comparison tables");
  for (const [, header] of headers) assert.match(header, /aria-label="Explain [^"]+"/, "Table heading has no explanation control");
  let buttonDepth = 0;
  for (const match of html.matchAll(/<button\b[^>]*>|<\/button>/g)) {
    if (match[0].startsWith("</")) buttonDepth--;
    else {
      assert.equal(buttonDepth, 0, `Nested interactive button: ${match[0]}`);
      buttonDepth++;
    }
  }
  assert.equal(buttonDepth, 0);
  const sectionButtons = [...html.matchAll(/<button\b[^>]*aria-expanded="true"[^>]*aria-controls="([^"]+)"[^>]*>/g)];
  assert.equal(sectionButtons.length, 7);
  for (const [, contentId] of sectionButtons) assert.ok(html.includes(`id="${contentId}" role="region"`));
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

test("supporting rows render saved execution details and withhold mismatched pages", () => {
  const query = new URLSearchParams();
  const projection = { records: [{ tradeId: "t", executionId: "e", executionKind: "initial_entry", executionSequence: 0,
    direction: "long", symbol: "TNON", executionPriceDecimal: "8.02", executedAtUtc: "2026-09-11T13:30:00.000Z",
    pnlDecimal: "12", context: null }], trades: [{ tradeId: "t", direction: "long" }] } as unknown as TrendMomentumProjection;
  const page = buildIndicatorSupportingPage(projection, query, "long");
  const props = { page, query, direction: "long" as const, timezone: "America/New_York", offline: false,
    onChange: () => {}, money: (value: string | null) => value ?? "Unavailable" };
  const html = renderToStaticMarkup(createElement(TrendMomentumSupportingTrades, props));
  for (const text of ["TNON", "8.02", "9:30:00", "1 trade", "1 execution", "View details", "Explain Execution price per share"]) assert.ok(html.includes(text), text);
  const changed = renderToStaticMarkup(createElement(TrendMomentumSupportingTrades, { ...props, query: new URLSearchParams("indicator_interval=5m") }));
  assert.ok(changed.includes("Loading supporting trades"));
  assert.ok(!changed.includes("TNON"));
  const reportingChanged = renderToStaticMarkup(createElement(TrendMomentumSupportingTrades, { ...props, query: new URLSearchParams("basis=net") }));
  assert.ok(!reportingChanged.includes("TNON"));
});
