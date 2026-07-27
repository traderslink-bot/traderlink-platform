import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQueryDistribution,
  type ExactMetricValue,
  type TradeQueryDistributionResult,
} from "../../analytics";

function statistic(result: TradeQueryDistributionResult, key: string): ExactMetricValue {
  const value = result.statistics.find((item) => item.metricKey === key);
  if (value === undefined) throw new Error(`missing distribution statistic ${key}`);
  return value;
}

describe("GA1-A exact trade-query distributions", () => {
  it("returns a content-addressed, histogram-ready net P/L distribution with exact quartiles", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const request = {
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan(),
      distribution: { measure: "net_pnl", bucketBoundaries: ["-1", "1", "3"] },
    } as const;
    const first = executeTradeQueryDistribution(request);
    const second = executeTradeQueryDistribution(request);

    expect(first, JSON.stringify(first)).toMatchObject({ ok: true });
    expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;

    expect(first.value.resultDigest).toBe(second.value.resultDigest);
    expect(first.value).toMatchObject({
      availability: "available",
      populationCount: "14",
      availableValueCount: "14",
      unit: "money",
      currency: "USD",
      percentilePolicy: "nearest_rank_quartiles_and_exact_median_v1",
    });
    expect(statistic(first.value, "minimum")).toMatchObject({ value: "-5" });
    expect(statistic(first.value, "quartile_1")).toMatchObject({ value: "0" });
    expect(statistic(first.value, "median")).toMatchObject({ numerator: "1", denominator: "1" });
    expect(statistic(first.value, "quartile_3")).toMatchObject({ value: "2" });
    expect(statistic(first.value, "maximum")).toMatchObject({ value: "4" });
    expect(statistic(first.value, "interquartile_range")).toMatchObject({ value: "2" });
    expect(first.value.buckets.map((bucket) => bucket.count)).toEqual(["3", "3", "5", "3"]);
    expect(first.value.findings).toMatchObject({
      tailPolicy: "strict_outer_quartile_tails_and_tukey_1_5_iqr_v1",
      lowerTailCount: "3",
      upperTailCount: "3",
      lowerOutlierCount: "3",
      upperOutlierCount: "0",
    });
    expect(first.value.findings.lowerTailTotal).toMatchObject({ value: "-15" });
    expect(first.value.findings.upperTailTotal).toMatchObject({ value: "11" });
    expect(first.value.findings.largestAbsoluteValueConcentration).toMatchObject({
      numerator: "5", denominator: "33",
    });
    expect(first.value.findings.lowerOutlierFence).toMatchObject({ numerator: "-3", denominator: "1" });
    expect(first.value.findings.upperOutlierFence).toMatchObject({ numerator: "5", denominator: "1" });
    expect(first.value.findings.outlierEvidenceDigest).toMatch(/^ti_v3:trade_query_evidence:v1:sha256:/);
    expect(first.value.evidence).toHaveLength(5);
  });

  it("keeps distributions unavailable when required size authority is incomplete", () => {
    const fixture = buildSyntheticQueryFixture(8, false, { unavailableShareQuantityIndices: [0] });
    const result = executeTradeQueryDistribution({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan(),
      distribution: { measure: "share_quantity", bucketBoundaries: ["50", "150"] },
    });

    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({ availability: "unavailable", availableValueCount: "0" });
    expect(result.value.limitationCodes).toContain("ti_v3_query_required_authority_unavailable");
    expect(statistic(result.value, "median")).toMatchObject({
      kind: "unavailable",
      reasonCode: "ti_v3_query_zero_sample",
    });
    expect(result.value.buckets.every((bucket) => bucket.count === "0")).toBe(true);
  });

  it("rejects duplicate histogram boundaries before reading the result population", () => {
    const fixture = buildSyntheticQueryFixture();
    const result = executeTradeQueryDistribution({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan(),
      distribution: { measure: "net_pnl", bucketBoundaries: ["0", "0"] },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_duplicate_identity", path: "$.distribution.bucketBoundaries" },
    });
  });
});
