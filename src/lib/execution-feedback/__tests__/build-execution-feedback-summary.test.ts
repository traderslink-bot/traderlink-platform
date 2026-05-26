import { describe, expect, it } from "vitest";
import { buildExecutionFeedbackFacts } from "../build-execution-feedback-facts";
import { buildExecutionFeedbackSummary } from "../summary/build-execution-feedback-summary";

describe("buildExecutionFeedbackSummary", () => {
  it("builds the stable execution_feedback_summary_v1 contract", () => {
    const facts = buildExecutionFeedbackFacts({
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
          timestamp: "2026-05-01T13:40:00.000Z",
          side: "sell",
          shares: 100,
          price: 11,
        },
      ],
    });
    const summary = buildExecutionFeedbackSummary({ facts });

    expect(summary).toMatchInlineSnapshot(`
      {
        "contractVersion": "execution_feedback_summary_v1",
        "dataSource": "executions_only",
        "entryHourEt": 9,
        "entryHourLabelEt": "09:00-09:59 ET",
        "entrySessionBucket": "market_open",
        "entrySessionDateEt": "2026-05-01",
        "entryTimeEt": "2026-05-01 09:30:00 ET",
        "executionCount": 2,
        "executionOnlyPnl": {
          "averageEntryExecutionPrice": 10,
          "averageReductionExecutionPrice": 11,
          "commissionsAndFeesIncluded": false,
          "grossRealizedPnl": 100,
          "grossRealizedPnlPctOfEntryNotional": 0.1,
        },
        "heldHourBucketsEt": [
          "09:00-09:59 ET",
        ],
        "heldMiddayIntoPostmarket": false,
        "heldOpenIntoMidday": false,
        "heldOvernight": false,
        "heldPostmarketIntoOvernight": false,
        "heldPremarketIntoOpen": false,
        "heldSessionBuckets": [
          "market_open",
        ],
        "lifecycle": {
          "addCountAfterInitialEntry": 0,
          "closedToFlat": true,
          "durationSeconds": 600,
          "finalExecutionPrice": 11,
          "finalPositionSize": 0,
          "fullExitCount": 1,
          "initialEntryPrice": 10,
          "initialEntrySize": 100,
          "isOpenPosition": false,
          "maxPositionSize": 100,
          "openedFromFlat": true,
          "partialReductionCount": 0,
          "readdAfterReductionCount": 0,
          "reductionCount": 1,
        },
        "limitations": [
          "This read uses execution data only.",
          "Market context, support/resistance, VWAP/EMA, and candle structure were not used.",
          "Setup quality and level interaction require candle context.",
          "Gross realized P/L excludes commissions, fees, borrow costs, and slippage.",
        ],
        "points": {
          "context": [
            {
              "category": "exit_structure",
              "confidence": "high",
              "evidence": {
                "finalPositionSize": 0,
                "fullExitCount": 1,
              },
              "id": "full_exit_trade",
              "kind": "context",
              "label": "Full Exit Trade",
              "priorityScore": 12,
              "severity": "low",
              "summary": "The execution sequence returned the position to flat.",
            },
            {
              "category": "position_construction",
              "confidence": "high",
              "evidence": {
                "initialEntrySize": 100,
                "positionIncreaseCount": 1,
              },
              "id": "single_entry_trade",
              "kind": "context",
              "label": "Single Entry Trade",
              "priorityScore": 10,
              "severity": "low",
              "summary": "The position was opened with one entry execution.",
            },
          ],
          "primaryFocus": {
            "category": "position_construction",
            "confidence": "high",
            "evidence": {
              "closedToFlat": true,
              "positionIncreaseCount": 1,
              "reductionCount": 1,
            },
            "id": "clean_single_entry_full_exit",
            "kind": "strength",
            "label": "Clean Single Entry Full Exit",
            "priorityScore": 70,
            "severity": "moderate",
            "summary": "The trade had one entry-side execution and one full exit.",
          },
          "risks": [],
          "strengths": [
            {
              "category": "position_construction",
              "confidence": "high",
              "evidence": {
                "closedToFlat": true,
                "positionIncreaseCount": 1,
                "reductionCount": 1,
              },
              "id": "clean_single_entry_full_exit",
              "kind": "strength",
              "label": "Clean Single Entry Full Exit",
              "priorityScore": 70,
              "severity": "moderate",
              "summary": "The trade had one entry-side execution and one full exit.",
            },
            {
              "category": "pnl",
              "confidence": "high",
              "evidence": {
                "commissionsAndFeesIncluded": false,
                "grossRealizedPnl": 100,
                "profitableReductionCount": 1,
                "reductionCount": 1,
              },
              "id": "profitable_reduction_sequence",
              "kind": "strength",
              "label": "Profitable Reduction Sequence",
              "priorityScore": 58,
              "severity": "moderate",
              "summary": "Each reduction execution realized a favorable price versus the position's prior average entry.",
            },
            {
              "category": "exit_structure",
              "confidence": "high",
              "evidence": {
                "finalPositionSize": 0,
                "fullExitCount": 1,
              },
              "id": "decisive_full_exit",
              "kind": "strength",
              "label": "Decisive Full Exit",
              "priorityScore": 52,
              "severity": "low",
              "summary": "The execution sequence includes a clear final exit to flat.",
            },
          ],
        },
        "riskFacts": {
          "adversePriceAddCount": 0,
          "adversePriceAddShares": 0,
          "firstReductionPctOfPreviousPosition": 1,
          "losingReductionCount": 0,
          "openPositionShares": 0,
          "profitableReductionCount": 1,
        },
        "sequencing": {
          "addsAfterFirstReductionCount": 0,
          "addsBeforeFirstReductionCount": 0,
          "averageTimeBetweenExecutionsSeconds": 600,
          "executionsPerMinute": 0.2,
          "firstReductionExecutionIndex": 1,
          "rapidFireGapCount": 0,
          "secondsFromEntryToFirstReduction": 600,
        },
        "sessionBucket": "market_open",
        "sessionDate": "2026-05-01",
        "sessionExposure": [
          {
            "durationMinutes": 10,
            "endTimestamp": "2026-05-01T13:40:00.000Z",
            "hourEt": 9,
            "hourLabelEt": "09:00-09:59 ET",
            "sessionBucket": "market_open",
            "sessionDateEt": "2026-05-01",
            "startTimestamp": "2026-05-01T13:30:00.000Z",
          },
        ],
        "sizing": {
          "averageAddShares": null,
          "increaseShareSizeRangePctOfAverage": null,
          "largestAddPctOfMaxPosition": null,
          "largestAddShares": null,
          "sizeExpansionRatioFromInitialToMax": 1,
          "totalPositionIncreaseShares": 100,
          "totalPositionReductionShares": 100,
        },
        "symbol": "ABCD",
        "tradeDirection": "long",
        "warnings": [],
      }
    `);
  });

  it("selects the highest-priority risk before strengths as primary focus", () => {
    const facts = buildExecutionFeedbackFacts({
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
    });
    const summary = buildExecutionFeedbackSummary({ facts });

    expect(summary.points.primaryFocus?.id).toBe(
      "size_expansion_after_adverse_price",
    );
  });
});
