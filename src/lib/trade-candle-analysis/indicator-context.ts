import type { TradeCandle } from "./candle-analysis";

export type IndicatorPoint = { ema9: number | null; ema20: number | null; macd: number | null; macdHistogram: number | null; macdSignal: number | null; rsi14: number | null; time: number; vwap: number | null };

export function calculateIndicatorPoints(candles: readonly TradeCandle[]): readonly IndicatorPoint[] {
  let ema9: number | null = null, ema12: number | null = null, ema20: number | null = null, ema26: number | null = null, macdSignal: number | null = null, gain = 0, loss = 0, volumeTotal = 0, priceVolumeTotal = 0;
  return candles.map((candle, index) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    volumeTotal += candle.volume; priceVolumeTotal += typical * candle.volume;
    ema9 = ema9 === null ? candle.close : candle.close * (2 / 10) + ema9 * (8 / 10);
    ema12 = ema12 === null ? candle.close : candle.close * (2 / 13) + ema12 * (11 / 13);
    ema20 = ema20 === null ? candle.close : candle.close * (2 / 21) + ema20 * (19 / 21);
    ema26 = ema26 === null ? candle.close : candle.close * (2 / 27) + ema26 * (25 / 27);
    const macd = ema12 - ema26; macdSignal = macdSignal === null ? macd : macd * .2 + macdSignal * .8;
    if (index > 0) { const change = candle.close - candles[index - 1].close; gain = (gain * 13 + Math.max(change, 0)) / 14; loss = (loss * 13 + Math.max(-change, 0)) / 14; }
    const rsi14 = index < 14 || loss === 0 ? null : 100 - 100 / (1 + gain / loss);
    return { time: candle.time, ema9, ema20, macd, macdSignal, macdHistogram: macd - macdSignal, rsi14, vwap: volumeTotal > 0 ? priceVolumeTotal / volumeTotal : null };
  });
}
