import {
  buildProductTraderAnalyticsViewModel,
} from "./view-model";
import { buildSampleSavedTraderAnalyticsData } from "./sample-data";
import { runExecutionFeedback } from "../../execution-feedback/run-execution-feedback";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import {
  summarizeDecisionReviewCalibrationReadiness,
  type DecisionReviewCalibrationReadinessSummary,
  type DecisionReviewCalibrationReport,
} from "../server/decision-review-calibration-readiness";
import type {
  ProductTraderAnalyticsViewModel,
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTradeId,
} from "./types";

export type CoachingFixtureExpectationId =
  | "clean_long_winner"
  | "short_winner_directional"
  | "open_position_review_gated"
  | "adverse_add_loser"
  | "structured_partial_exit"
  | "inconsistent_sizing"
  | "rapid_fire_management"
  | "daily_coach_session_time"
  | "coach_queue_primary_behavior"
  | "premarket_to_open_hold"
  | "market_open_to_midday_hold"
  | "midday_to_postmarket_hold"
  | "postmarket_to_overnight_hold"
  | "overnight_to_premarket_hold"
  | "execution_only_limits_market_claims"
  | "positive_full_trade_management"
  | "decision_review_full_context_clean"
  | "decision_review_entry_near_resistance"
  | "decision_review_execution_only_fallback"
  | "decision_review_unsafe_candle_basis"
  | "decision_review_market_context_unavailable"
  | "decision_review_open_trade_skip";

export interface CoachingFixtureExpectation {
  id: CoachingFixtureExpectationId;
  label: string;
  fixtureSource:
    | "sample_trade_fixture"
    | "sample_report_fixture"
    | "generated_execution_feedback_fixture"
    | "decision_review_evidence_fixture";
  tradeId?: SavedExecutionTradeId;
  request?: UserTradeAnalysisRequest;
  decisionReviewReport?: DecisionReviewCalibrationReport;
  expected: {
    pnlSign?: "positive" | "negative";
    tradeDirection?: string;
    isOpenPosition?: boolean;
    topRiskId?: string | null;
    topStrengthId?: string | null;
    entrySessionBucket?: string;
    dailyCoachTextIncludes?: string[];
    coachQueueTitleIncludes?: string;
    heldSessionBuckets?: string[];
    heldHourBucketsEt?: string[];
    heldPremarketIntoOpen?: boolean;
    heldOpenIntoMidday?: boolean;
    heldMiddayIntoPostmarket?: boolean;
    heldPostmarketIntoOvernight?: boolean;
    heldOvernight?: boolean;
    summaryLimitationsInclude?: string[];
    summaryMustNotInclude?: string[];
    decisionCompletedReviewCount?: number;
    decisionDiagnosticCount?: number;
    decisionMarketContextSourceCount?: Record<string, number>;
    decisionTradeWindowEvidenceCount?: Record<string, number>;
    decisionExecutionOnlyFallbackCount?: number;
    decisionCandleWarningCount?: number;
    decisionCandleInfoCount?: number;
    decisionUnsafeBasisCount?: number;
    decisionIgnoredWindowCount?: number;
    decisionOpenSkippedCount?: number;
    decisionInsightCounts?: Record<string, number>;
    decisionDiagnosticCodes?: string[];
  };
}

export interface CoachingFixtureExpectationResult {
  id: CoachingFixtureExpectationId;
  label: string;
  status: "pass" | "fail";
  failedExpectations: string[];
}

function buildAnalytics(): ProductTraderAnalyticsViewModel {
  const sample = buildSampleSavedTraderAnalyticsData();

  return buildProductTraderAnalyticsViewModel({
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
  });
}

function executionRequest(args: {
  symbol: string;
  tradeDirection?: "long" | "short";
  executions: UserTradeAnalysisRequest["executions"];
}): UserTradeAnalysisRequest {
  return {
    symbol: args.symbol,
    tradeDirection: args.tradeDirection ?? "long",
    sessionContext: {
      sessionDate: "2026-05-01",
      sessionBucket: "market_open",
    },
    provider: {
      preferredProvider: "stub",
      asOfTimestamp: "2026-05-02T02:00:00.000Z",
    },
    tradeWindow: {
      timeframe: "1m",
      preTradeMinutes: 30,
      postTradeMinutes: 30,
    },
    executions: args.executions,
  };
}

function decisionInsight(args: {
  id: string;
  category: string;
  tone?: "strength" | "risk" | "neutral";
  title?: string;
  summary?: string;
  evidence?: string[];
}): DecisionReviewCalibrationReport["result"]["decisionReviews"][number]["insights"][number] {
  return {
    id: args.id,
    category: args.category,
    tone: args.tone ?? "neutral",
    title: args.title ?? args.id.replaceAll("_", " "),
    summary: args.summary ?? `${args.id} evidence is visible.`,
    evidence: args.evidence ?? ["tradeMfePct=2.4%", "tradeMaePct=0.8%"],
  };
}

function decisionReview(args: {
  tradeId: string;
  headline: string;
  fixFirstBehaviorId?: string | null;
  marketContextSource?: string | null;
  tradeWindowEvidenceSource?: string;
  candleQualityNotes?: string[];
  insights: DecisionReviewCalibrationReport["result"]["decisionReviews"][number]["insights"];
}): DecisionReviewCalibrationReport["result"]["decisionReviews"][number] {
  return {
    tradeId: args.tradeId,
    coachingHeadline: args.headline,
    fixFirstBehaviorId: args.fixFirstBehaviorId ?? null,
    marketContextSource: args.marketContextSource ?? "levels_system_daily_4h",
    tradeWindowEvidenceSource:
      args.tradeWindowEvidenceSource ?? "levels_system_trade_window",
    candleQualityNotes: args.candleQualityNotes ?? [],
    insights: args.insights,
  };
}

function decisionReport(args: {
  importStatus?: string;
  reviews?: DecisionReviewCalibrationReport["result"]["decisionReviews"];
  diagnostics?: DecisionReviewCalibrationReport["result"]["diagnostics"];
  marketContextSourceCounts?: Record<string, number>;
}): DecisionReviewCalibrationReport {
  const reviews = args.reviews ?? [];
  const diagnostics = args.diagnostics ?? [];

  return {
    generatedAt: "2026-05-07T14:00:00.000Z",
    result: {
      importStatus: args.importStatus ?? "ready",
      requestedTradeCount: reviews.length + diagnostics.length,
      analyzableTradeCount: reviews.length,
      completedReviewCount: reviews.length,
      decisionReviews: reviews,
      diagnostics,
      marketContextSourceCounts:
        args.marketContextSourceCounts ??
        (reviews.length > 0 ? { levels_system_daily_4h: reviews.length } : {}),
    },
  };
}

export function buildCoachingFixtureExpectationMatrix(): CoachingFixtureExpectation[] {
  return [
    {
      id: "clean_long_winner",
      label: "Clean long winner keeps structured execution as the main strength",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-long-winner",
      expected: {
        pnlSign: "positive",
        tradeDirection: "long",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "clean_single_entry_full_exit",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "short_winner_directional",
      label: "Short winner stays direction-aware and still recognizes clean execution",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-short-winner",
      expected: {
        pnlSign: "positive",
        tradeDirection: "short",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "clean_single_entry_full_exit",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "open_position_review_gated",
      label: "Open position is review-gated instead of treated as a clean completed trade",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-open-position",
      expected: {
        pnlSign: "positive",
        tradeDirection: "long",
        isOpenPosition: true,
        topRiskId: "open_position_leftover",
        topStrengthId: "profitable_reduction_sequence",
        entrySessionBucket: "midday",
      },
    },
    {
      id: "adverse_add_loser",
      label:
        "Adverse add loser keeps adverse adds visible as a review prompt until chart evidence confirms the story",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-repeated-adds",
      expected: {
        pnlSign: "negative",
        tradeDirection: "long",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "decisive_full_exit",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "structured_partial_exit",
      label: "Partial exit fixture preserves staged exit management as a strength",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-partial-exits",
      expected: {
        pnlSign: "positive",
        tradeDirection: "long",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "structured_partial_exit_sequence",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "inconsistent_sizing",
      label: "Inconsistent sizing is visible even when the trade is profitable",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-inconsistent-sizing",
      expected: {
        pnlSign: "positive",
        tradeDirection: "long",
        isOpenPosition: false,
        topRiskId: "inconsistent_share_sizing",
        topStrengthId: "controlled_scale_in",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "rapid_fire_management",
      label: "Rapid-fire management remains visible beside partial-exit strength",
      fixtureSource: "sample_trade_fixture",
      tradeId: "trade-rapid-fire",
      expected: {
        pnlSign: "positive",
        tradeDirection: "long",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "structured_partial_exit_sequence",
        entrySessionBucket: "market_open",
      },
    },
    {
      id: "daily_coach_session_time",
      label: "Daily coach includes session-time context as a review prompt",
      fixtureSource: "sample_report_fixture",
      expected: {
        dailyCoachTextIncludes: [
          "Best entry session",
          "Best entry hour",
          "review prompt",
        ],
      },
    },
    {
      id: "coach_queue_primary_behavior",
      label: "Coach queue keeps the repeated same-symbol issue visible",
      fixtureSource: "sample_report_fixture",
      expected: {
        coachQueueTitleIncludes: "Repeated risky ABCD trades",
      },
    },
    {
      id: "premarket_to_open_hold",
      label: "Premarket entry held into the open carries both session buckets",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "PMOP",
        executions: [
          {
            symbol: "PMOP",
            timestamp: "2026-05-01T13:20:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "PMOP",
            timestamp: "2026-05-01T13:45:00.000Z",
            side: "sell",
            shares: 100,
            price: 10.2,
          },
        ],
      }),
      expected: {
        pnlSign: "positive",
        topRiskId: null,
        topStrengthId: "clean_single_entry_full_exit",
        entrySessionBucket: "pre_market",
        heldSessionBuckets: ["pre_market", "market_open"],
        heldPremarketIntoOpen: true,
        heldOpenIntoMidday: false,
        heldOvernight: false,
      },
    },
    {
      id: "market_open_to_midday_hold",
      label: "Market-open trade held past 11:00 ET marks open-to-midday exposure",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "OMID",
        executions: [
          {
            symbol: "OMID",
            timestamp: "2026-05-01T14:50:00.000Z",
            side: "buy",
            shares: 100,
            price: 20,
          },
          {
            symbol: "OMID",
            timestamp: "2026-05-01T15:10:00.000Z",
            side: "sell",
            shares: 100,
            price: 20.4,
          },
        ],
      }),
      expected: {
        pnlSign: "positive",
        entrySessionBucket: "market_open",
        heldSessionBuckets: ["market_open", "midday"],
        heldOpenIntoMidday: true,
        heldMiddayIntoPostmarket: false,
      },
    },
    {
      id: "midday_to_postmarket_hold",
      label: "Midday trade held past 16:00 ET marks post-market exposure",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "MPOST",
        executions: [
          {
            symbol: "MPOST",
            timestamp: "2026-05-01T19:50:00.000Z",
            side: "buy",
            shares: 100,
            price: 30,
          },
          {
            symbol: "MPOST",
            timestamp: "2026-05-01T20:10:00.000Z",
            side: "sell",
            shares: 100,
            price: 30.3,
          },
        ],
      }),
      expected: {
        pnlSign: "positive",
        entrySessionBucket: "midday",
        heldSessionBuckets: ["midday", "post_market"],
        heldMiddayIntoPostmarket: true,
        heldPostmarketIntoOvernight: false,
      },
    },
    {
      id: "postmarket_to_overnight_hold",
      label: "Post-market trade held past 20:00 ET marks overnight exposure",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "PON",
        executions: [
          {
            symbol: "PON",
            timestamp: "2026-05-01T23:50:00.000Z",
            side: "buy",
            shares: 100,
            price: 40,
          },
          {
            symbol: "PON",
            timestamp: "2026-05-02T00:10:00.000Z",
            side: "sell",
            shares: 100,
            price: 39.7,
          },
        ],
      }),
      expected: {
        pnlSign: "negative",
        entrySessionBucket: "post_market",
        heldSessionBuckets: ["post_market", "overnight"],
        heldPostmarketIntoOvernight: true,
        heldOvernight: true,
      },
    },
    {
      id: "overnight_to_premarket_hold",
      label: "Overnight entry held through 4:00 ET marks overnight plus premarket",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "ONPM",
        executions: [
          {
            symbol: "ONPM",
            timestamp: "2026-05-01T07:50:00.000Z",
            side: "buy",
            shares: 100,
            price: 50,
          },
          {
            symbol: "ONPM",
            timestamp: "2026-05-01T08:10:00.000Z",
            side: "sell",
            shares: 100,
            price: 50.5,
          },
        ],
      }),
      expected: {
        pnlSign: "positive",
        entrySessionBucket: "overnight",
        heldSessionBuckets: ["overnight", "pre_market"],
        heldOvernight: true,
      },
    },
    {
      id: "execution_only_limits_market_claims",
      label: "Execution-only summary keeps market-data limitations explicit",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "LIMS",
        executions: [
          {
            symbol: "LIMS",
            timestamp: "2026-05-01T13:35:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "LIMS",
            timestamp: "2026-05-01T13:50:00.000Z",
            side: "sell",
            shares: 100,
            price: 10.1,
          },
        ],
      }),
      expected: {
        summaryLimitationsInclude: [
          "This read uses execution data only.",
          "Market context, support/resistance, VWAP/EMA, and candle structure were not used.",
        ],
        summaryMustNotInclude: [
          "candle-confirmed",
          "daily/4h support",
          "VWAP confirmed",
        ],
      },
    },
    {
      id: "positive_full_trade_management",
      label: "Constructive scale-in plus staged exits can be a positive primary story",
      fixtureSource: "generated_execution_feedback_fixture",
      request: executionRequest({
        symbol: "GOOD",
        executions: [
          {
            symbol: "GOOD",
            timestamp: "2026-05-01T13:35:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "GOOD",
            timestamp: "2026-05-01T13:55:00.000Z",
            side: "buy",
            shares: 100,
            price: 10.2,
          },
          {
            symbol: "GOOD",
            timestamp: "2026-05-01T14:30:00.000Z",
            side: "sell",
            shares: 100,
            price: 10.5,
          },
          {
            symbol: "GOOD",
            timestamp: "2026-05-01T15:10:00.000Z",
            side: "sell",
            shares: 100,
            price: 10.7,
          },
        ],
      }),
      expected: {
        pnlSign: "positive",
        isOpenPosition: false,
        topRiskId: null,
        topStrengthId: "structured_partial_exit_sequence",
        entrySessionBucket: "market_open",
        heldSessionBuckets: ["market_open", "midday"],
        heldOpenIntoMidday: true,
      },
    },
    {
      id: "decision_review_full_context_clean",
      label: "Decision review with full context stays clear and evidence-backed",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        reviews: [
          decisionReview({
            tradeId: "synthetic-review-full-context-clean",
            headline: "Execution was structured and disciplined.",
            candleQualityNotes: [
              "levels-system trade-window info: Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
            ],
            insights: [
              decisionInsight({
                id: "entry_had_constructive_location",
                category: "entry",
                tone: "strength",
              }),
              decisionInsight({
                id: "trade_window_excursion_measured",
                category: "trade_window",
              }),
            ],
          }),
        ],
      }),
      expected: {
        decisionCompletedReviewCount: 1,
        decisionDiagnosticCount: 0,
        decisionMarketContextSourceCount: { levels_system_daily_4h: 1 },
        decisionTradeWindowEvidenceCount: { levels_system_trade_window: 1 },
        decisionCandleInfoCount: 1,
        decisionCandleWarningCount: 0,
        decisionInsightCounts: {
          entry_had_constructive_location: 1,
          trade_window_excursion_measured: 1,
        },
      },
    },
    {
      id: "decision_review_entry_near_resistance",
      label: "Decision review keeps higher-timeframe resistance risk visible",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        reviews: [
          decisionReview({
            tradeId: "synthetic-review-near-resistance",
            headline: "Your first entry was close to major 4h resistance.",
            fixFirstBehaviorId: "chasing",
            insights: [
              decisionInsight({
                id: "entry_near_daily_4h_resistance",
                category: "market_context",
                tone: "risk",
                evidence: [
                  "nearestResistanceStrength=major",
                  "distanceToResistance=1.2%",
                ],
              }),
              decisionInsight({
                id: "trade_window_excursion_measured",
                category: "trade_window",
              }),
            ],
          }),
        ],
      }),
      expected: {
        decisionCompletedReviewCount: 1,
        decisionInsightCounts: {
          entry_near_daily_4h_resistance: 1,
          trade_window_excursion_measured: 1,
        },
      },
    },
    {
      id: "decision_review_execution_only_fallback",
      label: "Decision review execution-only fallback remains explicit",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        reviews: [
          decisionReview({
            tradeId: "synthetic-review-fallback",
            headline: "Execution review used P/L and fills only.",
            tradeWindowEvidenceSource: "execution_only_fallback",
            candleQualityNotes: [
              "levels-system trade-window warning: Trade-window candles were ignored for this synthetic fixture.",
            ],
            insights: [
              decisionInsight({
                id: "trade_window_excursion_measured",
                category: "trade_window",
                summary: "The review uses execution-only movement evidence.",
              }),
            ],
          }),
        ],
      }),
      expected: {
        decisionCompletedReviewCount: 1,
        decisionTradeWindowEvidenceCount: { execution_only_fallback: 1 },
        decisionExecutionOnlyFallbackCount: 1,
        decisionCandleWarningCount: 1,
        decisionUnsafeBasisCount: 0,
        decisionIgnoredWindowCount: 1,
      },
    },
    {
      id: "decision_review_unsafe_candle_basis",
      label: "Decision review blocks movement claims when candle basis is unsafe",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        reviews: [
          decisionReview({
            tradeId: "synthetic-review-unsafe-basis",
            headline: "Movement review stayed execution/P&L-only.",
            tradeWindowEvidenceSource: "execution_only_fallback",
            candleQualityNotes: [
              "levels-system trade-window warning: Trade-window candle basis status: basis_adjustment_multiple_likely near 38:1. Keep these candles unavailable for movement review.",
            ],
            insights: [
              decisionInsight({
                id: "trade_window_excursion_measured",
                category: "trade_window",
                summary: "The review uses execution-only movement evidence.",
              }),
            ],
          }),
        ],
      }),
      expected: {
        decisionExecutionOnlyFallbackCount: 1,
        decisionCandleWarningCount: 1,
        decisionUnsafeBasisCount: 1,
      },
    },
    {
      id: "decision_review_market_context_unavailable",
      label: "Decision review unavailable market context is diagnostic, not coaching",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        importStatus: "needs_review",
        diagnostics: [
          {
            requestIndex: 0,
            symbol: "MCTX",
            code: "market_context_unavailable",
            message: "Daily/4h candles were unavailable for this synthetic symbol.",
          },
        ],
      }),
      expected: {
        decisionCompletedReviewCount: 0,
        decisionDiagnosticCount: 1,
        decisionDiagnosticCodes: ["market_context_unavailable"],
      },
    },
    {
      id: "decision_review_open_trade_skip",
      label: "Decision review skips open trades until the position is flat",
      fixtureSource: "decision_review_evidence_fixture",
      decisionReviewReport: decisionReport({
        importStatus: "needs_review",
        diagnostics: [
          {
            requestIndex: 1,
            symbol: "OPEN",
            code: "trade_open",
            message: "Trade is still open and cannot receive completed-trade review.",
          },
        ],
      }),
      expected: {
        decisionCompletedReviewCount: 0,
        decisionDiagnosticCount: 1,
        decisionOpenSkippedCount: 1,
        decisionDiagnosticCodes: ["trade_open"],
      },
    },
  ];
}

function rowByTradeId(
  analytics: ProductTraderAnalyticsViewModel,
  tradeId: SavedExecutionTradeId,
): ProductTraderAnalyticsTradeRow | null {
  return (
    analytics.latestReport.report.trades
      .map((row) => ({
        ...row,
        tradeId: analytics.latestReport.sourceTradeIds[row.tradeIndex - 1],
      }))
      .find((row) => row.tradeId === tradeId) ?? null
  );
}

function assertTradeExpectation(args: {
  testCase: CoachingFixtureExpectation;
  row: ProductTraderAnalyticsTradeRow | null;
}): string[] {
  const failures: string[] = [];
  const expected = args.testCase.expected;
  const row = args.row;

  if (!row) {
    return [`Missing expected trade row ${args.testCase.tradeId}.`];
  }

  if (expected.pnlSign === "positive" && row.grossRealizedPnl <= 0) {
    failures.push(`Expected positive P/L, got ${row.grossRealizedPnl}.`);
  }

  if (expected.pnlSign === "negative" && row.grossRealizedPnl >= 0) {
    failures.push(`Expected negative P/L, got ${row.grossRealizedPnl}.`);
  }

  if (
    expected.tradeDirection !== undefined &&
    row.tradeDirection !== expected.tradeDirection
  ) {
    failures.push(
      `Expected direction ${expected.tradeDirection}, got ${row.tradeDirection}.`,
    );
  }

  if (
    expected.isOpenPosition !== undefined &&
    row.isOpenPosition !== expected.isOpenPosition
  ) {
    failures.push(
      `Expected open=${expected.isOpenPosition}, got ${row.isOpenPosition}.`,
    );
  }

  if (expected.topRiskId !== undefined) {
    const actual = row.topRisk?.id ?? null;

    if (actual !== expected.topRiskId) {
      failures.push(`Expected top risk ${expected.topRiskId}, got ${actual}.`);
    }
  }

  if (expected.topStrengthId !== undefined) {
    const actual = row.topStrength?.id ?? null;

    if (actual !== expected.topStrengthId) {
      failures.push(
        `Expected top strength ${expected.topStrengthId}, got ${actual}.`,
      );
    }
  }

  if (
    expected.entrySessionBucket !== undefined &&
    row.entrySessionBucket !== expected.entrySessionBucket
  ) {
    failures.push(
      `Expected entry session ${expected.entrySessionBucket}, got ${row.entrySessionBucket}.`,
    );
  }

  return failures;
}

function assertReportExpectation(args: {
  testCase: CoachingFixtureExpectation;
  analytics: ProductTraderAnalyticsViewModel;
}): string[] {
  const failures: string[] = [];
  const expected = args.testCase.expected;

  for (const fragment of expected.dailyCoachTextIncludes ?? []) {
    if (
      !args.analytics.improvementIntelligence.dailyCoachReport.sessionTimeInsight.includes(
        fragment,
      )
    ) {
      failures.push(`Expected daily coach text to include "${fragment}".`);
    }
  }

  if (expected.coachQueueTitleIncludes) {
    const found = args.analytics.productPolish.coachReviewQueue.items.some((item) =>
      item.title.includes(expected.coachQueueTitleIncludes ?? ""),
    );

    if (!found) {
      failures.push(
        `Expected coach queue title containing "${expected.coachQueueTitleIncludes}".`,
      );
    }
  }

  return failures;
}

function assertSummaryExpectation(args: {
  testCase: CoachingFixtureExpectation;
  summary: ExecutionFeedbackSummary | null;
}): string[] {
  const failures: string[] = [];
  const expected = args.testCase.expected;
  const summary = args.summary;

  if (!summary) {
    return ["Generated execution-feedback fixture did not complete."];
  }

  if (expected.pnlSign === "positive" && summary.executionOnlyPnl.grossRealizedPnl <= 0) {
    failures.push(
      `Expected positive P/L, got ${summary.executionOnlyPnl.grossRealizedPnl}.`,
    );
  }

  if (expected.pnlSign === "negative" && summary.executionOnlyPnl.grossRealizedPnl >= 0) {
    failures.push(
      `Expected negative P/L, got ${summary.executionOnlyPnl.grossRealizedPnl}.`,
    );
  }

  if (
    expected.isOpenPosition !== undefined &&
    summary.lifecycle.isOpenPosition !== expected.isOpenPosition
  ) {
    failures.push(
      `Expected open=${expected.isOpenPosition}, got ${summary.lifecycle.isOpenPosition}.`,
    );
  }

  if (expected.topRiskId !== undefined) {
    const actual = summary.points.risks[0]?.id ?? null;

    if (actual !== expected.topRiskId) {
      failures.push(`Expected top risk ${expected.topRiskId}, got ${actual}.`);
    }
  }

  if (expected.topStrengthId !== undefined) {
    const actual = summary.points.strengths[0]?.id ?? null;

    if (actual !== expected.topStrengthId) {
      failures.push(
        `Expected top strength ${expected.topStrengthId}, got ${actual}.`,
      );
    }
  }

  if (
    expected.entrySessionBucket !== undefined &&
    summary.entrySessionBucket !== expected.entrySessionBucket
  ) {
    failures.push(
      `Expected entry session ${expected.entrySessionBucket}, got ${summary.entrySessionBucket}.`,
    );
  }

  if (expected.heldSessionBuckets) {
    const actual = summary.heldSessionBuckets;

    if (actual.join("|") !== expected.heldSessionBuckets.join("|")) {
      failures.push(
        `Expected held sessions ${expected.heldSessionBuckets.join(", ")}, got ${actual.join(", ")}.`,
      );
    }
  }

  if (expected.heldHourBucketsEt) {
    const actual = summary.heldHourBucketsEt;

    if (actual.join("|") !== expected.heldHourBucketsEt.join("|")) {
      failures.push(
        `Expected held hours ${expected.heldHourBucketsEt.join(", ")}, got ${actual.join(", ")}.`,
      );
    }
  }

  const flagChecks: Array<
    [
      keyof Pick<
        CoachingFixtureExpectation["expected"],
        | "heldPremarketIntoOpen"
        | "heldOpenIntoMidday"
        | "heldMiddayIntoPostmarket"
        | "heldPostmarketIntoOvernight"
        | "heldOvernight"
      >,
      boolean,
    ]
  > = [
    ["heldPremarketIntoOpen", summary.heldPremarketIntoOpen],
    ["heldOpenIntoMidday", summary.heldOpenIntoMidday],
    ["heldMiddayIntoPostmarket", summary.heldMiddayIntoPostmarket],
    ["heldPostmarketIntoOvernight", summary.heldPostmarketIntoOvernight],
    ["heldOvernight", summary.heldOvernight],
  ];

  for (const [key, actual] of flagChecks) {
    if (expected[key] !== undefined && expected[key] !== actual) {
      failures.push(`Expected ${key}=${expected[key]}, got ${actual}.`);
    }
  }

  for (const fragment of expected.summaryLimitationsInclude ?? []) {
    if (!summary.limitations.some((item) => item.includes(fragment))) {
      failures.push(`Expected limitations to include "${fragment}".`);
    }
  }

  const serialized = JSON.stringify(summary).toLowerCase();

  for (const fragment of expected.summaryMustNotInclude ?? []) {
    if (serialized.includes(fragment.toLowerCase())) {
      failures.push(`Did not expect summary text to include "${fragment}".`);
    }
  }

  return failures;
}

function assertRecordExpectation(args: {
  label: string;
  actual: Record<string, number>;
  expected: Record<string, number> | undefined;
}): string[] {
  if (!args.expected) {
    return [];
  }

  const failures: string[] = [];

  for (const [key, expectedValue] of Object.entries(args.expected)) {
    const actualValue = args.actual[key] ?? 0;

    if (actualValue !== expectedValue) {
      failures.push(
        `${args.label}.${key}: expected ${expectedValue}, got ${actualValue}.`,
      );
    }
  }

  return failures;
}

function assertDecisionReviewExpectation(args: {
  testCase: CoachingFixtureExpectation;
  report: DecisionReviewCalibrationReport | null;
}): string[] {
  const failures: string[] = [];
  const expected = args.testCase.expected;
  const report = args.report;

  if (!report) {
    return ["Missing synthetic decision-review evidence fixture."];
  }

  const summary: DecisionReviewCalibrationReadinessSummary =
    summarizeDecisionReviewCalibrationReadiness(report);

  const scalarChecks: Array<
    [
      keyof Pick<
        CoachingFixtureExpectation["expected"],
        | "decisionCompletedReviewCount"
        | "decisionDiagnosticCount"
        | "decisionExecutionOnlyFallbackCount"
        | "decisionCandleWarningCount"
        | "decisionCandleInfoCount"
        | "decisionUnsafeBasisCount"
        | "decisionIgnoredWindowCount"
        | "decisionOpenSkippedCount"
      >,
      number,
    ]
  > = [
    ["decisionCompletedReviewCount", summary.completedReviewCount],
    ["decisionDiagnosticCount", summary.diagnosticCount],
    ["decisionExecutionOnlyFallbackCount", summary.executionOnlyFallbackCount],
    ["decisionCandleWarningCount", summary.candleQualityWarningCount],
    ["decisionCandleInfoCount", summary.candleQualityInfoCount],
    ["decisionUnsafeBasisCount", summary.candleQualityUnsafeBasisCount],
    ["decisionIgnoredWindowCount", summary.candleQualityIgnoredWindowCount],
    ["decisionOpenSkippedCount", summary.openSkippedCount],
  ];

  for (const [key, actual] of scalarChecks) {
    if (expected[key] !== undefined && expected[key] !== actual) {
      failures.push(`Expected ${key}=${expected[key]}, got ${actual}.`);
    }
  }

  failures.push(
    ...assertRecordExpectation({
      label: "marketContextSourceCounts",
      actual: summary.marketContextSourceCounts,
      expected: expected.decisionMarketContextSourceCount,
    }),
    ...assertRecordExpectation({
      label: "tradeWindowEvidenceCounts",
      actual: summary.tradeWindowEvidenceCounts,
      expected: expected.decisionTradeWindowEvidenceCount,
    }),
    ...assertRecordExpectation({
      label: "insightCounts",
      actual: summary.insightCounts,
      expected: expected.decisionInsightCounts,
    }),
  );

  for (const code of expected.decisionDiagnosticCodes ?? []) {
    if (!report.result.diagnostics.some((diagnostic) => diagnostic.code === code)) {
      failures.push(`Expected diagnostic code ${code}.`);
    }
  }

  return failures;
}

export function runCoachingFixtureExpectationMatrix(): CoachingFixtureExpectationResult[] {
  const analytics = buildAnalytics();

  return buildCoachingFixtureExpectationMatrix().map((testCase) => {
    let failedExpectations: string[];

    if (testCase.tradeId) {
      failedExpectations = assertTradeExpectation({
        testCase,
        row: rowByTradeId(analytics, testCase.tradeId),
      });
    } else if (testCase.decisionReviewReport) {
      failedExpectations = assertDecisionReviewExpectation({
        testCase,
        report: testCase.decisionReviewReport,
      });
    } else if (testCase.request) {
      const result = runExecutionFeedback(testCase.request, {
        generatedAt: "2026-05-06T18:30:00.000Z",
      });

      failedExpectations =
        result.status === "completed"
          ? assertSummaryExpectation({ testCase, summary: result.summary })
          : [
              `Generated fixture status ${result.status}: ${
                result.failure?.message ??
                result.validation.issues.map((issue) => issue.message).join(" | ")
              }`,
            ];
    } else {
      failedExpectations = assertReportExpectation({ testCase, analytics });
    }

    return {
      id: testCase.id,
      label: testCase.label,
      status: failedExpectations.length > 0 ? "fail" : "pass",
      failedExpectations,
    };
  });
}
