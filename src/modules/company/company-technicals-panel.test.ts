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
