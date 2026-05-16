import { describe, expect, it } from "vitest";
import { decisionReviewCsvScenarios } from "../__fixtures__/decision-review-csv-scenarios";
import {
  buildDecisionReviewQualityDashboard,
  formatDecisionReviewQualityDashboardMarkdown,
} from "../server/build-decision-review-quality-dashboard";

describe("decision review quality dashboard", () => {
  it("passes deterministic decision-review scenarios with graded daily/4h level evidence", async () => {
    const dashboard = await buildDecisionReviewQualityDashboard({
      scenarios: decisionReviewCsvScenarios,
      generatedAt: "2026-05-05T12:00:00.000Z",
    });
    const markdown = formatDecisionReviewQualityDashboardMarkdown(dashboard);

    expect(dashboard).toMatchObject({
      contractVersion: "decision_review_quality_dashboard_v1",
      status: "pass",
      realCsvCalibrationStatus: "waiting_for_anonymized_real_csvs",
      scenarioCount: decisionReviewCsvScenarios.length,
      failCount: 0,
    });
    expect(
      dashboard.scenarios.every(
        (scenario) =>
          scenario.actualMarketContextSource ===
          scenario.expectedMarketContextSource,
      ),
    ).toBe(true);
    expect(
      dashboard.scenarios.every(
        (scenario) => scenario.contradictoryInsightPairsFound.length === 0,
      ),
    ).toBe(true);
    expect(
      dashboard.scenarios.every(
        (scenario) => scenario.genericHeadlineFragmentsFound.length === 0,
      ),
    ).toBe(true);
    expect(
      dashboard.scenarios.every(
        (scenario) => scenario.staleHeadlineFragmentsFound.length === 0,
      ),
    ).toBe(true);
    expect(
      dashboard.scenarios.every(
        (scenario) => scenario.missingRequiredHeadlineFragments.length === 0,
      ),
    ).toBe(true);
    expect(
      dashboard.scenarios.find(
        (scenario) =>
          scenario.id === "entry_near_major_resistance_limited_room",
      )?.coachingHeadline,
    ).toContain(
      "major daily/4h resistance with limited room before overhead resistance",
    );
    expect(
      dashboard.scenarios.find(
        (scenario) => scenario.id === "failed_entry_near_major_resistance",
      )?.coachingHeadline,
    ).toContain(
      "major daily/4h resistance with limited room before overhead resistance",
    );
    expect(
      dashboard.scenarios.find(
        (scenario) => scenario.id === "major_resistance_limited_room_late_add",
      )?.coachingHeadline,
    ).toContain(
      "major daily/4h resistance, the trade had limited room before overhead resistance, and later adds increased size after much of the move was already used",
    );
    expect(
      dashboard.scenarios.find(
        (scenario) => scenario.id === "entry_near_support_premature_exit",
      )?.actualInsightIds,
    ).not.toContain("entry_far_from_daily_4h_support");
    const shortScenario = dashboard.scenarios.find(
      (scenario) => scenario.id === "short_completed_trade_smoke",
    );
    expect(shortScenario?.actualInsightIds).toContain(
      "short_entry_had_room_to_support",
    );
    expect(shortScenario?.actualInsightIds).not.toContain(
      "entry_far_from_daily_4h_support",
    );
    expect(shortScenario?.actualInsightIds).not.toContain(
      "breakout_had_room_above",
    );
    expect(shortScenario?.forbiddenTextFragmentsFound).toEqual([]);
    const repeatedAddsScenario = dashboard.scenarios.find(
      (scenario) => scenario.id === "repeated_adds_after_extension",
    );
    expect(repeatedAddsScenario).toMatchObject({
      actualMarketContextSource: "none",
      missingInsightIds: [],
    });
    expect(repeatedAddsScenario?.actualInsightIds).toEqual([
      "market_context_unavailable",
      "trade_window_excursion_measured",
    ]);
    const openPositionScenario = dashboard.scenarios.find(
      (scenario) => scenario.id === "open_position_skipped",
    );
    expect(openPositionScenario).toMatchObject({
      actualImportStatus: "needs_review",
      expectedCompletedReviewCount: 0,
      actualCompletedReviewCount: 0,
      actualInsightIds: [],
      missingExpectedDiagnosticCodes: [],
    });
    expect(openPositionScenario?.diagnostics.join("\n")).toContain(
      "skipped for completed-trade decision review",
    );
    expect(markdown).toContain("major daily/4h resistance");
    expect(markdown).toContain("Open position skipped with diagnostic");
    expect(markdown).toContain("completed reviews: 0/0");
    expect(markdown).not.toContain(
      "did not produce a strong enough destructive behavior signal",
    );
    expect(markdown).not.toContain(
      "Adds were aligned with strength rather than weakness",
    );
    expect(markdown).toContain(
      "Synthetic decision-review scenarios pass; next collect anonymized real CSV examples before promoting this beyond dry-run.",
    );
  }, 30_000);

  it("fails when an expected insight is missing", async () => {
    const scenario = {
      ...decisionReviewCsvScenarios[0],
      expectedInsightIds: ["not_a_real_decision_review_insight"],
    };
    const dashboard = await buildDecisionReviewQualityDashboard({
      scenarios: [scenario],
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    expect(dashboard.status).toBe("fail");
    expect(dashboard.failCount).toBe(1);
    expect(dashboard.scenarios[0]?.missingInsightIds).toEqual([
      "not_a_real_decision_review_insight",
    ]);
  }, 15_000);

  it("fails if forbidden VWAP or EMA wording leaks into review output", async () => {
    const scenario = {
      ...decisionReviewCsvScenarios[0],
      forbiddenTextFragments: ["profit"],
    };
    const dashboard = await buildDecisionReviewQualityDashboard({
      scenarios: [scenario],
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    expect(dashboard.status).toBe("fail");
    expect(dashboard.scenarios[0]?.forbiddenTextFragmentsFound).toEqual([
      "profit",
    ]);
  }, 15_000);
});
