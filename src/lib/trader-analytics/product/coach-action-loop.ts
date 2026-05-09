import type {
  CoachConfidenceLanguage,
  CoachConfidenceLanguageItem,
  CoachConfidencePhrase,
  CoachEmptyState,
  CoachHomeAction,
  CoachHomeViewModel,
  CoachMistakeTimeline,
  CoachMistakeTimelineItem,
  CoachReviewCompletionLoop,
  CoachReviewCompletionStep,
  CoachReviewCompletionStepStatus,
  CoachRuleSimulation,
  CoachSessionPrepCard,
  MistakeSeverityLadder,
  MistakeSeverityLadderItem,
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTrade,
  SavedExecutionTradeId,
  SavedTraderAnalyticsReport,
  SimilarTradeRef,
  TradeExecutionAutopsy,
  TradeExecutionAutopsyDecision,
  TradeQualityScorecard,
  TradeSimilarityFinder,
  TradeSimilarityGroup,
  TraderArchetypeId,
  TraderArchetypeProfile,
  TraderArchetypeSignal,
  TraderCoachActionLoop,
  TraderImprovementIntelligence,
  TraderMistakeCostEstimate,
  TraderMistakeObservation,
  TraderProductIntelligenceViewModel,
  TraderReviewWorkflow,
  TraderRuleBuilderRecommendation,
  TraderRuleEvaluation,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rowsWithTradeIds(
  report: SavedTraderAnalyticsReport,
): ProductTraderAnalyticsTradeRow[] {
  return report.report.trades.map((row) => ({
    ...row,
    tradeId:
      report.sourceSummaries.find(
        (summaryRef) => summaryRef.requestIndex === row.requestIndex,
      )?.tradeId ??
      report.sourceTradeIds[row.tradeIndex - 1] ??
      `trade-${row.tradeIndex}`,
  }));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function qualityByTradeId(
  qualityScorecards: TradeQualityScorecard[],
): Map<SavedExecutionTradeId, TradeQualityScorecard> {
  return new Map(qualityScorecards.map((quality) => [quality.tradeId, quality]));
}

function pickDecisionForMistake(
  observation: TraderMistakeObservation,
  autopsy: TradeExecutionAutopsy,
): TradeExecutionAutopsyDecision | null {
  const addDecision = autopsy.decisions.find((decision) =>
    ["add", "readd"].includes(decision.role),
  );
  const reductionDecision = autopsy.decisions.find((decision) =>
    ["trim", "full_exit"].includes(decision.role),
  );
  const lastDecision = autopsy.decisions[autopsy.decisions.length - 1] ?? null;

  switch (observation.taxonomyId) {
    case "chased_entry":
    case "revenge_reentry_cluster":
      return autopsy.decisions[1] ?? autopsy.decisions[0] ?? null;
    case "scaled_loser":
    case "add_after_adverse_move":
    case "overbuilt_losing_position":
    case "added_after_failed_premise":
    case "inconsistent_sizing":
      return addDecision ?? lastDecision;
    case "poor_first_reduction":
    case "early_winner_exit":
    case "partialed_without_plan":
    case "all_or_nothing_exit_after_many_adds":
      return reductionDecision ?? lastDecision;
    case "held_loser_too_long":
    case "left_open_position":
      return lastDecision;
    default:
      return autopsy.decisions[0] ?? null;
  }
}

export function buildCoachMistakeTimeline(args: {
  improvement: TraderImprovementIntelligence;
}): CoachMistakeTimeline {
  const autopsyByTradeId = new Map(
    args.improvement.tradeAutopsies.map((autopsy) => [autopsy.tradeId, autopsy]),
  );
  const items: CoachMistakeTimelineItem[] = [];

  for (const observation of args.improvement.mistakeObservations) {
    for (const tradeId of observation.tradeIds) {
      const autopsy = autopsyByTradeId.get(tradeId);
      const decision = autopsy ? pickDecisionForMistake(observation, autopsy) : null;

      if (!decision) {
        continue;
      }

      items.push({
        id: `mistake-timeline:${tradeId}:${observation.taxonomyId}`,
        tradeId,
        taxonomyId: observation.taxonomyId,
        label: observation.label,
        executionIndex: decision.executionIndex,
        timestamp: null,
        role: decision.role,
        detail: `${observation.reason} Likely review point: ${decision.label}.`,
        confidence: observation.confidence,
        suggestedReviewAction: observation.suggestedReviewAction,
      });
    }
  }

  const sorted = items.sort((left, right) => {
    if (left.tradeId !== right.tradeId) {
      return left.tradeId.localeCompare(right.tradeId);
    }

    return left.executionIndex - right.executionIndex;
  });

  return {
    totalCount: sorted.length,
    items: sorted,
  };
}

export function buildCoachRuleSimulations(args: {
  recommendations: TraderRuleBuilderRecommendation[];
}): CoachRuleSimulation[] {
  return args.recommendations.map((recommendation) => ({
    id: `rule-simulation:${recommendation.id}`,
    recommendationId: recommendation.id,
    suggestedRuleTitle: recommendation.suggestedRuleTitle,
    suggestedTemplateId: recommendation.suggestedTemplateId,
    flaggedTradeIds: recommendation.relatedTradeIds,
    flaggedTradeCount: recommendation.relatedTradeIds.length,
    expectedSuccessMetric: recommendation.expectedSuccessMetric,
    limitation:
      "Execution-only simulation shows which saved trades would be flagged; it does not estimate alternate P/L.",
  }));
}

function archetypeSignal(args: {
  id: TraderArchetypeId;
  label: string;
  score: number;
  evidence: string[];
  relatedTradeIds: SavedExecutionTradeId[];
}): TraderArchetypeSignal {
  const score = clamp(Math.round(args.score), 0, 100);

  return {
    id: args.id,
    label: args.label,
    score,
    confidence: score >= 70 ? "high" : score >= 35 ? "medium" : "low",
    evidence: args.evidence.filter(Boolean),
    relatedTradeIds: unique(args.relatedTradeIds),
  };
}

function observationById(
  observations: TraderMistakeObservation[],
  ids: string[],
): TraderMistakeObservation[] {
  return observations.filter((observation) =>
    ids.includes(observation.taxonomyId),
  );
}

export function buildTraderArchetypeProfile(args: {
  report: SavedTraderAnalyticsReport;
  improvement: TraderImprovementIntelligence;
}): TraderArchetypeProfile {
  const observations = args.improvement.mistakeObservations;
  const cleanBucket = args.improvement.playbookBuckets.find(
    (bucket) => bucket.id === "clean_single_entry_trade",
  );
  const reactive = observationById(observations, [
    "scaled_loser",
    "add_after_adverse_move",
    "added_after_failed_premise",
    "overbuilt_losing_position",
  ]);
  const earlySeller = observationById(observations, [
    "poor_first_reduction",
    "early_winner_exit",
    "partialed_without_plan",
  ]);
  const overHolder = observationById(observations, [
    "held_loser_too_long",
    "left_open_position",
  ]);
  const inconsistent = observationById(observations, ["inconsistent_sizing"]);
  const overtrader = observationById(observations, [
    "overtraded_same_ticker",
    "revenge_reentry_cluster",
    "chased_entry",
  ]);
  const completed = args.report.report.sampleSize.completedTradeCount;
  const signalFromObservations = (
    id: TraderArchetypeId,
    label: string,
    items: TraderMistakeObservation[],
  ) =>
    archetypeSignal({
      id,
      label,
      score:
        completed > 0
          ? (items.reduce((total, item) => total + item.occurrenceCount, 0) /
              completed) *
            100
          : 0,
      evidence: items.map((item) => item.reason),
      relatedTradeIds: items.flatMap((item) => item.tradeIds),
    });

  const signals = [
    signalFromObservations("reactive_scaler", "Reactive Scaler", reactive),
    signalFromObservations("early_seller", "Early Seller", earlySeller),
    signalFromObservations("over_holder", "Over-Holder", overHolder),
    archetypeSignal({
      id: "clean_executor",
      label: "Clean Executor",
      score:
        completed > 0
          ? ((cleanBucket?.tradeCount ?? 0) / completed) * 100 +
            ((cleanBucket?.averageQualityScore ?? 0) >= 75 ? 20 : 0)
          : 0,
      evidence: [
        cleanBucket
          ? `${cleanBucket.tradeCount} clean single-entry trade(s) in this report.`
          : "",
      ],
      relatedTradeIds: cleanBucket?.tradeIds ?? [],
    }),
    signalFromObservations("inconsistent_sizer", "Inconsistent Sizer", inconsistent),
    signalFromObservations("overtrader", "Overtrader", overtrader),
  ].sort((left, right) => right.score - left.score);
  const primary = signals[0] && signals[0].score > 0 ? signals[0] : null;

  return {
    primary,
    signals,
    summary: primary
      ? `${primary.label} is the strongest execution-only archetype signal in this report; treat it as a review prompt until more saved trades confirm it.`
      : "More saved execution trades are needed before an archetype signal is useful.",
  };
}

function statusForCount(count: number): CoachReviewCompletionStepStatus {
  if (count <= 0) {
    return "not_started";
  }

  return "complete";
}

export function buildCoachReviewCompletionLoop(args: {
  reviewWorkflow: TraderReviewWorkflow;
  ruleSimulations: CoachRuleSimulation[];
}): CoachReviewCompletionLoop {
  const steps: CoachReviewCompletionStep[] = [
    {
      id: "review_trade",
      label: "Review priority trade",
      status:
        args.reviewWorkflow.reviewedCount > 0
          ? "complete"
          : args.reviewWorkflow.needsReviewCount > 0
            ? "in_progress"
            : "not_started",
      detail: `${args.reviewWorkflow.needsReviewCount} review item(s) remain.`,
      relatedTradeIds: args.reviewWorkflow.items.flatMap((item) =>
        item.relatedTradeIds,
      ),
    },
    {
      id: "capture_lesson",
      label: "Capture lesson",
      status: statusForCount(args.reviewWorkflow.lessonCapturedCount),
      detail: `${args.reviewWorkflow.lessonCapturedCount} saved execution lesson item(s) captured.`,
      relatedTradeIds: args.reviewWorkflow.items
        .filter((item) => item.status === "lesson_captured")
        .flatMap((item) => item.relatedTradeIds),
    },
    {
      id: "create_rule",
      label: "Create or tighten rule",
      status:
        args.reviewWorkflow.ruleCreatedCount > 0 || args.ruleSimulations.length > 0
          ? "complete"
          : "not_started",
      detail: `${args.ruleSimulations.length} execution-only rule simulation(s) ready.`,
      relatedTradeIds: args.ruleSimulations.flatMap((item) => item.flaggedTradeIds),
    },
    {
      id: "verify_next_report",
      label: "Verify next report",
      status: "not_started",
      detail: "Needs a future saved execution report to confirm behavior changed.",
      relatedTradeIds: [],
    },
  ];
  const completed = steps.filter((step) => step.status === "complete").length;

  return {
    completionPct: Math.round((completed / steps.length) * 100),
    nextStep:
      steps.find((step) => step.status === "not_started") ??
      steps.find((step) => step.status === "in_progress") ??
      null,
    steps,
  };
}

function rowBucket(row: ProductTraderAnalyticsTradeRow): string {
  if (row.isOpenPosition) {
    return "open_position";
  }

  if (row.executionCount >= 5) {
    return "many_executions";
  }

  if (row.addCountAfterInitialEntry > 0) {
    return "scaled_trade";
  }

  return "simple_trade";
}

function similarityReasons(
  left: ProductTraderAnalyticsTradeRow,
  right: ProductTraderAnalyticsTradeRow,
): string[] {
  const reasons: string[] = [];

  if (left.symbol === right.symbol) {
    reasons.push("same symbol");
  }

  if (left.tradeDirection === right.tradeDirection) {
    reasons.push("same direction");
  }

  if (rowBucket(left) === rowBucket(right)) {
    reasons.push(rowBucket(left).replace(/_/g, " "));
  }

  if (left.topRisk?.id && left.topRisk.id === right.topRisk?.id) {
    reasons.push(`same risk: ${left.topRisk.label}`);
  }

  if (left.topStrength?.id && left.topStrength.id === right.topStrength?.id) {
    reasons.push(`same strength: ${left.topStrength.label}`);
  }

  return reasons;
}

export function buildTradeSimilarityFinder(args: {
  report: SavedTraderAnalyticsReport;
  qualityScorecards: TradeQualityScorecard[];
}): TradeSimilarityFinder {
  const rows = rowsWithTradeIds(args.report);
  const quality = qualityByTradeId(args.qualityScorecards);
  const groups: TradeSimilarityGroup[] = rows.map((row) => {
    const similarTrades: SimilarTradeRef[] = rows
      .filter((candidate) => candidate.tradeId !== row.tradeId)
      .map((candidate) => {
        const reasons = similarityReasons(row, candidate);

        return {
          tradeId: candidate.tradeId,
          symbol: candidate.symbol,
          grossRealizedPnl: candidate.grossRealizedPnl,
          qualityScore: quality.get(candidate.tradeId)?.overallScore ?? null,
          sharedReasons: reasons,
          similarityScore: reasons.length,
        };
      })
      .filter((candidate) => candidate.similarityScore > 0)
      .sort((left, right) => right.similarityScore - left.similarityScore)
      .slice(0, 3);

    return {
      anchorTradeId: row.tradeId,
      similarTrades,
    };
  });

  return { groups };
}

function costForMistake(
  costs: TraderMistakeCostEstimate[],
  taxonomyId: string,
): TraderMistakeCostEstimate | null {
  return costs.find((cost) => cost.taxonomyId === taxonomyId) ?? null;
}

export function buildMistakeSeverityLadder(args: {
  observations: TraderMistakeObservation[];
  productIntelligence: TraderProductIntelligenceViewModel;
}): MistakeSeverityLadder {
  const items: MistakeSeverityLadderItem[] = args.observations.map((observation) => {
    const cost = costForMistake(
      args.productIntelligence.mistakeCostEstimates.items,
      observation.taxonomyId,
    );
    const recurrenceLinked = args.productIntelligence.recurrenceAlerts.some(
      (alert) =>
        alert.relatedTradeIds.some((tradeId) =>
          observation.tradeIds.includes(tradeId),
        ),
    );
    const ruleViolationLinked = args.productIntelligence.ruleBuilderRecommendations.some(
      (recommendation) =>
        recommendation.relatedTradeIds.some((tradeId) =>
          observation.tradeIds.includes(tradeId),
        ),
    );
    const confidenceWeight =
      observation.confidence === "high"
        ? 24
        : observation.confidence === "medium"
          ? 14
          : 6;
    const estimatedGrossCost = cost?.estimatedGrossCost ?? 0;
    const severityScore = Math.round(
      observation.occurrenceCount * 12 +
        confidenceWeight +
        Math.min(estimatedGrossCost, 500) / 10 +
        (recurrenceLinked ? 12 : 0) +
        (ruleViolationLinked ? 10 : 0),
    );

    return {
      id: `severity:${observation.taxonomyId}`,
      taxonomyId: observation.taxonomyId,
      label: observation.label,
      severityScore,
      frequency: observation.occurrenceCount,
      estimatedGrossCost,
      confidence: observation.confidence,
      ruleViolationLinked,
      recurrenceLinked,
      relatedTradeIds: observation.tradeIds,
      nextAction: `Review ${observation.label.toLowerCase()} against the linked execution replays: ${observation.suggestedReviewAction}`,
    };
  });
  const sorted = items.sort((left, right) => right.severityScore - left.severityScore);

  return {
    topSeverity: sorted[0] ?? null,
    items: sorted,
  };
}

function confidencePhrase(confidence: "low" | "medium" | "high"): {
  phrase: CoachConfidencePhrase;
  evidenceLevel: CoachConfidenceLanguageItem["evidenceLevel"];
  copy: (label: string) => string;
} {
  if (confidence === "high") {
    return {
      phrase: "strongly_suggests",
      evidenceLevel: "strong",
      copy: (label) =>
        `Repeated execution-only evidence flags ${label.toLowerCase()}; review the linked trades before changing risk.`,
    };
  }

  if (confidence === "medium") {
    return {
      phrase: "may_indicate",
      evidenceLevel: "moderate",
      copy: (label) =>
        `Execution-only evidence may indicate ${label.toLowerCase()}; confirm the pattern against the trade replay.`,
    };
  }

  return {
    phrase: "review_manually",
    evidenceLevel: "limited",
    copy: (label) =>
      `Limited evidence: use the replay to check whether ${label.toLowerCase()} actually affected the trade.`,
  };
}

export function buildCoachConfidenceLanguage(args: {
  severityLadder: MistakeSeverityLadder;
}): CoachConfidenceLanguage {
  return {
    items: args.severityLadder.items.slice(0, 6).map((item) => {
      const phrase = confidencePhrase(item.confidence);

      return {
        sourceId: item.id,
        phrase: phrase.phrase,
        evidenceLevel: phrase.evidenceLevel,
        copy: phrase.copy(item.label),
      };
    }),
  };
}

export function buildCoachEmptyState(args: {
  report: SavedTraderAnalyticsReport;
}): CoachEmptyState {
  const rows = rowsWithTradeIds(args.report);

  if (rows.length === 0) {
    return {
      kind: "no_trades",
      title: "Import executions to start coaching",
      message: "The coach needs saved execution trades before it can build a review queue.",
      nextAction: "Import a broker CSV or save a sample trade batch.",
    };
  }

  if (rows.length === 1) {
    return {
      kind: "one_trade",
      title: "Review the first trade",
      message:
        "One saved execution trade is enough for replay, but recurring behavior needs more samples.",
      nextAction: "Open the trade replay and capture one lesson.",
    };
  }

  if (rows.every((row) => row.grossRealizedPnl > 0)) {
    return {
      kind: "all_winners",
      title: "Preserve what is working",
      message: "All reviewed trades are gross winners; use the replay to identify repeatable execution strengths.",
      nextAction: "Review the highest-quality winner and capture the execution behavior to repeat.",
    };
  }

  if (rows.every((row) => row.grossRealizedPnl < 0)) {
    return {
      kind: "all_losers",
      title: "Stabilize risk first",
      message: "All reviewed trades are gross losers; avoid broad conclusions and inspect the clearest execution risk.",
      nextAction: "Review the largest loss and choose one risk-control behavior to test next session.",
    };
  }

  if (args.report.sampleData) {
    return {
      kind: "sample_data",
      title: "Sample coach is ready",
      message: "This is fixture data, but the coach loop is ready for real imported executions.",
      nextAction: "Use the sample coach flow, then replace it with imported trades.",
    };
  }

  return {
    kind: "ready",
    title: "Coach is ready",
    message: "Saved execution-only evidence is available for coaching prompts.",
    nextAction: "Start with the top replay-backed coach action.",
  };
}

export function buildCoachSessionPrepCard(args: {
  report: SavedTraderAnalyticsReport;
  improvement: TraderImprovementIntelligence;
  severityLadder: MistakeSeverityLadder;
  ruleSimulations: CoachRuleSimulation[];
}): CoachSessionPrepCard {
  const coach = args.improvement.dailyCoachReport;
  const topSeverity = args.severityLadder.topSeverity;
  const rule = args.ruleSimulations[0] ?? null;
  const reviewTradeIds = unique([
    ...(coach.relatedTradeIds ?? []),
    ...(topSeverity?.relatedTradeIds ?? []),
    ...(rule?.flaggedTradeIds ?? []),
  ]).slice(0, 3);

  return {
    sessionDate: coach.sessionDate,
    title: `Prep for the next session after ${coach.sessionDate}`,
    ruleFocus: rule?.suggestedRuleTitle ?? coach.ruleFocus ?? "Review one execution rule at a time.",
    avoidBehavior:
      topSeverity
        ? `Watch for ${topSeverity.label.toLowerCase()} in the saved execution replay.`
        : coach.biggestMistake
          ? `Watch for ${coach.biggestMistake.label.toLowerCase()} in the saved execution replay.`
          : "Watch for the clearest recurring execution risk in the saved execution replay.",
    repeatBehavior:
      coach.bestRepeatableBehavior
        ? `Preserve ${coach.bestRepeatableBehavior.toLowerCase()} when the setup appears again, then replay confirm it stayed clean.`
        : "Repeat the clearest execution strength from your best trade, then replay confirm it stayed clean.",
    sessionTimeInsight: `Timing prompt: ${coach.sessionTimeInsight}`,
    reviewTradeIds,
    checklist: [
      `Open the priority trade and mark where ${(
        topSeverity?.label ?? "the main risk"
      ).toLowerCase()} first appeared.`,
      `Write the rule in one sentence: ${(
        rule?.suggestedRuleTitle ?? coach.ruleFocus ?? "protect the next trade"
      ).toLowerCase()}.`,
      `Use timing as a review prompt, not proof: ${coach.sessionTimeInsight}`,
      "After the next session, compare the replay against that rule before adding a new one.",
    ],
  };
}

export function buildCoachHomeViewModel(args: {
  emptyState: CoachEmptyState;
  sessionPrepCard: CoachSessionPrepCard;
  severityLadder: MistakeSeverityLadder;
  reviewCompletionLoop: CoachReviewCompletionLoop;
  ruleSimulations: CoachRuleSimulation[];
}): CoachHomeViewModel {
  const topSeverity = args.severityLadder.topSeverity;
  const primaryAction: CoachHomeAction =
    args.emptyState.kind !== "ready" && args.emptyState.kind !== "sample_data"
      ? {
          id: "empty-state-next-action",
          label: args.emptyState.title,
          detail: args.emptyState.nextAction,
          href: "/imports",
          priority: 1,
          relatedTradeIds: [],
        }
      : topSeverity
        ? {
            id: "review-top-severity",
            label: `Review ${topSeverity.label}`,
            detail: `Start with execution-only evidence: ${topSeverity.nextAction}`,
            href: topSeverity.relatedTradeIds[0]
              ? `/trades/${topSeverity.relatedTradeIds[0]}`
              : "/review",
            priority: 1,
            relatedTradeIds: topSeverity.relatedTradeIds,
          }
        : {
            id: "start-guided-review",
            label: "Start guided review",
            detail: args.sessionPrepCard.checklist[0],
            href: "/review",
            priority: 1,
            relatedTradeIds: args.sessionPrepCard.reviewTradeIds,
          };
  const actions: CoachHomeAction[] = [
    {
      ...primaryAction,
      label: `Open ${primaryAction.label.toLowerCase()}`,
    },
    {
      id: "prep-next-session",
      label: "Prep next session",
      detail: `Execution-only rule focus: ${args.sessionPrepCard.ruleFocus}`,
      href: "/coach",
      priority: 2,
      relatedTradeIds: args.sessionPrepCard.reviewTradeIds,
    },
    {
      id: "simulate-rule",
      label: "Simulate rule",
      detail:
        args.ruleSimulations[0]?.limitation ??
        "Rule simulation is ready after a rule recommendation appears.",
      href: "/review",
      priority: 3,
      relatedTradeIds: args.ruleSimulations[0]?.flaggedTradeIds ?? [],
    },
    {
      id: "complete-loop",
      label: "Complete review loop",
      detail:
        args.reviewCompletionLoop.nextStep?.detail ??
        "Review loop is complete for this report.",
      href: "/progress",
      priority: 4,
      relatedTradeIds: args.reviewCompletionLoop.nextStep?.relatedTradeIds ?? [],
    },
  ];

  return {
    headline: primaryAction.label,
    subhead: `First priority from saved execution evidence: ${primaryAction.detail}`,
    primaryAction,
    actions,
  };
}

export function buildTraderCoachActionLoop(args: {
  report: SavedTraderAnalyticsReport;
  trades: SavedExecutionTrade[];
  improvement: TraderImprovementIntelligence;
  productIntelligence: TraderProductIntelligenceViewModel;
  ruleEvaluations: TraderRuleEvaluation[];
  reviewWorkflow: TraderReviewWorkflow;
}): TraderCoachActionLoop {
  const mistakeTimeline = buildCoachMistakeTimeline({
    improvement: args.improvement,
  });
  const ruleSimulations = buildCoachRuleSimulations({
    recommendations: args.productIntelligence.ruleBuilderRecommendations,
  });
  const archetypeProfile = buildTraderArchetypeProfile({
    report: args.report,
    improvement: args.improvement,
  });
  const reviewCompletionLoop = buildCoachReviewCompletionLoop({
    reviewWorkflow: args.reviewWorkflow,
    ruleSimulations,
  });
  const tradeSimilarity = buildTradeSimilarityFinder({
    report: args.report,
    qualityScorecards: args.improvement.tradeQualityScorecards,
  });
  const mistakeSeverityLadder = buildMistakeSeverityLadder({
    observations: args.improvement.mistakeObservations,
    productIntelligence: args.productIntelligence,
  });
  const confidenceLanguage = buildCoachConfidenceLanguage({
    severityLadder: mistakeSeverityLadder,
  });
  const emptyState = buildCoachEmptyState({ report: args.report });
  const sessionPrepCard = buildCoachSessionPrepCard({
    report: args.report,
    improvement: args.improvement,
    severityLadder: mistakeSeverityLadder,
    ruleSimulations,
  });
  const coachHome = buildCoachHomeViewModel({
    emptyState,
    sessionPrepCard,
    severityLadder: mistakeSeverityLadder,
    reviewCompletionLoop,
    ruleSimulations,
  });

  return {
    source: "execution_only",
    marketContextUsedForConclusions: false,
    mistakeTimeline,
    ruleSimulations,
    archetypeProfile,
    sessionPrepCard,
    reviewCompletionLoop,
    tradeSimilarity,
    mistakeSeverityLadder,
    confidenceLanguage,
    emptyState,
    coachHome,
  };
}
