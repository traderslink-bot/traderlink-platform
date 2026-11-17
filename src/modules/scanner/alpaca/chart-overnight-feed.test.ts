// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createAlpacaGateway } from "./gateway";
import { ChartOvernightFeed } from "./chart-overnight-feed";
import { chartOvernightTradingDate, chartShowsOvernight } from "./chart-overnight-session";
import { DEFAULT_CHART_PREFERENCES, parseChartPreferences } from "./chart-preferences";

const sockets: FakeSocket[] = [];
class FakeSocket extends EventTarget {
  static OPEN = 1;
  readyState = 1;
  sent: Record<string, unknown>[] = [];
  constructor(readonly url: string) {
    super();
    sockets.push(this);
    queueMicrotask(() => this.dispatchEvent(new Event("open")));
  }
  message(...messages: Record<string, unknown>[]) {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(messages) }));
  }
  send(command: string) {
    const data = JSON.parse(command);
    this.sent.push(data);
    if (data.action === "auth") queueMicrotask(() => this.message({ T: "success", msg: "authenticated" }));
    if (data.action === "subscribe") queueMicrotask(() => this.message({ T: "subscription", trades: data.trades }));
  }
  close() {
    this.readyState = 3;
    this.dispatchEvent(new Event("close"));
  }
}
const listener = () => ({ status: vi.fn(), price: vi.fn(), bar: vi.fn() });
const credentials = { keyId: "test", secretKey: "test", token: "test" };
const trade = (time: string, price = 12) => ({ T: "t", S: "AAPL", t: time, p: price, s: 10, i: 1, x: "B", c: ["@"], z: "C" });
const bar = (time: string, price = 12) => ({ T: "b", S: "AAPL", t: time, o: price, h: price + 1, l: price - 1, c: price, v: 100 });

afterEach(() => {
  sockets.length = 0;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("preserves overnight choices and defines the next Eastern session across the weekend", () => {
  expect(chartShowsOvernight(DEFAULT_CHART_PREFERENCES)).toBe(true);
  expect(chartShowsOvernight({ premarket: false, postmarket: false })).toBe(false);
  expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, overnight: false }).overnight).toBe(false);
  expect(() => parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, overnight: "true" })).toThrow();
  expect(chartOvernightTradingDate(Date.parse("2026-11-14T01:00:00Z"))).toBeNull(); // Friday evening
  expect(chartOvernightTradingDate(Date.parse("2026-11-16T00:59:59Z"))).toBeNull();
  expect(chartOvernightTradingDate(Date.parse("2026-11-16T01:00:00Z"))).toBe("2026-11-16");
  expect(chartOvernightTradingDate(Date.parse("2026-11-16T08:59:59Z"))).toBe("2026-11-16");
  expect(chartOvernightTradingDate(Date.parse("2026-11-16T09:00:00Z"))).toBeNull();
  expect(chartOvernightTradingDate(Date.parse("2026-03-09T00:00:00Z"))).toBe("2026-03-09"); // DST
});

it("shares a BOATS socket, forms live candles, reconnects and stops at premarket", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse("2026-11-17T00:59:59.900Z"));
  vi.stubGlobal("WebSocket", FakeSocket);
  const get = vi.fn().mockResolvedValue({ trades: {} });
  const tradingDay = vi.fn(async () => true);
  const feed = new ChartOvernightFeed(credentials, { get }, tradingDay);
  const first = listener(), second = listener(), other = listener();
  try {
    const removeFirst = feed.add("AAPL", first);
    feed.add("AAPL", second);
    feed.add("MSFT", other);
    expect(sockets).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(600);
    expect(tradingDay).toHaveBeenCalledExactlyOnceWith("2026-11-17");
    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toContain("/v1beta1/boats");
    expect(sockets[0].sent.find(command => command.action === "subscribe")?.trades).toEqual(["AAPL", "MSFT"]);
    expect(second.status).toHaveBeenLastCalledWith("connected");
    expect(get.mock.calls.every(([, query]) => query.get("feed") === "boats")).toBe(true);

    sockets[0].message(trade("2026-11-17T01:00:00.250Z"));
    await vi.advanceTimersByTimeAsync(250);
    expect(first.price).toHaveBeenCalledWith({ price: 12, time: "2026-11-17T01:00:00.250Z" });
    expect(second.bar).toHaveBeenCalledWith(expect.objectContaining({ close: 12, volume: 10 }), true);
    expect(other.price).not.toHaveBeenCalled();
    sockets[0].message(bar("2026-11-17T01:00:00Z", 13));
    expect(second.bar).toHaveBeenLastCalledWith(expect.objectContaining({ close: 13, volume: 100 }));
    removeFirst();
    expect(sockets[0].sent.some(command => command.action === "unsubscribe")).toBe(false);

    sockets[0].close();
    expect(second.status).toHaveBeenLastCalledWith("unavailable");
    await vi.advanceTimersByTimeAsync(2_250);
    expect(sockets).toHaveLength(2);
    expect(second.status).toHaveBeenLastCalledWith("connected");

    vi.setSystemTime(Date.parse("2026-11-17T09:00:00Z"));
    await vi.advanceTimersByTimeAsync(250);
    expect(sockets[1].readyState).toBe(3);
    expect(second.status).toHaveBeenLastCalledWith("closed");
    expect(sockets).toHaveLength(2);
  } finally {
    feed.close();
  }
});

it("leaves an exchange holiday closed even with an overnight chart subscriber", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse("2026-11-26T02:00:00Z")); // Thursday trade date
  vi.stubGlobal("WebSocket", FakeSocket);
  const consumer = listener(), dateOpen = vi.fn(async () => false);
  const feed = new ChartOvernightFeed(credentials, { get: vi.fn() }, dateOpen);
  try {
    feed.add("AAPL", consumer);
    await vi.advanceTimersByTimeAsync(750);
    expect(dateOpen).toHaveBeenCalledExactlyOnceWith("2026-11-26");
    expect(sockets).toHaveLength(0);
    expect(consumer.status).toHaveBeenLastCalledWith("closed");
  } finally {
    feed.close();
  }
});

it("keeps historical BOATS separate from SIP and only returns BOATS history within the overnight window", async () => {
  const nativeFetch = globalThis.fetch;
  const upstream = vi.fn(async (input: string | URL) => {
    const feed = new URL(input).searchParams.get("feed");
    return Response.json({ bars: { AAPL: [
      bar("2026-11-17T00:59:00Z"),
      bar("2026-11-17T01:00:00Z", feed === "boats" ? 14 : 12),
      bar("2026-11-17T09:00:00Z"),
    ]}, next_page_token: null });
  });
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-17T10:00:00Z"));
  vi.stubGlobal("fetch", upstream);
  const gateway = createAlpacaGateway({ ...credentials, overnightCharts: true });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const params = new URLSearchParams({
    symbol: "AAPL", timeframe: "1Min",
    start: String(Date.parse("2026-11-17T00:50:00Z")), end: String(Date.parse("2026-11-17T09:01:00Z")),
  });
  try {
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
    const options = { headers: { Authorization: "Bearer test" } };
    expect((await nativeFetch(`${url}/chart-overnight-history?${params}`)).status).toBe(401);
    expect(await (await nativeFetch(`${url}/chart-overnight-history?${params}`, options)).json()).toMatchObject({
      feed: "boats", adjustment: "split", bars: [{ close: 14, time: Date.parse("2026-11-17T01:00:00Z") / 1000 }],
    });
    // Unrelated consumers continue using the existing SIP history contract.
    expect(await (await nativeFetch(`${url}/history?${params}`, options)).json()).toMatchObject({ feed: "sip" });
    expect(upstream.mock.calls.filter(([url]) => new URL(url).pathname === "/v2/stocks/bars")
      .map(([url]) => new URL(url).searchParams.get("feed"))).toEqual(["boats", "sip"]);
  } finally {
    gateway.close();
    gateway.server.closeAllConnections();
  }
});

it("multiplexes BOATS events on opted-in chart streams without sending them to the regular stream", async () => {
  const nativeFetch = globalThis.fetch;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-17T02:00:00Z"));
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
    if (new URL(input).pathname === "/v2/calendar") {
      const days = Array.from({ length: 365 }, (_, index) => new Date(Date.UTC(2026, 0, index + 1)));
      return Response.json(days.filter(day => day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
        .map(day => ({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" })));
    }
    return Response.json({ trades: {}, next_page_token: null });
  }));
  const gateway = createAlpacaGateway({ ...credentials, overnightCharts: true });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
  const open = (query: string) => nativeFetch(`${url}/stream?symbol=AAPL${query}`, { headers: { Authorization: "Bearer test" } });
  const readUntil = async (reader: ReadableStreamDefaultReader<Uint8Array>, marker: string) => {
    const decoder = new TextDecoder();
    let text = "";
    while (!text.includes(marker)) {
      const { value, done } = await reader.read();
      if (done) throw Error("stream ended before " + marker);
      text += decoder.decode(value);
    }
    return text;
  };
  try {
    const regular = (await open("")).body!.getReader();
    const extended = (await open("&overnight=1")).body!.getReader();
    expect(await readUntil(regular, '"state":"connected"')).not.toContain("overnight-");
    expect(await readUntil(extended, 'event: overnight-status')).toContain("overnight-status");
    const boats = sockets.find(socket => socket.url.endsWith("/boats"));
    expect(boats).toBeDefined();
    boats!.message(bar("2026-11-17T01:59:00Z"));
    expect(await readUntil(extended, "event: overnight-bar")).toContain('"close":12');
    // Closing the overnight chart releases BOATS while the SIP subscriber stays attached.
    await extended.cancel();
    await vi.waitFor(() => expect(boats!.readyState).toBe(3));
    expect(sockets.find(socket => socket.url.endsWith("/sip"))?.readyState).toBe(1);
    await regular.cancel();
  } finally {
    gateway.close();
    gateway.server.closeAllConnections();
  }
});
