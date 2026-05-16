import { describe, expect, it } from "vitest";
import type {
  SavedTraderAnalyticsReport,
  TraderMistakeObservation,
} from "../index";
import {
  buildCoachEmptyState,
  buildCoachMistakeTimeline,
  buildCoachRuleSimulations,
  buildDailyCoachReport,
  buildMistakeSeverityLadder,
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
  buildTradeSimilarityFinder,
  buildTraderArchetypeProfile,
  buildTraderCoachActionLoop,
} from "../index";

describe("trader coach action loop", () => {
  function buildAnalytics() {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });

    return { analytics, sample };
  }

  function visibleCoachCopy(analytics: ReturnType<typeof buildAnalytics>["analytics"]) {
    const coach = analytics.coachActionLoop;

    return [
      coach.coachHome.primaryAction.label,
      coach.coachHome.primaryAction.detail,
      coach.coachHome.headline,
      coach.coachHome.subhead,
      ...coach.coachHome.actions.flatMap((action) => [
        action.label,
        action.detail,
      ]),
      coach.sessionPrepCard.avoidBehavior,
      coach.sessionPrepCard.repeatBehavior,
      coach.sessionPrepCard.ruleFocus,
      coach.sessionPrepCard.sessionTimeInsight,
      ...coach.sessionPrepCard.checklist,
      ...coach.mistakeSeverityLadder.items.flatMap((item) => [
        item.label,
        item.nextAction,
      ]),
      ...coach.mistakeTimeline.items.flatMap((item) => [
        item.label,
        item.detail,
        item.suggestedReviewAction,
      ]),
      ...coach.archetypeProfile.signals.flatMap((signal) => [
        signal.label,
        ...signal.evidence,
      ]),
    ].join("\n");
  }

  it("places repeated mistakes onto trade replay timelines", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const timeline = buildCoachMistakeTimeline({
      improvement: analytics.improvementIntelligence,
    });

    expect(timeline.totalCount).toBeGreaterThan(0);
    expect(
      timeline.items.every(
        (item) =>
          item.tradeId.length > 0 &&
          item.executionIndex >= 0 &&
          item.suggestedReviewAction.length > 0,
      ),
    ).toBe(true);
  });

  it("simulates suggested rules by flagging related trades without alternate P/L claims", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const simulations = buildCoachRuleSimulations({
      recommendations: analytics.productIntelligence.ruleBuilderRecommendations,
    });

    expect(simulations.length).toBeGreaterThan(0);
    expect(
      simulations.every(
        (simulation) =>
          simulation.flaggedTradeCount === simulation.flaggedTradeIds.length &&
          simulation.expectedSuccessMetric.length > 0 &&
          simulation.limitation.includes("does not estimate alternate P/L"),
      ),
    ).toBe(true);
  });

  it("builds archetype, severity ladder, similarity, and coach home outputs", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const coach = analytics.coachActionLoop;

    expect(coach.source).toBe("execution_only");
    expect(coach.marketContextUsedForConclusions).toBe(false);
    expect(coach.archetypeProfile.signals.length).toBeGreaterThanOrEqual(6);
    expect(coach.mistakeSeverityLadder.items.length).toBeGreaterThan(0);
    expect(coach.mistakeSeverityLadder.topSeverity?.severityScore).toBeGreaterThan(0);
    expect(coach.tradeSimilarity.groups.length).toBe(
      analytics.latestReport.sourceTradeIds.length,
    );
    expect(
      coach.tradeSimilarity.groups.some(
        (group) => group.similarTrades.length > 0,
      ),
    ).toBe(true);
    expect(coach.coachHome.primaryAction.href.length).toBeGreaterThan(0);
    expect(coach.sessionPrepCard.checklist).toHaveLength(4);
    expect(coach.sessionPrepCard.sessionTimeInsight).toContain(
      "Highest total entry-session",
    );
  });

  it("builds confidence language with cautious wording for limited evidence", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });

    expect(analytics.coachActionLoop.confidenceLanguage.items.length).toBeGreaterThan(0);
    expect(
      analytics.coachActionLoop.confidenceLanguage.items.every((item) =>
        ["strongly_suggests", "may_indicate", "review_manually"].includes(
          item.phrase,
        ),
      ),
    ).toBe(true);
  });

  it("keeps daily coach fallback tied to saved execution replay evidence", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const dailyCoach = buildDailyCoachReport({
      report: analytics.latestReport,
      qualityScorecards:
        analytics.improvementIntelligence.tradeQualityScorecards,
      mistakeObservations: [],
      ruleEvaluations: [],
    });

    expect(dailyCoach.fixNextSession).toContain("Replay");
    expect(dailyCoach.fixNextSession).toContain("saved execution");
    expect(dailyCoach.fixNextSession.toLowerCase()).not.toContain(
      "review the lowest-quality trade",
    );
  });

  it("returns useful empty states for edge-case report samples", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const base = sample.repository.getReport(sample.userId, "report-all-sample");

    expect(base).not.toBeNull();

    const noTrades: SavedTraderAnalyticsReport = {
      ...base!,
      sourceTradeIds: [],
      sourceSummaries: [],
      sampleData: false,
      report: {
        ...base!.report,
        trades: [],
        sampleSize: {
          ...base!.report.sampleSize,
          completedTradeCount: 0,
        },
      },
    };
    const oneTrade: SavedTraderAnalyticsReport = {
      ...base!,
      sourceTradeIds: base!.sourceTradeIds.slice(0, 1),
      sourceSummaries: base!.sourceSummaries.slice(0, 1),
      sampleData: false,
      report: {
        ...base!.report,
        trades: base!.report.trades.slice(0, 1),
      },
    };

    expect(buildCoachEmptyState({ report: noTrades }).kind).toBe("no_trades");
    expect(buildCoachEmptyState({ report: oneTrade }).kind).toBe("one_trade");
    expect(buildCoachEmptyState({ report: base! }).kind).toBe("sample_data");
  });

  it("keeps market context out of coach conclusions", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
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
    const rebuilt = buildTraderCoachActionLoop({
      report: analytics.latestReport,
      trades: sample.trades,
      improvement: analytics.improvementIntelligence,
      productIntelligence: forcedMarketContext,
      ruleEvaluations: analytics.ruleEvaluations,
      reviewWorkflow: analytics.productization.reviewWorkflow,
    });

    expect(rebuilt.marketContextUsedForConclusions).toBe(false);
    expect(rebuilt.sessionPrepCard.ruleFocus).toBe(
      analytics.coachActionLoop.sessionPrepCard.ruleFocus,
    );
    expect(rebuilt.mistakeSeverityLadder.items.map((item) => item.severityScore)).toEqual(
      analytics.coachActionLoop.mistakeSeverityLadder.items.map(
        (item) => item.severityScore,
      ),
    );
  });

  it("exposes pure builders for direct route usage", () => {
    const sample = buildSampleSavedTraderAnalyticsData();
    const analytics = buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
    });
    const profile = buildTraderArchetypeProfile({
      report: analytics.latestReport,
      improvement: analytics.improvementIntelligence,
    });
    const similarity = buildTradeSimilarityFinder({
      report: analytics.latestReport,
      qualityScorecards:
        analytics.improvementIntelligence.tradeQualityScorecards,
    });
    const severity = buildMistakeSeverityLadder({
      observations: analytics.improvementIntelligence.mistakeObservations,
      productIntelligence: analytics.productIntelligence,
    });

    expect(profile.signals.length).toBeGreaterThan(0);
    expect(similarity.groups.length).toBeGreaterThan(0);
    expect(severity.topSeverity).not.toBeNull();
  });

  it("keeps raw behavior taxonomy language out of visible coach copy", () => {
    const { analytics } = buildAnalytics();
    const visibleText = visibleCoachCopy(analytics);

    expect(visibleText).not.toMatch(/added after failed premise/i);
    expect(visibleText).not.toMatch(/\bfailed premise\b/i);
    expect(visibleText).not.toMatch(/\bpremise\b/i);
    expect(visibleText).not.toMatch(/revenge-like/i);
    expect(visibleText).not.toMatch(/chased entry/i);
    expect(visibleText).not.toMatch(/early winner exit/i);
  });

  it("keeps prompt-only behaviors out of the primary severity ladder", () => {
    const { analytics } = buildAnalytics();
    const severityIds = analytics.coachActionLoop.mistakeSeverityLadder.items.map(
      (item) => item.taxonomyId,
    );

    expect(severityIds).not.toContain("chased_entry");
    expect(severityIds).not.toContain("revenge_reentry_cluster");
    expect(severityIds).not.toContain("early_winner_exit");
    expect(severityIds).not.toContain("partialed_without_plan");
    expect(severityIds).not.toContain("repeated_rule_violation");
  });

  it("does not build a primary severity conclusion from review-prompt observations only", () => {
    const { analytics } = buildAnalytics();
    const promptOnlyObservations: TraderMistakeObservation[] = [
      {
        taxonomyId: "chased_entry",
        label: "Chased Entry",
        tradeIds: ["trade-review-prompt-1"],
        requestIndexes: [0],
        occurrenceCount: 3,
        sourceRiskIds: ["rapid_entries"],
        confidence: "high",
        reason: "Execution clustering needs chart evidence before a chase call.",
        suggestedReviewAction:
          "Check whether the entry was far from a cleaner decision point.",
      },
      {
        taxonomyId: "revenge_reentry_cluster",
        label: "Revenge-Like Re-Entry Cluster",
        tradeIds: ["trade-review-prompt-2"],
        requestIndexes: [1],
        occurrenceCount: 2,
        sourceRiskIds: ["rapid_reentry"],
        confidence: "high",
        reason: "Quick re-entry needs same-symbol thread evidence.",
        suggestedReviewAction:
          "Compare the re-entry attempts before calling this a repeated behavior.",
      },
    ];
    const severity = buildMistakeSeverityLadder({
      observations: promptOnlyObservations,
      productIntelligence: analytics.productIntelligence,
    });

    expect(severity.items).toEqual([]);
    expect(severity.topSeverity).toBeNull();
  });
});
