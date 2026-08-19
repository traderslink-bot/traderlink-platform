import type {
  CoachWeeklyAiReviewAnalyzerEvidenceRow,
  CoachWeeklyAiReviewCalculatedObservation,
  CoachWeeklyAiReviewEvidenceDay,
  CoachWeeklyAiReviewEvidenceMetric,
  CoachWeeklyAiReviewEvidenceTrade,
} from "./coach-weekly-ai-review-evidence-authoring-contracts";

export const COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION =
  "traderlink_coach_monthly_ai_review_evidence_packet_v1" as const;

export const COACH_MONTHLY_AI_REVIEW_AUTHORED_OUTPUT_VERSION =
  "traderlink_coach_monthly_ai_review_authored_output_v1" as const;

export type CoachMonthlyAiReviewEvidenceWeek = Readonly<{
  evidenceRef: string;
  weekStartDate: string;
  weekEndDate: string;
  tradeCount: number;
  winnerCount: number;
  loserCount: number;
  flatCount: number;
  netPnlDecimal: string | null;
}>;

export type CoachMonthlyAiReviewComparisonObservation = Readonly<{
  evidenceRef: string;
  label: string;
  description: string;
  currentPeriodMeasurements: readonly CoachWeeklyAiReviewEvidenceMetric[];
  priorPeriodMeasurements: readonly CoachWeeklyAiReviewEvidenceMetric[];
}>;

export type CoachMonthlyAiReviewEvidencePacket = Readonly<{
  packetVersion: typeof COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION;
  period: Readonly<{
    calendarMonthStartDate: string;
    calendarMonthEndDate: string;
    timezone: "America/New_York";
    currency: string;
  }>;
  monthSnapshot: Readonly<{
    evidenceRef: "month_snapshot";
    metrics: readonly CoachWeeklyAiReviewEvidenceMetric[];
  }>;
  priorMonthSnapshot: Readonly<{
    evidenceRef: "prior_month_snapshot";
    calendarMonthStartDate: string;
    calendarMonthEndDate: string;
    metrics: readonly CoachWeeklyAiReviewEvidenceMetric[];
  }> | null;
  calendarWeeks: readonly CoachMonthlyAiReviewEvidenceWeek[];
  ruleDefinitions: readonly Readonly<{
    ruleRef: string;
    title: string;
    ruleText: string;
  }>[];
  ruleSummaries: readonly Readonly<{
    evidenceRef: string;
    ruleRef: string;
    followedCount: number;
    brokenCount: number;
    notReviewedCount: number;
    notApplicableCount: number;
  }>[];
  days: readonly CoachWeeklyAiReviewEvidenceDay[];
  trades: readonly CoachWeeklyAiReviewEvidenceTrade[];
  analyzerRows: readonly CoachWeeklyAiReviewAnalyzerEvidenceRow[];
  calculatedObservations: readonly CoachWeeklyAiReviewCalculatedObservation[];
  comparisonObservations: readonly CoachMonthlyAiReviewComparisonObservation[];
  observationOverlaps: readonly Readonly<{
    firstObservationRef: string;
    secondObservationRef: string;
    sharedTradeCount: number;
  }>[];
  dailyReflections: readonly Readonly<{
    evidenceRef: string;
    marketDate: string;
    state: "completed" | "saved_incomplete";
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    nextSessionFocus: string;
    tradeNotes: readonly Readonly<{
      ticker: string;
      note: string;
    }>[];
  }>[];
  currentFocuses: readonly Readonly<{
    evidenceRef: string;
    effectiveFromDate: string;
    text: string;
  }>[];
  coverage: Readonly<{
    evidenceRef: "coverage";
    completeTradeCount: number;
    analyzerReadyTradeCount: number;
    tradeNoteCount: number;
    completedReflectionCount: number;
    limitationText: string | null;
  }>;
}>;

export type CoachMonthlyAiReviewAuthoredInsight = Readonly<{
  title: string;
  body: string;
  evidenceRefs: readonly string[];
}>;

export type CoachMonthlyAiReviewAuthoredOutput = Readonly<{
  contractVersion: typeof COACH_MONTHLY_AI_REVIEW_AUTHORED_OUTPUT_VERSION;
  monthlyRecap: string;
  monthlyRecapEvidenceRefs: readonly string[];
  monthNarrative: string;
  monthNarrativeEvidenceRefs: readonly string[];
  additionalInsights: readonly CoachMonthlyAiReviewAuthoredInsight[];
  incompleteRecord: string | null;
}>;
