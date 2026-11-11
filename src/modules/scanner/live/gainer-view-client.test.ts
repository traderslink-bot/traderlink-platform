// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { LiveScannerRow, ScannerReadModel } from "./contracts";
import { EMPTY_MULTIVIEW, parseChartMultiview } from "../alpaca/chart-multiview";

const SCANNER_LAYOUT = "/api/charts/layout?workspace=scanner";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h2", null, title), action, children),
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => createElement("button", null, children),
}));
vi.mock("@/app/(dashboard)/charts/alpaca-lightweight-chart", () => ({ AlpacaLightweightChart: ({symbol}:{symbol:string}) => createElement("div",{"data-chart-symbol":symbol}) }));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({ useMarketEventsData: () => ({}), ScreenerPressReleaseBoard: () => createElement("div", {"data-pr-instance": true}, "PR Scanner") }));
vi.mock("@/app/(dashboard)/screeners/screener-market-halts-card", () => ({ ScreenerMarketHaltsCard: () => createElement("div", {"data-halt-instance": true}, "Halt Alerts") }));
import { availableScannerGridHeight, GAINERS_EXPLANATION, LiveScreenersClient } from "@/app/(dashboard)/screeners/live-screeners-client";
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
async function mount(initial: ScannerReadModel, options: { admin?: boolean; now?: string; fail?: boolean } = {}) {
  vi.useFakeTimers(); vi.setSystemTime(new Date(options.now ?? "2026-11-02T21:00:10Z")); let response = initial;
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  let layout = EMPTY_MULTIVIEW, revision = 1;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
  await act(async () => { root!.render(createElement(LiveScreenersClient,{admin:options.admin})); });
  return { container, fetch, stream, connections, savedLayout: () => layout, update: async (next: ScannerReadModel) => {
    response = next; await act(async () => { await vi.advanceTimersByTimeAsync(5000); connections.at(-1)!.emit(next); });
  } };
}
function expectOnlyInitialLayoutRequest(fetch: Awaited<ReturnType<typeof mount>>["fetch"]) {
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(SCANNER_LAYOUT, expect.objectContaining({ cache: "no-store" }));
  expect(fetch.mock.calls[0][1]?.method ?? "GET").toBe("GET");
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
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
  it("switches the Gainers title and table to post-market on publication without remounting or extra requests", async () => {
    const page = await mount(model("regular"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers");
    expect(page.container.querySelector('[aria-label="Open Top Gainers full view"]')).not.toBeNull();
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
    await page.update(model("after_hours"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers Post Market");
    expect(page.container.textContent).not.toContain("Since today’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
    expect(page.stream).toHaveBeenCalledWith("/api/screeners/live?stream=1");
  });
  it("returns to the day comparison when the reported session is regular", async () => {
    const page = await mount(model("after_hours"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers Post Market");
    await page.update(model("regular"));
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers");
    expect(page.container.textContent).not.toContain("Since the previous trading day’s regular close");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
});

function momentumModel(post: number | null | undefined): ScannerReadModel {
  const row: LiveScannerRow = { symbol: "TEST", exchange: "NASDAQ", company: "Synthetic test company", price: 2.4,
    sessionGain: (2.4/3.17-1)*100, ...(post===undefined?{}:{postMarketGain:post}),
    country: "CA", volume: 100000, dollarVolume: 240000, marketCap: 1000000, marketCapAtCollection: 1000000, float: 500000,
    relativeVolume: 2, dayHigh: 2.6, dayLow: 1.5, offHighPercent: -7.69,
    floatRetrievedAtUtc: "2026-11-02T21:00:00Z", spreadPercent: 1,
    providerAtUtc: "2026-11-02T21:00:10Z", receivedAtUtc: "2026-11-02T21:00:10Z",
    activity: { oneMinuteGain: 8, fiveMinuteGain: 20, oneMinuteVolume: 10000, fiveMinuteVolume: 50000,
      oneMinuteDollarVolume: 24000, volumeAcceleration: 2, fiveMinuteVolumeSpike: 3 }, reasons: [], news: [],
    momentumSignals: ["volume_ignition","price_burst"] };
  return { ...model(post===undefined?"regular":"after_hours"), momentum: { rows: [row], focus: [], total: 1 } };
}
describe("Momentum context rendering", () => {
  it("shows an active halt beside matching tickers and removes it whenever the next scanner response has no current halt list", async () => {
    const initial=momentumModel(42),halt={id:"halt-1",ticker:"TEST",market:"NASDAQ",haltTimeEt:"16:01:00",reasonCode:"LUDP",reason:"Volatility trading pause",quoteTimeEt:"16:06:00",tradeTimeEt:null};
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum,activeHalts:[halt]});
    expect(page.container.querySelectorAll('[data-halt-indicator="TEST"]')).toHaveLength(2);
    expect(page.container.querySelector('[aria-label*="TEST halted: LUDP"]')).not.toBeNull();
    await page.update({...initial,gainers:initial.momentum,dayGainers:initial.momentum});
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
  it("opens scanner news through the workspace article endpoint instead of an external link", async () => {
    const initial=momentumModel(42),row={...initial.momentum!.rows[0]!,news:[{id:"article-1",headline:"Synthetic filing",createdAt:"2026-11-02T21:00:00Z",url:"https://example.com/external",typeLabel:"SEC filing"}]};
    const page=await mount({...initial,momentum:{rows:[row],focus:[],total:1}});
    const news=page.container.querySelector('[aria-label="Open SEC filing: Synthetic filing"]') as HTMLElement;
    expect(news.tagName).toBe("BUTTON");expect(news.getAttribute("href")).toBeNull();
    await act(async()=>news.click());
    expect(page.fetch).toHaveBeenCalledWith("/api/platform/news/workspace-scanner?articleId=article-1",expect.objectContaining({cache:"no-store"}));
  });
  it("renders distinct Day/Post columns and keeps one/five-minute changes and volumes intact", async () => {
    const page = await mount(momentumModel((2.4/1.69-1)*100));
    const drawer = await openFullView(page.container);
    const header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells.slice(4,11)).toEqual(["-24%","42%","8%","20%","10K","50K","2×"]);
    expect(header.querySelectorAll("th").length).toBe(14);
    await act(async () => (drawer.querySelector('[aria-label="Close full scanner view"]') as HTMLElement).click());
    const compact = page.container.querySelector('table[aria-label="Momentum compact stocks"]')!;
    const compactRow = compact.querySelector("tbody tr") as HTMLElement;
    await act(async () => compactRow.click());
    expect(compact.textContent).toContain("Day %");
    expect(compact.textContent).toContain("Post %");
    expect(compact.textContent).toContain("-24%");
    expect(compact.textContent).toContain("42%");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
  it("omits Post outside after-hours, adds it on the next publication and does not replace unknown values with zero", async () => {
    const page = await mount(momentumModel(undefined));
    const drawer = await openFullView(page.container);
    let header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).not.toContain("Post %");
    expect(header.querySelectorAll("th").length).toBe(13);
    await page.update(momentumModel(null));
    header = [...drawer.querySelectorAll("thead tr")].find(row => row.textContent?.includes("Day %"))!;
    expect(header.textContent).toContain("Post %");
    const table = header.closest("table")!;
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map(cell => cell.textContent);
    expect(cells[4]).toBe("-24%");
    expect(cells[5]).toBe("n/a");
    expect(cells[6]).toBe("8%");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
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
    expect(page.container.querySelectorAll('[data-scanner-workspace-card]').length).toBe(5);
    expect([...page.container.querySelectorAll('[data-scanner-workspace-slot]')].map(card=>card.getAttribute("data-scanner-workspace-slot"))).toEqual(["slot-1","slot-2","slot-3","slot-4","slot-5"]);
    expect(DEFAULT_SCANNER_WORKSPACE_LAYOUT.assignments["ticker-workspace"]).toBe("slot-6");
    expect(page.container.querySelector('[aria-label="Live screener"]')).toBeNull();
    expect(page.container.querySelector('[data-gainer-title]')?.textContent).toBe("Top Gainers");
    expect([...page.container.querySelectorAll('[data-scanner-workspace-card="momentum"] h2')].some(heading=>heading.textContent==="Momentum")).toBe(true);
  });
  it("keeps a single PR instance and exposes every compact column with keyboard details", async () => {
    const initial = momentumModel(42);
    const scannerRows = {...initial.momentum!,rows:[{...initial.momentum!.rows[0]!,news:[{id:"article-1",headline:"Synthetic release",createdAt:"2026-11-02T21:00:00Z",url:"https://example.com/release",typeLabel:"Press release"}]}]};
    const page = await mount({...initial, gainers: scannerRows, dayGainers: scannerRows, momentum: scannerRows});
    expect(page.container.querySelectorAll('[data-pr-instance]').length).toBe(1);
    expect(page.container.querySelectorAll('[data-scanner-workspace-card]').length).toBe(5);
    for (const [label,columnCount] of [["Top Gainers",10],["Momentum",12]] as const) {
      const table = page.container.querySelector(`table[aria-label="${label} compact stocks"]`)!;
      expect(table.querySelectorAll('thead th').length).toBe(columnCount);
      expect(table.querySelector('thead')?.textContent).not.toContain('$ × Vol');
      if(label==='Top Gainers'){expect(table.querySelector('thead th:last-child')?.textContent).toBe('Country');expect(table.querySelector('tbody tr td:last-child [aria-label="Canada flag"]')).not.toBeNull();}
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
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
  it("opens full data without another request, polls it from the same model and closes with Escape", async () => {
    const initial = momentumModel(42);
    const page = await mount(initial);
    const drawer = await openFullView(page.container);
    expect(drawer.textContent).toContain('$2.4');
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
    const next = {...initial, momentum:{...initial.momentum,rows:initial.momentum.rows.map(row=>({...row,price:2.5}))}};
    await page.update(next);
    expect(drawer.textContent).toContain('$2.5');
    expect(page.container.querySelector('table[aria-label="Momentum compact stocks"]')!.textContent).toContain('$2.5');
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
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
    expect(cards.every(card => card.textContent?.includes("Active 4:00am - 8:00pm est"))).toBe(true);
    expect(page.container.textContent).not.toContain("extended-hours scanning session is closed");
    await page.update({ ...model("regular"), session: "premarket", status: "warming" });
    expect(page.container.textContent).not.toContain("Active 4:00am - 8:00pm est");
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
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

describe("alternative stock card view", () => {
  it("switches each scanner independently without new requests and retains all displayed metrics", async () => {
    const initial=momentumModel(undefined);
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum});
    const switchView=async(label:string,view:string)=>{
      const group=page.container.querySelector(`[aria-label="${label} view"]`)!;
      const button=[...group.querySelectorAll('button')].find(button=>button.textContent===view)!;
      await act(async()=>button.click());
    };
    await switchView("Top Gainers","Cards");
    const cards=page.container.querySelector('[aria-label="Top Gainers stock cards"]')!;
    expect(cards).not.toBeNull();
    expect(cards.querySelector('[aria-label="Canada flag"]')).not.toBeNull();
    expect([...cards.querySelectorAll('dt')].map(label=>label.textContent)).toEqual(['Price','Gain %','Vol','Float','T/O','RVOL','HOD']);
    expect(page.container.querySelector('table[aria-label="Momentum compact stocks"]')).not.toBeNull();
    await switchView("Momentum","Cards");
    const momentum=page.container.querySelector('[aria-label="Momentum stock cards"]')!;
    expect([...momentum.querySelectorAll('dt')].map(label=>label.textContent)).toEqual(['Price','Day %','Float','Spread','1min %','5min %','1min Vol','5min Vol','1min ↑','5min ↑']);
    const expand=momentum.querySelector('[aria-label="Expand TEST card details"]') as HTMLElement;
    await act(async()=>expand.click());
    expect(momentum.textContent).toContain('HOD price');
    await switchView("Top Gainers","Table");
    expect(page.container.querySelector('table[aria-label="Top Gainers compact stocks"]')).not.toBeNull();
    expect(page.container.querySelector('[aria-label="Momentum stock cards"]')).not.toBeNull();
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
});

describe("two-row table view", () => {
  it("keeps ticker in the first row and second-row controls under the Price column", async () => {
    const initial=momentumModel(undefined);
    const page=await mount({...initial,gainers:initial.momentum,dayGainers:initial.momentum});
    for(const label of ['Top Gainers','Momentum']) {
      const group=page.container.querySelector(`[aria-label="${label} view"]`)!;
      const choice=[...group.querySelectorAll('button')].find(button=>button.textContent==='Two rows')!;
      await act(async()=>choice.click());
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
    expect(page.stream).toHaveBeenCalledTimes(1);expectOnlyInitialLayoutRequest(page.fetch);
  });
});

 describe("multi-chart ticker workspace",()=>{
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
    expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);expect(document.body.textContent).toContain('Four charts are open');
    await act(async()=>{([...aside().querySelectorAll('[role=tab]')].find(el=>el.textContent==='AAA') as HTMLElement).click();});
    expect(document.querySelector('[data-workspace-chart="AAA"]')?.getAttribute('data-selected')).toBe('true');
    const panel=[...aside().querySelectorAll('[role=tabpanel]')].find(el=>!(el as HTMLElement).hidden)!;
    expect(aside().querySelector('[data-levels-action-slot]')?.textContent).toContain('Generate Levels');expect(panel.textContent).toContain('Recent News');
    await act(async()=>{(document.querySelector('[aria-label="Close BBB chart"]') as HTMLElement).click();});
    await act(async()=>tab().click());
    await act(async()=>{(aside().querySelector('[aria-label="Add DDD chart"]') as HTMLElement).click();});
    expect(document.querySelector('[data-workspace-chart="DDD"]')).not.toBeNull();expect(document.querySelectorAll('[data-workspace-chart]').length).toBe(4);
    expect(page.savedLayout().groups.map(group => group.symbol)).toEqual(["TEST", "AAA", "CCC", "DDD"]);
    expect(page.fetch.mock.calls.map(([path]) => path).every(path => path === SCANNER_LAYOUT)).toBe(true);
    expect(page.stream).toHaveBeenCalledTimes(1);
    await act(async()=>{(document.querySelector('[aria-label="Close chart"]') as HTMLElement).click();});
    expect(document.querySelector('[data-workspace-chart]')).toBeNull();
  });
 });

it("closes the pushed model stream while hidden, resumes once and cleans up on unmount",async()=>{
 const page=await mount(model("regular"));
 try{
  Object.defineProperty(document,"hidden",{configurable:true,value:true});
  await act(async()=>document.dispatchEvent(new Event("visibilitychange")));
  expect(page.connections[0].closed).toBe(true);expect(page.stream).toHaveBeenCalledTimes(1);
  Object.defineProperty(document,"hidden",{configurable:true,value:false});
  await act(async()=>document.dispatchEvent(new Event("visibilitychange")));
  expect(page.stream).toHaveBeenCalledTimes(2);expect(page.connections[1].closed).toBe(false);expectOnlyInitialLayoutRequest(page.fetch);
  await act(async()=>root!.unmount());root=undefined;expect(page.connections[1].closed).toBe(true);
 }finally{delete (document as unknown as {hidden?:boolean}).hidden;}
});
