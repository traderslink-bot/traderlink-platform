import { defaultVwapBands, type ChartIndicator, type IndicatorType } from "./chart-preferences";

type IndicatorSettings = Omit<ChartIndicator, "id" | "type">;
type IndicatorPreset = { title: string; description: string; settings: IndicatorSettings[] };

const colors = ["#e99b32", "#42a5f5", "#ab47bc", "#26a69a", "#ef5350"];

const movingAverages = (lengths: number[]): IndicatorSettings[] =>
  lengths.map((period, index) => ({ period, source: "close", color: colors[index % colors.length], width: 2 }));

const vwap: IndicatorSettings = {
  period: 20, color: "#2962ff", width: 1, source: "hlc3", anchor: "Session", offset: 0,
  waitForClose: true, hideOnDaily: true, output: { priceScaleLabels: true, statusLineValues: true },
};

export const indicatorPresets: Record<IndicatorType, IndicatorPreset[]> = {
  EMA: [
    {
      title: "Intraday momentum",
      description: "9- and 20-bar EMAs for watching fast momentum and pullbacks against a slower intraday trend.",
      settings: movingAverages([9, 20]),
    },
    {
      title: "Trend context",
      description: "20- and 50-bar EMAs for tracking a smoother trend on higher timeframes.",
      settings: movingAverages([20, 50]),
    },
  ],
  SMA: [
    {
      title: "Intraday trend",
      description: "A 20-bar SMA for a simple, equally weighted view of the recent trend.",
      settings: movingAverages([20]),
    },
    {
      title: "Daily trend context",
      description: "20-, 50-, and 200-bar SMAs for comparing short-, intermediate-, and long-term trends on a daily chart.",
      settings: movingAverages([20, 50, 200]),
    },
  ],
  VWAP: [
    {
      title: "Session VWAP",
      description: "One volume-weighted price line that resets each trading session. Use it for intraday price context.",
      settings: [{ ...vwap, vwapBands: defaultVwapBands(false) }],
    },
    {
      title: "Session VWAP with bands",
      description: "Session VWAP with one standard-deviation band on either side to show how far price has moved from VWAP.",
      settings: [{ ...vwap, vwapBands: defaultVwapBands() }],
    },
  ],
  RSI: [{
    title: "Wilder RSI",
    description: "14-bar RSI with 30 and 70 levels for watching momentum extremes, and 50 as a midpoint.",
    settings: [{ period: 14, source: "close", color: "#ab47bc", width: 2, levels: { upper: 70, middle: 50, lower: 30 } }],
  }],
  MACD: [{
    title: "Classic MACD",
    description: "12- and 26-bar EMAs with a 9-bar signal line and histogram for tracking shifts in momentum.",
    settings: [{ period: 20, source: "close", color: "#42a5f5", width: 2, fastLength: 12, slowLength: 26, signalLength: 9 }],
  }],
  Bollinger: [{
    title: "Classic Bollinger Bands",
    description: "A 20-bar SMA with bands two standard deviations away for tracking volatility around the recent average.",
    settings: [{ period: 20, source: "close", color: "#42a5f5", width: 2, basisMa: "SMA", deviation: 2 }],
  }],
};

export function indicatorPresetRows(type: IndicatorType, index: number, makeId: () => string): ChartIndicator[] {
  return indicatorPresets[type][index].settings.map(settings => ({ ...settings, id: makeId(), type }));
}

export function nextMovingAverageLine(type: "EMA" | "SMA", lines: ChartIndicator[], id: string): ChartIndicator {
  const used = new Set(lines.map(line => line.period));
  const period = [9, 20, 50, 100, 200, ...Array.from({ length: lines.length + 1 }, (_, index) => index + 1)].find(length => !used.has(length)) ?? 9;
  return { id, type, period, source: "close", color: colors[lines.length % colors.length], width: 2 };
}
