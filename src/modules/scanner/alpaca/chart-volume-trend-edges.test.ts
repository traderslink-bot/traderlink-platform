// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Candle } from "./candles";
import { indicatorPresetRows } from "./chart-indicator-presets";
import { indicatorValues } from "./chart-indicators";
import type { ChartIndicator } from "./chart-preferences";

const start = Date.parse("2026-11-19T14:30:00Z") / 1000;
const closed = (volumes: number[], closes: number[]): Candle[] => volumes.map((volume, index) => {
  const close = closes[index];
  return { time: start + index * 60, close, open: close, high: close, low: close - 0.5, volume };
});
const plot = (type: ChartIndicator["type"], bars: Candle[]) =>
  indicatorValues(bars, { ...indicatorPresetRows(type, 0, () => "fractional-volume")[0], period: 3 }, "1m")[0].points;

describe("fractional volume and flow rolling windows", () => {
  it("omits CMF through empty-volume windows and keeps the next genuine volume", () => {
    const bars = closed([0.1, 0.2, 0.3, 0, 0, 0, 0, 1], [1, 2, 3, 4, 4, 4, 4, 5]);
    const points = plot("CMF", bars);
    expect(points.map(point => point.time)).toEqual([2, 3, 4, 7].map(index => bars[index].time));
    expect(points.at(-1)?.value).toBeCloseTo(1, 12);
  });

  it("omits RVOL when prior bars have no volume and keeps a genuine small prior print", () => {
    const bars = closed([0.1, 0.2, 0.3, 0, 0, 0, 0, 1e-10, 3e-10], [1, 2, 3, 4, 4, 4, 4, 5, 5]);
    const points = plot("RVOL", bars);
    expect(points.map(point => point.time)).toEqual([3, 4, 5, 8].map(index => bars[index].time));
    expect(points.at(-1)?.value).toBeCloseTo(9, 9);
  });

  it("returns neutral MFI while no positive or negative flow remains from fractional-volume candles", () => {
    const bars = closed([0.1, 0.2, 0.3, 0.7, 0.11, 0.35, 0.6, 0.234, 0.012, 0, 0, 0, 0, 0],
      [100, 101, 99, 102, 98, 104, 97, 105, 104, 104, 104, 104, 104, 104]);
    const points = plot("MFI", bars);
    expect(points.every(point => point.value >= 0 && point.value <= 100)).toBe(true);
    expect(points.filter(point => point.time >= bars[11].time).map(point => point.value)).toEqual([50, 50, 50]);
  });
});
