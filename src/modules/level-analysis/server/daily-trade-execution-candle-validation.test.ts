import { describe, expect, it } from "vitest";

import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import type { DailyTradeAnalyzerEvent } from "../contracts/daily-trade-analyzer-contracts";
import { validateDailyTradeExecutionCandles } from "./daily-trade-execution-candle-validation";

function candle(time: number, low: string, high: string): NormalizedMarketCandle {
  return Object.freeze({
    closeDecimal: low,
    highDecimal: high,
    lowDecimal: low,
    openDecimal: low,
    time,
    turnoverDecimal: null,
    volumeDecimal: "100",
  });
}

function event(input: Readonly<{
  at: string;
  id: string;
  kind?: DailyTradeAnalyzerEvent["kind"];
  price: string;
  sequence: number;
}>): DailyTradeAnalyzerEvent {
  return Object.freeze({
    eventId: input.id,
    executedAtUtc: input.at,
    feesDecimal: null,
    kind: input.kind ?? "entry",
    priceDecimal: input.price,
    quantityDecimal: "500",
    sequence: input.sequence,
  });
}

describe("validateDailyTradeExecutionCandles", () => {
  it("accepts prices exactly on both inclusive candle boundaries", () => {
    const minute = Date.parse("2026-08-28T13:00:00.000Z") / 1000;
    expect(validateDailyTradeExecutionCandles({
      candles: [candle(minute, "7.94", "8.08")],
      direction: "long",
      events: [
        event({ at: "2026-08-28T13:00:01.000Z", id: "low", price: "7.94", sequence: 0 }),
        event({ at: "2026-08-28T13:00:59.999Z", id: "high", price: "8.08", sequence: 1 }),
      ],
    })).toEqual([]);
  });

  it("ignores seconds and matches an extended-hours Eastern minute", () => {
    // 08:00 America/New_York during daylight time is 12:00 UTC.
    const minute = Date.parse("2026-08-28T12:00:00.000Z") / 1000;
    expect(validateDailyTradeExecutionCandles({
      candles: [candle(minute, "6.40", "6.60")],
      direction: "long",
      events: [event({
        at: "2026-08-28T12:00:47.000Z",
        id: "extended-hours",
        price: "6.50",
        sequence: 0,
      })],
    })).toEqual([]);
  });

  it("returns every price and missing-minute mismatch in execution order", () => {
    const nine = Date.parse("2026-08-28T13:00:00.000Z") / 1000;
    const result = validateDailyTradeExecutionCandles({
      candles: [candle(nine, "7.94", "8.08")],
      direction: "long",
      events: [
        event({ at: "2026-08-28T13:00:31.000Z", id: "bad-price", price: "6.50", sequence: 0 }),
        event({ at: "2026-08-28T13:01:22.000Z", id: "missing-minute", kind: "final_exit", price: "8.10", sequence: 1 }),
      ],
    });
    expect(result.map((mismatch) => mismatch.kind)).toEqual([
      "execution_price_outside_candle",
      "execution_minute_unavailable",
    ]);
    expect(result[0]).toMatchObject({
      candleHighDecimal: "8.08",
      candleLowDecimal: "7.94",
      enteredPriceDecimal: "6.50",
      side: "buy",
    });
    expect(result[1]).toMatchObject({
      candleHighDecimal: null,
      candleLowDecimal: null,
      side: "sell",
    });
  });
});
