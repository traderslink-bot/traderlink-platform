import { EventEmitter } from "node:events";
import type WebSocket from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { readWorkspaceMoomooAccess, WorkspaceMoomooConnection } from "./server/workspace-moomoo-access";
import { workspaceMoomooChartResponse } from "./server/workspace-moomoo-chart-response";
import { workspaceMoomooChartEvents, WorkspaceMoomooChartStream } from "./server/workspace-moomoo-chart-stream";

const now = Date.parse("2026-11-24T15:20:00Z");
const generation = "b".repeat(64);
const candle = (time: string) => ({ time_key: Date.parse(time), open: 2, high: 3, low: 1, close: 2.5, volume: 600 });
type Access = NonNullable<ReturnType<typeof readWorkspaceMoomooAccess>>;
const access = (connection: WorkspaceMoomooConnection | null) => ({ connection }) as Access;
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
  return { connection, revoke: () => { allowed = false; } };
}

afterEach(() => vi.useRealTimers());

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
});

class SocketFixture extends EventEmitter {
  readyState = 1;
  send = vi.fn();
  close = vi.fn();
  packet(value: unknown) { this.emit("message", Buffer.from(JSON.stringify(value))); }
}

describe("broker Workspace candle socket", () => {
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
        socket.packet({ action: "pong" });
      }
      const refresh = socket.send.mock.calls.map(([value]) => JSON.parse(value)).find(value => value.action === "refresh");
      expect(refresh?.id).toMatch(/^refresh-/);
      socket.packet({ id: refresh.id, code: 8 });
      expect(socket.close).toHaveBeenCalledOnce();
    } finally { remove(); }
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
