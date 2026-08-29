import Decimal from "decimal.js";

import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import type { DailyTradeAnalyzerDirection, DailyTradeAnalyzerEvent } from "../contracts/daily-trade-analyzer-contracts";

export type DailyTradeExecutionCandleMismatch = Readonly<{
  candleHighDecimal: string | null;
  candleLowDecimal: string | null;
  candleTimeUtcSeconds: number;
  enteredPriceDecimal: string;
  event: DailyTradeAnalyzerEvent;
  kind: "execution_minute_unavailable" | "execution_price_outside_candle";
  side: "buy" | "sell";
}>;

function minuteUtcSeconds(executedAtUtc: string): number {
  return Math.floor(Date.parse(executedAtUtc) / 60_000) * 60;
}

function sideFor(direction: DailyTradeAnalyzerDirection, event: DailyTradeAnalyzerEvent): "buy" | "sell" {
  const opensPosition = event.kind === "entry" || event.kind === "add";
  return direction === "long"
    ? (opensPosition ? "buy" : "sell")
    : (opensPosition ? "sell" : "buy");
}

/**
 * Matches executions to their containing one-minute candle. Seconds are
 * intentionally discarded because the Analyzer consumes minute candles.
 */
export function validateDailyTradeExecutionCandles(input: Readonly<{
  candles: readonly NormalizedMarketCandle[];
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
}>): readonly DailyTradeExecutionCandleMismatch[] {
  const candlesByMinute = new Map(input.candles.map((candle) => [candle.time, candle]));
  return Object.freeze(input.events.flatMap<DailyTradeExecutionCandleMismatch>((event) => {
    const candleTimeUtcSeconds = minuteUtcSeconds(event.executedAtUtc);
    const side = sideFor(input.direction, event);
    const candle = candlesByMinute.get(candleTimeUtcSeconds);
    if (!candle) {
      return [Object.freeze({
        candleHighDecimal: null,
        candleLowDecimal: null,
        candleTimeUtcSeconds,
        enteredPriceDecimal: event.priceDecimal,
        event,
        kind: "execution_minute_unavailable" as const,
        side,
      })];
    }
    const price = new Decimal(event.priceDecimal);
    if (price.greaterThanOrEqualTo(candle.lowDecimal) && price.lessThanOrEqualTo(candle.highDecimal)) {
      return [];
    }
    return [Object.freeze({
      candleHighDecimal: candle.highDecimal,
      candleLowDecimal: candle.lowDecimal,
      candleTimeUtcSeconds,
      enteredPriceDecimal: event.priceDecimal,
      event,
      kind: "execution_price_outside_candle" as const,
      side,
    })];
  }));
}
