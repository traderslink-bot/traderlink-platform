import { createHash, randomUUID } from "node:crypto";
import type { ChartCalendar } from "../../scanner/alpaca/chart-calendar";

export type AcceptedInputCandle = readonly [
  startMs: number, endMs: number, open: number, high: number, low: number, close: number, volume: number,
];

export type QualifiedInputSeries = Readonly<{
  instrumentId: string;
  symbol: string;
  venue: string;
  frame: "daily" | "4h";
  datasetId: string;
  priceBasisId: string;
  calendarRevision: string;
  sessionMode: "regular" | "extended";
  completedThroughMs: number;
  acceptedCutoffMs: number;
  availableAtMs: number;
  /** Preserve a genuine upstream identity when one is supplied. */
  upstreamRevision?: string;
  /** Internal binding to the emitted-minute coverage and corroborating native rows. */
  emittedBarCoverage?: Readonly<{ startMs: number; endMs: number; revision: string }>;
  rows: readonly AcceptedInputCandle[];
}>;

export type AcceptedInput = Readonly<Omit<QualifiedInputSeries, "rows" | "emittedBarCoverage"> & {
  id: string;
  digest: string;
  acceptedAtMs: number;
}>;

export type AcceptedFullCandle = Readonly<{ input: AcceptedInput; row: AcceptedInputCandle }>;
export type AcceptedRegularMapBinding = Readonly<{ mapId: string; mapRevision: string }>;
export type AcceptedRegularOpportunity = Readonly<{
  dailyId: string;
  regularId: string;
  previousId: string;
  triggerId: string;
  savedAfterMs: number;
  startMs: number;
  calendars: readonly ChartCalendar[];
  verifiedEmptyStarts?: readonly number[];
}> & AcceptedRegularMapBinding;
export type ClosedScannerReturn = Readonly<{
  previousClose: number;
  close: number;
  changePercent: number;
  closedAtMs: number;
}>;
export type AcceptedScannerDailyContext = Readonly<{ daily?: ClosedScannerReturn; weekly?: ClosedScannerReturn }>;

type CurrentReceipt = Readonly<{
  input: AcceptedInput;
  scope: string;
  contentFingerprint: string;
  coverageRevision?: string;
}>;

const clock = (value: number) => Number.isSafeInteger(value) && value > 0;
const identifier = (value: string) => typeof value === "string" && value.length > 0 && value.length <= 192;

function valid(series: QualifiedInputSeries, acceptedAtMs: number): boolean {
  const coverage = series.emittedBarCoverage;
  if (![series.instrumentId, series.symbol, series.venue, series.datasetId, series.priceBasisId, series.calendarRevision]
      .every(identifier) || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(series.symbol) ||
    (series.upstreamRevision !== undefined && !identifier(series.upstreamRevision)) ||
    (coverage !== undefined && (series.frame !== "4h" || series.sessionMode !== "regular" ||
      !clock(coverage.startMs) || !clock(coverage.endMs) || coverage.startMs >= coverage.endMs ||
      !/^[a-f0-9]{64}$/u.test(coverage.revision) ||
      coverage.endMs < series.completedThroughMs || coverage.endMs > series.acceptedCutoffMs ||
      coverage.endMs > series.availableAtMs || coverage.startMs > (series.rows[0]?.[0] ?? 0))) ||
    !["daily", "4h"].includes(series.frame) || !["regular", "extended"].includes(series.sessionMode) ||
    ![series.completedThroughMs, series.acceptedCutoffMs, series.availableAtMs, acceptedAtMs].every(clock) ||
    series.completedThroughMs > series.acceptedCutoffMs || series.acceptedCutoffMs > acceptedAtMs ||
    series.completedThroughMs > series.availableAtMs || series.availableAtMs > acceptedAtMs ||
    !series.rows.length || series.rows.length > 10_000) return false;
  let previousEnd = 0;
  for (const row of series.rows) {
    const [start, end, open, high, low, close, volume] = row;
    if (row.length !== 7 || !clock(start) || !clock(end) || start < previousEnd || start >= end ||
      end > series.completedThroughMs || ![open, high, low, close].every(value => Number.isFinite(value) && value > 0) ||
      low > Math.min(open, close) || high < Math.max(open, close) ||
      !Number.isFinite(volume) || volume < 0) return false;
    previousEnd = end;
  }
  return previousEnd === series.completedThroughMs;
}

/** The selected v1 encoder. JSON.stringify emits negative zero as zero and preserves the exact numeric values. */
function digestOf(series: QualifiedInputSeries): string {
  return createHash("sha256").update(JSON.stringify([
    "traderlink.levels-input.v1", [series.instrumentId, series.symbol, series.venue],
    series.frame, series.datasetId, series.priceBasisId, series.calendarRevision, series.sessionMode,
    series.completedThroughMs, series.acceptedCutoffMs, series.rows,
  ]), "utf8").digest("hex");
}

function seriesScope(series: QualifiedInputSeries): string {
  return JSON.stringify([
    series.instrumentId, series.symbol, series.venue, series.frame, series.datasetId, series.sessionMode,
    series.emittedBarCoverage?.startMs ?? series.rows[0][0],
    series.emittedBarCoverage?.endMs ?? series.completedThroughMs,
  ]);
}

/**
 * An authoritative acceptance registry for the current gateway process.
 * The caller supplies only already verified source identity, coverage, and exact computation inputs.
 * Old references fail closed after correction, eviction or restart.
 */
export class AcceptedSeriesPublisher {
  #current = new Map<string, AcceptedInput>();
  #byId = new Map<string, CurrentReceipt>();
  #latestFull = new Map<string, AcceptedFullCandle>();
  #dailyContext = new Map<string, AcceptedScannerDailyContext>();
  #regularOpportunities = new Map<string, AcceptedRegularOpportunity>();
  #regularCalendars = new Map<string, readonly ChartCalendar[]>();

  constructor(private readonly now = Date.now, private readonly capacity = 2_048) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError("invalid_accepted_series_capacity");
  }

  publish(series: QualifiedInputSeries): AcceptedInput | undefined {
    const observed = this.now();
    if (!valid(series, observed)) return;
    return this.#record(series, observed);
  }

  publishPair(daily: QualifiedInputSeries, regular: QualifiedInputSeries,
    context?: AcceptedScannerDailyContext): readonly [AcceptedInput, AcceptedInput] | undefined {
    const observed = this.now();
    if (this.capacity < 2 || daily.frame !== "daily" || regular.frame !== "4h" ||
      !valid(daily, observed) || !valid(regular, observed)) return;
    const first = this.#record(daily, observed);
    const second = this.#record(regular, observed);
    if (context) this.rememberDailyContext(first.id, context);
    return [first, second];
  }

  publishRetaining(series: QualifiedInputSeries, retainedIds: readonly string[]): AcceptedInput | undefined {
    const observed = this.now();
    const ids = new Set(retainedIds);
    if (ids.size >= this.capacity || !valid(series, observed)) return;
    const scope = seriesScope(series);
    const keep = [...this.#current].filter(([, input]) => ids.has(input.id));
    if (keep.length !== ids.size || keep.some(([key]) => key === scope)) return;
    for (const [key, input] of keep) {
      this.#current.delete(key);
      this.#current.set(key, input);
    }
    return this.#record(series, observed);
  }

  #record(series: QualifiedInputSeries, observed: number): AcceptedInput {
    const scope = seriesScope(series);
    const prior = this.#current.get(scope);
    const receipt = prior && this.#byId.get(prior.id);
    const coverageRevision = series.emittedBarCoverage?.revision;
    // Normalize the observation cutoff privately. The published digest still binds the original cutoff.
    const contentFingerprint = digestOf({ ...series, acceptedCutoffMs: series.completedThroughMs });
    if (prior && receipt && receipt.contentFingerprint === contentFingerprint &&
      receipt.input.upstreamRevision === series.upstreamRevision && receipt.coverageRevision === coverageRevision) {
      this.#current.delete(scope);
      this.#current.set(scope, prior);
      return prior;
    }

    if (prior) this.withdraw(prior.id);
    const { rows, ...metadata } = series;
    delete metadata.emittedBarCoverage;
    const digest = series.acceptedCutoffMs === series.completedThroughMs ? contentFingerprint : digestOf(series);
    const accepted: AcceptedInput = Object.freeze({ ...metadata, id: randomUUID(), digest, acceptedAtMs: observed });
    this.#current.set(scope, accepted);
    this.#byId.set(accepted.id, { input: accepted, scope, contentFingerprint, coverageRevision });
    if (series.frame === "4h" && series.sessionMode === "regular") {
      const latestFull = rows.findLast(([start, end]) => end - start === 14_400_000);
      if (latestFull) {
        const row = Object.freeze([...latestFull] as typeof latestFull);
        this.#latestFull.set(accepted.id, Object.freeze({ input: accepted, row }));
      }
    }
    if (this.#current.size > this.capacity) {
      const oldest = this.#current.keys().next().value!;
      this.withdraw(this.#current.get(oldest)!.id);
    }
    return accepted;
  }

  read(id: string): AcceptedInput | undefined {
    return this.#byId.get(id)?.input;
  }

  latestFullCandle(id: string): AcceptedFullCandle | undefined {
    return this.#latestFull.get(id);
  }

  readDailyContext(id: string) {
    const input = this.read(id);
    const context = this.#dailyContext.get(id);
    return input && context ? { input, context: structuredClone(context) } : undefined;
  }

  rememberDailyContext(id: string, context: AcceptedScannerDailyContext): void {
    if (this.read(id)?.frame === "daily" && (context.daily || context.weekly)) {
      this.#dailyContext.set(id, structuredClone(context));
    }
  }

  rememberRegularCalendar(id: string, calendars: readonly ChartCalendar[]): void {
    if (this.#latestFull.has(id)) this.#regularCalendars.set(id, structuredClone(calendars));
  }

  readRegularCalendar(id: string) {
    const calendars = this.#regularCalendars.get(id);
    return calendars && structuredClone(calendars);
  }

  recordRegularOpportunity(opportunity: AcceptedRegularOpportunity): void {
    if (!this.#retainsOpportunity(opportunity)) return;
    const key = JSON.stringify([opportunity.mapId, opportunity.mapRevision, opportunity.triggerId]);
    this.#regularOpportunities.set(key, structuredClone(opportunity));
    if (this.#regularOpportunities.size > this.capacity) {
      this.#regularOpportunities.delete(this.#regularOpportunities.keys().next().value!);
    }
  }

  readRegularOpportunities(dailyId: string, regularId: string, map: AcceptedRegularMapBinding): readonly AcceptedRegularOpportunity[] {
    const current = [...this.#regularOpportunities.values()].filter(opportunity =>
      opportunity.dailyId === dailyId && opportunity.regularId === regularId && opportunity.mapId === map.mapId &&
      opportunity.mapRevision === map.mapRevision && this.#retainsOpportunity(opportunity));
    return structuredClone(current.sort((left, right) => left.startMs - right.startMs).slice(0, 8));
  }

  #retainsOpportunity({ dailyId, regularId, previousId, triggerId, startMs }: AcceptedRegularOpportunity): boolean {
    return this.#byId.has(dailyId) && this.#byId.has(regularId) && this.#latestFull.has(previousId) &&
      this.#latestFull.get(triggerId)?.row[0] === startMs;
  }

  /** Retire only the literal current receipt and its dependent evidence. */
  withdraw(id: string): boolean {
    const receipt = this.#byId.get(id);
    if (!receipt || this.#current.get(receipt.scope) !== receipt.input) return false;
    this.#current.delete(receipt.scope);
    this.#byId.delete(id);
    this.#latestFull.delete(id);
    this.#dailyContext.delete(id);
    this.#regularCalendars.delete(id);
    for (const [key, opportunity] of this.#regularOpportunities) {
      if (opportunity.dailyId === id || opportunity.regularId === id ||
        opportunity.previousId === id || opportunity.triggerId === id) this.#regularOpportunities.delete(key);
    }
    return true;
  }
}
