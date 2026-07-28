import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import {
  addExactDecimals,
  createExactRatio,
  decimalToExactRatio,
  negateExactDecimal,
  type ExactRatio,
  validateExactDecimal,
} from "../../../domain/exact";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateContractRecord,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import { absoluteExactDecimal, compareCanonicalDecimals, decimalMetric, ratioFromDecimals, ratioMetric, sumExactDecimals, unavailableMetric } from "../../tools/weekday";
import { buildTradeQueryEvidence, type TradeQueryEvidence } from "../evidence/query-evidence";
import { applyTradeQueryFilters } from "../filters/filter-engine";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { buildTradeQueryPlan, verifyTradeQueryPlan, TRADE_QUERY_LIMITS } from "../contracts/query-plan";
import { buildQueryRowSemantics, type QueryRowSemantics } from "../execution/row-semantics";

export const TRADE_QUERY_DISTRIBUTION_RESULT_VERSION = "ti_v3_trade_query_distribution_result_v1" as const;

export type TradeQueryDistributionMeasure =
  | "net_pnl" | "winning_net_pnl" | "losing_net_pnl" | "signed_charges"
  | "holding_seconds" | "share_quantity" | "entry_notional" | "daily_net_pnl";

export interface TradeQueryDistributionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly queryPlan: unknown;
  readonly distribution: unknown;
}

export interface TradeQueryDistributionBucket {
  readonly bucketIdentity: string;
  readonly lowerInclusive: string | null;
  readonly upperExclusive: string | null;
  readonly count: string;
  readonly evidenceDigest: CanonicalContentDigest | null;
}

export interface TradeQueryDistributionResult {
  readonly schemaVersion: typeof TRADE_QUERY_DISTRIBUTION_RESULT_VERSION;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly measure: TradeQueryDistributionMeasure;
  readonly unit: "money" | "seconds" | "shares";
  readonly currency: string | null;
  readonly percentilePolicy: "nearest_rank_quartiles_and_exact_median_v1";
  readonly populationCount: string;
  readonly availableValueCount: string;
  readonly availability: "available" | "unavailable";
  readonly statistics: readonly ExactMetricValue[];
  readonly findings: TradeQueryDistributionFindings;
  readonly buckets: readonly TradeQueryDistributionBucket[];
  readonly evidence: readonly TradeQueryEvidence[];
  readonly limitationCodes: readonly string[];
  readonly resultDigest: CanonicalContentDigest;
}

export interface TradeQueryDistributionFindings {
  readonly tailPolicy: "strict_outer_quartile_tails_and_tukey_1_5_iqr_v1";
  readonly lowerTailCount: string;
  readonly upperTailCount: string;
  readonly lowerTailTotal: ExactMetricValue;
  readonly upperTailTotal: ExactMetricValue;
  readonly largestAbsoluteValueConcentration: ExactMetricValue;
  readonly lowerOutlierFence: ExactMetricValue;
  readonly upperOutlierFence: ExactMetricValue;
  readonly lowerOutlierCount: string;
  readonly upperOutlierCount: string;
  readonly outlierEvidenceDigest: CanonicalContentDigest | null;
}

interface DistributionSpec {
  readonly measure: TradeQueryDistributionMeasure;
  readonly bucketBoundaries: readonly string[];
}

interface DistributionValue {
  readonly value: string;
  readonly rows: readonly QueryRowSemantics[];
}

const MEASURES = new Set<TradeQueryDistributionMeasure>([
  "net_pnl", "winning_net_pnl", "losing_net_pnl", "signed_charges",
  "holding_seconds", "share_quantity", "entry_notional", "daily_net_pnl",
]);

function sum(values: readonly string[]): string {
  const result = sumExactDecimals(values);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

function exact(value: string) {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error(parsed.error.code);
  return parsed.value;
}

function normalizeSpec(input: unknown): { readonly ok: true; readonly value: DistributionSpec } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, ["measure", "bucketBoundaries"], [], "$.distribution");
  if (!record.ok || typeof record.value.measure !== "string" || !MEASURES.has(record.value.measure as TradeQueryDistributionMeasure)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.distribution.measure");
  }
  if (!Array.isArray(record.value.bucketBoundaries) || record.value.bucketBoundaries.length === 0 ||
    record.value.bucketBoundaries.length > TRADE_QUERY_LIMITS.maximumDistributionBuckets) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.distribution.bucketBoundaries");
  }
  const boundaries: string[] = [];
  for (let index = 0; index < record.value.bucketBoundaries.length; index += 1) {
    const parsed = validateExactDecimal(record.value.bucketBoundaries[index]);
    if (!parsed.ok) return contractFailure("ti_v3_analytics_contract_invalid", `$.distribution.bucketBoundaries[${index}]`);
    boundaries.push(parsed.value);
  }
  boundaries.sort(compareCanonicalDecimals);
  if (new Set(boundaries).size !== boundaries.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.distribution.bucketBoundaries");
  }
  return { ok: true, value: Object.freeze({
    measure: record.value.measure as TradeQueryDistributionMeasure,
    bucketBoundaries: Object.freeze(boundaries),
  }) };
}

function details(measure: TradeQueryDistributionMeasure, currency: string) {
  return measure === "holding_seconds"
    ? { unit: "seconds" as const, currency: null }
    : measure === "share_quantity"
      ? { unit: "shares" as const, currency: null }
      : { unit: "money" as const, currency };
}

function dailyValues(rows: readonly QueryRowSemantics[]): readonly DistributionValue[] {
  const byDate = new Map<string, QueryRowSemantics[]>();
  for (const row of rows) {
    const existing = byDate.get(row.row.sessionDate);
    if (existing === undefined) byDate.set(row.row.sessionDate, [row]);
    else existing.push(row);
  }
  return Object.freeze([...byDate.entries()].sort((left, right) => compareUnicodeCodePoints(left[0], right[0]))
    .map(([, dayRows]) => Object.freeze({ value: sum(dayRows.map((row) => row.row.netPnl)), rows: Object.freeze(dayRows) })));
}

function valuesFor(measure: TradeQueryDistributionMeasure, rows: readonly QueryRowSemantics[]) {
  if (measure === "daily_net_pnl") return { values: dailyValues(rows), unavailable: false };
  const selected = measure === "winning_net_pnl" ? rows.filter((row) => row.outcome === "gain")
    : measure === "losing_net_pnl" ? rows.filter((row) => row.outcome === "loss") : rows;
  const values: DistributionValue[] = [];
  for (const row of selected) {
    if (measure === "share_quantity") {
      if (row.row.shareQuantity.state !== "available") return { values: Object.freeze([]), unavailable: true };
      values.push(Object.freeze({ value: row.row.shareQuantity.quantity, rows: Object.freeze([row]) }));
    } else if (measure === "entry_notional") {
      if (row.row.entryNotional.state !== "available") return { values: Object.freeze([]), unavailable: true };
      values.push(Object.freeze({ value: row.row.entryNotional.amount, rows: Object.freeze([row]) }));
    } else {
      values.push(Object.freeze({
        value: measure === "holding_seconds" ? row.holdingSecondsFloor.toString()
          : measure === "signed_charges" ? row.row.signedCharges : row.row.netPnl,
        rows: Object.freeze([row]),
      }));
    }
  }
  return { values: Object.freeze(values), unavailable: false };
}

function nearestRank(values: readonly string[], numerator: number): string | null {
  if (values.length === 0) return null;
  const scaledRank = values.length * numerator;
  const rank = scaledRank % 4 === 0
    ? scaledRank / 4
    : ((scaledRank - (scaledRank % 4)) / 4) + 1;
  return values[rank - 1];
}

function median(values: readonly string[], unit: "money" | "seconds" | "shares", currency: string | null): ExactMetricValue {
  if (values.length === 0) return unavailableMetric("median", unit, currency, "ti_v3_query_zero_sample");
  const middle = (values.length - (values.length % 2)) / 2;
  if (values.length % 2 === 1) return decimalMetric("median", unit, currency, values[middle]);
  const ratio = createExactRatio(sum([values[middle - 1], values[middle]]), "2");
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric("median", unit, currency, ratio.value);
}

function statistics(values: readonly string[], unit: "money" | "seconds" | "shares", currency: string | null): readonly ExactMetricValue[] {
  if (values.length === 0) return Object.freeze(["minimum", "quartile_1", "median", "quartile_3", "maximum", "interquartile_range"]
    .map((key) => unavailableMetric(key, unit, currency, "ti_v3_query_zero_sample")));
  const q1 = nearestRank(values, 1) as string;
  const q3 = nearestRank(values, 3) as string;
  const negated = negateExactDecimal(exact(q1));
  if (!negated.ok) throw new Error(negated.error.code);
  const iqr = addExactDecimals(exact(q3), negated.value);
  if (!iqr.ok) throw new Error(iqr.error.code);
  return Object.freeze([
    decimalMetric("minimum", unit, currency, values[0]),
    decimalMetric("quartile_1", unit, currency, q1),
    median(values, unit, currency),
    decimalMetric("quartile_3", unit, currency, q3),
    decimalMetric("maximum", unit, currency, values.at(-1) as string),
    decimalMetric("interquartile_range", unit, currency, iqr.value),
  ]);
}

function bucketFor(value: string, boundaries: readonly string[]): number {
  for (let index = 0; index < boundaries.length; index += 1) {
    if (compareCanonicalDecimals(value, boundaries[index]) < 0) return index;
  }
  return boundaries.length;
}

function fences(q1: string, q3: string): Readonly<{ lower: ExactRatio; upper: ExactRatio }> {
  const first = decimalToExactRatio(exact(q1));
  const third = decimalToExactRatio(exact(q3));
  const negativeFirst = negateExactDecimal(exact(q1));
  if (!first.ok || !third.ok || !negativeFirst.ok) throw new Error("ti_v3_query_distribution_fence_invalid");
  const iqr = addExactDecimals(exact(q3), negativeFirst.value);
  if (!iqr.ok) throw new Error(iqr.error.code);
  const spread = decimalToExactRatio(iqr.value);
  if (!spread.ok) throw new Error(spread.error.code);
  const denominator = BigInt("2") * BigInt(first.value.denominator) * BigInt(spread.value.denominator);
  const lower = createExactRatio((
    BigInt(first.value.numerator) * BigInt("2") * BigInt(spread.value.denominator) -
    BigInt("3") * BigInt(spread.value.numerator) * BigInt(first.value.denominator)
  ).toString(), denominator.toString());
  const upper = createExactRatio((
    BigInt(third.value.numerator) * BigInt("2") * BigInt(spread.value.denominator) +
    BigInt("3") * BigInt(spread.value.numerator) * BigInt(third.value.denominator)
  ).toString(), (
    BigInt("2") * BigInt(third.value.denominator) * BigInt(spread.value.denominator)
  ).toString());
  if (!lower.ok || !upper.ok) throw new Error("ti_v3_query_distribution_fence_invalid");
  return Object.freeze({ lower: lower.value, upper: upper.value });
}

function compareDecimalToRatio(value: string, ratio: ExactRatio): -1 | 0 | 1 {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error("ti_v3_query_distribution_value_invalid");
  const decimal = decimalToExactRatio(parsed.value);
  if (!decimal.ok) throw new Error(decimal.error.code);
  const comparison = BigInt(decimal.value.numerator) * BigInt(ratio.denominator) -
    BigInt(ratio.numerator) * BigInt(decimal.value.denominator);
  return comparison < BigInt("0") ? -1 : comparison > BigInt("0") ? 1 : 0;
}

function unavailableFindings(unit: "money" | "seconds" | "shares", currency: string | null): TradeQueryDistributionFindings {
  const unavailable = (key: string) => unavailableMetric(key, unit, currency, "ti_v3_query_zero_sample");
  return Object.freeze({
    tailPolicy: "strict_outer_quartile_tails_and_tukey_1_5_iqr_v1",
    lowerTailCount: "0", upperTailCount: "0",
    lowerTailTotal: unavailable("lower_tail_total"), upperTailTotal: unavailable("upper_tail_total"),
    largestAbsoluteValueConcentration: unavailableMetric("largest_absolute_value_concentration", "ratio", null, "ti_v3_query_zero_sample"),
    lowerOutlierFence: unavailable("lower_outlier_fence"), upperOutlierFence: unavailable("upper_outlier_fence"),
    lowerOutlierCount: "0", upperOutlierCount: "0", outlierEvidenceDigest: null,
  });
}

function distributionFindings(
  values: readonly DistributionValue[],
  sorted: readonly string[],
  unit: "money" | "seconds" | "shares",
  currency: string | null,
): Readonly<{ findings: TradeQueryDistributionFindings; outlierRows: readonly QueryRowSemantics[] }> {
  if (sorted.length === 0) return { findings: unavailableFindings(unit, currency), outlierRows: Object.freeze([]) };
  const q1 = nearestRank(sorted, 1) as string;
  const q3 = nearestRank(sorted, 3) as string;
  const boundary = fences(q1, q3);
  const lowerTail = values.filter((item) => compareCanonicalDecimals(item.value, q1) < 0);
  const upperTail = values.filter((item) => compareCanonicalDecimals(item.value, q3) > 0);
  const lowerOutliers = values.filter((item) => compareDecimalToRatio(item.value, boundary.lower) < 0);
  const upperOutliers = values.filter((item) => compareDecimalToRatio(item.value, boundary.upper) > 0);
  const absoluteValues = values.map((item) => {
    const absolute = absoluteExactDecimal(item.value);
    if (!absolute.ok) throw new Error(absolute.error.code);
    return absolute.value;
  });
  const absoluteTotal = sum(absoluteValues);
  const largestAbsolute = absoluteValues.sort(compareCanonicalDecimals).at(-1) as string;
  return Object.freeze({
    findings: Object.freeze({
      tailPolicy: "strict_outer_quartile_tails_and_tukey_1_5_iqr_v1",
      lowerTailCount: String(lowerTail.length), upperTailCount: String(upperTail.length),
      lowerTailTotal: decimalMetric("lower_tail_total", unit, currency, sum(lowerTail.map((item) => item.value))),
      upperTailTotal: decimalMetric("upper_tail_total", unit, currency, sum(upperTail.map((item) => item.value))),
      largestAbsoluteValueConcentration: absoluteTotal === "0"
        ? unavailableMetric("largest_absolute_value_concentration", "ratio", null, "ti_v3_query_zero_denominator")
        : ratioFromDecimals("largest_absolute_value_concentration", largestAbsolute, absoluteTotal),
      lowerOutlierFence: ratioMetric("lower_outlier_fence", unit, currency, boundary.lower),
      upperOutlierFence: ratioMetric("upper_outlier_fence", unit, currency, boundary.upper),
      lowerOutlierCount: String(lowerOutliers.length), upperOutlierCount: String(upperOutliers.length),
      outlierEvidenceDigest: null,
    }),
    outlierRows: Object.freeze([...lowerOutliers, ...upperOutliers].flatMap((item) => item.rows)),
  });
}

export function executeTradeQueryDistribution(request: TradeQueryDistributionRequest): { readonly ok: true; readonly value: TradeQueryDistributionResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const gateway = openReadOnlyTradeQueryGateway(request.source, request.partitionReceipt);
  if (!gateway.ok) return gateway;
  const queryPlanRecord = request.queryPlan as { readonly queryPlanDigest?: unknown } | null;
  const plan = queryPlanRecord !== null && typeof queryPlanRecord === "object" && typeof queryPlanRecord.queryPlanDigest === "string"
    ? verifyTradeQueryPlan(request.queryPlan, gateway.value.authority)
    : buildTradeQueryPlan(request.queryPlan, gateway.value.authority);
  if (!plan.ok) return plan;
  const spec = normalizeSpec(request.distribution);
  if (!spec.ok) return spec;
  const data = gateway.value.readBoundedRows(plan.value);
  if (!data.ok) return data;
  const filtered = applyTradeQueryFilters(buildQueryRowSemantics(data.value.rows), plan.value.filters);
  const detail = details(spec.value.measure, plan.value.authority.currency);
  const population = valuesFor(spec.value.measure, filtered.included);
  const values = Object.freeze(population.values.map((item) => item.value).sort(compareCanonicalDecimals));
  const derivedFindings = population.unavailable
    ? { findings: unavailableFindings(detail.unit, detail.currency), outlierRows: Object.freeze([]) }
    : distributionFindings(population.values, values, detail.unit, detail.currency);
  const bucketRows = Array.from({ length: spec.value.bucketBoundaries.length + 1 }, () => [] as DistributionValue[]);
  if (!population.unavailable) for (const value of population.values) bucketRows[bucketFor(value.value, spec.value.bucketBoundaries)].push(value);
  const evidence: TradeQueryEvidence[] = [];
  const buckets: TradeQueryDistributionBucket[] = [];
  let remainingEvidence = BigInt(plan.value.limits.totalEvidenceLimit);
  const outlierEvidence = derivedFindings.outlierRows.length === 0 ? null : buildTradeQueryEvidence(
    plan.value,
    `distribution:${spec.value.measure}:outliers`,
    derivedFindings.outlierRows,
    (remainingEvidence < BigInt(plan.value.limits.evidencePerGroup)
      ? remainingEvidence : BigInt(plan.value.limits.evidencePerGroup)).toString(),
  );
  if (outlierEvidence !== null && !outlierEvidence.ok) return outlierEvidence;
  if (outlierEvidence !== null) {
    evidence.push(outlierEvidence.value);
    remainingEvidence -= BigInt(outlierEvidence.value.candidates.length);
  }
  for (let index = 0; index < bucketRows.length; index += 1) {
    const rows = Object.freeze(bucketRows[index].flatMap((value) => value.rows));
    const bucketIdentity = `distribution:${spec.value.measure}:bucket:${index}`;
    const allocation = remainingEvidence < BigInt(plan.value.limits.evidencePerGroup)
      ? remainingEvidence : BigInt(plan.value.limits.evidencePerGroup);
    const built = rows.length === 0 ? null : buildTradeQueryEvidence(plan.value, bucketIdentity, rows, allocation.toString());
    if (built !== null && !built.ok) return built;
    if (built !== null) {
      evidence.push(built.value);
      remainingEvidence -= BigInt(built.value.candidates.length);
    }
    buckets.push(Object.freeze({
      bucketIdentity,
      lowerInclusive: index === 0 ? null : spec.value.bucketBoundaries[index - 1],
      upperExclusive: index === spec.value.bucketBoundaries.length ? null : spec.value.bucketBoundaries[index],
      count: String(bucketRows[index].length),
      evidenceDigest: built?.value.evidenceDigest ?? null,
    }));
  }
  const limitationCodes = Object.freeze([...new Set([
    ...gateway.value.authority.partitionReceipt.limitationCodes,
    ...evidence.flatMap((item) => item.limitationCodes),
    ...(population.unavailable ? ["ti_v3_query_required_authority_unavailable"] : []),
  ])].sort(compareUnicodeCodePoints));
  const body = {
    schemaVersion: TRADE_QUERY_DISTRIBUTION_RESULT_VERSION,
    queryPlanDigest: plan.value.queryPlanDigest,
    measure: spec.value.measure,
    unit: detail.unit,
    currency: detail.currency,
    percentilePolicy: "nearest_rank_quartiles_and_exact_median_v1" as const,
    populationCount: String(filtered.included.length),
    availableValueCount: String(values.length),
    availability: population.unavailable ? "unavailable" as const : "available" as const,
    statistics: statistics(values, detail.unit, detail.currency),
    findings: Object.freeze({
      ...derivedFindings.findings,
      outlierEvidenceDigest: outlierEvidence?.value.evidenceDigest ?? null,
    }),
    buckets: Object.freeze(buckets), evidence: Object.freeze(evidence), limitationCodes,
  };
  const serialized = serializeCanonicalValue(body);
  if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumResultCodeUnits) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.distribution.result");
  }
  return finalizeContentAddressedAuthority("trade_query_distribution_result", body, "resultDigest") as
    | { readonly ok: true; readonly value: TradeQueryDistributionResult }
    | { readonly ok: false; readonly error: AnalyticalContractFailure };
}
