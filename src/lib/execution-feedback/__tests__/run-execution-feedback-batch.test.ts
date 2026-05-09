import { describe, expect, it } from "vitest";
import { runBatchExecutionFeedback } from "../batch/run-execution-feedback-batch";

const validRequest = {
  symbol: "ABCD",
  tradeDirection: "long",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  executions: [
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:30:00.000Z",
      side: "buy",
      shares: 100,
      price: 10,
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:31:00.000Z",
      side: "buy",
      shares: 100,
      price: 9,
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:45:00.000Z",
      side: "sell",
      shares: 200,
      price: 8,
    },
  ],
};

describe("runBatchExecutionFeedback", () => {
  it("runs completed execution-only summaries and aggregates point counts", () => {
    const batch = runBatchExecutionFeedback({
      source: "test",
      requests: [validRequest],
      generatedAt: "2026-05-02T12:00:00.000Z",
    });

    expect(batch).toMatchObject({
      contractVersion: "batch_execution_feedback_v1",
      source: "test",
      generatedAt: "2026-05-02T12:00:00.000Z",
      validateOnly: false,
      totals: {
        requests: 1,
        validated: 1,
        completed: 1,
        failed: 0,
      },
      pointCounts: {
        risks: 2,
        primaryFocusIds: {
          size_expansion_after_adverse_price: 1,
        },
        riskIds: {
          size_expansion_after_adverse_price: 1,
          losing_reduction_sequence: 1,
        },
      },
      items: [
        {
          status: "completed",
          symbol: "ABCD",
          failure: null,
          summary: {
            contractVersion: "execution_feedback_summary_v1",
          },
        },
      ],
    });
  });

  it("supports validate-only mode without building summaries", () => {
    const batch = runBatchExecutionFeedback({
      source: "test",
      requests: [validRequest],
      validateOnly: true,
      generatedAt: "2026-05-02T12:00:00.000Z",
    });

    expect(batch).toMatchObject({
      validateOnly: true,
      totals: {
        requests: 1,
        validated: 1,
        completed: 0,
        failed: 0,
      },
      items: [
        {
          status: "validated",
          summary: null,
          failure: null,
        },
      ],
    });
  });

  it("keeps invalid requests local to validation failures", () => {
    const batch = runBatchExecutionFeedback({
      source: "test",
      requests: [
        validRequest,
        {
          symbol: "ABCD",
          tradeDirection: "long",
          sessionContext: {
            sessionDate: "2026/05/01",
            sessionBucket: "market_open",
          },
          executions: [],
        },
      ],
      generatedAt: "2026-05-02T12:00:00.000Z",
    });

    expect(batch).toMatchObject({
      totals: {
        requests: 2,
        validated: 1,
        completed: 1,
        failed: 1,
      },
      failureCounts: {
        invalid_trade_request: 1,
      },
      items: [
        {
          status: "completed",
        },
        {
          status: "failed",
          failure: {
            code: "invalid_trade_request",
            source: "local_validation",
          },
        },
      ],
    });
  });
});
