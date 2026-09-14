import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { createTraderMaterialTheme } from "../../../app/mui-theme";
import { PwaUpdateNotice } from "../../../app/pwa/pwa-update-notice";
import { withWrittenReviewBasis, buildWrittenTradeReview } from "../../../app/(dashboard)/trade-tracker/analyzer-written-review-model";
import type { DaySessionTradeAnalyzer } from "../../../app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import { TrendMomentumSupportingTrades } from "../../../app/(dashboard)/analytics/trend-momentum-supporting-trades";
import { buildIndicatorSupportingPage } from "./trend-momentum-cohorts";
import type { TrendMomentumProjection } from "./trend-momentum-analytics";
import { analyzedTradeTrackerHref } from "../../../app/(dashboard)/analytics/analyzed-trades-index";
import type { DailyTradeAnalyzedTradePage } from "../../modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { pageSavedAnalyzedTrades } from "../../modules/level-analysis/server/trend-momentum-analyzed-trades";
import type { SavedPatternTrade } from "./trend-momentum-patterns";
import { trackerHref } from "../../../app/(dashboard)/analytics/candle-pattern-occurrence-explorer";
import { patternEvidenceRow } from "../../modules/level-analysis/server/trend-momentum-pattern-evidence";
import type { SavedPatternObservation } from "./trend-momentum-patterns";

test("pattern drilldown preserves member identity, event, timeframe and basis", () => {
  for (const basis of ["gross", "net"] as const) for (const timeframe of ["1m", "5m"] as const) {
    const source = { tradeId: "logical", representativeRoundTripId: "member", occurrenceKey: "key",
      eventId: "fill", trackerDate: "2026-08-31", timeframe } as SavedPatternObservation;
    const url = new URL(trackerHref(patternEvidenceRow(source, "USD"), basis), "https://example.test");
    assert.equal(url.searchParams.get("trade"), "member");
    assert.equal(url.searchParams.get("event"), "fill");
    assert.equal(url.searchParams.get("interval"), timeframe);
    assert.equal(url.searchParams.get("basis"), basis);
    assert.equal(source.tradeId, "logical");
  }
});

test("all shared Analyzer tracker links carry the displayed basis while offline links stay day-only", () => {
  const source = readFileSync("app/(dashboard)/analytics/trade-analysis-client.tsx", "utf8");
  const links = source.split("\n").filter((line) => line.includes('new URLSearchParams({ interval: "1m", trade:'));
  assert.equal(links.length, 4);
  for (const line of links) {
    assert.match(line, /basis: (model\.)?moneyBasis/);
    assert.match(line, /offline \? `\/trade-tracker\/\$\{/);
  }
});

test("logical trade list opens its representative tracker member, not the logical ID", () => {
  const source = { tradeId: "logical-trade", representativeRoundTripId: "tracker-member", analysisVersionId: "revision",
    symbol: "TEST", direction: "long", trackerDate: "2026-08-03", openedAtUtc: "2026-08-03T12:00:00Z",
    closedAtUtc: "2026-08-03T12:10:00Z", pnlDecimal: "97.5", returnPercentDecimal: "10",
    analyzed: { eventSnapshots: [{ event: { eventId: "entry", sequence: 0, kind: "entry", executedAtUtc: "2026-08-03T12:00:00Z" } }] },
  } as unknown as SavedPatternTrade;
  const page = pageSavedAnalyzedTrades([source], { query: new URLSearchParams("basis=net"), timezone: "America/New_York",
    scopeIdentity: "test-scope", pageSize: 25, cursor: null, ticker: "" });
  assert.equal(page.totalRowCount, 1);
  assert.equal(page.rows[0]!.resultDecimal, "97.5");
  const url = new URL(analyzedTradeTrackerHref(page.rows[0]!, "5m", "net"), "https://example.test");
  assert.equal(url.searchParams.get("trade"), "tracker-member");
  assert.equal(url.searchParams.get("event"), "entry");
  assert.equal(url.searchParams.get("basis"), "net");
  assert.equal(url.searchParams.get("interval"), "5m");
  assert.equal(source.tradeId, "logical-trade");
});

test("alternate analyzed-trades path preserves basis, timeframe and execution focus", () => {
  for (const basis of ["gross", "net"] as const) for (const interval of ["1m", "5m"] as const) {
    for (const firstExecutionId of ["execution", null]) {
      const row = { roundTripId: "trade", trackerDate: "2026-08-03", firstExecutionId } as DailyTradeAnalyzedTradePage["rows"][number];
      const url = new URL(analyzedTradeTrackerHref(row, interval, basis), "https://example.test");
      assert.equal(url.pathname, "/trade-tracker/2026-08-03");
      assert.equal(url.searchParams.get("basis"), basis);
      assert.equal(url.searchParams.get("interval"), interval);
      assert.equal(url.searchParams.get("trade"), "trade");
      assert.equal(url.searchParams.get("event"), firstExecutionId);
    }
  }
  const source = readFileSync("app/(dashboard)/analytics/analyzed-trades-index.tsx", "utf8");
  assert.match(source, /analyzedTradeTrackerHref\(row,[^\n]+moneyBasis\)/);
});

test("basis override retains saved fees, supports both bases, and leaves original untouched", () => {
  const saved = { reviewContext: { basis: "gross", analyzedTradeCount: 94 }, candles: [],
    events: [
      { eventId: "entry", executedAt: "2026-08-03T12:00:00Z", sequence: 0, kind: "entry", price: "3", quantity: "100", fees: "-1" },
      { eventId: "exit", executedAt: "2026-08-03T12:10:00Z", sequence: 1, kind: "final_exit", price: "4", quantity: "100", fees: "-1.5" },
    ] } as unknown as DaySessionTradeAnalyzer;
  const net = withWrittenReviewBasis(saved, "net")!;
  assert.equal(buildWrittenTradeReview(net, "long")?.finalPnl, "97.5");
  assert.equal(buildWrittenTradeReview(withWrittenReviewBasis(net, "gross")!, "long")?.finalPnl, "100");
  assert.equal(saved.reviewContext?.basis, "gross");
  assert.equal(net.reviewContext?.analyzedTradeCount, 94);
  assert.equal(net.events, saved.events);
  assert.equal(withWrittenReviewBasis(saved), saved);
  assert.equal(withWrittenReviewBasis(null, "net"), null);
});

test("PWA notice stays below menus in both appearances and does not activate an update", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const postMessage = vi.fn();
  const registration = { waiting: { postMessage }, installing: null, update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
    ready: Promise.resolve(registration), controller: {}, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  } });
  try {
    for (const appearance of ["light", "dark"] as const) {
      const theme = createTraderMaterialTheme(appearance);
      const cache = createCache({ key: `qa-notice-${appearance}` });
      const container = document.createElement("div"); document.body.append(container);
      const root = createRoot(container);
      try {
        await act(async () => root.render(createElement(CacheProvider, { value: cache },
          createElement(ThemeProvider, { theme }, createElement(PwaUpdateNotice)))));
        const alert = container.querySelector('[role="alert"]');
        assert.ok(alert);
        assert.equal(Number(getComputedStyle(alert).zIndex), theme.zIndex.modal - 1);
        assert.ok(container.textContent?.includes("Update app"));
        assert.equal(postMessage.mock.calls.length, 0);
      } finally { await act(async () => root.unmount()); container.remove(); cache.sheet.flush(); }
    }
  } finally {
    if (original) Object.defineProperty(navigator, "serviceWorker", original);
    else Reflect.deleteProperty(navigator, "serviceWorker");
    vi.unstubAllGlobals();
  }
});

test("expanded supporting trade carries Net and 5m into the full analysis", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  const query = new URLSearchParams("basis=net&indicator_interval=5m");
  const projection = { records: [{ tradeId: "t", executionId: "e", executionKind: "initial_entry", executionSequence: 0,
    direction: "long", symbol: "TEST", executionPriceDecimal: "3", executedAtUtc: "2026-08-03T12:00:00Z",
    pnlDecimal: "97.5", context: null, trackerDate: "2026-08-03", representativeRoundTripId: "r" }],
    trades: [{ tradeId: "t", direction: "long" }] } as unknown as TrendMomentumProjection;
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(TrendMomentumSupportingTrades, {
      page: buildIndicatorSupportingPage(projection, query, "long"), query, direction: "long",
      timezone: "America/New_York", offline: false, onChange: () => {}, money: value => value ?? "Unavailable",
    })));
    const button = [...container.querySelectorAll("button")].find(el => el.textContent === "View details");
    assert.ok(button);
    await act(async () => button.click());
    const link = [...container.querySelectorAll("a")].find(el => el.textContent === "Full analysis");
    assert.ok(link);
    const url = new URL(link.href);
    assert.equal(url.searchParams.get("basis"), "net");
    assert.equal(url.searchParams.get("interval"), "5m");
    assert.equal(url.searchParams.get("trade"), "r");
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});

test("empty period, timeframe width and singular count presentation remain wired", () => {
  const read = (path: string) => readFileSync(path, "utf8");
  const client = read("app/(dashboard)/analytics/trade-analysis-client.tsx");
  assert.match(client, /evidenceQuery.rangeKind !== "all"[\s\S]*No analyzed trades in this date range/);
  assert.match(client, /Choose another date range to view your analyzed trades/);
  const trend = read("app/(dashboard)/analytics/trend-momentum-analysis.tsx");
  assert.match(trend, /label="Candle timeframe" sx=\{\{ minWidth: 180 \}\}/);
  assert.match(trend, /result.pnlTradeCount === 1 \? "trade" : "trades"/);
  assert.match(trend, /basis: moneyBasis \?\? "gross"/);
  const page = read("app/(dashboard)/trade-tracker/[sessionDate]/page.tsx");
  assert.match(page, /query.basis === "net" \|\| query.basis === "gross"/);
  const view = read("app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx");
  assert.match(view, /initialAnalyzerFocus\?\.roundTripId === roundTrip.roundTripKey \? initialAnalyzerFocus.basis : undefined/);
});
