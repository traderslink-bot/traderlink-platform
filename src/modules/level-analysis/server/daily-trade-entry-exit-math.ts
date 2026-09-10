import Decimal from "decimal.js";

export type EntryExitPriceEvent = Readonly<{
  eventKind: "entry" | "add" | "partial_exit" | "final_exit";
  executedAtUtc: string;
  priceDecimal: string;
  quantityDecimal: string;
  feesDecimal: string | null;
}>;

export type EntryExitPriceCandle = Readonly<{
  candle_time_utc_seconds: number;
  high_decimal: string;
  low_decimal: string;
}>;

/** Whole saved-trade profit, including realized exits and only shares still held.
 * Full ranges of candles containing executions are excluded: OHLC cannot order
 * those prices against a fill. Flat gaps between round trips are not holdings.
 */
export function entryExitPeakProfit(
  events: readonly EntryExitPriceEvent[],
  candles: readonly EntryExitPriceCandle[],
  direction: "long" | "short",
  basis: "gross" | "net",
): string | null {
  if (events.length === 0 || (basis === "net" && events.some((event) => event.feesDecimal === null))) return null;
  const candleMap = new Map(candles.map((candle) => [candle.candle_time_utc_seconds, candle]));
  let quantity = new Decimal(0);
  let averageEntry = new Decimal(0);
  let realized = new Decimal(0);
  let fees = new Decimal(0);
  let peak: Decimal | null = null;
  const profitAt = (price: Decimal) => realized.plus(
    (direction === "long" ? price.minus(averageEntry) : averageEntry.minus(price)).mul(quantity),
  ).plus(basis === "net" ? fees : 0);
  const record = (price: Decimal) => { peak = Decimal.max(peak ?? profitAt(price), profitAt(price)); };
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    const price = new Decimal(event.priceDecimal);
    const amount = new Decimal(event.quantityDecimal);
    if (!price.gt(0) || !amount.gt(0)) return null;
    if (quantity.gt(0)) record(price);
    if (event.eventKind === "entry" || event.eventKind === "add") {
      averageEntry = averageEntry.mul(quantity).plus(price.mul(amount)).div(quantity.plus(amount));
      quantity = quantity.plus(amount);
    } else {
      if (amount.gt(quantity)) return null;
      realized = realized.plus((direction === "long" ? price.minus(averageEntry) : averageEntry.minus(price)).mul(amount));
      quantity = quantity.minus(amount);
    }
    fees = fees.plus(event.feesDecimal ?? "0");
    record(price);
    const following = events[index + 1];
    if (!following || quantity.eq(0)) continue;
    const firstMinute = Math.floor(Date.parse(event.executedAtUtc) / 60_000) * 60 + 60;
    const followingMinute = Math.floor(Date.parse(following.executedAtUtc) / 60_000) * 60;
    if (!Number.isFinite(firstMinute) || !Number.isFinite(followingMinute) || followingMinute < firstMinute - 60) return null;
    if ((followingMinute - firstMinute) / 60 > candleMap.size) return null;
    for (let time = firstMinute; time < followingMinute; time += 60) {
      const candle = candleMap.get(time);
      if (!candle) return null;
      record(new Decimal(direction === "long" ? candle.high_decimal : candle.low_decimal));
    }
  }
  return quantity.eq(0) && peak !== null ? new Decimal(peak).toString() : null;
}
