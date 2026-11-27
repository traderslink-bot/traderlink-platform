// @vitest-environment node
import { expect, it } from "vitest";
import type { Candle } from "./candles";
import { additionalChartIndicatorTypes, additionalChartIndicators } from "./chart-indicator-catalog";
import { indicatorPresetRows } from "./chart-indicator-presets";
import { indicatorValues } from "./chart-indicators";
import { DEFAULT_CHART_PREFERENCES, isPriceOverlayIndicator, parseChartPreferences, type IndicatorType } from "./chart-preferences";

const bar = (i: number, close: number, volume = 100): Candle => ({
  time: 1_800_000_000 + i * 900, close, high: close + 0.05, low: close - 0.05, open: close - 0.02, volume,
});
const run = (type: IndicatorType, candles: Candle[], period?: number, visibleFrom?: number) => {
  const [study] = indicatorPresetRows(type, 0, () => "study");
  return indicatorValues(candles, { ...study, period: period ?? study.period }, "15m", { visibleFrom });
};

it("only plots initialized points at real candle times across the expanded catalog", () => {
  const input = Array.from({ length: 300 }, (_, i) =>
    // A deliberately sparse, sub-dollar price/volume fixture with a sharp volume expansion.
    ({ ...bar(i, 0.53 + i * 0.0006 + 0.07 * Math.sin(i / 3) + (i > 160 ? 0.24 : 0),
      i % 17 === 0 ? 15 : i > 160 && i < 190 ? 900_000 + i * 10 : 1000 + i * 8),
    time: 1_800_000_000 + 900 * (i + Math.floor(i / 9)) }));
  const times = new Set(input.map(value => value.time));
  const constant = Array.from({ length: 130 }, (_, i) => ({ ...bar(i, 0.53, 0), open: 0.53, high: 0.53, low: 0.53 }));
  for (const type of additionalChartIndicatorTypes) {
    const [study] = indicatorPresetRows(type, 0, () => "study");
    const [roundTrip] = parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, indicators: [study] }).indicators;
    expect(roundTrip, type).toEqual(study);
    const definitions = run(type, []);
    const plots = run(type, input);
    expect(plots.map(plot => plot.key), type).toEqual(definitions.map(plot => plot.key));
    expect(isPriceOverlayIndicator(type), type).toBe(additionalChartIndicators[type].overlay === true);
    const prefix = run(type, input.slice(0, 230));
    for (const [index, plot] of plots.entries()) {
      expect(plot.pane, type).toBe(!isPriceOverlayIndicator(type));
      expect(plot.points.length, `${type} ${plot.key}`).toBeGreaterThan(0);
      expect(plot.points.every((point, i) => Number.isFinite(point.value) && times.has(point.time) &&
        (!i || point.time > plot.points[i - 1].time)), type).toBe(true);
      expect(plot.points.filter(point => point.time <= input[229].time), type).toEqual(prefix[index].points);
    }
    expect(run(type, constant).every(plot => plot.points.every(point => Number.isFinite(point.value))), type).toBe(true);
  }
});

it("uses prior volume for RVOL, the viewport start for anchored VWAP, and no bars when volume is zero", () => {
  const input = [bar(0, 1, 100), bar(1, 2, 300), bar(2, 3, 1000), bar(3, 4, 0)];
  expect(run("RVOL", input, 2)[0].points).toEqual([
    { time: input[2].time, value: 5 }, { time: input[3].time, value: 0 },
  ]);
  const points = run("RangeVWAP", input, undefined, input[1].time)[0].points;
  expect(points.map(point => point.time)).toEqual(input.slice(1).map(value => value.time));
  expect(points[0].value).toBeCloseTo(2, 12);
  expect(points.at(-1)?.value).toBeCloseTo(36 / 13, 12);
  expect(run("VWMA", [bar(0, 1, 0), bar(1, 2, 0)], 2)[0].points).toEqual([]);
});

it("calculates Wilder ATR across gaps and excludes the current bar from prior-price channel bounds", () => {
  const input = [bar(0, 1), bar(1, 1.2), bar(2, 2)];
  expect(run("ATR", input, 2)[0].points.map(point => point.value)).toEqual([
    expect.closeTo(0.175, 12), expect.closeTo(0.5125, 12),
  ]);
  expect(run("PriceChannel", input, 2)[1].points).toEqual([{ time: input[2].time, value: 1.25 }]);
  expect(run("Donchian", input, 2)[1].points.at(-1)).toEqual({ time: input[2].time, value: 2.05 });
});

it("matches hand-calculated WMA, regression and stochastic values", () => {
  const input = [bar(0, 1), bar(1, 2), bar(2, 4)];
  expect(run("WMA", input, 3)[0].points[0].value).toBeCloseTo(17 / 6, 12);
  expect(run("LSMA", input, 3)[0].points[0].value).toBeCloseTo(23 / 6, 12);
  expect(run("Stoch", input, 1)[0].points[0].value).toBeCloseTo(50, 12);
  expect(run("WilliamsR", input, 3)[0].points[0].value).toBeCloseTo(100 * (3.05 / 3.1 - 1), 12);
});

it("preserves an empty favorite list and rejects duplicate or unknown favorites", () => {
  expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, favoriteIndicators: [] }).favoriteIndicators).toEqual([]);
  expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, favoriteIndicators: ["RVOL", "RSI"] }).favoriteIndicators).toEqual(["RVOL", "RSI"]);
  for (const favorites of [["RSI", "RSI"], ["other"], "RSI"]) {
    expect(() => parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, favoriteIndicators: favorites })).toThrow("invalid_preferences");
  }
});

it("distinguishes equal typical prices from a genuine sub-tick move in money flow and Klinger", () => {
  // RAYA printed these last two bars on Nov 20. Both H+L+C sums are exactly 2.0245.
  const input = [
    { ...bar(0, 0.65), open: 0.65, high: 0.66, low: 0.64 },
    { ...bar(1, 0.6777), open: 0.6686, high: 0.68, low: 0.6668 },
    { ...bar(2, 0.677), open: 0.6785, high: 0.679, low: 0.6685 },
  ];
  const [study] = indicatorPresetRows("Klinger", 0, () => "study");
  const lastKlinger = () => indicatorValues(input, { ...study, fastLength: 1, slowLength: 2, signalLength: 1 })[0].points.at(-1)?.value;
  const firstForce = 20_000 * (1 - 0.0132 / 0.0332);
  const downForce = -20_000 * (1 - 0.0105 / 0.0237);
  const upForce = 20_000 * (1 - 0.0105 / 0.0437);
  expect(run("MFI", input, 1)[0].points.at(-1)?.value).toBe(50);
  expect(lastKlinger()).toBeCloseTo((downForce - firstForce) / 2, 8);
  input[2].close = 0.6770000000000002;
  expect(run("MFI", input, 1)[0].points.at(-1)?.value).toBe(100);
  expect(lastKlinger()).toBeCloseTo((upForce - firstForce) / 2, 8);
});
