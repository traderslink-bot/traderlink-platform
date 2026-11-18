import type { ScreenerLiveUpdate } from "./live-market-worker";
import type { LiveScreenerFrame, LiveScreenerWindow } from "./live-screener-book";
import { MAX_LISTINGS, type ScreenerProviderSelection } from "./contracts";

const SEND_INTERVAL = 500;
const HEARTBEAT_INTERVAL = 1_000;
type Settings = {
  origin: string;
  token: string;
  window: LiveScreenerWindow;
  signal: AbortSignal;
  selection?: ScreenerProviderSelection;
  onError?: (status: number | "transport") => void;
};

/** A single bounded publisher. Retries send the latest known row for each symbol. */
export class LiveScreenerPublisher {
  private readonly rows = new Map<string, ScreenerLiveUpdate>();
  private readonly pending = new Map<string, ScreenerLiveUpdate>();
  private readonly endpoint: URL;
  private generation = 0;
  private sequence = 0;
  private lastSent = 0;
  private reset = true;
  private inflight = false;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly options: Settings, private readonly transport: typeof fetch = fetch) {
    const origin = new URL(options.origin);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash
      || origin.pathname !== "/" || options.token.length < 32) throw Error("invalid_live_publisher_configuration");
    this.endpoint = new URL("/api/internal/stock-screeners-live", origin);
  }

  start() {
    this.generation = Math.max(Date.now(), this.generation + 1);
    this.sequence = 0;
    this.reset = true;
    this.lastSent = 0;
    if (!this.timer) {
      this.timer = setInterval(() => void this.flush(), SEND_INTERVAL);
      this.timer.unref();
    }
  }

  clear() {
    clearInterval(this.timer);
    this.timer = undefined;
    this.rows.clear();
    this.pending.clear();
  }

  offer(rows: readonly ScreenerLiveUpdate[]) {
    for (const row of rows) {
      if (!this.rows.has(row.symbol) && this.rows.size >= MAX_LISTINGS) continue;
      this.rows.set(row.symbol, row);
      this.pending.set(row.symbol, row);
    }
    return true;
  }

  async flush() {
    const now = Date.now();
    const { signal, window, token } = this.options;
    if (!this.timer || this.inflight || signal.aborted || now >= window.end || now < this.generation
      || (!this.reset && !this.pending.size && now - this.lastSent < HEARTBEAT_INTERVAL)) return;
    const generation = this.generation;
    const reset = this.reset;
    const selected = [...(reset ? this.rows : this.pending).values()];
    const frame: LiveScreenerFrame = { ...window, ...this.options.selection, generation, sequence: this.sequence + 1, sentAt: now, reset, rows: selected };
    this.inflight = true;
    try {
      const response = await this.transport(this.endpoint, {
        method: "POST", redirect: "error", cache: "no-store",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(frame), signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
      });
      if (this.generation !== generation || !this.timer) return;
      if (response.status !== 204) {
        this.reset = true;
        this.options.onError?.(response.status);
        return;
      }
      this.reset = false;
      this.lastSent = now;
      this.sequence = frame.sequence;
      for (const row of selected) {
        if (this.pending.get(row.symbol) === row) this.pending.delete(row.symbol);
      }
    } catch {
      if (!signal.aborted && this.generation === generation && this.timer) {
        // The request may have reached the server. Resend a full book at a new sequence.
        this.sequence = frame.sequence;
        this.reset = true;
        this.options.onError?.("transport");
      }
    } finally {
      this.inflight = false;
    }
  }
}
