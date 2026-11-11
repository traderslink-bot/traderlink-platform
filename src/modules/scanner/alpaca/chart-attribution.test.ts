// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import AttributionsPage from "@/app/attributions/page";
import { ChartMultiviewCharts } from "@/app/(dashboard)/charts/chart-multiview";
import { PublicWebsiteChrome } from "@/src/components/site/public-website-chrome";
import { singleChart } from "./chart-multiview";

vi.mock("next/navigation", () => ({ usePathname: () => "/attributions" }));
vi.mock("@/app/(dashboard)/charts/alpaca-lightweight-chart", () => ({
  AlpacaLightweightChart: () => createElement("div", { "data-test-chart": true }),
}));

it("keeps attribution off the chart", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(ChartMultiviewCharts, { layout: singleChart("OMH"), onChange: vi.fn() })));
    expect(host.querySelector("[data-test-chart]")).not.toBeNull();
    expect(host.textContent).not.toMatch(/TradingView|About charts/iu);
    expect(host.querySelector("a")).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});

it("renders the exact notice and TradingView link inside the shared public chrome", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(PublicWebsiteChrome, null, createElement(AttributionsPage))));
    expect(host.querySelector('header nav[aria-label="Primary"]')).not.toBeNull();
    expect(host.querySelector("footer")).not.toBeNull();
    expect(host.querySelector("main h1")?.textContent).toBe("Attributions");
    expect(host.querySelector("main")?.textContent).toContain("TradingView Lightweight Charts™");
    expect(host.querySelector("main")?.textContent).toContain("Copyright (с) 2025 TradingView, Inc.");
    expect(host.querySelector('main a[href="https://www.tradingview.com/"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
