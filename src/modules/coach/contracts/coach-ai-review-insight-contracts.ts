export const COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION =
  "traderlink_coach_ai_review_insight_v3_2026_08_18" as const;

export const COACH_AI_REVIEW_CALCULATION_SOURCE_VERSION =
  "traderlink_coach_ai_review_calculation_source_v1" as const;

export const COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION =
  "traderlink_coach_ai_review_prompt_safe_hmac_v1" as const;

export const COACH_AI_REVIEW_STABLE_TRACKING_REFERENCE_VERSION =
  "traderlink_coach_ai_review_stable_tracking_sha256_v1" as const;

export type CoachAiReviewCadence = "weekly" | "two_week" | "monthly";

export type CoachAiReviewInsightLane =
  | "friction"
  | "improvement"
  | "strength"
  | "contrast"
  | "focus_follow_through";

export type CoachAiReviewInsightFamily =
  | "period_outcome"
  | "named_rule_association"
  | "rule_trend"
  | "favorable_move_outcome"
  | "entry_evidence"
  | "add_sequence"
  | "exit_sequence"
  | "risk_stop_sizing"
  | "reentry_day_sequence"
  | "concentration_outlier"
  | "fixed_cohort"
  | "positive_process"
  | "result_process_contrast"
  | "focus_follow_through";

export type CoachAiReviewCandidateClassification =
  | "outcome_context"
  | "recurring"
  | "trend"
  | "contrast"
  | "material_outlier"
  | "specific_example"
  | "focus_assessment";

export type CoachAiReviewObservationUnit =
  | "trade"
  | "execution_event"
  | "trading_day"
  | "rule_review_opportunity"
  | "analyzer_covered_trade"
  | "calendar_week"
  | "issued_focus";

export type CoachAiReviewResultOwnership =
  | "trade_close_market_date"
  | "execution_event_market_date"
  | "trading_day"
  | "rule_target"
  | "note_review_date"
  | "focus_issuance_time";

export type CoachAiReviewTradeStylePopulation =
  | "all_closed_trades"
  | "declared_day"
  | "declared_swing"
  | "declared_other"
  | "objective_same_market_date"
  | "unknown_or_mixed";

export type CoachAiReviewAttributionKind =
  | "period_result"
  | "cohort_association"
  | "analyzer_path"
  | "day_outcome_context"
  | "preset_evaluator"
  | "coverage_only";

export type CoachAiReviewMeasurementAvailability =
  | "available"
  | "partial_display_only"
  | "not_applicable"
  | "unavailable_missing_population"
  | "unavailable_missing_money"
  | "unavailable_mixed_currency"
  | "unavailable_incompatible_comparison"
  | "unavailable_coverage"
  | "unavailable_source_conflict";

export type CoachAiReviewRuleTargetKind = "trading_day" | "round_trip";
export type CoachAiReviewRuleReviewScope = "day" | "trade" | "both";
export type CoachAiReviewRuleSourceKind = "template" | "custom";

export type CoachAiReviewRuleDispositionState =
  | "reviewed_followed"
  | "reviewed_broken"
  | "explicit_not_reviewed"
  | "expected_review_missing";

export type CoachAiReviewPresetEvaluationState =
  | "evaluated_followed"
  | "evaluated_broken"
  | "not_applicable"
  | "evaluation_unavailable";

export type CoachAiReviewPresetAvailabilityReason =
  | "no_applicable_target"
  | "missing_rule_configuration"
  | "missing_source_fact"
  | "ambiguous_execution_sequence"
  | "insufficient_money_coverage"
  | "legacy_untyped";

export type CoachAiReviewRuleSourceConsistency =
  | "single_source"
  | "consistent"
  | "conflict";

export type CoachAiReviewRuleOpportunityState =
  | "applicable"
  | "not_applicable"
  | "unavailable";

export type CoachAiReviewRuleOpportunityUnavailableReason =
  | "historical_projection_unavailable"
  | "preset_evaluation_unavailable"
  | "saved_disposition_without_opportunity";

export type CoachAiReviewConsequenceVerdict =
  | "worse_associated_outcome"
  | "better_associated_outcome"
  | "not_separated"
  | "opposite_associated_outcome"
  | "mixed_outcome_separation"
  | "composition_confounded"
  | "comparison_unavailable";

export type CoachAiReviewRankStabilityState =
  | "dominant"
  | "near_tie"
  | "only_eligible";

export type CoachAiReviewMemberSet = Readonly<{
  observationUnit: CoachAiReviewObservationUnit;
  memberRefs: readonly string[];
}>;

export type CoachAiReviewMeasurement = Readonly<{
  measurementRef: string;
  metricName: string;
  exactValue: string | null;
  unit: "count" | "decimal" | "ratio" | "money" | "milliseconds";
  currency: string | null;
  observationUnit: CoachAiReviewObservationUnit;
  numeratorMemberRefs: readonly string[];
  denominatorMemberRefs: readonly string[];
  affectedCount: number;
  moneyEligibleCount: number | null;
  expectedCount: number | null;
  availability: CoachAiReviewMeasurementAvailability;
  attributionKind: CoachAiReviewAttributionKind;
  displayLiteral: string | null;
}>;

export type CoachAiReviewScoreDimensionName =
  | "financial_materiality"
  | "repetition"
  | "trend_magnitude"
  | "process_relevance"
  | "evidence_confidence"
  | "focus_relevance"
  | "specificity"
  | "persistence_or_adverse_trend"
  | "financial_improvement"
  | "baseline_recurrence"
  | "outcome_support"
  | "cross_period_consistency"
  | "result_process_divergence"
  | "exact_focus_measurability"
  | "later_evidence_span";

export type CoachAiReviewScoreDimension = Readonly<{
  name: CoachAiReviewScoreDimensionName;
  value: number | null;
  unclampedValue: number | null;
  available: boolean;
  rawInputs: Readonly<Record<string, string | number | boolean | null>>;
  explanation: string;
}>;

export type CoachAiReviewLaneScore = Readonly<{
  lane: CoachAiReviewInsightLane;
  prePenaltyScore: number;
  postPenaltyScore: number;
  availableWeight: number;
  penaltyPoints: number;
  dimensions: readonly CoachAiReviewScoreDimension[];
}>;

export type CoachAiReviewLaneRankStability = Readonly<{
  state: CoachAiReviewRankStabilityState;
  marginToNextDistinct: number | null;
  leaveOneBucketWinnerStable: boolean | null;
  selectedByMeasuredConsequenceGuard: boolean;
  selectedByFocusNoveltyGuard: boolean;
}>;

export type CoachAiReviewFocusFollowThroughVerdict =
  | "improved"
  | "improved_but_still_inconsistent"
  | "sustained_strength"
  | "unchanged"
  | "no_clear_change"
  | "worsened"
  | "mixed"
  | "measured_without_directional_target"
  | "not_measurable_from_later_evidence";

export type CoachAiReviewFocusAssessment = Readonly<{
  focusTargetRef: string;
  sourceReviewRef: string;
  renderedQuestion: string;
  trackingIntent: CoachAiReviewIssuedFocusTarget["trackingIntent"];
  trackingMetricDirection: CoachAiReviewIssuedFocusTarget["trackingMetricDirection"];
  verdict: CoachAiReviewFocusFollowThroughVerdict;
  baselineMeasurementRef: string;
  laterMeasurementRef: string;
  baselineRateDecimal: string;
  laterRateDecimal: string;
  rateChangeDecimal: string;
  eligibleLaterEvidenceAtUtc: string;
  laterEvidenceStartUtc: string;
  laterEvidenceEndUtc: string;
  cumulativeLaterMemberRefs: readonly string[];
  incrementalLaterMemberRefs: readonly string[];
  priorAssessmentReviewRef: string | null;
  priorAssessmentEvidenceEndUtc: string | null;
  priorAssessmentVerdict: CoachAiReviewFocusFollowThroughVerdict | null;
}>;

export type CoachAiReviewBucketSensitivity = Readonly<{
  bucketRef: string;
  candidateEligible: boolean;
  classification: CoachAiReviewCandidateClassification;
  affectedMemberRefs: readonly string[];
  consequenceVerdict: CoachAiReviewConsequenceVerdict;
  scores: readonly CoachAiReviewLaneScore[];
}>;

export type CoachAiReviewInsightCandidate = Readonly<{
  findingRef: string;
  engineVersion: typeof COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION;
  family: CoachAiReviewInsightFamily;
  classification: CoachAiReviewCandidateClassification;
  polarity: "positive" | "negative" | "mixed" | "context";
  subjectRef: string;
  trackingSubjectKey: string;
  trackingMetricDirection: "lower_is_better" | "higher_is_better" | "non_directional";
  subjectLabel: string | null;
  observationUnit: CoachAiReviewObservationUnit;
  resultOwnership: CoachAiReviewResultOwnership;
  populationDefinition: string;
  populationMemberRefs: readonly string[];
  opportunityDefinition: string | null;
  opportunityMemberRefs: readonly string[];
  affectedMemberRefs: readonly string[];
  tradeStylePopulation: CoachAiReviewTradeStylePopulation;
  laneEligibility: readonly CoachAiReviewInsightLane[];
  cohortDefinition: string;
  comparisonDefinition: string | null;
  measurements: readonly CoachAiReviewMeasurement[];
  weekSeries: readonly Readonly<{
    bucketRef: string;
    numerator: number;
    denominator: number;
  }>[];
  representativeEvidenceRefs: readonly string[];
  representativeEvidenceRoles: readonly (
    | "highest_material_contribution"
    | "typical_affected"
    | "typical_comparison"
    | "typical_early"
    | "typical_later"
    | "most_recent_independent"
  )[];
  representativeMetricName: "trade_net_pnl" | "market_date_chronology" | null;
  relatedRuleRefs: readonly string[];
  relatedFocusRefs: readonly string[];
  overlapKeys: readonly string[];
  coverage: Readonly<{
    observedCount: number;
    expectedCount: number;
    balanced: "balanced" | "materially_skewed" | "balance_unavailable";
  }>;
  consequenceVerdict: CoachAiReviewConsequenceVerdict;
  futureTrackability: "trackable" | "not_trackable" | "not_applicable";
  scores: readonly CoachAiReviewLaneScore[];
  adjustments: readonly string[];
  penalties: readonly string[];
  bucketSensitivity: readonly CoachAiReviewBucketSensitivity[];
  sensitivityResults: readonly string[];
  rankExplanation: readonly string[];
  focusAssessment: CoachAiReviewFocusAssessment | null;
}>;

export type CoachAiReviewRuleOpportunityInput = Readonly<{
  ruleRef: string;
  ruleVersionRef: string;
  targetRef: string;
  targetKind: CoachAiReviewRuleTargetKind;
  reviewScope: CoachAiReviewRuleReviewScope;
  sourceKind: CoachAiReviewRuleSourceKind;
  activeAtTarget: boolean;
  historicalProjection: "applicable" | "not_applicable" | "unavailable";
  savedDisposition: "followed" | "broken" | "not_reviewed" | null;
  presetEvaluation: Readonly<{
    status: "followed" | "broken" | "n/a";
    availabilityReason: CoachAiReviewPresetAvailabilityReason | null;
    violationTradeRefs: readonly string[];
  }> | null;
}>;

export type CoachAiReviewNormalizedRuleOpportunity = Readonly<{
  ruleRef: string;
  ruleVersionRef: string;
  targetRef: string;
  targetKind: CoachAiReviewRuleTargetKind;
  sourceKind: CoachAiReviewRuleSourceKind;
  opportunityState: CoachAiReviewRuleOpportunityState;
  opportunityUnavailableReason: CoachAiReviewRuleOpportunityUnavailableReason | null;
  isReviewOpportunity: boolean;
  dispositionState: CoachAiReviewRuleDispositionState | null;
  presetEvaluationState: CoachAiReviewPresetEvaluationState | null;
  presetAvailabilityReason: CoachAiReviewPresetAvailabilityReason | null;
  sourceConsistency: CoachAiReviewRuleSourceConsistency;
  authorizedViolationTradeRefs: readonly string[];
}>;

export type CoachAiReviewMoneyObservation = Readonly<{
  memberRef: string;
  netPnlDecimal: string | null;
  currency: string | null;
}>;

export type CoachAiReviewComparableOutcomeObservation = CoachAiReviewMoneyObservation & Readonly<{
  bucketRef: string;
  stratumKey: string;
}>;

export type CoachAiReviewConsequenceComparison = Readonly<{
  verdict: CoachAiReviewConsequenceVerdict;
  consequenceFactor: 0 | 0.5 | 1;
  affectedCount: number;
  comparisonCount: number;
  affectedRateDecimal: string | null;
  comparisonRateDecimal: string | null;
  affectedMedianPnlDecimal: string | null;
  comparisonMedianPnlDecimal: string | null;
  periodMedianAbsolutePnlDecimal: string | null;
  rawDirectionAlignedRateGapDecimal: string | null;
  rawDirectionAlignedMedianGapDecimal: string | null;
  standardizedDirectionAlignedRateGapDecimal: string | null;
  standardizedDirectionAlignedMedianGapDecimal: string | null;
  structuralStandardizationApplied: boolean;
  materialCompositionShift: boolean;
  outlierResistance: number | null;
  confidenceAdjustment: "none" | "magnitude_shift_over_50_percent";
}>;

export type CoachAiReviewBehaviorObservation = CoachAiReviewComparableOutcomeObservation & Readonly<{
  affected: boolean;
}>;

export type CoachAiReviewPeriodOutcomeMeasurements = Readonly<{
  memberRefs: readonly string[];
  moneyEligibleMemberRefs: readonly string[];
  tradeCount: number;
  winCount: number;
  lossCount: number;
  flatCount: number;
  netPnlDecimal: string | null;
  winningPnlDecimal: string | null;
  losingPnlDecimal: string | null;
  absolutePnlMagnitudeDecimal: string | null;
  winRateDecimal: string | null;
  lossRateDecimal: string | null;
  medianWinnerDecimal: string | null;
  medianLoserDecimal: string | null;
  averageWinnerDecimal: string | null;
  averageLoserDecimal: string | null;
  largestWinnerDecimal: string | null;
  largestLoserDecimal: string | null;
  profitFactorDecimal: string | null;
  largestWinnerContributionDecimal: string | null;
  largestLoserContributionDecimal: string | null;
  netExcludingLargestWinnerDecimal: string | null;
  netExcludingLargestLoserDecimal: string | null;
  moneyAvailability: "available" | "partial" | "missing" | "mixed_currency";
  moneyCoverageComplete: boolean;
  currency: string | null;
}>;

export type CoachAiReviewSourceExecutionEvent = Readonly<{
  eventRef: string;
  sequence: number;
  role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" |
    "flip_opening";
  executedAtUtc: string;
  side: "buy" | "sell";
  priceDecimal: string | null;
}>;

export type CoachAiReviewSourceTradeStyle = Readonly<{
  styleRef: string;
  trackingStyleVersionKey: string;
  revision: number;
  tradeStyle: "day_trade" | "swing" | "other";
  openStatus: "day_trade_still_open" | "swing" | "unplanned_hold" | "other" |
    "unclassified" | "closed";
  plannedFromEntry: boolean;
  claimedEffectiveAtUtc: string;
  declaredAtUtc: string;
  lifecycleState: "active" | "closed" | "needs_relink";
  linkedRoundTripVersionCurrent: boolean;
}>;

export type CoachAiReviewSourceNote = Readonly<{
  noteRef: string;
  revision: number;
  noteKind: "trade" | "swing";
  reviewDate: string | null;
  text: string;
  technicalText: string | null;
  nextSessionPlan: string | null;
  updatedAtUtc: string;
}>;

export type CoachAiReviewSourceTrade = Readonly<{
  tradeRef: string;
  trackingTradeVersionKey: string;
  instrumentRef: string;
  marketDate: string;
  entryMarketDate: string;
  ticker: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  holdingDurationMilliseconds: number;
  objectiveTiming: "same_market_date" | "multi_market_date";
  grossPnlDecimal: string;
  netPnlDecimal: string | null;
  executionEvents: readonly CoachAiReviewSourceExecutionEvent[];
  tradeStyle: CoachAiReviewSourceTradeStyle | null;
  tags: readonly string[];
  tradeNote: CoachAiReviewSourceNote | null;
  swingNotes: readonly CoachAiReviewSourceNote[];
  analyzer: Readonly<{
    analysisRef: string | null;
    trackingAnalysisVersionKey: string | null;
    linkedRoundTripVersionCurrent: boolean;
    analysis: import("./weekly-ai-review-input-contracts").CoachAiReviewTradeAnalysisV2;
  }>;
}>;

export type CoachAiReviewSourceRule = Readonly<{
  ruleRef: string;
  ruleVersionRef: string;
  trackingRuleKey: string;
  trackingRuleVersionKey: string;
  sourceKind: CoachAiReviewRuleSourceKind;
  templateKey: string | null;
  title: string;
  statement: string;
  category: string;
  reviewScope: CoachAiReviewRuleReviewScope;
  isFocus: boolean;
  configuration: Readonly<Record<string, string>>;
  versionNumber: number;
  effectiveFromUtc: string;
  effectiveUntilUtc: string | null;
  activeIntervals: readonly Readonly<{ fromUtc: string; untilUtc: string | null }>[];
  lifecycleStateAtSnapshot: "active" | "paused" | "retired";
  currentVersionAtSnapshot: boolean;
}>;

export type CoachAiReviewSourceRuleReview = Readonly<{
  ruleReviewRef: string;
  trackingRuleReviewVersionKey: string;
  ruleRef: string;
  ruleVersionRef: string;
  targetRef: string;
  targetKind: CoachAiReviewRuleTargetKind;
  status: "followed" | "broken" | "not_reviewed";
  noteRef: string | null;
  note: string;
  revision: number;
  updatedAtUtc: string;
}>;

export type CoachAiReviewSourcePresetEvidenceEvent = Readonly<{
  evidenceEventRef: string;
  kind: "trigger" | "violation";
  occurredAtUtc: string;
  tradeRef: string;
  netPnlDecimal: string | null;
  valueBefore: string | null;
  valueAfter: string | null;
}>;

export type CoachAiReviewSourcePresetEvaluation = Readonly<{
  evaluationRef: string;
  ruleRef: string;
  ruleVersionRef: string;
  targetRef: string;
  targetKind: CoachAiReviewRuleTargetKind;
  status: "followed" | "broken" | "n/a";
  availabilityReason: CoachAiReviewPresetAvailabilityReason | null;
  feeCoverage: "complete" | "partial" | "unavailable";
  trigger: CoachAiReviewSourcePresetEvidenceEvent | null;
  violations: readonly CoachAiReviewSourcePresetEvidenceEvent[];
}>;

export type CoachAiReviewSourceDay = Readonly<{
  dayRef: string;
  marketDate: string;
  dayStartUtc: string;
  dayEndUtc: string;
  marketSessionKind: "normal" | "scheduled_early_close";
  tradeRefs: readonly string[];
  dailyNote: Readonly<{
    noteRef: string;
    revision: number;
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    tomorrowsFocus: string;
    anythingElse: string;
    updatedAtUtc: string;
  }> | null;
}>;

export type CoachAiReviewIssuedNarrativeContext = Readonly<{
  reviewRef: string;
  contextKind: "current_period" | "prior_comparable";
  reviewKind: CoachAiReviewCadence;
  periodStartDate: string;
  periodEndDate: string;
  issuedAtUtc: string;
  statisticalUse: "prohibited";
  focusTrackingAvailability: "legacy_unavailable" | "tracked_v3";
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

export type CoachAiReviewIssuedFocusTarget = Readonly<{
  focusTargetRef: string;
  sourceReviewRef: string;
  focusOrdinal: number;
  focusQuestionRef: string;
  renderedQuestion: string;
  actionTargetKey: string;
  trackingIntent: "reduction" | "consistency" | "examination" | "strength_repetition";
  trackingMetricDirection: CoachAiReviewInsightCandidate["trackingMetricDirection"];
  originatingFindingRef: string;
  originatingFamily: CoachAiReviewInsightFamily;
  originatingSubjectRef: string;
  originatingTrackingSubjectKey: string;
  originatingClassification: CoachAiReviewCandidateClassification;
  originatingPolarity: CoachAiReviewInsightCandidate["polarity"];
  sourceEngineVersion: typeof COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION;
  sourceDigestSha256: string;
  sourcePeriodStartDate: string;
  sourcePeriodEndDate: string;
  sourcePeriodFinalMarketSealUtc: string | null;
  sourceIssuedAtUtc: string;
  eligibleLaterEvidenceAtUtc: string;
  baselineMeasurements: readonly CoachAiReviewMeasurement[];
  baselinePopulationMemberRefs: readonly string[];
  baselineOpportunityMemberRefs: readonly string[];
  baselineAffectedMemberRefs: readonly string[];
  baselineSourceVersionRefs: readonly string[];
  baselineLineageStatus: "current" | "superseded";
  mostRecentAssessment: Readonly<{
    assessmentReviewRef: string;
    assessmentIssuedAtUtc: string;
    verdict: CoachAiReviewFocusFollowThroughVerdict;
    evidenceEndUtc: string;
    cumulativeLaterMemberRefs: readonly string[];
  }> | null;
}>;

export type CoachAiReviewCalculationSource = Readonly<{
  contractVersion: typeof COACH_AI_REVIEW_CALCULATION_SOURCE_VERSION;
  engineVersion: typeof COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION;
  referenceDerivationVersion: typeof COACH_AI_REVIEW_PROMPT_SAFE_REFERENCE_VERSION;
  stableTrackingDerivationVersion: typeof COACH_AI_REVIEW_STABLE_TRACKING_REFERENCE_VERSION;
  frozenAtUtc: string;
  period: Readonly<{
    cadence: CoachAiReviewCadence;
    startDate: string;
    endDate: string;
    coverageStartDate: string;
    coverageEndDate: string;
    timezone: "America/New_York";
    currency: string;
  }>;
  coverage: Readonly<{
    readyClosedTradeCount: number;
    moneyCompleteTradeCount: number;
    needsDecisionRoundTripCount: number;
    periodEndConfirmedOpenPositionCount: number;
    periodEndOpenWithInPeriodReductionCount: number;
    unrealizedPnlAvailability: "unavailable";
  }>;
  days: readonly CoachAiReviewSourceDay[];
  trades: readonly CoachAiReviewSourceTrade[];
  rules: readonly CoachAiReviewSourceRule[];
  ruleReviews: readonly CoachAiReviewSourceRuleReview[];
  presetEvaluations: readonly CoachAiReviewSourcePresetEvaluation[];
  focuses: readonly Readonly<{
    focusRef: string;
    effectiveFromDate: string;
    revision: number;
    text: string;
  }>[];
  periodEndOpenPositionRefs: readonly string[];
  periodEndOpenWithInPeriodReductionRefs: readonly string[];
  issuedNarrativeContext: readonly CoachAiReviewIssuedNarrativeContext[];
  issuedFocusTargets: readonly CoachAiReviewIssuedFocusTarget[];
  canonicalLineageVersionKeys: readonly string[];
}>;

export type CoachAiReviewCalculationSourceSnapshot = Readonly<{
  source: CoachAiReviewCalculationSource;
  canonicalSourceByteLength: number;
  sourceDigestSha256: string;
}>;
