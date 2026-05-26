import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  compareTradeAnalysisDebugDashboards,
  formatTradeAnalysisDebugDashboardComparisonMarkdown,
} from "../debug/compare-trade-analysis-debug-dashboards";
import {
  buildTradeAnalysisDebugDashboard,
  type TradeAnalysisDebugDashboard,
} from "../debug/trade-analysis-debug-dashboard";

function buildSampleRequest() {
  return {
    symbol: sampleCreateRawTradeTimelineInput.symbol,
    tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
    executions: sampleCreateRawTradeTimelineInput.executions,
    sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
    provider: {
      preferredProvider: "stub",
    },
    tradeWindow: {
      timeframe: "1m",
      preTradeMinutes: 60,
      postTradeMinutes: 60,
    },
  };
}

function cloneDashboard(
  dashboard: TradeAnalysisDebugDashboard,
): TradeAnalysisDebugDashboard {
  return structuredClone(dashboard) as TradeAnalysisDebugDashboard;
}

describe("compareTradeAnalysisDebugDashboards", () => {
  it("reports unchanged dashboard runs", async () => {
    const dashboard = await buildTradeAnalysisDebugDashboard({
      source: "left",
      requests: [buildSampleRequest()],
      validateOnly: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });
    const comparison = compareTradeAnalysisDebugDashboards({
      left: dashboard,
      right: cloneDashboard(dashboard),
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(comparison).toMatchObject({
      contractVersion: "trade_analysis_debug_dashboard_comparison_v1",
      itemCounts: {
        added: 0,
        removed: 0,
        changed: 0,
        unchanged: 1,
      },
      totalsDelta: {
        requestCount: 0,
        completedCount: 0,
        failedCount: 0,
      },
    });
  });

  it("reports support/resistance, market-structure, and pattern changes", async () => {
    const left = await buildTradeAnalysisDebugDashboard({
      source: "left",
      requests: [buildSampleRequest()],
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-02T00:00:00.000Z",
    });
    const right = cloneDashboard(left);

    right.source = "right";
    right.items[0].summary!.supportResistance.supportCount += 1;
    right.items[0].summary!.marketStructure.state = "trend_transition";
    right.items[0].summary!.patterns.topAnchorPattern = {
      patternId: "synthetic_changed_anchor",
      patternName: "Synthetic Changed Anchor",
      family: "test",
      role: "primary_candidate",
    };

    const comparison = compareTradeAnalysisDebugDashboards({
      left,
      right,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });
    const markdown =
      formatTradeAnalysisDebugDashboardComparisonMarkdown(comparison);

    expect(comparison.itemCounts.changed).toBe(1);
    expect(comparison.items[0]).toMatchObject({
      requestIndex: 0,
      changeType: "changed",
      changedFields: [
        "supportResistance.counts",
        "marketStructure",
        "patterns.topAnchorPattern",
      ],
    });
    expect(markdown).toContain("# Trade Analysis Debug Dashboard Comparison");
    expect(markdown).toContain("synthetic_changed_anchor");
  });
});
