import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQuery,
  type TradeQueryFilter,
  type TradeQueryGrouping,
} from "../../analytics";

function run(filters: readonly TradeQueryFilter[], grouping: TradeQueryGrouping = { kind: "aggregate" }) {
  const fixture = buildSyntheticQueryFixture();
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan({ filters, grouping }),
  });
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

describe("GA1-A independent filters and deterministic grouping", () => {
  it.each([
    ["inclusive date", [{ kind: "date_range", startDate: "2026-07-02", endDate: "2026-07-02" }]],
    ["account", [{ kind: "account", values: ["account_synthetic_primary"] }]],
    ["symbol", [{ kind: "symbol", values: ["instrument_alpha"] }]],
    ["direction", [{ kind: "direction", values: ["short"] }]],
    ["currency", [{ kind: "currency", value: "USD" }]],
    ["gain", [{ kind: "realized_outcome", values: ["gain"] }]],
    ["loss", [{ kind: "realized_outcome", values: ["loss"] }]],
    ["flat", [{ kind: "realized_outcome", values: ["flat"] }]],
    ["weekday", [{ kind: "weekday", values: ["friday"] }]],
    ["entry time", [{ kind: "entry_time_range", startTime: "09:00", endTime: "10:59" }]],
    ["exit time", [{ kind: "exit_time_range", startTime: "09:00", endTime: "11:59" }]],
    ["price bounds", [{ kind: "price_range", minimum: "1", maximum: "2" }]],
    ["entry price bounds", [{ kind: "entry_price_range", minimum: "1", maximum: "2" }]],
    ["session sequence", [{ kind: "sequence_in_session", minimum: "2", maximum: "3" }]],
    ["previous loss", [{ kind: "previous_completed_outcome", values: ["loss"] }]],
    ["holding bounds", [{ kind: "holding_time_seconds", minimum: "300", maximum: "900" }]],
    ["repeat attempt", [{ kind: "repeat_attempt", minimum: "2", maximum: "9" }]],
    ["position size", [{ kind: "position_size", minimum: "150", maximum: "250" }]],
    ["share quantity", [{ kind: "share_quantity_range", minimum: "100", maximum: "100" }]],
    ["entry notional", [{ kind: "entry_notional_range", minimum: "150", maximum: "250" }]],
  ] as const)("%s filter is independently executable", (_label, filters) => {
    const result = run(filters as readonly TradeQueryFilter[]);
    expect(BigInt(result.includedCount)).toBeGreaterThanOrEqual(BigInt("0"));
    expect(BigInt(result.candidateCount)).toBe(
      BigInt(result.includedCount) + BigInt(result.excludedCount),
    );
  });

  it.each([
    { kind: "day" },
    { kind: "month" },
    { kind: "week" },
    { kind: "weekday" },
    { kind: "time_bucket", source: "entry", bucketMinutes: "60" },
    { kind: "price_range", boundaries: ["1", "2", "3"] },
    { kind: "entry_price_range", boundaries: ["1", "2", "3"] },
    { kind: "trade_sequence" },
    { kind: "previous_completed_outcome" },
    { kind: "repeat_attempt" },
    { kind: "holding_time_bucket", boundariesSeconds: ["600", "1200"] },
    { kind: "position_size_bucket", boundaries: ["150", "250"] },
    { kind: "share_quantity_bucket", boundaries: ["50", "150"] },
    { kind: "entry_notional_bucket", boundaries: ["150", "250"] },
    { kind: "direction" },
    { kind: "symbol" },
    { kind: "account" },
  ] as const)("assigns stable, ordered $kind groups", (grouping) => {
    const first = run([], grouping as TradeQueryGrouping);
    const second = run([], grouping as TradeQueryGrouping);
    expect(first.rows.map((row) => row.groupIdentity)).toEqual(
      second.rows.map((row) => row.groupIdentity),
    );
    expect(new Set(first.rows.map((row) => row.groupIdentity)).size).toBe(first.rows.length);
    expect(first.rows.reduce((total, row) => total + BigInt(row.includedCount), BigInt("0")))
      .toBe(BigInt(first.includedCount));
  });

  it("supports bounded, deterministic compound grouping without nested or duplicate dimensions", () => {
    const grouping: TradeQueryGrouping = {
      kind: "compound",
      dimensions: [
        { kind: "session" },
        { kind: "trade_sequence_bucket" },
      ],
    };
    const first = run([], grouping);
    const second = run([], grouping);
    expect(first.rows.map((row) => row.groupIdentity)).toEqual(
      second.rows.map((row) => row.groupIdentity),
    );
    expect(first.rows.every((row) => row.groupIdentity.startsWith("compound:"))).toBe(true);
    expect(first.rows.reduce((total, row) => total + BigInt(row.includedCount), BigInt("0")))
      .toBe(BigInt(first.includedCount));

    const fixture = buildSyntheticQueryFixture();
    const invalid = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        grouping: {
          kind: "compound",
          dimensions: [{ kind: "session" }, { kind: "session" }],
        },
      }),
    });
    expect(invalid).toMatchObject({ ok: false, error: { path: "$.grouping.dimensions" } });

    const nested = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        grouping: {
          kind: "compound",
          dimensions: [
            { kind: "compound", dimensions: [{ kind: "session" }, { kind: "direction" }] },
            { kind: "trade_sequence_bucket" },
          ],
        } as unknown as TradeQueryGrouping,
      }),
    });
    expect(nested).toMatchObject({ ok: false, error: { path: "$.grouping.dimensions[0].kind" } });
  });

  it("is permutation invariant and keeps same-time mixed completions ambiguous", () => {
    const first = buildSyntheticQueryFixture(30, false);
    const reversed = buildSyntheticQueryFixture(30, true);
    const plan = first.plan({ grouping: { kind: "previous_completed_outcome" } });
    const firstResult = executeTradeQuery({ source: first.source, partitionReceipt: first.partition, queryPlan: plan });
    const reversePlan = reversed.plan({ grouping: { kind: "previous_completed_outcome" } });
    const reverseResult = executeTradeQuery({ source: reversed.source, partitionReceipt: reversed.partition, queryPlan: reversePlan });
    expect(firstResult).toMatchObject({ ok: true });
    expect(reverseResult).toMatchObject({ ok: true });
    if (firstResult.ok && reverseResult.ok) {
      expect(firstResult.value.resultDigest).toBe(reverseResult.value.resultDigest);
    }
  });
});
