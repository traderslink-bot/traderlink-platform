// @vitest-environment node
import { expect, it } from "vitest";
import { comparisonQueryFromExplorerQuery } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-comparison-model";
import { normalizeAnalyticsLabPlatformQuery } from "@/app/(dashboard)/analytics/lab/analytics-lab-platform-query";
import type { AnalyticsLabPlatformQuery } from "@/app/(dashboard)/analytics/lab/analytics-lab-platform-types";
it("accepts a comparison initialized from Explorer without leaking unsupported filters", () => {
  const base: AnalyticsLabPlatformQuery = {
    expectedAccountSelectionRef: "a".repeat(64), metricId: "total_trades", grouping: "total", moneyBasis: "net", currency: null, symbol: null, direction: null,
    tradeClassification: null, provenance: null, outcome: null, entryWeekday: null, entrySession: null, entryTimeBucketMinutes: 30, entryTimeBucket: null,
    startDate: "2026-01-01", endDate: "2026-01-31", minimumHoldingSeconds: null, maximumHoldingSeconds: null, minimumEnteredQuantity: "0.00000001", maximumEnteredQuantity: null,
    minimumPositionQuantity: null, maximumPositionQuantity: null, minimumEntryNotional: null, maximumEntryNotional: null, evidenceRows: 50,
  };
  const input = { ...base, tagId: "tag", noteState: "present", ruleId: "rule", untaggedOnly: false };
  expect(() => normalizeAnalyticsLabPlatformQuery(input)).toThrow();
  const query = comparisonQueryFromExplorerQuery(input);
  expect(query).toEqual(base);
  expect(() => normalizeAnalyticsLabPlatformQuery(query)).not.toThrow();
  expect(input.tagId).toBe("tag");
});
