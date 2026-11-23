import { lstatSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AlpacaHistoryRequest, AlpacaHistoryResult } from "../../scanner/alpaca/rest-data";
import { easternClock } from "../../scanner/live/sessions";
import { CandleSplitEventStore } from "./split-event-store";
import { ReadonlyCandleHistoryStore } from "./store";
import type { CandleArchiveRead, CandleArchiveReply } from "./transport";

function hasWalFiles(path: string) {
  return [path, path + "-wal", path + "-shm"].every(file => lstatSync(file, { throwIfNoEntry: false })?.isFile());
}

export class ReadonlyCandleArchive {
  private readonly splitEventsPath: string;

  constructor(private readonly path: string, private readonly now = Date.now) {
    this.splitEventsPath = join(dirname(path), "split-events.sqlite");
  }

  read(input: CandleArchiveRead): CandleArchiveReply {
    const date = easternClock(this.now()).date;
    const bars = this.withStore(store => store.readForDate(input, date));
    return bars ? { state: "ready", bars, start: input.start, end: input.end, basisDate: date } : { state: "miss" };
  }

  readChartHistory(request: AlpacaHistoryRequest): AlpacaHistoryResult | null {
    const { timeframe, symbol } = request;
    if (request.adjustment === "raw" || request.acceptedEvidence || request.sessionMode ||
      (timeframe !== "1Min" && timeframe !== "1Day")) return null;
    const start = Math.ceil(request.start / 1_000);
    const end = Math.floor(request.end / 1_000) + 1;
    if (start >= end) return null;
    const result = this.read({ symbol, start, end, frame: timeframe === "1Day" ? "1D" : "1m",
      session: timeframe === "1Day" ? "daily" : "extended" });
    if (result.state === "miss") return null;
    return { symbol, feed: "sip", adjustment: "split", basisDate: result.basisDate, bars: result.bars,
      complete: true, nextPageToken: null };
  }

  readQualifiedSplitHistory(symbol: string) {
    const date = easternClock(this.now()).date;
    return this.withStore(store => {
      const basis = store.basisFor(symbol, date);
      if (!basis || !hasWalFiles(this.splitEventsPath)) return null;
      const history = CandleSplitEventStore.readQualifiedFile(this.splitEventsPath, symbol, basis);
      return history && history.basisDate <= date && store.basisFor(symbol, date) === basis ? history : null;
    });
  }

  private withStore<T>(read: (store: ReadonlyCandleHistoryStore) => T): T | null {
    try {
      if (!hasWalFiles(this.path)) return null;
      const store = new ReadonlyCandleHistoryStore(this.path);
      try { return read(store); }
      finally { store.close(); }
    } catch {
      // Unavailable archive evidence leaves the existing provider fallback in charge.
      return null;
    }
  }
}
