// @vitest-environment node
import { expect, it } from "vitest";
import type { Candle } from "./candles";
import { advancedTrendValues, type AdvancedTrendContext, type AdvancedTrendType } from "./chart-advanced-trends";
import type { ChartIndicator } from "./chart-preferences";

const time = (index: number) => 1_800_000_000 + (index + Math.floor(index / 4)) * 60;
const candle = (price: number, index: number): Candle => ({
  time: time(index), open: price, high: price, low: price, close: price, volume: 1000,
});
const study = (type: AdvancedTrendType, period: number, overrides: Partial<ChartIndicator> = {}) => ({
  id: "study", period, width: 1 as const, color: "#4287f5", ...overrides, type,
});

it("seeds the three median-price Alligator lines with their own SMA then smooths recursively", () => {
  const bars = Array.from({ length: 15 }, (_, index) => ({
    ...candle(index + 1, index), high: index + 2, low: index, close: index + 2,
  }));
  const [jaw, teeth, lips] = advancedTrendValues(bars, study("Alligator", 13));
  expect([jaw.offset, teeth.offset, lips.offset]).toEqual([8, 5, 3]);
  expect(jaw.points[0]).toEqual({ time: time(12), value: 7 });
  expect(jaw.points[1].value).toBeCloseTo(7 + (14 - 7) / 13, 12);
  expect(teeth.points[0]).toEqual({ time: time(7), value: 4.5 });
  expect(lips.points[0]).toEqual({ time: time(4), value: 3 });
});

it("calculates all Ichimoku components with the requested lengths and displacement", () => {
  const bars = [[12, 8, 9], [10, 6, 8], [20, 16, 19], [22, 18, 18]].map(([high, low, close], index) =>
    ({ ...candle(close, index), high, low }));
  const plots = advancedTrendValues(bars, study("Ichimoku", 2, { fastLength: 3, slowLength: 4, signalLength: 2 }));
  expect(plots.map(plot => [plot.key, plot.offset ?? 0, plot.points.map(point => point.value)])).toEqual([
    ["main", 0, [9, 13, 19]],
    ["base", 0, [13, 14]],
    ["span-a", 2, [13, 16.5]],
    ["span-b", 2, [14]],
    ["lagging", -2, [9, 8, 19, 18]],
  ]);
  expect(plots[3].points[0].time).toBe(time(3));
});

it("fits the latest actual bars and places parallel bands at residual standard deviations", () => {
  const bars = [100, 1, 2, 5].map(candle);
  const [center, upper, lower] = advancedTrendValues(bars, study("RegressionChannel", 3));
  const distance = 2 * Math.sqrt(2) / 3;
  expect(center.points.map(point => point.time)).toEqual([time(1), time(3)]);
  expect(center.points[0].value).toBeCloseTo(2 / 3, 12);
  expect(center.points[1].value).toBeCloseTo(14 / 3, 12);
  expect(upper.points[0].value).toBeCloseTo(2 / 3 + distance, 12);
  expect(lower.points[1].value).toBeCloseTo(14 / 3 - distance, 12);
  expect(advancedTrendValues(bars, study("RegressionChannel", 5)).every(plot => plot.points.length === 0)).toBe(true);
});

it("plots traditional levels only where prior-period facts are supplied", () => {
  const bars = [30, 70, 90].map(candle);
  const context: AdvancedTrendContext = { pivotLevels: [
    { time: time(0), high: 12, low: 8, close: 10 },
    { time: time(2), high: 21, low: 18, close: 21 },
  ] };
  const plots = advancedTrendValues(bars, study("StandardPivots", 1), context);
  expect(Object.fromEntries(plots.map(plot => [plot.key, plot.points.map(point => point.value)]))).toEqual({
    main: [10, 20],
    r1: [12, 22], r2: [14, 23], r3: [16, 25], r4: [18, 27], r5: [20, 29],
    s1: [8, 19], s2: [6, 17], s3: [4, 16], s4: [2, 15], s5: [0, 14],
  });
  expect(plots.every(plot => plot.step && plot.points.every(point => point.time !== time(1)))).toBe(true);
  expect(advancedTrendValues(bars, study("StandardPivots", 1)).every(plot => plot.points.length === 0)).toBe(true);
});

it("ignores small reversals, extends an existing extreme and waits for closed right legs", () => {
  const bars = [10, 12, 11.8, 13, 11, 14, 13.9].map(candle);
  const config = study("ZigZag", 2);
  expect(advancedTrendValues(bars.slice(0, -1), config)[0].points).toEqual([
    { time: time(3), value: 13 }, { time: time(4), value: 11 },
  ]);
  expect(advancedTrendValues(bars, config)[0].points).toEqual([
    { time: time(3), value: 13 }, { time: time(4), value: 11 }, { time: time(5), value: 14 },
  ]);
});

it("resolves the ambiguous same-candle high and low without plotting a zero-width swing", () => {
  const bars = [10, 10, 11, 9, 12, 11].map(candle);
  bars[1] = { ...bars[1], high: 14, low: 7 };
  expect(advancedTrendValues(bars, study("ZigZag", 2))[0].points).toEqual([
    { time: time(3), value: 9 }, { time: time(4), value: 12 },
  ]);
});

it("declares stable plot geometry before history arrives", () => {
  for (const [type, count] of [
    ["Alligator", 3], ["Ichimoku", 5], ["RegressionChannel", 3], ["StandardPivots", 11], ["ZigZag", 1],
  ] as const) {
    const plots = advancedTrendValues([], study(type, 10));
    expect(plots).toHaveLength(count);
    expect(plots.every(plot => !plot.pane && plot.points.length === 0)).toBe(true);
  }
});
