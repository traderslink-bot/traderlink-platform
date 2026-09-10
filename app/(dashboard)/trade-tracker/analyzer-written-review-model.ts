import Decimal from "decimal.js";
import { analyzeDailyTradeGreenToRed } from "@/src/modules/level-analysis/server/daily-trade-green-to-red-analyzer";
import type { DaySessionTradeAnalyzer } from "./[sessionDate]/day-session-types";

export type WrittenReviewFill = { id: string; time: number; label: string; quantity: string; price: string; remaining: string; grossPnl: string | null };

/** Rebuild from saved fills, not the already fee-adjusted stored path. */
export function buildWrittenTradeReview(analysis: DaySessionTradeAnalyzer, direction: "long" | "short") {
  const basis = analysis.reviewContext?.basis ?? "gross";
  const events = [...analysis.events].sort((a, b) => Date.parse(a.executedAt) - Date.parse(b.executedAt) || a.sequence - b.sequence);
  const fills: WrittenReviewFill[] = [];
  const points: Array<{ time: number; pnl: Decimal }> = [];
  let quantity = new Decimal(0), average = new Decimal(0), realized = new Decimal(0), fees = new Decimal(0);
  let peak = new Decimal(0), peakTime: number | null = null, hadReduction = false;
  const candles = [...analysis.candles].sort((a, b) => a.time - b.time);
  let candleIndex = 0;
  const move = (price: Decimal) => direction === "long" ? price.minus(average) : average.minus(price);
  const mark = (price: Decimal, time: number) => {
    const pnl = realized.plus(move(price).times(quantity)).plus(basis === "net" ? fees : 0);
    points.push({ time, pnl });
    if (pnl.gt(peak)) { peak = pnl; peakTime = time; }
  };
  try {
    const ids = new Set<string>();
    for (const event of events) {
      const time = Date.parse(event.executedAt) / 1000;
      const price = new Decimal(event.price), size = new Decimal(event.quantity);
      if (!Number.isFinite(time) || !price.isFinite() || !price.gt(0) || !size.isFinite() || !size.gt(0) || ids.has(event.eventId)) return null;
      ids.add(event.eventId);
      while (candleIndex < candles.length && candles[candleIndex]!.time + 60 <= time) {
        const candle = candles[candleIndex++]!;
        const close = new Decimal(candle.close);
        if (!close.isFinite() || !close.gt(0) || !Number.isFinite(candle.time)) return null;
        if (quantity.gt(0)) mark(close, candle.time + 60);
      }
      const opening = event.kind === "entry" || event.kind === "add";
      let label: string, grossPnl: string | null = null;
      if (opening) {
        label = quantity.isZero() ? (fills.length ? "Re-entered" : "Opened position") : "Added shares";
        if (quantity.isZero()) hadReduction = false;
        average = average.times(quantity).plus(price.times(size)).div(quantity.plus(size));
        quantity = quantity.plus(size);
      } else {
        if (quantity.lt(size)) return null;
        const profit = move(price).times(size);
        realized = realized.plus(profit);
        grossPnl = profit.toFixed();
        quantity = quantity.minus(size);
        label = quantity.isZero() ? (hadReduction ? "Final scale-out · position closed" : "Full exit · all shares at once") : "Partial exit";
        hadReduction = true;
      }
      if (event.fees !== null) {
        const fee = new Decimal(event.fees);
        if (!fee.isFinite()) return null;
        fees = fees.plus(fee);
      }
      mark(price, time);
      fills.push({ id: event.eventId, time, label, quantity: size.toFixed(), price: price.toFixed(), remaining: quantity.toFixed(), grossPnl });
    }
    if (!events.length || !quantity.isZero() || events.at(-1)?.kind !== "final_exit") return null;
    const path = analyzeDailyTradeGreenToRed({
      direction, candles: candles.map(candle => ({ time: candle.time, closeDecimal: candle.close })),
      events: events.map(event => ({ eventId: event.eventId, executedAtUtc: event.executedAt, sequence: event.sequence,
        kind: event.kind, priceDecimal: event.price, quantityDecimal: event.quantity, feesDecimal: basis === "gross" ? "0" : event.fees })),
    });
    // A candle close and the following fill can share a timestamp. Their sequence still matters.
    const firstGreenIndex = points.findIndex(point => point.pnl.toDecimalPlaces(2).gt(0));
    const redOffset = firstGreenIndex < 0 ? -1 : points.slice(firstGreenIndex + 1).findIndex(point => point.pnl.toDecimalPlaces(2).lt(0));
    const redIndex = redOffset < 0 ? -1 : firstGreenIndex + 1 + redOffset;
    const recovery = redIndex < 0 ? null : points.slice(redIndex + 1).find(point => point.pnl.toDecimalPlaces(2).gt(0));
    const completePath = path.status === "unavailable" ? path : { ...path, firstRecoveryAtUtcSeconds: recovery?.time ?? null };
    return { basis, fills, path: completePath, peak: peak.toFixed(), peakTime: peak.toDecimalPlaces(2).isZero() ? null : peakTime, grossPnl: realized.toFixed(),
      finalPnl: realized.plus(basis === "net" ? fees : 0).toFixed(), fees: fees.toFixed(),
      feesComplete: events.every(event => event.fees !== null),
      entryCount: events.filter(event => event.kind === "entry" || event.kind === "add").length,
      exitCount: events.filter(event => event.kind !== "entry" && event.kind !== "add").length };
  } catch { return null; }
}
