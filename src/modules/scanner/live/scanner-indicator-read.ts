import type { IndicatorDisplayRow } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import type { scannerIndicatorResults } from "./scanner-indicator-calculation";

export const SCANNER_INDICATOR_FRAMES = ["1m", "5m", "15m"] as const;
export const SCANNER_INDICATORS = ["EMA", "VWAP", "RSI", "Trend", "RSI momentum", "Volume", "ATR"] as const;
export type ScannerIndicatorFrame = typeof SCANNER_INDICATOR_FRAMES[number];
type Indicator = typeof SCANNER_INDICATORS[number];
export type DisplaySignal = NonNullable<IndicatorDisplayRow["signals"]>[number];

const readingDirection = (reading: IndicatorDisplayRow) =>
  reading.tone === "bullish" || reading.tone === "bearish" ? reading.tone : "neutral";
const readingNames: Record<Indicator, string> = {
  EMA: "Moving averages", VWAP: "VWAP", RSI: "RSI", Trend: "Trend", "RSI momentum": "Momentum", Volume: "Volume", ATR: "ATR",
};
function compactRead(name: Indicator, reading: IndicatorDisplayRow, result?: ReturnType<typeof scannerIndicatorResults>["result"]) {
  const state = reading.state;
  if (name === "VWAP" && state) return [reading.value, state.split(" · ").at(-1)?.replace(/^Price /u, "").replace(" VWAP", "")].join(" · ");
  if (name === "EMA" && result?.ema9 != null && result.ema20 != null) {
    return result.ema9 === result.ema20 ? "9 at 20" : result.ema9 > result.ema20 ? "9 above 20" : "9 below 20";
  }
  if (name === "RSI") return [reading.value, reading.conditionState].filter(Boolean).join(" · ");
  if (name === "ATR") return [reading.value, state].filter(Boolean).join(" · ");
  return state ?? reading.value;
}

export type IndicatorRow = {
  name: Indicator;
  text: string;
  details: string;
  direction: ReturnType<typeof readingDirection>;
  signals: readonly DisplaySignal[];
};

export type ScannerIndicatorRead = {
  symbol: string;
  frame: ScannerIndicatorFrame;
  rows: IndicatorRow[];
  vwap: number | null;
};

export function prepareScannerIndicatorRows(readings: readonly IndicatorDisplayRow[], result: ReturnType<typeof scannerIndicatorResults>["result"]) {
  return SCANNER_INDICATORS.flatMap(name => {
    const reading = readings.find(item => item.label === readingNames[name]);
    if (!reading || (!reading.state && ["—", "Unavailable"].includes(reading.value)) ||
      (name === "EMA" && result?.ema9 == null && result?.ema20 == null)) return [];
    const text = compactRead(name,reading,result);
    const details = [reading.value && reading.value !== text ? reading.value : null,
      name === "EMA" ? text : reading.state ?? text].filter(Boolean).join(" · ");
    return [{name, text, details, direction:readingDirection(reading), signals:reading.signals ?? []}];
  });
}
