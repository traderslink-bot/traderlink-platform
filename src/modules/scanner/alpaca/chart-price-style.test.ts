import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CHART_PREFERENCES, parseChartPreferences } from "@/src/modules/scanner/alpaca/chart-preferences";
import { chartPricePoint, createChartPriceStyle, heikinAshiCandle } from "@/app/(dashboard)/charts/chart-price-style";

const { upColor, downColor } = DEFAULT_CHART_PREFERENCES;
const prior = { time: 1, open: 0.51, high: 0.52, low: 0.49, close: 0.50, volume: 50, carried: false };
const candle = (open: number, close: number) => ({
  time: 2, open, close, high: Math.max(open, close), low: Math.min(open, close), volume: 75, carried: false,
});

describe("chart price styles", () => {
  it.each(["candles", "hollow", "line", "bars", "heikinAshi"] as const)(
    "keeps the %s price tick precise across a dollar crossing in loaded and streaming bars", kind => {
      const series = { setData: vi.fn(), update: vi.fn(), applyOptions: vi.fn() };
      const addSeries = vi.fn(() => series);
      const chart = { addSeries } as unknown as Parameters<typeof createChartPriceStyle>[0];
      const library = { CandlestickSeries: {}, BarSeries: {}, LineSeries: {} } as Parameters<typeof createChartPriceStyle>[1];
      const price = createChartPriceStyle(chart, library, { kind, upColor, downColor }, () => [], false);
      const cents = { type: "price", precision: 2, minMove: 0.01 };
      const fourPlaces = { type: "price", precision: 4, minMove: 0.0001 };
      const atDollar = candle(1, 1.55);
      const wick = { ...atDollar, time: 1, low: 0.7199 };

      expect(addSeries).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ priceFormat: cents }));
      price.set([{ ...wick, carried: true }, atDollar]);
      expect(series.applyOptions).not.toHaveBeenCalled();
      price.set([wick, atDollar]);
      expect(series.applyOptions).toHaveBeenLastCalledWith({ priceFormat: fourPlaces });
      price.update(candle(1.55, 1.60), atDollar);
      expect(series.applyOptions).toHaveBeenCalledTimes(1);

      price.set([atDollar]);
      expect(series.applyOptions).toHaveBeenLastCalledWith({ priceFormat: cents });
      price.update({ ...atDollar, low: 0.8951 }, undefined);
      price.update(candle(1.55, 1.60), atDollar);
      expect(series.applyOptions).toHaveBeenLastCalledWith({ priceFormat: fourPlaces });
      expect(series.applyOptions).toHaveBeenCalledTimes(3);
    },
  );

  it.each([
    [0.51, 0.52, "transparent", upColor],
    [0.53, 0.52, upColor, upColor],
    [0.46, 0.48, "transparent", downColor],
    [0.49, 0.48, downColor, downColor],
  ])("colors hollow candles by previous close and fills by own open from %s to %s", (open, close, fill, color) => {
    const bar = candle(open, close);
    expect(chartPricePoint(bar, prior, { kind: "hollow", upColor, downColor })).toEqual({
      ...bar, value: close, color: fill, borderColor: color, wickColor: color,
    });
  });

  it("colors a column by the previous close and plots price instead of volume", () => {
    expect(chartPricePoint(candle(0.53, 0.52), prior, { kind: "columns", upColor, downColor }))
      .toMatchObject({ value: 0.52, color: upColor, volume: 75 });
    expect(chartPricePoint(candle(0.46, 0.48), prior, { kind: "columns", upColor, downColor }))
      .toMatchObject({ value: 0.48, color: downColor });
  });

  it("calculates Heikin Ashi from actual candles using the previous derived open and close", () => {
    const previous = heikinAshiCandle({ ...prior, open: 0.60, high: 0.64, low: 0.59, close: 0.62 }, undefined);
    expect(previous.open).toBe(0.61);
    expect(previous.close).toBeCloseTo(0.6125);
    const actual = candle(0.47, 0.49);
    const next = heikinAshiCandle(actual, previous);
    expect(next.open).toBeCloseTo(0.61125);
    expect(next.high).toBe(next.open);
    expect(next.low).toBe(0.47);
    expect(next.close).toBeCloseTo(0.48);
    expect(actual).toEqual(candle(0.47, 0.49));
  });

  it("plots a flat display mark during a carried period", () => {
    const gap = heikinAshiCandle({ ...candle(0.51, 0.51), volume: 0, carried: true }, prior);
    expect(gap).toMatchObject({ open: 0.5, high: 0.5, low: 0.5, close: 0.5, volume: 0, carried: true });
  });

  it.each(["hollow", "baseline", "columns", "heikinAshi"])("round-trips %s as an account preference", kind => {
    expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, kind }).kind).toBe(kind);
  });
});
