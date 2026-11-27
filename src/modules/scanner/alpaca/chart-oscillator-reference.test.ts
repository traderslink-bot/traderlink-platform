// @vitest-environment node
import Decimal from "decimal.js";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Candle, ChartTimeframe } from "./candles";
import { chartIndicatorCatalog } from "./chart-indicator-catalog";
import { indicatorPresetRows } from "./chart-indicator-presets";
import { indicatorHistogramColor, indicatorValues } from "./chart-indicators";
import { rollingSum } from "./chart-study-math";

// The app's established RSI and MACD conventions keep fully flat RSI at 100 and
// seed MACD EMAs from their first observation. Other exponential references
// use a complete SMA window for initialization.
// Formula references for the less common studies: Ehlers' published RVI and Fisher,
// TA-Lib's STC specification, and TradingView's SMI Ergodic Oscillator documentation.
// https://technical.traders.com/traderstips/implementation-files/tradestation/contents-0000001090-001-tradestation/defining-article-code.html
// https://tradingsystemlab.com/wp-content/uploads/2019/08/Using-The-Fisher-Transform.pdf
// https://ta-lib.org/functions/stc.html
// https://www.tradingview.com/support/solutions/43000594671-smi-ergodic-oscillator/

type Series = (number | null)[];
type Reference = { main: Series; signal?: Series; histogram?: Series };
type CandleInputs = { close: number[]; open: number[]; high: number[]; low: number[]; midpoint: number[]; typical: number[] };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const mean = (values: number[]) => sum(values) / values.length;
const series = (length: number, value: (index: number) => number | null): Series =>
  Array.from({ length }, (_, index) => value(index));

// Deliberately recompute windows from their own samples to check the production rolling accumulators.
function windowed(values: Series, length: number, transform: (window: number[]) => number | null): Series {
  return series(values.length, index => {
    if (index + 1 < length) return null;
    const window = values.slice(index + 1 - length, index + 1);
    if (window.some(value => value === null)) return null;
    return transform(window as number[]);
  });
}

function ema(values: Series, length: number, seed: "first" | "mean" = "mean"): Series {
  const alpha = 2 / (length + 1);
  let remaining = seed === "first" ? 1 : length;
  let total = 0;
  let output: number | null = null;
  return values.map(value => {
    if (value === null) {
      remaining = seed === "first" ? 1 : length;
      total = 0;
      output = null;
      return null;
    }
    if (output !== null) return output = alpha * value + (1 - alpha) * output;
    total += value;
    remaining--;
    if (remaining === 0) output = total / (seed === "first" ? 1 : length);
    return output;
  });
}

function paired(left: Series, right: Series, value: (left: number, right: number) => number | null): Series {
  return left.map((a, index) => {
    const b = right[index];
    return a === null || b === null ? null : value(a, b);
  });
}

function changes(values: Series, length = 1, percent = false): Series {
  return values.map((current, index) => {
    const old = values[index - length];
    if (current == null || old == null || percent && old === 0) return null;
    return percent ? 100 * (current / old - 1) : current - old;
  });
}

function rsi(values: number[], length: number, flat: number): Series {
  const moves = values.slice(1).map((value, index) => value - values[index]);
  const initial = moves.slice(0, length);
  let gains = sum(initial.map(move => Math.max(0, move)));
  let losses = sum(initial.map(move => Math.max(0, -move)));
  let output = flat;
  return series(values.length, index => {
    if (index < length) return null;
    if (index > length) {
      const move = moves[index - 1];
      gains = (1 - 1 / length) * gains + Math.max(0, move);
      losses = (1 - 1 / length) * losses + Math.max(0, -move);
      if (move === 0) return output;
    }
    return output = gains + losses === 0 ? flat : 100 * (gains / (gains + losses));
  });
}

function percentK(close: Series, high: Series, low: Series, length: number): Series {
  return series(close.length, index => {
    if (index + 1 < length || close[index] === null) return null;
    const left = index + 1 - length;
    const highs = high.slice(left, index + 1);
    const lows = low.slice(left, index + 1);
    if ([...highs, ...lows].includes(null)) return null;
    const top = Math.max(...highs as number[]);
    const bottom = Math.min(...lows as number[]);
    return top === bottom ? null : 100 * (close[index]! - bottom) / (top - bottom);
  });
}

function smoothedMomentum(values: number[], first: number, second: number, factor: number): Series {
  const diff = changes(values);
  const magnitude = diff.map(change => change === null ? null : Math.abs(change));
  return paired(ema(ema(diff, first), second), ema(ema(magnitude, first), second),
    (signed, absolute) => absolute === 0 ? 0 : factor * signed / absolute);
}

function symmetric4(values: Series): Series {
  return windowed(values, 4, ([old, previous, recent, current]) => (old + 2 * previous + 2 * recent + current) / 6);
}

const reference = {
  RSI: ({ close }) => ({ main: rsi(close, 14, 100) }),
  MACD: ({ close }) => {
    const main = paired(ema(close, 12, "first"), ema(close, 26, "first"), (short, long) => short - long);
    const signal = ema(main, 9, "first");
    return { main, signal, histogram: paired(main, signal, (line, average) => line - average) };
  },
  Stoch: ({ close, high, low }) => {
    const main = windowed(percentK(close, high, low, 14), 3, mean);
    return { main, signal: windowed(main, 3, mean) };
  },
  StochRSI: ({ close }) => {
    const strength = rsi(close, 14, 50);
    const main = windowed(percentK(strength, strength, strength, 14), 3, mean);
    return { main, signal: windowed(main, 3, mean) };
  },
  CCI: ({ typical }) => ({
    main: windowed(typical, 20, window => {
      const current = window.at(-1)!;
      const distance = window.map(value => value - current);
      const center = mean(distance);
      const deviation = mean(distance.map(value => Math.abs(value - center)));
      return deviation === 0 ? 0 : -center / (0.015 * deviation);
    }),
  }),
  WilliamsR: ({ close, high, low }) => {
    const upper = windowed(high, 14, window => Math.max(...window));
    const lower = windowed(low, 14, window => Math.min(...window));
    return {
      main: series(close.length, index => {
        const top = upper[index], bottom = lower[index];
        return top === null || bottom === null || top === bottom ? null : -100 * (top - close[index]) / (top - bottom);
      }),
    };
  },
  Momentum: ({ close }) => ({ main: changes(close, 10) }),
  ROC: ({ close }) => ({ main: changes(close, 9, true) }),
  AO: ({ midpoint }) => ({
    main: paired(windowed(midpoint, 5, mean), windowed(midpoint, 34, mean), (short, long) => short - long),
  }),
  Ultimate: ({ close, high, low }) => ({
    main: series(close.length, index => {
      if (index < 28) return null;
      const ratio = (length: number) => {
        let buy = 0;
        let range = 0;
        for (let i = index + 1 - length; i <= index; i++) {
          const floor = Math.min(close[i - 1], low[i]);
          buy += close[i] - floor;
          range += Math.max(high[i], close[i - 1]) - floor;
        }
        return range === 0 ? null : buy / range;
      };
      const a = ratio(7), b = ratio(14), c = ratio(28);
      return a === null || b === null || c === null ? null : 100 * (a * 4 + b * 2 + c) / 7;
    }),
  }),
  TRIX: ({ close }) => ({ main: changes(ema(ema(ema(close, 18), 18), 18), 1, true) }),
  TSI: ({ close }) => {
    const main = smoothedMomentum(close, 25, 13, 100);
    return { main, signal: ema(main, 13) };
  },
  DPO: ({ close }) => ({
    main: windowed(close, 21, window => window.at(-12)! - mean(window)),
  }),
  Coppock: ({ close }) => ({
    main: windowed(paired(changes(close, 11, true), changes(close, 14, true), (short, long) => short + long),
      10, window => sum(window.map((value, index) => value * (index + 1))) / 55),
  }),
  KST: ({ close }) => {
    const lengths = [[10, 10], [15, 10], [20, 10], [30, 15]];
    const parts = lengths.map(([roc, length]) => windowed(changes(close, roc, true), length, mean));
    const main = series(close.length, index => {
      const values = parts.map(part => part[index]);
      return values.includes(null) ? null : sum(values.map((value, n) => value! * (n + 1)));
    });
    return { main, signal: windowed(main, 9, mean) };
  },
  CMO: ({ close }) => ({
    main: windowed(changes(close), 14, window => {
      const up = sum(window.filter(change => change > 0));
      const down = -sum(window.filter(change => change < 0));
      return up + down === 0 ? 0 : 100 * (up - down) / (up + down);
    }),
  }),
  RVI: ({ open, high, low, close }) => {
    const numerator = windowed(symmetric4(paired(close, open, (c, o) => c - o)), 10, mean);
    const denominator = windowed(symmetric4(paired(high, low, (h, l) => h - l)), 10, mean);
    const main = paired(numerator, denominator, (a, b) => b === 0 ? null : a / b);
    return { main, signal: symmetric4(main) };
  },
  Fisher: ({ midpoint }) => {
    let scaled = 0;
    let fish = 0;
    const main = windowed(midpoint, 9, window => {
      const top = Math.max(...window);
      const bottom = Math.min(...window);
      const percentile = top === bottom ? 0 : 2 * (window.at(-1)! - bottom) / (top - bottom) - 1;
      scaled = 0.33 * percentile + 0.67 * scaled;
      if (Math.abs(scaled) > 0.99) scaled = 0.999 * Math.sign(scaled);
      return fish = Math.atanh(scaled) + 0.5 * fish;
    });
    return { main, signal: main.map((_, index) => main[index - 1] ?? null) };
  },
  STC: ({ close }) => {
    const macd = paired(ema(close, 23), ema(close, 50), (fast, slow) => fast - slow);
    const normalize = (input: Series) => {
      let raw = 0;
      let smoothed: number | undefined;
      return windowed(input, 10, window => {
        const min = Math.min(...window);
        const max = Math.max(...window);
        const precision = 32 * Number.EPSILON * Math.max(1, Math.abs(max), Math.abs(min));
        if (max - min > precision) raw = 100 * (window.at(-1)! - min) / (max - min);
        smoothed = smoothed === undefined ? raw : (smoothed + raw) / 2;
        return smoothed;
      });
    };
    return { main: normalize(normalize(macd)) };
  },
  SMIErgodic: ({ close }) => {
    const value = smoothedMomentum(close, 5, 20, 1);
    const signal = ema(value, 5);
    return { main: paired(value, signal, (current, average) => current - average) };
  },
  ConnorsRSI: ({ close }) => {
    let streak = 0;
    const updown = close.map((current, index) => {
      const previous = close[index - 1];
      if (current > previous) streak = Math.max(0, streak) + 1;
      else if (current < previous) streak = Math.min(0, streak) - 1;
      else streak = 0;
      return streak;
    });
    const a = rsi(close, 3, 50);
    const b = rsi(updown, 2, 50);
    const Price = Decimal.clone({ precision: 48 });
    const prices = close.map(value => new Price(value));
    const rank = series(close.length, i => {
      if (i < 101) return null;
      let less = 0;
      for (let j = i - 100; j < i; j++) {
        if (prices[j - 1].isZero() || prices[i - 1].isZero()) return null;
        if (prices[j].times(prices[i - 1]).lt(prices[i].times(prices[j - 1]))) less++;
      }
      return less;
    });
    return {
      main: series(close.length, i => a[i] === null || b[i] === null || rank[i] === null ? null : (a[i]! + b[i]! + rank[i]!) / 3),
    };
  },
  BOP: ({ close, open, high, low }) => ({
    main: close.map((value, i) => high[i] === low[i] ? 0 : (value - open[i]) / (high[i] - low[i])),
  }),
  BullBear: ({ close, high, low }) => ({
    main: ema(close, 13).map((average, i) => average === null ? null : (high[i] - average) + (low[i] - average)),
  }),
} satisfies Record<string, (input: CandleInputs) => Reference>;

const types = Object.keys(reference) as (keyof typeof reference)[];

function compareOscillator(type: typeof types[number], bars: Candle[], timeframe: ChartTimeframe) {
  const split = {
    close: bars.map(bar => bar.close),
    open: bars.map(bar => bar.open),
    high: bars.map(bar => bar.high),
    low: bars.map(bar => bar.low),
    midpoint: bars.map(bar => (bar.high + bar.low) / 2),
    typical: bars.map(bar => (bar.high + bar.low + bar.close) / 3),
  };
  const [study] = indicatorPresetRows(type, 0, () => "reference-qa");
  const actual = indicatorValues(bars, study, timeframe);
  const expected: Reference = reference[type](split);
  const supplemental = type === "RSI" ? ["upper", "middle", "lower"] : [];
  expect(actual.map(part => part.key)).toEqual([...Object.keys(expected), ...supplemental]);
  expect(actual.every(part => part.pane)).toBe(true);
  expect(actual.filter(part => part.histogram).map(part => part.key)).toEqual(
    type === "MACD" ? ["histogram"] : type === "AO" || type === "SMIErgodic" ? ["main"] : [],
  );
  const start = actual[0].points[0]?.time;
  for (const key of supplemental) {
    const levels = { upper: 70, middle: 50, lower: 30 };
    const end = actual[0].points.at(-1)?.time;
    expect(actual.find(part => part.key === key)?.points).toEqual(
      start === undefined ? [] : [...new Set([start, end])].map(time => ({ time, value: levels[key as keyof typeof levels] })),
    );
  }

  for (const [key, values] of Object.entries(expected) as [keyof Reference, Series][]) {
    const expectedPoints = values.flatMap((value, index) => value === null ? [] : [{ time: bars[index].time, value }]);
    const actualPoints = actual.find(part => part.key === key)!.points;
    expect(actualPoints.length, `${type}/${key} coverage`).toEqual(expectedPoints.length);
    for (const [index, want] of expectedPoints.entries()) {
      const found = actualPoints[index];
      const tolerance = 1e-8 * Math.max(1, Math.abs(want.value));
      if (found.time !== want.time || Math.abs(found.value - want.value) > tolerance) {
        throw Error(`${type}/${key} point ${index}: expected ${want.time}/${want.value}, got ${found.time}/${found.value}`);
      }
    }
  }
}

function candles(length: number, pattern: (index: number) => { price: number; spread: number }): Candle[] {
  return Array.from({ length }, (_, index) => {
    const { price, spread } = pattern(index);
    return {
      time: 1_800_000_000 + 60 * (index + Math.floor(index / 9)), open: price - spread / 3, close: price,
      low: price - spread, high: price + spread, volume: index % 11 === 0 ? 0 : index * 173 + 37,
    };
  });
}

const sparse = candles(360, index => {
  if (index < 40 || index >= 270) return { price: 0.31, spread: 0 };
  if (index < 120) return { price: 0.32 + index * 0.001, spread: 0.01 };
  const price = 0.41 + Math.sin(index / 4) * 0.02 + (index % 5) * 0.004;
  return { price, spread: (index % 23 + 1) * 0.0003 };
});
const flat = candles(140, () => ({ price: 0.31, spread: 0 }));

describe("independent oscillator references", () => {
  it("covers the entire catalog group", () => {
    expect(Object.entries(chartIndicatorCatalog).filter(([, entry]) => entry.group === "Oscillators")
      .map(([key]) => key).sort()).toEqual([...types].sort());
  });

  it.each(types)("matches %s against sparse prices, flat stretches and warmup", type => {
    compareOscillator(type, sparse, "1m");
    compareOscillator(type, flat, "1m");
    compareOscillator(type, sparse.slice(0, 2), "1m");
  });

  it("ranks tied GMM returns strictly and preserves a genuinely higher adjacent return", () => {
    const [preset] = indicatorPresetRows("ConnorsRSI", 0, () => "rank");
    // 1.40 -> 1.41 and 1.33 -> 1.3395 both return exactly 1/140.
    for (const source of ["close", "high", "low", "open", "hl2", "hlc3", "ohlc4", "hlcc4"] as const) {
      for (const [lastPrice, expectedRank] of [[1.3395, 50], [1.3395000000000001, 100]] as const) {
        const bars = [1.4, 1.41, 1.33, lastPrice].map((price, i) => ({
          time: i * 60, open: price, high: price, low: price, close: price, volume: 100,
        }));
        const setting = { ...preset, source, period: 2, fastLength: 1, slowLength: 1 };
        const points = indicatorValues(bars, setting, "1m")[0].points;
        expect(points, source).toHaveLength(1);
        expect(points[0].value, source).toBeCloseTo((200 + expectedRank) / 3, 10);
      }
    }
  });

  it("clears expired floating residue while retaining real small observations", () => {
    expect(rollingSum([0.1, 0.2, 0.3, 0, 0, 0, 1e-18], 3).slice(-2)).toEqual([0, 1e-18]);
  });

  it("colors Awesome Oscillator by slope on either side of zero", () => {
    const [study] = indicatorPresetRows("AO", 0, () => "reference-qa");
    expect(indicatorHistogramColor(study, 2, 3, "#0a0", "#a00")).toBe("#a00");
    expect(indicatorHistogramColor(study, -2, -3, "#0a0", "#a00")).toBe("#0a0");
    expect(indicatorHistogramColor(study, -3, -2, "#0a0", "#a00")).toBe("#a00");
  });
});

const marketMinute = process.env.TRADERLINK_QA_OSCILLATOR_MINUTE;
const marketDaily = process.env.TRADERLINK_QA_OSCILLATOR_DAILY;
if (marketMinute && marketDaily) {
  const { inputs } = JSON.parse(readFileSync(marketMinute, "utf8")) as { inputs: { symbol: string; bars: Candle[] }[] };
  const vivs = inputs.find(input => input.symbol === "VIVS")!.bars;
  const safx = JSON.parse(readFileSync(marketDaily, "utf8")) as { symbol: string; bars: Candle[] };
  describe("recorded VIVS minute and SAFX daily oscillator references", () => {
    it.each(types)("matches %s on both recorded histories", type => {
      expect(safx.symbol).toBe("SAFX");
      compareOscillator(type, vivs, "1m");
      compareOscillator(type, safx.bars, "1D");
    });
  });
}
