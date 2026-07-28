import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import { createExactRatio, decimalToExactRatio, validateExactDecimal, type ExactRatio } from "../../../domain/exact";
import type { CanonicalContentDigest } from "../../../domain/identity";
import { contractFailure, finalizeContentAddressedAuthority, type AnalyticalContractFailure, type ExactMetricValue } from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import { absoluteExactDecimal, compareCanonicalDecimals, decimalMetric, ratioMetric, sumExactDecimals, unavailableMetric } from "../../tools/weekday";
import { buildTradeQueryEvidence, type TradeQueryEvidence } from "../evidence/query-evidence";
import { applyTradeQueryFilters } from "../filters/filter-engine";
import { openReadOnlyTradeQueryGateway, type VerifiedTradeQueryDatasetSource } from "../gateway";
import { groupTradeQueryRows, type TradeQueryGroup } from "../grouping/grouping-engine";
import { buildTradeQueryPlan, verifyTradeQueryPlan, TRADE_QUERY_LIMITS, type TradeQueryPlan } from "../contracts/query-plan";
import { buildQueryRowSemantics, type QueryRowSemantics } from "../execution/row-semantics";

export const TRADE_QUERY_PERIOD_ATTRIBUTION_RESULT_VERSION = "ti_v3_trade_query_period_attribution_result_v1" as const;

export interface TradeQueryPeriodAttributionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly baselineQueryPlan: unknown;
  readonly comparisonQueryPlan: unknown;
}

export interface TradeQueryPeriodAttributionSegment {
  readonly segmentIdentity: string;
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
  readonly baselineCount: string;
  readonly comparisonCount: string;
  readonly baselineNetPnl: ExactMetricValue;
  readonly comparisonNetPnl: ExactMetricValue;
  readonly absoluteChange: ExactMetricValue;
  readonly relativeChange: ExactMetricValue;
  readonly frequencyChange: ExactMetricValue;
  readonly averageResultChange: ExactMetricValue;
  readonly frequencyEffect: ExactMetricValue;
  readonly mixEffect: ExactMetricValue;
  readonly averageResultEffect: ExactMetricValue;
  readonly feeChange: ExactMetricValue;
  readonly largestAbsoluteTradeChange: ExactMetricValue;
  readonly baselineEvidenceDigest: CanonicalContentDigest | null;
  readonly comparisonEvidenceDigest: CanonicalContentDigest | null;
}

export interface TradeQueryPeriodAttributionResult {
  readonly schemaVersion: typeof TRADE_QUERY_PERIOD_ATTRIBUTION_RESULT_VERSION;
  readonly baselineQueryPlanDigest: CanonicalContentDigest;
  readonly comparisonQueryPlanDigest: CanonicalContentDigest;
  readonly decompositionPolicy: "frequency_mix_average_result_v1";
  readonly baselineCount: string;
  readonly comparisonCount: string;
  readonly baselineNetPnl: ExactMetricValue;
  readonly comparisonNetPnl: ExactMetricValue;
  readonly absoluteChange: ExactMetricValue;
  readonly frequencyEffect: ExactMetricValue;
  readonly mixEffect: ExactMetricValue;
  readonly averageResultEffect: ExactMetricValue;
  readonly reconciliationDifference: ExactMetricValue;
  readonly segments: readonly TradeQueryPeriodAttributionSegment[];
  readonly evidence: readonly TradeQueryEvidence[];
  readonly limitationCodes: readonly string[];
  readonly resultDigest: CanonicalContentDigest;
}

interface Population { readonly plan: TradeQueryPlan; readonly rows: readonly QueryRowSemantics[]; readonly groups: readonly TradeQueryGroup[]; }
interface SegmentValues { readonly count: string; readonly net: string; readonly charges: string; readonly largestAbsolute: string; }

function sum(values: readonly string[]): string { const result = sumExactDecimals(values); if (!result.ok) throw new Error(result.error.code); return result.value; }
function zero(): ExactRatio { const result = createExactRatio("0", "1"); if (!result.ok) throw new Error(result.error.code); return result.value; }
function countRatio(value: string): ExactRatio { const result = createExactRatio(value, "1"); if (!result.ok) throw new Error(result.error.code); return result.value; }
function decimalRatio(value: string): ExactRatio { const parsed = validateExactDecimal(value); if (!parsed.ok) throw new Error(parsed.error.code); const result = decimalToExactRatio(parsed.value); if (!result.ok) throw new Error(result.error.code); return result.value; }
function absoluteRatio(value: ExactRatio): ExactRatio { const result = createExactRatio((BigInt(value.numerator) < BigInt("0") ? -BigInt(value.numerator) : BigInt(value.numerator)).toString(), value.denominator); if (!result.ok) throw new Error(result.error.code); return result.value; }
function add(left: ExactRatio, right: ExactRatio): ExactRatio { const result = createExactRatio((BigInt(left.numerator) * BigInt(right.denominator) + BigInt(right.numerator) * BigInt(left.denominator)).toString(), (BigInt(left.denominator) * BigInt(right.denominator)).toString()); if (!result.ok) throw new Error(result.error.code); return result.value; }
function subtract(left: ExactRatio, right: ExactRatio): ExactRatio { const result = createExactRatio((BigInt(left.numerator) * BigInt(right.denominator) - BigInt(right.numerator) * BigInt(left.denominator)).toString(), (BigInt(left.denominator) * BigInt(right.denominator)).toString()); if (!result.ok) throw new Error(result.error.code); return result.value; }
function multiply(left: ExactRatio, right: ExactRatio): ExactRatio { const result = createExactRatio((BigInt(left.numerator) * BigInt(right.numerator)).toString(), (BigInt(left.denominator) * BigInt(right.denominator)).toString()); if (!result.ok) throw new Error(result.error.code); return result.value; }
function divide(left: ExactRatio, right: ExactRatio): ExactRatio | null { if (BigInt(right.numerator) === BigInt("0")) return null; const result = createExactRatio((BigInt(left.numerator) * BigInt(right.denominator)).toString(), (BigInt(left.denominator) * BigInt(right.numerator)).toString()); if (!result.ok) throw new Error(result.error.code); return result.value; }
function metric(key: string, unit: string, currency: string | null, value: ExactRatio): ExactMetricValue { return ratioMetric(key, unit, currency, value); }
function ratioOrUnavailable(key: string, value: ExactRatio | null): ExactMetricValue { return value === null ? unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator") : ratioMetric(key, "ratio", null, value); }

function values(rows: readonly QueryRowSemantics[]): SegmentValues {
  const net = rows.map((row) => row.row.netPnl);
  const absolute = net.map((value) => { const result = absoluteExactDecimal(value); if (!result.ok) throw new Error(result.error.code); return result.value; });
  return Object.freeze({ count: String(rows.length), net: sum(net), charges: sum(rows.map((row) => row.row.signedCharges)), largestAbsolute: absolute.sort(compareCanonicalDecimals).at(-1) ?? "0" });
}

function average(input: SegmentValues): ExactRatio { return divide(decimalRatio(input.net), countRatio(input.count)) ?? zero(); }
function frequency(input: SegmentValues, totalCount: string): ExactRatio { return divide(countRatio(input.count), countRatio(totalCount)) ?? zero(); }

function prepare(source: VerifiedTradeQueryDatasetSource, partition: AnalyticalPartitionReceipt, input: unknown): { readonly ok: true; readonly value: Population } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const gateway = openReadOnlyTradeQueryGateway(source, partition); if (!gateway.ok) return gateway;
  const record = input as { readonly queryPlanDigest?: unknown } | null;
  const plan = record !== null && typeof record === "object" && typeof record.queryPlanDigest === "string" ? verifyTradeQueryPlan(input, gateway.value.authority) : buildTradeQueryPlan(input, gateway.value.authority);
  if (!plan.ok) return plan;
  if (plan.value.grouping.kind === "aggregate") return contractFailure("ti_v3_analytics_contract_invalid", "$.queryPlan.grouping");
  const data = gateway.value.readBoundedRows(plan.value); if (!data.ok) return data;
  const rows = applyTradeQueryFilters(buildQueryRowSemantics(data.value.rows), plan.value.filters).included;
  return { ok: true, value: Object.freeze({ plan: plan.value, rows, groups: groupTradeQueryRows(rows, plan.value.grouping) }) };
}

function sameGrouping(left: TradeQueryPlan, right: TradeQueryPlan): boolean {
  const first = serializeCanonicalValue(left.grouping); const second = serializeCanonicalValue(right.grouping);
  return first.ok && second.ok && first.value.json === second.value.json;
}

function segmentIdentity(baseline: string, comparison: string, group: string): string {
  return `period_attribution:${baseline.length}:${baseline}|${comparison.length}:${comparison}|${group.length}:${group}`;
}

export function executeTradeQueryPeriodAttribution(request: TradeQueryPeriodAttributionRequest): { readonly ok: true; readonly value: TradeQueryPeriodAttributionResult } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const baseline = prepare(request.source, request.partitionReceipt, request.baselineQueryPlan); if (!baseline.ok) return baseline;
  const comparison = prepare(request.source, request.partitionReceipt, request.comparisonQueryPlan); if (!comparison.ok) return comparison;
  if (!sameGrouping(baseline.value.plan, comparison.value.plan)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.comparisonQueryPlan.grouping");
  const maxGroups = BigInt(baseline.value.plan.limits.groupLimit) < BigInt(comparison.value.plan.limits.groupLimit) ? BigInt(baseline.value.plan.limits.groupLimit) : BigInt(comparison.value.plan.limits.groupLimit);
  const maxRows = BigInt(baseline.value.plan.limits.resultRowLimit) < BigInt(comparison.value.plan.limits.resultRowLimit) ? BigInt(baseline.value.plan.limits.resultRowLimit) : BigInt(comparison.value.plan.limits.resultRowLimit);
  const baselineGroups = new Map(baseline.value.groups.map((group) => [group.groupIdentity, group]));
  const comparisonGroups = new Map(comparison.value.groups.map((group) => [group.groupIdentity, group]));
  const identities = [...new Set([...baselineGroups.keys(), ...comparisonGroups.keys()])].sort(compareUnicodeCodePoints);
  if (BigInt(identities.length) > maxGroups || BigInt(identities.length) > maxRows) return contractFailure("ti_v3_analytics_contract_oversized", "$.periodAttribution.groups");
  const baselineTotal = values(baseline.value.rows); const comparisonTotal = values(comparison.value.rows);
  const baselineNet = decimalRatio(baselineTotal.net); const comparisonNet = decimalRatio(comparisonTotal.net); const totalChange = subtract(comparisonNet, baselineNet);
  const deltaCount = subtract(countRatio(comparisonTotal.count), countRatio(baselineTotal.count));
  const segments: TradeQueryPeriodAttributionSegment[] = []; const evidence: TradeQueryEvidence[] = [];
  let remainingEvidence = BigInt(baseline.value.plan.limits.totalEvidenceLimit) < BigInt(comparison.value.plan.limits.totalEvidenceLimit)
    ? BigInt(baseline.value.plan.limits.totalEvidenceLimit) : BigInt(comparison.value.plan.limits.totalEvidenceLimit);
  let frequencyTotal = zero(); let mixTotal = zero(); let averageTotal = zero();
  for (const identity of identities) {
    const baseGroup = baselineGroups.get(identity); const compareGroup = comparisonGroups.get(identity);
    const reference = compareGroup ?? baseGroup; if (reference === undefined) throw new Error("ti_v3_period_attribution_group_missing");
    const base = values(baseGroup?.rows ?? []); const target = values(compareGroup?.rows ?? []);
    const baseFrequency = frequency(base, baselineTotal.count); const targetFrequency = frequency(target, comparisonTotal.count);
    const baseAverage = average(base); const targetAverage = average(target);
    const frequencyEffect = multiply(multiply(deltaCount, baseFrequency), baseAverage);
    const mixEffect = multiply(multiply(countRatio(comparisonTotal.count), subtract(targetFrequency, baseFrequency)), baseAverage);
    const averageEffect = multiply(multiply(countRatio(comparisonTotal.count), targetFrequency), subtract(targetAverage, baseAverage));
    frequencyTotal = add(frequencyTotal, frequencyEffect); mixTotal = add(mixTotal, mixEffect); averageTotal = add(averageTotal, averageEffect);
    const allocation = remainingEvidence < BigInt(baseline.value.plan.limits.evidencePerGroup) ? remainingEvidence : BigInt(baseline.value.plan.limits.evidencePerGroup);
    const baseEvidence = baseGroup === undefined ? null : buildTradeQueryEvidence(baseline.value.plan, identity, baseGroup.rows, allocation.toString());
    if (baseEvidence !== null && !baseEvidence.ok) return baseEvidence;
    if (baseEvidence !== null) { evidence.push(baseEvidence.value); remainingEvidence -= BigInt(baseEvidence.value.candidates.length); }
    const targetAllocation = remainingEvidence < BigInt(comparison.value.plan.limits.evidencePerGroup) ? remainingEvidence : BigInt(comparison.value.plan.limits.evidencePerGroup);
    const targetEvidence = compareGroup === undefined ? null : buildTradeQueryEvidence(comparison.value.plan, identity, compareGroup.rows, targetAllocation.toString());
    if (targetEvidence !== null && !targetEvidence.ok) return targetEvidence;
    if (targetEvidence !== null) { evidence.push(targetEvidence.value); remainingEvidence -= BigInt(targetEvidence.value.candidates.length); }
    segments.push(Object.freeze({
      segmentIdentity: segmentIdentity(baseline.value.plan.queryPlanDigest, comparison.value.plan.queryPlanDigest, identity), groupIdentity: identity, groupLabel: reference.groupLabel, canonicalOrder: reference.canonicalOrder,
      baselineCount: base.count, comparisonCount: target.count,
      baselineNetPnl: decimalMetric("baseline_net_pnl", "money", baseline.value.plan.authority.currency, base.net), comparisonNetPnl: decimalMetric("comparison_net_pnl", "money", comparison.value.plan.authority.currency, target.net),
      absoluteChange: metric("absolute_change", "money", comparison.value.plan.authority.currency, subtract(decimalRatio(target.net), decimalRatio(base.net))),
      relativeChange: ratioOrUnavailable("relative_change", BigInt(decimalRatio(base.net).numerator) === BigInt("0") ? null : divide(subtract(decimalRatio(target.net), decimalRatio(base.net)), absoluteRatio(decimalRatio(base.net)))),
      frequencyChange: metric("frequency_change", "ratio", null, subtract(targetFrequency, baseFrequency)), averageResultChange: metric("average_result_change", "money", comparison.value.plan.authority.currency, subtract(targetAverage, baseAverage)),
      frequencyEffect: metric("frequency_effect", "money", comparison.value.plan.authority.currency, frequencyEffect), mixEffect: metric("mix_effect", "money", comparison.value.plan.authority.currency, mixEffect), averageResultEffect: metric("average_result_effect", "money", comparison.value.plan.authority.currency, averageEffect),
      feeChange: metric("fee_change", "money", comparison.value.plan.authority.currency, subtract(decimalRatio(target.charges), decimalRatio(base.charges))), largestAbsoluteTradeChange: metric("largest_absolute_trade_change", "money", comparison.value.plan.authority.currency, subtract(decimalRatio(target.largestAbsolute), decimalRatio(base.largestAbsolute))),
      baselineEvidenceDigest: baseEvidence?.value.evidenceDigest ?? null, comparisonEvidenceDigest: targetEvidence?.value.evidenceDigest ?? null,
    }));
  }
  const reconciliation = subtract(totalChange, add(add(frequencyTotal, mixTotal), averageTotal));
  const limitationCodes = Object.freeze([...new Set(evidence.flatMap((item) => item.limitationCodes))].sort(compareUnicodeCodePoints));
  const body = { schemaVersion: TRADE_QUERY_PERIOD_ATTRIBUTION_RESULT_VERSION, baselineQueryPlanDigest: baseline.value.plan.queryPlanDigest, comparisonQueryPlanDigest: comparison.value.plan.queryPlanDigest, decompositionPolicy: "frequency_mix_average_result_v1" as const, baselineCount: baselineTotal.count, comparisonCount: comparisonTotal.count, baselineNetPnl: decimalMetric("baseline_net_pnl", "money", baseline.value.plan.authority.currency, baselineTotal.net), comparisonNetPnl: decimalMetric("comparison_net_pnl", "money", comparison.value.plan.authority.currency, comparisonTotal.net), absoluteChange: metric("absolute_change", "money", comparison.value.plan.authority.currency, totalChange), frequencyEffect: metric("frequency_effect", "money", comparison.value.plan.authority.currency, frequencyTotal), mixEffect: metric("mix_effect", "money", comparison.value.plan.authority.currency, mixTotal), averageResultEffect: metric("average_result_effect", "money", comparison.value.plan.authority.currency, averageTotal), reconciliationDifference: metric("reconciliation_difference", "money", comparison.value.plan.authority.currency, reconciliation), segments: Object.freeze(segments), evidence: Object.freeze(evidence), limitationCodes };
  const serialized = serializeCanonicalValue(body); if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumResultCodeUnits) return contractFailure("ti_v3_analytics_contract_oversized", "$.periodAttribution.result");
  return finalizeContentAddressedAuthority("trade_query_period_attribution_result", body, "resultDigest") as | { readonly ok: true; readonly value: TradeQueryPeriodAttributionResult } | { readonly ok: false; readonly error: AnalyticalContractFailure };
}
