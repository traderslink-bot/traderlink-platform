import { describe, expect, it } from "vitest";
import {
  buildAccountPlanFoundationViewModel,
  buildBrokerMappingAdminConsoleViewModel,
  buildExecutionReplayVisual,
  buildGuidedReviewSession,
  buildImportHealthCenterViewModel,
  buildProductTraderAnalyticsViewModel,
  buildProductWorkflowShellViewModel,
  buildRuleEffectivenessTracker,
  buildSampleImportReviewWorkflow,
  buildSampleSavedTraderAnalyticsData,
  buildSampleTradeReplay,
  buildSavedTradeReviewViewModel,
  buildStorageImplementationBoundaryViewModel,
  buildTraderProgressViewModel,
} from "../index";

describe("end-user workflow productization", () => {
  it("builds a real import review view model from broker CSV diagnostics", () => {
    const importReview = buildSampleImportReviewWorkflow();

    expect(importReview.title).toBe("CSV Import Review");
    expect(importReview.preview.importResult.acceptedExecutionCount).toBeGreaterThan(0);
    expect(importReview.diagnostics.qualityScore.score).toBeGreaterThan(0);
    expect(importReview.columnMappingRows.length).toBeGreaterThan(0);
    expect(importReview.diagnostics.reconstructionPreview.items.length).toBe(
      importReview.preview.importResult.requestCount,
    );
    expect(importReview.diagnostics.commitPlan.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining(["create_import_batch", "save_grouped_trades"]),
    );
  });

  it("builds an execution replay visual for a trade detail page", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const trade = sample.repository.getTrade(sample.userId, "trade-rapid-fire");
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(trade).not.toBeNull();
    expect(report).not.toBeNull();

    const review = buildSavedTradeReviewViewModel({
      trade: trade!,
      report,
    });
    const replay = buildExecutionReplayVisual(review);

    expect(replay.tradeId).toBe("trade-rapid-fire");
    expect(replay.steps.length).toBe(trade!.request.executions.length);
    expect(replay.maxPosition).toBeGreaterThan(0);
    expect(replay.steps[0].marker).toBe("Initial entry");
    expect(replay.steps.some((step) => step.cashFlowProgress !== 0)).toBe(true);
  });

  it("builds a guided review session with lesson and rule actions", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const review = buildGuidedReviewSession({ analytics });

    expect(review.steps.map((step) => step.id)).toEqual([
      "review_daily_coach_report",
      "review_cost_driver",
      "compare_related_trades",
      "capture_lesson",
      "create_rule",
    ]);
    expect(review.suggestedLesson.status).toBe("draft");
    expect(review.primaryTradeIds.length).toBeGreaterThan(0);
  });

  it("tracks trader progress and rule effectiveness from report history", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const previousReport = sample.repository.getReport(
      sample.userId,
      "report-prior-sample",
    );
    const progress = buildTraderProgressViewModel({
      analytics,
      previousReport,
    });
    const tracker = buildRuleEffectivenessTracker({
      currentEvaluations: analytics.ruleEvaluations,
      previousEvaluations: [],
      currentCompletedTradeCount:
        analytics.latestReport.report.sampleSize.completedTradeCount,
    });

    expect(progress.ruleEffectiveness.totalRules).toBeGreaterThan(0);
    expect(progress.activeFocusLabel.length).toBeGreaterThan(0);
    expect(progress.intelligence.scorecard.dimensions.length).toBeGreaterThan(0);
    expect(tracker.items.every((item) => item.direction === "insufficient_data")).toBe(
      true,
    );
  });

  it("builds import health and broker mapping admin views", () => {
    const importHealth = buildImportHealthCenterViewModel();
    const admin = buildBrokerMappingAdminConsoleViewModel(importHealth);

    expect(importHealth.supportedBrokers.map((broker) => broker.id)).toEqual(
      expect.arrayContaining([
        "ibkr_activity_statement",
        "webull_order_history",
        "generic_execution_csv",
      ]),
    );
    expect(importHealth.fingerprintLibrary.totalCount).toBeGreaterThan(0);
    expect(admin.adminOnly).toBe(true);
    expect(admin.library.entries.length).toBe(importHealth.fingerprintLibrary.totalCount);
  });

  it("builds account plan limits and storage boundary without claiming production persistence", () => {
    const shell = buildProductWorkflowShellViewModel();
    const plan = buildAccountPlanFoundationViewModel(shell.analytics);
    const storage = buildStorageImplementationBoundaryViewModel({
      analytics: shell.analytics,
      importReview: shell.importReview,
    });

    expect(plan.plans.map((item) => item.id)).toEqual([
      "starter",
      "pro",
      "market_context",
    ]);
    expect(plan.currentUsage.savedTradeCount).toBeGreaterThan(0);
    expect(storage.readyForRealPersistence).toBe(false);
    expect(storage.blockers).toEqual(
      expect.arrayContaining(["Choose auth provider.", "Choose production database."]),
    );
    expect(storage.entityGroups.map((group) => group.id)).toEqual(
      expect.arrayContaining([
        "import_batches",
        "normalized_executions",
        "saved_trades_reports",
      ]),
    );
  });

  it("builds the full workflow shell and sample trade replay", () => {
    const shell = buildProductWorkflowShellViewModel();
    const replay = buildSampleTradeReplay("trade-rapid-fire");

    expect(shell.importReview.diagnostics.qualityScore.score).toBeGreaterThan(0);
    expect(shell.guidedReview.steps.length).toBe(5);
    expect(shell.progress.ruleEffectiveness.totalRules).toBeGreaterThan(0);
    expect(shell.importHealth.fingerprintLibrary.totalCount).toBeGreaterThan(0);
    expect(shell.accountPlan.currentPlanId).toBe("pro");
    expect(replay?.replay.steps.length).toBeGreaterThan(0);
  });
});
