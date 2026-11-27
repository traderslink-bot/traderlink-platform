// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Candle, ChartTimeframe } from "./candles";
import { chartIndicatorCatalog, type ChartIndicatorType } from "./chart-indicator-catalog";
import { indicatorPresetRows } from "./chart-indicator-presets";
import { indicatorValues } from "./chart-indicators";
import type { ChartIndicator } from "./chart-preferences";

type Values = (number | null)[];
type ExpectedPlot = { key: string; values: Values; pane?: boolean; offset?: number };
type Reference = (bars: Candle[], settings: ChartIndicator, timeframe: ChartTimeframe) => ExpectedPlot[];

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const mean = (values: readonly number[]) => sum(values) / values.length;

function windowed(values: Values, length: number, apply: (window: number[], end: number) => number | null): Values {
  return values.map((_, index) => {
    if (index < length - 1) return null;
    const window = values.slice(index - length + 1, index + 1);
    return window.every((value): value is number => value !== null) ? apply(window, index) : null;
  });
}

function smooth(values: Values, period: number, alpha: number, firstBarSeed = false): Values {
  let run = 0;
  let previous: number | null = null;
  return values.map((value, index) => {
    if (value === null) {
      run = 0;
      previous = null;
      return null;
    }
    run++;
    if (previous !== null) {
      previous = (1 - alpha) * previous + alpha * value;
    } else if (firstBarSeed) {
      previous = value;
    } else if (run >= period) {
      previous = mean(values.slice(index - period + 1, index + 1) as number[]);
    }
    return previous;
  });
}

const ema = (values: Values, period: number, immediate = false) => smooth(values, period, 2 / (period + 1), immediate);
const wilder = (values: Values, period: number) => smooth(values, period, 1 / period);
const wma = (values: Values, period: number) => windowed(values, period, window =>
  sum(window.map((value, index) => value * (index + 1))) / ((period * (period + 1)) / 2));

function prices(bars: Candle[], settings: ChartIndicator): number[] {
  return bars.map(bar => {
    switch (settings.source) {
      case "hl2": return (bar.high + bar.low) / 2;
      case "hlc3": return mean([bar.high, bar.low, bar.close]);
      case "ohlc4": return mean([bar.open, bar.high, bar.low, bar.close]);
      case "hlcc4": return mean([bar.high, bar.low, bar.close, bar.close]);
      default: return bar[settings.source ?? "close"];
    }
  });
}

const main = (values: Values, pane = false): ExpectedPlot[] => [{ key: "main", values, pane }];

function parallel(values: Values, other: Values, apply: (a: number, b: number) => number | null): Values {
  return values.map((value, index) => value !== null && other[index] !== null ? apply(value, other[index]!) : null);
}

function envelope(basis: Values, width: Values): ExpectedPlot[] {
  return [
    ...main(basis),
    { key: "upper", values: parallel(basis, width, (a, b) => a + b) },
    { key: "lower", values: parallel(basis, width, (a, b) => a - b) },
  ];
}

function volumeAverage(bars: Candle[], settings: ChartIndicator): Values {
  return windowed(prices(bars, settings), settings.period, (window, end) => {
    const weights = bars.slice(end - window.length + 1, end + 1).map(bar => bar.volume);
    const totalVolume = sum(weights);
    return totalVolume ? sum(window.map((price, index) => price * weights[index])) / totalVolume : null;
  });
}

function trueRanges(bars: Candle[]): number[] {
  return bars.map((bar, index) => {
    const previousClose = bars[index - 1]?.close ?? bar.close;
    return Math.max(bar.high, previousClose) - Math.min(bar.low, previousClose);
  });
}

function populationDeviation(window: number[]): number {
  const relative = window.map(value => value - window[0]);
  const center = mean(relative);
  return Math.sqrt(mean(relative.map(value => (value - center) ** 2)));
}

function leastSquares(values: number[]) {
  // Solve the two normal equations from direct sums. The optimized implementations
  // use a rolling weighted average or a centered fit with a different accumulation order.
  const size = values.length;
  const x = values.map((_, index) => index);
  const xSum = sum(x);
  const determinant = size * sum(x.map(value => value ** 2)) - xSum ** 2;
  const slope = determinant ? (size * sum(values.map((value, index) => value * index)) - xSum * sum(values)) / determinant : 0;
  const intercept = (sum(values) - slope * xSum) / size;
  return { at: (index: number) => intercept + slope * index };
}

const references = {
  EMA: (bars, s) => main(ema(prices(bars, s), s.period, true)),
  SMA: (bars, s) => main(windowed(prices(bars, s), s.period, mean)),
  WMA: (bars, s) => main(wma(prices(bars, s), s.period)),
  HMA: (bars, s) => {
    // Alan Hull's original formula uses integer division and integer square root.
    // https://alanhull.com/the-hull-moving-average/
    const source = prices(bars, s);
    const lagReduced = parallel(wma(source, Math.max(1, Math.trunc(s.period / 2))), wma(source, s.period), (a, b) => a + a - b);
    return main(wma(lagReduced, Math.trunc(Math.sqrt(s.period))));
  },
  VWMA: (bars, s) => main(volumeAverage(bars, s)),
  DEMA: (bars, s) => {
    const once = ema(prices(bars, s), s.period);
    return main(parallel(once, ema(once, s.period), (a, b) => a + (a - b)));
  },
  TEMA: (bars, s) => {
    const early = ema(prices(bars, s), s.period);
    const later = ema(early, s.period);
    const latest = ema(later, s.period);
    return main(latest.map((value, index) => value === null ? null : value + 3 * (early[index]! - later[index]!)));
  },
  RMA: (bars, s) => main(wilder(prices(bars, s), s.period)),
  ALMA: (bars, s) => main(windowed(prices(bars, s), s.period, window => {
    const weights = window.map((_, index) =>
      Math.exp(-0.5 * (6 * (index - 0.85 * (window.length - 1)) / window.length) ** 2));
    return sum(window.map((value, index) => value * weights[index])) / sum(weights);
  })),
  KAMA: (bars, s) => {
    const source = prices(bars, s);
    const slow = 2 / ((s.slowLength ?? 30) + 1);
    const fast = 2 / ((s.fastLength ?? 2) + 1);
    let filtered: number | undefined;
    return main(windowed(source, s.period + 1, window => {
      let path = 0;
      for (let index = 1; index < window.length; index++) path += Math.abs(window[index] - window[index - 1]);
      const current = window.at(-1)!;
      const efficiency = path === 0 ? 0 : Math.abs(current - window[0]) / path;
      const alpha = ((1 - efficiency) * slow + efficiency * fast) ** 2;
      filtered = (1 - alpha) * (filtered ?? window[window.length - 2]) + alpha * current;
      return filtered;
    }));
  },
  LSMA: (bars, s) => main(windowed(prices(bars, s), s.period, window => leastSquares(window).at(window.length - 1))),
  McGinley: (bars, s) => {
    // The 0.6-period form re-seeds on a nonpositive or nonfinite recursive result.
    let previous = 0;
    return main(prices(bars, s).map(price => {
      if (!(price > 0)) {
        previous = 0;
        return null;
      }
      if (previous === 0) previous = price;
      const next = previous + ((price - previous) / (0.6 * s.period)) * (previous / price) ** 4;
      previous = Number.isFinite(next) && next > 0 ? next : price;
      return previous;
    }));
  },
  Ribbon: (bars, s) => {
    const source = prices(bars, s);
    return Array.from({ length: 6 }, (_, index) => ({
      key: index === 0 ? "main" : `ma-${index + 1}`,
      values: windowed(source, (s.fastLength ?? 8) + index * (s.slowLength ?? 8), mean),
    }));
  },
  MACross: (bars, s) => {
    const source = prices(bars, s);
    return [
      ...main(windowed(source, s.period, mean)),
      { key: "signal", values: windowed(source, s.slowLength ?? 21, mean) },
    ];
  },
  Alligator: (bars, s) => {
    const midpoint = bars.map(bar => (bar.high + bar.low) / 2);
    return [
      { key: "main", values: wilder(midpoint, s.period), offset: 8 },
      { key: "teeth", values: wilder(midpoint, s.slowLength ?? 8), offset: 5 },
      { key: "lips", values: wilder(midpoint, s.fastLength ?? 5), offset: 3 },
    ];
  },
  Bollinger: (bars, s) => {
    const source = prices(bars, s);
    const basis = {
      SMA: () => windowed(source, s.period, mean),
      EMA: () => ema(source, s.period, true),
      WMA: () => wma(source, s.period),
      RMA: () => wilder(source, s.period),
      VWMA: () => volumeAverage(bars, s),
    }[s.basisMa ?? "SMA"]();
    return envelope(basis, windowed(source, s.period, window => (s.deviation ?? 2) * populationDeviation(window)));
  },
  Keltner: (bars, s) => {
    const averageRange = wilder(trueRanges(bars), s.signalLength ?? 20);
    return envelope(ema(prices(bars, s), s.period), averageRange.map(value => value === null ? null : value * (s.deviation ?? 2)));
  },
  Donchian: (bars, s) => {
    const high = windowed(bars.map(bar => bar.high), s.period, window => Math.max(...window));
    const low = windowed(bars.map(bar => bar.low), s.period, window => Math.min(...window));
    return [
      ...main(parallel(high, low, (a, b) => (a + b) / 2)),
      { key: "upper", values: high },
      { key: "lower", values: low },
    ];
  },
  Envelope: (bars, s) => {
    const center = windowed(prices(bars, s), s.period, mean);
    return envelope(center, center.map(value => value === null ? null : value * ((s.deviation ?? 2.5) / 100)));
  },
  ATR: (bars, s) => main(wilder(trueRanges(bars), s.period), true),
  StdDev: (bars, s) => main(windowed(prices(bars, s), s.period, populationDeviation), true),
  HistVol: (bars, s, timeframe) => {
    const source = prices(bars, s);
    const frequencies = { "1D": 252, "1W": 52, "1M": 12, "1Y": 1 } as Partial<Record<ChartTimeframe, number>>;
    const returns = source.map((value, index) =>
      value > 0 && source[index - 1] > 0 ? Math.log(value / source[index - 1]) : null);
    return main(windowed(returns, s.period, window =>
      populationDeviation(window) * 100 * Math.sqrt(frequencies[timeframe] ?? 1)), true);
  },
  BBWidth: (bars, s) => main(windowed(prices(bars, s), s.period, window => {
    const basis = mean(window);
    const distance = (s.deviation ?? 2) * populationDeviation(window);
    return basis === 0 ? null : 100 * (((basis + distance) - (basis - distance)) / basis);
  }), true),
  BBPercent: (bars, s) => main(windowed(prices(bars, s), s.period, window => {
    const distance = (s.deviation ?? 2) * populationDeviation(window);
    if (distance === 0) return null;
    const bottom = mean(window) - distance;
    return (window.at(-1)! - bottom) / (2 * distance);
  }), true),
  Ulcer: (bars, s) => {
    // Each drawdown uses that observation's own trailing peak.
    const drawdowns = windowed(prices(bars, s), s.period, window => {
      const peak = Math.max(...window);
      return peak === 0 ? null : 100 * (window.at(-1)! - peak) / peak;
    });
    return main(windowed(drawdowns, s.period, window => Math.sqrt(mean(window.map(value => value ** 2)))), true);
  },
  RegressionChannel: (bars, s) => {
    const source = prices(bars, s);
    const window = source.slice(-s.period);
    if (window.length < s.period || s.period < 2) {
      return envelope(source.map(() => null), source.map(() => null));
    }
    const fit = leastSquares(window);
    const distance = Math.sqrt(mean(window.map((value, index) => (value - fit.at(index)) ** 2))) * (s.deviation ?? 2);
    const first = source.length - s.period;
    const center = source.map((_, index) => index === first || index === source.length - 1 ? fit.at(index - first) : null);
    return envelope(center, source.map(() => distance));
  },
} satisfies Partial<Record<ChartIndicatorType, Reference>>;

type ReferenceStudy = keyof typeof references;
const types = Object.keys(references) as ReferenceStudy[];
const deterministicBars: Candle[] = Array.from({ length: 240 }, (_, index) => {
  const center = 0.35 + index * 0.001 + Math.sin(index / 5) * 0.08 + (index >= 150 ? 0.2 : 0);
  const open = center + Math.sin(index / 3) * 0.01;
  const close = center + Math.cos(index / 2) * 0.012;
  return {
    time: 1_800_000_000 + (index + (index >= 120 ? 7 : 0)) * 60,
    open, high: Math.max(open, close) + 0.02, low: Math.min(open, close) - 0.015, close,
    volume: index % 13 === 0 ? 0 : 900 + index * 246 + index % 5 * 1000,
  };
});

function compare(bars: Candle[], settings: ChartIndicator & { type: ReferenceStudy }, timeframe: ChartTimeframe) {
  const reference: ExpectedPlot[] = references[settings.type](bars, settings, timeframe);
  const actual = indicatorValues(bars, settings, timeframe);
  expect(actual.map(plot => plot.key)).toEqual(reference.map(plot => plot.key));
  for (const [index, expected] of reference.entries()) {
    const plot = actual[index];
    expect(plot.pane, expected.key).toBe(expected.pane ?? false);
    expect(plot.offset, expected.key).toBe(expected.offset);
    const points = expected.values.flatMap((value, bar) => value === null ? [] : [{ time: bars[bar].time, value }]);
    expect(plot.points.map(point => point.time), `${expected.key} warm-up and gaps`).toEqual(points.map(point => point.time));
    for (const [pointIndex, point] of points.entries()) {
      const observed = plot.points[pointIndex].value;
      const tolerance = 1e-8 + 1e-8 * Math.abs(point.value);
      if (!Number.isFinite(observed) || Math.abs(observed - point.value) > tolerance) {
        expect(observed, `${expected.key} at ${point.time}`).toBeCloseTo(point.value, 8);
      }
    }
  }
}

function readOptionalFixture(path: string | undefined, symbol: string): Candle[] | undefined {
  if (!path) return undefined;
  const fixture = JSON.parse(readFileSync(path, "utf8")) as { symbol?: string; bars?: Candle[]; inputs?: { symbol: string; bars: Candle[] }[] };
  const bars = fixture.symbol === symbol ? fixture.bars : fixture.inputs?.find(input => input.symbol === symbol)?.bars;
  if (!bars || bars.length < 200) throw Error(`Reference fixture has fewer than 200 recorded ${symbol} candles`);
  return bars;
}

function defaults(type: ReferenceStudy) {
  return indicatorPresetRows(type, 0, () => type).map(row => ({ ...row, type }));
}

it("covers every moving average and volatility entry plus Linear Regression Channel", () => {
  const groups = Object.entries(chartIndicatorCatalog)
    .filter(([, study]) => study.group === "Moving Averages" || study.group === "Volatility")
    .map(([type]) => type);
  expect([...types].sort()).toEqual([...groups, "RegressionChannel"].sort());
});

const fixtures = [
  { name: "deterministic OHLCV", bars: deterministicBars, timeframe: "1m" },
  { name: "recorded VIVS SIP minute OHLCV", bars: readOptionalFixture(process.env.CHART_REFERENCE_MINUTE_HISTORY, "VIVS"), timeframe: "1m" },
  { name: "recorded SAFX SIP daily OHLCV", bars: readOptionalFixture(process.env.CHART_REFERENCE_DAILY_HISTORY, "SAFX"), timeframe: "1D" },
] as const;
for (const { name, bars, timeframe } of fixtures) {
  if (!bars) continue;
  describe(name, () => {
    it.each(types)("%s matches the reference for all series, timestamps and warm-up", type => {
      for (const config of defaults(type)) compare(bars, config, timeframe);
      if (type === "HMA") compare(bars, { ...defaults(type)[0], period: 8, source: "hlc3" }, timeframe);
    });
  });
}

it("leaves zero-volume VWMA and flat-band %B undefined until the inputs recover", () => {
  const flat = deterministicBars.slice(0, 8).map(bar => ({ ...bar, open: 1, high: 1, low: 1, close: 1, volume: 0 }));
  const recovery = deterministicBars.slice(8, 16);
  for (const type of ["VWMA", "BBPercent"] as const) {
    const settings = { ...defaults(type)[0], period: 4 };
    const values = indicatorValues([...flat, ...recovery], settings, "1m")[0].points;
    expect(values[0]?.time).toBe(recovery[0].time);
    compare([...flat, ...recovery], settings, "1m");
  }
});

it("uses the selected source and period inputs rather than the defaults", () => {
  compare(deterministicBars, { ...defaults("ALMA")[0], source: "open", period: 13 }, "1m");
  compare(deterministicBars, { ...defaults("KAMA")[0], source: "low", period: 5, fastLength: 3, slowLength: 15 }, "1m");
  compare(deterministicBars, { ...defaults("MACross")[0], source: "high", period: 7, slowLength: 17 }, "1m");
  compare(deterministicBars, { ...defaults("Keltner")[0], source: "ohlc4", period: 20, signalLength: 26, deviation: 3 }, "1m");
  compare(deterministicBars, { ...defaults("RegressionChannel")[0], source: "open", period: 37, deviation: 3 }, "1m");
});

function closingBars(closes: number[], volumes: number[] = closes.map(() => 100)): Candle[] {
  return closes.map((close, index) => ({
    time: 1_800_000_000 + index * 60, open: close, high: close, low: close, close, volume: volumes[index],
  }));
}

it("ignores fractional zero-volume residue and preserves small weights after a large weight expires", () => {
  const volume = [1e16, 0.1, 0.2, 0.3, 0, 0, 0, 0, 0.4];
  const bars = closingBars([20, 1, 2, 3, 4, 5, 6, 7, 8], volume);
  const settings = { ...defaults("VWMA")[0], period: 3 };
  compare(bars, settings, "1m");
  compare(bars, { ...defaults("Bollinger")[0], period: 3, basisMa: "VWMA" }, "1m");
  const points = indicatorValues(bars, settings, "1m")[0].points;
  expect(points.some(point => point.time === bars[6].time || point.time === bars[7].time)).toBe(false);
  expect(points.at(-1)?.value).toBe(8);
});

it("Historical Volatility settles at zero after a price regime change and rewarms after undefined returns", () => {
  const prices = [1, 3, 2, 4, 2, ...Array.from({ length: 20 }, (_, index) => 10 * 1.02 ** index)];
  const bars = closingBars([...prices, 0, 10, 11, 10, 12]);
  const settings = { ...defaults("HistVol")[0], period: 3 };
  compare(bars, settings, "1D");
  const points = indicatorValues(bars, settings, "1D")[0].points;
  expect(points.find(point => point.time === bars[prices.length - 1].time)?.value).toBeCloseTo(0, 10);
  expect(points.some(point => point.time >= bars[prices.length].time && point.time < bars.at(-1)!.time)).toBe(false);
  expect(points.at(-1)?.time).toBe(bars.at(-1)!.time);
});

it("Ulcer Index returns exact zero after earlier drawdown squares expire", () => {
  const prices = [113, 82, 63.13, 72, 89, 208, 300, 401, 590];
  const bars = closingBars(prices);
  const settings = { ...defaults("Ulcer")[0], period: 3 };
  compare(bars, settings, "1m");
  expect(indicatorValues(bars, settings, "1m")[0].points.at(-1)?.value).toBe(0);
});
