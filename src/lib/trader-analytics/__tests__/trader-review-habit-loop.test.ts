import { describe, expect, it } from "vitest";
import {
  buildBehaviorChangeTracker,
  buildEndUserOnboardingPath,
  buildExecutionPlaybookDrafting,
  buildMistakeRuleConversionFlow,
  buildProductSafetyCopyAudit,
  buildProductTraderAnalyticsViewModel,
  buildReviewHabitTracker,
  buildSampleSavedTraderAnalyticsData,
  buildTradeComparisonViewModel,
  buildTradeReviewChecklists,
  buildTraderReviewHabitLoopViewModel,
  buildUserFacingDataQualityScore,
} from "../index";

function buildAnalytics() {
  const sample = buildSampleSavedTraderAnalyticsData();

  return {
    sample,
    analytics: buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    }),
    previousReport:
      sample.repository.getReport(sample.userId, "report-prior-sample") ?? null,
  };
}

describe("trader review habit loop", () => {
  it("builds mistake-to-rule drafts without alternate P/L claims", () => {
    const { analytics } = buildAnalytics();
    const flow = analytics.reviewHabitLoop.mistakeRuleConversion;
    const promptOnlyIds = new Set([
      "chased_entry",
      "revenge_reentry_cluster",
      "early_winner_exit",
      "partialed_without_plan",
      "repeated_rule_violation",
      "scaled_loser",
      "add_after_adverse_move",
    ]);
    const visibleDraftCopy = flow.drafts.flatMap((draft) => [
      draft.mistakeLabel,
      draft.suggestedRuleTitle,
      draft.reason,
      draft.measurementMetric,
    ]).join("\n");

    expect(flow.totalDrafts).toBeGreaterThan(0);
    expect(
      flow.drafts.every(
        (draft) =>
          draft.affectedTradeIds.length > 0 &&
          draft.measurementMetric.length > 0 &&
          draft.limitation.includes("does not estimate alternate P/L"),
      ),
    ).toBe(true);
    expect(flow.drafts.some((draft) => promptOnlyIds.has(draft.taxonomyId))).toBe(
      false,
    );
    expect(visibleDraftCopy).not.toMatch(/added after failed premise/i);
    expect(visibleDraftCopy).not.toMatch(/\bpremise\b/i);
    expect(visibleDraftCopy).not.toMatch(/revenge-like/i);
    expect(visibleDraftCopy).not.toMatch(/chased entry/i);
    expect(visibleDraftCopy).not.toMatch(/early winner exit/i);
  });

  it("builds a seven-step checklist for each latest-report trade", () => {
    const { analytics } = buildAnalytics();
    const checklists = analytics.reviewHabitLoop.tradeReviewChecklists;

    expect(checklists).toHaveLength(analytics.latestReport.sourceTradeIds.length);
    expect(checklists.every((checklist) => checklist.items.length === 7)).toBe(true);
    expect(
      checklists.every(
        (checklist) =>
          checklist.completionPct >= 0 &&
          checklist.completionPct <= 100 &&
          checklist.nextAction.length > 0,
      ),
    ).toBe(true);
  });

  it("tracks behavior changes from current and prior reports", () => {
    const { analytics } = buildAnalytics();
    const tracker = analytics.reviewHabitLoop.behaviorChangeTracker;

    expect(tracker.totalCount).toBeGreaterThanOrEqual(4);
    expect(
      tracker.items.some(
        (item) =>
          item.id === "adverse_add_rate" &&
          item.currentValue !== null &&
          item.previousValue !== null,
      ),
    ).toBe(true);
    expect(
      tracker.items.every((item) =>
        ["improving", "worsening", "flat", "insufficient_data"].includes(
          item.direction,
        ),
      ),
    ).toBe(true);
  });

  it("builds data quality, playbook drafts, comparison, habits, and onboarding", () => {
    const { analytics } = buildAnalytics();
    const habit = analytics.reviewHabitLoop;

    expect(habit.dataQualityScore.score).toBeGreaterThanOrEqual(0);
    expect(habit.dataQualityScore.score).toBeLessThanOrEqual(100);
    expect(habit.dataQualityScore.checks.length).toBeGreaterThan(0);
    expect(habit.playbookDrafting.totalDrafts).toBeGreaterThan(0);
    expect(habit.playbookDrafting.drafts.every(
      (draft) => draft.marketContextUsedForSetupQuality === false,
    )).toBe(true);
    expect(habit.tradeComparison?.marketContextUsedForComparison).toBe(false);
    expect(habit.reviewHabitTracker.metrics.length).toBeGreaterThan(0);
    expect(habit.onboardingPath.steps.map((step) => step.id)).toEqual([
      "import_executions",
      "repair_data",
      "review_first_report",
      "open_coach_queue",
      "review_first_trade",
      "draft_first_rule",
      "check_progress",
    ]);
  });

  it("audits safety copy and flags forbidden overclaiming text", () => {
    const { analytics } = buildAnalytics();

    expect(analytics.reviewHabitLoop.safetyCopyAudit.passed).toBe(true);

    const unsafe = buildProductSafetyCopyAudit({
      texts: [
        {
          sourceId: "bad-copy",
          text: "This guaranteed rule would have made money.",
        },
      ],
    });

    expect(unsafe.passed).toBe(false);
    expect(unsafe.violations.length).toBeGreaterThan(0);
  });

  it("exposes pure builders for route-level use", () => {
    const { analytics, sample, previousReport } = buildAnalytics();
    const mistakeRuleConversion = buildMistakeRuleConversionFlow({
      productIntelligence: analytics.productIntelligence,
      productPolish: analytics.productPolish,
      sampleSize: analytics.latestReport.report.sampleSize.completedTradeCount,
    });
    const checklists = buildTradeReviewChecklists({
      report: analytics.latestReport,
      trades: sample.trades,
      improvement: analytics.improvementIntelligence,
      productPolish: analytics.productPolish,
      mistakeRuleConversion,
    });
    const behavior = buildBehaviorChangeTracker({
      currentReport: analytics.latestReport,
      previousReport,
      productPolish: analytics.productPolish,
    });
    const quality = buildUserFacingDataQualityScore({
      report: analytics.latestReport,
      productPolish: analytics.productPolish,
      productization: analytics.productization,
    });
    const playbooks = buildExecutionPlaybookDrafting({
      improvement: analytics.improvementIntelligence,
    });
    const comparison = buildTradeComparisonViewModel({
      report: analytics.latestReport,
      productPolish: analytics.productPolish,
    });
    const habits = buildReviewHabitTracker({
      productization: analytics.productization,
      productPolish: analytics.productPolish,
      mistakeRuleConversion,
      tradeReviewChecklists: checklists,
    });
    const onboarding = buildEndUserOnboardingPath({
      productPolish: analytics.productPolish,
      dataQualityScore: quality,
      reviewHabitTracker: habits,
      mistakeRuleConversion,
    });

    expect(mistakeRuleConversion.drafts.length).toBeGreaterThan(0);
    expect(checklists.length).toBeGreaterThan(0);
    expect(behavior.items.length).toBeGreaterThan(0);
    expect(quality.nextAction.length).toBeGreaterThan(0);
    expect(playbooks.drafts.length).toBeGreaterThan(0);
    expect(comparison).not.toBeNull();
    expect(habits.completionPct).toBeGreaterThanOrEqual(0);
    expect(onboarding.steps.length).toBe(7);
  });

  it("keeps market context out of review habit conclusions", () => {
    const { analytics, sample, previousReport } = buildAnalytics();
    const forcedMarketContext = {
      ...analytics.productIntelligence,
      marketContextReadiness: {
        ...analytics.productIntelligence.marketContextReadiness,
        calibratedCount:
          analytics.productIntelligence.marketContextReadiness.totalCount,
        items: analytics.productIntelligence.marketContextReadiness.items.map(
          (item) => ({
            ...item,
            calibratedMarketContextStatus: "ready" as const,
            usedForScoring: true,
          }),
        ),
      },
    };
    const rebuilt = buildTraderReviewHabitLoopViewModel({
      currentReport: analytics.latestReport,
      previousReport,
      trades: sample.trades,
      productization: analytics.productization,
      productIntelligence: forcedMarketContext,
      improvement: analytics.improvementIntelligence,
      coachActionLoop: analytics.coachActionLoop,
      productPolish: analytics.productPolish,
    });

    expect(rebuilt.marketContextUsedForConclusions).toBe(false);
    expect(rebuilt.mistakeRuleConversion).toEqual(
      analytics.reviewHabitLoop.mistakeRuleConversion,
    );
    expect(rebuilt.tradeComparison).toEqual(
      analytics.reviewHabitLoop.tradeComparison,
    );
    expect(rebuilt.safetyCopyAudit).toEqual(
      analytics.reviewHabitLoop.safetyCopyAudit,
    );
  });
});
