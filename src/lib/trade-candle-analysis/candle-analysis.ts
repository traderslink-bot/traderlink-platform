export type CandleDirection = "long" | "short";

export type TradeCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
  volume: number;
};

export type CandleAnalysisTrade = {
  direction: CandleDirection;
  entryPrice: number;
  entryTime: number;
  exitPrice: number;
  exitTime: number;
};

export type CandleFeedback =
  | {
      detail: string;
      kind: "finding";
      title: string;
    }
  | {
      detail: string;
      kind: "no_feedback";
      title: "No feedback";
    };

export type TradeCandleAnalysis = {
  entryTiming: CandleFeedback;
  exitTiming: CandleFeedback;
  profitGiveback: CandleFeedback;
};

function isObservedCandle(candle: TradeCandle | undefined): candle is TradeCandle {
  return Boolean(
    candle &&
      [
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
      ].every(Number.isFinite) &&
      candle.volume > 0,
  );
}

function observedCandlesInWindow(
  candles: readonly TradeCandle[],
  startExclusive: number,
  endInclusive: number,
): readonly TradeCandle[] | null {
  const byTime = new Map(candles.map((candle) => [candle.time, candle]));
  const expectedBarCount = Math.floor((endInclusive - startExclusive) / 60);
  if (expectedBarCount <= 0) return null;

  const observed: TradeCandle[] = [];
  for (let index = 1; index <= expectedBarCount; index += 1) {
    const candle = byTime.get(startExclusive + index * 60);
    if (!isObservedCandle(candle)) return null;
    observed.push(candle);
  }
  return observed;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(4)}`;
}

function formatTime(time: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(time * 1000));
}

function noFeedback(detail: string): CandleFeedback {
  return { kind: "no_feedback", title: "No feedback", detail };
}

function peak(candles: readonly TradeCandle[], direction: CandleDirection): TradeCandle {
  return candles.reduce((best, candle) =>
    direction === "long"
      ? candle.high > best.high
        ? candle
        : best
      : candle.low < best.low
        ? candle
        : best,
  );
}

export function analyzeTradeCandles(args: {
  candles: readonly TradeCandle[];
  trade: CandleAnalysisTrade;
}): TradeCandleAnalysis {
  const { candles, trade } = args;
  const heldWindow = observedCandlesInWindow(candles, trade.entryTime, trade.exitTime);
  const primaryExitWindow = observedCandlesInWindow(
    candles,
    trade.exitTime,
    trade.exitTime + 30 * 60,
  );
  const contextualExitWindow = observedCandlesInWindow(
    candles,
    trade.exitTime + 30 * 60,
    trade.exitTime + 60 * 60,
  );
  const preEntryWindow = observedCandlesInWindow(
    candles,
    trade.entryTime - 30 * 60,
    trade.entryTime,
  );
  const postEntryWindow = observedCandlesInWindow(
    candles,
    trade.entryTime,
    trade.entryTime + 30 * 60,
  );

  const profitGiveback = !heldWindow
    ? noFeedback("The held-position candle window is incomplete or lacked active volume.")
    : (() => {
        const observedPeak = peak(heldWindow, trade.direction);
        const leftFromPeak =
          trade.direction === "long"
            ? observedPeak.high - trade.exitPrice
            : trade.exitPrice - observedPeak.low;
        if (leftFromPeak <= 0) {
          return {
            kind: "finding" as const,
            title: "Exit was at the observed held-position extreme.",
            detail: `The observed ${trade.direction === "long" ? "high" : "low"} while held was ${formatPrice(trade.direction === "long" ? observedPeak.high : observedPeak.low)}.`,
          };
        }
        return {
          kind: "finding" as const,
          title: `Observed ${formatPrice(leftFromPeak)} remained from the held-position peak.`,
          detail: `The observed ${trade.direction === "long" ? "high" : "low"} while held was ${formatPrice(trade.direction === "long" ? observedPeak.high : observedPeak.low)}; the exit was ${formatPrice(trade.exitPrice)}.`,
        };
      })();

  const exitTiming = !primaryExitWindow
    ? noFeedback("The first 30 minutes after exit are incomplete or lacked active-volume candles.")
    : (() => {
        const primaryExtreme = peak(primaryExitWindow, trade.direction);
        const continuation =
          trade.direction === "long"
            ? primaryExtreme.high - trade.exitPrice
            : trade.exitPrice - primaryExtreme.low;
        if (continuation <= 0) {
          return {
            kind: "finding" as const,
            title: "No favorable post-exit continuation was observed in 30 minutes.",
            detail: "The primary review window is complete; this states only the observed price path.",
          };
        }
        const context = contextualExitWindow
          ? peak(contextualExitWindow, trade.direction)
          : null;
        const persisted =
          context &&
          (trade.direction === "long"
            ? context.high > primaryExtreme.high
            : context.low < primaryExtreme.low);
        return {
          kind: "finding" as const,
          title: `Price continued ${trade.direction === "long" ? "higher" : "lower"} after exit.`,
          detail: `The observed ${trade.direction === "long" ? "high" : "low"} reached ${formatPrice(trade.direction === "long" ? primaryExtreme.high : primaryExtreme.low)} at ${formatTime(primaryExtreme.time)} in the first 30 minutes after the ${formatPrice(trade.exitPrice)} exit.${persisted ? " The continuation also extended in the 30-to-60-minute context." : ""}`,
        };
      })();

  const entryTiming = !preEntryWindow || !postEntryWindow
    ? noFeedback("The required 30-minute windows before and after entry are incomplete or lacked active-volume candles.")
    : (() => {
        const postEntryExtreme = peak(postEntryWindow, trade.direction);
        const favorableMove =
          trade.direction === "long"
            ? postEntryExtreme.high - trade.entryPrice
            : trade.entryPrice - postEntryExtreme.low;
        if (favorableMove <= 0) {
          return {
            kind: "finding" as const,
            title: "No favorable continuation was observed in the first 30 minutes.",
            detail: "This is an observed path, not an assertion that another entry was achievable.",
          };
        }
        return {
          kind: "finding" as const,
          title: "Observed favorable continuation followed entry.",
          detail: `The observed ${trade.direction === "long" ? "high" : "low"} reached ${formatPrice(trade.direction === "long" ? postEntryExtreme.high : postEntryExtreme.low)} at ${formatTime(postEntryExtreme.time)} after the ${formatPrice(trade.entryPrice)} entry.`,
        };
      })();

  return { profitGiveback, exitTiming, entryTiming };
}

export function compactCandlesToFiveMinutes(
  candles: readonly TradeCandle[],
): readonly TradeCandle[] {
  const compacted: TradeCandle[] = [];
  for (let index = 0; index + 4 < candles.length; index += 5) {
    const group = candles.slice(index, index + 5);
    if (!group.every(isObservedCandle)) continue;
    compacted.push({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map((candle) => candle.high)),
      low: Math.min(...group.map((candle) => candle.low)),
      close: group[4].close,
      volume: group.reduce((total, candle) => total + candle.volume, 0),
    });
  }
  return compacted;
}
