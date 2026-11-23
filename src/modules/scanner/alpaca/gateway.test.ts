// @vitest-environment node
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as statusJournal from "./status-journal";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createAlpacaGateway } from "./gateway";
import { AcceptedSeriesPublisher, type QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { ALPACA_REGULAR_FOUR_HOUR_DATASET, type AlpacaHistoryRequest } from "./rest-data";
import { decodeGatewayWire, gatewayWireUrl } from "../../market-data/transport/gateway-wire";
import { CandleHistoryStore } from "../../market-data/candle-history/store";
import { initialCandleHistorySettings } from "../../market-data/candle-history/settings";
import { validateScannerSignalBars } from "./scanner-signal-bars";

afterEach(() => vi.unstubAllGlobals());
describe("private Alpaca gateway", () => {
  it.each([
    { timeframe: "1Min", frame: "1m", session: "extended", from: "2026-11-23T14:00:00Z", edge: "2026-11-23T14:30:00Z" },
    { timeframe: "1Day", frame: "1D", session: "daily", from: "2026-11-20T05:00:00Z", edge: "2026-11-23T05:00:00Z" },
  ] as const)("reuses the archived $timeframe prefix and requests only the uncovered tail", async ({ timeframe, frame, session, from, edge }) => {
    const nativeFetch = globalThis.fetch;
    const directory = mkdtempSync(join(tmpdir(), "archive-chart-tail-"));
    const path = join(directory, "archive.sqlite");
    const symbol = "TEST", date = "2026-11-23", basis = "b".repeat(64);
    const start = Date.parse(from), boundary = Date.parse(edge), end = Date.parse(date + "T14:59:59.999Z");
    const archived = { time: start / 1_000, open: 1, high: 2, low: 1, close: 2, volume: 30 };
    const latest = { ...archived, time: boundary / 1_000, close: 1.5 };
    const store = new CandleHistoryStore(path);
    const settings = initialCandleHistorySettings();
    store.changeSettings({ ...settings, popularTickers: [],
      retention: { ...settings.retention, "1D": { amount: 3, unit: "days" } } }, []);
    store.updateBasis(symbol, date, basis);
    store.saveVerified([{ symbol, frame, session, basis, start: start / 1_000, end: boundary / 1_000, bars: [archived] }]);
    store.close();
    const reads: string[][] = [];
    const provider = vi.fn<typeof fetch>(async input => {
      const url = new URL(String(input));
      if (url.pathname === "/v2/calendar") return Response.json([
        { date: "2026-11-20", open: "09:30", close: "16:00" }, { date: "2026-11-23", open: "09:30", close: "16:00" },
      ]);
      expect(url.pathname).toBe("/v2/stocks/bars");
      const from = url.searchParams.get("start")!;
      reads.push([from, url.searchParams.get("end")!, url.searchParams.get("adjustment")!]);
      const rows = [archived, latest].filter(bar => bar.time * 1_000 >= Date.parse(from))
        .map(bar => ({ t: new Date(bar.time * 1_000).toISOString(), o: bar.open, h: bar.high, l: bar.low, c: bar.close, v: bar.volume }));
      return Response.json({ bars: { [symbol]: rows }, next_page_token: null });
    });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(date + "T15:00:00Z"));
    vi.stubGlobal("fetch", provider);
    const gateway = createAlpacaGateway({ keyId: "fixture", secretKey: "fixture", token: "chart-fixture",
      candleHistory: { path, adminToken: "fixture-admin" } });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
    const get = (end: number, extras: Record<string, string> = {}) => nativeFetch(origin + "history?" +
      new URLSearchParams({ symbol, timeframe, start: String(start), end: String(end), ...extras }),
      { headers: { Authorization: "Bearer chart-fixture" } });
    try {
      const covered = await get(boundary - 1);
      expect(covered.status).toBe(200);
      expect(await covered.json()).toMatchObject({ bars: [archived], complete: true, basisDate: date });
      expect(reads).toEqual([]);
      const joined = await get(end);
      expect(joined.status).toBe(200);
      expect(await joined.json()).toMatchObject({ bars: [archived, latest], complete: true, basisDate: date });
      expect(reads).toEqual([[new Date(boundary).toISOString(), new Date(end).toISOString(), "split"]]);
      if (timeframe === "1Day") {
        const olderStart = Date.parse("2025-01-01T05:00:00Z");
        const startup = await get(end, { start: String(olderStart), dailyStartup: "1" });
        expect(startup.status).toBe(200);
        expect(await startup.json()).toMatchObject({ bars: [archived, latest], chartPageStart: start });
        expect(reads.every(read => read[0] === new Date(boundary).toISOString())).toBe(true);

        const regular = await get(end, { start: String(olderStart) });
        expect(regular.status).toBe(200);
        expect(await regular.json()).not.toHaveProperty("chartPageStart");
        expect(reads.at(-1)?.[0]).toBe(new Date(olderStart).toISOString());
        expect((await get(end, { dailyStartup: "1", acceptedEvidence: "1" })).status).toBe(400);
        expect((await get(end, { dailyStartup: "1", adjustment: "raw" })).status).toBe(400);
      }
      const raw = await get(end, { adjustment: "raw" });
      expect(raw.status).toBe(200);
      expect(await raw.json()).toMatchObject({ bars: [archived, latest], adjustment: "raw" });
      expect(reads.at(-1)).toEqual([new Date(start).toISOString(), new Date(end).toISOString(), "raw"]);
      if (timeframe === "1Day") {
        const evidence = await get(end, { acceptedEvidence: "1" });
        expect(evidence.status).toBe(200);
        expect(reads.at(-1)).toEqual([new Date(start).toISOString(), new Date(end).toISOString(), "split"]);
      }
    } finally {
      gateway.close();
      gateway.server.closeAllConnections();
      await new Promise(resolve => setImmediate(resolve));
      vi.useRealTimers();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("shares equivalent private signal history requests and preserves exact completed bars on the wire", async () => {
    const nativeFetch = globalThis.fetch;
    const end = Math.floor(Date.now() / 300_000) * 300_000;
    const start = end - 300_000;
    const candle = { t: new Date(start).toISOString(), o: 9, h: 11, l: 8, c: 10, v: 100, vw: 9.5 };
    const provider = vi.fn<typeof fetch>(async input => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/v2/stocks/bars");
      expect(url.searchParams.get("symbols")).toBe("AAPL,MSFT");
      expect(url.searchParams.get("end")).toBe(new Date(end - 1).toISOString());
      return Response.json({ bars: { AAPL: [candle], MSFT: [] }, next_page_token: null });
    });
    vi.stubGlobal("fetch", provider);
    const gateway = createAlpacaGateway({ keyId: "fixture-key", secretKey: "fixture-secret", token: "fixture-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
    const headers = { Authorization: "Bearer fixture-token" };
    const query = new URLSearchParams({ symbols: "MSFT,AAPL", frame: "5m", start: String(start), end: String(end) });
    const legacy = base + "scanner-signal-bars?" + query;
    try {
      expect((await nativeFetch(legacy)).status).toBe(401);
      expect(provider).not.toHaveBeenCalled();
      const wire = gatewayWireUrl(base, "scanner-signal-bars", new URLSearchParams({ ...Object.fromEntries(query), symbols: "AAPL,MSFT" }));
      const [plain, neutral] = await Promise.all([nativeFetch(legacy, { headers }), nativeFetch(wire, { headers })]);
      const result = validateScannerSignalBars(await plain.json(), { symbols: ["AAPL", "MSFT"], frame: "5m", start, end });
      expect(decodeGatewayWire("scanner-signal-bars", await neutral.json())).toEqual(result);
      expect(result).toMatchObject({ bars: { AAPL: [{ time: start / 1000, vwap: 9.5 }], MSFT: [] },
        coverage: { AAPL: { status: "complete", completedThroughMs: end }, MSFT: { status: "complete", completedThroughMs: end } } });
      expect(provider).toHaveBeenCalledTimes(1);
    } finally {
      gateway.close();
      gateway.server.closeAllConnections();
    }
  });

  it("requires an exact regular-session receipt on the explicit 4H source without falling back to native history", async () => {
    const nativeFetch = globalThis.fetch;
    const upstream = vi.fn<typeof fetch>(async () => {
      throw Error("the independent native path must not be called");
    });
    vi.stubGlobal("fetch", upstream);
    const start = Date.parse("2026-11-20T14:30:00Z");
    const end = start + 14_400_000;
    const bar = { time: start / 1_000, open: 9, high: 11, low: 8, close: 10, volume: 100 };
    let datasetId = "native-provider-4h";
    const read = vi.fn(async () => ({
      history: { symbol: "AAPL", feed: "sip" as const, adjustment: "split" as const, complete: true, nextPageToken: null, bars: [bar] },
      qualified: {
        symbol: "AAPL", instrumentId: "fixture-listing", venue: "NASDAQ", frame: "4h", datasetId,
        priceBasisId: "fixture-basis", calendarRevision: "fixture-calendar", sessionMode: "regular",
        completedThroughMs: end, acceptedCutoffMs: end, availableAtMs: end,
        rows: [[start, end, bar.open, bar.high, bar.low, bar.close, bar.volume]],
      } satisfies QualifiedInputSeries,
      calendars: [],
    }));
    const gateway = createAlpacaGateway({
      keyId: "fixture-key", secretKey: "fixture-secret", token: "fixture-token", readVerifiedRegularHistory: read,
    });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/history?`;
    const query = new URLSearchParams({
      symbol: "AAPL", timeframe: "4Hour", start: String(start), end: String(end), sessionMode: "regular", acceptedEvidence: "1",
    });
    const headers = { Authorization: "Bearer fixture-token" };
    try {
      const invalid = new URLSearchParams(query);
      invalid.set("timeframe", "1Day");
      expect((await nativeFetch(base + invalid, { headers })).status).toBe(400);
      expect(read).not.toHaveBeenCalled();
      expect((await nativeFetch(base + query, { headers })).status).toBe(503);
      datasetId = ALPACA_REGULAR_FOUR_HOUR_DATASET;
      const response = await nativeFetch(base + query, { headers });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ bars: [bar], acceptedInput: { datasetId, sessionMode: "regular" } });
      const candleUrl = gatewayWireUrl(base.split("/history?")[0], "accepted-input-candle",
        new URLSearchParams({ id: body.acceptedInput.id }));
      expect((await nativeFetch(candleUrl)).status).toBe(401);
      const candleResponse = await nativeFetch(candleUrl, { headers });
      expect(decodeGatewayWire("accepted-input-candle", await candleResponse.json())).toEqual({
        input: body.acceptedInput, row: [start, end, bar.open, bar.high, bar.low, bar.close, bar.volume],
      });
      expect(read).toHaveBeenLastCalledWith({
        symbol: "AAPL", timeframe: "4Hour", start, end, acceptedEvidence: true, sessionMode: "regular",
      }, expect.any(AbortSignal));
      expect(upstream).not.toHaveBeenCalled();
    } finally {
      gateway.close();
      gateway.server.closeAllConnections();
    }
  });

  it("serves native 4H and optional Daily history when the Levels verifier is enabled", async () => {
    const client = globalThis.fetch;
    const start = Date.parse("2026-11-20T05:00:00Z");
    const end = start + 86_400_000;
    const timeframes: string[] = [];
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async input => {
      const url = new URL(String(input));
      if (url.pathname === "/v2/calendar") return Response.json([]);
      timeframes.push(url.searchParams.get("timeframe")!);
      return Response.json({ bars: { AAPL: [{ t: new Date(start).toISOString(), o: 9, h: 11, l: 8, c: 10, v: 100 }] } });
    }));
    const verifier = vi.fn(async () => undefined);
    const gateway = createAlpacaGateway({
      keyId: "fixture-key", secretKey: "fixture-secret", token: "fixture-token", readVerifiedLevelsHistory: verifier,
    });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/history?`;
    const query = new URLSearchParams({
      symbol: "AAPL", timeframe: "4Hour", start: String(start), end: String(end), acceptedEvidence: "1",
    });
    const headers = { Authorization: "Bearer fixture-token" };
    try {
      const native = await client(base + query, { headers });
      expect(native.status).toBe(200);
      expect(await native.json()).toMatchObject({ bars: [{ time: start / 1_000, close: 10 }] });
      expect(verifier).not.toHaveBeenCalled();
      query.set("sessionMode", "regular");
      expect((await client(base + query, { headers })).status).toBe(503);
      expect(timeframes).toEqual(["4Hour"]);
      query.delete("sessionMode");
      query.set("timeframe", "1Day");
      const daily = await client(base + query, { headers });
      expect(daily.status).toBe(200);
      const body = await daily.json();
      expect(body).toMatchObject({ bars: [{ time: start / 1_000, close: 10 }] });
      expect(body).not.toHaveProperty("acceptedInput");
      expect(timeframes).toEqual(["4Hour", "1Day"]);
      expect(verifier).toHaveBeenCalledTimes(2);
    } finally {
      gateway.close();
      gateway.server.closeAllConnections();
    }
  });

  it("binds pending Daily and 4H history to the exact requested windows and discards a cancelled qualification", async () => {
    const nativeFetch = globalThis.fetch;
    const start = Date.parse("2026-11-20T14:30:00Z");
    const end = Date.parse("2026-11-20T21:00:00Z");
    const upstream = vi.fn<typeof fetch>(async input => {
      const url = new URL(String(input));
      if (url.pathname === "/v2/calendar") return Response.json([]);
      expect(url.pathname).toBe("/v2/stocks/bars");
      expect(url.searchParams.get("symbols")).toBe("AAPL");
      return Response.json({
        bars: { AAPL: [{ t: new Date(start).toISOString(), o: 9, h: 11, l: 8, c: 10, v: 100 }] },
        next_page_token: null,
      });
    });
    vi.stubGlobal("fetch", upstream);
    const pending = new Map<number, ReturnType<typeof Promise.withResolvers<QualifiedInputSeries>>>();
    const captured: AlpacaHistoryRequest[] = [];
    const cancelled = Promise.withResolvers<void>();
    const publish = vi.spyOn(AcceptedSeriesPublisher.prototype, "publish");
    const gateway = createAlpacaGateway({
      keyId: "fixture-key", secretKey: "fixture-secret", token: "fixture-token",
      qualifyHistory: async (request, _, signal) => {
        const result = Promise.withResolvers<QualifiedInputSeries>();
        pending.set(request.end, result);
        captured.push(request);
        if (request.end === end + 2) signal.addEventListener("abort", () => cancelled.resolve(), { once: true });
        return result.promise;
      },
    });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
    const headers = { Authorization: "Bearer fixture-token" };
    const history = (timeframe: "1Day" | "4Hour", until: number, signal?: AbortSignal) => {
      const query = new URLSearchParams({ symbol: "AAPL", timeframe, start: String(start), end: String(until), acceptedEvidence: "1" });
      return nativeFetch(base + "history?" + query, { headers, signal });
    };
    const qualified = (frame: "daily" | "4h"): QualifiedInputSeries => ({
      symbol: "AAPL", instrumentId: "fixture-listing", venue: "NASDAQ", frame,
      datasetId: `fixture-${frame}`, priceBasisId: "fixture-basis", calendarRevision: "fixture-calendar",
      sessionMode: "regular", completedThroughMs: end, acceptedCutoffMs: end, availableAtMs: end,
      rows: [[start, end, 9, 11, 8, 10, 100]],
    });
    try {
      const daily = history("1Day", end);
      const intraday = history("4Hour", end + 1);
      const abort = new AbortController();
      const abandoned = history("4Hour", end + 2, abort.signal).catch(error => error);
      await vi.waitFor(() => expect(pending.size).toBe(3));
      expect(captured).toEqual(expect.arrayContaining([
        { symbol: "AAPL", timeframe: "1Day", start, end, acceptedEvidence: true },
        { symbol: "AAPL", timeframe: "4Hour", start, end: end + 1, acceptedEvidence: true },
      ]));
      expect(publish).not.toHaveBeenCalled();
      abort.abort();
      expect((await abandoned).name).toBe("AbortError");
      await cancelled.promise;
      pending.get(end + 2)!.resolve({ ...qualified("4h"), upstreamRevision: "abandoned" });
      pending.get(end)!.resolve(qualified("daily"));
      pending.get(end + 1)!.resolve(qualified("4h"));
      const dailyBody = await (await daily).json();
      const intradayBody = await (await intraday).json();
      expect(dailyBody.acceptedInput).toMatchObject({ frame: "daily", datasetId: "fixture-daily" });
      expect(intradayBody.acceptedInput).toMatchObject({ frame: "4h", datasetId: "fixture-4h" });
      const lookup = await nativeFetch(base + "accepted-input?id=" + intradayBody.acceptedInput.id, { headers });
      expect(await lookup.json()).toEqual(intradayBody.acceptedInput);
      expect(publish).toHaveBeenCalledTimes(2);
    } finally {
      gateway.close();
      gateway.server.closeAllConnections();
      publish.mockRestore();
    }
  });

  it("serves a cached exclusion list without treating broker restrictions as listing removals", async () => {
    const nativeFetch = globalThis.fetch;
    const upstream = vi.fn(async (url: string) => {
      expect(new URL(url).pathname).toBe("/v2/assets");
      return Response.json([
        {symbol:"OTCM",exchange:"OTC",status:"active",tradable:false},
        {symbol:"NXXT",exchange:"NASDAQ",status:"active",tradable:false},
        {symbol:"OLD",exchange:"NYSE",status:"inactive",tradable:false},
        {symbol:"OMH",exchange:"NASDAQ",status:"active",tradable:false},
        {symbol:"SMX",exchange:"NASDAQ",status:"inactive",tradable:false},
        {symbol:"SMX",exchange:"NASDAQ",status:"active",tradable:true},
      ]);
    });
    vi.stubGlobal("fetch",upstream);
    const gateway = createAlpacaGateway({keyId:"test",secretKey:"test",token:"test"});
    await new Promise<void>(resolve => gateway.server.listen(0,"127.0.0.1",resolve));
    try {
      const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/scanner-listings`;
      expect((await nativeFetch(url)).status).toBe(401);
      const request = () => nativeFetch(url,{headers:{Authorization:"Bearer test"}}).then(response => response.json());
      expect(await Promise.all([request(),request()])).toEqual([
        {excluded:["OTCM","OLD"]},{excluded:["OTCM","OLD"]},
      ]);
      expect(upstream).toHaveBeenCalledTimes(1);
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });

  it("shares one upstream socket and closes it after the last chart disconnects", async () => {
    const sockets: FakeSocket[] = [];
    class FakeSocket extends EventTarget {
      static OPEN = 1;
      readyState = 1;
      sent: { action: string; bars?: string[] }[] = [];
      constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
      message(data: unknown) { this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(data) })); }
      send(value: string) {
        const command = JSON.parse(value); this.sent.push(command);
        if (command.action === "auth") queueMicrotask(() => this.message([{ T: "success", msg: "authenticated" }]));
        if (command.action === "subscribe") queueMicrotask(() => this.message([{ T: "subscription" }]));
      }
      close = vi.fn(() => { this.readyState = 3; this.dispatchEvent(new Event("close")); });
    }
    vi.stubGlobal("WebSocket", FakeSocket);
    const gateway = createAlpacaGateway({ keyId: "key", secretKey: "secret", token: "test-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAPL`;
    const auth = { headers: { Authorization: "Bearer test-token" } };
    try {
      const first = await fetch(url, auth), second = await fetch(url, auth);
      expect(sockets).toHaveLength(1);
      await first.body!.cancel();
      await vi.waitFor(() => expect(sockets[0].sent.some(command => command.action === "subscribe")).toBe(true));
      expect(sockets[0].close).not.toHaveBeenCalled();
      const reader = second.body!.getReader();
      sockets[0].message([{ T: "u", S: "AAPL", t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 123 }]);
      let output = "";
      while (!output.includes('"volume":123')) output += new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain("event: bar"); expect(output).toContain('"daily":false');
      await reader.cancel();
      await vi.waitFor(() => expect(sockets[0].close).toHaveBeenCalledOnce());
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
  it("denies unauthenticated requests before provider access, validates symbols, caches history and masks provider errors", async () => {
    const nativeFetch = globalThis.fetch;
    const calendarRows = Array.from({ length: 365 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, index + 1));
      return { date: date.toISOString().slice(0, 10), open: "09:30", close: "16:00", weekday: date.getUTCDay() };
    }).filter(row => row.weekday !== 0 && row.weekday !== 6).map(({ date, open, close }) => ({ date, open, close }));
    const marketData = vi.fn<typeof fetch>(async () => Response.json({ bars: { AAPL: [{ t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }] } }));
    const calendar = vi.fn<typeof fetch>(async () => Response.json(calendarRows));
    const provider = vi.fn<typeof fetch>(async (input, init) => {
      const requested = new URL(String(input));
      if (requested.hostname === "data.alpaca.markets" && requested.pathname === "/v2/stocks/bars") return marketData(input, init);
      if (requested.hostname === "paper-api.alpaca.markets" && requested.pathname === "/v2/calendar") return calendar(input, init);
      throw Error("unexpected_test_provider_request");
    });
    vi.stubGlobal("fetch", provider);
    const gateway = createAlpacaGateway({ keyId: "private-key", secretKey: "private-secret", token: "test-gateway-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
    const auth = { headers: { Authorization: "Bearer test-gateway-token" } };
    try {
      expect((await nativeFetch(`${url}/bars?symbol=AAPL`)).status).toBe(401);
      expect(provider).not.toHaveBeenCalled();
      expect((await nativeFetch(`${url}/bars?symbol=../AAPL`, auth)).status).toBe(400);
      expect(provider).not.toHaveBeenCalled();
      const response = await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.bars).toHaveLength(1); expect(result.feed).toBe("sip"); expect(result.adjustment).toBe("split");
      expect(result.calendar).toEqual({ available: true, start: "2026-01-01", end: "2026-12-31", sessions: calendarRows });
      const repeated = await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(repeated.status).toBe(200);
      expect(await repeated.json()).toEqual(result);
      expect(marketData).toHaveBeenCalledTimes(1);
      expect(calendar).toHaveBeenCalledTimes(1);
      expect(provider).toHaveBeenCalledTimes(2);
      const calendarRequest = new URL(String(calendar.mock.calls[0][0]));
      expect(calendarRequest.searchParams.get("start")).toBe("2026-01-01");
      expect(calendarRequest.searchParams.get("end")).toBe("2026-12-31");
      const requested = new URL(String(marketData.mock.calls[0][0]));
      expect(requested.hostname).toBe("data.alpaca.markets");
      expect(requested.searchParams.get("feed")).toBe("sip");
      expect(requested.searchParams.get("adjustment")).toBe("split");
      expect(requested.searchParams.get("sort")).toBe("desc");
      marketData.mockImplementationOnce(async () => { throw Error("private-secret"); });
      const failed = await nativeFetch(`${url}/bars?symbol=MSFT`, auth);
      expect(failed.status).toBe(502);
      expect(await failed.text()).not.toContain("private-secret");
      expect(marketData).toHaveBeenCalledTimes(2);
      expect(calendar).toHaveBeenCalledTimes(1);
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
  it("streams the open candle and volume from trades before any completed minute bar", async () => {
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ trades: { AAA: [] } })));
    const sockets: FakeSocket[] = [];
    class FakeSocket extends EventTarget {
      static OPEN=1; readyState=1;
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));if(command.action==="subscribe")queueMicrotask(()=>this.message([{T:"subscription",trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const abort=new AbortController();
    try{
      const response=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAA`,{headers:{Authorization:"Bearer test"},signal:abort.signal});
      const priceResponse=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/prices`,{method:"POST",headers:{Authorization:"Bearer test","Content-Type":"application/json"},body:JSON.stringify({symbols:["AAA","BBB"]}),signal:abort.signal});
      expect(priceResponse.status).toBe(200);
      const priceReader=priceResponse.body!.getReader();
      const dailyResponse=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAA&daily=1`,{headers:{Authorization:"Bearer test"},signal:abort.signal});
      const dailyReader=dailyResponse.body!.getReader();
      const reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      const timestamp=new Date().toISOString();
      sockets[0].message([{T:"t",S:"AAA",i:1,x:"V",p:2,s:100,t:timestamp,c:["@"],z:"C"}]);
      let output="";
      while(!output.includes('"provisional":true'))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain('event: price');expect(output).toContain('"price":2');expect(output).toContain('"volume":100');expect(output).toContain('"close":2');
      expect(sockets).toHaveLength(1);
      let prices="";
      while(!prices.includes('"price":2'))prices+=new TextDecoder().decode((await priceReader.read()).value);
      expect(prices).toContain('"protocolVersion":1');expect(prices).toContain('"providerObservedAt":"'+timestamp+'"');
      let daily="";while(!daily.includes('"provisional":true'))daily+=new TextDecoder().decode((await dailyReader.read()).value);
      expect(daily).toContain('"daily":true');expect(daily).toContain('"close":2');expect(daily).toContain('"volume":100');
      await reader.cancel();expect(sockets[0].readyState).toBe(1);
      await dailyReader.cancel();expect(sockets[0].readyState).toBe(1);
      await priceReader.cancel();
      await vi.waitFor(()=>expect(sockets[0].readyState).toBe(3));
    }finally{abort.abort();gateway.close();gateway.server.closeAllConnections();}
  });

  it("subscribes to halt status on the existing SIP socket without needing an open chart", async () => {
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({trades:{OMH:[]}})));
    const sockets: FakeSocket[]=[];
    class FakeSocket extends EventTarget {
      static OPEN=1;readyState=1;sent:Record<string,unknown>[]=[];
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);this.sent.push(command);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe")queueMicrotask(()=>this.message([{T:"subscription",statuses:command.statuses,trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/halts`;
    const auth={headers:{Authorization:"Bearer test"}};
    let chartReader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    try{
      await vi.waitFor(()=>expect(sockets[0]?.sent.some(command=>Array.isArray(command.statuses)&&command.statuses.includes("*"))).toBe(true));
      const chartResponse=await nativeFetch(url.replace("/halts","/stream?symbol=OMH"),auth);chartReader=chartResponse.body!.getReader();
      sockets[0].message([{T:"s",S:"OMH",sc:"H",rc:"LUDP",rm:"Pause",z:"C",t:"2026-11-09T16:20:00Z"}]);
      let chartEvents="";while(!chartEvents.includes('"halted":true'))chartEvents+=new TextDecoder().decode((await chartReader.read()).value);
      expect(chartEvents).toContain("event: trading-status");
      const paused=await (await nativeFetch(url,auth)).json();
      expect(paused).toMatchObject({connected:true,statusesSubscribed:true,statuses:[{symbol:"OMH",halted:true}]});
      sockets[0].message([{T:"s",S:"OMH",sc:"Q",z:"C",t:"2026-11-09T16:24:00Z"}]);
      expect((await (await nativeFetch(url,auth)).json()).statuses[0].halted).toBe(true);
      sockets[0].message([{T:"s",S:"OMH",sc:"T",z:"C",t:"2026-11-09T16:25:00Z"}]);
      expect((await (await nativeFetch(url,auth)).json()).statuses[0].halted).toBe(false);
      expect(sockets).toHaveLength(1);
      expect((await nativeFetch(url)).status).toBe(401);
    }finally{await chartReader?.cancel();gateway.close();gateway.server.closeAllConnections();}
  });

  it.each([409,410])("keeps prices running when the isolated status subscription is rejected with %i", async code=>{
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({})));
    const sockets:FakeSocket[]=[];
    class FakeSocket extends EventTarget{
      static OPEN=1;readyState=1;
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe")queueMicrotask(()=>this.message(command.statuses?[{T:"error",code,msg:"status subscription unavailable"}]:[{T:"subscription",statuses:[],trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`,headers={Authorization:"Bearer test"};
    const abort=new AbortController();
    try{
      const response=await nativeFetch(url+"/prices",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({symbols:["AAA"]}),signal:abort.signal});
      const reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      const status=await(await nativeFetch(url+"/halts",{headers})).json();
      expect(status).toMatchObject({connected:true,statusesSubscribed:false});expect(sockets[0].readyState).toBe(1);
      sockets[0].message([{T:"t",S:"AAA",i:1,x:"V",p:2,s:100,t:new Date().toISOString(),c:["@"],z:"C"}]);
      let output="";while(!output.includes('"price":2'))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain('"connected":true');
      sockets[0].message([{T:"error",code:402,msg:"auth failed"}]);
      expect(sockets[0].readyState).toBe(3);
      await reader.cancel();
    }finally{abort.abort();gateway.close();gateway.server.closeAllConnections();}
  });

  it.each(["appendFailure","corruptStartup"])("keeps prices healthy and hides unpersisted halt state after %s",async mode=>{
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({trades:{OMH:[]}})));
    const directory=mkdtempSync(join(tmpdir(),"alpaca-journal-boundary-")),journalPath=join(directory,"statuses.jsonl");
    const evidence=JSON.stringify({T:"s",S:"OMH",sc:"H",t:"2026-11-09T16:20:00Z",z:"C",rc:"LUDP",rm:"Pause"})+'\n{"T":"s"';
    if(mode==="corruptStartup")writeFileSync(journalPath,evidence,{mode:0o600});
    const appendMany=vi.fn(()=>{throw Error("simulated fsync failure");});
    const mock=mode==="appendFailure"?vi.spyOn(statusJournal,"openStatusJournal").mockReturnValue({append:vi.fn(),appendMany,close:vi.fn()}):null;
    const sockets:FakeSocket[]=[];
    class FakeSocket extends EventTarget{
      static OPEN=1;readyState=1;statuses:string[]=[];trades:string[]=[];
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe"){
          if(command.statuses)this.statuses=command.statuses;if(command.trades)this.trades=command.trades;
          queueMicrotask(()=>this.message([{T:"subscription",statuses:this.statuses,trades:this.trades}]));
        }}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca",haltStatusJournal:journalPath});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`,headers={Authorization:"Bearer test"};
    const abort=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    try{
      const response=await nativeFetch(url+"/stream?symbol=OMH",{headers,signal:abort.signal});reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      if(mode==="appendFailure")sockets[0].message([{T:"s",S:"OMH",sc:"H",t:"2026-11-09T16:20:00Z",z:"C",rc:"LUDP",rm:"Pause"},{T:"subscription",statuses:["*"],trades:["OMH"]}]);
      sockets[0].message([{T:"t",S:"OMH",i:1,x:"V",p:2,s:100,t:new Date().toISOString(),c:["@"],z:"C"}]);
      let output="";while(!output.includes("event: price"))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).not.toContain('"halted":true');expect(output).toContain('"price":2');
      expect(await(await nativeFetch(url+"/halts",{headers})).json()).toMatchObject({connected:true,statusesSubscribed:false});
      expect(sockets[0].readyState).toBe(1);
      if(mode==="appendFailure")expect(appendMany).toHaveBeenCalledOnce();
      else expect(readFileSync(journalPath,"utf8")).toBe(evidence);
    }finally{await reader?.cancel();abort.abort();gateway.close();gateway.server.closeAllConnections();mock?.mockRestore();rmSync(directory,{recursive:true,force:true});}
  });

});

it("enables and ends popular-only subscriptions through the owner archive control", async () => {
  const nativeFetch = globalThis.fetch;
  const directory = mkdtempSync(join(tmpdir(), "popular-archive-gateway-"));
  const sockets: TestSocket[] = [];
  class TestSocket extends EventTarget {
    static OPEN = 1;
    readyState = 1;
    sent: { action: string; bars?: string[]; updatedBars?: string[]; trades?: string[]; quotes?: string[] }[] = [];
    constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
    message(value: unknown) {
      this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify([value]) }));
    }
    send(value: string) {
      const command = JSON.parse(value) as TestSocket["sent"][number];
      this.sent.push(command);
      if (command.action === "auth") queueMicrotask(() => this.message({ T: "success", msg: "authenticated" }));
      if (command.action === "subscribe") queueMicrotask(() => this.message({ ...command, T: "subscription" }));
    }
    close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
  }
  vi.stubGlobal("WebSocket", TestSocket);
  vi.stubGlobal("fetch", vi.fn(async () => { throw Error("unexpected_provider_request"); }));
  const gateway = createAlpacaGateway({ keyId: "test", secretKey: "test", token: "gateway",
    candleHistory: { path: join(directory, "archive.sqlite"), adminToken: "admin-archive" } });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/candle-history/admin`;
  const headers = { Authorization: "Bearer gateway", "X-TraderLink-Candle-History-Admin": "admin-archive", "Content-Type": "application/json" };
  const write = (settings: unknown) => nativeFetch(url, { method: "PUT", headers, body: JSON.stringify({ settings, universe: [] }) });
  try {
    expect((await nativeFetch(url, { headers: { Authorization: "Bearer gateway" } })).status).toBe(404);
    const initial = await (await nativeFetch(url, { headers })).json();
    expect(initial.settings.popularTickers).toHaveLength(175);
    expect(initial.minuteState).toBe("off");
    expect(sockets).toHaveLength(0);
    const active = await (await write({ ...initial.settings, popularMinuteUpdates: true, popularTickers: ["SPY", "NVDA"] })).json();
    await vi.waitFor(() => expect(sockets[0].sent).toContainEqual({
      action: "subscribe", bars: ["SPY", "NVDA"], updatedBars: ["SPY", "NVDA"], trades: [], quotes: [], dailyBars: [],
    }));
    expect((await (await nativeFetch(url, { headers })).json()).minuteState).toBe("active");
    await write({ ...active.settings, popularMinuteUpdates: false });
    expect(sockets[0].sent).toContainEqual({ action: "unsubscribe", bars: ["SPY", "NVDA"], updatedBars: ["SPY", "NVDA"] });
    expect(sockets[0].readyState).toBe(3);
  } finally {
    gateway.close();
    gateway.server.closeAllConnections();
    await new Promise(resolve => setImmediate(resolve));
    rmSync(directory, { recursive: true, force: true });
  }
});
