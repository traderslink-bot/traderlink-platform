import { describe, expect, it } from "vitest";
import {
  compareDecisionReviewCalibrationReadiness,
  summarizeDecisionReviewCalibrationReadiness,
  type DecisionReviewCalibrationReport,
} from "../server/decision-review-calibration-readiness";

function review(args: {
  tradeId: string;
  headline?: string | null;
  fixFirstBehaviorId?: string | null;
  tradeWindowEvidenceSource?: string;
  candleQualityNotes?: string[];
  evidence?: string[];
  insightId?: string;
  insightIds?: string[];
}): DecisionReviewCalibrationReport["result"]["decisionReviews"][number] {
  return {
    tradeId: args.tradeId,
    coachingHeadline: args.headline ?? "Execution was structured.",
    fixFirstBehaviorId: args.fixFirstBehaviorId ?? null,
    marketContextSource: "levels_system_daily_4h",
    tradeWindowEvidenceSource: args.tradeWindowEvidenceSource,
    candleQualityNotes: args.candleQualityNotes ?? [],
    insights: (args.insightIds ?? [
      args.insightId ?? "trade_window_excursion_measured",
    ]).map((insightId) => ({
        id: insightId,
        tone: "neutral",
        category: "trade_window",
        title: insightId,
        summary: "Bounded movement was measured.",
        evidence: args.evidence ?? ["tradeMfePct=4.0%", "tradeMaePct=1.0%"],
      })),
  };
}

function report(
  reviews: DecisionReviewCalibrationReport["result"]["decisionReviews"],
): DecisionReviewCalibrationReport {
  return {
    generatedAt: "2026-05-05T12:00:00.000Z",
    result: {
      importStatus: "needs_review",
      requestedTradeCount: reviews.length,
      analyzableTradeCount: reviews.length,
      completedReviewCount: reviews.length,
      decisionReviews: reviews,
      diagnostics: [
        {
          requestIndex: 0,
          symbol: "OPEN",
          code: "trade_open",
          message: "OPEN was skipped.",
        },
      ],
      marketContextSourceCounts: {
        levels_system_daily_4h: reviews.length,
      },
    },
  };
}

describe("decision-review calibration readiness", () => {
  it("summarizes market-data readiness from calibration JSON", () => {
    const summary = summarizeDecisionReviewCalibrationReadiness(
      report([
        review({
          tradeId: "dry-run-trade-1-abcd",
          tradeWindowEvidenceSource: "levels_system_trade_window",
          evidence: ["nearestSupport=10", "tradeMfePct=5.0%"],
        }),
        review({
          tradeId: "dry-run-trade-2-ucar",
          tradeWindowEvidenceSource: "execution_only_fallback",
          candleQualityNotes: ["Trade-window candles were ignored."],
          evidence: ["nearestSupport=n/a", "tradeMfePct=120.0%"],
        }),
        review({
          tradeId: "dry-run-trade-3-pbm",
          tradeWindowEvidenceSource: "levels_system_trade_window",
          candleQualityNotes: [
            "Trade-window candle basis status: basis_aligned. Nearby candle OHLC is compatible with broker execution prices for this review.",
          ],
          evidence: ["nearestSupport=10", "tradeMfePct=6.0%"],
        }),
        review({
          tradeId: "dry-run-trade-4-renx",
          headline: "entry was not close to support",
          tradeWindowEvidenceSource: "execution_only_fallback",
          insightId: "entry_far_from_daily_4h_support",
          evidence: ["distanceToSupport=n/a"],
        }),
        review({
          tradeId: "dry-run-trade-5-veee",
          tradeWindowEvidenceSource: "execution_only_fallback",
          candleQualityNotes: [
            "Trade-window candle basis status: basis_adjustment_multiple_likely near 38:1. Keep these candles unavailable for Trader Intelligence movement review unless raw IBKR candle basis is proven aligned to broker execution prices.",
          ],
          evidence: ["nearestSupport=n/a", "tradeMfePct=0.0%"],
        }),
        review({
          tradeId: "dry-run-trade-6-xtlb",
          tradeWindowEvidenceSource: "levels_system_trade_window",
          candleQualityNotes: [
            "1m trade-window candles were unavailable, so levels-system requested 5m fallback candles.",
            "5m fallback candles were used for trade-window analysis.",
          ],
          evidence: ["nearestSupport=10", "tradeMfePct=3.0%"],
        }),
        review({
          tradeId: "dry-run-trade-7-cycn",
          tradeWindowEvidenceSource: "levels_system_trade_window",
          candleQualityNotes: [
            "No post-trade candles were available in the fetched trade window.",
          ],
          evidence: ["nearestSupport=10", "tradeMfePct=3.0%"],
        }),
      ]),
    );

    expect(summary.completedReviewCount).toBe(7);
    expect(summary.executionOnlyFallbackCount).toBe(3);
    expect(summary.candleQualityNoteCount).toBe(5);
    expect(summary.candleQualityWarningCount).toBe(4);
    expect(summary.candleQualityInfoCount).toBe(1);
    expect(summary.candleQualityUnsafeBasisCount).toBe(1);
    expect(summary.candleQualityFallbackTimeframeCount).toBe(1);
    expect(summary.candleQualityIncompleteWindowCount).toBe(1);
    expect(summary.candleQualityIgnoredWindowCount).toBe(1);
    expect(summary.weakLevelEvidenceCount).toBe(3);
    expect(summary.missingTradeWindowExcursionCount).toBe(1);
    expect(summary.fallbackHeadlineCount).toBe(1);
    expect(summary.extremeExcursionMetricCount).toBe(1);
    expect(summary.contradictoryProfitProtectionAndCapturedExitCount).toBe(0);
    expect(summary.stalePoorProfitProtectionFixFirstCount).toBe(0);
    expect(summary.stalePrematureExitFixFirstCount).toBe(0);
    expect(summary.staleAddingIntoWeaknessFixFirstCount).toBe(0);
    expect(summary.staleUndersizedWinnerFixFirstCount).toBe(0);
    expect(summary.openSkippedCount).toBe(1);
    expect(summary.executionOnlyFallbackBySymbol).toEqual({
      RENX: 1,
      UCAR: 1,
      VEEE: 1,
    });
    expect(summary.candleQualityWarningBySymbol).toEqual({
      CYCN: 1,
      UCAR: 1,
      VEEE: 1,
      XTLB: 1,
    });
    expect(summary.candleQualityInfoBySymbol).toEqual({
      PBM: 1,
    });
    expect(summary.candleQualityUnsafeBasisBySymbol).toEqual({
      VEEE: 1,
    });
    expect(summary.candleQualityFallbackTimeframeBySymbol).toEqual({
      XTLB: 1,
    });
    expect(summary.candleQualityIncompleteWindowBySymbol).toEqual({
      CYCN: 1,
    });
    expect(summary.candleQualityIgnoredWindowBySymbol).toEqual({
      UCAR: 1,
    });
  });

  it("compares before and after calibration readiness", () => {
    const baseline = report([
      review({
        tradeId: "dry-run-trade-1-ucar",
        tradeWindowEvidenceSource: "execution_only_fallback",
        evidence: ["nearestSupport=n/a", "tradeMfePct=4.0%"],
      }),
      review({
        tradeId: "dry-run-trade-2-renx",
        tradeWindowEvidenceSource: "execution_only_fallback",
        evidence: ["nearestSupport=n/a", "tradeMfePct=4.0%"],
      }),
    ]);
    const candidate = report([
      review({
        tradeId: "dry-run-trade-1-ucar",
        tradeWindowEvidenceSource: "levels_system_trade_window",
        evidence: ["nearestSupport=10", "tradeMfePct=4.0%"],
      }),
      review({
        tradeId: "dry-run-trade-2-renx",
        tradeWindowEvidenceSource: "execution_only_fallback",
        evidence: ["nearestSupport=n/a", "tradeMfePct=4.0%"],
      }),
    ]);

    const comparison = compareDecisionReviewCalibrationReadiness(
      baseline,
      candidate,
    );

    expect(comparison.deltas.completedReviewCount).toBe(0);
    expect(comparison.deltas.executionOnlyFallbackCount).toBe(-1);
    expect(comparison.deltas.weakLevelEvidenceCount).toBe(-1);
    expect(comparison.deltas.candleQualityWarningCount).toBe(0);
    expect(comparison.deltas.candleQualityInfoCount).toBe(0);
  });

  it("counts stale behavior-review contradiction buckets", () => {
    const summary = summarizeDecisionReviewCalibrationReadiness(
      report([
        review({
          tradeId: "dry-run-trade-1-renx",
          insightIds: [
            "profit_protection_failed",
            "exit_captured_trade_well",
            "trade_window_excursion_measured",
          ],
        }),
        review({
          tradeId: "dry-run-trade-2-ucar",
          fixFirstBehaviorId: "poor_profit_protection",
          insightIds: ["exit_captured_trade_well", "trade_window_excursion_measured"],
        }),
        review({
          tradeId: "dry-run-trade-3-omex",
          fixFirstBehaviorId: "premature_exit",
          insightIds: ["trade_window_excursion_measured"],
        }),
        review({
          tradeId: "dry-run-trade-4-pbm",
          fixFirstBehaviorId: "adding_into_weakness",
          insightIds: ["adds_after_trade_already_used_range"],
        }),
        review({
          tradeId: "dry-run-trade-5-xtlb",
          fixFirstBehaviorId: "adding_into_weakness",
          insightIds: [
            "adds_increased_risk_into_weakness",
            "trade_window_excursion_measured",
          ],
        }),
        review({
          tradeId: "dry-run-trade-6-htz",
          fixFirstBehaviorId: "undersized_winner",
          insightIds: ["entry_had_constructive_location"],
        }),
        review({
          tradeId: "dry-run-trade-7-cycu",
          fixFirstBehaviorId: "undersized_winner",
          insightIds: [
            "winner_stayed_undersized",
            "trade_window_excursion_measured",
          ],
        }),
      ]),
    );

    expect(summary.contradictoryProfitProtectionAndCapturedExitCount).toBe(1);
    expect(summary.stalePoorProfitProtectionFixFirstCount).toBe(1);
    expect(summary.stalePrematureExitFixFirstCount).toBe(1);
    expect(summary.staleAddingIntoWeaknessFixFirstCount).toBe(1);
    expect(summary.staleUndersizedWinnerFixFirstCount).toBe(1);
  });
});
