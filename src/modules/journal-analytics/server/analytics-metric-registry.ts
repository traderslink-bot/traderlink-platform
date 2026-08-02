import type {
  JournalAnalyticsMetricDefinition,
  JournalAnalyticsMetricRegistry,
} from "../contracts/metric-registry";
import { JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION } from "../contracts/metric-registry";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

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

const definitions = Object.freeze([
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

export const journalAnalyticsFirstSliceMetricRegistry: JournalAnalyticsMetricRegistry =
  Object.freeze({
    registryVersion: JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION,
    definitions,
  });

const definitionById = new Map(definitions.map((definition) => [
  definition.metricId,
  definition,
]));

export function requireJournalAnalyticsFirstSliceMetricDefinition(
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
