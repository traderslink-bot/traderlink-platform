export const COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION =
  "traderlink_coach_weekly_ai_review_evidence_packet_v1" as const;

export const COACH_WEEKLY_AI_REVIEW_AUTHORED_OUTPUT_VERSION =
  "traderlink_coach_weekly_ai_review_authored_output_v1" as const;

export type CoachWeeklyAiReviewEvidenceMetric = Readonly<{
  name: string;
  exactValue: string;
  displayValue: string;
}>;

export type CoachWeeklyAiReviewEvidenceRuleResult = Readonly<{
  ruleRef: string;
  status: "followed" | "broken" | "not_reviewed" | "not_applicable";
}>;

export type CoachWeeklyAiReviewEvidenceTrade = Readonly<{
  evidenceRef: string;
  marketDate: string;
  daySequence: number;
  entryTimeEastern: string;
  exitTimeEastern: string;
  ticker: string;
  direction: "long" | "short";
  netPnlDecimal: string | null;
  holdingMinutes: number | null;
  tickerAttemptNumber: number;
  afterTwoConsecutiveLosses: boolean | null;
  tags: readonly string[];
  ruleDeviationRefs: readonly string[];
  note: string | null;
}>;

export type CoachWeeklyAiReviewAnalyzerEvidenceRow = Readonly<{
  tradeEvidenceRef: string;
  favorableMoveDecimal: string | null;
  adverseMoveDecimal: string | null;
  greenToRedStatus: "never_green" | "green_no_red" |
    "green_to_red_ended_red" | "green_to_red_recovered" |
    "green_to_red_ended_flat";
  measuredPeakPnlDecimal: string | null;
  peakToFinalReversalDecimal: string | null;
  addedAfterPeakCount: number;
  partialExitBeforeRedCount: number;
  favorableMoveAfter15MinutesDecimal: string | null;
}>;

export type CoachWeeklyAiReviewEvidenceDay = Readonly<{
  evidenceRef: string;
  marketDate: string;
  tradeCount: number;
  winnerCount: number;
  loserCount: number;
  flatCount: number;
  netPnlDecimal: string | null;
}>;

export type CoachWeeklyAiReviewCalculatedObservation = Readonly<{
  evidenceRef: string;
  label: string;
  description: string;
  populationDefinition: string;
  affectedTradeCount: number;
  representativeTradeRefs: readonly string[];
  measurements: readonly CoachWeeklyAiReviewEvidenceMetric[];
}>;

export type CoachWeeklyAiReviewEvidencePacket = Readonly<{
  packetVersion: typeof COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION;
  period: Readonly<{
    startDate: string;
    endDate: string;
    timezone: "America/New_York";
    currency: string;
  }>;
  weekSnapshot: Readonly<{
    evidenceRef: "week_snapshot";
    metrics: readonly CoachWeeklyAiReviewEvidenceMetric[];
  }>;
  previousWeekSnapshot: Readonly<{
    evidenceRef: "previous_week_snapshot";
    periodStartDate: string;
    periodEndDate: string;
    metrics: readonly CoachWeeklyAiReviewEvidenceMetric[];
  }> | null;
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
  priorIssuedReview: Readonly<{
    evidenceRef: string;
    periodStartDate: string;
    periodEndDate: string;
    reviewText: string;
  }> | null;
  coverage: Readonly<{
    evidenceRef: "coverage";
    completeTradeCount: number;
    analyzerReadyTradeCount: number;
    tradeNoteCount: number;
    completedReflectionCount: number;
    limitationText: string | null;
  }>;
}>;

export type CoachWeeklyAiReviewAuthoredInsight = Readonly<{
  title: string;
  body: string;
  evidenceRefs: readonly string[];
}>;

export type CoachWeeklyAiReviewAuthoredOutput = Readonly<{
  contractVersion: typeof COACH_WEEKLY_AI_REVIEW_AUTHORED_OUTPUT_VERSION;
  weeklyRecap: string;
  weeklyRecapEvidenceRefs: readonly string[];
  weekNarrative: string;
  weekNarrativeEvidenceRefs: readonly string[];
  additionalInsights: readonly CoachWeeklyAiReviewAuthoredInsight[];
  incompleteRecord: string | null;
}>;
