import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import {
  buildTradeQueryPlan,
  verifyTradeQueryPlan,
  type TradeQueryPlan,
} from "../contracts/query-plan";
import { buildTradeQueryResult, type TradeQueryResult, type TradeQueryResultRow } from "../contracts/query-result";
import { buildTradeQueryEvidence } from "../evidence/query-evidence";
import { applyTradeQueryFilters } from "../filters/filter-engine";
import {
  openReadOnlyTradeQueryGateway,
  type VerifiedTradeQueryDatasetSource,
} from "../gateway/read-only-query-gateway";
import {
  groupTradeQueryRows,
  type TradeQueryGroup,
} from "../grouping/grouping-engine";
import {
  calculateTradeQueryMetrics,
  metricSortValue,
} from "../metrics/query-metrics";
import { getTradeQueryMetricDeclaration } from "../metrics/metric-registry";
import { buildQueryRowSemantics } from "./row-semantics";
import { markVerifiedTradeQueryExecution } from "./verified-execution";

export const TRADE_QUERY_EXECUTOR_KEY = "ti_v3_generic_trade_query_executor" as const;
export const TRADE_QUERY_EXECUTOR_VERSION = "v1" as const;

export interface TradeQueryExecutionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly queryPlan: unknown;
}

type OrderableResultRow = Pick<
  TradeQueryResultRow,
  "groupIdentity" | "canonicalOrder" | "metrics"
>;

interface ProjectedGroupRow extends OrderableResultRow {
  readonly groupLabel: string;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly limitationCodes: readonly string[];
  readonly group: TradeQueryGroup;
}

function metricFor(row: OrderableResultRow, key: string): ExactMetricValue | null {
  return row.metrics.find((metric) => metric.metricKey === key) ?? null;
}

function compareMetrics(left: ExactMetricValue | null, right: ExactMetricValue | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const leftValue = metricSortValue(left);
  const rightValue = metricSortValue(right);
  if (leftValue === null && rightValue === null) return 0;
  if (leftValue === null) return 1;
  if (rightValue === null) return -1;
  const comparison = leftValue[0] * rightValue[1] - rightValue[0] * leftValue[1];
  return comparison < BigInt("0") ? -1 : comparison > BigInt("0") ? 1 : 0;
}

function orderRows<T extends OrderableResultRow>(
  rows: readonly T[],
  plan: TradeQueryPlan,
): readonly T[] {
  return Object.freeze([...rows].sort((left, right) => {
    for (const ordering of plan.ordering) {
      const comparison = ordering.by === "group_identity"
        ? compareUnicodeCodePoints(left.groupIdentity, right.groupIdentity)
        : compareMetrics(
            metricFor(left, ordering.metricKey as string),
            metricFor(right, ordering.metricKey as string),
          );
      if (comparison !== 0) return ordering.direction === "ascending" ? comparison : -comparison;
    }
    return compareUnicodeCodePoints(left.canonicalOrder, right.canonicalOrder) ||
      compareUnicodeCodePoints(left.groupIdentity, right.groupIdentity);
  }));
}

function boundedRows<T>(rows: readonly T[], maximum: string): readonly T[] {
  const result: T[] = [];
  for (const row of rows) {
    if (BigInt(result.length) >= BigInt(maximum)) break;
    result.push(row);
  }
  return Object.freeze(result);
}

const OUTCOME_DEPENDENT_FILTERS = new Set([
  "realized_outcome",
  "previous_completed_outcome",
  "prior_completed_streak",
  "pre_entry_daily_state",
  "pre_entry_daily_path",
]);

const OUTCOME_DEPENDENT_GROUPINGS = new Set([
  "previous_completed_outcome",
  "prior_completed_streak_bucket",
  "pre_entry_daily_state",
]);

function groupingRequiresChargeCoverage(grouping: TradeQueryPlan["grouping"]): boolean {
  if (grouping.kind === "compound") {
    return grouping.dimensions.some((dimension) => groupingRequiresChargeCoverage(dimension));
  }
  return OUTCOME_DEPENDENT_GROUPINGS.has(grouping.kind);
}

function planRequiresChargeCoverage(plan: TradeQueryPlan): boolean {
  return plan.metrics.some((key) => getTradeQueryMetricDeclaration(key)
    .unavailableReasonCodes.includes("ti_v3_query_charge_coverage_unknown")) ||
    plan.filters.some((filter) => OUTCOME_DEPENDENT_FILTERS.has(filter.kind)) ||
    groupingRequiresChargeCoverage(plan.grouping);
}

function groupCounts(
  group: TradeQueryGroup,
  candidateByIdentity: ReadonlyMap<string, TradeQueryGroup>,
): Readonly<{
  candidateCount: string; includedCount: string; excludedCount: string;
}> {
  const candidateCount = candidateByIdentity.get(group.groupIdentity)?.rows.length;
  if (candidateCount === undefined || candidateCount < group.rows.length) {
    throw new Error("ti_v3_query_group_count_authority_mismatch");
  }
  return Object.freeze({
    candidateCount: String(candidateCount),
    includedCount: String(group.rows.length),
    excludedCount: String(candidateCount - group.rows.length),
  });
}

export function executeTradeQuery(
  request: TradeQueryExecutionRequest,
): ExactResult<TradeQueryResult, AnalyticalContractFailure> {
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  const authority = gateway.value.authority;
  const queryPlanRecord = request.queryPlan as { readonly queryPlanDigest?: unknown } | null;
  const plan = queryPlanRecord !== null && typeof queryPlanRecord === "object" &&
    typeof queryPlanRecord.queryPlanDigest === "string"
    ? verifyTradeQueryPlan(request.queryPlan, authority)
    : buildTradeQueryPlan(request.queryPlan, authority);
  if (!plan.ok) return plan;
  const data = gateway.value.readBoundedRows(plan.value);
  if (!data.ok) return data;
  const semantics = buildQueryRowSemantics(data.value.rows);
  const filtered = applyTradeQueryFilters(semantics, plan.value.filters);
  if (
    filtered.included.some((row) => row.row.limitationCodes.includes("ti_v3_analytics_charge_coverage_unknown")) &&
    planRequiresChargeCoverage(plan.value)
  ) return contractFailure("ti_v3_analytics_charge_coverage_unknown", "$.queryPlan.chargeCoverage");
  const sourceFilterRequested = plan.value.filters.some((filter) =>
    filter.kind === "source_identity" || filter.kind === "broker_code" || filter.kind === "source_kind");
  const sourceAuthorityUnavailable = sourceFilterRequested && semantics.some((item) =>
    item.row.sourceAuthority.state === "unavailable");
  const candidateGroups = groupTradeQueryRows(semantics, plan.value.grouping);
  const groups = groupTradeQueryRows(filtered.included, plan.value.grouping);
  if (BigInt(groups.length) > BigInt(plan.value.limits.groupLimit)) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.result.groups");
  }
  const candidateByIdentity = new Map(
    candidateGroups.map((group) => [group.groupIdentity, group]),
  );

  const totalCandidateCount = authority.partitionReceipt.candidateCount;
  const includedCount = String(filtered.included.length);
  const excludedCount = (
    BigInt(data.value.excludedCandidates.length) + BigInt(filtered.excluded.length)
  ).toString();
  if (BigInt(totalCandidateCount) !== BigInt(includedCount) + BigInt(excludedCount)) {
    return contractFailure("ti_v3_analytics_contract_count_mismatch", "$.result.counts");
  }

  const projectedRows: ProjectedGroupRow[] = [];
  for (const group of groups) {
    const isAggregate = plan.value.grouping.kind === "aggregate";
    const counts = isAggregate
      ? { candidateCount: totalCandidateCount, includedCount, excludedCount }
      : groupCounts(group, candidateByIdentity);
    projectedRows.push(Object.freeze({
      groupIdentity: group.groupIdentity,
      groupLabel: group.groupLabel,
      canonicalOrder: group.canonicalOrder,
      candidateCount: counts.candidateCount,
      includedCount: String(group.rows.length),
      excludedCount: counts.excludedCount,
      metrics: calculateTradeQueryMetrics(
        plan.value.metrics,
        group.rows,
        counts,
        plan.value.authority.currency,
      ),
      limitationCodes: Object.freeze([]),
      group,
    }));
  }
  const orderedProjectedRows = orderRows(projectedRows, plan.value);
  const boundedProjectedRows = boundedRows(
    orderedProjectedRows,
    plan.value.limits.resultRowLimit,
  );
  const resultWasBounded = boundedProjectedRows.length < orderedProjectedRows.length;
  const sourceExclusionsUnassigned = (
    plan.value.grouping.kind !== "aggregate" &&
    data.value.excludedCandidates.length > 0
  );
  const evidence = [];
  const rows: TradeQueryResultRow[] = [];
  let remainingEvidence = BigInt(plan.value.limits.totalEvidenceLimit);
  for (let index = 0; index < boundedProjectedRows.length; index += 1) {
    const projected = boundedProjectedRows[index];
    const groupsRemainingAfter = BigInt(boundedProjectedRows.length - index - 1);
    const availableForGroup = remainingEvidence - groupsRemainingAfter;
    const perGroup = BigInt(plan.value.limits.evidencePerGroup);
    const allocation = availableForGroup < perGroup ? availableForGroup : perGroup;
    const builtEvidence = buildTradeQueryEvidence(
      plan.value,
      projected.group.groupIdentity,
      projected.group.rows,
      allocation.toString(),
    );
    if (!builtEvidence.ok) return builtEvidence;
    remainingEvidence -= BigInt(builtEvidence.value.candidates.length);
    evidence.push(builtEvidence.value);
    rows.push(Object.freeze({
      groupIdentity: projected.groupIdentity,
      groupLabel: projected.groupLabel,
      canonicalOrder: projected.canonicalOrder,
      candidateCount: projected.candidateCount,
      includedCount: projected.includedCount,
      excludedCount: projected.excludedCount,
      metrics: projected.metrics,
      evidenceDigest: builtEvidence.value.evidenceDigest,
      limitationCodes: Object.freeze([...new Set([
        ...builtEvidence.value.limitationCodes,
        ...(sourceExclusionsUnassigned
          ? ["ti_v3_query_group_source_exclusions_unassigned"]
          : []),
      ])].sort(compareUnicodeCodePoints)),
    }));
  }
  const limitationCodes = [...new Set([
    ...authority.partitionReceipt.limitationCodes,
    ...evidence.flatMap((item) => item.limitationCodes),
    ...(sourceAuthorityUnavailable
      ? ["ti_v3_query_source_authority_unavailable"]
      : []),
    ...(resultWasBounded ? ["ti_v3_query_result_rows_bounded"] : []),
    ...(sourceExclusionsUnassigned
      ? ["ti_v3_query_group_source_exclusions_unassigned"]
      : []),
  ])].sort(compareUnicodeCodePoints);
  const diagnostics = [];
  if (filtered.excluded.length > 0) diagnostics.push(Object.freeze({
    code: "ti_v3_query_filter_exclusions_present",
    affectedKeys: Object.freeze([plan.value.queryPlanDigest]),
  }));
  if (data.value.excludedCandidates.length > 0) diagnostics.push(Object.freeze({
    code: "ti_v3_query_source_exclusions_present",
    affectedKeys: Object.freeze([plan.value.authority.partitionDigest]),
  }));
  if (sourceAuthorityUnavailable) diagnostics.push(Object.freeze({
    code: "ti_v3_query_source_filter_partial_authority",
    affectedKeys: Object.freeze([plan.value.queryPlanDigest]),
  }));
  if (BigInt(diagnostics.length) > BigInt(plan.value.limits.diagnosticLimit)) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.result.diagnostics");
  }
  const excludedCandidateKeys = [
    ...data.value.excludedCandidates.map((candidate) => candidate.candidateKey),
    ...filtered.excluded.map((item) => `query_filter:${item.row.semanticRoundTripKey}`),
  ].sort(compareUnicodeCodePoints);
  const boundedExcludedKeys: string[] = [];
  for (const key of excludedCandidateKeys) {
    if (BigInt(boundedExcludedKeys.length) >= BigInt(plan.value.limits.totalEvidenceLimit)) break;
    boundedExcludedKeys.push(key);
  }
  const result = buildTradeQueryResult({
    schemaVersion: "ti_v3_trade_query_result_v1",
    runContext: Object.freeze({
      executorKey: TRADE_QUERY_EXECUTOR_KEY,
      executorVersion: TRADE_QUERY_EXECUTOR_VERSION,
      gatewayKey: gateway.value.gatewayKey,
      gatewayVersion: gateway.value.gatewayVersion,
    }),
    normalizedQueryPlan: plan.value,
    rows: Object.freeze(rows),
    candidateCount: totalCandidateCount,
    includedCount,
    excludedCount,
    evidence: Object.freeze(evidence),
    excludedCandidateKeys: Object.freeze(boundedExcludedKeys),
    limitationCodes: Object.freeze(limitationCodes),
    diagnostics: Object.freeze(diagnostics),
  });
  return result.ok
    ? { ok: true, value: markVerifiedTradeQueryExecution(result.value) }
    : result;
}
