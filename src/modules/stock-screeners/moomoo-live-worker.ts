import { setTimeout as delay } from "node:timers/promises";
import { easternClock } from "../scanner/live/sessions";
import { snapshotBatches } from "../scanner/live/snapshots";
import { pacedSnapshotPass, DEFAULT_SCANNER_SNAPSHOT_SPACING_MS } from "../scanner/live/server/snapshot-pacing";
import { isObject } from "./contracts";
import type { ScreenerLiveUpdate } from "./live-market-worker";
import type { LiveScreenerWindow } from "./live-screener-book";

const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

export function moomooScreenerLiveUpdates(payload: unknown, symbols: readonly string[], window: LiveScreenerWindow, now: number): ScreenerLiveUpdate[] {
  if (!isObject(payload) || payload.ret_code !== 0 || !isObject(payload.data) || !Array.isArray(payload.data.snapshot_list))
    throw Error("moomoo_quotes_unavailable");
  const requested = new Set(symbols), observed = new Set<string>();
  const updates: ScreenerLiveUpdate[] = [];
  for (const row of payload.data.snapshot_list) {
    if (!isObject(row) || typeof row.code !== "string" || !row.code.startsWith("US.")) continue;
    const symbol = row.code.slice(3);
    if (!requested.has(symbol)) continue;
    if (observed.has(symbol)) throw Error("moomoo_quotes_duplicate");
    observed.add(symbol);
    const at = row.update_time;
    if (typeof at !== "number" || !Number.isSafeInteger(at) || at < window.start || at >= window.end || at > now
      || row.data_date !== easternClock(at).date) continue;
    const prefix = window.session === "premarket" ? "pre_" : window.session === "after_hours" ? "after_" : "";
    const price = row[prefix ? `${prefix}price` : "last_price"];
    const volume = row[`${prefix}volume`], notional = row[`${prefix}turnover`];
    if (!positive(price)) continue;
    const vwap = positive(volume) && positive(notional) ? notional / volume : null;
    updates.push({ symbol, price, priceAt: at, vwap: positive(vwap) ? vwap : null, ...(positive(vwap) ? { vwapAt: at } : {}) });
  }
  return updates;
}

/** Retain Moomoo's bulk polling transport and its actual provider timestamps. */
export async function runMoomooScreenerSession(options: {
  symbols: readonly string[]; window: LiveScreenerWindow; signal: AbortSignal;
  spacingMs?: number;
  universe?(): Promise<{ symbols: readonly string[]; spacingMs: number }>;
  read(symbols: string[]): Promise<unknown>;
  observe?(payload: unknown, symbols: readonly string[]): void;
  completedPass?(): Promise<void>;
  publish(rows: readonly ScreenerLiveUpdate[]): void;
  connected(): void; disconnected(): void;
}) {
  options.connected();
  try {
    while (!options.signal.aborted && Date.now() < options.window.end) {
      const universe = await options.universe?.();
      const symbols = universe?.symbols ?? options.symbols;
      const spacingMs = universe?.spacingMs ?? options.spacingMs ?? DEFAULT_SCANNER_SNAPSHOT_SPACING_MS;
      await pacedSnapshotPass(snapshotBatches(symbols), async batch => {
        options.signal.throwIfAborted();
        if (Date.now() >= options.window.end) return;
        try {
          const payload = await options.read([...batch]);
          options.signal.throwIfAborted();
          const updates = moomooScreenerLiveUpdates(payload, batch, options.window, Date.now());
          options.observe?.(payload, batch);
          options.publish(updates);
        } catch (error) {
          options.signal.throwIfAborted();
          if (error instanceof Error && error.message === "screener_provider_changed") throw error;
          // Preserve other batches in the pass, as the retained Scanner transport does.
        }
      }, { spacingMs, pause: ms => delay(ms, undefined, { signal: options.signal }) });
      if (Date.now() >= options.window.end) return;
      await options.completedPass?.();
      await delay(5_000, undefined, { signal: options.signal });
    }
  } finally {
    options.disconnected();
  }
}
