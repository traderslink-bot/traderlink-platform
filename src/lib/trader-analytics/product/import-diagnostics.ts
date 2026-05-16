import type {
  BrokerExecutionCsvImportIssue,
  BrokerExecutionCsvImportResult,
  BrokerExecutionCsvMappingConfidence,
  BrokerExecutionCsvTradeGroupingDiagnostic,
} from "../../execution-sources/csv";
import type { ProviderExecution } from "../../execution-sources/types/provider-execution";
import type {
  BrokerCsvImportCommitPlan,
  BrokerCsvImportCommitStep,
  BrokerCsvImportProductDiagnostics,
  BrokerCsvImportQualityScore,
  BrokerCsvImportReviewDashboard,
  BrokerCsvImportReviewGroupedTrade,
  BrokerCsvMappingLearningSignal,
  BrokerCsvOptionsQuarantine,
  BrokerCsvImportRepairActionKind,
  BrokerCsvImportRepairItem,
  BrokerCsvImportRepairSeverity,
  BrokerCsvImportRepairWorkflow,
  BrokerCsvImportSummaryCard,
  BrokerCsvNetPnlPreview,
  BrokerCsvNetPnlPreviewItem,
  BrokerCsvPnlReconciliation,
  BrokerCsvPnlReconciliationItem,
  BrokerCsvTimezoneDiagnostic,
  BrokerCsvTradeReconstructionExecutionStep,
  BrokerCsvTradeReconstructionPreview,
  BrokerCsvTradeReconstructionPreviewItem,
  SavedTradeImportPreview,
} from "./types";

export interface BuildBrokerCsvImportProductDiagnosticsArgs {
  importResult: BrokerExecutionCsvImportResult;
  savedTradePreview: SavedTradeImportPreview;
  fileAlreadyImported?: boolean;
  batchId?: string;
  pnlReconciliationTolerance?: number;
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function issueSeverity(issue: BrokerExecutionCsvImportIssue): BrokerCsvImportRepairSeverity {
  if (issue.severity === "error") {
    return "fix_required";
  }

  return issue.code === "auto_detected_format" ||
    issue.code === "non_trade_row_skipped" ||
    issue.code === "non_filled_order_skipped" ||
    issue.code === "prior_position_close_skipped" ||
    issue.code === "sell_starting_trade_skipped"
    ? "info"
    : "review";
}

function actionForIssue(
  issue: BrokerExecutionCsvImportIssue,
): BrokerCsvImportRepairActionKind {
  switch (issue.code) {
    case "row_missing_symbol":
    case "row_missing_timestamp":
    case "row_invalid_timestamp":
    case "row_missing_side":
    case "row_missing_quantity":
    case "row_invalid_quantity":
    case "row_missing_price":
    case "row_invalid_price":
      return "edit_row_field";
    case "invalid_timestamp_timezone":
      return "choose_timezone";
    case "options_row_rejected":
    case "options_row_skipped":
    case "options_row_allowed":
      return "choose_options_handling";
    case "duplicate_trade_in_import":
      return "skip_duplicate";
    case "auto_detected_format":
    case "auto_detect_low_confidence":
    case "missing_required_column":
      return "review_broker_mapping";
    case "trade_grouping_time_gap_split":
    case "trade_grouping_session_boundary_split":
    case "prior_position_close_skipped":
    case "sell_starting_trade_skipped":
      return "review_trade_grouping";
    default:
      return issue.rowIndex ? "skip_row" : "review_broker_mapping";
  }
}

function titleForIssue(issue: BrokerExecutionCsvImportIssue): string {
  switch (issue.code) {
    case "row_missing_symbol":
      return "Missing symbol";
    case "row_missing_timestamp":
    case "row_invalid_timestamp":
      return "Timestamp needs review";
    case "row_missing_side":
      return "Missing buy/sell side";
    case "row_missing_quantity":
    case "row_invalid_quantity":
      return "Quantity needs review";
    case "row_missing_price":
    case "row_invalid_price":
      return "Price needs review";
    case "invalid_timestamp_timezone":
      return "Timezone needs review";
    case "options_row_rejected":
      return "Options row rejected";
    case "options_row_skipped":
      return "Options row skipped";
    case "duplicate_trade_in_import":
      return "Duplicate trade in upload";
    case "auto_detect_low_confidence":
      return "Broker mapping confidence is low";
    case "missing_required_column":
      return "Required column missing";
    case "trade_grouping_time_gap_split":
      return "Trade split by time gap";
    case "trade_grouping_session_boundary_split":
      return "Trade split by session boundary";
    case "prior_position_close_skipped":
      return "Earlier-period position close";
    case "sell_starting_trade_skipped":
      return "Sell row set aside";
    case "non_trade_row_skipped":
      return "Non-execution row skipped";
    case "non_filled_order_skipped":
      return "Unfilled order skipped";
    default:
      return "Import row needs review";
  }
}

function suggestedFixForIssue(issue: BrokerExecutionCsvImportIssue): string {
  switch (issue.code) {
    case "row_missing_symbol":
      return "Choose the column that contains the stock ticker, or fix the row before saving.";
    case "row_missing_timestamp":
    case "row_invalid_timestamp":
      return "Confirm the broker/account timezone and edit the row date or time.";
    case "row_missing_side":
      return "Set the row action to buy or sell, or provide a signed quantity.";
    case "row_missing_quantity":
    case "row_invalid_quantity":
      return "Enter a non-zero share quantity.";
    case "row_missing_price":
    case "row_invalid_price":
      return "Enter a positive execution price.";
    case "invalid_timestamp_timezone":
      return "Pick a valid IANA timezone such as America/New_York.";
    case "options_row_rejected":
      return "Skip this row for stock analytics, or wait for a dedicated options workflow.";
    case "options_row_skipped":
      return "No fix required unless this options trade should be handled later.";
    case "duplicate_trade_in_import":
      return "Keep the first instance and skip the duplicate request.";
    case "auto_detect_low_confidence":
      return "Choose the broker manually or use a generic template with standard headers.";
    case "missing_required_column":
      return "Map or add the required column before saving this import.";
    case "trade_grouping_time_gap_split":
      return "Review whether the separated executions should remain separate trades.";
    case "trade_grouping_session_boundary_split":
      return "Review whether the separated executions should remain split across sessions.";
    case "prior_position_close_skipped":
      return "No action is needed for normal long-side analytics. Upload the earlier period too if this closing row should be connected to its original entry.";
    case "sell_starting_trade_skipped":
      return "No action is needed for normal long-side analytics. Upload the earlier period too if this sell belongs to a position opened before this file.";
    case "non_trade_row_skipped":
      return "No fix required; this row was not a stock execution for this import.";
    case "non_filled_order_skipped":
      return "No fix required unless this unfilled order should be represented elsewhere.";
    default:
      return "Review this row before saving it into analytics.";
  }
}

function buildRepairItemsFromIssues(
  issues: BrokerExecutionCsvImportIssue[],
): BrokerCsvImportRepairItem[] {
  return issues
    .filter((issue) => issue.code !== "trade_request_validation_warning")
    .map((issue, index) => ({
    id: `repair:${index}:${issue.code}`,
    severity: issueSeverity(issue),
    actionKind: actionForIssue(issue),
    rowIndex: issue.rowIndex ?? null,
    requestIndex: issue.requestIndex ?? null,
    symbol: null,
    issueCode: issue.code,
    field: issue.field ?? null,
    title: titleForIssue(issue),
    detail: issue.message,
    suggestedFix: suggestedFixForIssue(issue),
  }));
}

function buildConfidenceRepairItem(
  confidence: BrokerExecutionCsvMappingConfidence,
): BrokerCsvImportRepairItem | null {
  if (confidence.level !== "low") {
    return null;
  }

  return {
    id: "repair:low-mapping-confidence",
    severity: "review",
    actionKind: "review_broker_mapping",
    rowIndex: null,
    requestIndex: null,
    symbol: null,
    issueCode: "low_mapping_confidence",
    field: null,
    title: "Broker mapping confidence is low",
    detail: confidence.reasons.join(" "),
    suggestedFix:
      "Choose the broker manually, confirm the detected columns, or import with the generic execution template.",
  };
}

function buildGroupingRepairItems(
  groupingDiagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[],
): BrokerCsvImportRepairItem[] {
  return groupingDiagnostics
    .filter(
      (diagnostic) =>
        diagnostic.lifecycleStatus === "open" ||
        diagnostic.groupingReason === "over_reduction_split",
    )
    .map((diagnostic) => ({
      id: `repair:grouping:${diagnostic.requestIndex}`,
      severity: "review" as const,
      actionKind: "review_trade_grouping" as const,
      rowIndex: diagnostic.rowIndexes[0] ?? null,
      requestIndex: diagnostic.requestIndex,
      symbol: diagnostic.symbol,
      issueCode: "trade_request_validation_warning" as const,
      field: null,
      title:
        diagnostic.lifecycleStatus === "open"
          ? "Trade grouping leaves an open position"
          : "Trade was split at an over-reduction",
      detail: diagnostic.notes.join(" "),
      suggestedFix:
        "Review the grouped executions before saving this trade into analytics.",
    }));
}

export function buildBrokerCsvImportRepairWorkflow(
  importResult: BrokerExecutionCsvImportResult,
): BrokerCsvImportRepairWorkflow {
  const confidenceItem = buildConfidenceRepairItem(
    importResult.mappingConfidence,
  );
  const items = [
    ...buildRepairItemsFromIssues(importResult.issues),
    ...buildGroupingRepairItems(importResult.groupingDiagnostics),
    ...(confidenceItem ? [confidenceItem] : []),
  ];

  return {
    totalCount: items.length,
    fixRequiredCount: items.filter((item) => item.severity === "fix_required")
      .length,
    reviewCount: items.filter((item) => item.severity === "review").length,
    infoCount: items.filter((item) => item.severity === "info").length,
    items,
  };
}

function executionCashFlow(execution: ProviderExecution): number {
  const shares = Number(execution.shares);
  const price = Number(execution.price);
  const gross = Number.isFinite(shares) && Number.isFinite(price)
    ? shares * price
    : 0;

  return String(execution.side).trim().toLowerCase() === "sell"
    ? gross
    : -gross;
}

function executionCost(execution: ProviderExecution, field: "commission" | "fees"): number {
  const parsed = numberOrNull(execution[field]);

  return parsed === null ? 0 : Math.abs(parsed);
}

function executionCurrency(executions: ProviderExecution[]): string | null {
  const currencies = new Set(
    executions
      .map((execution) =>
        typeof execution.currency === "string"
          ? execution.currency.trim().toUpperCase()
          : "",
      )
      .filter((currency) => currency !== ""),
  );

  return currencies.size === 1 ? [...currencies][0] : null;
}

export function buildBrokerCsvNetPnlPreview(
  importResult: BrokerExecutionCsvImportResult,
): BrokerCsvNetPnlPreview {
  const items: BrokerCsvNetPnlPreviewItem[] = importResult.requests.map(
    (request, requestIndex) => {
      const diagnostic = importResult.groupingDiagnostics.find(
        (item) => item.requestIndex === requestIndex,
      );
      const executions = request.executions;
      const grossCashFlow = executions.reduce(
        (total, execution) => total + executionCashFlow(execution),
        0,
      );
      const totalCommission = executions.reduce(
        (total, execution) => total + executionCost(execution, "commission"),
        0,
      );
      const totalFees = executions.reduce(
        (total, execution) => total + executionCost(execution, "fees"),
        0,
      );
      const netAmounts = executions.map((execution) =>
        numberOrNull(execution.netAmount),
      );
      const brokerNetAmountTotal = netAmounts.every(
        (value): value is number => value !== null,
      )
        ? netAmounts.reduce((total, value) => total + value, 0)
        : null;
      const lifecycleStatus = diagnostic?.lifecycleStatus ?? "open";
      const grossMinusKnownCosts =
        lifecycleStatus === "closed"
          ? grossCashFlow - totalCommission - totalFees
          : null;
      const estimatedNetPnl =
        brokerNetAmountTotal !== null
          ? brokerNetAmountTotal
          : grossMinusKnownCosts !== null
            ? grossMinusKnownCosts
            : null;

      return {
        requestIndex,
        symbol: request.symbol,
        tradeDirection: String(request.tradeDirection),
        lifecycleStatus,
        currency: executionCurrency(executions),
        grossCashFlow,
        totalCommission,
        totalFees,
        totalCosts: totalCommission + totalFees,
        grossMinusKnownCosts:
          grossMinusKnownCosts === null ? null : roundMoney(grossMinusKnownCosts),
        brokerNetAmountTotal,
        estimatedNetPnl,
        source:
          brokerNetAmountTotal !== null
            ? "broker_net_amount"
            : estimatedNetPnl !== null
              ? "gross_minus_costs"
              : "insufficient_data",
      };
    },
  );
  const netValues = items.map((item) => item.estimatedNetPnl);

  return {
    totalGrossCashFlow: items.reduce(
      (total, item) => total + item.grossCashFlow,
      0,
    ),
    totalCosts: items.reduce((total, item) => total + item.totalCosts, 0),
    totalEstimatedNetPnl: netValues.every(
      (value): value is number => value !== null,
    )
      ? netValues.reduce((total, value) => total + value, 0)
      : null,
    items,
  };
}

export function buildBrokerCsvPnlReconciliation(args: {
  netPnlPreview: BrokerCsvNetPnlPreview;
  tolerance?: number;
}): BrokerCsvPnlReconciliation {
  const tolerance = args.tolerance ?? 0.01;
  const items: BrokerCsvPnlReconciliationItem[] = args.netPnlPreview.items.map(
    (item) => {
      if (item.lifecycleStatus !== "closed" || item.grossMinusKnownCosts === null) {
        return {
          requestIndex: item.requestIndex,
          symbol: item.symbol,
          lifecycleStatus: item.lifecycleStatus,
          brokerNetAmountTotal: item.brokerNetAmountTotal,
          grossMinusKnownCosts: item.grossMinusKnownCosts,
          difference: null,
          tolerance,
          status: "open_or_insufficient",
          message:
            "P/L reconciliation waits until the grouped trade is closed and has enough cost data.",
        };
      }

      if (item.brokerNetAmountTotal === null) {
        return {
          requestIndex: item.requestIndex,
          symbol: item.symbol,
          lifecycleStatus: item.lifecycleStatus,
          brokerNetAmountTotal: null,
          grossMinusKnownCosts: item.grossMinusKnownCosts,
          difference: null,
          tolerance,
          status: "no_broker_net",
          message:
            "Broker net amount was not present, so the app can only preview gross minus known costs.",
        };
      }

      const difference = roundMoney(
        item.brokerNetAmountTotal - item.grossMinusKnownCosts,
      );
      const status = Math.abs(difference) <= tolerance ? "matched" : "mismatch";

      return {
        requestIndex: item.requestIndex,
        symbol: item.symbol,
        lifecycleStatus: item.lifecycleStatus,
        brokerNetAmountTotal: item.brokerNetAmountTotal,
        grossMinusKnownCosts: item.grossMinusKnownCosts,
        difference,
        tolerance,
        status,
        message:
          status === "matched"
            ? "Broker net amount matches gross minus known costs within tolerance."
            : "Broker net amount differs from gross minus known costs and should be reviewed.",
      };
    },
  );

  return {
    tolerance,
    matchedCount: items.filter((item) => item.status === "matched").length,
    mismatchCount: items.filter((item) => item.status === "mismatch").length,
    needsReviewCount: items.filter(
      (item) =>
        item.status === "mismatch" ||
        item.status === "open_or_insufficient",
    ).length,
    items,
  };
}

function buildPnlRepairItems(
  reconciliation: BrokerCsvPnlReconciliation,
): BrokerCsvImportRepairItem[] {
  return reconciliation.items
    .filter((item) => item.status === "mismatch")
    .map((item) => ({
      id: `repair:pnl:${item.requestIndex}`,
      severity: "review" as const,
      actionKind: "review_pnl_reconciliation" as const,
      rowIndex: null,
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      issueCode: "pnl_reconciliation_mismatch" as const,
      field: "netAmount",
      title: "P/L reconciliation needs review",
      detail: item.message,
      suggestedFix:
        "Compare broker net amount, fees, commissions, and gross execution cash flow before saving final net P/L.",
    }));
}

export function buildBrokerCsvImportSummaryCards(args: {
  importResult: BrokerExecutionCsvImportResult;
  savedTradePreview: SavedTradeImportPreview;
  netPnlPreview: BrokerCsvNetPnlPreview;
  pnlReconciliation?: BrokerCsvPnlReconciliation;
}): BrokerCsvImportSummaryCard[] {
  const {
    importResult,
    savedTradePreview,
    netPnlPreview,
    pnlReconciliation,
  } = args;
  const feeFieldDetected = importResult.executions.some(
    (execution) =>
      numberOrNull(execution.commission) !== null ||
      numberOrNull(execution.fees) !== null,
  );
  const duplicateCount =
    importResult.diagnostics.duplicateRequestFingerprints.length;

  return [
    {
      id: "rows",
      label: "Rows",
      value: `${importResult.acceptedExecutionCount}/${importResult.rowCount}`,
      detail: `${importResult.rejectedRowCount} rejected, ${importResult.skippedRowCount} skipped.`,
      tone: importResult.rejectedRowCount > 0 ? "danger" : "good",
    },
    {
      id: "trades",
      label: "Grouped Trades",
      value: String(importResult.requestCount),
      detail: `${savedTradePreview.acceptedCount} ready for saved-trade validation.`,
      tone: savedTradePreview.rejectedCount > 0 ? "warning" : "good",
    },
    {
      id: "confidence",
      label: "Mapping Confidence",
      value: `${importResult.mappingConfidence.score}`,
      detail: `${importResult.mappingConfidence.level} confidence for ${importResult.brokerLabel}.`,
      tone:
        importResult.mappingConfidence.level === "high"
          ? "good"
          : importResult.mappingConfidence.level === "medium"
            ? "warning"
            : "danger",
    },
    {
      id: "timezone",
      label: "Timezone",
      value: `${importResult.diagnostics.timestampTimezone} -> Eastern`,
      detail:
        "Broker timestamps parse in the account timezone; session buckets use America/New_York.",
      tone: importResult.issues.some(
        (issue) => issue.code === "invalid_timestamp_timezone",
      )
        ? "warning"
        : "neutral",
    },
    {
      id: "fees",
      label: "Fees",
      value: feeFieldDetected ? money(netPnlPreview.totalCosts) : "not found",
      detail: feeFieldDetected
        ? "Fees or commissions were captured from the CSV."
        : "No fee or commission columns were detected.",
      tone: feeFieldDetected ? "good" : "neutral",
    },
    {
      id: "duplicates",
      label: "Duplicates",
      value: String(duplicateCount),
      detail:
        duplicateCount > 0
          ? "Duplicate grouped trades were found in this upload."
          : "No duplicate grouped trades detected.",
      tone: duplicateCount > 0 ? "warning" : "good",
    },
    {
      id: "options",
      label: "Options",
      value: importResult.diagnostics.optionsHandling,
      detail: "Options rows are guarded separately from stock analytics.",
      tone:
        importResult.issues.some((issue) => issue.code === "options_row_rejected")
          ? "warning"
          : "neutral",
    },
    {
      id: "pnl",
      label: "P/L Check",
      value: pnlReconciliation
        ? String(pnlReconciliation.mismatchCount)
        : "n/a",
      detail:
        pnlReconciliation && pnlReconciliation.mismatchCount > 0
          ? "Broker net amount differs from gross minus known costs."
          : "No broker/app P/L mismatch detected.",
      tone:
        pnlReconciliation && pnlReconciliation.mismatchCount > 0
          ? "warning"
          : "good",
    },
  ];
}

export function buildBrokerCsvTimezoneDiagnostic(
  importResult: BrokerExecutionCsvImportResult,
): BrokerCsvTimezoneDiagnostic {
  const timezoneIssues = importResult.issues.filter(
    (issue) =>
      issue.code === "invalid_timestamp_timezone" ||
      issue.code === "row_invalid_timestamp" ||
      issue.code === "row_missing_timestamp",
  );

  return {
    sourceTimestampTimezone: importResult.diagnostics.timestampTimezone,
    marketSessionTimezone: "America/New_York",
    sourceTimezoneDetail:
      "Broker-local and date-only timestamps are interpreted using the selected account timezone.",
    marketSessionDetail:
      "U.S. equity session buckets and entry-hour analytics are classified in America/New_York.",
    issueCount: timezoneIssues.length,
    issueMessages: timezoneIssues.map((issue) => issue.message),
  };
}

export function buildBrokerCsvMappingLearningSignal(
  importResult: BrokerExecutionCsvImportResult,
): BrokerCsvMappingLearningSignal {
  const shouldCapture =
    importResult.broker === "generic_execution_csv" ||
    importResult.mappingConfidence.level !== "high" ||
    importResult.issues.some(
      (issue) =>
        issue.code === "missing_required_column" ||
        issue.code === "auto_detect_low_confidence",
    );
  const headerFingerprint = [
    "broker_csv_headers_v1",
    importResult.diagnostics.headers
      .map((header) => header.trim().toLowerCase())
      .filter((header) => header !== "")
      .sort()
      .join("|"),
  ].join(":");

  return {
    shouldCapture,
    reason: shouldCapture
      ? "Generic, low-confidence, or problematic mappings should be reviewed before promoting broker support."
      : "Mapping is high confidence and does not need learning review.",
    broker: importResult.broker,
    confidenceLevel: importResult.mappingConfidence.level,
    confidenceScore: importResult.mappingConfidence.score,
    headerFingerprint,
    headers: importResult.diagnostics.headers,
    detectedFields: importResult.diagnostics.detectedColumns.map(
      (column) => column.field,
    ),
    missingRequiredFields: importResult.diagnostics.missingRequiredFields,
    issueCodes: [...new Set(importResult.issues.map((issue) => issue.code))],
  };
}

export function buildBrokerCsvOptionsQuarantine(
  importResult: BrokerExecutionCsvImportResult,
): BrokerCsvOptionsQuarantine {
  const items = importResult.issues
    .filter(
      (issue) =>
        issue.code === "options_row_rejected" ||
        issue.code === "options_row_skipped" ||
        issue.code === "options_row_allowed",
    )
    .map((issue) => ({
      rowIndex: issue.rowIndex ?? null,
      issueCode: issue.code,
      action:
        issue.code === "options_row_rejected"
          ? "rejected" as const
          : issue.code === "options_row_skipped"
            ? "skipped" as const
            : "allowed" as const,
      message: issue.message,
    }));

  return {
    totalCount: items.length,
    rejectedCount: items.filter((item) => item.action === "rejected").length,
    skippedCount: items.filter((item) => item.action === "skipped").length,
    allowedCount: items.filter((item) => item.action === "allowed").length,
    items,
  };
}

function buildGroupedTradeReviews(
  diagnostics: BrokerExecutionCsvTradeGroupingDiagnostic[],
): BrokerCsvImportReviewGroupedTrade[] {
  return diagnostics.map((diagnostic) => ({
    requestIndex: diagnostic.requestIndex,
    symbol: diagnostic.symbol,
    tradeDirection: diagnostic.tradeDirection,
    lifecycleStatus: diagnostic.lifecycleStatus,
    groupingReason: diagnostic.groupingReason,
    executionCount: diagnostic.executionCount,
    rowIndexes: diagnostic.rowIndexes,
    needsReview:
      diagnostic.lifecycleStatus === "open" ||
      diagnostic.groupingReason !== "flat_position",
  }));
}

export function buildBrokerCsvImportCommitPlan(args: {
  importResult: BrokerExecutionCsvImportResult;
  savedTradePreview: SavedTradeImportPreview;
  repairWorkflow: BrokerCsvImportRepairWorkflow;
  pnlReconciliation: BrokerCsvPnlReconciliation;
  fileAlreadyImported?: boolean;
  batchId?: string;
}): BrokerCsvImportCommitPlan {
  const fileAlreadyImported = args.fileAlreadyImported ?? false;
  const blockedReasons = [
    ...(fileAlreadyImported ? ["This CSV file was already imported."] : []),
    ...(args.repairWorkflow.fixRequiredCount > 0
      ? ["Import has rows that must be fixed before saving."]
      : []),
    ...(args.savedTradePreview.rejectedCount > 0
      ? ["Saved-trade validation rejected at least one grouped trade."]
      : []),
  ];
  const reviewReasons = [
    ...(args.repairWorkflow.reviewCount > 0
      ? ["Import has review items before commit."]
      : []),
    ...(args.pnlReconciliation.mismatchCount > 0
      ? ["P/L reconciliation has broker/app mismatches."]
      : []),
  ];
  const status =
    blockedReasons.length > 0
      ? "blocked"
      : reviewReasons.length > 0
        ? "needs_user_review"
        : "ready_to_commit";
  const guardedStatus: BrokerCsvImportCommitStep["status"] =
    status === "blocked"
      ? "blocked"
      : status === "needs_user_review"
        ? "needs_user_review"
        : "ready";
  const steps: BrokerCsvImportCommitStep[] = [
    {
      id: "create_import_batch",
      label: "Create saved import",
      status: fileAlreadyImported ? "blocked" : guardedStatus,
      detail: fileAlreadyImported
        ? "Duplicate file should not create another saved import."
        : "Save import metadata, file fingerprint, timezone, confidence, and counts.",
    },
    {
      id: "save_rows_and_issues",
      label: "Save rows and repair state",
      status: guardedStatus,
      detail:
        "Persist row outcomes, issues, repair items, and options quarantine state.",
    },
    {
      id: "save_executions",
      label: "Save normalized executions",
      status: guardedStatus,
      detail: `${args.importResult.acceptedExecutionCount} normalized executions are eligible to save.`,
    },
    {
      id: "save_grouped_trades",
      label: "Save grouped trades",
      status: guardedStatus,
      detail: `${args.savedTradePreview.acceptedCount} grouped trades are eligible to save.`,
    },
    {
      id: "queue_execution_analysis",
      label: "Queue execution analysis",
      status: status === "ready_to_commit" ? "planned" : guardedStatus,
      detail: "Run execution-only feedback after trades are saved.",
    },
    {
      id: "request_market_context_later",
      label: "Request market context later",
      status: "planned",
      detail:
        "Levels and market structure stay owned by levels-system and are attached after saved trades exist.",
    },
  ];

  return {
    status,
    canCommitNow: status === "ready_to_commit",
    batchId: args.batchId ?? "pending-broker-csv-import",
    fileAlreadyImported,
    executionCountToSave:
      status === "blocked" ? 0 : args.importResult.acceptedExecutionCount,
    tradeCountToSave:
      status === "blocked" ? 0 : args.savedTradePreview.acceptedCount,
    analysisJobCountToQueue:
      status === "ready_to_commit" ? args.savedTradePreview.acceptedCount : 0,
    blockedReasons,
    reviewReasons,
    steps,
  };
}

export function buildBrokerCsvImportReviewDashboard(args: {
  importResult: BrokerExecutionCsvImportResult;
  repairWorkflow: BrokerCsvImportRepairWorkflow;
  summaryCards: BrokerCsvImportSummaryCard[];
  pnlReconciliation: BrokerCsvPnlReconciliation;
  optionsQuarantine: BrokerCsvOptionsQuarantine;
  commitPlan: BrokerCsvImportCommitPlan;
}): BrokerCsvImportReviewDashboard {
  return {
    batchStatus:
      args.commitPlan.status === "ready_to_commit"
        ? "ready_to_commit"
        : args.commitPlan.status === "blocked"
          ? "blocked"
          : "needs_review",
    summaryCards: args.summaryCards,
    repairWorkflow: args.repairWorkflow,
    groupedTrades: buildGroupedTradeReviews(args.importResult.groupingDiagnostics),
    rowOutcomes: args.importResult.diagnostics.rowOutcomes,
    pnlReconciliation: args.pnlReconciliation,
    optionsQuarantine: args.optionsQuarantine,
    nextAction:
      args.commitPlan.status === "ready_to_commit"
        ? "Commit accepted executions and queue analysis."
        : args.commitPlan.status === "blocked"
          ? args.commitPlan.blockedReasons[0] ?? "Fix blocked import rows."
          : args.commitPlan.reviewReasons[0] ??
            "Review import warnings before saving.",
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildBrokerCsvImportQualityScore(args: {
  importResult: BrokerExecutionCsvImportResult;
  repairWorkflow: BrokerCsvImportRepairWorkflow;
  pnlReconciliation: BrokerCsvPnlReconciliation;
  optionsQuarantine: BrokerCsvOptionsQuarantine;
  commitPlan: BrokerCsvImportCommitPlan;
}): BrokerCsvImportQualityScore {
  const warningCount = args.importResult.issues.filter(
    (issue) => issue.severity === "warning" && issueSeverity(issue) !== "info",
  ).length;
  const groupingReviewCount = args.importResult.groupingDiagnostics.filter(
    (diagnostic) =>
      diagnostic.lifecycleStatus === "open" ||
      diagnostic.groupingReason !== "flat_position",
  ).length;
  const blockerCount =
    args.repairWorkflow.fixRequiredCount +
    args.commitPlan.blockedReasons.length;
  const reviewCount =
    args.repairWorkflow.reviewCount + args.pnlReconciliation.mismatchCount;
  const positiveSignals = [
    args.importResult.mappingConfidence.level === "high",
    args.importResult.rejectedRowCount === 0,
    args.importResult.diagnostics.duplicateRequestFingerprints.length === 0,
    args.pnlReconciliation.mismatchCount === 0,
    groupingReviewCount === 0,
    args.optionsQuarantine.rejectedCount === 0,
  ].filter(Boolean).length;
  const confidencePenalty =
    args.importResult.mappingConfidence.level === "low"
      ? 22
      : args.importResult.mappingConfidence.level === "medium"
        ? 10
        : 0;
  const reviewPenalty = Math.min(35, reviewCount * 3);
  const warningPenalty = Math.min(20, warningCount * 2);
  const rawScore =
    100 -
    blockerCount * 35 -
    reviewPenalty -
    warningPenalty -
    args.pnlReconciliation.mismatchCount * 8 -
    args.optionsQuarantine.rejectedCount * 8 -
    confidencePenalty;
  const score = clampScore(rawScore + positiveSignals * 2);
  const status =
    args.commitPlan.status === "blocked" || blockerCount > 0
      ? "blocked"
      : score >= 85 && reviewCount === 0
        ? "high_confidence"
        : "needs_review";
  const reasons = [
    ...(args.importResult.mappingConfidence.level !== "high"
      ? [`${args.importResult.mappingConfidence.level} broker mapping confidence.`]
      : ["High broker mapping confidence."]),
    ...(args.importResult.rejectedRowCount > 0
      ? [`${args.importResult.rejectedRowCount} rejected row(s).`]
      : ["No rejected rows."]),
    ...(args.repairWorkflow.fixRequiredCount > 0
      ? [`${args.repairWorkflow.fixRequiredCount} fix-required repair item(s).`]
      : []),
    ...(args.repairWorkflow.reviewCount > 0
      ? [`${args.repairWorkflow.reviewCount} review item(s).`]
      : []),
    ...(args.pnlReconciliation.mismatchCount > 0
      ? [`${args.pnlReconciliation.mismatchCount} P/L mismatch(es).`]
      : ["No broker/app P/L mismatch detected."]),
    ...(groupingReviewCount > 0
      ? [`${groupingReviewCount} grouped trade(s) need reconstruction review.`]
      : []),
    ...(args.optionsQuarantine.rejectedCount > 0
      ? [`${args.optionsQuarantine.rejectedCount} options row(s) quarantined.`]
      : []),
    ...args.commitPlan.blockedReasons,
  ];

  return {
    status,
    score,
    blockerCount,
    reviewCount,
    warningCount,
    positiveSignalCount: positiveSignals,
    reasons,
    nextAction:
      status === "high_confidence"
        ? "Save the import and queue execution analysis."
        : status === "blocked"
          ? args.commitPlan.blockedReasons[0] ??
            "Fix blocked rows before saving this import."
          : args.commitPlan.reviewReasons[0] ??
            "Review mapping, grouping, or P/L warnings before saving.",
  };
}

function executionRowIndex(execution: ProviderExecution): number | null {
  const parsed = Number(execution.executionIndex);

  return Number.isFinite(parsed) ? parsed + 1 : null;
}

function reconstructionTimeline(args: {
  executions: ProviderExecution[];
  tradeDirection: string;
}): BrokerCsvTradeReconstructionExecutionStep[] {
  const directionMultiplier =
    String(args.tradeDirection).toLowerCase() === "short" ? -1 : 1;
  let position = 0;

  return args.executions.map((execution, index) => {
    const side = String(execution.side).trim().toLowerCase();
    const shares = Number(execution.shares);
    const price = Number(execution.price);
    const signedShares = side === "buy" ? shares : -shares;
    position += signedShares * directionMultiplier;

    return {
      index,
      rowIndex: executionRowIndex(execution),
      timestamp: String(execution.timestamp),
      side,
      shares,
      price,
      positionAfterExecution: position,
      cashFlow: executionCashFlow(execution),
    };
  });
}

export function buildBrokerCsvTradeReconstructionPreview(args: {
  importResult: BrokerExecutionCsvImportResult;
  netPnlPreview: BrokerCsvNetPnlPreview;
}): BrokerCsvTradeReconstructionPreview {
  const items: BrokerCsvTradeReconstructionPreviewItem[] =
    args.importResult.requests.map((request, requestIndex) => {
      const diagnostic = args.importResult.groupingDiagnostics.find(
        (item) => item.requestIndex === requestIndex,
      );
      const pnl = args.netPnlPreview.items.find(
        (item) => item.requestIndex === requestIndex,
      );
      const warnings = diagnostic?.notes ?? [];
      const lifecycleStatus = diagnostic?.lifecycleStatus ?? "open";
      const groupingReason = diagnostic?.groupingReason ?? "end_of_symbol";
      const needsReview =
        lifecycleStatus === "open" ||
        groupingReason !== "flat_position";

      return {
        requestIndex,
        symbol: request.symbol,
        tradeDirection: String(request.tradeDirection),
        lifecycleStatus,
        groupingReason,
        executionCount: request.executions.length,
        rowIndexes: diagnostic?.rowIndexes ?? [],
        grossCashFlow: pnl?.grossCashFlow ?? 0,
        estimatedNetPnl: pnl?.estimatedNetPnl ?? null,
        brokerNetAmountTotal: pnl?.brokerNetAmountTotal ?? null,
        grossMinusKnownCosts: pnl?.grossMinusKnownCosts ?? null,
        needsReview,
        warnings,
        timeline: reconstructionTimeline({
          executions: request.executions,
          tradeDirection: String(request.tradeDirection),
        }),
      };
    });

  return {
    totalCount: items.length,
    needsReviewCount: items.filter((item) => item.needsReview).length,
    items,
  };
}

export function buildBrokerCsvImportProductDiagnostics(
  args: BuildBrokerCsvImportProductDiagnosticsArgs,
): BrokerCsvImportProductDiagnostics {
  const netPnlPreview = buildBrokerCsvNetPnlPreview(args.importResult);
  const pnlReconciliation = buildBrokerCsvPnlReconciliation({
    netPnlPreview,
    tolerance: args.pnlReconciliationTolerance,
  });
  const baseRepairWorkflow = buildBrokerCsvImportRepairWorkflow(
    args.importResult,
  );
  const repairItems = [
    ...baseRepairWorkflow.items,
    ...buildPnlRepairItems(pnlReconciliation),
  ];
  const repairWorkflow: BrokerCsvImportRepairWorkflow = {
    totalCount: repairItems.length,
    fixRequiredCount: repairItems.filter(
      (item) => item.severity === "fix_required",
    ).length,
    reviewCount: repairItems.filter((item) => item.severity === "review")
      .length,
    infoCount: repairItems.filter((item) => item.severity === "info").length,
    items: repairItems,
  };
  const summaryCards = buildBrokerCsvImportSummaryCards({
    importResult: args.importResult,
    savedTradePreview: args.savedTradePreview,
    netPnlPreview,
    pnlReconciliation,
  });
  const optionsQuarantine = buildBrokerCsvOptionsQuarantine(args.importResult);
  const commitPlan = buildBrokerCsvImportCommitPlan({
    importResult: args.importResult,
    savedTradePreview: args.savedTradePreview,
    repairWorkflow,
    pnlReconciliation,
    fileAlreadyImported: args.fileAlreadyImported,
    batchId: args.batchId,
  });
  const qualityScore = buildBrokerCsvImportQualityScore({
    importResult: args.importResult,
    repairWorkflow,
    pnlReconciliation,
    optionsQuarantine,
    commitPlan,
  });
  const reconstructionPreview = buildBrokerCsvTradeReconstructionPreview({
    importResult: args.importResult,
    netPnlPreview,
  });

  return {
    confidenceLevel: args.importResult.mappingConfidence.level,
    timezoneDiagnostic: buildBrokerCsvTimezoneDiagnostic(args.importResult),
    qualityScore,
    repairWorkflow,
    summaryCards,
    netPnlPreview,
    pnlReconciliation,
    mappingLearningSignal: buildBrokerCsvMappingLearningSignal(args.importResult),
    optionsQuarantine,
    reviewDashboard: buildBrokerCsvImportReviewDashboard({
      importResult: args.importResult,
      repairWorkflow,
      summaryCards,
      pnlReconciliation,
      optionsQuarantine,
      commitPlan,
    }),
    reconstructionPreview,
    commitPlan,
    groupingDiagnostics: args.importResult.groupingDiagnostics,
  };
}
