import { describe, expect, it } from "vitest";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import invalidExecutionOnlyRequests from "../../../docs/trade-analysis-request-fixtures/invalid-execution-only-requests.json";
import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import {
  buildImportReconciliationBatch,
  buildAnalysisConfidenceBadges,
  buildDefaultProductDataRetentionPolicy,
  buildProductPermissionSummary,
  buildProductVisualQaPlan,
  buildSampleSavedTraderAnalyticsData,
  buildSampleWorkspaceContext,
  buildTradeTaggingSummary,
  buildTraderActionPlan,
  buildTraderAnalyticsProductizationViewModel,
  buildProductTraderAnalyticsViewModel,
  buildTraderAnalysisJobQueue,
  buildTraderReviewWorkflow,
  previewSavedTradeImport,
} from "../index";

describe("end-user productization helpers", () => {
  it("builds sample workspace scope without claiming real persistence", () => {
    const workspace = buildSampleWorkspaceContext({
      userId: "sample-user",
      accountId: "sample-account",
    });

    expect(workspace.summary).toMatchObject({
      workspaceId: "workspace-sample",
      activeAccountId: "sample-account",
      userRole: "owner",
      sampleData: true,
      persistenceMode: "sample_in_memory",
      accountTimezone: "America/New_York",
      accountBaseCurrency: "USD",
    });
    expect(workspace.account.importDefaults).toMatchObject({
      optionsHandling: "reject",
      maxTradeGroupingGapMinutes: 240,
      splitTradesAtSessionBoundary: true,
    });
    expect(workspace.account.supportedAssetClasses).toEqual(["stocks"]);
    expect(workspace.summary.nextAction).toContain("persistent storage");
  });

  it("reconciles ready, needs-review, duplicate, and rejected import rows", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const requests = [
      longWinner as UserTradeAnalysisRequest,
      openPosition as UserTradeAnalysisRequest,
      ...((invalidExecutionOnlyRequests as {
        requests: UserTradeAnalysisRequest[];
      }).requests ?? []),
    ];
    const noDuplicateBatch = buildImportReconciliationBatch({
      batchId: "fresh-import",
      preview: previewSavedTradeImport(requests),
      requests,
      existingTrades: [],
    });
    const duplicateBatch = buildImportReconciliationBatch({
      batchId: "duplicate-import",
      preview: previewSavedTradeImport(requests),
      requests,
      existingTrades: sample.trades,
    });

    expect(noDuplicateBatch.items.map((item) => item.status)).toEqual(
      expect.arrayContaining(["ready", "needs_review", "rejected"]),
    );
    expect(duplicateBatch.duplicateCount).toBeGreaterThan(0);
    expect(duplicateBatch.existingDuplicateCount).toBeGreaterThan(0);
    expect(duplicateBatch.rejectedCount).toBeGreaterThan(0);
  });

  it("flags duplicate trades inside the same import batch by fingerprint", () => {
    const requests = [
      longWinner as UserTradeAnalysisRequest,
      longWinner as UserTradeAnalysisRequest,
    ];
    const batch = buildImportReconciliationBatch({
      batchId: "same-file-duplicate-import",
      preview: previewSavedTradeImport(requests),
      requests,
      existingTrades: [],
    });

    expect(batch.duplicateCount).toBe(1);
    expect(batch.withinBatchDuplicateCount).toBe(1);
    expect(batch.items[1]).toMatchObject({
      status: "duplicate",
      duplicateKind: "within_import_batch",
      duplicateOfRequestIndex: 0,
    });
  });

  it("builds permission policy with production routes separated from debug routes", () => {
    const permissions = buildProductPermissionSummary();

    expect(permissions.productionRouteCount).toBe(2);
    expect(permissions.adminDebugRouteCount).toBeGreaterThan(0);
    expect(permissions.endUserExportAllowed).toBe(false);
    expect(permissions.rawJsonRestrictedToAdmin).toBe(true);
    expect(permissions.issues).toEqual([]);
  });

  it("builds productization view model with workflow, action plan, jobs, tags, QA, and calibration queue", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const productization = analytics.productization;

    expect(productization.workspace.sampleData).toBe(true);
    expect(productization.reconciliation.duplicateCount).toBeGreaterThan(0);
    expect(productization.reviewWorkflow.totalCount).toBeGreaterThan(0);
    expect(productization.actionPlan.items.length).toBeGreaterThan(0);
    expect(productization.jobQueue.totalCount).toBe(
      productization.reconciliation.totalCount,
    );
    expect(productization.visualQa.totalCount).toBe(4);
    expect(productization.analysisConfidenceBadges.map((badge) => badge.source)).toEqual(
      expect.arrayContaining([
        "execution_only",
        "execution_plus_levels",
        "market_structure_observational",
      ]),
    );
    expect(productization.dataRetentionPolicy.userExportAllowed).toBe(false);
    expect(productization.marketContextCalibrationQueue.sampleOnlyCount).toBe(
      sample.trades.length,
    );
  });

  it("builds analysis confidence badges without letting experimental structure score trades", () => {
    const badges = buildAnalysisConfidenceBadges({
      hasLevelsContext: true,
      hasExperimentalMarketStructure: true,
      marketStructureCalibrated: false,
    });

    expect(badges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "execution_only",
          userVisible: true,
          marketStructureUsedForScoring: false,
        }),
        expect.objectContaining({
          source: "market_structure_observational",
          userVisible: false,
          marketStructureUsedForScoring: false,
        }),
      ]),
    );
  });

  it("builds a no-export retention and delete policy for the end-user product", () => {
    const policy = buildDefaultProductDataRetentionPolicy();

    expect(policy.userExportAllowed).toBe(false);
    expect(policy.rawCsvRetentionDays).toBe(0);
    expect(policy.deletionActions.map((action) => action.id)).toEqual(
      expect.arrayContaining([
        "delete_import_batch",
        "delete_saved_trade",
        "delete_trading_account",
      ]),
    );
  });

  it("builds review workflow and action plans from saved analytics instead of raw imports", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const workflow = buildTraderReviewWorkflow({
      report: analytics.latestReport,
      focusQueue: analytics.focusQueue,
      ruleCompliance: analytics.ruleComplianceSummary,
    });
    const actionPlan = buildTraderActionPlan({
      report: analytics.latestReport,
      focusQueue: analytics.focusQueue,
      ruleCompliance: analytics.ruleComplianceSummary,
    });

    expect(workflow.needsReviewCount).toBeGreaterThan(0);
    expect(workflow.ruleCreatedCount).toBeGreaterThan(0);
    expect(actionPlan.items[0].measurementWindow).toContain("Next");
    expect(actionPlan.items[0].relatedTradeIds.length).toBeGreaterThan(0);
  });

  it("segments trades by execution-only setup tags", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const tagging = buildTradeTaggingSummary(report!);

    expect(tagging.tags.every((tag) => tag.source === "execution_only")).toBe(
      true,
    );
    expect(tagging.segments.map((segment) => segment.tagId)).toEqual(
      expect.arrayContaining(["long", "short", "scale_in"]),
    );
    expect(
      tagging.segments.every((segment) => segment.tradeCount > 0),
    ).toBe(true);
  });

  it("builds analysis jobs from reconciliation state before real workers exist", () => {
    const requests = [
      longWinner as UserTradeAnalysisRequest,
      openPosition as UserTradeAnalysisRequest,
      ...((invalidExecutionOnlyRequests as {
        requests: UserTradeAnalysisRequest[];
      }).requests ?? []),
    ];
    const reconciliation = buildImportReconciliationBatch({
      batchId: "job-import",
      preview: previewSavedTradeImport(requests),
      requests,
      existingTrades: [],
    });
    const jobs = buildTraderAnalysisJobQueue(reconciliation);

    expect(jobs.totalCount).toBe(reconciliation.totalCount);
    expect(jobs.queuedCount).toBeGreaterThan(0);
    expect(jobs.needsUserFixCount).toBeGreaterThan(0);
    expect(jobs.failedCount).toBeGreaterThan(0);
  });

  it("keeps visual QA and market calibration as product gates", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildTraderAnalyticsProductizationViewModel({
      userId: sample.userId,
      accountId: sample.accountId,
      trades: sample.trades,
      report: sample.reports[0],
      focusQueue: buildProductTraderAnalyticsViewModel({
        repository: sample.repository,
        userId: sample.userId,
        importRequests: sample.importRequests,
      }).focusQueue,
      ruleCompliance: buildProductTraderAnalyticsViewModel({
        repository: sample.repository,
        userId: sample.userId,
        importRequests: sample.importRequests,
      }).ruleComplianceSummary,
      importPreview: previewSavedTradeImport(sample.importRequests),
      importRequests: sample.importRequests,
    });
    const visualQa = buildProductVisualQaPlan();

    expect(visualQa.needsReviewCount).toBe(4);
    expect(analytics.marketContextCalibrationQueue.executionAnalyticsIsolated).toBe(
      true,
    );
    expect(analytics.marketContextCalibrationQueue.readyCount).toBe(0);
    expect(analytics.marketContextCalibrationQueue.nextAction).toContain(
      "real saved trades",
    );
  });
});
