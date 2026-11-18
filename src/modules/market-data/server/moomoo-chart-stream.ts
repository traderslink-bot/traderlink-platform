import "server-only";

import WebSocket from "ws";
import { withWatchlistIndicatorMoomooAccess } from "@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { moomooChartBar } from "./moomoo-chart-history";

type Event = { type: "status" | "price" | "bar" | "trading-status"; data: Record<string, unknown> };
type Client = { symbol: string; daily: boolean; notify: (event: Event) => void };

/** One demand-driven upstream socket shared by every Moomoo chart. */
export class MoomooChartStream {
  private clients = new Set<Client>();
  private socket?: WebSocket;
  private connecting = false;
  private authenticated = false;
  private ready = new Set<string>();
  private subscriptions = new Map<string, Client[]>();
  private failures = 0;
  private reconnect?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private refresh?: ReturnType<typeof setInterval>;
  private authenticationTimeout?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private request = 0;
  private lastMessage = 0;
  private latest = new Map<string, Map<string, Event>>();
  constructor(private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly socketFactory: () => WebSocket = () => new WebSocket("wss://webapi-quote.moomoo.com/ws", { maxPayload: 2_000_000 })) {}

  subscribe(symbol: string, daily: boolean, notify: (event: Event) => void): () => void {
    const client = { symbol, daily, notify };
    const exists = [...this.clients].some(other => other.symbol === symbol && other.daily === daily);
    this.clients.add(client);
    notify({ type: "status", data: { state: this.ready.has(symbol + daily) ? "connected" : "connecting" } });
    for (const event of this.latest.get(symbol + daily)?.values() ?? []) notify(event);
    if (this.authenticated && !exists) this.subscription("subscribe", [client]);
    void this.connect();
    return () => {
      this.clients.delete(client);
      if (![...this.clients].some(other => other.symbol === symbol && other.daily === daily)) {
        this.subscription("unsubscribe", [client]);
        this.latest.delete(symbol + daily);
        this.ready.delete(symbol + daily);
      }
      if (!this.clients.size) this.close();
    };
  }

  private send(value: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(value));
  }
  private subscription(action: "subscribe" | "unsubscribe", clients = [...this.clients]) {
    if (!this.authenticated || !clients.length) return;
    const symbols = [...new Set(clients.map(client => "US." + client.symbol))];
    const dimensions = [...new Map(clients.map(client => [client.symbol + client.daily,
      { symbol: "US." + client.symbol, period: client.daily ? "1D" : "1m", adjust: "none" }])).values()];
    const quotes = action === "unsubscribe" ? symbols.filter(symbol => ![...this.clients].some(client => "US." + client.symbol === symbol)) : symbols;
    const id = "subscription-" + ++this.request;
    if (action === "subscribe") this.subscriptions.set(id, clients);
    this.send({ id, action, quote: quotes, kline: dimensions });
  }
  private status(state: string) {
    for (const client of this.clients) client.notify({ type: "status", data: { state, adjustment: "split", basisDate: easternClock(Date.now()).date } });
  }
  private async connect() {
    if (this.connecting || this.socket || !this.clients.size) return;
    this.connecting = true;
    const generation = this.generation;
    try {
      await withWatchlistIndicatorMoomooAccess(async ({ token }) => {
        if (generation !== this.generation || !this.clients.size) return;
        const socket = this.socket = this.socketFactory();
        this.lastMessage = Date.now();
        socket.on("open", () => {
          if (this.socket !== socket) return;
          this.send({ action: "auth", data: { auth_type: "oauth2", authorization: "Bearer " + token } });
          this.authenticationTimeout = setTimeout(() => socket.close(), 15_000);
        });
        socket.on("message", raw => {
          if (this.socket !== socket) return;
          this.lastMessage = Date.now();
          try { this.message(JSON.parse(raw.toString())); } catch { socket.close(); }
        });
        socket.on("error", () => { if (this.socket === socket) socket.close(); });
        socket.on("close", () => { if (this.socket === socket) this.disconnected(); });
      }, this.environment);
    } catch { if (generation === this.generation) this.disconnected(); }
    finally {
      this.connecting = false;
      // A last unsubscribe can cancel credential lookup while a new chart opens.
      if (generation !== this.generation && this.clients.size && !this.socket && !this.reconnect) void this.connect();
    }
  }
  private message(message: Record<string, unknown>) {
    if (!this.authenticated && typeof message.session_id === "string") {
      clearTimeout(this.authenticationTimeout);
      this.authenticated = true;
      this.subscription("subscribe");
      this.status("connecting");
      this.heartbeat = setInterval(() => {
        if (Date.now() - this.lastMessage > 90_000) this.socket?.close();
        else this.send({ action: "ping" });
      }, 25_000);
      this.refresh = setInterval(() => {
        const socket = this.socket;
        void withWatchlistIndicatorMoomooAccess(async ({ token }) => {
          if (socket === this.socket) this.send({ action: "refresh", data: { authorization: "Bearer " + token } });
        }, this.environment).catch(() => { if (socket === this.socket) socket?.close(); });
      }, 300_000);
      return;
    }
    if (typeof message.code === "number" && message.code !== 0) { this.status("unavailable"); this.socket?.close(); return; }
    if (message.code === 0 && typeof message.id === "string") {
      const clients = this.subscriptions.get(message.id);
      this.subscriptions.delete(message.id);
      for (const client of clients ?? []) {
        this.ready.add(client.symbol + client.daily);
        for (const current of this.clients) if (current.symbol === client.symbol && current.daily === client.daily) {
          current.notify({ type: "status", data: { state: "connected", adjustment: "split", basisDate: easternClock(Date.now()).date } });
        }
      }
      if (clients) this.failures = 0;
      return;
    }
    if (!this.authenticated || typeof message.symbol !== "string" || !message.symbol.startsWith("US.") || !message.data || typeof message.data !== "object") return;
    const symbol = message.symbol.slice(3), data = message.data as Record<string, unknown>;
    for (const client of this.clients) {
      if (client.symbol !== symbol) continue;
      const publish = (type: Event["type"], value: Record<string, unknown>) => {
        const event = { type, data: value }, key = symbol + client.daily;
        const saved = this.latest.get(key) ?? new Map(); saved.set(type, event); this.latest.set(key, saved);
        client.notify(event);
      };
      if (message.type === "QUOTE") {
        const at = data.data_time_ms;
        if (!Number.isSafeInteger(at) || Number(at) > Date.now() + 5_000) continue;
        const clock = easternClock(Number(at));
        if (clock.minute < 240 || clock.minute >= 1200) continue;
        const extended = clock.minute < 570 ? data.pre_market : clock.minute >= 960 ? data.after_market : null;
        const price = (extended && typeof extended === "object" ? (extended as Record<string, unknown>).price : undefined) ?? data.last_price;
        if (typeof price === "number" && Number.isFinite(price) && price > 0) publish("price", { price, time: new Date(Number(at)).toISOString() });
        if (typeof data.suspension === "boolean") publish("trading-status", { symbol, available: true, status: { symbol, halted: data.suspension, observedAt: new Date(Number(at)).toISOString() } });
      }
      if (message.type === "KLINE" && data.period === (client.daily ? "1D" : "1m") && data.adjust === "none" && Array.isArray(data.kl_list)) {
        for (const row of data.kl_list) {
          const bar = moomooChartBar(row, client.daily);
          if (!bar) continue;
          const clock = easternClock(bar.time * 1000);
          if (!client.daily && (clock.minute < 240 || clock.minute >= 1200)) continue;
          publish("bar", { bar, daily: client.daily, provisional: true, adjustment: "split", basisDate: easternClock(Date.now()).date });
        }
      }
    }
  }
  private disconnected() {
    clearTimeout(this.authenticationTimeout); clearInterval(this.heartbeat); clearInterval(this.refresh);
    this.socket = undefined; this.authenticated = false; this.ready.clear(); this.subscriptions.clear(); this.latest.clear();
    this.status("reconnecting");
    const delay = Math.min(60_000, 3_000 * 2 ** Math.min(this.failures++, 5));
    if (this.clients.size && !this.reconnect) this.reconnect = setTimeout(() => { this.reconnect = undefined; void this.connect(); }, delay);
  }
  close() {
    this.generation++;
    this.failures = 0;
    clearTimeout(this.reconnect); this.reconnect = undefined;
    clearTimeout(this.authenticationTimeout); clearInterval(this.heartbeat); clearInterval(this.refresh);
    const socket = this.socket; this.socket = undefined; this.authenticated = false; this.ready.clear(); this.subscriptions.clear(); this.latest.clear();
    socket?.close();
  }
}
