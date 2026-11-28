import { EventEmitter } from "node:events";
import type WebSocket from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { readWorkspaceMoomooAccess, WorkspaceMoomooConnection } from "./server/workspace-moomoo-access";
import { workspaceMoomooChartResponse } from "./server/workspace-moomoo-chart-response";
import { workspaceMoomooChartEvents, WorkspaceMoomooChartStream } from "./server/workspace-moomoo-chart-stream";
import * as correctionNotices from "./server/moomoo-correction-notices";
import * as alpacaClient from "@/src/modules/scanner/alpaca/client";
import { MoomooMarketDataRateLimit } from "./server/moomoo-bridge";

const now = Date.parse("2026-11-24T15:20:00Z");
const generation = "b".repeat(64);
const candle = (time: string) => ({ time_key: Date.parse(time), open: 2, high: 3, low: 1, close: 2.5, volume: 600 });
type Access = NonNullable<ReturnType<typeof readWorkspaceMoomooAccess>>;
let accountSequence = 0;
const users = new WeakMap<WorkspaceMoomooConnection, string>();
const access = (connection: WorkspaceMoomooConnection | null, userId = connection ? users.get(connection) : undefined) =>
  ({ connection, identity: { scope: { userId, workspaceId: "workspace" } } }) as Access;
const req = (query = "", active = generation) =>
  new Request(`https://charts.test/api/trading-workspace/broker/charts?generation=${active}${query}`);

function fixture() {
  let allowed = true;
  const connection: WorkspaceMoomooConnection = {
    generation, current: () => allowed, accessToken: vi.fn(async () => "synthetic-quote-token"),
    request: vi.fn(async input => {
      switch (input.operation) {
        case "history": return { data: { kline_list: [candle("2026-11-23T15:15:00Z"), candle("2026-11-24T15:15:00Z")] } };
        case "rehab": return { data: { rehabs: [{ action_types: ["SPLIT"], ex_div_date: "2026-11-24", split_ratio: 2 }] } };
        case "calendar": return { data: { trading_days: ["2026-11-23", "2026-11-24"]
          .filter(time => time >= input.start && time <= input.end).map(time => ({ time, trade_date_type: "WHOLE" })) } };
        default: throw Error("unexpected fixture operation");
      }
    }),
  };
  users.set(connection, "account-" + ++accountSequence);
  return { connection, revoke: () => { allowed = false; } };
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("broker Workspace chart reads", () => {
  it("separates denied, disconnected and stale generations before any provider request", async () => {
    const { connection } = fixture();
    expect((await workspaceMoomooChartResponse(req(), "provider", null)).status).toBe(403);
    expect(await (await workspaceMoomooChartResponse(req(), "provider", access(null))).json()).toMatchObject({ generation: null });
    expect((await workspaceMoomooChartResponse(req("&symbol=SAFX&history=1", "a".repeat(64)), "bars", access(connection))).status).toBe(409);
    expect((await workspaceMoomooChartResponse(req("&symbol=SAFX&history=1&archive=1"), "bars", access(connection))).status).toBe(400);
    expect(connection.request).not.toHaveBeenCalled();
  });

  it("uses the scoped connection for history, split markers, calendar and catch-up", async () => {
    vi.useFakeTimers({ now });
    const { connection } = fixture();
    const data = async (resource: string, query: string) => {
      const response = await workspaceMoomooChartResponse(req(query), resource, access(connection));
      expect(response.status).toBe(200);
      return response.json();
    };
    const split = await data("bars", "&symbol=SAFX&history=1&daily=0&recent=1");
    expect(split.bars.map((bar: { close: number }) => bar.close)).toEqual([5, 2.5]);
    expect(split.adjustment).toBe("split");
    const raw = await data("bars", "&symbol=SAFX&history=1&daily=0&adjustment=raw");
    expect(raw.bars.map((bar: { close: number }) => bar.close)).toEqual([2.5, 2.5]);
    expect(raw.adjustment).toBe("raw");
    const from = now - 10 * 60_000;
    const recovery = await data("bars", `&symbol=SAFX&history=1&daily=0&catchUpFrom=${from}`);
    expect(recovery).toMatchObject({ catchUpFrom: from, bars: [{ close: 2.5 }] });
    expect((await data("splits", "&symbol=SAFX")).splits).toEqual([{ id: "2026-11-24", date: "2026-11-24", oldShares: 2, newShares: 1 }]);
    expect((await data("calendar", "&year=2026")).sessions).toHaveLength(2);
    const seed = await data("vwap-seed", `&symbol=SAFX&timeframe=15m&anchor=Session&before=${now / 1000}&premarket=0&regular=1&postmarket=0`);
    expect(seed).toMatchObject({ complete: true, basisDate: "2026-11-24", volume: 600 });
  });

  it("returns the valid POM candles from a partial page and retries the affected range", async () => {
    vi.useFakeTimers({ now });
    const { connection } = fixture();
    const load = vi.mocked(connection.request);
    const older = candle("2026-11-23T15:15:00Z");
    const invalid = { ...candle("2026-11-24T15:15:00Z"), high: 1.5 };
    load.mockImplementationOnce(async () => ({ data: { kline_list: [older, invalid] } }));
    const read = () => workspaceMoomooChartResponse(
      req("&symbol=POM&history=1&adjustment=raw&before=" + Date.parse("2026-11-24T15:17:00Z")), "bars", access(connection),
    );
    const partial = await read();
    expect(partial.status).toBe(200);
    expect(await partial.json()).toMatchObject({ complete: false, bars: [{ close: 2.5 }] });
    const recovered = await read();
    expect(recovered.status).toBe(200);
    const data = await recovered.json();
    expect(data.complete).toBe(true);
    expect(data.bars).toHaveLength(2);
    expect(load.mock.calls.filter(([input]) => input.operation === "history")).toHaveLength(2);
  });

  it("refuses a response if access changes while provider history is pending", async () => {
    const { connection, revoke } = fixture();
    vi.mocked(connection.request).mockImplementationOnce(async () => {
      revoke();
      return { data: { kline_list: [] } };
    });
    const response = await workspaceMoomooChartResponse(req("&symbol=SAFX&history=1&adjustment=raw"), "bars", access(connection));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "broker_connection_changed" });
  });

  it("reuses only covered windows in the same account and applies current corporate actions on each read", async () => {
    vi.useFakeTimers({ now });
    const first = fixture();
    const second = fixture();
    let splitRatio = 2;
    const original = vi.mocked(first.connection.request).getMockImplementation()!;
    vi.mocked(first.connection.request).mockImplementation(async (input, signal) => input.operation === "rehab"
      ? { data: { rehabs: [{ action_types: ["SPLIT"], ex_div_date: "2026-11-24", split_ratio: splitRatio }] } }
      : original(input, signal));
    const query = req("&symbol=SAFX&history=1&before=" + Date.parse("2026-11-24T15:17:00Z"));
    const read = (connection: WorkspaceMoomooConnection) => workspaceMoomooChartResponse(query, "bars", access(connection));
    expect((await (await read(first.connection)).json()).bars[0].close).toBe(5);
    splitRatio = 4;
    expect((await (await read(first.connection)).json()).bars[0].close).toBe(10);
    expect((await (await read(second.connection)).json()).bars[0].close).toBe(5);
    for (const { connection } of [first, second]) {
      expect(vi.mocked(connection.request).mock.calls.filter(([call]) => call.operation === "history")).toHaveLength(1);
    }
    const next = { ...first.connection, generation: "c".repeat(64) };
    users.set(next, users.get(first.connection)!);
    const reconnected = req("&symbol=SAFX&history=1&before=" + Date.parse("2026-11-24T15:17:00Z"), next.generation);
    expect((await workspaceMoomooChartResponse(reconnected, "bars", access(next))).status).toBe(200);
    expect(vi.mocked(next.request).mock.calls.filter(([call]) => call.operation === "history")).toHaveLength(2);
  });

  it("applies the latest raw history corrections to a warm account cache before split adjustment", async () => {
    vi.useFakeTimers({ now });
    const { connection } = fixture();
    const end = Date.parse("2026-11-24T15:17:00Z");
    const query = req("&symbol=SAFX&history=1&before=" + end);
    const oldMinute = Date.parse("2026-11-23T15:14:00Z") / 1000;
    const newMinute = Date.parse("2026-11-24T15:14:00Z") / 1000;
    const before = { time: oldMinute, open: 2, high: 38, low: 1, close: 2.5, volume: 601 };
    const evidence = vi.spyOn(alpacaClient, "readAlpacaTradeCorrectionEvidence").mockResolvedValueOnce(undefined)
      .mockResolvedValue({ symbol: "SAFX", feed: "sip", adjustment: "raw", generation: 2, rows: [
        { symbol: "SAFX", minute: oldMinute, before, bar: { ...before, high: 2.75, volume: 400 }, correctionRevision: 1 },
        { symbol: "SAFX", minute: newMinute, before: { ...before, time: newMinute }, bar: null, correctionRevision: 2 },
      ] });
    const read = () => workspaceMoomooChartResponse(query, "bars", access(connection));
    expect((await (await read()).json()).bars).toHaveLength(2);
    const corrected = await (await read()).json();
    expect(corrected.bars).toHaveLength(1);
    expect(corrected.bars[0]).toMatchObject({ high: 5.5, volume: 200 });
    expect(corrected.corrections).toEqual({ source: "alpaca-sip", times: [oldMinute, newMinute], pending: [] });
    expect(evidence).toHaveBeenCalledTimes(2);
    expect(evidence).toHaveBeenLastCalledWith(expect.objectContaining({ symbol: "SAFX", end: end + 1 }),
      expect.any(Object), expect.any(AbortSignal));
    expect(vi.mocked(connection.request).mock.calls.filter(([request]) => request.operation === "history")).toHaveLength(1);
  });

  it("replaces mismatched native daily history after the shared completed-day witness arrives", async () => {
    vi.useFakeTimers({ now });
    const { connection } = fixture();
    const end = Date.parse("2026-11-23T23:59:00Z");
    const day = Date.parse("2026-11-23T05:00:00Z") / 1000;
    const minute = Date.parse("2026-11-23T15:14:00Z") / 1000;
    const query = req("&symbol=SAFX&history=1&daily=1&before=" + end);
    const before = { time: day, open: 2, high: 38, low: 1, close: 2.5, volume: 601 };
    const wire: NonNullable<Awaited<ReturnType<typeof alpacaClient.readAlpacaTradeCorrectionEvidence>>> = { symbol: "SAFX", feed: "sip", adjustment: "raw", generation: 1, rows: [{
      symbol: "SAFX", minute, before: { ...before, time: minute }, bar: null, correctionRevision: 1,
    }] };
    const evidence = vi.spyOn(alpacaClient, "readAlpacaTradeCorrectionEvidence").mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(wire)
      .mockResolvedValue({ ...wire, nativeDays: [{ day, before, bar: { ...before, high: 2.75, volume: 400 } }] });
    const read = () => workspaceMoomooChartResponse(query, "bars", access(connection));
    expect((await (await read()).json()).bars[0]).toMatchObject({ high: 6, volume: 300 });
    const pending = await read();
    expect(pending.status).toBe(200);
    expect(await pending.json()).toMatchObject({
      bars: [], complete: false, corrections: { source: "alpaca-sip", times: [], pending: [day] },
    });
    const corrected = await (await read()).json();
    expect(corrected.bars[0]).toMatchObject({ high: 5.5, volume: 200 });
    expect(corrected.corrections).toEqual({ source: "alpaca-sip", times: [day], pending: [] });
    expect(evidence).toHaveBeenLastCalledWith(expect.objectContaining({ symbol: "SAFX", end: end + 1, daily: true, replayDaily: true }),
      expect.any(Object), expect.any(AbortSignal));
    expect(vi.mocked(connection.request).mock.calls.filter(([request]) => request.operation === "history")).toHaveLength(1);
  });

  it("returns a retry hint when REST is rate limited without touching the chart socket", async () => {
    const { connection } = fixture();
    const release = vi.fn();
    const subscribe = vi.spyOn(WorkspaceMoomooChartStream.prototype, "subscribe").mockReturnValue(release);
    const live = await workspaceMoomooChartResponse(req("&symbol=SAFX"), "stream", access(connection));
    vi.mocked(connection.request).mockRejectedValue(new MoomooMarketDataRateLimit("30"));
    const response = await workspaceMoomooChartResponse(req("&symbol=SAFX&history=1"), "bars", access(connection));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(await response.json()).toEqual({ error: "chart_requests_busy" });
    expect(subscribe).toHaveBeenCalledOnce();
    expect(release).not.toHaveBeenCalled();
    await live.body!.cancel();
    expect(release).toHaveBeenCalledOnce();
  });
});

class SocketFixture extends EventEmitter {
  readyState = 1;
  send = vi.fn();
  ping = vi.fn();
  close = vi.fn();
  packet(value: unknown) { this.emit("message", Buffer.from(JSON.stringify(value))); }
}

describe("broker Workspace candle socket", () => {
  it("publishes a revision hint without SIP prices and releases it on disconnect", async () => {
    const { connection, revoke } = fixture();
    const release = vi.fn();
    const stop = vi.fn();
    vi.spyOn(WorkspaceMoomooChartStream.prototype, "subscribe").mockReturnValue(release);
    const watch = vi.spyOn(correctionNotices, "watchMoomooCorrections").mockReturnValue(stop);
    const response = await workspaceMoomooChartResponse(req("&symbol=SAFX"), "stream", access(connection));
    const reader = response.body!.getReader();
    const notify = watch.mock.calls[0][1];
    const notice = { symbol: "SAFX", revision: "a".repeat(64), minutes: [Math.floor(now / 60_000) * 60] };
    notify(notice);
    const read = await reader.read();
    expect(new TextDecoder().decode(read.value)).toBe(`event: history-correction\ndata: ${JSON.stringify(notice)}\n\n`);
    revoke();
    notify(notice);
    expect(await reader.read()).toMatchObject({ done: true });
    expect(release).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("admits one ticker per account while both accounts can stream concurrently", async () => {
    vi.useFakeTimers({ now });
    const first = fixture();
    const second = fixture();
    const release = vi.fn();
    const subscribe = vi.spyOn(WorkspaceMoomooChartStream.prototype, "subscribe").mockReturnValue(release);
    const open = (connection: WorkspaceMoomooConnection, query: string, user?: string, signal?: AbortSignal) =>
      workspaceMoomooChartResponse(new Request(req(query, connection.generation), { signal }), "stream", access(connection, user));
    const abort = new AbortController();
    const a = await open(first.connection, "&symbol=SAFX", undefined, abort.signal);
    const duplicate = await open(first.connection, "&symbol=SAFX&daily=1&adjustment=raw");
    const b = await open(second.connection, "&symbol=TEST");
    const rejected = await open(first.connection, "&symbol=TEST");
    expect(await rejected.text()).toContain('"state":"unavailable"');
    expect(subscribe.mock.calls.map(([request]) => [request.symbol, request.connection])).toEqual([
      ["SAFX", first.connection], ["SAFX", first.connection], ["TEST", second.connection],
    ]);
    expect(subscribe.mock.contexts[0]).toBe(subscribe.mock.contexts[1]);
    expect(subscribe.mock.contexts[0]).not.toBe(subscribe.mock.contexts[2]);
    abort.abort();
    expect(await a.text()).toBe("");
    expect(release).toHaveBeenCalledTimes(1);
    expect(await (await open(first.connection, "&symbol=TEST")).text()).toContain('"state":"unavailable"');
    first.revoke();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await duplicate.text()).toBe("");
    expect(release).toHaveBeenCalledTimes(2);
    const refreshed = { ...second.connection, generation: "c".repeat(64) };
    const renewed = await open(refreshed, "&symbol=TEST", users.get(first.connection)!);
    expect(subscribe).toHaveBeenCalledTimes(4);
    await renewed.body!.cancel();
    await b.body!.cancel();
    expect(release).toHaveBeenCalledTimes(4);
  });

  it("releases an old generation immediately on reconnect without exposing the replacement feed", async () => {
    const original = fixture();
    const connected = fixture();
    const release = vi.fn();
    vi.spyOn(WorkspaceMoomooChartStream.prototype, "subscribe").mockReturnValue(release);
    const user = users.get(original.connection)!;
    const before = await workspaceMoomooChartResponse(req("&symbol=SAFX"), "stream", access(original.connection));
    original.revoke();
    const next = { ...connected.connection, generation: "d".repeat(64) };
    const after = await workspaceMoomooChartResponse(req("&symbol=TEST", next.generation), "stream", access(next, user));
    expect(await before.text()).toBe("");
    expect(release).toHaveBeenCalledOnce();
    const stale = await workspaceMoomooChartResponse(req("&symbol=SAFX"), "stream", access(original.connection));
    expect(stale.status).toBe(409);
    await after.body!.cancel();
    expect(release).toHaveBeenCalledTimes(2);
  });

  it("uses the same early-close and holiday sessions as the Scanner", () => {
    const client = { symbol: "SAFX", daily: false, adjustment: "split" } as const;
    const quoteAt = (iso: string) => workspaceMoomooChartEvents({
      type: "QUOTE", symbol: "US.SAFX", data: { data_time_ms: Date.parse(iso), last_price: 1.12,
        after_market: { price: 1.72, data_time_ms: Date.parse(iso) } },
    }, client, Date.parse(iso) + 100);
    expect(quoteAt("2026-11-27T17:59:59Z")).toMatchObject([{ type: "price", data: { price: 1.12 } }]);
    expect(quoteAt("2026-11-27T18:00:00Z")).toMatchObject([{ type: "price", data: { price: 1.72 } }]);
    expect(quoteAt("2026-11-27T22:00:00Z")).toEqual([]);
    expect(quoteAt("2026-11-26T15:00:00Z")).toEqual([]);
  });

  it("uses WebSocket heartbeats and keeps a quiet chart open while pongs arrive", async () => {
    vi.useFakeTimers({ now });
    const socket = new SocketFixture();
    const stream = new WorkspaceMoomooChartStream(() => socket as unknown as WebSocket);
    const { connection } = fixture();
    const notify = vi.fn();
    const remove = stream.subscribe({ symbol: "SPY", daily: false, adjustment: "split", connection, notify });
    try {
      await Promise.resolve();
      socket.emit("open");
      socket.packet({ session_id: "fixture" });
      for (let count = 0; count < 4; count++) {
        await vi.advanceTimersByTimeAsync(25_000);
        socket.emit("pong");
      }
      expect(socket.ping).toHaveBeenCalledTimes(4);
      expect(socket.send).toHaveBeenCalledTimes(2);
      expect(socket.close).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100_000);
      expect(socket.close).toHaveBeenCalledOnce();
    } finally { remove(); }
  });

  it("reconnects if the provider rejects the refreshed chart credential", async () => {
    vi.useFakeTimers({ now });
    const socket = new SocketFixture();
    const create = vi.fn(() => socket as unknown as WebSocket);
    const stream = new WorkspaceMoomooChartStream(create);
    const { connection } = fixture();
    const remove = stream.subscribe({ symbol: "SAFX", daily: false, adjustment: "split", connection, notify: vi.fn() });
    try {
      await Promise.resolve();
      socket.emit("open");
      socket.packet({ session_id: "fixture" });
      const subscription = JSON.parse(socket.send.mock.calls[1][0]);
      socket.packet({ id: subscription.id, code: 0 });
      for (let tick = 0; tick < 12; tick++) {
        await vi.advanceTimersByTimeAsync(25_000);
        socket.emit("pong");
      }
      const refresh = socket.send.mock.calls.map(([value]) => JSON.parse(value)).find(value => value.action === "refresh");
      expect(refresh?.id).toMatch(/^refresh-/);
      socket.packet({ id: refresh.id, code: 8 });
      expect(socket.close).toHaveBeenCalledOnce();
    } finally { remove(); }
  });

  it("starts scoped live delivery on valid pushes without an echoed subscription id", async () => {
    vi.useFakeTimers({ now });
    const socket = new SocketFixture(), otherSocket = new SocketFixture();
    const stream = new WorkspaceMoomooChartStream(() => socket as unknown as WebSocket);
    const otherStream = new WorkspaceMoomooChartStream(() => otherSocket as unknown as WebSocket);
    const { connection } = fixture();
    const quote = vi.fn(), daily = vi.fn(), otherAccount = vi.fn();
    const releases = [
      stream.subscribe({ symbol: "SPY", daily: false, adjustment: "raw", connection, notify: quote }),
      stream.subscribe({ symbol: "POM", daily: true, adjustment: "split", connection, notify: daily }),
      otherStream.subscribe({ symbol: "SPY", daily: false, adjustment: "raw",
        connection: fixture().connection, notify: otherAccount }),
    ];
    try {
      await Promise.resolve();
      for (const active of [socket, otherSocket]) {
        active.emit("open");
        active.packet({ session_id: "fixture" });
        active.packet({ code: 0 });
      }
      expect(quote).toHaveBeenCalledTimes(1);
      expect(daily).toHaveBeenCalledTimes(1);
      const price = { type: "QUOTE", symbol: "US.SPY", data: { data_time_ms: now, last_price: 2.5 } };
      const bar = { type: "KLINE", symbol: "US.POM", data: { period: "1D", adjust: "none",
        kl_list: [candle("2026-11-24T15:15:00Z")] } };
      socket.packet({ ...price, symbol: "US.OTHER" });
      socket.packet({ ...price, data: { ...price.data, last_price: 0 } });
      socket.packet({ ...bar, data: { ...bar.data, period: "1m" } });
      expect(quote).toHaveBeenCalledTimes(1);
      expect(daily).toHaveBeenCalledTimes(1);

      socket.packet(price);
      expect(quote.mock.calls.slice(1).map(([event]) => event)).toEqual([
        expect.objectContaining({ type: "status", data: expect.objectContaining({ state: "connected", adjustment: "raw" }) }),
        expect.objectContaining({ type: "price", data: expect.objectContaining({ price: 2.5 }) }),
      ]);
      expect(daily).toHaveBeenCalledTimes(1);
      expect(otherAccount).toHaveBeenCalledTimes(1);
      socket.packet(bar);
      expect(daily.mock.calls.slice(1).map(([event]) => event)).toEqual([
        expect.objectContaining({ type: "status", data: expect.objectContaining({ state: "connected", adjustment: "split" }) }),
        expect.objectContaining({ type: "bar", data: expect.objectContaining({ daily: true }) }),
      ]);
      socket.packet(price);
      expect(quote.mock.calls.filter(([event]) => event.data.state === "connected")).toHaveLength(1);
      expect(otherAccount).toHaveBeenCalledTimes(1);

      const subscription = JSON.parse(socket.send.mock.calls[1][0]);
      socket.packet({ id: subscription.id, code: 403 });
      expect(quote).toHaveBeenLastCalledWith(expect.objectContaining({ type: "status", data: expect.objectContaining({ state: "unavailable" }) }));
      expect(daily).toHaveBeenLastCalledWith(expect.objectContaining({ type: "status", data: expect.objectContaining({ state: "unavailable" }) }));
      const count = quote.mock.calls.length;
      socket.packet(price);
      expect(quote).toHaveBeenCalledTimes(count);
    } finally { for (const release of releases) release(); }
  });

  it("shares one candle key per connection, scopes delivery and releases the final reader", async () => {
    vi.useFakeTimers({ now });
    const socket = new SocketFixture();
    const create = vi.fn(() => socket as unknown as WebSocket);
    const stream = new WorkspaceMoomooChartStream(create);
    const { connection, revoke } = fixture();
    const first = vi.fn(), second = vi.fn();
    const removeSplit = stream.subscribe({ symbol: "SAFX", daily: false, adjustment: "split", connection, notify: first });
    const removeRaw = stream.subscribe({ symbol: "SAFX", daily: false, adjustment: "raw", connection, notify: second });
    await Promise.resolve();
    socket.emit("open");
    socket.packet({ session_id: "fixture" });
    expect(create).toHaveBeenCalledTimes(1);
    const subscription = JSON.parse(socket.send.mock.calls[1][0]);
    expect(subscription).toMatchObject({ action: "subscribe", quote: ["US.SAFX"], kline: [{ symbol: "US.SAFX", period: "1m", adjust: "none" }] });
    socket.packet({ id: subscription.id, code: 0 });
    const packet = { symbol: "US.SAFX", type: "KLINE", data: { period: "1m", adjust: "none",
      kl_list: [candle("2026-11-23T15:15:00Z"), candle("2026-11-24T15:15:00Z")] } };
    socket.packet(packet);
    expect(first.mock.calls.filter(([event]) => event.type === "bar")).toEqual([[expect.objectContaining({ data: expect.objectContaining({ adjustment: "split", basisDate: "2026-11-24" }) })]]);
    expect(second).toHaveBeenLastCalledWith(expect.objectContaining({ type: "bar", data: expect.objectContaining({ adjustment: "raw" }) }));
    removeSplit();
    expect(socket.close).not.toHaveBeenCalled();
    revoke();
    socket.packet(packet);
    expect(second.mock.calls.filter(([event]) => event.type === "bar")).toHaveLength(1);
    expect(socket.close).toHaveBeenCalledTimes(1);
    removeRaw();
  });
});
