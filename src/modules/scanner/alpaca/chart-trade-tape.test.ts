// @vitest-environment node
import type { AddressInfo } from "node:net";
import { afterEach, expect, it, vi } from "vitest";
import { ChartTradeTapeHub, type ChartTapeFrame } from "./chart-trade-tape";
import { createAlpacaGateway } from "./gateway";

const date = "2026-11-25";
const at = (time: string) => date + "T" + time + "Z";
const first = at("14:30:01.123456701");
const second = at("14:30:01.123456702");
const spike = at("14:32:00.000000001");
const reversal = at("14:32:00.000000002");
const regular = { date, open: "09:30", close: "16:00" };
const row = (i: number, t: string, p: number, c = ["@"]) => ({ i, t, p, c, z: "C", x: "V", s: 100 });
const trade = (i: number, t: string, p: number, c?: string[]) => ({ ...row(i, t, p, c), T: "t", S: "VIVS" });
const correction = { T: "c", S: "VIVS", t: reversal, x: "V", z: "C", oi: 3, op: 0.53, ci: 7, cp: 0.54, cc: ["@"] };
const cancel = { T: "x", S: "VIVS", t: reversal, x: "V", z: "C", i: 7, a: "C" };

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function providerCalendar() {
  return Array.from({ length: 365 }, (_, day) => new Date(Date.UTC(2026, 0, day + 1)))
    .filter(day => day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
    .map(day => ({ ...regular, date: day.toISOString().slice(0, 10) }));
}

function frameReader(response: Response) {
  const reader = response.body!.getReader();
  const decode = new TextDecoder();
  let buffer = "";
  async function next<T extends ChartTapeFrame["kind"]>(kind: T): Promise<Extract<ChartTapeFrame, { kind: T }>> {
    for (;;) {
      while (buffer.includes("\n\n")) {
        const boundary = buffer.indexOf("\n\n");
        const part = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (!part.startsWith("event: tape\ndata: ")) continue;
        const frame: ChartTapeFrame = JSON.parse(part.slice("event: tape\ndata: ".length));
        if (frame.kind === kind) return frame as Extract<ChartTapeFrame, { kind: T }>;
        throw Error("Unexpected tape frame: " + frame.kind);
      }
      const chunk = await reader.read();
      if (chunk.done) throw Error("Tape closed early");
      buffer += decode.decode(chunk.value, { stream: true });
    }
  }
  return { next, close: () => reader.cancel() };
}

function fixtureWebSocket(sockets: Array<EventTarget & { emit(...messages: unknown[]): void; close(): void }>) {
  return class FixtureWebSocket extends EventTarget {
    static OPEN = 1;
    readyState = 1;
    constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
    emit(...messages: unknown[]) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(messages) })); }
    send(json: string) {
      const data = JSON.parse(json);
      if (data.action === "auth") queueMicrotask(() => this.emit({ T: "success", msg: "authenticated" }));
      if (data.action === "subscribe") queueMicrotask(() => this.emit({ T: "subscription", trades: data.trades,
        corrections: data.trades, cancelErrors: data.trades, bars: data.bars, updatedBars: data.updatedBars }));
    }
    close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
  };
}

it("streams authenticated paged history joined to the live spike, then recovers correction, cancel and transport loss", async () => {
  const nativeFetch = globalThis.fetch;
  const sockets: Array<EventTarget & { emit(...messages: unknown[]): void; close(): void }> = [];
  vi.stubGlobal("WebSocket", fixtureWebSocket(sockets));
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(at("14:31:00")));
  const queries: URL[] = [];
  let release!: () => void;
  const holdFirstPage = new Promise<void>(resolve => { release = resolve; });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async input => {
    const url = new URL(String(input));
    if (url.pathname === "/v2/calendar") return Response.json(providerCalendar());
    expect(url.pathname).toBe("/v2/stocks/trades");
    expect(url.searchParams.get("feed")).toBe("sip");
    expect(url.searchParams.get("symbols")).toBe("VIVS");
    queries.push(url);
    if (queries.length === 1) await holdFirstPage;
    if (url.searchParams.get("page_token") === "two") {
      return Response.json({ trades: { VIVS: [row(2, second, 0.51)] }, next_page_token: null });
    }
    if (queries.length === 1) return Response.json({ trades: { VIVS: [row(1, first, 0.50)] }, next_page_token: "two" });
    return Response.json({ trades: { VIVS: [row(1, first, 0.50), row(2, second, 0.51), row(3, spike, 0.53),
      row(4, reversal, 0.50), row(6, at("14:32:01.001"), 0.55), row(8, at("14:33:00.000000001"), 0.57)] }, next_page_token: null });
  }));
  const gateway = createAlpacaGateway({ keyId: "fixture", secretKey: "fixture", token: "fixture" });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const path = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/chart-trades/stream?symbol=VIVS`;
  const signal = AbortSignal.timeout(8_000);
  try {
    expect((await nativeFetch(path, { signal })).status).toBe(401);
    const headers = { Authorization: "Bearer fixture" };
    expect((await nativeFetch(path + "&symbol=AKAN", { headers, signal })).status).toBe(400);
    expect(queries).toHaveLength(0);
    const reply = await nativeFetch(path, { headers, signal });
    expect(reply.headers.get("content-type")).toBe("text/event-stream");
    const browser = frameReader(reply);
    await vi.waitFor(() => expect(queries).toHaveLength(1), { timeout: 2_000 });
    expect(queries[0].searchParams.get("end")).toBe(at("14:31:00.000"));
    vi.setSystemTime(new Date(at("14:32:01")));
    sockets[0].emit(trade(2, second, 0.51), trade(3, spike, 0.53), trade(4, reversal, 0.50), trade(5, at("14:32:01"), 4, ["I"]));
    release();
    const seeded = await browser.next("snapshot");
    expect(seeded).toMatchObject({ symbol: "VIVS", date, session: "regular", feed: "sip", start: at("14:30:00.000"),
      cutoff: at("14:31:00.000"), through: 4, trades: [
        { position: 1, time: first, price: 0.50 }, { position: 2, time: second, price: 0.51 },
        { position: 3, time: spike, price: 0.53 }, { position: 4, time: reversal, price: 0.50 },
      ] });
    sockets[0].emit(trade(6, at("14:32:01.001"), 0.55));
    expect(await browser.next("batch")).toMatchObject({ stream: seeded.stream, after: 4, through: 5,
      trades: [{ position: 5, time: at("14:32:01.001"), price: 0.55 }] });
    sockets[0].emit(correction);
    expect(await browser.next("reset")).toEqual({ kind: "reset", stream: seeded.stream });
    const corrected = await browser.next("snapshot");
    expect(corrected.stream).not.toBe(seeded.stream);
    expect(corrected.trades[2]).toEqual({ position: 3, time: spike, price: 0.54 });
    sockets[0].emit(cancel);
    expect(await browser.next("reset")).toEqual({ kind: "reset", stream: corrected.stream });
    const cancelled = await browser.next("snapshot");
    expect(cancelled.trades.map(item => item.price)).toEqual([0.5, 0.51, 0.5, 0.55]);

    vi.setSystemTime(new Date(at("14:34:01")));
    sockets[0].close();
    expect(await browser.next("reset")).toEqual({ kind: "reset", stream: cancelled.stream });
    const recovered = await browser.next("snapshot");
    expect(recovered.stream).not.toBe(cancelled.stream);
    expect(recovered.trades.map(item => item.price)).toEqual([0.5, 0.51, 0.5, 0.55, 0.57]);
    const repeat = frameReader(await nativeFetch(path, { headers, signal }));
    expect(await repeat.next("snapshot")).toEqual(recovered);
    expect(queries).toHaveLength(3);
    await repeat.close();
    await browser.close();
  } finally { release(); gateway.close(); gateway.server.closeAllConnections(); }
}, 10_000);

it("delivers a full warm snapshot larger than the pending-write limit", async () => {
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal("WebSocket", fixtureWebSocket([]));
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(at("16:30:00")));
  const trades = Array.from({ length: 8_000 }, (_, index) => row(index + 1,
    new Date(Date.parse(at("14:30:01")) + index).toISOString(), 0.5 + (index % 4) * 0.01));
  let requests = 0;
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async input => {
    if (new URL(String(input)).pathname === "/v2/calendar") return Response.json(providerCalendar());
    requests++;
    return Response.json({ trades: { VIVS: trades }, next_page_token: null });
  }));
  const gateway = createAlpacaGateway({ keyId: "fixture", secretKey: "fixture", token: "fixture" });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const path = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/chart-trades/stream?symbol=VIVS`;
  const options = { headers: { Authorization: "Bearer fixture" }, signal: AbortSignal.timeout(5_000) };
  try {
    const cold = frameReader(await nativeFetch(path, options));
    const full = await cold.next("snapshot");
    expect(full.through).toBe(trades.length);
    expect(Buffer.byteLength(JSON.stringify(full))).toBeGreaterThan(256_000);
    const warm = frameReader(await nativeFetch(path, options));
    expect(await warm.next("snapshot")).toEqual(full);
    expect(requests).toBe(1);
    await warm.close();
    await cold.close();
  } finally {
    gateway.close();
    gateway.server.closeAllConnections();
  }
}, 8_000);

it.each([
  { reply: { trades: { VIVS: [] }, next_page_token: "repeated" }, status: "unavailable", calls: 2 },
  { reply: { trades: { VIVS: [] }, next_page_token: null }, status: "closed", calls: 0 },
])("withholds a snapshot when the regular session is $status", async ({ reply, status, calls }) => {
  const tape = vi.fn();
  const notify = vi.fn();
  const get = vi.fn(async () => reply);
  const forYear = vi.fn(async () => ({ available: true as const, start: "2026-01-01", end: "2026-12-31", sessions: [regular] }));
  const now = Date.parse(at(status === "closed" ? "14:15:00" : "14:32:00"));
  const hub = new ChartTradeTapeHub({ get }, { forYear }, () => {}, () => now);
  try {
    hub.attach("VIVS", { tape, status: notify, close: () => {} });
    hub.acknowledge(["VIVS"], [], ["VIVS"]);
    expect(get).not.toHaveBeenCalled();
    expect(forYear).not.toHaveBeenCalled();
    hub.acknowledge(["VIVS"], ["VIVS"], ["VIVS"]);
    await vi.waitFor(() => expect(notify).toHaveBeenCalledWith(status), { timeout: 1_500 });
    expect(get).toHaveBeenCalledTimes(calls);
    expect(tape).not.toHaveBeenCalled();
  } finally { hub.close(); }
});

it("preserves source order at equal nanoseconds, resets on a late trade and respects the early close", async () => {
  const tape = vi.fn<(frame: ChartTapeFrame) => void>();
  const justBeforeClose = at("17:59:59.999999999");
  const get = vi.fn(async () => ({ trades: { VIVS: [row(9, first, 0.5), row(2, first, 0.53),
    row(3, justBeforeClose, 0.5), row(4, at("18:00:00"), 2)] }, next_page_token: null }));
  const forYear = vi.fn(async () => ({ available: true as const, start: "2026-01-01", end: "2026-12-31",
    sessions: [{ ...regular, close: "13:00" }] }));
  const hub = new ChartTradeTapeHub({ get }, { forYear }, () => {}, () => Date.parse(at("18:15:00")));
  try {
    hub.attach("VIVS", { tape, status: () => {}, close: () => {} });
    hub.acknowledge(["VIVS"], ["VIVS"], ["VIVS"]);
    await vi.waitFor(() => expect(tape).toHaveBeenCalledOnce());
    const seeded = tape.mock.calls[0][0];
    expect(seeded).toMatchObject({ kind: "snapshot", cutoff: at("18:00:00.000"), through: 3, trades: [
      { price: 0.5 }, { price: 0.53 }, { time: justBeforeClose, price: 0.5 },
    ] });
    hub.observe(trade(10, second, 0.52));
    hub.observe(trade(11, at("18:00:00.000000001"), 3));
    hub.tick();
    expect(tape.mock.calls[1][0]).toEqual({ kind: "reset", stream: seeded.stream });
    expect(tape.mock.calls[2][0]).toMatchObject({ kind: "snapshot", through: 4, trades: [
      { price: 0.5 }, { price: 0.53 }, { time: second, price: 0.52 }, { time: justBeforeClose, price: 0.5 },
    ] });
    hub.observe({ ...correction, oi: 9, op: 0.5, ci: 13, cp: 0.49 });
    hub.tick();
    expect(tape.mock.calls[4][0]).toMatchObject({ kind: "snapshot", through: 4, trades: [
      { time: first, price: 0.49 }, { time: first, price: 0.53 }, { time: second, price: 0.52 }, { time: justBeforeClose, price: 0.5 },
    ] });
    expect(get).toHaveBeenCalledOnce();
  } finally { hub.close(); }
});
