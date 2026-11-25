// @vitest-environment jsdom

import { ScreenerPressReleaseBoard, selectCompactArticles, useMarketEventsData } from "@/app/(dashboard)/screeners/workspace/screener-press-release-board";
import { ScannerPageTickerSelection } from "@/app/(dashboard)/screeners/workspace/scanner-page-ticker";
import type { ScannerChartTarget } from "@/app/(dashboard)/screeners/scanner-chart-workspace";
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
          articles: [], headlineStatus: "ready", compactArticles: [], dates: null, exchangeByTicker: {}, floatByTicker: {}, halts: null,
          setArticles: vi.fn(), setDates: vi.fn(),
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

function withHeadline(heading: string) {
  return Response.json({
    articles: [{ id: heading, ticker: "TEST", headline: heading, publishedAt: "2026-11-16T16:00:00Z", marketCap: null, isRead: false }],
    easternDate: "2026-11-16",
    compactArticleIds: [heading],
  });
}

async function withMarketEvents(
  replies: Array<() => Response | Promise<Response>>,
  check: (container: HTMLElement) => Promise<void>,
  actions?: { select: (symbol: string) => void; openDetails: (symbol: string) => void; openChart: (row: ScannerChartTarget) => void },
) {
  vi.useFakeTimers();
  const checkedAt = Date.parse("2026-11-16T17:00:00Z");
  vi.setSystemTime(checkedAt);
  const originalActEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("view=expanded-summary")) {
      const next = replies.shift();
      if (!next) throw Error("Unexpected headline poll");
      return next();
    }
    if (url.includes("articleId=Example%20headline")) {
      return Response.json({ article: {
        id: "Example headline", ticker: "TEST", headline: "Example headline", marketCap: "$12M",
        publishedAt: "2026-11-16T16:00:00Z", eventType: "press_release", isRead: true,
        summary: "Example summary", positives: [], negatives: [], riskFlags: [], supportResistanceLevels: [],
      } });
    }
    if (url.includes("view=recent")) {
      const { articles } = await withHeadline("Drawer headline").json();
      return Response.json({ articles, next: null, since: "2026-11-14T17:00:00Z" });
    }
    if (url.startsWith("/api/platform/news/workspace-floats?")) return Response.json({});
    throw Error(`Unexpected request: ${url}`);
  }));
  function Board() {
    return createElement(ScreenerPressReleaseBoard, {
      data: useMarketEventsData(),
      onOpenChart: actions?.openChart,
      haltWindow: { date: "2026-11-16", checkedAt, closed: false },
      managedActiveHalts: [{
        id: "halt", ticker: "HALT", source: "alpaca", halted: true, market: "AMEX",
        haltTimeEt: "11:58:00", reason: "News pending", reasonCode: "P", quoteTimeEt: null, tradeTimeEt: null,
      }],
    });
  }
  try {
    await act(async () => {
      root.render(createElement(ScannerPageTickerSelection.Provider, {
        value: actions ? { ticker: null, select: actions.select, openDetails: actions.openDetails } : null,
      }, createElement(Board)));
    });
    await check(container);
    expect(replies).toHaveLength(0);
  } finally {
    await act(async () => { root.unmount(); });
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", originalActEnvironment);
    container.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
}

const advanceHeadlinePoll = () => act(async () => { await vi.advanceTimersByTimeAsync(30_000); });

it("gives news and halt rows separate green chart, Workspace chart, and company controls", async () => {
  const actions = { openChart: vi.fn(), select: vi.fn(), openDetails: vi.fn() };
  await withMarketEvents([() => withHeadline("Example headline")], async container => {
    for (const symbol of ["TEST", "HALT"]) {
      const green = container.querySelector<HTMLButtonElement>(`[aria-label="Open ${symbol} chart only"]`)!;
      const blue = container.querySelector<HTMLButtonElement>(`[aria-label="Show ${symbol} in scanner chart"]`)!;
      const ticker = container.querySelector<HTMLButtonElement>(`[aria-label="Open ${symbol} company details"]`)!;
      expect(green.compareDocumentPosition(blue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await act(async () => { green.click(); blue.click(); ticker.click(); });
      expect(actions.openChart).toHaveBeenLastCalledWith(expect.objectContaining({ symbol, addChart: false }));
      expect(actions.select).toHaveBeenLastCalledWith(symbol);
      expect(actions.openDetails).toHaveBeenLastCalledWith(symbol);
      expect(document.querySelector('[aria-label="Recent News"]')).toBeNull();
    }
    const headline = container.querySelector<HTMLButtonElement>('[aria-label="Open TEST article: Example headline"]')!;
    expect(headline.querySelector("button")).toBeNull();
    await act(async () => { headline.click(); });
    const drawer = document.querySelector('[role="dialog"][aria-label="Press release article"]')!;
    expect(drawer).not.toBeNull();
    expect([...drawer.querySelectorAll(".MuiChip-label")].map(chip => chip.textContent)).toEqual(["Market cap $12M", "Press release"]);
    expect(drawer.textContent).toContain("AI summary");
    expect(drawer.textContent).toContain("Example summary");
    const back = [...drawer.querySelectorAll("button")].find(button => button.textContent === "Back to list")!;
    await act(async () => { back.click(); });
    expect(document.querySelector('[role="dialog"][aria-label="Recent News"]')).toBe(drawer);
  }, actions);
});

it.each([403, 503])("ends initial headline loading on HTTP %s, leaves halts visible, and recovers on retry", async status => {
  await withMarketEvents([() => new Response(null, { status }), () => withHeadline("Recovered headline")], async container => {
    expect(container.querySelector('[aria-label="Loading market events"]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Press releases unavailable.");
    expect(container.querySelector('[aria-label="Current halts"]')?.textContent).toContain("HALT");
    await advanceHeadlinePoll();
    expect(container.textContent).toContain("Recovered headline");
    expect(container.textContent).not.toContain("Press releases unavailable.");
  });
});

it("preserves readable headlines through a transport failure and clears the card and open drawer on access denial", async () => {
  await withMarketEvents([
    () => withHeadline("Cached headline"),
    () => Promise.reject(new TypeError("Connection interrupted")),
    () => new Response(null, { status: 403 }),
    () => withHeadline("Fresh headline"),
  ], async container => {
    expect(container.textContent).toContain("Cached headline");
    const more = [...container.querySelectorAll("button")].find(button => button.textContent === "More news")!;
    await act(async () => { more.click(); });
    expect(document.body.textContent).toContain("Drawer headline");

    await advanceHeadlinePoll();
    expect(container.textContent).toContain("Cached headline");
    expect(document.body.textContent).toContain("Drawer headline");

    await advanceHeadlinePoll();
    expect(container.textContent).toContain("Press releases unavailable.");
    expect(container.querySelector('[aria-label="Current halts"]')).not.toBeNull();
    expect(document.body.textContent).not.toContain("Cached headline");
    expect(document.body.textContent).not.toContain("Drawer headline");

    await advanceHeadlinePoll();
    expect(container.textContent).toContain("Fresh headline");
    expect(document.querySelector('[aria-label="Recent News"]')).toBeNull();
  });
});

it("selects only server-eligible compact headlines in current and previous day order", () => {
  const dates = { today: "2026-11-16", previous: "2026-11-13" };
  const headline = (id: string, publishedAt: string, marketCap: string | null = null) => ({
    id, ticker: "TEST", headline: id, publishedAt, marketCap, isRead: false,
  });
  const current = Array.from({ length: 8 }, (_, index) =>
    headline(`today-${index}`, "2026-11-16T17:00:00Z", "$900M"));
  const previous = Array.from({ length: 4 }, (_, index) =>
    headline(`previous-${index}`, "2026-11-13T17:00:00Z"));
  const ineligible = headline("ineligible", "2026-11-16T18:00:00Z", "$1M");
  const tooOld = headline("too-old", "2026-11-12T17:00:00Z");
  const articles = [...previous, ineligible, ...current, tooOld];
  const eligible = ["missing", ...previous.map(article => article.id), ...current.map(article => article.id), tooOld.id];

  expect(selectCompactArticles(articles, dates, eligible).map(article => article.id))
    .toEqual([...current, ...previous.slice(0, 2)].map(article => article.id));
  expect(selectCompactArticles(articles, dates, [])).toEqual([]);
});

it("shows two lines of halt details, matches the HALT color, and supports keyboard scrolling", async () => {
  await withMarketEvents([() => withHeadline("Example headline")], async container => {
    const halts = container.querySelector<HTMLElement>('[aria-label="Current halts"]')!;
    const news = container.querySelector<HTMLElement>('[aria-label="Latest PR Scanner releases"]')!;
    const haltTicker = halts.querySelector('[aria-label="Open HALT company details"]')!;
    const haltLabel = [...halts.querySelectorAll("span")].find(item => item.textContent === "HALT")!;
    const newsTicker = news.querySelector('[aria-label="Open TEST company details"]')!;

    const reason = haltLabel.parentElement!;
    expect(reason.textContent).toBe("HALT · P");
    expect(reason.nextElementSibling?.textContent).toBe("Quote Pending · Trade Pending");
    expect(getComputedStyle(haltTicker).color).toBe(getComputedStyle(haltLabel).color);
    expect(getComputedStyle(haltTicker).color).not.toBe(getComputedStyle(newsTicker).color);
    expect(halts.tabIndex).toBe(0);
    expect(news.tabIndex).toBe(0);
  }, { select: vi.fn(), openDetails: vi.fn(), openChart: vi.fn() });
});
