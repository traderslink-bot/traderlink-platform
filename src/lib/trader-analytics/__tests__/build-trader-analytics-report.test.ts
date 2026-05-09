import { describe, expect, it } from "vitest";
import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import { runBatchExecutionFeedback } from "../../execution-feedback/batch/run-execution-feedback-batch";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import { buildTraderAnalyticsReport } from "../build-trader-analytics-report";

const fixtureRequests = [
  longWinner,
  longLoser,
  openPosition,
  repeatedAddsBeforeReduction,
  inconsistentShareSizing,
  rapidFireExecutionCluster,
];

function completedSummaries(): Array<{
  requestIndex: number;
  summary: ExecutionFeedbackSummary;
}> {
  const batch = runBatchExecutionFeedback({
    source: "analytics-test",
    requests: fixtureRequests,
    generatedAt: "2026-05-02T20:00:00.000Z",
  });

  expect(batch.totals.completed).toBe(fixtureRequests.length);

  return batch.items
    .filter((item) => item.status === "completed" && item.summary)
    .map((item) => ({
      requestIndex: item.requestIndex,
      summary: item.summary as ExecutionFeedbackSummary,
    }));
}

describe("buildTraderAnalyticsReport", () => {
  it("aggregates execution-feedback summaries into the v1 report contract", () => {
    const report = buildTraderAnalyticsReport({
      source: "unit-test",
      generatedAt: "2026-05-02T20:00:00.000Z",
      summaries: completedSummaries(),
      requestCount: fixtureRequests.length,
    });

    expect(report).toMatchObject({
      contractVersion: "trader_analytics_report_v1",
      dataSource: "execution_feedback_summaries",
      source: "unit-test",
      generatedAt: "2026-05-02T20:00:00.000Z",
      sampleSize: {
        requestCount: fixtureRequests.length,
        completedTradeCount: fixtureRequests.length,
        failedTradeCount: 0,
        validatedOnlyCount: 0,
      },
      pnl: {
        commissionsAndFeesIncluded: false,
      },
    });
    expect(report.trades).toHaveLength(fixtureRequests.length);
    expect(report.timeOfDay.entrySessionBuckets.length).toBeGreaterThan(0);
    expect(report.timeOfDay.entryHoursEt.length).toBeGreaterThan(0);
    expect(report.pnl.grossWinnerCount + report.pnl.grossLoserCount).toBeGreaterThan(
      0,
    );
    expect(report.limitations).toEqual(
      expect.arrayContaining([
        "This report aggregates execution-feedback summaries only.",
        "Gross P/L excludes commissions, fees, borrow costs, and slippage.",
        "Small sample sizes should be treated as review prompts, not statistical proof.",
      ]),
    );
  });

  it("counts the major risk and strength point families without candle context", () => {
    const report = buildTraderAnalyticsReport({
      source: "unit-test",
      summaries: completedSummaries(),
    });

    expect(report.executionBehavior.adversePriceAddTradeCount).toBeGreaterThan(0);
    expect(
      report.executionBehavior.multipleAddsBeforeReductionTradeCount,
    ).toBeGreaterThan(0);
    expect(report.executionBehavior.openPositionLeftoverTradeCount).toBeGreaterThan(
      0,
    );
    expect(report.executionBehavior.rapidFireExecutionTradeCount).toBeGreaterThan(
      0,
    );
    expect(report.executionBehavior.inconsistentShareSizingTradeCount).toBeGreaterThan(
      0,
    );
    expect(report.topRisks.map((risk) => risk.id)).toEqual(
      expect.arrayContaining([
        "size_expansion_after_adverse_price",
        "open_position_leftover",
        "rapid_fire_execution_cluster",
        "inconsistent_share_sizing",
      ]),
    );
    expect(report.topStrengths.length).toBeGreaterThan(0);
    expect(report.strengths.decisiveFullExitCount).toBeGreaterThan(0);
  });

  it("builds deterministic chart-ready data for the dashboard", () => {
    const report = buildTraderAnalyticsReport({
      source: "unit-test",
      summaries: completedSummaries(),
    });

    expect(report.charts.grossPnlByTrade).toMatchObject({
      id: "gross_pnl_by_trade",
      kind: "bar",
      empty: false,
    });
    expect(report.charts.grossPnlByTrade.data).toHaveLength(
      report.trades.length,
    );
    expect(report.charts.winLossDonut.total).toBe(
      report.sampleSize.completedTradeCount,
    );
    expect(report.charts.topRisksBar.data.map((datum) => datum.id)).toEqual(
      report.topRisks.map((risk) => risk.id),
    );
    expect(report.charts.durationHistogram.data.length).toBeGreaterThan(0);
    expect(report.charts.entrySessionPerformance.data.length).toBeGreaterThan(0);
    expect(report.charts.entryHourPerformance.data.length).toBeGreaterThan(0);
    expect(report.charts.behaviorRiskRates.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "adverse_price_adds" }),
        expect.objectContaining({ id: "rapid_fire_execution_cluster" }),
      ]),
    );
  });

  it("keeps execution-only metrics stable when extra market context is present", () => {
    const [first] = completedSummaries();
    const withMarketContext = {
      ...first.summary,
      marketContext: {
        marketStructure: {
          phase: "experimental",
        },
      },
    } as unknown as ExecutionFeedbackSummary;
    const baseline = buildTraderAnalyticsReport({
      source: "unit-test",
      summaries: [first.summary],
    });
    const report = buildTraderAnalyticsReport({
      source: "unit-test",
      summaries: [withMarketContext],
    });

    expect(report.pnl).toEqual(baseline.pnl);
    expect(report.lifecycle).toEqual(baseline.lifecycle);
    expect(report.executionBehavior).toEqual(baseline.executionBehavior);
    expect(report.timeOfDay).toEqual(baseline.timeOfDay);
    expect(report.topRisks).toEqual(baseline.topRisks);
    expect(report.limitations.join(" ")).toContain(
      "Market context, support/resistance, VWAP/EMA, and candle structure were not used",
    );
  });
});
