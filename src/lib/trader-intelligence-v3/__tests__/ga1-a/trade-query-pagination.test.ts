import { describe, expect, it } from "vitest";

import { buildSyntheticQueryFixture, executeTradeQuery, paginateTradeQueryResult } from "../../analytics";

describe("GA1-A deterministic query pagination", () => {
  it("pages a verified ordered result without changing row metrics or evidence scope", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const grouping = { kind: "holding_time_bucket", boundariesSeconds: ["360", "420", "480", "540", "600", "660", "720", "780", "840", "900", "960", "1020", "1080", "1140", "1200", "1260", "1320", "1380"] } as const;
    const source = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({ grouping }),
    });
    expect(source, JSON.stringify(source)).toMatchObject({ ok: true });
    if (!source.ok) return;
    const first = paginateTradeQueryResult(source.value, { pageSize: "3" });
    expect(first, JSON.stringify(first)).toMatchObject({ ok: true });
    if (!first.ok) return;
    expect(first.value).toMatchObject({ offset: "0", pageSize: "3", totalRowCount: "19", omittedCount: "16" });
    expect(first.value.rows).toHaveLength(3);
    expect(first.value.evidence).toHaveLength(3);
    expect(first.value.continuation).not.toBeNull();
    const second = paginateTradeQueryResult(source.value, { pageSize: "3", continuation: first.value.continuation });
    expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
    if (!second.ok) return;
    expect(second.value).toMatchObject({ offset: "3", omittedCount: "13" });
    expect(new Set([...first.value.rows, ...second.value.rows].map((row) => row.groupIdentity)).size).toBe(6);
    expect(second.value.rows[0].metrics).toEqual(source.value.rows[3].metrics);
  });

  it("rejects a continuation bound to a different page size", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const grouping = { kind: "holding_time_bucket", boundariesSeconds: ["360", "420", "480", "540", "600", "660", "720", "780", "840", "900", "960", "1020", "1080", "1140", "1200", "1260", "1320", "1380"] } as const;
    const source = executeTradeQuery({ source: fixture.source, partitionReceipt: fixture.partition, queryPlan: fixture.plan({ grouping }) });
    if (!source.ok) throw new Error(JSON.stringify(source));
    const first = paginateTradeQueryResult(source.value, { pageSize: "3" });
    if (!first.ok || first.value.continuation === null) throw new Error(JSON.stringify(first));
    const invalid = paginateTradeQueryResult(source.value, { pageSize: "2", continuation: first.value.continuation });
    expect(invalid).toMatchObject({ ok: false, error: { path: "$.pagination.continuation" } });
  });
});
