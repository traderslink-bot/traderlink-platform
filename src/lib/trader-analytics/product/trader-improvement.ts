import type {
  BestWorstPatternFinderResult,
  BestWorstPatternItem,
  DailyCoachReport,
  DailyCoachTradeRef,
  PlaybookBucketId,
  PlaybookBucketSummary,
  PlaybookTradeAssignment,
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTrade,
  SavedExecutionTradeId,
  SavedTraderAnalyticsReport,
  TradeExecutionAutopsy,
  TradeExecutionAutopsyDecision,
  TradeQualityDimension,
  TradeQualityDimensionId,
  TradeQualityScorecard,
  TraderImprovementIntelligence,
  TraderImprovementVisual,
  TraderImprovementVisualDatum,
  TraderImprovementVisuals,
  TraderMistakeObservation,
  TraderProductIntelligenceViewModel,
  TraderRuleEvaluation,
} from "./types";
import { buildSavedTradeReviewViewModel } from "./selectors";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import { mapUserFacingBehavior } from "../../user-facing-behavior";

const TRADE_QUALITY_LIMITATIONS = [
  "Trade quality is execution-only.",
  "Market context, levels, VWAP/EMA, and candle structure are not used for this score.",
  "Scores are deterministic review aids, not statistical proof.",
] as const;

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number | null {
  return values.length > 0
    ? roundMetric(values.reduce((total, value) => total + value, 0) / values.length)
    : null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mapImprovementBehavior(observation: TraderMistakeObservation) {
  return mapUserFacingBehavior({
    behaviorId: observation.taxonomyId,
    rawLabel: observation.label,
    route: "/coach",
  });
}

function primaryTradeReviewPointLabel(
  point:
    | ExecutionFeedbackSummary["points"]["risks"][number]
    | ExecutionFeedbackSummary["points"]["strengths"][number]
    | null
    | undefined,
): string | null {
  if (!point) {
    return null;
  }

  const behavior = mapUserFacingBehavior({
    behaviorId: point.id,
    rawLabel: point.label,
    route: "/trades/[tradeId]",
  });

  return behavior.canDrivePrimaryConclusion ? behavior.label : null;
}

function certifiedImprovementObservations(
  observations: TraderMistakeObservation[],
): TraderMistakeObservation[] {
  return observations.filter((observation) =>
    mapImprovementBehavior(observation).canDrivePrimaryConclusion,
  );
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

function summaryForTrade(args: {
  report: SavedTraderAnalyticsReport;
  tradeId: SavedExecutionTradeId;
}): ExecutionFeedbackSummary | null {
  return (
    args.report.sourceSummaries.find(
      (summaryRef) => summaryRef.tradeId === args.tradeId,
    )?.summary ?? null
  );
}

function rowForTrade(args: {
  report: SavedTraderAnalyticsReport;
  tradeId: SavedExecutionTradeId;
}): ProductTraderAnalyticsTradeRow | null {
  return (
    rowsWithTradeIds(args.report).find((row) => row.tradeId === args.tradeId) ??
    null
  );
}

function hasRisk(summary: ExecutionFeedbackSummary | null, id: string): boolean {
  return summary?.points.risks.some((risk) => risk.id === id) ?? false;
}

function hasStrength(
  summary: ExecutionFeedbackSummary | null,
  id: string,
): boolean {
  return summary?.points.strengths.some((strength) => strength.id === id) ?? false;
}

function qualityDimension(args: {
  id: TradeQualityDimensionId;
  label: string;
  score: number;
  detail: string;
  evidence: string[];
}): TradeQualityDimension {
  return {
    ...args,
    score: clampScore(args.score),
    evidence: args.evidence.filter(Boolean),
  };
}

export function buildTradeQualityScorecard(args: {
  trade: SavedExecutionTrade;
  report: SavedTraderAnalyticsReport;
}): TradeQualityScorecard {
  const summary = summaryForTrade({
    report: args.report,
    tradeId: args.trade.id,
  });
  const row = rowForTrade({ report: args.report, tradeId: args.trade.id });
  const adverseAdds = summary?.riskFacts.adversePriceAddCount ?? row?.adversePriceAddCount ?? 0;
  const addsBeforeReduction = summary?.sequencing.addsBeforeFirstReductionCount ?? 0;
  const rapidFire = summary?.sequencing.rapidFireGapCount ?? 0;
  const openPosition = summary?.lifecycle.isOpenPosition ?? row?.isOpenPosition ?? false;
  const addCount = summary?.lifecycle.addCountAfterInitialEntry ?? row?.addCountAfterInitialEntry ?? 0;
  const expansionRatio = summary?.sizing.sizeExpansionRatioFromInitialToMax ?? 1;
  const inconsistentSizing = hasRisk(summary, "inconsistent_share_sizing");
  const allOrNothing = hasRisk(summary, "all_or_nothing_exit_after_many_adds");
  const smallFirstReduction = hasRisk(summary, "small_first_risk_reduction");
  const decisiveExit = hasStrength(summary, "decisive_full_exit");
  const structuredExit = hasStrength(summary, "structured_partial_exit_sequence");
  const cleanTrade = hasStrength(summary, "clean_single_entry_full_exit");

  const dimensions = [
    qualityDimension({
      id: "entry_discipline",
      label: "Entry Discipline",
      score: 82 + (cleanTrade ? 8 : 0) - rapidFire * 14,
      detail:
        "Entry discipline looks for unusually tight execution timing and clean single-entry evidence.",
      evidence: [
        `${rapidFire} tight execution gap${rapidFire === 1 ? "" : "s"}`,
        cleanTrade ? "Clean single-entry and full-exit strength found." : "",
      ],
    }),
    qualityDimension({
      id: "add_discipline",
      label: "Add Discipline",
      score:
        addCount === 0
          ? 88
          : 82 - adverseAdds * 18 - Math.max(addsBeforeReduction - 1, 0) * 8,
      detail:
        "Add discipline rewards controlled scaling and flags adds made after price moved against the position.",
      evidence: [
        `${addCount} add${addCount === 1 ? "" : "s"} after initial entry`,
        `${adverseAdds} add${adverseAdds === 1 ? "" : "s"} after price moved against the position`,
        `${addsBeforeReduction} add${addsBeforeReduction === 1 ? "" : "s"} before first reduction`,
      ],
    }),
    qualityDimension({
      id: "exit_discipline",
      label: "Exit Discipline",
      score:
        68 +
        (decisiveExit ? 16 : 0) +
        (structuredExit ? 12 : 0) -
        (openPosition ? 25 : 0) -
        (allOrNothing ? 18 : 0) -
        (smallFirstReduction ? 10 : 0),
      detail:
        "Exit discipline looks for clean full exits, structured partial exits, shares left open, and weak first reductions.",
      evidence: [
        decisiveExit ? "Clean full-exit strength found." : "",
        structuredExit ? "Structured partial-exit strength found." : "",
        openPosition ? "Position was left open." : "",
        allOrNothing ? "All-or-nothing exit after many adds found." : "",
        smallFirstReduction ? "Small first risk reduction found." : "",
      ],
    }),
    qualityDimension({
      id: "risk_control",
      label: "Risk Control",
      score:
        90 -
        adverseAdds * 18 -
        (openPosition ? 22 : 0) -
        (expansionRatio && expansionRatio > 3 ? 12 : 0),
      detail:
        "Risk control focuses on adds after price moved against the position, shares left open, and aggressive size expansion.",
      evidence: [
        `${adverseAdds} add${adverseAdds === 1 ? "" : "s"} after price moved against the position`,
        openPosition ? "Open shares remained after the execution sequence." : "",
        expansionRatio && expansionRatio > 1
          ? `${roundMetric(expansionRatio)}x max-size expansion from initial entry.`
          : "",
      ],
    }),
    qualityDimension({
      id: "sizing_consistency",
      label: "Sizing Consistency",
      score: 86 - (inconsistentSizing ? 28 : 0) - (expansionRatio > 4 ? 12 : 0),
      detail:
        "Sizing consistency penalizes erratic share-size changes and unusually large position expansion.",
      evidence: [
        inconsistentSizing ? "Inconsistent share sizing detected." : "",
        expansionRatio > 1
          ? `${roundMetric(expansionRatio)}x size expansion.`
          : "",
      ],
    }),
  ];
  const overallScore = clampScore(
    dimensions.reduce((total, dimension) => total + dimension.score, 0) /
      dimensions.length,
  );

  return {
    tradeId: args.trade.id,
    symbol: args.trade.symbol,
    source: "execution_only",
    marketContextUsedForScoring: false,
    overallScore,
    dimensions: [
      ...dimensions,
      qualityDimension({
        id: "overall",
        label: "Overall Quality",
        score: overallScore,
        detail:
          "Overall quality averages execution-only entry, add, exit, risk, and sizing dimensions.",
        evidence: [`Overall execution quality is ${overallScore}/100.`],
      }),
    ],
    topRiskLabel:
      row?.topRisk?.label ??
      primaryTradeReviewPointLabel(summary?.points.risks[0]) ??
      null,
    topStrengthLabel:
      row?.topStrength?.label ??
      primaryTradeReviewPointLabel(summary?.points.strengths[0]) ??
      null,
    limitations: [...TRADE_QUALITY_LIMITATIONS],
  };
}

function classifyDecision(args: {
  index: number;
  positionBefore: number;
  positionAfter: number;
  isLast: boolean;
  sawReduction: boolean;
}): { role: string; label: string; tone: TradeExecutionAutopsyDecision["tone"] } {
  const before = Math.abs(args.positionBefore);
  const after = Math.abs(args.positionAfter);

  if (args.index === 0) {
    return { role: "initial_entry", label: "Initial entry", tone: "neutral" };
  }

  if (args.isLast && after > 0) {
    return { role: "open_leftover", label: "Shares left open", tone: "negative" };
  }

  if (before > 0 && after === 0) {
    return { role: "full_exit", label: "Full exit", tone: "positive" };
  }

  if (after < before) {
    return { role: "trim", label: "Risk reduction", tone: "positive" };
  }

  if (after > before && args.sawReduction) {
    return { role: "readd", label: "Re-add", tone: "warning" };
  }

  if (after > before) {
    return { role: "add", label: "Added size", tone: "warning" };
  }

  return { role: "unchanged", label: "Execution", tone: "neutral" };
}

export function buildTradeExecutionAutopsy(args: {
  trade: SavedExecutionTrade;
  report: SavedTraderAnalyticsReport;
}): TradeExecutionAutopsy {
  const review = buildSavedTradeReviewViewModel({
    trade: args.trade,
    report: args.report,
  });
  const quality = buildTradeQualityScorecard(args);
  const row = review.reportRow;
  const finalOutcome = row?.isOpenPosition
    ? "open"
    : (row?.grossRealizedPnl ?? 0) > 0
      ? "winner"
      : (row?.grossRealizedPnl ?? 0) < 0
        ? "loser"
        : "flat";
  let sawReduction = false;
  let previousPosition = 0;
  const decisions: TradeExecutionAutopsyDecision[] = review.executionTimeline.map(
    (point, index) => {
      const decision = classifyDecision({
        index,
        positionBefore: previousPosition,
        positionAfter: point.positionAfterExecution,
        isLast: index === review.executionTimeline.length - 1,
        sawReduction,
      });
      if (Math.abs(point.positionAfterExecution) < Math.abs(previousPosition)) {
        sawReduction = true;
      }
      previousPosition = point.positionAfterExecution;

      return {
        id: `${args.trade.id}:decision:${index}`,
        executionIndex: point.index,
        role: decision.role,
        label: decision.label,
        detail: `${point.side.toUpperCase()} ${point.shares} at ${point.price}; position moved to ${point.positionAfterExecution}.`,
        tone: decision.tone,
        relatedPointLabels:
          decision.tone === "positive"
            ? review.strengths.slice(0, 2).map((strength) => strength.label)
            : decision.tone === "negative" || decision.tone === "warning"
              ? review.risks.slice(0, 2).map((risk) => risk.label)
              : [],
      };
    },
  );
  const topRisk = quality.topRiskLabel;
  const topStrength = quality.topStrengthLabel;

  return {
    tradeId: args.trade.id,
    summary:
      finalOutcome === "open"
        ? `${args.trade.symbol} was left open with an execution quality score of ${quality.overallScore}/100.`
        : `${args.trade.symbol} finished as a gross ${finalOutcome} with an execution quality score of ${quality.overallScore}/100.`,
    finalOutcome,
    topMistakeLabel: topRisk,
    topStrengthLabel: topStrength,
    quality,
    decisions,
    marketContextUsedForConclusions: false,
  };
}

export function buildTraderImprovementMistakeObservations(args: {
  baseObservations: TraderMistakeObservation[];
  ruleEvaluations: TraderRuleEvaluation[];
}): TraderMistakeObservation[] {
  const observations = [...args.baseObservations];

  for (const rule of args.ruleEvaluations) {
    if (rule.violatedTradeCount < 2) {
      continue;
    }

    observations.push({
      taxonomyId: "repeated_rule_violation",
      label: `${rule.label} repeated`,
      tradeIds: rule.violationTradeIds,
      requestIndexes: rule.violationRows.map((row) => row.requestIndex),
      occurrenceCount: rule.violatedTradeCount,
      sourceRiskIds: [rule.templateId],
      confidence: rule.violatedTradeCount >= 3 ? "high" : "medium",
      reason: `${rule.violatedTradeCount} trades violated the same personal rule.`,
      suggestedReviewAction:
        "Review the violating trades and decide whether this rule needs a tighter threshold.",
    });
  }

  return observations.sort((left, right) => {
    if (right.occurrenceCount !== left.occurrenceCount) {
      return right.occurrenceCount - left.occurrenceCount;
    }

    return left.label.localeCompare(right.label);
  });
}

const PLAYBOOK_BUCKETS: Array<{ id: PlaybookBucketId; label: string }> = [
  { id: "clean_single_entry_trade", label: "Clean Single-Entry Trade" },
  { id: "scale_in_management_trade", label: "Scale-In Management Trade" },
  { id: "partial_exit_management_trade", label: "Partial-Exit Management Trade" },
  { id: "rapid_fire_problem_trade", label: "Fast Execution Cluster Trade" },
  { id: "open_position_problem_trade", label: "Trade Left Open" },
];

function primaryPlaybookBucket(row: ProductTraderAnalyticsTradeRow): {
  id: PlaybookBucketId;
  reason: string;
} {
  if (row.isOpenPosition) {
    return {
      id: "open_position_problem_trade",
      reason: "The trade ended with open shares.",
    };
  }

  if (row.topRisk?.id === "rapid_fire_execution_cluster") {
    return {
      id: "rapid_fire_problem_trade",
      reason: "The top risk was several executions close together in time.",
    };
  }

  if (row.reductionCount > 1) {
    return {
      id: "partial_exit_management_trade",
      reason: "The trade used multiple reductions.",
    };
  }

  if (row.addCountAfterInitialEntry > 0) {
    return {
      id: "scale_in_management_trade",
      reason: "The trade added size after the initial entry.",
    };
  }

  return {
    id: "clean_single_entry_trade",
    reason: "The trade used a simple entry and exit structure.",
  };
}

export function buildPlaybookReadiness(args: {
  report: SavedTraderAnalyticsReport;
  qualityScorecards: TradeQualityScorecard[];
}): {
  buckets: PlaybookBucketSummary[];
  assignments: PlaybookTradeAssignment[];
} {
  const rows = rowsWithTradeIds(args.report);
  const qualityByTradeId = new Map(
    args.qualityScorecards.map((quality) => [quality.tradeId, quality]),
  );
  const bucketLabels = new Map(PLAYBOOK_BUCKETS.map((bucket) => [bucket.id, bucket.label]));
  const assignments = rows.map((row) => {
    const bucket = primaryPlaybookBucket(row);

    return {
      tradeId: row.tradeId,
      bucketId: bucket.id,
      bucketLabel: bucketLabels.get(bucket.id) ?? bucket.id,
      reason: bucket.reason,
    };
  });
  const buckets = PLAYBOOK_BUCKETS.map((bucket) => {
    const bucketTradeIds = assignments
      .filter((assignment) => assignment.bucketId === bucket.id)
      .map((assignment) => assignment.tradeId);
    const bucketRows = rows.filter((row) => bucketTradeIds.includes(row.tradeId));
    const qualityScores = bucketTradeIds
      .map((tradeId) => qualityByTradeId.get(tradeId)?.overallScore)
      .filter((score): score is number => typeof score === "number");

    return {
      id: bucket.id,
      label: bucket.label,
      source: "execution_only" as const,
      tradeIds: bucketTradeIds,
      tradeCount: bucketTradeIds.length,
      grossTotalRealizedPnl: roundMoney(
        bucketRows.reduce((total, row) => total + row.grossRealizedPnl, 0),
      ),
      averageQualityScore: average(qualityScores),
      topRiskLabel:
        bucketRows.find((row) => row.topRisk !== null)?.topRisk?.label ?? null,
      topStrengthLabel:
        bucketRows.find((row) => row.topStrength !== null)?.topStrength?.label ??
        null,
      readyForUserSetup: false as const,
    };
  });

  return { buckets, assignments };
}

function coachTradeRef(
  row: ProductTraderAnalyticsTradeRow | null,
  qualityByTradeId: Map<string, TradeQualityScorecard>,
): DailyCoachTradeRef | null {
  if (!row) {
    return null;
  }

  return {
    tradeId: row.tradeId,
    symbol: row.symbol,
    grossRealizedPnl: row.grossRealizedPnl,
    qualityScore: qualityByTradeId.get(row.tradeId)?.overallScore ?? null,
  };
}

function mostCommonLabel(
  labels: Array<string | null | undefined>,
): string | null {
  const counts = new Map<string, number>();

  for (const label of labels) {
    if (!label) {
      continue;
    }

    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return (
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null
  );
}

export function buildDailyCoachReport(args: {
  report: SavedTraderAnalyticsReport;
  qualityScorecards: TradeQualityScorecard[];
  mistakeObservations: TraderMistakeObservation[];
  ruleEvaluations: TraderRuleEvaluation[];
}): DailyCoachReport {
  const rows = rowsWithTradeIds(args.report);
  const latestSessionDate =
    [...new Set(rows.map((row) => row.sessionDate))].sort().reverse()[0] ??
    args.report.reportPeriod.endDate;
  const sessionRows = rows.filter((row) => row.sessionDate === latestSessionDate);
  const qualityByTradeId = new Map(
    args.qualityScorecards.map((quality) => [quality.tradeId, quality]),
  );
  const bestRow =
    [...sessionRows].sort((left, right) => {
      const pnlDelta = right.grossRealizedPnl - left.grossRealizedPnl;
      if (pnlDelta !== 0) {
        return pnlDelta;
      }

      return (
        (qualityByTradeId.get(right.tradeId)?.overallScore ?? 0) -
        (qualityByTradeId.get(left.tradeId)?.overallScore ?? 0)
      );
    })[0] ?? null;
  const worstRow =
    [...sessionRows].sort((left, right) => left.grossRealizedPnl - right.grossRealizedPnl)[0] ??
    null;
  const sessionTradeIds = new Set(sessionRows.map((row) => row.tradeId));
  const certifiedObservations = certifiedImprovementObservations(
    args.mistakeObservations,
  );
  const biggestMistake =
    certifiedObservations.find((observation) =>
      observation.tradeIds.some((tradeId) => sessionTradeIds.has(tradeId)),
    ) ?? null;
  const worstRule =
    [...args.ruleEvaluations].sort(
      (left, right) => right.violatedTradeCount - left.violatedTradeCount,
    )[0] ?? null;
  const bestRepeatableBehavior = mostCommonLabel(
    sessionRows.map((row) => row.topStrength?.label),
  );
  const relatedTradeIds = unique([
    ...(bestRow ? [bestRow.tradeId] : []),
    ...(worstRow ? [worstRow.tradeId] : []),
    ...(biggestMistake?.tradeIds ?? []),
    ...(worstRule?.violationTradeIds ?? []),
  ]);

  return {
    reportId: args.report.id,
    sessionDate: latestSessionDate,
    tradeCount: sessionRows.length,
    bestTrade: coachTradeRef(bestRow, qualityByTradeId),
    worstTrade: coachTradeRef(worstRow, qualityByTradeId),
    biggestMistake,
    bestRepeatableBehavior,
    ruleFocus:
      worstRule && worstRule.violatedTradeCount > 0
        ? `${worstRule.label}: ${worstRule.violatedTradeCount} violation${worstRule.violatedTradeCount === 1 ? "" : "s"}`
        : null,
    sessionTimeInsight:
      args.report.report.timeOfDay.sampleSizeWarning
        ? `${args.report.report.timeOfDay.entryInsight} Sample is still small, so keep this as a review prompt.`
        : `${args.report.report.timeOfDay.entryInsight} ${args.report.report.timeOfDay.holdInsight}`,
    fixNextSession:
      biggestMistake?.suggestedReviewAction ??
      "Replay the lowest-quality saved execution trade and pick one execution behavior to test avoiding next session.",
    preserveNextSession: bestRepeatableBehavior
      ? `Preserve ${bestRepeatableBehavior.toLowerCase()} when the setup appears again, then confirm it in the next replay.`
      : "Identify one repeatable execution behavior from the best trade and test preserving it next session.",
    relatedTradeIds,
    marketContextUsedForConclusions: false,
  };
}

function visual(args: {
  id: string;
  title: string;
  kind: TraderImprovementVisual["kind"];
  items: TraderImprovementVisualDatum[];
}): TraderImprovementVisual {
  return {
    ...args,
    total: roundMetric(args.items.reduce((total, item) => total + item.value, 0)),
  };
}

function bucketLabelForExecutionCount(count: number): string {
  if (count <= 2) {
    return "1-2 executions";
  }

  if (count <= 4) {
    return "3-4 executions";
  }

  return "5+ executions";
}

function bucketLabelForDuration(seconds: number): string {
  if (seconds < 60) {
    return "< 1m";
  }

  if (seconds < 300) {
    return "1m-5m";
  }

  if (seconds < 900) {
    return "5m-15m";
  }

  if (seconds < 3600) {
    return "15m-60m";
  }

  return "> 60m";
}

function groupedVisual(args: {
  id: string;
  title: string;
  rows: ProductTraderAnalyticsTradeRow[];
  getLabel: (row: ProductTraderAnalyticsTradeRow) => string;
}): TraderImprovementVisual {
  const grouped = new Map<string, ProductTraderAnalyticsTradeRow[]>();

  for (const row of args.rows) {
    const label = args.getLabel(row);
    grouped.set(label, [...(grouped.get(label) ?? []), row]);
  }

  return visual({
    id: args.id,
    title: args.title,
    kind: "bucket",
    items: [...grouped.entries()].map(([label, rows]) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label,
      value: rows.length,
      secondaryValue: roundMoney(
        rows.reduce((total, row) => total + row.grossRealizedPnl, 0),
      ),
      tone:
        rows.reduce((total, row) => total + row.grossRealizedPnl, 0) >= 0
          ? "positive"
          : "negative",
      relatedTradeIds: rows.map((row) => row.tradeId),
    })),
  });
}

export function buildTraderImprovementVisuals(args: {
  report: SavedTraderAnalyticsReport;
  qualityScorecards: TradeQualityScorecard[];
  mistakeObservations: TraderMistakeObservation[];
  ruleEvaluations: TraderRuleEvaluation[];
}): TraderImprovementVisuals {
  const rows = rowsWithTradeIds(args.report);
  const qualityByTradeId = new Map(
    args.qualityScorecards.map((quality) => [quality.tradeId, quality]),
  );

  return {
    qualityByTrade: visual({
      id: "quality_by_trade",
      title: "Quality Score By Trade",
      kind: "bar",
      items: rows.map((row) => {
        const score = qualityByTradeId.get(row.tradeId)?.overallScore ?? 0;

        return {
          id: row.tradeId,
          label: `#${row.tradeIndex} ${row.symbol}`,
          value: score,
          secondaryValue: row.grossRealizedPnl,
          tone: score >= 75 ? "positive" : score >= 55 ? "warning" : "negative",
          relatedTradeIds: [row.tradeId],
        };
      }),
    }),
    mistakeFrequency: visual({
      id: "mistake_frequency",
      title: "Mistake Frequency",
      kind: "bar",
      items: certifiedImprovementObservations(args.mistakeObservations).map(
        (observation) => {
          const behavior = mapImprovementBehavior(observation);

          return {
            id: observation.taxonomyId,
            label: behavior.label,
            value: observation.occurrenceCount,
            secondaryValue: null,
            tone:
              observation.confidence === "high"
                ? "negative"
                : observation.confidence === "medium"
                  ? "warning"
                  : "neutral",
            relatedTradeIds: observation.tradeIds,
          };
        },
      ),
    }),
    ruleViolationFrequency: visual({
      id: "rule_violation_frequency",
      title: "Rule Violation Frequency",
      kind: "bar",
      items: args.ruleEvaluations.map((rule) => ({
        id: rule.ruleId,
        label: rule.label,
        value: rule.violatedTradeCount,
        secondaryValue: rule.passedTradeCount,
        tone: rule.violatedTradeCount > 0 ? "warning" : "positive",
        relatedTradeIds: rule.violationTradeIds,
      })),
    }),
    executionCountBuckets: groupedVisual({
      id: "execution_count_buckets",
      title: "Execution Count Buckets",
      rows,
      getLabel: (row) => bucketLabelForExecutionCount(row.executionCount),
    }),
    durationBuckets: groupedVisual({
      id: "duration_buckets",
      title: "Duration Buckets",
      rows,
      getLabel: (row) => bucketLabelForDuration(row.durationSeconds),
    }),
    sessionBehaviorHeatmap: groupedVisual({
      id: "session_behavior_heatmap",
      title: "Session Behavior Heatmap",
      rows,
      getLabel: (row) => `${row.sessionDate} ${row.sessionBucket}`,
    }),
  };
}

function patternItem(args: {
  id: string;
  label: string;
  detail: string;
  relatedTradeIds: SavedExecutionTradeId[];
  value: number | null;
}): BestWorstPatternItem {
  return args;
}

export function buildBestWorstPatternFinder(args: {
  report: SavedTraderAnalyticsReport;
  playbookBuckets: PlaybookBucketSummary[];
  mistakeObservations: TraderMistakeObservation[];
  productIntelligence: TraderProductIntelligenceViewModel;
}): BestWorstPatternFinderResult {
  const nonEmptyBuckets = args.playbookBuckets.filter(
    (bucket) => bucket.tradeCount > 0,
  );
  const bestBucket =
    [...nonEmptyBuckets].sort(
      (left, right) => right.grossTotalRealizedPnl - left.grossTotalRealizedPnl,
    )[0] ?? null;
  const worstBucket =
    [...nonEmptyBuckets].sort(
      (left, right) => left.grossTotalRealizedPnl - right.grossTotalRealizedPnl,
    )[0] ?? null;
  const topCost = args.productIntelligence.mistakeCostEstimates.topCostDriver;
  const mostRepeated = certifiedImprovementObservations(
    args.mistakeObservations,
  )[0] ?? null;
  const topStrength = args.report.report.topStrengths[0] ?? null;
  const lossRows = rowsWithTradeIds(args.report).filter(
    (row) => row.grossRealizedPnl < 0,
  );
  const lossAttribute = mostCommonLabel(
    lossRows.map((row) =>
      row.executionCount >= 5
        ? "5+ execution trades"
        : row.addCountAfterInitialEntry > 0
          ? "scale-in trades"
          : row.isOpenPosition
            ? "open-position trades"
            : null,
    ),
  );

  return {
    reportId: args.report.id,
    bestPerformingCluster: bestBucket
      ? patternItem({
          id: `best:${bestBucket.id}`,
          label: bestBucket.label,
          detail: `${bestBucket.tradeCount} trade(s), ${roundMoney(bestBucket.grossTotalRealizedPnl)} gross P/L.`,
          relatedTradeIds: bestBucket.tradeIds,
          value: bestBucket.grossTotalRealizedPnl,
        })
      : null,
    worstPerformingCluster: worstBucket
      ? patternItem({
          id: `worst:${worstBucket.id}`,
          label: worstBucket.label,
          detail: `${worstBucket.tradeCount} trade(s), ${roundMoney(worstBucket.grossTotalRealizedPnl)} gross P/L.`,
          relatedTradeIds: worstBucket.tradeIds,
          value: worstBucket.grossTotalRealizedPnl,
        })
      : null,
    highestCostMistake: topCost
      ? patternItem({
          id: `cost:${topCost.taxonomyId}`,
          label: topCost.label,
          detail: `$${topCost.estimatedGrossCost.toFixed(2)} estimated gross execution-only cost.`,
          relatedTradeIds: topCost.relatedTradeIds,
          value: topCost.estimatedGrossCost,
        })
      : null,
    mostRepeatedMistake: mostRepeated
      ? patternItem({
          id: `repeated:${mostRepeated.taxonomyId}`,
          label: mapImprovementBehavior(mostRepeated).label,
          detail: mapImprovementBehavior(mostRepeated).evidenceSentence,
          relatedTradeIds: mostRepeated.tradeIds,
          value: mostRepeated.occurrenceCount,
        })
      : null,
    mostPromisingStrength: topStrength
      ? patternItem({
          id: `strength:${topStrength.id}`,
          label: topStrength.label,
          detail: `${topStrength.count} trade(s) showed this repeatable strength.`,
          relatedTradeIds:
            rowsWithTradeIds(args.report)
              .filter((row) => row.topStrength?.id === topStrength.id)
              .map((row) => row.tradeId),
          value: topStrength.count,
        })
      : null,
    lossAssociatedAttribute: lossAttribute
      ? patternItem({
          id: `loss_attribute:${lossAttribute.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          label: lossAttribute,
          detail: `${lossRows.length} gross losing trade(s) share this execution attribute.`,
          relatedTradeIds: lossRows.map((row) => row.tradeId),
          value: lossRows.length,
        })
      : null,
  };
}

export function buildTraderImprovementIntelligence(args: {
  report: SavedTraderAnalyticsReport;
  trades: SavedExecutionTrade[];
  ruleEvaluations: TraderRuleEvaluation[];
  productIntelligence: TraderProductIntelligenceViewModel;
}): TraderImprovementIntelligence {
  const reportTradeIds = new Set(args.report.sourceTradeIds);
  const sourceTrades = args.trades.filter((trade) => reportTradeIds.has(trade.id));
  const tradeQualityScorecards = sourceTrades.map((trade) =>
    buildTradeQualityScorecard({ trade, report: args.report }),
  );
  const tradeAutopsies = sourceTrades.map((trade) =>
    buildTradeExecutionAutopsy({ trade, report: args.report }),
  );
  const mistakeObservations = buildTraderImprovementMistakeObservations({
    baseObservations: args.productIntelligence.mistakeTaxonomy.observations,
    ruleEvaluations: args.ruleEvaluations,
  });
  const playbook = buildPlaybookReadiness({
    report: args.report,
    qualityScorecards: tradeQualityScorecards,
  });
  const dailyCoachReport = buildDailyCoachReport({
    report: args.report,
    qualityScorecards: tradeQualityScorecards,
    mistakeObservations,
    ruleEvaluations: args.ruleEvaluations,
  });
  const visuals = buildTraderImprovementVisuals({
    report: args.report,
    qualityScorecards: tradeQualityScorecards,
    mistakeObservations,
    ruleEvaluations: args.ruleEvaluations,
  });
  const bestWorstPatterns = buildBestWorstPatternFinder({
    report: args.report,
    playbookBuckets: playbook.buckets,
    mistakeObservations,
    productIntelligence: args.productIntelligence,
  });

  return {
    source: "execution_only",
    marketContextUsedForScoring: false,
    tradeQualityScorecards,
    tradeAutopsies,
    mistakeObservations,
    playbookBuckets: playbook.buckets,
    playbookAssignments: playbook.assignments,
    dailyCoachReport,
    visuals,
    bestWorstPatterns,
  };
}
