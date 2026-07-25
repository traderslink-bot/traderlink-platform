import { describe, expect, it } from "vitest";

import {
  buildPersistedTradeQueryEnvelope,
  buildSyntheticQueryFixture,
  executeTradeQuery,
  rehydratePersistedTradeQuery,
  resolveTradeQueryEvidence,
  verifyTradeQueryResultShape,
  type ExactMetricValue,
  type TradeQueryResult,
} from "../../analytics";

function execute(options: Parameters<ReturnType<typeof buildSyntheticQueryFixture>["plan"]>[0] = {}) {
  const fixture = buildSyntheticQueryFixture();
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan(options),
  });
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return { fixture, result: result.value };
}

function metric(result: TradeQueryResult, key: string): ExactMetricValue {
  const value = result.rows[0].metrics.find((candidate) => candidate.metricKey === key);
  if (value === undefined) throw new Error(`missing metric ${key}`);
  return value;
}

describe("GA1-A exact metrics, proof queries, and replay", () => {
  it("matches independently calculated exact aggregate expectations", () => {
    const { fixture, result } = execute();
    expect(metric(result, "candidate_count")).toMatchObject({ kind: "integer", value: "30" });
    expect(metric(result, "included_count")).toMatchObject({ kind: "integer", value: "30" });
    expect(metric(result, "excluded_count")).toMatchObject({ kind: "integer", value: "0" });
    expect(metric(result, "win_count")).toMatchObject({ value: "18" });
    expect(metric(result, "loss_count")).toMatchObject({ value: "6" });
    expect(metric(result, "flat_count")).toMatchObject({ value: "6" });
    expect(metric(result, "gross_pnl")).toMatchObject({ kind: "exact_decimal", value: "15" });
    expect(metric(result, "signed_charges")).toMatchObject({ value: "0" });
    expect(metric(result, "net_pnl")).toMatchObject({ value: "15" });
    expect(metric(result, "average_pnl")).toMatchObject({ value: "0.5" });
    expect(metric(result, "median_pnl")).toMatchObject({ value: "1" });
    expect(metric(result, "expectancy")).toMatchObject({ value: "0.5" });
    expect(metric(result, "win_rate")).toMatchObject({ numerator: "3", denominator: "5" });
    expect(metric(result, "profit_factor")).toMatchObject({ numerator: "3", denominator: "2" });
    expect(metric(result, "average_position_size")).toMatchObject({ value: "200" });
    expect(metric(result, "median_position_size")).toMatchObject({ value: "200" });
    expect(metric(result, "average_holding_time")).toMatchObject({ numerator: "770", denominator: "1" });
    expect(metric(result, "median_holding_time")).toMatchObject({ value: "720" });
    expect(metric(result, "largest_winner_contribution")).toMatchObject({ value: "4" });
    expect(metric(result, "largest_loser_contribution")).toMatchObject({ value: "-5" });
    expect(metric(result, "net_pnl_excluding_largest_winner")).toMatchObject({ value: "11" });
    expect(metric(result, "net_pnl_excluding_largest_loser")).toMatchObject({ value: "20" });
    expect(verifyTradeQueryResultShape(result, fixture.authority)).toMatchObject({ ok: true });
  }, 30_000);

  it("proves required aggregate, weekday, time, price, sequence, after-loss, direction, and comparison queries", () => {
    const scenarios = [
      {},
      { grouping: { kind: "weekday" } },
      { grouping: { kind: "time_bucket", source: "entry", bucketMinutes: "60" } },
      { grouping: { kind: "price_range", boundaries: ["1", "2", "3"] } },
      { grouping: { kind: "trade_sequence" } },
      { filters: [{ kind: "previous_completed_outcome", values: ["loss"] }] },
      { grouping: { kind: "direction" } },
    ] as const;
    for (const options of scenarios) expect(execute(options as never).result.resultDigest).toMatch(/^ti_v3:trade_query_result:/);
    const current = execute({
      filters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
    }).result;
    const comparison = execute({
      filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }],
    }).result;
    expect(current.normalizedQueryPlan.queryPlanDigest).not.toBe(
      comparison.normalizedQueryPlan.queryPlanDigest,
    );
    expect(current.rows).toHaveLength(1);
    expect(comparison.rows).toHaveLength(1);
  }, 30_000);

  it("persists semantic replay and rejects plan, result, receipt, and evidence mutation", () => {
    const { fixture, result } = execute({ grouping: { kind: "weekday" } });
    const envelope = buildPersistedTradeQueryEnvelope(result, fixture.partition);
    expect(rehydratePersistedTradeQuery(JSON.parse(JSON.stringify(envelope)), fixture.source))
      .toMatchObject({ ok: true, value: { resultDigest: result.resultDigest } });
    type MutableEnvelope = {
      queryPlan: { metrics: string[] };
      result: {
        includedCount: string;
        executionReceipt: { candidateCount: string };
        evidence: Array<{ groupIdentity: string }>;
      };
    };
    for (const mutate of [
      (value: MutableEnvelope) => { value.queryPlan.metrics = ["net_pnl"]; },
      (value: MutableEnvelope) => { value.result.includedCount = "999"; },
      (value: MutableEnvelope) => { value.result.executionReceipt.candidateCount = "999"; },
      (value: MutableEnvelope) => { value.result.evidence[0].groupIdentity = "relabeled"; },
    ]) {
      const tampered = JSON.parse(JSON.stringify(envelope)) as MutableEnvelope;
      mutate(tampered);
      expect(rehydratePersistedTradeQuery(tampered, fixture.source)).toMatchObject({ ok: false });
    }
  });

  it("keeps evidence bounded, resolvable, immutable, and stable", () => {
    const { fixture, result: first } = execute({ grouping: { kind: "weekday" } });
    const second = execute({ grouping: { kind: "weekday" } }).result;
    expect(first.evidence.map((item) => item.evidenceDigest)).toEqual(
      second.evidence.map((item) => item.evidenceDigest),
    );
    expect(first.evidence.every((item) => item.candidates.length <= 4)).toBe(true);
    expect(first.evidence.every((item) =>
      item.candidates.every((candidate) =>
        candidate.executionDigests.length === candidate.occurrenceKeys.length))).toBe(true);
    expect(resolveTradeQueryEvidence(
      first.evidence[0],
      first.normalizedQueryPlan,
      fixture.derived.datasetReceipt.rows,
    )).toMatchObject({ ok: true });
    const tampered = JSON.parse(JSON.stringify(first)) as {
      evidence: Array<{ groupIdentity: string }>;
    };
    tampered.evidence[0].groupIdentity = "relabeled";
    expect(verifyTradeQueryResultShape(tampered, fixture.authority)).toMatchObject({ ok: false });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.evidence)).toBe(true);
  });
});
