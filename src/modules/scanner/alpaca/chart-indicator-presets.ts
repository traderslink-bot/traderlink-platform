import { defaultVwapBands, type ChartIndicator, type IndicatorType } from "./chart-preferences";

type IndicatorSettings = Omit<ChartIndicator, "id" | "type">;
type IndicatorPreset = { title: string; description: string; settings: IndicatorSettings[] };

const emaColors = ["#bd7208", "#007bbd", "#aa51b0"];
const smaColors = ["#007f72", "#ca4b86", "#68862c"];
const extraLineColors = [
  "#ff6d00", "#a6c8ff", "#bb8fce", "#43a047", "#f06292",
  "#00acc1", "#c0ca33", "#fbc02d", "#9575cd", "#00897b",
  "#ff8a65", "#7986cb", "#d4a373", "#2e7d32", "#8d6e63",
  "#29b6f6", "#f48fb1", "#afb42b", "#5e35b1", "#ef6c9d",
];

const movingAverages = (lengths: number[], colors: string[]): IndicatorSettings[] =>
  lengths.map((period, index) => ({ period, source: "close", color: colors[index], width: 1 }));

const vwap: IndicatorSettings = {
  period: 20, color: "#365bd9", width: 1, source: "hlc3", anchor: "Session", offset: 0,
  plots: {
    "upper-1": { color: "#3a873f" }, "lower-1": { color: "#d15b28" },
    "upper-2": { color: "#7a6bbb" }, "lower-2": { color: "#8e7336" },
    "upper-3": { color: "#247e9c" }, "lower-3": { color: "#ba5481" },
  },
  waitForClose: true, hideOnDaily: true, output: { statusLineValues: true },
};

export const indicatorPresets: Record<IndicatorType, IndicatorPreset[]> = {
  EMA: [
    {
      title: "Intraday momentum",
      description: "9- and 20-bar EMAs for watching fast momentum and pullbacks against a slower intraday trend.",
      settings: movingAverages([9, 20], emaColors),
    },
    {
      title: "Trend context",
      description: "20- and 50-bar EMAs for tracking a smoother trend on higher timeframes.",
      settings: movingAverages([20, 50], emaColors.slice(1)),
    },
  ],
  SMA: [
    {
      title: "Daily trend context",
      description: "20-, 50-, and 200-bar SMAs for comparing short-, intermediate-, and long-term trends on a daily chart.",
      settings: movingAverages([20, 50, 200], smaColors),
    },
    {
      title: "Intraday trend",
      description: "A 20-bar SMA for a simple, equally weighted view of the recent trend.",
      settings: movingAverages([20], smaColors),
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
    settings: [{ period: 14, source: "close", color: "#8a4eba", width: 2, levels: { upper: 70, middle: 50, lower: 30 }, plots: { upper: { color: "#bb4e4f" }, middle: { color: "#71808f" }, lower: { color: "#5d8424" } } }],
  }],
  MACD: [{
    title: "Classic MACD",
    description: "12- and 26-bar EMAs with a 9-bar signal line and histogram for tracking shifts in momentum.",
    settings: [{ period: 20, source: "close", color: "#535ad0", width: 2, fastLength: 12, slowLength: 26, signalLength: 9,
      plots: { signal: { color: "#ae681b" }, "positive-rising": { color: "#3b8c28" },
        "positive-falling": { color: "#438b81" }, "negative-rising": { color: "#b55489" }, "negative-falling": { color: "#be4932" } } }],
  }],
  Bollinger: [{
    title: "Classic Bollinger Bands",
    description: "A 20-bar SMA with bands two standard deviations away for tracking volatility around the recent average.",
    settings: [{ period: 20, source: "close", color: "#726895", width: 1, basisMa: "SMA", deviation: 2, plots: { upper: { color: "#bc4d65" }, lower: { color: "#0a839f" } } }],
  }],
};

export function indicatorPresetRows(type: IndicatorType, index: number, makeId: () => string): ChartIndicator[] {
  return indicatorPresets[type][index].settings.map(settings => ({ ...settings, id: makeId(), type }));
}

export function nextMovingAverageLine(type: "EMA" | "SMA", lines: ChartIndicator[], id: string): ChartIndicator {
  const used = new Set(lines.filter(line => line.type === type).map(line => line.period));
  const period = [9, 20, 50, 100, 200, ...Array.from({ length: lines.length + 1 }, (_, index) => index + 1)].find(length => !used.has(length)) ?? 9;
  const usedColors = new Set(lines.flatMap(line => [line.color, ...Object.values(line.plots ?? {}).map(plot => plot.color)])
    .flatMap(color => color ? [color.toLowerCase()] : []));
  const color = extraLineColors.find(color => !usedColors.has(color)) ?? extraLineColors[0];
  return { id, type, period, source: "close", color, width: 1 };
}
