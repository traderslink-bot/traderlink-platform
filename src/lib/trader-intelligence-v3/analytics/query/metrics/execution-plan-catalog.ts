import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { TradeQueryFilter, TradeQueryGrouping } from "../contracts";
import {
  TRADE_QUERY_METRIC_KEYS,
  type TradeQueryMetricKey,
} from "./metric-registry";

/**
 * The plan-facing lock for the execution-only engine. It deliberately maps
 * product-plan families to generic query primitives rather than duplicating
 * calculations in a dashboard or agent layer.
 */
export const EXECUTION_PLAN_CATALOG_VERSION =
  "ti_v3_execution_plan_catalog_v1" as const;

export type ExecutionPlanCatalogState =
  | "implemented"
  | "requires_execution_field"
  | "not_execution_derived";

export interface ExecutionPlanCatalogEntry {
  readonly planFamilyKey: string;
  readonly state: ExecutionPlanCatalogState;
  readonly metricKeys: readonly TradeQueryMetricKey[];
  readonly filterKinds: readonly TradeQueryFilter["kind"][];
  readonly groupingKinds: readonly TradeQueryGrouping["kind"][];
  readonly authorityBoundary: string;
}

function entry(
  planFamilyKey: string,
  state: ExecutionPlanCatalogState,
  metricKeys: readonly TradeQueryMetricKey[],
  filterKinds: readonly TradeQueryFilter["kind"][],
  groupingKinds: readonly TradeQueryGrouping["kind"][],
  authorityBoundary: string,
): ExecutionPlanCatalogEntry {
  return Object.freeze({
    planFamilyKey,
    state,
    metricKeys: Object.freeze([...metricKeys].sort(compareUnicodeCodePoints)),
    filterKinds: Object.freeze([...filterKinds].sort(compareUnicodeCodePoints)),
    groupingKinds: Object.freeze([...groupingKinds].sort(compareUnicodeCodePoints)),
    authorityBoundary,
  });
}

export const EXECUTION_PLAN_CATALOG = Object.freeze([
  entry(
    "core_performance",
    "implemented",
    [
      "candidate_count", "included_count", "excluded_count", "inclusion_rate", "exclusion_rate",
      "total_trades", "unique_account_count", "unique_symbol_count", "total_execution_count",
      "average_executions_per_trade", "gross_profit", "gross_loss", "gross_pnl",
      "average_gross_pnl", "median_gross_pnl", "net_pnl", "average_pnl", "median_pnl",
      "best_trade", "worst_trade", "win_count", "loss_count", "flat_count", "win_rate",
      "loss_rate", "flat_rate", "average_winning_trade", "median_winning_trade",
      "average_losing_trade", "median_losing_trade", "total_winning_net_pnl",
      "total_losing_net_pnl", "average_win_loss_ratio", "median_win_loss_ratio",
      "profit_factor", "expectancy", "breakeven_win_rate", "net_pnl_excluding_largest_winner",
      "net_pnl_excluding_largest_loser", "net_pnl_excluding_largest_winner_and_loser",
      "largest_winner_contribution", "largest_loser_contribution",
    ],
    ["account", "currency", "date_range", "realized_outcome"],
    ["aggregate", "account", "direction", "symbol"],
    "Requires closed, currency-partitioned round trips with complete charge coverage for net and outcome facts.",
  ),
  entry(
    "daily_period_time_session",
    "implemented",
    [
      "trading_day_count", "average_trades_per_trading_day", "median_trades_per_trading_day",
      "maximum_trades_per_trading_day", "minimum_trades_per_trading_day", "average_daily_pnl",
      "median_daily_pnl", "best_trading_day", "worst_trading_day", "profitable_trading_day_count",
      "losing_trading_day_count", "flat_trading_day_count", "profitable_day_percentage",
      "losing_day_percentage", "flat_day_percentage", "average_green_day_pnl", "median_green_day_pnl",
      "average_red_day_pnl", "median_red_day_pnl",
    ],
    ["date_range", "entry_time_range", "exit_time_range", "session", "entry_session", "exit_session", "session_transition", "weekday"],
    ["day", "week", "month", "year", "weekday", "session", "entry_session", "exit_session", "session_transition", "time_bucket"],
    "Requires verified entry/exit timestamps, deterministic entry/exit session classification, and complete charge coverage for realized P/L outcomes.",
  ),
  entry(
    "behavior_streak_and_pre_entry_state",
    "implemented",
    [
      "average_attempts_per_symbol", "median_attempts_per_symbol", "repeat_attempt_trade_count",
      "repeat_attempt_percentage", "longest_winning_trade_streak", "longest_losing_trade_streak",
      "current_winning_trade_streak", "current_losing_trade_streak",
    ],
    [
      "previous_completed_outcome", "prior_completed_streak", "pre_entry_daily_state",
      "pre_entry_daily_path", "repeat_attempt", "sequence_in_session",
    ],
    [
      "trade_sequence", "trade_sequence_bucket", "previous_completed_outcome",
      "prior_completed_streak_bucket", "pre_entry_daily_state", "repeat_attempt", "repeat_attempt_bucket",
    ],
    "Requires unambiguous completed-trade chronology; ambiguous same-time outcome paths fail closed.",
  ),
  entry(
    "price_size_hold_and_direction",
    "implemented",
    [
      "long_trade_count", "short_trade_count", "long_trade_percentage", "short_trade_percentage",
      "average_holding_time", "median_holding_time", "minimum_holding_time", "maximum_holding_time",
      "average_winner_holding_time", "average_loser_holding_time", "median_winner_holding_time",
      "median_loser_holding_time", "average_share_quantity", "median_share_quantity", "maximum_share_quantity",
      "average_winner_share_quantity", "median_winner_share_quantity", "average_loser_share_quantity",
      "median_loser_share_quantity", "average_entry_notional", "median_entry_notional",
      "maximum_entry_notional", "average_winner_entry_notional", "average_loser_entry_notional",
      "median_winner_entry_notional", "median_loser_entry_notional", "net_pnl_per_100_shares",
      "return_on_entry_notional", "average_position_size", "median_position_size",
    ],
    [
      "direction", "entry_price_range", "holding_time_seconds", "share_quantity_range",
      "entry_notional_range", "position_size", "symbol",
    ],
    [
      "direction", "entry_price_range", "holding_time_bucket", "share_quantity_bucket",
      "entry_notional_bucket", "position_size_bucket", "symbol", "compound",
    ],
    "Requires the requested timestamp, price, quantity, notional, direction, and instrument facts to be complete.",
  ),
  entry(
    "realized_drawdown_and_giveback",
    "implemented",
    [
      "maximum_intraday_drawdown", "maximum_intraday_realized_drawdown", "maximum_intraday_realized_recovery_from_trough", "maximum_peak_profit_giveback",
      "average_peak_profit_giveback", "median_peak_profit_giveback",
      "days_with_peak_profit_giveback", "days_with_realized_drawdown",
      "green_to_red_day_count", "red_to_green_day_count",
    ],
    ["date_range", "pre_entry_daily_path", "session"],
    ["day", "session", "time_bucket", "trade_sequence"],
    "Uses only ordered realized P/L; it never estimates unrealized drawdown or optimal exits.",
  ),
  entry(
    "combined_charge_and_fee_impact",
    "implemented",
    [
      "signed_charges", "average_signed_charges", "median_signed_charges", "gross_net_difference",
      "fees_as_percentage_of_gross_profit", "fees_as_percentage_of_gross_loss",
      "commission_signed_charges", "average_commission_signed_charges", "median_commission_signed_charges",
    ],
    ["date_range", "entry_price_range", "entry_notional_range", "source_identity", "broker_code"],
    ["symbol", "entry_price_range", "entry_notional_bucket", "source_identity", "broker_code"],
    "Requires explicit complete charge coverage; an omitted broker charge field is never treated as zero.",
  ),
  entry(
    "row_and_ingestion_quality",
    "implemented",
    [
      "limited_analytical_trade_count", "missing_charge_coverage_trade_count",
      "missing_share_quantity_authority_count", "missing_entry_notional_authority_count",
      "unavailable_source_authority_trade_count", "manual_entry_trade_count",
      "broker_import_trade_count", "legacy_migration_trade_count",
    ],
    ["account", "date_range", "source_identity", "broker_code"],
    ["aggregate", "account", "source_identity", "broker_code"],
    "Completed-trade limitations are query metrics; rejected CSV rows are reported only by the non-financial ingestion-quality receipt.",
  ),
  entry(
    "commission_only_round_trip_analytics",
    "implemented",
    ["commission_signed_charges", "average_commission_signed_charges", "median_commission_signed_charges"],
    [],
    [],
    "Requires complete FIFO charge-kind allocation. Unknown charge kinds remain unavailable rather than being inferred as commissions.",
  ),
  entry(
    "market_setup_risk_and_exit_quality",
    "not_execution_derived",
    [],
    [],
    [],
    "VWAP, setup, market, planned-risk, and counterfactual exit claims require authority outside executed trades.",
  ),
].sort((left, right) => compareUnicodeCodePoints(left.planFamilyKey, right.planFamilyKey)));

export function executionPlanCatalogMetricKeys(): readonly TradeQueryMetricKey[] {
  return Object.freeze([...new Set(
    EXECUTION_PLAN_CATALOG.flatMap((catalog) => catalog.metricKeys),
  )].sort(compareUnicodeCodePoints));
}

export function verifyExecutionPlanCatalog(): Readonly<{
  readonly completeMetricCoverage: boolean;
  readonly duplicatePlanFamilyKeys: readonly string[];
  readonly duplicateMetricKeysWithinFamily: readonly string[];
}> {
  const planFamilyKeys = EXECUTION_PLAN_CATALOG.map((catalog) => catalog.planFamilyKey);
  const duplicatePlanFamilyKeys = planFamilyKeys.filter((key, index) => planFamilyKeys.indexOf(key) !== index);
  const duplicateMetricKeysWithinFamily = EXECUTION_PLAN_CATALOG.flatMap((catalog) =>
    catalog.metricKeys.filter((key, index) => catalog.metricKeys.indexOf(key) !== index));
  const covered = executionPlanCatalogMetricKeys();
  return Object.freeze({
    completeMetricCoverage: covered.length === TRADE_QUERY_METRIC_KEYS.length &&
      covered.every((key, index) => key === [...TRADE_QUERY_METRIC_KEYS].sort(compareUnicodeCodePoints)[index]),
    duplicatePlanFamilyKeys: Object.freeze([...new Set(duplicatePlanFamilyKeys)].sort(compareUnicodeCodePoints)),
    duplicateMetricKeysWithinFamily: Object.freeze([...new Set(duplicateMetricKeysWithinFamily)].sort(compareUnicodeCodePoints)),
  });
}
