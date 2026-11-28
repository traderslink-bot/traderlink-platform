import { setTimeout as delay } from "node:timers/promises";
import { easternClock } from "../scanner/live/sessions";
import { readCorrectedScreenerVwapSeeds, screenerSessionVwap, type LiveVwapTotals, type ScreenerVwapSeed } from "./candle-cache-reader";

type TickerVwap = { quantity: number; notional: number; tradeAt: number; seed: ScreenerVwapSeed | null; invalid: boolean };
const MAX_ATTEMPTS = 3;
const MINUTE = 60_000;

/** One VWAP per symbol for the connected SIP session. A reconnect starts a new worker with a new history boundary. */
export class LiveScreenerVwapWorker {
  private readonly rows: Map<string, TickerVwap>;
  private readonly basisDate: string;
  private warming = false;

  constructor(
    symbols: readonly string[],
    private readonly sessionStart: number,
    private readonly liveFrom: number,
    private readonly sessionEnd: number,
    private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly readSeeds = readCorrectedScreenerVwapSeeds,
  ) {
    if (sessionStart > liveFrom || liveFrom >= sessionEnd || [sessionStart, liveFrom, sessionEnd].some(value => !Number.isSafeInteger(value) || value % MINUTE !== 0)) {
      throw Error("screener_live_invalid_session");
    }
    this.basisDate = easternClock(sessionStart).date;
    this.rows = new Map(symbols.map(symbol => [symbol, {
      quantity: 0,
      notional: 0,
      tradeAt: 0,
      invalid: false,
      seed: sessionStart === liveFrom ? { volume: 0, notional: 0, basisDate: this.basisDate, completedThroughMs: liveFrom } : null,
    }]));
  }

  observe(symbol: string, timestamp: number, price: number, quantity: number) {
    const row = this.rows.get(symbol);
    if (!row || row.invalid || !Number.isFinite(timestamp) || timestamp < this.liveFrom || timestamp >= this.sessionEnd
      || !Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) return;
    row.quantity += quantity;
    row.notional += quantity * price;
    row.tradeAt = Math.max(row.tradeAt, timestamp);
  }

  invalidate(symbol: string) {
    const row = this.rows.get(symbol);
    if (row) row.invalid = true;
  }

  reading(symbol: string) {
    const row = this.rows.get(symbol);
    if (!row?.seed || row.invalid) return null;
    const live: LiveVwapTotals = {
      basisDate: this.basisDate, fromMs: this.liveFrom, volume: row.quantity, notional: row.notional,
    };
    const vwap = screenerSessionVwap(row.seed, live);
    return vwap === null ? null : { vwap, vwapAt: Math.max(row.seed.completedThroughMs, row.tradeAt) };
  }

  async warm(onBatch: (symbols: readonly string[]) => void, signal: AbortSignal) {
    if (this.warming) return;
    this.warming = true;
    try {
      if (this.sessionStart === this.liveFrom) return;
      const window = { startMs: this.sessionStart, endMs: this.liveFrom };
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        signal.throwIfAborted();
        const missing = [...this.rows].flatMap(([symbol, row]) => !row.seed && !row.invalid ? [symbol] : []);
        if (!missing.length) return;
        try {
          for await (const batch of this.readSeeds(missing, window, this.environment, signal)) {
            const warmed: string[] = [];
            for (const [symbol, entry] of batch) {
              const row = this.rows.get(symbol);
              if (row && !row.seed && !row.invalid && entry.status === "complete" && entry.seed) {
                row.seed = entry.seed;
                warmed.push(symbol);
              }
            }
            if (warmed.length) onBatch(warmed);
          }
        } catch (error) {
          signal.throwIfAborted();
          if (!(error instanceof Error) || !["screener_seed_gateway_busy", "screener_seed_gateway_unavailable"].includes(error.message)) {
            throw error;
          }
        }
        if (![...this.rows.values()].some(row => !row.seed && !row.invalid)) return;
        if (attempt < MAX_ATTEMPTS - 1) await delay(250 * 2 ** attempt, undefined, { signal });
      }
    } finally {
      this.warming = false;
    }
  }
}
