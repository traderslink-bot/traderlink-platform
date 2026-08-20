import type { CandlePatternKind } from "./pattern-detection";

export const CANDLE_PATTERN_NAMES: Readonly<Record<CandlePatternKind, string>> = Object.freeze({
  compression: "Inside Bar",
  compression_break_bearish: "Bearish Inside Bar Breakdown",
  compression_break_bullish: "Bullish Inside Bar Breakout",
  doji: "Doji",
  engulfing_bearish: "Bearish Engulfing",
  engulfing_bullish: "Bullish Engulfing",
  evening_star_bearish: "Bearish Evening Star",
  expansion_bearish: "Strong Bearish Candle",
  expansion_bullish: "Strong Bullish Candle",
  hammer_bullish: "Bullish Hammer",
  harami_bearish: "Bearish Harami",
  harami_bullish: "Bullish Harami",
  high_volume_exhaustion: "High-Volume Exhaustion",
  morning_star_bullish: "Bullish Morning Star",
  rejection_lower: "Bullish Rejection Candle",
  rejection_upper: "Bearish Rejection Candle",
  shooting_star_bearish: "Bearish Shooting Star",
  three_black_crows_bearish: "Bearish Three Black Crows",
  three_white_soldiers_bullish: "Bullish Three White Soldiers",
});

export const CANDLE_PATTERN_SHORT_NAMES: Readonly<Record<CandlePatternKind, string>> = Object.freeze({
  compression: "Inside Bar",
  compression_break_bearish: "Bear Breakdown",
  compression_break_bullish: "Bull Breakout",
  doji: "Doji",
  engulfing_bearish: "Bearish Engulfing",
  engulfing_bullish: "Bullish Engulfing",
  evening_star_bearish: "Evening Star",
  expansion_bearish: "Strong Bear",
  expansion_bullish: "Strong Bull",
  hammer_bullish: "Bullish Hammer",
  harami_bearish: "Bear Harami",
  harami_bullish: "Bull Harami",
  high_volume_exhaustion: "Exhaustion",
  morning_star_bullish: "Morning Star",
  rejection_lower: "Bull Rejection",
  rejection_upper: "Bear Rejection",
  shooting_star_bearish: "Bearish Shooting Star",
  three_black_crows_bearish: "3 Black Crows",
  three_white_soldiers_bullish: "3 White Soldiers",
});

export function candlePatternName(kind: string): string {
  return CANDLE_PATTERN_NAMES[kind as CandlePatternKind]
    ?? kind.replaceAll("_", " ").replaceAll("-", " ")
      .replace(/\b\w/gu, (character) => character.toUpperCase());
}

export function candlePatternShortName(kind: string): string {
  return CANDLE_PATTERN_SHORT_NAMES[kind as CandlePatternKind] ?? candlePatternName(kind);
}
