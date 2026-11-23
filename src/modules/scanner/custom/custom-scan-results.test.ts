// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CustomScanResults } from "@/app/(dashboard)/scanners/custom-scan-results";
import { EMPTY_SCAN, parseScanDefinition } from "./definition";
import { CustomScanMarket } from "./market";

vi.mock("@/app/(dashboard)/screeners/scanner-news-drawer-context", () => ({ ScannerRowNews: () => null }));

it.each(["table", "cards", "two-rows"] as const)("explains grouped matches in the %s view", async mode => {
  const definition = parseScanDefinition({
    ...EMPTY_SCAN, match: "any", cadence: "swing",
    rules: [{ metric: "price", minimum: 9, maximum: null }],
    groups: [
      { match: "all", rules: [
        { metric: "price", minimum: 8, maximum: null },
        { metric: "volume", minimum: 200, maximum: null },
        { metric: "listingCountry", selection: ["US"] },
      ] },
      { match: "any", rules: [{ metric: "float", minimum: 100, maximum: null }] },
    ],
  });
  const market = new CustomScanMarket();
  market.set("open", 1_790_000_000_000, "regular", [{
    symbol: "AAA", exchange: "NASDAQ", price: 10, volume: 100, dollarVolume: 1_000,
    marketCap: null, float: null, dayChange: 0, belowHigh: null, observedAt: 1_790_000_000_000,
    facts: { dailyCloseVsSma20: -3, weeklyCloseVsSma4: 4 },
    dailyClosedAt: 1_789_900_000_000, weeklyClosedAt: 1_789_800_000_000,
  }]);
  const result = market.query({ key: "main", definition, page: 1 });
  const container = document.createElement("div");
  document.body.append(container);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CustomScanResults, { definition, result, mode, error: "", onChart: vi.fn() })));
    const toggle = container.querySelector<HTMLButtonElement>('button[aria-label="Why AAA matched"]')!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const text = container.querySelector('[role="group"][aria-label="Filters for AAA"]')?.textContent;
    expect(text).toContain("Match any filter or group");
    expect(text).toMatch(/Price · Matched · \$10(?:\.00)? · ≥ \$9/);
    expect(text).toContain("Passed in a group that did not match");
    expect(text).toContain("Outside filter · 100 · ≥ 200");
    expect(text).toContain("Not checked");
    expect(text).toContain("Data unavailable");
    expect(text).toContain("Daily and Weekly trends disagree");
    expect(text).toContain("Daily below 20-session SMA · -3% · Closed");
    expect(text).toContain("Weekly above 4-week SMA · +4% · Closed");
    expect(container.querySelector('button[aria-label="Add AAA to Private Watchlist"]')).toBeNull();
    await act(async () => toggle.click());
    expect(container.querySelector('[aria-label="Filters for AAA"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
