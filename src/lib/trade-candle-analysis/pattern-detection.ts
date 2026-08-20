import type { TradeCandle } from "./candle-analysis";

export type CandlePatternKind =
  | "compression"
  | "compression_break_bearish"
  | "compression_break_bullish"
  | "doji"
  | "engulfing_bearish"
  | "engulfing_bullish"
  | "evening_star_bearish"
  | "expansion_bearish"
  | "expansion_bullish"
  | "hammer_bullish"
  | "harami_bearish"
  | "harami_bullish"
  | "high_volume_exhaustion"
  | "morning_star_bullish"
  | "rejection_lower"
  | "rejection_upper"
  | "shooting_star_bearish"
  | "three_black_crows_bearish"
  | "three_white_soldiers_bullish";

export type CandlePatternEvent = { kind: CandlePatternKind; time: number };

export const MICRO_CAP_PATTERN_DEFINITIONS: Readonly<Record<CandlePatternKind, string>> = {
  compression: "A materially smaller inside bar with contracting volume relative to recent active candles.",
  compression_break_bearish: "A decisive, active close below a confirmed compressed range.",
  compression_break_bullish: "A decisive, active close above a confirmed compressed range.",
  doji: "A meaningful-range candle closed with an exceptionally small real body, showing temporary balance between buyers and sellers.",
  engulfing_bearish: "A meaningful bearish real body fully engulfed the preceding bullish body.",
  engulfing_bullish: "A meaningful bullish real body fully engulfed the preceding bearish body.",
  evening_star_bearish: "After an advance, a small middle body was followed by a meaningful bearish close through the first candle's midpoint.",
  expansion_bearish: "A wide, active bearish body closed near its low relative to recent candles.",
  expansion_bullish: "A wide, active bullish body closed near its high relative to recent candles.",
  hammer_bullish: "After a meaningful decline, a small body rejected a local low with a dominant lower wick and the following candle confirmed recovery.",
  harami_bearish: "After an advance, a smaller bearish body formed fully inside the preceding meaningful bullish body.",
  harami_bullish: "After a decline, a smaller bullish body formed fully inside the preceding meaningful bearish body.",
  high_volume_exhaustion: "A locally extended move printed exceptional volume, stalled at an extreme, and was confirmed by the following candle.",
  morning_star_bullish: "After a decline, a small middle body was followed by a meaningful bullish close through the first candle's midpoint.",
  rejection_lower: "A significant candle tested a local low, left a dominant lower wick, and closed back in its upper portion.",
  rejection_upper: "A significant candle tested a local high, left a dominant upper wick, and closed back in its lower portion.",
  shooting_star_bearish: "After a meaningful advance, a small body rejected a local high with a dominant upper wick and the following candle confirmed weakness.",
  three_black_crows_bearish: "After an advance, three meaningful bearish candles opened inside the prior body and closed progressively lower.",
  three_white_soldiers_bullish: "After a decline, three meaningful bullish candles opened inside the prior body and closed progressively higher.",
};

const PATTERN_PRIORITY: Readonly<Record<CandlePatternKind, number>> = {
  compression: 1,
  doji: 1,
  expansion_bearish: 2,
  expansion_bullish: 2,
  engulfing_bearish: 3,
  engulfing_bullish: 3,
  rejection_lower: 4,
  rejection_upper: 4,
  harami_bearish: 5,
  harami_bullish: 5,
  hammer_bullish: 5,
  shooting_star_bearish: 5,
  compression_break_bearish: 5,
  compression_break_bullish: 5,
  high_volume_exhaustion: 7,
  evening_star_bearish: 7,
  morning_star_bullish: 7,
  three_black_crows_bearish: 7,
  three_white_soldiers_bullish: 7,
};

function body(candle: TradeCandle): number {
  return Math.abs(candle.close - candle.open);
}

function range(candle: TradeCandle): number {
  return candle.high - candle.low;
}

function active(candle: TradeCandle): boolean {
  return [candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite) &&
    candle.volume > 0 && range(candle) > 0;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1]! + ordered[middle]!) / 2
    : ordered[middle]!;
}

function recentActive(candles: readonly TradeCandle[], endIndexExclusive: number, maximum: number): readonly TradeCandle[] {
  return candles.slice(Math.max(0, endIndexExclusive - maximum), endIndexExclusive).filter(active);
}

function isConfirmedCompression(
  compressed: TradeCandle,
  container: TradeCandle,
  baseline: readonly TradeCandle[],
): boolean {
  if (!active(compressed) || !active(container) || baseline.length < 5) return false;
  const compressedRange = range(compressed);
  const medianRange = median(baseline.map(range));
  const medianVolume = median(baseline.map((candle) => candle.volume));
  return compressed.high <= container.high && compressed.low >= container.low &&
    compressedRange <= range(container) * 0.65 && medianRange > 0 &&
    compressedRange <= medianRange * 0.7 && medianVolume > 0 &&
    compressed.volume <= medianVolume * 0.85;
}

function bodyLow(candle: TradeCandle): number {
  return Math.min(candle.open, candle.close);
}

function bodyHigh(candle: TradeCandle): number {
  return Math.max(candle.open, candle.close);
}

function bodyIsInside(inner: TradeCandle, outer: TradeCandle): boolean {
  return bodyLow(inner) >= bodyLow(outer) && bodyHigh(inner) <= bodyHigh(outer);
}

function opensInsideBody(candle: TradeCandle, prior: TradeCandle): boolean {
  return candle.open >= bodyLow(prior) && candle.open <= bodyHigh(prior);
}

function selectOnePatternPerCandle(candidates: readonly CandlePatternEvent[]): readonly CandlePatternEvent[] {
  const strongestByTime = new Map<number, CandlePatternEvent>();
  for (const candidate of candidates) {
    const current = strongestByTime.get(candidate.time);
    if (!current || PATTERN_PRIORITY[candidate.kind] > PATTERN_PRIORITY[current.kind]) {
      strongestByTime.set(candidate.time, candidate);
    }
  }
  return [...strongestByTime.values()].sort((left, right) => left.time - right.time);
}

export function detectMicroCapCandlePatterns(candles: readonly TradeCandle[]): readonly CandlePatternEvent[] {
  const candidates: CandlePatternEvent[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const candle = candles[index]!;
    const previous = candles[index - 1]!;
    if (!active(candle) || !active(previous)) continue;
    const lookback10 = recentActive(candles, index, 10);
    if (lookback10.length < 5) continue;

    const candleBody = body(candle);
    const candleRange = range(candle);
    const bodyShare = candleBody / candleRange;
    const bullish = candle.close > candle.open;
    const closeLocation = (candle.close - candle.low) / candleRange;
    const medianRange = median(lookback10.map(range));
    const medianVolume = median(lookback10.map((item) => item.volume));
    const positiveBodies = lookback10.map(body).filter((value) => value > 0);
    const bodyBaseline = Math.max(median(positiveBodies), medianRange * 0.15);

    const isDoji = candleRange >= medianRange * 0.65 &&
      candle.volume >= medianVolume * 0.6 && bodyShare <= 0.1;
    if (isDoji) candidates.push({ kind: "doji", time: candle.time });

    const isExpansion = medianRange > 0 && medianVolume > 0 &&
      candleBody >= bodyBaseline * 1.8 && candleRange >= medianRange * 1.4 &&
      bodyShare >= 0.65 && candle.volume >= medianVolume * 0.9;
    if (isExpansion && bullish && closeLocation >= 0.85) {
      candidates.push({ kind: "expansion_bullish", time: candle.time });
    } else if (isExpansion && !bullish && closeLocation <= 0.15) {
      candidates.push({ kind: "expansion_bearish", time: candle.time });
    }

    const previousBody = body(previous);
    const previousBullish = previous.close > previous.open;
    const isMeaningfulEngulfing = previousBody > 0 && candleBody >= previousBody * 1.2 &&
      candleBody >= bodyBaseline * 0.8 && candleRange >= medianRange * 0.8 &&
      bodyShare >= 0.55 && candle.volume >= medianVolume * 0.75;
    if (isMeaningfulEngulfing && !previousBullish && bullish &&
        candle.open <= previous.close && candle.close >= previous.open) {
      candidates.push({ kind: "engulfing_bullish", time: candle.time });
    } else if (isMeaningfulEngulfing && previousBullish && !bullish &&
        candle.open >= previous.close && candle.close <= previous.open) {
      candidates.push({ kind: "engulfing_bearish", time: candle.time });
    }

    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const recentThree = recentActive(candles, index, 3);
    const testedLocalLow = recentThree.length >= 2 && candle.low <= Math.min(...recentThree.map((item) => item.low));
    const testedLocalHigh = recentThree.length >= 2 && candle.high >= Math.max(...recentThree.map((item) => item.high));
    const significantRejection = candleRange >= medianRange * 0.9 && candle.volume >= medianVolume * 0.75;
    const confirmation = candles[index + 1];
    const hasActiveConfirmation = confirmation !== undefined && active(confirmation);
    const midpoint = (candle.high + candle.low) / 2;
    const recentDirectionalMove = recentThree.length >= 2
      ? previous.close - recentThree[0]!.open
      : 0;
    const isHarami = previousBody >= bodyBaseline && candleBody >= bodyBaseline * 0.15 &&
      candleBody <= previousBody * 0.6 && bodyIsInside(candle, previous);
    if (isHarami && !previousBullish && bullish && recentDirectionalMove <= -medianRange) {
      candidates.push({ kind: "harami_bullish", time: candle.time });
    } else if (isHarami && previousBullish && !bullish && recentDirectionalMove >= medianRange) {
      candidates.push({ kind: "harami_bearish", time: candle.time });
    }
    const confirmedHammer = significantRejection && hasActiveConfirmation && testedLocalLow &&
      recentDirectionalMove <= -medianRange * 1.25 && bodyShare <= 0.35 &&
      lowerWick / candleRange >= 0.55 && upperWick / candleRange <= 0.2 &&
      confirmation!.close > confirmation!.open && confirmation!.close > midpoint;
    const confirmedShootingStar = significantRejection && hasActiveConfirmation && testedLocalHigh &&
      recentDirectionalMove >= medianRange * 1.25 && bodyShare <= 0.35 &&
      upperWick / candleRange >= 0.55 && lowerWick / candleRange <= 0.2 &&
      confirmation!.close < confirmation!.open && confirmation!.close < midpoint;
    if (confirmedHammer) candidates.push({ kind: "hammer_bullish", time: candle.time });
    if (confirmedShootingStar) candidates.push({ kind: "shooting_star_bearish", time: candle.time });
    if (significantRejection && testedLocalLow && lowerWick / candleRange >= 0.5 &&
        lowerWick >= Math.max(candleBody * 1.5, upperWick * 1.5) && closeLocation >= 0.6) {
      candidates.push({ kind: "rejection_lower", time: candle.time });
    } else if (significantRejection && testedLocalHigh && upperWick / candleRange >= 0.5 &&
        upperWick >= Math.max(candleBody * 1.5, lowerWick * 1.5) && closeLocation <= 0.4) {
      candidates.push({ kind: "rejection_upper", time: candle.time });
    }

    const compressionBaseline = recentActive(candles, index, 6);
    if (isConfirmedCompression(candle, previous, compressionBaseline)) {
      candidates.push({ kind: "compression", time: candle.time });
    }

    if (index >= 2) {
      const first = candles[index - 2]!;
      const middle = previous;
      const firstBody = body(first);
      const middleBody = body(middle);
      const firstBullish = first.close > first.open;
      const firstIsActive = active(first);
      const middleSmall = firstIsActive && firstBody >= bodyBaseline && middleBody <= firstBody * 0.45;
      const preFirstCandles = recentActive(candles, index - 2, 3);
      const moveBeforeFirst = preFirstCandles.length >= 2
        ? first.close - preFirstCandles[0]!.open
        : 0;
      const closesThroughFirstMidpoint = candle.close > (first.open + first.close) / 2;
      const closesBelowFirstMidpoint = candle.close < (first.open + first.close) / 2;
      if (middleSmall && !firstBullish && bullish &&
          candleBody >= Math.max(firstBody * 0.55, bodyBaseline * 0.8) &&
          moveBeforeFirst <= -medianRange && closesThroughFirstMidpoint) {
        candidates.push({ kind: "morning_star_bullish", time: candle.time });
      } else if (middleSmall && firstBullish && !bullish &&
          candleBody >= Math.max(firstBody * 0.55, bodyBaseline * 0.8) &&
          moveBeforeFirst >= medianRange && closesBelowFirstMidpoint) {
        candidates.push({ kind: "evening_star_bearish", time: candle.time });
      }

      const threeStrongBodies = firstIsActive && [first, middle, candle].every((candidate) =>
        body(candidate) >= bodyBaseline * 0.7 && body(candidate) / range(candidate) >= 0.55);
      const progressiveBullishCloses = firstBullish && middle.close > middle.open && bullish &&
        middle.close > first.close && candle.close > middle.close &&
        opensInsideBody(middle, first) && opensInsideBody(candle, middle);
      const progressiveBearishCloses = !firstBullish && middle.close < middle.open && !bullish &&
        middle.close < first.close && candle.close < middle.close &&
        opensInsideBody(middle, first) && opensInsideBody(candle, middle);
      if (threeStrongBodies && progressiveBullishCloses && moveBeforeFirst <= -medianRange) {
        candidates.push({ kind: "three_white_soldiers_bullish", time: candle.time });
      } else if (threeStrongBodies && progressiveBearishCloses && moveBeforeFirst >= medianRange) {
        candidates.push({ kind: "three_black_crows_bearish", time: candle.time });
      }

      const compressed = candles[index - 1]!;
      const container = candles[index - 2]!;
      const baseline = recentActive(candles, index - 1, 6);
      if (isConfirmedCompression(compressed, container, baseline)) {
        const activeBreak = candleRange >= medianRange * 1.1 && candle.volume >= medianVolume * 1.2;
        const minimumBreakDistance = medianRange * 0.1;
        if (bodyShare >= 0.55 && activeBreak && closeLocation >= 0.75 &&
            candle.close - container.high >= minimumBreakDistance) {
          candidates.push({ kind: "compression_break_bullish", time: candle.time });
        } else if (bodyShare >= 0.55 && activeBreak && closeLocation <= 0.25 &&
            container.low - candle.close >= minimumBreakDistance) {
          candidates.push({ kind: "compression_break_bearish", time: candle.time });
        }
      }
    }

    const lookback20 = recentActive(candles, index, 20);
    if (!confirmation || !active(confirmation) || lookback20.length < 8) continue;
    const medianVolume20 = median(lookback20.map((item) => item.volume));
    const medianRange20 = median(lookback20.map(range));
    const priorMoveCandles = recentActive(candles, index, 5);
    if (medianVolume20 <= 0 || medianRange20 <= 0 || priorMoveCandles.length < 4) continue;

    const directionalMove = previous.close - priorMoveCandles[0]!.open;
    const extendedMove = Math.abs(directionalMove) >= medianRange20 * 2.5;
    const exceptionalActivity = candle.volume >= medianVolume20 * 3 && candleRange >= medianRange20 * 1.4;
    const localHigh = candle.high >= Math.max(...priorMoveCandles.map((item) => item.high));
    const localLow = candle.low <= Math.min(...priorMoveCandles.map((item) => item.low));
    const upwardFailure = directionalMove > 0 && localHigh && upperWick / candleRange >= 0.25 &&
      closeLocation <= 0.7 && confirmation.close < midpoint;
    const downwardFailure = directionalMove < 0 && localLow && lowerWick / candleRange >= 0.25 &&
      closeLocation >= 0.3 && confirmation.close > midpoint;
    if (extendedMove && exceptionalActivity && (upwardFailure || downwardFailure)) {
      candidates.push({ kind: "high_volume_exhaustion", time: candle.time });
    }
  }
  return selectOnePatternPerCandle(candidates);
}
