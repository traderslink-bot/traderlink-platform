import "server-only";

import { easternDayStart, type Candle } from "@/src/modules/scanner/alpaca/candles";

type Range = { start: number; end: number };
type CandleRead = { bars: Candle[]; complete: boolean };
type Coverage = Range & CandleRead & { expires: number };
type Query = Range & {
  symbol: string;
  timeframe: "1Min" | "1Day";
  adjustment: "split" | "raw";
  basisDate: string;
};
type Entry = { pending: Promise<void>; coverage: Coverage[] };

const MAX_DOMAINS = 8;
const MAX_WINDOWS = 12;
const MAX_BARS = 24_000;
const MAX_ACCOUNT_BARS = 48_000;
const WINDOW_TTL = 5 * 60_000;
const LIVE_TAIL = 2 * 60_000;

function uncovered(range: Range, coverage: Coverage[]): Range[] {
  const gaps: Range[] = [];
  let from = range.start;
  for (const window of coverage) {
    if (window.end < from) continue;
    if (window.start > range.end) break;
    if (window.start > from) gaps.push({ start: from, end: window.start - 1 });
    from = Math.max(from, window.end + 1);
    if (from > range.end) break;
  }
  if (from <= range.end) gaps.push({ start: from, end: range.end });
  return gaps;
}

function waitFor(pending: Promise<void>, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    void pending.then(resolve).finally(() => signal.removeEventListener("abort", abort));
  });
}

/** Owned by one connection generation. Coverage represents finished provider requests,
 * including successful empty windows. Cached bars remain in their original share units. */
export class WorkspaceMoomooCandleCache {
  private readonly entries = new Map<string, Entry>();

  async read(query: Query, signal: AbortSignal, current: () => boolean,
    load: (range: Range) => Promise<CandleRead>, now: () => number = Date.now): Promise<CandleRead> {
    const key = JSON.stringify([query.symbol, query.timeframe, query.adjustment, query.basisDate]);
    const entry: Entry = this.entries.get(key) ?? { pending: Promise.resolve(), coverage: [] };
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > MAX_DOMAINS) this.entries.delete(this.entries.keys().next().value!);

    // Serialize overlapping read/commit operations for this candle basis. A
    // waiting request has its own cancellation and never cancels its peer.
    const previous = entry.pending;
    let finish!: () => void;
    const done = new Promise<void>(resolve => { finish = resolve; });
    entry.pending = previous.then(() => done);
    try {
      await waitFor(previous, signal);
      if (!current()) throw Error("broker_connection_changed");
      const timestamp = now();
      entry.coverage = entry.coverage.filter(window => window.expires > timestamp);
      const cached = entry.coverage.filter(window => window.start <= query.end && window.end >= query.start);
      const settledBoundary = query.timeframe === "1Day" ? easternDayStart(timestamp / 1000) * 1000
        : Math.floor((timestamp - LIVE_TAIL) / 60_000) * 60_000;
      const settled = Math.min(query.end, settledBoundary - 1);
      const stable: Range = { start: query.start, end: settled };
      const fresh: Range = { start: Math.max(query.start, settled + 1), end: query.end };
      const gaps = stable.start <= stable.end ? uncovered(stable, cached) : [];
      if (fresh.start <= fresh.end) {
        const last = gaps.at(-1);
        if (last && last.end + 1 === fresh.start) last.end = fresh.end;
        else gaps.push(fresh);
      }
      const fetched: Coverage[] = [];
      for (const range of gaps) {
        signal.throwIfAborted();
        const data = await load(range);
        signal.throwIfAborted();
        if (!current()) throw Error("broker_connection_changed");
        fetched.push({ ...range, ...data, expires: now() + WINDOW_TTL });
      }

      const merged = new Map<number, Candle>();
      for (const window of [...cached, ...fetched]) {
        for (const bar of window.bars) {
          const ms = bar.time * 1000;
          if (ms >= query.start && ms <= query.end) merged.set(bar.time, bar);
        }
      }
      for (const window of fetched) {
        if (!window.complete || window.start > settled) continue;
        const end = Math.min(window.end, settled);
        const bars = window.bars.filter(bar => bar.time * 1000 <= end);
        if (bars.length <= MAX_BARS) entry.coverage.push({ ...window, end, bars });
      }
      entry.coverage = entry.coverage.slice(-MAX_WINDOWS);
      while (entry.coverage.reduce((total, window) => total + window.bars.length, 0) > MAX_BARS) entry.coverage.shift();
      entry.coverage.sort((a, b) => a.start - b.start);
      let retained = [...this.entries.values()].reduce((total, item) =>
        item.coverage.reduce((count, window) => count + window.bars.length, total), 0);
      for (const [domain, item] of this.entries) {
        if (retained <= MAX_ACCOUNT_BARS) break;
        if (domain === key) continue;
        retained -= item.coverage.reduce((count, window) => count + window.bars.length, 0);
        this.entries.delete(domain);
      }
      return { bars: [...merged.values()].sort((a, b) => a.time - b.time), complete: fetched.every(window => window.complete) };
    } finally { finish(); }
  }
}
