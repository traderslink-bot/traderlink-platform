import Decimal from "decimal.js";
import type { DailyTradeProfitProtectionOutcome } from "../contracts/daily-trade-analyzer-contracts";
import type { DailyTradeV2ScenarioAnalysis } from "./daily-trade-v2-scenario-analyzer";
import type { TradeAnalysisMeaningfulProfitRow, TradeAnalysisScalingOutRow } from "./daily-trade-long-term-analytics-service";

/** Keep the verified member's cash-flow difference, but display whole-trade totals. */
export function wholeTradeProfitProtection(outcomes: readonly DailyTradeProfitProtectionOutcome[], wholeGross: string): DailyTradeProfitProtectionOutcome {
  const comparable = outcomes.filter((row) => "counterfactualGrossResultDecimal" in row);
  if (comparable.length !== 1) return { status: "comparison_unavailable", reductionPercentDecimal: null };
  const outcome = comparable[0];
  const difference = new Decimal(outcome.counterfactualGrossResultDecimal).minus(outcome.actualGrossResultDecimal);
  return { ...outcome, actualGrossResultDecimal: wholeGross,
    counterfactualGrossResultDecimal: new Decimal(wholeGross).plus(difference).toFixed() };
}

export function savedTradeScalingRows(trades: readonly Readonly<{
  tradeId: string; closeLocalDate: string; entryLocalDate: string; direction: "long" | "short"; symbol: string;
  scenario: DailyTradeV2ScenarioAnalysis; actualPnlDecimal: string | null;
  profitProtection: DailyTradeProfitProtectionOutcome;
}>[], basis: "gross" | "net") {
  const meaningful: TradeAnalysisMeaningfulProfitRow[] = [], scaling: TradeAnalysisScalingOutRow[] = [];
  const seen = new Set<string>();
  for (const trade of trades) {
    if (seen.has(trade.tradeId)) throw new Error("Duplicate saved scaling trade");
    seen.add(trade.tradeId);
    const q = trade.scenario.primaryQualification, scale = trade.scenario.scaleOut, pnl = trade.actualPnlDecimal;
    if (!q || pnl === null) continue;
    const final = basis === "gross" ? trade.scenario.calculatedFinalGrossResultDecimal : trade.scenario.calculatedFinalNetResultDecimal;
    const potential = basis === "gross" ? q.calculatedGrossResultDecimal : q.calculatedNetResultDecimal;
    if (final === null || potential === null || new Decimal(final).minus(pnl).abs().gt("0.02")) continue;
    const shared = { actualPnlDecimal: pnl, closeDate: trade.closeLocalDate, direction: trade.direction,
      roundTripId: trade.tradeId, symbol: trade.symbol, trackerDate: trade.entryLocalDate,
      scaledOutWhileGreen: scale.eventCount > 0, requiredCloseCount: q.requiredCloseCount, thresholdPercent: q.thresholdPercent };
    meaningful.push({ ...shared, calculatedPotentialPnlDecimal: potential, differenceDecimal: new Decimal(potential).minus(pnl).toFixed(),
      outcome: new Decimal(pnl).gt(0) ? "ended_green" : new Decimal(pnl).lt(0) ? "ended_red" : "ended_flat",
      profitLevelPriceDecimal: q.closePriceDecimal, qualifiedAtUtcSeconds: q.qualifiedAtUtcSeconds });
    scaling.push({ ...shared, maximumOpenQuantityDecimal: scale.maximumOpenQuantityDecimal,
      positionReducedPercent: scale.positionReducedPercent, profitSecuredGrossDecimal: scale.profitSecuredGrossDecimal,
      profitProtection: trade.profitProtection, remainingQuantityDecimal: scale.remainingQuantityDecimal,
      scaledQuantityDecimal: scale.scaledQuantityDecimal });
  }
  const order = (a: TradeAnalysisScalingOutRow, b: TradeAnalysisScalingOutRow) => b.closeDate.localeCompare(a.closeDate) || a.symbol.localeCompare(b.symbol) || a.roundTripId.localeCompare(b.roundTripId);
  scaling.sort(order);
  meaningful.sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.symbol.localeCompare(b.symbol) || a.roundTripId.localeCompare(b.roundTripId));
  return { meaningful, scaling };
}
