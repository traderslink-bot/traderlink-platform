import { describe, expect, it } from "vitest";

import {
  buildDashboardAttributionPacket,
  buildDashboardDistributionChartViewModel,
  buildDashboardDistributionPacket,
  buildDashboardEvidencePagePacket,
  buildDashboardEvidenceViewModel,
  buildDashboardFindingsPacket,
  buildDashboardLimitationViewModel,
  buildDashboardPeriodAttributionPacket,
  buildDashboardQueryPacket,
  buildDashboardTableViewModel,
  buildExecutionAnalyticsDashboardFixture,
  buildSyntheticQueryFixture,
  createServerExecutionAnalyticsAdapter,
} from "../analytics";

describe("execution analytics dashboard contract", () => {
  it("projects every governed M3 operation into bounded, identity-bound dashboard packets", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const adapter = createServerExecutionAnalyticsAdapter(fixture.source);
    const dayPlan = fixture.plan({ grouping: { kind: "day" } });
    const directionPlan = fixture.plan({ grouping: { kind: "direction" } });

    const series = adapter.getPerformanceSeries("USD", dayPlan);
    expect(series, JSON.stringify(series)).toMatchObject({ ok: true });
    if (!series.ok) return;
    const queryPacket = buildDashboardQueryPacket(series.value);
    expect(queryPacket).toMatchObject({
      kind: "query",
      currency: "USD",
      queryPlanDigest: series.value.normalizedQueryPlan.queryPlanDigest,
      resultDigest: series.value.resultDigest,
    });
    expect(JSON.stringify(queryPacket)).not.toMatch(/executionDigests|occurrenceKeys|excludedCandidateKeys/);

    const table = buildDashboardTableViewModel(queryPacket);
    expect(table.rows).toHaveLength(7);
    expect(table.rows[0].metrics).toContainEqual(expect.objectContaining({
      metricKey: "net_pnl",
      displayValue: expect.stringMatching(/^USD /),
      availability: "available",
    }));
    expect(buildDashboardLimitationViewModel(queryPacket)).toEqual({
      codes: queryPacket.limitationCodes,
      hasLimitations: queryPacket.limitationCodes.length > 0,
    });

    const page = adapter.getEvidencePage("USD", dayPlan, { pageSize: "2" });
    expect(page, JSON.stringify(page)).toMatchObject({ ok: true });
    if (!page.ok) return;
    const pagePacket = buildDashboardEvidencePagePacket(page.value, "USD", series.value.limitationCodes);
    expect(pagePacket).toMatchObject({ kind: "evidence_page", pageSize: "2", offset: "0" });
    const evidence = buildDashboardEvidenceViewModel(pagePacket, pagePacket.rows[0].evidenceDigest);
    expect(evidence).toMatchObject({ evidenceDigest: pagePacket.rows[0].evidenceDigest });
    expect(JSON.stringify(evidence)).not.toMatch(/executionDigests|occurrenceKeys/);

    const distribution = adapter.getDistribution("USD", dayPlan, {
      measure: "net_pnl",
      bucketBoundaries: ["-1", "1", "3"],
    });
    expect(distribution, JSON.stringify(distribution)).toMatchObject({ ok: true });
    if (!distribution.ok) return;
    const distributionPacket = buildDashboardDistributionPacket(distribution.value);
    expect(distributionPacket.packetDigest).toMatch(/^ti_v3:execution_analytics_dashboard_distribution_packet:v1:sha256:/);
    expect(buildDashboardDistributionChartViewModel(distributionPacket).buckets.map((bucket) => bucket.label))
      .toEqual(["< -1", "-1 to < 1", "1 to < 3", "≥ 3"]);

    const attribution = adapter.getAttribution("USD", directionPlan);
    expect(attribution, JSON.stringify(attribution)).toMatchObject({ ok: true });
    if (!attribution.ok) return;
    const attributionPacket = buildDashboardAttributionPacket(attribution.value, "USD");
    expect(attributionPacket.segments).toHaveLength(2);

    const periodAttribution = adapter.getPeriodAttribution(
      "USD",
      fixture.plan({
        filters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
        grouping: { kind: "direction" },
      }),
      fixture.plan({
        filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }],
        grouping: { kind: "direction" },
      }),
    );
    expect(periodAttribution, JSON.stringify(periodAttribution)).toMatchObject({ ok: true });
    if (!periodAttribution.ok) return;
    expect(buildDashboardPeriodAttributionPacket(periodAttribution.value, "USD").reconciliationDifference)
      .toMatchObject({ numerator: "0", denominator: "1" });

    const findings = adapter.getFindings("USD", directionPlan, "direction", "2");
    expect(findings, JSON.stringify(findings)).toMatchObject({ ok: true });
    if (!findings.ok) return;
    const findingsPacket = buildDashboardFindingsPacket(findings.value, "USD");
    expect(findingsPacket.findings).toHaveLength(2);
    expect(findingsPacket.packetDigest).toMatch(/^ti_v3:execution_analytics_dashboard_findings_packet:v1:sha256:/);
  });

  it("keeps invalid dashboard-operation inputs behind the same narrow server failure", () => {
    const fixture = buildSyntheticQueryFixture();
    const adapter = createServerExecutionAnalyticsAdapter(fixture.source);

    expect(adapter.getDistribution("USD", fixture.plan(), {
      measure: "net_pnl", bucketBoundaries: ["0", "0"],
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_server_analytics_query_invalid", path: "$.distribution" },
    });
    expect(adapter.getEvidencePage("USD", fixture.plan(), { pageSize: "0" })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_server_analytics_query_invalid", path: "$.pagination" },
    });
  });

  it("provides a bounded fixture that dashboard work can render without query internals", () => {
    const fixture = buildExecutionAnalyticsDashboardFixture();

    expect(fixture.overview.kind).toBe("query");
    expect(fixture.periodSeries.rows).toHaveLength(7);
    expect(fixture.evidencePage.rows).toHaveLength(2);
    expect(fixture.distribution.kind).toBe("distribution");
    expect(fixture.attribution.kind).toBe("attribution");
    expect(fixture.periodAttribution.kind).toBe("period_attribution");
    expect(fixture.findings.kind).toBe("findings");
    expect(JSON.stringify(fixture)).not.toMatch(/executionDigests|occurrenceKeys|rawCsv|sqlite/i);
  });
});
