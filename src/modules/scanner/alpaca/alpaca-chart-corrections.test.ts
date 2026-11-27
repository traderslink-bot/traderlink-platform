// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { AlpacaChartCorrections, AlpacaCorrectedMinutes } from "./alpaca-chart-corrections";
import { CandleHistoryStore } from "../../market-data/candle-history/store";
import { decodeGatewayWire, encodeGatewayWire, GATEWAY_WIRE_VERSION } from "../../market-data/transport/gateway-wire";
import { readAlpacaTradeRevisions } from "./client";
import { browserChartEvent } from "../../market-data/server/browser-chart-events";

const now = Date.parse("2026-11-27T14:30:00Z");
const first = Date.parse("2026-11-27T12:02:00Z") / 1000;
const trade = (minute: number, id: number, p: number, s: number, u?: string) =>
  ({ t: new Date((minute + id) * 1000).toISOString(), i: id, x: "Q", z: "C", p, s, c: ["@", "T"], ...(u ? { u } : {}) });

afterEach(() => vi.useRealTimers());

it("uses final prints and applies the covered empty minute through storage and transport", async () => {
  const builder = new AlpacaCorrectedMinutes();
  for (const row of [trade(first, 1, 38, 100, "canceled"), trade(first, 2, 4, 50, "incorrect"),
    trade(first, 3, 3, 20, "corrected"), trade(first, 4, 3.1, 40), trade(first + 60, 5, 34, 100, "canceled")]) {
    builder.read(row);
  }
  const repaired = builder.corrections("POM");
  expect(repaired).toEqual([
    { symbol: "POM", minute: first, bar: { time: first, open: 3, high: 3.1, low: 3, close: 3.1, volume: 60 } },
    { symbol: "POM", minute: first + 60, bar: null },
  ]);
  for (const correction of repaired) {
    const wire = decodeGatewayWire("stream", encodeGatewayWire("stream", correction));
    expect(browserChartEvent("chart-correction", wire as Record<string, unknown>)).toEqual({ type: "chart-correction", data: correction });
  }

  const directory = mkdtempSync(join(tmpdir(), "market-correction-fixture-"));
  try {
    const path = join(directory, "fixture.sqlite");
    const store = new CandleHistoryStore(path);
    store.saveTradeCorrections(repaired.map(correction => ({ ...correction, correctionRevision: now })));
    store.close();
    const reopened = new CandleHistoryStore(path);
    const corrections = new AlpacaChartCorrections({ get: vi.fn() }, vi.fn(), () => now, from => reopened.readTradeCorrections(from));
    try {
      const stale = repaired.map(({ minute }) => ({ time: minute, open: 38, high: 38, low: 38, close: 38, volume: 100 }));
      const base = { symbol: "POM", feed: "sip" as const, adjustment: "split" as const, basisDate: "2026-11-27",
        complete: true, nextPageToken: null, bars: stale };
      expect(corrections.overlay(base, (first - 60) * 1000, (first + 120) * 1000).bars).toEqual([repaired[0].bar]);
      expect(corrections.sessionRevision("POM", "2026-11-27")).toBe(now);
      expect(corrections.sessionRevision("POM", "2026-11-28")).toBeUndefined();
      expect(corrections.sessionRevision("SPY", "2026-11-27")).toBeUndefined();
      expect(corrections.manifest({ symbols: ["POM"], start: first * 1000, end: (first + 120) * 1000 }).symbols.POM)
        .toEqual({ minutes: [first, first + 60], revision: expect.stringMatching(/^[a-f0-9]{64}$/), pending: false });
      expect(corrections.overlay({ ...base, symbol: "SPY" }, (first - 60) * 1000, (first + 120) * 1000).bars).toEqual(stale);
    } finally { corrections.close(); reopened.close(); }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

it("waits for the provider to publish the cancellation and does not replay an unchanged repair", async () => {
  vi.useFakeTimers({ now });
  const sources = [trade(first, 1, 38, 100), trade(first, 2, 3, 20)];
  const getter = vi.fn(async () => ({ trades: { POM: sources }, next_page_token: null }));
  const publish = vi.fn();
  const priorRevision = now + 60_000;
  const corrections = new AlpacaChartCorrections({ get: getter }, publish, Date.now,
    () => [{ symbol: "POM", minute: first + 60, bar: null, correctionRevision: priorRevision }]);
  try {
    corrections.observe({ T: "x", S: "POM", x: "Q", z: "C", i: 1, a: "C" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(publish).not.toHaveBeenCalled();
    sources[0] = trade(first, 1, 38, 100, "canceled");
    await vi.advanceTimersByTimeAsync(15_000);
    expect(publish).toHaveBeenCalledExactlyOnceWith([
      { symbol: "POM", minute: first, bar: { time: first, open: 3, high: 3, low: 3, close: 3, volume: 20 },
        premarket: {through: now / 1000, volume: 20, dollarVolume: 60}, correctionRevision: priorRevision + 1 },
    ]);
    expect(corrections.has("POM", first)).toBe(true);
    corrections.refresh("POM");
    await vi.advanceTimersByTimeAsync(1000);
    expect(publish).toHaveBeenCalledTimes(1);
  } finally { corrections.close(); }
});

it("sends an open subscriber the same repair returned by fresh gateway history", async () => {
  const { createAlpacaGateway } = await import("./gateway");
  const nativeFetch = globalThis.fetch;
  const sockets: TestSocket[] = [];
  class TestSocket extends EventTarget {
    static OPEN = 1;
    readyState = 1;
    constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
    message(value: unknown) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify([value]) })); }
    send(encoded: string) {
      const command = JSON.parse(encoded);
      if (command.action === "auth") queueMicrotask(() => this.message({ T: "success", msg: "authenticated" }));
      if (command.action === "subscribe") queueMicrotask(() => this.message({ ...command, T: "subscription" }));
    }
    close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
  }
  const old = { t: new Date(first * 1000).toISOString(), o: 3, h: 38, l: 3, c: 38, v: 120 };
  const replacement = { time: first, open: 3, high: 3, low: 3, close: 3, volume: 20 };
  let cancellationPublished = false;
  const date = vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubGlobal("WebSocket", TestSocket);
  vi.stubGlobal("fetch", vi.fn(async (input: URL | string) => {
    const url = new URL(input);
    if (url.pathname === "/v2/stocks/trades") {
      const start = Date.parse(url.searchParams.get("start") ?? "");
      return Response.json({ trades: { POM: start > first * 1000 ? [] :
        [trade(first, 1, 38, 100, cancellationPublished ? "canceled" : undefined), trade(first, 2, 3, 20)] }, next_page_token: null });
    }
    if (url.pathname === "/v2/stocks/bars") return Response.json({ bars: { POM: [old] }, next_page_token: null });
    if (url.pathname === "/v2/stocks/snapshots") return Response.json({ POM: { minuteBar: old } });
    if (url.pathname.includes("calendar")) return Response.json([{ date: "2026-11-27", open: "09:30", close: "13:00" }]);
    throw Error("unexpected_fixture_request");
  }));
  const gateway = createAlpacaGateway({ keyId: "test", secretKey: "test", token: "test" });
  const abort = new AbortController();
  try {
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const address = gateway.server.address();
    if (!address || typeof address === "string") throw Error("fixture_gateway_unavailable");
    const root = `http://127.0.0.1:${address.port}`;
    const headers = { Authorization: "Bearer test" };
    const history = () => nativeFetch(root + `/history?symbol=POM&timeframe=1Min&start=${first * 1000}&end=${now - 1}`, { headers });
    const window = { symbols: ["POM", "SPY"], start: first * 1000, end: now };
    const manifest = () => nativeFetch(root + `/trade-revisions?symbols=POM,SPY&start=${window.start}&end=${window.end}`, { headers });
    expect((await nativeFetch(root + "/trade-revisions")).status).toBe(401);
    expect((await nativeFetch(root + `/trade-revisions?symbols=POM,POM&start=${window.start}&end=${window.end}`, { headers })).status).toBe(400);
    expect(await (await manifest()).json()).toEqual({ feed: "sip", symbols: {} });
    expect((await (await history()).json()).bars[0].high).toBe(38);
    const stream = await nativeFetch(root + "/stream?symbol=POM", { headers, signal: abort.signal });
    const reader = stream.body!.getReader();
    await vi.waitFor(() => expect(sockets).toHaveLength(1));
    const quotes = async () => (await nativeFetch(root + "/quotes?symbols=POM&sessions=1&regularClose=780", { headers })).json();
    await vi.waitFor(async () => expect((await quotes()).sessionTotals.POM?.sessions.premarket.high).toBe(38));
    sockets[0].message({ T: "x", S: "POM", x: "Q", z: "C", i: 1, a: "C" });
    expect(await (await manifest()).json()).toEqual({
      feed: "sip", symbols: { POM: { minutes: [], pending: true, revision: null } },
    });
    expect((await quotes()).sessionTotals.POM).toBeNull();
    cancellationPublished = true;
    let text = "", parts = 0;
    while (!text.includes("event: chart-correction") && parts++ < 8) {
      const { value } = await reader.read();
      text += new TextDecoder().decode(value);
    }
    expect(text).toContain(JSON.stringify(replacement));
    expect(text).not.toContain("correctionRevision");
    expect((await (await history()).json()).bars).toEqual([replacement]);
    await vi.waitFor(async () => expect((await quotes()).sessionTotals.POM?.sessions.premarket.high).toBe(3));
    const quoteReply = await quotes();
    expect(quoteReply.sessionTotals.POM.correctionRevision).toBe(now);
    for (const route of ["quotes", "scanner-stream"] as const) {
      expect(decodeGatewayWire(route, encodeGatewayWire(route, quoteReply))).toMatchObject({
        sessionTotals: { POM: { date: "2026-11-27", correctionRevision: now } },
      });
    }
    const verified = await (await manifest()).json();
    expect(verified).toEqual({ feed: "sip", symbols: {
      POM: { minutes: [first], pending: false, revision: expect.stringMatching(/^[a-f0-9]{64}$/) },
    } });
    const requestFetch = globalThis.fetch;
    vi.stubGlobal("fetch", (url: URL | string, init: RequestInit) =>
      String(url).startsWith(root + "/") ? nativeFetch(url, init) : requestFetch(url, init));
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: root, TRADERLINK_ALPACA_GATEWAY_TOKEN: "test",
      TRADERLINK_GATEWAY_CONTRACT: GATEWAY_WIRE_VERSION };
    expect(await readAlpacaTradeRevisions(window, environment)).toEqual(verified);
    expect(await readAlpacaTradeRevisions({ ...window, start: window.start - 60_000, end: window.start }, environment))
      .toEqual({ feed: "sip", symbols: {} });
    await reader.cancel();
  } finally {
    abort.abort();
    gateway.close();
    gateway.server.closeAllConnections();
    date.mockRestore();
    vi.unstubAllGlobals();
  }
});
