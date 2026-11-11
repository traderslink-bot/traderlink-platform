import { expect, it } from "vitest";
import { DEFAULT_CANDLE_SPACING, defaultChartView } from "./chart-default-view";
import { CHART_TIMEFRAMES } from "./candles";

it("keeps readable candle spacing across phone, grid and desktop widths for every interval", () => {
  for (const frame of CHART_TIMEFRAMES) for (const width of [260, 430, 800, 1500]) {
    const view = defaultChartView(frame, width, 5000);
    expect(width / (view.range.to - view.range.from)).toBeCloseTo(DEFAULT_CANDLE_SPACING[frame]);
    expect(view.range.to).toBe(5002);
    expect(view.visibleBars).toBeGreaterThan(15);
  }
});
it("does not stretch sparse histories and bounds invalid or tiny container widths", () => {
  expect(defaultChartView("1m", 450, 2).range).toEqual({from:-46,to:4});
  for(const width of [0, NaN, 1]) {
    const view=defaultChartView("1D",width,0);
    expect(Number.isFinite(view.range.from)).toBe(true);
    expect(view.range.to-view.range.from).toBeGreaterThanOrEqual(8);
  }
});
