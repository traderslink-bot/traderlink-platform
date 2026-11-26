import type { IChartApi, UTCTimestamp } from "lightweight-charts";
import type { DisplayCandle } from "@/src/modules/scanner/alpaca/candles";
import type { ChartPreferences } from "@/src/modules/scanner/alpaca/chart-preferences";

import { HlcAreaSeries } from "./chart-hlc-area";

type Style = Pick<ChartPreferences, "kind" | "upColor" | "downColor">;
type Library = typeof import("lightweight-charts");

export function chartPricePoint(bar: DisplayCandle, previous: DisplayCandle | undefined, style: Style) {
  const point = { ...bar, time: bar.time as UTCTimestamp, value: bar.close };
  const direction = bar.close >= (previous?.close ?? bar.open) ? style.upColor : style.downColor;
  if (style.kind === "hollow") {
    return {
      ...point,
      color: bar.close >= bar.open ? "transparent" : direction,
      borderColor: direction,
      wickColor: direction,
    };
  }
  return style.kind === "columns" ? { ...point, color: direction } : point;
}

/** Derive a display candle while retaining the provider candle for studies and readouts. */
export function heikinAshiCandle(bar: DisplayCandle, previous: DisplayCandle | undefined): DisplayCandle {
  if (bar.carried) {
    const value = previous?.close ?? bar.close;
    return { ...bar, open: value, high: value, low: value, close: value };
  }
  const close = (bar.open + bar.high + bar.low + bar.close) / 4;
  const open = previous ? (previous.open + previous.close) / 2 : (bar.open + bar.close) / 2;
  return { ...bar, open, high: Math.max(bar.high, open, close), low: Math.min(bar.low, open, close), close };
}

export function createChartPriceStyle(
  chart: IChartApi,
  library: Library,
  style: Style,
  readBars: () => readonly DisplayCandle[],
  logarithmic: boolean,
) {
  const { kind, upColor, downColor } = style;
  const heikinAshi = kind === "heikinAshi";
  const { AreaSeries, BaselineSeries, HistogramSeries, CandlestickSeries, LineSeries, LineType, BarSeries, customSeriesDefaultOptions } = library;
  const priceFormat = { type: "price" as const, precision: 4, minMove: 0.0001 };
  const baseline = kind === "baseline" ? chart.addSeries(BaselineSeries, {
    priceFormat, lineWidth: 2,
    topLineColor: upColor, topFillColor1: upColor + "48", topFillColor2: upColor + "10",
    bottomLineColor: downColor, bottomFillColor1: downColor + "10", bottomFillColor2: downColor + "48",
  }) : undefined;
  const columns = kind === "columns" ? chart.addSeries(HistogramSeries, { priceFormat, color: upColor }) : undefined;
  const area = kind === "area" ? chart.addSeries(AreaSeries, {
    priceFormat, lineColor: upColor, topColor: upColor + "55", bottomColor: upColor + "0a",
  }) : undefined;
  const hlc = kind === "hlcArea" ? chart.addCustomSeries(
    new HlcAreaSeries(customSeriesDefaultOptions, upColor), { priceFormat, priceLineColor: upColor },
  ) : undefined;
  const series = baseline ?? columns ?? area ?? hlc ?? (
    kind === "line" || kind === "stepLine"
      ? chart.addSeries(LineSeries, { color: upColor, ...(kind === "stepLine" ? { lineType: LineType.WithSteps, priceFormat } : {}) })
    : kind === "bars" ? chart.addSeries(BarSeries, { upColor, downColor })
    : chart.addSeries(CandlestickSeries, {
      upColor, downColor, wickUpColor: upColor, wickDownColor: downColor, borderVisible: kind === "hollow", priceFormat,
      ...(heikinAshi ? { lastValueVisible: false, priceLineVisible: false } : {}),
    }));

  let frame = 0;
  let reference: number | undefined;
  let heikinBeforeLast: DisplayCandle | undefined;
  function updateReference() {
    frame = 0;
    const range = chart.timeScale().getVisibleLogicalRange();
    const bars = readBars();
    if (!range || !bars.length) return;
    let low = Infinity, high = -Infinity;
    for (let index = Math.max(0, Math.ceil(range.from)); index <= Math.min(bars.length - 1, Math.floor(range.to)); index++) {
      const { close } = bars[index];
      low = Math.min(low, close);
      high = Math.max(high, close);
    }
    if (!Number.isFinite(low) || !Number.isFinite(high)) return;
    // Keep price columns near the bottom of the price pane even on tightly traded stocks.
    const next = baseline
      ? logarithmic && low > 0 ? Math.sqrt(low) * Math.sqrt(high) : low + (high - low) / 2
      : low - Math.min(low * 0.05, Math.max((high - low) * 0.05, low * 0.001));
    if (next === reference) return;
    reference = next;
    baseline?.applyOptions({ baseValue: { type: "price", price: next } });
    columns?.applyOptions({ base: next });
  }
  function scheduleReference() {
    if ((baseline || columns) && !frame) frame = requestAnimationFrame(updateReference);
  }

  return {
    series,
    scheduleReference,
    set(bars: readonly DisplayCandle[]) {
      let previousSynthetic: DisplayCandle | undefined;
      heikinBeforeLast = undefined;
      series.setData(bars.map((bar, index) => {
        if (!heikinAshi) return chartPricePoint(bar, bars[index - 1], style);
        heikinBeforeLast = previousSynthetic;
        const derived = heikinAshiCandle(bar, previousSynthetic);
        // An empty period preserves the previous state and never advances the smoothing.
        if (!bar.carried) previousSynthetic = derived;
        return chartPricePoint(derived, undefined, style);
      }));
      scheduleReference();
    },
    update(bar: DisplayCandle, previous: DisplayCandle | undefined) {
      const candle = heikinAshi ? heikinAshiCandle(bar, heikinBeforeLast) : bar;
      series.update(chartPricePoint(candle, previous, style));
      scheduleReference();
    },
    dispose() {
      cancelAnimationFrame(frame);
    },
  };
}
