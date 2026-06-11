import { runExecutionFeedback } from "../../../execution-feedback/run-execution-feedback";
import type { ExecutionFeedbackSummary } from "../../../execution-feedback/summary/build-execution-feedback-summary";
import type { ProviderExecution } from "../../../execution-sources/types/provider-execution";
import type { UserTradeAnalysisRequest } from "../../../trade-analysis/request/trade-analysis-request-contract";
import type {
  BrokerExecutionCsvImportIssueCode,
  BrokerExecutionCsvRowOutcomeStatus,
} from "../../../execution-sources/csv";
import type {
  CsvDryRunAnomalyType,
  CsvDryRunImportExperience,
  SavedReviewStatus,
  SavedTradeImportBatchId,
  TraderAnalyticsAccountId,
  TraderAnalyticsUserId,
  TraderWorkspaceId,
} from "../types";

export type ImportCommitStatus =
  | "ready_to_commit"
  | "needs_user_review"
  | "blocked";

export type ImportCommitBatchStatus =
  | "previewed"
  | "needs_repair"
  | "ready_to_commit"
  | "committing"
  | "committed"
  | "commit_failed"
  | "discarded"
  | "superseded";

export type ImportCommitRepairSource = "original_csv" | "repaired_csv";

export type ImportCommitDecisionKind =
  | "acknowledge_open_position"
  | "acknowledge_execution_anomaly"
  | "resolve_duplicate_file"
  | "resolve_duplicate_trade"
  | "review_mapping"
  | "review_grouping"
  | "review_pnl"
  | "resolve_rejected_rows";

export interface ImportCommitPlannerAcknowledgements {
  duplicateFile?: boolean;
  duplicateTradeFingerprints?: string[];
  anomalyTypes?: CsvDryRunAnomalyType[];
  openPositions?: boolean;
  groupingReview?: boolean;
  pnlReview?: boolean;
  mappingReview?: boolean;
  rejectedRows?: boolean;
}

export interface BuildImportCommitPlanArgs {
  experience: CsvDryRunImportExperience;
  workspaceId: TraderWorkspaceId;
  userId: TraderAnalyticsUserId;
  accountId: TraderAnalyticsAccountId;
  batchId?: SavedTradeImportBatchId;
  repairSource?: ImportCommitRepairSource;
  existingFileFingerprints?: string[];
  existingTradeFingerprints?: string[];
  generatedAt?: string;
  acknowledgements?: ImportCommitPlannerAcknowledgements;
}

export interface ImportCommitReason {
  id: string;
  kind: ImportCommitDecisionKind;
  severity: "blocked" | "review";
  message: string;
  relatedRowIndexes: number[];
  relatedRequestIndexes: number[];
}

export interface ImportCommitBatchRecord {
  id: SavedTradeImportBatchId;
  workspaceId: TraderWorkspaceId;
  accountId: TraderAnalyticsAccountId;
  userId: TraderAnalyticsUserId;
  brokerKey: string;
  brokerLabel: string;
  repairSource: ImportCommitRepairSource;
  fileFingerprint: string;
  timestampTimezone: string;
  columnMapping: CsvDryRunImportExperience["columnMapping"];
  mappingConfidenceLevel: string;
  mappingConfidenceScore: number;
  rowCount: number;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  requestCount: number;
  status: ImportCommitBatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ImportCommitRowRecord {
  id: string;
  importBatchId: SavedTradeImportBatchId;
  rowIndex: number;
  status: BrokerExecutionCsvRowOutcomeStatus;
  symbol: string | null;
  issueCodes: BrokerExecutionCsvImportIssueCode[];
}

export interface ImportCommitIssueRecord {
  id: string;
  importBatchId: SavedTradeImportBatchId;
  rowIndex: number | null;
  requestIndex: number | null;
  severity: string;
  issueCode: string;
  field: string | null;
  message: string;
}

export interface ImportCommitRepairItemRecord {
  id: string;
  importBatchId: SavedTradeImportBatchId;
  rowIndex: number | null;
  requestIndex: number | null;
  severity: "fix_required" | "review" | "info";
  actionKind: string;
  title: string;
  detail: string;
  status: "open" | "resolved" | "skipped" | "dismissed";
}

export interface ImportCommitExecutionRecord {
  id: string;
  workspaceId: TraderWorkspaceId;
  accountId: TraderAnalyticsAccountId;
  importBatchId: SavedTradeImportBatchId;
  sequenceIndex: number;
  symbol: string;
  timestamp: string;
  side: string;
  shares: number | string;
  price: number | string;
  orderId: string | null;
  brokerExecutionId: string | null;
  commission: number | string | null;
  fees: number | string | null;
  netAmount: number | string | null;
  currency: string | null;
  source: string | null;
}

export interface ImportCommitSavedTradeRecord {
  id: string;
  workspaceId: TraderWorkspaceId;
  accountId: TraderAnalyticsAccountId;
  userId: TraderAnalyticsUserId;
  importBatchId: SavedTradeImportBatchId;
  repairSource: ImportCommitRepairSource;
  requestIndex: number;
  tradeFingerprint: string | null;
  symbol: string;
  tradeDirection: string;
  sessionDate: string;
  sessionBucket: string;
  entrySessionBucket: string;
  entryHourLabelEt: string;
  heldSessionBuckets: string[];
  heldHourBucketsEt: string[];
  heldPremarketIntoOpen: boolean;
  heldOpenIntoMidday: boolean;
  heldMiddayIntoPostmarket: boolean;
  heldPostmarketIntoOvernight: boolean;
  heldOvernight: boolean;
  lifecycleStatus: "closed" | "open";
  openedAt: string;
  closedAt: string | null;
  grossRealizedPnl: number | null;
  request: UserTradeAnalysisRequest;
  reviewStatus: SavedReviewStatus;
  userLifecycleOverride?: {
    reason: "marked_closed_by_user";
    status: "closed";
    updatedAt: string;
  };
}

export interface ImportCommitSavedTradeExecutionLinkRecord {
  id: string;
  savedTradeId: string;
  executionId: string;
  sequenceIndex: number;
  splitSourceExecutionId: string | null;
  splitReason: string | null;
}

export interface ImportCommitTradeGroupingDiagnosticRecord {
  id: string;
  importBatchId: SavedTradeImportBatchId;
  savedTradeId: string;
  requestIndex: number;
  symbol: string;
  tradeDirection: string;
  lifecycleStatus: "closed" | "open";
  groupingReason: string;
  rowIndexes: number[];
  executionCount: number;
  firstTimestamp: string;
  lastTimestamp: string;
  finalPositionShares: number;
  notes: string[];
}

export interface ImportCommitExecutionFeedbackSummaryRecord {
  id: string;
  savedTradeId: string;
  contractVersion: "execution_feedback_summary_v1";
  generatedAt: string;
  summary: ExecutionFeedbackSummary;
  warnings: string[];
  limitations: string[];
}

export interface ImportCommitDecisionReviewJobRecord {
  id: string;
  savedTradeId: string;
  importBatchId: SavedTradeImportBatchId;
  symbol: string;
  status:
    | "queued"
    | "completed"
    | "blocked_open_trade"
    | "market_context_unavailable"
    | "analysis_failed"
    | "skipped_limit";
  reason: string;
}

export interface ImportCommitReadModel {
  status: ImportCommitStatus;
  canCommitNow: boolean;
  batchId: SavedTradeImportBatchId;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  groupedTradeCount: number;
  openPositionCount: number;
  duplicateFile: boolean;
  duplicateTradeCount: number;
  anomalyCount: number;
  urgentAnomalyCount: number;
  reviewAnomalyCount: number;
  blockingReasons: string[];
  reviewReasons: string[];
  nextAction: string;
}

export interface ImportCommitPlanResult {
  contractVersion: "import_commit_plan_v1";
  status: ImportCommitStatus;
  canCommitNow: boolean;
  generatedAt: string;
  batch: ImportCommitBatchRecord;
  blockingReasons: ImportCommitReason[];
  reviewReasons: ImportCommitReason[];
  requiredDecisions: ImportCommitReason[];
  rows: ImportCommitRowRecord[];
  issues: ImportCommitIssueRecord[];
  repairItems: ImportCommitRepairItemRecord[];
  executions: ImportCommitExecutionRecord[];
  savedTrades: ImportCommitSavedTradeRecord[];
  savedTradeExecutionLinks: ImportCommitSavedTradeExecutionLinkRecord[];
  groupingDiagnostics: ImportCommitTradeGroupingDiagnosticRecord[];
  executionFeedbackSummaries: ImportCommitExecutionFeedbackSummaryRecord[];
  decisionReviewJobs: ImportCommitDecisionReviewJobRecord[];
  duplicateTradeFingerprints: string[];
  readModel: ImportCommitReadModel;
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function batchIdFor(args: BuildImportCommitPlanArgs): SavedTradeImportBatchId {
  if (args.batchId) {
    return args.batchId;
  }

  const now = args.generatedAt ?? new Date().toISOString();
  const fileSegment = safeId(args.experience.preview.fileFingerprint).slice(0, 36);
  const timeSegment = args.generatedAt
    ? safeId(now).slice(0, 24)
    : `${safeId(now).slice(0, 18)}-${Math.random().toString(36).slice(2, 10)}`;

  return `import:${fileSegment}:${timeSegment}`;
}

function isoTimestamp(value: ProviderExecution["timestamp"]): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  return value;
}

function isAcknowledged(
  acknowledgements: ImportCommitPlannerAcknowledgements | undefined,
  reason: ImportCommitReason,
): boolean {
  switch (reason.kind) {
    case "acknowledge_open_position":
      return Boolean(acknowledgements?.openPositions);
    case "acknowledge_execution_anomaly":
      return reason.id.startsWith("review:anomaly:")
        ? Boolean(
            acknowledgements?.anomalyTypes?.some((type) => reason.id.endsWith(type)),
          )
        : false;
    case "resolve_duplicate_file":
      return Boolean(acknowledgements?.duplicateFile);
    case "resolve_duplicate_trade":
      return acknowledgements?.duplicateTradeFingerprints?.some((fingerprint) =>
        reason.id.endsWith(safeId(fingerprint)),
      ) ?? false;
    case "review_grouping":
      return Boolean(acknowledgements?.groupingReview);
    case "review_mapping":
      return Boolean(acknowledgements?.mappingReview);
    case "review_pnl":
      return Boolean(acknowledgements?.pnlReview);
    case "resolve_rejected_rows":
      return Boolean(acknowledgements?.rejectedRows);
    default:
      return false;
  }
}

function buildBatch(args: BuildImportCommitPlanArgs): ImportCommitBatchRecord {
  const { experience } = args;
  const importResult = experience.preview.importResult;
  const diagnostics = importResult.diagnostics;
  const now = args.generatedAt ?? new Date().toISOString();

  return {
    id: batchIdFor(args),
    workspaceId: args.workspaceId,
    accountId: args.accountId,
    userId: args.userId,
    brokerKey: experience.broker,
    brokerLabel: importResult.brokerLabel,
    repairSource: args.repairSource ?? "original_csv",
    fileFingerprint: importResult.fileFingerprint,
    timestampTimezone: diagnostics.timestampTimezone,
    columnMapping: experience.columnMapping,
    mappingConfidenceLevel: importResult.mappingConfidence.level,
    mappingConfidenceScore: importResult.mappingConfidence.score,
    rowCount: importResult.rowCount,
    acceptedExecutionCount: importResult.acceptedExecutionCount,
    rejectedRowCount: importResult.rejectedRowCount,
    skippedRowCount: importResult.skippedRowCount,
    requestCount: importResult.requestCount,
    status:
      experience.confidenceGate.status === "blocked"
        ? "needs_repair"
        : experience.confidenceGate.status === "needs_review"
          ? "previewed"
          : "ready_to_commit",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildImportCommitPlan(
  args: BuildImportCommitPlanArgs,
): ImportCommitPlanResult {
  const { experience } = args;
  const importResult = experience.preview.importResult;
  const batch = buildBatch(args);
  const generatedAt = args.generatedAt ?? batch.createdAt;
  const existingFileFingerprints = new Set(args.existingFileFingerprints ?? []);
  const existingTradeFingerprints = new Set(args.existingTradeFingerprints ?? []);
  const duplicateFile =
    experience.preview.fileAlreadyImported ||
    existingFileFingerprints.has(importResult.fileFingerprint);
  const duplicateTradeFingerprints = importResult.requestFingerprints.filter(
    (fingerprint) => existingTradeFingerprints.has(fingerprint),
  );

  const blockingReasons: ImportCommitReason[] = [];
  const reviewReasons: ImportCommitReason[] = [];

  if (importResult.acceptedExecutionCount === 0) {
    blockingReasons.push({
      id: "blocked:no-accepted-executions",
      kind: "resolve_rejected_rows",
      severity: "blocked",
      message: "No executions were accepted.",
      relatedRowIndexes: [],
      relatedRequestIndexes: [],
    });
  }

  if (importResult.acceptedExecutionCount > 0 && importResult.requestCount === 0) {
    blockingReasons.push({
      id: "blocked:no-reconstructed-trades",
      kind: "review_grouping",
      severity: "blocked",
      message:
        "No saved trades could be reconstructed from the accepted executions.",
      relatedRowIndexes: importResult.diagnostics.rowOutcomes
        .filter((row) => row.status === "accepted")
        .map((row) => row.rowIndex),
      relatedRequestIndexes: [],
    });
  }

  if (importResult.rejectedRowCount > 0) {
    blockingReasons.push({
      id: "blocked:rejected-rows",
      kind: "resolve_rejected_rows",
      severity: "blocked",
      message: `${importResult.rejectedRowCount} rejected row(s) must be repaired, skipped, or dismissed before commit.`,
      relatedRowIndexes: importResult.diagnostics.rowOutcomes
        .filter((row) => row.status === "rejected")
        .map((row) => row.rowIndex),
      relatedRequestIndexes: [],
    });
  }

  for (const reason of experience.confidenceGate.blockedReasons) {
    blockingReasons.push({
      id: `blocked:confidence:${safeId(reason)}`,
      kind: "resolve_rejected_rows",
      severity: "blocked",
      message: reason,
      relatedRowIndexes: [],
      relatedRequestIndexes: [],
    });
  }

  if (duplicateFile) {
    reviewReasons.push({
      id: "review:duplicate-file",
      kind: "resolve_duplicate_file",
      severity: "review",
      message: "This file fingerprint already exists for the account.",
      relatedRowIndexes: [],
      relatedRequestIndexes: [],
    });
  }

  for (const fingerprint of duplicateTradeFingerprints) {
    reviewReasons.push({
      id: `review:duplicate-trade:${safeId(fingerprint)}`,
      kind: "resolve_duplicate_trade",
      severity: "review",
      message: "A trade fingerprint already exists for this account.",
      relatedRowIndexes: [],
      relatedRequestIndexes: importResult.requestFingerprints
        .map((candidate, index) => (candidate === fingerprint ? index : -1))
        .filter((index) => index >= 0),
    });
  }

  if (importResult.mappingConfidence.level !== "high") {
    reviewReasons.push({
      id: "review:mapping-confidence",
      kind: "review_mapping",
      severity: "review",
      message: `Broker mapping confidence is ${importResult.mappingConfidence.level}.`,
      relatedRowIndexes: [],
      relatedRequestIndexes: [],
    });
  }

  if (experience.tradeGroupingReview.needsReviewCount > 0) {
    reviewReasons.push({
      id: "review:grouping",
      kind: "review_grouping",
      severity: "review",
      message: `${experience.tradeGroupingReview.needsReviewCount} grouped trade(s) need grouping review.`,
      relatedRowIndexes: experience.tradeGroupingReview.items
        .filter((item) => item.needsReview)
        .flatMap((item) => item.rowIndexes),
      relatedRequestIndexes: experience.tradeGroupingReview.items
        .filter((item) => item.needsReview)
        .map((item) => item.requestIndex),
    });
  }

  const openTrades = experience.tradeGroupingReview.items.filter(
    (item) => item.lifecycleStatus === "open",
  );
  if (openTrades.length > 0) {
    reviewReasons.push({
      id: "review:open-positions",
      kind: "acknowledge_open_position",
      severity: "review",
      message: `${openTrades.length} open position(s) will be saved as open and excluded from completed-trade decision review.`,
      relatedRowIndexes: openTrades.flatMap((item) => item.rowIndexes),
      relatedRequestIndexes: openTrades.map((item) => item.requestIndex),
    });
  }

  if (experience.pnlReconciliationAssistant.status === "needs_review") {
    reviewReasons.push({
      id: "review:pnl-reconciliation",
      kind: "review_pnl",
      severity: "review",
      message: experience.pnlReconciliationAssistant.summary,
      relatedRowIndexes: [],
      relatedRequestIndexes: experience.pnlReconciliationAssistant.items.map(
        (item) => item.requestIndex,
      ),
    });
  }

  for (const anomaly of experience.executionAnomalyDetector.items.filter(
    (item) => item.severity !== "info",
  )) {
    reviewReasons.push({
      id: `review:anomaly:${anomaly.type}`,
      kind: "acknowledge_execution_anomaly",
      severity: "review",
      message: anomaly.title,
      relatedRowIndexes: anomaly.relatedRowIndexes,
      relatedRequestIndexes: anomaly.relatedRequestIndexes,
    });
  }

  const unacknowledgedReviewReasons = reviewReasons.filter(
    (reason) => !isAcknowledged(args.acknowledgements, reason),
  );
  const hardBlockingReasons = blockingReasons.filter(
    (reason) => !isAcknowledged(args.acknowledgements, reason),
  );
  const status: ImportCommitStatus =
    hardBlockingReasons.length > 0
      ? "blocked"
      : unacknowledgedReviewReasons.length > 0
        ? "needs_user_review"
        : "ready_to_commit";
  const canCommitNow = status === "ready_to_commit";

  const rows: ImportCommitRowRecord[] =
    importResult.diagnostics.rowOutcomes.map((row) => ({
      id: `${batch.id}:row:${row.rowIndex}`,
      importBatchId: batch.id,
      rowIndex: row.rowIndex,
      status: row.status,
      symbol: row.symbol,
      issueCodes: row.issueCodes,
    }));
  const issues: ImportCommitIssueRecord[] = importResult.issues.map(
    (issue, index) => ({
      id: `${batch.id}:issue:${index}`,
      importBatchId: batch.id,
      rowIndex: issue.rowIndex ?? null,
      requestIndex: issue.requestIndex ?? null,
      severity: issue.severity,
      issueCode: issue.code,
      field: issue.field ?? null,
      message: issue.message,
    }),
  );
  const repairItems: ImportCommitRepairItemRecord[] =
    experience.preview.productDiagnostics.repairWorkflow.items.map((item) => ({
      id: `${batch.id}:repair:${item.id}`,
      importBatchId: batch.id,
      rowIndex: item.rowIndex ?? null,
      requestIndex: item.requestIndex ?? null,
      severity: item.severity,
      actionKind: item.actionKind,
      title: item.title,
      detail: item.detail,
      status: item.severity === "fix_required" ? "open" : "dismissed",
    }));
  const executions: ImportCommitExecutionRecord[] = importResult.executions.map(
    (execution, index) => ({
      id: `${batch.id}:execution:${index}`,
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      importBatchId: batch.id,
      sequenceIndex: index,
      symbol: execution.symbol,
      timestamp: isoTimestamp(execution.timestamp),
      side: execution.side,
      shares: execution.shares,
      price: execution.price,
      orderId: execution.orderId ?? null,
      brokerExecutionId: execution.brokerExecutionId ?? null,
      commission: execution.commission ?? null,
      fees: execution.fees ?? null,
      netAmount: execution.netAmount ?? null,
      currency: execution.currency ?? null,
      source: execution.source ?? null,
    }),
  );
  const feedbackByRequestIndex = new Map(
    experience.executionFeedbackPreview.items.map((item) => [
      item.requestIndex,
      item,
    ]),
  );
  const savedTrades: ImportCommitSavedTradeRecord[] =
    experience.tradeGroupingReview.items.map((item) => {
      const request = importResult.requests[item.requestIndex];
      const firstExecution = item.timeline[0];
      const lastExecution = item.timeline[item.timeline.length - 1];
      const feedback = feedbackByRequestIndex.get(item.requestIndex);

      return {
        id: `${batch.id}:trade:${item.requestIndex}`,
        workspaceId: args.workspaceId,
        accountId: args.accountId,
        userId: args.userId,
        importBatchId: batch.id,
        repairSource: batch.repairSource,
        requestIndex: item.requestIndex,
        tradeFingerprint: importResult.requestFingerprints[item.requestIndex] ?? null,
        symbol: item.symbol,
        tradeDirection: item.tradeDirection,
        sessionDate: request?.sessionContext.sessionDate ?? "",
        sessionBucket: String(request?.sessionContext.sessionBucket ?? "unknown"),
        entrySessionBucket: item.entrySessionBucket,
        entryHourLabelEt: item.entryHourLabelEt,
        heldSessionBuckets: item.heldSessionBuckets,
        heldHourBucketsEt: item.heldHourBucketsEt,
        heldPremarketIntoOpen: item.heldPremarketIntoOpen,
        heldOpenIntoMidday: item.heldOpenIntoMidday,
        heldMiddayIntoPostmarket: item.heldMiddayIntoPostmarket,
        heldPostmarketIntoOvernight: item.heldPostmarketIntoOvernight,
        heldOvernight: item.heldOvernight,
        lifecycleStatus: item.lifecycleStatus,
        openedAt: firstExecution?.timestamp ?? "",
        closedAt: item.lifecycleStatus === "closed" ? lastExecution?.timestamp ?? null : null,
        grossRealizedPnl: feedback?.grossRealizedPnl ?? null,
        request: request ?? {
          symbol: item.symbol,
          tradeDirection: item.tradeDirection as "long" | "short",
          sessionContext: {
            sessionDate: "",
            sessionBucket: "unknown",
          },
          executions: [],
        },
        reviewStatus: item.needsReview ? "in_progress" : "new",
      };
    });
  const savedTradeByRequestIndex = new Map(
    savedTrades.map((trade) => [trade.requestIndex, trade]),
  );
  const savedTradeExecutionLinks: ImportCommitSavedTradeExecutionLinkRecord[] =
    experience.tradeGroupingReview.items.flatMap((item) => {
      const trade = savedTradeByRequestIndex.get(item.requestIndex);
      if (!trade) {
        return [];
      }

      return item.timeline.map((step, index) => ({
        id: `${trade.id}:link:${index}`,
        savedTradeId: trade.id,
        executionId: `${batch.id}:execution:${step.index}`,
        sequenceIndex: index,
        splitSourceExecutionId:
          item.groupingReason === "over_reduction_split"
            ? `${batch.id}:execution:${step.index}`
            : null,
        splitReason:
          item.groupingReason === "over_reduction_split"
            ? "over_reduction_split"
            : null,
      }));
    });
  const groupingDiagnostics: ImportCommitTradeGroupingDiagnosticRecord[] =
    experience.tradeGroupingReview.items.map((item) => {
      const trade = savedTradeByRequestIndex.get(item.requestIndex);
      const firstExecution = item.timeline[0];
      const lastExecution = item.timeline[item.timeline.length - 1];

      return {
        id: `${batch.id}:grouping:${item.requestIndex}`,
        importBatchId: batch.id,
        savedTradeId: trade?.id ?? `${batch.id}:trade:${item.requestIndex}`,
        requestIndex: item.requestIndex,
        symbol: item.symbol,
        tradeDirection: item.tradeDirection,
        lifecycleStatus: item.lifecycleStatus,
        groupingReason: item.groupingReason,
        rowIndexes: item.rowIndexes,
        executionCount: item.executionCount,
        firstTimestamp: firstExecution?.timestamp ?? "",
        lastTimestamp: lastExecution?.timestamp ?? "",
        finalPositionShares: item.finalPositionShares,
        notes: item.warnings,
      };
    });
  const executionFeedbackSummaries: ImportCommitExecutionFeedbackSummaryRecord[] =
    importResult.requests.flatMap((request: UserTradeAnalysisRequest, requestIndex) => {
      const trade = savedTradeByRequestIndex.get(requestIndex);
      if (!trade) {
        return [];
      }

      const result = runExecutionFeedback(request, { generatedAt });

      if (result.status !== "completed" || !result.summary) {
        return [];
      }

      return [
        {
          id: `${trade.id}:execution-feedback`,
          savedTradeId: trade.id,
          contractVersion: "execution_feedback_summary_v1" as const,
          generatedAt,
          summary: result.summary,
          warnings: result.summary.warnings,
          limitations: result.summary.limitations,
        },
      ];
    });
  const decisionReviewJobs: ImportCommitDecisionReviewJobRecord[] = savedTrades.map(
    (trade) => ({
      id: `${trade.id}:decision-review-job`,
      savedTradeId: trade.id,
      importBatchId: batch.id,
      symbol: trade.symbol,
      status:
        trade.lifecycleStatus === "closed" ? "queued" : "blocked_open_trade",
      reason:
        trade.lifecycleStatus === "closed"
          ? "Completed trade is eligible for server decision review."
          : "Open or swing trade is excluded from completed-trade decision review until flat.",
    }),
  );
  const requiredDecisions = [
    ...hardBlockingReasons,
    ...unacknowledgedReviewReasons,
  ];

  return {
    contractVersion: "import_commit_plan_v1",
    status,
    canCommitNow,
    generatedAt,
    batch: {
      ...batch,
      status:
        status === "ready_to_commit"
          ? "ready_to_commit"
          : status === "blocked"
            ? "needs_repair"
            : "previewed",
      updatedAt: generatedAt,
    },
    blockingReasons,
    reviewReasons,
    requiredDecisions,
    rows,
    issues,
    repairItems,
    executions,
    savedTrades,
    savedTradeExecutionLinks,
    groupingDiagnostics,
    executionFeedbackSummaries,
    decisionReviewJobs,
    duplicateTradeFingerprints,
    readModel: {
      status,
      canCommitNow,
      batchId: batch.id,
      acceptedExecutionCount: importResult.acceptedExecutionCount,
      rejectedRowCount: importResult.rejectedRowCount,
      skippedRowCount: importResult.skippedRowCount,
      groupedTradeCount: experience.tradeGroupingReview.totalCount,
      openPositionCount: openTrades.length,
      duplicateFile,
      duplicateTradeCount: duplicateTradeFingerprints.length,
      anomalyCount: experience.executionAnomalyDetector.totalCount,
      urgentAnomalyCount: experience.executionAnomalyDetector.urgentCount,
      reviewAnomalyCount: experience.executionAnomalyDetector.reviewCount,
      blockingReasons: hardBlockingReasons.map((reason) => reason.message),
      reviewReasons: unacknowledgedReviewReasons.map((reason) => reason.message),
      nextAction:
        status === "ready_to_commit"
          ? "Commit the import transaction."
          : status === "needs_user_review"
            ? "Resolve or acknowledge review decisions before commit."
            : "Fix blocking import issues before commit.",
    },
  };
}
