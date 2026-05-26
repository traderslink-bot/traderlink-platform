import { describe, expect, it } from "vitest";
import { runExecutionFeedback } from "../run-execution-feedback";

const validRequest = {
  symbol: "ABCD",
  tradeDirection: "long",
  sessionContext: {
    sessionDate: "2026-05-01",
    sessionBucket: "market_open",
  },
  provider: {
    preferredProvider: "ibkr",
  },
  executions: [
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:30:00.000Z",
      side: "buy",
      shares: "100",
      price: "10",
    },
    {
      symbol: "ABCD",
      timestamp: "2026-05-01T13:35:00.000Z",
      side: "sell",
      shares: 100,
      price: 11,
    },
  ],
};

describe("runExecutionFeedback", () => {
  it("validates a user request and returns execution-only summary output", () => {
    const result = runExecutionFeedback(validRequest, {
      generatedAt: "2026-05-02T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      contractVersion: "execution_feedback_run_v1",
      generatedAt: "2026-05-02T12:00:00.000Z",
      status: "completed",
      symbol: "ABCD",
      validation: {
        valid: true,
        issues: [],
      },
      failure: null,
      summary: {
        contractVersion: "execution_feedback_summary_v1",
        dataSource: "executions_only",
        symbol: "ABCD",
        executionCount: 2,
      },
    });
    expect(result.summary?.limitations).toEqual(
      expect.arrayContaining([
        "This read uses execution data only.",
        "Setup quality and level interaction require candle context.",
      ]),
    );
  });

  it("returns validation issues without building a summary for invalid requests", () => {
    const result = runExecutionFeedback(
      {
        symbol: "ABCD",
        tradeDirection: "long",
        sessionContext: {
          sessionDate: "2026/05/01",
          sessionBucket: "market_open",
        },
        executions: [],
      },
      {
        generatedAt: "2026-05-02T12:00:00.000Z",
      },
    );

    expect(result.status).toBe("validation_failed");
    expect(result.summary).toBeNull();
    expect(result.validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["invalid_session_date", "missing_executions"]),
    );
  });

  it("carries non-blocking validation warnings into the summary", () => {
    const result = runExecutionFeedback(
      {
        ...validRequest,
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:45:00.000Z",
            side: "buy",
            shares: 50,
            price: 12,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
        ],
      },
      {
        generatedAt: "2026-05-02T12:00:00.000Z",
      },
    );

    expect(result.status).toBe("completed");
    expect(result.validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "execution_order_will_be_normalized",
        "open_position",
      ]),
    );
    expect(result.summary?.warnings).toEqual(
      expect.arrayContaining([
        "executions: Executions will be sorted by timestamp before analysis.",
        "executions: Execution sequence leaves an open position; full-exit patterns may not apply.",
      ]),
    );
  });
});
