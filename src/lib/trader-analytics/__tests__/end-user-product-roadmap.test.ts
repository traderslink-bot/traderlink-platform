import { describe, expect, it } from "vitest";
import invalidExecutionOnlyRequests from "../../../docs/trade-analysis-request-fixtures/invalid-execution-only-requests.json";
import {
  auditProductionAnalyticsSurface,
  buildDefaultTraderRuleInstances,
  buildFilteredTraderAnalyticsView,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildSavedTradeReviewViewModel,
  buildTraderAnalyticsReport,
  buildTraderAnalyticsComparison,
  buildTraderAnalyticsDrillDowns,
  buildTraderFocusQueue,
  evaluateTraderRules,
  InMemorySavedTraderAnalyticsRepository,
  previewSavedTradeImport,
} from "../index";
import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";

describe("end-user trader analytics product roadmap helpers", () => {
  it("builds fixture-backed saved reports through the repository boundary", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const reports = sample.repository.listReports(sample.userId);
    const trades = sample.repository.listTrades(sample.userId);

    expect(trades.length).toBeGreaterThan(0);
    expect(reports).toHaveLength(3);
    expect(reports[0]).toMatchObject({
      id: "report-all-sample",
      sampleData: true,
      report: {
        contractVersion: "trader_analytics_report_v1",
      },
    });
    expect(sample.repository.getReport(sample.userId, reports[0].id)).toEqual(
      reports[0],
    );
  });

  it("builds the production analytics view model without export/raw JSON affordances", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const viewModel = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
    });

    expect(viewModel.latestReport.sampleData).toBe(true);
    expect(viewModel.reportHistory.length).toBeGreaterThanOrEqual(2);
    expect(viewModel.productionGuardrails.map((guardrail) => guardrail.id)).toEqual(
      expect.arrayContaining(["no_raw_json_panel", "no_export_control"]),
    );
    expect(viewModel.focusQueue.length).toBeGreaterThan(0);
    expect(viewModel.ruleEvaluations.length).toBeGreaterThan(0);
  });

  it("uses all saved trades for the main analytics dashboard when imports saved one-report-per-trade", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const source = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(source).not.toBeNull();

    const splitReports = source!.sourceSummaries.slice(0, 4).map((summaryRef, index) => {
      const generatedAt = `2026-05-0${index + 1}T20:00:00.000Z`;
      const report = buildTraderAnalyticsReport({
        source: `saved_import:split-${index}`,
        generatedAt,
        inputMode: "execution_feedback_summaries",
        summaries: [
          {
            requestIndex: 0,
            summary: summaryRef.summary,
          },
        ],
        requestCount: 1,
      });

      return {
        ...source!,
        id: `report:split-${index}`,
        generatedAt,
        reportPeriod: {
          startDate: `2026-05-0${index + 1}`,
          endDate: `2026-05-0${index + 1}`,
          label: `Split ${index + 1}`,
        },
        sourceTradeIds: [summaryRef.tradeId],
        sourceSummaries: [{ ...summaryRef, requestIndex: 0 }],
        report,
      };
    });
    const repository = new InMemorySavedTraderAnalyticsRepository({
      trades: sample.trades.slice(0, 4),
      reports: splitReports,
    });
    const viewModel = buildProductTraderAnalyticsViewModel({
      repository,
      userId: sample.userId,
    });

    expect(viewModel.latestReport.id).toBe("report:all-saved-trades");
    expect(viewModel.latestReport.reportPeriod.label).toBe("All saved trades");
    expect(viewModel.latestReport.sourceTradeIds).toHaveLength(4);
    expect(viewModel.latestReport.report.sampleSize.completedTradeCount).toBe(4);
    expect(viewModel.filteredView.totalTradeCount).toBe(4);
  });

  it("filters saved report rows while preserving original sample size visibility", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const filtered = buildFilteredTraderAnalyticsView({
      report: report!,
      filters: {
        outcome: "loser",
      },
    });

    expect(filtered.totalTradeCount).toBe(report!.report.trades.length);
    expect(filtered.filteredTradeCount).toBeGreaterThan(0);
    expect(
      filtered.rows.every((row) => row.grossRealizedPnl < 0),
    ).toBe(true);
  });

  it("builds metric drill-down rows from source summaries instead of UI detection", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const drillDowns = buildTraderAnalyticsDrillDowns(report!);
    const adverseAdds = drillDowns.find(
      (drillDown) =>
        drillDown.sourceMetricId === "size_expansion_after_adverse_price",
    );

    expect(adverseAdds).toBeDefined();
    expect(adverseAdds?.kind).toBe("review_prompt");
    expect(adverseAdds?.rows.length).toBeGreaterThan(0);
    expect(adverseAdds?.tradeIds.length).toBe(adverseAdds?.rows.length);
  });

  it("compares saved reports and builds sample-aware behavior trends", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const latest = sample.repository.getReport(sample.userId, "report-latest-sample");
    const prior = sample.repository.getReport(sample.userId, "report-prior-sample");

    expect(latest).not.toBeNull();
    expect(prior).not.toBeNull();

    const comparison = buildTraderAnalyticsComparison({
      previousReport: prior!,
      currentReport: latest!,
    });

    expect(comparison.metricDeltas.map((delta) => delta.id)).toEqual(
      expect.arrayContaining([
        "gross_total_realized_pnl",
        "gross_win_rate",
        "adverse_add_rate",
        "open_position_rate",
      ]),
    );
    expect(comparison.behaviorDeltas.length).toBeGreaterThan(0);
    expect(
      comparison.behaviorDeltas.every((trend) =>
        ["improving", "worsening", "flat", "insufficient_data"].includes(
          trend.direction,
        ),
      ),
    ).toBe(true);
  });

  it("builds a focus queue and rule evaluations linked to source trades", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const drillDowns = buildTraderAnalyticsDrillDowns(report!);
    const focusQueue = buildTraderFocusQueue({
      report: report!,
      drillDowns,
    });
    const ruleEvaluations = evaluateTraderRules({
      report: report!,
      instances: buildDefaultTraderRuleInstances(sample.userId),
    });

    expect(focusQueue.length).toBeGreaterThan(0);
    expect(focusQueue[0].relatedTradeIds.length).toBeGreaterThan(0);
    expect(ruleEvaluations.length).toBeGreaterThan(0);
    expect(
      ruleEvaluations.some((evaluation) => evaluation.violatedTradeCount > 0),
    ).toBe(true);
  });

  it("builds trade review view models with execution timeline evidence", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const trade = sample.repository.getTrade(sample.userId, "trade-rapid-fire");
    const report = sample.repository.getReport(sample.userId, "report-latest-sample");

    expect(trade).not.toBeNull();
    expect(report).not.toBeNull();

    const view = buildSavedTradeReviewViewModel({
      trade: trade!,
      report,
    });

    expect(view.executionTimeline.length).toBeGreaterThan(1);
    expect(view.reportRow?.tradeId).toBe("trade-rapid-fire");
    expect(view.risks.map((risk) => risk.id)).toContain(
      "rapid_fire_execution_cluster",
    );
  });

  it("previews saved-trade imports without storing or exporting raw data", () => {
    const preview = previewSavedTradeImport(
      invalidExecutionOnlyRequests.requests as UserTradeAnalysisRequest[],
    );

    expect(preview).toMatchObject({
      totalCount: 3,
      acceptedCount: 0,
      rejectedCount: 3,
    });
    expect(preview.items[0].messages.length).toBeGreaterThan(0);
  });

  it("audits production analytics surfaces for no-export guardrails", () => {
    expect(
      auditProductionAnalyticsSurface({
        route: "/intelligence/analytics",
        hasRawJsonPanel: false,
        hasExportControl: false,
        hasDebugCopy: false,
        hasFixtureOnlyDataLabel: true,
      }),
    ).toMatchObject({
      passed: true,
      issues: [],
    });

    expect(
      auditProductionAnalyticsSurface({
        route: "/intelligence/analytics",
        hasRawJsonPanel: true,
        hasExportControl: true,
        hasDebugCopy: true,
        hasFixtureOnlyDataLabel: false,
      }).issues,
    ).toEqual(
      expect.arrayContaining([
        "Production route must not include a raw JSON panel.",
        "Production route must not include export controls.",
      ]),
    );
  });
});
