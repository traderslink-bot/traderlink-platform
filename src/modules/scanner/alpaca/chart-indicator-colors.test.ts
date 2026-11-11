import { expect, it } from "vitest";
import { indicatorPresets, indicatorPresetRows, nextMovingAverageLine } from "./chart-indicator-presets";
import { DEFAULT_CHART_PREFERENCES, INDICATOR_TYPES, indicatorPriceScaleLabels, parseChartPreferences, setAllIndicatorPriceScaleLabels, type ChartIndicator } from "./chart-preferences";

const colors = (lines: ChartIndicator[]) => lines.flatMap(line =>
  [line.color, ...Object.values(line.plots ?? {}).flatMap(plot => plot.color ? [plot.color] : [])]);

it("keeps every built-in indicator palette distinct across studies and within each preset", () => {
  const used = new Set<string>();
  for (const type of INDICATOR_TYPES) {
    const family = new Set<string>();
    for (const [index] of indicatorPresets[type].entries()) {
      const palette = colors(indicatorPresetRows(type, index, () => "test"));
      expect(new Set(palette).size, type).toBe(palette.length);
      palette.forEach(color => family.add(color));
    }
    for (const color of family) {
      expect(used.has(color), `${type} ${color}`).toBe(false);
      used.add(color);
    }
  }
});

it("assigns added moving averages colors that are unused across the chart", () => {
  const indicators = INDICATOR_TYPES.flatMap(type => indicatorPresetRows(type, 0, () => "test"));
  while (indicators.length < 20) {
    const type = indicators.length % 2 ? "EMA" : "SMA";
    const next = nextMovingAverageLine(type, indicators, String(indicators.length));
    expect(colors(indicators)).not.toContain(next.color);
    indicators.push(next);
  }
});

it("defaults all preset labels off and lets global and individual controls override them", () => {
  let id = 0;
  const presets = INDICATOR_TYPES.flatMap(type => indicatorPresetRows(type, 0, () => String(++id)));
  const defaults = { ...DEFAULT_CHART_PREFERENCES, indicators: presets };
  expect(presets.every(indicator => !indicatorPriceScaleLabels(defaults, indicator))).toBe(true);
  const individual = { ...presets[0], output: { priceScaleLabels: true, statusLineValues: true } };
  const overrides = { ...defaults, indicators: [individual, ...presets.slice(1)] };
  expect(indicatorPriceScaleLabels(overrides, individual)).toBe(true);
  const all = parseChartPreferences(setAllIndicatorPriceScaleLabels(overrides, true));
  expect(all.indicators.every(indicator => indicatorPriceScaleLabels(all, indicator))).toBe(true);
  const off = parseChartPreferences(setAllIndicatorPriceScaleLabels(all, false));
  expect(off.indicators.every(indicator => !indicatorPriceScaleLabels(off, indicator))).toBe(true);
  expect(off.indicators[0].output).toEqual({ statusLineValues: true });
});
