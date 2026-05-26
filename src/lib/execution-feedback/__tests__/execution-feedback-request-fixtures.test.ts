import { describe, expect, it } from "vitest";
import invalidExecutionOnlyRequests from "../../../docs/trade-analysis-request-fixtures/invalid-execution-only-requests.json";
import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import partialExits from "../../../docs/trade-analysis-request-fixtures/partial-exits.json";
import providerFailureExample from "../../../docs/trade-analysis-request-fixtures/provider-failure-example.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import shortLoser from "../../../docs/trade-analysis-request-fixtures/short-loser.json";
import shortWinner from "../../../docs/trade-analysis-request-fixtures/short-winner.json";
import { parseTradeAnalysisRequestDocument } from "../../trade-analysis/request/trade-analysis-request-contract";
import { runBatchExecutionFeedback } from "../batch/run-execution-feedback-batch";
import { runExecutionFeedback } from "../run-execution-feedback";

function pointIds(fixture: unknown): string[] {
  const result = runExecutionFeedback(fixture, {
    generatedAt: "2026-05-02T18:00:00.000Z",
  });

  expect(result.status).toBe("completed");
  expect(result.summary).not.toBeNull();

  return [
    ...(result.summary?.points.risks.map((point) => point.id) ?? []),
    ...(result.summary?.points.strengths.map((point) => point.id) ?? []),
    ...(result.summary?.points.context.map((point) => point.id) ?? []),
  ];
}

describe("execution feedback request fixtures", () => {
  it.each([
    ["long winner", longWinner],
    ["long loser", longLoser],
    ["short winner", shortWinner],
    ["short loser", shortLoser],
    ["open position", openPosition],
    ["partial exits", partialExits],
    ["provider failure example", providerFailureExample],
    ["repeated adds before reduction", repeatedAddsBeforeReduction],
    ["inconsistent share sizing", inconsistentShareSizing],
    ["rapid fire execution cluster", rapidFireExecutionCluster],
  ])("runs %s through execution-only feedback", (_name, fixture) => {
    const result = runExecutionFeedback(fixture, {
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(result.status).toBe("completed");
    expect(result.summary).toMatchObject({
      contractVersion: "execution_feedback_summary_v1",
      dataSource: "executions_only",
    });
    expect(result.summary?.limitations).toEqual(
      expect.arrayContaining([
        "This read uses execution data only.",
        "Market context, support/resistance, VWAP/EMA, and candle structure were not used.",
        "Setup quality and level interaction require candle context.",
      ]),
    );
  });

  it("keeps the short-loser fixture direction-aware and execution-only", () => {
    const result = runExecutionFeedback(shortLoser, {
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(result.summary?.executionOnlyPnl).toMatchObject({
      grossRealizedPnl: -78,
      commissionsAndFeesIncluded: false,
    });
    expect(result.summary?.points.primaryFocus?.id).toBe(
      "losing_reduction_sequence",
    );
  });

  it("locks repeated-adds-before-reduction fixture risks", () => {
    expect(pointIds(repeatedAddsBeforeReduction)).toEqual(
      expect.arrayContaining([
        "size_expansion_after_adverse_price",
        "multiple_adds_before_first_reduction",
        "overbuilt_position",
        "all_or_nothing_exit_after_many_adds",
      ]),
    );
  });

  it("locks inconsistent-share-sizing fixture risks", () => {
    const result = runExecutionFeedback(inconsistentShareSizing, {
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(result.summary?.points.primaryFocus?.id).toBe(
      "inconsistent_share_sizing",
    );
    expect(pointIds(inconsistentShareSizing)).toContain(
      "inconsistent_share_sizing",
    );
  });

  it("locks rapid-fire execution cluster fixture risks", () => {
    const result = runExecutionFeedback(rapidFireExecutionCluster, {
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(result.summary?.points.primaryFocus?.id).toBe(
      "rapid_fire_execution_cluster",
    );
    expect(result.summary?.sequencing.rapidFireGapCount).toBe(3);
  });

  it("keeps invalid execution-only fixtures as local validation failures", () => {
    const requests =
      parseTradeAnalysisRequestDocument(invalidExecutionOnlyRequests).requests;
    const batch = runBatchExecutionFeedback({
      source: "fixture-test",
      requests,
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(batch).toMatchObject({
      contractVersion: "batch_execution_feedback_v1",
      totals: {
        requests: 3,
        validated: 0,
        completed: 0,
        failed: 3,
      },
      failureCounts: {
        invalid_trade_request: 3,
      },
    });
    expect(batch.items.every((item) => item.summary === null)).toBe(true);
    expect(
      batch.items.flatMap((item) =>
        item.validation.issues.map((issue) => issue.code),
      ),
    ).toEqual(
      expect.arrayContaining([
        "exit_before_entry",
        "mixed_execution_symbols",
        "invalid_execution_timestamp",
        "invalid_execution_side",
        "invalid_execution_shares",
        "invalid_execution_price",
      ]),
    );
  });

  it("proves provider-specific fixture data does not trigger provider or candle work", () => {
    const result = runExecutionFeedback(providerFailureExample, {
      generatedAt: "2026-05-02T18:00:00.000Z",
    });

    expect(result.status).toBe("completed");
    expect(result.summary).toMatchObject({
      symbol: "NO_DATA",
      dataSource: "executions_only",
      executionCount: 2,
    });
    expect(result.summary?.limitations.join(" ")).toContain(
      "Market context, support/resistance, VWAP/EMA, and candle structure were not used.",
    );
  });
});
