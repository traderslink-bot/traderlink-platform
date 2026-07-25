import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQuery,
  type SyntheticQueryFixture,
} from "../../analytics";

function execute(fixture: SyntheticQueryFixture, grouping: object) {
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan({ grouping: grouping as never }),
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
    // sees it; the repeated aggregate proves stable execution identity.
    const fixture = buildSyntheticQueryFixture(10_000, true);
    const aggregate = execute(fixture, { kind: "aggregate" });
    const weekday = execute(fixture, { kind: "weekday" });
    const time = execute(fixture, { kind: "time_bucket", source: "entry", bucketMinutes: "60" });
    const direction = execute(fixture, { kind: "direction" });
    const repeated = execute(fixture, { kind: "aggregate" });
    const elapsed = performance.now() - started;
    expect(aggregate.includedCount).toBe("10000");
    expect(aggregate.candidateCount).toBe("10000");
    expect(aggregate.resultDigest).toBe(repeated.resultDigest);
    expect(weekday.rows.length).toBeGreaterThan(1);
    expect(time.rows.length).toBeGreaterThan(1);
    expect(direction.rows).toHaveLength(2);
    expect(JSON.stringify(aggregate).length).toBeLessThan(1_048_576);
    expect(elapsed).toBeLessThan(150_000);
  }, 180_000);
});
