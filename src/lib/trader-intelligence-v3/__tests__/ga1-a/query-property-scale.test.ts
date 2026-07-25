import { describe, expect, it } from "vitest";

import {
  buildTradeQueryPlan,
  buildSyntheticQueryFixture,
  executeTradeQuery,
  resolveTradeQueryEvidence,
  TRADE_QUERY_LIMITS,
  TRADE_QUERY_METRIC_KEYS,
  type SyntheticQueryFixture,
} from "../../analytics";

function execute(
  fixture: SyntheticQueryFixture,
  grouping: object,
  metrics?: readonly (typeof TRADE_QUERY_METRIC_KEYS)[number][],
  filters: NonNullable<
    Parameters<SyntheticQueryFixture["plan"]>[0]
  >["filters"] = [],
) {
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan({ grouping: grouping as never, metrics, filters }),
  });
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

describe("GA1-A fixed-seed properties and 10,000-row scale proof", () => {
  it("preserves grouped totals and stable identities under permutation", () => {
    const fixture = buildSyntheticQueryFixture(200, false);
    const reversedFixture = buildSyntheticQueryFixture(200, true);
    const aggregate = execute(fixture, { kind: "aggregate" });
    const weekday = execute(fixture, { kind: "weekday" });
    const reversed = execute(reversedFixture, { kind: "weekday" });
    expect(weekday.resultDigest).toBe(reversed.resultDigest);
    expect(weekday.rows.reduce((total, row) => total + BigInt(row.includedCount), BigInt("0")))
      .toBe(BigInt(aggregate.includedCount));
    expect(BigInt(aggregate.candidateCount)).toBe(
      BigInt(aggregate.includedCount) + BigInt(aggregate.excludedCount),
    );
    const aggregateNet = aggregate.rows[0].metrics.find((metric) => metric.metricKey === "net_pnl");
    const groupedNet = weekday.rows.map((row) =>
      row.metrics.find((metric) => metric.metricKey === "net_pnl"));
    expect(aggregateNet).toMatchObject({ kind: "exact_decimal" });
    const groupedTotal = groupedNet.reduce((total, metric) =>
      total + BigInt(metric?.kind === "exact_decimal" ? metric.value : "0"), BigInt("0"));
    expect(groupedTotal.toString()).toBe(
      aggregateNet?.kind === "exact_decimal" ? aggregateNet.value : "unavailable",
    );
  }, 60_000);

  const scaleProof = process.env.TI_V3_GA1_A_SCALE_PROOF === "1" ? it : it.skip;
  scaleProof("executes aggregate plus three groupings over 10,000 included rows within a reasonable budget", () => {
    const started = performance.now();
    // The single scale receipt is intentionally built from reverse caller
    // order. The accepted dataset builder canonicalizes it before the engine
    // sees it; normal and reversed authorities prove stable execution identity.
    const fixture = buildSyntheticQueryFixture(10_000, false);
    const reversedFixture = buildSyntheticQueryFixture(10_000, true);
    const broadMetrics = TRADE_QUERY_METRIC_KEYS.slice(
      0,
      TRADE_QUERY_LIMITS.maximumMetrics,
    );
    const groupedMetrics = [
      "candidate_count", "included_count", "excluded_count", "net_pnl",
      "average_pnl", "median_pnl", "win_rate", "profit_factor",
    ] as const;
    const aggregate = execute(fixture, { kind: "aggregate" }, broadMetrics);
    const weekday = execute(fixture, { kind: "weekday" }, groupedMetrics);
    const time = execute(
      fixture,
      { kind: "time_bucket", source: "entry", bucketMinutes: "60" },
      groupedMetrics,
    );
    const price = execute(
      fixture,
      { kind: "entry_price_range", boundaries: ["1", "2", "3"] },
      groupedMetrics,
    );
    const sequence = execute(
      fixture,
      { kind: "trade_sequence" },
      groupedMetrics,
      [{ kind: "sequence_in_session", minimum: "1", maximum: "64" }],
    );
    const previous = execute(
      fixture,
      { kind: "previous_completed_outcome" },
      groupedMetrics,
    );
    const positionSize = execute(
      fixture,
      { kind: "entry_notional_bucket", boundaries: ["150", "250"] },
      groupedMetrics,
    );
    const reversed = execute(
      reversedFixture,
      { kind: "aggregate" },
      broadMetrics,
    );
    const elapsed = performance.now() - started;
    expect(aggregate.includedCount).toBe("10000");
    expect(aggregate.candidateCount).toBe("10000");
    expect(aggregate.resultDigest).toBe(reversed.resultDigest);
    expect(weekday.rows.length).toBeGreaterThan(1);
    expect(time.rows.length).toBeGreaterThan(1);
    expect(price.rows.length).toBeGreaterThan(1);
    expect(sequence.rows.length).toBeGreaterThan(1);
    expect(previous.rows.length).toBeGreaterThan(1);
    expect(positionSize.rows.length).toBeGreaterThan(1);
    for (const evidence of aggregate.evidence) {
      expect(resolveTradeQueryEvidence(
        evidence,
        aggregate.normalizedQueryPlan,
        fixture.derived.datasetReceipt.rows,
      )).toMatchObject({ ok: true });
    }
    expect(JSON.stringify(aggregate).length).toBeLessThan(1_048_576);
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      metrics: TRADE_QUERY_METRIC_KEYS.slice(
        0,
        TRADE_QUERY_LIMITS.maximumMetrics + 1,
      ),
    }, fixture.authority)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized" },
    });
    expect(elapsed).toBeLessThan(150_000);
  }, 180_000);
});
