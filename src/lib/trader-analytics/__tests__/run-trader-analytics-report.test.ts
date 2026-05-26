import { describe, expect, it } from "vitest";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import { runTraderAnalyticsReport } from "../run-trader-analytics-report";

const invalidRequest = {
  symbol: "ABCD",
  tradeDirection: "sideways",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  executions: [],
};

describe("runTraderAnalyticsReport", () => {
  it("runs raw request documents through execution feedback before aggregation", () => {
    const report = runTraderAnalyticsReport({
      source: "runner-test",
      generatedAt: "2026-05-02T20:15:00.000Z",
      document: {
        requests: [longWinner, repeatedAddsBeforeReduction, invalidRequest],
      },
    });

    expect(report).toMatchObject({
      contractVersion: "trader_analytics_report_v1",
      source: "runner-test",
      generatedAt: "2026-05-02T20:15:00.000Z",
      inputMode: "raw_trade_requests",
      sampleSize: {
        requestCount: 3,
        completedTradeCount: 2,
        failedTradeCount: 1,
      },
      sourceBatch: {
        contractVersion: "batch_execution_feedback_v1",
        validateOnly: false,
        failureCounts: {
          invalid_trade_request: 1,
        },
      },
    });
    expect(report.sourceBatch.failures[0]).toMatchObject({
      requestIndex: 2,
      code: "invalid_trade_request",
      source: "local_validation",
    });
    expect(report.warnings).toContain(
      "Some requests failed validation or execution-feedback generation and were excluded from aggregate metrics.",
    );
  });

  it("supports validate-only documents as an empty analytics report", () => {
    const report = runTraderAnalyticsReport({
      source: "runner-test",
      validateOnly: true,
      document: {
        requests: [longWinner],
      },
      generatedAt: "2026-05-02T20:15:00.000Z",
    });

    expect(report.sampleSize).toMatchObject({
      requestCount: 1,
      validatedTradeCount: 1,
      completedTradeCount: 0,
      failedTradeCount: 0,
      validatedOnlyCount: 1,
    });
    expect(report.sourceBatch.validateOnly).toBe(true);
    expect(report.warnings).toContain(
      "No completed execution-feedback summaries were available for aggregation.",
    );
  });

  it("can aggregate already-built execution-feedback summaries", () => {
    const feedback = runExecutionFeedback(longWinner, {
      generatedAt: "2026-05-02T20:15:00.000Z",
    });

    expect(feedback.summary).not.toBeNull();

    const report = runTraderAnalyticsReport({
      source: "summary-test",
      generatedAt: "2026-05-02T20:16:00.000Z",
      document: {
        summaries: [feedback.summary],
      },
    });

    expect(report).toMatchObject({
      inputMode: "execution_feedback_summaries",
      sourceBatch: {
        contractVersion: null,
        failures: [],
      },
      sampleSize: {
        requestCount: 1,
        completedTradeCount: 1,
      },
    });
  });
});
