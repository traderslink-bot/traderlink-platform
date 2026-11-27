import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { aggregateCandles, candleBucket, chartSymbol, easternDayStart, type Candle } from "../../scanner/alpaca/candles";
import type { ChartCorrection, StoredChartCorrection } from "../../scanner/alpaca/chart-correction";
import { ChartSessionCalendar } from "../../scanner/alpaca/chart-calendar";
import type { AlpacaChartCalendar } from "../../scanner/alpaca/chart-calendar-provider";
import type { AlpacaSplitHistory } from "../../scanner/alpaca/chart-vwap-events";
import type { AlpacaHistoryRequest, AlpacaHistoryResult, AlpacaRestData } from "../../scanner/alpaca/rest-data";
import { easternClock } from "../../scanner/live/sessions";
import { candleHistoryTargets, fillCandleHistoryWindow, nextCandleHistoryGap, retentionCutoff, type BackfillWindowDays } from "./backfill";
import { CANDLE_HISTORY_FRAMES, eligibleHistorySymbols, parseCandleHistorySettings, popularBackgroundSymbols, type CandleHistorySettings } from "./settings";
import { CandleSplitEventStore } from "./split-event-store";
import { CandleHistoryStore } from "./store";
import type { CandleArchiveRead, CandleArchiveReply } from "./transport";

const daySeconds = 86_400;
const midnight = (date: string) => easternDayStart(Date.parse(date + "T12:00:00Z") / 1_000);
const liveFrames = [["5m", 300], ["15m", 900], ["30m", 1_800], ["1h", 3_600], ["4h", 14_400]] as const;

export class AlpacaCandleArchive {
  private readonly store: CandleHistoryStore;
  private readonly splitEventsPath: string;
  private splitEvents?: CandleSplitEventStore;
  private settings: CandleHistorySettings;
  private readonly calendar = new ChartSessionCalendar();
  private calendarDay?: string;
  private calendarLoad?: { date: string; revision: number; work: Promise<void> };
  private readonly complete = new Set<string>();
  private readonly retryAt = new Map<string, number>();
  private progressDate?: string;
  private rosterRevision = 0;
  private readonly dailyBasis = new Map<string, { date: string; basis: string }>();
  private readonly archiveReads = new Map<string, number>();
  private readonly readsPending = new Set<Promise<void>>();
  private cleanAt = 0;
  private readonly pendingMinutes = new Map<string, { symbol: string; bar: Candle }>();
  private marketCap: Set<string>;
  private selected: Set<string>;
  private roster: string[] = [];
  private targetIndex = 0;
  private readonly backfills = new Map<string, Promise<void>>();
  private stopped = false;
  private readonly timer: ReturnType<typeof setInterval>;

  constructor(path: string, private readonly rest: Pick<AlpacaRestData, "history">,
    private readonly sourceCalendar: Pick<AlpacaChartCalendar, "forYear">,
    private readonly readSplitBasis: (symbol: string) => Promise<string | AlpacaSplitHistory>,
    private readonly now = Date.now,
    private readonly backfillConcurrency: 1 | 2 | 4 = 1,
    private readonly olderBackfillWindowDays: BackfillWindowDays = 30,
    backfillIntervalMs: 250 | 2_500 = 250) {
    this.store = new CandleHistoryStore(path);
    this.splitEventsPath = join(dirname(path), "split-events.sqlite");
    this.settings = this.store.settings();
    this.marketCap = new Set(this.store.roster());
    this.selected = new Set(this.marketCap);
    this.resetRoster();
    this.timer = setInterval(() => this.schedule(), backfillIntervalMs);
    this.timer.unref();
  }

  close() {
    this.stopped = true;
    clearInterval(this.timer);
    this.pendingMinutes.clear();
    void Promise.allSettled([...this.backfills.values(), ...this.readsPending]).then(() => {
      this.splitEvents?.close();
      this.store.close();
    });
  }

  state() {
    this.refreshProgressDay();
    return {
      settings: this.settings,
      storage: this.store.storage(this.marketCap, new Set(this.settings.popularTickers)),
      backfill: {
        total: this.roster.length,
        complete: this.complete.size,
        retrying: this.retryAt.size,
      },
    };
  }

  backgroundSymbols() { return popularBackgroundSymbols(this.settings); }

  changeSettings(input: unknown, universe: readonly { symbol: string; marketCap: number | null }[]) {
    const requested = parseCandleHistorySettings(input);
    const target = eligibleHistorySymbols(universe, requested);
    this.settings = this.store.changeSettings(requested, [...target.marketCap]);
    this.marketCap = target.marketCap;
    this.calendarDay = undefined;
    this.resetRoster();
    return this.state();
  }

  setUniverse(universe: readonly { symbol: string; marketCap: number | null }[], settingsRevision?: number) {
    if (settingsRevision !== undefined && settingsRevision !== this.settings.revision) {
      throw Error("candle_history_settings_conflict");
    }
    const target = eligibleHistorySymbols(universe, this.settings);
    if (target.marketCap.size === this.marketCap.size && [...target.marketCap].every(symbol => this.marketCap.has(symbol))) return;
    this.store.replaceRoster([...target.marketCap]);
    this.marketCap = target.marketCap;
    this.resetRoster();
  }

  private resetRoster() {
    this.selected = new Set([...this.marketCap, ...this.settings.popularTickers]);
    this.roster = [...this.selected];
    this.targetIndex = 0;
    this.rosterRevision++;
    this.complete.clear();
    this.retryAt.clear();
  }

  private refreshProgressDay() {
    const date = easternClock(this.now()).date;
    if (this.progressDate === date) return;
    this.progressDate = date;
    this.targetIndex = 0;
    this.complete.clear();
    this.retryAt.clear();
  }

  readScannerStudy(input: CandleArchiveRead): CandleArchiveReply {
    return this.stopped ? { state: "miss" } : this.store.readScannerStudy(input, easternClock(this.now()).date);
  }

  read(input: CandleArchiveRead): CandleArchiveReply {
    if (this.stopped) return { state: "miss" };
    const date = easternClock(this.now()).date;
    const basis = this.currentBasis(input.symbol, date);
    if (!basis) return { state: "miss" };
    const bars = this.store.read({ ...input, basis });
    return bars ? { state: "ready", bars, start: input.start, end: input.end, basisDate: date } : { state: "miss" };
  }

  async readChartHistory(
    request: AlpacaHistoryRequest, dailyStartup = false,
  ): Promise<(AlpacaHistoryResult & { chartPageStart?: number }) | null> {
    const { symbol, timeframe } = request;
    if (this.stopped || request.adjustment === "raw" || request.acceptedEvidence || request.sessionMode ||
      (timeframe !== "1Min" && timeframe !== "1Day")) return null;
    const basisDate = easternClock(this.now()).date;
    const basis = this.currentBasis(symbol, basisDate);
    if (!basis) return null;
    const requestedStart = Math.ceil(request.start / 1_000);
    const cutoff = dailyStartup && timeframe === "1Day"
      ? retentionCutoff(basisDate, this.settings.retention["1D"], this.calendar) : undefined;
    const start = Math.max(requestedStart, cutoff ?? requestedStart);
    const page = start > requestedStart ? { chartPageStart: start * 1_000 } : {};
    const end = Math.floor(request.end / 1_000) + 1;
    if (start >= end) return null;
    const window = { symbol, basis, start, end,
      frame: timeframe === "1Day" ? "1D" as const : "1m" as const,
      session: timeframe === "1Day" ? "daily" as const : "extended" as const };
    const gaps = this.store.missing(window);
    const [tail] = gaps;
    // A hole inside the window or an uncovered older start needs the normal provider read.
    if (gaps.length > 1 || (tail && (tail.start === start || tail.end !== end))) return null;
    const bars = this.store.read({ ...window, end: tail?.start ?? end });
    if (!bars || (page.chartPageStart !== undefined && !bars.length)) return null;
    if (tail) {
      const tailRequest = { ...request, start: tail.start * 1_000 };
      if (tailRequest.start >= request.end) return null;
      const recent = await this.rest.history(tailRequest);
      if (!recent.complete || recent.nextPageToken !== null || recent.symbol !== symbol || recent.feed !== "sip" ||
        recent.adjustment !== "split" || recent.basisDate !== basisDate || this.stopped ||
        easternClock(this.now()).date !== basisDate || this.currentBasis(symbol, basisDate) !== basis) return null;
      this.rememberChartHistory(tailRequest, recent);
      return { ...recent, ...page, bars: [...bars, ...recent.bars] };
    }
    return { symbol, feed: "sip", adjustment: "split", basisDate, bars, complete: true, nextPageToken: null, ...page };
  }

  readEffectiveSplitHistories() {
    return CandleSplitEventStore.readEffectiveFile(this.splitEventsPath, easternClock(this.now()).date);
  }

  readQualifiedSplitHistory(input: string) {
    if (this.stopped) return null;
    const symbol = chartSymbol(input);
    const priceBasisDate = easternClock(this.now()).date;
    const priceBasis = this.currentBasis(symbol, priceBasisDate);
    if (!priceBasis) return null;
    const history = this.splitEvents
      ? this.splitEvents.readQualified(symbol, priceBasis)
      : CandleSplitEventStore.readQualifiedFile(this.splitEventsPath, symbol, priceBasis);
    return history && history.basisDate <= priceBasisDate ? history : null;
  }

  readScannerDaily(symbol: string, start: number, end: number) {
    if (this.stopped) return null;
    const basis = this.currentBasis(symbol, easternClock(this.now()).date);
    if (!basis) return null;
    const window = { symbol, basis, frame: "1D" as const, session: "daily" as const, start, end };
    const gaps = this.store.missing(window);
    if (gaps.some(gap => gap.start !== start && gap.end !== end)) return null;
    const head = gaps[0]?.start === start ? gaps[0] : undefined;
    const last = gaps.at(-1);
    const tail = last?.end === end ? last : undefined;
    const coveredStart = head?.end ?? start;
    const coveredEnd = tail?.start ?? end;
    if (coveredStart >= coveredEnd) return null;
    const requests = gaps.filter(gap => {
      for (let day = easternDayStart(gap.start); day < gap.end; day = easternDayStart(day + 36 * 3_600)) {
        if (!this.calendar.covers(day) || this.calendar.sessionAt(day)) return true;
      }
      return false;
    });
    if (requests.length > 1) return null;
    const bars = this.store.read({ ...window, start: coveredStart, end: coveredEnd });
    return bars && { bars, missing: requests[0] ?? null };
  }

  /** Reuse a successful Scanner provider read when the archive already has today's verified split basis. */
  rememberScannerDaily(date: string, start: number, end: number, entries: readonly { symbol: string; bars: Candle[] }[]) {
    if (this.stopped || !entries.length) return;
    setImmediate(() => {
      if (this.stopped || date !== easternClock(this.now()).date || end > midnight(date)) return;
      try {
        const cutoff = retentionCutoff(date, this.settings.retention["1D"], this.calendar);
        if (cutoff === undefined || end <= Math.max(start, cutoff)) return;
        const windows = entries.flatMap(({ symbol, bars }) => {
          if (!this.selected.has(symbol)) return [];
          const basis = this.currentBasis(symbol, date);
          if (!basis) return [];
          const window = { symbol, basis, frame: "1D" as const, session: "daily" as const,
            start: Math.max(start, cutoff), end };
          return this.store.missing(window).map(gap => ({
            ...window, ...gap, bars: bars.filter(bar => bar.time >= gap.start && bar.time < gap.end),
          }));
        });
        if (windows.length) this.store.saveVerified(windows);
      } catch { /* The current Scanner result can still use its completed provider read. */ }
    });
  }

  private currentBasis(symbol: string, date: string) {
    const existing = this.dailyBasis.get(symbol);
    return existing?.date === date ? existing.basis : this.store.basisFor(symbol, date);
  }

  private async verifyBasis(symbol: string, date: string) {
    const existing = this.currentBasis(symbol, date);
    if (existing) return existing;
    const history = await this.readSplitBasis(symbol);
    if (this.stopped || date !== easternClock(this.now()).date) return;
    if (typeof history !== "string") {
      if (history.symbol !== symbol || history.basisDate !== date) throw Error("invalid_history_split_evidence");
      this.splitEvents ??= new CandleSplitEventStore(this.splitEventsPath);
      this.splitEvents.save(history);
    }
    const revision = typeof history === "string" ? history : history.revision;
    const basis = createHash("sha256").update("alpaca-sip-split-archive-v1:" + revision).digest("hex");
    this.store.updateBasis(symbol, date, basis);
    this.dailyBasis.set(symbol, { date, basis });
    return basis;
  }

  /** Save the completed part of already-fetched ordinary chart pages without delaying their response. */
  rememberChartHistory(request: AlpacaHistoryRequest, result: AlpacaHistoryResult) {
    const { symbol, timeframe } = request;
    if (this.stopped || this.readsPending.size >= 2 || request.sessionMode || request.acceptedEvidence ||
      (timeframe !== "1Min" && timeframe !== "1Day") ||
      result.feed !== "sip" || result.adjustment !== "split" || !result.complete || result.nextPageToken !== null) return;
    const now = this.now();
    const date = easternClock(now).date;
    if (result.basisDate !== date || result.symbol !== symbol) return;
    const capture = async () => {
      const basis = await this.verifyBasis(symbol, date);
      if (!basis || this.stopped) return;
      const frame = timeframe === "1Day" ? "1D" : "1m";
      const limit = retentionCutoff(date, this.settings.retention[frame], this.calendar);
      if (limit === undefined) return;
      const start = Math.max(Math.ceil(request.start / 60_000) * 60, limit);
      const end = Math.min(Math.floor((request.end + 1) / 60_000) * 60, frame === "1D" ? midnight(date) : Math.floor(now / 60_000) * 60);
      if (end <= start) return;
      const bars = result.bars.filter(bar => bar.time >= start && bar.time < end);
      if (frame === "1m") {
        for (let cursor = easternDayStart(start); cursor < end; cursor = easternDayStart(cursor + 36 * 3_600)) {
          if (!this.calendar.covers(cursor)) return;
        }
      }
      const allHours = frame === "1D" ? bars : bars.filter(bar => {
        const session = this.calendar.sessionAt(bar.time);
        return session && bar.time >= session.start + 240 * 60 && bar.time < session.start + 1_200 * 60;
      });
      this.store.saveVerified([{ symbol, basis, frame, session: frame === "1D" ? "daily" : "extended", start, end, bars: allHours }]);
      this.touch(symbol);
    };
    const work = capture().catch(() => { /* Ordinary chart results always retain their existing source path. */ });
    this.readsPending.add(work);
    void work.finally(() => this.readsPending.delete(work));
  }

  touch(symbol: string) {
    if (!this.selected.has(symbol) && this.now() - (this.archiveReads.get(symbol) ?? 0) > 60_000) {
      this.store.touchTicker(symbol, this.now());
      this.archiveReads.delete(symbol);
      this.archiveReads.set(symbol, this.now());
      if (this.archiveReads.size > 512) this.archiveReads.delete(this.archiveReads.keys().next().value!);
    }
  }

  enqueueMinute(rawSymbol: string, bar: Candle) {
    if (this.stopped || !this.selected.has(rawSymbol) || this.pendingMinutes.size >= 12_000) return;
    this.pendingMinutes.set(rawSymbol + ":" + bar.time, { symbol: rawSymbol, bar });
  }

  private schedule() {
    if (this.stopped) return;
    try {
      this.flushMinutes();
      const now = this.now();
      if (now - this.cleanAt > 60_000) {
        this.cleanAt = now;
        this.store.expireOnDemand(this.selected, now - 30 * daySeconds * 1_000, 256);
      }
    } catch { /* The next qualified history read repairs a failed live batch. */ }
    this.refreshProgressDay();
    if (this.complete.size === this.roster.length) return;
    const now = this.now();
    const revision = this.rosterRevision;
    const day = this.progressDate;
    const canSave = () => !this.stopped && this.rosterRevision === revision && easternClock(this.now()).date === day;
    while (this.backfills.size < this.backfillConcurrency) {
      const symbol = this.nextBackfillSymbol(now);
      if (!symbol) return;
      const work = this.fillSymbol(symbol, canSave).then(completed => {
        if (!canSave()) return;
        this.retryAt.delete(symbol);
        if (completed) this.complete.add(symbol);
      }).catch(() => {
        if (canSave()) this.retryAt.set(symbol, this.now() + 30_000);
      }).finally(() => {
        this.backfills.delete(symbol);
      });
      this.backfills.set(symbol, work);
    }
  }

  private nextBackfillSymbol(now: number): string | undefined {
    for (let attempts = 0; attempts < this.roster.length; attempts++) {
      const candidate = this.roster[this.targetIndex++ % this.roster.length];
      if (!this.backfills.has(candidate) && !this.complete.has(candidate) &&
        (this.retryAt.get(candidate) ?? 0) <= now) return candidate;
    }
  }

  private async prepareCalendar(date: string, settings: CandleHistorySettings, canSave: () => boolean) {
    if (this.calendarDay === date) return;
    const revision = this.rosterRevision;
    if (this.calendarLoad?.date === date && this.calendarLoad.revision === revision) return this.calendarLoad.work;
    const work = (async () => {
      const year = Number(date.slice(0, 4));
      const maxYears = Math.min(16, Math.max(...CANDLE_HISTORY_FRAMES.map(frame => {
        const { amount, unit } = settings.retention[frame];
        return Math.ceil(amount / (unit === "months" ? 12 : unit === "sessions" ? 250 : 365));
      })));
      let complete = true;
      for (let offset = 0; offset <= maxYears && canSave(); offset++) {
        const calendar = await this.sourceCalendar.forYear(year - offset);
        if (!canSave()) return;
        this.calendar.merge(calendar);
        complete &&= calendar.available;
      }
      if (complete && canSave()) this.calendarDay = date;
    })();
    this.calendarLoad = { date, revision, work };
    try {
      await work;
    } finally {
      if (this.calendarLoad?.work === work) this.calendarLoad = undefined;
    }
  }

  private async fillSymbol(symbol: string, canSave: () => boolean) {
    const now = this.now();
    const date = easternClock(now).date;
    const settings = this.settings;
    await this.prepareCalendar(date, settings, canSave);
    if (!canSave()) return false;
    const basis = await this.verifyBasis(symbol, date);
    if (!basis || !canSave()) return false;
    const calendar = this.calendar;
    const targets = candleHistoryTargets({ symbol, basis, date, calendar, settings });
    const source = { store: this.store, read: (request: AlpacaHistoryRequest) => this.rest.history(request, true),
      calendar, settings, symbol, basis, now, canSave };
    const recent = calendar.knownSessions().filter(session => session.date < date).slice(-2);
    const lastSession = recent.at(-1);
    if (!lastSession) throw Error("history_calendar_unavailable");
    const recentEnd = easternDayStart(midnight(lastSession.date) + 36 * 3_600);
    if ((this.store.reconciledThrough(symbol, basis) ?? 0) < recentEnd) {
      await fillCandleHistoryWindow({ ...source, window: { start: midnight(recent[0].date), end: recentEnd }, refresh: true });
      if (canSave()) this.store.markReconciled(symbol, basis, recentEnd);
      return false;
    }
    const window = nextCandleHistoryGap(this.store, targets, this.olderBackfillWindowDays);
    if (window) {
      await fillCandleHistoryWindow({ ...source, window, olderWindowDays: this.olderBackfillWindowDays });
      return false;
    }
    for (const target of targets) this.store.retainFrom(target, target.start);
    return true;
  }

  readTradeCorrections(from: number) {
    return this.stopped ? [] : this.store.readTradeCorrections(from);
  }

  applyTradeCorrections(revisions: readonly StoredChartCorrection[]) {
    if (this.stopped) return;
    this.store.saveTradeCorrections(revisions);
    for (const { symbol, minute } of revisions) this.pendingMinutes.delete(symbol + ":" + minute);
    this.writeMinutes(revisions, true);
  }

  private flushMinutes() {
    const batch: ChartCorrection[] = [];
    const date = easternClock(this.now()).date;
    for (const [key, { symbol, bar }] of this.pendingMinutes) {
      if (!this.selected.has(symbol) || easternClock(bar.time * 1000).date !== date) {
        this.pendingMinutes.delete(key);
      } else if (this.currentBasis(symbol, date) && this.calendar.sessionAt(bar.time)) {
        batch.push({ symbol, minute: bar.time, bar });
        this.pendingMinutes.delete(key);
        if (batch.length >= 256) break;
      }
    }
    this.writeMinutes(batch, false);
  }

  private writeMinutes(batch: readonly ChartCorrection[], corrected: boolean) {
    const date = easternClock(this.now()).date;
    const writes = [];
    const changed: { symbol: string; basis: string; minute: number; regular: boolean; through: number }[] = [];
    for (const { symbol, minute, bar } of batch) {
      if (easternClock(minute * 1000).date !== date) continue;
      const basis = this.currentBasis(symbol, date);
      const interval = this.calendar.sessionAt(minute);
      if (!basis || !interval) continue;
      const offset = minute - interval.start;
      if (offset < 240 * 60 || offset >= 1_200 * 60) continue;
      const isRegular = offset >= 570 * 60 && offset < interval.closeMinute * 60;
      for (const regular of isRegular ? [false, true] : [false]) {
        writes.push({ symbol, basis, frame: "1m" as const, session: regular ? "regular" as const : "extended" as const,
          start: minute, end: minute + 60, bars: bar ? [bar] : [] });
        changed.push({ symbol, basis, minute, regular, through: interval.start + (regular ? interval.closeMinute : 1_200) * 60 });
      }
    }
    if (!writes.length) return;
    this.store.saveVerified(writes);
    const buckets = new Map<string, Parameters<CandleHistoryStore["saveVerified"]>[0][number]>();
    for (const { symbol, basis, minute, regular, through } of changed) for (const [frame, length] of liveFrames) {
      const start = frame === "30m" ? Math.floor(minute / length) * length : candleBucket(minute, frame, regular);
      const end = Math.min(start + length, through);
      if (end * 1_000 > this.now()) continue;
      const session = regular ? "regular" : "extended";
      const id = [symbol, frame, session, basis, start].join(":");
      if (buckets.has(id)) continue;
      const minutes = this.store.read({ symbol, basis, frame: "1m", session, start, end });
      if (!minutes || !minutes.length && !corrected) continue;
      buckets.set(id, { symbol, basis, frame, session, start, end,
        bars: !minutes.length ? [] : frame === "30m" ? [{ time: start, open: minutes[0].open, close: minutes.at(-1)!.close,
          low: Math.min(...minutes.map(bar => bar.low)), high: Math.max(...minutes.map(bar => bar.high)),
          volume: minutes.reduce((total, bar) => total + bar.volume, 0) }]
          : aggregateCandles(minutes, frame, regular) });
    }
    if (buckets.size) this.store.saveVerified([...buckets.values()]);
  }
}

export function parseArchiveUniverse(input: unknown): { symbol: string; marketCap: number | null }[] {
  if (!Array.isArray(input) || input.length > 12_000) throw Error("invalid_archive_universe");
  return input.map(row => {
    if (!row || typeof row.symbol !== "string" ||
        !(row.marketCap === null || typeof row.marketCap === "number" && Number.isFinite(row.marketCap) && row.marketCap > 0))
      throw Error("invalid_archive_universe");
    return { symbol: chartSymbol(row.symbol), marketCap: row.marketCap };
  });
}
