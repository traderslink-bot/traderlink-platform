import { describe, expect, it } from "vitest";
import { buildSampleSavedTraderAnalyticsData } from "../product/sample-data";
import {
  filterCustomerSavedReports,
  filterCustomerSavedTrades,
  isLocalSyntheticTicker,
} from "../product/customer-data-filter";

describe("customer data filter", () => {
  it("detects local E2E synthetic tickers without matching real symbols", () => {
    expect(isLocalSyntheticTicker("E2E123456")).toBe(true);
    expect(isLocalSyntheticTicker("e2e987654321")).toBe(true);
    expect(isLocalSyntheticTicker("AAPL")).toBe(false);
    expect(isLocalSyntheticTicker("E2E")).toBe(false);
  });

  it("removes local synthetic trades from customer-facing trade lists", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const synthetic = {
      ...sample.trades[0]!,
      id: "trade-local-synthetic",
      symbol: "E2E123456",
    };

    expect(filterCustomerSavedTrades([...sample.trades, synthetic])).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "E2E123456" }),
      ]),
    );
  });

  it("rebuilds reports after removing local synthetic summary rows", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.reports[0]!;
    const syntheticReport = {
      ...report,
      sourceSummaries: report.sourceSummaries.map((summaryRef, index) =>
        index === 0
          ? {
              ...summaryRef,
              summary: {
                ...summaryRef.summary,
                symbol: "E2E123456",
              },
            }
          : summaryRef,
      ),
    };

    const [filtered] = filterCustomerSavedReports([syntheticReport]);

    expect(filtered).toBeTruthy();
    expect(filtered?.sourceSummaries).toHaveLength(
      report.sourceSummaries.length - 1,
    );
    expect(filtered?.sourceSummaries.map((summaryRef) => summaryRef.summary.symbol)).not.toContain(
      "E2E123456",
    );
    expect(filtered?.report.sampleSize.completedTradeCount).toBe(
      report.report.sampleSize.completedTradeCount - 1,
    );
  });
});
