import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import partialExits from "../../../docs/trade-analysis-request-fixtures/partial-exits.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import shortLoser from "../../../docs/trade-analysis-request-fixtures/short-loser.json";
import shortWinner from "../../../docs/trade-analysis-request-fixtures/short-winner.json";
import {
  buildExecutionFeedbackFacts,
  runExecutionFeedback,
  type ExecutionFeedbackExecutionFact,
  type ExecutionFeedbackFacts,
  type ExecutionFeedbackPoint,
  type ExecutionFeedbackSummary,
  type RunExecutionFeedbackResult,
} from "../../execution-feedback";
import type {
  BrokerExecutionCsvColumnMapping,
  BrokerExecutionCsvFormat,
} from "../../execution-sources/csv";
import {
  validateTradeAnalysisRequest,
  type UserTradeAnalysisRequest,
} from "../../trade-analysis/request/trade-analysis-request-contract";
import { runTraderAnalyticsReport } from "../run-trader-analytics-report";
import type {
  TraderAnalyticsReport,
  TraderAnalyticsReportSummaryInput,
} from "../types/trader-analytics-report";
import {
  buildCsvDryRunImportExperience,
  getCsvDryRunSamplePresets,
} from "./csv-dry-run-workflow";
import type { CsvDryRunImportExperience } from "./types";

export type FunctionalEvidenceKind =
  | "trade"
  | "execution"
  | "import_row"
  | "feedback_point"
  | "metric"
  | "risk"
  | "strength"
  | "state";

export type FunctionalEvidenceConfidence = "low" | "medium" | "high";

export interface FunctionalEvidenceRef {
  kind: FunctionalEvidenceKind;
  id: string;
  label: string;
  tradeId?: string;
  executionIndex?: number;
  rowNumber?: number;
  confidence: FunctionalEvidenceConfidence;
}

export type ImportConfidenceState =
  | "empty"
  | "blocked"
  | "needs_review"
  | "ready_for_analysis"
  | "prototype_saved"
  | "rejected";

export type ImportConfidenceSeverity =
  | "neutral"
  | "review"
  | "blocked"
  | "ready";

export interface ImportConfidenceStateModel {
  contractVersion: "import_confidence_state_v1";
  state: ImportConfidenceState;
  severity: ImportConfidenceSeverity;
  label: string;
  primaryNextAction: string;
  allowedActions: string[];
  blockers: string[];
  reviewReasons: string[];
  evidence: FunctionalEvidenceRef[];
  marketContextUsed: false;
}

export interface SavedAnalysisPrototype {
  contractVersion: "saved_analysis_prototype_v1";
  importBatchId: string;
  sourceBroker: BrokerExecutionCsvFormat;
  preSaveState: ImportConfidenceStateModel;
  state: ImportConfidenceStateModel;
  generatedTradeIds: string[];
  generatedTradeLabels: string[];
  feedbackSummaryIds: string[];
  feedbackStatuses: Array<RunExecutionFeedbackResult["status"]>;
  autopsies: ExecutionFeedbackAutopsyEnrichment[];
  analyticsReportStatus: "not_created" | "created";
  analyticsReport: TraderAnalyticsReport | null;
  reviewQueueItemCount: number;
  limitations: string[];
  evidence: FunctionalEvidenceRef[];
  isPrototypeOnly: true;
  writesProductionDatabase: false;
  marketContextUsed: false;
  exportAvailable: false;
}

export type CsvDryRunPrototypeAnalysisPanelState =
  | "empty"
  | "blocked"
  | "needs_review"
  | "ready"
  | "prototype_generated";

export type CsvDryRunPrototypeAnalysisInsightTone =
  | "strength"
  | "risk"
  | "neutral"
  | "review";

export type CsvDryRunPrototypeAnalysisInsightCategory =
  | "execution_autopsy"
  | "decision_review"
  | "import"
  | "market_context";

export type CsvDryRunPrototypeAnalysisMarketContextSource =
  | "none"
  | "levels_system_daily_4h"
  | "mixed";

export interface CsvDryRunPrototypeAnalysisFinding {
  id: string;
  tone: CsvDryRunPrototypeAnalysisInsightTone;
  category: CsvDryRunPrototypeAnalysisInsightCategory;
  title: string;
  summary: string;
  tradeId: string | null;
  executionIndex: number | null;
  evidence: string[];
}

export interface CsvDryRunPrototypeDecisionReviewInsightInput {
  id: string;
  tone: CsvDryRunPrototypeAnalysisInsightTone;
  category: string;
  title: string;
  summary: string;
  evidence?: string[];
}

export interface CsvDryRunPrototypeDecisionReviewInput {
  tradeId?: string | null;
  coachingHeadline?: string | null;
  fixFirstBehaviorId?: string | null;
  marketContextSource?: "levels_system_daily_4h" | "none" | null;
  tradeWindowEvidenceSource?:
    | "levels_system_trade_window"
    | "execution_only_fallback";
  candleQualityNotes?: string[];
  insights: CsvDryRunPrototypeDecisionReviewInsightInput[];
}

export interface CsvDryRunPrototypeAnalysisPanel {
  contractVersion: "csv_dry_run_prototype_analysis_panel_v1";
  state: CsvDryRunPrototypeAnalysisPanelState;
  stateLabel: string;
  primaryNextAction: string;
  canGeneratePrototype: boolean;
  prototypeGenerated: boolean;
  generatedTradeCount: number;
  feedbackSummaryCount: number;
  reviewQueueItemCount: number;
  topAutopsyFindings: CsvDryRunPrototypeAnalysisFinding[];
  topDecisionReviewInsights: CsvDryRunPrototypeAnalysisFinding[];
  coachingHeadline: string | null;
  fixFirstBehaviorId: string | null;
  topImportBlockers: string[];
  topReviewReasons: string[];
  limitations: string[];
  evidence: FunctionalEvidenceRef[];
  writesProductionDatabase: false;
  marketContextUsed: boolean;
  marketContextSource: CsvDryRunPrototypeAnalysisMarketContextSource;
  exportAvailable: false;
}

export type ExecutionAutopsyTone =
  | "strength"
  | "risk"
  | "neutral"
  | "review";

export interface ExecutionAutopsyObservation {
  id: string;
  tone: ExecutionAutopsyTone;
  label: string;
  reason: string;
  executionIndex: number | null;
  sourcePointId: string | null;
  confidence: FunctionalEvidenceConfidence;
  evidence: FunctionalEvidenceRef[];
}

export interface ExecutionFeedbackAutopsyEnrichment {
  contractVersion: "execution_feedback_autopsy_enrichment_v1";
  symbol: string;
  tradeDirection: string;
  tradeId: string | null;
  lifecycleSummary: string;
  firstMistakeMoment: ExecutionAutopsyObservation | null;
  firstStrengthMoment: ExecutionAutopsyObservation | null;
  bestAdd: ExecutionAutopsyObservation | null;
  worstAdd: ExecutionAutopsyObservation | null;
  bestReduction: ExecutionAutopsyObservation | null;
  worstReduction: ExecutionAutopsyObservation | null;
  givebackObservation: ExecutionAutopsyObservation | null;
  positionSizeEscalationWarning: ExecutionAutopsyObservation | null;
  problemAfterExecutionNumber: number | null;
  observations: ExecutionAutopsyObservation[];
  evidence: FunctionalEvidenceRef[];
  marketContextUsed: false;
}

export type SyntheticTraderPersonaId =
  | "overtrader"
  | "clean_scalper"
  | "revenge_like_reentry_trader"
  | "poor_exit_trader"
  | "strong_risk_manager"
  | "inconsistent_sizer";

export interface SyntheticTraderPersona {
  id: SyntheticTraderPersonaId;
  label: string;
  expectedBehavior: string;
  requests: UserTradeAnalysisRequest[];
  limitations: string[];
}

export interface SyntheticTraderPersonaEvaluation {
  personaId: SyntheticTraderPersonaId;
  expectedBehavior: string;
  detectedBehavior: SyntheticTraderPersonaId;
  matched: boolean;
  confidence: FunctionalEvidenceConfidence;
  report: TraderAnalyticsReport;
  matchingObservations: string[];
  evidence: FunctionalEvidenceRef[];
  limitations: string[];
  marketContextUsed: false;
}

export type ExecutionMathScenarioStatus =
  | "passed"
  | "failed"
  | "validation_failed_as_expected";

export interface ExecutionMathScenarioResult {
  id: string;
  label: string;
  status: ExecutionMathScenarioStatus;
  requestStatus: RunExecutionFeedbackResult["status"] | "csv_checked";
  expectedClosedToFlat: boolean | null;
  actualClosedToFlat: boolean | null;
  finalPositionSize: number | null;
  grossRealizedPnl: number | null;
  invariantMessages: string[];
  evidence: FunctionalEvidenceRef[];
}

export interface ExecutionMathFuzzResult {
  contractVersion: "execution_math_deterministic_fuzz_v1";
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  scenarios: ExecutionMathScenarioResult[];
  marketContextUsed: false;
}

export type TruthSourceClaimStrength = "soft" | "strong";

export interface TruthSourceClaim {
  id: string;
  label: string;
  strength: TruthSourceClaimStrength;
  evidence: FunctionalEvidenceRef[];
  marketContextUsed: boolean;
}

export interface TruthSourceAuditIssue {
  claimId: string;
  severity: "warning" | "error";
  message: string;
}

export interface TruthSourceAudit {
  contractVersion: "functional_truth_source_audit_v1";
  passed: boolean;
  checkedClaimCount: number;
  issueCount: number;
  issues: TruthSourceAuditIssue[];
}

export type FunctionalFeatureReadinessStatus =
  | "product_ready_prototype"
  | "prototype_only"
  | "needs_real_data"
  | "blocked_for_live";

export interface FunctionalFeatureReadinessItem {
  id: string;
  label: string;
  status: FunctionalFeatureReadinessStatus;
  worksNow: string;
  blocksGoLive: string;
  verificationCoverage: string[];
  nextValidationAction: string;
  evidence: FunctionalEvidenceRef[];
}

export interface FunctionalFeatureReadinessDashboard {
  contractVersion: "functional_feature_readiness_dashboard_v1";
  generatedAt: string;
  summary: string;
  liveReadiness: "not_live_ready";
  items: FunctionalFeatureReadinessItem[];
  topGoLiveBlockers: string[];
  noExportPolicyMaintained: true;
  marketContextUsedForConclusions: false;
}

export interface RealDataCalibrationHarnessResult {
  contractVersion: "real_data_calibration_harness_v1";
  generatedAt: string;
  source: "synthetic_fixture" | "user_supplied_csv" | "provided_dry_run";
  broker: BrokerExecutionCsvFormat;
  detectedBrokerFormat: string;
  parseSucceeded: boolean;
  acceptedExecutionCount: number;
  rejectedRowCount: number;
  skippedRowCount: number;
  groupedTradeCount: number;
  correctionCount: number;
  confidenceState: ImportConfidenceStateModel;
  savedAnalysisPrototypeReady: boolean;
  topCalibrationBlockers: string[];
  privacySafetyNotes: string[];
  evidence: FunctionalEvidenceRef[];
  marketContextUsed: false;
}

export interface TraderFunctionalProductReadinessViewModel {
  contractVersion: "trader_functional_product_readiness_v1";
  generatedAt: string;
  planFile: "src/docs/trader-functional-product-readiness-plan.md";
  importState: ImportConfidenceStateModel;
  savedAnalysisPrototype: SavedAnalysisPrototype;
  personaEvaluations: SyntheticTraderPersonaEvaluation[];
  fuzzResult: ExecutionMathFuzzResult;
  truthSourceAudit: TruthSourceAudit;
  readinessDashboard: FunctionalFeatureReadinessDashboard;
  calibrationHarness: RealDataCalibrationHarnessResult;
  marketContextUsedForConclusions: false;
}

const DEFAULT_GENERATED_AT = "2026-05-03T18:00:00.000Z";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function evidence(args: {
  kind: FunctionalEvidenceKind;
  id: string;
  label: string;
  tradeId?: string;
  executionIndex?: number | null;
  rowNumber?: number | null;
  confidence?: FunctionalEvidenceConfidence;
}): FunctionalEvidenceRef {
  return {
    kind: args.kind,
    id: args.id,
    label: args.label,
    tradeId: args.tradeId,
    executionIndex: args.executionIndex ?? undefined,
    rowNumber: args.rowNumber ?? undefined,
    confidence: args.confidence ?? "high",
  };
}

function pointEvidence(
  point: ExecutionFeedbackPoint,
  kind: "risk" | "strength" | "feedback_point",
): FunctionalEvidenceRef {
  return evidence({
    kind,
    id: `point:${point.id}`,
    label: point.label,
    confidence: point.confidence === "high" ? "high" : "medium",
  });
}

function cloneRequest(
  request: UserTradeAnalysisRequest,
  args: {
    symbol: string;
    sessionDate?: string;
    sessionBucket?: string;
  },
): UserTradeAnalysisRequest {
  const clone = JSON.parse(JSON.stringify(request)) as UserTradeAnalysisRequest;

  return {
    ...clone,
    symbol: args.symbol,
    sessionContext: {
      ...clone.sessionContext,
      sessionDate: args.sessionDate ?? clone.sessionContext.sessionDate,
      sessionBucket: args.sessionBucket ?? clone.sessionContext.sessionBucket,
    },
    executions: clone.executions.map((execution) => ({
      ...execution,
      symbol: args.symbol,
    })),
  };
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => item !== null && item !== undefined);
}

function firstNumberFromPointEvidence(
  point: ExecutionFeedbackPoint | null,
): number | null {
  if (!point) {
    return null;
  }

  for (const value of Object.values(point.evidence)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      const found = value.find((item) => typeof item === "number");
      if (typeof found === "number" && Number.isFinite(found)) {
        return found;
      }
    }
  }

  return null;
}

function firstExecutionIndexForPoint(args: {
  point: ExecutionFeedbackPoint | null;
  facts: ExecutionFeedbackFacts | null;
}): number | null {
  const explicitIndex = firstNumberFromPointEvidence(args.point);

  if (
    explicitIndex !== null &&
    args.facts?.executions.some(
      (executionFact) => executionFact.executionIndex === explicitIndex,
    )
  ) {
    return explicitIndex;
  }

  if (args.point?.kind === "risk") {
    const firstAdverseAdd = args.facts?.executions.find(
      (executionFact) =>
        executionFact.action === "add" &&
        executionFact.priceWasAdverseVsPreviousAverageEntry,
    );
    const firstReduction = args.facts?.executions.find(
      (executionFact) =>
        executionFact.action === "partial_reduction" ||
        executionFact.action === "full_exit",
    );

    return (
      firstAdverseAdd?.executionIndex ??
      firstReduction?.executionIndex ??
      args.facts?.executions[0]?.executionIndex ??
      null
    );
  }

  return args.facts?.executions[0]?.executionIndex ?? null;
}

function observationFromPoint(args: {
  id: string;
  tone: ExecutionAutopsyTone;
  point: ExecutionFeedbackPoint;
  facts: ExecutionFeedbackFacts | null;
  fallbackReason?: string;
}): ExecutionAutopsyObservation {
  const pointKind = args.point.kind === "strength" ? "strength" : "risk";

  return {
    id: args.id,
    tone: args.tone,
    label: args.point.label,
    reason: args.fallbackReason ?? args.point.summary,
    executionIndex: firstExecutionIndexForPoint({
      point: args.point,
      facts: args.facts,
    }),
    sourcePointId: args.point.id,
    confidence: args.point.confidence === "high" ? "high" : "medium",
    evidence: [pointEvidence(args.point, pointKind)],
  };
}

function executionObservation(args: {
  id: string;
  tone: ExecutionAutopsyTone;
  label: string;
  reason: string;
  tradeId?: string | null;
  execution: ExecutionFeedbackExecutionFact;
  confidence?: FunctionalEvidenceConfidence;
}): ExecutionAutopsyObservation {
  return {
    id: args.id,
    tone: args.tone,
    label: args.label,
    reason: args.reason,
    executionIndex: args.execution.executionIndex,
    sourcePointId: null,
    confidence: args.confidence ?? "high",
    evidence: [
      evidence({
        kind: "execution",
        id: `execution:${args.execution.executionIndex}`,
        label: `${args.execution.side} ${args.execution.shares} @ ${args.execution.price}`,
        tradeId: args.tradeId ?? undefined,
        executionIndex: args.execution.executionIndex,
      }),
    ],
  };
}

function requestWithFacts(
  request: UserTradeAnalysisRequest,
  generatedAt: string,
): {
  result: RunExecutionFeedbackResult;
  facts: ExecutionFeedbackFacts | null;
} {
  const validation = validateTradeAnalysisRequest(request);
  const result = runExecutionFeedback(request, { generatedAt });

  if (!validation.valid || !validation.request || result.status !== "completed") {
    return {
      result,
      facts: null,
    };
  }

  return {
    result,
    facts: buildExecutionFeedbackFacts(validation.request),
  };
}

function previewBatchId(experience: CsvDryRunImportExperience): string {
  return `proto-import-${experience.preview.fileFingerprint.slice(0, 12)}`;
}

function tradeIdFor(args: {
  batchId: string;
  request: UserTradeAnalysisRequest;
  requestIndex: number;
}): string {
  return `${args.batchId}-trade-${args.requestIndex + 1}-${args.request.symbol.toLowerCase()}`;
}

export function buildImportConfidenceState(
  experience: CsvDryRunImportExperience | null | undefined,
  options?: {
    afterPrototypeSave?: boolean;
    rejected?: boolean;
  },
): ImportConfidenceStateModel {
  if (!experience || experience.csvText.trim().length === 0) {
    return {
      contractVersion: "import_confidence_state_v1",
      state: options?.rejected ? "rejected" : "empty",
      severity: options?.rejected ? "blocked" : "neutral",
      label: options?.rejected ? "Import rejected" : "No CSV loaded",
      primaryNextAction: options?.rejected
        ? "Start a new import when the source file is ready."
        : "Paste or upload trade execution CSV text.",
      allowedActions: ["load_csv", "choose_broker"],
      blockers: options?.rejected ? ["The import was explicitly rejected."] : [],
      reviewReasons: [],
      evidence: [
        evidence({
          kind: "state",
          id: "state:empty_import",
          label: "No accepted CSV content is available.",
        }),
      ],
      marketContextUsed: false,
    };
  }

  const importResult = experience.preview.importResult;
  const blockers = [
    ...experience.confidenceGate.blockedReasons,
    ...(importResult.rejectedRowCount > 0
      ? [`${importResult.rejectedRowCount} row(s) were rejected.`]
      : []),
    ...(experience.preview.savedTradePreview.rejectedCount > 0
      ? [
          `${experience.preview.savedTradePreview.rejectedCount} grouped trade(s) failed request validation.`,
        ]
      : []),
    ...(importResult.acceptedExecutionCount === 0
      ? ["No accepted executions were parsed."]
      : []),
    ...(importResult.requestCount === 0
      ? ["No grouped trades were reconstructed."]
      : []),
  ];
  const reviewReasons = [
    ...experience.confidenceGate.reviewReasons,
    ...(importResult.skippedRowCount > 0
      ? [`${importResult.skippedRowCount} non-trade or unsupported row(s) were skipped.`]
      : []),
    ...(importResult.mappingConfidence.level === "low"
      ? ["Column mapping confidence is low."]
      : []),
  ];
  const baseEvidence = [
    evidence({
      kind: "metric",
      id: "metric:accepted_execution_count",
      label: `${importResult.acceptedExecutionCount} accepted execution(s).`,
    }),
    evidence({
      kind: "metric",
      id: "metric:grouped_trade_count",
      label: `${importResult.requestCount} grouped trade(s).`,
    }),
    evidence({
      kind: "state",
      id: `confidence_gate:${experience.confidenceGate.status}`,
      label: experience.confidenceGate.title,
    }),
  ];

  if (options?.rejected) {
    return {
      contractVersion: "import_confidence_state_v1",
      state: "rejected",
      severity: "blocked",
      label: "Import rejected",
      primaryNextAction: "Start over with a corrected import file.",
      allowedActions: ["load_csv", "choose_broker"],
      blockers: ["The import was explicitly rejected.", ...blockers],
      reviewReasons,
      evidence: baseEvidence,
      marketContextUsed: false,
    };
  }

  if (blockers.length > 0 || experience.confidenceGate.status === "blocked") {
    return {
      contractVersion: "import_confidence_state_v1",
      state: "blocked",
      severity: "blocked",
      label: "Import blocked",
      primaryNextAction: "Fix rejected rows or mapping issues before analysis.",
      allowedActions: ["repair_rows", "adjust_mapping", "load_csv"],
      blockers,
      reviewReasons,
      evidence: baseEvidence,
      marketContextUsed: false,
    };
  }

  if (options?.afterPrototypeSave) {
    return {
      contractVersion: "import_confidence_state_v1",
      state: "prototype_saved",
      severity: "ready",
      label: "Prototype analysis saved",
      primaryNextAction: "Open the generated review and progress views.",
      allowedActions: ["open_review", "open_progress", "start_new_import"],
      blockers: [],
      reviewReasons,
      evidence: baseEvidence,
      marketContextUsed: false,
    };
  }

  if (reviewReasons.length > 0 || experience.confidenceGate.status === "needs_review") {
    return {
      contractVersion: "import_confidence_state_v1",
      state: "needs_review",
      severity: "review",
      label: "Import needs review",
      primaryNextAction: "Review skipped rows, open positions, or mapping warnings before saving.",
      allowedActions: ["review_import", "repair_rows", "continue_to_analysis"],
      blockers: [],
      reviewReasons,
      evidence: baseEvidence,
      marketContextUsed: false,
    };
  }

  const state = options?.afterPrototypeSave
    ? "prototype_saved"
    : "ready_for_analysis";

  return {
    contractVersion: "import_confidence_state_v1",
    state,
    severity: "ready",
    label:
      state === "prototype_saved"
        ? "Prototype analysis saved"
        : "Ready for analysis",
    primaryNextAction:
      state === "prototype_saved"
        ? "Open the generated review and progress views."
        : "Generate the saved-analysis prototype.",
    allowedActions:
      state === "prototype_saved"
        ? ["open_review", "open_progress", "start_new_import"]
        : ["generate_saved_analysis_prototype", "review_import"],
    blockers: [],
    reviewReasons: [],
    evidence: baseEvidence,
    marketContextUsed: false,
  };
}

export function buildExecutionFeedbackAutopsyEnrichment(args: {
  summary: ExecutionFeedbackSummary;
  facts?: ExecutionFeedbackFacts | null;
  tradeId?: string | null;
}): ExecutionFeedbackAutopsyEnrichment {
  const facts = args.facts ?? null;
  const firstRisk = args.summary.points.risks[0] ?? null;
  const firstStrength = args.summary.points.strengths[0] ?? null;
  const addExecutions =
    facts?.executions.filter((executionFact) => executionFact.action === "add") ??
    [];
  const reductionExecutions =
    facts?.executions.filter(
      (executionFact) =>
        executionFact.action === "partial_reduction" ||
        executionFact.action === "full_exit",
    ) ?? [];
  const favorableAdds = addExecutions.filter(
    (executionFact) => executionFact.priceWasFavorableVsPreviousAverageEntry,
  );
  const adverseAdds = addExecutions.filter(
    (executionFact) => executionFact.priceWasAdverseVsPreviousAverageEntry,
  );
  const profitableReductions = reductionExecutions.filter(
    (executionFact) => executionFact.priceWasFavorableVsPreviousAverageEntry,
  );
  const losingReductions = reductionExecutions.filter(
    (executionFact) => executionFact.priceWasAdverseVsPreviousAverageEntry,
  );
  const bestAdd =
    favorableAdds.length > 0
      ? executionObservation({
          id: "best_add",
          tone: "strength",
          label: "Best add",
          reason: "This add improved the average open position from an execution-only perspective.",
          tradeId: args.tradeId,
          execution: favorableAdds[0],
        })
      : null;
  const worstAdd =
    adverseAdds.length > 0
      ? executionObservation({
          id: "worst_add",
          tone: "risk",
          label: "Worst add",
          reason: "This add increased size after price had moved against the current average entry.",
          tradeId: args.tradeId,
          execution: adverseAdds[0],
        })
      : null;
  const bestReduction =
    profitableReductions.length > 0
      ? executionObservation({
          id: "best_reduction",
          tone: "strength",
          label: "Best reduction",
          reason: "This reduction locked in realized P/L against the current average entry.",
          tradeId: args.tradeId,
          execution: profitableReductions[0],
        })
      : null;
  const worstReduction =
    losingReductions.length > 0
      ? executionObservation({
          id: "worst_reduction",
          tone: "risk",
          label: "Worst reduction",
          reason: "This reduction realized a loss against the current average entry.",
          tradeId: args.tradeId,
          execution: losingReductions[0],
        })
      : null;
  const firstMistakeMoment = firstRisk
    ? observationFromPoint({
        id: "first_mistake",
        tone: "risk",
        point: firstRisk,
        facts,
      })
    : null;
  const firstStrengthMoment = firstStrength
    ? observationFromPoint({
        id: "first_strength",
        tone: "strength",
        point: firstStrength,
        facts,
      })
    : null;
  const givebackObservation =
    args.summary.riskFacts.profitableReductionCount > 0 &&
    args.summary.executionOnlyPnl.grossRealizedPnl < 0
      ? {
          id: "giveback_after_profit_reduction",
          tone: "review" as const,
          label: "Profit was reduced but final trade stayed negative",
          reason:
            "Execution-only facts show at least one profitable reduction, but total realized P/L finished below zero.",
          executionIndex:
            profitableReductions[profitableReductions.length - 1]
              ?.executionIndex ?? null,
          sourcePointId: null,
          confidence: "medium" as const,
          evidence: [
            evidence({
              kind: "metric",
              id: "metric:gross_realized_pnl",
              label: `Gross realized P/L ${args.summary.executionOnlyPnl.grossRealizedPnl}.`,
            }),
          ],
        }
      : null;
  const positionSizeEscalationWarning =
    (args.summary.sizing.sizeExpansionRatioFromInitialToMax ?? 0) >= 2
      ? {
          id: "position_size_escalation",
          tone: "risk" as const,
          label: "Position size escalated",
          reason: `Max position grew to ${args.summary.sizing.sizeExpansionRatioFromInitialToMax}x the initial entry size.`,
          executionIndex:
            facts?.executions.find(
              (executionFact) =>
                executionFact.currentPositionSize ===
                args.summary.lifecycle.maxPositionSize,
            )?.executionIndex ?? null,
          sourcePointId: null,
          confidence: "high" as const,
          evidence: [
            evidence({
              kind: "metric",
              id: "metric:size_expansion_ratio",
              label: `Size expansion ratio ${args.summary.sizing.sizeExpansionRatioFromInitialToMax}.`,
            }),
          ],
        }
      : null;
  const problemAfterExecutionNumber =
    firstMistakeMoment?.executionIndex ??
    worstAdd?.executionIndex ??
    worstReduction?.executionIndex ??
    null;
  const observations = compact([
    firstMistakeMoment,
    firstStrengthMoment,
    bestAdd,
    worstAdd,
    bestReduction,
    worstReduction,
    givebackObservation,
    positionSizeEscalationWarning,
  ]);

  return {
    contractVersion: "execution_feedback_autopsy_enrichment_v1",
    symbol: args.summary.symbol,
    tradeDirection: args.summary.tradeDirection,
    tradeId: args.tradeId ?? null,
    lifecycleSummary: `${args.summary.executionCount} execution(s), max size ${args.summary.lifecycle.maxPositionSize}, final position ${args.summary.lifecycle.finalPositionSize}, gross realized P/L ${round(args.summary.executionOnlyPnl.grossRealizedPnl, 2)}.`,
    firstMistakeMoment,
    firstStrengthMoment,
    bestAdd,
    worstAdd,
    bestReduction,
    worstReduction,
    givebackObservation,
    positionSizeEscalationWarning,
    problemAfterExecutionNumber,
    observations,
    evidence: observations.flatMap((observation) => observation.evidence),
    marketContextUsed: false,
  };
}

export function buildSavedAnalysisPrototypeFromDryRun(args: {
  experience: CsvDryRunImportExperience;
  generatedAt?: string;
}): SavedAnalysisPrototype {
  const generatedAt = args.generatedAt ?? DEFAULT_GENERATED_AT;
  const preSaveState = buildImportConfidenceState(args.experience);
  const batchId = previewBatchId(args.experience);
  const canCreate =
    preSaveState.state === "ready_for_analysis" ||
    preSaveState.state === "needs_review";
  const generatedTradeIds: string[] = [];
  const generatedTradeLabels: string[] = [];
  const feedbackSummaryIds: string[] = [];
  const feedbackStatuses: Array<RunExecutionFeedbackResult["status"]> = [];
  const autopsies: ExecutionFeedbackAutopsyEnrichment[] = [];
  const summaries: TraderAnalyticsReportSummaryInput[] = [];
  const evidenceRefs: FunctionalEvidenceRef[] = [...preSaveState.evidence];

  if (canCreate) {
    args.experience.preview.importResult.requests.forEach((request, requestIndex) => {
      const tradeId = tradeIdFor({ batchId, request, requestIndex });
      const { result, facts } = requestWithFacts(request, generatedAt);
      generatedTradeIds.push(tradeId);
      generatedTradeLabels.push(`${request.symbol} ${request.tradeDirection}`);
      feedbackStatuses.push(result.status);
      evidenceRefs.push(
        evidence({
          kind: "trade",
          id: tradeId,
          label: `${request.symbol} trade ${requestIndex + 1}`,
          tradeId,
        }),
      );

      if (result.status === "completed" && result.summary) {
        feedbackSummaryIds.push(`${tradeId}-summary`);
        summaries.push({
          requestIndex,
          summary: result.summary,
        });
        autopsies.push(
          buildExecutionFeedbackAutopsyEnrichment({
            summary: result.summary,
            facts,
            tradeId,
          }),
        );
      }
    });
  }

  const analyticsReport =
    summaries.length > 0
      ? runTraderAnalyticsReport({
          source: `prototype_saved_analysis:${batchId}`,
          generatedAt,
          summaries,
        })
      : null;
  const state =
    analyticsReport !== null
      ? buildImportConfidenceState(args.experience, { afterPrototypeSave: true })
      : preSaveState;

  return {
    contractVersion: "saved_analysis_prototype_v1",
    importBatchId: batchId,
    sourceBroker: args.experience.broker,
    preSaveState,
    state,
    generatedTradeIds,
    generatedTradeLabels,
    feedbackSummaryIds,
    feedbackStatuses,
    autopsies,
    analyticsReportStatus: analyticsReport ? "created" : "not_created",
    analyticsReport,
    reviewQueueItemCount: args.experience.postImportReviewQueuePreview.totalCount,
    limitations: [
      "Prototype only: this does not write to a production database.",
      "Execution-only analytics were generated from parsed CSV executions.",
      "Market context, candles, support/resistance, VWAP/EMA, and market structure were not used.",
      "No export or download feature is provided.",
    ],
    evidence: evidenceRefs,
    isPrototypeOnly: true,
    writesProductionDatabase: false,
    marketContextUsed: false,
    exportAvailable: false,
  };
}

function prototypePanelState(args: {
  confidenceState: ImportConfidenceStateModel;
  prototypeGenerated: boolean;
}): CsvDryRunPrototypeAnalysisPanelState {
  if (args.prototypeGenerated) {
    return "prototype_generated";
  }

  if (args.confidenceState.state === "blocked") {
    return "blocked";
  }

  if (args.confidenceState.state === "needs_review") {
    return "needs_review";
  }

  if (args.confidenceState.state === "ready_for_analysis") {
    return "ready";
  }

  return "empty";
}

function prototypePanelNextAction(
  state: CsvDryRunPrototypeAnalysisPanelState,
): string {
  if (state === "prototype_generated") {
    return "Review the generated execution autopsy, then attach server-side daily/4h decision review facts when available.";
  }

  if (state === "ready") {
    return "Generate the prototype analysis preview from reconstructed trades.";
  }

  if (state === "needs_review") {
    return "Review import warnings, then use this as a prototype preview before any production save exists.";
  }

  if (state === "blocked") {
    return "Repair rejected rows or mapping issues before analysis.";
  }

  return "Paste or upload execution CSV text.";
}

function prototypePanelStateLabel(
  state: CsvDryRunPrototypeAnalysisPanelState,
): string {
  if (state === "prototype_generated") {
    return "Prototype analysis generated";
  }

  if (state === "ready") {
    return "Ready for prototype analysis";
  }

  if (state === "needs_review") {
    return "Prototype available with review warnings";
  }

  if (state === "blocked") {
    return "Prototype analysis blocked";
  }

  return "No import loaded";
}

function autopsyObservationPriority(
  observation: ExecutionAutopsyObservation,
): number {
  if (observation.tone === "risk") {
    return observation.id === "first_mistake" ? 10 : 20;
  }

  if (observation.tone === "review") {
    return 30;
  }

  if (observation.tone === "strength") {
    return 40;
  }

  return 50;
}

function autopsyObservationFinding(args: {
  autopsy: ExecutionFeedbackAutopsyEnrichment;
  observation: ExecutionAutopsyObservation;
}): CsvDryRunPrototypeAnalysisFinding {
  return {
    id: `${args.autopsy.tradeId ?? args.autopsy.symbol}:${args.observation.id}`,
    tone: args.observation.tone,
    category: "execution_autopsy",
    title: args.observation.label,
    summary: args.observation.reason,
    tradeId: args.autopsy.tradeId,
    executionIndex: args.observation.executionIndex,
    evidence: args.observation.evidence.map((item) => item.label),
  };
}

function buildPrototypeAutopsyFindings(
  prototype: SavedAnalysisPrototype | null,
): CsvDryRunPrototypeAnalysisFinding[] {
  if (!prototype) {
    return [];
  }

  return prototype.autopsies
    .flatMap((autopsy) =>
      autopsy.observations.map((observation) => ({
        autopsy,
        observation,
      })),
    )
    .sort(
      (left, right) =>
        autopsyObservationPriority(left.observation) -
          autopsyObservationPriority(right.observation) ||
        (left.observation.executionIndex ?? 999) -
          (right.observation.executionIndex ?? 999) ||
        left.autopsy.symbol.localeCompare(right.autopsy.symbol),
    )
    .slice(0, 6)
    .map(autopsyObservationFinding);
}

function decisionReviewFinding(args: {
  review: CsvDryRunPrototypeDecisionReviewInput;
  insight: CsvDryRunPrototypeDecisionReviewInsightInput;
}): CsvDryRunPrototypeAnalysisFinding {
  const tradeWindowEvidence =
    args.review.tradeWindowEvidenceSource === "execution_only_fallback"
      ? ["tradeWindowEvidenceSource=execution_only_fallback"]
      : args.review.tradeWindowEvidenceSource === "levels_system_trade_window"
        ? ["tradeWindowEvidenceSource=levels_system_trade_window"]
        : [];

  return {
    id: `${args.review.tradeId ?? "decision-review"}:${args.insight.id}`,
    tone: args.insight.tone,
    category:
      args.insight.category === "market_context"
        ? "market_context"
        : "decision_review",
    title: args.insight.title,
    summary: args.insight.summary,
    tradeId: args.review.tradeId ?? null,
    executionIndex: null,
    evidence: [
      ...(args.insight.evidence ?? []),
      ...tradeWindowEvidence,
      ...(args.review.candleQualityNotes ?? []),
    ],
  };
}

function decisionReviewMarketContextSource(
  reviews: CsvDryRunPrototypeDecisionReviewInput[],
): CsvDryRunPrototypeAnalysisMarketContextSource {
  const sources = new Set(
    reviews.map((review) => review.marketContextSource ?? "none"),
  );

  if (sources.size === 0 || (sources.size === 1 && sources.has("none"))) {
    return "none";
  }

  if (sources.size === 1 && sources.has("levels_system_daily_4h")) {
    return "levels_system_daily_4h";
  }

  return "mixed";
}

function buildDecisionReviewFindings(
  reviews: CsvDryRunPrototypeDecisionReviewInput[],
): CsvDryRunPrototypeAnalysisFinding[] {
  return reviews
    .flatMap((review) =>
      review.insights.map((insight) => decisionReviewFinding({ review, insight })),
    )
    .slice(0, 6);
}

function prototypePanelLimitations(args: {
  prototype: SavedAnalysisPrototype | null;
  hasDecisionReview: boolean;
}): string[] {
  const prototypeLimitations = args.prototype?.limitations ?? [
    "Prototype only: this does not write to a production database.",
    "No export or download feature is provided.",
  ];
  const marketContextLimitation = args.hasDecisionReview
    ? "Decision review facts must be precomputed server-side from levels-system daily/4h support/resistance context; VWAP/EMA feedback remains disabled."
    : "Market-context decision review is not run in this browser dry run; server-side trade-analysis can supply precomputed daily/4h decision review facts.";

  return [
    ...prototypeLimitations.filter(
      (limitation) =>
        !limitation.includes("Market context") &&
        !limitation.includes("support/resistance") &&
        !limitation.includes("VWAP/EMA"),
    ),
    marketContextLimitation,
    "Lower-timeframe support/resistance coaching is intentionally deferred.",
  ];
}

export function buildCsvDryRunPrototypeAnalysisPanel(args: {
  experience: CsvDryRunImportExperience | null | undefined;
  generatedAt?: string;
  decisionReviews?: CsvDryRunPrototypeDecisionReviewInput[];
}): CsvDryRunPrototypeAnalysisPanel {
  const confidenceState = buildImportConfidenceState(args.experience);
  const canGeneratePrototype =
    Boolean(args.experience) &&
    (confidenceState.state === "ready_for_analysis" ||
      confidenceState.state === "needs_review");
  const prototype =
    canGeneratePrototype && args.experience
      ? buildSavedAnalysisPrototypeFromDryRun({
          experience: args.experience,
          generatedAt: args.generatedAt,
        })
      : null;
  const prototypeGenerated = prototype?.analyticsReportStatus === "created";
  const state = prototypePanelState({
    confidenceState,
    prototypeGenerated,
  });
  const decisionReviews = args.decisionReviews ?? [];
  const marketContextSource = decisionReviewMarketContextSource(decisionReviews);
  const marketContextUsed = marketContextSource !== "none";

  return {
    contractVersion: "csv_dry_run_prototype_analysis_panel_v1",
    state,
    stateLabel: prototypePanelStateLabel(state),
    primaryNextAction: prototypePanelNextAction(state),
    canGeneratePrototype,
    prototypeGenerated,
    generatedTradeCount: prototype?.generatedTradeIds.length ?? 0,
    feedbackSummaryCount: prototype?.feedbackSummaryIds.length ?? 0,
    reviewQueueItemCount:
      prototype?.reviewQueueItemCount ??
      args.experience?.postImportReviewQueuePreview.totalCount ??
      0,
    topAutopsyFindings: buildPrototypeAutopsyFindings(prototype),
    topDecisionReviewInsights: buildDecisionReviewFindings(decisionReviews),
    coachingHeadline:
      decisionReviews.find((review) => review.coachingHeadline)
        ?.coachingHeadline ?? null,
    fixFirstBehaviorId:
      decisionReviews.find((review) => review.fixFirstBehaviorId)
        ?.fixFirstBehaviorId ?? null,
    topImportBlockers: confidenceState.blockers.slice(0, 5),
    topReviewReasons: confidenceState.reviewReasons.slice(0, 5),
    limitations: prototypePanelLimitations({
      prototype,
      hasDecisionReview: decisionReviews.length > 0,
    }),
    evidence: [...confidenceState.evidence, ...(prototype?.evidence ?? [])],
    writesProductionDatabase: false,
    marketContextUsed,
    marketContextSource,
    exportAvailable: false,
  };
}

export function buildSyntheticTraderPersonas(): SyntheticTraderPersona[] {
  return [
    {
      id: "overtrader",
      label: "Overtrader",
      expectedBehavior: "Rapid-fire execution clusters and too many decisions in one trade.",
      requests: [
        cloneRequest(rapidFireExecutionCluster as UserTradeAnalysisRequest, {
          symbol: "OTRD",
        }),
        cloneRequest(rapidFireExecutionCluster as UserTradeAnalysisRequest, {
          symbol: "OTR2",
        }),
      ],
      limitations: ["Synthetic execution timing only; no market setup context is used."],
    },
    {
      id: "clean_scalper",
      label: "Clean scalper",
      expectedBehavior: "Simple single-entry winners with decisive full exits.",
      requests: [
        cloneRequest(longWinner as UserTradeAnalysisRequest, {
          symbol: "CLN1",
        }),
        cloneRequest(shortWinner as UserTradeAnalysisRequest, {
          symbol: "CLN2",
        }),
      ],
      limitations: ["Synthetic winners do not prove setup quality."],
    },
    {
      id: "revenge_like_reentry_trader",
      label: "Revenge-like re-entry trader",
      expectedBehavior: "Repeated adds before reduction while price moves against the position.",
      requests: [
        cloneRequest(repeatedAddsBeforeReduction as UserTradeAnalysisRequest, {
          symbol: "RVG1",
        }),
        cloneRequest(longLoser as UserTradeAnalysisRequest, {
          symbol: "RVG2",
        }),
      ],
      limitations: ["The app infers execution pressure, not trader emotion."],
    },
    {
      id: "poor_exit_trader",
      label: "Poor exit trader",
      expectedBehavior: "Open leftovers or reductions that leave the trade unresolved.",
      requests: [
        cloneRequest(openPosition as UserTradeAnalysisRequest, {
          symbol: "EXIT",
        }),
        cloneRequest(repeatedAddsBeforeReduction as UserTradeAnalysisRequest, {
          symbol: "EXI2",
        }),
      ],
      limitations: ["Exit quality is execution-only and does not include candle targets."],
    },
    {
      id: "strong_risk_manager",
      label: "Strong risk manager",
      expectedBehavior: "Partial exits and controlled reductions with positive realized behavior.",
      requests: [
        cloneRequest(partialExits as UserTradeAnalysisRequest, {
          symbol: "RISK",
        }),
        cloneRequest(longWinner as UserTradeAnalysisRequest, {
          symbol: "RSK2",
        }),
      ],
      limitations: ["Risk management is inferred from order sequence only."],
    },
    {
      id: "inconsistent_sizer",
      label: "Inconsistent sizer",
      expectedBehavior: "Large share-size variation across entries/adds.",
      requests: [
        cloneRequest(inconsistentShareSizing as UserTradeAnalysisRequest, {
          symbol: "SIZE",
        }),
        cloneRequest(inconsistentShareSizing as UserTradeAnalysisRequest, {
          symbol: "SIZ2",
        }),
      ],
      limitations: ["Sizing assessment does not know the trader's account equity."],
    },
  ];
}

function detectDominantPersona(report: TraderAnalyticsReport): SyntheticTraderPersonaId {
  const behavior = report.executionBehavior;
  const strengths = report.strengths;
  const requestCount = Math.max(1, report.sampleSize.completedTradeCount);

  if (behavior.inconsistentShareSizingTradeCount / requestCount >= 0.5) {
    return "inconsistent_sizer";
  }

  if (behavior.rapidFireExecutionTradeCount / requestCount >= 0.5) {
    return "overtrader";
  }

  if (behavior.openPositionLeftoverTradeCount > 0) {
    return "poor_exit_trader";
  }

  if (
    behavior.adversePriceAddTradeCount > 0 ||
    behavior.overbuiltPositionTradeCount > 0 ||
    behavior.multipleAddsBeforeReductionTradeCount > 0
  ) {
    return "revenge_like_reentry_trader";
  }

  if (behavior.allOrNothingExitAfterManyAddsTradeCount > 0) {
    return "poor_exit_trader";
  }

  if (
    strengths.structuredPartialExitSequenceCount > 0 ||
    strengths.earlyPositionRiskReductionCount > 0
  ) {
    return "strong_risk_manager";
  }

  if (
    strengths.cleanSingleEntryFullExitCount / requestCount >= 0.5 &&
    report.topRisks.length === 0
  ) {
    return "clean_scalper";
  }

  return "clean_scalper";
}

function personaObservations(report: TraderAnalyticsReport): string[] {
  return [
    ...report.topRisks.slice(0, 3).map((risk) => risk.label),
    ...report.topStrengths.slice(0, 3).map((strength) => strength.label),
  ];
}

export function evaluateSyntheticTraderPersonas(
  personas = buildSyntheticTraderPersonas(),
  generatedAt = DEFAULT_GENERATED_AT,
): SyntheticTraderPersonaEvaluation[] {
  return personas.map((persona) => {
    const report = runTraderAnalyticsReport({
      source: `synthetic_persona:${persona.id}`,
      generatedAt,
      requests: persona.requests,
    });
    const detectedBehavior = detectDominantPersona(report);
    const matched = detectedBehavior === persona.id;

    return {
      personaId: persona.id,
      expectedBehavior: persona.expectedBehavior,
      detectedBehavior,
      matched,
      confidence: matched ? "high" : "medium",
      report,
      matchingObservations: personaObservations(report),
      evidence: [
        evidence({
          kind: "metric",
          id: `persona:${persona.id}:completed_trade_count`,
          label: `${report.sampleSize.completedTradeCount} completed synthetic trade(s).`,
        }),
        evidence({
          kind: "metric",
          id: `persona:${persona.id}:risk_count`,
          label: `${report.topRisks.length} risk category row(s).`,
        }),
      ],
      limitations: persona.limitations,
      marketContextUsed: false,
    };
  });
}

function scenarioFromRequest(args: {
  id: string;
  label: string;
  request: UserTradeAnalysisRequest;
  expectedClosedToFlat: boolean;
  generatedAt: string;
}): ExecutionMathScenarioResult {
  const result = runExecutionFeedback(args.request, {
    generatedAt: args.generatedAt,
  });
  const summary = result.summary;
  const invariantMessages: string[] = [];

  if (result.status !== "completed" || !summary) {
    invariantMessages.push("Expected a completed execution feedback summary.");
  } else {
    if (!Number.isFinite(summary.executionOnlyPnl.grossRealizedPnl)) {
      invariantMessages.push("Gross realized P/L must be finite.");
    }

    if (summary.lifecycle.closedToFlat !== args.expectedClosedToFlat) {
      invariantMessages.push("Closed-to-flat state did not match expectation.");
    }

    if (summary.lifecycle.finalPositionSize < 0) {
      invariantMessages.push("Final position size must not be negative.");
    }

    if (!summary.limitations.some((limitation) => limitation.includes("Market context"))) {
      invariantMessages.push("Execution-only limitations must mention missing market context.");
    }
  }

  return {
    id: args.id,
    label: args.label,
    status: invariantMessages.length === 0 ? "passed" : "failed",
    requestStatus: result.status,
    expectedClosedToFlat: args.expectedClosedToFlat,
    actualClosedToFlat: summary?.lifecycle.closedToFlat ?? null,
    finalPositionSize: summary?.lifecycle.finalPositionSize ?? null,
    grossRealizedPnl: summary?.executionOnlyPnl.grossRealizedPnl ?? null,
    invariantMessages:
      invariantMessages.length > 0
        ? invariantMessages
        : ["Execution math invariants passed."],
    evidence: [
      evidence({
        kind: "metric",
        id: `scenario:${args.id}:status`,
        label: `Feedback status ${result.status}.`,
      }),
    ],
  };
}

function invalidScenario(args: {
  generatedAt: string;
}): ExecutionMathScenarioResult {
  const invalidRequest = {
    symbol: "BAD",
    tradeDirection: "long",
    sessionContext: {
      sessionDate: "2026-05-01",
      sessionBucket: "market_open",
    },
    executions: [
      {
        symbol: "BAD",
        timestamp: "2026-05-01T13:30:00.000Z",
        side: "sell",
        shares: 100,
        price: 10,
      },
    ],
  } as UserTradeAnalysisRequest;
  const result = runExecutionFeedback(invalidRequest, {
    generatedAt: args.generatedAt,
  });
  const status =
    result.status === "validation_failed"
      ? "validation_failed_as_expected"
      : "failed";

  return {
    id: "invalid_exit_before_entry",
    label: "Invalid exit before entry",
    status,
    requestStatus: result.status,
    expectedClosedToFlat: null,
    actualClosedToFlat: null,
    finalPositionSize: null,
    grossRealizedPnl: null,
    invariantMessages:
      status === "validation_failed_as_expected"
        ? ["Invalid over-reduction stayed out of execution facts."]
        : ["Invalid sequence unexpectedly passed validation."],
    evidence: [
      evidence({
        kind: "metric",
        id: "scenario:invalid_exit_before_entry:validation",
        label: `Validation status ${result.status}.`,
      }),
    ],
  };
}

function invalidCsvScenario(): ExecutionMathScenarioResult {
  const experience = buildCsvDryRunImportExperience({
    broker: "generic_execution_csv",
    csvText: [
      "Date,Time,Symbol,Side,Quantity,Price",
      "2026-05-01,09:30:00,,Buy,100,10.00",
      "2026-05-01,09:35:00,ABCD,Sell,100,11.00",
    ].join("\n"),
  });
  const passed =
    experience.preview.importResult.rejectedRowCount > 0 &&
    experience.preview.importResult.acceptedExecutionCount >= 0;

  return {
    id: "csv_rejected_rows_do_not_become_facts",
    label: "CSV rejected rows stay rejected",
    status: passed ? "passed" : "failed",
    requestStatus: "csv_checked",
    expectedClosedToFlat: null,
    actualClosedToFlat: null,
    finalPositionSize: null,
    grossRealizedPnl: null,
    invariantMessages: passed
      ? ["Rejected CSV rows did not become accepted executions."]
      : ["A rejected row was not identified."],
    evidence: [
      evidence({
        kind: "metric",
        id: "scenario:csv_rejected_rows:rejected_count",
        label: `${experience.preview.importResult.rejectedRowCount} rejected row(s).`,
      }),
    ],
  };
}

export function runDeterministicExecutionMathFuzzScenarios(
  generatedAt = DEFAULT_GENERATED_AT,
): ExecutionMathFuzzResult {
  const scenarios = [
    scenarioFromRequest({
      id: "long_winner",
      label: "Long winner",
      request: longWinner as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "long_loser",
      label: "Long loser",
      request: longLoser as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "short_winner",
      label: "Short winner",
      request: shortWinner as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "short_loser",
      label: "Short loser",
      request: shortLoser as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "partial_exits",
      label: "Partial exits",
      request: partialExits as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "open_leftover",
      label: "Open leftover",
      request: openPosition as UserTradeAnalysisRequest,
      expectedClosedToFlat: false,
      generatedAt,
    }),
    scenarioFromRequest({
      id: "same_timestamp_rapid_fire",
      label: "Rapid-fire same-session fills",
      request: rapidFireExecutionCluster as UserTradeAnalysisRequest,
      expectedClosedToFlat: true,
      generatedAt,
    }),
    invalidScenario({ generatedAt }),
    invalidCsvScenario(),
  ];
  const failedCount = scenarios.filter((scenario) => scenario.status === "failed")
    .length;

  return {
    contractVersion: "execution_math_deterministic_fuzz_v1",
    scenarioCount: scenarios.length,
    passedCount: scenarios.length - failedCount,
    failedCount,
    allPassed: failedCount === 0,
    scenarios,
    marketContextUsed: false,
  };
}

export function auditFunctionalTruthSources(
  claims: TruthSourceClaim[],
): TruthSourceAudit {
  const issues = claims.flatMap((claim) => {
    const claimIssues: TruthSourceAuditIssue[] = [];

    if (claim.strength === "strong" && claim.evidence.length === 0) {
      claimIssues.push({
        claimId: claim.id,
        severity: "error",
        message: "Strong claim has no evidence references.",
      });
    }

    if (claim.marketContextUsed) {
      claimIssues.push({
        claimId: claim.id,
        severity: "error",
        message: "Execution-only product claim used market context.",
      });
    }

    return claimIssues;
  });

  return {
    contractVersion: "functional_truth_source_audit_v1",
    passed: issues.length === 0,
    checkedClaimCount: claims.length,
    issueCount: issues.length,
    issues,
  };
}

function claimsFromFunctionalReadiness(args: {
  importState: ImportConfidenceStateModel;
  prototype: SavedAnalysisPrototype;
  personas: SyntheticTraderPersonaEvaluation[];
  fuzz: ExecutionMathFuzzResult;
  calibration: RealDataCalibrationHarnessResult;
}): TruthSourceClaim[] {
  return [
    {
      id: "import_state",
      label: args.importState.label,
      strength: "strong",
      evidence: args.importState.evidence,
      marketContextUsed: args.importState.marketContextUsed,
    },
    {
      id: "saved_analysis_prototype",
      label: `Saved-analysis prototype status ${args.prototype.analyticsReportStatus}.`,
      strength: "strong",
      evidence: args.prototype.evidence,
      marketContextUsed: args.prototype.marketContextUsed,
    },
    ...args.prototype.autopsies.flatMap((autopsy) =>
      autopsy.observations.map((observation) => ({
        id: `autopsy:${autopsy.tradeId ?? autopsy.symbol}:${observation.id}`,
        label: observation.label,
        strength: "strong" as const,
        evidence: observation.evidence,
        marketContextUsed: autopsy.marketContextUsed,
      })),
    ),
    ...args.personas.map((persona) => ({
      id: `persona:${persona.personaId}`,
      label: `${persona.personaId} detected as ${persona.detectedBehavior}.`,
      strength: "strong" as const,
      evidence: persona.evidence,
      marketContextUsed: persona.marketContextUsed,
    })),
    {
      id: "fuzz_result",
      label: `${args.fuzz.passedCount}/${args.fuzz.scenarioCount} deterministic scenarios passed.`,
      strength: "strong",
      evidence: args.fuzz.scenarios.flatMap((scenario) => scenario.evidence),
      marketContextUsed: args.fuzz.marketContextUsed,
    },
    {
      id: "calibration_harness",
      label: `Calibration harness parsed ${args.calibration.acceptedExecutionCount} execution(s).`,
      strength: "strong",
      evidence: args.calibration.evidence,
      marketContextUsed: args.calibration.marketContextUsed,
    },
  ];
}

export function buildFunctionalFeatureReadinessDashboard(args?: {
  generatedAt?: string;
  calibration?: RealDataCalibrationHarnessResult;
  fuzz?: ExecutionMathFuzzResult;
  personaEvaluations?: SyntheticTraderPersonaEvaluation[];
}): FunctionalFeatureReadinessDashboard {
  const generatedAt = args?.generatedAt ?? DEFAULT_GENERATED_AT;
  const calibration =
    args?.calibration ?? runRealDataCalibrationHarness({ generatedAt });
  const fuzz =
    args?.fuzz ?? runDeterministicExecutionMathFuzzScenarios(generatedAt);
  const personaEvaluations =
    args?.personaEvaluations ?? evaluateSyntheticTraderPersonas(undefined, generatedAt);
  const personaMatchCount = personaEvaluations.filter((persona) => persona.matched)
    .length;
  const items: FunctionalFeatureReadinessItem[] = [
    {
      id: "csv_dry_run",
      label: "CSV dry run",
      status: "product_ready_prototype",
      worksNow: "Broker CSV text can be parsed, grouped, repaired, and previewed without saving.",
      blocksGoLive: "Needs real anonymized broker files and upload/storage security review.",
      verificationCoverage: [
        "Existing broker regression fixtures",
        "Functional calibration harness",
      ],
      nextValidationAction: "Collect anonymized real CSV samples from the target brokers.",
      evidence: calibration.evidence,
    },
    {
      id: "import_confidence_gate",
      label: "Import confidence gate",
      status: "product_ready_prototype",
      worksNow: `Current calibration state is ${calibration.confidenceState.state}.`,
      blocksGoLive: "Needs more real-file calibration before allowing production saves.",
      verificationCoverage: ["State-machine unit tests", "Dry-run route tests"],
      nextValidationAction: "Track every blocker/review reason on real imports.",
      evidence: calibration.confidenceState.evidence,
    },
    {
      id: "saved_analysis_prototype",
      label: "Import-to-saved-analysis prototype",
      status: "prototype_only",
      worksNow: "Ready imports can generate feedback summaries and a trader analytics report in memory.",
      blocksGoLive: "No production database write path or user isolation exists yet.",
      verificationCoverage: ["Prototype contract tests", "Truth-source audit"],
      nextValidationAction: "Choose the storage adapter after platform auth decisions.",
      evidence: calibration.evidence,
    },
    {
      id: "execution_feedback",
      label: "Execution feedback and autopsy",
      status: "product_ready_prototype",
      worksNow: "Execution-only mistakes, strengths, and autopsy observations are generated from order facts.",
      blocksGoLive: "Needs calibration against real saved trades and user review outcomes.",
      verificationCoverage: ["Execution feedback fixtures", "Functional autopsy tests"],
      nextValidationAction: "Review the first real saved trades for false positives.",
      evidence: [
        evidence({
          kind: "metric",
          id: "metric:fuzz_pass_count",
          label: `${fuzz.passedCount}/${fuzz.scenarioCount} deterministic execution scenarios passed.`,
        }),
      ],
    },
    {
      id: "synthetic_personas",
      label: "Synthetic trader personas",
      status:
        personaMatchCount === personaEvaluations.length
          ? "product_ready_prototype"
          : "needs_real_data",
      worksNow: `${personaMatchCount}/${personaEvaluations.length} synthetic persona(s) matched expected behavior.`,
      blocksGoLive: "Synthetic personas do not replace calibration with real trader histories.",
      verificationCoverage: ["Persona behavior tests"],
      nextValidationAction: "Add anonymized real behavior clusters when available.",
      evidence: personaEvaluations.flatMap((persona) => persona.evidence),
    },
    {
      id: "market_context_add_on",
      label: "Market context add-on",
      status: "needs_real_data",
      worksNow: "Market context can remain observational when supplied by levels-system.",
      blocksGoLive: "No real saved-trade market context calibration exists yet.",
      verificationCoverage: ["Execution-only truth-source checks"],
      nextValidationAction: "Wait for levels-system market-structure validation on real saved data.",
      evidence: [
        evidence({
          kind: "state",
          id: "state:market_context_observational_only",
          label: "Market context is excluded from execution-only conclusions.",
        }),
      ],
    },
    {
      id: "auth_billing_persistence",
      label: "Auth, billing, and persistence",
      status: "blocked_for_live",
      worksNow: "Demo contracts can model platform context and plan tiers.",
      blocksGoLive: "Real login, tenant isolation, durable storage, billing enforcement, and audit logging are not implemented.",
      verificationCoverage: ["Route policy tests", "No-export policy tests"],
      nextValidationAction: "Return to platform integration after the feature loop is calibrated.",
      evidence: [
        evidence({
          kind: "state",
          id: "state:no_production_persistence",
          label: "This branch intentionally avoids production database writes.",
        }),
      ],
    },
  ];

  return {
    contractVersion: "functional_feature_readiness_dashboard_v1",
    generatedAt,
    summary:
      "Core execution-improvement functionality is testable in prototype mode, but the product is not live-ready.",
    liveReadiness: "not_live_ready",
    items,
    topGoLiveBlockers: [
      "No production auth or tenant isolation.",
      "No production saved-trade persistence adapter.",
      "No real broker CSV calibration set yet.",
      "Market context is not calibrated for scoring or coaching conclusions.",
    ],
    noExportPolicyMaintained: true,
    marketContextUsedForConclusions: false,
  };
}

export function runRealDataCalibrationHarness(args?: {
  csvText?: string;
  broker?: BrokerExecutionCsvFormat;
  accountTimezone?: string;
  columnMapping?: BrokerExecutionCsvColumnMapping;
  dryRunExperience?: CsvDryRunImportExperience;
  generatedAt?: string;
}): RealDataCalibrationHarnessResult {
  const generatedAt = args?.generatedAt ?? DEFAULT_GENERATED_AT;
  const preset = getCsvDryRunSamplePresets()[0];
  const experience =
    args?.dryRunExperience ??
    buildCsvDryRunImportExperience({
      csvText: args?.csvText ?? preset.csvText,
      broker: args?.broker ?? preset.broker,
      accountTimezone: args?.accountTimezone,
      columnMapping: args?.columnMapping,
    });
  const confidenceState = buildImportConfidenceState(experience);
  const prototype = buildSavedAnalysisPrototypeFromDryRun({
    experience,
    generatedAt,
  });
  const importResult = experience.preview.importResult;
  const correctionCount =
    importResult.rejectedRowCount +
    experience.postImportReviewQueuePreview.totalCount +
    (importResult.mappingConfidence.level === "low" ? 1 : 0);
  const topCalibrationBlockers = [
    ...confidenceState.blockers,
    ...confidenceState.reviewReasons,
  ].slice(0, 5);

  return {
    contractVersion: "real_data_calibration_harness_v1",
    generatedAt,
    source: args?.dryRunExperience
      ? "provided_dry_run"
      : args?.csvText
        ? "user_supplied_csv"
        : "synthetic_fixture",
    broker: experience.broker,
    detectedBrokerFormat: importResult.broker,
    parseSucceeded: importResult.acceptedExecutionCount > 0,
    acceptedExecutionCount: importResult.acceptedExecutionCount,
    rejectedRowCount: importResult.rejectedRowCount,
    skippedRowCount: importResult.skippedRowCount,
    groupedTradeCount: importResult.requestCount,
    correctionCount,
    confidenceState,
    savedAnalysisPrototypeReady: prototype.analyticsReportStatus === "created",
    topCalibrationBlockers,
    privacySafetyNotes: [
      "Use anonymized CSV text for calibration whenever possible.",
      "This harness does not connect to IBKR, live broker accounts, or levels-system.",
      "No export/download path is created by this harness.",
    ],
    evidence: [
      ...confidenceState.evidence,
      evidence({
        kind: "metric",
        id: "metric:calibration_correction_count",
        label: `${correctionCount} correction/review item(s).`,
      }),
    ],
    marketContextUsed: false,
  };
}

export function buildTraderFunctionalProductReadinessViewModel(args?: {
  generatedAt?: string;
  dryRunExperience?: CsvDryRunImportExperience;
}): TraderFunctionalProductReadinessViewModel {
  const generatedAt = args?.generatedAt ?? DEFAULT_GENERATED_AT;
  const experience =
    args?.dryRunExperience ??
    buildCsvDryRunImportExperience({
      broker: "generic_execution_csv",
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2026-05-01,09:30:00,ABCD,Buy,100,10.00",
        "2026-05-01,09:45:00,ABCD,Sell,100,10.45",
      ].join("\n"),
    });
  const importState = buildImportConfidenceState(experience);
  const savedAnalysisPrototype = buildSavedAnalysisPrototypeFromDryRun({
    experience,
    generatedAt,
  });
  const personaEvaluations = evaluateSyntheticTraderPersonas(undefined, generatedAt);
  const fuzzResult = runDeterministicExecutionMathFuzzScenarios(generatedAt);
  const calibrationHarness = runRealDataCalibrationHarness({
    dryRunExperience: experience,
    generatedAt,
  });
  const truthSourceAudit = auditFunctionalTruthSources(
    claimsFromFunctionalReadiness({
      importState,
      prototype: savedAnalysisPrototype,
      personas: personaEvaluations,
      fuzz: fuzzResult,
      calibration: calibrationHarness,
    }),
  );
  const readinessDashboard = buildFunctionalFeatureReadinessDashboard({
    generatedAt,
    calibration: calibrationHarness,
    fuzz: fuzzResult,
    personaEvaluations,
  });

  return {
    contractVersion: "trader_functional_product_readiness_v1",
    generatedAt,
    planFile: "src/docs/trader-functional-product-readiness-plan.md",
    importState,
    savedAnalysisPrototype,
    personaEvaluations,
    fuzzResult,
    truthSourceAudit,
    readinessDashboard,
    calibrationHarness,
    marketContextUsedForConclusions: false,
  };
}
