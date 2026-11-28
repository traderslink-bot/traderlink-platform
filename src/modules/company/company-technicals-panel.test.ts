import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { CompanyTechnicalsPanel } from "@/app/(dashboard)/ticker/[symbol]/company-technicals-panel";
import type { CompanyTechnicals, SessionRange } from "./company-technicals";

vi.mock("@/app/dashboard-ui", () => ({
  DashboardPanel: ({ children }: { children: ReactNode }) => createElement("section", null, children),
}));

it("shows combined Day Vol in Stats and the individual volumes only in Session levels", async () => {
  const range = (volume: number): SessionRange => ({ open: 0.13, high: 0.1466, low: 0.1242, close: 0.1434, volume });
  const sample: CompanyTechnicals = {
    dayVolume: 1_019_100,
    row: null,
    scannerSignals: [],
    days: [
      { date: "2026-11-23", ranges: [range(53_160), range(965_940), null] },
      { date: "2026-11-20", ranges: [range(32_520), range(2_060_000), range(98_690)] },
    ],
  };
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(CompanyTechnicalsPanel, {
      symbol: "TEST", active: true, inDrawer: true, sample, header: () => null, averageVolumes: [],
    })));
    const labels = [...container.querySelectorAll("dt")];
    const day = labels.filter(label => label.textContent === "Day Vol");
    expect(day).toHaveLength(1);
    expect(day[0].nextElementSibling?.textContent).toBe("1,019,100");
    expect(labels.map(label => label.textContent)).not.toContain("Pre Vol");
    expect(labels.map(label => label.textContent)).not.toContain("Regular Vol");
    expect(labels.map(label => label.textContent)).not.toContain("After-hours Vol");

    const sessions = container.querySelector('table[aria-label="Trading session highs and lows"]')!;
    const rows = [...sessions.querySelectorAll("tbody tr")].map(row => [...row.querySelectorAll("td")].map(cell => cell.textContent));
    expect(rows).toEqual(expect.arrayContaining([
      expect.arrayContaining(["Nov 23", "Premarket", "53.16K"]),
      expect.arrayContaining(["Nov 23", "Regular", "965.94K"]),
      expect.arrayContaining(["Nov 23", "Post-market", "—"]),
      expect.arrayContaining(["Nov 20", "Post-market", "98.69K"]),
    ]));
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});

it("replaces the canceled POM high on the next poll and when the drawer reopens", async () => {
  vi.useFakeTimers({ now: new Date("2026-11-27T13:15:00Z") });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const pendingDate = "2026-11-27";
  let high: number | null = 38;
  let revised = false;
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("range=52w")) return Response.json({});
    return Response.json({
      row: { dayHigh: 38, price: 7, dayLow: 3, dayVolume: 31_278_076, volume: 31_278_076,
        dollarVolume: 2_000_000_000, relativeVolume: 56, activity: { oneMinuteVolume: 900_000 }, float: 31_000_000 },
      scannerSignals: [],
      ...(revised && high !== null ? { dayVolume: 30_566_502, sessionVolume: 30_566_502, dollarVolume: 180_000_000 } : {}),
      days: high === null ? [] : [{ date: pendingDate, ranges: [{ open: 3, high, low: 3, close: 7, volume: 123 }, null, null] }],
      ...(revised ? { revisedRangeDates: [pendingDate] } : {}),
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  const container = document.createElement("div");
  document.body.append(container);
  let root = createRoot(container);
  const render = () => root.render(createElement(CompanyTechnicalsPanel, {
    symbol: "POM", active: true, inDrawer: true, allowSupplementalReads: false, header: () => null, averageVolumes: [],
  }));
  const stat = (name: string) => [...container.querySelectorAll("dt")].find(row => row.textContent === name)?.nextElementSibling?.textContent;
  const statsHigh = () => stat("Day high");
  const sessionTable = () => container.querySelector('table[aria-label="Trading session highs and lows"]')?.textContent;
  try {
    await act(async () => render());
    expect(statsHigh()).toBe("$38.00");
    expect(sessionTable()).toContain("$38.00");
    expect(stat("Day Vol")).toBe("31,278,076");
    expect(stat("1m Vol")).toBe("900K");

    revised = true;
    high = null;
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(statsHigh()).toBe("—");
    expect(sessionTable() ?? "").not.toContain("$38.00");
    expect(stat("Day Vol")).toBe("—");
    expect(stat("Dollar Vol")).toBe("—");
    expect(stat("Relative Vol")).toBe("—");
    expect(stat("1m Vol")).toBe("—");

    high = 7.41;
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(statsHigh()).toBe("$7.41");
    expect(sessionTable()).toContain("$7.41");
    expect(stat("Day Vol")).toBe("30,566,502");
    expect(stat("Dollar Vol")).toBe("$180M");

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => render());
    expect(statsHigh()).toBe("$7.41");
    expect(sessionTable()).toContain("$7.41");
    expect(stat("Day Vol")).toBe("30,566,502");
    expect(stat("Dollar Vol")).toBe("$180M");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
