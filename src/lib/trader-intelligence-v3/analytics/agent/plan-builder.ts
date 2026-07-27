import { contractFailure, type AnalyticalContractFailure } from "../contracts";
import {
  buildTradeQueryPlan,
  compileGa1BPreset,
  openReadOnlyTradeQueryGateway,
  TRADE_QUERY_POLICY,
  type Ga1BPreset,
  type Ga1BPresetKey,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
  type TradeQueryPlan,
} from "../query";
import type { AnalyticsAgentExecutionRequest, AnalyticsAgentIntentResolution } from "./contracts";

const CORE_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "gross_pnl", "net_pnl",
  "signed_charges", "gross_net_difference", "win_rate", "expectancy", "profit_factor",
] as const satisfies readonly TradeQueryMetricKey[]);

const DATA_QUALITY_METRICS = Object.freeze([
  "candidate_count", "included_count", "excluded_count", "limited_analytical_trade_count",
  "missing_charge_coverage_trade_count", "missing_share_quantity_authority_count",
  "missing_entry_notional_authority_count", "unavailable_source_authority_trade_count",
] as const satisfies readonly TradeQueryMetricKey[]);

interface PlanDefinition {
  readonly capabilityKey: string;
  readonly execution: "direct" | "preset";
  readonly grouping?: TradeQueryGrouping;
  readonly metrics?: readonly TradeQueryMetricKey[];
  readonly filters?: readonly TradeQueryFilter[];
  readonly presetKey?: Ga1BPresetKey;
}

function exactScope(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function sameScope(left: readonly string[], right: readonly string[]): boolean {
  const a = exactScope(left);
  const b = exactScope(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function definition(resolution: AnalyticsAgentIntentResolution): PlanDefinition | null {
  switch (resolution.intent) {
    case "core_performance":
      return { capabilityKey: "core_performance", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [] };
    case "time_of_day_performance":
      return { capabilityKey: "time_and_session_performance", execution: "direct", grouping: { kind: "time_bucket", source: "entry", bucketMinutes: "60" }, metrics: CORE_METRICS, filters: [] };
    case "ticker_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "symbol" }, metrics: CORE_METRICS, filters: [] };
    case "price_range_performance":
      return resolution.priceRange === null
        ? { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "entry_price_range", boundaries: ["1", "5", "10"] }, metrics: CORE_METRICS, filters: [] }
        : { capabilityKey: "ticker_price_size_hold_direction", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [{ kind: "entry_price_range", ...resolution.priceRange }] };
    case "prior_outcome_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "aggregate" }, metrics: CORE_METRICS, filters: [{ kind: "previous_completed_outcome", values: [resolution.previousOutcome ?? "loss"] }] };
    case "trade_sequence_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "trade_sequence_bucket" }, metrics: CORE_METRICS, filters: [] };
    case "repeat_attempt_behavior":
      return { capabilityKey: "sequencing_and_behavior", execution: "direct", grouping: { kind: "repeat_attempt_bucket" }, metrics: CORE_METRICS, filters: [] };
    case "holding_time_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_holding_time" };
    case "direction_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_long_vs_short" };
    case "position_size_performance":
      return { capabilityKey: "ticker_price_size_hold_direction", execution: "preset", presetKey: "analyze_position_size_performance" };
    case "period_comparison":
      return { capabilityKey: "daily_and_period_performance", execution: "preset", presetKey: "compare_periods" };
    case "giveback_drawdown":
      return { capabilityKey: "giveback_and_drawdown", execution: "direct", grouping: { kind: "day" }, metrics: ["candidate_count", "included_count", "excluded_count", "net_pnl", "maximum_intraday_drawdown", "maximum_peak_profit_giveback"], filters: [] };
    case "fee_impact":
      return { capabilityKey: "charges_and_fee_impact", execution: "direct", grouping: { kind: "aggregate" }, metrics: ["candidate_count", "included_count", "excluded_count", "gross_pnl", "net_pnl", "signed_charges", "gross_net_difference", "fees_as_percentage_of_gross_profit"], filters: [] };
    case "data_quality":
      return { capabilityKey: "deterministic_findings_and_samples", execution: "direct", grouping: { kind: "aggregate" }, metrics: DATA_QUALITY_METRICS, filters: [] };
    default:
      return null;
  }
}

export function buildAnalyticsAgentPlan(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
): { readonly ok: true; readonly value: Readonly<{ readonly capabilityKey: string; readonly plan: TradeQueryPlan | null; readonly preset: Ga1BPreset | null }> } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const selected = definition(resolution);
  if (selected === null) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  if (!sameScope(request.ownerScope, request.partitionReceipt.ownerScope) || !sameScope(request.accountScope, request.partitionReceipt.accountScope)) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.analyticsAgent.scope");
  }
  const filters: TradeQueryFilter[] = [
    ...(selected.filters ?? []),
    ...(request.dateRange === undefined ? [] : [{ kind: "date_range" as const, ...request.dateRange }]),
    ...(request.symbol === undefined ? [] : [{ kind: "symbol" as const, values: [request.symbol] }]),
    ...(request.filters ?? []),
  ];
  if (selected.execution === "preset") {
    if (selected.presetKey === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
    const comparisonDateRange = request.comparisonDateRange;
    if (selected.presetKey === "compare_periods" && (request.dateRange === undefined || comparisonDateRange === undefined)) {
      return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.comparisonDateRange");
    }
    const compiled = compileGa1BPreset({
      presetKey: selected.presetKey,
      authority: gateway.value.authority,
      filters,
      ...(selected.presetKey === "compare_periods"
        ? {
          baselineFilters: [
            { kind: "date_range" as const, ...comparisonDateRange! },
            ...(request.symbol === undefined ? [] : [{ kind: "symbol" as const, values: [request.symbol] }]),
            ...(request.filters ?? []),
          ],
        }
        : {}),
    });
    return compiled.ok
      ? { ok: true, value: Object.freeze({ capabilityKey: selected.capabilityKey, plan: null, preset: compiled.value }) }
      : compiled;
  }
  if (selected.grouping === undefined || selected.metrics === undefined) return contractFailure("ti_v3_analytics_contract_invalid", "$.analyticsAgent.intent");
  const ordering = selected.metrics.includes("net_pnl")
    ? [{ by: "metric" as const, metricKey: "net_pnl" as const, direction: "ascending" as const }]
    : [{ by: "group_identity" as const, metricKey: null, direction: "ascending" as const }];
  const authority = gateway.value.authority;
  const plan = buildTradeQueryPlan({
    schemaVersion: "ti_v3_trade_query_plan_v1",
    queryPlanKey: "generic_deterministic_trade_query",
    queryPlanVersion: "v1",
    authority: {
      snapshotDigest: authority.datasetReceipt.snapshotDigest,
      canonicalFilterDigest: authority.datasetReceipt.filterDigest,
      datasetReceiptDigest: authority.datasetReceipt.receiptDigest,
      datasetDerivationDigest: authority.datasetDerivationReceipt.derivationDigest,
      partitionDigest: authority.partitionReceipt.partitionDigest,
      currency: authority.partitionReceipt.currency,
      ownerScope: authority.partitionReceipt.ownerScope,
      accountScope: authority.partitionReceipt.accountScope,
    },
    filters,
    grouping: selected.grouping,
    metrics: selected.metrics,
    ordering,
    limits: { groupLimit: "64", resultRowLimit: "64", evidencePerGroup: "8", totalEvidenceLimit: "128", diagnosticLimit: "32" },
    policies: TRADE_QUERY_POLICY,
  }, authority);
  return plan.ok ? { ok: true, value: Object.freeze({ capabilityKey: selected.capabilityKey, plan: plan.value, preset: null }) } : plan;
}
