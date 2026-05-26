import { buildCsvDryRunImportExperience } from "./csv-dry-run-workflow";
import type { BrokerExecutionCsvFormat } from "../../execution-sources/csv";

export type BuySellExecutionFixtureId =
  | "long_win"
  | "long_loss"
  | "short_win"
  | "short_loss"
  | "partial_exit"
  | "over_reduction"
  | "same_symbol_split"
  | "open_position"
  | "rejected_row"
  | "fees_net_amount"
  | "duplicate_like_fill_cluster"
  | "same_timestamp_scalp_cluster"
  | "huge_size_jump"
  | "fees_larger_than_trade_value";

export interface BuySellExecutionGroupedTradeExpectation {
  symbol: string;
  tradeDirection: "long" | "short";
  lifecycleStatus: "closed" | "open";
  groupingReason: string;
  finalPositionShares: number;
  grossRealizedPnl: number | null;
  needsReview: boolean;
}

export interface BuySellExecutionFixtureExpectation {
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  groupedTradeCount: number;
  confidenceStatus: "ready" | "needs_review" | "blocked";
  totalGrossRealizedPnl: number | null;
  groupedTrades: BuySellExecutionGroupedTradeExpectation[];
  costVisibility?: {
    totalCosts: number;
    brokerNetAmountTotal: number | null;
    grossMinusKnownCosts: number | null;
  };
  requiredIssueCodes?: string[];
  requiredAnomalyTypes?: string[];
  anomalyCounts?: {
    totalCount: number;
    urgentCount: number;
    reviewCount: number;
  };
}

export interface BuySellExecutionFixtureCase {
  id: BuySellExecutionFixtureId;
  label: string;
  broker: BrokerExecutionCsvFormat;
  csvText: string;
  expected: BuySellExecutionFixtureExpectation;
}

export interface BuySellExecutionFixtureResult {
  id: BuySellExecutionFixtureId;
  label: string;
  status: "pass" | "fail";
  failedExpectations: string[];
  actual: BuySellExecutionFixtureExpectation;
}

function csv(rows: string[]): string {
  return rows.join("\n");
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildBuySellExecutionFixtureMatrix(): BuySellExecutionFixtureCase[] {
  return [
    {
      id: "long_win",
      label: "Long winner closes flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,LWIN,Buy,100,10.00",
        "2026-05-01,10:00:00,LWIN,Sell,100,11.00",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 100,
        groupedTrades: [
          {
            symbol: "LWIN",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 100,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "long_loss",
      label: "Long loser closes flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,LLOS,Buy,100,10.00",
        "2026-05-01,10:00:00,LLOS,Sell,100,9.25",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: -75,
        groupedTrades: [
          {
            symbol: "LLOS",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: -75,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "short_win",
      label: "Short winner closes flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SWIN,Sell,100,10.00",
        "2026-05-01,10:00:00,SWIN,Buy,100,9.20",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 80,
        groupedTrades: [
          {
            symbol: "SWIN",
            tradeDirection: "short",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 80,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "short_loss",
      label: "Short loser closes flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SLOS,Sell,100,10.00",
        "2026-05-01,10:00:00,SLOS,Buy,100,10.60",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: -60,
        groupedTrades: [
          {
            symbol: "SLOS",
            tradeDirection: "short",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: -60,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "partial_exit",
      label: "Long partial exits close flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,PART,Buy,100,10.00",
        "2026-05-01,09:45:00,PART,Sell,40,10.50",
        "2026-05-01,10:00:00,PART,Sell,60,11.00",
      ]),
      expected: {
        acceptedExecutionCount: 3,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 80,
        groupedTrades: [
          {
            symbol: "PART",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 80,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "over_reduction",
      label: "Over-reduction splits into new short remainder",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,OVER,Buy,100,10.00",
        "2026-05-01,10:00:00,OVER,Sell,150,10.50",
        "2026-05-01,10:15:00,OVER,Buy,50,10.25",
      ]),
      expected: {
        acceptedExecutionCount: 3,
        rejectedRowCount: 0,
        groupedTradeCount: 2,
        confidenceStatus: "needs_review",
        totalGrossRealizedPnl: 62.5,
        groupedTrades: [
          {
            symbol: "OVER",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "over_reduction_split",
            finalPositionShares: 0,
            grossRealizedPnl: 50,
            needsReview: true,
          },
          {
            symbol: "OVER",
            tradeDirection: "short",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 12.5,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "same_symbol_split",
      label: "Same symbol two flat trades stay separated",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SAME,Buy,100,10.00",
        "2026-05-01,10:00:00,SAME,Sell,100,10.50",
        "2026-05-01,11:00:00,SAME,Buy,50,11.00",
        "2026-05-01,11:30:00,SAME,Sell,50,11.40",
      ]),
      expected: {
        acceptedExecutionCount: 4,
        rejectedRowCount: 0,
        groupedTradeCount: 2,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 70,
        groupedTrades: [
          {
            symbol: "SAME",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 50,
            needsReview: false,
          },
          {
            symbol: "SAME",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 20,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "open_position",
      label: "Open leftover is review-only",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,OPEN,Buy,100,10.00",
        "2026-05-01,10:00:00,OPEN,Sell,25,10.50",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "needs_review",
        totalGrossRealizedPnl: 12.5,
        groupedTrades: [
          {
            symbol: "OPEN",
            tradeDirection: "long",
            lifecycleStatus: "open",
            groupingReason: "end_of_symbol",
            finalPositionShares: 75,
            grossRealizedPnl: 12.5,
            needsReview: true,
          },
        ],
      },
    },
    {
      id: "rejected_row",
      label: "Rejected row blocks confidence",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,,Buy,100,10.00",
        "2026-05-01,10:00:00,REJ,Sell,100,10.50",
      ]),
      expected: {
        acceptedExecutionCount: 1,
        rejectedRowCount: 1,
        groupedTradeCount: 1,
        confidenceStatus: "blocked",
        totalGrossRealizedPnl: 0,
        requiredIssueCodes: ["row_missing_symbol"],
        groupedTrades: [
          {
            symbol: "REJ",
            tradeDirection: "short",
            lifecycleStatus: "open",
            groupingReason: "end_of_symbol",
            finalPositionShares: 100,
            grossRealizedPnl: 0,
            needsReview: true,
          },
        ],
      },
    },
    {
      id: "fees_net_amount",
      label: "Fees and broker net remain reconciliation context",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,FEE,Buy,100,10.00,1.25,0.08,-1001.33,USD",
        "2026-05-01,10:00:00,FEE,Sell,100,10.50,1.25,0.10,1048.65,USD",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 50,
        costVisibility: {
          totalCosts: 2.68,
          brokerNetAmountTotal: 47.32,
          grossMinusKnownCosts: 47.32,
        },
        groupedTrades: [
          {
            symbol: "FEE",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 50,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "duplicate_like_fill_cluster",
      label: "Duplicate-like fill cluster stays review-visible",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,DUPL,Buy,100,10.00",
        "2026-05-01,09:30:00,DUPL,Buy,100,10.00",
        "2026-05-01,10:00:00,DUPL,Sell,200,10.50",
      ]),
      expected: {
        acceptedExecutionCount: 3,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 100,
        requiredAnomalyTypes: ["duplicate_like_fill"],
        anomalyCounts: {
          totalCount: 1,
          urgentCount: 0,
          reviewCount: 1,
        },
        groupedTrades: [
          {
            symbol: "DUPL",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 100,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "same_timestamp_scalp_cluster",
      label: "Same-timestamp fill batching is visible without blocking",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,BTCH,Buy,40,10.00",
        "2026-05-01,09:30:00,BTCH,Buy,30,10.02",
        "2026-05-01,09:30:00,BTCH,Buy,30,10.04",
        "2026-05-01,10:00:00,BTCH,Sell,100,10.50",
      ]),
      expected: {
        acceptedExecutionCount: 4,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 48.2,
        requiredAnomalyTypes: ["same_timestamp_cluster"],
        anomalyCounts: {
          totalCount: 1,
          urgentCount: 0,
          reviewCount: 0,
        },
        groupedTrades: [
          {
            symbol: "BTCH",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 48.2,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "huge_size_jump",
      label: "Large size jump stays advanced-only when trade closes flat",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,JUMP,Buy,25,10.00",
        "2026-05-01,09:45:00,JUMP,Buy,100,9.90",
        "2026-05-01,10:00:00,JUMP,Sell,125,10.10",
      ]),
      expected: {
        acceptedExecutionCount: 3,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 22.5,
        requiredAnomalyTypes: ["huge_size_jump"],
        anomalyCounts: {
          totalCount: 1,
          urgentCount: 0,
          reviewCount: 0,
        },
        groupedTrades: [
          {
            symbol: "JUMP",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 22.5,
            needsReview: false,
          },
        ],
      },
    },
    {
      id: "fees_larger_than_trade_value",
      label: "Impossible fee rows are urgent execution anomalies",
      broker: "generic_execution_csv",
      csvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price,Commission,Fees,Amount,Currency",
        "2026-05-01,09:30:00,BADF,Buy,1,1.00,2.00,0.50,-3.50,USD",
        "2026-05-01,10:00:00,BADF,Sell,1,1.20,2.00,0.50,-1.30,USD",
      ]),
      expected: {
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        groupedTradeCount: 1,
        confidenceStatus: "ready",
        totalGrossRealizedPnl: 0.2,
        costVisibility: {
          totalCosts: 5,
          brokerNetAmountTotal: -4.8,
          grossMinusKnownCosts: -4.8,
        },
        requiredAnomalyTypes: ["fees_larger_than_trade_value"],
        anomalyCounts: {
          totalCount: 2,
          urgentCount: 2,
          reviewCount: 0,
        },
        groupedTrades: [
          {
            symbol: "BADF",
            tradeDirection: "long",
            lifecycleStatus: "closed",
            groupingReason: "flat_position",
            finalPositionShares: 0,
            grossRealizedPnl: 0.2,
            needsReview: false,
          },
        ],
      },
    },
  ];
}

function compareNumber(
  failures: string[],
  label: string,
  actual: number | null,
  expected: number | null,
) {
  if (actual === null || expected === null) {
    if (actual !== expected) {
      failures.push(`${label}: expected ${expected}, got ${actual}`);
    }

    return;
  }

  if (roundMoney(actual) !== roundMoney(expected)) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function buildActual(
  fixture: BuySellExecutionFixtureCase,
): BuySellExecutionFixtureExpectation {
  const experience = buildCsvDryRunImportExperience({
    broker: fixture.broker,
    csvText: fixture.csvText,
  });
  const feedbackByIndex = new Map(
    experience.executionFeedbackPreview.items.map((item) => [
      item.requestIndex,
      item,
    ]),
  );
  const totalGrossValues = experience.executionFeedbackPreview.items
    .map((item) => item.grossRealizedPnl)
    .filter((value): value is number => value !== null);
  const costItem = experience.costVisibility.items[0];
  const anomalyTypes = experience.executionAnomalyDetector.items.map(
    (item) => item.type,
  );

  return {
    acceptedExecutionCount: experience.preview.importResult.acceptedExecutionCount,
    rejectedRowCount: experience.preview.importResult.rejectedRowCount,
    groupedTradeCount: experience.tradeGroupingReview.totalCount,
    confidenceStatus: experience.confidenceGate.status,
    totalGrossRealizedPnl:
      totalGrossValues.length > 0
        ? roundMoney(totalGrossValues.reduce((total, value) => total + value, 0))
        : null,
    requiredIssueCodes: experience.preview.importResult.issues.map(
      (issue) => issue.code,
    ),
    requiredAnomalyTypes: anomalyTypes,
    anomalyCounts: {
      totalCount: experience.executionAnomalyDetector.totalCount,
      urgentCount: experience.executionAnomalyDetector.urgentCount,
      reviewCount: experience.executionAnomalyDetector.reviewCount,
    },
    costVisibility: costItem
      ? {
          totalCosts: costItem.totalCosts,
          brokerNetAmountTotal: costItem.brokerNetAmountTotal,
          grossMinusKnownCosts: costItem.grossMinusKnownCosts,
        }
      : undefined,
    groupedTrades: experience.tradeGroupingReview.items.map((item) => ({
      symbol: item.symbol,
      tradeDirection: item.tradeDirection as "long" | "short",
      lifecycleStatus: item.lifecycleStatus,
      groupingReason: item.groupingReason,
      finalPositionShares: item.finalPositionShares,
      grossRealizedPnl: feedbackByIndex.get(item.requestIndex)?.grossRealizedPnl ?? null,
      needsReview: item.needsReview,
    })),
  };
}

export function runBuySellExecutionFixtureMatrix(): BuySellExecutionFixtureResult[] {
  return buildBuySellExecutionFixtureMatrix().map((fixture) => {
    const actual = buildActual(fixture);
    const failedExpectations: string[] = [];

    if (actual.acceptedExecutionCount !== fixture.expected.acceptedExecutionCount) {
      failedExpectations.push(
        `acceptedExecutionCount: expected ${fixture.expected.acceptedExecutionCount}, got ${actual.acceptedExecutionCount}`,
      );
    }
    if (actual.rejectedRowCount !== fixture.expected.rejectedRowCount) {
      failedExpectations.push(
        `rejectedRowCount: expected ${fixture.expected.rejectedRowCount}, got ${actual.rejectedRowCount}`,
      );
    }
    if (actual.groupedTradeCount !== fixture.expected.groupedTradeCount) {
      failedExpectations.push(
        `groupedTradeCount: expected ${fixture.expected.groupedTradeCount}, got ${actual.groupedTradeCount}`,
      );
    }
    if (actual.confidenceStatus !== fixture.expected.confidenceStatus) {
      failedExpectations.push(
        `confidenceStatus: expected ${fixture.expected.confidenceStatus}, got ${actual.confidenceStatus}`,
      );
    }
    compareNumber(
      failedExpectations,
      "totalGrossRealizedPnl",
      actual.totalGrossRealizedPnl,
      fixture.expected.totalGrossRealizedPnl,
    );

    fixture.expected.groupedTrades.forEach((expectedTrade, index) => {
      const actualTrade = actual.groupedTrades[index];

      if (!actualTrade) {
        failedExpectations.push(`groupedTrades[${index}]: missing`);
        return;
      }

      for (const key of [
        "symbol",
        "tradeDirection",
        "lifecycleStatus",
        "groupingReason",
        "finalPositionShares",
        "needsReview",
      ] as const) {
        if (actualTrade[key] !== expectedTrade[key]) {
          failedExpectations.push(
            `groupedTrades[${index}].${key}: expected ${expectedTrade[key]}, got ${actualTrade[key]}`,
          );
        }
      }
      compareNumber(
        failedExpectations,
        `groupedTrades[${index}].grossRealizedPnl`,
        actualTrade.grossRealizedPnl,
        expectedTrade.grossRealizedPnl,
      );
    });

    if (fixture.expected.costVisibility) {
      if (!actual.costVisibility) {
        failedExpectations.push("costVisibility: missing");
      } else {
        compareNumber(
          failedExpectations,
          "costVisibility.totalCosts",
          actual.costVisibility.totalCosts,
          fixture.expected.costVisibility.totalCosts,
        );
        compareNumber(
          failedExpectations,
          "costVisibility.brokerNetAmountTotal",
          actual.costVisibility.brokerNetAmountTotal,
          fixture.expected.costVisibility.brokerNetAmountTotal,
        );
        compareNumber(
          failedExpectations,
          "costVisibility.grossMinusKnownCosts",
          actual.costVisibility.grossMinusKnownCosts,
          fixture.expected.costVisibility.grossMinusKnownCosts,
        );
      }
    }

    for (const issueCode of fixture.expected.requiredIssueCodes ?? []) {
      if (!(actual.requiredIssueCodes ?? []).includes(issueCode)) {
        failedExpectations.push(`requiredIssueCode missing: ${issueCode}`);
      }
    }

    for (const anomalyType of fixture.expected.requiredAnomalyTypes ?? []) {
      if (!(actual.requiredAnomalyTypes ?? []).includes(anomalyType)) {
        failedExpectations.push(`requiredAnomalyType missing: ${anomalyType}`);
      }
    }

    if (fixture.expected.anomalyCounts) {
      for (const key of [
        "totalCount",
        "urgentCount",
        "reviewCount",
      ] as const) {
        if (actual.anomalyCounts?.[key] !== fixture.expected.anomalyCounts[key]) {
          failedExpectations.push(
            `anomalyCounts.${key}: expected ${fixture.expected.anomalyCounts[key]}, got ${actual.anomalyCounts?.[key]}`,
          );
        }
      }
    }

    return {
      id: fixture.id,
      label: fixture.label,
      status: failedExpectations.length === 0 ? "pass" : "fail",
      failedExpectations,
      actual,
    };
  });
}
