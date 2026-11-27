import Decimal from "decimal.js";
import type { Candle, ChartTimeframe } from "./candles";
import { additionalChartIndicators, type AdditionalChartIndicator } from "./chart-indicator-catalog";
import { indicatorSource, movingAverage } from "./chart-indicator-math";
import type { IndicatorPlot } from "./chart-indicators";
import type { ChartIndicator, PriceSource } from "./chart-preferences";
import { rollingDeviation } from "./rolling-deviation";
import { combine, cumulative, extremeIndexes, extremes, lag, rateOfChange, ratioPercent, relativeStrength, rollingSum, sma, smooth, stochastic, wma, type Samples } from "./chart-study-math";

type Plot = { values: Samples; key: string; label?: string; histogram?: boolean };
type StudyInputs = {
  times: number[];
  visibleFrom?: number;
  source: number[];
  sourceKind: PriceSource;
  high: number[];
  low: number[];
  close: number[];
  open: number[];
  volume: number[];
  length: number;
  fast: number;
  slow: number;
  signal: number;
  multiplier: number;
  timeframe?: ChartTimeframe;
};
type Calculation = (inputs: StudyInputs) => Plot[];

const line = (values: Samples, key = "main", label?: string): Plot => ({ values, key, label });
const histogram = (values: Samples): Plot => ({ values, key: "main", histogram: true });
const difference = (a: Samples, b: Samples) => combine([a, b], (x, y) => x - y);
const weightedSeries = (a: Samples, b: Samples, weight: number) => combine([a, b], (x, y) => x + weight * (y - x));
function bands(center: Samples, distance: Samples): Plot[] {
  return [line(center, "main", "Middle"), line(combine([center, distance], (a, b) => a + b), "upper", "Upper"),
    line(difference(center, distance), "lower", "Lower")];
}
function signalLines(values: Samples, signal: Samples, label = "Signal"): Plot[] {
  return [line(values), line(signal, "signal", label)];
}
function envelope(high: Samples, low: Samples, length: number): Plot[] {
  const upper = extremes(high, length, true);
  const lower = extremes(low, length, false);
  return [line(weightedSeries(upper, lower, 0.5), "main", "Middle"), line(upper, "upper", "Upper"), line(lower, "lower", "Lower")];
}

function trueRange({ high, low, close }: StudyInputs) {
  return high.map((value, index) => {
    const previous = close[index - 1];
    return previous === undefined ? value - low[index] : Math.max(value - low[index], Math.abs(value - previous), Math.abs(low[index] - previous));
  });
}
function accumulationDistribution({ high, low, close, volume }: StudyInputs) {
  return cumulative(volume.map((value, i) => high[i] === low[i] ? 0 : value * (2 * close[i] - high[i] - low[i]) / (high[i] - low[i])));
}
function doubleSmoothedStrength(source: Samples, first: number, second: number, scale = 1) {
  const change = difference(source, lag(source, 1));
  const absolute = change.map(value => value === null ? null : Math.abs(value));
  return combine([smooth(smooth(change, first), second), smooth(smooth(absolute, first), second)],
    (value, magnitude) => magnitude ? scale * value / magnitude : 0);
}

function aroon({ high, low, length }: StudyInputs): Plot[] {
  const score = (values: Samples, upper: boolean) =>
    extremeIndexes(values, length + 1, upper).map((i, n) => i === null ? null : 100 * (length - n + i) / length);
  return [line(score(high, true), "main", "Aroon Up"), line(score(low, false), "signal", "Aroon Down")];
}

// Each raw price has at most 17 significant decimal digits. Keep extra precision
// for products of two prices and for the short OHLC source sums.
const PriceDecimal = Decimal.clone({ precision: 48 });

function decimalHlc(high: number, low: number, close: number) {
  return new PriceDecimal(high).plus(low).plus(close);
}

function typicalPriceDirections(high: number[], low: number[], close: number[]) {
  let previousSum = 0;
  return close.map((price, i) => {
    const sum = high[i] + low[i] + price;
    const change = sum - previousSum;
    const tolerance = Math.max(sum, previousSum) * Number.EPSILON * 8;
    previousSum = sum;
    if (!i) return 0;
    if (Math.abs(change) > tolerance) return Math.sign(change);
    if (high[i] === high[i - 1] && low[i] === low[i - 1] && price === close[i - 1]) return 0;
    // A tiny change may be a real price move or just rounding in the two sums.
    return decimalHlc(high[i], low[i], price).cmp(decimalHlc(high[i - 1], low[i - 1], close[i - 1]));
  });
}

function connorsRsi(input: StudyInputs): Plot[] {
  const { source, sourceKind, high, low, open, close, length, fast, slow } = input;
  // The common divisor in an averaged price cancels in a return and in RSI.
  const prices = source.map((price, i) => {
    if (sourceKind === "hl2") return new PriceDecimal(high[i]).plus(low[i]);
    if (sourceKind === "hlc3") return decimalHlc(high[i], low[i], close[i]);
    if (sourceKind === "ohlc4") return new PriceDecimal(high[i]).plus(low[i]).plus(close[i]).plus(open[i]);
    if (sourceKind === "hlcc4") return new PriceDecimal(high[i]).plus(low[i]).plus(close[i]).plus(close[i]);
    return new PriceDecimal(price);
  });
  const values = prices.map(price => price.toNumber());
  let streak = 0;
  const runs = prices.map((price, i) => {
    const direction = i ? price.cmp(prices[i - 1]) : 0;
    return streak = direction === 0 ? 0 : direction === Math.sign(streak) ? streak + direction : direction;
  });

  // Most gross returns are distinguishable in binary floating point. Resolve
  // close comparisons from the original decimal prices, once per observation.
  const ratios = values.map((price, i) => i && values[i - 1] ? price / values[i - 1] : NaN);
  const precise = new Map<number, Decimal>();
  const exactRatio = (i: number) => {
    let ratio = precise.get(i);
    if (!ratio) {
      ratio = prices[i].div(prices[i - 1]);
      precise.set(i, ratio);
    }
    return ratio;
  };
  const rank = ratios.map((ratio, i) => {
    if (Number.isNaN(ratio) || i <= length) return null;
    // Allow for the two decimal-to-double conversions and the division.
    const margin = Math.max(Number.MIN_VALUE, Math.abs(ratio) * Number.EPSILON * 8);
    const low = ratio - margin, high = ratio + margin;
    let lower = 0;
    for (let j = i - length; j < i; j++) {
      const prior = ratios[j];
      if (Number.isNaN(prior)) return null;
      if (prior < low) lower++;
      else if (prior <= high && (runs[j] !== 0 || runs[i] !== 0) && exactRatio(j).lt(exactRatio(i))) lower++;
    }
    return 100 * lower / length;
  });
  return [line(combine([relativeStrength(values, fast), relativeStrength(runs, slow), rank], (a, b, c) => (a + b + c) / 3))];
}

const calculations = {
  WMA: ({ source, length }) => [line(wma(source, length))],
  // Hull truncates both derived lengths to integers. Period one is an identity.
  HMA: ({ source, length }) => [line(wma(combine([wma(source, Math.max(1, Math.floor(length / 2))), wma(source, length)],
    (half, whole) => 2 * half - whole), Math.max(1, Math.floor(Math.sqrt(length)))))],
  VWMA: ({ source, volume, length }) => [line(movingAverage(source, length, "VWMA", volume))],
  DEMA: ({ source, length }) => {
    const first = smooth(source, length);
    return [line(combine([first, smooth(first, length)], (a, b) => 2 * a - b))];
  },
  TEMA: ({ source, length }) => {
    const first = smooth(source, length);
    const second = smooth(first, length);
    return [line(combine([first, second, smooth(second, length)], (a, b, c) => 3 * a - 3 * b + c))];
  },
  RMA: ({ source, length }) => [line(smooth(source, length, true))],
  ALMA: ({ source, length }) => {
    const middle = 0.85 * (length - 1);
    const scale = length / 6;
    const weights = Array.from({ length }, (_, i) => Math.exp(-((i - middle) ** 2) / (2 * scale ** 2)));
    const divisor = weights.reduce((sum, weight) => sum + weight, 0);
    return [line(source.map((_, i) => i < length - 1 ? null : weights.reduce((sum, weight, j) => sum + weight * source[i - length + 1 + j], 0) / divisor))];
  },
  KAMA: ({ source, length, fast, slow }) => {
    const volatility = rollingSum(source.map((price, i) => i ? Math.abs(price - source[i - 1]) : null), length);
    const fastAlpha = 2 / (fast + 1);
    const slowAlpha = 2 / (slow + 1);
    let previous: number | undefined;
    return [line(source.map((price, i) => {
      if (volatility[i] === null) return null;
      const efficiency = volatility[i] ? Math.min(1, Math.abs(price - source[i - length]) / volatility[i]!) : 0;
      const alpha = (efficiency * (fastAlpha - slowAlpha) + slowAlpha) ** 2;
      previous ??= source[i - 1];
      return previous += alpha * (price - previous);
    }))];
  },
  LSMA: ({ source, length }) => [line(combine([sma(source, length), wma(source, length)], (mean, weighted) => 3 * weighted - 2 * mean))],
  McGinley: ({ source, length }) => {
    let previous: number | undefined;
    return [line(source.map(price => {
      if (price <= 0) { previous = undefined; return null; }
      previous ??= price;
      const next = previous + (price - previous) / (0.6 * length * (price / previous) ** 4);
      return previous = Number.isFinite(next) && next > 0 ? next : price;
    }))];
  },
  Ribbon: ({ source, fast, slow }) => Array.from({ length: 6 }, (_, i) => {
    const period = fast + i * slow;
    return line(sma(source, period), i ? `ma-${i + 1}` : "main", `SMA ${period}`);
  }),
  MACross: ({ source, length, slow }) => [line(sma(source, length), "main", `Fast ${length}`), line(sma(source, slow), "signal", `Slow ${slow}`)],
  RangeVWAP: ({ source, volume, times, visibleFrom }) => {
    let weighted = 0;
    let shares = 0;
    return [line(source.map((price, index) => {
      if (visibleFrom !== undefined && times[index] < visibleFrom) return null;
      weighted += price * volume[index];
      shares += volume[index];
      return shares > 0 ? weighted / shares : null;
    }))];
  },
  OBV: ({ close, volume }) => [line(cumulative(volume.map((value, i) => i ? Math.sign(close[i] - close[i - 1]) * value : 0)))],
  ADL: (input) => [line(accumulationDistribution(input))],
  CMF: ({ high, low, close, volume, length }) => {
    const flow = volume.map((value, i) => high[i] === low[i] ? 0 : value * (2 * close[i] - high[i] - low[i]) / (high[i] - low[i]));
    return [line(combine([rollingSum(flow, length), rollingSum(volume, length)], (total, shares) => shares ? total / shares : null))];
  },
  Chaikin: (input) => {
    const adl = accumulationDistribution(input);
    return [line(difference(smooth(adl, input.fast), smooth(adl, input.slow)))];
  },
  MFI: ({ high, low, close, volume, length }) => {
    const typical = close.map((value, i) => (high[i] + low[i] + value) / 3);
    const changes = typicalPriceDirections(high, low, close);
    const flow = (direction: number) => rollingSum(typical.map((price, i) => i ? (changes[i] === direction ? price * volume[i] : 0) : null), length);
    return [line(combine([flow(1), flow(-1)], ratioPercent))];
  },
  PVT: ({ close, volume }) => [line(cumulative(close.map((value, i) => i === 0 ? 0 : close[i - 1] ? volume[i] * (value - close[i - 1]) / close[i - 1] : null)))],
  RVOL: ({ volume, length }) => [line(combine([volume, lag(sma(volume, length), 1)], (value, average) => average > 0 ? value / average : null))],
  VolumeOsc: ({ volume, fast, slow }) => [line(combine([smooth(volume, fast), smooth(volume, slow)], (a, b) => b ? 100 * (a - b) / b : null))],
  NetVolume: ({ close, volume }) => [histogram(volume.map((value, i) => i ? Math.sign(close[i] - close[i - 1]) * value : null))],
  EFI: ({ close, volume, length }) => [line(smooth(combine([volume, difference(close, lag(close, 1))], (shares, change) => shares * change), length))],
  EMV: ({ high, low, volume, length }) => {
    const midpoint = high.map((value, i) => (value + low[i]) / 2);
    return [line(sma(combine([difference(midpoint, lag(midpoint, 1)), high, low, volume],
      (change, h, l, shares) => shares > 0 ? change * (h - l) * 100_000_000 / shares : null), length))];
  },
  Klinger: ({ high, low, close, volume, fast, slow, signal }) => {
    let priorTrend = 0;
    let measure = high.length ? high[0] - low[0] : 0;
    const changes = typicalPriceDirections(high, low, close);
    const force = changes.map((change, i) => {
      if (!i) return null;
      const trend = change > 0 ? 1 : -1;
      const range = high[i] - low[i];
      measure = trend === priorTrend ? measure + range : high[i - 1] - low[i - 1] + range;
      priorTrend = trend;
      return measure ? 100 * volume[i] * Math.abs(2 * (range / measure - 1)) * trend : 0;
    });
    const values = difference(smooth(force, fast), smooth(force, slow));
    return signalLines(values, smooth(values, signal));
  },
  Keltner: (input) => bands(smooth(input.source, input.length), smooth(trueRange(input), input.signal, true).map(value => value === null ? null : value * input.multiplier)),
  Donchian: ({ high, low, length }) => envelope(high, low, length),
  Envelope: ({ source, length, multiplier }) => {
    const center = sma(source, length);
    return bands(center, center.map(value => value === null ? null : value * multiplier / 100));
  },
  ATR: (input) => [line(smooth(trueRange(input), input.length, true))],
  StdDev: ({ source, length }) => [line(rollingDeviation(source, length))],
  HistVol: ({ source, length, timeframe }) => {
    const returns = combine([source, lag(source, 1)], (a, b) => a > 0 && b > 0 ? Math.log(a / b) : null);
    // Annualize daily and longer observations using their own sampling frequency.
    // Intraday values show volatility per chart bar because session filters vary.
    const periods = timeframe === "1Y" ? 1 : timeframe === "1M" ? 12 : timeframe === "1W" ? 52 : timeframe === "1D" ? 252 : 1;
    const annualized = rollingDeviation(returns, length).map(value => value === null ? null : value * 100 * Math.sqrt(periods));
    return [line(annualized, "main", periods === 1 && timeframe !== "1Y" ? "Volatility per bar (%)" : "Annualized volatility (%)")];
  },
  BBWidth: ({ source, length, multiplier }) => [line(combine([rollingDeviation(source, length), sma(source, length)],
    (deviation, mean) => mean ? 200 * multiplier * deviation / mean : null))],
  BBPercent: ({ source, length, multiplier }) => [line(combine([source, rollingDeviation(source, length), sma(source, length)],
    (price, deviation, mean) => deviation ? 0.5 + (price - mean) / (2 * multiplier * deviation) : null))],
  Ulcer: ({ source, length }) => {
    const squaredDrawdowns = combine([source, extremes(source, length, true)],
      (value, peak) => peak > 0 ? (100 * (value / peak - 1)) ** 2 : null);
    const nonzero = rollingSum(squaredDrawdowns.map(value => value === null ? null : Number(value > 0)), length);
    // A window entirely at highs has exact zero drawdown, even after a volatile window.
    return [line(combine([sma(squaredDrawdowns, length), nonzero],
      (meanSquare, count) => count > 0 ? Math.sqrt(Math.max(0, meanSquare)) : 0))];
  },
  PriceChannel: ({ high, low, length }) => envelope(lag(high, 1), lag(low, 1), length),
  PSAR: ({ high, low, close }) => {
    let rising = close[1] > close[0];
    let sar = rising ? low[0] : high[0];
    let extreme = rising ? high[1] : low[1];
    let acceleration = 0.02;
    return [line(close.map((_, index) => {
      if (index === 0) return null;
      if (index === 1) return sar;
      const candidate = sar + acceleration * (extreme - sar);
      if (rising ? low[index] < candidate : high[index] > candidate) {
        rising = !rising;
        sar = rising ? Math.min(extreme, low[index]) : Math.max(extreme, high[index]);
        extreme = rising ? high[index] : low[index];
        acceleration = 0.02;
      } else {
        sar = rising ? Math.min(candidate, low[index - 1], low[index - 2]) : Math.max(candidate, high[index - 1], high[index - 2]);
        const nextExtreme = rising ? high[index] : low[index];
        if (rising ? nextExtreme > extreme : nextExtreme < extreme) {
          extreme = nextExtreme;
          acceleration = Math.min(0.2, acceleration + 0.02);
        }
      }
      return sar;
    }))];
  },
  Supertrend: (input) => {
    const atr = smooth(trueRange(input), input.length, true);
    let upper: number | undefined;
    let lower: number | undefined;
    let uptrend = false;
    return [line(atr.map((range, i) => {
      if (range === null) return null;
      const midpoint = (input.high[i] + input.low[i]) / 2;
      const nextUpper = midpoint + range * input.multiplier;
      const nextLower = midpoint - range * input.multiplier;
      const previousClose = input.close[i - 1];
      const started = upper !== undefined;
      if (upper === undefined || nextUpper < upper || previousClose > upper) upper = nextUpper;
      if (lower === undefined || nextLower > lower || previousClose < lower) lower = nextLower;
      if (started) uptrend = uptrend ? input.close[i] >= lower : input.close[i] > upper;
      return uptrend ? lower : upper;
    }))];
  },
  Chandelier: (input) => {
    const distance = smooth(trueRange(input), input.length, true).map(value => value === null ? null : value * input.multiplier);
    return [line(difference(extremes(input.high, input.length, true), distance), "main", "Long exit"),
      line(combine([extremes(input.low, input.length, false), distance], (low, atr) => low + atr), "signal", "Short exit")];
  },
  DMI: (input) => {
    const { high, low, length, signal } = input;
    const range = smooth(trueRange(input).map((value, i) => i ? value : null), length, true);
    const up = difference(high, lag(high, 1));
    const down = difference(lag(low, 1), low);
    const direction = (one: Samples, other: Samples) => combine([smooth(combine([one, other], (a, b) => a > b && a > 0 ? a : 0), length, true), range],
      (value, atr) => atr ? 100 * value / atr : 0);
    const positive = direction(up, down);
    const negative = direction(down, up);
    const dx = combine([positive, negative], (a, b) => a + b ? 100 * Math.abs(a - b) / (a + b) : 0);
    return [line(smooth(dx, signal, true), "main", "ADX"), line(positive, "plus", "+DI"), line(negative, "minus", "−DI")];
  },
  Aroon: aroon,
  AroonOsc: (input) => {
    const [upper, lower] = aroon(input);
    return [line(difference(upper.values, lower.values))];
  },
  Vortex: (input) => {
    const { high, low, length } = input;
    const tr = rollingSum(trueRange(input).map((value, i) => i ? value : null), length);
    const direction = (a: Samples, b: Samples) => combine([rollingSum(combine([a, lag(b, 1)], (first, last) => Math.abs(first - last)), length), tr],
      (movement, range) => range ? movement / range : null);
    return [line(direction(high, low), "main", "VI+"), line(direction(low, high), "signal", "VI−")];
  },
  Chop: (input) => {
    const { length, high, low } = input;
    return [line(combine([rollingSum(trueRange(input), length), extremes(high, length, true), extremes(low, length, false)],
      (sum, h, l) => length > 1 && h > l ? 100 * Math.log10(sum / (h - l)) / Math.log10(length) : null))];
  },
  Mass: ({ high, low, length, signal }) => {
    const first = smooth(difference(high, low), signal);
    return [line(rollingSum(combine([first, smooth(first, signal)], (a, b) => b ? a / b : null), length))];
  },
  Stoch: ({ high, low, close, length, slow, signal }) => {
    const k = sma(stochastic(close, high, low, length), slow);
    return [line(k, "main", "%K"), line(sma(k, signal), "signal", "%D")];
  },
  StochRSI: ({ source, length, fast, slow, signal }) => {
    const rsi = relativeStrength(source, fast);
    const k = sma(stochastic(rsi, rsi, rsi, length), slow);
    return [line(k, "main", "%K"), line(sma(k, signal), "signal", "%D")];
  },
  CCI: ({ source, length }) => [line(source.map((value, i) => {
    if (i + 1 < length) return null;
    const first = i + 1 - length;
    const anchor = source[first];
    // Center the window before summing so flat decimal prices have exactly zero deviation.
    let total = 0;
    for (let j = first; j <= i; j++) total += source[j] - anchor;
    const mean = total / length;
    let deviation = 0;
    for (let j = first; j <= i; j++) deviation += Math.abs(source[j] - anchor - mean);
    return deviation ? (value - anchor - mean) / (0.015 * deviation / length) : 0;
  }))],
  WilliamsR: ({ high, low, close, length }) => [line(stochastic(close, high, low, length).map(value => value === null ? null : value - 100))],
  Momentum: ({ source, length }) => [line(difference(source, lag(source, length)))],
  ROC: ({ source, length }) => [line(rateOfChange(source, length))],
  AO: ({ high, low, fast, slow }) => {
    const midpoint = weightedSeries(high, low, 0.5);
    return [histogram(difference(sma(midpoint, fast), sma(midpoint, slow)))];
  },
  Ultimate: ({ high, low, close, length, slow, signal }) => {
    const tr = close.map((_, i) => i ? Math.max(high[i], close[i - 1]) - Math.min(low[i], close[i - 1]) : null);
    const pressure = close.map((value, i) => i ? value - Math.min(low[i], close[i - 1]) : null);
    const ratios = [length, slow, signal].map(period => combine([rollingSum(pressure, period), rollingSum(tr, period)], (a, b) => b ? a / b : null));
    return [line(combine(ratios, (a, b, c) => 100 * (4 * a + 2 * b + c) / 7))];
  },
  TRIX: ({ source, length }) => [line(rateOfChange(smooth(smooth(smooth(source, length), length), length), 1))],
  TSI: ({ source, fast, slow, signal }) => {
    const values = doubleSmoothedStrength(source, slow, fast, 100);
    return signalLines(values, smooth(values, signal));
  },
  DPO: ({ source, length }) => [line(difference(lag(source, Math.floor(length / 2) + 1), sma(source, length)))],
  Coppock: ({ source, length, fast, slow }) => [line(wma(combine([rateOfChange(source, fast), rateOfChange(source, slow)], (a, b) => a + b), length))],
  KST: ({ source, signal }) => {
    const curves = [10, 15, 20, 30].map((period, i) => sma(rateOfChange(source, period), i === 3 ? 15 : 10));
    const values = combine(curves, (a, b, c, d) => a + 2 * b + 3 * c + 4 * d);
    return signalLines(values, sma(values, signal));
  },
  CMO: ({ source, length }) => {
    const change = difference(source, lag(source, 1));
    const total = rollingSum(change, length);
    const magnitude = rollingSum(change.map(value => value === null ? null : Math.abs(value)), length);
    return [line(combine([total, magnitude], (a, b) => b ? 100 * a / b : 0))];
  },
  RVI: ({ open, high, low, close, length }) => {
    const symmetry = (values: Samples) => combine([values, lag(values, 1), lag(values, 2), lag(values, 3)], (a, b, c, d) => (a + 2 * b + 2 * c + d) / 6);
    const values = combine([sma(symmetry(difference(close, open)), length), sma(symmetry(difference(high, low)), length)],
      (body, range) => range > 0 ? body / range : null);
    return signalLines(values, symmetry(values));
  },
  Fisher: ({ source, length }) => {
    const range = combine([source, extremes(source, length, true), extremes(source, length, false)], (price, high, low) => high === low ? 0.5 : (price - low) / (high - low));
    let normalized = 0;
    let last = 0;
    const values = range.map(value => {
      if (value === null) return null;
      const next = 0.66 * (value - 0.5) + 0.67 * normalized;
      normalized = Math.abs(next) > 0.99 ? Math.sign(next) * 0.999 : next;
      last = 0.5 * Math.log((1 + normalized) / (1 - normalized)) + 0.5 * last;
      return last;
    });
    return signalLines(values, lag(values, 1), "Trigger");
  },
  STC: ({ source, length, fast, slow }) => {
    const macd = difference(smooth(source, fast), smooth(source, slow));
    const stage = (values: Samples) => {
      let fraction = 0;
      const percent = combine([values, extremes(values, length, true), extremes(values, length, false)], (value, high, low) => {
        const roundoff = 32 * Number.EPSILON * Math.max(1, Math.abs(high), Math.abs(low));
        if (high - low > roundoff) fraction = 100 * (value - low) / (high - low);
        return fraction;
      });
      let last: number | null = null;
      return percent.map(value => {
        if (value === null) return null;
        last = last === null ? value : last + 0.5 * (value - last);
        return last;
      });
    };
    return [line(stage(stage(macd)))];
  },
  SMIErgodic: ({ source, fast, slow, signal }) => {
    const values = doubleSmoothedStrength(source, fast, slow);
    return [histogram(difference(values, smooth(values, signal)))];
  },
  ConnorsRSI: connorsRsi,
  BOP: ({ open, high, low, close }) => [line(combine([open, high, low, close], (o, h, l, c) => h > l ? (c - o) / (h - l) : 0))],
  BullBear: ({ high, low, close, length }) => {
    const average = smooth(close, length);
    return [line(combine([high, low, average], (h, l, ema) => h + l - 2 * ema))];
  },
} satisfies Record<AdditionalChartIndicator, Calculation>;

export function additionalIndicatorValues(
  bars: readonly Candle[], indicator: ChartIndicator & { type: AdditionalChartIndicator }, timeframe?: ChartTimeframe, visibleFrom?: number,
): IndicatorPlot[] {
  const definition = additionalChartIndicators[indicator.type];
  const defaultInput = (field: "fastLength" | "slowLength" | "signalLength") =>
    indicator[field] ?? definition.inputs?.find(([key]) => key === field)?.[2] ?? 1;
  const sourceKind = indicator.source ?? definition.defaultSource ?? "close";
  return calculations[indicator.type]({
    timeframe, visibleFrom, times: indicator.type === "RangeVWAP" ? bars.map(bar => bar.time) : [],
    length: indicator.period, fast: defaultInput("fastLength"),
    slow: defaultInput("slowLength"), signal: defaultInput("signalLength"),
    multiplier: indicator.deviation ?? definition.multiplier?.[1] ?? 1,
    sourceKind, source: bars.map(bar => indicatorSource(bar, sourceKind)),
    high: bars.map(bar => bar.high), low: bars.map(bar => bar.low), close: bars.map(bar => bar.close),
    open: bars.map(bar => bar.open), volume: bars.map(bar => bar.volume),
  }).map(({ key, label, histogram, values }) => ({
    key, label: label ?? definition.short, pane: !definition.overlay, histogram, dots: definition.dots,
    points: values.flatMap((value, index) => value !== null && Number.isFinite(value) ? [{ time: bars[index].time, value }] : []),
  }));
}
