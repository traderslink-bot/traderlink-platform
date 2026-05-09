import { describe, expect, it } from "vitest";
import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildSampleTradeReplay,
  buildTradeExecutionAutopsy,
  buildTradeQualityScorecard,
  buildTraderImprovementIntelligence,
} from "../index";

describe("trader improvement intelligence", () => {
  it("classifies replay roles and position progress for long and short trades", () => {
    const longReplay = buildSampleTradeReplay("trade-rapid-fire");
    const shortReplay = buildSampleTradeReplay("trade-short-winner");

    expect(longReplay).not.toBeNull();
    expect(shortReplay).not.toBeNull();
    expect(longReplay!.replay.steps[0]).toMatchObject({
      role: "initial_entry",
      positionBeforeExecution: 0,
      marker: "Initial entry",
    });
    expect(
      longReplay!.replay.steps.some((step) => step.riskDirection === "increased"),
    ).toBe(true);
    expect(
      longReplay!.replay.steps.every(
        (step) => step.positionPctOfMax >= 0 && step.positionPctOfMax <= 1,
      ),
    ).toBe(true);
    expect(
      shortReplay!.replay.steps.some((step) => step.role === "full_exit"),
    ).toBe(true);
  });

  it("tracks average price and realized P/L progress on reductions", () => {
    const partialReplay = buildSampleTradeReplay("trade-partial-exits");

    expect(partialReplay).not.toBeNull();

    const reductionSteps = partialReplay!.replay.steps.filter(
      (step) => step.riskDirection === "reduced" || step.riskDirection === "closed",
    );

    expect(reductionSteps.length).toBeGreaterThan(0);
    expect(
      partialReplay!.replay.steps.some((step) => step.averageOpenPrice !== null),
    ).toBe(true);
    expect(
      reductionSteps.every((step) => step.realizedPnlProgress !== null),
    ).toBe(true);
  });

  it("builds bounded trade quality scorecards and autopsies", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const report = sample.repository.getReport(sample.userId, "report-all-sample");
    const trade = sample.repository.getTrade(sample.userId, "trade-rapid-fire");

    expect(report).not.toBeNull();
    expect(trade).not.toBeNull();

    const quality = buildTradeQualityScorecard({
      trade: trade!,
      report: report!,
    });
    const autopsy = buildTradeExecutionAutopsy({
      trade: trade!,
      report: report!,
    });

    expect(quality.source).toBe("execution_only");
    expect(quality.marketContextUsedForScoring).toBe(false);
    expect(quality.overallScore).toBeGreaterThanOrEqual(0);
    expect(quality.overallScore).toBeLessThanOrEqual(100);
    expect(
      quality.dimensions.every(
        (dimension) => dimension.score >= 0 && dimension.score <= 100,
      ),
    ).toBe(true);
    expect(autopsy.marketContextUsedForConclusions).toBe(false);
    expect(autopsy.decisions.length).toBe(trade!.request.executions.length);
  });

  it("adds coach reports, playbook buckets, visuals, and best/worst patterns to the product view model", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const improvement = analytics.improvementIntelligence;

    expect(improvement.source).toBe("execution_only");
    expect(improvement.tradeQualityScorecards.length).toBe(
      analytics.latestReport.sourceTradeIds.length,
    );
    expect(improvement.dailyCoachReport.tradeCount).toBeGreaterThan(0);
    expect(improvement.dailyCoachReport.marketContextUsedForConclusions).toBe(
      false,
    );
    expect(improvement.playbookBuckets.length).toBeGreaterThanOrEqual(5);
    expect(improvement.playbookAssignments.length).toBe(
      analytics.latestReport.sourceTradeIds.length,
    );
    expect(improvement.visuals.qualityByTrade.items.length).toBeGreaterThan(0);
    expect(improvement.visuals.ruleViolationFrequency.items.length).toBe(
      analytics.ruleEvaluations.length,
    );
    expect(improvement.bestWorstPatterns.reportId).toBe(
      analytics.latestReport.id,
    );
    expect(improvement.bestWorstPatterns.mostRepeatedMistake).not.toBeNull();
  });

  it("maps expanded mistake observations and rule recommendations to actions", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });

    expect(
      analytics.improvementIntelligence.mistakeObservations.some(
        (observation) =>
          observation.taxonomyId === "add_after_adverse_move" ||
          observation.taxonomyId === "repeated_rule_violation",
      ),
    ).toBe(true);
    expect(
      analytics.improvementIntelligence.mistakeObservations.every(
        (observation) =>
          observation.reason.length > 0 &&
          observation.suggestedReviewAction.length > 0,
      ),
    ).toBe(true);
    expect(
      analytics.productIntelligence.ruleBuilderRecommendations.every(
        (recommendation) =>
          recommendation.suggestedRuleTitle.length > 0 &&
          recommendation.expectedSuccessMetric.length > 0,
      ),
    ).toBe(true);
  });

  it("does not let market-context readiness alter execution-only quality scoring", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const baselineScores =
      analytics.improvementIntelligence.tradeQualityScorecards.map((scorecard) => ({
        tradeId: scorecard.tradeId,
        overallScore: scorecard.overallScore,
      })).sort((left, right) => left.tradeId.localeCompare(right.tradeId));
    const forcedMarketContext = {
      ...analytics.productIntelligence,
      marketContextReadiness: {
        ...analytics.productIntelligence.marketContextReadiness,
        calibratedCount:
          analytics.productIntelligence.marketContextReadiness.totalCount,
        items: analytics.productIntelligence.marketContextReadiness.items.map(
          (item) => ({
            ...item,
            calibratedMarketContextStatus: "ready" as const,
            usedForScoring: true,
          }),
        ),
      },
    };
    const rebuilt = buildTraderImprovementIntelligence({
      report: analytics.latestReport,
      trades: sample.trades,
      ruleEvaluations: analytics.ruleEvaluations,
      productIntelligence: forcedMarketContext,
    });

    expect(
      rebuilt.tradeQualityScorecards.map((scorecard) => ({
        tradeId: scorecard.tradeId,
        overallScore: scorecard.overallScore,
      })).sort((left, right) => left.tradeId.localeCompare(right.tradeId)),
    ).toEqual(baselineScores);
    expect(
      rebuilt.tradeQualityScorecards.every(
        (scorecard) => scorecard.marketContextUsedForScoring === false,
      ),
    ).toBe(true);
  });
});
