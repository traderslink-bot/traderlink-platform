import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import {
  absoluteExactDecimal,
  compareCanonicalDecimals,
  decimalMetric,
  quotientMetric,
  ratioFromCounts,
  ratioFromDecimals,
  sumExactDecimals,
  unavailableMetric,
} from "../../tools/weekday";
import { buildTradeQueryEvidence, type TradeQueryEvidence } from "../evidence/query-evidence";
import { applyTradeQueryFilters } from "../filters/filter-engine";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { groupTradeQueryRows, type TradeQueryGroup } from "../grouping/grouping-engine";
import { buildTradeQueryPlan, verifyTradeQueryPlan, TRADE_QUERY_LIMITS } from "../contracts/query-plan";
import { buildQueryRowSemantics, type QueryRowSemantics } from "../execution/row-semantics";

export const TRADE_QUERY_ATTRIBUTION_RESULT_VERSION = "ti_v3_trade_query_attribution_result_v1" as const;

export interface TradeQueryAttributionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly queryPlan: unknown;
}

export interface TradeQueryAttributionSegment {
  readonly segmentIdentity: string;
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly netPnl: ExactMetricValue;
  readonly netPnlContribution: ExactMetricValue;
  readonly gainPnlContribution: ExactMetricValue;
  readonly lossMagnitudeContribution: ExactMetricValue;
  readonly tradeFrequency: ExactMetricValue;
  readonly averageNetPnl: ExactMetricValue;
  readonly signedCharges: ExactMetricValue;
  readonly signedChargeContribution: ExactMetricValue;
  readonly largestAbsoluteNetPnlContribution: ExactMetricValue;
  readonly evidenceDigest: CanonicalContentDigest;
  readonly limitationCodes: readonly string[];
}

export interface TradeQueryAttributionResult {
  readonly schemaVersion: typeof TRADE_QUERY_ATTRIBUTION_RESULT_VERSION;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly attributionPolicy: "within_period_segment_contribution_v1";
  readonly authorityState: "available" | "limited";
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly segments: readonly TradeQueryAttributionSegment[];
  readonly evidence: readonly TradeQueryEvidence[];
  readonly limitationCodes: readonly string[];
  readonly resultDigest: CanonicalContentDigest;
}

interface Totals {
  readonly netPnl: string;
  readonly gains: string;
  readonly lossMagnitude: string;
  readonly signedCharges: string;
  readonly absoluteNetPnl: string;
}

function sum(values: readonly string[]): string {
  const result = sumExactDecimals(values);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

function totals(rows: readonly QueryRowSemantics[]): Totals {
  const netPnl = rows.map((row) => row.row.netPnl);
  const gains = netPnl.filter((value) => compareCanonicalDecimals(value, "0") > 0);
  const losses = netPnl.filter((value) => compareCanonicalDecimals(value, "0") < 0);
  const lossMagnitude = losses.map((value) => {
    const absolute = absoluteExactDecimal(value);
    if (!absolute.ok) throw new Error(absolute.error.code);
    return absolute.value;
  });
  const absoluteNetPnl = netPnl.map((value) => {
    const absolute = absoluteExactDecimal(value);
    if (!absolute.ok) throw new Error(absolute.error.code);
    return absolute.value;
  });
  return Object.freeze({
    netPnl: sum(netPnl), gains: sum(gains), lossMagnitude: sum(lossMagnitude),
    signedCharges: sum(rows.map((row) => row.row.signedCharges)), absoluteNetPnl: sum(absoluteNetPnl),
  });
}

function ratioOrUnavailable(key: string, numerator: string, denominator: string): ExactMetricValue {
  return denominator === "0"
    ? unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator")
    : ratioFromDecimals(key, numerator, denominator);
}

function groupCounts(group: TradeQueryGroup, candidates: ReadonlyMap<string, TradeQueryGroup>) {
  const candidate = candidates.get(group.groupIdentity)?.rows.length;
  if (candidate === undefined || candidate < group.rows.length) throw new Error("ti_v3_query_attribution_group_count_mismatch");
  return Object.freeze({ candidateCount: String(candidate), includedCount: String(group.rows.length), excludedCount: String(candidate - group.rows.length) });
}

function segmentIdentity(queryPlanDigest: string, groupIdentity: string): string {
  return `attribution:${queryPlanDigest.length}:${queryPlanDigest}|${groupIdentity.length}:${groupIdentity}`;
}

export function executeTradeQueryAttribution(
  request: TradeQueryAttributionRequest,
): { readonly ok: true; readonly value: TradeQueryAttributionResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  const queryPlanRecord = request.queryPlan as { readonly queryPlanDigest?: unknown } | null;
  const plan = queryPlanRecord !== null && typeof queryPlanRecord === "object" && typeof queryPlanRecord.queryPlanDigest === "string"
    ? verifyTradeQueryPlan(request.queryPlan, gateway.value.authority)
    : buildTradeQueryPlan(request.queryPlan, gateway.value.authority);
  if (!plan.ok) return plan;
  if (plan.value.grouping.kind === "aggregate") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.queryPlan.grouping");
  }
  const data = gateway.value.readBoundedRows(plan.value);
  if (!data.ok) return data;
  const semantics = buildQueryRowSemantics(data.value.rows);
  const filtered = applyTradeQueryFilters(semantics, plan.value.filters);
  const candidateGroups = groupTradeQueryRows(semantics, plan.value.grouping);
  const groups = groupTradeQueryRows(filtered.included, plan.value.grouping);
  if (BigInt(groups.length) > BigInt(plan.value.limits.groupLimit)) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.attribution.groups");
  }
  const orderedGroups: TradeQueryGroup[] = [];
  for (const group of groups) {
    if (BigInt(orderedGroups.length) >= BigInt(plan.value.limits.resultRowLimit)) break;
    orderedGroups.push(group);
  }
  const candidateByIdentity = new Map(candidateGroups.map((group) => [group.groupIdentity, group]));
  const total = totals(filtered.included);
  const evidence: TradeQueryEvidence[] = [];
  const segments: TradeQueryAttributionSegment[] = [];
  let remainingEvidence = BigInt(plan.value.limits.totalEvidenceLimit);
  for (const group of orderedGroups) {
    const counts = groupCounts(group, candidateByIdentity);
    const groupTotal = totals(group.rows);
    const largestAbsolute = group.rows.map((row) => {
      const absolute = absoluteExactDecimal(row.row.netPnl);
      if (!absolute.ok) throw new Error(absolute.error.code);
      return absolute.value;
    }).sort(compareCanonicalDecimals).at(-1) ?? "0";
    const allocation = remainingEvidence < BigInt(plan.value.limits.evidencePerGroup)
      ? remainingEvidence : BigInt(plan.value.limits.evidencePerGroup);
    const built = buildTradeQueryEvidence(plan.value, group.groupIdentity, group.rows, allocation.toString());
    if (!built.ok) return built;
    remainingEvidence -= BigInt(built.value.candidates.length);
    evidence.push(built.value);
    segments.push(Object.freeze({
      segmentIdentity: segmentIdentity(plan.value.queryPlanDigest, group.groupIdentity),
      groupIdentity: group.groupIdentity, groupLabel: group.groupLabel, canonicalOrder: group.canonicalOrder,
      ...counts,
      netPnl: decimalMetric("net_pnl", "money", plan.value.authority.currency, groupTotal.netPnl),
      netPnlContribution: ratioOrUnavailable("net_pnl_contribution", groupTotal.netPnl, total.netPnl),
      gainPnlContribution: ratioOrUnavailable("gain_pnl_contribution", groupTotal.gains, total.gains),
      lossMagnitudeContribution: ratioOrUnavailable("loss_magnitude_contribution", groupTotal.lossMagnitude, total.lossMagnitude),
      tradeFrequency: ratioFromCounts("trade_frequency", counts.includedCount, String(filtered.included.length)),
      averageNetPnl: quotientMetric("average_net_pnl", "money", plan.value.authority.currency, groupTotal.netPnl, counts.includedCount),
      signedCharges: decimalMetric("signed_charges", "money", plan.value.authority.currency, groupTotal.signedCharges),
      signedChargeContribution: ratioOrUnavailable("signed_charge_contribution", groupTotal.signedCharges, total.signedCharges),
      largestAbsoluteNetPnlContribution: ratioOrUnavailable("largest_absolute_net_pnl_contribution", largestAbsolute, total.absoluteNetPnl),
      evidenceDigest: built.value.evidenceDigest,
      limitationCodes: built.value.limitationCodes,
    }));
  }
  const sourceExclusionsUnassigned = data.value.excludedCandidates.length > 0;
  const resultBounded = orderedGroups.length < groups.length;
  const limitationCodes = Object.freeze([...new Set([
    ...gateway.value.authority.partitionReceipt.limitationCodes,
    ...evidence.flatMap((item) => item.limitationCodes),
    ...(sourceExclusionsUnassigned ? ["ti_v3_query_group_source_exclusions_unassigned"] : []),
    ...(resultBounded ? ["ti_v3_query_result_rows_bounded"] : []),
  ])].sort(compareUnicodeCodePoints));
  const body = {
    schemaVersion: TRADE_QUERY_ATTRIBUTION_RESULT_VERSION,
    queryPlanDigest: plan.value.queryPlanDigest,
    attributionPolicy: "within_period_segment_contribution_v1" as const,
    authorityState: limitationCodes.length === 0 ? "available" as const : "limited" as const,
    candidateCount: gateway.value.authority.partitionReceipt.candidateCount,
    includedCount: String(filtered.included.length),
    excludedCount: (BigInt(data.value.excludedCandidates.length) + BigInt(filtered.excluded.length)).toString(),
    segments: Object.freeze(segments), evidence: Object.freeze(evidence), limitationCodes,
  };
  if (BigInt(body.candidateCount) !== BigInt(body.includedCount) + BigInt(body.excludedCount)) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.attribution.counts");
  }
  const serialized = serializeCanonicalValue(body);
  if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumResultCodeUnits) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.attribution.result");
  }
  return finalizeContentAddressedAuthority("trade_query_attribution_result", body, "resultDigest") as
    | { readonly ok: true; readonly value: TradeQueryAttributionResult }
    | { readonly ok: false; readonly error: AnalyticalContractFailure };
}
