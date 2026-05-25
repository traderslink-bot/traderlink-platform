import type {
  CoachReviewQueue,
  CoachReviewQueueItem,
  ConfidenceCalibration,
  ConfidenceCalibrationItem,
  ConfidenceCalibrationPhrase,
  ExecutionQualityTrendline,
  ExecutionQualityTrendPoint,
  FirstImportExperience,
  FirstImportExperienceStep,
  PersonalPatternMemory,
  PersonalPatternMemoryItem,
  ProductEvidenceCard,
  ProductEvidenceConfidence,
  ProductTraderAnalyticsTradeRow,
  RuleCandidateLab,
  RuleCandidateLabItem,
  SavedExecutionTradeId,
  SavedTradeImportInbox,
  SavedTraderAnalyticsReport,
  SessionRecapViewModel,
  TradeGradeDriver,
  TradeGradeExplainability,
  TradeRepairInbox,
  TradeRepairInboxItem,
  TraderAnalyticsProductizationViewModel,
  TraderCoachActionLoop,
  TraderImprovementIntelligence,
  TraderProductIntelligenceViewModel,
  TraderProductPolishViewModel,
} from "./types";
import { mapUserFacingBehavior } from "../../user-facing-behavior";

function roundMetric(value: number): number {
  return Number(value.toFixed(4));
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

function gradeBand(score: number): TradeGradeExplainability["gradeBand"] {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "solid";
  }

  if (score >= 50) {
    return "mixed";
  }

  return "weak";
}

function confidenceCopy(confidence: ProductEvidenceConfidence): string {
  switch (confidence) {
    case "high":
      return "Repeated execution-only evidence supports reviewing this read.";
    case "medium":
      return "Some execution-only evidence exists; confirm it in replay.";
    case "low":
      return "Treat this as a review prompt until more trades confirm it.";
  }
}

function confidenceFromEvidence(args: {
  evidenceCount: number;
  sampleSize: number;
}): ProductEvidenceConfidence {
  if (args.sampleSize >= 8 && args.evidenceCount >= 3) {
    return "high";
  }

  if (args.sampleSize >= 3 && args.evidenceCount >= 2) {
    return "medium";
  }

  return "low";
}

function confidencePhrase(
  confidence: ProductEvidenceConfidence,
): ConfidenceCalibrationPhrase {
  switch (confidence) {
    case "high":
      return "strongly_suggests";
    case "medium":
      return "may_indicate";
    case "low":
      return "review_manually";
  }
}

function routeForTradeIds(tradeIds: SavedExecutionTradeId[]): string {
  return tradeIds[0] ? `/intelligence/trades/${tradeIds[0]}` : "/intelligence/review";
}

function lastSeenSessionDate(args: {
  rows: ProductTraderAnalyticsTradeRow[];
  tradeIds: SavedExecutionTradeId[];
}): string | null {
  return (
    args.rows
      .filter((row) => args.tradeIds.includes(row.tradeId))
      .sort((left, right) => right.sessionDate.localeCompare(left.sessionDate))[0]
      ?.sessionDate ?? null
  );
}

export function buildTradeGradeExplainability(args: {
  improvement: TraderImprovementIntelligence;
}): TradeGradeExplainability[] {
  return args.improvement.tradeQualityScorecards.map((scorecard) => {
    const drivers: TradeGradeDriver[] = scorecard.dimensions
      .filter((dimension) => dimension.id !== "overall")
      .map((dimension) => ({
        id: `${scorecard.tradeId}:${dimension.id}`,
        label: dimension.label,
        score: dimension.score,
        tone:
          dimension.score >= 75
            ? "positive"
            : dimension.score < 60
              ? "negative"
              : "neutral",
        explanation: dimension.detail,
        evidence: dimension.evidence,
      }));
    const positiveDrivers = drivers.filter((driver) => driver.tone === "positive");
    const negativeDrivers = drivers.filter((driver) => driver.tone === "negative");
    const neutralDrivers = drivers.filter((driver) => driver.tone === "neutral");
    const band = gradeBand(scorecard.overallScore);

    return {
      tradeId: scorecard.tradeId,
      symbol: scorecard.symbol,
      overallScore: scorecard.overallScore,
      gradeBand: band,
      summary:
        negativeDrivers.length > 0
          ? `${scorecard.symbol} graded ${band}; use the replay to review ${negativeDrivers[0].label.toLowerCase()} first.`
          : `${scorecard.symbol} graded ${band}; preserve the strongest execution behaviors if the replay confirms them.`,
      positiveDrivers,
      negativeDrivers,
      neutralDrivers,
      topRiskLabel: scorecard.topRiskLabel,
      topStrengthLabel: scorecard.topStrengthLabel,
      limitations: scorecard.limitations,
      nextReviewAction:
        negativeDrivers.length > 0
          ? `Open the saved trade replay and inspect ${negativeDrivers[0].label.toLowerCase()}.`
          : "Open the saved trade replay, then save the behavior that made this trade clean.",
      marketContextUsedForScoring: false,
    };
  });
}

export function buildProductEvidenceCards(args: {
  report: SavedTraderAnalyticsReport;
  importInbox: SavedTradeImportInbox;
  productIntelligence: TraderProductIntelligenceViewModel;
  improvement: TraderImprovementIntelligence;
  gradeExplainability: TradeGradeExplainability[];
}): ProductEvidenceCard[] {
  const sampleSize = args.report.report.sampleSize.completedTradeCount;
  const mistakeCards: ProductEvidenceCard[] =
    args.improvement.mistakeObservations
      .map((observation) => ({
        observation,
        behavior: mapUserFacingBehavior({
          behaviorId: observation.taxonomyId,
          rawLabel: observation.label,
          route: "/intelligence/coach",
        }),
      }))
      .filter(({ behavior }) => behavior.canDrivePrimaryConclusion)
      .slice(0, 5)
      .map(({ observation, behavior }) => ({
        id: `evidence:mistake:${observation.taxonomyId}`,
        source: "mistake",
        title: behavior.label,
        whatHappened: behavior.evidenceSentence,
        whyItMatters:
          "Repeated execution-only mistakes can turn into personal rules and review drills.",
        confidence: observation.confidence,
        confidenceCopy: confidenceCopy(observation.confidence),
        relatedTradeIds: observation.tradeIds,
        primaryRoute: routeForTradeIds(observation.tradeIds),
        reviewAction: behavior.fixFirstAction,
        marketContextUsedForConclusion: false,
      }));

  const qualityCards: ProductEvidenceCard[] = args.gradeExplainability
    .filter((grade) => grade.negativeDrivers.length > 0)
    .sort((left, right) => left.overallScore - right.overallScore)
    .slice(0, 3)
    .map((grade) => ({
      id: `evidence:quality:${grade.tradeId}`,
      source: "quality",
      title: `${grade.symbol} quality: ${grade.overallScore}/100`,
      whatHappened: grade.summary,
      whyItMatters:
        "Trade quality summarizes which execution choices appear to have hurt or helped the trade.",
      confidence: confidenceFromEvidence({
        evidenceCount: grade.negativeDrivers.length + grade.positiveDrivers.length,
        sampleSize,
      }),
      confidenceCopy: confidenceCopy(
        confidenceFromEvidence({
          evidenceCount:
            grade.negativeDrivers.length + grade.positiveDrivers.length,
          sampleSize,
        }),
      ),
      relatedTradeIds: [grade.tradeId],
      primaryRoute: `/intelligence/trades/${grade.tradeId}`,
      reviewAction: grade.nextReviewAction,
      marketContextUsedForConclusion: false,
    }));

  const ruleCards: ProductEvidenceCard[] =
    args.productIntelligence.ruleBuilderRecommendations
      .slice(0, 3)
      .map((recommendation) => ({
        id: `evidence:rule:${recommendation.id}`,
        source: "rule",
        title: recommendation.suggestedRuleTitle,
        whatHappened: recommendation.reason,
      whyItMatters:
          "Rule candidates turn repeated execution-only review findings into a behavior test.",
        confidence: confidenceFromEvidence({
          evidenceCount: recommendation.relatedTradeIds.length,
          sampleSize,
        }),
        confidenceCopy: confidenceCopy(
          confidenceFromEvidence({
            evidenceCount: recommendation.relatedTradeIds.length,
            sampleSize,
          }),
        ),
        relatedTradeIds: recommendation.relatedTradeIds,
        primaryRoute: "/intelligence/coach",
        reviewAction: "Review flagged trades before saving this as a rule.",
        marketContextUsedForConclusion: false,
      }));

  const importCards: ProductEvidenceCard[] = args.importInbox.items
    .filter((item) => item.status !== "ready_to_save")
    .slice(0, 3)
    .map((item) => ({
      id: `evidence:import:${item.id}`,
      source: "import",
      title: `${item.symbol ?? "Unknown"} import repair`,
      whatHappened: item.messages[0] ?? "This imported trade needs review.",
      whyItMatters:
        "Import repair keeps bad saved execution rows from becoming bad coaching evidence.",
      confidence: item.errorCount > 0 ? "high" : "medium",
      confidenceCopy: confidenceCopy(item.errorCount > 0 ? "high" : "medium"),
      relatedTradeIds: [],
      primaryRoute: "/intelligence/imports",
      reviewAction: item.primaryAction,
      marketContextUsedForConclusion: false,
    }));

  const strength = args.improvement.bestWorstPatterns.mostPromisingStrength;
  const strengthCards: ProductEvidenceCard[] = strength
    ? [
        {
          id: `evidence:strength:${strength.id}`,
          source: "strength",
          title: strength.label,
          whatHappened: strength.detail,
          whyItMatters:
            "The product should preserve repeatable strengths, not only fix leaks.",
          confidence: confidenceFromEvidence({
            evidenceCount: strength.relatedTradeIds.length,
            sampleSize,
          }),
          confidenceCopy: confidenceCopy(
            confidenceFromEvidence({
              evidenceCount: strength.relatedTradeIds.length,
              sampleSize,
            }),
          ),
          relatedTradeIds: strength.relatedTradeIds,
          primaryRoute: routeForTradeIds(strength.relatedTradeIds),
          reviewAction: "Save what made this behavior repeatable.",
          marketContextUsedForConclusion: false,
        },
      ]
    : [];

  return [
    ...importCards,
    ...mistakeCards,
    ...qualityCards,
    ...ruleCards,
    ...strengthCards,
  ];
}

export function buildTradeRepairInbox(args: {
  importInbox: SavedTradeImportInbox;
  productization: TraderAnalyticsProductizationViewModel;
}): TradeRepairInbox {
  const validationItems: TradeRepairInboxItem[] = args.importInbox.items
    .filter((item) => item.status !== "ready_to_save")
    .map((item) => ({
      id: `repair:validation:${item.id}`,
      severity: item.errorCount > 0 ? "blocker" : "warning",
      source: "validation",
      title: `${item.symbol ?? "Unknown"} import validation`,
      issueSummary: item.messages[0] ?? "Imported request needs review.",
      requestIndex: item.requestIndex,
      relatedTradeIds: [],
      suggestedFix: item.primaryAction,
      blocksAnalysis: item.errorCount > 0,
      priority: item.errorCount > 0 ? 100 : 70,
    }));
  const reconciliationItems: TradeRepairInboxItem[] =
    args.productization.reconciliation.items
      .filter((item) => item.status !== "ready")
      .map((item) => ({
        id: `repair:reconciliation:${item.id}`,
        severity: item.status === "rejected" ? "blocker" : "review",
        source: "reconciliation",
        title: `${item.symbol ?? "Unknown"} reconciliation`,
        issueSummary: item.messages[0] ?? item.recommendedAction,
        requestIndex: item.requestIndex,
        relatedTradeIds: item.duplicateTradeId ? [item.duplicateTradeId] : [],
        suggestedFix: item.recommendedAction,
        blocksAnalysis: item.status === "rejected",
        priority:
          item.status === "rejected" ? 95 : item.status === "duplicate" ? 65 : 60,
      }));
  const items = [...validationItems, ...reconciliationItems].sort(
    (left, right) => right.priority - left.priority,
  );
  const blockerCount = items.filter((item) => item.severity === "blocker").length;
  const warningCount = items.filter((item) => item.severity === "warning").length;
  const reviewCount = items.filter((item) => item.severity === "review").length;

  return {
    totalCount: items.length,
    blockerCount,
    warningCount,
    reviewCount,
    readyToAnalyze: blockerCount === 0,
    nextAction:
      blockerCount > 0
        ? "Fix blocked import rows before analysis."
        : items.length > 0
          ? "Review import warnings before saving."
          : "Imported trades are ready for in-app analysis.",
    items,
  };
}

export function buildFirstImportExperience(args: {
  importInbox: SavedTradeImportInbox;
  productization: TraderAnalyticsProductizationViewModel;
  repairInbox: TradeRepairInbox;
}): FirstImportExperience {
  const reconciliation = args.productization.reconciliation;
  const status =
    args.repairInbox.blockerCount > 0
      ? "blocked"
      : args.repairInbox.totalCount > 0
        ? "needs_review"
        : "ready";
  const stepStatus = (
    blocked: boolean,
    review: boolean,
  ): FirstImportExperienceStep["status"] =>
    blocked ? "blocked" : review ? "needs_review" : "complete";
  const steps: FirstImportExperienceStep[] = [
    {
      id: "choose_broker_file",
      label: "Choose broker file",
      status: "complete",
      detail:
        "The import lane supports execution CSVs from popular brokers plus generic CSV mapping.",
      nextAction: "Pick broker and upload the execution file in the later UI.",
    },
    {
      id: "detect_columns",
      label: "Detect columns",
      status: args.importInbox.totalCount > 0 ? "complete" : "upcoming",
      detail: `${args.importInbox.totalCount} grouped trade request(s) are visible in the current import preview.`,
      nextAction: "Confirm symbol, side, shares, price, and timestamp fields.",
    },
    {
      id: "validate_rows",
      label: "Validate rows",
      status: stepStatus(args.importInbox.rejectedCount > 0, args.importInbox.warningCount > 0),
      detail: `${args.importInbox.readyCount} ready, ${args.importInbox.needsReviewCount} need review, ${args.importInbox.rejectedCount} rejected.`,
      nextAction:
        args.importInbox.rejectedCount > 0
          ? "Fix rejected rows."
          : "Review warnings if any exist.",
    },
    {
      id: "group_trades",
      label: "Group trades",
      status: stepStatus(
        reconciliation.rejectedCount > 0,
        reconciliation.needsReviewCount > 0 || reconciliation.duplicateCount > 0,
      ),
      detail: `${reconciliation.readyCount} ready, ${reconciliation.duplicateCount} duplicate, ${reconciliation.needsReviewCount} need review.`,
      nextAction: "Confirm grouped trade boundaries before saving.",
    },
    {
      id: "repair_items",
      label: "Repair items",
      status: stepStatus(args.repairInbox.blockerCount > 0, args.repairInbox.totalCount > 0),
      detail: `${args.repairInbox.totalCount} repair item(s), ${args.repairInbox.blockerCount} blocker(s).`,
      nextAction: args.repairInbox.nextAction,
    },
    {
      id: "save_in_app",
      label: "Save in app",
      status: status === "ready" ? "complete" : "upcoming",
      detail:
        "Clean imports become saved trades and stay reviewable inside the product.",
      nextAction:
        status === "ready"
          ? "Save imported trades to analytics."
          : "Complete import review first.",
    },
  ];

  return {
    status,
    headline:
      status === "ready"
        ? "Import is ready for analysis"
        : status === "blocked"
          ? "Fix import blockers first"
          : "Review import warnings",
    summary:
      "This flow keeps broker execution data clean before it becomes coaching evidence.",
    supportedBrokerLabels: [
      "IBKR",
      "Moomoo",
      "Webull",
      "Robinhood",
      "Schwab",
      "Generic CSV",
    ],
    acceptedTradeCount: args.importInbox.readyCount,
    rejectedTradeCount: args.importInbox.rejectedCount,
    warningCount: args.importInbox.warningCount,
    duplicateCount: reconciliation.duplicateCount,
    needsReviewCount:
      args.importInbox.needsReviewCount + reconciliation.needsReviewCount,
    nextAction: args.repairInbox.nextAction,
    steps,
  };
}

export function buildPersonalPatternMemory(args: {
  report: SavedTraderAnalyticsReport;
  improvement: TraderImprovementIntelligence;
  coachActionLoop: TraderCoachActionLoop;
}): PersonalPatternMemory {
  const rows = rowsWithTradeIds(args.report);
  const leakItems: PersonalPatternMemoryItem[] =
    args.coachActionLoop.mistakeSeverityLadder.items.slice(0, 5).map((item) => ({
      id: `memory:leak:${item.taxonomyId}`,
      kind: "leak_to_fix",
      label: item.label,
      summary: `${item.frequency} occurrence(s), estimated gross cost ${item.estimatedGrossCost.toFixed(2)}.`,
      occurrenceCount: item.frequency,
      confidence: item.confidence,
      relatedTradeIds: item.relatedTradeIds,
      lastSeenSessionDate: lastSeenSessionDate({
        rows,
        tradeIds: item.relatedTradeIds,
      }),
      nextAction: item.nextAction,
    }));
  const best = args.improvement.bestWorstPatterns.mostPromisingStrength;
  const protectItems: PersonalPatternMemoryItem[] = best
    ? [
        {
          id: `memory:strength:${best.id}`,
          kind: "behavior_to_protect",
          label: best.label,
          summary: best.detail,
          occurrenceCount: best.relatedTradeIds.length,
          confidence: confidenceFromEvidence({
            evidenceCount: best.relatedTradeIds.length,
            sampleSize: args.report.report.sampleSize.completedTradeCount,
          }),
          relatedTradeIds: best.relatedTradeIds,
          lastSeenSessionDate: lastSeenSessionDate({
            rows,
            tradeIds: best.relatedTradeIds,
          }),
          nextAction: "Write down the behavior that made this repeatable.",
        },
      ]
    : [];
  const watch = args.improvement.bestWorstPatterns.lossAssociatedAttribute;
  const watchItems: PersonalPatternMemoryItem[] = watch
    ? [
        {
          id: `memory:watch:${watch.id}`,
          kind: "watch_pattern",
          label: watch.label,
          summary: watch.detail,
          occurrenceCount: watch.relatedTradeIds.length,
          confidence: confidenceFromEvidence({
            evidenceCount: watch.relatedTradeIds.length,
            sampleSize: args.report.report.sampleSize.completedTradeCount,
          }),
          relatedTradeIds: watch.relatedTradeIds,
          lastSeenSessionDate: lastSeenSessionDate({
            rows,
            tradeIds: watch.relatedTradeIds,
          }),
          nextAction: "Watch whether this attribute keeps appearing on losers.",
        },
      ]
    : [];
  const items = [...leakItems, ...protectItems, ...watchItems];

  return {
    totalCount: items.length,
    primaryLeak: leakItems[0] ?? null,
    primaryStrength: protectItems[0] ?? null,
    items,
  };
}

export function buildRuleCandidateLab(args: {
  productIntelligence: TraderProductIntelligenceViewModel;
  coachActionLoop: TraderCoachActionLoop;
  sampleSize: number;
}): RuleCandidateLab {
  const items: RuleCandidateLabItem[] =
    args.productIntelligence.ruleBuilderRecommendations.map((recommendation) => {
      const simulation = args.coachActionLoop.ruleSimulations.find(
        (candidate) => candidate.recommendationId === recommendation.id,
      );
      const flaggedTradeCount =
        simulation?.flaggedTradeCount ?? recommendation.relatedTradeIds.length;
      const readiness: RuleCandidateLabItem["readiness"] =
        flaggedTradeCount >= 3 && args.sampleSize >= 8
          ? "ready_to_test"
          : flaggedTradeCount >= 1
            ? "needs_review"
            : "needs_more_data";

      return {
        id: `rule-lab:${recommendation.id}`,
        suggestedRuleTitle: recommendation.suggestedRuleTitle,
        reason: recommendation.reason,
        defaultParameters: recommendation.defaultParameters,
        flaggedTradeIds:
          simulation?.flaggedTradeIds ?? recommendation.relatedTradeIds,
        expectedSuccessMetric: recommendation.expectedSuccessMetric,
        readiness,
        reviewStatus:
          readiness === "ready_to_test"
            ? "review_before_saving"
            : "draft_not_saved",
        limitation:
          simulation?.limitation ??
          "Rule lab flags past trades only; it does not estimate alternate P/L.",
      };
    });

  return {
    totalCount: items.length,
    readyCount: items.filter((item) => item.readiness === "ready_to_test").length,
    nextAction:
      items.length > 0
        ? "Review flagged trades before saving a rule."
        : "Collect more reviewed trades before creating rules.",
    items,
  };
}

export function buildSessionRecapViewModel(args: {
  improvement: TraderImprovementIntelligence;
}): SessionRecapViewModel {
  const coach = args.improvement.dailyCoachReport;

  return {
    sessionDate: coach.sessionDate,
    tradeCount: coach.tradeCount,
    headline: coach.biggestMistake?.label
      ? `Session leak: ${coach.biggestMistake.label}`
      : coach.bestRepeatableBehavior
        ? `Session strength: ${coach.bestRepeatableBehavior}`
        : "Review the latest session",
    bestTrade: coach.bestTrade,
    worstTrade: coach.worstTrade,
    biggestLeak: coach.biggestMistake?.label ?? null,
    repeatableBehavior: coach.bestRepeatableBehavior,
    ruleFocus: coach.ruleFocus,
    nextAction: `Session recap action: ${coach.fixNextSession}`,
    reviewTradeIds: coach.relatedTradeIds,
    marketContextUsedForConclusions: false,
  };
}

export function buildConfidenceCalibration(args: {
  report: SavedTraderAnalyticsReport;
  evidenceCards: ProductEvidenceCard[];
  personalPatternMemory: PersonalPatternMemory;
}): ConfidenceCalibration {
  const sampleSize = args.report.report.sampleSize.completedTradeCount;
  const items: ConfidenceCalibrationItem[] = [
    ...args.evidenceCards.slice(0, 8).map((card) => {
      const confidence = confidenceFromEvidence({
        evidenceCount: Math.max(card.relatedTradeIds.length, 1),
        sampleSize,
      });

      return {
        id: `confidence:evidence:${card.id}`,
        sourceId: card.id,
        label: card.title,
        evidenceCount: Math.max(card.relatedTradeIds.length, 1),
        sampleSize,
        confidence,
        phrase: confidencePhrase(confidence),
        copy: confidenceCopy(confidence),
      };
    }),
    ...args.personalPatternMemory.items.slice(0, 5).map((item) => ({
      id: `confidence:memory:${item.id}`,
      sourceId: item.id,
      label: item.label,
      evidenceCount: item.occurrenceCount,
      sampleSize,
      confidence: item.confidence,
      phrase: confidencePhrase(item.confidence),
      copy: confidenceCopy(item.confidence),
    })),
  ];

  return {
    sampleSize,
    sampleData: args.report.sampleData,
    summary:
      sampleSize < 5
        ? "Use cautious language until more trades are reviewed."
        : args.report.sampleData
          ? "Sample data is useful for UI testing; calibrate copy on real saved trades later."
          : "Confidence wording is based on repeated execution evidence.",
    items,
  };
}

export function buildExecutionQualityTrendline(args: {
  gradeExplainability: TradeGradeExplainability[];
}): ExecutionQualityTrendline {
  const points: ExecutionQualityTrendPoint[] = args.gradeExplainability.map(
    (grade, index, all) => {
      const previousScore = all[index - 1]?.overallScore ?? null;
      const delta =
        previousScore === null ? null : roundMetric(grade.overallScore - previousScore);
      const direction: ExecutionQualityTrendPoint["direction"] =
        delta === null
          ? "first"
          : delta > 2
            ? "improving"
            : delta < -2
              ? "worsening"
              : "flat";

      return {
        tradeId: grade.tradeId,
        label: `${grade.symbol} ${index + 1}`,
        score: grade.overallScore,
        previousScore,
        delta,
        direction,
        gradeBand: grade.gradeBand,
        nextReviewAction: grade.nextReviewAction,
      };
    },
  );
  const scores = points.map((point) => point.score);
  const averageScore =
    scores.length > 0
      ? roundMetric(scores.reduce((total, score) => total + score, 0) / scores.length)
      : null;
  const improvingCount = points.filter((point) => point.direction === "improving")
    .length;
  const worseningCount = points.filter((point) => point.direction === "worsening")
    .length;

  return {
    averageScore,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    worstScore: scores.length > 0 ? Math.min(...scores) : null,
    improvingCount,
    worseningCount,
    reportTrendSummary:
      points.length < 2
        ? "More trades are needed for a quality trend."
        : improvingCount > worseningCount
          ? "Recent execution quality has more improving steps than worsening steps."
          : worseningCount > improvingCount
            ? "Recent execution quality has more weakening steps than improving steps."
            : "Recent execution quality is mixed.",
    points,
  };
}

export function buildCoachReviewQueue(args: {
  repairInbox: TradeRepairInbox;
  productIntelligence: TraderProductIntelligenceViewModel;
  personalPatternMemory: PersonalPatternMemory;
  ruleCandidateLab: RuleCandidateLab;
  gradeExplainability: TradeGradeExplainability[];
}): CoachReviewQueue {
  const items: CoachReviewQueueItem[] = [];
  const repair = args.repairInbox.items[0];
  const topCost = args.productIntelligence.mistakeCostEstimates.topCostDriver;
  const leak = args.personalPatternMemory.primaryLeak;
  const strength = args.personalPatternMemory.primaryStrength;
  const rule = args.ruleCandidateLab.items[0];
  const weakestTrade = [...args.gradeExplainability].sort(
    (left, right) => left.overallScore - right.overallScore,
  )[0];

  if (repair) {
    items.push({
      id: "coach-queue:import-repair",
      lane: "import_repair",
      priority: repair.priority + 20,
      title: repair.title,
      reason: repair.issueSummary,
      href: "/intelligence/imports",
      relatedTradeIds: repair.relatedTradeIds,
      nextAction: repair.suggestedFix,
    });
  }

  if (topCost) {
    items.push({
      id: "coach-queue:cost-driver",
      lane: "cost_driver",
      priority: 95,
      title: `Cost driver: ${topCost.label}`,
      reason: `Estimated gross cost ${topCost.estimatedGrossCost.toFixed(2)} across ${topCost.affectedTradeCount} trade(s).`,
      href: routeForTradeIds(topCost.relatedTradeIds),
      relatedTradeIds: topCost.relatedTradeIds,
      nextAction: "Review linked trade replays in the highest-cost execution mistake cluster.",
    });
  }

  if (leak) {
    items.push({
      id: "coach-queue:behavior-memory",
      lane: "behavior_memory",
      priority: 85,
      title: `Pattern memory: ${leak.label}`,
      reason: leak.summary,
      href: routeForTradeIds(leak.relatedTradeIds),
      relatedTradeIds: leak.relatedTradeIds,
      nextAction: `Replay linked trades for pattern review: ${leak.nextAction}`,
    });
  }

  if (rule) {
    items.push({
      id: "coach-queue:rule-candidate",
      lane: "rule_candidate",
      priority: rule.readiness === "ready_to_test" ? 80 : 68,
      title: `Rule to test: ${rule.suggestedRuleTitle}`,
      reason: rule.reason,
      href: "/intelligence/coach",
      relatedTradeIds: rule.flaggedTradeIds,
      nextAction: "Review linked trade replays in the rule lab before saving this rule.",
    });
  }

  if (weakestTrade) {
    items.push({
      id: "coach-queue:trade-grade",
      lane: "trade_grade",
      priority: 72,
      title: `${weakestTrade.symbol} lowest quality trade`,
      reason: weakestTrade.summary,
      href: `/intelligence/trades/${weakestTrade.tradeId}`,
      relatedTradeIds: [weakestTrade.tradeId],
      nextAction: weakestTrade.nextReviewAction,
    });
  }

  if (strength) {
    items.push({
      id: "coach-queue:strength",
      lane: "strength",
      priority: 55,
      title: `Strength to preserve: ${strength.label}`,
      reason: strength.summary,
      href: routeForTradeIds(strength.relatedTradeIds),
      relatedTradeIds: strength.relatedTradeIds,
      nextAction: `Replay linked strength trades: ${strength.nextAction}`,
    });
  }

  const sorted = items.sort((left, right) => right.priority - left.priority);

  return {
    totalCount: sorted.length,
    primaryItem: sorted[0] ?? null,
    items: sorted,
  };
}

export function buildTraderProductPolishViewModel(args: {
  report: SavedTraderAnalyticsReport;
  importInbox: SavedTradeImportInbox;
  productization: TraderAnalyticsProductizationViewModel;
  productIntelligence: TraderProductIntelligenceViewModel;
  improvement: TraderImprovementIntelligence;
  coachActionLoop: TraderCoachActionLoop;
}): TraderProductPolishViewModel {
  const gradeExplainability = buildTradeGradeExplainability({
    improvement: args.improvement,
  });
  const evidenceCards = buildProductEvidenceCards({
    report: args.report,
    importInbox: args.importInbox,
    productIntelligence: args.productIntelligence,
    improvement: args.improvement,
    gradeExplainability,
  });
  const tradeRepairInbox = buildTradeRepairInbox({
    importInbox: args.importInbox,
    productization: args.productization,
  });
  const firstImportExperience = buildFirstImportExperience({
    importInbox: args.importInbox,
    productization: args.productization,
    repairInbox: tradeRepairInbox,
  });
  const personalPatternMemory = buildPersonalPatternMemory({
    report: args.report,
    improvement: args.improvement,
    coachActionLoop: args.coachActionLoop,
  });
  const ruleCandidateLab = buildRuleCandidateLab({
    productIntelligence: args.productIntelligence,
    coachActionLoop: args.coachActionLoop,
    sampleSize: args.report.report.sampleSize.completedTradeCount,
  });
  const sessionRecap = buildSessionRecapViewModel({
    improvement: args.improvement,
  });
  const confidenceCalibration = buildConfidenceCalibration({
    report: args.report,
    evidenceCards,
    personalPatternMemory,
  });
  const executionQualityTrendline = buildExecutionQualityTrendline({
    gradeExplainability,
  });
  const coachReviewQueue = buildCoachReviewQueue({
    repairInbox: tradeRepairInbox,
    productIntelligence: args.productIntelligence,
    personalPatternMemory,
    ruleCandidateLab,
    gradeExplainability,
  });

  return {
    source: "execution_only",
    marketContextUsedForConclusions: false,
    evidenceCards,
    gradeExplainability,
    firstImportExperience,
    tradeRepairInbox,
    personalPatternMemory,
    ruleCandidateLab,
    sessionRecap,
    confidenceCalibration,
    executionQualityTrendline,
    coachReviewQueue,
  };
}
