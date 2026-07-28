import { createServerExecutionAnalyticsAdapter } from "../../adapters";
import { buildSyntheticQueryFixture } from "../../query/testing";
import {
  buildDashboardAttributionPacket,
  buildDashboardDistributionPacket,
  buildDashboardEvidencePagePacket,
  buildDashboardFindingsPacket,
  buildDashboardPeriodAttributionPacket,
  buildDashboardQueryPacket,
  type DashboardAttributionPacket,
  type DashboardDistributionPacket,
  type DashboardEvidencePagePacket,
  type DashboardFindingsPacket,
  type DashboardPeriodAttributionPacket,
  type DashboardQueryPacket,
} from "../execution-analytics-dashboard-packets";

export interface ExecutionAnalyticsDashboardFixture {
  readonly overview: DashboardQueryPacket;
  readonly periodSeries: DashboardQueryPacket;
  readonly evidencePage: DashboardEvidencePagePacket;
  readonly distribution: DashboardDistributionPacket;
  readonly attribution: DashboardAttributionPacket;
  readonly periodAttribution: DashboardPeriodAttributionPacket;
  readonly findings: DashboardFindingsPacket;
}

function result<T>(input: { readonly ok: true; readonly value: T } | Readonly<{
  readonly ok: false; readonly error: Readonly<{ readonly code: string; readonly path: string }>;
}>): T {
  if (!input.ok) throw new Error(`${input.error.code}:${input.error.path}`);
  return input.value;
}

/**
 * Stable, bounded packets for dashboard rendering tests. The fixture reaches
 * the engine only through the server adapter and never exposes execution rows.
 */
export function buildExecutionAnalyticsDashboardFixture(): ExecutionAnalyticsDashboardFixture {
  const fixture = buildSyntheticQueryFixture(14);
  const adapter = createServerExecutionAnalyticsAdapter(fixture.source);
  const overviewPlan = fixture.plan();
  const dayPlan = fixture.plan({ grouping: { kind: "day" } });
  const directionPlan = fixture.plan({ grouping: { kind: "direction" } });
  const overview = result(adapter.getOverview("USD", overviewPlan));
  const periodSeries = result(adapter.getPerformanceSeries("USD", dayPlan));
  const evidencePage = result(adapter.getEvidencePage("USD", dayPlan, { pageSize: "2" }));
  const distribution = result(adapter.getDistribution("USD", overviewPlan, {
    measure: "net_pnl",
    bucketBoundaries: ["-1", "1", "3"],
  }));
  const attribution = result(adapter.getAttribution("USD", directionPlan));
  const periodAttribution = result(adapter.getPeriodAttribution(
    "USD",
    fixture.plan({
      filters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
      grouping: { kind: "direction" },
    }),
    fixture.plan({
      filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }],
      grouping: { kind: "direction" },
    }),
  ));
  const findings = result(adapter.getFindings("USD", directionPlan, "direction", "2"));
  return Object.freeze({
    overview: buildDashboardQueryPacket(overview),
    periodSeries: buildDashboardQueryPacket(periodSeries),
    evidencePage: buildDashboardEvidencePagePacket(
      evidencePage,
      "USD",
      periodSeries.limitationCodes,
    ),
    distribution: buildDashboardDistributionPacket(distribution),
    attribution: buildDashboardAttributionPacket(attribution, "USD"),
    periodAttribution: buildDashboardPeriodAttributionPacket(periodAttribution, "USD"),
    findings: buildDashboardFindingsPacket(findings, "USD"),
  });
}
