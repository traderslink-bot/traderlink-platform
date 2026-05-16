import { describe, expect, it } from "vitest";
import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import { runBatchExecutionFeedback } from "../../execution-feedback/batch/run-execution-feedback-batch";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";
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

function buildTimingReport(
  buckets: Array<{ session: SessionBucket; pnls: number[]; hour?: number }>,
) {
  const [base] = completedSummaries();
  const summaries = buckets.flatMap((bucket) =>
    bucket.pnls.map((pnl, index) => {
      const hour = bucket.hour ?? 9;

      return {
        requestIndex: index,
        summary: {
          ...base.summary,
          symbol: `${bucket.session.slice(0, 3).toUpperCase()}${index}`,
          sessionDate: "2026-05-12",
          sessionBucket: bucket.session,
          entrySessionBucket: bucket.session,
          entrySessionDateEt: "2026-05-12",
          entryTimeEt: `${String(hour).padStart(2, "0")}:00:00`,
          entryHourEt: hour,
          entryHourLabelEt: `${String(hour).padStart(2, "0")}:00 ET`,
          executionOnlyPnl: {
            ...base.summary.executionOnlyPnl,
            grossRealizedPnl: pnl,
          },
          warnings: [],
        } satisfies ExecutionFeedbackSummary,
      };
    }),
  );

  return buildTraderAnalyticsReport({
    source: "timing-unit-test",
    generatedAt: "2026-05-12T14:00:00.000Z",
    summaries,
    requestCount: summaries.length,
  });
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
    expect(report.executionBehavior.losingReductionSequenceTradeCount).toBeGreaterThan(
      0,
    );
    expect(report.topRisks.map((risk) => risk.id)).toEqual(
      expect.arrayContaining([
        "open_position_leftover",
        "inconsistent_share_sizing",
      ]),
    );
    expect(report.topRisks.map((risk) => risk.id)).not.toContain(
      "size_expansion_after_adverse_price",
    );
    expect(report.topRisks.map((risk) => risk.id)).not.toContain(
      "rapid_fire_execution_cluster",
    );
    expect(report.topRisks.map((risk) => risk.label).join(" ")).not.toContain(
      "Adverse Price",
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
        expect.objectContaining({
          id: "size_expansion_after_adverse_price",
          label: "Review adds that need chart data",
          category: "Review prompt",
        }),
        expect.objectContaining({
          id: "rapid_fire_execution_cluster",
          label: "Review fast execution clusters",
          category: "Review prompt",
        }),
        expect.objectContaining({
          id: "losing_reduction_sequence",
          label: "Reduced after price was against the entry",
        }),
      ]),
    );
  });

  it("marks timing buckets as outlier dominated when one trade drives most movement", () => {
    const report = buildTimingReport([
      {
        session: "pre_market",
        pnls: [-1000, 15, 20, -10, 5, 8, 12, -6, 3, 1],
        hour: 8,
      },
    ]);
    const bucket = report.timeOfDay.entrySessionBuckets.find(
      (item) => item.id === "pre_market",
    );

    expect(bucket).toMatchObject({
      grossMedianRealizedPnl: 4,
      sampleSizeLabel: "sufficient",
      conclusion: {
        kind: "outlier_dominated_total",
        confidence: "medium",
      },
    });
    expect(bucket?.largestLoser?.grossRealizedPnl).toBe(-1000);
    expect(bucket?.largestAbsoluteTrade?.grossRealizedPnl).toBe(-1000);
    expect(bucket?.largestAbsoluteTradeShareOfAbsolutePnl).toBeGreaterThan(0.9);
    expect(report.timeOfDay.entryInsight).toContain(
      "mostly driven by one trade",
    );
    expect(report.timeOfDay.entryInsight).not.toContain("Weakest entry session");
  });

  it("keeps small timing buckets as review prompts instead of repeat patterns", () => {
    const report = buildTimingReport([
      { session: "pre_market", pnls: [-50, -25, -10, 5], hour: 8 },
      {
        session: "market_open",
        pnls: [10, 12, 8, 14, 9, 11, 13, 7, 15, 16],
        hour: 9,
      },
    ]);
    const bucket = report.timeOfDay.entrySessionBuckets.find(
      (item) => item.id === "pre_market",
    );

    expect(bucket).toMatchObject({
      sampleSizeLabel: "insufficient",
      conclusion: {
        kind: "insufficient_sample",
        confidence: "low",
      },
    });
    expect(report.timeOfDay.entryInsight).toContain(
      "has too few trades for a timing pattern yet",
    );
  });

  it("separates consistent timing weakness and strength from raw totals", () => {
    const report = buildTimingReport([
      {
        session: "pre_market",
        pnls: [-10, -20, -15, -8, -12, -6, -9, -11, 5, 3],
        hour: 8,
      },
      {
        session: "market_open",
        pnls: [10, 20, 15, 8, 12, 6, 9, 11, -5, -3],
        hour: 9,
      },
    ]);
    const weakBucket = report.timeOfDay.entrySessionBuckets.find(
      (item) => item.id === "pre_market",
    );
    const strongBucket = report.timeOfDay.entrySessionBuckets.find(
      (item) => item.id === "market_open",
    );

    expect(weakBucket).toMatchObject({
      conclusion: {
        kind: "consistent_weakness",
        confidence: "high",
      },
    });
    expect(strongBucket).toMatchObject({
      conclusion: {
        kind: "consistent_strength",
        confidence: "high",
      },
    });
    expect(report.timeOfDay.entryInsight).toContain(
      "weaker average, median, and win-rate evidence",
    );
  });

  it("leaves mixed timing evidence as a review prompt", () => {
    const report = buildTimingReport([
      {
        session: "midday",
        pnls: [120, -10, -10, -10, -10, -10, -10, -10, -10, -10],
        hour: 12,
      },
    ]);
    const bucket = report.timeOfDay.entrySessionBuckets.find(
      (item) => item.id === "midday",
    );

    expect(bucket).toMatchObject({
      grossTotalRealizedPnl: 30,
      grossAverageRealizedPnl: 3,
      grossMedianRealizedPnl: -10,
      grossWinRate: 0.1,
      conclusion: {
        kind: "mixed",
        confidence: "low",
      },
    });
  });

  it("does not let unmapped or prompt-only behavior drive primary analytics conclusions", () => {
    const completed = completedSummaries();
    const source = completed.find((item) => item.summary.points.risks[0]);

    expect(source?.summary.points.risks[0]).toBeTruthy();

    const unknownRisk = {
      ...source!.summary.points.risks[0],
      id: "dominant_internal_pattern_42",
      label: "Dominant Internal Pattern 42",
      summary: "Internal scoring trace should not reach user analytics.",
    };
    const report = buildTraderAnalyticsReport({
      source: "unit-test",
      summaries: [
        {
          ...source!.summary,
          points: {
            ...source!.summary.points,
            primaryFocus: unknownRisk,
            risks: [unknownRisk],
          },
        },
      ],
    });

    expect(report.topRisks).toHaveLength(0);
    expect(report.primaryFocusCounts).toHaveLength(0);
    expect(report.trades[0]?.primaryFocus).toBeNull();
    expect(report.trades[0]?.topRisk).toBeNull();
    expect(JSON.stringify(report)).not.toContain("Dominant Internal Pattern 42");
    expect(JSON.stringify(report)).not.toContain("Internal scoring trace");
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
