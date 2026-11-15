import {matchesIndependentCoachingTrade,type IndependentCoachingTradeIdentity} from './independent-coaching-trade-selection';

/** One effective period for reports and native trade evidence. Callers supply
 * only current trades from the already-authorized student account. */
export function independentCoachingReviewPeriod(
  review: {periodStart:string|null;periodEnd:string|null;selectedDays:readonly string[]},
  selected: readonly {roundTripId:string;logicalTradeId:string}[],
  trades: readonly (IndependentCoachingTradeIdentity & {tradingDate:string})[],
): {start:string|null;end:string|null} {
  const ids=[...new Set(selected.flatMap(trade=>[trade.roundTripId,trade.logicalTradeId]))];
  const dates=trades.filter(trade=>ids.some(id=>matchesIndependentCoachingTrade(trade,id))).map(trade=>trade.tradingDate).sort();
  return {
    start:review.periodStart??review.selectedDays[0]??dates[0]??null,
    end:review.periodEnd??[...review.selectedDays].sort().at(-1)??dates.at(-1)??null,
  };
}
