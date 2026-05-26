import { buildCsvDryRunImportExperience } from "./csv-dry-run-workflow";
import {
  buildImportCommitPlan,
  type ImportCommitPlannerAcknowledgements,
} from "./import-commit/import-commit-planner";
import { InMemoryImportCommitRepository } from "./import-commit/in-memory-import-commit-repository";
import type { BrokerExecutionCsvFormat } from "../../execution-sources/csv";
import type { CsvDryRunAnomalyType } from "./types";

export type BrokerCsvRepairSaveFixtureId =
  | "mixed_dates_fees_partial_exit"
  | "odd_headers_bot_sld_partial_fills"
  | "sell_short_buy_to_cover_closed"
  | "zero_and_blank_quantities_repaired_to_save"
  | "missing_symbol_repaired_to_save"
  | "missing_quantity_repaired_to_save"
  | "non_filled_rows_safely_skipped"
  | "short_open_position_review_gate"
  | "duplicate_like_fill_acknowledged_save";

export interface BrokerCsvRepairSaveFixtureExpectation {
  initialStatus: "ready" | "needs_review" | "blocked";
  initialAcceptedExecutionCount: number;
  initialRejectedRowCount: number;
  initialSkippedRowCount: number;
  finalAcceptedExecutionCount: number;
  finalRejectedRowCount: number;
  finalSkippedRowCount: number;
  finalGroupedTradeCount: number;
  finalCommitStatus: "ready_to_commit" | "needs_user_review" | "blocked";
  committedTradeCount: number;
  savedTradeSymbols: string[];
  savedTradeDirections: Array<"long" | "short">;
  savedTradeLifecycleStatuses: Array<"closed" | "open">;
  requiredInitialIssueCodes?: string[];
  requiredFinalIssueCodes?: string[];
  requiredAnomalyTypes?: CsvDryRunAnomalyType[];
}

export interface BrokerCsvRepairSaveFixtureCase {
  id: BrokerCsvRepairSaveFixtureId;
  label: string;
  broker: BrokerExecutionCsvFormat;
  rawCsvText: string;
  repairedCsvText?: string;
  acknowledgements: ImportCommitPlannerAcknowledgements;
  expected: BrokerCsvRepairSaveFixtureExpectation;
}

export interface BrokerCsvRepairSaveFixtureResult {
  id: BrokerCsvRepairSaveFixtureId;
  label: string;
  status: "pass" | "fail";
  failedExpectations: string[];
  actual: BrokerCsvRepairSaveFixtureExpectation;
}

const ids = {
  workspaceId: "workspace-repair-save-fixture",
  userId: "user-repair-save-fixture",
  accountId: "account-repair-save-fixture",
};

function csv(rows: string[]): string {
  return rows.join("\n");
}

export function buildBrokerCsvRepairSaveFixtureMatrix(): BrokerCsvRepairSaveFixtureCase[] {
  return [
    {
      id: "mixed_dates_fees_partial_exit",
      label: "Mixed date formats, split fee columns, and partial exits save cleanly",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price,Commission,SEC Fee,TAF Fee,Net Amount,Currency",
        "05/01/2026,09:30:00,MIXD,Buy,100,$10.00,$1.00,$0.02,$0.01,-1001.03,USD",
        "2026-05-01,09:45:00,MIXD,Sell,40,10.50,1.00,0.02,0.01,418.97,USD",
        "2026/05/01,10:00:00,MIXD,Sell,60,11.00,1.00,0.02,0.01,658.97,USD",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "ready",
        initialAcceptedExecutionCount: 3,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 3,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["MIXD"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
      },
    },
    {
      id: "odd_headers_bot_sld_partial_fills",
      label: "Odd generic headers, BOT/SLD aliases, partial fills, and cost columns save cleanly",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Ticker,Executed At,Action,Qty,Fill Price,Status,Commission,Fees,Net Amount",
        "ALTX,05/01/2026 09:30:00 AM,BOT,50,$10.00,Filled,$0.50,$0.02,-500.52",
        "ALTX,2026-05-01 09:32:00,BOT,50,10.10,Filled,0.50,0.02,-505.52",
        "ALTX,2026-05-01 09:50:00,SLD,40,10.40,Filled,0.50,0.02,415.48",
        "ALTX,2026-05-01 10:05:00,SLD,60,10.70,Filled,0.50,0.02,641.48",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "ready",
        initialAcceptedExecutionCount: 4,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 4,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["ALTX"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
      },
    },
    {
      id: "sell_short_buy_to_cover_closed",
      label: "SELL SHORT and BUY TO COVER side aliases reconstruct a closed short",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Ticker,Action,Shares,Average Fill Price",
        "2026-05-01,09:30:00,CVRS,SELL SHORT,100,20.00",
        "2026-05-01,09:45:00,CVRS,BUY TO COVER,40,19.40",
        "2026-05-01,10:15:00,CVRS,BUY TO COVER,60,19.10",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "ready",
        initialAcceptedExecutionCount: 3,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 3,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["CVRS"],
        savedTradeDirections: ["short"],
        savedTradeLifecycleStatuses: ["closed"],
      },
    },
    {
      id: "zero_and_blank_quantities_repaired_to_save",
      label: "Zero and blank quantities are blocked, then save after repaired quantity values",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ZBQT,Buy,0,10.00",
        "2026-05-01,09:32:00,ZBQT,Buy,,10.10",
        "2026-05-01,10:00:00,ZBQT,Sell,200,10.50",
      ]),
      repairedCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ZBQT,Buy,100,10.00",
        "2026-05-01,09:32:00,ZBQT,Buy,100,10.10",
        "2026-05-01,10:00:00,ZBQT,Sell,200,10.50",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "blocked",
        initialAcceptedExecutionCount: 1,
        initialRejectedRowCount: 2,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 3,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["ZBQT"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
        requiredInitialIssueCodes: ["row_invalid_quantity", "row_missing_quantity"],
      },
    },
    {
      id: "missing_symbol_repaired_to_save",
      label: "Missing symbol row becomes a saved trade after repair",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,,Buy,100,10.00",
        "2026-05-01,09:35:00,MSRP,Sell,100,10.75",
      ]),
      repairedCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,MSRP,Buy,100,10.00",
        "2026-05-01,09:35:00,MSRP,Sell,100,10.75",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "blocked",
        initialAcceptedExecutionCount: 1,
        initialRejectedRowCount: 1,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 2,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["MSRP"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
        requiredInitialIssueCodes: ["row_missing_symbol"],
      },
    },
    {
      id: "missing_quantity_repaired_to_save",
      label: "Missing quantity row becomes a saved trade after repair",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,MQTY,Buy,,10.00",
        "2026-05-01,09:35:00,MQTY,Sell,100,10.75",
      ]),
      repairedCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,MQTY,Buy,100,10.00",
        "2026-05-01,09:35:00,MQTY,Sell,100,10.75",
      ]),
      acknowledgements: {
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "blocked",
        initialAcceptedExecutionCount: 1,
        initialRejectedRowCount: 1,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 2,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["MQTY"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
        requiredInitialIssueCodes: ["row_missing_quantity"],
      },
    },
    {
      id: "non_filled_rows_safely_skipped",
      label: "Cancelled and expired orders are skipped while fills save",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price,Status",
        "2026-05-01,09:29:00,SKIP,Buy,100,9.90,Cancelled",
        "2026-05-01,09:30:00,SKIP,Buy,100,10.00,Filled",
        "2026-05-01,09:45:00,SKIP,Sell,100,10.50,Filled",
        "2026-05-01,10:00:00,SKIP,Sell,100,10.55,Expired",
      ]),
      acknowledgements: {
        anomalyTypes: ["skipped_non_filled_order"],
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "ready",
        initialAcceptedExecutionCount: 2,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 2,
        finalAcceptedExecutionCount: 2,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 2,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["SKIP"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
        requiredFinalIssueCodes: ["non_filled_order_skipped"],
        requiredAnomalyTypes: ["skipped_non_filled_order"],
      },
    },
    {
      id: "short_open_position_review_gate",
      label: "Short import with leftover position stays review-gated until acknowledged",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,SOPN,Sell Short,100,10.00",
        "2026-05-01,10:00:00,SOPN,Buy to Cover,25,9.50",
      ]),
      acknowledgements: {
        anomalyTypes: ["open_leftover"],
        groupingReview: true,
        mappingReview: true,
        openPositions: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "needs_review",
        initialAcceptedExecutionCount: 2,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 2,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["SOPN"],
        savedTradeDirections: ["short"],
        savedTradeLifecycleStatuses: ["open"],
        requiredAnomalyTypes: ["open_leftover"],
      },
    },
    {
      id: "duplicate_like_fill_acknowledged_save",
      label: "Duplicate-like fill review can be acknowledged and saved",
      broker: "generic_execution_csv",
      rawCsvText: csv([
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,DLFA,Buy,100,10.00",
        "2026-05-01,09:30:00,DLFA,Buy,100,10.00",
        "2026-05-01,10:00:00,DLFA,Sell,200,10.50",
      ]),
      acknowledgements: {
        anomalyTypes: ["duplicate_like_fill"],
        mappingReview: true,
        pnlReview: true,
      },
      expected: {
        initialStatus: "ready",
        initialAcceptedExecutionCount: 3,
        initialRejectedRowCount: 0,
        initialSkippedRowCount: 0,
        finalAcceptedExecutionCount: 3,
        finalRejectedRowCount: 0,
        finalSkippedRowCount: 0,
        finalGroupedTradeCount: 1,
        finalCommitStatus: "ready_to_commit",
        committedTradeCount: 1,
        savedTradeSymbols: ["DLFA"],
        savedTradeDirections: ["long"],
        savedTradeLifecycleStatuses: ["closed"],
        requiredAnomalyTypes: ["duplicate_like_fill"],
      },
    },
  ];
}

function buildCommitPlan(args: {
  fixture: BrokerCsvRepairSaveFixtureCase;
  csvText: string;
}) {
  return buildImportCommitPlan({
    ...ids,
    experience: buildCsvDryRunImportExperience({
      broker: args.fixture.broker,
      csvText: args.csvText,
    }),
    generatedAt: "2026-05-08T18:00:00.000Z",
    acknowledgements: args.fixture.acknowledgements,
  });
}

function buildActual(
  fixture: BrokerCsvRepairSaveFixtureCase,
): BrokerCsvRepairSaveFixtureExpectation {
  const initial = buildCsvDryRunImportExperience({
    broker: fixture.broker,
    csvText: fixture.rawCsvText,
  });
  const finalCsvText = fixture.repairedCsvText ?? fixture.rawCsvText;
  const final = buildCsvDryRunImportExperience({
    broker: fixture.broker,
    csvText: finalCsvText,
  });
  const plan = buildCommitPlan({ fixture, csvText: finalCsvText });
  const repository = new InMemoryImportCommitRepository();
  const commit = repository.commitImportPlan(plan);
  const savedTrades = repository.listSavedTrades(ids.accountId);

  return {
    initialStatus: initial.confidenceGate.status,
    initialAcceptedExecutionCount: initial.preview.importResult.acceptedExecutionCount,
    initialRejectedRowCount: initial.preview.importResult.rejectedRowCount,
    initialSkippedRowCount: initial.preview.importResult.skippedRowCount,
    finalAcceptedExecutionCount: final.preview.importResult.acceptedExecutionCount,
    finalRejectedRowCount: final.preview.importResult.rejectedRowCount,
    finalSkippedRowCount: final.preview.importResult.skippedRowCount,
    finalGroupedTradeCount: final.tradeGroupingReview.totalCount,
    finalCommitStatus: plan.status,
    committedTradeCount:
      commit.status === "committed" ? repository.listSavedTrades(ids.accountId).length : 0,
    savedTradeSymbols: savedTrades.map((trade) => trade.symbol),
    savedTradeDirections: savedTrades.map(
      (trade) => trade.tradeDirection as "long" | "short",
    ),
    savedTradeLifecycleStatuses: savedTrades.map((trade) => trade.lifecycleStatus),
    requiredInitialIssueCodes: initial.preview.importResult.issues.map(
      (issue) => issue.code,
    ),
    requiredFinalIssueCodes: final.preview.importResult.issues.map(
      (issue) => issue.code,
    ),
    requiredAnomalyTypes: final.executionAnomalyDetector.items.map(
      (item) => item.type,
    ),
  };
}

function compareArray<T>(
  failures: string[],
  label: string,
  actual: T[],
  expected: T[],
) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function runBrokerCsvRepairSaveFixtureMatrix(): BrokerCsvRepairSaveFixtureResult[] {
  return buildBrokerCsvRepairSaveFixtureMatrix().map((fixture) => {
    const actual = buildActual(fixture);
    const failedExpectations: string[] = [];

    for (const key of [
      "initialStatus",
      "initialAcceptedExecutionCount",
      "initialRejectedRowCount",
      "initialSkippedRowCount",
      "finalAcceptedExecutionCount",
      "finalRejectedRowCount",
      "finalSkippedRowCount",
      "finalGroupedTradeCount",
      "finalCommitStatus",
      "committedTradeCount",
    ] as const) {
      if (actual[key] !== fixture.expected[key]) {
        failedExpectations.push(
          `${key}: expected ${fixture.expected[key]}, got ${actual[key]}`,
        );
      }
    }

    compareArray(
      failedExpectations,
      "savedTradeSymbols",
      actual.savedTradeSymbols,
      fixture.expected.savedTradeSymbols,
    );
    compareArray(
      failedExpectations,
      "savedTradeDirections",
      actual.savedTradeDirections,
      fixture.expected.savedTradeDirections,
    );
    compareArray(
      failedExpectations,
      "savedTradeLifecycleStatuses",
      actual.savedTradeLifecycleStatuses,
      fixture.expected.savedTradeLifecycleStatuses,
    );

    for (const issueCode of fixture.expected.requiredInitialIssueCodes ?? []) {
      if (!(actual.requiredInitialIssueCodes ?? []).includes(issueCode)) {
        failedExpectations.push(`initial issue missing: ${issueCode}`);
      }
    }

    for (const issueCode of fixture.expected.requiredFinalIssueCodes ?? []) {
      if (!(actual.requiredFinalIssueCodes ?? []).includes(issueCode)) {
        failedExpectations.push(`final issue missing: ${issueCode}`);
      }
    }

    for (const anomalyType of fixture.expected.requiredAnomalyTypes ?? []) {
      if (!(actual.requiredAnomalyTypes ?? []).includes(anomalyType)) {
        failedExpectations.push(`anomaly missing: ${anomalyType}`);
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
