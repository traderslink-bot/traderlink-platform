import type { TradeCandle } from "./candle-analysis";

export type IndicatorPoint = { ema9: number | null; ema20: number | null; rsi14: number | null; time: number; vwap: number | null };

export function calculateIndicatorPoints(candles: readonly TradeCandle[]): readonly IndicatorPoint[] {
  let ema9: number | null = null, ema20: number | null = null, gain = 0, loss = 0, volumeTotal = 0, priceVolumeTotal = 0;
  return candles.map((candle, index) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    volumeTotal += candle.volume; priceVolumeTotal += typical * candle.volume;
    ema9 = ema9 === null ? candle.close : candle.close * (2 / 10) + ema9 * (8 / 10);
    ema20 = ema20 === null ? candle.close : candle.close * (2 / 21) + ema20 * (19 / 21);
    if (index > 0) { const change = candle.close - candles[index - 1].close; gain = (gain * 13 + Math.max(change, 0)) / 14; loss = (loss * 13 + Math.max(-change, 0)) / 14; }
    const rsi14 = index < 14 || loss === 0 ? null : 100 - 100 / (1 + gain / loss);
    return { time: candle.time, ema9, ema20, rsi14, vwap: volumeTotal > 0 ? priceVolumeTotal / volumeTotal : null };
  });
}
