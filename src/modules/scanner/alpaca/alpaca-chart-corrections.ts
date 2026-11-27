import { createHash } from "node:crypto";
import { easternDayStart, type Candle } from "./candles";
import { easternClock } from "../live/sessions";
import { applyChartCorrection, type ChartCorrection, type StoredChartCorrection } from "./chart-correction";
import { priceObservationOrder } from "./live-price-hub";
import type { AlpacaHistoryResult, AlpacaRestData } from "./rest-data";
import { alpacaMinuteTradeRules } from "./session-book";
import type { TradeRevisionRequest, TradeRevisions } from "./trade-revisions";

type Trade = { t: string; p: number; s: number; i: string | number; x: string; z: string; c: string[]; u?: string };
type SeenUpdate = "canceled" | "incorrect" | "corrected";
const tradeIdentity = (exchange: string, tape: string, id: unknown) =>
  typeof id === "string" && /^\d+$/.test(id) || typeof id === "number" && Number.isSafeInteger(id) && id >= 0
    ? `${exchange}:${tape}:${id}` : undefined;

/** Consume verified, complete SIP trade pages for a closed window. */
export class AlpacaCorrectedMinutes {
  private readonly minutes = new Map<number, Candle>();
  private readonly affected = new Set<number>();
  private order = "";
  private minute = 0;
  private volume = 0;
  private bar?: Candle;
  private premarketVolume = 0;
  private premarketDollarVolume = 0;
  constructor(private readonly expected = new Map<string, SeenUpdate>(),
    private readonly premarketThrough = 0) {}

  read(row: Trade) {
    const { t, p, s, x, z, i, u } = row;
    const order = typeof t === "string" ? priceObservationOrder(t) : "";
    const key = tradeIdentity(x, z, i);
    if (!order || order < this.order || !key || !/^[A-Z]$/.test(x) || !/^[ABC]$/.test(z) ||
        !Number.isFinite(p) || p <= 0 || !Number.isSafeInteger(s) || s < 0 ||
        !Array.isArray(row.c) || u !== undefined && u !== "canceled" && u !== "incorrect" && u !== "corrected")
      throw Error("invalid_correction_trade");
    this.order = order;
    const minute = Math.floor(Date.parse(t) / 60_000) * 60;
    if (!Number.isSafeInteger(minute)) throw Error("invalid_correction_trade");
    if (minute !== this.minute) {
      this.seal();
      this.minute = minute;
      this.volume = 0;
      this.bar = undefined;
    }
    if (u !== undefined) this.affected.add(minute);
    if (this.expected.get(key) === u || this.expected.get(key) === "corrected" && u === "canceled") this.expected.delete(key);
    if (u === "canceled" || u === "incorrect") return;
    const rules = alpacaMinuteTradeRules(row);
    if (!rules.known) throw Error("unknown_correction_trade_condition");
    if (rules.volume) {
      this.volume += s;
      if (minute < this.premarketThrough) {
        this.premarketVolume += s;
        this.premarketDollarVolume += p * s;
      }
    }
    if (!Number.isSafeInteger(this.volume)) throw Error("invalid_correction_volume");
    if (rules.prices) {
      const bar = this.bar ?? { time: minute, open: p, high: p, low: p, close: p, volume: 0 };
      bar.high = Math.max(bar.high, p);
      bar.low = Math.min(bar.low, p);
      bar.close = p;
      this.bar = bar;
    }
  }

  private seal() {
    if (this.bar && this.affected.has(this.minute)) this.minutes.set(this.minute, { ...this.bar, volume: this.volume });
  }

  corrections(symbol: string): ChartCorrection[] {
    this.seal();
    if (this.expected.size) throw Error("provider_correction_pending");
    const revisions: ChartCorrection[] = [...this.affected].map(minute => ({ symbol, minute, bar: this.minutes.get(minute) ?? null }));
    const first = revisions[0];
    if (first && first.minute < this.premarketThrough && this.premarketVolume > 0 &&
        Number.isFinite(this.premarketDollarVolume)) {
      first.premarket = { through: this.premarketThrough, volume: this.premarketVolume, dollarVolume: this.premarketDollarVolume };
    }
    return revisions;
  }
}

type Pending = { start: number; expected: Map<string, SeenUpdate>; timer?: ReturnType<typeof setTimeout>; running: boolean; retryDelay: number };
const maxExpected = 50_000;

export class AlpacaChartCorrections {
  private readonly pending = new Map<string, Pending>();
  private readonly confirmed = new Map<string, Map<number, StoredChartCorrection>>();
  private readonly stop = new AbortController();
  private readonly premarketFinalizers = new Map<string, ReturnType<typeof setTimeout>>();
  private active = 0;
  private savedLoaded = false;
  constructor(private readonly rest: Pick<AlpacaRestData, "get">, private readonly publish: (revisions: StoredChartCorrection[]) => void,
    private readonly now = Date.now, private readonly readSaved?: (from: number) => readonly StoredChartCorrection[]) {}

  observe(message: Record<string, unknown>) {
    if (this.stop.signal.aborted || typeof message.S !== "string" || !/^[A-Z][A-Z0-9.-]{0,14}$/.test(message.S) ||
        typeof message.x !== "string" || !/^[A-Z]$/.test(message.x) || typeof message.z !== "string" || !/^[ABC]$/.test(message.z)) return;
    const correction = message.T === "c";
    if (!correction && (message.T !== "x" || message.a !== "C" && message.a !== "E")) return;
    const original = tradeIdentity(message.x, message.z, correction ? message.oi : message.i);
    const replacement = correction ? tradeIdentity(message.x, message.z, message.ci) : undefined;
    if (!original || correction && !replacement) return;
    const symbol = message.S;
    const pending = this.entry(symbol);
    if (!pending) return;
    const expected = pending.expected;
    if (expected.size >= maxExpected && !expected.has(original)) return;
    if (replacement !== original) expected.set(original, correction ? "incorrect" : "canceled");
    if (replacement) expected.set(replacement, "corrected");
    this.schedule(symbol, pending, 1000);
  }

  refresh(symbol: string) {
    const pending = this.entry(symbol);
    if (pending) this.schedule(symbol, pending, 1000);
  }

  private entry(symbol: string) {
    const day = easternDayStart(this.now() / 1000);
    let pending = this.pending.get(symbol);
    if (pending?.start !== day) {
      if (pending) clearTimeout(pending.timer);
      if (!pending && this.pending.size >= 64) return;
      pending = { start: day, expected: new Map(), running: false, retryDelay: 15_000 };
      this.pending.set(symbol, pending);
    }
    return pending;
  }

  private schedule(symbol: string, pending: Pending, delay: number) {
    if (pending.running || pending.timer || this.stop.signal.aborted) return;
    pending.timer = setTimeout(() => {
      pending.timer = undefined;
      if (this.pending.get(symbol) !== pending || pending.start !== easternDayStart(this.now() / 1000)) {
        if (this.pending.get(symbol) === pending) this.pending.delete(symbol);
        return;
      }
      if (this.active >= 2) { this.schedule(symbol, pending, 1000); return; }
      pending.running = true;
      this.active++;
      const expected = new Map(pending.expected);
      void this.read(symbol, pending.start, expected).then(revisions => {
        if (this.stop.signal.aborted || this.pending.get(symbol) !== pending ||
            [...pending.expected].some(([id, disposition]) => expected.get(id) !== disposition)) return;
        const saved = this.revisions(symbol) ?? new Map<number, StoredChartCorrection>();
        const changed = revisions.filter(revision => {
          const prior = saved.get(revision.minute);
          return !prior || JSON.stringify({ ...prior, correctionRevision: undefined }) !== JSON.stringify(revision);
        });
        // A new disposition can correct the trade identity without changing the candle.
        if (!changed.length && expected.size && revisions[0]) changed.push(revisions[0]);
        if (changed.length) {
          const previous = this.sessionRevision(symbol, easternClock(pending.start * 1000).date) ?? 0;
          const correctionRevision = Math.max(this.now(), previous + 1);
          const committed = changed.map(revision => ({ ...revision, correctionRevision }));
          for (const revision of committed) saved.set(revision.minute, revision);
          const cutoff = pending.start - 7 * 86_400;
          for (const minute of saved.keys()) if (minute < cutoff) saved.delete(minute);
          this.confirmed.set(symbol, saved);
          this.publish(committed);
        }
        const regularOpen = pending.start + 570 * 60;
        if (revisions.some(revision => revision.premarket && revision.premarket.through < regularOpen) &&
            !this.premarketFinalizers.has(symbol)) {
          const timer = setTimeout(() => {
            this.premarketFinalizers.delete(symbol);
            this.refresh(symbol);
          }, Math.max(0, (regularOpen + 15) * 1000 - this.now()));
          timer.unref();
          this.premarketFinalizers.set(symbol, timer);
        }
        pending.retryDelay = 15_000;
        for (const [id, observed] of expected) if (pending.expected.get(id) === observed) pending.expected.delete(id);
      }).catch(() => { /* Keep waiting for provider dispositions or complete pages. */ }).finally(() => {
        this.active--;
        pending.running = false;
        if (this.pending.get(symbol) !== pending || this.stop.signal.aborted) return;
        if (!pending.expected.size) this.pending.delete(symbol);
        else {
          this.schedule(symbol, pending, pending.retryDelay);
          pending.retryDelay = Math.min(300_000, pending.retryDelay * 2);
        }
      });
    }, delay);
    pending.timer.unref();
  }

  private async read(symbol: string, day: number, expected: Map<string, SeenUpdate>) {
    const start = day + 4 * 3600;
    const end = Math.min(day + 20 * 3600, Math.floor(this.now() / 60_000) * 60);
    if (start >= end) throw Error("correction_window_unavailable");
    const result = new AlpacaCorrectedMinutes(new Map(expected), Math.min(end, day + 570 * 60));
    const tokens = new Set<string>();
    let token: string | undefined;
    const signal = AbortSignal.any([this.stop.signal, AbortSignal.timeout(30_000)]);
    for (let page = 0; page < 200; page++) {
      const query = new URLSearchParams({ symbols: symbol, start: new Date(start * 1000).toISOString(),
        end: new Date(end * 1000 - 1).toISOString(), feed: "sip", sort: "asc", limit: "10000" });
      if (token) query.set("page_token", token);
      const response = await this.rest.get("/v2/stocks/trades", query, signal) as { trades?: Record<string, Trade[]>; next_page_token?: unknown };
      const trades = response.trades?.[symbol];
      if (!Array.isArray(trades) || trades.some(row => {
        const at = Date.parse(row?.t);
        return !Number.isFinite(at) || at < start * 1000 || at >= end * 1000;
      })) throw Error("incomplete_correction_history");
      for (const trade of trades) result.read(trade);
      if (response.next_page_token === null || response.next_page_token === undefined) return result.corrections(symbol);
      if (typeof response.next_page_token !== "string" || !response.next_page_token || tokens.has(response.next_page_token))
        throw Error("incomplete_correction_history");
      token = response.next_page_token;
      tokens.add(token);
    }
    throw Error("incomplete_correction_history");
  }

  private revisions(symbol: string) {
    if (!this.savedLoaded) {
      const rows = this.readSaved?.(easternDayStart(this.now() / 1000) - 7 * 86_400) ?? [];
      for (const correction of rows) {
        let minutes = this.confirmed.get(correction.symbol);
        if (!minutes) this.confirmed.set(correction.symbol, minutes = new Map());
        minutes.set(correction.minute, correction);
      }
      this.savedLoaded = true;
    }
    return this.confirmed.get(symbol);
  }

  values(symbol: string) { return this.revisions(symbol)?.values() ?? []; }
  sessionRevision(symbol: string, date: string): number | undefined {
    const revisions = this.revisions(symbol);
    if (!revisions) return undefined;
    const start = easternDayStart(Date.parse(date + "T12:00:00Z") / 1000);
    let latest = 0;
    for (const { minute, correctionRevision } of revisions.values()) {
      if (correctionRevision && minute >= start && minute < start + 86_400) {
        latest = Math.max(latest, correctionRevision);
      }
    }
    return latest || undefined;
  }

  isPending(symbol: string, start: number, end: number) {
    const state = this.pending.get(symbol);
    // The exchange update time is not the original execution time. Until confirmed,
    // the pending correction can affect any part of this East Coast trading day.
    return Boolean(state?.expected.size && start < (state.start + 20 * 3600) * 1000 &&
      end > (state.start + 4 * 3600) * 1000 && state.start === easternDayStart(this.now() / 1000));
  }

  /** IDs for cache invalidation only. Corrected candles still come from the history route. */
  manifest(request: TradeRevisionRequest): TradeRevisions {
    const symbols: TradeRevisions["symbols"] = {};
    for (const symbol of request.symbols) {
      const revisions = [...this.values(symbol)]
        .filter(({ minute }) => minute * 1000 >= request.start && minute * 1000 < request.end)
        .sort((a, b) => a.minute - b.minute);
      const pending = this.isPending(symbol, request.start, request.end);
      if (revisions.length || pending) symbols[symbol] = {
        minutes: revisions.map(({ minute }) => minute),
        pending,
        revision: revisions.length ? createHash("sha256").update(JSON.stringify(revisions)).digest("hex") : null,
      };
    }
    return { feed: "sip", symbols };
  }
  has(symbol: string, minute: number) { return this.revisions(symbol)?.has(minute) ?? false; }
  overlay<T extends AlpacaHistoryResult>(history: T, start: number, end: number): T {
    const corrections = [...this.values(history.symbol)].filter(({ minute }) => minute * 1000 >= start && minute * 1000 <= end &&
      (history.adjustment === "raw" || easternClock(minute * 1000).date === history.basisDate));
    if (!corrections.length) return history;
    const bars = new Map(history.bars.map(bar => [bar.time, bar]));
    for (const correction of corrections) applyChartCorrection(bars, correction);
    return { ...history, bars: [...bars.values()].sort((a, b) => a.time - b.time) };
  }
  close() {
    this.stop.abort();
    for (const pending of this.pending.values()) clearTimeout(pending.timer);
    for (const timer of this.premarketFinalizers.values()) clearTimeout(timer);
    this.pending.clear();
    this.premarketFinalizers.clear();
  }
}
