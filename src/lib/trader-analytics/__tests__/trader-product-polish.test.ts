import { describe, expect, it } from "vitest";
import {
  buildCoachReviewQueue,
  buildConfidenceCalibration,
  buildExecutionQualityTrendline,
  buildFirstImportExperience,
  buildPersonalPatternMemory,
  buildProductEvidenceCards,
  buildProductTraderAnalyticsViewModel,
  buildRuleCandidateLab,
  buildSampleSavedTraderAnalyticsData,
  buildSessionRecapViewModel,
  buildTradeGradeExplainability,
  buildTradeRepairInbox,
  buildTraderProductPolishViewModel,
} from "../index";

function buildAnalytics() {
  const sample = buildSampleSavedTraderAnalyticsData();

  return {
    sample,
    analytics: buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    }),
  };
}

describe("trader product polish", () => {
  it("builds evidence cards with traceable actions and no market-context conclusions", () => {
    const { analytics } = buildAnalytics();
    const cards = analytics.productPolish.evidenceCards;

    expect(cards.length).toBeGreaterThan(0);
    expect(
      cards.every(
        (card) =>
          card.title.length > 0 &&
          card.whatHappened.length > 0 &&
          card.whyItMatters.length > 0 &&
          card.reviewAction.length > 0 &&
          card.primaryRoute.startsWith("/") &&
          card.marketContextUsedForConclusion === false,
      ),
    ).toBe(true);
  });

  it("explains trade grades with bounded driver scores", () => {
    const { analytics } = buildAnalytics();
    const explanations = analytics.productPolish.gradeExplainability;

    expect(explanations).toHaveLength(
      analytics.improvementIntelligence.tradeQualityScorecards.length,
    );
    expect(
      explanations.every(
        (grade) =>
          grade.marketContextUsedForScoring === false &&
          grade.overallScore >= 0 &&
          grade.overallScore <= 100 &&
          [
            ...grade.positiveDrivers,
            ...grade.negativeDrivers,
            ...grade.neutralDrivers,
          ].every((driver) => driver.score >= 0 && driver.score <= 100),
      ),
    ).toBe(true);
  });

  it("creates first-import steps and a prioritized repair inbox", () => {
    const { analytics } = buildAnalytics();
    const importExperience = analytics.productPolish.firstImportExperience;
    const repairInbox = analytics.productPolish.tradeRepairInbox;

    expect(importExperience.steps.map((step) => step.id)).toEqual([
      "choose_broker_file",
      "detect_columns",
      "validate_rows",
      "group_trades",
      "repair_items",
      "save_in_app",
    ]);
    expect(importExperience.supportedBrokerLabels).toContain("IBKR");
    expect(repairInbox.totalCount).toBeGreaterThan(0);
    expect(repairInbox.items[0].priority).toBeGreaterThanOrEqual(
      repairInbox.items[repairInbox.items.length - 1].priority,
    );
  });

  it("builds pattern memory, rule lab, session recap, and coach review queue", () => {
    const { analytics } = buildAnalytics();
    const polish = analytics.productPolish;

    expect(polish.personalPatternMemory.totalCount).toBeGreaterThan(0);
    expect(polish.ruleCandidateLab.totalCount).toBeGreaterThan(0);
    expect(
      polish.ruleCandidateLab.items.every((item) =>
        item.limitation.includes("does not estimate alternate P/L"),
      ),
    ).toBe(true);
    expect(polish.sessionRecap.marketContextUsedForConclusions).toBe(false);
    expect(polish.sessionRecap.nextAction.length).toBeGreaterThan(0);
    expect(polish.coachReviewQueue.totalCount).toBeGreaterThan(0);
    expect(polish.coachReviewQueue.primaryItem?.href.startsWith("/")).toBe(true);
  });

  it("calibrates confidence wording and builds quality trend points", () => {
    const { analytics } = buildAnalytics();
    const calibration = analytics.productPolish.confidenceCalibration;
    const trendline = analytics.productPolish.executionQualityTrendline;

    expect(calibration.items.length).toBeGreaterThan(0);
    expect(
      calibration.items.every((item) =>
        ["strongly_suggests", "may_indicate", "review_manually"].includes(
          item.phrase,
        ),
      ),
    ).toBe(true);
    expect(trendline.points.length).toBe(
      analytics.productPolish.gradeExplainability.length,
    );
    expect(trendline.points[0].direction).toBe("first");
  });

  it("exposes pure builders for direct product route use", () => {
    const { analytics } = buildAnalytics();
    const gradeExplainability = buildTradeGradeExplainability({
      improvement: analytics.improvementIntelligence,
    });
    const evidenceCards = buildProductEvidenceCards({
      report: analytics.latestReport,
      importInbox: analytics.importInbox,
      productIntelligence: analytics.productIntelligence,
      improvement: analytics.improvementIntelligence,
      gradeExplainability,
    });
    const repairInbox = buildTradeRepairInbox({
      importInbox: analytics.importInbox,
      productization: analytics.productization,
    });
    const importExperience = buildFirstImportExperience({
      importInbox: analytics.importInbox,
      productization: analytics.productization,
      repairInbox,
    });
    const memory = buildPersonalPatternMemory({
      report: analytics.latestReport,
      improvement: analytics.improvementIntelligence,
      coachActionLoop: analytics.coachActionLoop,
    });
    const ruleLab = buildRuleCandidateLab({
      productIntelligence: analytics.productIntelligence,
      coachActionLoop: analytics.coachActionLoop,
      sampleSize: analytics.latestReport.report.sampleSize.completedTradeCount,
    });
    const sessionRecap = buildSessionRecapViewModel({
      improvement: analytics.improvementIntelligence,
    });
    const confidence = buildConfidenceCalibration({
      report: analytics.latestReport,
      evidenceCards,
      personalPatternMemory: memory,
    });
    const trendline = buildExecutionQualityTrendline({
      gradeExplainability,
    });
    const queue = buildCoachReviewQueue({
      repairInbox,
      productIntelligence: analytics.productIntelligence,
      personalPatternMemory: memory,
      ruleCandidateLab: ruleLab,
      gradeExplainability,
    });

    expect(evidenceCards.length).toBeGreaterThan(0);
    expect(importExperience.nextAction.length).toBeGreaterThan(0);
    expect(memory.items.length).toBeGreaterThan(0);
    expect(ruleLab.items.length).toBeGreaterThan(0);
    expect(sessionRecap.reviewTradeIds.length).toBeGreaterThan(0);
    expect(confidence.items.length).toBeGreaterThan(0);
    expect(trendline.points.length).toBeGreaterThan(0);
    expect(queue.items.length).toBeGreaterThan(0);
  });

  it("keeps product polish stable when market context readiness is forced ready", () => {
    const { analytics } = buildAnalytics();
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
    const rebuilt = buildTraderProductPolishViewModel({
      report: analytics.latestReport,
      importInbox: analytics.importInbox,
      productization: analytics.productization,
      productIntelligence: forcedMarketContext,
      improvement: analytics.improvementIntelligence,
      coachActionLoop: analytics.coachActionLoop,
    });

    expect(rebuilt.marketContextUsedForConclusions).toBe(false);
    expect(rebuilt.sessionRecap).toEqual(analytics.productPolish.sessionRecap);
    expect(rebuilt.executionQualityTrendline.points).toEqual(
      analytics.productPolish.executionQualityTrendline.points,
    );
  });
});
