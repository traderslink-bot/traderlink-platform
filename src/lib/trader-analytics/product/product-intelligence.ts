import type {
  AnalysisConfidenceBadge,
  BehaviorRecurrenceAlert,
  BrokerImportFingerprintLibrary,
  BrokerImportFingerprintLibraryEntry,
  BrokerCsvImportProductDiagnostics,
  BrokerCsvMappingLearningSignal,
  MarketContextCalibrationQueue,
  MarketContextReadinessGate,
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTrade,
  SavedTraderAnalyticsReport,
  TraderFocusQueueItem,
  TraderMistakeCostEstimate,
  TraderMistakeCostEstimateSummary,
  TraderMistakeObservation,
  TraderMistakeTaxonomyId,
  TraderMistakeTaxonomyItem,
  TraderMistakeTaxonomySummary,
  TraderProductIntelligenceViewModel,
  TraderReviewWorkflow,
  TraderRuleBuilderRecommendation,
  TraderRuleEvaluation,
  TraderScoreDimension,
  TraderScorecard,
  TraderScoreTrend,
  UnifiedReviewQueue,
  UnifiedReviewQueueItem,
  UnifiedReviewQueueLane,
} from "./types";
import { buildFilteredTraderAnalyticsView } from "./selectors";
import { mapUserFacingBehavior } from "../../user-facing-behavior";

export const TRADER_MISTAKE_TAXONOMY: TraderMistakeTaxonomyItem[] = [
  {
    id: "chased_entry",
    label: "Chased Entry",
    description:
      "Fast execution clustering that may indicate the trader entered reactively.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: ["rapid_fire_execution_cluster"],
  },
  {
    id: "scaled_loser",
    label: "Review Add After Adverse Movement",
    description:
      "Size was increased after adverse movement; chart context decides whether this was a planned dip buy or added risk.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["size_expansion_after_adverse_price"],
  },
  {
    id: "revenge_reentry_cluster",
    label: "Revenge-Like Re-Entry Cluster",
    description:
      "A rapid execution cluster appeared on a risky or losing trade and should be reviewed for reactive re-entry.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["rapid_fire_execution_cluster"],
  },
  {
    id: "add_after_adverse_move",
    label: "Review Add After Adverse Movement",
    description:
      "The trader added size after adverse movement; market context is needed before calling the add weak or constructive.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["size_expansion_after_adverse_price"],
  },
  {
    id: "overbuilt_losing_position",
    label: "Overbuilt Losing Position",
    description:
      "The position became too large while the trade later finished as a gross loser.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["overbuilt_position"],
  },
  {
    id: "poor_first_reduction",
    label: "Poor First Reduction",
    description:
      "The first risk reduction was too small to materially protect the position.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: ["small_first_risk_reduction"],
  },
  {
    id: "all_or_nothing_exit_after_many_adds",
    label: "All-Or-Nothing Exit After Many Adds",
    description:
      "The trade used several adds before exiting in one heavy reduction sequence.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["all_or_nothing_exit_after_many_adds"],
  },
  {
    id: "early_winner_exit",
    label: "Early Winner Exit",
    description:
      "The first reduction was small or structurally weak from execution-only evidence.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: ["small_first_risk_reduction"],
  },
  {
    id: "held_loser_too_long",
    label: "Held Losing Trade Too Long",
    description:
      "The trade remained open or left risk behind after the execution sequence.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["open_position_trade", "open_position_leftover"],
  },
  {
    id: "overtraded_same_ticker",
    label: "Overtraded Same Ticker",
    description:
      "The same symbol appeared repeatedly with risky or losing execution outcomes.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: ["rapid_fire_execution_cluster"],
  },
  {
    id: "impulsive_reversal",
    label: "Impulsive Reversal",
    description:
      "Execution sequence suggests a reactive direction or position reset pattern.",
    severity: "medium",
    sourceKind: "market_context_later",
    relatedRiskIds: [],
  },
  {
    id: "partialed_without_plan",
    label: "Partialed Without Plan",
    description:
      "Reduction behavior looks inconsistent or overly late from execution-only evidence.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: [
      "small_first_risk_reduction",
      "all_or_nothing_exit_after_many_adds",
    ],
  },
  {
    id: "added_after_failed_premise",
    label: "Added Several Times Before Reducing Size",
    description:
      "Multiple adds occurred before the first meaningful size reduction.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: [
      "multiple_adds_before_first_reduction",
      "overbuilt_position",
    ],
  },
  {
    id: "left_open_position",
    label: "Left Open Position",
    description:
      "The execution sequence ended with remaining shares instead of closing flat.",
    severity: "high",
    sourceKind: "execution_only",
    relatedRiskIds: ["open_position_trade", "open_position_leftover"],
  },
  {
    id: "inconsistent_sizing",
    label: "Inconsistent Sizing",
    description:
      "Share-size changes varied enough to make risk harder to control.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: ["inconsistent_share_sizing"],
  },
  {
    id: "repeated_rule_violation",
    label: "Repeated Rule Violation",
    description:
      "A personal rule was violated on multiple trades in the current report.",
    severity: "medium",
    sourceKind: "execution_only",
    relatedRiskIds: [],
  },
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function rowsWithIds(report: SavedTraderAnalyticsReport): ProductTraderAnalyticsTradeRow[] {
  return buildFilteredTraderAnalyticsView({ report }).rows;
}

function riskIdsForRow(args: {
  report: SavedTraderAnalyticsReport;
  row: ProductTraderAnalyticsTradeRow;
}): string[] {
  const summary = args.report.sourceSummaries.find(
    (candidate) => candidate.requestIndex === args.row.requestIndex,
  )?.summary;

  return summary?.points.risks.map((risk) => risk.id) ?? [];
}

function rowMatchesTaxonomy(args: {
  report: SavedTraderAnalyticsReport;
  row: ProductTraderAnalyticsTradeRow;
  taxonomy: TraderMistakeTaxonomyItem;
}): boolean {
  const riskIds = riskIdsForRow(args);
  const hasRelatedRisk = args.taxonomy.relatedRiskIds.some((riskId) =>
    riskIds.includes(riskId),
  );
  const usesCustomPredicate = [
    "revenge_reentry_cluster",
    "overbuilt_losing_position",
  ].includes(args.taxonomy.id);

  if (hasRelatedRisk && !usesCustomPredicate) {
    return true;
  }

  switch (args.taxonomy.id) {
    case "scaled_loser":
    case "add_after_adverse_move":
      return args.row.adversePriceAddCount > 0;
    case "revenge_reentry_cluster":
      return (
        args.row.grossRealizedPnl < 0 &&
        riskIds.includes("rapid_fire_execution_cluster")
      );
    case "overbuilt_losing_position":
      return (
        args.row.grossRealizedPnl < 0 &&
        (riskIds.includes("overbuilt_position") ||
          args.row.addCountAfterInitialEntry >= 3)
      );
    case "poor_first_reduction":
      return riskIds.includes("small_first_risk_reduction");
    case "all_or_nothing_exit_after_many_adds":
      return riskIds.includes("all_or_nothing_exit_after_many_adds");
    case "held_loser_too_long":
    case "left_open_position":
      return args.row.isOpenPosition;
    case "added_after_failed_premise":
      return args.row.addCountAfterInitialEntry >= 3 && args.row.reductionCount === 0;
    case "overtraded_same_ticker":
      return false;
    default:
      return false;
  }
}

function mapProductBehavior(args: {
  label: string;
  route?: "/coach" | "/analytics" | "/review" | "/progress" | "/trades" | "/trades/[tradeId]";
  taxonomyId: string;
}) {
  return mapUserFacingBehavior({
    behaviorId: args.taxonomyId,
    rawLabel: args.label,
    route: args.route ?? "/coach",
  });
}

function certifiedProductBehavior(observation: TraderMistakeObservation) {
  const behavior = mapProductBehavior({
    label: observation.label,
    taxonomyId: observation.taxonomyId,
  });

  return behavior.canDrivePrimaryConclusion ? behavior : null;
}

function overtradedSameTickerObservation(
  rows: ProductTraderAnalyticsTradeRow[],
): TraderMistakeObservation | null {
  const riskyRows = rows.filter(
    (row) => row.grossRealizedPnl < 0 || row.topRisk !== null,
  );
  const bySymbol = new Map<string, ProductTraderAnalyticsTradeRow[]>();

  for (const row of riskyRows) {
    bySymbol.set(row.symbol, [...(bySymbol.get(row.symbol) ?? []), row]);
  }

  const repeated = [...bySymbol.entries()]
    .filter(([, symbolRows]) => symbolRows.length >= 2)
    .sort((left, right) => right[1].length - left[1].length)[0];

  if (!repeated) {
    return null;
  }

  const [symbol, symbolRows] = repeated;

  return {
    taxonomyId: "overtraded_same_ticker",
    label: `Repeated risky ${symbol} trades`,
    tradeIds: symbolRows.map((row) => row.tradeId),
    requestIndexes: symbolRows.map((row) => row.requestIndex),
    occurrenceCount: symbolRows.length,
    sourceRiskIds: [
      ...new Set(
        symbolRows.flatMap((row) => row.topRisk?.id ?? []),
      ),
    ],
    confidence: symbolRows.length >= 3 ? "high" : "medium",
    reason: `${symbolRows.length} risky or losing ${symbol} trades appeared in the same saved report.`,
    suggestedReviewAction:
      `Compare the saved execution replays for ${symbol} side by side and decide whether a same-symbol cooldown rule is needed.`,
  };
}

function suggestedReviewActionForTaxonomy(args: {
  taxonomyId: string;
  matchedRows: ProductTraderAnalyticsTradeRow[];
}): string {
  const tradeWord = args.matchedRows.length === 1 ? "trade" : "trades";

  switch (args.taxonomyId) {
    case "chased_entry":
      return `Replay the entry on the related ${tradeWord} and write the condition that would have kept you from paying up.`;
    case "scaled_loser":
    case "add_after_adverse_move":
      return `Inspect each add on the related ${tradeWord} and mark whether price had improved before size increased.`;
    case "overbuilt_losing_position":
    case "added_after_failed_premise":
      return `Review the position-size build on the related ${tradeWord} and define where adding had to stop.`;
    case "poor_first_reduction":
    case "partialed_without_plan":
      return `Replay the first reduction on the related ${tradeWord} and decide what profit-protection trigger was missing.`;
    case "early_winner_exit":
      return `Review the final exit on the related ${tradeWord} and write what evidence would justify holding the last piece.`;
    case "held_loser_too_long":
    case "left_open_position":
      return `Review the final exposure on the related ${tradeWord} and define the condition that should force the trade flat.`;
    case "inconsistent_sizing":
      return `Compare share sizes across the related ${tradeWord} and set one sizing rule for similar setups.`;
    case "revenge_reentry_cluster":
      return `Compare the re-entry sequence on the related ${tradeWord} and decide where a cooldown should begin.`;
    default:
      return `Open the related ${tradeWord} and inspect the execution replay before changing a rule.`;
  }
}

export function buildTraderMistakeTaxonomySummary(
  report: SavedTraderAnalyticsReport,
): TraderMistakeTaxonomySummary {
  const rows = rowsWithIds(report);
  const observations = TRADER_MISTAKE_TAXONOMY.flatMap((taxonomy) => {
    if (taxonomy.id === "overtraded_same_ticker") {
      const observation = overtradedSameTickerObservation(rows);
      return observation ? [observation] : [];
    }

    const matchedRows = rows.filter((row) =>
      rowMatchesTaxonomy({ report, row, taxonomy }),
    );

    if (matchedRows.length === 0) {
      return [];
    }

    return [
      {
        taxonomyId: taxonomy.id,
        label: mapProductBehavior({
          label: taxonomy.label,
          taxonomyId: taxonomy.id,
        }).label,
        tradeIds: matchedRows.map((row) => row.tradeId),
        requestIndexes: matchedRows.map((row) => row.requestIndex),
        occurrenceCount: matchedRows.length,
        sourceRiskIds: [
          ...new Set(
            matchedRows.flatMap((row) =>
              riskIdsForRow({ report, row }).filter((riskId) =>
                taxonomy.relatedRiskIds.includes(riskId),
              ),
            ),
          ),
        ],
        confidence: matchedRows.length >= 3 ? "high" : "medium",
        reason: `${mapProductBehavior({
          label: taxonomy.label,
          taxonomyId: taxonomy.id,
        }).evidenceSentence} Matched ${matchedRows.length} reviewed trade${matchedRows.length === 1 ? "" : "s"} from execution-only evidence.`,
        suggestedReviewAction: suggestedReviewActionForTaxonomy({
          taxonomyId: taxonomy.id,
          matchedRows,
        }),
      } satisfies TraderMistakeObservation,
    ];
  });

  return {
    taxonomy: TRADER_MISTAKE_TAXONOMY,
    observations,
  };
}

function ratio(count: number, denominator: number): number {
  return denominator > 0 ? count / denominator : 0;
}

function buildScoreDimensions(
  report: SavedTraderAnalyticsReport,
): TraderScoreDimension[] {
  const completed = report.report.sampleSize.completedTradeCount;
  const sampleSizeWarning = completed < 10;
  const adverseRate = report.report.executionBehavior.adversePriceAddRate ?? 0;
  const openRate = report.report.lifecycle.openPositionRate ?? 0;
  const rapidRate = ratio(
    report.report.executionBehavior.rapidFireExecutionTradeCount,
    completed,
  );
  const multipleAddsRate =
    report.report.executionBehavior.multipleAddsBeforeReductionRate ?? 0;
  const inconsistentRate = ratio(
    report.report.executionBehavior.inconsistentShareSizingTradeCount,
    completed,
  );
  const allOrNothingRate = ratio(
    report.report.executionBehavior.allOrNothingExitAfterManyAddsTradeCount,
    completed,
  );
  const decisiveExitRate = ratio(
    report.report.strengths.decisiveFullExitCount,
    completed,
  );
  const structuredExitRate = ratio(
    report.report.strengths.structuredPartialExitSequenceCount,
    completed,
  );
  const cleanTradeRate = ratio(
    report.report.strengths.cleanSingleEntryFullExitCount,
    completed,
  );
  const winRate = report.report.pnl.grossWinRate ?? 0;
  const pnlDirectionBoost =
    report.report.pnl.grossTotalRealizedPnl > 0
      ? 18
      : report.report.pnl.grossTotalRealizedPnl < 0
        ? -18
        : 0;
  const dimensions: TraderScoreDimension[] = [
    {
      id: "discipline",
      label: "Discipline",
      score: clampScore(
        100 - adverseRate * 35 - rapidRate * 25 - multipleAddsRate * 20,
      ),
      sampleSizeWarning,
      detail:
        "Execution-only discipline score flags adds after price moved against the position, unusually tight execution clusters, and repeated adds before reduction.",
    },
    {
      id: "exit_quality",
      label: "Exit Quality",
      score: clampScore(
        65 + decisiveExitRate * 20 + structuredExitRate * 15 -
          openRate * 30 -
          allOrNothingRate * 20,
      ),
      sampleSizeWarning,
      detail:
        "Exit quality uses clean full exits, structured reductions, shares left open, and all-or-nothing exits.",
    },
    {
      id: "risk_control",
      label: "Risk Control",
      score: clampScore(
        100 -
          adverseRate * 35 -
          openRate * 30 -
          ratio(report.report.executionBehavior.overbuiltPositionTradeCount, completed) * 20,
      ),
      sampleSizeWarning,
      detail:
        "Risk control focuses on adds after price moved against the position, shares left open, and overbuilt positions.",
    },
    {
      id: "consistency",
      label: "Consistency",
      score: clampScore(
        78 + cleanTradeRate * 15 - inconsistentRate * 35 - rapidRate * 15,
      ),
      sampleSizeWarning,
      detail:
        "Consistency rewards clean single-entry exits and flags sizing swings and unusually tight execution timing.",
    },
    {
      id: "pnl_quality",
      label: "P/L Quality",
      score: clampScore(45 + winRate * 35 + pnlDirectionBoost),
      sampleSizeWarning,
      detail:
        "P/L quality is gross execution-only and excludes commissions, fees, borrow costs, and market context.",
    },
  ];
  const overall = clampScore(
    dimensions.reduce((total, dimension) => total + dimension.score, 0) /
      dimensions.length,
  );

  return [
    ...dimensions,
    {
      id: "overall",
      label: "Overall Trend",
      score: overall,
      sampleSizeWarning,
      detail:
        "Overall score is the average of execution-only discipline, exit quality, risk control, consistency, and gross P/L quality.",
    },
  ];
}

export function buildTraderScorecard(args: {
  currentReport: SavedTraderAnalyticsReport;
  previousReport?: SavedTraderAnalyticsReport | null;
}): TraderScorecard {
  const currentDimensions = buildScoreDimensions(args.currentReport);
  const previousDimensions = args.previousReport
    ? buildScoreDimensions(args.previousReport)
    : [];
  const trends: TraderScoreTrend[] = currentDimensions.map((dimension) => {
    const previousScore =
      previousDimensions.find((item) => item.id === dimension.id)?.score ?? null;
    const delta =
      previousScore === null ? null : Math.round(dimension.score - previousScore);
    const rawDelta = previousScore === null ? null : dimension.score - previousScore;
    const direction =
      rawDelta === null
        ? "insufficient_data"
        : Math.abs(rawDelta) <= 1
          ? "flat"
          : rawDelta > 0
            ? "improving"
            : "worsening";

    return {
      id: dimension.id,
      label: dimension.label,
      previousScore,
      currentScore: dimension.score,
      delta,
      direction,
      detail:
        previousScore === null
          ? "More report history is needed before this score can trend."
          : `${dimension.label} moved from ${previousScore} to ${dimension.score}.`,
    };
  });
  const overall = currentDimensions.find((dimension) => dimension.id === "overall");

  return {
    source: "execution_only",
    reportId: args.currentReport.id,
    dimensions: currentDimensions,
    trends,
    sampleSizeWarning:
      args.currentReport.report.sampleSize.completedTradeCount < 10,
    summary: overall
      ? `Execution-only overall trend score is ${overall.score}/100.`
      : "Execution-only scorecard could not be built.",
  };
}

export function buildTraderMistakeCostEstimates(args: {
  report: SavedTraderAnalyticsReport;
  taxonomySummary: TraderMistakeTaxonomySummary;
}): TraderMistakeCostEstimateSummary {
  const rows = rowsWithIds(args.report);
  const rowsByTradeId = new Map(rows.map((row) => [row.tradeId, row]));
  const items: TraderMistakeCostEstimate[] = args.taxonomySummary.observations
    .map((observation) => {
      const behavior = certifiedProductBehavior(observation);
      if (!behavior) {
        return null;
      }

      const affectedRows = observation.tradeIds
        .map((tradeId) => rowsByTradeId.get(tradeId))
        .filter((row): row is ProductTraderAnalyticsTradeRow => row !== undefined);
      const estimatedGrossCost = roundMoney(
        affectedRows.reduce(
          (total, row) =>
            total + (row.grossRealizedPnl < 0 ? Math.abs(row.grossRealizedPnl) : 0),
          0,
        ),
      );

      return {
        taxonomyId: observation.taxonomyId,
        label: behavior.label,
        affectedTradeCount: affectedRows.length,
        relatedTradeIds: affectedRows.map((row) => row.tradeId),
        estimatedGrossCost,
        averageCostPerAffectedTrade:
          affectedRows.length > 0
            ? roundMoney(estimatedGrossCost / affectedRows.length)
            : 0,
        confidence:
          affectedRows.some((row) => row.isOpenPosition) ? "low" : "medium",
        calculationNote:
          "Estimate uses gross execution-only losses on trades where this behavior appeared; it is not an exact avoidable-loss calculation.",
      } satisfies TraderMistakeCostEstimate;
    })
    .filter((item): item is TraderMistakeCostEstimate => item !== null)
    .filter((item) => item.affectedTradeCount > 0)
    .sort((left, right) => right.estimatedGrossCost - left.estimatedGrossCost);

  return {
    source: "execution_only",
    totalEstimatedGrossCost: roundMoney(
      items.reduce((total, item) => total + item.estimatedGrossCost, 0),
    ),
    topCostDriver: items[0] ?? null,
    items,
    limitation:
      "Cost estimates use execution-only gross P/L and do not include commissions, fees, slippage, borrow costs, candle context, or exact alternative exits.",
  };
}

function templateForTaxonomy(
  taxonomyId: TraderMistakeTaxonomyId,
): string | null {
  switch (taxonomyId) {
    case "scaled_loser":
    case "add_after_adverse_move":
    case "overbuilt_losing_position":
      return "no_adverse_price_adds";
    case "chased_entry":
    case "revenge_reentry_cluster":
      return "limit_rapid_fire_gaps";
    case "added_after_failed_premise":
    case "all_or_nothing_exit_after_many_adds":
      return "reduce_before_third_add";
    case "held_loser_too_long":
    case "left_open_position":
      return "close_to_flat";
    case "inconsistent_sizing":
      return "consistent_share_sizing";
    default:
      return null;
  }
}

function ruleTitleForCostDriver(
  costDriver: TraderMistakeCostEstimate,
): string {
  switch (costDriver.taxonomyId) {
    case "scaled_loser":
    case "add_after_adverse_move":
      return "Require repair before adding size";
    case "added_after_failed_premise":
    case "all_or_nothing_exit_after_many_adds":
      return "Reduce size before the third add";
    case "poor_first_reduction":
    case "partialed_without_plan":
    case "early_winner_exit":
      return "Define the first profit-protection trigger";
    case "held_loser_too_long":
    case "left_open_position":
      return "Define when the trade must be flat";
    default:
      return `Review ${costDriver.label}`;
  }
}

export function buildTraderRuleBuilderRecommendations(args: {
  focusQueue: TraderFocusQueueItem[];
  ruleEvaluations: TraderRuleEvaluation[];
  costEstimates: TraderMistakeCostEstimateSummary;
  recurrenceAlerts: BehaviorRecurrenceAlert[];
}): TraderRuleBuilderRecommendation[] {
  const recommendations: TraderRuleBuilderRecommendation[] = [];
  const worstRule = [...args.ruleEvaluations].sort(
    (left, right) => right.violatedTradeCount - left.violatedTradeCount,
  )[0];

  if (worstRule && worstRule.violatedTradeCount > 0) {
    recommendations.push({
      id: `rule-builder:existing:${worstRule.templateId}`,
      suggestedTemplateId: worstRule.templateId,
      suggestedRuleTitle: worstRule.label,
      label: `Tighten ${worstRule.label}`,
      reason: `${worstRule.violatedTradeCount} trade(s) violated this rule.`,
      defaultParameters: {},
      relatedTradeIds: worstRule.violationTradeIds,
      expectedSuccessMetric: "Reduce violations for this rule in the next saved report.",
      priority: 1,
    });
  }

  const topCost = args.costEstimates.topCostDriver;
  const costTemplate = topCost ? templateForTaxonomy(topCost.taxonomyId) : null;

  if (topCost && costTemplate) {
    const suggestedRuleTitle = ruleTitleForCostDriver(topCost);

    recommendations.push({
      id: `rule-builder:cost:${topCost.taxonomyId}`,
      suggestedTemplateId: costTemplate,
      suggestedRuleTitle,
      label: `Create rule for ${topCost.label}`,
      reason: `${topCost.label} has the largest estimated gross cost in this sample.`,
      defaultParameters:
        costTemplate === "limit_rapid_fire_gaps"
          ? { maxRapidFireGaps: 0 }
          : {},
      relatedTradeIds: topCost.relatedTradeIds,
      expectedSuccessMetric: "No new affected trades in the next review period.",
      priority: 2,
    });
  }

  const urgentAlert = args.recurrenceAlerts.find(
    (alert) => alert.severity === "urgent",
  );
  if (urgentAlert) {
    recommendations.push({
      id: `rule-builder:alert:${urgentAlert.id}`,
      suggestedTemplateId: null,
      suggestedRuleTitle: urgentAlert.title,
      label: urgentAlert.title,
      reason: urgentAlert.detail,
      defaultParameters: {},
      relatedTradeIds: urgentAlert.relatedTradeIds,
      expectedSuccessMetric: "Reduce recurrence count below the current alert threshold.",
      priority: 3,
    });
  }

  const focus = args.focusQueue[0];
  if (focus) {
    recommendations.push({
      id: `rule-builder:focus:${focus.id}`,
      suggestedTemplateId: null,
      suggestedRuleTitle: `Guardrail for ${focus.title}`,
      label: `Build guardrail for ${focus.title}`,
      reason: focus.summary,
      defaultParameters: {},
      relatedTradeIds: focus.relatedTradeIds,
      expectedSuccessMetric: "Review the related trades and confirm one measurable behavior to track.",
      priority: 4,
    });
  }

  return recommendations
    .filter(
      (recommendation, index, list) =>
        list.findIndex((item) => item.id === recommendation.id) === index,
    )
    .sort((left, right) => left.priority - right.priority);
}

export function buildBehaviorRecurrenceAlerts(args: {
  report: SavedTraderAnalyticsReport;
  taxonomySummary: TraderMistakeTaxonomySummary;
  ruleEvaluations: TraderRuleEvaluation[];
}): BehaviorRecurrenceAlert[] {
  const alerts: BehaviorRecurrenceAlert[] = [];

  for (const observation of args.taxonomySummary.observations) {
    const behavior = certifiedProductBehavior(observation);
    if (!behavior) {
      continue;
    }

    if (observation.occurrenceCount < 2) {
      continue;
    }

    alerts.push({
      id: `recurrence:taxonomy:${observation.taxonomyId}`,
      severity: observation.occurrenceCount >= 3 ? "urgent" : "review",
      title: `${behavior.label} repeated`,
      detail: `${behavior.label} appeared in ${observation.occurrenceCount} reviewed trade(s).`,
      relatedTradeIds: observation.tradeIds,
      occurrenceCount: observation.occurrenceCount,
      nextAction:
        "Open the related trades and compare the execution sequence before changing rules.",
    });
  }

  for (const rule of args.ruleEvaluations) {
    if (rule.violatedTradeCount < 2) {
      continue;
    }

    alerts.push({
      id: `recurrence:rule:${rule.ruleId}`,
      severity: rule.violatedTradeCount >= 3 ? "urgent" : "review",
      title: `${rule.label} violations repeated`,
      detail: `${rule.violatedTradeCount} trade(s) violated this personal rule.`,
      relatedTradeIds: rule.violationTradeIds,
      occurrenceCount: rule.violatedTradeCount,
      nextAction: "Review the rule and decide whether the threshold is useful.",
    });
  }

  if (args.report.report.strengths.decisiveFullExitCount >= 2) {
    alerts.push({
      id: "recurrence:strength:decisive_full_exit",
      severity: "info",
      title: "Decisive exits repeated",
      detail:
        "Decisive full exits appeared multiple times and may be worth preserving.",
      relatedTradeIds: rowsWithIds(args.report)
        .filter((row) => row.topStrength?.id === "decisive_full_exit")
        .map((row) => row.tradeId),
      occurrenceCount: args.report.report.strengths.decisiveFullExitCount,
      nextAction: "Review those trades and capture what made the exits decisive.",
    });
  }

  return alerts.sort((left, right) => {
    const weight = { urgent: 0, review: 1, info: 2 };
    return weight[left.severity] - weight[right.severity] ||
      right.occurrenceCount - left.occurrenceCount;
  });
}

function emptyByLane(): Record<UnifiedReviewQueueLane, number> {
  return {
    import: 0,
    behavior: 0,
    rule: 0,
    cost: 0,
    market_context: 0,
  };
}

export function buildUnifiedReviewQueue(args: {
  focusQueue: TraderFocusQueueItem[];
  reviewWorkflow: TraderReviewWorkflow;
  recurrenceAlerts: BehaviorRecurrenceAlert[];
  costEstimates: TraderMistakeCostEstimateSummary;
  marketContextReadiness: MarketContextReadinessGate;
  importDiagnostics?: BrokerCsvImportProductDiagnostics | null;
}): UnifiedReviewQueue {
  const items: UnifiedReviewQueueItem[] = [];

  for (const focus of args.focusQueue.slice(0, 3)) {
    items.push({
      id: `unified:behavior:${focus.id}`,
      lane: "behavior",
      priority: focus.rank,
      title: focus.title,
      detail: focus.summary,
      relatedTradeIds: focus.relatedTradeIds,
      sourceIds: [focus.id],
      status: focus.status,
      nextAction: focus.suggestedReviewAction,
    });
  }

  for (const alert of args.recurrenceAlerts.slice(0, 4)) {
    items.push({
      id: `unified:recurrence:${alert.id}`,
      lane: "behavior",
      priority: alert.severity === "urgent" ? 2 : 6,
      title: alert.title,
      detail: alert.detail,
      relatedTradeIds: alert.relatedTradeIds,
      sourceIds: [alert.id],
      status: "new",
      nextAction: alert.nextAction,
    });
  }

  const topCost = args.costEstimates.topCostDriver;
  if (topCost && topCost.estimatedGrossCost > 0) {
    items.push({
      id: `unified:cost:${topCost.taxonomyId}`,
      lane: "cost",
      priority: 3,
      title: `Review cost driver: ${topCost.label}`,
      detail: `$${topCost.estimatedGrossCost.toFixed(2)} estimated gross execution-only cost.`,
      relatedTradeIds: topCost.relatedTradeIds,
      sourceIds: [topCost.taxonomyId],
      status: "new",
      nextAction: "Review the related losing trades before creating a rule.",
    });
  }

  const ruleWorkflow = args.reviewWorkflow.items.find((item) =>
    item.id.startsWith("workflow:rule:"),
  );
  if (ruleWorkflow) {
    items.push({
      id: `unified:rule:${ruleWorkflow.id}`,
      lane: "rule",
      priority: 4,
      title: ruleWorkflow.title,
      detail: ruleWorkflow.summary,
      relatedTradeIds: ruleWorkflow.relatedTradeIds,
      sourceIds: [ruleWorkflow.id],
      status: ruleWorkflow.status === "rule_created" ? "in_progress" : "new",
      nextAction: "Review rule violations and decide whether to keep this rule active.",
    });
  }

  const marketItems = args.marketContextReadiness.items.filter(
    (item) => item.calibratedMarketContextStatus !== "ready",
  );
  if (marketItems.length > 0) {
    items.push({
      id: "unified:market-context:readiness",
      lane: "market_context",
      priority: 20,
      title: "Market context not calibrated",
      detail:
        "Execution analytics are ready, but levels and market structure should remain gated.",
      relatedTradeIds: marketItems.map((item) => item.tradeId),
      sourceIds: ["market-context-readiness"],
      status: "new",
      nextAction: "Collect real saved trades before promoting market-context conclusions.",
    });
  }

  if (args.importDiagnostics && args.importDiagnostics.qualityScore.status !== "high_confidence") {
    items.push({
      id: "unified:import:quality",
      lane: "import",
      priority:
        args.importDiagnostics.qualityScore.status === "blocked" ? 1 : 5,
      title: "Import needs review",
      detail: args.importDiagnostics.qualityScore.reasons[0] ??
        "Review the import before saving.",
      relatedTradeIds: [],
      sourceIds: ["broker-import-quality-score"],
      status: "new",
      nextAction: args.importDiagnostics.qualityScore.nextAction,
    });
  }

  const sorted = items.sort((left, right) => left.priority - right.priority);
  const byLane = emptyByLane();

  for (const item of sorted) {
    byLane[item.lane] += 1;
  }

  return {
    totalCount: sorted.length,
    byLane,
    items: sorted,
  };
}

function recommendedFingerprintAction(
  entry: BrokerImportFingerprintLibraryEntry,
): string {
  if (entry.missingRequiredFields.length > 0) {
    return "Map missing required fields before promoting this broker template.";
  }

  if (entry.confidenceLevel !== "high") {
    return "Review detected fields and capture a broker-specific mapping.";
  }

  return "Candidate is stable enough for admin review and possible promotion.";
}

export function buildBrokerImportFingerprintLibrary(args: {
  signals: BrokerCsvMappingLearningSignal[];
  seenAt?: string;
}): BrokerImportFingerprintLibrary {
  const seenAt = args.seenAt ?? new Date(0).toISOString();
  const entriesByFingerprint = new Map<string, BrokerImportFingerprintLibraryEntry>();

  for (const signal of args.signals) {
    const existing = entriesByFingerprint.get(signal.headerFingerprint);
    const promotedStatus =
      signal.missingRequiredFields.length > 0 || signal.confidenceLevel === "low"
        ? "needs_mapping_review"
        : signal.shouldCapture
          ? "candidate"
          : "promoted";

    if (!existing) {
      const entry: BrokerImportFingerprintLibraryEntry = {
        headerFingerprint: signal.headerFingerprint,
        broker: signal.broker,
        confidenceLevel: signal.confidenceLevel,
        promotedStatus,
        headerCount: signal.headers.length,
        detectedFields: signal.detectedFields,
        missingRequiredFields: signal.missingRequiredFields,
        issueCodes: signal.issueCodes,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        sampleCount: 1,
        recommendedAction: "",
      };
      entry.recommendedAction = recommendedFingerprintAction(entry);
      entriesByFingerprint.set(signal.headerFingerprint, entry);
      continue;
    }

    const merged: BrokerImportFingerprintLibraryEntry = {
      ...existing,
      confidenceLevel:
        existing.confidenceLevel === "high" && signal.confidenceLevel !== "high"
          ? signal.confidenceLevel
          : existing.confidenceLevel,
      promotedStatus:
        existing.promotedStatus === "needs_mapping_review" ||
        promotedStatus === "needs_mapping_review"
          ? "needs_mapping_review"
          : existing.promotedStatus === "candidate" ||
              promotedStatus === "candidate"
            ? "candidate"
            : "promoted",
      detectedFields: [...new Set([...existing.detectedFields, ...signal.detectedFields])],
      missingRequiredFields: [
        ...new Set([
          ...existing.missingRequiredFields,
          ...signal.missingRequiredFields,
        ]),
      ],
      issueCodes: [...new Set([...existing.issueCodes, ...signal.issueCodes])],
      lastSeenAt: seenAt,
      sampleCount: existing.sampleCount + 1,
    };
    merged.recommendedAction = recommendedFingerprintAction(merged);
    entriesByFingerprint.set(signal.headerFingerprint, merged);
  }

  const entries = [...entriesByFingerprint.values()].sort((left, right) =>
    left.headerFingerprint.localeCompare(right.headerFingerprint),
  );

  return {
    totalCount: entries.length,
    promotedCount: entries.filter((entry) => entry.promotedStatus === "promoted")
      .length,
    needsReviewCount: entries.filter(
      (entry) => entry.promotedStatus === "needs_mapping_review",
    ).length,
    entries,
  };
}

export function buildMarketContextReadinessGate(args: {
  trades: SavedExecutionTrade[];
  report: SavedTraderAnalyticsReport;
  badges: AnalysisConfidenceBadge[];
  calibrationQueue: MarketContextCalibrationQueue;
}): MarketContextReadinessGate {
  const summaryTradeIds = new Set(
    args.report.sourceSummaries.map((summary) => summary.tradeId),
  );
  const hasLevels = args.badges.some(
    (badge) => badge.source === "execution_plus_levels",
  );
  const hasObservationalStructure = args.badges.some(
    (badge) => badge.source === "market_structure_observational",
  );
  const hasCalibratedContext = args.badges.some(
    (badge) => badge.source === "fully_calibrated_market_context",
  );
  const executionBadge = args.badges.find(
    (badge) => badge.source === "execution_only",
  );
  const items = args.trades.map((trade) => {
    const queueItem = args.calibrationQueue.items.find(
      (item) => item.tradeId === trade.id,
    );
    const calibrated = hasCalibratedContext && queueItem?.status === "reviewed";

    return {
      tradeId: trade.id,
      symbol: trade.symbol,
      executionAnalysisStatus: summaryTradeIds.has(trade.id) ? "ready" as const : "missing" as const,
      levelsStatus: hasLevels ? "attached" as const : "not_requested" as const,
      marketStructureStatus: hasObservationalStructure
        ? "observational" as const
        : "not_requested" as const,
      calibratedMarketContextStatus: calibrated ? "ready" as const : "not_ready" as const,
      userVisibleBadge: calibrated
        ? "fully_calibrated_market_context" as const
        : hasLevels
          ? "execution_plus_levels" as const
          : executionBadge?.source ?? "execution_only" as const,
      usedForScoring: calibrated,
      nextAction: calibrated
        ? "Market context can be used according to the calibrated badge."
        : trade.sampleData
          ? "Sample trades cannot promote market-context scoring."
          : "Attach levels and wait for market-structure calibration review.",
    };
  });

  return {
    totalCount: items.length,
    executionReadyCount: items.filter(
      (item) => item.executionAnalysisStatus === "ready",
    ).length,
    levelsAttachedCount: items.filter((item) => item.levelsStatus === "attached")
      .length,
    marketStructureObservationalCount: items.filter(
      (item) => item.marketStructureStatus === "observational",
    ).length,
    calibratedCount: items.filter(
      (item) => item.calibratedMarketContextStatus === "ready",
    ).length,
    items,
  };
}

export function buildTraderProductIntelligenceViewModel(args: {
  currentReport: SavedTraderAnalyticsReport;
  previousReport?: SavedTraderAnalyticsReport | null;
  trades: SavedExecutionTrade[];
  focusQueue: TraderFocusQueueItem[];
  reviewWorkflow: TraderReviewWorkflow;
  ruleEvaluations: TraderRuleEvaluation[];
  badges: AnalysisConfidenceBadge[];
  calibrationQueue: MarketContextCalibrationQueue;
  importDiagnostics?: BrokerCsvImportProductDiagnostics | null;
}): TraderProductIntelligenceViewModel {
  const mistakeTaxonomy = buildTraderMistakeTaxonomySummary(args.currentReport);
  const scorecard = buildTraderScorecard({
    currentReport: args.currentReport,
    previousReport: args.previousReport,
  });
  const mistakeCostEstimates = buildTraderMistakeCostEstimates({
    report: args.currentReport,
    taxonomySummary: mistakeTaxonomy,
  });
  const recurrenceAlerts = buildBehaviorRecurrenceAlerts({
    report: args.currentReport,
    taxonomySummary: mistakeTaxonomy,
    ruleEvaluations: args.ruleEvaluations,
  });
  const marketContextReadiness = buildMarketContextReadinessGate({
    trades: args.trades,
    report: args.currentReport,
    badges: args.badges,
    calibrationQueue: args.calibrationQueue,
  });

  return {
    mistakeTaxonomy,
    scorecard,
    mistakeCostEstimates,
    ruleBuilderRecommendations: buildTraderRuleBuilderRecommendations({
      focusQueue: args.focusQueue,
      ruleEvaluations: args.ruleEvaluations,
      costEstimates: mistakeCostEstimates,
      recurrenceAlerts,
    }),
    recurrenceAlerts,
    unifiedReviewQueue: buildUnifiedReviewQueue({
      focusQueue: args.focusQueue,
      reviewWorkflow: args.reviewWorkflow,
      recurrenceAlerts,
      costEstimates: mistakeCostEstimates,
      marketContextReadiness,
      importDiagnostics: args.importDiagnostics,
    }),
    marketContextReadiness,
  };
}
