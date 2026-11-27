import type { Candle } from "../alpaca/candles";

export const scanPatterns = {
  doubleBottom: "Double bottom breakout",
  doubleTop: "Double top breakdown",
  tripleBottom: "Triple bottom breakout",
  tripleTop: "Triple top breakdown",
  headShoulders: "Head and shoulders breakdown",
  inverseHeadShoulders: "Inverse head and shoulders breakout",
  ascendingTriangle: "Ascending triangle breakout",
  descendingTriangle: "Descending triangle breakdown",
  symmetricTriangle: "Symmetrical triangle break",
  risingWedge: "Rising wedge breakdown",
  fallingWedge: "Falling wedge breakout",
  broadening: "Broadening range break",
  bullFlag: "Bull flag breakout",
  bearFlag: "Bear flag breakdown",
} as const;
export type ScanPattern = keyof typeof scanPatterns;
type Pivot = { i: number; price: number; high: boolean };
function pivots(bars: readonly Candle[]) {
  const turns: Pivot[] = [];
  for (let i = 2; i < bars.length - 2; i++) {
    const b = bars[i],
      neighbors = [bars[i - 2], bars[i - 1], bars[i + 1], bars[i + 2]];
    const high = neighbors.every((v) => v.high < b.high),
      low = neighbors.every((v) => v.low > b.low);
    if (high === low) continue;
    const pivot = { i, high, price: high ? b.high : b.low };
    const last = turns.at(-1);
    if (last?.high !== high) turns.push(pivot);
    else if (high ? pivot.price > last.price : pivot.price < last.price)
      turns[turns.length - 1] = pivot;
  }
  return turns;
}
const near = (a: number, b: number) => Math.abs(a - b) <= 0.03 * Math.min(a, b);
export function confirmedCandlePattern(
  bars: readonly Candle[],
  pattern: ScanPattern,
): boolean {
  const prior = bars.slice(0, -1),
    last = bars.at(-1),
    before = prior.at(-1);
  if (!last || !before) return false;
  const turns = pivots(prior);
  const up = (level: number) => before.close <= level && last.close > level;
  const down = (level: number) => before.close >= level && last.close < level;
  if (
    [
      "doubleBottom",
      "doubleTop",
      "tripleBottom",
      "tripleTop",
      "headShoulders",
      "inverseHeadShoulders",
    ].includes(pattern)
  ) {
    const bottom =
      pattern === "doubleBottom" ||
      pattern === "tripleBottom" ||
      pattern === "inverseHeadShoulders";
    const shape = turns.slice(-(pattern.startsWith("double") ? 3 : 5));
    if (
      shape.length !== (pattern.startsWith("double") ? 3 : 5) ||
      shape[0].high === bottom
    )
      return false;
    const peaks = shape.filter((p) => p.high !== bottom),
      necks = shape.filter((p) => p.high === bottom);
    if (!near(peaks[0].price, peaks.at(-1)!.price)) return false;
    const level = bottom
      ? Math.max(...necks.map((p) => p.price))
      : Math.min(...necks.map((p) => p.price));
    if (
      !peaks.every((p) =>
        bottom ? level > p.price * 1.03 : level < p.price * 0.97,
      )
    )
      return false;
    if (pattern.includes("Shoulders")) {
      const shoulder = bottom
        ? Math.min(peaks[0].price, peaks[2].price)
        : Math.max(peaks[0].price, peaks[2].price);
      if (
        bottom
          ? peaks[1].price >= shoulder * 0.97
          : peaks[1].price <= shoulder * 1.03
      )
        return false;
    } else if (!peaks.every((p) => near(p.price, peaks[0].price))) return false;
    return bottom ? up(level) : down(level);
  }
  const highs = turns.filter((p) => p.high).slice(-2),
    lows = turns.filter((p) => !p.high).slice(-2);
  if (highs.length < 2 || lows.length < 2) return false;
  const slope = (points: Pivot[]) =>
    (points[1].price - points[0].price) / (points[1].i - points[0].i);
  const h = slope(highs),
    l = slope(lows);
  const edge = (points: Pivot[], rate: number, i: number) =>
    points[1].price + rate * (i - points[1].i);
  const i = prior.length,
    top = edge(highs, h, i),
    base = edge(lows, l, i);
  if (top <= base || base <= 0) return false;
  const above = last.close > top && before.close <= edge(highs, h, i - 1);
  const below = last.close < base && before.close >= edge(lows, l, i - 1);
  const flatH = near(highs[0].price, highs[1].price),
    flatL = near(lows[0].price, lows[1].price);
  if (pattern === "ascendingTriangle") return flatH && !flatL && l > 0 && above;
  if (pattern === "descendingTriangle")
    return flatL && !flatH && h < 0 && below;
  if (pattern === "symmetricTriangle")
    return !flatH && !flatL && h < 0 && l > 0 && (above || below);
  if (pattern === "risingWedge")
    return !flatH && !flatL && l > h && h > 0 && below;
  if (pattern === "fallingWedge")
    return !flatH && !flatL && h < l && l < 0 && above;
  if (pattern === "broadening")
    return !flatH && !flatL && h > 0 && l < 0 && (above || below);
  const begin = Math.min(highs[0].i, lows[0].i);
  if (begin < 3 || Math.abs(h - l) > 0.3 * Math.max(Math.abs(h), Math.abs(l)))
    return false;
  const pole = prior[begin].close / prior[0].close - 1;
  return pattern === "bullFlag"
    ? pole >= 0.1 && h < 0 && l < 0 && above
    : pole <= -0.1 && h > 0 && l > 0 && below;
}
