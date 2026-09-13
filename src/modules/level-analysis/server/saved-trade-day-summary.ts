import Decimal from "decimal.js";
import type { SavedPatternTrade } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import type { DailyTradeV2ScenarioAnalysis } from "./daily-trade-v2-scenario-analyzer";

/** All Day cards use the same current, final-close-selected saved trades. */
export function savedTradeDaySummary(
  trades: readonly SavedPatternTrade[], eligibleTradeCount: number,
  scenarios: readonly { tradeId: string; scenario: DailyTradeV2ScenarioAnalysis }[],
  basis: "gross" | "net",
) {
  const current = new Map(trades.map((trade) => [trade.tradeId, trade]));
  if (current.size !== trades.length) throw new Error("Duplicate saved trade in Day summary");
  const pnl = trades.flatMap((trade) => trade.pnlDecimal === null ? [] : [new Decimal(trade.pnlDecimal)]);
  const returns = trades.flatMap((trade) => trade.returnPercentDecimal === null ? [] : [new Decimal(trade.returnPercentDecimal)]);
  const qualified = new Set<string>();
  for (const { tradeId, scenario } of scenarios) {
    const trade = current.get(tradeId), qualification = scenario.primaryQualification;
    if (!trade || trade.pnlDecimal === null || !qualification) continue;
    const final = basis === "gross" ? scenario.calculatedFinalGrossResultDecimal : scenario.calculatedFinalNetResultDecimal;
    const potential = basis === "gross" ? qualification.calculatedGrossResultDecimal : qualification.calculatedNetResultDecimal;
    // Preserve the existing financial-reconciliation and fee-completeness rule.
    if (final !== null && potential !== null && new Decimal(final).minus(trade.pnlDecimal).abs().lte("0.02")) qualified.add(tradeId);
  }
  return {
    eligibleDayTradeCount: eligibleTradeCount, analyzedTradeCount: trades.length,
    analyzedExecutionCount: trades.reduce((count, trade) => count + trade.analyzed.eventSnapshots.length, 0),
    coveragePercent: eligibleTradeCount ? trades.length / eligibleTradeCount * 100 : null,
    directionTradeCounts: { long: trades.filter((trade) => trade.direction === "long").length, short: trades.filter((trade) => trade.direction === "short").length },
    totalActualPnlDecimal: pnl.length ? pnl.reduce((sum, value) => sum.plus(value), new Decimal(0)).toFixed() : null,
    averagePnlDecimal: pnl.length ? pnl.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(pnl.length).toFixed() : null,
    averageReturnPercent: returns.length ? returns.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(returns.length).toNumber() : null,
    meaningfulProfitTradeCount: qualified.size,
  };
}
