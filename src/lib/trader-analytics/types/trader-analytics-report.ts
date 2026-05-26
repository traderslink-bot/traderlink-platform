import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import type { ExecutionFeedbackPoint } from "../../execution-feedback/types/execution-feedback-point";
import type {
  SessionBucket,
  SessionExposureSegment,
} from "../../raw-trade-timeline/types/session-context";
import type {
  UserFacingBehaviorEvidenceChannel,
  UserFacingBehaviorOpportunityType,
  UserFacingBehaviorState,
  UserFacingBehaviorTone,
} from "../../user-facing-behavior/types/user-facing-behavior-contract";
import type { TraderAnalyticsChartData } from "./trader-analytics-chart";

export type TraderAnalyticsInputMode =
  | "raw_trade_requests"
  | "execution_feedback_summaries";

export type TraderAnalyticsPointKind = ExecutionFeedbackPoint["kind"];
export type TraderAnalyticsPointCategory = ExecutionFeedbackPoint["category"];

export interface TraderAnalyticsPointDigest {
  id: string;
  kind: TraderAnalyticsPointKind;
  category: TraderAnalyticsPointCategory;
  label: string;
  summary: string;
  behaviorState: UserFacingBehaviorState;
  behaviorTone: UserFacingBehaviorTone;
  opportunityType: UserFacingBehaviorOpportunityType;
  evidenceChannel: UserFacingBehaviorEvidenceChannel;
  canDrivePrimaryConclusion: boolean;
  missingDataSentence: string;
  fixFirstAction: string;
  severity: ExecutionFeedbackPoint["severity"];
  confidence: ExecutionFeedbackPoint["confidence"];
  priorityScore: number;
}

export interface TraderAnalyticsPointCount extends TraderAnalyticsPointDigest {
  count: number;
  tradeRate: number;
}

export interface TraderAnalyticsReportFailure {
  requestIndex: number;
  symbol: string | null;
  code: string;
  message: string;
  source: string;
}

export interface TraderAnalyticsTradeRow {
  tradeIndex: number;
  requestIndex: number;
  symbol: string;
  tradeDirection: string;
  sessionDate: string;
  sessionBucket: string;
  entrySessionBucket: SessionBucket | string;
  entrySessionDateEt: string;
  entryTimeEt: string;
  entryHourEt: number | null;
  entryHourLabelEt: string;
  sessionExposure: SessionExposureSegment[];
  heldSessionBuckets: Array<SessionBucket | string>;
  heldHourBucketsEt: string[];
  heldPremarketIntoOpen: boolean;
  heldOpenIntoMidday: boolean;
  heldMiddayIntoPostmarket: boolean;
  heldPostmarketIntoOvernight: boolean;
  heldOvernight: boolean;
  executionCount: number;
  grossRealizedPnl: number;
  grossRealizedPnlPctOfEntryNotional: number | null;
  closedToFlat: boolean;
  isOpenPosition: boolean;
  maxPositionSize: number;
  finalPositionSize: number;
  addCountAfterInitialEntry: number;
  reductionCount: number;
  durationSeconds: number;
  adversePriceAddCount: number;
  primaryFocus: TraderAnalyticsPointDigest | null;
  topRisk: TraderAnalyticsPointDigest | null;
  topStrength: TraderAnalyticsPointDigest | null;
  warnings: string[];
}

export interface TraderAnalyticsTradeExtreme {
  tradeIndex: number;
  requestIndex: number;
  symbol: string;
  tradeDirection: string;
  grossRealizedPnl: number;
}

export type TraderAnalyticsTimeBucketSampleSizeLabel =
  | "insufficient"
  | "limited"
  | "sufficient";

export type TraderAnalyticsTimeBucketConclusionKind =
  | "insufficient_sample"
  | "outlier_dominated_total"
  | "consistent_weakness"
  | "consistent_strength"
  | "mixed";

export type TraderAnalyticsTimeBucketConclusionConfidence =
  | "low"
  | "medium"
  | "high";

export interface TraderAnalyticsTimeBucketConclusion {
  kind: TraderAnalyticsTimeBucketConclusionKind;
  confidence: TraderAnalyticsTimeBucketConclusionConfidence;
  summary: string;
}

export interface TraderAnalyticsSampleSizeMetrics {
  requestCount: number;
  validatedTradeCount: number;
  completedTradeCount: number;
  failedTradeCount: number;
  validatedOnlyCount: number;
  warningCount: number;
  symbols: string[];
  sessionBuckets: string[];
  tradeDirections: string[];
  sessionDateRange: {
    firstSessionDate: string;
    lastSessionDate: string;
  } | null;
}

export interface TraderAnalyticsPnlMetrics {
  grossTotalRealizedPnl: number;
  grossAverageRealizedPnl: number | null;
  grossMedianRealizedPnl: number | null;
  grossWinnerCount: number;
  grossLoserCount: number;
  grossFlatCount: number;
  grossWinRate: number | null;
  bestGrossTrade: TraderAnalyticsTradeExtreme | null;
  worstGrossTrade: TraderAnalyticsTradeExtreme | null;
  commissionsAndFeesIncluded: false;
}

export interface TraderAnalyticsTimeBucketMetrics {
  id: string;
  label: string;
  tradeCount: number;
  grossTotalRealizedPnl: number;
  grossAverageRealizedPnl: number | null;
  grossMedianRealizedPnl: number | null;
  grossAbsoluteRealizedPnl: number;
  grossWinnerCount: number;
  grossLoserCount: number;
  grossFlatCount: number;
  grossWinRate: number | null;
  largestWinner: TraderAnalyticsTradeExtreme | null;
  largestLoser: TraderAnalyticsTradeExtreme | null;
  largestAbsoluteTrade: TraderAnalyticsTradeExtreme | null;
  largestAbsoluteTradeShareOfAbsolutePnl: number | null;
  sampleSizeLabel: TraderAnalyticsTimeBucketSampleSizeLabel;
  conclusion: TraderAnalyticsTimeBucketConclusion;
}

export interface TraderAnalyticsTimeOfDayMetrics {
  entrySessionBuckets: TraderAnalyticsTimeBucketMetrics[];
  entryHoursEt: TraderAnalyticsTimeBucketMetrics[];
  heldSessionBuckets: TraderAnalyticsTimeBucketMetrics[];
  bestEntrySession: TraderAnalyticsTimeBucketMetrics | null;
  worstEntrySession: TraderAnalyticsTimeBucketMetrics | null;
  bestEntryHourEt: TraderAnalyticsTimeBucketMetrics | null;
  worstEntryHourEt: TraderAnalyticsTimeBucketMetrics | null;
  entryInsight: string;
  holdInsight: string;
  sampleSizeWarning: boolean;
  crossSessionHolds: {
    heldPremarketIntoOpenCount: number;
    heldOpenIntoMiddayCount: number;
    heldMiddayIntoPostmarketCount: number;
    heldPostmarketIntoOvernightCount: number;
    heldOvernightCount: number;
  };
}

export interface TraderAnalyticsLifecycleMetrics {
  openPositionTradeCount: number;
  closedToFlatTradeCount: number;
  openPositionRate: number | null;
  averageMaxPositionSize: number | null;
  averageFinalPositionSize: number | null;
  averageDurationSeconds: number | null;
  medianDurationSeconds: number | null;
}

export interface TraderAnalyticsExecutionBehaviorMetrics {
  adversePriceAddTradeCount: number;
  adversePriceAddRate: number | null;
  multipleAddsBeforeReductionTradeCount: number;
  multipleAddsBeforeReductionRate: number | null;
  overbuiltPositionTradeCount: number;
  openPositionLeftoverTradeCount: number;
  rapidFireExecutionTradeCount: number;
  inconsistentShareSizingTradeCount: number;
  largeLateAddTradeCount: number;
  smallFirstRiskReductionTradeCount: number;
  allOrNothingExitAfterManyAddsTradeCount: number;
  losingReductionSequenceTradeCount: number;
}

export interface TraderAnalyticsStrengthMetrics {
  cleanSingleEntryFullExitCount: number;
  controlledScaleInCount: number;
  structuredPartialExitSequenceCount: number;
  earlyPositionRiskReductionCount: number;
  decisiveFullExitCount: number;
  consistentShareSizingCount: number;
  profitableReductionSequenceCount: number;
}

export interface TraderAnalyticsCategoryDistribution {
  category: TraderAnalyticsPointCategory;
  label: string;
  contextCount: number;
  riskCount: number;
  strengthCount: number;
  primaryFocusCount: number;
  totalCount: number;
}

export interface TraderAnalyticsDistributions {
  categories: TraderAnalyticsCategoryDistribution[];
  riskIds: Record<string, number>;
  strengthIds: Record<string, number>;
  primaryFocusIds: Record<string, number>;
}

export interface TraderAnalyticsSourceBatchSummary {
  contractVersion: "batch_execution_feedback_v1" | null;
  validateOnly: boolean;
  failureCounts: Record<string, number>;
  failures: TraderAnalyticsReportFailure[];
}

export interface TraderAnalyticsReport {
  contractVersion: "trader_analytics_report_v1";
  dataSource: "execution_feedback_summaries";
  inputMode: TraderAnalyticsInputMode;
  source: string;
  generatedAt: string;
  sampleSize: TraderAnalyticsSampleSizeMetrics;
  pnl: TraderAnalyticsPnlMetrics;
  timeOfDay: TraderAnalyticsTimeOfDayMetrics;
  lifecycle: TraderAnalyticsLifecycleMetrics;
  executionBehavior: TraderAnalyticsExecutionBehaviorMetrics;
  strengths: TraderAnalyticsStrengthMetrics;
  distributions: TraderAnalyticsDistributions;
  topRisks: TraderAnalyticsPointCount[];
  topStrengths: TraderAnalyticsPointCount[];
  primaryFocusCounts: TraderAnalyticsPointCount[];
  trades: TraderAnalyticsTradeRow[];
  charts: TraderAnalyticsChartData;
  sourceBatch: TraderAnalyticsSourceBatchSummary;
  warnings: string[];
  limitations: string[];
}

export interface TraderAnalyticsCompletedSummaryInput {
  requestIndex?: number;
  summary: ExecutionFeedbackSummary;
}

export type TraderAnalyticsReportSummaryInput =
  | ExecutionFeedbackSummary
  | TraderAnalyticsCompletedSummaryInput;

export interface BuildTraderAnalyticsReportArgs {
  source: string;
  generatedAt?: string;
  inputMode?: TraderAnalyticsInputMode;
  summaries: TraderAnalyticsReportSummaryInput[];
  requestCount?: number;
  failedTradeCount?: number;
  validatedOnlyCount?: number;
  validationWarningCount?: number;
  failures?: TraderAnalyticsReportFailure[];
  failureCounts?: Record<string, number>;
  validateOnly?: boolean;
  warnings?: string[];
}
