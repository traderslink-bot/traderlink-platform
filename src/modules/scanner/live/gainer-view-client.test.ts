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
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({ ScreenerPressReleaseBoard: () => createElement("div", {"data-pr-instance": true}, "PR Scanner") }));
vi.mock("@/app/(dashboard)/screeners/screener-market-halts-card", () => ({ ScreenerMarketHaltsCard: () => createElement("div", {"data-halt-instance": true}, "Halt Alerts") }));
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
async function mount(initial: ScannerReadModel, options: { admin?: boolean; now?: string; fail?: boolean } = {}) {
  vi.useFakeTimers(); vi.setSystemTime(new Date(options.now ?? "2026-11-02T21:00:10Z")); let response = initial;
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/admin/screeners/settings" && options.admin) return Response.json({ configuration: null });
    if (String(input) !== "/api/screeners/live") throw Error("unexpected request");
    if (options.fail) throw Error("synthetic transport error");
    return Response.json(response);
  }); vi.stubGlobal("fetch", fetch);
  const container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => { root!.render(createElement(LiveScreenersClient,{admin:options.admin})); });
  return { container, fetch, update: async (next: ScannerReadModel) => {
    response = next; await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  } };
}
function selected(container: HTMLElement, label: string) {
  const tabs = [...container.querySelectorAll('[role="tab"]')].filter(tab => tab.textContent === label);
  return tabs.length === 1 && tabs[0]?.getAttribute("aria-selected") === "true";
}
async function openFullView(container: HTMLElement, label = "Momentum") {
  const button = container.querySelector(`[aria-label="Open ${label} full view"]`) as HTMLElement;
  await act(async () => button.click());
  return document.body.querySelector(`[role="dialog"][aria-label="${label} full view"]`)!;
}
describe("actual Top Gainers card polling and tab interaction", () => {
  it("keeps existing rows visible when a successful poll briefly returns every scanner empty", async () => {
    const page = await mount(momentumModel(undefined));
    expect(page.container.textContent).toContain("TEST");
    await page.update(model("regular"));
    expect(page.container.textContent).toContain("TEST");
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });
  it("switches the Gainers card default from day to post-market on polling without remounting or extra requests", async () => {
    const page = await mount(model("regular"));
    expect(selected(page.container,"Day Gainers")).toBe(true);
    expect([...page.container.querySelectorAll("h2")].some(heading=>heading.textContent==="Top Gainers")).toBe(false);
    expect(page.container.querySelector('[aria-label="Open Top Gainers full view"]')).not.toBeNull();
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
    expect(page.fetch).toHaveBeenCalledTimes(1);
    await page.update(model("after_hours"));
    expect(selected(page.container,"Post-Market Gainers")).toBe(true);
    expect(page.container.textContent).not.toContain("Since today’s regular close");
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
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
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
      oneMinuteDollarVolume: 24000, volumeAcceleration: 2, fiveMinuteVolumeSpike: 3 }, reasons: [], news: [],
    momentumSignals: ["volume_ignition","price_burst"] };
  return { ...model(post===undefined?"regular":"after_hours"), momentum: { rows: [row], focus: [], total: 1 } };
}
describe("Momentum context rendering", () => {
  it("shows an active halt beside matching tickers and removes it on the next cleared scanner update", async () => {
    const initial=momentumModel(42),halt={id:"halt-1",ticker:"TEST",market:"NASDAQ",haltTimeEt:"16:01:00",reasonCode:"LUDP",reason:"Volatility trading pause",quoteTimeEt:"16:06:00",tradeTimeEt:null};
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum,activeHalts:[halt]});
    expect(page.container.querySelectorAll('[data-halt-indicator="TEST"]')).toHaveLength(2);
    expect(page.container.querySelector('[aria-label*="TEST halted: LUDP"]')).not.toBeNull();
    await page.update({...initial,gainers:initial.momentum,dayGainers:initial.momentum});
    expect(page.container.querySelectorAll('[data-halt-indicator="TEST"]')).toHaveLength(2);
    await page.update({...initial,gainers:initial.momentum,dayGainers:initial.momentum,activeHalts:[]});
    expect(page.container.querySelector('[data-halt-indicator="TEST"]')).toBeNull();
  });
  it("keeps detected signals visible beneath each momentum ticker", async () => {
    const page = await mount(momentumModel(42));
    const compact = page.container.querySelector('table[aria-label="Momentum compact stocks"]')!;
    const compactSignals = compact.querySelector('[data-momentum-signals="TEST"]')!;
    expect(compactSignals.textContent).toBe("Volume ignition · Price burst");
    const drawer = await openFullView(page.container);
    const drawerSignals = drawer.querySelector('[data-momentum-signals="TEST"]')!;
    expect(drawerSignals.textContent).toBe("Volume ignition · Price burst");
  });
  it("renders distinct Day/Post columns and keeps one/five-minute changes and volumes intact", async () => {
    const page = await mount(momentumModel((2.4/1.69-1)*100));
    const drawer = await openFullView(page.container);
    const header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells.slice(4,11)).toEqual(["-24%","42%","8%","20%","10K","50K","2×"]);
    expect(header.querySelectorAll("th").length).toBe(15);
    await act(async () => (drawer.querySelector('[aria-label="Close full scanner view"]') as HTMLElement).click());
    const compact = page.container.querySelector('table[aria-label="Momentum compact stocks"]')!;
    const compactRow = compact.querySelector("tbody tr") as HTMLElement;
    await act(async () => compactRow.click());
    expect(compact.textContent).toContain("Day %");
    expect(compact.textContent).toContain("Post %");
    expect(compact.textContent).toContain("-24%");
    expect(compact.textContent).toContain("42%");
    expect(page.fetch).toHaveBeenCalledTimes(1);
  });
  it("omits Post outside after-hours, adds it on the normal poll and does not replace unknown values with zero", async () => {
    const page = await mount(momentumModel(undefined));
    const drawer = await openFullView(page.container);
    let header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).not.toContain("Post %");
    expect(header.querySelectorAll("th").length).toBe(14);
    await page.update(momentumModel(null));
    header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells[4]).toBe("-24%");
    expect(cells[5]).toBe("n/a");
    expect(cells[6]).toBe("8%");
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("compact scanner grid and full view", () => {
  it("renders Gainers and Momentum as separate cards without a combined scanner selector or redundant Gainers heading", async () => {
    const page = await mount(model("regular"));
    expect(page.container.querySelectorAll('[data-scanner-card]').length).toBe(2);
    expect(page.container.querySelector('[aria-label="Live screener"]')).toBeNull();
    expect(page.container.querySelector('[data-scanner-card="gainers"] h2')?.textContent ?? "").not.toContain("Top Gainers");
    expect(page.container.querySelector('[data-scanner-card="gainers"] [aria-label="Top Gainers comparison"]')).not.toBeNull();
    expect([...page.container.querySelectorAll('[data-scanner-card="momentum"] h2')].some(heading=>heading.textContent==="Momentum")).toBe(true);
  });
  it("keeps a single PR instance and exposes every compact column with keyboard details", async () => {
    const initial = momentumModel(42);
    const page = await mount({...initial, gainers: initial.momentum, dayGainers: initial.momentum});
    expect(page.container.querySelectorAll('[data-pr-instance]').length).toBe(1);
    expect(page.container.querySelectorAll('[data-scanner-card]').length).toBe(2);
    for (const [label,columnCount] of [["Top Gainers",12],["Momentum",14]] as const) {
      const table = page.container.querySelector(`table[aria-label="${label} compact stocks"]`)!;
      expect(table.querySelectorAll('thead th').length).toBe(columnCount);
      expect([...table.querySelectorAll('thead th')].slice(2,4).map(cell=>cell.textContent)).toEqual(["Ticker","News"]);
      const row = table.querySelector('tbody tr')!;
      await act(async () => row.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true})));
      expect(row.getAttribute('aria-expanded')).toBe('true');
      expect(table.textContent).toContain('Float');
      expect(table.textContent).toContain('Turnover');
      expect(table.querySelector(`td[colspan="${columnCount}"]`)).not.toBeNull();
    }
    expect(page.fetch).toHaveBeenCalledTimes(1);
  });
  it("opens full data without another request, polls it from the same model and closes with Escape", async () => {
    const initial = momentumModel(42);
    const page = await mount(initial);
    const drawer = await openFullView(page.container);
    expect(drawer.textContent).toContain('$2.4');
    expect(page.fetch).toHaveBeenCalledTimes(1);
    const next = {...initial, momentum:{...initial.momentum,rows:initial.momentum.rows.map(row=>({...row,price:2.5}))}};
    await page.update(next);
    expect(drawer.textContent).toContain('$2.5');
    expect(page.container.querySelector('table[aria-label="Momentum compact stocks"]')!.textContent).toContain('$2.5');
    expect(page.fetch).toHaveBeenCalledTimes(2);
    await act(async () => drawer.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    await act(async () => {await vi.advanceTimersByTimeAsync(300);});
    expect(document.body.querySelector('[role="dialog"][aria-label="Momentum full view"]')).toBeNull();
    expect(page.container.querySelectorAll('[data-pr-instance]').length).toBe(1);
  });
});

describe("member notices stay in each scanner while Admin keeps diagnostics", () => {
  it("hides provider/coverage/warming notices from the member page during operating hours", async () => {
    const page = await mount({ ...model("regular"), status: "partial", missingSymbols: ["TEST"], issues: ["synthetic missing input"] });
    expect(page.container.textContent).not.toContain("Some provider data is missing");
    expect(page.container.textContent).not.toContain("synthetic missing input");
    expect(page.container.textContent).not.toContain("Temporarily unavailable.");
    await page.update({ ...model("regular"), status: "warming" });
    expect(page.container.textContent).not.toContain("collecting enough recent activity");
  });
  it("shows the overnight hours inside both scanner cards and removes them at 4 AM through polling", async () => {
    const page = await mount({ ...model("regular"), status: "closed", session: null },{ now: "2026-11-03T08:59:58Z" });
    const cards = [...page.container.querySelectorAll('[aria-label="Top Gainers comparison"]')].map(tabs=>tabs.closest("section")!);
    cards.push(page.container.querySelector('[data-scanner-card="momentum"] section')!);
    expect(cards.length).toBe(2);
    expect(cards.every(card => card.textContent?.includes("Active 4:00am - 8:00pm est"))).toBe(true);
    expect(page.container.textContent).not.toContain("extended-hours scanning session is closed");
    await page.update({ ...model("regular"), session: "premarket", status: "warming" });
    expect(page.container.textContent).not.toContain("Active 4:00am - 8:00pm est");
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });
  it.each(["disabled", "unavailable", "universe_missing"] as const)("shows only the permitted member notice for %s", async status => {
    const page = await mount({ ...model("regular"), status });
    expect(page.container.textContent).toContain(status==="disabled"?"Disabled":"Temporarily unavailable.");
    expect(page.container.textContent).not.toContain("Live screeners are currently disabled");
    expect(page.container.textContent).not.toContain("stock universe has not arrived");
    expect(page.container.textContent).not.toContain("Live scanner data is temporarily unavailable");
  });
  it("uses the same short notice when fetching the model fails", async () => {
    const page = await mount(model("regular"),{fail:true});
    expect(page.container.textContent).toContain("Temporarily unavailable.");
    expect(page.container.textContent).not.toContain("latest scanner update could not be loaded");
  });
  it("retains the detailed provider notice on the Admin page", async () => {
    const page = await mount({ ...model("regular"), status: "partial" },{admin:true});
    expect(page.container.textContent).toContain("Some provider data is missing. Available rows are shown below.");
    expect(page.container.textContent).not.toContain("Active 4:00am - 8:00pm est");
  });
});
