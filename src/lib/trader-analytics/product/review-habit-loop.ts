import type {
  BehaviorChangeDirection,
  BehaviorChangeTracker,
  BehaviorChangeTrackerItem,
  CoachLanguageGuideline,
  CoachLanguageRefinement,
  EndUserOnboardingPath,
  EndUserOnboardingStep,
  ExecutionPlaybookDraft,
  ExecutionPlaybookDrafting,
  MistakeRuleConversionDraft,
  MistakeRuleConversionFlow,
  ProductSafetyCopyAudit,
  ProductSafetyCopyViolation,
  ProductTraderAnalyticsTradeRow,
  ReviewHabitMetric,
  ReviewHabitTracker,
  SavedExecutionTrade,
  SavedExecutionTradeId,
  SavedTraderAnalyticsReport,
  TradeComparisonSide,
  TradeComparisonViewModel,
  TradeReviewChecklist,
  TradeReviewChecklistItem,
  TradeReviewChecklistItemStatus,
  TraderAnalyticsProductizationViewModel,
  TraderCoachActionLoop,
  TraderImprovementIntelligence,
  TraderProductIntelligenceViewModel,
  TraderProductPolishViewModel,
  TraderReviewHabitLoopViewModel,
  UserFacingDataQualityCheck,
  UserFacingDataQualityScore,
} from "./types";
import { mapUserFacingBehavior } from "../../user-facing-behavior";

const FORBIDDEN_SAFETY_PHRASES = [
  "guaranteed",
  "would have made",
  "proves",
  "prediction",
  "certain",
  "can't lose",
  "risk-free",
] as const;

function roundMetric(value: number): number {
  return Number(value.toFixed(4));
}

function roundPct(value: number): number {
  return Math.round(value * 100);
}

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

function statusFromAttention(needsAttention: boolean): TradeReviewChecklistItemStatus {
  return needsAttention ? "attention" : "complete";
}

function directionForDelta(args: {
  delta: number | null;
  favorableDirection: "up" | "down";
}): BehaviorChangeDirection {
  if (args.delta === null) {
    return "insufficient_data";
  }

  if (Math.abs(args.delta) < 0.0001) {
    return "flat";
  }

  if (args.favorableDirection === "down") {
    return args.delta < 0 ? "improving" : "worsening";
  }

  return args.delta > 0 ? "improving" : "worsening";
}

function metricItem(args: {
  id: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  favorableDirection: "up" | "down";
  currentSampleSize: number;
  previousSampleSize: number;
  relatedTradeIds: SavedExecutionTradeId[];
  nextAction: string;
}): BehaviorChangeTrackerItem {
  const delta =
    args.currentValue === null || args.previousValue === null
      ? null
      : roundMetric(args.currentValue - args.previousValue);

  return {
    id: args.id,
    label: args.label,
    currentValue: args.currentValue,
    previousValue: args.previousValue,
    delta,
    direction: directionForDelta({
      delta,
      favorableDirection: args.favorableDirection,
    }),
    favorableDirection: args.favorableDirection,
    sampleSizeWarning:
      args.currentSampleSize < 5 || args.previousSampleSize < 5,
    relatedTradeIds: args.relatedTradeIds,
    nextAction: args.nextAction,
  };
}

function mapByTradeId<T extends { tradeId: SavedExecutionTradeId }>(
  items: T[],
): Map<SavedExecutionTradeId, T> {
  return new Map(items.map((item) => [item.tradeId, item]));
}

export function buildMistakeRuleConversionFlow(args: {
  productIntelligence: TraderProductIntelligenceViewModel;
  productPolish: TraderProductPolishViewModel;
  sampleSize: number;
}): MistakeRuleConversionFlow {
  const drafts: MistakeRuleConversionDraft[] =
    args.productIntelligence.mistakeTaxonomy.observations
      .filter((observation) => observation.tradeIds.length > 0)
      .map((observation) => ({
        observation,
        behavior: mapUserFacingBehavior({
          behaviorId: observation.taxonomyId,
          rawLabel: observation.label,
          route: "/progress",
        }),
      }))
      .filter(({ behavior }) => behavior.canDrivePrimaryConclusion)
      .map((observation) => {
        const labItem = args.productPolish.ruleCandidateLab.items.find((item) =>
          item.flaggedTradeIds.some((tradeId) =>
            observation.observation.tradeIds.includes(tradeId),
          ),
        );
        const readiness: MistakeRuleConversionDraft["readiness"] =
          observation.observation.occurrenceCount >= 3 && args.sampleSize >= 8
            ? "ready_to_review"
            : observation.observation.occurrenceCount >= 2
              ? "needs_manual_review"
              : "needs_more_trades";

        const reviewStatus: MistakeRuleConversionDraft["reviewStatus"] =
          readiness === "ready_to_review" ? "review_ready" : "draft_not_saved";

        return {
          id: `mistake-rule:${observation.observation.taxonomyId}`,
          taxonomyId: observation.observation.taxonomyId,
          mistakeLabel: observation.behavior.label,
          suggestedRuleTitle:
            labItem?.suggestedRuleTitle ??
            `Reduce ${observation.behavior.label.toLowerCase()}`,
          reason: observation.behavior.evidenceSentence,
          defaultParameters:
            labItem?.defaultParameters ?? {
              maxOccurrencesPerSession: 0,
              reviewRequired: true,
            },
          affectedTradeIds: observation.observation.tradeIds,
          measurementMetric:
            labItem?.expectedSuccessMetric ??
            `Reduce ${observation.behavior.label.toLowerCase()} occurrence count.`,
          readiness,
          reviewStatus,
          limitation:
            "Draft flags related saved trades only; it does not estimate alternate P/L.",
        };
      })
      .sort((left, right) => right.affectedTradeIds.length - left.affectedTradeIds.length);

  return {
    totalDrafts: drafts.length,
    readyDraftCount: drafts.filter(
      (draft) => draft.readiness === "ready_to_review",
    ).length,
    nextAction:
      drafts.length > 0
        ? "Open the top draft, inspect affected trades, then decide whether to save it later."
        : "Review more trades before drafting personal rules.",
    drafts,
  };
}

export function buildTradeReviewChecklists(args: {
  report: SavedTraderAnalyticsReport;
  trades: SavedExecutionTrade[];
  improvement: TraderImprovementIntelligence;
  productPolish: TraderProductPolishViewModel;
  mistakeRuleConversion: MistakeRuleConversionFlow;
}): TradeReviewChecklist[] {
  const rowsByTradeId = mapByTradeId(rowsWithTradeIds(args.report));
  const gradeByTradeId = mapByTradeId(args.productPolish.gradeExplainability);
  const autopsyByTradeId = mapByTradeId(args.improvement.tradeAutopsies);

  return args.trades
    .filter((trade) => rowsByTradeId.has(trade.id))
    .map((trade) => {
      const row = rowsByTradeId.get(trade.id)!;
      const grade = gradeByTradeId.get(trade.id) ?? null;
      const autopsy = autopsyByTradeId.get(trade.id) ?? null;
      const ruleDrafts = args.mistakeRuleConversion.drafts.filter((draft) =>
        draft.affectedTradeIds.includes(trade.id),
      );
      const riskLabels = [
        row.topRisk?.label,
        ...(autopsy?.decisions.flatMap((decision) =>
          decision.tone === "negative" || decision.tone === "warning"
            ? decision.relatedPointLabels
            : [],
        ) ?? []),
      ].filter((label): label is string => Boolean(label));
      const strengthLabels = [
        row.topStrength?.label,
        ...(autopsy?.decisions.flatMap((decision) =>
          decision.tone === "positive" ? decision.relatedPointLabels : [],
        ) ?? []),
      ].filter((label): label is string => Boolean(label));
      const addDriver = grade?.negativeDrivers.find(
        (driver) => driver.id.includes("add_discipline"),
      );
      const exitDriver = grade?.negativeDrivers.find(
        (driver) => driver.id.includes("exit_discipline"),
      );
      const sizingDriver = grade?.negativeDrivers.find(
        (driver) => driver.id.includes("sizing_consistency"),
      );
      const items: TradeReviewChecklistItem[] = [
        {
          id: "entry_review",
          label: "Entry Review",
          status: statusFromAttention(
            Boolean(row.topRisk?.id.includes("rapid_fire")),
          ),
          evidence:
            row.topRisk?.label ?? "No entry-specific risk is currently linked.",
          linkedLabels: riskLabels.slice(0, 2),
          nextAction: "Check whether the first execution followed the plan.",
        },
        {
          id: "add_review",
          label: "Add Review",
          status: statusFromAttention(row.adversePriceAddCount > 0),
          evidence: `${row.addCountAfterInitialEntry} add(s), ${row.adversePriceAddCount} add(s) after adverse movement.`,
          linkedLabels: addDriver?.evidence ?? [],
          nextAction:
            "Review whether each add had repair evidence or only increased exposure.",
        },
        {
          id: "exit_review",
          label: "Exit Review",
          status: statusFromAttention(row.isOpenPosition || row.reductionCount === 0),
          evidence: row.isOpenPosition
            ? "Trade ended with shares still open."
            : `${row.reductionCount} reduction(s) found.`,
          linkedLabels: exitDriver?.evidence ?? strengthLabels.slice(0, 2),
          nextAction: "Check whether the exit reduced risk at the right moment.",
        },
        {
          id: "sizing_review",
          label: "Sizing Review",
          status: statusFromAttention(Boolean(sizingDriver)),
          evidence: sizingDriver?.explanation ?? "Sizing did not trigger a negative driver.",
          linkedLabels: sizingDriver?.evidence ?? [],
          nextAction: "Compare initial size, max size, and final size.",
        },
        {
          id: "risk_review",
          label: "Risk Review",
          status: statusFromAttention(riskLabels.length > 0),
          evidence: riskLabels[0] ?? "No top risk linked.",
          linkedLabels: riskLabels,
          nextAction: "Write the exact risk moment before judging the trade.",
        },
        {
          id: "lesson_review",
          label: "Lesson Review",
          status: trade.notes.length > 0 ? "complete" : "todo",
          evidence:
            trade.notes[0]?.body ?? "No saved lesson note is attached yet.",
          linkedLabels: [],
          nextAction: "Capture one sentence about what to repeat or avoid.",
        },
        {
          id: "rule_review",
          label: "Rule Review",
          status: ruleDrafts.length > 0 ? "attention" : "todo",
          evidence:
            ruleDrafts[0]?.suggestedRuleTitle ??
            "No draft rule is linked to this trade yet.",
          linkedLabels: ruleDrafts.map((draft) => draft.mistakeLabel),
          nextAction:
            ruleDrafts.length > 0
              ? "Review the linked draft rule before saving later."
              : "Decide whether this trade needs a rule.",
        },
      ];
      const completeCount = items.filter((item) => item.status === "complete").length;
      const needsAttentionCount = items.filter(
        (item) => item.status === "attention",
      ).length;

      return {
        tradeId: trade.id,
        symbol: trade.symbol,
        completionPct: roundPct(completeCount / items.length),
        needsAttentionCount,
        items,
        nextAction:
          items.find((item) => item.status === "attention")?.nextAction ??
          items.find((item) => item.status === "todo")?.nextAction ??
          "Review complete for this pass.",
      };
    });
}

export function buildBehaviorChangeTracker(args: {
  currentReport: SavedTraderAnalyticsReport;
  previousReport: SavedTraderAnalyticsReport | null;
  productPolish: TraderProductPolishViewModel;
}): BehaviorChangeTracker {
  const current = args.currentReport.report;
  const previous = args.previousReport?.report ?? null;
  const currentSampleSize = current.sampleSize.completedTradeCount;
  const previousSampleSize = previous?.sampleSize.completedTradeCount ?? 0;
  const rows = rowsWithTradeIds(args.currentReport);
  const riskTradeIds = (riskId: string) =>
    rows
      .filter((row) => row.topRisk?.id === riskId || row.warnings.includes(riskId))
      .map((row) => row.tradeId);
  const items = [
    metricItem({
      id: "adverse_add_rate",
      label: "Adds Needing Review",
      currentValue: current.executionBehavior.adversePriceAddRate,
      previousValue: previous?.executionBehavior.adversePriceAddRate ?? null,
      favorableDirection: "down",
      currentSampleSize,
      previousSampleSize,
      relatedTradeIds: rows
        .filter((row) => row.adversePriceAddCount > 0)
        .map((row) => row.tradeId),
      nextAction:
        "Compare trades where you added after price moved against the position and tighten the add rule.",
    }),
    metricItem({
      id: "rapid_fire_rate",
      label: "Fast Execution Cluster Rate",
      currentValue:
        currentSampleSize > 0
          ? current.executionBehavior.rapidFireExecutionTradeCount /
            currentSampleSize
          : null,
      previousValue:
        previous && previousSampleSize > 0
          ? previous.executionBehavior.rapidFireExecutionTradeCount /
            previousSampleSize
          : null,
      favorableDirection: "down",
      currentSampleSize,
      previousSampleSize,
      relatedTradeIds: riskTradeIds("rapid_fire_execution_cluster"),
      nextAction:
        "Review trades with several executions close together before creating a cooldown rule.",
    }),
    metricItem({
      id: "open_position_rate",
      label: "Open Position Rate",
      currentValue: current.lifecycle.openPositionRate,
      previousValue: previous?.lifecycle.openPositionRate ?? null,
      favorableDirection: "down",
      currentSampleSize,
      previousSampleSize,
      relatedTradeIds: rows
        .filter((row) => row.isOpenPosition)
        .map((row) => row.tradeId),
      nextAction: "Review leftover-position trades and require explicit close checks.",
    }),
    metricItem({
      id: "average_quality",
      label: "Average Trade Quality",
      currentValue: args.productPolish.executionQualityTrendline.averageScore,
      previousValue: null,
      favorableDirection: "up",
      currentSampleSize,
      previousSampleSize,
      relatedTradeIds: args.productPolish.executionQualityTrendline.points.map(
        (point) => point.tradeId,
      ),
      nextAction: "Use the trendline to identify the cleanest and weakest trades.",
    }),
  ];

  return {
    totalCount: items.length,
    improvingCount: items.filter((item) => item.direction === "improving").length,
    worseningCount: items.filter((item) => item.direction === "worsening").length,
    summary:
      items.some((item) => item.direction === "improving")
        ? "At least one execution behavior improved versus the prior report."
        : "More report history is needed before behavior change is clear.",
    items,
  };
}

export function buildUserFacingDataQualityScore(args: {
  report: SavedTraderAnalyticsReport;
  productPolish: TraderProductPolishViewModel;
  productization: TraderAnalyticsProductizationViewModel;
}): UserFacingDataQualityScore {
  const repair = args.productPolish.tradeRepairInbox;
  const reconciliation = args.productization.reconciliation;
  const checks: UserFacingDataQualityCheck[] = [
    {
      id: "accepted_import_rows",
      label: "Accepted import rows",
      passed: args.productPolish.firstImportExperience.acceptedTradeCount > 0,
      severity: "blocker",
      detail: `${args.productPolish.firstImportExperience.acceptedTradeCount} imported trade request(s) are accepted.`,
    },
    {
      id: "no_repair_blockers",
      label: "No repair blockers",
      passed: repair.blockerCount === 0,
      severity: "blocker",
      detail: `${repair.blockerCount} blocker(s) in the trade repair inbox.`,
    },
    {
      id: "duplicate_review",
      label: "Duplicate review",
      passed: reconciliation.duplicateCount === 0,
      severity: "warning",
      detail: `${reconciliation.duplicateCount} duplicate candidate(s) need review.`,
    },
    {
      id: "report_trade_sample",
      label: "Report trade sample",
      passed: args.report.report.sampleSize.completedTradeCount > 0,
      severity: "blocker",
      detail: `${args.report.report.sampleSize.completedTradeCount} completed trade(s) in the report.`,
    },
    {
      id: "sample_data_label",
      label: "Sample data label",
      passed: !args.report.sampleData,
      severity: "info",
      detail: args.report.sampleData
        ? "Current analytics use sample data."
        : "Current analytics use user data.",
    },
  ];
  const blockerCount = checks.filter(
    (check) => check.severity === "blocker" && !check.passed,
  ).length;
  const warningCount = checks.filter(
    (check) => check.severity === "warning" && !check.passed,
  ).length;
  const score = clamp(
    100 -
      blockerCount * 30 -
      warningCount * 15 -
      repair.warningCount * 5 -
      (args.report.sampleData ? 10 : 0),
    0,
    100,
  );

  return {
    score,
    status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "clean",
    blockerCount,
    warningCount,
    nextAction:
      blockerCount > 0
        ? "Fix import blockers before trusting coaching output."
        : warningCount > 0
          ? "Review duplicate or warning items before saving."
          : "Data is ready for execution coaching.",
    checks,
  };
}

export function buildProductSafetyCopyAudit(args: {
  texts: Array<{ sourceId: string; text: string }>;
}): ProductSafetyCopyAudit {
  const violations: ProductSafetyCopyViolation[] = [];

  for (const entry of args.texts) {
    const lower = entry.text.toLowerCase();
    for (const phrase of FORBIDDEN_SAFETY_PHRASES) {
      if (lower.includes(phrase)) {
        violations.push({
          id: `copy-violation:${entry.sourceId}:${phrase}`,
          sourceId: entry.sourceId,
          phrase,
          text: entry.text,
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    checkedTextCount: args.texts.length,
    forbiddenPhrases: [...FORBIDDEN_SAFETY_PHRASES],
    violations,
  };
}

export function buildCoachLanguageRefinement(args: {
  safetyAudit: ProductSafetyCopyAudit;
}): CoachLanguageRefinement {
  const guidelines: CoachLanguageGuideline[] = [
    {
      id: "tie_to_execution_facts",
      label: "Tie copy to execution facts",
      guidance: "Name the fill, add, trim, exit, size, or review fact behind the coaching read.",
    },
    {
      id: "respect_sample_size",
      label: "Respect sample size",
      guidance: "Use cautious wording until repeated saved trades support the behavior.",
    },
    {
      id: "avoid_alternate_pnl",
      label: "Avoid alternate P/L claims",
      guidance: "Show flagged trades and review actions without claiming a different outcome.",
    },
    {
      id: "preserve_strengths",
      label: "Preserve strengths",
      guidance: "Tell the user what to keep doing when the execution evidence is clean.",
    },
  ];

  return {
    guidelines,
    safetyAudit: args.safetyAudit,
  };
}

export function buildExecutionPlaybookDrafting(args: {
  improvement: TraderImprovementIntelligence;
}): ExecutionPlaybookDrafting {
  const drafts: ExecutionPlaybookDraft[] = args.improvement.playbookBuckets
    .filter((bucket) => bucket.tradeCount > 0)
    .map((bucket) => {
      const readiness: ExecutionPlaybookDraft["readiness"] =
        bucket.tradeCount >= 3
          ? "ready_to_name"
          : bucket.tradeCount >= 2
            ? "needs_more_examples"
            : "watch_only";

      return {
        id: `playbook-draft:${bucket.id}`,
        sourceBucketId: bucket.id,
        title: bucket.label,
        qualifyingTradeIds: bucket.tradeIds,
        tradeCount: bucket.tradeCount,
        grossTotalRealizedPnl: bucket.grossTotalRealizedPnl,
        averageQualityScore: bucket.averageQualityScore,
        protectFocus: bucket.topStrengthLabel,
        fixFocus: bucket.topRiskLabel,
        readiness,
        nextAction:
          readiness === "ready_to_name"
            ? "Name this playbook draft after reviewing the qualifying trades."
            : "Collect more examples before turning this into a saved playbook.",
        marketContextUsedForSetupQuality: false,
      };
    });

  return {
    totalDrafts: drafts.length,
    readyDraftCount: drafts.filter((draft) => draft.readiness === "ready_to_name")
      .length,
    drafts,
  };
}

function comparisonSide(args: {
  row: ProductTraderAnalyticsTradeRow;
  productPolish: TraderProductPolishViewModel;
}): TradeComparisonSide {
  const grade = args.productPolish.gradeExplainability.find(
    (candidate) => candidate.tradeId === args.row.tradeId,
  );

  return {
    tradeId: args.row.tradeId,
    symbol: args.row.symbol,
    grossRealizedPnl: args.row.grossRealizedPnl,
    qualityScore: grade?.overallScore ?? null,
    executionCount: args.row.executionCount,
    topRiskLabel: args.row.topRisk?.label ?? null,
    topStrengthLabel: args.row.topStrength?.label ?? null,
  };
}

export function buildTradeComparisonViewModel(args: {
  report: SavedTraderAnalyticsReport;
  productPolish: TraderProductPolishViewModel;
}): TradeComparisonViewModel | null {
  const rows = rowsWithTradeIds(args.report);

  if (rows.length < 2) {
    return null;
  }

  const best =
    rows.find(
      (row) => row.tradeId === args.productPolish.sessionRecap.bestTrade?.tradeId,
    ) ?? [...rows].sort((left, right) => right.grossRealizedPnl - left.grossRealizedPnl)[0];
  const worst =
    rows.find(
      (row) => row.tradeId === args.productPolish.sessionRecap.worstTrade?.tradeId,
    ) ?? [...rows].sort((left, right) => left.grossRealizedPnl - right.grossRealizedPnl)[0];

  if (!best || !worst || best.tradeId === worst.tradeId) {
    return null;
  }

  const left = comparisonSide({ row: best, productPolish: args.productPolish });
  const right = comparisonSide({ row: worst, productPolish: args.productPolish });
  const qualityDelta =
    left.qualityScore === null || right.qualityScore === null
      ? null
      : roundMetric(left.qualityScore - right.qualityScore);

  return {
    id: `trade-comparison:${left.tradeId}:${right.tradeId}`,
    title: `${left.symbol} vs ${right.symbol}`,
    left,
    right,
    pnlDelta: roundMetric(left.grossRealizedPnl - right.grossRealizedPnl),
    qualityDelta,
    sharedBehavior:
      left.symbol === right.symbol
        ? `Both trades used ${left.symbol}.`
        : "Both trades are from the latest saved report.",
    keyDifference:
      (right.topRiskLabel && `Worst side carried ${right.topRiskLabel}.`) ||
      (left.topStrengthLabel && `Best side showed ${left.topStrengthLabel}.`) ||
      "Compare execution count, adds, exits, and sizing.",
    reviewPrompt:
      "Write one behavior to repeat from the stronger trade and one behavior to avoid from the weaker trade.",
    marketContextUsedForComparison: false,
  };
}

export function buildReviewHabitTracker(args: {
  productization: TraderAnalyticsProductizationViewModel;
  productPolish: TraderProductPolishViewModel;
  mistakeRuleConversion: MistakeRuleConversionFlow;
  tradeReviewChecklists: TradeReviewChecklist[];
}): ReviewHabitTracker {
  const workflow = args.productization.reviewWorkflow;
  const checklistComplete =
    args.tradeReviewChecklists.length > 0
      ? Math.round(
          args.tradeReviewChecklists.reduce(
            (total, checklist) => total + checklist.completionPct,
            0,
          ) / args.tradeReviewChecklists.length,
        )
      : 0;
  const metrics: ReviewHabitMetric[] = [
    {
      id: "review_completion",
      label: "Review Completion",
      value: workflow.reviewedCount,
      target: Math.max(workflow.totalCount, 1),
      status: workflow.reviewedCount >= workflow.totalCount ? "on_track" : "needs_attention",
      detail: `${workflow.reviewedCount} of ${workflow.totalCount} review item(s) marked reviewed.`,
    },
    {
      id: "lessons_captured",
      label: "Lessons Captured",
      value: workflow.lessonCapturedCount,
      target: Math.max(workflow.needsReviewCount, 1),
      status: workflow.lessonCapturedCount > 0 ? "on_track" : "needs_attention",
      detail: `${workflow.lessonCapturedCount} lesson(s) captured in the current workflow.`,
    },
    {
      id: "rules_drafted",
      label: "Rules Drafted",
      value: args.mistakeRuleConversion.totalDrafts,
      target: 1,
      status:
        args.mistakeRuleConversion.totalDrafts > 0
          ? "on_track"
          : "needs_attention",
      detail: `${args.mistakeRuleConversion.totalDrafts} draft rule candidate(s) are ready for review.`,
    },
    {
      id: "trade_checklists",
      label: "Trade Checklists",
      value: checklistComplete,
      target: 100,
      status: checklistComplete >= 70 ? "on_track" : "needs_attention",
      detail: `Average checklist completion is ${checklistComplete}%.`,
    },
  ];

  return {
    completionPct: Math.round(
      metrics.reduce(
        (total, metric) => total + Math.min(metric.value / metric.target, 1),
        0,
      ) /
        metrics.length *
        100,
    ),
    activeStreakCount: args.productPolish.personalPatternMemory.totalCount,
    nextHabitAction:
      metrics.find((metric) => metric.status === "needs_attention")?.detail ??
      "Keep reviewing the highest-priority coach queue item.",
    metrics,
  };
}

export function buildEndUserOnboardingPath(args: {
  productPolish: TraderProductPolishViewModel;
  dataQualityScore: UserFacingDataQualityScore;
  reviewHabitTracker: ReviewHabitTracker;
  mistakeRuleConversion: MistakeRuleConversionFlow;
}): EndUserOnboardingPath {
  const importReady = args.dataQualityScore.status !== "blocked";
  const repairClear = args.productPolish.tradeRepairInbox.blockerCount === 0;
  const coachReady = args.productPolish.coachReviewQueue.totalCount > 0;
  const tradeReady = args.productPolish.gradeExplainability.length > 0;
  const ruleReady = args.mistakeRuleConversion.totalDrafts > 0;
  const progressReady = args.reviewHabitTracker.completionPct > 0;
  const steps: EndUserOnboardingStep[] = [
    {
      id: "import_executions",
      label: "Import executions",
      status: importReady ? "complete" : "current",
      detail: args.productPolish.firstImportExperience.summary,
      href: "/imports",
      nextAction: args.productPolish.firstImportExperience.nextAction,
    },
    {
      id: "repair_data",
      label: "Repair data",
      status: !importReady ? "blocked" : repairClear ? "complete" : "current",
      detail: args.productPolish.tradeRepairInbox.nextAction,
      href: "/imports",
      nextAction: args.productPolish.tradeRepairInbox.nextAction,
    },
    {
      id: "review_first_report",
      label: "Review first report",
      status: coachReady ? "complete" : "upcoming",
      detail: "Open analytics and identify the first coach queue item.",
      href: "/analytics",
      nextAction: "Open the analytics dashboard.",
    },
    {
      id: "open_coach_queue",
      label: "Open coach queue",
      status: coachReady ? "complete" : "upcoming",
      detail: args.productPolish.coachReviewQueue.primaryItem?.title ?? "Coach queue needs saved trades.",
      href: "/coach",
      nextAction:
        args.productPolish.coachReviewQueue.primaryItem?.nextAction ??
        "Review the coach queue.",
    },
    {
      id: "review_first_trade",
      label: "Review first trade",
      status: tradeReady ? "complete" : "upcoming",
      detail: "Use the checklist and grade explanation on a trade review page.",
      href: tradeReady
        ? `/trades/${args.productPolish.gradeExplainability[0].tradeId}`
        : "/analytics",
      nextAction: "Open the first trade review.",
    },
    {
      id: "draft_first_rule",
      label: "Draft first rule",
      status: ruleReady ? "complete" : "upcoming",
      detail: args.mistakeRuleConversion.nextAction,
      href: "/coach",
      nextAction: args.mistakeRuleConversion.nextAction,
    },
    {
      id: "check_progress",
      label: "Check progress",
      status: progressReady ? "complete" : "upcoming",
      detail: args.reviewHabitTracker.nextHabitAction,
      href: "/progress",
      nextAction: "Open progress after the first review pass.",
    },
  ];
  const completeCount = steps.filter((step) => step.status === "complete").length;

  return {
    headline: "Build your first review habit loop",
    completionPct: roundPct(completeCount / steps.length),
    currentStep:
      steps.find((step) => step.status === "current") ??
      steps.find((step) => step.status === "upcoming") ??
      null,
    steps,
  };
}

function habitLoopTexts(args: {
  mistakeRuleConversion: MistakeRuleConversionFlow;
  tradeReviewChecklists: TradeReviewChecklist[];
  behaviorChangeTracker: BehaviorChangeTracker;
  dataQualityScore: UserFacingDataQualityScore;
  playbookDrafting: ExecutionPlaybookDrafting;
  tradeComparison: TradeComparisonViewModel | null;
  reviewHabitTracker: ReviewHabitTracker;
  onboardingPath: EndUserOnboardingPath;
}): Array<{ sourceId: string; text: string }> {
  return [
    {
      sourceId: "mistake-rule-next-action",
      text: args.mistakeRuleConversion.nextAction,
    },
    ...args.mistakeRuleConversion.drafts.flatMap((draft) => [
      { sourceId: `${draft.id}:reason`, text: draft.reason },
      { sourceId: `${draft.id}:limitation`, text: draft.limitation },
    ]),
    ...args.tradeReviewChecklists.flatMap((checklist) =>
      checklist.items.map((item) => ({
        sourceId: `${checklist.tradeId}:${item.id}`,
        text: `${item.evidence} ${item.nextAction}`,
      })),
    ),
    ...args.behaviorChangeTracker.items.map((item) => ({
      sourceId: `behavior:${item.id}`,
      text: item.nextAction,
    })),
    {
      sourceId: "data-quality-next-action",
      text: args.dataQualityScore.nextAction,
    },
    ...args.playbookDrafting.drafts.map((draft) => ({
      sourceId: draft.id,
      text: draft.nextAction,
    })),
    ...(args.tradeComparison
      ? [
          {
            sourceId: args.tradeComparison.id,
            text: `${args.tradeComparison.keyDifference} ${args.tradeComparison.reviewPrompt}`,
          },
        ]
      : []),
    ...args.reviewHabitTracker.metrics.map((metric) => ({
      sourceId: `habit:${metric.id}`,
      text: metric.detail,
    })),
    ...args.onboardingPath.steps.map((step) => ({
      sourceId: `onboarding:${step.id}`,
      text: `${step.detail} ${step.nextAction}`,
    })),
  ];
}

export function buildTraderReviewHabitLoopViewModel(args: {
  currentReport: SavedTraderAnalyticsReport;
  previousReport: SavedTraderAnalyticsReport | null;
  trades: SavedExecutionTrade[];
  productization: TraderAnalyticsProductizationViewModel;
  productIntelligence: TraderProductIntelligenceViewModel;
  improvement: TraderImprovementIntelligence;
  coachActionLoop: TraderCoachActionLoop;
  productPolish: TraderProductPolishViewModel;
}): TraderReviewHabitLoopViewModel {
  const mistakeRuleConversion = buildMistakeRuleConversionFlow({
    productIntelligence: args.productIntelligence,
    productPolish: args.productPolish,
    sampleSize: args.currentReport.report.sampleSize.completedTradeCount,
  });
  const tradeReviewChecklists = buildTradeReviewChecklists({
    report: args.currentReport,
    trades: args.trades,
    improvement: args.improvement,
    productPolish: args.productPolish,
    mistakeRuleConversion,
  });
  const behaviorChangeTracker = buildBehaviorChangeTracker({
    currentReport: args.currentReport,
    previousReport: args.previousReport,
    productPolish: args.productPolish,
  });
  const dataQualityScore = buildUserFacingDataQualityScore({
    report: args.currentReport,
    productPolish: args.productPolish,
    productization: args.productization,
  });
  const playbookDrafting = buildExecutionPlaybookDrafting({
    improvement: args.improvement,
  });
  const tradeComparison = buildTradeComparisonViewModel({
    report: args.currentReport,
    productPolish: args.productPolish,
  });
  const reviewHabitTracker = buildReviewHabitTracker({
    productization: args.productization,
    productPolish: args.productPolish,
    mistakeRuleConversion,
    tradeReviewChecklists,
  });
  const onboardingPath = buildEndUserOnboardingPath({
    productPolish: args.productPolish,
    dataQualityScore,
    reviewHabitTracker,
    mistakeRuleConversion,
  });
  const safetyCopyAudit = buildProductSafetyCopyAudit({
    texts: habitLoopTexts({
      mistakeRuleConversion,
      tradeReviewChecklists,
      behaviorChangeTracker,
      dataQualityScore,
      playbookDrafting,
      tradeComparison,
      reviewHabitTracker,
      onboardingPath,
    }),
  });
  const coachLanguageRefinement = buildCoachLanguageRefinement({
    safetyAudit: safetyCopyAudit,
  });

  return {
    source: "execution_only",
    marketContextUsedForConclusions: false,
    mistakeRuleConversion,
    tradeReviewChecklists,
    behaviorChangeTracker,
    dataQualityScore,
    coachLanguageRefinement,
    playbookDrafting,
    tradeComparison,
    reviewHabitTracker,
    onboardingPath,
    safetyCopyAudit,
  };
}
