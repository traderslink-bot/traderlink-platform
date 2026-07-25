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
  "signed_charges",
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
  "longest_winning_trade_streak",
  "longest_losing_trade_streak",
  "net_pnl_excluding_largest_winner",
  "net_pnl_excluding_largest_loser",
  "net_pnl_excluding_largest_winner_and_loser",
  "largest_winner_contribution",
  "largest_loser_contribution",
  "average_position_size",
  "median_position_size",
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
  "gross_profit", "gross_loss", "gross_pnl", "signed_charges", "net_pnl",
  "average_pnl", "median_pnl", "average_daily_pnl", "median_daily_pnl",
  "best_trade", "worst_trade", "best_trading_day", "worst_trading_day",
  "average_winning_trade", "median_winning_trade", "average_losing_trade",
  "median_losing_trade", "average_entry_notional", "median_entry_notional",
  "maximum_entry_notional", "average_winner_entry_notional",
  "average_loser_entry_notional", "median_winner_entry_notional",
  "median_loser_entry_notional", "net_pnl_per_100_shares",
  "net_pnl_excluding_largest_winner", "net_pnl_excluding_largest_loser",
  "net_pnl_excluding_largest_winner_and_loser", "largest_winner_contribution",
  "largest_loser_contribution", "average_position_size", "median_position_size",
  "expectancy",
]);
const RATIO_KEYS = new Set<TradeQueryMetricKey>([
  "inclusion_rate", "exclusion_rate", "average_executions_per_trade",
  "average_trades_per_trading_day", "long_trade_percentage",
  "short_trade_percentage", "average_attempts_per_symbol",
  "repeat_attempt_percentage", "win_rate", "loss_rate", "flat_rate",
  "average_win_loss_ratio", "median_win_loss_ratio", "profit_factor",
  "breakeven_win_rate", "return_on_entry_notional",
  "profitable_day_percentage", "losing_day_percentage", "flat_day_percentage",
]);
const SECOND_KEYS = new Set<TradeQueryMetricKey>([
  "average_holding_time", "median_holding_time", "minimum_holding_time",
  "maximum_holding_time", "average_winner_holding_time",
  "average_loser_holding_time", "median_winner_holding_time",
  "median_loser_holding_time",
]);
const SHARE_KEYS = new Set<TradeQueryMetricKey>([
  "average_share_quantity", "median_share_quantity", "maximum_share_quantity",
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
]);
const DIRECTION_KEYS = new Set<TradeQueryMetricKey>([
  "long_trade_count", "short_trade_count", "long_trade_percentage",
  "short_trade_percentage",
]);
const REPEAT_KEYS = new Set<TradeQueryMetricKey>([
  "average_attempts_per_symbol", "median_attempts_per_symbol",
  "repeat_attempt_trade_count", "repeat_attempt_percentage",
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
  "longest_losing_trade_streak", "net_pnl_excluding_largest_winner",
  "net_pnl_excluding_largest_loser", "net_pnl_excluding_largest_winner_and_loser",
  "largest_winner_contribution", "largest_loser_contribution",
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
  "largest_loser_contribution",
]);
const GROSS_PNL_KEYS = new Set<TradeQueryMetricKey>([
  "gross_profit", "gross_loss", "gross_pnl",
]);
const CHARGE_KEYS = new Set<TradeQueryMetricKey>(["signed_charges"]);
const STREAK_KEYS = new Set<TradeQueryMetricKey>([
  "longest_winning_trade_streak", "longest_losing_trade_streak",
]);
const ZERO_SAMPLE_ALLOWED_KEYS = new Set<TradeQueryMetricKey>([
  "candidate_count", "included_count", "excluded_count", "trading_day_count",
  "unique_account_count", "unique_symbol_count", "total_execution_count",
  "total_trades", "long_trade_count", "short_trade_count",
  "repeat_attempt_trade_count", "gross_profit", "gross_loss", "gross_pnl",
  "signed_charges", "net_pnl", "win_count", "loss_count", "flat_count",
  "profitable_trading_day_count", "losing_trading_day_count",
  "flat_trading_day_count", "longest_winning_trade_streak",
  "longest_losing_trade_streak",
]);
const ALL_GROUPINGS = Object.freeze([
  "aggregate", "day", "week", "month", "weekday", "time_bucket",
  "entry_price_range", "trade_sequence",
  "previous_completed_outcome", "repeat_attempt", "holding_time_bucket",
  "share_quantity_bucket", "entry_notional_bucket",
  "direction", "symbol", "account",
]);
const ALL_FILTERS = Object.freeze([
  "date_range", "account", "symbol", "direction", "currency",
  "realized_outcome", "weekday", "entry_time_range", "exit_time_range",
  "entry_price_range", "sequence_in_session",
  "previous_completed_outcome", "holding_time_seconds", "repeat_attempt",
  "share_quantity_range", "entry_notional_range",
]);

function unitFor(key: TradeQueryMetricKey): string {
  if (key === "trading_day_count" || key.endsWith("trading_day_count")) return "days";
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
  if (DAILY_KEYS.has(key)) add("sessionDate", "finalExitAt", "netPnl");
  if (DIRECTION_KEYS.has(key)) add("direction");
  if (REPEAT_KEYS.has(key)) {
    add("stableInstrumentKey", "sessionDate", "firstEntryAt", "semanticRoundTripKey");
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
  if (REPEAT_KEYS.has(key)) add("canonical_symbol_session_attempt_order");
  if (STREAK_KEYS.has(key)) add("canonical_completed_trade_order", "realized_outcome");
  if (OUTCOME_KEYS.has(key)) add("realized_outcome");
  if (DAILY_KEYS.has(key)) add("canonical_completed_trade_order", "daily_realized_pnl");
  if (SECOND_KEYS.has(key)) add("completed_holding_duration");
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") add("complete_share_quantity_authority");
  if (key.includes("notional") || key.endsWith("position_size")) add("complete_entry_notional_authority");
  return Object.freeze(semantics);
}

function unavailablePolicyFor(key: TradeQueryMetricKey): string {
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares" ||
    key.includes("notional") || key.endsWith("position_size")) {
    return "ti_v3_query_required_authority_unavailable_or_zero_sample";
  }
  if (key === "profit_factor") return "ti_v3_query_profit_factor_zero_loss_denominator";
  if (key === "largest_winner_contribution" || key === "net_pnl_excluding_largest_winner") return "ti_v3_query_no_winning_trade";
  if (key === "largest_loser_contribution" || key === "net_pnl_excluding_largest_loser") return "ti_v3_query_no_losing_trade";
  if (ZERO_SAMPLE_ALLOWED_KEYS.has(key)) return "available_at_zero_population";
  return "ti_v3_query_zero_sample_or_zero_denominator";
}

function unavailableConditionsFor(key: TradeQueryMetricKey): readonly string[] {
  const conditions: string[] = [];
  const add = (...values: readonly string[]) => {
    for (const value of values) if (!conditions.includes(value)) conditions.push(value);
  };
  if (!ZERO_SAMPLE_ALLOWED_KEYS.has(key)) add("zero_total_population");
  if (key.includes("winner") || key.includes("winning")) add("no_winning_trade");
  if (key.includes("loser") || key.includes("losing")) add("no_losing_trade");
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") {
    add("incomplete_share_quantity_authority", "zero_share_quantity_denominator");
  }
  if (key.includes("notional") || key.endsWith("position_size")) {
    add("incomplete_entry_notional_authority", "zero_entry_notional_denominator");
  }
  if (RATIO_KEYS.has(key) && key !== "net_pnl_per_100_shares") add("zero_denominator");
  return Object.freeze(conditions);
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
    limitationCodes: Object.freeze([
      ...(ZERO_SAMPLE_ALLOWED_KEYS.has(key) ? [] : ["ti_v3_query_zero_sample"]),
      ...(requiredDerivedSemanticsFor(key).some((value) => value.startsWith("complete_"))
        ? ["ti_v3_query_required_authority_unavailable"]
        : []),
    ]),
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
    "unavailablePolicy", "unavailableConditions", "limitationCodes", "evidencePolicy",
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
