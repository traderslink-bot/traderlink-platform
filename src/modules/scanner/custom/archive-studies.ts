import { closedScannerStudySession } from "../../market-data/candle-history/scanner-study-session";
import type { ScanPattern } from "./candle-patterns";
import {
  aggregateCandles,
  candleBucket,
  chartCalendarPeriodStart,
  easternDayStart,
  type Candle,
} from "../alpaca/candles";
import { easternClock } from "../live/sessions";
import type {
  CandleArchiveRead,
  CandleArchiveReply,
} from "../../market-data/candle-history/transport";
import {
  isBenchmarkStudy,
  studyHistorySize,
  type StudyFrame,
  type CandleStudy,
} from "./audited-filters";
import { candleStudyValue } from "./candle-study-values";

export type StudyArchiveReader = (
  query: CandleArchiveRead,
) => Promise<CandleArchiveReply>;
type Entry = {
  key: string;
  values: Map<string, number | null>;
  requested: Map<
    string,
    {
      metric: CandleStudy;
      period: number;
      fast?: number;
      signal?: number;
      pattern?: ScanPattern;
    }
  >;
  query: CandleArchiveRead;
  frame: StudyFrame;
  basis: string;
  basisFrom: string;
  readAt: number;
  requestedAt: number;
  retryAt: number;
  loading: boolean;
};
const day = 86400;
function archiveRange(
  symbol: string,
  frame: StudyFrame,
  cutoff: number,
  depth: number,
  closed: ReturnType<typeof closedScannerStudySession>,
) {
  const seconds = Math.floor(cutoff / 1000),
    daily = frame === "1D" || frame === "1W";
  const currentEnd =
    frame === "1W"
      ? chartCalendarPeriodStart(seconds, "1W")
      : daily
        ? easternDayStart(seconds)
        : candleBucket(seconds, frame);
  const useSessionClose = closed && (frame !== "1W" || closed.weekFinished);
  const end = useSessionClose ? closed.close : currentEnd;
  const perSession =
    frame === "4h" ? 4 : frame === "1h" ? 16 : frame === "30m" ? 32 : 1;
  const days =
    frame === "1W"
      ? (depth + 1) * 7
      : Math.ceil((depth / perSession) * 1.6) + 7;
  return {
    symbol,
    frame: daily ? "1D" : frame,
    session: daily ? "daily" : "extended",
    start: end - days * day,
    end,
  } as CandleArchiveRead;
}

// Compute subscribed readings once per completed period. Concurrent scans share one read.
// Only the aggregate numbers survive each read. The archive service performs no provider backfill here.
export class ArchiveStudies {
  private readonly entries = new Map<string, Entry>();
  private readonly pending = new Set<Entry>();
  private active = 0;
  private windows = new Map<
    string,
    { at: number; range: CandleArchiveRead; basis: string; basisFrom: string }
  >();
  private readonly benchmarks = new Map<
    string,
    { request: Promise<readonly Candle[] | undefined>; retryAt: number }
  >();
  invalidateCorrectedSymbol(symbol: string) {
    if (symbol === "SPY") this.benchmarks.clear();
    for (const [key, entry] of this.entries) {
      const affectedBenchmark = symbol === "SPY" &&
        Array.from(entry.requested.values()).some(read => isBenchmarkStudy(read.metric));
      if (entry.query.symbol === symbol || affectedBenchmark) {
        this.pending.delete(entry);
        this.entries.delete(key);
      }
    }
  }

  private covers(
    entry: Entry,
    result: CandleArchiveReply,
  ): result is Extract<CandleArchiveReply, { state: "ready" }> {
    return result.state === "ready" &&
      /^\d{4}-\d{2}-\d{2}$/.test(result.basisDate) &&
      result.basisDate >= entry.basisFrom &&
      result.basisDate <= entry.basis &&
      result.start === entry.query.start &&
      result.end === entry.query.end;
  }
  private benchmark(entry: Entry) {
    const key =
      entry.basis +
      ":" +
      entry.frame +
      ":" +
      entry.query.start +
      ":" +
      entry.query.end;
    const cached = this.benchmarks.get(key);
    if (cached && Date.now() < cached.retryAt) return cached.request;
    const operation = this.read({ ...entry.query, symbol: "SPY" })
      .then((result) => {
        if (!this.covers(entry, result)) return undefined;
        return entry.frame === "1W"
          ? aggregateCandles(result.bars, "1W").filter(
              (b) => b.time >= entry.query.start,
            )
          : result.bars;
      })
      .catch(() => undefined);
    const saved = { request: operation, retryAt: Infinity };
    this.benchmarks.set(key, saved);
    void operation.then((bars) => {
      if (!bars) saved.retryAt = Date.now() + 60_000;
    });
    while (this.benchmarks.size > 24)
      this.benchmarks.delete(this.benchmarks.keys().next().value!);
    return operation;
  }
  constructor(
    private readonly read: StudyArchiveReader,
    private readonly changed: () => void,
  ) {}
  value(
    symbol: string,
    frame: StudyFrame,
    metric: CandleStudy,
    period: number,
    at: number,
    fast?: number,
    signal?: number,
    pattern?: ScanPattern,
  ) {
    const required = studyHistorySize(metric, period, signal);
    const depth = required <= 100 ? 100 : required <= 250 ? 250 : 400;
    const bucket = frame + "/" + depth;
    let window = this.windows.get(bucket);
    if (window?.at !== at) {
      const basis = easternClock(at).date;
      const closed = closedScannerStudySession(basis);
      window = {
        at,
        range: archiveRange("", frame, at, depth, closed),
        basis,
        basisFrom: closed?.basisFrom ?? basis,
      };
      this.windows.set(bucket, window);
    }
    const range = window.range,
      key = symbol + "/" + bucket,
      basis = window.basis;
    let entry = this.entries.get(key);
    if (!entry || entry.query.end !== range.end || entry.basis !== basis) {
      if (entry) this.pending.delete(entry);
      entry = {
        key,
        query: { ...range, symbol },
        frame,
        basis,
        basisFrom: window.basisFrom,
        values: new Map(),
        requested: new Map(),
        readAt: 0,
        retryAt: 0,
        requestedAt: Date.now(),
        loading: false,
      };
      this.entries.set(key, entry);
      if (this.entries.size > 24000) {
        const oldest = this.entries.keys().next().value!;
        this.pending.delete(this.entries.get(oldest)!);
        this.entries.delete(oldest);
      }
    }
    const id = [metric, period, fast, signal, pattern].join("/");
    entry.requestedAt = Date.now();
    entry.requested.set(id, { metric, period, fast, signal, pattern });
    if (
      (!entry.values.has(id) ||
        (entry.values.get(id) === null &&
          Date.now() - entry.readAt >= 300_000)) &&
      !entry.loading &&
      Date.now() >= entry.retryAt
    ) {
      this.pending.add(entry);
      this.pump();
    }
    return entry.values.get(id) ?? null;
  }
  private pump() {
    while (this.active < 3 && this.pending.size) {
      const entry = this.pending.values().next().value!;
      this.pending.delete(entry);
      if (Date.now() - entry.requestedAt > 90_000) continue;
      entry.loading = true;
      this.active++;
      void this.load(entry).finally(() => {
        entry.loading = false;
        this.active--;
        this.pump();
      });
    }
  }
  private async load(entry: Entry) {
    try {
      const result = await this.read(entry.query);
      if (this.entries.get(entry.key) !== entry) return;
      if (!this.covers(entry, result)) {
        entry.retryAt = Date.now() + 60_000;
        return;
      }
      const bars = result.bars.filter(
        (bar) => bar.time >= entry.query.start && bar.time < entry.query.end,
      );
      // The first weekly bucket can be partial at the left edge of the requested range.
      const source =
        entry.frame === "1W"
          ? aggregateCandles(bars, "1W").filter(
              (b) => b.time >= entry.query.start,
            )
          : bars;
      const base = [...entry.requested.values()].some((r) =>
        isBenchmarkStudy(r.metric),
      )
        ? await this.benchmark(entry)
        : undefined;
      for (const [
        key,
        { metric, period, fast, signal, pattern },
      ] of entry.requested)
        entry.values.set(
          key,
          candleStudyValue(metric, source, period, base, fast, signal, pattern),
        );
      entry.readAt = Date.now();
      this.changed();
    } catch {
      entry.retryAt = Date.now() + 60_000;
    }
  }
}
