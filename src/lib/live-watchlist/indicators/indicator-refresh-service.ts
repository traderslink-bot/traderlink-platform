import { IndicatorSeries } from "./indicator-series";
import { indicatorHistoryRebuildReason } from "./indicator-history-rebuild";
import { calculateSessionVwap } from "./indicator-engine";
import { createIndicatorHistoryBudget } from "./indicator-history-provider";
import { indicatorMarketDate, indicatorTradingDay, indicatorVwapCoverage, normalizeIndicatorSessions } from "./indicator-sessions";
import type { IndicatorCandle, IndicatorResult, IndicatorTimeframe } from "./indicator-engine";
import type { IndicatorHistoryBudget, IndicatorHistoryOutcome, IndicatorHistoryRequest } from "./indicator-history-provider";
import type { IndicatorCalendar } from "./indicator-sessions";
import type { IndicatorProvider, IndicatorRequestAudit } from "./indicator-request-coordinator";
import type { IndicatorCalculationEvidence, IndicatorRefreshAudit } from "../../../modules/watchlist/server/indicators/indicator-audit-store";

export type WatchlistIndicatorSnapshot = Readonly<{
  version: "indicators-v1"; symbol: string; activationId: string;
  calculationId: string | null;
  timeframes: Readonly<Partial<Record<IndicatorTimeframe, IndicatorResult>>>;
  vwap: Readonly<{ value: number | null; dataThrough: number | null }>;
}>;
type Slot = { provider: IndicatorProvider; adjustment: string; series: IndicatorSeries; checkedMarketDate?: string; checkedClosedBoundary?: number };
export type IndicatorSharedCandles = Readonly<{ provider: IndicatorProvider; dataThrough: number; candles: readonly IndicatorCandle[] }>;
type Ticker = { activationId: string; slots: Map<IndicatorTimeframe, Slot>; snapshot: WatchlistIndicatorSnapshot;
  sharedFiveMinute: IndicatorSharedCandles | null; refreshedAt: number; closedBoundary: number | null;
  closedRecovery?: { boundary: number; attempts: number; nextAt: number } };
type Load = (input: Readonly<{ provider: IndicatorProvider; request: IndicatorHistoryRequest; budget: IndicatorHistoryBudget;
  consumer: string; sufficientHistory: Readonly<{ minimumBars: number; coverFrom: number }> }>) => Promise<IndicatorHistoryOutcome>;
const FRAMES: readonly IndicatorTimeframe[] = ["1m", "5m", "15m", "1d"];
const DURATIONS = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1d": 86_400_000 };

/** One logical operation per ticker; external scheduling calls this at two-minute intervals. */
export class IndicatorRefreshService {
  private readonly tickers = new Map<string, Ticker>();
  private readonly inflight = new Map<string, Promise<WatchlistIndicatorSnapshot>>();
  private readonly records = new Map<string, IndicatorRefreshAudit>();
  private readonly instanceId: string;
  private readonly options: Readonly<{ calendar: IndicatorCalendar; load: Load; id?: () => string; now?: () => number;
    record: (record: IndicatorRefreshAudit) => void; saveCalculation: (evidence: IndicatorCalculationEvidence) => Promise<boolean> }>;
  constructor(options: IndicatorRefreshService["options"]) { this.options = options; this.instanceId = this.id(); }
  get runtimeInstanceId(): string { return this.instanceId; }
  private id(): string { return (this.options.id ?? (() => crypto.randomUUID()))(); }
  private now(): number { return (this.options.now ?? Date.now)(); }
  private record(record: IndicatorRefreshAudit): void {
    this.records.set(record.id, record);
    try { this.options.record(structuredClone(record)); } catch { /* Audit cannot disable indicators. */ }
  }
  recordTransport(event: IndicatorRequestAudit): void {
    const record = this.records.get(event.consumer);
    if (record) this.record({ ...record, attempts: [...record.attempts, event].slice(-128) });
  }
  current(symbol: string, activationId: string): WatchlistIndicatorSnapshot | null {
    const ticker = this.tickers.get(symbol);
    return ticker?.activationId === activationId ? structuredClone(ticker.snapshot) : null;
  }
  /** Published window only: consumers never see partially refreshed calculation slots. */
  sharedFiveMinute(symbol: string, activationId: string): IndicatorSharedCandles | null {
    const ticker = this.tickers.get(symbol);
    return ticker?.activationId === activationId ? structuredClone(ticker.sharedFiveMinute) : null;
  }
  deactivate(symbol: string): void { this.tickers.delete(symbol); }
  reconcilePopulation(active: ReadonlyMap<string, string>): void {
    for (const [symbol, ticker] of this.tickers) if (active.get(symbol) !== ticker.activationId) this.tickers.delete(symbol);
  }
  restore(symbol: string, activationId: string, evidence: IndicatorCalculationEvidence): boolean {
    if (this.tickers.has(symbol) || this.tickers.size >= 64 || evidence.symbol !== symbol || evidence.activationId !== activationId
      || evidence.algorithmVersion !== "indicators-v1" || evidence.calendarId !== this.options.calendar.calendarId
      || !Number.isSafeInteger(evidence.createdAt) || evidence.createdAt > this.now()
      || !Array.isArray(evidence.timeframes) || evidence.timeframes.length === 0 || evidence.timeframes.length > 4) return false;
    try {
      const slots = new Map<IndicatorTimeframe, Slot>(), timeframes: Partial<Record<IndicatorTimeframe, IndicatorResult>> = {};
      for (const frame of evidence.timeframes as IndicatorCalculationEvidence["timeframes"]) {
        if (!FRAMES.includes(frame.timeframe) || slots.has(frame.timeframe) || !["moomoo", "yahoo"].includes(frame.provider)) return false;
        const series = IndicatorSeries.restore({ ...frame, activationId, completedThrough: evidence.createdAt });
        slots.set(frame.timeframe, { provider: frame.provider, adjustment: frame.adjustment, series });
        timeframes[frame.timeframe] = series.snapshot().result!;
      }
      const vwap = evidence.vwap ? calculateSessionVwap({ candles: evidence.vwap.candles, sessionStart: evidence.vwap.start,
        sessionEnd: evidence.vwap.end, completedThrough: evidence.createdAt, coverageComplete: evidence.vwap.coverageComplete }) : { value: null, dataThrough: null };
      if (evidence.vwap && vwap.value !== evidence.vwap.value) return false;
      const five = slots.get("5m"), fiveSnapshot = five?.series.snapshot();
      this.tickers.set(symbol, { activationId, slots, refreshedAt: 0, closedBoundary: null,
        sharedFiveMinute: five && fiveSnapshot?.result ? { provider: five.provider, dataThrough: fiveSnapshot.result.dataThrough, candles: fiveSnapshot.candles.slice(-250) } : null,
        snapshot: { version: "indicators-v1", symbol, activationId, calculationId: evidence.id, timeframes, vwap } });
      return true;
    } catch { return false; }
  }
  private decision(symbol: string, ticker: Ticker, outcome: "cache_hit" | "coalesced" | "session_closed" | "calendar_unavailable" | "closed_retry_wait" | "closed_retry_exhausted"): void {
    const id = this.id(), now = this.now();
    this.record({ id, instanceId: this.instanceId, symbol, activationId: ticker.activationId, queuedAt: now,
      startedAt: null, finishedAt: now, outcome, calculationId: ticker.snapshot.calculationId, attempts: [], timeframes: [] });
    this.records.delete(id);
  }
  /** null is an open supported session; undefined means the calendar cannot establish a boundary. */
  private closedBoundary(now: number): number | null | undefined {
    const date = indicatorMarketDate(now), day = indicatorTradingDay(this.options.calendar, date);
    if (day === undefined) return undefined;
    if (day && now >= day.preOpen && now < day.postClose) return null;
    const noon = Date.parse(`${date}T12:00:00Z`);
    for (let offset = 0; offset <= 10; offset++) {
      const candidate = indicatorTradingDay(this.options.calendar, new Date(noon - offset * 86_400_000).toISOString().slice(0, 10));
      if (candidate && candidate.postClose <= now) return candidate.postClose;
    }
    return undefined;
  }
  refresh(symbol: string, activationId: string): Promise<WatchlistIndicatorSnapshot> {
    if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol) || !/^[A-Za-z0-9:_-]{1,100}$/u.test(activationId)) return Promise.reject(Error("indicator_refresh_identity_invalid"));
    const key = `${symbol}:${activationId}`;
    const running = this.inflight.get(key);
    if (running) {
      const ticker = this.tickers.get(symbol);
      if (ticker?.activationId === activationId) this.decision(symbol, ticker, "coalesced");
      return running.then(snapshot => structuredClone(snapshot));
    }
    let ticker = this.tickers.get(symbol);
    if (!ticker || ticker.activationId !== activationId) {
      if (!ticker && this.tickers.size >= 64) return Promise.reject(Error("indicator_refresh_population_limit"));
      ticker = { activationId, slots: new Map(), refreshedAt: 0, closedBoundary: null, sharedFiveMinute: null,
        snapshot: { version: "indicators-v1", symbol, activationId, calculationId: null, timeframes: {}, vwap: { value: null, dataThrough: null } } };
      this.tickers.set(symbol, ticker);
    }
    if (this.now() - ticker.refreshedAt < 120_000) {
      this.decision(symbol, ticker, "cache_hit"); return Promise.resolve(structuredClone(ticker.snapshot));
    }
    const boundary = this.closedBoundary(this.now());
    if (boundary === undefined || (boundary !== null && ticker.closedBoundary === boundary)) {
      this.decision(symbol, ticker, boundary === undefined ? "calendar_unavailable" : "session_closed");
      return Promise.resolve(structuredClone(ticker.snapshot));
    }
    if (boundary !== null) {
      if (ticker.closedRecovery?.boundary !== boundary) ticker.closedRecovery = { boundary, attempts: 0, nextAt: 0 };
      const recovery = ticker.closedRecovery;
      if (recovery.attempts >= 3 || this.now() < recovery.nextAt) {
        this.decision(symbol, ticker, recovery.attempts >= 3 ? "closed_retry_exhausted" : "closed_retry_wait");
        return Promise.resolve(structuredClone(ticker.snapshot));
      }
      recovery.attempts++;
    } else ticker.closedRecovery = undefined;
    // At most one warm-up plus two recovery passes per closed boundary. Successful
    // frames are retained; failed frames retry after 2m, then 10m, never all weekend.
    const operation = this.perform(symbol, ticker).finally(() => {
      if (boundary !== null) {
        const complete = FRAMES.every(frame => ticker!.slots.get(frame)?.checkedClosedBoundary === boundary
          && ticker!.snapshot.timeframes[frame] && ticker!.snapshot.timeframes[frame]?.dataThrough === ticker!.slots.get(frame)?.series.snapshot().result?.dataThrough);
        if (complete) ticker!.closedBoundary = boundary;
        else if (ticker!.closedRecovery?.boundary === boundary) {
          ticker!.closedRecovery.nextAt = this.now() + (ticker!.closedRecovery.attempts === 1 ? 120_000 : 600_000);
        }
      }
      this.inflight.delete(key);
    });
    this.inflight.set(key, operation);
    return operation.then(snapshot => structuredClone(snapshot));
  }
  private continuous(previous: IndicatorCandle, next: IndicatorCandle): boolean {
    if (previous.end === next.start) return true;
    const from = indicatorTradingDay(this.options.calendar, indicatorMarketDate(previous.start));
    const to = indicatorTradingDay(this.options.calendar, indicatorMarketDate(next.start));
    if (!from || !to || from.date >= to.date) return false;
    const daily = previous.sessionKey.endsWith(":daily") && next.sessionKey.endsWith(":daily");
    if (previous.end !== (daily ? from.regularClose : from.postClose) || next.start !== (daily ? to.regularOpen : to.preOpen)) return false;
    for (let day = Date.parse(`${from.date}T12:00:00Z`) + 86_400_000; day < Date.parse(`${to.date}T12:00:00Z`); day += 86_400_000) {
      if (indicatorTradingDay(this.options.calendar, new Date(day).toISOString().slice(0, 10)) !== null) return false;
    }
    return true;
  }
  private async perform(symbol: string, ticker: Ticker): Promise<WatchlistIndicatorSnapshot> {
    const id = this.id(), now = this.now(), closed = this.closedBoundary(now);
    // A cold start while closed still describes the last completed trading session.
    // Candle timestamps stay historical; this does not manufacture weekend activity.
    const day = indicatorTradingDay(this.options.calendar, indicatorMarketDate(closed == null ? now : closed - 1));
    const budget = { moomoo: createIndicatorHistoryBudget(), yahoo: createIndicatorHistoryBudget() };
    this.record({ id, instanceId: this.instanceId, symbol, activationId: ticker.activationId, queuedAt: now,
      startedAt: null, finishedAt: null, outcome: "queued", calculationId: null, attempts: [], timeframes: [] });
    this.record({ ...this.records.get(id)!, startedAt: this.now(), outcome: "running" });
    const frameAudit: IndicatorRefreshAudit["timeframes"][number][] = [];
    let changed = false, priceBasisRebased = false;
    let completedDailyClose: number | null = null;
    const marketNoon = Date.parse(`${indicatorMarketDate(now)}T12:00:00Z`);
    for (let offset = 0; offset <= 10; offset++) {
      const candidate = indicatorTradingDay(this.options.calendar, new Date(marketNoon - offset * 86_400_000).toISOString().slice(0, 10));
      if (candidate && candidate.regularClose <= now) { completedDailyClose = candidate.regularClose; break; }
    }
    try {
      for (const timeframe of FRAMES) {
        const existing = ticker.slots.get(timeframe);
        const cached = existing?.series.snapshot();
        if (closed != null && !priceBasisRebased && existing?.checkedClosedBoundary === closed && cached?.result) {
          frameAudit.push({ timeframe, provider: existing.provider, primaryOutcome: "cached_closed_frame", fallbackOutcome: null,
            acceptedBars: 0, through: cached.result.dataThrough, missingMinutes: 0, excludedBars: 0, calculationRevision: String(cached.revision) });
          continue;
        }
        // A completed Daily candle changes at most once per market date; retry failures separately.
        if (timeframe === "1d" && !priceBasisRebased && cached?.result && completedDailyClose !== null && cached.result.dataThrough >= completedDailyClose
          && closed == null && (!day || existing?.checkedMarketDate === day.date)) {
          frameAudit.push({ timeframe, provider: existing!.provider, primaryOutcome: "cached_daily", fallbackOutcome: null,
            acceptedBars: 0, through: cached.result.dataThrough, missingMinutes: 0, excludedBars: 0, calculationRevision: String(cached.revision) });
          continue;
        }
        let primaryOutcome = "unavailable", fallbackOutcome: string | null = null, selected: Slot | undefined;
        let accepted = 0, excluded = 0, correctedBars = 0, addedBars = 0, gapReset = false;
        let rebuildReason: string | null = null;
        for (const provider of ["moomoo", "yahoo"] as const) {
          const sameProvider = existing?.provider === provider;
          const last = sameProvider ? cached?.checkpoint.last : null;
          const initialDays = timeframe === "1d" ? 370 : timeframe === "15m" ? 14 : timeframe === "5m" ? 7 : 4;
          const start = last ? Math.max(now - initialDays * 86_400_000, last.start - 20 * DURATIONS[timeframe]) : now - initialDays * 86_400_000;
          const coverFrom = !last && timeframe === "1m" && day ? day.preOpen : last ? start : now;
          let fetched: IndicatorHistoryOutcome;
          try { fetched = await this.options.load({ provider, request: { symbol, timeframe, start, end: now }, budget: budget[provider], consumer: id,
            sufficientHistory: { minimumBars: last ? 1 : 250, coverFrom } }); }
          catch { if (provider === "moomoo") primaryOutcome = "provider_unavailable"; else fallbackOutcome = "provider_unavailable"; continue; }
          if (provider === "moomoo") primaryOutcome = fetched.outcome; else fallbackOutcome = fetched.outcome;
          excluded += fetched.excludedPoints ?? 0;
          if (!["complete", "sufficient_history"].includes(fetched.outcome)) continue;
          let normalized = normalizeIndicatorSessions({ bars: fetched.bars, timeframe, calendar: this.options.calendar, completedThrough: now });
          excluded += Object.values(normalized.excluded).reduce((sum, count) => sum + count, 0);
          if (!normalized.candles.length) continue;
          const seriesKey = `${provider}:${symbol}:${timeframe}:${fetched.adjustment}`;
          const reason = sameProvider && cached?.seriesKey === seriesKey ? indicatorHistoryRebuildReason(cached, normalized.candles) : null;
          if (reason) {
            rebuildReason = reason;
            if (reason === "price_history_rebased") priceBasisRebased = true;
            // Do not combine an old seed with a changed price scale or corrections before that seed.
            // Refetch a complete preferred warm-up on the same bounded logical request budget.
            let full: IndicatorHistoryOutcome;
            try { full = await this.options.load({ provider, request: { symbol, timeframe, start: now - initialDays * 86_400_000, end: now },
              budget: budget[provider], consumer: id, sufficientHistory: { minimumBars: 250, coverFrom: timeframe === "1m" && day ? day.preOpen : now } }); }
            catch { if (provider === "moomoo") primaryOutcome = "rebuild_unavailable"; else fallbackOutcome = "rebuild_unavailable"; continue; }
            if (!["complete", "sufficient_history"].includes(full.outcome) || full.adjustment !== fetched.adjustment) {
              if (provider === "moomoo") primaryOutcome = `rebuild_${full.outcome}`; else fallbackOutcome = `rebuild_${full.outcome}`;
              continue;
            }
            normalized = normalizeIndicatorSessions({ bars: full.bars, timeframe, calendar: this.options.calendar, completedThrough: now });
            if (!normalized.candles.length) continue;
          }
          const series = !reason && sameProvider && cached?.seriesKey === seriesKey ? existing!.series
            : new IndicatorSeries({ activationId: ticker.activationId, seriesKey, timeframe });
          const update = series.update({ activationId: ticker.activationId, expectedRevision: series.snapshot().revision,
            candles: normalized.candles, completedThrough: now, continuous: (a, b) => this.continuous(a, b) });
          if (update.outcome === "seed_history_required" || update.outcome === "superseded") continue;
          accepted = normalized.candles.length; changed ||= update.outcome === "updated";
          correctedBars = update.correctedBars; addedBars = update.addedBars; gapReset = update.gapReset;
          if (!rebuildReason && correctedBars) rebuildReason = "candle_correction";
          if (!rebuildReason && cached?.candles[0] && normalized.candles[0].start < cached.candles[0].start) rebuildReason = "history_backfill";
          selected = { series, provider, adjustment: fetched.adjustment, checkedMarketDate: indicatorMarketDate(now),
            ...(closed == null ? {} : { checkedClosedBoundary: closed }) }; ticker.slots.set(timeframe, selected); break;
        }
        const retained = selected ?? existing, snapshot = retained?.series.snapshot();
        frameAudit.push({ timeframe, provider: retained?.provider ?? null, primaryOutcome, fallbackOutcome, acceptedBars: accepted,
          through: snapshot?.result?.dataThrough ?? null, missingMinutes: 0, missingVolumeBars: snapshot?.candles.filter(c => c.volume === null).length ?? 0,
          excludedBars: excluded, correctedBars, addedBars, gapReset, rebuildReason, calculationRevision: snapshot ? String(snapshot.revision) : null });
      }
      if (this.tickers.get(symbol) !== ticker) {
        this.record({ ...this.records.get(id)!, timeframes: frameAudit, finishedAt: this.now(), outcome: "superseded" });
        return ticker.snapshot;
      }
      const oneMinute = ticker.slots.get("1m")?.series.snapshot().candles.filter(c => day && c.start >= day.preOpen && c.end <= day.postClose) ?? [];
      const minuteThrough = oneMinute.at(-1)?.end ?? now;
      const coverage = day ? indicatorVwapCoverage({ candles: oneMinute, day, completedThrough: minuteThrough }) : null;
      const vwapInput = day ? { candles: oneMinute, sessionStart: day.preOpen, sessionEnd: day.postClose, completedThrough: minuteThrough,
        coverageComplete: coverage?.complete ?? false } : null;
      const vwap = vwapInput ? calculateSessionVwap(vwapInput) : { value: null, dataThrough: null };
      const minuteAudit = frameAudit.find(frame => frame.timeframe === "1m");
      if (minuteAudit && coverage) frameAudit[frameAudit.indexOf(minuteAudit)] = { ...minuteAudit, missingMinutes: coverage.missingMinutes };
      const timeframes: Partial<Record<IndicatorTimeframe, IndicatorResult>> = {};
      for (const [frame, slot] of ticker.slots) { const result = slot.series.snapshot().result; if (result) timeframes[frame] = result; }
      let calculationId = ticker.snapshot.calculationId;
      if (changed || JSON.stringify(vwap) !== JSON.stringify(ticker.snapshot.vwap)) {
        calculationId = this.id();
        const evidence: IndicatorCalculationEvidence = { id: calculationId, refreshId: id, createdAt: now, symbol, activationId: ticker.activationId,
          algorithmVersion: "indicators-v1", calendarId: this.options.calendar.calendarId,
          timeframes: [...ticker.slots].map(([timeframe, slot]) => { const snapshot = slot.series.snapshot();
            return { timeframe, seriesKey: snapshot.seriesKey, provider: slot.provider, adjustment: slot.adjustment,
              initialCheckpoint: snapshot.initialCheckpoint, candles: snapshot.candles, result: snapshot.result }; }),
          vwap: vwapInput ? { candles: oneMinute, start: vwapInput.sessionStart, end: vwapInput.sessionEnd,
            completedThrough: now, coverageComplete: vwapInput.coverageComplete, value: vwap.value } : null };
        try { await this.options.saveCalculation(evidence); } catch { /* Missing replay stays explicit by immutable ID. */ }
      }
      ticker.snapshot = { version: "indicators-v1", symbol, activationId: ticker.activationId, calculationId, timeframes, vwap };
      const fiveMinute = ticker.slots.get("5m"), fiveMinuteSeries = fiveMinute?.series.snapshot();
      ticker.sharedFiveMinute = fiveMinute && fiveMinuteSeries?.result ? { provider: fiveMinute.provider,
        dataThrough: fiveMinuteSeries.result.dataThrough, candles: fiveMinuteSeries.candles.slice(-250) } : null;
      ticker.refreshedAt = now;
      this.record({ ...this.records.get(id)!, timeframes: frameAudit, calculationId, finishedAt: this.now(),
        outcome: Object.keys(timeframes).length === 0 ? "unavailable" : frameAudit.every(frame => frame.acceptedBars === 0) ? "retained"
          : Object.keys(timeframes).length === 4 ? "published" : "partial" });
      return ticker.snapshot;
    } catch {
      this.record({ ...this.records.get(id)!, timeframes: frameAudit, finishedAt: this.now(), outcome: "unavailable" });
      ticker.refreshedAt = now; return ticker.snapshot;
    } finally { this.records.delete(id); }
  }
}
