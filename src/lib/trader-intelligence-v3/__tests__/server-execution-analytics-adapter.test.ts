import { describe, expect, it } from "vitest";

import { createServerExecutionAnalyticsAdapter } from "../analytics";
import { buildSyntheticQueryFixture } from "../analytics/query/testing/synthetic-query-authority";

describe("server execution analytics adapter", () => {
  it("uses the existing verified v3 source for capabilities, partitions, and core queries", () => {
    const fixture = buildSyntheticQueryFixture();
    const adapter = createServerExecutionAnalyticsAdapter(fixture.source);

    expect(adapter.getCapabilities().catalogKey).toBe(
      "ti_v3_execution_only_analytics_capabilities",
    );
    const partition = adapter.resolveCurrencyPartition("USD");
    expect(partition.ok).toBe(true);
    if (!partition.ok) return;
    expect(partition.value.currency).toBe("USD");
    expect(partition.value.ownerScope).toHaveLength(1);

    const overview = adapter.getOverview("USD", fixture.plan());
    expect(overview.ok).toBe(true);
    if (!overview.ok) return;
    expect(overview.value.result.rows).toHaveLength(1);
    expect(overview.value.authority).toMatchObject({
      currency: "USD",
      ownerScope: partition.value.ownerScope,
      accountScope: partition.value.accountScope,
      partitionDigest: partition.value.partitionDigest,
    });
    expect(overview.value.governedResultDigest).toMatch(
      /^ti_v3:server_execution_analytics_governed_result:v1:sha256:/,
    );
    expect(adapter.resolveCurrencyPartition("EUR")).toMatchObject({
      ok: false,
      error: { code: "ti_v3_server_analytics_partition_invalid" },
    });
  });

  it("rejects invalid query plans without exposing persistence internals", () => {
    const fixture = buildSyntheticQueryFixture();
    const result = createServerExecutionAnalyticsAdapter(fixture.source)
      .getOverview("USD", { unsupported: "query_plan" });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ti_v3_server_analytics_query_invalid", path: "$.queryPlan" },
    });
    if (result.ok) return;
    expect(Object.keys(result.error).sort()).toEqual(["code", "path"]);
    expect(JSON.stringify(result.error)).not.toMatch(/csv|raw|sourceDocument|persistence/i);
  });
});
