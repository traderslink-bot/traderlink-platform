import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQueryPeriodAttribution,
  type TradeQueryPeriodAttributionSegment,
} from "../../analytics";

function segment(rows: readonly TradeQueryPeriodAttributionSegment[], identity: string) {
  const found = rows.find((row) => row.groupIdentity === identity);
  if (found === undefined) throw new Error(`missing segment ${identity}`);
  return found;
}

describe("GA1-A exact period attribution", () => {
  it("reconciles frequency, mix, and average-result effects to the exact period P/L change", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const grouping = { kind: "direction" } as const;
    const result = executeTradeQueryPeriodAttribution({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      baselineQueryPlan: fixture.plan({
        filters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }], grouping,
      }),
      comparisonQueryPlan: fixture.plan({
        filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }], grouping,
      }),
    });

    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      decompositionPolicy: "frequency_mix_average_result_v1",
      baselineCount: "6", comparisonCount: "8",
    });
    expect(result.value.baselineNetPnl).toMatchObject({ value: "5" });
    expect(result.value.comparisonNetPnl).toMatchObject({ value: "-2" });
    expect(result.value.absoluteChange).toMatchObject({ numerator: "-7", denominator: "1" });
    expect(result.value.reconciliationDifference).toMatchObject({ numerator: "0", denominator: "1" });
    expect(segment(result.value.segments, "direction:short")).toMatchObject({ baselineCount: "2", comparisonCount: "3" });
    expect(segment(result.value.segments, "direction:long")).toMatchObject({ baselineCount: "4", comparisonCount: "5" });
    expect(result.value.evidence.length).toBeGreaterThan(0);
  });
});
