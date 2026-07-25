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
const ALL_GROUPINGS = Object.freeze([
  "aggregate", "day", "week", "month", "weekday", "time_bucket",
  "entry_price_range", "price_range", "trade_sequence",
  "previous_completed_outcome", "repeat_attempt", "holding_time_bucket",
  "share_quantity_bucket", "entry_notional_bucket", "position_size_bucket",
  "direction", "symbol", "account",
]);
const ALL_FILTERS = Object.freeze([
  "date_range", "account", "symbol", "direction", "currency",
  "realized_outcome", "weekday", "entry_time_range", "exit_time_range",
  "entry_price_range", "price_range", "sequence_in_session",
  "previous_completed_outcome", "holding_time_seconds", "repeat_attempt",
  "share_quantity_range", "entry_notional_range", "position_size",
]);

function unitFor(key: TradeQueryMetricKey): string {
  if (MONEY_KEYS.has(key)) return "money";
  if (RATIO_KEYS.has(key)) return "ratio";
  if (SECOND_KEYS.has(key)) return "seconds";
  if (SHARE_KEYS.has(key)) return "shares";
  return "trades";
}

function requiredFieldsFor(key: TradeQueryMetricKey): readonly string[] {
  if (SECOND_KEYS.has(key)) return Object.freeze(["firstEntryAt", "finalExitAt"]);
  if (SHARE_KEYS.has(key) || key === "net_pnl_per_100_shares") {
    return Object.freeze(["shareQuantity"]);
  }
  if (key.includes("entry_notional") || key.endsWith("position_size")) {
    return Object.freeze(["entryNotional"]);
  }
  if (QUERY_COUNT_KEYS.has(key)) return Object.freeze([]);
  return Object.freeze(["netPnl"]);
}

function buildDeclaration(key: TradeQueryMetricKey): TradeQueryMetricDeclaration {
  const unit = unitFor(key);
  const content = {
    schemaVersion: TRADE_QUERY_METRIC_DECLARATION_VERSION,
    metricKey: key,
    metricVersion: TRADE_QUERY_METRIC_VERSION,
    purposeCode: `ti_v3_metric_${key}`,
    requiredFields: requiredFieldsFor(key),
    requiredAuthority: Object.freeze(["dataset_receipt", "derivation_receipt", "partition"]),
    populationRequirement: QUERY_COUNT_KEYS.has(key) ? "query_counts" as const : "included_trades" as const,
    unit,
    currencyBehavior: MONEY_KEYS.has(key) ? "selected_partition" as const : "currency_independent" as const,
    calculationPolicy: `ti_v3_exact_${key}_v1`,
    aggregationBehavior: "shared_accumulator_projection" as const,
    compatibleGroupings: ALL_GROUPINGS,
    compatibleFilters: ALL_FILTERS,
    minimumSample: "0",
    unavailablePolicy: "explicit_reason_code",
    limitationCodes: Object.freeze([
      "ti_v3_query_zero_sample",
      "ti_v3_query_required_authority_unavailable",
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
    "requiredFields", "requiredAuthority", "populationRequirement", "unit",
    "currencyBehavior", "calculationPolicy", "aggregationBehavior",
    "compatibleGroupings", "compatibleFilters", "minimumSample",
    "unavailablePolicy", "limitationCodes", "evidencePolicy",
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
