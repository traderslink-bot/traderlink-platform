// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { LiveScannerRow, ScannerReadModel } from "./contracts";
import { DEFAULT_DECLINE_CONTROLS } from "./declines";
import { SCANNER_ACTIVE_HOURS_MESSAGE, SCANNER_TRANSIENT_FAILURE_GRACE_MS } from "./member-status";
import { EMPTY_MULTIVIEW, parseChartMultiview } from "../alpaca/chart-multiview";

import { DEFAULT_CHART_PREFERENCES } from "../alpaca/chart-preferences";

const CHART_PREFERENCES = "/api/charts/preferences";
const SCANNER_LAYOUT = "/api/charts/layout?workspace=scanner";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), action, children),
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => createElement("button", null, children),
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({ MarketChart: ({symbol}:{symbol:string}) => createElement("div",{"data-chart-symbol":symbol}) }));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({ useMarketEventsData: () => ({}), ScreenerPressReleaseBoard: () => createElement("div", {"data-pr-instance": true}, "PR Scanner") }));
vi.mock("@/app/(dashboard)/screeners/screener-market-halts-card", () => ({ ScreenerMarketHaltsCard: () => createElement("div", {"data-halt-instance": true}, "Halt Alerts") }));
import { availableScannerGridHeight, GAINERS_EXPLANATION, LiveScreenersClient } from "@/app/(dashboard)/screeners/live-screeners-client";
import { LiveScreenersClient as TradingWorkspaceClient } from "@/app/(dashboard)/screeners/workspace/live-screeners-client";
import { DEFAULT_SCANNER_WORKSPACE_LAYOUT } from "@/app/(dashboard)/screeners/scanner-workspace-layout";

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
async function mount(initial: ScannerReadModel, options: {
  admin?: boolean; now?: string; fail?: boolean; workspace?: boolean; singleScanner?: "gainers";
} = {}) {
  vi.useFakeTimers(); vi.setSystemTime(new Date(options.now ?? "2026-11-02T21:00:10Z")); let response = initial;
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  let layout = EMPTY_MULTIVIEW, revision = 1;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === CHART_PREFERENCES && (init?.method ?? "GET") === "GET") {
      return Response.json({ ownerKey: "scanner-test", revision: 1, preferences: { ...DEFAULT_CHART_PREFERENCES, timeframe: "5m" } });
    }
    if (String(input) === SCANNER_LAYOUT) {
      if (init?.method === "POST") {
        const update = JSON.parse(String(init.body));
        if (update.ownerKey !== "scanner-test" || update.revision !== revision) {
          return Response.json({}, { status: 409 });
        }
        layout = parseChartMultiview(update.layout);
        revision++;
      } else if (init?.method && init.method !== "GET") {
        throw Error("unexpected layout method");
      }
      return Response.json({ ownerKey: "scanner-test", revision, layout });
    }
    if (String(input) === "/api/admin/screeners/settings" && options.admin) return Response.json({ configuration: null });
    if (String(input).startsWith("/api/platform/news/workspace-scanner?articleId=")) return Response.json({});
    if (String(input) !== "/api/screeners/live") throw Error("unexpected request");
    if (options.fail) throw Error("synthetic transport error");
    return Response.json(response);
  }); vi.stubGlobal("fetch", fetch);
  const stream=vi.fn();const connections:FakeSource[]=[];
  class FakeSource extends EventTarget {
    onerror:((event:Event)=>void)|null=null;closed=false;
    constructor(url:string){super();stream(url);connections.push(this);queueMicrotask(()=>{if(options.fail)this.onerror?.(new Event("error"));else this.emit(response);});}
    emit(value:ScannerReadModel){if(!this.closed)this.dispatchEvent(new MessageEvent("scanner",{data:JSON.stringify(value)}));}
    close(){this.closed=true;}
  }
  vi.stubGlobal("EventSource",FakeSource);
  const container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => {
    root!.render(options.workspace ? createElement(TradingWorkspaceClient, {scannersOnly:true})
      : createElement(LiveScreenersClient, {admin:options.admin,singleScanner:options.singleScanner}));
  });
  return { container, fetch, stream, connections, savedLayout: () => layout, update: async (next: ScannerReadModel) => {
    response = next; await act(async () => { await vi.advanceTimersByTimeAsync(5000); connections.at(-1)!.emit(next); });
  } };
}
function expectOnlyInitialChartRequests(fetch: Awaited<ReturnType<typeof mount>>["fetch"]) {
  expect(fetch.mock.calls.map(([input, init]) => [String(input), init?.method ?? "GET", init?.cache]).sort())
    .toEqual([[SCANNER_LAYOUT, "GET", "no-store"], [CHART_PREFERENCES, "GET", "no-store"]].sort());
}
async function openFullView(container: HTMLElement, label = "Momentum") {
  const button = container.querySelector(`[aria-label="Open ${label} full view"]`) as HTMLElement;
  await act(async () => button.click());
  return document.body.querySelector(`[role="dialog"][aria-label="${label} full view"]`)!;
}
describe("actual Top Gainers pushed model and tab interaction", () => {
  it("keeps existing rows visible when a successful publication briefly returns every scanner empty", async () => {
    const page = await mount(momentumModel(undefined));
    expect(page.container.textContent).toContain("TEST");
    await page.update(model("regular"));
    expect(page.container.textContent).toContain("TEST");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
  it("switches the Gainers title and table to post-market on publication without remounting or extra requests", async () => {
    const page = await mount(model("regular"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers (pre/reg)");
    expect(page.container.querySelector('[aria-label="Open Top Gainers full view"]')).not.toBeNull();
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
    await page.update(model("after_hours"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers (post)");
    expect(page.container.textContent).not.toContain("Since today’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
    expect(page.stream).toHaveBeenCalledWith("/api/screeners/live?stream=1");
  });
  it("shows the combined day volume then switches the main Gainers column to after-hours at the close", async () => {
    const before = momentumModel(undefined);
    const page = await mount({ ...before, gainers: before.momentum, dayGainers: before.momentum });
    const gainerTable = () => page.container.querySelector('table[aria-label="Top Gainers compact stocks"]')!;
    const headers = [...gainerTable().querySelectorAll("thead th")];
    const volumeIndex = headers.findIndex(cell => cell.textContent === "Vol");
    expect(volumeIndex).toBeGreaterThan(-1);
    expect(headers[volumeIndex].classList.contains("MuiTableCell-alignLeft")).toBe(true);
    expect(gainerTable().querySelectorAll("tbody tr:first-child td")[volumeIndex].classList.contains("MuiTableCell-alignLeft")).toBe(true);
    expect(gainerTable().querySelector("tbody")?.textContent).toContain("400K");
    expect(gainerTable().querySelector("thead")?.textContent).not.toContain("Pre Vol");

    const toggle = page.container.querySelector<HTMLButtonElement>('[aria-label="Top Gainers view: Table"]')!;
    await act(async () => toggle.click());
    const preferences = document.querySelector('[aria-label="Top Gainers view settings"]')!;
    const pre = [...preferences.querySelectorAll("label")].find(label => label.textContent === "Pre Vol")!.querySelector("input")!;
    try {
      await act(async () => pre.click());
      expect(gainerTable().querySelector("thead")?.textContent).toContain("Pre Vol");
      expect(gainerTable().querySelector("tbody")?.textContent).toContain("150K");
      expect(page.container.querySelector('table[aria-label="Momentum compact stocks"] thead')?.textContent).not.toContain("Pre Vol");

      const after = momentumModel(20);
      const gainers = { ...after.momentum, rows: after.momentum.rows.map(row => ({
        ...row, gainBasis: "today_regular_close" as const, postMarketVolume: 0,
      })) };
      await page.update({ ...after, gainers, dayGainers: before.momentum });
      const columns = [...gainerTable().querySelectorAll("thead th")].map(cell => cell.textContent);
      expect(columns).toContain("After-hours Vol");
      expect(columns).not.toContain("Vol");
      expect(gainerTable().querySelectorAll("tbody tr:first-child td")[columns.indexOf("After-hours Vol")].textContent).toBe("0");
      expectOnlyInitialChartRequests(page.fetch);
    } finally {
      window.localStorage.removeItem("traderslink.scanner.volume-columns.v1.gainers");
    }
  });
  it("returns to the day comparison when the reported session is regular", async () => {
    const page = await mount(model("after_hours"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers (post)");
    await page.update(model("regular"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers (pre/reg)");
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
});

function momentumModel(post: number | null | undefined): ScannerReadModel {
  const row: LiveScannerRow = { symbol: "TEST", exchange: "NASDAQ", company: "Synthetic test company", price: 2.4,
    sessionGain: (2.4/3.17-1)*100, ...(post===undefined?{}:{postMarketGain:post}),
    country: "CA", volume: 100000, dayVolume: 400000, premarketVolume: 150000, regularVolume: 250000,
    postMarketVolume: post === undefined ? null : 100000, dollarVolume: 240000, marketCap: 1000000, marketCapAtCollection: 1000000, float: 500000,
    relativeVolume: 2, dayHigh: 2.6, dayLow: 1.5, offHighPercent: -7.69,
    floatRetrievedAtUtc: "2026-11-02T21:00:00Z", spreadPercent: 1,
    providerAtUtc: "2026-11-02T21:00:10Z", receivedAtUtc: "2026-11-02T21:00:10Z",
    activity: { oneMinuteGain: 8, fiveMinuteGain: 20, oneMinuteVolume: 10000, fiveMinuteVolume: 50000,
      oneMinuteDollarVolume: 24000, volumeAcceleration: 2, fiveMinuteVolumeSpike: 3 }, reasons: [], news: [],
    momentumSignals: ["volume_ignition","price_burst"] };
  return { ...model(post===undefined?"regular":"after_hours"), momentum: { rows: [row], focus: [], total: 1 } };
}

describe.each([{surface:"Scanner",workspace:false},{surface:"Trading Workspace",workspace:true}])("$surface live display fixes", ({workspace}) => {
  it("keeps Momentum percentage precision and formats larger RVOL values consistently", async () => {
    const frame = momentumModel(undefined);
    const base = frame.momentum.rows[0];
    const rows = [
      { ...base, relativeVolume:4246.03, spreadPercent:0.46, activity:{...base.activity,oneMinuteGain:-0.001,fiveMinuteGain:1.857585} },
      { ...base, symbol:"FLAT", relativeVolume:5.01, spreadPercent:0 },
      { ...base, symbol:"UNKNOWN", relativeVolume:null, spreadPercent:null },
    ];
    const results = { ...frame.momentum, rows, total:rows.length };
    const { container } = await mount({...frame,momentum:results,gainers:results,dayGainers:results}, {workspace});
    const momentum = container.querySelector('[aria-label="Momentum compact stocks"]')!;
    const cells = (table:Element, ticker:string) => {
      const headers = [...table.querySelectorAll("thead th")].map(cell => cell.textContent);
      const row = [...table.querySelectorAll("tbody tr")].find(item => item.querySelector("[data-scanner-sticky-ticker]")?.textContent === ticker)!;
      return Object.fromEntries([...row.querySelectorAll("td")].map((cell,index) => [headers[index],cell.textContent]));
    };
    expect(cells(momentum,"TEST")).toMatchObject({"1min %":"0%","5min %":"1.86%","Spread":"0.46%"});
    expect(cells(momentum,"FLAT").Spread).toBe("0%");
    expect(cells(momentum,"UNKNOWN").Spread).toBe("n/a");
    const gainers = container.querySelector('[aria-label="Top Gainers compact stocks"]')!;
    expect(cells(gainers,"TEST").RVOL).toBe("4,246×");
    expect(cells(gainers,"FLAT").RVOL).toBe("5.01×");
  });

  it("shows the age of the retained Breakouts price beside its status", async () => {
    const frame = momentumModel(undefined);
    const base = frame.momentum.rows[0];
    const originalEventAt = new Date(Date.parse(base.receivedAtUtc)-600_000).toISOString();
    const olderPriceAt = new Date(Date.parse(base.receivedAtUtc)-198_190).toISOString();
    const breakouts: NonNullable<ScannerReadModel["breakouts"]> = [
      { ...base, breakoutLevel:2, breakoutAtUtc:originalEventAt, breakoutPriceAtUtc:olderPriceAt, breakoutState:"above" },
    ];
    const page = await mount({...frame,breakouts}, {workspace});
    const table = page.container.querySelector('[aria-label="Breakouts"]')!;
    expect(table.textContent).toContain("Above");
    expect(table.querySelector("time")?.textContent).toBe("Price 3m old");
    expect(table.querySelector("time")?.getAttribute("datetime")).toBe(olderPriceAt);
    await page.update({...frame,breakouts:[{...breakouts[0],breakoutPriceAtUtc:base.receivedAtUtc,breakoutState:"below"}]});
    expect(table.textContent).toContain("Back below");
    expect(table.querySelector("time")).toBeNull();
  });

  it("reopens the recently viewed quick chart and keeps the saved chart available", async () => {
    const frame = momentumModel(undefined);
    const base = frame.momentum.rows[0];
    const results = { ...frame.momentum, rows:[{...base,symbol:"ONFO"},{...base,symbol:"AKAN"}], total:2 };
    const { container, savedLayout } = await mount({...frame,gainers:results,dayGainers:results}, {workspace});
    const open = async (symbol:string) => {
      const button = container.querySelector<HTMLElement>(`[aria-label="Open ${symbol} chart only"]`)!;
      await act(async () => button.click());
    };
    const drawer = () => document.querySelector('[role="dialog"][aria-label="Chart workspace"]')!;
    const close = async () => {
      await act(async () => drawer().querySelector<HTMLElement>('[aria-label="Close chart"]')!.click());
      await act(async () => {await vi.advanceTimersByTimeAsync(500);});
    };
    await open("ONFO");
    await close();
    await open("AKAN");
    expect(drawer().querySelector('[data-workspace-chart="AKAN"]')).not.toBeNull();
    await close();
    const reopen = document.querySelector<HTMLButtonElement>('button[aria-label="Reopen chart drawer"]')!;
    expect(reopen.disabled).toBe(false);
    await act(async () => reopen.click());
    expect(drawer().querySelector('[data-workspace-chart="AKAN"]')).not.toBeNull();
    expect(savedLayout().groups.map(group => group.symbol)).toEqual(["ONFO"]);
    const back = [...drawer().querySelectorAll("button")].find(button => button.textContent === "Back to saved charts")!;
    await act(async () => back.click());
    expect(drawer().querySelector('[data-workspace-chart="ONFO"]')).not.toBeNull();
  });
});

describe("Momentum context rendering", () => {
  it("shows Alpaca pause icons for SMX and OMH in Top Gainers and Momentum until each resumes", async () => {
    const base = momentumModel(42);
    const symbols = ["SMX", "OMH"];
    const results = { ...base.momentum, rows: symbols.map(symbol => ({ ...base.momentum.rows[0], symbol })), total: 2 };
    const initial = { ...base, gainers: results, dayGainers: results, momentum: results };
    const activeHalts = symbols.map(ticker => ({
      id: ticker, ticker, market: "NASDAQ", haltTimeEt: "16:01:00", reasonCode: "LUDP",
      reason: "Volatility trading pause", quoteTimeEt: "16:06:00", tradeTimeEt: null, source: "alpaca" as const, halted: true,
    }));
    const page = await mount({ ...initial, activeHalts });
    const icons = (ticker: string) => page.container.querySelectorAll(`[data-halt-indicator="${ticker}"]`);
    expect(icons("SMX")).toHaveLength(2);
    expect(icons("OMH")).toHaveLength(2);
    await page.update({ ...initial, activeHalts: activeHalts.slice(1) });
    expect(icons("SMX")).toHaveLength(0);
    expect(icons("OMH")).toHaveLength(2);
    await page.update(initial);
    expect(icons("OMH")).toHaveLength(0);
    expect(page.container.textContent).toContain("SMX");
    expect(page.container.textContent).toContain("OMH");
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
  it("opens scanner news through the workspace article endpoint instead of an external link", async () => {
    const initial=momentumModel(42),row={...initial.momentum!.rows[0]!,news:[{id:"article-1",headline:"Synthetic filing",createdAt:"2026-11-02T21:00:00Z",url:"https://example.com/external",typeLabel:"SEC filing"}]};
    const page=await mount({...initial,momentum:{rows:[row],focus:[],total:1}});
    const news=page.container.querySelector('[aria-label="Open SEC filing: Synthetic filing"]') as HTMLElement;
    expect(news.tagName).toBe("BUTTON");expect(news.getAttribute("href")).toBeNull();
    await act(async()=>news.click());
    expect(page.fetch).toHaveBeenCalledWith("/api/platform/news/workspace-scanner?articleId=article-1",expect.objectContaining({cache:"no-store"}));
  });
  it("renders Day and Post columns, keeping one/five-minute changes and volumes intact", async () => {
    const page = await mount(momentumModel((2.4/1.69-1)*100));
    const drawer = await openFullView(page.container);
    const header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells.slice(4,12)).toEqual(["-24%","42%","400K","8%","20%","10K","50K","2×"]);
    expect(header.querySelectorAll("th").length).toBe(16);
    await act(async () => (drawer.querySelector('[aria-label="Close full scanner view"]') as HTMLElement).click());
    const compact = page.container.querySelector('table[aria-label="Momentum compact stocks"]')!;
    const compactRow = compact.querySelector("tbody tr") as HTMLElement;
    await act(async () => compactRow.click());
    expect(compact.textContent).toContain("Day %");
    expect(compact.textContent).toContain("Post %");
    expect(compact.textContent).toContain("-24%");
    expect(compact.textContent).toContain("42%");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
  it("omits Post outside after-hours, adds it on the next publication and does not replace unknown values with zero", async () => {
    const page = await mount(momentumModel(undefined));
    const drawer = await openFullView(page.container);
    let header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).not.toContain("Post %");
    expect(header.querySelectorAll("th").length).toBe(15);
    await page.update(momentumModel(null));
    header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells[4]).toBe("-24%");
    expect(cells[5]).toBe("n/a");
    expect(cells[6]).toBe("400K");
    expect(cells[7]).toBe("8%");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
});

describe("compact scanner grid and full view", () => {
  it("fills the available desktop viewport while preserving a usable two-row minimum",()=>{
    expect(availableScannerGridHeight(900,100)).toBe(792);
    expect(availableScannerGridHeight(440,100)).toBe(452);
  });
  it("uses the approved gainer explanation",()=>{expect(GAINERS_EXPLANATION).toBe("This gainer list is not a standard list where percentage increase determines inclusion. The scanner qualifies candidates according to total vol, dollar vol, min gain and max spread. Day Gainers are ranked by gain from yesterday’s regular session close. Post market Gainers are ranked by gain from today’s regular close.");});
  it("keeps trailing zeroes in every scanner price",async()=>{const initial=momentumModel(42),row={...initial.momentum!.rows[0]!,price:.1,dayHigh:.2,dayLow:.1};const page=await mount({...initial,gainers:{rows:[row],focus:[],total:1},dayGainers:{rows:[row],focus:[],total:1},momentum:{rows:[row],focus:[],total:1}});expect(page.container.textContent).toContain("$0.10");expect([...page.container.querySelectorAll("td")].some(cell=>cell.textContent==="$0.1")).toBe(false);});
  it("renders Gainers and Momentum as separate cards without a combined scanner selector", async () => {
    const page = await mount(model("regular"));
    expect(page.container.querySelectorAll('[data-scanner-workspace-card]').length).toBe(7);
    expect([...page.container.querySelectorAll('[data-scanner-workspace-slot]')].map(card=>card.getAttribute("data-scanner-workspace-slot"))).toEqual(["slot-1","slot-2","slot-3","slot-4","slot-5","slot-7","slot-6"]);
    expect(DEFAULT_SCANNER_WORKSPACE_LAYOUT.assignments["ticker-workspace"]).toBe("slot-6");
    expect(page.container.querySelector('[aria-label="Live screener"]')).toBeNull();
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers (pre/reg)");
    expect([...page.container.querySelectorAll('[data-scanner-workspace-card="momentum"] h2')].some(heading=>heading.textContent==="Momentum")).toBe(true);
  });
  it("keeps a single PR instance and exposes every compact column with keyboard details", async () => {
    const initial = momentumModel(42);
    const scannerRows = {...initial.momentum!,rows:[{...initial.momentum!.rows[0]!,news:[{id:"article-1",headline:"Synthetic release",createdAt:"2026-11-02T21:00:00Z",url:"https://example.com/release",typeLabel:"Press release"}]}]};
    const page = await mount({...initial, gainers: scannerRows, dayGainers: scannerRows, momentum: scannerRows});
    expect(page.container.querySelectorAll('[data-pr-instance]').length).toBe(1);
    expect(page.container.querySelectorAll('[data-scanner-workspace-card]').length).toBe(7);
    for (const [label,columnCount] of [["Top Gainers",10],["Momentum",14]] as const) {
      const table = page.container.querySelector(`table[aria-label="${label} compact stocks"]`)!;
      expect(table.querySelectorAll('thead th').length).toBe(columnCount);
      expect(table.querySelector('thead')?.textContent).not.toContain('$ × Vol');
      expect(table.querySelector('thead th:last-child')?.textContent).toBe('Country');
      expect(table.querySelector('tbody tr td:last-child [aria-label="Canada flag"]')).not.toBeNull();
      expect([...table.querySelectorAll('thead th')].slice(1,4).map(cell=>cell.textContent)).not.toContain("News");
      expect(table.querySelector('thead th')?.getAttribute("aria-label")).toBe("Chart, news and details");
      const row = table.querySelector('tbody tr')!;
      const controls = row.querySelector('[data-compact-row-controls]')!;
      expect(getComputedStyle(controls).gridTemplateColumns).toBe("20px 20px 12px");
      expect(getComputedStyle(controls).columnGap).toBe("8px");
      expect(controls.textContent).toContain("🗞️");
      expect(controls.textContent).toContain("+");
      await act(async () => row.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true})));
      expect(row.getAttribute('aria-expanded')).toBe('true');
      expect(table.textContent).toContain('Float');
      expect(table.textContent).toContain(label==='Top Gainers'?'T/O':'Turnover');
      expect(table.querySelector(`td[colspan="${columnCount}"]`)).not.toBeNull();
    }
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
  it("opens full data without another request, polls it from the same model and closes with Escape", async () => {
    const initial = momentumModel(42);
    const page = await mount(initial);
    const drawer = await openFullView(page.container);
    expect(drawer.textContent).toContain('$2.4');
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
    const next = {...initial, momentum:{...initial.momentum,rows:initial.momentum.rows.map(row=>({...row,price:2.5}))}};
    await page.update(next);
    expect(drawer.textContent).toContain('$2.5');
    expect(page.container.querySelector('table[aria-label="Momentum compact stocks"]')!.textContent).toContain('$2.5');
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
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
  it("shows the overnight hours inside both scanner cards and removes them at 4 AM through publication", async () => {
    const page = await mount({ ...model("regular"), status: "closed", session: null },{ now: "2026-11-03T08:59:58Z" });
    const cards = [page.container.querySelector('[data-scanner-workspace-card="gainers"] section')!,page.container.querySelector('[data-scanner-workspace-card="momentum"] section')!];
    expect(cards.length).toBe(2);
    expect(cards.every(card => card.textContent?.includes(SCANNER_ACTIVE_HOURS_MESSAGE))).toBe(true);
    expect(page.container.textContent).not.toContain("extended-hours scanning session is closed");
    await page.update({ ...model("regular"), session: "premarket", status: "warming" });
    expect(page.container.textContent).not.toContain(SCANNER_ACTIVE_HOURS_MESSAGE);
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
  it.each([false, true])("shows the same notice on every stock scanner when the market is closed on Sunday (admin=%s)", async admin => {
    const page = await mount({ ...model("regular"), status: "closed", session: null, tradingDate: "2026-11-15" },
      { admin, now: "2026-11-15T19:00:00Z" });
    const kinds = ["gainers", "momentum", "top-losers", "high-drops"];
    if (!admin) kinds.push("breakouts");
    for (const kind of kinds) {
      const card = page.container.querySelector(`[data-scanner-workspace-card="${kind}"]`);
      expect(card?.querySelector('[role="alert"]')?.textContent).toBe(SCANNER_ACTIVE_HOURS_MESSAGE);
    }
  });
  it.each(["disabled", "unavailable", "universe_missing"] as const)("shows only the permitted member notice for %s", async status => {
    const page = await mount({ ...model("regular"), status });
    expect(page.container.textContent).toContain(status==="disabled"?"Disabled":"Temporarily unavailable.");
    expect(page.container.textContent).not.toContain("Live screeners are currently disabled");
    expect(page.container.textContent).not.toContain("stock universe has not arrived");
    expect(page.container.textContent).not.toContain("Live scanner data is temporarily unavailable");
  });
  it("waits through the recovery grace before showing a sustained transport outage", async () => {
    const page = await mount(model("regular"),{fail:true});
    expect(page.container.textContent).not.toContain("Temporarily unavailable.");
    expect(document.querySelector('button[aria-label="Reconnecting to scanners. Retry connection."]')).not.toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(SCANNER_TRANSIENT_FAILURE_GRACE_MS));
    expect(page.container.textContent).not.toContain("Temporarily unavailable.");
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(page.container.textContent).toContain("Temporarily unavailable.");
    expect(page.container.textContent).not.toContain("latest scanner update could not be loaded");
    const recovery = page.fetch.mock.calls.filter(([path]) => String(path) === "/api/screeners/live");
    expect(recovery.length).toBeGreaterThan(0); expect(recovery.length).toBeLessThan(10);
    expect(recovery.every(([, init]) => init?.cache === "no-store" && init?.credentials === "same-origin")).toBe(true);
  });
  it("retains the detailed provider notice on the Admin page", async () => {
    const page = await mount({ ...model("regular"), status: "partial" },{admin:true});
    expect(page.container.textContent).toContain("Some provider data is missing. Available rows are shown below.");
    expect(page.container.textContent).not.toContain(SCANNER_ACTIVE_HOURS_MESSAGE);
  });
});

async function switchView(container: HTMLElement, label: string, view: string) {
  const trigger = container.querySelector<HTMLButtonElement>(`[aria-label^="${label} view: "]`)!;
  await act(async () => trigger.click());
  const panel = document.querySelector<HTMLElement>(`[aria-label="${label} view settings"]`)!;
  const choice = [...panel.querySelectorAll("button")].find(button => button.textContent === view)!;
  await act(async () => choice.click());
  if (view === "Cards") {
    expect(panel.querySelector('[aria-label="Ticker card sections"]')).not.toBeNull();
    await act(async () => panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  }
  await act(async () => { await vi.advanceTimersByTimeAsync(500); });
}

describe("alternative stock card view", () => {
  it("uses the displayed volume for turnover in the main Scanner's Top Gainers views", async () => {
    const initial = momentumModel(undefined);
    const result = (rows: readonly LiveScannerRow[]) => ({ rows, total: rows.length, focus: [] });
    const row = initial.momentum.rows[0];
    const premarket = result([{ ...row, dayVolume:row.premarketVolume, gainBasis:"previous_regular_close" }]);
    const day = result([{ ...row, gainBasis: "previous_regular_close" }]);
    const post = result([
      { ...row, gainBasis: "today_regular_close", postMarketVolume: 25_000 },
      { ...row, symbol: "ZERO", gainBasis: "today_regular_close", postMarketVolume: 0 },
      { ...row, symbol: "MISSING", gainBasis: "today_regular_close", postMarketVolume: null },
    ]);
    const page = await mount({ ...initial, session:"premarket", gainers:premarket, dayGainers:premarket }, {singleScanner:"gainers"});
    const table = (scope: Element, volume: string, expected: readonly string[]) => {
      const headers = [...scope.querySelectorAll("thead th")];
      expect(headers.some(cell => cell.textContent === volume)).toBe(true);
      const turnover = headers.findIndex(cell => cell.textContent === "T/O");
      expect(headers[turnover].getAttribute("title")).toContain("divided by float");
      const values = [...scope.querySelectorAll<HTMLTableRowElement>("tbody tr")]
        .filter(row => row.cells.length > turnover).map(row => row.cells[turnover].textContent);
      expect(values).toEqual(expected);
    };
    const cards = () => page.container.querySelector('[aria-label="Top Gainers stock cards"]')!;
    const turnoverStats = () => [...cards().querySelectorAll("dt")]
      .filter(label => label.textContent === "T/O").map(label => label.nextElementSibling?.textContent);
    const compactTable = () => page.container.querySelector('table[aria-label="Top Gainers compact stocks"]')!;
    table(compactTable(), "Vol", ["30%"]);
    await page.update({ ...initial, gainers:day, dayGainers:day });
    table(compactTable(), "Vol", ["80%"]);
    await switchView(page.container,"Top Gainers","Cards");
    expect(turnoverStats()).toEqual(["80%"]);
    await page.update({ ...initial, session:"after_hours", gainers:post, dayGainers:day });
    expect(cards().textContent).toContain("After-hours Vol");
    expect(turnoverStats()).toEqual(["5%", "0%", "—"]);
    await switchView(page.container,"Top Gainers","Two rows");
    table(page.container.querySelector('table[aria-label="Top Gainers two-row stocks"]')!, "After-hours Vol", ["5%", "0%", "—"]);
    await switchView(page.container,"Top Gainers","Table");
    const full = await openFullView(page.container,"Top Gainers");
    table(full.querySelector("table")!, "After-hours Vol", ["5%", "0%", "—"]);
  });

  it("switches each scanner independently and shows the new Basic Stats without extra requests", async () => {
    const initial=momentumModel(undefined);
    const row = initial.momentum.rows[0];
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum,
      declines:{controls:DEFAULT_DECLINE_CONTROLS,rapid:[],rapidTotal:0,loserTotal:1,
        losers:[{...row,symbol:"LOSE",changePercent:-10,comparisonPrice:3}]},
      breakouts:[{...row,symbol:"BRKT",breakoutAtUtc:row.receivedAtUtc,breakoutLevel:2,breakoutState:"above"}],
    });
    await switchView(page.container,"Top Gainers","Cards");
    const cards=page.container.querySelector('[aria-label="Top Gainers stock cards"]')!;
    expect(cards).not.toBeNull();
    expect(cards.querySelector('[aria-label="Canada flag"]')).not.toBeNull();
    expect([...cards.querySelectorAll('dt')].map(label=>label.textContent)).toEqual(['Vol','Float','T/O','RVOL']);
    expect(page.container.querySelector('table[aria-label="Momentum compact stocks"]')).not.toBeNull();
    await switchView(page.container,"Momentum","Cards");
    const momentum=page.container.querySelector('[aria-label="Momentum stock cards"]')!;
    expect([...momentum.querySelectorAll('dt')].map(label=>label.textContent)).toEqual(['Vol','Float','T/O','RVOL']);
    expect([...momentum.querySelectorAll('dt')].find(label=>label.textContent==="T/O")?.nextElementSibling?.textContent).toBe("80%");
    expect(momentum.querySelector('[aria-label="Open TEST chart only"]')).not.toBeNull();
    expect(momentum.querySelector('[aria-label="Expand TEST card details"]')).toBeNull();
    expect(momentum.querySelector('[aria-label="Indicators"]')).toBeNull();
    expect(momentum.querySelector('[aria-label="Catalyst"]')).toBeNull();
    for (const label of ["Top Losers","Breakouts"]) {
      await switchView(page.container,label,"Cards");
      const list=page.container.querySelector(`[aria-label="${label} stock cards"]`)!;
      expect([...list.querySelectorAll("dt")].find(item=>item.textContent==="T/O")?.nextElementSibling?.textContent).toBe("80%");
    }
    await switchView(page.container,"Top Gainers","Table");
    expect(page.container.querySelector('table[aria-label="Top Gainers compact stocks"]')).not.toBeNull();
    expect(page.container.querySelector('[aria-label="Momentum stock cards"]')).not.toBeNull();
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
});

describe("two-row table view", () => {
  it("keeps ticker in the first row and second-row controls under the Price column", async () => {
    const initial=momentumModel(undefined);
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum});
    for(const label of ['Top Gainers','Momentum']) {
      await switchView(page.container,label,"Two rows");
      const table=page.container.querySelector(`table[aria-label="${label} two-row stocks"]`)!;
      expect(table.querySelector('thead th')?.textContent).toBe('Ticker');
      if(label==='Top Gainers')expect(table.querySelector('thead')?.textContent).not.toContain('$ × Vol');
      const first=table.querySelector('tbody tr')!;
      expect(first.querySelector('[data-compact-row-controls]')).toBeNull();
      expect(first.querySelector('td')?.textContent).toContain('TEST');
      const second=first.nextElementSibling!;
      expect(second.getAttribute('data-two-row-tools')).toBe('TEST');
      expect(second.querySelector('td')?.textContent).toBe('');
      if(label==='Top Gainers')expect(second.querySelector('td [aria-label="Canada flag"]')).not.toBeNull();
      expect(second.querySelector('td')?.querySelector('[data-compact-row-controls]')).toBeNull();
      expect(second.querySelector('[aria-label="Open TEST chart only"]')).not.toBeNull();
      const plus=second.querySelector('[aria-label="Expand TEST two-row details"]') as HTMLElement;
      await act(async()=>plus.click());
      expect(first.getAttribute('aria-expanded')).toBe('true');
      expect(second.nextElementSibling?.textContent).toContain('HOD price');
    }
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialChartRequests(page.fetch);
  });
});

 describe("multi-chart ticker workspace",()=>{
  it("keeps the covered grid stable while the drawer receives live rows and catches up on close",async()=>{
    const initial=momentumModel(undefined);
    const results=initial.momentum;
    const page=await mount({...initial,gainers:results,dayGainers:results});
    const grid=page.container.querySelector('[data-scanner-grid]')!;
    const open=grid.querySelector('[aria-label="Open TEST chart only"]') as HTMLElement;
    await act(async()=>open.click());
    const drawer=document.querySelector('[role="dialog"][aria-label="Chart workspace"]')!;
    const scanners=[...drawer.querySelectorAll('[role="tab"]')].find(tab=>tab.textContent==="Scanners") as HTMLElement;
    await act(async()=>scanners.click());
    const changed={...results,rows:results.rows.map(row=>({...row,price:3.78}))};
    await page.update({...initial,gainers:changed,dayGainers:changed});
    expect(drawer.querySelector('[data-sidebar-screener-card]')?.textContent).toContain("$3.78");
    expect(grid.textContent).not.toContain("$3.78");
    await act(async()=>(drawer.querySelector('[aria-label="Close chart"]') as HTMLElement).click());
    expect(grid.textContent).toContain("$3.78");
  });

  it("retains four charts and screener selection, selects ticker details, and frees a slot on close",async()=>{
    const initial=momentumModel(undefined),template=initial.momentum.rows[0];
    const results={...initial.momentum,rows:['TEST','AAA','BBB','CCC','DDD'].map(symbol=>({...template,symbol})),total:5};
    const page=await mount({...initial,gainers:results,dayGainers:results});
    await act(async()=>{(page.container.querySelector('[aria-label="Open TEST chart only"]') as HTMLElement).click();});
    const aside=()=>document.querySelector('aside[aria-label="Chart workspace details"]')!;
    const tab=()=>[...aside().querySelectorAll('[role=tab]')].find(el=>el.textContent==='Scanners') as HTMLElement;
    await act(async()=>tab().click());
    const firstChart=document.querySelector('[data-workspace-chart="TEST"] [data-chart-symbol]');
    for(const symbol of ['AAA','BBB','CCC']) {
      await act(async()=>{(aside().querySelector(`[aria-label="Add ${symbol} chart"]`) as HTMLElement).click();});
      await act(async()=>tab().click());
    }
    expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);
    expect(document.querySelector('[data-workspace-chart="TEST"] [data-chart-symbol]')).toBe(firstChart);
    expect(tab().getAttribute('aria-selected')).toBe('true');
    await act(async()=>{(aside().querySelector('[aria-label="Add DDD chart"]') as HTMLElement).click();});
    expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);
    const picker = document.querySelector('[role="dialog"][aria-labelledby="replace-scanner-chart-title"]')!;
    expect([...picker.querySelectorAll("button")].map(button => button.textContent?.trim()))
      .toEqual(["Replace TEST · 5m", "Replace AAA · 5m", "Replace BBB · 5m", "Replace CCC · 5m", "Cancel"]);
    await act(async()=>{[...picker.querySelectorAll("button")].find(button=>button.textContent==="Cancel")!.click();});
    expect(page.savedLayout().groups.map(group=>group.symbol)).toEqual(["TEST","AAA","BBB","CCC"]);
    await act(async()=>{([...aside().querySelectorAll('[role=tab]')].find(el=>el.textContent==='AAA') as HTMLElement).click();});
    expect(document.querySelector('[data-workspace-chart="AAA"]')?.getAttribute('data-selected')).toBe('true');
    const panel=[...aside().querySelectorAll('[role=tabpanel]')].find(el=>!(el as HTMLElement).hidden)!;
    await vi.waitFor(()=>expect(aside().querySelector('[data-levels-action-slot]')?.textContent).toContain('Generate Levels'));expect(panel.textContent).toContain('Recent News');
    await act(async()=>{(document.querySelector('[aria-label="Close BBB chart"]') as HTMLElement).click();});
    await act(async()=>tab().click());
    await act(async()=>{(aside().querySelector('[aria-label="Add DDD chart"]') as HTMLElement).click();});
    expect(document.querySelector('[data-workspace-chart="DDD"]')).not.toBeNull();expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);
    expect(page.savedLayout().groups.map(group => group.symbol)).toEqual(["TEST", "AAA", "CCC", "DDD"]);
    expect(page.fetch.mock.calls.filter(([, init]) => (init?.method ?? "GET") === "GET").map(([path]) => path).sort())
      .toEqual([SCANNER_LAYOUT, CHART_PREFERENCES].sort());
    expect(page.fetch.mock.calls.filter(([, init]) => init?.method === "POST").every(([path]) => path === SCANNER_LAYOUT)).toBe(true);
    expect(page.stream).toHaveBeenCalledTimes(1);
    await act(async()=>tab().click());
    await act(async()=>{(document.querySelector('[aria-label="Close chart"]') as HTMLElement).click();});
    await act(async()=>{await vi.advanceTimersByTimeAsync(500);});
    expect(document.querySelector('[data-workspace-chart]')).toBeNull();
    expect(page.savedLayout().groups.map(group => group.symbol)).toEqual(["TEST", "AAA", "CCC", "DDD"]);
    const reopen = document.querySelector<HTMLButtonElement>('[aria-label="Reopen chart drawer"]')!;
    await act(async()=>{reopen.click();});
    expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);
    expect(tab().getAttribute('aria-selected')).toBe('true');
  });
 });

it("closes the pushed model stream while hidden, resumes once and cleans up on unmount",async()=>{
 const page=await mount(model("regular"));
 expectOnlyInitialChartRequests(page.fetch);
 try{
  Object.defineProperty(document,"hidden",{configurable:true,value:true});
  await act(async()=>document.dispatchEvent(new Event("visibilitychange")));
  expect(page.connections[0].closed).toBe(true);expect(page.stream).toHaveBeenCalledTimes(1);
  Object.defineProperty(document,"hidden",{configurable:true,value:false});
  await act(async()=>document.dispatchEvent(new Event("visibilitychange")));
  expect(page.stream).toHaveBeenCalledTimes(2);expect(page.connections[1].closed).toBe(false);
  const expected = [[SCANNER_LAYOUT, "GET", "no-store"], [CHART_PREFERENCES, "GET", "no-store"], ["/api/screeners/live", "GET", "no-store"]].sort();
  const requests = () => page.fetch.mock.calls.map(([input, init]) => [String(input), init?.method ?? "GET", init?.cache]).sort();
  expect(requests()).toEqual(expected);
  const recovery = page.fetch.mock.calls.find(([path]) => String(path) === "/api/screeners/live")!;
  expect(recovery[1]).toMatchObject({ credentials: "same-origin", cache: "no-store", redirect: "error" });
  await act(async()=>vi.advanceTimersByTimeAsync(5000));
  expect(requests()).toEqual(expected); // Healthy recovery does not introduce snapshot polling.
  await act(async()=>root!.unmount());root=undefined;expect(page.connections[1].closed).toBe(true);
 }finally{delete (document as unknown as {hidden?:boolean}).hidden;}
});

it("colors scanner prices against the displayed comparison and keeps the drawer's Day and Post signs separate", async () => {
  const initial = momentumModel(42), day = { ...initial.momentum.rows[0], gainBasis: "previous_regular_close" as const };
  const post = { ...day, gainBasis: "today_regular_close" as const, sessionGain: 42 };
  const rows = (row: LiveScannerRow) => ({ rows: [row], focus: [], total: 1 });
  const page = await mount({ ...initial, dayGainers: rows(day), gainers: rows(post), momentum: rows(day) });
  const color = (element: Element) => getComputedStyle(element).color;
  const postValue = [...page.container.querySelectorAll("td")].find(cell => cell.textContent === "42%")!;
  expect(color(postValue)).toBe("rgb(46, 125, 50)");
  await act(async () => { (page.container.querySelector('[aria-label="Open TEST chart only"]') as HTMLElement).click(); });
  await vi.waitFor(()=>expect(document.querySelector('[aria-label="TEST stock details"]')).not.toBeNull());
  const detail = document.querySelector('[aria-label="TEST stock details"]')!;
  const fact = (label: string) => [...detail.querySelectorAll("dt")].find(el => el.textContent === label)!.nextElementSibling!;
  expect(fact("Day change").textContent).toBe("-24%");
  expect(color(fact("Price"))).toBe("rgb(211, 47, 47)");
  expect(color(fact("Day change"))).toBe("rgb(211, 47, 47)");
  expect(fact("Post-market change").textContent).toBe("42%");
  expect(color(fact("Post-market change"))).toBe("rgb(46, 125, 50)");
});
