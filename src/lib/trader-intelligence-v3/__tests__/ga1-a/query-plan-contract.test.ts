import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildTradeQueryPlan,
  executeTradeQuery,
  TRADE_QUERY_METRIC_KEYS,
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
    expect(buildTradeQueryPlan({
      ...valid,
      filters: [{ kind: "exit_price_range", minimum: "1", maximum: "5" }],
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
      metrics: TRADE_QUERY_METRIC_KEYS.slice(0, TRADE_QUERY_LIMITS.maximumMetrics + 1),
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      limits: { ...fixture.plan().limits, groupLimit: String(TRADE_QUERY_LIMITS.maximumGroups + 1) },
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      limits: {
        ...fixture.plan().limits,
        resultRowLimit: String(TRADE_QUERY_LIMITS.maximumResultRows + 1),
      },
    }, fixture.authority)).toMatchObject({ ok: false });
    expect(buildTradeQueryPlan({
      ...fixture.plan(),
      filters: Array.from(
        { length: TRADE_QUERY_LIMITS.maximumFilters + 1 },
        () => ({ kind: "currency", value: "USD" }),
      ),
    }, fixture.authority)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized" },
    });
  });

  it("accepts one unique max-size supported filter set and rejects the next filter", () => {
    const fixture = buildSyntheticQueryFixture();
    const filters = [
      { kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-07" },
      { kind: "account", values: [fixture.authority.partitionReceipt.accountScope[0]] },
      { kind: "symbol", values: ["instrument_alpha"] },
      { kind: "source_identity", values: ["source_synthetic_broker_csv"] },
      { kind: "broker_code", values: ["synthetic_broker"] },
      { kind: "source_kind", values: ["broker_csv"] },
      { kind: "charge_coverage", value: "complete" },
      { kind: "direction", values: ["long"] },
      { kind: "currency", value: fixture.plan().authority.currency },
      { kind: "realized_outcome", values: ["gain"] },
      { kind: "weekday", values: ["monday"] },
      { kind: "entry_time_range", startTime: "09:30:00", endTime: "15:59:59" },
      { kind: "exit_time_range", startTime: "09:30:00", endTime: "15:59:59" },
      { kind: "entry_price_range", minimum: "1", maximum: "3" },
      { kind: "sequence_in_session", minimum: "1", maximum: "99" },
      { kind: "previous_completed_outcome", values: ["none", "gain", "loss", "flat", "ambiguous"] },
      { kind: "holding_time_seconds", minimum: "0", maximum: "9999" },
      { kind: "repeat_attempt", minimum: "1", maximum: "99" },
      { kind: "share_quantity_range", minimum: "1", maximum: "9999" },
      { kind: "entry_notional_range", minimum: "1", maximum: "999999" },
    ] as const;
    expect(filters).toHaveLength(TRADE_QUERY_LIMITS.maximumFilters);
    expect(buildTradeQueryPlan(fixture.plan({ filters }), fixture.authority)).toMatchObject({ ok: true });
    expect(buildTradeQueryPlan(fixture.plan({
      filters: [...filters, { kind: "currency", value: fixture.plan().authority.currency }],
    }), fixture.authority)).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized" },
    });
  });

  it("rejects redundant and contradictory ordering targets", () => {
    const fixture = buildSyntheticQueryFixture();
    const canonical = buildTradeQueryPlan(fixture.plan({
      ordering: [
        { by: "metric", metricKey: "net_pnl", direction: "descending" },
        { by: "group_identity", metricKey: null, direction: "ascending" },
      ],
    }), fixture.authority);
    const canonicalAgain = buildTradeQueryPlan(fixture.plan({
      ordering: [
        { by: "metric", metricKey: "net_pnl", direction: "descending" },
        { by: "group_identity", metricKey: null, direction: "ascending" },
      ],
    }), fixture.authority);
    expect(canonical).toMatchObject({ ok: true });
    expect(canonicalAgain).toMatchObject({ ok: true });
    if (canonical.ok && canonicalAgain.ok) {
      expect(canonical.value.queryPlanDigest).toBe(canonicalAgain.value.queryPlanDigest);
    }
    for (const ordering of [
      [
        { by: "metric", metricKey: "net_pnl", direction: "ascending" },
        { by: "metric", metricKey: "net_pnl", direction: "ascending" },
      ],
      [
        { by: "metric", metricKey: "net_pnl", direction: "ascending" },
        { by: "metric", metricKey: "net_pnl", direction: "descending" },
      ],
      [
        { by: "group_identity", metricKey: null, direction: "ascending" },
        { by: "group_identity", metricKey: null, direction: "ascending" },
      ],
      [
        { by: "group_identity", metricKey: null, direction: "ascending" },
        { by: "group_identity", metricKey: null, direction: "descending" },
      ],
    ] as const) {
      expect(buildTradeQueryPlan(fixture.plan({ ordering }), fixture.authority)).toMatchObject({
        ok: false,
        error: { code: "ti_v3_analytics_contract_duplicate_identity" },
      });
    }
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
    const legacyAlias = buildTradeQueryPlan(fixture.plan({
      filters: [{ kind: "price_range", minimum: "1", maximum: "3" }],
      grouping: { kind: "position_size_bucket", boundaries: ["150", "250"] },
    }), fixture.authority);
    const canonical = buildTradeQueryPlan(fixture.plan({
      filters: [{ kind: "entry_price_range", minimum: "1", maximum: "3" }],
      grouping: { kind: "entry_notional_bucket", boundaries: ["150", "250"] },
    }), fixture.authority);
    expect(legacyAlias).toMatchObject({ ok: true });
    expect(canonical).toMatchObject({ ok: true });
    if (legacyAlias.ok && canonical.ok) {
      expect(legacyAlias.value.queryPlanDigest).toBe(canonical.value.queryPlanDigest);
    }
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
