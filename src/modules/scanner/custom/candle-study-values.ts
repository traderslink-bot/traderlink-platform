import { priceChangePercent } from "../price-change";
import { confirmedCandlePattern, type ScanPattern } from "./candle-patterns";
import type { Candle } from "../alpaca/candles";
import type { CandleStudy } from "./audited-filters";

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const pct = (a: number, b: number) => (b > 0 ? priceChangePercent(a, b) : null);

export function candleStudyValue(
  metric: CandleStudy,
  bars: readonly Candle[],
  n: number,
  benchmark?: readonly Candle[],
  fast = 12,
  signal = 9,
  pattern?: ScanPattern,
): number | null {
  if (bars.length < n) return null;
  const window = bars.slice(-n),
    last = window[n - 1];
  const prices = window.map((bar) => bar.close);
  const average = mean(prices);
  const prior = bars.at(-n - 1);
  if (metric === "averageBarDollars" || metric === "anchoredFromLow") {
    let start = 0;
    if (metric === "anchoredFromLow")
      for (let i = 1; i < n; i++)
        if (window[i].low < window[start].low) start = i;
    let dollars = 0,
      volume = 0;
    for (const bar of window.slice(start)) {
      const vwap = (bar as Candle & { vwap?: number }).vwap;
      if (!bar.volume) continue;
      if (vwap === undefined || !Number.isFinite(vwap) || vwap <= 0)
        return null;
      dollars += bar.volume * vwap;
      volume += bar.volume;
    }
    return metric === "averageBarDollars"
      ? dollars / n
      : volume
        ? pct(last.close, dollars / volume)
        : null;
  }
  if (metric === "macdHistogram") {
    if (fast >= n || bars.length < n + signal - 1) return null;
    let a = bars[0].close,
      b = a,
      line = 0;
    for (const bar of bars) {
      a += ((bar.close - a) * 2) / (fast + 1);
      b += ((bar.close - b) * 2) / (n + 1);
      line += ((a - b - line) * 2) / (signal + 1);
    }
    return ((a - b - line) / last.close) * 100;
  }
  if (metric === "smaHold" || metric === "smaRejection") {
    if (metric === "smaRejection")
      return last.high >= average && last.close < average ? 1 : 0;
    let sum = average * n,
      count = 0;
    for (let i = bars.length - 1; i >= n - 1; i--) {
      if (bars[i].close <= sum / n) break;
      count++;
      if (i >= n) sum += bars[i - n].close - bars[i].close;
    }
    return count;
  }
  if (metric === "candlePattern")
    return pattern && n >= 8
      ? Number(confirmedCandlePattern(window, pattern))
      : null;
  if (metric === "volumeWindowSum")
    return window.reduce((sum, b) => sum + b.volume, 0);
  if (metric === "smaAlignment") {
    if (bars.length < 50) return null;
    const [fast, mid, slow] = [9, 20, 50].map((length) =>
      mean(bars.slice(-length).map((b) => b.close)),
    );
    return fast > mid && mid > slow ? 1 : fast < mid && mid < slow ? -1 : 0;
  }
  if (metric === "rsiDistance") {
    if (!prior) return null;
    let gain = 0,
      loss = 0;
    for (let i = 1; i < bars.length; i++) {
      const change = bars[i].close - bars[i - 1].close;
      if (i > n) {
        gain -= gain / n;
        loss -= loss / n;
      }
      gain += Math.max(0, change);
      loss += Math.max(0, -change);
    }
    return gain + loss ? (100 * gain) / (gain + loss) : 50;
  }
  if (metric === "bandCompression") {
    if (bars.length < 2 * n) return null;
    const width = (values: number[]) => {
      const m = mean(values);
      return Math.sqrt(mean(values.map((v) => (v - m) ** 2))) / m;
    };
    const before = width(bars.slice(-2 * n, -n).map((b) => b.close));
    return before > 0 ? width(prices) / before : null;
  }
  if (metric === "betaSpy" || metric === "returnVsSpy") {
    const base = benchmark?.slice(-n - 1),
      stock = bars.slice(-n - 1);
    if (
      !prior ||
      base?.length !== stock.length ||
      stock.some((b, i) => b.time !== base[i].time)
    )
      return null;
    if (metric === "returnVsSpy")
      return pct(last.close, prior.close)! - pct(base[n].close, base[0].close)!;
    const returns = (series: readonly Candle[]) =>
      series.slice(1).map((b, i) => b.close / series[i].close - 1);
    const x = returns(base),
      y = returns(stock),
      mx = mean(x),
      my = mean(y);
    const variance = x.reduce((sum, v) => sum + (v - mx) ** 2, 0);
    return variance > 0
      ? x.reduce((sum, v, i) => sum + (v - mx) * (y[i] - my), 0) / variance
      : null;
  }
  if (metric === "averageBarVolume")
    return mean(window.map((bar) => bar.volume));
  if (metric === "barVolumeSpike") {
    if (!prior) return null;
    const baseline = mean(bars.slice(-n - 1, -1).map((bar) => bar.volume));
    return baseline > 0 ? last.volume / baseline : null;
  }
  if (metric === "windowReturn")
    return prior ? pct(last.close, prior.close) : null;
  if (metric === "reboundFromLow")
    return prior
      ? pct(
          last.close,
          Math.min(...bars.slice(-n - 1, -1).map((bar) => bar.low)),
        )
      : null;
  if (metric === "smaDistance") return pct(last.close, average);
  if (metric === "smaSlope")
    return prior
      ? pct(average, average + (prior.close - last.close) / n)
      : null;
  if (metric === "emaDistance") {
    let ema = bars[0].close;
    for (let i = 1; i < bars.length; i++)
      ema += ((bars[i].close - ema) * 2) / (n + 1);
    return pct(last.close, ema);
  }
  const high = Math.max(...window.map((bar) => bar.high)),
    low = Math.min(...window.map((bar) => bar.low));
  if (metric === "rangePosition")
    return high > low ? ((last.close - low) / (high - low)) * 100 : null;
  if (metric === "rangeWidth") return pct(high, low);
  if (metric === "historicalVolatility") {
    if (!prior) return null;
    const returns = prices.map((p, i) =>
      Math.log(p / (i ? prices[i - 1] : prior.close)),
    );
    const center = mean(returns);
    return (
      100 *
      Math.sqrt(
        returns.reduce((sum, r) => sum + (r - center) ** 2, 0) / (n - 1),
      )
    );
  }
  if (metric === "stochasticJ") {
    let k = 50,
      d = 50,
      valid = false;
    for (let i = n - 1; i < bars.length; i++) {
      const block = bars.slice(i - n + 1, i + 1);
      const lo = Math.min(...block.map((b) => b.low)),
        hi = Math.max(...block.map((b) => b.high));
      if (hi === lo) continue;
      k = (2 * k + (100 * (bars[i].close - lo)) / (hi - lo)) / 3;
      d = (2 * d + k) / 3;
      valid = true;
    }
    return valid ? 3 * k - 2 * d : null;
  }
  if (metric === "strengthAdx") {
    if (bars.length < 2 * n) return null;
    let plus = 0,
      minus = 0,
      adx = 0,
      count = 0;
    for (let i = 1; i < bars.length; i++) {
      const up = bars[i].high - bars[i - 1].high,
        down = bars[i - 1].low - bars[i].low;
      if (i > n) {
        plus -= plus / n;
        minus -= minus / n;
      }
      plus += up > down && up > 0 ? up : 0;
      minus += down > up && down > 0 ? down : 0;
      if (i < n) continue;
      const dx =
        plus + minus > 0 ? (100 * Math.abs(plus - minus)) / (plus + minus) : 0;
      count++;
      adx = count <= n ? adx + dx / n : adx + (dx - adx) / n;
    }
    return adx;
  }
  return null;
}
