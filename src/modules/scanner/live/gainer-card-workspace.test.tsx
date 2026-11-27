// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTraderMaterialTheme } from "@/app/mui-theme";
import { SAVED_SCAN_STREAM_PATH } from "../custom/definition";
import { DEFAULT_DECLINE_CONTROLS } from "./declines";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "./premarket-pullbacks";
import type { LiveScannerRow, ScannerReadModel } from "./contracts";
import { DEFAULT_CHART_PREFERENCES } from "../alpaca/chart-preferences";
import { EMPTY_MULTIVIEW, reconcileChartTickers, singleChart } from "../alpaca/chart-multiview";
import { workspaceChartKey } from "@/app/(dashboard)/screeners/workspace/use-workspace-chart-layout";
import { defaultMobileLayouts, readMobileLayouts } from "@/app/(dashboard)/screeners/workspace/scanner-mobile-layout";
import { defaultTile } from "@/app/(dashboard)/screeners/workspace/scanner-split-layout";
import { tileToCards } from "@/app/(dashboard)/screeners/workspace/scanner-free-layout";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ children, title, action, hideHeader }: { children: ReactNode; title?: ReactNode; action?: ReactNode; hideHeader?: boolean }) =>
    <section>{!hideHeader && <header>{title}{action}</header>}{children}</section>,
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({
  MarketChart: ({ actions, closeAction }: { actions?: ReactNode; closeAction?: ReactNode }) =>
    <div data-chart-fixture>{actions}{closeAction}</div>,
}));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({
  useMarketEventsData: () => ({}), ScreenerPressReleaseBoard: () => <div data-news-fixture />,
}));
import { LiveScreenersClient } from "@/app/(dashboard)/screeners/workspace/live-screeners-client";

const ownerKey = "gainer-card-test";
const desktopKey = `traderslink.scanner.desktop-layout.v4:${ownerKey}`;
const mobileKey = `traderslink.workspace.mobile.v1:${ownerKey}`;
const now = "2026-11-19T21:30:00Z";
const empty = { rows: [], total: 0, focus: [] };
const base = {
  exchange: "NASDAQ", company: "Synthetic fixture", price: 2.2, volume: 100_000, dollarVolume: 220_000,
  marketCap: 10_000_000, marketCapAtCollection: 10_000_000, float: 1_000_000, relativeVolume: 2,
  dayHigh: 2.3, dayLow: 1, offHighPercent: -4, floatRetrievedAtUtc: now, spreadPercent: null,
  providerAtUtc: now, receivedAtUtc: now, country: "US", reasons: [], news: [],
  activity: { oneMinuteGain: null, fiveMinuteGain: null, oneMinuteVolume: null, oneMinuteDollarVolume: null,
    fiveMinuteVolume: null, fiveMinuteVolumeSpike: null, volumeAcceleration: null },
} as const;
const day: LiveScannerRow = { ...base, symbol: "DAY", dayVolume: 125_000, sessionGain: 120, comparisonPrice: 1, gainBasis: "previous_regular_close" };
const post: LiveScannerRow = { ...base, symbol: "POST", sessionGain: 10, comparisonPrice: 2, gainBasis: "today_regular_close" };
const model: ScannerReadModel = { status: "ready", session: "after_hours", tradingDate: "2026-11-19", updatedAtUtc: now,
  universeCount: 2, receivedCount: 2, missingSymbols: [], missingFloatCount: 0, issues: [],
  dayGainers: { rows: [day], total: 1, focus: [] }, gainers: { rows: [post], total: 1, focus: [] }, momentum: empty };
let root: Root | undefined;
let container: HTMLDivElement;
let width = 1280, height = 800;
const media = new Set<() => void>();
beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers(); vi.setSystemTime(new Date(now)); localStorage.clear(); width = 1280; height = 800; media.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, get: () => width });
  Object.defineProperty(window, "innerHeight", { configurable: true, get: () => height });
  vi.stubGlobal("matchMedia", (query: string) => ({ media: query,
    get matches() { return query.includes("orientation:landscape") ? width > height : query.includes("max-width") ? width < 900 : false; },
    addListener: (fn: () => void) => media.add(fn), removeListener: (fn: () => void) => media.delete(fn),
    addEventListener: (_: string, fn: () => void) => media.add(fn), removeEventListener: (_: string, fn: () => void) => media.delete(fn),
  }));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/charts/preferences") return Response.json({ ownerKey, revision: 1, preferences: DEFAULT_CHART_PREFERENCES });
    if (String(input) === "/api/charts/layout?workspace=scanner") return Response.json({ ownerKey, revision: 1, layout: EMPTY_MULTIVIEW });
    if (String(input) === SAVED_SCAN_STREAM_PATH) return Response.json({ revision: 1, scans: [] });
    throw Error("Unexpected request: " + String(input));
  }));
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount()); root = undefined;
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.replaceChildren();
});
function seed(scanners = { gainers: "day-gainers", momentum: "post-market-gainers" } as Record<string, string>) {
  localStorage.setItem(desktopKey, JSON.stringify({ active: "Custom", layouts: [{ name: "Custom", rectangles: tileToCards(defaultTile), scanners,
    views: { gainers: "table", momentum: "two-rows" } }] }));
}
async function mount(initial = model, dark = false, broker = false) {
  container = document.createElement("div"); document.body.append(container);
  const toolbar = document.createElement("div"); toolbar.id = "dashboard-scanner-toolbar"; document.body.append(toolbar);
  root = createRoot(container);
  await act(async () => { root!.render(<ThemeProvider theme={createTraderMaterialTheme(dark ? "dark" : "light")}><LiveScreenersClient sample={initial} broker={broker}/></ThemeProvider>); });
  await act(async () => { await vi.advanceTimersByTimeAsync(100); });
}
const card = (slot: string) => container.querySelector(`[data-scanner-workspace-card="${slot}"]`)!;
async function click(element: Element | null) { expect(element).not.toBeNull(); await act(async () => { (element as HTMLElement).click(); await vi.advanceTimersByTimeAsync(50); }); }
const scannerPicker = (slot: string) => card(slot).querySelector<HTMLElement>('[role="combobox"]')!;
async function openScannerMenu(slot: string) {
  const picker = scannerPicker(slot);
  await act(async () => {
    picker.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    await vi.advanceTimersByTimeAsync(100);
  });
  const menu = document.getElementById(picker.getAttribute("aria-controls")!);
  expect(menu?.getAttribute("role")).toBe("listbox");
  return menu!;
}
async function closeScannerMenu(menu: HTMLElement) {
  await act(async () => {
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.advanceTimersByTimeAsync(150);
  });
}
async function select(slot: string, kind: string) {
  const menu = await openScannerMenu(slot);
  await click(menu.querySelector(`[role="option"][data-value="${kind}"]`));
}
async function expectDefaultGainerSelection() {
  const menu = await openScannerMenu("gainers");
  expect(menu.querySelector('[role="option"][aria-selected="true"]')?.getAttribute("data-value")).toBe("live:gainers");
  await closeScannerMenu(menu);
}
async function options(slot: string) {
  await click(card(slot).querySelector('[aria-haspopup="dialog"]'));
  return document.querySelector('[role="dialog"][aria-label$="view settings"]')!;
}
const switchInput = () => document.querySelector('[role="dialog"][aria-label$="view settings"] input[type="checkbox"]');

describe("actual Trading Workspace gainer-card choices", () => {
  it("opens chart arrangement from the Workspace toolbar and saves the new order", async () => {
    seed();
    const key = "traderslink.workspace.charts.v1:gainer-card-test";
    const layout = reconcileChartTickers(singleChart("LVWR", "5m"), ["LVWR", "AKAN", "BENF", "APUS"], "5m");
    localStorage.setItem(key, JSON.stringify(layout));
    await mount();
    const toolbar = document.getElementById("dashboard-scanner-toolbar")!;
    const launcher = toolbar.querySelector('button[aria-label="Multiview"]');
    expect(launcher?.getAttribute("title")).toBe("Multiview active");
    expect(card("ticker-workspace").querySelector('[aria-label="Multiview"]')).toBeNull();
    await click(launcher);
    const dialog = document.querySelector('[role="dialog"]')!;
    await click([...dialog.querySelectorAll("button")].find(button => button.textContent === "Arrange charts") ?? null);
    const chart = card("ticker-workspace");
    await click(chart.querySelector('[aria-label="Move LVWR 5m chart"]'));
    await click(chart.querySelector('[aria-label="Move APUS 5m chart"]'));
    await click([...chart.querySelectorAll("button")].find(button => button.textContent === "Done") ?? null);
    const ids = layout.groups.map(group => group.panels[0].id);
    expect(JSON.parse(localStorage.getItem(key)!).arrangement.order).toEqual([ids[3], ids[1], ids[2], ids[0]]);
    expect(toolbar.querySelector('button[aria-label="Multiview"]')).toBe(launcher);
  });

  it("keeps turnover tied to day volume on pinned views and after-hours volume on switched views", async () => {
    seed({gainers:"gainers",momentum:"post-market-gainers"});
    const dayRow = {...day,dayVolume:400_000,premarketVolume:150_000,regularVolume:250_000,postMarketVolume:30_000};
    const postRow = {...post,dayVolume:400_000,postMarketVolume:25_000};
    await mount({...model,dayGainers:{...model.dayGainers!,rows:[dayRow]},gainers:{...model.gainers,rows:[postRow]}});
    const tableTurnover = (slot: string, volume: string) => {
      const table = card(slot).querySelector("table")!;
      const headers = [...table.querySelectorAll("th")];
      expect(headers.some(header=>header.textContent===volume)).toBe(true);
      const column = headers.findIndex(header=>header.textContent==="T/O");
      return table.querySelector<HTMLTableRowElement>("tbody tr")!.cells[column].textContent;
    };
    expect(tableTurnover("gainers","After-hours Vol")).toBe("3%");
    expect(tableTurnover("momentum","After-hours Vol")).toBe("3%");
    await options("gainers");
    await click(switchInput());
    expect(tableTurnover("gainers","Vol")).toBe("40%");
    const viewMenu = document.querySelector('[role="dialog"][aria-label$="view settings"]')!;
    await click([...viewMenu.querySelectorAll("button")].find(button=>button.textContent==="Cards")??null);
    const turnover = [...card("gainers").querySelectorAll("dt")].find(label=>label.textContent==="T/O");
    expect(turnover?.nextElementSibling?.textContent).toBe("40%");
  });

  it.each([false, true])("shows both independent rankings and restores per-card formats, dark=%s", async dark => {
    seed(); await mount(model, dark);
    expect(card("gainers").textContent).toContain("DAY"); expect(card("gainers").textContent).not.toContain("POST");
    expect(card("momentum").textContent).toContain("POST"); expect(card("momentum").textContent).not.toContain("DAY");
    expect(card("gainers").textContent).toContain("120%"); expect(card("momentum").textContent).toContain("10%");
    const headers = [...card("gainers").querySelectorAll("thead th")];
    const volumeIndex = headers.findIndex(cell => cell.textContent === "Vol");
    expect(volumeIndex).toBeGreaterThan(-1);
    expect(headers[volumeIndex].classList.contains("MuiTableCell-alignLeft")).toBe(true);
    const volume = card("gainers").querySelectorAll("tbody tr:first-child td")[volumeIndex];
    expect(volume.textContent).toBe("125K");
    expect(volume.classList.contains("MuiTableCell-alignLeft")).toBe(true);
    expect(card("momentum").querySelector("thead")?.textContent).toContain("After-hours Vol");
    const menu = await openScannerMenu("gainers");
    expect(menu.querySelector('[role="option"][data-value="live:gainers"]')?.textContent).toBe("Top Gainers");
    expect(menu.querySelector('[role="option"][aria-selected="true"]')?.textContent).toBe("Top Gainers (pre/reg)");
    await closeScannerMenu(menu);
    expect(card("gainers").querySelector('[aria-label$="view: Table"]')).not.toBeNull();
    expect(card("momentum").querySelector('[aria-label$="view: Two rows"]')).not.toBeNull();
    await select("momentum", "live:gainers");
    expect(JSON.parse(localStorage.getItem(desktopKey)!).layouts[0].scanners).toMatchObject({ gainers: "day-gainers", momentum: "live:gainers" });
    expect(card("gainers").textContent).toContain("DAY");
  });
  it("saves each combined card's switch immediately and restores it after remount", async () => {
    seed({ gainers: "gainers", momentum: "gainers" }); await mount();
    expect(card("gainers").textContent).toContain("POST");
    expect(scannerPicker("gainers").textContent).toBe("Top Gainers (post)");
    await expectDefaultGainerSelection();
    await options("gainers"); expect((switchInput() as HTMLInputElement).checked).toBe(true);
    await click(switchInput());
    expect(card("gainers").textContent).toContain("DAY"); expect(card("momentum").textContent).toContain("POST");
    expect(scannerPicker("gainers").textContent).toBe("Top Gainers (pre/reg)");
    expect(JSON.parse(localStorage.getItem(desktopKey)!).layouts[0].gainerAutoSwitch).toEqual({ gainers: false });
    await act(async () => root!.unmount()); root = undefined; document.body.replaceChildren(); await mount();
    expect(card("gainers").textContent).toContain("DAY"); expect(card("momentum").textContent).toContain("POST");
  });
  it("keeps new fixed choices out of the default layout and explains a post-market view before it opens", async () => {
    await mount({ ...model, session: "regular", updatedAtUtc: "2026-11-19T20:30:00Z" });
    await expectDefaultGainerSelection();
    expect(scannerPicker("momentum").textContent).toBe("Momentum");
    await select("momentum", "post-market-gainers");
    expect(card("momentum").textContent).toContain("Post-market gainers begin after the regular session closes.");
    expect(card("momentum").textContent).not.toContain("POST");
  });
  it("keeps edit-mode switch changes in draft and restores them on Cancel", async () => {
    seed({ gainers: "gainers", momentum: "gainers" }); await mount();
    const before = localStorage.getItem(desktopKey);
    await click(document.querySelector('[aria-label="Edit layout"]'));
    await click(document.querySelector('[aria-label="Close layout settings"]'));
    await options("gainers"); await click(switchInput());
    expect(card("gainers").textContent).toContain("DAY"); expect(localStorage.getItem(desktopKey)).toBe(before);
    await click(document.querySelector('[aria-label="Close view settings"]'));
    await click(Array.from(document.querySelectorAll("button[data-layout-editor-action]")).find(node => node.textContent === "Cancel") ?? null);
    expect(card("gainers").textContent).toContain("POST"); expect(localStorage.getItem(desktopKey)).toBe(before);
  });
  it("saves a named layout with its switch preference without changing the previous named layout", async () => {
    seed({ gainers: "gainers", momentum: "gainers" }); await mount();
    await click(document.querySelector('[aria-label="Edit layout"]'));
    await click(document.querySelector('[aria-label="Close layout settings"]'));
    await options("gainers"); await click(switchInput());
    await click(document.querySelector('[aria-label="Close view settings"]'));
    await click(document.querySelector('[aria-label="Layout settings"]'));
    const panel = document.querySelector('[role="region"][aria-label="Layout settings"]')!;
    const label = Array.from(panel.querySelectorAll("label")).find(element => element.textContent === "Layout name")!;
    const name = label.control as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(name, "Evening");
      name.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(Array.from(document.querySelectorAll("button[data-layout-editor-action]")).find(node => node.textContent === "Save") ?? null);
    const stored = JSON.parse(localStorage.getItem(desktopKey)!);
    expect(stored.active).toBe("Evening");
    expect(stored.layouts.find((entry: { name: string }) => entry.name === "Evening").gainerAutoSwitch).toEqual({ gainers: false });
    expect(stored.layouts.find((entry: { name: string }) => entry.name === "Custom").gainerAutoSwitch?.gainers).toBeUndefined();
    expect(card("gainers").textContent).toContain("DAY");
  });
  it("undoes the preference and resets the draft without altering the saved layout", async () => {
    seed({ gainers: "gainers", momentum: "gainers" }); await mount();
    const before = localStorage.getItem(desktopKey);
    await click(document.querySelector('[aria-label="Edit layout"]'));
    await click(document.querySelector('[aria-label="Close layout settings"]'));
    await options("gainers"); await click(switchInput());
    await click(document.querySelector('[aria-label="Close view settings"]'));
    expect(card("gainers").textContent).toContain("DAY");
    await click(document.querySelector('[aria-label="Layout settings"]'));
    await click(Array.from(document.querySelectorAll("button")).find(node => node.textContent === "Undo") ?? null);
    expect(card("gainers").textContent).toContain("POST");
    await click(Array.from(document.querySelectorAll("button")).find(node => node.textContent === "Reset to default") ?? null);
    await expectDefaultGainerSelection();
    expect(scannerPicker("momentum").textContent).toBe("Momentum");
    expect(container.querySelectorAll('[data-scanner-workspace-card]')).toHaveLength(7);
    await click(Array.from(document.querySelectorAll("button[data-layout-editor-action]")).find(node => node.textContent === "Cancel") ?? null);
    expect(localStorage.getItem(desktopKey)).toBe(before);
  });
  it("keeps portrait and landscape scanner choices and switch preferences separate on rotation", async () => {
    width = 390; height = 844;
    const layouts = defaultMobileLayouts();
    layouts.portrait.layouts[0].layout.scanners = { gainers: "live:gainers", momentum: "post-market-gainers" };
    layouts.landscape.layouts[0].layout.scanners = { gainers: "post-market-gainers", momentum: "day-gainers" };
    localStorage.setItem(mobileKey, JSON.stringify(layouts)); await mount();
    expect(card("gainers").textContent).toContain("POST");
    expect(scannerPicker("gainers").textContent).toBe("Top Gainers (post)");
    await expectDefaultGainerSelection();
    await options("gainers"); await click(switchInput());
    await click(document.querySelector('[aria-label="Close view settings"]'));
    expect(card("gainers").textContent).toContain("DAY");
    await act(async () => { width = 844; height = 390; media.forEach(fn => fn()); window.dispatchEvent(new Event("resize")); await vi.advanceTimersByTimeAsync(100); });
    expect(card("gainers").textContent).toContain("POST");
    const restored = readMobileLayouts(JSON.parse(localStorage.getItem(mobileKey)!));
    expect(restored.portrait.layouts[0].layout.gainerAutoSwitch).toEqual({ gainers: false });
    expect(restored.landscape.layouts[0].layout.gainerAutoSwitch).toBeUndefined();
  });
});

const spacingSlots = ["gainers", "top-losers", "high-drops", "momentum", "breakouts"] as const;

async function mountSpacingFixture(view: "table" | "cards", saved = false) {
  const scanId = "abcde000-1234-5678-9abc-abcde0000000";
  if (saved) {
    const normalRead = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((input, options) => {
      if (String(input) !== SAVED_SCAN_STREAM_PATH) return normalRead(input, options);
      const frame = { revision: 1, scans: [{ id: scanId, name: "Saved fixture" }], results: {
        [scanId]: { state: "ready", result: { status: "open", total: 1, eligible: 1, incomplete: 0,
          updatedAt: Date.parse(now), rows: [{ ...day, dayChange: 4, belowHigh: null, sortValue: 10, matches: [] }] } },
      } };
      return Promise.resolve(new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(frame) + "\n"));
          options?.signal?.addEventListener("abort", () => controller.close(), { once: true });
        },
      })));
    });
  }
  localStorage.setItem(desktopKey, JSON.stringify({ active: "Spacing", layouts: [{
    name: "Spacing", rectangles: tileToCards(defaultTile),
    views: Object.fromEntries(spacingSlots.map(slot => [slot, view])),
    ...(saved ? { savedScanIds: { breakouts: scanId } } : {}),
  }] }));
  await mount({
    ...model,
    session: "regular",
    gainers: { rows: [day], total: 1, focus: [] },
    momentum: { rows: [day], total: 1, focus: [], momentumSections: {
      confirmed: [day], early: [], confirmedTotal: 1, earlyTotal: 0,
    } },
    declines: { rapid: [], rapidTotal: 0, loserTotal: 1, controls: DEFAULT_DECLINE_CONTROLS,
      losers: [{ ...day, changePercent: -4, comparisonPrice: 2.3 }] },
    premarketPullbacks: { total: 1, missingReferenceCount: 0, controls: DEFAULT_PREMARKET_PULLBACK_CONTROLS,
      rows: [{ ...day, changePercent: -4, referenceSession: "regular", referenceHigh: 2.3,
        premarketHigh: null, regularHigh: 2.3, postMarketHigh: null, premarketVolume: null,
        sessionVolume: 100_000, belowHighPercent: 4, backToHighPercent: 4.5,
        oneMinuteVolume: null, fiveMinuteVolume: null }] },
    breakouts: [{ ...day, breakoutLevel: 2.1, breakoutAtUtc: now, breakoutState: "above" }],
  });
}

it.each(["table","cards"] as const)("matches the Workspace scanner header in %s view and retains Confirmed", async view => {
  await mountSpacingFixture(view);
  const reference = card("gainers").querySelector("[data-workspace-scanner-header]");
  expect(reference).not.toBeNull();
  for (const slot of spacingSlots) {
    const panel = card(slot);
    expect(panel.querySelector("[data-workspace-scanner-header]")?.className).toBe(reference?.className);
    expect(panel.querySelector(view === "table" ? "thead" : "[data-scanner-stock-card]")).not.toBeNull();
  }
  expect(card("momentum").querySelector("[data-momentum-sections] h3")?.textContent).toContain("Confirmed");
});

it.each(["table","cards"] as const)("matches the Workspace saved-scan header in %s view", async view => {
  await mountSpacingFixture(view, true);
  const panel = card("breakouts");
  expect(panel.querySelector("[data-workspace-scanner-header]")?.className)
    .toBe(card("gainers").querySelector("[data-workspace-scanner-header]")?.className);
  expect(panel.textContent).toContain("Saved fixture");
  expect(panel.querySelector(view === "table" ? "thead" : "[data-scanner-stock-card]")).not.toBeNull();
});

const pageChartKey = workspaceChartKey(ownerKey);

function seedChartMultiview() {
  const layout = reconcileChartTickers(singleChart("LVWR", "5m"), ["LVWR", "AKAN", "BENF", "APUS"], "5m");
  localStorage.setItem(pageChartKey, JSON.stringify({ ...layout, selectedPanel: layout.groups[2].panels[0].id }));
  const bounds = new DOMRect(10, 10, 780, 650);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(bounds);
  vi.stubGlobal("ResizeObserver", class {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: bounds } as ResizeObserverEntry], this); }
    unobserve() {}
    disconnect() {}
  });
}

const currentWorkspaceCharts = () => JSON.parse(localStorage.getItem(pageChartKey)!);
const workspaceMultiviewButton = () => document.querySelector('#dashboard-scanner-toolbar button[aria-label="Multiview"]');
const dialogButton = (label: string) => [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === label) ?? null;
const regularWorkspace = { ...model, session: "regular" as const, gainers: model.dayGainers! };

it("puts the active Multiview button in the Workspace top nav and closes individual charts", async () => {
  seedChartMultiview();
  await mount(regularWorkspace);
  expect(workspaceMultiviewButton()?.getAttribute("aria-pressed")).toBe("true");
  expect(card("ticker-workspace").querySelector('[aria-label="Multiview"]')).toBeNull();
  expect(card("ticker-workspace").querySelectorAll('[data-workspace-chart-close]')).toHaveLength(4);
  const original = currentWorkspaceCharts();
  await click(card("ticker-workspace").querySelector('[aria-label="Close AKAN 5m chart"]'));
  expect(currentWorkspaceCharts().groups.map((group: {symbol: string}) => group.symbol)).toEqual(["LVWR", "BENF", "APUS"]);
  expect(currentWorkspaceCharts().selectedPanel).toBe(original.selectedPanel);

  await click(workspaceMultiviewButton());
  await click(dialogButton("Return to one chart"));
  expect(currentWorkspaceCharts().groups).toEqual([original.groups[2]]);
  expect(workspaceMultiviewButton()).toBeNull();
  expect(card("ticker-workspace").querySelector('[aria-label="Multiview"]')).not.toBeNull();
  expect(card("ticker-workspace").querySelector('[data-workspace-chart-close]')).toBeNull();
});

it("returns to the Workspace startup ticker on Apply when every ticker is removed", async () => {
  seedChartMultiview();
  await mount(regularWorkspace);
  await click(workspaceMultiviewButton());
  for (let count = 0; count < 4; count++) await click(dialogButton("Remove ticker"));
  await click(dialogButton("Apply"));
  expect(currentWorkspaceCharts().groups.map((group: {symbol: string}) => group.symbol)).toEqual(["DAY"]);
  expect(workspaceMultiviewButton()).toBeNull();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it("limits the connected Workspace chart card to the selected panel and suppresses Multiview", async () => {
  seedChartMultiview();
  const regularKey = workspaceChartKey(ownerKey);
  const connectedKey = workspaceChartKey(ownerKey, true);
  const layout = reconcileChartTickers(singleChart("LVWR", "5m"), ["LVWR", "AKAN"], "5m");
  const selected = layout.groups[1].panels[0].id;
  localStorage.setItem(regularKey, JSON.stringify(layout));
  localStorage.setItem(connectedKey, JSON.stringify({ ...layout, selectedPanel: selected }));

  await mount(regularWorkspace, false, true);

  const chart = card("ticker-workspace");
  const panels = [...chart.querySelectorAll("[data-workspace-chart-panel]")];
  expect(panels.map(panel => panel.getAttribute("data-workspace-chart-panel"))).toEqual([selected]);
  expect(chart.querySelector('[aria-label="Multiview"]')).toBeNull();
  expect(workspaceMultiviewButton()).toBeNull();
  expect(JSON.parse(localStorage.getItem(regularKey)!)).toEqual(layout);
});
