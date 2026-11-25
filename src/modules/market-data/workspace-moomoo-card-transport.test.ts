// @vitest-environment node
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type WebSocket from "ws";
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS } from "./workspace-market-settings";
import { runWorkspaceRestCards, runWorkspaceWebSocketCards } from "./server/workspace-moomoo-card-transport";
import { MoomooSharedTransport } from "@/src/modules/platform/server/broker-connections/moomoo-shared-transport";
import { restoreBudget } from "@/src/modules/platform/server/broker-connections/moomoo-request-budget-domain";

const date = "2026-11-24";
const time = Date.parse(`${date}T15:00:01.000Z`);
const context = { date, session: "regular", regularCloseMinute: 960 } as const;

vi.mock("server-only", () => ({}));

class FakeSocket extends EventEmitter {
  readyState = 1;
  messages: Array<Record<string, unknown>> = [];
  send(message: string) { this.messages.push(JSON.parse(message)); }
  close() { this.readyState = 3; this.emit("close"); }
  frame(value: unknown) { this.emit("message", Buffer.from(JSON.stringify(value))); }
}

afterEach(() => vi.useRealTimers());

it("authenticates before subscribing and a book denial leaves authorized quotes usable", async () => {
  vi.useFakeTimers();
  const date = "2026-11-24";
  const time = Date.parse(`${date}T15:00:01.000Z`);
  vi.setSystemTime(time);
  const controller = new AbortController();
  const socket = new FakeSocket();
  const accept = vi.fn();
  const status = vi.fn();
  let symbols = ["NANO", "MICRO"];
  const run = runWorkspaceWebSocketCards({
    connection: () => ({ generation: "test-member", current: () => true,
      accessToken: async () => "synthetic-scoped-access", request: async () => ({}) }),
    context: { date, session: "regular", regularCloseMinute: 960 },
    settings: DEFAULT_WORKSPACE_MARKET_SETTINGS, signal: controller.signal, symbols: () => symbols, accept, status,
  }, () => socket as unknown as WebSocket);
  try {
    await vi.advanceTimersByTimeAsync(1);
    socket.emit("open");
    expect(socket.messages).toEqual([{ action: "auth", data: { auth_type: "oauth2", authorization: "Bearer synthetic-scoped-access" } }]);
    socket.frame({ session_id: "synthetic-session" });
    const basic = socket.messages.find(frame => frame.action === "subscribe" && frame.quote);
    const book = socket.messages.find(frame => frame.action === "subscribe" && frame.order_book);
    expect(basic?.quote).toEqual(["US.NANO", "US.MICRO"]);
    expect(book?.order_book).toEqual(["US.NANO", "US.MICRO"]);
    socket.frame({ id: book?.id, code: 4 });
    socket.frame({ id: basic?.id, code: 0 });
    socket.frame({ type: "QUOTE", symbol: "US.NANO", data: { data_time_ms: time, last_price: 1.42 } });
    socket.frame({ type: "QUOTE", symbol: "US.OTHER", data: { data_time_ms: time, last_price: 9 } });
    expect(accept).toHaveBeenCalledExactlyOnceWith("NANO", expect.objectContaining({ price: 1.42 }), null);
    expect(status).toHaveBeenLastCalledWith("ready");
    symbols = ["NANO", "NEW"];
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.messages).toContainEqual(expect.objectContaining({ action: "unsubscribe", quote: ["US.MICRO"] }));
    expect(socket.messages).toContainEqual(expect.objectContaining({ action: "subscribe", quote: ["US.NEW"] }));
  } finally {
    controller.abort();
    await run;
  }
  expect(socket.readyState).toBe(3);
});

it("seeds a quiet ticker and backfills once per socket when it reconnects", async () => {
  vi.useFakeTimers({ now: time, toFake: ["Date"] });
  const controller = new AbortController();
  const first = new FakeSocket(), second = new FakeSocket();
  const sockets = [first, second];
  const received = (last_price: number) => ({ ret_code: 0, data: { snapshot_list: [
    { code: "US.NANO", update_time: time - 60_000, data_date: date, last_price },
  ] } });
  const request = vi.fn().mockResolvedValueOnce(received(1.5)).mockResolvedValueOnce(received(1.75));
  const accept = vi.fn();
  const status = vi.fn();
  const run = runWorkspaceWebSocketCards({
    connection: () => ({ generation: "member", current: () => true, accessToken: async () => "token", request }),
    context, settings: DEFAULT_WORKSPACE_MARKET_SETTINGS, signal: controller.signal,
    symbols: () => ["NANO"], accept, status,
  }, () => sockets.shift() as unknown as WebSocket);
  const finished = run.catch(error => { if (!controller.signal.aborted) throw error; });
  try {
    await Promise.resolve();
    first.emit("open");
    first.frame({ session_id: "one" });
    first.frame({ id: first.messages.find(frame => frame.action === "subscribe" && frame.quote)?.id, code: 4 });
    await vi.waitFor(() => expect(accept).toHaveBeenCalledExactlyOnceWith("NANO", expect.objectContaining({ price: 1.5 }), null));
    expect(status).toHaveBeenLastCalledWith("unavailable");
    expect(request).toHaveBeenCalledTimes(1);
    const firstSignal = request.mock.calls[0][1];
    first.close();
    expect(firstSignal.aborted).toBe(true);
    await vi.waitFor(() => expect(sockets).toHaveLength(0), { timeout: 4000 });
    second.emit("open");
    second.frame({ session_id: "two" });
    second.frame({ id: second.messages.find(frame => frame.action === "subscribe" && frame.quote)?.id, code: 0 });
    await vi.waitFor(() => expect(accept).toHaveBeenCalledTimes(2));
    expect(request).toHaveBeenCalledTimes(2);
    expect(accept).toHaveBeenLastCalledWith("NANO", expect.objectContaining({ price: 1.75 }), null);
    expect(status).toHaveBeenLastCalledWith("ready");
  } finally { controller.abort(); await finished; }
}, 7000);

it("does not report Ready when the REST pass contains no usable quote", async () => {
  vi.useFakeTimers({ now: time });
  const controller = new AbortController();
  const status = vi.fn();
  const accept = vi.fn();
  const run = runWorkspaceRestCards({
    connection: () => ({ generation: "member", current: () => true, accessToken: async () => "token",
      request: async () => ({ ret_code: 0, data: { snapshot_list: [] } }) }),
    context, settings: DEFAULT_WORKSPACE_MARKET_SETTINGS, signal: controller.signal,
    symbols: () => ["NANO"], status, accept,
  });
  const finished = run.catch(error => { if (!controller.signal.aborted) throw error; });
  try {
    await vi.advanceTimersByTimeAsync(1);
    expect(status).toHaveBeenCalledExactlyOnceWith("unavailable");
    expect(accept).not.toHaveBeenCalled();
  } finally { controller.abort(); await finished; }
});

it("drops a cancelled request from the shared budget before it reaches the provider", async () => {
  const directory = mkdtempSync(join(tmpdir(), "workspace-card-budget-"));
  const ledgerPath = join(directory, "budget.json");
  writeFileSync(ledgerPath, JSON.stringify(restoreBudget(null, Date.now() - 60_000)));
  const transport = new MoomooSharedTransport({ ledgerPath });
  const { promise: held, resolve: release } = Promise.withResolvers<Response>();
  const { promise: started, resolve: start } = Promise.withResolvers<void>();
  const first = transport.fetch("https://fixture.invalid", {}, "other", async () => { start(); return held; });
  const controller = new AbortController();
  const provider = vi.fn(async () => new Response("{}"));
  try {
    await started;
    const second = transport.fetch("https://fixture.invalid", { signal: controller.signal }, "other", provider).catch(error => error);
    controller.abort();
    release(new Response("{}"));
    await first;
    expect((await second).name).toBe("AbortError");
    expect(provider).not.toHaveBeenCalled();
  } finally {
    release(new Response("{}"));
    await first.catch(() => {});
    rmSync(directory, { recursive: true, force: true });
  }
});

it("lets the Scanner go first when a Connected Workspace request is waiting on the shared budget", async () => {
  const directory = mkdtempSync(join(tmpdir(), "workspace-card-priority-"));
  const ledgerPath = join(directory, "budget.json");
  let now = time;
  writeFileSync(ledgerPath, JSON.stringify({ ...restoreBudget(null, now - 60_000), lastSeenAt: now,
    starts: [{ at: now, priority: "other" }],
  }));
  const { promise: blocked, resolve: notifyBlocked } = Promise.withResolvers<void>();
  const { promise: released, resolve: release } = Promise.withResolvers<void>();
  const order: string[] = [];
  const transport = new MoomooSharedTransport({ ledgerPath, now: () => now, async pause(ms) {
    notifyBlocked();
    await released;
    now += ms;
  } });
  const later = transport.fetch("https://fixture.invalid", {}, "other", async () => { order.push("cards"); return new Response("{}"); });
  try {
    await blocked;
    const scanner = transport.fetch("https://fixture.invalid", {}, "scanner", async () => { order.push("scanner"); return new Response("{}"); });
    release();
    await Promise.all([later, scanner]);
    expect(order).toEqual(["scanner", "cards"]);
  } finally {
    release();
    await later.catch(() => {});
    rmSync(directory, { recursive: true, force: true });
  }
});
