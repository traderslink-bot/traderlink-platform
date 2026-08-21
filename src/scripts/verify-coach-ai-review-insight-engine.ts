import assert from "node:assert/strict";

import type {
  CoachAiReviewBehaviorObservation,
  CoachAiReviewComparableOutcomeObservation,
  CoachAiReviewMoneyObservation,
  CoachAiReviewRuleOpportunityInput,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  buildCoachAiReviewBehaviorCandidate,
  buildCoachAiReviewPeriodOutcomeCandidate,
  buildCoachAiReviewRateTrendCandidate,
} from "@/src/modules/coach/server/ai-review-insights/coach-ai-review-insight-candidates";
import {
  compareCoachAiReviewConsequences,
  measureCoachAiReviewPeriodOutcomes,
  measureCoachAiReviewRuleDispositions,
} from "@/src/modules/coach/server/ai-review-insights/coach-ai-review-insight-measurements";
import {
  normalizeCoachAiReviewRuleOpportunities,
} from "@/src/modules/coach/server/ai-review-insights/coach-ai-review-insight-normalizer";
import {
  selectCoachAiReviewLaneDefault,
} from "@/src/modules/coach/server/ai-review-insights/coach-ai-review-insight-ranking";

function ruleOpportunity(
  targetRef: string,
  overrides: Partial<CoachAiReviewRuleOpportunityInput>,
): CoachAiReviewRuleOpportunityInput {
  return Object.freeze({
    ruleRef: "rule_maximum_trades",
    ruleVersionRef: "rule_version_1",
    targetRef,
    targetKind: "trading_day" as const,
    reviewScope: "day" as const,
    sourceKind: "template" as const,
    activeAtTarget: true,
    historicalProjection: "applicable" as const,
    savedDisposition: null,
    presetEvaluation: null,
    ...overrides,
  });
}

function fixtureMoney(): readonly CoachAiReviewMoneyObservation[] {
  const values = [
    "-100", "-80", "-60", "-40", "10", "20",
    "40", "45", "50", "55", "60", "65", "70", "75",
    "80", "85", "90", "95", "100", "105",
  ];
  return Object.freeze(values.map((netPnlDecimal, index) => Object.freeze({
    memberRef: `trade_${String(index + 1).padStart(2, "0")}`,
    netPnlDecimal,
    currency: "USD",
  })));
}

function comparableFixture(
  money: readonly CoachAiReviewMoneyObservation[],
): readonly CoachAiReviewComparableOutcomeObservation[] {
  return Object.freeze(money.map((item, index) => Object.freeze({
    ...item,
    bucketRef: `week_${Math.floor(index / 5) + 1}`,
    stratumKey: index % 2 === 0 ? "day|long" : "day|short",
  })));
}

export function verifyCoachAiReviewInsightEngine(): void {
  const normalized = normalizeCoachAiReviewRuleOpportunities([
    ruleOpportunity("day_1", { savedDisposition: "broken" }),
    ruleOpportunity("day_2", { savedDisposition: "not_reviewed" }),
    ruleOpportunity("day_3", {}),
    ruleOpportunity("day_4", {
      presetEvaluation: Object.freeze({
        status: "n/a",
        availabilityReason: "no_applicable_target",
        violationTradeRefs: Object.freeze([]),
      }),
    }),
    ruleOpportunity("day_5", {
      savedDisposition: "broken",
      presetEvaluation: Object.freeze({
        status: "broken",
        availabilityReason: null,
        violationTradeRefs: Object.freeze(["trade_01", "trade_02"]),
      }),
    }),
  ]);
  assert.equal(normalized[0]!.dispositionState, "reviewed_broken");
  assert.equal(normalized[1]!.dispositionState, "explicit_not_reviewed");
  assert.equal(normalized[2]!.dispositionState, "expected_review_missing");
  assert.equal(normalized[3]!.opportunityState, "not_applicable");
  assert.deepEqual(normalized[4]!.authorizedViolationTradeRefs, ["trade_01", "trade_02"]);
  const dispositionMeasurements = measureCoachAiReviewRuleDispositions(normalized);
  const reviewCompletion = dispositionMeasurements.find((item) =>
    item.metricName === "review_completion");
  assert.equal(reviewCompletion?.displayLiteral, "2 of 4");

  const money = fixtureMoney();
  const period = measureCoachAiReviewPeriodOutcomes(money);
  assert.equal(period.tradeCount, 20);
  assert.equal(period.netPnlDecimal, "765");
  assert.equal(period.winningPnlDecimal, "1045");
  assert.equal(period.losingPnlDecimal, "-280");
  assert.equal(period.moneyCoverageComplete, true);
  assert.equal(period.profitFactorDecimal?.startsWith("3.732142857142857"), true);

  const periodCandidate = buildCoachAiReviewPeriodOutcomeCandidate({
    cadence: "monthly",
    observations: money,
    periodStartDate: "2026-08-03",
    periodEndDate: "2026-08-28",
    tradingDayRefs: Object.freeze(["day_1", "day_2", "day_3", "day_4"]),
    confirmedOpenPositionRefs: Object.freeze(["open_1"]),
    openLifecycleReductionRefs: Object.freeze(["open_1"]),
  });
  assert.equal(periodCandidate.family, "period_outcome");
  assert.equal(periodCandidate.measurements.find((item) =>
    item.metricName === "period_end_open_position_unrealized_pnl")?.availability,
  "unavailable_missing_money");

  const comparable = comparableFixture(money);
  const affectedRefs = comparable.slice(0, 6).map((item) => item.memberRef);
  const comparisonRefs = comparable.slice(6).map((item) => item.memberRef);
  const consequence = compareCoachAiReviewConsequences({
    polarity: "negative",
    affectedMemberRefs: affectedRefs,
    comparisonMemberRefs: comparisonRefs,
    observations: comparable,
    periodMoneyObservations: money,
    period,
  });
  assert.equal(consequence.verdict, "worse_associated_outcome");
  assert.equal(consequence.consequenceFactor, 1);

  const behaviorObservations: readonly CoachAiReviewBehaviorObservation[] = Object.freeze(
    comparable.map((item, index) => Object.freeze({
      ...item,
      affected: index < 6,
    })),
  );
  const behavior = buildCoachAiReviewBehaviorCandidate({
    cadence: "monthly",
    family: "add_sequence",
    lane: "friction",
    polarity: "negative",
    resultPolarity: "negative",
    subjectRef: "adds_after_measured_peak",
    trackingSubjectKey: "tracking:add_sequence:adds_after_measured_peak",
    observationUnit: "trade",
    resultOwnership: "trade_close_market_date",
    tradeStylePopulation: "declared_day",
    populationDefinition: "Analyzer-covered Day trades with an observable add path.",
    opportunityDefinition: "Trades with the required measured peak and add sequence.",
    cohortDefinition: "Trades with at least one add after the measured P/L peak.",
    comparisonDefinition: "Affected trades versus the eligible observed remainder.",
    observations: behaviorObservations,
    periodMoneyObservations: comparable,
    periodOutcomes: period,
    processClass: "analyzer_only",
    expectedPopulationCount: 20,
    coverageBalance: "balanced",
    structuredSourceConsistency: 100,
    exploratorySiblingCount: null,
    allowSpecificExample: true,
    allowMaterialOutlier: true,
    representativeEvidence: Object.freeze([
      Object.freeze({ memberRef: "trade_01", role: "highest_material_contribution" as const }),
      Object.freeze({ memberRef: "trade_04", role: "typical_affected" as const }),
    ]),
    relatedRuleRefs: Object.freeze([]),
    relatedFocusRefs: Object.freeze([]),
    overlapKeys: Object.freeze(["management:add_after_peak"]),
    futureTrackability: "trackable",
  });
  assert.notEqual(behavior, null);
  assert.equal(behavior!.consequenceVerdict, "worse_associated_outcome");

  const trend = buildCoachAiReviewRateTrendCandidate({
    cadence: "monthly",
    family: "rule_trend",
    subjectRef: "rule_maximum_trades",
    trackingSubjectKey: "tracking:rule_trend:rule_maximum_trades",
    trendKind: "improvement",
    improvementDirection: "lower_is_better",
    observationUnit: "rule_review_opportunity",
    resultOwnership: "rule_target",
    tradeStylePopulation: "declared_day",
    processClass: "preset_core_rule",
    populationDefinition: "Same-version rule opportunities across four calendar weeks.",
    opportunityDefinition: "Active applicable same-version rule targets.",
    cohortDefinition: "Broken prevalence by calendar week.",
    buckets: Object.freeze([4, 4, 1, 1].map((affectedCount, bucketIndex) => {
      const start = bucketIndex * 5;
      const memberRefs = money.slice(start, start + 5).map((item) => item.memberRef);
      return Object.freeze({
        bucketRef: `week_${bucketIndex + 1}`,
        memberRefs,
        affectedMemberRefs: memberRefs.slice(0, affectedCount),
        marketDateRefs: Object.freeze([`date_${bucketIndex + 1}_1`, `date_${bucketIndex + 1}_2`]),
        expectedCount: 5,
        stratumKeyByMemberRef: Object.freeze(Object.fromEntries(memberRefs.map((memberRef) => [
          memberRef,
          "same_rule_version|day",
        ]))),
      });
    })),
    relatedRuleRefs: Object.freeze(["rule_maximum_trades"]),
    relatedFocusRefs: Object.freeze([]),
    representativeMetricName: "market_date_chronology",
    overlapKeys: Object.freeze(["rule:rule_version_1:trading_day"]),
  });
  assert.notEqual(trend, null);
  assert.equal(trend!.scores[0]!.lane, "improvement");

  const frictionScore = behavior!.scores[0]!;
  const ordered = selectCoachAiReviewLaneDefault({
    lane: "friction",
    candidates: Object.freeze([
      Object.freeze({
        findingRef: behavior!.findingRef,
        actionTargetKey: behavior!.subjectRef,
        evidenceClusterRef: behavior!.overlapKeys[0]!,
        rankTieKey: `01|${behavior!.subjectRef}`,
        score: frictionScore,
        confidence: 75,
        fullFinancialConsequenceScore: frictionScore.dimensions.find((item) =>
          item.name === "financial_materiality")?.value ?? null,
        repetition: frictionScore.dimensions.find((item) => item.name === "repetition")?.value ?? null,
        processRelevance: frictionScore.dimensions.find((item) =>
          item.name === "process_relevance")?.value ?? null,
        specificity: frictionScore.dimensions.find((item) => item.name === "specificity")?.value ?? null,
        leaveOneBucketWinnerStable: true,
      }),
    ]),
  });
  assert.equal(ordered.rankStability.state, "only_eligible");
}

if (process.argv[1]?.endsWith("verify-coach-ai-review-insight-engine.ts")) {
  verifyCoachAiReviewInsightEngine();
  process.stdout.write("Coach AI Review insight engine verification passed.\n");
}
