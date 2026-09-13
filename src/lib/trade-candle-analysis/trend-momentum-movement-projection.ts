import Decimal from "decimal.js";
import type { DailyTradeAnalyzerResult } from "../../modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { NormalizedMarketCandle } from "../../modules/level-analysis/contracts/candle-review-contracts";
import type { TradeAnalysisExcursionRow, TradeAnalysisEventPathRow } from "../../modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { readExecutionIndicatorFilterContext } from "./trend-momentum-execution-filter";

export function summarizeSavedIndicatorMovement(rows: readonly TradeAnalysisExcursionRow[]) {
  const average = (values: readonly string[]) => values.length ? values.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(values.length).toFixed() : null;
  const median = (values: readonly string[]) => {
    if (!values.length) return null;
    const sorted = values.map((value) => new Decimal(value)).sort((a, b) => a.comparedTo(b));
    const middle = Math.floor(sorted.length / 2);
    return (sorted.length % 2 ? sorted[middle]! : sorted[middle - 1]!.plus(sorted[middle]!).div(2)).toFixed();
  };
  const summarize = (selected: readonly TradeAnalysisExcursionRow[]) => ({
    averageAdverseMoveDecimal: average(selected.map((row) => row.adverseMoveDecimal)),
    averageFavorableMoveDecimal: average(selected.map((row) => row.favorableMoveDecimal)),
    medianAdverseMoveDecimal: median(selected.map((row) => row.adverseMoveDecimal)),
    medianFavorableMoveDecimal: median(selected.map((row) => row.favorableMoveDecimal)),
    measuredExecutionCount: selected.length,
  });
  const number = (value: string | null) => value === null ? null : Number(value);
  const percent = (selected: readonly TradeAnalysisExcursionRow[]) => ({
    averageAdverseMovePercent: number(average(selected.map((row) => String(row.adverseMovePercent)))),
    averageFavorableMovePercent: number(average(selected.map((row) => String(row.favorableMovePercent)))),
    medianAdverseMovePercent: number(median(selected.map((row) => String(row.adverseMovePercent)))),
    medianFavorableMovePercent: number(median(selected.map((row) => String(row.favorableMovePercent)))),
  });
  return { entryOpportunityRisk: summarize(rows), mfeMae: { ...percent(rows),
    breakdown: ["Entries", "Adds", "Long", "Short"].map((label) => {
      const selected = rows.filter((row) => label === "Entries" ? row.eventKind === "Entry" : label === "Adds" ? row.eventKind === "Add" : row.direction === label.toLowerCase());
      return { label, ...summarize(selected), ...percent(selected) };
    }).filter((row) => row.measuredExecutionCount > 0) } };
}

export function projectSavedIndicatorMovement(input: Readonly<{
  analyzed: DailyTradeAnalyzerResult; candles: readonly NormalizedMarketCandle[];
  identity: Readonly<{ roundTripId: string; symbol: string; direction: "long" | "short"; closeDate: string; trackerDate: string }>;
  pnlDecimal: string | null; multiplier: string; timezone: string;
}>) {
  const rate = new Decimal(input.multiplier);
  if (!rate.isFinite() || rate.lte(0)) throw new Error("movement_reporting_rate_invalid");
  const candles = new Map(input.candles.map((candle) => [candle.time, candle]));
  const snapshots = [...input.analyzed.eventSnapshots].sort((a, b) => a.event.sequence - b.event.sequence);
  const excursions: TradeAnalysisExcursionRow[] = [], eventPaths: TradeAnalysisEventPathRow[] = [];
  const scale = (value: string) => new Decimal(value).mul(rate).toFixed();
  let entries = 0;
  for (const snapshot of snapshots) {
    const event = snapshot.event;
    if (event.kind !== "entry" && event.kind !== "add") continue;
    const at = Date.parse(event.executedAtUtc) / 1000;
    const minute = Math.floor(at / 60) * 60;
    const closure = snapshots.find((candidate) => candidate.event.sequence > event.sequence &&
      (candidate.event.kind === "temporary_flat" || candidate.event.kind === "final_exit"))?.event;
    if (!Number.isFinite(at) || !closure) continue;
    const indicatorFilterContext = readExecutionIndicatorFilterContext(snapshot.indicatorFilterContext, event);
    const kind = event.kind === "add" ? "Add" : entries++ === 0 ? "Initial entry" : "Re-entry";
    const price = new Decimal(event.priceDecimal);
    const closedAt = Date.parse(closure.executedAtUtc) / 1000;
    if (!Number.isFinite(closedAt) || closedAt < at) continue;
    const finalMinute = Math.floor(closedAt / 60) * 60;
    const complete = (end: number) => {
      if (end >= minute + 60 && (end - minute) / 60 > candles.size) return false;
      for (let time = minute + 60; time <= end; time += 60) if (!candles.has(time)) return false;
      return true;
    };
    const move = (high: Decimal, low: Decimal) => ({
      favorable: input.identity.direction === "long" ? high.minus(price) : price.minus(low),
      adverse: input.identity.direction === "long" ? price.minus(low) : high.minus(price),
    });
    if (complete(finalMinute - 60)) {
      const closingPrice = new Decimal(closure.priceDecimal);
      const end = move(closingPrice, closingPrice);
      let favorable = Decimal.max(0, end.favorable), adverse = Decimal.max(0, end.adverse);
      for (let time = minute + 60; time < finalMinute; time += 60) {
        const candle = candles.get(time)!;
        const measured = move(new Decimal(candle.highDecimal), new Decimal(candle.lowDecimal));
        favorable = Decimal.max(favorable, measured.favorable); adverse = Decimal.max(adverse, measured.adverse);
      }
      excursions.push({ ...input.identity, indicatorFilterContext,
      actualPnlDecimal: input.pnlDecimal, entryPriceDecimal: scale(event.priceDecimal), eventKind: event.kind === "add" ? "Add" : "Entry",
      executionSequence: event.sequence, minutesUntilFlat: (closedAt - at) / 60,
      favorableMoveDecimal: scale(favorable.toFixed()), adverseMoveDecimal: scale(adverse.toFixed()),
      favorableMovePercent: favorable.div(price).mul(100).toNumber(),
      adverseMovePercent: adverse.div(price).mul(100).toNumber(),
    });
    }
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: input.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(event.executedAtUtc));
    const minutes = Number(parts.find((part) => part.type === "hour")?.value) * 60 + Number(parts.find((part) => part.type === "minute")?.value);
    const session: TradeAnalysisEventPathRow["session"] = minutes < 570 ? "Premarket" : minutes < 960 ? "Regular hours" : "After-hours";
    for (const horizon of [5, 15, 30, 60] as const) {
      const last = minute + horizon * 60 - 60;
      let favorable = new Decimal(0), adverse = new Decimal(0);
      const covered = complete(last);
      if (covered) for (let time = minute + 60; time <= last; time += 60) {
        const candle = candles.get(time)!;
        const high = new Decimal(candle.highDecimal), low = new Decimal(candle.lowDecimal);
        favorable = Decimal.max(favorable, input.identity.direction === "long" ? high.minus(price) : price.minus(low));
        adverse = Decimal.max(adverse, input.identity.direction === "long" ? price.minus(low) : high.minus(price));
      }
      eventPaths.push({ ...input.identity, indicatorFilterContext, eventKind: kind, eventPriceDecimal: scale(event.priceDecimal),
        executedAtUtc: event.executedAtUtc, eventSequence: event.sequence, session, minutesAfterEvent: horizon,
        observedAtCandleTime: covered ? last : null, favorableMoveDecimal: covered ? scale(favorable.toFixed()) : null,
        adverseMoveDecimal: covered ? scale(adverse.toFixed()) : null });
    }
  }
  return { excursions, eventPaths };
}
