import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildTradeQueryPlan,
  executeTradeQuery,
  TRADE_QUERY_LIMITS,
  verifyTradeQueryPlan,
} from "../../analytics";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("GA1-A deterministic query-plan contract", () => {
  it("normalizes an exact accepted shape and freezes the validated plan", () => {
    const fixture = buildSyntheticQueryFixture();
    const input = fixture.plan({
      filters: [
        { kind: "direction", values: ["short", "long"] },
        { kind: "weekday", values: ["friday", "monday"] },
      ],
      metrics: ["win_rate", "net_pnl", "included_count"],
    });
    const built = buildTradeQueryPlan(input, fixture.authority);
    expect(built, JSON.stringify(built)).toMatchObject({ ok: true });
    if (!built.ok) return;
    expect(built.value.filters.map((filter) => filter.kind)).toEqual(["direction", "weekday"]);
    expect(built.value.metrics).toEqual(["included_count", "net_pnl", "win_rate"]);
    expect(Object.isFrozen(built.value)).toBe(true);
    expect(Object.isFrozen(built.value.filters)).toBe(true);
    expect(verifyTradeQueryPlan(clone(built.value), fixture.authority)).toMatchObject({
      ok: true,
      value: { queryPlanDigest: built.value.queryPlanDigest },
    });
  });

  it("rejects unknown, missing, unsupported, duplicate, contradictory, and accessor shapes", () => {
    const fixture = buildSyntheticQueryFixture();
    const valid = fixture.plan();
    expect(buildTradeQueryPlan({ ...valid, rawSql: "select *" }, fixture.authority)).toMatchObject({ ok: false });
    const missing = clone(valid) as unknown as Record<string, unknown>;
    delete missing.grouping;
    expect(buildTradeQueryPlan(missing, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({ ...valid, schemaVersion: "v2" }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...valid,
      metrics: ["net_pnl", "net_pnl"],
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...valid,
      filters: [
        { kind: "direction", values: ["long"] },
        { kind: "direction", values: ["short"] },
      ],
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...valid,
      filters: [{ kind: "price_range", minimum: "5", maximum: "1" }],
    }, fixture.authority)).toMatchObject({ ok: false });
    const accessor = Object.create(null) as Record<string, unknown>;
    Object.defineProperties(accessor, {
      ...Object.fromEntries(Object.entries(valid).map(([key, value]) => [
        key, { enumerable: true, value },
      ])),
      metrics: { enumerable: true, get: () => ["net_pnl"] },
    });
    expect(buildTradeQueryPlan(accessor, fixture.authority)).toMatchObject({ ok: false });
  });

  it("rejects digest, authority, partition, currency, account, and max-plus-one tampering", () => {
    const fixture = buildSyntheticQueryFixture();
    const built = buildTradeQueryPlan(fixture.plan(), fixture.authority);
    expect(built).toMatchObject({ ok: true });
    if (!built.ok) return;
    expect(verifyTradeQueryPlan({
      ...built.value,
      queryPlanDigest: `ti_v3:trade_query_plan:v1:sha256:${"0".repeat(64)}`,
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      authority: { ...fixture.plan().authority, partitionDigest: fixture.authority.datasetReceipt.receiptDigest },
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      filters: [{ kind: "currency", value: "CAD" }],
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      filters: [{ kind: "account", values: ["account_foreign"] }],
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      metrics: Array.from({ length: TRADE_QUERY_LIMITS.maximumMetrics + 1 }, (_, index) =>
        `metric_${index}`),
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      limits: { ...fixture.plan().limits, groupLimit: String(TRADE_QUERY_LIMITS.maximumGroups + 1) },
    }, fixture.authority)).toMatchObject({ ok: false });
  });

  it("assigns identical identity to equivalent normalized plans", () => {
    const fixture = buildSyntheticQueryFixture();
    const first = buildTradeQueryPlan(fixture.plan({
      filters: [
        { kind: "weekday", values: ["friday", "monday"] },
        { kind: "direction", values: ["short", "long"] },
      ],
      metrics: ["net_pnl", "win_rate"],
    }), fixture.authority);
    const second = buildTradeQueryPlan(fixture.plan({
      filters: [
        { kind: "direction", values: ["long", "short"] },
        { kind: "weekday", values: ["monday", "friday"] },
      ],
      metrics: ["win_rate", "net_pnl"],
    }), fixture.authority);
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (first.ok && second.ok) expect(first.value.queryPlanDigest).toBe(second.value.queryPlanDigest);
  });

  it("rejects execution with a foreign selected partition", () => {
    const fixture = buildSyntheticQueryFixture();
    const other = buildSyntheticQueryFixture(10);
    expect(executeTradeQuery({
      source: fixture.source,
      partitionReceipt: other.partition,
      queryPlan: fixture.plan(),
    })).toMatchObject({ ok: false });
  });
});
