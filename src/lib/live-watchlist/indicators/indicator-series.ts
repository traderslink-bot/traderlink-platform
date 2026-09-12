import { advanceIndicator, createIndicatorCheckpoint } from "./indicator-engine";
import type { IndicatorCandle, IndicatorCheckpoint, IndicatorResult, IndicatorTimeframe } from "./indicator-engine";

export type IndicatorSeriesSnapshot = Readonly<{
  activationId: string; seriesKey: string; timeframe: IndicatorTimeframe; revision: number;
  initialCheckpoint: IndicatorCheckpoint; candles: readonly IndicatorCandle[];
  checkpoint: IndicatorCheckpoint; result: IndicatorResult | null;
}>;
export type IndicatorSeriesUpdate = Readonly<{
  outcome: "updated" | "unchanged" | "superseded" | "seed_history_required";
  correctedBars: number; addedBars: number; gapReset: boolean; snapshot: IndicatorSeriesSnapshot;
}>;

/** Bounded correction/replay cache. Trimming retains exact pre-window state, never an invented new EMA seed. */
export class IndicatorSeries {
  private state: IndicatorSeriesSnapshot;
  private readonly maximumBars: number;
  constructor(input: Readonly<{ activationId: string; seriesKey: string; timeframe: IndicatorTimeframe; maximumBars?: number }>) {
    this.maximumBars = input.maximumBars ?? 2048;
    if (!input.activationId || !Number.isInteger(this.maximumBars) || this.maximumBars < 35 || this.maximumBars > 12_000) throw Error("indicator_series_configuration_invalid");
    const seed = createIndicatorCheckpoint(input.timeframe, input.seriesKey);
    this.state = { activationId: input.activationId, seriesKey: input.seriesKey, timeframe: input.timeframe,
      revision: 0, initialCheckpoint: seed, candles: [], checkpoint: seed, result: null };
  }
  snapshot(): IndicatorSeriesSnapshot { return structuredClone(this.state); }

  /** Replay persisted inputs before accepting restored state; never silently reseed an evicted window. */
  static restore(input: Readonly<{ activationId: string; seriesKey: string; timeframe: IndicatorTimeframe;
    initialCheckpoint: IndicatorCheckpoint | null; candles: readonly IndicatorCandle[]; result: IndicatorResult | null;
    completedThrough: number; maximumBars?: number }>): IndicatorSeries {
    const seed = input.initialCheckpoint;
    if (!seed || seed.version !== "indicators-v1" || seed.seriesKey !== input.seriesKey || seed.timeframe !== input.timeframe
      || !Number.isSafeInteger(seed.count) || seed.count < 0 || (seed.count > 0 && !seed.last)
      || !Array.isArray(seed.points) || seed.points.length > 20 || !Array.isArray(seed.volumeBars) || seed.volumeBars.length > 20
      || !Array.isArray(input.candles) || input.candles.length === 0 || input.candles.length > 2048 || !input.result) {
      throw Error("indicator_restore_inputs_invalid");
    }
    const finiteTree = (value: unknown, depth = 0): boolean => depth <= 8 && (typeof value === "number" ? Number.isFinite(value)
      : value && typeof value === "object" ? Object.values(value).every(child => finiteTree(child, depth + 1)) : true);
    if (!finiteTree(seed)) throw Error("indicator_restore_checkpoint_invalid");
    const series = new IndicatorSeries(input), checkpoint = structuredClone(seed);
    series.state = { ...series.state, initialCheckpoint: checkpoint, checkpoint };
    const restored = series.update({ activationId: input.activationId, expectedRevision: 0, candles: input.candles,
      completedThrough: input.completedThrough, continuous: () => true });
    if (restored.outcome !== "updated" || JSON.stringify(restored.snapshot.result) !== JSON.stringify(input.result)) {
      throw Error("indicator_restore_replay_mismatch");
    }
    return series;
  }

  update(input: Readonly<{
    activationId: string; expectedRevision: number; candles: readonly IndicatorCandle[]; completedThrough: number;
    /** True only for adjacent bars or an established closed/no-trade interval, not an unknown gap. */
    continuous: (previous: IndicatorCandle, next: IndicatorCandle) => boolean;
  }>): IndicatorSeriesUpdate {
    const finish = (outcome: IndicatorSeriesUpdate["outcome"], correctedBars = 0, addedBars = 0, gapReset = false): IndicatorSeriesUpdate =>
      ({ outcome, correctedBars, addedBars, gapReset, snapshot: this.snapshot() });
    if (input.activationId !== this.state.activationId || input.expectedRevision !== this.state.revision) return finish("superseded");
    if (input.candles.length > 12_000) throw Error("indicator_series_update_too_large");
    if (input.candles.some(c => c.start < (this.state.initialCheckpoint.last?.end ?? 0))) return finish("seed_history_required");
    const merged = new Map(this.state.candles.map(candle => [candle.start, candle]));
    const incoming = new Map<number, IndicatorCandle>();
    let correctedBars = 0, addedBars = 0;
    for (const candle of input.candles) {
      const duplicate = incoming.get(candle.start);
      if (duplicate && JSON.stringify(duplicate) !== JSON.stringify(candle)) throw Error("indicator_series_conflicting_response");
      incoming.set(candle.start, candle);
    }
    for (const candle of incoming.values()) {
      const prior = merged.get(candle.start);
      if (!prior) addedBars++;
      else if (JSON.stringify(prior) !== JSON.stringify(candle)) correctedBars++;
      merged.set(candle.start, { ...candle });
    }
    if (!correctedBars && !addedBars) return finish("unchanged");
    let candles = [...merged.values()].sort((a, b) => a.start - b.start);
    let seed = this.state.initialCheckpoint, gapReset = false;
    // Use the newest independently continuous segment when earlier coverage has an unknown gap.
    let previous = seed.last, segmentStart = 0;
    for (let i = 0; i < candles.length; i++) {
      if (previous && candles[i].start < previous.end) throw Error("indicator_series_overlapping_candles");
      if (previous && !input.continuous(previous, candles[i])) { segmentStart = i; gapReset = true; }
      previous = candles[i];
    }
    if (gapReset) {
      candles = candles.slice(segmentStart);
      seed = createIndicatorCheckpoint(this.state.timeframe, this.state.seriesKey);
    }
    // Rebuild in chronological order from the exact immutable starting checkpoint.
    // This handles appended bars, trailing corrections and newly filled gaps with one path.
    let checkpoint = seed, result: IndicatorResult | null = null;
    const trimCount = Math.max(0, candles.length - this.maximumBars);
    let retainedSeed = seed;
    for (let i = 0; i < candles.length; i++) {
      const next = advanceIndicator(checkpoint, candles[i], input.completedThrough);
      checkpoint = next.checkpoint; result = next.result;
      if (i + 1 === trimCount) retainedSeed = checkpoint;
    }
    // No mutation occurs until every input has validated and the complete rebuild succeeds.
    this.state = { ...this.state, revision: this.state.revision + 1, initialCheckpoint: retainedSeed,
      candles: candles.slice(trimCount), checkpoint, result };
    return finish("updated", correctedBars, addedBars, gapReset);
  }
}
