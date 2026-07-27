import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQueryAttribution,
  type ExactMetricValue,
  type TradeQueryAttributionSegment,
} from "../../analytics";

function segment(segments: readonly TradeQueryAttributionSegment[], identity: string): TradeQueryAttributionSegment {
  const found = segments.find((item) => item.groupIdentity === identity);
  if (found === undefined) throw new Error(`missing attribution segment ${identity}`);
  return found;
}

function ratio(metric: ExactMetricValue): readonly [string, string] {
  if (metric.kind !== "exact_ratio") throw new Error(`expected ratio, received ${metric.kind}`);
  return [metric.numerator, metric.denominator];
}

describe("GA1-A exact trade-query attribution", () => {
  it("returns content-addressed within-period contribution segments for a deterministic grouping", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const request = {
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({ grouping: { kind: "direction" } }),
    } as const;
    const first = executeTradeQueryAttribution(request);
    const second = executeTradeQueryAttribution(request);

    expect(first, JSON.stringify(first)).toMatchObject({ ok: true });
    expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;

    expect(first.value.resultDigest).toBe(second.value.resultDigest);
    expect(first.value).toMatchObject({
      attributionPolicy: "within_period_segment_contribution_v1",
      authorityState: "available",
      candidateCount: "14",
      includedCount: "14",
      excludedCount: "0",
    });
    const short = segment(first.value.segments, "direction:short");
    expect(short).toMatchObject({ candidateCount: "5", includedCount: "5", excludedCount: "0" });
    expect(short.netPnl).toMatchObject({ value: "2", currency: "USD" });
    expect(ratio(short.netPnlContribution)).toEqual(["2", "3"]);
    expect(ratio(short.gainPnlContribution)).toEqual(["7", "18"]);
    expect(ratio(short.lossMagnitudeContribution)).toEqual(["1", "3"]);
    expect(ratio(short.tradeFrequency)).toEqual(["5", "14"]);
    expect(short.averageNetPnl).toMatchObject({ kind: "exact_decimal", value: "0.4" });
    expect(short.signedChargeContribution).toMatchObject({
      kind: "unavailable", reasonCode: "ti_v3_query_zero_denominator",
    });
    expect(ratio(short.largestAbsoluteNetPnlContribution)).toEqual(["5", "33"]);
    expect(short.segmentIdentity).toContain(first.value.queryPlanDigest);
    expect(first.value.evidence).toHaveLength(2);
  });

  it("requires a non-aggregate grouping so attribution always names a segment", () => {
    const fixture = buildSyntheticQueryFixture();
    const result = executeTradeQueryAttribution({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan(),
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_invalid", path: "$.queryPlan.grouping" },
    });
  });
});
