import type {
  JournalAnalyticsMetricDefinition,
  JournalAnalyticsMetricRegistry,
} from "../contracts/metric-registry";
import { JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION } from "../contracts/metric-registry";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  JOURNAL_ANALYTICS_CAPABILITY_IDS,
  type JournalAnalyticsCapabilityId,
} from "./analytics-capability-manifest";

export const JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS = Object.freeze([
  "candidate_count",
  "included_count",
  "excluded_count",
  "total_trades",
  "win_count",
  "loss_count",
  "flat_count",
  "win_rate",
  "loss_rate",
  "flat_rate",
  "gross_profit",
  "gross_loss",
  "gross_pnl",
  "net_pnl",
  "average_gross_pnl",
  "median_gross_pnl",
  "average_pnl",
  "median_pnl",
  "best_trade",
  "worst_trade",
  "profit_factor",
  "expectancy",
] as const);

export type JournalAnalyticsFirstSliceMetricId =
  (typeof JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS)[number];

function metric(
  input: Readonly<{
    metricId: JournalAnalyticsFirstSliceMetricId;
    title: string;
    description: string;
    valueKind: JournalAnalyticsMetricDefinition["valueKind"];
    unit: string;
    requiredFacts: readonly string[];
    moneyBasis?: JournalAnalyticsMetricDefinition["moneyBasis"];
    zeroDenominatorPolicy?: string;
    coveragePolicy?: string;
  }>,
): JournalAnalyticsMetricDefinition {
  return Object.freeze({
    metricId: input.metricId,
    title: input.title,
    description: input.description,
    formulaVersion: "journal_analytics_formula_v1",
    capabilityState: "implemented" as const,
    valueKind: input.valueKind,
    unit: input.unit,
    requiredFacts: Object.freeze([...input.requiredFacts]),
    moneyBasis: input.moneyBasis ?? "not_applicable",
    currencyPolicy: input.valueKind === "money"
      ? "single_trade_currency_partition"
      : "not_applicable",
    dateTimePolicy: "closing_trading_date_in_account_timezone",
    openPositionPolicy: "excluded_from_realized_value_reported_in_coverage",
    decisionPolicy: "excluded_from_realized_value_reported_in_coverage",
    exclusionPolicy: "excluded_from_value_reported_in_coverage",
    zeroDenominatorPolicy: input.zeroDenominatorPolicy ?? "not_applicable",
    displayPolicy: input.valueKind === "money"
      ? "at_most_2dp_half_up"
      : input.valueKind === "percentage"
        ? "2dp_half_up"
        : input.valueKind === "ratio"
          ? "4dp_half_up"
          : "integer",
    coveragePolicy: input.coveragePolicy ?? "ready_closed_stock",
    unavailableReasonCode: null,
    compatibilityAliases: Object.freeze([]),
  });
}

const firstSliceDefinitions = Object.freeze([
  metric({ metricId: "candidate_count", title: "Candidate trades", description: "Current round-trip candidates in the selected factual scope.", valueKind: "count", unit: "trades", requiredFacts: ["round_trip_projection"] }),
  metric({ metricId: "included_count", title: "Included closed trades", description: "Ready-closed Stock trades included on the selected gross or net basis.", valueKind: "count", unit: "trades", requiredFacts: ["round_trip_projection", "instrument_value_convention"] }),
  metric({ metricId: "excluded_count", title: "Excluded executions", description: "Trader-excluded current executions reported as coverage, not realized trades.", valueKind: "count", unit: "executions", requiredFacts: ["execution_state"], coveragePolicy: "selected_accounts_full_scope_when_filters_lack_attribution" }),
  metric({ metricId: "total_trades", title: "Closed trades", description: "Ready-closed Stock round trips in the selected scope.", valueKind: "count", unit: "trades", requiredFacts: ["ready_closed_round_trip"] }),
  metric({ metricId: "win_count", title: "Winning trades", description: "Closed trades with selected-basis P/L greater than zero.", valueKind: "count", unit: "trades", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable" }),
  metric({ metricId: "loss_count", title: "Losing trades", description: "Closed trades with selected-basis P/L less than zero.", valueKind: "count", unit: "trades", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable" }),
  metric({ metricId: "flat_count", title: "Flat trades", description: "Closed trades with selected-basis P/L equal to zero.", valueKind: "count", unit: "trades", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable" }),
  metric({ metricId: "win_rate", title: "Win rate", description: "Winning closed trades divided by selected-basis eligible closed trades.", valueKind: "percentage", unit: "percent", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "loss_rate", title: "Loss rate", description: "Losing closed trades divided by selected-basis eligible closed trades.", valueKind: "percentage", unit: "percent", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "flat_rate", title: "Flat rate", description: "Flat closed trades divided by selected-basis eligible closed trades.", valueKind: "percentage", unit: "percent", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "gross_profit", title: "Gross profit", description: "Sum of positive execution-derived gross P/L.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect"], moneyBasis: "gross" }),
  metric({ metricId: "gross_loss", title: "Gross loss", description: "Sum of negative execution-derived gross P/L, retained as a negative value.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect"], moneyBasis: "gross" }),
  metric({ metricId: "gross_pnl", title: "Gross P/L", description: "Gross profit plus gross loss for ready-closed Stock trades.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect"], moneyBasis: "gross" }),
  metric({ metricId: "net_pnl", title: "Net P/L for fee-covered trades", description: "Gross P/L minus charge cost plus charge credit for fee-covered trades only.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect", "complete_charge_coverage"], moneyBasis: "net", coveragePolicy: "partial_when_any_gross_eligible_trade_lacks_fees" }),
  metric({ metricId: "average_gross_pnl", title: "Average gross P/L", description: "Gross P/L divided by ready-closed Stock trade count.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect"], moneyBasis: "gross", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "median_gross_pnl", title: "Median gross P/L", description: "Exact sorted median gross P/L.", valueKind: "money", unit: "trade_currency", requiredFacts: ["ready_closed_stock_cash_effect"], moneyBasis: "gross", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "average_pnl", title: "Average P/L", description: "Selected-basis P/L divided by selected-basis eligible closed trades.", valueKind: "money", unit: "trade_currency", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "median_pnl", title: "Median P/L", description: "Exact sorted median selected-basis P/L.", valueKind: "money", unit: "trade_currency", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "best_trade", title: "Best trade P/L", description: "Maximum selected-basis P/L with deterministic close-time and stable-ID ties.", valueKind: "money", unit: "trade_currency", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "worst_trade", title: "Worst trade P/L", description: "Minimum selected-basis P/L with deterministic close-time and stable-ID ties.", valueKind: "money", unit: "trade_currency", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
  metric({ metricId: "profit_factor", title: "Profit factor", description: "Selected-basis gross profit divided by absolute selected-basis gross loss.", valueKind: "ratio", unit: "ratio", requiredFacts: ["selected_basis_pnl", "winning_population", "losing_population"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_without_losses" }),
  metric({ metricId: "expectancy", title: "Expectancy per closed trade", description: "Average selected-basis P/L per eligible closed trade.", valueKind: "money", unit: "trade_currency", requiredFacts: ["selected_basis_pnl"], moneyBasis: "selectable", zeroDenominatorPolicy: "unavailable_zero_eligible_trades" }),
]);

const unavailableReasons = new Map<JournalAnalyticsCapabilityId, string>([
  ["commission_signed_charges", "commission_component_fact_missing"],
  ["average_commission_signed_charges", "commission_component_fact_missing"],
  ["median_commission_signed_charges", "commission_component_fact_missing"],
  ["legacy_migration_trade_count", "legacy_provenance_fact_missing"],
  ["unrealized_pnl", "current_market_price_fact_missing"],
  ["entry_market_session_distribution", "instrument_session_fact_missing"],
  ["exit_market_session_distribution", "instrument_session_fact_missing"],
  ["pnl_by_setup", "accepted_setup_fact_missing"],
  ["r_multiple", "accepted_trade_plan_risk_fact_missing"],
  ["rule_adherence_rate", "accepted_rule_review_fact_missing"],
  ["account_return", "account_equity_cash_flow_fact_missing"],
  ["account_equity_curve", "account_equity_cash_flow_fact_missing"],
  ["account_drawdown", "account_equity_series_fact_missing"],
  ["buying_power_utilization", "account_buying_power_fact_missing"],
  ["cross_currency_consolidated_pnl", "timestamped_fx_fact_missing"],
  ["slippage", "order_and_quote_fact_missing"],
  ["maximum_favorable_excursion", "trusted_market_path_fact_missing"],
  ["maximum_adverse_excursion", "trusted_market_path_fact_missing"],
  ["profit_capture", "trusted_market_path_fact_missing"],
  ["vwap_execution_difference", "trusted_vwap_fact_missing"],
  ["relative_volume", "trusted_volume_fact_missing"],
  ["volatility_regime", "trusted_market_history_fact_missing"],
  ["level_interaction", "versioned_level_analysis_fact_missing"],
  ["catalyst_performance", "timestamped_catalyst_fact_missing"],
  ["benchmark_relative_return", "benchmark_series_fact_missing"],
  ["rapid_reentry_signal_count", "review_signal_threshold_not_configured"],
  ["add_to_loser_signal_count", "review_signal_threshold_not_configured"],
  ["size_after_loss_signal_count", "review_signal_threshold_not_configured"],
  ["overtrading_signal_count", "review_signal_threshold_not_configured"],
]);

const conditionalMetricIds = new Set<JournalAnalyticsCapabilityId>([
  "signed_charges",
  "average_signed_charges",
  "median_signed_charges",
  "gross_net_difference",
  "fees_as_percentage_of_gross_profit",
  "fees_as_percentage_of_gross_loss",
  "net_pnl",
  "net_pnl_per_100_shares",
  "return_on_entry_notional",
  "charge_cost",
  "charge_credit",
  "open_position_count",
  "open_long_position_count",
  "open_short_position_count",
  "open_current_quantity",
  "open_entered_quantity",
  "open_weighted_average_cost",
  "average_open_age",
  "maximum_open_age",
  "average_open_carried_days",
  "source_record_count",
  "import_count",
  "import_issue_count",
  "import_issue_rate",
  "decision_record_count",
  "pending_decision_count",
  "average_pending_decision_age",
  "maximum_pending_decision_age",
  "accepted_execution_count",
  "position_fact_count",
  "exact_reimport_event_count",
  "duplicate_source_record_count",
  "accepted_source_limitation_count",
  "complete_coverage_interval_count",
  "coverage_gap_count",
]);

function displayTitle(metricId: string): string {
  const words = metricId.split("_").map((word) => {
    if (word === "pnl") return "P/L";
    if (word === "vwap") return "VWAP";
    if (word === "fx") return "FX";
    return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
  });
  return words.join(" ");
}

function inferredValueKind(
  metricId: JournalAnalyticsCapabilityId,
): JournalAnalyticsMetricDefinition["valueKind"] {
  if (metricId === "population_pnl_variance") return "decimal";
  if (
    metricId === "best_trading_day" || metricId === "worst_trading_day" ||
    metricId === "average_entry_price" || metricId === "average_exit_price" ||
    metricId === "open_weighted_average_cost" ||
    metricId === "population_pnl_standard_deviation"
  ) return "money";
  if (
    metricId.endsWith("_count") ||
    metricId.endsWith("_streak") ||
    metricId.startsWith("days_with_") ||
    metricId === "trading_day_count" ||
    metricId === "total_execution_count" ||
    metricId === "total_trades" ||
    metricId === "maximum_trades_per_trading_day" ||
    metricId === "minimum_trades_per_trading_day"
  ) return "count";
  if (
    metricId.includes("percentage") ||
    metricId.endsWith("_rate") ||
    metricId.endsWith("_share") ||
    metricId === "return_on_entry_notional" ||
    metricId.startsWith("fees_as_percentage") ||
    metricId === "largest_winner_contribution" ||
    metricId === "largest_loser_contribution"
  ) return "percentage";
  if (metricId.includes("holding_time") || metricId.includes("open_age") ||
      metricId.includes("decision_age")) {
    return "duration";
  }
  if (
    metricId.includes("ratio") || metricId === "profit_factor" ||
    metricId === "r_multiple"
  ) return "ratio";
  if (
    metricId.includes("pnl") ||
    metricId.includes("profit") ||
    metricId.includes("loss") ||
    metricId.includes("charges") ||
    metricId.includes("charge_") ||
    metricId.includes("notional") ||
    metricId.includes("drawdown") ||
    metricId.includes("giveback") ||
    metricId.includes("recovery") ||
    metricId.includes("trade") && (
      metricId.startsWith("best_") || metricId.startsWith("worst_") ||
      metricId.startsWith("average_winning_") ||
      metricId.startsWith("average_losing_") ||
      metricId.startsWith("median_winning_") ||
      metricId.startsWith("median_losing_")
    )
  ) return "money";
  if (metricId === "expectancy") return "ratio";
  return "decimal";
}

function inferredMoneyBasis(
  metricId: JournalAnalyticsCapabilityId,
): JournalAnalyticsMetricDefinition["moneyBasis"] {
  if (
    metricId.includes("open_") || metricId === "average_entry_price" ||
    metricId === "average_exit_price"
  ) return "not_applicable";
  if (
    metricId === "signed_charges" || metricId.includes("_signed_charges") ||
    metricId.includes("commission_signed_charges") ||
    metricId === "charge_cost" || metricId === "charge_credit" ||
    metricId === "gross_net_difference" || metricId === "net_pnl" ||
    metricId.startsWith("net_pnl_") || metricId.startsWith("fees_as_percentage")
  ) return "net";
  if (metricId.startsWith("gross_") || metricId.includes("gross_")) {
    return "gross";
  }
  if (
    metricId.includes("daily_pnl") ||
    metricId === "best_trading_day" || metricId === "worst_trading_day" ||
    metricId.includes("winning_trade") || metricId.includes("losing_trade") ||
    metricId.includes("winner_holding") || metricId.includes("loser_holding") ||
    metricId.includes("winner_share") || metricId.includes("loser_share") ||
    metricId.includes("winner_entry_notional") ||
    metricId.includes("loser_entry_notional") ||
    metricId.includes("win_loss_ratio") || metricId === "breakeven_win_rate" ||
    metricId.startsWith("profitable_") || metricId.startsWith("losing_day_") ||
    metricId.startsWith("flat_day_") || metricId.includes("green_day_pnl") ||
    metricId.includes("red_day_pnl") || metricId.includes("winning_trade_streak") ||
    metricId.includes("losing_trade_streak") || metricId.includes("intraday_") ||
    metricId.includes("peak_profit_giveback") ||
    metricId === "green_to_red_day_count" || metricId === "red_to_green_day_count" ||
    metricId === "largest_winner_contribution" ||
    metricId === "largest_loser_contribution" ||
    metricId.startsWith("pnl_percentile_") ||
    metricId.startsWith("population_pnl_") ||
    metricId.includes("_pnl_share") || metricId === "return_on_entry_notional"
  ) return "selectable";
  const kind = inferredValueKind(metricId);
  return ["money", "percentage", "ratio"].includes(kind)
    ? "selectable"
    : "not_applicable";
}

function inferredUnit(
  valueKind: JournalAnalyticsMetricDefinition["valueKind"],
  metricId: JournalAnalyticsCapabilityId,
): string {
  if (metricId === "population_pnl_variance") return "trade_currency_squared";
  if (metricId === "average_entry_price" || metricId === "average_exit_price" ||
      metricId === "open_weighted_average_cost") return "trade_currency_per_share";
  if (metricId.includes("share_quantity") || metricId.includes("position_size") ||
      metricId.includes("current_quantity") || metricId.includes("entered_quantity")) {
    return "shares";
  }
  if (metricId === "average_open_carried_days") return "trading_days";
  if (valueKind === "count") return "count";
  if (valueKind === "money") return "trade_currency";
  if (valueKind === "percentage") return "percent";
  if (valueKind === "ratio") return "ratio";
  if (valueKind === "duration") return "milliseconds";
  return "decimal";
}

function inferredRequiredFacts(
  metricId: JournalAnalyticsCapabilityId,
): readonly string[] {
  const reason = unavailableReasons.get(metricId);
  if (reason) return Object.freeze([reason.replace(/_missing$/u, "")]);
  if ([
    "source_record_count",
    "import_count",
    "import_issue_count",
    "import_issue_rate",
    "decision_record_count",
    "pending_decision_count",
    "average_pending_decision_age",
    "maximum_pending_decision_age",
    "accepted_execution_count",
    "position_fact_count",
    "exact_reimport_event_count",
    "duplicate_source_record_count",
    "accepted_source_limitation_count",
    "complete_coverage_interval_count",
    "coverage_gap_count",
  ].includes(metricId)) return Object.freeze(["journal_coverage_summary"]);
  if (metricId.includes("open_")) {
    return Object.freeze(["legitimate_open_round_trip", "accepted_allocations"]);
  }
  if (
    metricId.includes("charge") || metricId.includes("net_pnl") ||
    metricId.startsWith("fees_as_")
  ) {
    return Object.freeze(["ready_closed_stock_cash_effect", "complete_charge_coverage"]);
  }
  return Object.freeze(["ready_closed_round_trip", "normalized_execution_allocations"]);
}

function compatibilityAliases(
  metricId: JournalAnalyticsCapabilityId,
): readonly string[] {
  if (metricId === "maximum_intraday_realized_drawdown") {
    return Object.freeze(["maximum_intraday_drawdown"]);
  }
  if (
    metricId === "average_share_quantity" ||
    metricId === "median_share_quantity" ||
    metricId === "maximum_share_quantity" ||
    metricId === "average_position_size" ||
    metricId === "median_position_size"
  ) return Object.freeze(["maximum_position_quantity"]);
  if (metricId === "signed_charges") {
    return Object.freeze(["charge_cost", "charge_credit"]);
  }
  return Object.freeze([]);
}

function genericDefinition(
  metricId: JournalAnalyticsCapabilityId,
): JournalAnalyticsMetricDefinition {
  const valueKind = inferredValueKind(metricId);
  const unavailableReasonCode = unavailableReasons.get(metricId) ?? null;
  const title = displayTitle(metricId);
  return Object.freeze({
    metricId,
    title,
    description: `${title} calculated from the declared Journal fact and coverage policy.`,
    formulaVersion: "journal_analytics_formula_v1",
    capabilityState: unavailableReasonCode === null
      ? conditionalMetricIds.has(metricId) ? "conditional" as const : "implemented" as const
      : "unavailable" as const,
    valueKind,
    unit: inferredUnit(valueKind, metricId),
    requiredFacts: inferredRequiredFacts(metricId),
    moneyBasis: inferredMoneyBasis(metricId),
    currencyPolicy: valueKind === "money" || metricId.includes("pnl") ||
        metricId.includes("notional") || metricId.includes("entry_price") ||
        metricId.includes("exit_price") || metricId.includes("average_cost")
      ? "single_trade_currency_partition"
      : "not_applicable",
    dateTimePolicy: "closing_trading_date_in_account_timezone",
    openPositionPolicy: metricId.includes("open_")
      ? "legitimate_open_only_as_of_query_time"
      : "excluded_from_realized_value_reported_in_coverage",
    decisionPolicy: "excluded_from_value_reported_in_coverage",
    exclusionPolicy: "excluded_from_value_reported_in_coverage",
    zeroDenominatorPolicy: valueKind === "percentage" || valueKind === "ratio"
      ? "unavailable_zero_denominator"
      : "not_applicable",
    displayPolicy: valueKind === "money" || valueKind === "decimal"
      ? "at_most_2dp_half_up"
      : valueKind === "percentage"
        ? "2dp_half_up"
        : valueKind === "ratio"
          ? "4dp_half_up"
          : valueKind === "duration"
            ? "duration_from_exact_milliseconds"
            : "integer",
    coveragePolicy: conditionalMetricIds.has(metricId)
      ? "partial_or_empty_when_required_facts_are_incomplete"
      : "ready_closed_stock",
    unavailableReasonCode,
    compatibilityAliases: compatibilityAliases(metricId),
  });
}

const firstSliceIdSet = new Set(firstSliceDefinitions.map((definition) =>
  definition.metricId));
const definitions = Object.freeze([
  ...firstSliceDefinitions,
  ...JOURNAL_ANALYTICS_CAPABILITY_IDS
    .filter((metricId) => !firstSliceIdSet.has(metricId))
    .map(genericDefinition),
]);

export const journalAnalyticsMetricRegistry: JournalAnalyticsMetricRegistry =
  Object.freeze({
    registryVersion: JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION,
    definitions,
  });

export const journalAnalyticsFirstSliceMetricRegistry =
  journalAnalyticsMetricRegistry;

const definitionById = new Map(definitions.map((definition) => [
  definition.metricId,
  definition,
]));

export function requireJournalAnalyticsMetricDefinition(
  metricId: string,
): JournalAnalyticsMetricDefinition {
  const definition = definitionById.get(metricId);
  if (!definition) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "metricId",
    });
  }
  return definition;
}

export const requireJournalAnalyticsFirstSliceMetricDefinition =
  requireJournalAnalyticsMetricDefinition;
