import type { TradeCandle } from "./candle-analysis";

export type IndicatorPoint = { atr14: number | null; ema9: number | null; ema20: number | null; macd: number | null; macdHistogram: number | null; macdSignal: number | null; rsi14: number | null; time: number; vwap: number | null };

export type IndicatorSnapshot = Omit<IndicatorPoint, "time"> & {
  adr20: number | null;
  phase: "entry" | "exit";
};

export function calculateIndicatorPoints(
  candles: readonly TradeCandle[],
  options: Readonly<{ vwapSource?: "turnover" | "typical_price" }> = {},
): readonly IndicatorPoint[] {
  const vwapSource = options.vwapSource ?? "typical_price";
  let ema9: number | null = null, ema12: number | null = null, ema20: number | null = null, ema26: number | null = null, macdSignal: number | null = null, atr14: number | null = null, gain = 0, loss = 0, volumeTotal = 0, priceVolumeTotal = 0, turnoverTotal = 0, exactTurnoverAvailable = true;
  return candles.map((candle, index) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    volumeTotal += candle.volume; priceVolumeTotal += typical * candle.volume;
    if (vwapSource === "turnover") {
      if (candle.turnover === null || candle.turnover === undefined ||
          !Number.isFinite(candle.turnover) || candle.turnover < 0) {
        exactTurnoverAvailable = false;
      } else {
        turnoverTotal += candle.turnover;
      }
    }
    ema9 = ema9 === null ? candle.close : candle.close * (2 / 10) + ema9 * (8 / 10);
    ema12 = ema12 === null ? candle.close : candle.close * (2 / 13) + ema12 * (11 / 13);
    ema20 = ema20 === null ? candle.close : candle.close * (2 / 21) + ema20 * (19 / 21);
    ema26 = ema26 === null ? candle.close : candle.close * (2 / 27) + ema26 * (25 / 27);
    const macd = ema12 - ema26; macdSignal = macdSignal === null ? macd : macd * .2 + macdSignal * .8;
    if (index > 0) { const priorClose = candles[index - 1].close; const change = candle.close - priorClose; const trueRange = Math.max(candle.high - candle.low, Math.abs(candle.high - priorClose), Math.abs(candle.low - priorClose)); atr14 = atr14 === null ? trueRange : (atr14 * 13 + trueRange) / 14; gain = (gain * 13 + Math.max(change, 0)) / 14; loss = (loss * 13 + Math.max(-change, 0)) / 14; }
    const rsi14 = index < 14 || loss === 0 ? null : 100 - 100 / (1 + gain / loss);
    const vwap = volumeTotal <= 0
      ? null
      : vwapSource === "turnover"
        ? exactTurnoverAvailable ? turnoverTotal / volumeTotal : null
        : priceVolumeTotal / volumeTotal;
    return { time: candle.time, atr14, ema9, ema20, macd, macdSignal, macdHistogram: macd - macdSignal, rsi14, vwap };
  });
}

export function calculateAdr20(dailyHighLowRanges: readonly number[]): number | null {
  const eligible = dailyHighLowRanges.filter((range) => Number.isFinite(range) && range > 0).slice(-20);
  return eligible.length === 20 ? eligible.reduce((sum, range) => sum + range, 0) / 20 : null;
}

export function indicatorSnapshot(args: {
  adr20: number | null;
  phase: "entry" | "exit";
  points: readonly IndicatorPoint[];
  time: number;
}): IndicatorSnapshot | null {
  const point = [...args.points].reverse().find((candidate) => candidate.time <= args.time);
  if (!point) return null;
  return Object.freeze({
    adr20: args.adr20,
    atr14: point.atr14,
    ema9: point.ema9,
    ema20: point.ema20,
    macd: point.macd,
    macdHistogram: point.macdHistogram,
    macdSignal: point.macdSignal,
    phase: args.phase,
    rsi14: point.rsi14,
    vwap: point.vwap,
  });
}
