// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { AlpacaTradingStatusBook } from "./trading-status";
import type { ScannerReadModel } from "../live/contracts";

const { requestGateway, officialRows, readDatabase } = vi.hoisted(() => ({
  requestGateway: vi.fn(), officialRows: vi.fn(), readDatabase: vi.fn((read: (db: unknown) => unknown) => read({})),
}));
vi.mock("./client", () => ({ requestAlpacaGateway: requestGateway }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestIdentity: vi.fn() }));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access", () => ({ hasWatchlistDashboardNavigationAccess: () => true }));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_: unknown, read: (db: unknown) => unknown) => readDatabase(read) }));
vi.mock("@/src/modules/news/server/market-halt-dashboard", () => ({ listMarketHaltDashboard: () => ({ rows: officialRows() }) }));
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({
  readLiveScannerRuntime: () => ({ tradingDate: "2026-11-11" }), subscribeLiveScannerRuntime: vi.fn(),
  readLiveScannerMarketMovements: vi.fn(), scannerUniverseStore: vi.fn(),
}));
vi.mock("@/src/modules/scanner/live/server/finnhub-exchange", () => ({ readFinnhubExchanges: vi.fn() }));
vi.mock("@/src/modules/news/server/eodhd-halt-resumption-monitor", () => ({ eodhdResumedHaltIds: vi.fn() }));
vi.mock("@/app/dashboard-template", () => ({
  DashboardPanel: ({ children }: { children: import("react").ReactNode }) => createElement("section", null, children),
}));

import { GET } from "@/app/api/screeners/live/route";
import { ScreenerPressReleaseBoard, useMarketEventsData } from "@/app/(dashboard)/screeners/screener-press-release-board";
import { selectActiveScannerHalts } from "../live/active-halts";

function Card({ model }: { model: ScannerReadModel }) {
  const data = useMarketEventsData();
  return createElement(ScreenerPressReleaseBoard, { data, managedActiveHalts: selectActiveScannerHalts(model.activeHalts ?? []), haltSourceUnavailable: model.activeHaltSourceUnavailable });
}

it("shows SMX and OMH pauses with matching schedules, retains quote-only pauses, and clears on trading resumption", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.stubEnv("TRADERLINK_MARKET_HALT_SOURCE", "alpaca");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const fetch = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () => Response.json({ articles: [] }));
  vi.stubGlobal("fetch", fetch);
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  const book = new AlpacaTradingStatusBook();
  requestGateway.mockImplementation(async () => ({ feed: "sip", connected: true, statusesSubscribed: true, statuses: book.all() }));
  const send = (ticker: string, code: string, time: string, reasonCode = "LUDP") => {
    expect(book.observe({ T: "s", S: ticker, sc: code, z: "C", rc: reasonCode, rm: "Volatility pause", t: `2026-11-11T${time}Z` })).toBe(true);
  };
  const update = async (time: string) => {
    vi.setSystemTime(new Date(`2026-11-11T${time}Z`));
    const response = await GET(new Request("http://local.test/api/screeners/live"));
    expect(response.status).toBe(200);
    const model = await response.json() as ScannerReadModel;
    await act(async () => root.render(createElement(Card, { model })));
    return model.activeHalts ?? [];
  };
  const rows = () => host.querySelector('[aria-label="Current halts"]')?.textContent ?? "";
  try {
    officialRows.mockReturnValue([
      { ticker: "SMX", haltTimeEt: "10:00:00", quoteTimeEt: "10:04:00", tradeTimeEt: "10:05:00" },
      { ticker: "OMH", haltTimeEt: "10:00:01", quoteTimeEt: null, tradeTimeEt: "10:05:01" },
      { ticker: "OLD", haltTimeEt: "10:00:00", quoteTimeEt: null, tradeTimeEt: null },
    ]);
    send("PRE", "H", "12:50:00", "T1");
    send("ETF", "H", "15:00:00.100", "T8");
    send("NONC", "H", "15:00:00.200", "H4");
    send("SMX", "P", "15:00:00.500"); send("OMH", "H", "15:00:01.500");
    const first = await update("15:00:02");
    expect(first).toHaveLength(2);
    expect(rows()).toContain("SMX");
    expect(rows()).toContain("OMH");
    expect(rows()).toContain("Quote sched. 10:04");
    expect(rows()).toContain("Trade sched. 10:05");
    expect(rows()).not.toContain("OLD");
    expect(rows()).not.toContain("NONC");
    expect(rows()).not.toContain("ETF");
    expect(rows()).not.toContain("PRE");
    send("SMX", "Q", "15:04:02");
    const quote = await update("15:04:03");
    expect(quote.find(row => row.ticker === "SMX")).toMatchObject({ quoteTimeEt: "10:04:02.000", tradeTimeScheduled: true });
    expect(quote.find(row => row.ticker === "SMX")?.quoteTimeScheduled).toBeUndefined();
    expect(rows()).toContain("SMX");
    expect(book.observeTrade("SMX", "2026-11-11T14:59:59Z", 3)).toBe(false);
    expect(book.observeTrade("SMX", "2026-11-11T15:05:00Z", 4)).toBe(false);
    expect(book.observeTrade("SMX", "2026-11-11T15:05:00.500Z", 4)).toBe(false);
    await update("15:05:01");
    expect(rows()).toContain("SMX");
    expect(book.observeTrade("SMX", "2026-11-11T15:05:01.500Z", 4.05)).toBe(true);
    await update("15:05:03");
    expect(rows()).not.toContain("SMX"); expect(rows()).toContain("OMH");
    send("SMX", "P", "15:06:00"); send("OMH", "T", "15:06:01");
    const second = await update("15:06:02");
    expect(second).toMatchObject([{ ticker: "SMX", quoteTimeEt: null, tradeTimeEt: null }]);
    expect(second[0].id).not.toBe(first.find(row => row.ticker === "SMX")?.id);
    expect(rows()).toContain("SMX"); expect(rows()).not.toContain("OMH");
    send("SMX", "T", "15:11:00");
    await update("15:11:01");
    expect(rows()).toBe("");
    requestGateway.mockResolvedValueOnce({ feed: "sip", connected: true, statusesSubscribed: false, statuses: book.all() });
    await update("15:11:03");
    expect(host.textContent).toContain("Halt status unavailable");
    expect(rows()).toBe("");
    expect(fetch.mock.calls.every(([url]) => !String(url).includes("/api/market-halts/current"))).toBe(true);
    expect(requestGateway.mock.calls.every(([path]) => path === "halts")).toBe(true);
  } finally {
    await act(async () => root.unmount()); host.remove();
    vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers();
  }
});
