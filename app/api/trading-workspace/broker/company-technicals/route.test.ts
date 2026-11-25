import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

const { access, open, feed, history, calendar } = vi.hoisted(() => {
  const feed = { current: vi.fn(), update: vi.fn(), read: vi.fn(), close: vi.fn() };
  return { access: vi.fn(), open: vi.fn(() => feed), feed, history: vi.fn(), calendar: vi.fn() };
});
vi.mock("@/src/modules/market-data/server/workspace-moomoo-access", () => ({ readWorkspaceMoomooAccess: access }));
vi.mock("@/src/modules/market-data/server/workspace-broker-feed-session", () => ({ openWorkspaceBrokerFeed: open }));
vi.mock("@/src/modules/company/server/company-snapshot", () => ({ companySymbol: (symbol: string) => symbol === "TEST" ? symbol : null }));

vi.mock("@/src/modules/market-data/server/moomoo-chart-history", () => ({
  MoomooChartHistory: class {
    history = history;
    calendar = calendar;
  },
}));

const url = "http://localhost/api/trading-workspace/broker/company-technicals?symbol=TEST";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

it("refuses denied and disconnected requests before opening a feed", async () => {
  access.mockReturnValueOnce(null).mockReturnValueOnce({ connection: null });
  expect((await GET(new Request(url))).status).toBe(404);
  expect((await GET(new Request(url))).status).toBe(409);
  expect(open).not.toHaveBeenCalled();
});

it("uses the admitted feed for one symbol and closes it on access loss", async () => {
  vi.useFakeTimers();
  access.mockReturnValue({ connection: {} });
  feed.current.mockReturnValue(true);
  feed.update.mockReturnValue("regular");
  feed.read.mockReturnValue({
    quote: { symbol: "TEST", price: 1.2345 },
    book: { bid: 1, ask: 2, observedAt: Date.now() - 60_000 },
  });
  const response = await GET(new Request(url));
  const reader = response.body!.getReader();
  const payload = new TextDecoder().decode((await reader.read()).value);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(feed.update).toHaveBeenCalledWith(["TEST"]);
  expect(JSON.parse(payload.slice(6))).toEqual({ session: "regular", asOf: expect.any(Number), quote: { symbol: "TEST", price: 1.2345 } });
  feed.current.mockReturnValue(false);
  await vi.advanceTimersByTimeAsync(5000);
  expect((await reader.read()).done).toBe(true);
  expect(feed.close).toHaveBeenCalledOnce();
});

it("reads the requested 52-week adjustment and discards history if admission changes before it returns", async () => {
  vi.useFakeTimers({ now: Date.UTC(2026, 10, 25, 15) });
  const current = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
  access.mockReturnValue({ connection: { current } });
  calendar.mockResolvedValue({ available: true, sessions: [] });
  const bar = { time: Math.floor(Date.UTC(2026, 7, 17, 12) / 1000), high: 2.2, low: 1.1 };
  history.mockResolvedValue({ bars: [bar], complete: true, basisDate: "2026-11-25", adjustment: "raw" });
  const rangeUrl = url + "&range=52w&adjustment=raw";

  const admitted = await GET(new Request(rangeUrl));
  expect(await admitted.json()).toEqual({ yearRange: { high: 2.2, low: 1.1, highDate: "2026-08-17", lowDate: "2026-08-17" } });
  expect(history).toHaveBeenCalledWith(expect.objectContaining({ symbol: "TEST", timeframe: "1Day", adjustment: "raw" }));
  const withdrawn = await GET(new Request(rangeUrl));
  expect(withdrawn.status).toBe(409);
  expect(await withdrawn.json()).toEqual({});
  expect(open).not.toHaveBeenCalled();
});

it("rejects partial or misadjusted 52-week history", async () => {
  vi.useFakeTimers({ now: Date.UTC(2026, 10, 25, 15) });
  access.mockReturnValue({ connection: { current: () => true } });
  calendar.mockResolvedValue({ available: true, sessions: [] });
  for (const coverage of [
    { complete: false, basisDate: "2026-11-25", adjustment: "split" },
    { complete: true, basisDate: "2026-11-24", adjustment: "split" },
    { complete: true, basisDate: "2026-11-25", adjustment: "raw" },
  ]) {
    history.mockResolvedValueOnce({ ...coverage, bars: [] });
    const result = await GET(new Request(url + "&range=52w&adjustment=split"));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({});
  }
});
