import { describe, expect, it } from "vitest";
import {
  executeCoachCapability,
  executeCoachIntent,
} from "../../analytics/coach";
import { buildSyntheticQueryFixture } from "../../analytics/query/testing";

describe("GA1-D Coach Trading Intelligence Foundation", () => {
  it("routes the first flexible-question inventory through approved deterministic capabilities", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "rank_negative_performance_drivers",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map((item) => item.capabilityKey)).toEqual([
      "time_window_performance",
      "price_range_performance",
      "ticker_performance",
      "trade_sequence_performance",
      "position_size_performance",
    ]);
    for (const item of result.value) {
      expect(item.authorityStatus).not.toBe("unsupported");
      expect(item.digestReplayIdentity.queryPlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(item.evidenceTradeReferences.length).toBeGreaterThan(0);
      expect(item.metricTables).toHaveLength(1);
    }
  });

  it("uses exact GA1-A daily-path metrics and accepted session facts without creating a second calculator", () => {
    const fixture = buildSyntheticQueryFixture(20);
    const result = executeCoachCapability({
      intentKey: "profit_giveback_analysis",
      capabilityKey: "profit_giveback_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const metrics = result.value.metricTables[0].rows[0].metrics;
    expect(metrics.find((metric) => metric.metricKey === "maximum_intraday_drawdown")?.kind).toBe("exact_decimal");
    expect(metrics.find((metric) => metric.metricKey === "maximum_peak_profit_giveback")?.kind).toBe("exact_decimal");
    expect(result.value.primaryFinding?.ruleCandidateKey).toBe("stop_after_profit_giveback");

    const session = executeCoachIntent({
      intentKey: "session_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(session).toMatchObject({ ok: true });
    if (!session.ok) return;
    expect(session.value[0].metricTables[0].rows.map((row) => row.groupIdentity)).toEqual(
      expect.arrayContaining(["session:not_applicable"]),
    );
  });

  it("maps rule candidates to GA1-C presets as rules to test, never claimed improvements", () => {
    const fixture = buildSyntheticQueryFixture(30);
    const result = executeCoachIntent({
      intentKey: "rule_candidate_ranking",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const candidates = result.value.flatMap((item) => item.rankedFindingList)
      .filter((finding) => finding.ruleCandidateStatus === "rule_to_test");
    expect(candidates.map((finding) => finding.ruleCandidateKey)).toEqual(
      expect.arrayContaining([
        "stop_after_consecutive_losses",
        "wait_after_loss",
        "stop_after_profit_giveback",
        "skip_repeat_attempts",
      ]),
    );
  });

  it("returns an explicit unsupported-data result for tag capabilities instead of inventing a tag", () => {
    const fixture = buildSyntheticQueryFixture(10);
    const result = executeCoachIntent({
      intentKey: "setup_tag_performance",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      unsupportedData: { code: "setup_tags_required" },
      metricTables: [],
    });
  });

  it("returns a trend finding only from the verified current-versus-prior comparison", () => {
    const fixture = buildSyntheticQueryFixture(28);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
      filters: [{ kind: "date_range", startDate: "2026-07-04", endDate: "2026-07-07" }],
      baselineFilters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const coach = result.value[0];
    expect(coach).toMatchObject({
      capabilityKey: "habit_trend_analysis",
      comparisonType: "current_period_vs_prior_period",
      primaryFinding: { findingCode: "period_trend" },
    });
    expect(coach.comparison?.comparisonDigest).toMatch(/^ti_v3:trade_query_comparison:v1:sha256:/);
    expect(coach.digestReplayIdentity.comparisonDigest).toBe(coach.comparison?.comparisonDigest);
    expect(coach.metricTables).toHaveLength(2);
  });

  it("does not fabricate a trend when no verified prior-period request is supplied", () => {
    const fixture = buildSyntheticQueryFixture(10);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      authorityStatus: "unsupported",
      primaryFinding: null,
      comparison: null,
      unsupportedData: { code: "period_comparison_required" },
    });
  });

  it("withholds a trend finding when either verified period is below the minimum sample", () => {
    const fixture = buildSyntheticQueryFixture(5);
    const result = executeCoachIntent({
      intentKey: "habit_trend_analysis",
      source: fixture.source,
      partitionReceipt: fixture.partition,
      filters: [{ kind: "date_range", startDate: "2026-07-05", endDate: "2026-07-05" }],
      baselineFilters: [{ kind: "date_range", startDate: "2026-07-01", endDate: "2026-07-03" }],
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      comparison: { comparisonKey: "ti_v3_exact_trade_query_comparison" },
      primaryFinding: null,
      rankedFindingList: [],
      sampleSizeStatus: "insufficient_sample_size",
      unsupportedData: { code: "insufficient_sample_size" },
    });
  });
});
