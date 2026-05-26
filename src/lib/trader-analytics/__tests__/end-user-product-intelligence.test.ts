import { describe, expect, it } from "vitest";
import type { BrokerCsvMappingLearningSignal } from "../index";
import {
  TRADER_MISTAKE_TAXONOMY,
  buildBehaviorRecurrenceAlerts,
  buildBrokerImportFingerprintLibrary,
  buildMarketContextReadinessGate,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildTraderMistakeCostEstimates,
  buildTraderMistakeTaxonomySummary,
  buildTraderRuleBuilderRecommendations,
  buildTraderScorecard,
  buildUnifiedReviewQueue,
} from "../index";

describe("end-user product intelligence helpers", () => {
  it("builds a stable execution-only mistake taxonomy from saved reports", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(report).not.toBeNull();

    const taxonomy = buildTraderMistakeTaxonomySummary(report!);

    expect(TRADER_MISTAKE_TAXONOMY.length).toBeGreaterThanOrEqual(16);
    expect(taxonomy.taxonomy.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "scaled_loser",
        "add_after_adverse_move",
        "poor_first_reduction",
        "left_open_position",
        "inconsistent_sizing",
      ]),
    );
    expect(taxonomy.observations.length).toBeGreaterThan(0);
    expect(
      taxonomy.observations.some(
        (observation) =>
          observation.taxonomyId === "scaled_loser" &&
          observation.tradeIds.length > 0 &&
          observation.suggestedReviewAction.length > 0,
      ),
    ).toBe(true);
  });

  it("builds bounded scorecards and directional trends without market context", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const currentReport = sample.repository.getReport(
      sample.userId,
      "report-all-sample",
    );
    const previousReport = sample.repository.getReport(
      sample.userId,
      "report-prior-sample",
    );

    expect(currentReport).not.toBeNull();
    expect(previousReport).not.toBeNull();

    const scorecard = buildTraderScorecard({
      currentReport: currentReport!,
      previousReport,
    });

    expect(scorecard.source).toBe("execution_only");
    expect(scorecard.dimensions.map((dimension) => dimension.id)).toEqual(
      expect.arrayContaining(["discipline", "exit_quality", "overall"]),
    );
    expect(
      scorecard.dimensions.every(
        (dimension) => dimension.score >= 0 && dimension.score <= 100,
      ),
    ).toBe(true);
    expect(scorecard.trends).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "overall",
          previousScore: expect.any(Number),
          currentScore: expect.any(Number),
        }),
      ]),
    );
  });

  it("estimates mistake cost and recommends personal rule builder actions", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const taxonomy = buildTraderMistakeTaxonomySummary(analytics.latestReport);
    const costEstimates = buildTraderMistakeCostEstimates({
      report: analytics.latestReport,
      taxonomySummary: taxonomy,
    });
    const alerts = buildBehaviorRecurrenceAlerts({
      report: analytics.latestReport,
      taxonomySummary: taxonomy,
      ruleEvaluations: analytics.ruleEvaluations,
    });
    const recommendations = buildTraderRuleBuilderRecommendations({
      focusQueue: analytics.focusQueue,
      ruleEvaluations: analytics.ruleEvaluations,
      costEstimates,
      recurrenceAlerts: alerts,
    });

    expect(costEstimates.source).toBe("execution_only");
    expect(costEstimates.totalEstimatedGrossCost).toBeGreaterThanOrEqual(0);
    expect(
      costEstimates.items.every((item) => item.estimatedGrossCost >= 0),
    ).toBe(true);
    expect(costEstimates.limitation).toContain("execution-only");
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].relatedTradeIds.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].relatedTradeIds.length).toBeGreaterThan(0);
  });

  it("uses repair-first rule language for adverse-add cost drivers", () => {
    const recommendations = buildTraderRuleBuilderRecommendations({
      focusQueue: [],
      ruleEvaluations: [],
      recurrenceAlerts: [],
      costEstimates: {
        source: "execution_only",
        totalEstimatedGrossCost: 120,
        limitation: "execution-only test fixture",
        items: [],
        topCostDriver: {
          taxonomyId: "add_after_adverse_move",
          label: "Adds after price moved against you",
          affectedTradeCount: 2,
          relatedTradeIds: ["trade-1", "trade-2"],
          estimatedGrossCost: 120,
          averageCostPerAffectedTrade: 60,
          confidence: "medium",
          calculationNote: "fixture",
        },
      },
    });

    expect(recommendations[0]).toMatchObject({
      suggestedRuleTitle: "Require repair before adding size",
      suggestedTemplateId: "no_adverse_price_adds",
    });
    expect(recommendations[0]?.suggestedRuleTitle.toLowerCase()).not.toMatch(
      /avoid|no adds/,
    );
  });

  it("does not let review-prompt behaviors drive cost, recurrence, or rule recommendations", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const promptOnlyIds = new Set([
      "chased_entry",
      "revenge_reentry_cluster",
      "early_winner_exit",
      "partialed_without_plan",
      "repeated_rule_violation",
      "scaled_loser",
      "add_after_adverse_move",
    ]);
    const primaryProductText = [
      ...analytics.productIntelligence.mistakeCostEstimates.items.flatMap(
        (item) => [item.label, item.calculationNote],
      ),
      ...analytics.productIntelligence.recurrenceAlerts.flatMap((alert) => [
        alert.title,
        alert.detail,
        alert.nextAction,
      ]),
      ...analytics.productIntelligence.ruleBuilderRecommendations.flatMap(
        (recommendation) => [
          recommendation.suggestedRuleTitle,
          recommendation.label,
          recommendation.reason,
          recommendation.expectedSuccessMetric,
        ],
      ),
    ].join("\n");

    expect(
      analytics.productIntelligence.mistakeCostEstimates.items.some((item) =>
        promptOnlyIds.has(item.taxonomyId),
      ),
    ).toBe(false);
    expect(
      analytics.productIntelligence.recurrenceAlerts.some((alert) =>
        [...promptOnlyIds].some((id) => alert.id.includes(id)),
      ),
    ).toBe(false);
    expect(primaryProductText).not.toMatch(/added after failed premise/i);
    expect(primaryProductText).not.toMatch(/\bpremise\b/i);
    expect(primaryProductText).not.toMatch(/revenge-like/i);
    expect(primaryProductText).not.toMatch(/chased entry/i);
    expect(primaryProductText).not.toMatch(/early winner exit/i);
  });

  it("builds a unified review queue and market-context readiness gate", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const readiness = buildMarketContextReadinessGate({
      trades: sample.trades,
      report: analytics.latestReport,
      badges: analytics.productization.analysisConfidenceBadges,
      calibrationQueue: analytics.productization.marketContextCalibrationQueue,
    });
    const queue = buildUnifiedReviewQueue({
      focusQueue: analytics.focusQueue,
      reviewWorkflow: analytics.productization.reviewWorkflow,
      recurrenceAlerts: analytics.productIntelligence.recurrenceAlerts,
      costEstimates: analytics.productIntelligence.mistakeCostEstimates,
      marketContextReadiness: readiness,
    });

    expect(readiness.executionReadyCount).toBeGreaterThan(0);
    expect(readiness.calibratedCount).toBe(0);
    expect(readiness.items.every((item) => item.usedForScoring === false)).toBe(
      true,
    );
    expect(queue.totalCount).toBeGreaterThan(0);
    expect(queue.items.map((item) => item.priority)).toEqual(
      [...queue.items.map((item) => item.priority)].sort((left, right) => left - right),
    );
    expect(queue.byLane.behavior).toBeGreaterThan(0);
  });

  it("exposes product intelligence on the production analytics view model", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });

    expect(analytics.productIntelligence.scorecard.source).toBe(
      "execution_only",
    );
    expect(
      analytics.productIntelligence.marketContextReadiness.items.every(
        (item) => item.usedForScoring === false,
      ),
    ).toBe(true);
    expect(
      analytics.productIntelligence.unifiedReviewQueue.totalCount,
    ).toBeGreaterThan(0);
  });

  it("builds a broker import fingerprint library from mapping learning signals", () => {
    const signals: BrokerCsvMappingLearningSignal[] = [
      {
        shouldCapture: true,
        reason: "Generic mapping should be reviewed.",
        broker: "generic_execution_csv",
        confidenceLevel: "low",
        confidenceScore: 45,
        headerFingerprint: "broker_csv_headers_v1:a|b|c",
        headers: ["A", "B", "C"],
        detectedFields: ["symbol"],
        missingRequiredFields: ["timestamp"],
        issueCodes: ["missing_required_column"],
      },
      {
        shouldCapture: true,
        reason: "Same mapping seen again.",
        broker: "generic_execution_csv",
        confidenceLevel: "medium",
        confidenceScore: 70,
        headerFingerprint: "broker_csv_headers_v1:a|b|c",
        headers: ["A", "B", "C"],
        detectedFields: ["price"],
        missingRequiredFields: [],
        issueCodes: [],
      },
    ];

    const library = buildBrokerImportFingerprintLibrary({
      signals,
      seenAt: "2026-05-03T12:00:00.000Z",
    });

    expect(library.totalCount).toBe(1);
    expect(library.needsReviewCount).toBe(1);
    expect(library.entries[0]).toMatchObject({
      sampleCount: 2,
      promotedStatus: "needs_mapping_review",
    });
    expect(library.entries[0].detectedFields).toEqual(
      expect.arrayContaining(["symbol", "price"]),
    );
  });
});
