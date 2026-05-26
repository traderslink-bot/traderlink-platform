import {
  applyCsvDryRunCellEdit,
  buildCsvDryRunImportExperience,
  getCsvDryRunSamplePresets,
} from "./csv-dry-run-workflow";
import type {
  CsvDryRunAnomalyType,
  CsvDryRunImportExperience,
  CsvDryRunRepairImpactSnapshot,
  CsvDryRunReviewQueueLane,
  CsvDryRunSetupTagKind,
} from "./types";
import type {
  BrokerExecutionCsvFormat,
  BrokerExecutionCsvImportIssueCode,
} from "../../execution-sources/csv";

export type CsvDryRunAutomatedQaStatus = "pass" | "fail";

export interface CsvDryRunAutomatedQaExpectedOutcome {
  readinessStatus?: CsvDryRunImportExperience["importSessionSummary"]["status"];
  acceptedExecutionCount?: number;
  rejectedRowCount?: number;
  skippedRowCount?: number;
  groupedTradeCount?: number;
  brokerSupportConfidence?: CsvDryRunImportExperience["brokerCoverage"]["confidence"];
  learningUrgency?: CsvDryRunImportExperience["brokerMappingLearningConsole"]["learningUrgency"];
  issueCodes?: BrokerExecutionCsvImportIssueCode[];
  reviewQueueLanes?: CsvDryRunReviewQueueLane[];
  anomalyTypes?: CsvDryRunAnomalyType[];
}

export interface CsvDryRunAutomatedQaActualOutcome {
  readinessStatus: CsvDryRunImportExperience["importSessionSummary"]["status"];
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  groupedTradeCount: number;
  brokerSupportConfidence: CsvDryRunImportExperience["brokerCoverage"]["confidence"];
  learningUrgency: CsvDryRunImportExperience["brokerMappingLearningConsole"]["learningUrgency"];
  issueCodes: BrokerExecutionCsvImportIssueCode[];
  reviewQueueLanes: CsvDryRunReviewQueueLane[];
  anomalyTypes: CsvDryRunAnomalyType[];
}

export interface CsvDryRunMutationQaCase {
  id: string;
  label: string;
  sourcePresetId: string;
  broker: BrokerExecutionCsvFormat;
  csvText: string;
  mutationKind:
    | "missing_symbol"
    | "missing_price"
    | "renamed_headers"
    | "blank_rows"
    | "account_activity_row"
    | "cancelled_order"
    | "duplicated_fill"
    | "open_position"
    | "weird_timestamp";
  expected: CsvDryRunAutomatedQaExpectedOutcome;
}

export interface CsvDryRunMutationQaResult {
  id: string;
  label: string;
  mutationKind: CsvDryRunMutationQaCase["mutationKind"];
  status: CsvDryRunAutomatedQaStatus;
  actual: CsvDryRunAutomatedQaActualOutcome;
  failedExpectations: string[];
}

export interface CsvDryRunBrokerRegressionCase {
  presetId: string;
  broker: BrokerExecutionCsvFormat;
  label: string;
  expected: CsvDryRunAutomatedQaExpectedOutcome;
}

export interface CsvDryRunBrokerRegressionResult {
  presetId: string;
  label: string;
  broker: BrokerExecutionCsvFormat;
  status: CsvDryRunAutomatedQaStatus;
  actual: CsvDryRunAutomatedQaActualOutcome;
  failedExpectations: string[];
}

export interface CsvDryRunRepairImpactSimulationResult {
  status: CsvDryRunAutomatedQaStatus;
  before: CsvDryRunAutomatedQaActualOutcome;
  after: CsvDryRunAutomatedQaActualOutcome;
  baseline: CsvDryRunRepairImpactSnapshot;
  acceptedExecutionDelta: number;
  rejectedRowDelta: number;
  confidenceScoreDelta: number;
  failedExpectations: string[];
}

export interface CsvDryRunEndToEndWorkflowSimulation {
  status: CsvDryRunAutomatedQaStatus;
  steps: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  finalExperience: CsvDryRunImportExperience;
}

export interface CsvDryRunRouteSmokeContract {
  routePath: "/intelligence/import-dry-run";
  sourcePath: "app/intelligence/import-dry-run/import-dry-run-client.tsx";
  requiredPanelLabels: string[];
  bannedSurfacePhrases: string[];
}

export interface CsvDryRunVisualRegressionTarget {
  id: string;
  routePath: "/intelligence/import-dry-run";
  viewport: "desktop" | "tablet" | "mobile";
  width: number;
  height: number;
  requiredPanelLabels: string[];
  layoutExpectation: string;
}

export interface CsvDryRunVisualRegressionContract {
  routePath: "/intelligence/import-dry-run";
  screenshotDependency: "playwright_chromium";
  targets: CsvDryRunVisualRegressionTarget[];
  bannedSurfacePhrases: string[];
}

export interface CsvDryRunAutomatedQaHarness {
  mutationCases: CsvDryRunMutationQaCase[];
  mutationResults: CsvDryRunMutationQaResult[];
  brokerRegressionCases: CsvDryRunBrokerRegressionCase[];
  brokerRegressionResults: CsvDryRunBrokerRegressionResult[];
  repairImpactSimulation: CsvDryRunRepairImpactSimulationResult;
  endToEndSimulation: CsvDryRunEndToEndWorkflowSimulation;
  routeSmokeContract: CsvDryRunRouteSmokeContract;
  visualRegressionContract: CsvDryRunVisualRegressionContract;
  marketContextUsed: false;
}

function preset(id: string) {
  const found = getCsvDryRunSamplePresets().find(
    (candidate) => candidate.id === id,
  );

  if (!found) {
    throw new Error(`Missing dry-run preset: ${id}`);
  }

  return found;
}

function outcome(experience: CsvDryRunImportExperience): CsvDryRunAutomatedQaActualOutcome {
  return {
    readinessStatus: experience.importSessionSummary.status,
    acceptedExecutionCount: experience.preview.importResult.acceptedExecutionCount,
    rejectedRowCount: experience.preview.importResult.rejectedRowCount,
    skippedRowCount: experience.preview.importResult.skippedRowCount,
    groupedTradeCount: experience.tradeGroupingReview.totalCount,
    brokerSupportConfidence: experience.brokerCoverage.confidence,
    learningUrgency: experience.brokerMappingLearningConsole.learningUrgency,
    issueCodes: experience.preview.importResult.issues.map((issue) => issue.code),
    reviewQueueLanes: [
      ...new Set(
        experience.postImportReviewQueuePreview.items.map((item) => item.lane),
      ),
    ],
    anomalyTypes: [
      ...new Set(experience.executionAnomalyDetector.items.map((item) => item.type)),
    ],
  };
}

function includesAll<T>(actual: T[], expected: T[] | undefined): boolean {
  return (expected ?? []).every((item) => actual.includes(item));
}

function compareOutcome(
  actual: CsvDryRunAutomatedQaActualOutcome,
  expected: CsvDryRunAutomatedQaExpectedOutcome,
): string[] {
  const failures: string[] = [];

  if (
    expected.readinessStatus &&
    actual.readinessStatus !== expected.readinessStatus
  ) {
    failures.push(`Expected readiness ${expected.readinessStatus}, got ${actual.readinessStatus}.`);
  }

  if (
    expected.acceptedExecutionCount !== undefined &&
    actual.acceptedExecutionCount !== expected.acceptedExecutionCount
  ) {
    failures.push(`Expected ${expected.acceptedExecutionCount} accepted executions, got ${actual.acceptedExecutionCount}.`);
  }

  if (
    expected.rejectedRowCount !== undefined &&
    actual.rejectedRowCount !== expected.rejectedRowCount
  ) {
    failures.push(`Expected ${expected.rejectedRowCount} rejected rows, got ${actual.rejectedRowCount}.`);
  }

  if (
    expected.skippedRowCount !== undefined &&
    actual.skippedRowCount !== expected.skippedRowCount
  ) {
    failures.push(`Expected ${expected.skippedRowCount} skipped rows, got ${actual.skippedRowCount}.`);
  }

  if (
    expected.groupedTradeCount !== undefined &&
    actual.groupedTradeCount !== expected.groupedTradeCount
  ) {
    failures.push(`Expected ${expected.groupedTradeCount} grouped trades, got ${actual.groupedTradeCount}.`);
  }

  if (
    expected.brokerSupportConfidence &&
    actual.brokerSupportConfidence !== expected.brokerSupportConfidence
  ) {
    failures.push(`Expected broker confidence ${expected.brokerSupportConfidence}, got ${actual.brokerSupportConfidence}.`);
  }

  if (
    expected.learningUrgency &&
    actual.learningUrgency !== expected.learningUrgency
  ) {
    failures.push(`Expected learning urgency ${expected.learningUrgency}, got ${actual.learningUrgency}.`);
  }

  if (!includesAll(actual.issueCodes, expected.issueCodes)) {
    failures.push(`Missing expected issue codes: ${(expected.issueCodes ?? []).join(", ")}.`);
  }

  if (!includesAll(actual.reviewQueueLanes, expected.reviewQueueLanes)) {
    failures.push(`Missing expected review queue lanes: ${(expected.reviewQueueLanes ?? []).join(", ")}.`);
  }

  if (!includesAll(actual.anomalyTypes, expected.anomalyTypes)) {
    failures.push(`Missing expected anomaly types: ${(expected.anomalyTypes ?? []).join(", ")}.`);
  }

  return failures;
}

function runExperience(args: {
  csvText: string;
  broker: BrokerExecutionCsvFormat;
  setupTagSelections?: Record<number, CsvDryRunSetupTagKind>;
  repairImpactBaseline?: CsvDryRunRepairImpactSnapshot | null;
}) {
  return buildCsvDryRunImportExperience({
    csvText: args.csvText,
    broker: args.broker,
    repairImpactBaseline: args.repairImpactBaseline,
    setupTagSelections: args.setupTagSelections,
  });
}

export function buildCsvDryRunMutationQaCases(): CsvDryRunMutationQaCase[] {
  const ibkr = preset("preset:ibkr");
  const genericShort = preset("preset:generic-short");
  const openPosition = preset("preset:open-position");
  const webull = preset("preset:webull");
  const schwab = preset("preset:schwab");
  const unknown = preset("preset:unknown-mapping");
  const rowRepair = preset("preset:row-repair");

  return [
    {
      id: "mutation:missing-symbol",
      label: "Missing symbol row",
      sourcePresetId: rowRepair.id,
      broker: rowRepair.broker,
      csvText: rowRepair.csvText,
      mutationKind: "missing_symbol",
      expected: {
        readinessStatus: "blocked",
        acceptedExecutionCount: 1,
        rejectedRowCount: 1,
        issueCodes: ["row_missing_symbol"],
        reviewQueueLanes: ["repair", "grouping", "anomaly"],
        anomalyTypes: ["open_leftover"],
        learningUrgency: "low",
      },
    },
    {
      id: "mutation:missing-price",
      label: "Missing price row",
      sourcePresetId: genericShort.id,
      broker: genericShort.broker,
      csvText: genericShort.csvText.replace("508.25", ""),
      mutationKind: "missing_price",
      expected: {
        readinessStatus: "blocked",
        acceptedExecutionCount: 1,
        rejectedRowCount: 1,
        issueCodes: ["row_missing_price"],
        reviewQueueLanes: ["repair", "grouping", "anomaly"],
        anomalyTypes: ["invalid_price_or_size", "open_leftover"],
      },
    },
    {
      id: "mutation:renamed-headers",
      label: "Unknown renamed headers",
      sourcePresetId: unknown.id,
      broker: unknown.broker,
      csvText: unknown.csvText,
      mutationKind: "renamed_headers",
      expected: {
        readinessStatus: "blocked",
        acceptedExecutionCount: 0,
        rejectedRowCount: 2,
        groupedTradeCount: 0,
        issueCodes: ["missing_required_column"],
        reviewQueueLanes: ["repair"],
        learningUrgency: "high",
      },
    },
    {
      id: "mutation:blank-rows",
      label: "Blank rows around valid IBKR export",
      sourcePresetId: ibkr.id,
      broker: ibkr.broker,
      csvText: `\n\n${ibkr.csvText}\n\n`,
      mutationKind: "blank_rows",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 0,
        groupedTradeCount: 1,
      },
    },
    {
      id: "mutation:account-activity-row",
      label: "Schwab account activity row",
      sourcePresetId: schwab.id,
      broker: schwab.broker,
      csvText: schwab.csvText,
      mutationKind: "account_activity_row",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        skippedRowCount: 1,
        groupedTradeCount: 1,
        issueCodes: ["non_trade_row_skipped"],
      },
    },
    {
      id: "mutation:cancelled-order",
      label: "Webull cancelled order row",
      sourcePresetId: webull.id,
      broker: webull.broker,
      csvText: webull.csvText,
      mutationKind: "cancelled_order",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        skippedRowCount: 1,
        groupedTradeCount: 1,
        issueCodes: ["non_filled_order_skipped"],
        anomalyTypes: ["skipped_non_filled_order"],
      },
    },
    {
      id: "mutation:duplicated-fill",
      label: "Duplicate-like IBKR fill",
      sourcePresetId: ibkr.id,
      broker: ibkr.broker,
      csvText: `${ibkr.csvText}\n${ibkr.csvText.split("\n")[3]}`,
      mutationKind: "duplicated_fill",
      expected: {
        readinessStatus: "needs_review",
        acceptedExecutionCount: 3,
        groupedTradeCount: 1,
        reviewQueueLanes: ["grouping", "anomaly"],
        anomalyTypes: ["duplicate_like_fill", "open_leftover"],
      },
    },
    {
      id: "mutation:open-position",
      label: "Open position import",
      sourcePresetId: openPosition.id,
      broker: openPosition.broker,
      csvText: openPosition.csvText,
      mutationKind: "open_position",
      expected: {
        readinessStatus: "needs_review",
        acceptedExecutionCount: 2,
        groupedTradeCount: 1,
        reviewQueueLanes: ["grouping", "anomaly", "feedback"],
        anomalyTypes: ["open_leftover"],
      },
    },
    {
      id: "mutation:weird-timestamp",
      label: "Unparseable timestamp",
      sourcePresetId: genericShort.id,
      broker: genericShort.broker,
      csvText: genericShort.csvText.replace("2026-05-01,09:30:00", "not-a-date,not-a-time"),
      mutationKind: "weird_timestamp",
      expected: {
        readinessStatus: "blocked",
        acceptedExecutionCount: 1,
        rejectedRowCount: 1,
        issueCodes: ["row_invalid_timestamp"],
        reviewQueueLanes: ["repair", "grouping", "anomaly"],
        anomalyTypes: ["open_leftover"],
      },
    },
  ];
}

export function runCsvDryRunMutationQaMatrix(): CsvDryRunMutationQaResult[] {
  return buildCsvDryRunMutationQaCases().map((testCase) => {
    const actual = outcome(
      runExperience({
        csvText: testCase.csvText,
        broker: testCase.broker,
      }),
    );
    const failedExpectations = compareOutcome(actual, testCase.expected);

    return {
      id: testCase.id,
      label: testCase.label,
      mutationKind: testCase.mutationKind,
      status: failedExpectations.length === 0 ? "pass" : "fail",
      actual,
      failedExpectations,
    };
  });
}

export function buildCsvDryRunBrokerRegressionCases(): CsvDryRunBrokerRegressionCase[] {
  return [
    {
      presetId: "preset:ibkr",
      broker: "ibkr_activity_statement",
      label: "IBKR activity statement",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 0,
        groupedTradeCount: 1,
        brokerSupportConfidence: "official",
      },
    },
    {
      presetId: "preset:webull",
      broker: "webull_order_history",
      label: "Webull order history",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 1,
        groupedTradeCount: 1,
        brokerSupportConfidence: "official",
        issueCodes: ["non_filled_order_skipped"],
        anomalyTypes: ["skipped_non_filled_order"],
      },
    },
    {
      presetId: "preset:robinhood",
      broker: "robinhood_transaction_history",
      label: "Robinhood transaction history",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 0,
        groupedTradeCount: 1,
        brokerSupportConfidence: "official",
      },
    },
    {
      presetId: "preset:moomoo",
      broker: "moomoo_trade_history",
      label: "Moomoo trade history",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 0,
        groupedTradeCount: 1,
        brokerSupportConfidence: "observed",
      },
    },
    {
      presetId: "preset:schwab",
      broker: "schwab_transactions",
      label: "Schwab transactions",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 1,
        groupedTradeCount: 1,
        brokerSupportConfidence: "official",
        issueCodes: ["non_trade_row_skipped"],
      },
    },
    {
      presetId: "preset:generic-short",
      broker: "generic_execution_csv",
      label: "Generic execution CSV",
      expected: {
        readinessStatus: "ready",
        acceptedExecutionCount: 2,
        rejectedRowCount: 0,
        skippedRowCount: 0,
        groupedTradeCount: 1,
        brokerSupportConfidence: "best_effort",
      },
    },
  ];
}

export function runCsvDryRunBrokerRegressionMatrix(): CsvDryRunBrokerRegressionResult[] {
  return buildCsvDryRunBrokerRegressionCases().map((testCase) => {
    const sourcePreset = preset(testCase.presetId);
    const actual = outcome(
      runExperience({
        csvText: sourcePreset.csvText,
        broker: testCase.broker,
      }),
    );
    const failedExpectations = compareOutcome(actual, testCase.expected);

    return {
      presetId: testCase.presetId,
      label: testCase.label,
      broker: testCase.broker,
      status: failedExpectations.length === 0 ? "pass" : "fail",
      actual,
      failedExpectations,
    };
  });
}

export function runCsvDryRunRepairImpactSimulation(): CsvDryRunRepairImpactSimulationResult {
  const sourcePreset = preset("preset:row-repair");
  const beforeExperience = runExperience({
    csvText: sourcePreset.csvText,
    broker: sourcePreset.broker,
  });
  const repairedCsv = applyCsvDryRunCellEdit({
    csvText: sourcePreset.csvText,
    rowNumber: 2,
    header: "Symbol",
    value: "ABCD",
  });
  const afterExperience = runExperience({
    csvText: repairedCsv,
    broker: sourcePreset.broker,
    repairImpactBaseline: beforeExperience.repairImpactDiff.currentSnapshot,
  });
  const before = outcome(beforeExperience);
  const after = outcome(afterExperience);
  const failedExpectations: string[] = [];

  if (after.acceptedExecutionCount <= before.acceptedExecutionCount) {
    failedExpectations.push("Accepted executions did not increase after repair.");
  }

  if (after.rejectedRowCount >= before.rejectedRowCount) {
    failedExpectations.push("Rejected rows did not decrease after repair.");
  }

  if (afterExperience.repairImpactDiff.delta.confidenceScore < 0) {
    failedExpectations.push("Confidence score decreased after repair.");
  }

  if (!after.reviewQueueLanes.includes("ready")) {
    failedExpectations.push("Repaired import did not create a ready queue item.");
  }

  return {
    status: failedExpectations.length === 0 ? "pass" : "fail",
    before,
    after,
    baseline: beforeExperience.repairImpactDiff.currentSnapshot,
    acceptedExecutionDelta:
      after.acceptedExecutionCount - before.acceptedExecutionCount,
    rejectedRowDelta: before.rejectedRowCount - after.rejectedRowCount,
    confidenceScoreDelta: afterExperience.repairImpactDiff.delta.confidenceScore,
    failedExpectations,
  };
}

export function runCsvDryRunEndToEndWorkflowSimulation(): CsvDryRunEndToEndWorkflowSimulation {
  const unknown = preset("preset:unknown-mapping");
  const rowRepair = preset("preset:row-repair");
  const mapped = runExperience({
    csvText: unknown.csvText,
    broker: unknown.broker,
  });
  const mappedWithColumns = buildCsvDryRunImportExperience({
    csvText: unknown.csvText,
    broker: unknown.broker,
    columnMapping: {
      symbol: "Trading Symbol",
      timestamp: "Executed At",
      side: "Instruction",
      quantity: "Filled Shares",
      price: "Fill Price",
    },
    setupTagSelections: {
      0: "momentum",
    },
  });
  const repairedCsv = applyCsvDryRunCellEdit({
    csvText: rowRepair.csvText,
    rowNumber: 2,
    header: "Symbol",
    value: "ABCD",
  });
  const repaired = runExperience({
    csvText: repairedCsv,
    broker: rowRepair.broker,
    setupTagSelections: {
      0: "breakout",
    },
  });
  const steps = [
    {
      id: "unknown_mapping_blocked",
      label: "Unknown mapping starts blocked",
      passed: mapped.importSessionSummary.status === "blocked",
      detail: mapped.columnMappingAssistant.nextAction,
    },
    {
      id: "explicit_mapping_ready",
      label: "Explicit mapping repairs headers",
      passed: mappedWithColumns.importSessionSummary.status === "ready",
      detail: mappedWithColumns.importSessionSummary.summary,
    },
    {
      id: "row_repair_ready",
      label: "Row repair creates ready import",
      passed: repaired.importSessionSummary.status === "ready",
      detail: repaired.importSessionSummary.summary,
    },
    {
      id: "setup_tag_captured",
      label: "Setup tag captured as client state",
      passed: repaired.decisionCapture.items.some(
        (item) => item.type === "selected_setup_tag",
      ),
      detail: repaired.setupTagging.limitation,
    },
    {
      id: "feedback_preview_available",
      label: "Feedback preview available",
      passed: repaired.executionFeedbackPreview.completedCount > 0,
      detail: repaired.feedbackComparison.limitation,
    },
  ];

  return {
    status: steps.every((step) => step.passed) ? "pass" : "fail",
    steps,
    finalExperience: repaired,
  };
}

export function buildCsvDryRunRouteSmokeContract(): CsvDryRunRouteSmokeContract {
  return {
    routePath: "/intelligence/import-dry-run",
    sourcePath: "app/intelligence/import-dry-run/import-dry-run-client.tsx",
    requiredPanelLabels: [
      "Import Session Summary",
      "Prototype Analysis",
      "Import Readiness Breakdown",
      "Before / After Repair Impact",
      "Editable Row Repair Table",
      "Trade Grouping Review",
      "Execution Feedback Preview",
      "Dry-Run Replay Preview",
      "P/L Reconciliation Assistant",
      "Fee / Commission Visibility",
      "Post-Import Review Queue Preview",
      "Trade Feedback Preview Comparison",
      "Broker Mapping Learning Console",
      "Execution Anomaly Detector",
      "Setup / Playbook Tagging",
      "User Decision Capture",
    ],
    bannedSurfacePhrases: [
      "Raw JSON",
      "Debug JSON",
      "Export button",
      "Download report",
      "Guaranteed broker support",
      "Certified broker support",
      "Market-validated setup",
    ],
  };
}

export function buildCsvDryRunVisualRegressionContract(): CsvDryRunVisualRegressionContract {
  const routeContract = buildCsvDryRunRouteSmokeContract();
  const requiredPanelLabels = routeContract.requiredPanelLabels;

  return {
    routePath: "/intelligence/import-dry-run",
    screenshotDependency: "playwright_chromium",
    bannedSurfacePhrases: routeContract.bannedSurfacePhrases,
    targets: [
      {
        id: "visual:import-dry-run:desktop",
        routePath: "/intelligence/import-dry-run",
        viewport: "desktop",
        width: 1440,
        height: 1200,
        requiredPanelLabels,
        layoutExpectation:
          "Desktop should show two-column product panels without nested card stacks or raw/debug surfaces.",
      },
      {
        id: "visual:import-dry-run:tablet",
        routePath: "/intelligence/import-dry-run",
        viewport: "tablet",
        width: 900,
        height: 1200,
        requiredPanelLabels,
        layoutExpectation:
          "Tablet should keep controls readable and stack dense panels when needed.",
      },
      {
        id: "visual:import-dry-run:mobile",
        routePath: "/intelligence/import-dry-run",
        viewport: "mobile",
        width: 390,
        height: 1200,
        requiredPanelLabels,
        layoutExpectation:
          "Mobile should stack panels, preserve readable inputs, and avoid page-level horizontal scrolling.",
      },
    ],
  };
}

export function buildCsvDryRunAutomatedQaHarness(): CsvDryRunAutomatedQaHarness {
  return {
    mutationCases: buildCsvDryRunMutationQaCases(),
    mutationResults: runCsvDryRunMutationQaMatrix(),
    brokerRegressionCases: buildCsvDryRunBrokerRegressionCases(),
    brokerRegressionResults: runCsvDryRunBrokerRegressionMatrix(),
    repairImpactSimulation: runCsvDryRunRepairImpactSimulation(),
    endToEndSimulation: runCsvDryRunEndToEndWorkflowSimulation(),
    routeSmokeContract: buildCsvDryRunRouteSmokeContract(),
    visualRegressionContract: buildCsvDryRunVisualRegressionContract(),
    marketContextUsed: false,
  };
}
