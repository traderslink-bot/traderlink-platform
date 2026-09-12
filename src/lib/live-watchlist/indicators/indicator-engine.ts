/** Pure Watchlist calculations. No provider, database, AI, clock or UI side effects. */
export const WATCHLIST_INDICATOR_VERSION = "indicators-v1" as const;
export type IndicatorTimeframe = "1m" | "5m" | "15m" | "1d";
export type IndicatorCandle = Readonly<{
  /** UTC epoch milliseconds, including provider-confirmed completion boundary. */
  start: number;
  end: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  /** Exchange-calendar-derived date plus premarket/regular/postmarket identifier. */
  sessionKey: string;
}>;
type EmaState = Readonly<{ count: number; seedSum: number; value: number | null }>;
type WilderState = Readonly<{
  changes: number;
  gain: number;
  loss: number;
  trueRange: number;
}>;
type Point = Readonly<{
  ema9: number | null;
  ema20: number | null;
  rsi: number | null;
  atr: number | null;
}>;
export type IndicatorCheckpoint = Readonly<{
  version: typeof WATCHLIST_INDICATOR_VERSION;
  timeframe: IndicatorTimeframe;
  /** Provider, symbol, adjustment convention and normalized history generation. */
  seriesKey: string;
  count: number;
  last: IndicatorCandle | null;
  ema9: EmaState;
  ema20: EmaState;
  wilder: WilderState;
  points: readonly Point[];
  volumeBars: readonly IndicatorCandle[];
}>;
export type TrendState = "uptrend" | "downtrend" | "sideways" | "mixed";
export type RsiCondition = "oversold" | "overbought" | "below_midpoint" | "above_midpoint" | "at_midpoint";
export type IndicatorResult = Readonly<{
  version: typeof WATCHLIST_INDICATOR_VERSION;
  timeframe: IndicatorTimeframe;
  dataThrough: number;
  bars: number;
  close: number;
  ema9: number | null;
  ema20: number | null;
  rsi14: number | null;
  rsiCondition: RsiCondition | null;
  rsiChange: number | null;
  rsiDirection: "rising" | "falling" | "little_changed" | "recovered_above_oversold" | null;
  atr14: number | null;
  atrPercent: number | null;
  atrRatio: number | null;
  volatility: "expanding" | "contracting" | "steady" | null;
  ema9SlopeAtr: number | null;
  ema20SlopeAtr: number | null;
  trend: TrendState | null;
  volume: number | null;
  volumeChangePercent: number | null;
  volumeBaselineBars: number;
  volumeRatio: number | null;
  volumeState: "above_baseline" | "below_baseline" | "near_baseline" | null;
}>;

const emptyEma = (): EmaState => ({ count: 0, seedSum: 0, value: null });
export function createIndicatorCheckpoint(timeframe: IndicatorTimeframe, seriesKey: string): IndicatorCheckpoint {
  if (!seriesKey || !["1m", "5m", "15m", "1d"].includes(timeframe)) {
    throw new Error("watchlist_indicator_invalid_series");
  }
  return {
    version: WATCHLIST_INDICATOR_VERSION, timeframe, seriesKey, count: 0, last: null,
    ema9: emptyEma(), ema20: emptyEma(),
    wilder: { changes: 0, gain: 0, loss: 0, trueRange: 0 }, points: [], volumeBars: [],
  };
}

function validateCandle(c: IndicatorCandle, completedThrough: number): void {
  if (![c.start, c.end, completedThrough].every(Number.isSafeInteger) || c.start <= 0 ||
      c.end <= c.start || c.end > completedThrough || !c.sessionKey ||
      ![c.open, c.high, c.low, c.close].every(Number.isFinite) ||
      Math.min(c.open, c.high, c.low, c.close) <= 0 || (c.volume !== null && (!Number.isFinite(c.volume) || c.volume < 0)) ||
      c.low > Math.min(c.open, c.close) || c.high < Math.max(c.open, c.close) || c.low > c.high) {
    throw new Error("watchlist_indicator_invalid_or_incomplete_candle");
  }
}

function advanceEma(state: EmaState, close: number, period: number): EmaState {
  const count = state.count + 1;
  if (state.value !== null) {
    return { count, seedSum: state.seedSum, value: state.value + (close - state.value) * 2 / (period + 1) };
  }
  const seedSum = state.seedSum + close;
  return { count, seedSum, value: count === period ? seedSum / period : null };
}

function advanceWilder(state: WilderState, c: IndicatorCandle, priorClose: number | null): WilderState {
  if (priorClose === null) return state;
  const change = c.close - priorClose;
  const gain = Math.max(change, 0);
  const loss = Math.max(-change, 0);
  const tr = Math.max(c.high - c.low, Math.abs(c.high - priorClose), Math.abs(c.low - priorClose));
  const changes = state.changes + 1;
  // During initialization the fields contain sums; at change 14 they become averages.
  if (changes <= 14) {
    const divisor = changes === 14 ? 14 : 1;
    return { changes, gain: (state.gain + gain) / divisor, loss: (state.loss + loss) / divisor,
      trueRange: (state.trueRange + tr) / divisor };
  }
  return { changes, gain: (state.gain * 13 + gain) / 14, loss: (state.loss * 13 + loss) / 14,
    trueRange: (state.trueRange * 13 + tr) / 14 };
}

function rsiValue(w: WilderState): number | null {
  if (w.changes < 14) return null;
  if (w.gain === 0 && w.loss === 0) return 50;
  if (w.loss === 0) return 100;
  return 100 - 100 / (1 + w.gain / w.loss);
}
function condition(rsi: number | null): RsiCondition | null {
  if (rsi === null) return null;
  return rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : rsi < 50 ? "below_midpoint"
    : rsi > 50 ? "above_midpoint" : "at_midpoint";
}
const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
function classifyTrend(p: Point, old: Point | undefined, close: number): {
  trend: TrendState | null; ema9SlopeAtr: number | null; ema20SlopeAtr: number | null;
} {
  if (p.atr === null || p.atr <= 0 || p.ema9 === null || p.ema20 === null ||
      old?.ema9 == null || old.ema20 === null) {
    return { trend: null, ema9SlopeAtr: null, ema20SlopeAtr: null };
  }
  const ema9SlopeAtr = (p.ema9 - old.ema9) / p.atr;
  const ema20SlopeAtr = (p.ema20 - old.ema20) / p.atr;
  const alignment = (p.ema9 - p.ema20) / p.atr;
  let trend: TrendState = "mixed";
  if (alignment > 0.05 && ema9SlopeAtr > 0.05 && ema20SlopeAtr > 0.05 && close >= p.ema20) trend = "uptrend";
  else if (alignment < -0.05 && ema9SlopeAtr < -0.05 && ema20SlopeAtr < -0.05 && close <= p.ema20) trend = "downtrend";
  else if ([alignment, ema9SlopeAtr, ema20SlopeAtr].every(value => Math.abs(value) <= 0.05)) trend = "sideways";
  return { trend, ema9SlopeAtr, ema20SlopeAtr };
}

/** Input must be a coherent validated series. Unknown gaps require a rebuild, not a fabricated bar. */
export function advanceIndicator(
  previous: IndicatorCheckpoint, candle: IndicatorCandle, completedThrough: number,
): Readonly<{ checkpoint: IndicatorCheckpoint; result: IndicatorResult }> {
  validateCandle(candle, completedThrough);
  const duration = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1d": null }[previous.timeframe];
  if (duration !== null && candle.end - candle.start !== duration) {
    throw new Error("watchlist_indicator_wrong_timeframe");
  }
  if (previous.version !== WATCHLIST_INDICATOR_VERSION ||
      (previous.last && candle.start < previous.last.end)) {
    throw new Error("watchlist_indicator_rebuild_required");
  }
  const ema9 = advanceEma(previous.ema9, candle.close, 9);
  const ema20 = advanceEma(previous.ema20, candle.close, 20);
  const wilder = advanceWilder(previous.wilder, candle, previous.last?.close ?? null);
  const point: Point = { ema9: ema9.value, ema20: ema20.value, rsi: rsiValue(wilder),
    atr: wilder.changes >= 14 ? wilder.trueRange : null };
  const old = previous.points.at(-3);
  const rsiChange = point.rsi !== null && old?.rsi != null ? point.rsi - old.rsi : null;
  const rsiDirection = rsiChange === null ? null : rsiChange >= 3
    ? old!.rsi! < 30 && point.rsi! >= 30 ? "recovered_above_oversold" : "rising"
    : rsiChange <= -3 ? "falling" : "little_changed";
  const priorAtrs = previous.points.map(p => p.atr);
  const atrBaseline = priorAtrs.length === 20 && priorAtrs.every(v => v !== null)
    ? mean(priorAtrs as number[]) : null;
  const atrRatio = point.atr !== null && atrBaseline !== null && atrBaseline > 0 ? point.atr / atrBaseline : null;
  const sessionVolumeBars = previous.timeframe === "1d" ? previous.volumeBars
    : previous.volumeBars.filter(bar => bar.sessionKey === candle.sessionKey);
  const lastMissingVolume = sessionVolumeBars.map(bar => bar.volume).lastIndexOf(null);
  const volumeBars = sessionVolumeBars.slice(lastMissingVolume + 1);
  const volumeBaseline = volumeBars.length >= 10 ? mean(volumeBars.map(bar => bar.volume!)) : null;
  const volumeRatio = candle.volume !== null && volumeBaseline !== null && volumeBaseline > 0 ? candle.volume / volumeBaseline : null;
  const priorVolume = volumeBars.at(-1)?.volume;
  const result: IndicatorResult = {
    version: WATCHLIST_INDICATOR_VERSION, timeframe: previous.timeframe, dataThrough: candle.end,
    bars: previous.count + 1, close: candle.close, ema9: point.ema9, ema20: point.ema20,
    rsi14: point.rsi, rsiCondition: condition(point.rsi), rsiChange, rsiDirection,
    atr14: point.atr, atrPercent: point.atr === null ? null : 100 * point.atr / candle.close, atrRatio,
    volatility: atrRatio === null ? null : atrRatio >= 1.1 ? "expanding" : atrRatio <= 0.9 ? "contracting" : "steady",
    ...classifyTrend(point, old, candle.close),
    volume: candle.volume, volumeBaselineBars: volumeBars.length,
    volumeChangePercent: candle.volume !== null && priorVolume != null && priorVolume > 0 ? 100 * (candle.volume - priorVolume) / priorVolume : null,
    volumeRatio,
    volumeState: volumeRatio === null ? null : volumeRatio >= 1.4 ? "above_baseline" : volumeRatio <= 0.75 ? "below_baseline" : "near_baseline",
  };
  const checkpoint: IndicatorCheckpoint = {
    ...previous, count: result.bars, last: { ...candle }, ema9, ema20, wilder,
    points: [...previous.points, point].slice(-20), volumeBars: [...volumeBars, { ...candle }].slice(-20),
  };
  return { checkpoint, result };
}

/** Full chronological rebuild also serves as the exact replay path for a retained seed history. */
export function calculateIndicatorHistory(
  candles: readonly IndicatorCandle[], timeframe: IndicatorTimeframe, seriesKey: string, completedThrough: number,
): Readonly<{ checkpoint: IndicatorCheckpoint; results: readonly IndicatorResult[] }> {
  let checkpoint = createIndicatorCheckpoint(timeframe, seriesKey);
  const results: IndicatorResult[] = [];
  for (const candle of candles) {
    const next = advanceIndicator(checkpoint, candle, completedThrough);
    checkpoint = next.checkpoint;
    results.push(next.result);
  }
  return { checkpoint, results };
}

export type SessionVwapInput = Readonly<{
  candles: readonly IndicatorCandle[];
  sessionStart: number;
  sessionEnd: number;
  completedThrough: number;
  /** True only after the adapter reconciles unknown missing minutes versus confirmed no trades. */
  coverageComplete: boolean;
}>;
export function calculateSessionVwap(input: SessionVwapInput): Readonly<{ value: number | null; dataThrough: number | null }> {
  if (![input.sessionStart, input.sessionEnd, input.completedThrough].every(Number.isSafeInteger)) {
    throw new Error("watchlist_indicator_invalid_session");
  }
  if (!input.coverageComplete || input.sessionStart >= input.sessionEnd) return { value: null, dataThrough: null };
  let volume = 0;
  let priceVolume = 0;
  let dataThrough: number | null = null;
  for (const candle of input.candles) {
    validateCandle(candle, input.completedThrough);
    if (candle.volume === null) return { value: null, dataThrough: null };
    if (candle.end - candle.start !== 60_000 || candle.start < input.sessionStart || candle.end > input.sessionEnd ||
        (dataThrough !== null && candle.start < dataThrough)) {
      throw new Error("watchlist_indicator_invalid_vwap_series");
    }
    volume += candle.volume;
    priceVolume += ((candle.high + candle.low + candle.close) / 3) * candle.volume;
    dataThrough = candle.end;
  }
  return { value: volume > 0 ? priceVolume / volume : null, dataThrough };
}
