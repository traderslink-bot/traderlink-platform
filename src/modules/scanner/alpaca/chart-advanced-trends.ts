import type { Candle } from "./candles";
import { indicatorSource, movingAverage } from "./chart-indicator-math";
import type { IndicatorPlot, IndicatorPoint } from "./chart-indicators";
import type { ChartIndicator, PriceSource } from "./chart-preferences";
import { combine, extremes } from "./chart-study-math";

export type AdvancedTrendType = "Alligator" | "Ichimoku" | "RegressionChannel" | "StandardPivots" | "ZigZag";
export type AdvancedTrendContext = { pivotLevels?: readonly Pick<Candle, "time" | "high" | "low" | "close">[] };

type TrendIndicator = ChartIndicator & { type: AdvancedTrendType };

function plot(key: string, label: string, points: IndicatorPoint[]): IndicatorPlot {
  return { key, label, points, pane: false };
}

function atCandles(bars: readonly Candle[], values: readonly (number | null)[]): IndicatorPoint[] {
  return values.flatMap((value, index) =>
    value !== null && Number.isFinite(value) ? [{ time: bars[index].time, value }] : [],
  );
}

function alligator(bars: readonly Candle[], indicator: TrendIndicator): IndicatorPlot[] {
  const median = bars.map(bar => indicatorSource(bar, "hl2"));
  const lines = [
    { key: "main", label: "Jaw", length: indicator.period, offset: 8 },
    { key: "teeth", label: "Teeth", length: indicator.slowLength ?? 8, offset: 5 },
    { key: "lips", label: "Lips", length: indicator.fastLength ?? 5, offset: 3 },
  ];
  return lines.map(({ key, label, length, offset }) => ({
    ...plot(key, label, atCandles(bars, movingAverage(median, length, "RMA"))), offset,
  }));
}

function ichimoku(bars: readonly Candle[], indicator: TrendIndicator): IndicatorPlot[] {
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const midpoint = (length: number) =>
    combine([extremes(highs, length, true), extremes(lows, length, false)], (high, low) => (high + low) / 2);

  const conversion = midpoint(indicator.period);
  const base = midpoint(indicator.fastLength ?? 26);
  const spanA = combine([conversion, base], (fast, slow) => (fast + slow) / 2);
  const spanB = midpoint(indicator.slowLength ?? 52);
  const displacement = indicator.signalLength ?? 26;
  return [
    plot("main", "Conversion", atCandles(bars, conversion)),
    plot("base", "Base", atCandles(bars, base)),
    { ...plot("span-a", "Leading Span A", atCandles(bars, spanA)), offset: displacement },
    { ...plot("span-b", "Leading Span B", atCandles(bars, spanB)), offset: displacement },
    { ...plot("lagging", "Lagging Span", atCandles(bars, bars.map(bar => bar.close))), offset: -displacement },
  ];
}

function regressionChannel(
  bars: readonly Candle[], length: number, source: PriceSource, deviation: number,
): IndicatorPlot[] {
  const center = plot("main", "Regression", []);
  const upper = plot("upper", "Upper Band", []);
  const lower = plot("lower", "Lower Band", []);
  if (length < 2 || bars.length < length) return [center, upper, lower];

  const start = bars.length - length;
  const meanX = (length - 1) / 2;
  // Center prices on the first observation to preserve precision in narrow ranges.
  const anchor = indicatorSource(bars[start], source);
  const prices = bars.slice(start).map(bar => indicatorSource(bar, source) - anchor);
  const meanY = prices.reduce((total, value) => total + value, 0) / length;
  const varianceX = length * (length ** 2 - 1) / 12;
  const covariance = prices.reduce((total, value, index) => total + (index - meanX) * (value - meanY), 0);
  const slope = covariance / varianceX;
  const fitted = (index: number) => meanY + slope * (index - meanX);
  const residualSquares = prices.reduce((total, value, index) => total + (value - fitted(index)) ** 2, 0);
  const distance = deviation * Math.sqrt(residualSquares / length);

  // Endpoints keep the channel straight on the chart even if the axis includes carried slots.
  for (const index of [0, length - 1]) {
    const time = bars[start + index].time;
    const value = anchor + fitted(index);
    if (![value, value + distance, value - distance].every(Number.isFinite)) return [plot("main", "Regression", []), plot("upper", "Upper Band", []), plot("lower", "Lower Band", [])];
    center.points.push({ time, value });
    upper.points.push({ time, value: value + distance });
    lower.points.push({ time, value: value - distance });
  }
  return [center, upper, lower];
}

function standardPivots(input: NonNullable<AdvancedTrendContext["pivotLevels"]>): IndicatorPlot[] {
  const pivot = plot("main", "P", []);
  const resistance = Array.from({ length: 5 }, (_, index) => plot(`r${index + 1}`, `R${index + 1}`, []));
  const support = Array.from({ length: 5 }, (_, index) => plot(`s${index + 1}`, `S${index + 1}`, []));
  for (const { time, high, low, close } of input) {
    const center = (high + low + close) / 3;
    const range = high - low;
    const r = [2 * center - low, center + range, high + 2 * (center - low), high + 3 * (center - low), high + 4 * (center - low)];
    const s = [2 * center - high, center - range, low - 2 * (high - center), low - 3 * (high - center), low - 4 * (high - center)];
    pivot.points.push({ time, value: center });
    for (const [index, level] of resistance.entries()) level.points.push({ time, value: r[index] });
    for (const [index, level] of support.entries()) level.points.push({ time, value: s[index] });
  }
  return [pivot, ...resistance, ...support].map(part => ({ ...part, step: true }));
}

type Swing = IndicatorPoint & { side: "high" | "low" };

function zigZag(bars: readonly Candle[], legs: number, deviation: number): IndicatorPlot[] {
  const radius = Math.max(1, Math.floor(legs / 2));
  const high = extremes(bars.map(bar => bar.high), radius, true);
  const low = extremes(bars.map(bar => bar.low), radius, false);
  const swings: Swing[] = [];
  const extendsSwing = (value: number, last: Swing) => last.side === "high" ? value > last.value : value < last.value;

  for (let index = radius; index < bars.length - radius; index++) {
    const { time, high: barHigh, low: barLow } = bars[index];
    const highPivot = barHigh > high[index - 1]! && barHigh >= high[index + radius]!;
    const lowPivot = barLow < low[index - 1]! && barLow <= low[index + radius]!;
    if (!highPivot && !lowPivot) continue;
    const last = swings.at(-1);
    // A candle can have both extremes. Prefer an extension whose ordering is known.
    // If there is no earlier swing, wait for an unambiguous first pivot.
    if (highPivot && lowPivot && !last) continue;
    const extendsLast = last && (last.side === "high" ? highPivot && extendsSwing(barHigh, last) : lowPivot && extendsSwing(barLow, last));
    const side = highPivot && lowPivot
      ? (extendsLast ? last!.side : last!.side === "high" ? "low" : "high")
      : highPivot ? "high" : "low";
    const value = side === "high" ? barHigh : barLow;
    const swing = { time, value, side } as Swing;

    if (!last) swings.push(swing);
    else if (last.side === side) {
      if (extendsSwing(value, last)) swings[swings.length - 1] = swing;
    } else {
      const move = last.side === "high" ? last.value - value : value - last.value;
      if (move > 0 && move * 100 >= last.value * deviation) swings.push(swing);
    }
  }
  return [plot("main", "Zig Zag", swings.map(({ time, value }) => ({ time, value })))];
}

export function advancedTrendValues(
  bars: readonly Candle[], indicator: TrendIndicator, context?: AdvancedTrendContext,
): IndicatorPlot[] {
  switch (indicator.type) {
    case "Alligator": return alligator(bars, indicator);
    case "Ichimoku": return ichimoku(bars, indicator);
    case "RegressionChannel": return regressionChannel(bars, indicator.period, indicator.source ?? "close", indicator.deviation ?? 2);
    case "StandardPivots": return standardPivots(context?.pivotLevels ?? []);
    case "ZigZag": return zigZag(bars, indicator.period, indicator.deviation ?? 5);
  }
}
