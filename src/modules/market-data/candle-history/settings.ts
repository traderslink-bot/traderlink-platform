import { chartSymbol } from "../../scanner/alpaca/candles";
import { POPULAR_HISTORY_TICKERS } from "./popular-tickers";

export const CANDLE_HISTORY_FRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D"] as const;
export type HistoryFrame = typeof CANDLE_HISTORY_FRAMES[number];
export type HistoryLimit = { amount: number; unit: "sessions" | "days" | "months" };
export type CandleHistorySettings = {
  revision: number;
  marketCapCeiling: number;
  popularTickers: string[];
  popularMinuteUpdates: boolean;
  retention: Record<HistoryFrame, HistoryLimit>;
};

export function initialCandleHistorySettings(): CandleHistorySettings {
  return {
    revision: 0,
    marketCapCeiling: 500_000_000,
    popularTickers: [...POPULAR_HISTORY_TICKERS],
    popularMinuteUpdates: false,
    retention: {
      "1m": { amount: 10, unit: "sessions" },
      "5m": { amount: 2, unit: "months" },
      "15m": { amount: 6, unit: "months" },
      "30m": { amount: 6, unit: "months" },
      "1h": { amount: 12, unit: "months" },
      "4h": { amount: 36, unit: "months" },
      "1D": { amount: 36, unit: "months" },
    },
  };
}

const record = (input: unknown): input is Record<string, unknown> =>
  !!input && typeof input === "object" && !Array.isArray(input);
const boundedInteger = (input: unknown, minimum: number, maximum: number): input is number =>
  typeof input === "number" && Number.isSafeInteger(input) && input >= minimum && input <= maximum;

export function parseHistoryLimit(value: unknown): HistoryLimit {
  if (!record(value)) throw Error("invalid_history_limit");
  const { unit, amount } = value;
  if (unit !== "sessions" && unit !== "days" && unit !== "months") throw Error("invalid_history_limit");
  if (!boundedInteger(amount, 1, unit === "months" ? 120 : 3_660)) throw Error("invalid_history_limit");
  return { amount, unit };
}

export function parseCandleHistorySettings(value: unknown): CandleHistorySettings {
  if (!record(value) || !boundedInteger(value.revision, 0, Number.MAX_SAFE_INTEGER - 1) ||
    !boundedInteger(value.marketCapCeiling, 0, Number.MAX_SAFE_INTEGER) ||
    typeof value.popularMinuteUpdates !== "boolean" || !Array.isArray(value.popularTickers) ||
    value.popularTickers.length > 2_000 || !record(value.retention)) throw Error("invalid_history_settings");
  const retention = value.retention;
  if (Object.keys(retention).length !== CANDLE_HISTORY_FRAMES.length) throw Error("invalid_history_settings");
  return {
    revision: value.revision,
    marketCapCeiling: value.marketCapCeiling,
    popularTickers: [...new Set(value.popularTickers.map(symbol => {
      if (typeof symbol !== "string") throw Error("invalid_history_symbol");
      return chartSymbol(symbol);
    }))],
    popularMinuteUpdates: value.popularMinuteUpdates,
    retention: Object.fromEntries(CANDLE_HISTORY_FRAMES.map(frame => [frame, parseHistoryLimit(retention[frame])])) as CandleHistorySettings["retention"],
  };
}

export function popularBackgroundSymbols(settings: CandleHistorySettings): readonly string[] {
  return settings.popularMinuteUpdates ? settings.popularTickers : [];
}

export function eligibleHistorySymbols(
  universe: readonly { symbol: string; marketCap: number | null }[],
  settings: CandleHistorySettings,
) {
  const marketCap = new Set(universe.filter(row => row.marketCap !== null && Number.isFinite(row.marketCap) &&
    row.marketCap > 0 && row.marketCap <= settings.marketCapCeiling).map(row => chartSymbol(row.symbol)));
  const popular = new Set(settings.popularTickers);
  return { marketCap, popular, combined: new Set([...marketCap, ...popular]) };
}
