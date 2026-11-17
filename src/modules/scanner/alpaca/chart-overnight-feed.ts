import { alpacaCandle } from "./candles";
import type { Candle } from "./candles";
import { ChartLiveBook } from "./chart-live-book";
import { chartOvernightTradingDate } from "./chart-overnight-session";
import type { AlpacaRestData } from "./rest-data";
import { alpacaMinuteTradeRules } from "./session-book";
import { priceObservationOrder } from "./live-price-hub";

type Status = "connecting" | "connected" | "unavailable" | "closed";
type Price = { price: number; time: string };
type Consumer = {
  status: (state: Status) => void;
  price: (price: Price) => void;
  bar: (bar: Candle, provisional?: boolean) => void;
};
type SymbolState = {
  consumers: Set<Consumer>;
  book: ChartLiveBook;
  lastPrice?: Price;
  priceChanged: boolean;
};

/** One chart-only BOATS connection across all requested symbols. */
export class ChartOvernightFeed {
  private readonly symbols = new Map<string, SymbolState>();
  private readonly sent = new Set<string>();
  private socket: WebSocket | undefined;
  private clock: ReturnType<typeof setInterval> | undefined;
  private handshake: ReturnType<typeof setTimeout> | undefined;
  private tradingDate: string | null = null;
  private calendarOpen: boolean | undefined;
  private calendarLoading = false;
  private nextCalendarAt = 0;
  private retryAt = 0;
  private failures = 0;
  private authenticated = false;
  private state: Status = "closed";
  private consumers = 0;
  private nextSessionCheck = 0;

  constructor(
    private readonly credentials: { keyId: string; secretKey: string },
    private readonly rest: Pick<AlpacaRestData, "get">,
    private readonly marketDateOpen: (date: string) => Promise<boolean | undefined>,
    private readonly now: () => number = Date.now,
  ) {}

  add(symbol: string, consumer: Consumer): () => void {
    let entry = this.symbols.get(symbol);
    if (this.consumers >= 16 || !entry && this.symbols.size >= 8) throw Error("busy");
    if (!entry) {
      entry = { consumers: new Set(), book: new ChartLiveBook(symbol, this.rest, false, "boats"), priceChanged: false };
      this.symbols.set(symbol, entry);
    }
    entry.consumers.add(consumer);
    this.consumers++;
    consumer.status(this.state);
    if (entry.lastPrice) consumer.price(entry.lastPrice);
    for (const bar of entry.book.snapshot()) consumer.bar(bar, true);
    if (!this.clock) {
      this.clock = setInterval(() => this.tick(), 250);
      this.clock.unref();
    }
    this.tick();
    if (this.authenticated) this.syncSymbols();

    return () => {
      const current = this.symbols.get(symbol);
      if (!current?.consumers.delete(consumer)) return;
      this.consumers--;
      if (!current.consumers.size) {
        current.book.invalidate();
        this.symbols.delete(symbol);
      }
      if (!this.consumers) this.close();
      else if (this.authenticated) this.syncSymbols();
    };
  }

  close() {
    clearInterval(this.clock);
    this.clock = undefined;
    this.disconnect();
    this.symbols.clear();
    this.consumers = 0;
    this.tradingDate = null;
    this.calendarOpen = undefined;
    this.calendarLoading = false;
    this.state = "closed";
    this.failures = 0;
    this.retryAt = 0;
    this.nextSessionCheck = 0;
  }

  private status(state: Status) {
    if (this.state === state) return;
    this.state = state;
    for (const entry of this.symbols.values()) for (const consumer of entry.consumers) consumer.status(state);
  }

  private disconnect() {
    const socket = this.socket;
    this.socket = undefined;
    this.authenticated = false;
    this.sent.clear();
    clearTimeout(this.handshake);
    socket?.close();
    for (const entry of this.symbols.values()) {
      entry.book.invalidate();
      entry.lastPrice = undefined;
      entry.priceChanged = false;
    }
  }

  private tick() {
    const now = this.now();
    // While closed, wake the date check at the next minute rather than classifying every drain tick.
    if (now < this.nextSessionCheck) return;
    const date = chartOvernightTradingDate(now);
    if (date !== this.tradingDate) {
      this.disconnect();
      this.tradingDate = date;
      this.calendarOpen = undefined;
      this.calendarLoading = false;
      this.failures = 0;
      this.retryAt = 0;
      this.nextCalendarAt = 0;
    }
    if (!date) {
      this.status("closed");
      this.nextSessionCheck = (Math.floor(now / 60_000) + 1) * 60_000;
      return;
    }
    if (this.calendarOpen === undefined && !this.calendarLoading && now >= this.nextCalendarAt) {
      this.calendarLoading = true;
      void this.marketDateOpen(date).catch(() => undefined).then(open => {
        if (this.tradingDate !== date || !this.consumers) return;
        this.calendarOpen = open;
        this.calendarLoading = false;
        this.nextCalendarAt = this.now() + 30_000;
        this.tick();
      });
    }
    if (this.calendarOpen !== true) {
      this.status(this.calendarOpen === false ? "closed" : "connecting");
      return;
    }
    if (!this.socket && now >= this.retryAt) this.connect();
    if (!this.authenticated) return;

    for (const entry of this.symbols.values()) {
      if (entry.priceChanged && entry.lastPrice) {
        for (const consumer of entry.consumers) consumer.price(entry.lastPrice);
        entry.priceChanged = false;
      }
      void entry.book.warm(now);
      for (const bar of entry.book.drain()) {
        if (chartOvernightTradingDate(bar.time * 1000) !== date) continue;
        for (const consumer of entry.consumers) consumer.bar(bar, true);
      }
    }
  }

  private syncSymbols() {
    const socket = this.socket;
    if (!this.authenticated || socket?.readyState !== WebSocket.OPEN) return;
    const added = [...this.symbols.keys()].filter(symbol => !this.sent.has(symbol));
    const removed = [...this.sent].filter(symbol => !this.symbols.has(symbol));
    if (removed.length) {
      socket.send(JSON.stringify({ action: "unsubscribe", trades: removed, bars: removed, updatedBars: removed }));
      for (const symbol of removed) this.sent.delete(symbol);
    }
    if (added.length) {
      socket.send(JSON.stringify({ action: "subscribe", trades: added, bars: added, updatedBars: added }));
      for (const symbol of added) this.sent.add(symbol);
    }
  }

  private connect() {
    this.status("connecting");
    const socket = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/boats");
    this.socket = socket;
    this.handshake = setTimeout(() => socket.close(), 10_000);
    this.handshake.unref();
    socket.addEventListener("open", () => {
      if (this.socket === socket) socket.send(JSON.stringify({ action: "auth", key: this.credentials.keyId, secret: this.credentials.secretKey }));
    });
    socket.addEventListener("message", event => {
      if (this.socket !== socket) return;
      let messages: unknown;
      try { messages = JSON.parse(String(event.data)); } catch { return; }
      if (!Array.isArray(messages)) return;
      for (const item of messages) {
        if (!item || typeof item !== "object") continue;
        if (item.T === "success" && item.msg === "authenticated") {
          this.authenticated = true;
          this.syncSymbols();
        } else if (item.T === "subscription" && this.authenticated) {
          clearTimeout(this.handshake);
          this.failures = 0;
          this.status("connected");
        } else if (item.T === "error") {
          socket.close();
        } else if (this.state === "connected") {
          this.observe(item);
        }
      }
    });
    socket.addEventListener("error", () => socket.close());
    socket.addEventListener("close", () => {
      if (this.socket !== socket) return;
      this.disconnect();
      this.status("unavailable");
      this.retryAt = this.now() + Math.min(60_000, 2_000 * 2 ** Math.min(this.failures++, 5));
    });
  }

  private observe(item: Record<string, unknown>) {
    const entry = typeof item.S === "string" ? this.symbols.get(item.S) : undefined;
    if (!entry || !this.tradingDate || chartOvernightTradingDate(this.now()) !== this.tradingDate) return;
    if (item.T === "c" || item.T === "x") {
      entry.book.observe(item);
      return;
    }
    if (typeof item.t !== "string" || chartOvernightTradingDate(Date.parse(item.t)) !== this.tradingDate) return;
    if (item.T === "b" || item.T === "u") {
      const bar = alpacaCandle(item);
      if (bar && bar.low > 0) {
        entry.book.seal(bar.time);
        for (const consumer of entry.consumers) consumer.bar(bar);
      }
    } else if (item.T === "t") {
      entry.book.observe(item);
      const rules = alpacaMinuteTradeRules(item as { c?: string[]; z?: string });
      if (rules.known && rules.prices && typeof item.p === "number" && Number.isFinite(item.p) && item.p > 0
        && (!entry.lastPrice || priceObservationOrder(item.t) >= priceObservationOrder(entry.lastPrice.time))) {
        entry.lastPrice = { price: item.p, time: item.t };
        entry.priceChanged = true;
      }
    }
  }
}
