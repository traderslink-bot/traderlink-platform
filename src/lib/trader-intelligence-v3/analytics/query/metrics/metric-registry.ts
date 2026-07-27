import {
  compareUnicodeCodePoints,
  serializeCanonicalValue,
} from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";

export const TRADE_QUERY_METRIC_DECLARATION_VERSION =
  "ti_v3_trade_query_metric_declaration_v1" as const;
export const TRADE_QUERY_METRIC_REGISTRY_VERSION =
  "ti_v3_trade_query_metric_registry_v1" as const;
export const TRADE_QUERY_METRIC_VERSION = "v1" as const;

export const TRADE_QUERY_METRIC_KEYS = Object.freeze([
  "candidate_count",
  "included_count",
  "excluded_count",
  "inclusion_rate",
  "exclusion_rate",
  "trading_day_count",
  "unique_account_count",
  "unique_symbol_count",
  "total_execution_count",
  "average_executions_per_trade",
  "limited_analytical_trade_count",
  "missing_charge_coverage_trade_count",
  "missing_share_quantity_authority_count",
  "missing_entry_notional_authority_count",
  "unavailable_source_authority_trade_count",
  "manual_entry_trade_count",
  "broker_import_trade_count",
  "legacy_migration_trade_count",
  "total_trades",
  "average_trades_per_trading_day",
  "median_trades_per_trading_day",
  "maximum_trades_per_trading_day",
  "minimum_trades_per_trading_day",
  "long_trade_count",
  "short_trade_count",
  "long_trade_percentage",
  "short_trade_percentage",
  "average_attempts_per_symbol",
  "median_attempts_per_symbol",
  "repeat_attempt_trade_count",
  "repeat_attempt_percentage",
  "gross_profit",
  "gross_loss",
  "gross_pnl",
  "average_gross_pnl",
  "median_gross_pnl",
  "signed_charges",
  "average_signed_charges",
  "median_signed_charges",
  "commission_signed_charges",
  "average_commission_signed_charges",
  "median_commission_signed_charges",
  "gross_net_difference",
  "fees_as_percentage_of_gross_profit",
  "fees_as_percentage_of_gross_loss",
  "net_pnl",
  "average_pnl",
  "median_pnl",
  "average_daily_pnl",
  "median_daily_pnl",
  "best_trade",
  "worst_trade",
  "best_trading_day",
  "worst_trading_day",
  "win_count",
  "loss_count",
  "flat_count",
  "win_rate",
  "loss_rate",
  "flat_rate",
  "average_winning_trade",
  "median_winning_trade",
  "average_losing_trade",
  "median_losing_trade",
  "total_winning_net_pnl",
  "total_losing_net_pnl",
  "average_win_loss_ratio",
  "median_win_loss_ratio",
  "profit_factor",
  "expectancy",
  "breakeven_win_rate",
  "average_holding_time",
  "median_holding_time",
  "minimum_holding_time",
  "maximum_holding_time",
  "average_winner_holding_time",
  "average_loser_holding_time",
  "median_winner_holding_time",
  "median_loser_holding_time",
  "average_share_quantity",
  "median_share_quantity",
  "maximum_share_quantity",
  "average_winner_share_quantity",
  "median_winner_share_quantity",
  "average_loser_share_quantity",
  "median_loser_share_quantity",
  "average_entry_notional",
  "median_entry_notional",
  "maximum_entry_notional",
  "average_winner_entry_notional",
  "average_loser_entry_notional",
  "median_winner_entry_notional",
  "median_loser_entry_notional",
  "net_pnl_per_100_shares",
  "return_on_entry_notional",
  "profitable_trading_day_count",
  "losing_trading_day_count",
  "flat_trading_day_count",
  "profitable_day_percentage",
  "losing_day_percentage",
  "flat_day_percentage",
  "average_green_day_pnl",
  "median_green_day_pnl",
  "average_red_day_pnl",
  "median_red_day_pnl",
  "maximum_intraday_drawdown",
  "longest_winning_trade_streak",
  "longest_losing_trade_streak",
  "current_winning_trade_streak",
  "current_losing_trade_streak",
  "net_pnl_excluding_largest_winner",
  "net_pnl_excluding_largest_loser",
  "net_pnl_excluding_largest_winner_and_loser",
  "largest_winner_contribution",
  "largest_loser_contribution",
  "average_position_size",
  "median_position_size",
  "maximum_intraday_realized_drawdown",
  "maximum_peak_profit_giveback",
  "maximum_intraday_realized_recovery_from_trough",
  "average_peak_profit_giveback",
  "median_peak_profit_giveback",
  "days_with_peak_profit_giveback",
  "days_with_realized_drawdown",
  "green_to_red_day_count",
  "red_to_green_day_count",
] as const);

export type TradeQueryMetricKey = typeof TRADE_QUERY_METRIC_KEYS[number];

export interface TradeQueryMetricDeclaration {
  readonly schemaVersion: typeof TRADE_QUERY_METRIC_DECLARATION_VERSION;
  readonly metricKey: TradeQueryMetricKey;
  readonly metricVersion: typeof TRADE_QUERY_METRIC_VERSION;
  readonly purposeCode: string;
  readonly requiredFields: readonly string[];
  readonly requiredDerivedSemantics: readonly string[];
  readonly requiredAuthority: readonly string[];
  readonly populationRequirement: "included_trades" | "query_counts";
  readonly unit: string;
  readonly currencyBehavior: "selected_partition" | "currency_independent";
  readonly calculationPolicy: string;
  readonly aggregationBehavior: "shared_accumulator_projection";
  readonly compatibleGroupings: readonly string[];
  readonly compatibleFilters: readonly string[];
  readonly minimumSample: string;
  readonly unavailablePolicy: string;
  readonly unavailableConditions: readonly string[];
  readonly unavailableReasonCodes: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly evidencePolicy: "group_population_and_bounded_candidates";
  readonly orderingPolicy: "exact_numeric_then_group_identity";
  readonly testKeys: readonly string[];
  readonly deprecationState: "active";
  readonly metricDigest: CanonicalContentDigest;
}

export interface TradeQueryMetricRegistry {
  readonly schemaVersion: typeof TRADE_QUERY_METRIC_REGISTRY_VERSION;
  readonly registryKey: "ti_v3_execution_only_metric_registry";
  readonly registryVersion: "v1";
  readonly entries: readonly TradeQueryMetricDeclaration[];
  readonly registryDigest: CanonicalContentDigest;
}

const MONEY_KEYS = new Set<TradeQueryMetricKey>([
  "gross_profit", "gross_loss", "gross_pnl", "average_gross_pnl", "median_gross_pnl",
  "signed_charges", "average_signed_charges",
  "median_signed_charges", "commission_signed_charges", "average_commission_signed_charges",
  "median_commission_signed_charges", "gross_net_difference", "net_pnl",
  "average_pnl", "median_pnl", "average_daily_pnl", "median_daily_pnl",
  "best_trade", "worst_trade", "best_trading_day", "worst_trading_day",
  "average_winning_trade", "median_winning_trade", "average_losing_trade",
  "median_losing_trade", "total_winning_net_pnl", "total_losing_net_pnl",
  "average_entry_notional", "median_entry_notional",
  "maximum_entry_notional", "average_winner_entry_notional",
  "average_loser_entry_notional", "median_winner_entry_notional",
  "median_loser_entry_notional", "net_pnl_per_100_shares",
  "net_pnl_excluding_largest_winner", "net_pnl_excluding_largest_loser",
  "net_pnl_excluding_largest_winner_and_loser", "largest_winner_contribution",
  "largest_loser_contribution", "average_position_size", "median_position_size",
  "expectancy", "average_green_day_pnl", "median_green_day_pnl",
  "average_red_day_pnl", "median_red_day_pnl", "maximum_intraday_drawdown", "maximum_intraday_realized_drawdown", "maximum_peak_profit_giveback",
  "average_peak_profit_giveback", "median_peak_profit_giveback",
  "maximum_intraday_realized_recovery_from_trough",
]);
const RATIO_KEYS = new Set<TradeQueryMetricKey>([
  "inclusion_rate", "exclusion_rate", "average_executions_per_trade",
  "average_trades_per_trading_day", "long_trade_percentage",
  "short_trade_percentage", "average_attempts_per_symbol",
  "repeat_attempt_percentage", "win_rate", "loss_rate", "flat_rate",
  "average_win_loss_ratio", "median_win_loss_ratio", "profit_factor",
  "breakeven_win_rate", "return_on_entry_notional",
  "fees_as_percentage_of_gross_profit", "fees_as_percentage_of_gross_loss",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
  "average_green_day_pnl", "median_green_day_pnl", "average_red_day_pnl", "median_red_day_pnl",
]);
const SECOND_KEYS = new Set<TradeQueryMetricKey>([
  "average_holding_time", "median_holding_time", "minimum_holding_time",
  "maximum_holding_time", "average_winner_holding_time",
  "average_loser_holding_time", "median_winner_holding_time",
  "median_loser_holding_time",
]);
const SHARE_KEYS = new Set<TradeQueryMetricKey>([
  "average_share_quantity", "median_share_quantity", "maximum_share_quantity",
  "average_winner_share_quantity", "median_winner_share_quantity",
  "average_loser_share_quantity", "median_loser_share_quantity",
]);
const QUERY_COUNT_KEYS = new Set<TradeQueryMetricKey>([
  "candidate_count", "included_count", "excluded_count", "inclusion_rate",
  "exclusion_rate",
]);
const DAILY_KEYS = new Set<TradeQueryMetricKey>([
  "trading_day_count", "average_trades_per_trading_day",
  "median_trades_per_trading_day", "maximum_trades_per_trading_day",
  "minimum_trades_per_trading_day", "average_daily_pnl", "median_daily_pnl",
  "best_trading_day", "worst_trading_day", "profitable_trading_day_count",
  "losing_trading_day_count", "flat_trading_day_count",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
  "average_green_day_pnl", "median_green_day_pnl", "average_red_day_pnl", "median_red_day_pnl",
  "maximum_intraday_drawdown", "maximum_intraday_realized_drawdown", "maximum_peak_profit_giveback", "maximum_intraday_realized_recovery_from_trough",
  "maximum_intraday_realized_recovery_from_trough",
  "average_peak_profit_giveback", "median_peak_profit_giveback",
  "days_with_peak_profit_giveback", "days_with_realized_drawdown",
  "green_to_red_day_count", "red_to_green_day_count",
]);
const DIRECTION_KEYS = new Set<TradeQueryMetricKey>([
  "long_trade_count", "short_trade_count", "long_trade_percentage",
  "short_trade_percentage",
]);
const ATTEMPTS_PER_SYMBOL_KEYS = new Set<TradeQueryMetricKey>([
  "average_attempts_per_symbol", "median_attempts_per_symbol",
]);
const REPEAT_ATTEMPT_KEYS = new Set<TradeQueryMetricKey>([
  "repeat_attempt_trade_count", "repeat_attempt_percentage",
]);
const DAILY_PNL_KEYS = new Set<TradeQueryMetricKey>([
  "average_daily_pnl", "median_daily_pnl", "best_trading_day", "worst_trading_day",
  "profitable_trading_day_count", "losing_trading_day_count", "flat_trading_day_count",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
  "average_green_day_pnl", "median_green_day_pnl", "average_red_day_pnl", "median_red_day_pnl",
  "maximum_intraday_drawdown", "maximum_intraday_realized_drawdown", "maximum_peak_profit_giveback",
  "maximum_intraday_realized_recovery_from_trough",
  "average_peak_profit_giveback", "median_peak_profit_giveback",
  "days_with_peak_profit_giveback", "days_with_realized_drawdown",
  "green_to_red_day_count", "red_to_green_day_count",
]);
const OUTCOME_KEYS = new Set<TradeQueryMetricKey>([
  "win_count", "loss_count", "flat_count", "win_rate", "loss_rate", "flat_rate",
  "average_winning_trade", "median_winning_trade", "average_losing_trade",
  "median_losing_trade", "average_win_loss_ratio", "median_win_loss_ratio",
  "profit_factor", "breakeven_win_rate", "average_winner_holding_time",
  "average_loser_holding_time", "median_winner_holding_time",
  "median_loser_holding_time", "average_winner_entry_notional",
  "average_loser_entry_notional", "median_winner_entry_notional",
  "median_loser_entry_notional", "longest_winning_trade_streak",
  "average_winner_share_quantity", "median_winner_share_quantity",
  "average_loser_share_quantity", "median_loser_share_quantity",
  "longest_losing_trade_streak", "current_winning_trade_streak",
  "current_losing_trade_streak", "net_pnl_excluding_largest_winner",
  "net_pnl_excluding_largest_loser", "net_pnl_excluding_largest_winner_and_loser",
  "largest_winner_contribution", "largest_loser_contribution", "total_winning_net_pnl", "total_losing_net_pnl",
]);
const NET_PNL_KEYS = new Set<TradeQueryMetricKey>([
  "net_pnl", "average_pnl", "median_pnl", "average_daily_pnl",
  "median_daily_pnl", "best_trade", "worst_trade", "best_trading_day",
  "worst_trading_day", "expectancy", "average_winning_trade",
  "median_winning_trade", "average_losing_trade", "median_losing_trade",
  "average_win_loss_ratio", "median_win_loss_ratio", "profit_factor",
  "breakeven_win_rate", "net_pnl_per_100_shares", "return_on_entry_notional",
  "net_pnl_excluding_largest_winner", "net_pnl_excluding_largest_loser",
  "net_pnl_excluding_largest_winner_and_loser", "largest_winner_contribution",
  "largest_loser_contribution", "total_winning_net_pnl", "total_losing_net_pnl",
  "average_winner_share_quantity", "median_winner_share_quantity",
  "average_loser_share_quantity", "median_loser_share_quantity",
  "average_green_day_pnl", "median_green_day_pnl", "average_red_day_pnl", "median_red_day_pnl",
  "profitable_trading_day_count", "losing_trading_day_count", "flat_trading_day_count",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
  "maximum_intraday_drawdown", "maximum_intraday_realized_drawdown", "maximum_peak_profit_giveback",
  "average_peak_profit_giveback", "median_peak_profit_giveback",
  "days_with_peak_profit_giveback", "days_with_realized_drawdown",
  "green_to_red_day_count", "red_to_green_day_count",
]);
const GROSS_PNL_KEYS = new Set<TradeQueryMetricKey>([
  "gross_profit", "gross_loss", "gross_pnl", "average_gross_pnl", "median_gross_pnl",
]);
const CHARGE_KEYS = new Set<TradeQueryMetricKey>([
  "signed_charges", "average_signed_charges", "median_signed_charges", "gross_net_difference",
  "fees_as_percentage_of_gross_profit", "fees_as_percentage_of_gross_loss",
  "commission_signed_charges", "average_commission_signed_charges", "median_commission_signed_charges",
]);
const COMMISSION_KEYS = new Set<TradeQueryMetricKey>([
  "commission_signed_charges", "average_commission_signed_charges", "median_commission_signed_charges",
]);
const FEE_PERCENT_KEYS = new Set<TradeQueryMetricKey>([
  "fees_as_percentage_of_gross_profit", "fees_as_percentage_of_gross_loss",
]);
const STREAK_KEYS = new Set<TradeQueryMetricKey>([
  "longest_winning_trade_streak", "longest_losing_trade_streak",
  "current_winning_trade_streak", "current_losing_trade_streak",
]);
const WINNER_REQUIRED_KEYS = new Set<TradeQueryMetricKey>([
  "average_winning_trade", "median_winning_trade", "average_win_loss_ratio",
  "median_win_loss_ratio", "breakeven_win_rate", "average_winner_holding_time",
  "median_winner_holding_time", "average_winner_entry_notional",
  "median_winner_entry_notional", "largest_winner_contribution",
  "average_winner_share_quantity", "median_winner_share_quantity",
  "net_pnl_excluding_largest_winner", "net_pnl_excluding_largest_winner_and_loser",
]);
const LOSER_REQUIRED_KEYS = new Set<TradeQueryMetricKey>([
  "average_losing_trade", "median_losing_trade", "average_win_loss_ratio",
  "median_win_loss_ratio", "breakeven_win_rate", "average_loser_holding_time",
  "median_loser_holding_time", "average_loser_entry_notional",
  "median_loser_entry_notional", "largest_loser_contribution",
  "average_loser_share_quantity", "median_loser_share_quantity",
  "net_pnl_excluding_largest_loser", "net_pnl_excluding_largest_winner_and_loser",
]);
const NOTIONAL_AUTHORITY_KEYS = new Set<TradeQueryMetricKey>([
  "average_entry_notional", "median_entry_notional", "maximum_entry_notional",
  "average_winner_entry_notional", "average_loser_entry_notional",
  "median_winner_entry_notional", "median_loser_entry_notional",
  "return_on_entry_notional", "average_position_size", "median_position_size",
]);
const COUNT_DENOMINATOR_KEYS = new Set<TradeQueryMetricKey>([
  "inclusion_rate", "exclusion_rate", "average_executions_per_trade",
  "average_trades_per_trading_day", "long_trade_percentage",
  "short_trade_percentage", "average_attempts_per_symbol",
  "repeat_attempt_percentage", "win_rate", "loss_rate", "flat_rate",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
  "average_pnl", "expectancy", "average_daily_pnl", "average_winning_trade",
  "average_losing_trade", "average_share_quantity", "average_entry_notional",
  "average_winner_entry_notional", "average_loser_entry_notional",
  "average_position_size", "average_signed_charges", "average_peak_profit_giveback",
  "average_gross_pnl", "average_signed_charges", "average_commission_signed_charges", "average_green_day_pnl", "average_red_day_pnl",
  "fees_as_percentage_of_gross_profit", "fees_as_percentage_of_gross_loss",
]);
const ZERO_SAMPLE_ALLOWED_KEYS = new Set<TradeQueryMetricKey>([
  "candidate_count", "included_count", "excluded_count", "trading_day_count",
  "unique_account_count", "unique_symbol_count", "total_execution_count",
  "limited_analytical_trade_count", "missing_charge_coverage_trade_count", "missing_share_quantity_authority_count",
  "missing_entry_notional_authority_count", "unavailable_source_authority_trade_count",
  "manual_entry_trade_count", "broker_import_trade_count", "legacy_migration_trade_count",
  "total_trades", "maximum_trades_per_trading_day", "long_trade_count", "short_trade_count",
  "repeat_attempt_trade_count", "gross_profit", "gross_loss", "gross_pnl",
  "signed_charges", "net_pnl", "win_count", "loss_count", "flat_count",
  "profitable_trading_day_count", "losing_trading_day_count",
  "flat_trading_day_count", "longest_winning_trade_streak",
  "longest_losing_trade_streak", "current_winning_trade_streak",
  "current_losing_trade_streak", "days_with_peak_profit_giveback",
  "days_with_realized_drawdown", "green_to_red_day_count", "red_to_green_day_count",
]);
const ALL_GROUPINGS = Object.freeze([
  "aggregate", "day", "week", "month", "weekday", "year", "session", "entry_session", "exit_session", "session_transition", "time_bucket",
  "entry_price_range", "price_range", "trade_sequence", "trade_sequence_bucket",
  "previous_completed_outcome", "prior_completed_streak_bucket", "pre_entry_daily_state",
  "repeat_attempt", "repeat_attempt_bucket", "holding_time_bucket",
  "share_quantity_bucket", "entry_notional_bucket", "position_size_bucket",
  "direction", "symbol", "account", "source_identity", "broker_code", "source_kind",
  "charge_coverage", "compound",
]);
const ALL_FILTERS = Object.freeze([
  "date_range", "account", "symbol", "source_identity", "broker_code", "source_kind", "charge_coverage", "direction", "session", "entry_session", "exit_session", "session_transition", "currency",
  "realized_outcome", "weekday", "entry_time_range", "exit_time_range",
  "entry_price_range", "sequence_in_session",
  "previous_completed_outcome", "prior_completed_streak", "pre_entry_daily_state", "pre_entry_daily_path",
  "holding_time_seconds", "repeat_attempt",
  "share_quantity_range", "entry_notional_range",
]);

function unitFor(key: TradeQueryMetricKey): string {
  if (
    key === "trading_day_count" || key.endsWith("trading_day_count") || key.endsWith("day_count") ||
    key === "days_with_peak_profit_giveback" || key === "days_with_realized_drawdown" ||
    key === "green_to_red_day_count" || key === "red_to_green_day_count"
  ) return "days";
  if (key === "unique_account_count") return "accounts";
  if (key === "unique_symbol_count") return "symbols";
  if (key === "total_execution_count") return "executions";
  if (MONEY_KEYS.has(key)) return "money";
  if (RATIO_KEYS.has(key)) return "ratio";
  if (SECOND_KEYS.has(key)) return "seconds";
  if (SHARE_KEYS.has(key)) return "shares";
  return "trades";
}

function requiredFieldsFor(key: TradeQueryMetricKey): readonly string[] {
  const fields: string[] = [];
  const add = (...values: readonly string[]) => {
    for (const value of values) if (!fields.includes(value)) fields.push(value);
  };
  if (key === "unique_account_count") add("canonicalAccountKey");
  if (key === "unique_symbol_count") add("stableInstrumentKey");
  if (key === "total_execution_count" || key === "average_executions_per_trade") {
    add("supportingExecutionDigests");
  }
  if (key === "limited_analytical_trade_count" || key === "missing_charge_coverage_trade_count") {
    add("coverageState", "limitationCodes");
  }
  if (key === "missing_share_quantity_authority_count") add("shareQuantity");
  if (key === "missing_entry_notional_authority_count") add("entryNotional");
  if (
    key === "unavailable_source_authority_trade_count" ||
    key === "manual_entry_trade_count" ||
    key === "broker_import_trade_count" ||
    key === "legacy_migration_trade_count"
  ) add("sourceAuthority");
  if (DAILY_KEYS.has(key)) add("sessionDate");
  if (DAILY_PNL_KEYS.has(key)) add("netPnl");
  if (DIRECTION_KEYS.has(key)) add("direction");
  if (ATTEMPTS_PER_SYMBOL_KEYS.has(key)) add("stableInstrumentKey");
  if (REPEAT_ATTEMPT_KEYS.has(key)) {
    add("stableInstrumentKey", "sessionDate", "firstEntryAt", "finalExitAt", "semanticRoundTripKey");
    add("canonicalOwnerKey", "canonicalAccountKey", "currency", "timezone", "dateBasis");
  }
  if (SECOND_KEYS.has(key)) add("firstEntryAt", "finalExitAt");
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") {
    add("shareQuantity");
  }
  if (key === "average_entry_notional" || key === "median_entry_notional" ||
    key === "maximum_entry_notional" || key === "average_winner_entry_notional" ||
    key === "average_loser_entry_notional" || key === "median_winner_entry_notional" ||
    key === "median_loser_entry_notional" || key === "return_on_entry_notional" ||
    key === "average_position_size" || key === "median_position_size") {
    add("entryNotional");
  }
  if (GROSS_PNL_KEYS.has(key)) add("grossPnl");
  if (CHARGE_KEYS.has(key)) add("signedCharges");
  if (COMMISSION_KEYS.has(key)) add("signedChargesByKind", "chargeKindCoverageState");
  if (FEE_PERCENT_KEYS.has(key)) add("grossPnl");
  if (STREAK_KEYS.has(key)) {
    add("finalExitAt", "semanticRoundTripKey", "netPnl");
  }
  if (NET_PNL_KEYS.has(key) || OUTCOME_KEYS.has(key)) add("netPnl");
  return Object.freeze(fields);
}

function requiredDerivedSemanticsFor(key: TradeQueryMetricKey): readonly string[] {
  const semantics: string[] = [];
  const add = (...values: readonly string[]) => {
    for (const value of values) if (!semantics.includes(value)) semantics.push(value);
  };
  if (QUERY_COUNT_KEYS.has(key)) add("verified_query_counts");
  if (REPEAT_ATTEMPT_KEYS.has(key)) {
    add("canonical_owner_account_currency_session_symbol_entry_attempt_order");
  }
  if (STREAK_KEYS.has(key)) add("canonical_completed_trade_order", "realized_outcome");
  if (OUTCOME_KEYS.has(key)) add("realized_outcome");
  if (DAILY_PNL_KEYS.has(key)) add("session_date_realized_pnl_aggregation");
  if (SECOND_KEYS.has(key)) add("completed_holding_duration");
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") add("complete_share_quantity_authority");
  if (key.includes("notional") || key.endsWith("position_size")) add("complete_entry_notional_authority");
  return Object.freeze(semantics);
}

function unavailablePolicyFor(key: TradeQueryMetricKey): string {
  if (STREAK_KEYS.has(key)) return "available_zero_when_no_matching_streak";
  if (key === "profit_factor") return "ti_v3_query_profit_factor_zero_loss_denominator";
  if (key === "largest_winner_contribution" || key === "net_pnl_excluding_largest_winner") {
    return "ti_v3_query_no_winning_trade";
  }
  if (key === "largest_loser_contribution" || key === "net_pnl_excluding_largest_loser") {
    return "ti_v3_query_no_losing_trade";
  }
  if (ZERO_SAMPLE_ALLOWED_KEYS.has(key)) return "available_at_zero_population";
  return "unavailable_with_declared_reason_code";
}

function unavailableConditionsFor(key: TradeQueryMetricKey): readonly string[] {
  const conditions: string[] = [];
  const add = (...values: readonly string[]) => {
    for (const value of values) if (!conditions.includes(value)) conditions.push(value);
  };
  if (!ZERO_SAMPLE_ALLOWED_KEYS.has(key) && !STREAK_KEYS.has(key)) add("zero_total_population");
  if (WINNER_REQUIRED_KEYS.has(key)) add("no_winning_trade");
  if (LOSER_REQUIRED_KEYS.has(key)) add("no_losing_trade");
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") add("incomplete_share_quantity_authority");
  if (NOTIONAL_AUTHORITY_KEYS.has(key)) add("incomplete_entry_notional_authority");
  if (key === "net_pnl_per_100_shares") add("zero_total_share_quantity_denominator");
  if (key === "return_on_entry_notional") add("zero_total_entry_notional_denominator");
  if (key === "profit_factor") add("zero_total_loss_denominator");
  if (key === "fees_as_percentage_of_gross_profit") add("zero_total_gross_profit_denominator");
  if (key === "fees_as_percentage_of_gross_loss") add("zero_total_gross_loss_denominator");
  return Object.freeze(conditions);
}

function unavailableReasonCodesFor(key: TradeQueryMetricKey): readonly string[] {
  const codes: string[] = [];
  const add = (...values: readonly string[]) => {
    for (const value of values) if (!codes.includes(value)) codes.push(value);
  };
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") add("ti_v3_query_required_authority_unavailable");
  if (NOTIONAL_AUTHORITY_KEYS.has(key)) add("ti_v3_query_required_authority_unavailable");
  if (key === "net_pnl_per_100_shares" || key === "return_on_entry_notional") add("ti_v3_query_zero_denominator");
  if (FEE_PERCENT_KEYS.has(key)) add("ti_v3_query_zero_denominator");
  if (COMMISSION_KEYS.has(key)) add("ti_v3_query_charge_kind_coverage_unknown");
  if (key === "profit_factor") add("ti_v3_query_profit_factor_zero_loss_denominator");
  if (NET_PNL_KEYS.has(key) || OUTCOME_KEYS.has(key) || CHARGE_KEYS.has(key) ||
    key.includes("drawdown") || key.includes("giveback") ||
    key === "green_to_red_day_count" || key === "red_to_green_day_count") {
    add("ti_v3_query_charge_coverage_unknown");
  }
  if (key === "largest_winner_contribution" || key === "net_pnl_excluding_largest_winner") add("ti_v3_query_no_winning_trade");
  if (key === "largest_loser_contribution" || key === "net_pnl_excluding_largest_loser") add("ti_v3_query_no_losing_trade");
  if (COUNT_DENOMINATOR_KEYS.has(key)) add("ti_v3_weekday_zero_denominator");
  if (!ZERO_SAMPLE_ALLOWED_KEYS.has(key) && !STREAK_KEYS.has(key) && !COUNT_DENOMINATOR_KEYS.has(key) &&
    key !== "net_pnl_per_100_shares" && key !== "return_on_entry_notional" && key !== "profit_factor" &&
    key !== "largest_winner_contribution" && key !== "net_pnl_excluding_largest_winner" &&
    key !== "largest_loser_contribution" && key !== "net_pnl_excluding_largest_loser") {
    add("ti_v3_query_zero_sample");
  }
  return Object.freeze(codes);
}

function buildDeclaration(key: TradeQueryMetricKey): TradeQueryMetricDeclaration {
  const unit = unitFor(key);
  const content = {
    schemaVersion: TRADE_QUERY_METRIC_DECLARATION_VERSION,
    metricKey: key,
    metricVersion: TRADE_QUERY_METRIC_VERSION,
    purposeCode: `ti_v3_metric_${key}`,
    requiredFields: requiredFieldsFor(key),
    requiredDerivedSemantics: requiredDerivedSemanticsFor(key),
    requiredAuthority: Object.freeze(["dataset_receipt", "derivation_receipt", "partition"]),
    populationRequirement: QUERY_COUNT_KEYS.has(key) ? "query_counts" as const : "included_trades" as const,
    unit,
    currencyBehavior: MONEY_KEYS.has(key) ? "selected_partition" as const : "currency_independent" as const,
    calculationPolicy: `ti_v3_exact_${key}_v1`,
    aggregationBehavior: "shared_accumulator_projection" as const,
    compatibleGroupings: ALL_GROUPINGS,
    compatibleFilters: ALL_FILTERS,
    minimumSample: ZERO_SAMPLE_ALLOWED_KEYS.has(key) ? "0" : "1",
    unavailablePolicy: unavailablePolicyFor(key),
    unavailableConditions: unavailableConditionsFor(key),
    unavailableReasonCodes: unavailableReasonCodesFor(key),
    limitationCodes: unavailableReasonCodesFor(key),
    evidencePolicy: "group_population_and_bounded_candidates" as const,
    orderingPolicy: "exact_numeric_then_group_identity" as const,
    testKeys: Object.freeze([`ga1_a_metric_${key}`]),
    deprecationState: "active" as const,
  };
  const built = finalizeContentAddressedAuthority(
    "trade_query_metric_registry_entry",
    content,
    "metricDigest",
  );
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as TradeQueryMetricDeclaration;
}

const entries = Object.freeze(
  TRADE_QUERY_METRIC_KEYS.map(buildDeclaration)
    .sort((left, right) => compareUnicodeCodePoints(left.metricKey, right.metricKey)),
);
const registry = finalizeContentAddressedAuthority(
  "trade_query_metric_registry",
  {
    schemaVersion: TRADE_QUERY_METRIC_REGISTRY_VERSION,
    registryKey: "ti_v3_execution_only_metric_registry",
    registryVersion: "v1",
    entries,
  },
  "registryDigest",
);
if (!registry.ok) throw new Error(`${registry.error.code}:${registry.error.path}`);

export const TRADE_QUERY_METRIC_REGISTRY =
  registry.value as TradeQueryMetricRegistry;

const byKey = new Map(entries.map((entry) => [entry.metricKey, entry]));

export function getTradeQueryMetricDeclaration(
  key: TradeQueryMetricKey,
): TradeQueryMetricDeclaration {
  const entry = byKey.get(key);
  if (entry === undefined) throw new Error(`unregistered metric: ${key}`);
  return entry;
}

export function verifyTradeQueryMetricDeclaration(
  input: unknown,
): { readonly ok: true; readonly value: TradeQueryMetricDeclaration } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "metricKey", "metricVersion", "purposeCode",
    "requiredFields", "requiredDerivedSemantics", "requiredAuthority", "populationRequirement", "unit",
    "currencyBehavior", "calculationPolicy", "aggregationBehavior",
    "compatibleGroupings", "compatibleFilters", "minimumSample",
    "unavailablePolicy", "unavailableConditions", "unavailableReasonCodes", "limitationCodes", "evidencePolicy",
    "orderingPolicy", "testKeys", "deprecationState", "metricDigest",
  ]);
  if (
    !record.ok ||
    record.value.schemaVersion !== TRADE_QUERY_METRIC_DECLARATION_VERSION ||
    typeof record.value.metricKey !== "string" ||
    !TRADE_QUERY_METRIC_KEYS.includes(record.value.metricKey as TradeQueryMetricKey)
  ) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.metricKey")
      : record;
  }
  const claimed = validateClaimedDigest(
    record.value.metricDigest,
    "$.metricDigest",
    "trade_query_metric_registry_entry",
  );
  if (!claimed.ok) return claimed;
  const accepted = getTradeQueryMetricDeclaration(
    record.value.metricKey as TradeQueryMetricKey,
  );
  const suppliedCanonical = serializeCanonicalValue(record.value);
  const acceptedCanonical = serializeCanonicalValue(accepted);
  return (
    suppliedCanonical.ok &&
    acceptedCanonical.ok &&
    suppliedCanonical.value.json === acceptedCanonical.value.json &&
    accepted.metricDigest === claimed.value
  )
    ? { ok: true, value: accepted }
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.metricDigest");
}

export function verifyTradeQueryMetricRegistry(
  input: unknown,
): { readonly ok: true; readonly value: TradeQueryMetricRegistry } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "registryKey", "registryVersion", "entries",
    "registryDigest",
  ]);
  if (
    !record.ok ||
    record.value.schemaVersion !== TRADE_QUERY_METRIC_REGISTRY_VERSION ||
    record.value.registryKey !== "ti_v3_execution_only_metric_registry" ||
    record.value.registryVersion !== "v1" ||
    !Array.isArray(record.value.entries) ||
    record.value.entries.length !== TRADE_QUERY_METRIC_KEYS.length
  ) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.registry")
      : record;
  }
  for (const entry of record.value.entries) {
    const verified = verifyTradeQueryMetricDeclaration(entry);
    if (!verified.ok) return verified;
  }
  const digest = validateClaimedDigest(
    record.value.registryDigest,
    "$.registryDigest",
    "trade_query_metric_registry",
  );
  if (!digest.ok) return digest;
  const suppliedCanonical = serializeCanonicalValue(record.value);
  const acceptedCanonical = serializeCanonicalValue(TRADE_QUERY_METRIC_REGISTRY);
  return (
    suppliedCanonical.ok &&
    acceptedCanonical.ok &&
    suppliedCanonical.value.json === acceptedCanonical.value.json &&
    digest.value === TRADE_QUERY_METRIC_REGISTRY.registryDigest
  )
    ? { ok: true, value: TRADE_QUERY_METRIC_REGISTRY }
    : contractFailure(
        "ti_v3_analytics_contract_digest_mismatch",
        "$.registryDigest",
      );
}
