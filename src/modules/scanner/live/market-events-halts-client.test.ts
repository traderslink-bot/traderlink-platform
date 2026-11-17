// @vitest-environment jsdom

import { ScreenerPressReleaseBoard } from "@/app/(dashboard)/screeners/workspace/screener-press-release-board";
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ children }: { children: ReactNode }) => createElement("section", null, children),
}));
vi.mock("@/app/(dashboard)/press-releases/press-release-actions", () => ({ markPressReleaseRead: vi.fn() }));

it("clears timed alerts from the workspace card without waiting for another scanner update", async () => {
  vi.useFakeTimers();
  const originalActEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const at = (clock: string) => Date.parse(`2026-11-16T${clock}-05:00`);
  const checkedAt = at("15:59:58");
  vi.setSystemTime(checkedAt);
  const currentHalts = () => container.querySelector('[aria-label="Current halts"]');

  try {
    await act(async () => {
      root.render(createElement(ScreenerPressReleaseBoard, {
        data: {
          articles: [], compactArticles: [], dates: null, exchangeByTicker: {}, floatByTicker: {}, halts: null,
          maximumMarketCap: 200_000_000, setArticles: vi.fn(), setDates: vi.fn(),
        },
        haltWindow: { date: "2026-11-16", checkedAt, closed: false },
        managedActiveHalts: [
          { id: "ccel", ticker: "CCEL", source: "alpaca", halted: true, market: "AMEX",
            haltTimeEt: "15:53:54.946", reason: "Volatility pause", reasonCode: "M",
            quoteTimeEt: "16:00:00", tradeTimeEt: "16:00:00", tradeTimeScheduled: true },
          { id: "airi", ticker: "AIRI", source: "alpaca", halted: true, market: "AMEX",
            haltTimeEt: "15:21:40.106", reason: "News pending", reasonCode: "P",
            quoteTimeEt: null, tradeTimeEt: null },
        ],
      }));
    });
    expect(currentHalts()?.textContent).toMatch(/CCEL.*AIRI/u);
    await act(async () => { vi.advanceTimersByTime(2_000); });
    expect(currentHalts()?.textContent).not.toContain("CCEL");
    expect(currentHalts()?.textContent).toContain("AIRI");
    await act(async () => { vi.advanceTimersByTime(at("16:21:40.106") - at("16:00:00")); });
    expect(currentHalts()).toBeNull();
    expect(container.querySelector('[aria-label="Latest PR Scanner releases"]')?.textContent).toContain("More news");
  } finally {
    await act(async () => { root.unmount(); });
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", originalActEnvironment);
    container.remove();
    vi.useRealTimers();
  }
});
