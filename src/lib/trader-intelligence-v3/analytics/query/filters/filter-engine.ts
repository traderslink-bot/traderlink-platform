import type { TradeQueryFilter } from "../contracts/query-plan";
import { compareRatioToDecimal, type QueryRowSemantics } from "../execution/row-semantics";

function withinBigInt(value: bigint, minimum: string | null, maximum: string | null): boolean {
  return (minimum === null || value >= BigInt(minimum)) &&
    (maximum === null || value <= BigInt(maximum));
}

function matches(row: QueryRowSemantics, filter: TradeQueryFilter): boolean {
  switch (filter.kind) {
    case "date_range":
      return row.row.sessionDate >= filter.startDate && row.row.sessionDate <= filter.endDate;
    case "account":
      return filter.values.includes(row.row.canonicalAccountKey);
    case "symbol":
      return filter.values.includes(row.row.stableInstrumentKey) ||
        filter.values.includes(row.row.displayedSymbol);
    case "source_identity":
      return row.row.sourceAuthority.state === "available" &&
        filter.values.includes(row.row.sourceAuthority.sourceIdentity);
    case "broker_code":
      return row.row.sourceAuthority.state === "available" &&
        filter.values.includes(row.row.sourceAuthority.brokerCode);
    case "source_kind":
      return row.row.sourceAuthority.state === "available" &&
        filter.values.includes(row.row.sourceAuthority.sourceKind);
    case "charge_coverage": {
      const unknown = row.row.limitationCodes.includes("ti_v3_analytics_charge_coverage_unknown");
      return filter.value === "unknown" ? unknown : !unknown;
    }
    case "direction":
      return filter.values.includes(row.row.direction);
    case "session":
      return filter.values.includes(row.row.session);
    case "entry_session":
      return row.row.entrySession !== null && filter.values.includes(row.row.entrySession);
    case "exit_session":
      return row.row.exitSession !== null && filter.values.includes(row.row.exitSession);
    case "session_transition":
      return row.row.entrySession !== null && row.row.exitSession !== null &&
        filter.values.includes(`${row.row.entrySession}_to_${row.row.exitSession}`);
    case "currency":
      return row.row.currency === filter.value;
    case "realized_outcome":
      return filter.values.includes(row.outcome);
    case "weekday":
      return filter.values.includes(row.row.weekday);
    case "entry_time_range":
      return row.entryTime >= filter.startTime && row.entryTime <= filter.endTime;
    case "exit_time_range":
      return row.exitTime >= filter.startTime && row.exitTime <= filter.endTime;
    case "entry_price_range":
    case "price_range":
      return row.entryPrice !== null &&
        (filter.minimum === null || compareRatioToDecimal(row.entryPrice, filter.minimum) >= 0) &&
        (filter.maximum === null || compareRatioToDecimal(row.entryPrice, filter.maximum) <= 0);
    case "sequence_in_session":
      return withinBigInt(row.sequenceInSession, filter.minimum, filter.maximum);
    case "previous_completed_outcome":
      return filter.values.includes(row.previousCompletedOutcome);
    case "prior_completed_streak":
      return row.priorCompletedStreakOutcome === filter.outcome &&
        row.priorCompletedStreakLength !== null &&
        withinBigInt(row.priorCompletedStreakLength, filter.minimum, filter.maximum);
    case "pre_entry_daily_state":
      return filter.values.includes(row.preEntryDailyState);
      case "pre_entry_daily_path":
        return row.preEntryDailyPathState === "verified" && (
          filter.values.includes("after_first_win") && row.preEntryHasCompletedGain ||
          filter.values.includes("after_first_loss") && row.preEntryHasCompletedLoss ||
          filter.values.includes("after_peak_profit_giveback") && row.preEntryHasPeakProfitGiveback ||
        filter.values.includes("after_green_to_red") && row.preEntryHasGreenToRedTransition ||
        filter.values.includes("after_red_to_green") && row.preEntryHasRedToGreenTransition
      );
    case "holding_time_seconds":
      return withinBigInt(row.holdingSecondsFloor, filter.minimum, filter.maximum);
    case "repeat_attempt":
      return withinBigInt(row.repeatAttempt, filter.minimum, filter.maximum);
    case "share_quantity_range":
      return row.shareQuantity !== null &&
        (filter.minimum === null || compareRatioToDecimal(row.shareQuantity, filter.minimum) >= 0) &&
        (filter.maximum === null || compareRatioToDecimal(row.shareQuantity, filter.maximum) <= 0);
    case "entry_notional_range":
    case "position_size": {
      const value = filter.kind === "position_size" ? row.positionSize : row.entryNotional;
      return value !== null &&
        (filter.minimum === null || compareRatioToDecimal(value, filter.minimum) >= 0) &&
        (filter.maximum === null || compareRatioToDecimal(value, filter.maximum) <= 0);
    }
  }
}

export function applyTradeQueryFilters(
  rows: readonly QueryRowSemantics[],
  filters: readonly TradeQueryFilter[],
): Readonly<{
  readonly included: readonly QueryRowSemantics[];
  readonly excluded: readonly QueryRowSemantics[];
}> {
  const included: QueryRowSemantics[] = [];
  const excluded: QueryRowSemantics[] = [];
  for (const row of rows) (filters.every((filter) => matches(row, filter)) ? included : excluded).push(row);
  return Object.freeze({
    included: Object.freeze(included),
    excluded: Object.freeze(excluded),
  });
}
