// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { LiveScannerRow, ScannerReadModel } from "./contracts";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), action, children),
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => createElement("button", null, children),
}));
vi.mock("@/app/(dashboard)/charts/trading-view-chart", () => ({ TradingViewChart: () => null }));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({ ScreenerPressReleaseBoard: () => null }));
import { LiveScreenersClient } from "@/app/(dashboard)/screeners/live-screeners-client";

beforeAll(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });
let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined;
  vi.useRealTimers(); vi.unstubAllGlobals(); document.body.replaceChildren(); });
const empty = { rows: [], focus: [], total: 0 };
function model(session: "regular" | "after_hours"): ScannerReadModel {
  return { status: "ready", tradingDate: "2026-11-02", session, updatedAtUtc: "2026-11-02T21:00:10Z",
    universeCount: 3, receivedCount: 3, missingSymbols: [], missingFloatCount: 0,
    gainers: empty, dayGainers: empty, momentum: empty, issues: [] };
}
async function mount(initial: ScannerReadModel) {
  vi.useFakeTimers(); let response = initial;
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) !== "/api/screeners/live") throw Error("unexpected request");
    return Response.json(response);
  }); vi.stubGlobal("fetch", fetch);
  const container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => { root!.render(createElement(LiveScreenersClient)); });
  return { container, fetch, update: async (next: ScannerReadModel) => {
    response = next; await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  } };
}
function selected(container: HTMLElement, label: string) {
  const tabs = [...container.querySelectorAll('[role="tab"]')].filter(tab => tab.textContent === label);
  return tabs.length === 2 && tabs.every(tab => tab.getAttribute("aria-selected") === "true");
}
describe("actual Top Gainers card polling and tab interaction", () => {
  it("switches desktop and mobile defaults from day to post-market on polling without remounting or extra requests", async () => {
    const page = await mount(model("regular"));
    expect(selected(page.container,"Day Gainers")).toBe(true);
    expect(page.fetch).toHaveBeenCalledTimes(1);
    await page.update(model("after_hours"));
    expect(selected(page.container,"Post-Market Gainers")).toBe(true);
    expect(page.container.textContent).toContain("Since today’s regular close");
    expect(page.fetch).toHaveBeenCalledTimes(2);
    expect(page.fetch.mock.calls.every(call => String(call[0]) === "/api/screeners/live")).toBe(true);
  });
  it("respects manual Day Gainers selection through later after-hours updates", async () => {
    const page = await mount(model("after_hours"));
    const tab = [...page.container.querySelectorAll('[role="tab"]')].find(tab => tab.textContent === "Day Gainers") as HTMLElement;
    await act(async () => tab.click());
    expect(selected(page.container,"Day Gainers")).toBe(true);
    expect(page.fetch).toHaveBeenCalledTimes(1); // Tab clicks never fetch.
    await page.update(model("after_hours"));
    expect(selected(page.container,"Day Gainers")).toBe(true);
    expect(page.container.textContent).toContain("Since the previous trading day’s regular close");
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });
});

function momentumModel(post: number | null | undefined): ScannerReadModel {
  const row: LiveScannerRow = { symbol: "TEST", exchange: "NASDAQ", company: "Synthetic test company", price: 2.4,
    sessionGain: (2.4/3.17-1)*100, ...(post===undefined?{}:{postMarketGain:post}),
    volume: 100000, dollarVolume: 240000, marketCap: 1000000, marketCapAtCollection: 1000000, float: 500000,
    relativeVolume: 2, dayHigh: 2.6, dayLow: 1.5, offHighPercent: -7.69,
    floatRetrievedAtUtc: "2026-11-02T21:00:00Z", spreadPercent: 1,
    providerAtUtc: "2026-11-02T21:00:10Z", receivedAtUtc: "2026-11-02T21:00:10Z",
    activity: { oneMinuteGain: 8, fiveMinuteGain: 20, oneMinuteVolume: 10000, fiveMinuteVolume: 50000,
      oneMinuteDollarVolume: 24000, volumeAcceleration: 2, fiveMinuteVolumeSpike: 3 }, reasons: [], news: [] };
  return { ...model(post===undefined?"regular":"after_hours"), momentum: { rows: [row], focus: [], total: 1 } };
}
describe("Momentum context rendering", () => {
  it("renders distinct Day/Post columns and keeps one/five-minute changes and volumes intact", async () => {
    const page = await mount(momentumModel((2.4/1.69-1)*100));
    const header = [...page.container.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells.slice(4,11)).toEqual(["-24.29%","42.01%","8%","20%","10K","50K","2×"]);
    expect(header.querySelectorAll("th").length).toBe(15);
    const mobileTab = [...page.container.querySelectorAll('[role="tab"]')].find(tab => tab.textContent === "Momentum") as HTMLElement;
    await act(async () => mobileTab.click());
    const compact = [...page.container.querySelectorAll('table[aria-label="Screener stocks"]')].at(-1)!;
    const compactRow = compact.querySelector("tbody tr") as HTMLElement;
    await act(async () => compactRow.click());
    expect(compact.textContent).toContain("Day %");
    expect(compact.textContent).toContain("Post %");
    expect(compact.textContent).toContain("-24.29%");
    expect(compact.textContent).toContain("42.01%");
    expect(page.fetch).toHaveBeenCalledTimes(1);
  });
  it("omits Post outside after-hours, adds it on the normal poll and does not replace unknown values with zero", async () => {
    const page = await mount(momentumModel(undefined));
    let header = [...page.container.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).not.toContain("Post %");
    expect(header.querySelectorAll("th").length).toBe(14);
    await page.update(momentumModel(null));
    header = [...page.container.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells[4]).toBe("-24.29%");
    expect(cells[5]).toBe("n/a");
    expect(cells[6]).toBe("8%");
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });
});
