import { describe, expect, it } from "vitest";
import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTradeImportRequests,
  buildSampleSavedTraderAnalyticsData,
  buildSavedReportSnapshotCards,
  buildSavedTradeImportInbox,
  buildSavedTradeReviewViewModel,
  buildTraderAnalyticsStorageReadiness,
  buildTraderBehaviorStreaks,
  buildTraderMarketContextAddOnStatus,
  buildTraderRuleComplianceSummary,
  buildTraderWeeklyReviewDashboard,
  getLatestSavedTraderAnalyticsReport,
  previewSavedTradeImport,
} from "../index";

describe("end-user analytics product expansion", () => {
  it("marks sample in-memory storage as not production persistence", () => {
    const sampleReadiness = buildTraderAnalyticsStorageReadiness({
      mode: "sample_in_memory",
    });
    const localSqliteReadiness = buildTraderAnalyticsStorageReadiness({
      mode: "local_sqlite_single_user",
    });
    const persistentReadiness = buildTraderAnalyticsStorageReadiness({
      mode: "authenticated_persistent",
    });

    expect(sampleReadiness.readyForProductionPersistence).toBe(false);
    expect(sampleReadiness.blockerCount).toBeGreaterThan(0);
    expect(
      sampleReadiness.checks.find(
        (check) => check.id === "no_end_user_export",
      )?.passed,
    ).toBe(true);
    expect(localSqliteReadiness.readyForProductionPersistence).toBe(false);
    expect(localSqliteReadiness.label).toBe("Local SQLite beta storage");
    expect(
      localSqliteReadiness.checks.find(
        (check) => check.id === "server_persistence",
      )?.passed,
    ).toBe(true);
    expect(localSqliteReadiness.nextAction).toContain("single-user beta");
    expect(persistentReadiness.readyForProductionPersistence).toBe(true);
  });

  it("builds an import review inbox with ready, review, and rejected states", () => {
    const preview = previewSavedTradeImport(buildSampleSavedTradeImportRequests());
    const inbox = buildSavedTradeImportInbox({
      batchId: "test-import",
      preview,
    });

    expect(inbox.totalCount).toBeGreaterThanOrEqual(3);
    expect(inbox.readyCount).toBeGreaterThan(0);
    expect(inbox.needsReviewCount).toBeGreaterThan(0);
    expect(inbox.rejectedCount).toBeGreaterThan(0);
    expect(inbox.items.map((item) => item.status)).toEqual(
      expect.arrayContaining(["ready_to_save", "needs_review", "rejected"]),
    );
  });

  it("builds immutable saved report snapshot cards with note counts", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const snapshots = buildSavedReportSnapshotCards(sample.reports);

    expect(snapshots).toHaveLength(3);
    expect(snapshots[0]).toMatchObject({
      id: "report-all-sample",
      label: "All Sample Trades",
      sampleData: true,
    });
    expect(snapshots[0].noteCount).toBeGreaterThan(0);
    expect(
      snapshots.every((snapshot, index) =>
        index === 0
          ? true
          : snapshots[index - 1].generatedAt >= snapshot.generatedAt,
      ),
    ).toBe(true);
  });

  it("adds weekly review, streaks, journal prompts, and rule compliance to the product view model", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const viewModel = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });

    expect(viewModel.weeklyReview.completedTradeCount).toBeGreaterThan(0);
    expect(viewModel.behaviorStreaks).toHaveLength(4);
    expect(viewModel.journalPrompts.length).toBeGreaterThan(0);
    expect(viewModel.ruleComplianceSummary.totalRules).toBe(
      viewModel.ruleEvaluations.length,
    );
    expect(viewModel.importInbox.rejectedCount).toBeGreaterThan(0);
    expect(viewModel.storageReadiness.mode).toBe("sample_in_memory");
  });

  it("builds behavior streaks from execution-only summary facts", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const streaks = buildTraderBehaviorStreaks(report!);
    const adverseAddStreak = streaks.find(
      (streak) => streak.id === "no_adverse_price_adds",
    );
    const closeToFlatStreak = streaks.find(
      (streak) => streak.id === "closed_to_flat",
    );

    expect(adverseAddStreak).toBeDefined();
    expect(closeToFlatStreak).toBeDefined();
    expect(
      streaks.every((streak) =>
        ["active", "broken", "insufficient_data"].includes(streak.status),
      ),
    ).toBe(true);
  });

  it("summarizes rule compliance and weekly review from the same saved report", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const viewModel = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const latestReport = viewModel.latestReport;
    const compliance = buildTraderRuleComplianceSummary({
      report: latestReport,
      evaluations: viewModel.ruleEvaluations,
    });
    const weeklyReview = buildTraderWeeklyReviewDashboard({
      report: latestReport,
      focusQueue: viewModel.focusQueue,
      ruleCompliance: compliance,
      streaks: viewModel.behaviorStreaks,
    });

    expect(compliance.totalViolations).toBeGreaterThan(0);
    expect(compliance.worstViolation?.tradeIds.length).toBeGreaterThan(0);
    expect(weeklyReview.reportId).toBe(latestReport.id);
    expect(weeklyReview.nextAction.length).toBeGreaterThan(0);
  });

  it("keeps market context separate from execution-only analytics", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const viewModel = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const status = buildTraderMarketContextAddOnStatus();

    expect(status.usedForExecutionAnalytics).toBe(false);
    expect(viewModel.marketContextAddOn.usedForExecutionAnalytics).toBe(false);
    expect(viewModel.latestReport.report.dataSource).toBe(
      "execution_feedback_summaries",
    );
    expect(viewModel.latestReport.report.limitations).toEqual(
      expect.arrayContaining([
        "This report aggregates execution-feedback summaries only.",
      ]),
    );
  });

  it("adds notes and journal prompts to saved trade reviews", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const trade = sample.repository.getTrade(sample.userId, "trade-rapid-fire");
    const latestReport = getLatestSavedTraderAnalyticsReport(sample.reports);

    expect(trade).not.toBeNull();
    expect(latestReport).not.toBeNull();

    const review = buildSavedTradeReviewViewModel({
      trade: trade!,
      report: latestReport,
    });

    expect(review.trade.notes.length).toBeGreaterThan(0);
    expect(review.journalPrompts.length).toBeGreaterThan(0);
    expect(review.journalPrompts[0].targetKind).toBe("trade");
  });
});
