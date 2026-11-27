import "server-only";

import WebSocket from "ws";
import { activeSession, easternClock } from "@/src/modules/scanner/live/sessions";
import { marketDay } from "@/src/modules/scanner/live/server/runtime";
import { readWorkspacePushQuote } from "../workspace-moomoo-quotes";
import { moomooChartBar } from "./moomoo-chart-history";
import type { WorkspaceMoomooConnection } from "./workspace-moomoo-access";

type Event = { type: "status" | "price" | "bar"; data: Record<string, unknown> };
type Subscription = { symbol: string; daily: boolean; adjustment: "raw" | "split"; connection: WorkspaceMoomooConnection; notify(event: Event): void };
type SocketFactory = () => WebSocket;

const period = (daily: boolean) => daily ? "1D" : "1m";
const key = (client: Subscription) => client.symbol + ":" + period(client.daily);
const socketFactory: SocketFactory = () => new WebSocket("wss://webapi-quote.moomoo.com/ws", { maxPayload: 2_000_000 });
const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

export function workspaceMoomooChartEvents(message: Record<string, unknown>, client: Pick<Subscription, "symbol" | "daily" | "adjustment">, now: number): Event[] {
  const data = record(message.data);
  if (message.symbol !== "US." + client.symbol || !data) return [];
  const basisDate = easternClock(now).date;
  const day = marketDay(basisDate);
  if (!day.verified || !day.open) return [];
  if (message.type === "KLINE" && data.period === period(client.daily) && data.adjust === "none" && Array.isArray(data.kl_list)) {
    return data.kl_list.flatMap(raw => {
      try {
        const bar = moomooChartBar(raw, client.daily);
        if (!bar || bar.time * 1000 > now) return [];
        // Raw and split-adjusted history share today's prices. Older packets
        // need the historical split basis and are recovered through REST.
        if (easternClock(bar.time * 1000).date !== basisDate || !client.daily && !activeSession(day, bar.time * 1000)) return [];
        return [{ type: "bar", data: { bar, daily: client.daily, adjustment: client.adjustment, basisDate, provisional: true } }];
      } catch { return []; }
    });
  }
  if (message.type !== "QUOTE") return [];
  const session = activeSession(day, now);
  const quote = session && readWorkspacePushQuote(client.symbol, data, {
    date: basisDate, session, regularCloseMinute: day.regularCloseEastern === "13:00" ? 780 : 960,
  }, now);
  return quote ? [{ type: "price", data: { price: quote.price, time: new Date(quote.observedAt).toISOString() } }] : [];
}

/** One demand-driven candle socket per active member connection, independent of card transport. */
export class WorkspaceMoomooChartStream {
  private readonly clients = new Set<Subscription>();
  private readonly ready = new Set<string>();
  private readonly rejected = new Set<string>();
  private readonly pending = new Map<string, string[]>();
  private socket?: WebSocket;
  private attempting = false;
  private authenticated = false;
  private epoch = 0;
  private sequence = 0;
  private failures = 0;
  private lastPacket = 0;
  private retry?: ReturnType<typeof setTimeout>;
  private authDeadline?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private refresh?: ReturnType<typeof setInterval>;
  private refreshId?: string;

  constructor(private readonly createSocket = socketFactory) {}

  subscribe(client: Subscription): () => void {
    const peers = [...this.clients];
    this.clients.add(client);
    this.status(client, this.ready.has(key(client)) ? "connected" : "connecting");
    if (this.authenticated && !peers.some(peer => key(peer) === key(client))) {
      this.updateSubscriptions("subscribe", [client], peers.some(peer => peer.symbol === client.symbol) ? [] : [client.symbol]);
    }
    void this.connect();
    return () => {
      if (!this.clients.delete(client)) return;
      if (!this.clients.size) {
        this.failures = 0;
        clearTimeout(this.retry);
        this.retry = undefined;
        this.clearSocket();
        return;
      }
      const remaining = [...this.clients];
      if (!remaining.some(peer => key(peer) === key(client))) {
        const dimension = key(client);
        this.ready.delete(dimension);
        this.rejected.delete(dimension);
        for (const [id, keys] of this.pending) {
          const remaining = keys.filter(value => value !== dimension);
          if (remaining.length) this.pending.set(id, remaining);
          else this.pending.delete(id);
        }
        this.updateSubscriptions("unsubscribe", [client], remaining.some(peer => peer.symbol === client.symbol) ? [] : [client.symbol]);
      }
    };
  }

  private publish(client: Subscription, event: Event) {
    if (client.connection.current()) client.notify(event);
  }

  private status(client: Subscription, state: string) {
    this.publish(client, { type: "status", data: { state, adjustment: client.adjustment, basisDate: easternClock(Date.now()).date } });
  }

  private markReady(dimension: string) {
    if (this.ready.has(dimension)) return;
    this.ready.add(dimension);
    this.failures = 0;
    for (const client of this.clients) if (key(client) === dimension) this.status(client, "connected");
  }

  private send(value: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(value));
  }

  private updateSubscriptions(action: "subscribe" | "unsubscribe", clients: Subscription[], quotes: string[]) {
    if (!this.authenticated) return;
    const id = "chart-" + ++this.sequence;
    const dimensions = [...new Map(clients.map(client => [key(client),
      { symbol: "US." + client.symbol, period: period(client.daily), adjust: "none" }])).values()];
    if (action === "subscribe") this.pending.set(id, [...new Set(clients.map(key))]);
    this.send({ id, action, quote: [...new Set(quotes)].map(symbol => "US." + symbol), kline: dimensions });
  }

  private currentConnection() {
    return [...this.clients].find(client => client.connection.current())?.connection;
  }

  private async connect() {
    if (this.attempting || this.socket || this.retry) return;
    const connection = this.currentConnection();
    if (!connection) return;
    this.attempting = true;
    const epoch = this.epoch;
    try {
      const token = await connection.accessToken();
      if (epoch !== this.epoch || !connection.current()) return;
      const socket = this.socket = this.createSocket();
      this.authDeadline = setTimeout(() => socket.close(), 15_000);
      socket.on("open", () => {
        if (socket !== this.socket) return;
        if (!connection.current()) { socket.close(); return; }
        this.send({ action: "auth", data: { auth_type: "oauth2", authorization: "Bearer " + token } });
      });
      socket.on("message", raw => {
        if (socket !== this.socket) return;
        this.lastPacket = Date.now();
        try {
          const message = record(JSON.parse(raw.toString()));
          if (message) this.receive(message);
        } catch { socket.close(); }
      });
      const observeHeartbeat = () => {
        if (socket === this.socket && this.authenticated) this.lastPacket = Date.now();
      };
      socket.on("ping", observeHeartbeat);
      socket.on("pong", observeHeartbeat);
      socket.on("error", () => socket.close());
      socket.on("close", () => { if (socket === this.socket) this.reconnect(); });
    } catch { if (epoch === this.epoch) this.reconnect(); }
    finally {
      this.attempting = false;
      if (epoch !== this.epoch || !connection.current()) void this.connect();
    }
  }

  private receive(message: Record<string, unknown>) {
    if (!this.currentConnection()) { this.clearSocket(); return; }
    if (this.refreshId && message.id === this.refreshId) {
      this.refreshId = undefined;
      clearTimeout(this.authDeadline);
      if (typeof message.session_id !== "string") this.socket?.close();
      return;
    }
    if (!this.authenticated && typeof message.session_id === "string") {
      this.authenticated = true;
      clearTimeout(this.authDeadline);
      const clients = [...this.clients].filter(client => client.connection.current());
      this.updateSubscriptions("subscribe", clients, clients.map(client => client.symbol));
      this.heartbeat = setInterval(() => {
        if (!this.currentConnection()) this.clearSocket();
        else if (Date.now() - this.lastPacket > 90_000) this.socket?.close();
        else if (this.socket?.readyState === WebSocket.OPEN) this.socket.ping();
      }, 25_000);
      this.refresh = setInterval(() => void this.refreshToken(), 300_000);
      return;
    }
    if (typeof message.id === "string" && typeof message.code === "number") {
      const keys = this.pending.get(message.id);
      if (keys) {
        this.pending.delete(message.id);
        for (const dimension of keys) {
          if (message.code === 0) this.markReady(dimension);
          else {
            this.ready.delete(dimension);
            this.rejected.add(dimension);
            for (const client of this.clients) if (key(client) === dimension) this.status(client, "unavailable");
          }
        }
        return;
      }
    }
    if (message.code && !this.authenticated) { this.socket?.close(); return; }
    if (!this.authenticated) return;
    for (const client of this.clients) {
      const dimension = key(client);
      if (!client.connection.current() || this.rejected.has(dimension)) continue;
      const events = workspaceMoomooChartEvents(message, client, this.lastPacket);
      if (!events.length) continue;
      // Quotes confirm a usable live price for this symbol. Candle pushes must
      // also match the requested period and pass the chart's existing checks.
      this.markReady(dimension);
      for (const event of events) this.publish(client, event);
    }
  }

  private async refreshToken() {
    const socket = this.socket, connection = this.currentConnection();
    if (!socket || !connection) return;
    try {
      const token = await connection.accessToken();
      if (socket === this.socket && connection.current()) {
        this.refreshId = "refresh-" + ++this.sequence;
        this.authDeadline = setTimeout(() => socket.close(), 15_000);
        this.send({ id: this.refreshId, action: "refresh", data: { authorization: "Bearer " + token } });
      }
    } catch { if (socket === this.socket) socket.close(); }
  }

  private clearSocket() {
    this.epoch++;
    clearTimeout(this.authDeadline);
    clearInterval(this.heartbeat);
    clearInterval(this.refresh);
    const socket = this.socket;
    this.socket = undefined;
    this.refreshId = undefined;
    this.authenticated = false;
    this.ready.clear();
    this.rejected.clear();
    this.pending.clear();
    socket?.close();
  }

  private reconnect() {
    this.clearSocket();
    for (const client of this.clients) this.status(client, "reconnecting");
    if (!this.currentConnection()) return;
    const delay = Math.min(60_000, 3000 * 2 ** Math.min(this.failures++, 5));
    this.retry = setTimeout(() => { this.retry = undefined; void this.connect(); }, delay);
  }
}
