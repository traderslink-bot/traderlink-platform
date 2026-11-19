// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTraderMaterialTheme } from "@/app/mui-theme";
import type { LiveScannerRow, ScannerReadModel } from "./contracts";
import { DEFAULT_CHART_PREFERENCES } from "../alpaca/chart-preferences";
import { EMPTY_MULTIVIEW } from "../alpaca/chart-multiview";
import { defaultMobileLayouts, readMobileLayouts } from "@/app/(dashboard)/screeners/workspace/scanner-mobile-layout";
import { defaultTile } from "@/app/(dashboard)/screeners/workspace/scanner-split-layout";
import { tileToCards } from "@/app/(dashboard)/screeners/workspace/scanner-free-layout";

vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ children, title, action, hideHeader }: { children: ReactNode; title?: ReactNode; action?: ReactNode; hideHeader?: boolean }) =>
    <section>{!hideHeader && <header>{title}{action}</header>}{children}</section>,
  DashboardPrimaryAction: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({ MarketChart: () => <div data-chart-fixture /> }));
vi.mock("@/app/(dashboard)/screeners/screener-press-release-board", () => ({
  useMarketEventsData: () => ({}), ScreenerPressReleaseBoard: () => <div data-news-fixture />,
}));
import { LiveScreenersClient } from "@/app/(dashboard)/screeners/workspace/live-screeners-client";

const desktopKey = "traderslink.scanner.desktop-layout.v3";
const mobileKey = "traderslink.workspace.mobile.v1:gainer-card-test";
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
const day: LiveScannerRow = { ...base, symbol: "DAY", sessionGain: 120, comparisonPrice: 1, gainBasis: "previous_regular_close" };
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
    if (String(input) === "/api/charts/preferences") return Response.json({ ownerKey: "gainer-card-test", revision: 1, preferences: DEFAULT_CHART_PREFERENCES });
    if (String(input) === "/api/charts/layout?workspace=scanner") return Response.json({ ownerKey: "gainer-card-test", revision: 1, layout: EMPTY_MULTIVIEW });
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
async function mount(initial = model, dark = false) {
  container = document.createElement("div"); document.body.append(container);
  const toolbar = document.createElement("div"); toolbar.id = "dashboard-scanner-toolbar"; document.body.append(toolbar);
  root = createRoot(container);
  await act(async () => { root!.render(<ThemeProvider theme={createTraderMaterialTheme(dark ? "dark" : "light")}><LiveScreenersClient sample={initial}/></ThemeProvider>); });
  await act(async () => { await vi.advanceTimersByTimeAsync(100); });
}
const card = (slot: string) => container.querySelector(`[data-scanner-workspace-card="${slot}"]`)!;
async function click(element: Element | null) { expect(element).not.toBeNull(); await act(async () => { (element as HTMLElement).click(); await vi.advanceTimersByTimeAsync(50); }); }
async function select(slot: string, kind: string) {
  const field = card(slot).querySelector("select") as HTMLSelectElement;
  await act(async () => { field.value = kind; field.dispatchEvent(new Event("change", { bubbles: true })); await vi.advanceTimersByTimeAsync(50); });
}
async function options(slot: string) {
  await click(card(slot).querySelector('[aria-haspopup="dialog"]'));
  return document.querySelector('[role="dialog"][aria-label$="view settings"]')!;
}
const switchInput = () => document.querySelector('[role="dialog"][aria-label$="view settings"] input[type="checkbox"]');

describe("actual Trading Workspace gainer-card choices", () => {
  it.each([false, true])("shows both independent rankings and restores per-card formats, dark=%s", async dark => {
    seed(); await mount(model, dark);
    expect(card("gainers").textContent).toContain("DAY"); expect(card("gainers").textContent).not.toContain("POST");
    expect(card("momentum").textContent).toContain("POST"); expect(card("momentum").textContent).not.toContain("DAY");
    expect(card("gainers").textContent).toContain("120%"); expect(card("momentum").textContent).toContain("10%");
    expect(card("gainers").querySelector('select')?.textContent).toContain("Top Gainers (Pre/Reg + Post)");
    expect(card("gainers").querySelector('[aria-label$="view: Table"]')).not.toBeNull();
    expect(card("momentum").querySelector('[aria-label$="view: Two rows"]')).not.toBeNull();
    await select("momentum", "gainers");
    expect(JSON.parse(localStorage.getItem(desktopKey)!).layouts[0].scanners).toMatchObject({ gainers: "day-gainers", momentum: "gainers" });
    expect(card("gainers").textContent).toContain("DAY");
  });
  it("saves each combined card's switch immediately and restores it after remount", async () => {
    seed({ gainers: "gainers", momentum: "gainers" }); await mount();
    expect(card("gainers").textContent).toContain("POST");
    await options("gainers"); expect((switchInput() as HTMLInputElement).checked).toBe(true);
    await click(switchInput());
    expect(card("gainers").textContent).toContain("DAY"); expect(card("momentum").textContent).toContain("POST");
    expect(JSON.parse(localStorage.getItem(desktopKey)!).layouts[0].gainerAutoSwitch).toEqual({ gainers: false });
    await act(async () => root!.unmount()); root = undefined; document.body.replaceChildren(); await mount();
    expect(card("gainers").textContent).toContain("DAY"); expect(card("momentum").textContent).toContain("POST");
  });
  it("keeps new fixed choices out of the default layout and explains a post-market view before it opens", async () => {
    await mount({ ...model, session: "regular", updatedAtUtc: "2026-11-19T20:30:00Z" });
    expect(Array.from(container.querySelectorAll("select")).filter(el => el.value === "day-gainers" || el.value === "post-market-gainers")).toHaveLength(0);
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
    const name = document.querySelector('[role="region"][aria-label="Layout settings"] input[type="text"]') as HTMLInputElement;
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
    expect(Array.from(container.querySelectorAll("select")).filter(el => el.value === "day-gainers" || el.value === "post-market-gainers")).toHaveLength(0);
    expect(container.querySelectorAll('[data-scanner-workspace-card]')).toHaveLength(7);
    await click(Array.from(document.querySelectorAll("button[data-layout-editor-action]")).find(node => node.textContent === "Cancel") ?? null);
    expect(localStorage.getItem(desktopKey)).toBe(before);
  });
  it("keeps portrait and landscape scanner choices and switch preferences separate on rotation", async () => {
    width = 390; height = 844;
    const layouts = defaultMobileLayouts();
    layouts.portrait.layouts[0].layout.scanners = { gainers: "gainers", momentum: "post-market-gainers" };
    layouts.landscape.layouts[0].layout.scanners = { gainers: "post-market-gainers", momentum: "day-gainers" };
    localStorage.setItem(mobileKey, JSON.stringify(layouts)); await mount();
    expect(card("gainers").textContent).toContain("POST");
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
