import {
  compareUnicodeCodePoints,
  serializeCanonicalValue,
} from "../../../domain/canonical";
import {
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import {
  ratioMetric,
  subtractMetrics,
  unavailableMetric,
} from "../../tools/weekday";
import type { TradeQueryMetricKey } from "../metrics";
import {
  verifyTradeQueryResultShape,
  type TradeQueryResult,
} from "./query-result";
import type { TradeQueryAuthority } from "./query-plan";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";

export const TRADE_QUERY_COMPARISON_VERSION =
  "ti_v3_trade_query_comparison_v1" as const;

export interface TradeQueryMetricComparison {
  readonly metricKey: TradeQueryMetricKey;
  readonly target: ExactMetricValue;
  readonly baseline: ExactMetricValue;
  readonly difference: ExactMetricValue;
  readonly percentageDifference: ExactMetricValue;
}

export interface TradeQueryComparison {
  readonly schemaVersion: typeof TRADE_QUERY_COMPARISON_VERSION;
  readonly comparisonKey: "ti_v3_exact_trade_query_comparison";
  readonly comparisonVersion: "v1";
  readonly targetPlanDigest: CanonicalContentDigest;
  readonly baselinePlanDigest: CanonicalContentDigest;
  readonly targetResultDigest: CanonicalContentDigest;
  readonly baselineResultDigest: CanonicalContentDigest;
  readonly currency: string;
  readonly metrics: readonly TradeQueryMetricComparison[];
  readonly targetEvidenceDigests: readonly CanonicalContentDigest[];
  readonly baselineEvidenceDigests: readonly CanonicalContentDigest[];
  readonly limitationCodes: readonly string[];
  readonly comparisonDigest: CanonicalContentDigest;
}

function metricRatio(metric: ExactMetricValue): ExactRatio | null {
  if (metric.kind === "exact_ratio") {
    const ratio = createExactRatio(metric.numerator, metric.denominator);
    return ratio.ok ? ratio.value : null;
  }
  if (metric.kind === "integer") {
    const ratio = createExactRatio(metric.value, "1");
    return ratio.ok ? ratio.value : null;
  }
  if (metric.kind === "exact_decimal") {
    const value = validateExactDecimal(metric.value);
    if (!value.ok) return null;
    const ratio = decimalToExactRatio(value.value);
    return ratio.ok ? ratio.value : null;
  }
  return null;
}

function differenceMetric(
  key: TradeQueryMetricKey,
  target: ExactMetricValue,
  baseline: ExactMetricValue,
): ExactMetricValue {
  if (
    target.unit !== baseline.unit ||
    target.currency !== baseline.currency
  ) {
    return unavailableMetric(
      `${key}_difference`,
      target.unit,
      target.currency,
      "ti_v3_query_comparison_unit_mismatch",
    );
  }
  if (target.kind !== "integer" || baseline.kind !== "integer") {
    return subtractMetrics(`${key}_difference`, target, baseline);
  }
  const ratio = createExactRatio(
    (BigInt(target.value) - BigInt(baseline.value)).toString(),
    "1",
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(
    `${key}_difference`,
    target.unit,
    target.currency,
    ratio.value,
  );
}

function percentageDifferenceMetric(
  key: TradeQueryMetricKey,
  difference: ExactMetricValue,
  baseline: ExactMetricValue,
): ExactMetricValue {
  const differenceRatio = metricRatio(difference);
  const baselineRatio = metricRatio(baseline);
  if (
    differenceRatio === null ||
    baselineRatio === null ||
    BigInt(baselineRatio.numerator) === BigInt("0")
  ) {
    return unavailableMetric(
      `${key}_percentage_difference`,
      "ratio",
      null,
      "ti_v3_query_comparison_zero_or_unavailable_baseline",
    );
  }
  const absoluteBaseline = BigInt(baselineRatio.numerator) < BigInt("0")
    ? -BigInt(baselineRatio.numerator)
    : BigInt(baselineRatio.numerator);
  const ratio = createExactRatio(
    (
      BigInt(differenceRatio.numerator) *
      BigInt(baselineRatio.denominator)
    ).toString(),
    (
      BigInt(differenceRatio.denominator) *
      absoluteBaseline
    ).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(`${key}_percentage_difference`, "ratio", null, ratio.value);
}

function aggregateMetrics(
  result: TradeQueryResult,
): ReadonlyMap<string, ExactMetricValue> | null {
  if (
    result.normalizedQueryPlan.grouping.kind !== "aggregate" ||
    result.rows.length !== 1
  ) return null;
  return new Map(result.rows[0].metrics.map((metric) => [metric.metricKey, metric]));
}

export function buildTradeQueryComparison(
  targetInput: unknown,
  baselineInput: unknown,
  authority: TradeQueryAuthority,
): { readonly ok: true; readonly value: TradeQueryComparison } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const target = verifyTradeQueryResultShape(targetInput, authority);
  if (!target.ok) return target;
  const baseline = verifyTradeQueryResultShape(baselineInput, authority);
  if (!baseline.ok) return baseline;
  if (
    !isVerifiedTradeQueryExecution(targetInput) ||
    !isVerifiedTradeQueryExecution(baselineInput)
  ) {
    return {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.comparison.verifiedExecutions",
      },
    };
  }
  if (
    target.value.normalizedQueryPlan.authority.partitionDigest !==
      baseline.value.normalizedQueryPlan.authority.partitionDigest ||
    target.value.normalizedQueryPlan.authority.currency !==
      baseline.value.normalizedQueryPlan.authority.currency
  ) {
    return {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.comparison.authority",
      },
    };
  }
  const targetMetrics = aggregateMetrics(target.value);
  const baselineMetrics = aggregateMetrics(baseline.value);
  if (targetMetrics === null || baselineMetrics === null) {
    return {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_invalid",
        path: "$.comparison.grouping",
      },
    };
  }
  const targetKeys = [...targetMetrics.keys()].sort(compareUnicodeCodePoints);
  const baselineKeys = [...baselineMetrics.keys()].sort(compareUnicodeCodePoints);
  if (JSON.stringify(targetKeys) !== JSON.stringify(baselineKeys)) {
    return {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.comparison.metrics",
      },
    };
  }
  const keys = targetKeys as TradeQueryMetricKey[];
  const metrics = Object.freeze(keys.map((metricKey) => {
    const targetMetric = targetMetrics.get(metricKey);
    const baselineMetric = baselineMetrics.get(metricKey);
    if (targetMetric === undefined || baselineMetric === undefined) {
      throw new Error("ti_v3_query_comparison_metric_missing");
    }
    const difference = differenceMetric(metricKey, targetMetric, baselineMetric);
    return Object.freeze({
      metricKey,
      target: targetMetric,
      baseline: baselineMetric,
      difference,
      percentageDifference: percentageDifferenceMetric(
        metricKey,
        difference,
        baselineMetric,
      ),
    });
  }));
  const addressed = finalizeContentAddressedAuthority(
    "trade_query_comparison",
    {
      schemaVersion: TRADE_QUERY_COMPARISON_VERSION,
      comparisonKey: "ti_v3_exact_trade_query_comparison",
      comparisonVersion: "v1",
      targetPlanDigest: target.value.normalizedQueryPlan.queryPlanDigest,
      baselinePlanDigest: baseline.value.normalizedQueryPlan.queryPlanDigest,
      targetResultDigest: target.value.resultDigest,
      baselineResultDigest: baseline.value.resultDigest,
      currency: target.value.normalizedQueryPlan.authority.currency,
      metrics,
      targetEvidenceDigests: Object.freeze(
        target.value.evidence.map((item) => item.evidenceDigest)
          .sort(compareUnicodeCodePoints),
      ),
      baselineEvidenceDigests: Object.freeze(
        baseline.value.evidence.map((item) => item.evidenceDigest)
          .sort(compareUnicodeCodePoints),
      ),
      limitationCodes: Object.freeze([...new Set([
        ...target.value.limitationCodes,
        ...baseline.value.limitationCodes,
      ])].sort(compareUnicodeCodePoints)),
    },
    "comparisonDigest",
  );
  return addressed.ok
    ? { ok: true, value: addressed.value as TradeQueryComparison }
    : addressed;
}

export function verifyTradeQueryComparison(
  input: unknown,
  targetInput: unknown,
  baselineInput: unknown,
  authority: TradeQueryAuthority,
): { readonly ok: true; readonly value: TradeQueryComparison } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateComparisonShape(input);
  if (!record.ok) return record;
  const rebuilt = buildTradeQueryComparison(targetInput, baselineInput, authority);
  if (!rebuilt.ok) return rebuilt;
  const supplied = serializeCanonicalValue(record.value);
  const accepted = serializeCanonicalValue(rebuilt.value);
  return supplied.ok && accepted.ok &&
    supplied.value.json === accepted.value.json &&
    record.value.comparisonDigest === rebuilt.value.comparisonDigest
    ? rebuilt
    : {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_digest_mismatch",
        path: "$.comparisonDigest",
      },
    };
}

function validateComparisonShape(
  input: unknown,
): { readonly ok: true; readonly value: TradeQueryComparison } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "comparisonKey", "comparisonVersion", "targetPlanDigest",
    "baselinePlanDigest", "targetResultDigest", "baselineResultDigest", "currency",
    "metrics", "targetEvidenceDigests", "baselineEvidenceDigests", "limitationCodes",
    "comparisonDigest",
  ]);
  if (
    !record.ok ||
    record.value.schemaVersion !== TRADE_QUERY_COMPARISON_VERSION ||
    record.value.comparisonKey !== "ti_v3_exact_trade_query_comparison" ||
    record.value.comparisonVersion !== "v1" ||
    typeof record.value.currency !== "string" ||
    !Array.isArray(record.value.metrics) ||
    !Array.isArray(record.value.targetEvidenceDigests) ||
    !Array.isArray(record.value.baselineEvidenceDigests) ||
    !Array.isArray(record.value.limitationCodes)
  ) {
    return record.ok
      ? { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.comparison" } }
      : record;
  }
  const digest = validateClaimedDigest(
    record.value.comparisonDigest,
    "$.comparisonDigest",
    "trade_query_comparison",
  );
  if (!digest.ok) return digest;
  return { ok: true, value: record.value as unknown as TradeQueryComparison };
}
