// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, children }: { title: string; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), children),
}));

import { ScreenerMarketHaltsCard } from "@/app/(dashboard)/screeners/screener-market-halts-card";

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

it("loads today's halt list through the private API and renders official details", async () => {
  const fetch = vi.fn(async () => Response.json({
    tradingDate: "2026-11-04",
    updatedAtUtc: "2026-11-04T15:15:00.000Z",
    rows: [{
      id: "halt-1", ticker: "TEST", market: "NASDAQ", haltTimeEt: "10:15:00",
      reasonCode: "LUDP", reason: "Volatility trading pause", quoteTimeEt: null,
      tradeTimeEt: "10:20:00", source: "nasdaq", sourceUrl: "https://www.nasdaqtrader.com/rss.aspx?feed=tradehalts",
    }, {
      id: "halt-2", ticker: "TEST", market: "NASDAQ", haltTimeEt: "11:05:00",
      reasonCode: "LUDP", reason: "Volatility trading pause", quoteTimeEt: "11:09:00",
      tradeTimeEt: "11:10:00", source: "nasdaq", sourceUrl: "https://www.nasdaqtrader.com/rss.aspx?feed=tradehalts",
    }],
  }));
  vi.stubGlobal("fetch", fetch);
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(createElement(ScreenerMarketHaltsCard)));
  expect(fetch).toHaveBeenCalledWith("/api/market-halts/current", expect.objectContaining({ cache: "no-store", credentials: "same-origin" }));
  expect(container.textContent).toContain("Halt Alerts");
  expect(container.textContent).toContain("Quote Resume");
  expect(container.textContent).toContain("Trade Resume");
  expect(container.textContent).toContain("TEST");
  expect(container.textContent).toContain("LUDP");
  expect(container.textContent).toContain("10:20");
  expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  expect(container.querySelector('a[href*="nasdaqtrader.com"]')).not.toBeNull();
});
