import { normalizeAnalyticsLabPlatformQuery } from "@/app/(dashboard)/analytics/lab/analytics-lab-platform-query";

const query = Object.freeze({
  expectedAccountSelectionRef: "selection-reference",
  metricId: "net_pnl",
  grouping: "closing_day",
  moneyBasis: "net",
  currency: "USD",
  symbol: null,
  direction: null,
  provenance: null,
  outcome: null,
  entryWeekday: null,
  entryTimeBucketMinutes: 30,
  entryTimeBucket: null,
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  minimumHoldingSeconds: null,
  maximumHoldingSeconds: null,
  minimumEnteredQuantity: null,
  maximumEnteredQuantity: null,
  minimumPositionQuantity: null,
  maximumPositionQuantity: null,
  minimumEntryNotional: null,
  maximumEntryNotional: null,
  evidenceRows: 24,
});

describe("replacement Analytics Lab query boundary", () => {
  it("accepts the exact replacement query contract", () => {
    expect(normalizeAnalyticsLabPlatformQuery(query)).toEqual(query);
  });

  it("rejects unknown fields and unavailable metric identifiers", () => {
    expect(() => normalizeAnalyticsLabPlatformQuery({
      ...query,
      legacySampleMode: true,
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => normalizeAnalyticsLabPlatformQuery({
      ...query,
      metricId: "not_a_metric",
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  });

  it("rejects unsupported groupings and reversed exact ranges", () => {
    expect(() => normalizeAnalyticsLabPlatformQuery({
      ...query,
      grouping: "session",
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => normalizeAnalyticsLabPlatformQuery({
      ...query,
      minimumEnteredQuantity: "100.25",
      maximumEnteredQuantity: "100.24",
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  });

  it("rejects malformed decimals instead of converting them through Number", () => {
    for (const value of ["01", "1.0", "-1", "1e3", "1.", "1.2300"]) {
      expect(() => normalizeAnalyticsLabPlatformQuery({
        ...query,
        minimumEntryNotional: value,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    }
  });

  it("requires the selected time to align with the selected time bucket", () => {
    expect(() => normalizeAnalyticsLabPlatformQuery({
      ...query,
      entryTimeBucket: "09:35",
      entryTimeBucketMinutes: 30,
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(normalizeAnalyticsLabPlatformQuery({
      ...query,
      entryTimeBucket: "09:30",
      entryTimeBucketMinutes: 30,
    }).entryTimeBucket).toBe("09:30");
  });
});
