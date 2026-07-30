import type { TradeCandle } from "./candle-analysis";

export type CandlePatternKind =
  | "compression"
  | "engulfing_bearish"
  | "engulfing_bullish"
  | "expansion_bearish"
  | "expansion_bullish"
  | "high_volume_exhaustion"
  | "rejection_lower"
  | "rejection_upper";

export type CandlePatternEvent = {
  kind: CandlePatternKind;
  time: number;
};

function body(candle: TradeCandle): number {
  return Math.abs(candle.close - candle.open);
}

function range(candle: TradeCandle): number {
  return candle.high - candle.low;
}

function active(candle: TradeCandle): boolean {
  return [candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite) && candle.volume > 0 && range(candle) > 0;
}

export function detectMicroCapCandlePatterns(
  candles: readonly TradeCandle[],
): readonly CandlePatternEvent[] {
  const events: CandlePatternEvent[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const candle = candles[index];
    const previous = candles[index - 1];
    if (!active(candle) || !active(previous)) continue;
    const candleBody = body(candle);
    const candleRange = range(candle);
    const bullish = candle.close > candle.open;
    const closeNearHigh = (candle.high - candle.close) / candleRange <= 0.2;
    const closeNearLow = (candle.close - candle.low) / candleRange <= 0.2;
    const priorBodies = candles.slice(Math.max(0, index - 10), index).filter(active).map(body);
    const averageBody = priorBodies.reduce((sum, value) => sum + value, 0) / priorBodies.length;
    if (averageBody > 0 && candleBody >= averageBody * 1.8) {
      if (bullish && closeNearHigh) events.push({ kind: "expansion_bullish", time: candle.time });
      if (!bullish && closeNearLow) events.push({ kind: "expansion_bearish", time: candle.time });
    }
    const previousBullish = previous.close > previous.open;
    if (!previousBullish && bullish && candle.open <= previous.close && candle.close >= previous.open) events.push({ kind: "engulfing_bullish", time: candle.time });
    if (previousBullish && !bullish && candle.open >= previous.close && candle.close <= previous.open) events.push({ kind: "engulfing_bearish", time: candle.time });
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    if (lowerWick >= candleBody * 2 && lowerWick > upperWick * 1.5) events.push({ kind: "rejection_lower", time: candle.time });
    if (upperWick >= candleBody * 2 && upperWick > lowerWick * 1.5) events.push({ kind: "rejection_upper", time: candle.time });
    if (candle.high <= previous.high && candle.low >= previous.low) events.push({ kind: "compression", time: candle.time });
    const priorVolumes = candles.slice(Math.max(0, index - 20), index).filter(active).map((item) => item.volume);
    const averageVolume = priorVolumes.reduce((sum, value) => sum + value, 0) / priorVolumes.length;
    const stalled = (bullish && !closeNearHigh) || (!bullish && !closeNearLow) || upperWick >= candleBody || lowerWick >= candleBody;
    if (averageVolume > 0 && candle.volume >= averageVolume * 3 && stalled) events.push({ kind: "high_volume_exhaustion", time: candle.time });
  }
  return events;
}
