import {
  summarizeDecisionReviewCalibrationReadiness,
  type DecisionReviewCalibrationReport,
  type DecisionReviewCalibrationReadinessSummary,
} from "../server/decision-review-calibration-readiness";

export type CoachingBehaviorEvidenceMatrixCaseId =
  | "poor_profit_protection_backed"
  | "poor_profit_protection_stale"
  | "premature_exit_backed"
  | "premature_exit_stale"
  | "adding_into_weakness_backed"
  | "adding_into_weakness_stale"
  | "undersized_winner_backed"
  | "undersized_winner_stale"
  | "captured_exit_clean"
  | "captured_exit_contradiction";

export interface CoachingBehaviorEvidenceMatrixCase {
  id: CoachingBehaviorEvidenceMatrixCaseId;
  label: string;
  review: DecisionReviewCalibrationReport["result"]["decisionReviews"][number];
  expected: {
    contradictoryProfitProtectionAndCapturedExitCount: number;
    stalePoorProfitProtectionFixFirstCount: number;
    stalePrematureExitFixFirstCount: number;
    staleAddingIntoWeaknessFixFirstCount: number;
    staleUndersizedWinnerFixFirstCount: number;
  };
}

export interface CoachingBehaviorEvidenceMatrixResult {
  id: CoachingBehaviorEvidenceMatrixCaseId;
  label: string;
  status: "pass" | "fail";
  failedExpectations: string[];
  summary: DecisionReviewCalibrationReadinessSummary;
}

function insight(id: string): DecisionReviewCalibrationReport["result"]["decisionReviews"][number]["insights"][number] {
  return {
    id,
    tone: id.includes("captured") ? "strength" : "risk",
    category: id.includes("exit") || id.includes("protection") ? "exit" : "scaling",
    title: id,
    summary: `${id} evidence is visible.`,
    evidence: ["tradeMfePct=4.0%", "tradeMaePct=1.0%"],
  };
}

function review(args: {
  tradeId: string;
  fixFirstBehaviorId: string | null;
  insightIds: string[];
}): CoachingBehaviorEvidenceMatrixCase["review"] {
  return {
    tradeId: args.tradeId,
    coachingHeadline: `${args.tradeId} coaching headline`,
    fixFirstBehaviorId: args.fixFirstBehaviorId,
    marketContextSource: "levels_system_daily_4h",
    tradeWindowEvidenceSource: "levels_system_trade_window",
    candleQualityNotes: [],
    insights: args.insightIds.map(insight),
  };
}

function expected(
  overrides: Partial<CoachingBehaviorEvidenceMatrixCase["expected"]> = {},
): CoachingBehaviorEvidenceMatrixCase["expected"] {
  return {
    contradictoryProfitProtectionAndCapturedExitCount: 0,
    stalePoorProfitProtectionFixFirstCount: 0,
    stalePrematureExitFixFirstCount: 0,
    staleAddingIntoWeaknessFixFirstCount: 0,
    staleUndersizedWinnerFixFirstCount: 0,
    ...overrides,
  };
}

export function buildCoachingBehaviorEvidenceMatrix(): CoachingBehaviorEvidenceMatrixCase[] {
  return [
    {
      id: "poor_profit_protection_backed",
      label: "Poor profit protection has visible failure evidence",
      review: review({
        tradeId: "dry-run-trade-1-ppok",
        fixFirstBehaviorId: "poor_profit_protection",
        insightIds: ["profit_protection_failed", "trade_window_excursion_measured"],
      }),
      expected: expected(),
    },
    {
      id: "poor_profit_protection_stale",
      label: "Poor profit protection is stale without failure evidence",
      review: review({
        tradeId: "dry-run-trade-2-ppbad",
        fixFirstBehaviorId: "poor_profit_protection",
        insightIds: ["exit_captured_trade_well", "trade_window_excursion_measured"],
      }),
      expected: expected({ stalePoorProfitProtectionFixFirstCount: 1 }),
    },
    {
      id: "premature_exit_backed",
      label: "Premature exit has continuation evidence",
      review: review({
        tradeId: "dry-run-trade-3-peok",
        fixFirstBehaviorId: "premature_exit",
        insightIds: ["exit_left_continuation", "trade_window_excursion_measured"],
      }),
      expected: expected(),
    },
    {
      id: "premature_exit_stale",
      label: "Premature exit is stale without continuation evidence",
      review: review({
        tradeId: "dry-run-trade-4-pebad",
        fixFirstBehaviorId: "premature_exit",
        insightIds: ["trade_window_excursion_measured"],
      }),
      expected: expected({ stalePrematureExitFixFirstCount: 1 }),
    },
    {
      id: "adding_into_weakness_backed",
      label: "Adding into weakness has visible weakness evidence",
      review: review({
        tradeId: "dry-run-trade-5-aiwok",
        fixFirstBehaviorId: "adding_into_weakness",
        insightIds: [
          "adds_increased_risk_into_weakness",
          "trade_window_excursion_measured",
        ],
      }),
      expected: expected(),
    },
    {
      id: "adding_into_weakness_stale",
      label: "Adding into weakness is stale with only late-range add evidence",
      review: review({
        tradeId: "dry-run-trade-6-aiwbad",
        fixFirstBehaviorId: "adding_into_weakness",
        insightIds: [
          "adds_after_trade_already_used_range",
          "trade_window_excursion_measured",
        ],
      }),
      expected: expected({ staleAddingIntoWeaknessFixFirstCount: 1 }),
    },
    {
      id: "undersized_winner_backed",
      label: "Undersized winner has visible sizing evidence",
      review: review({
        tradeId: "dry-run-trade-7-uwok",
        fixFirstBehaviorId: "undersized_winner",
        insightIds: ["winner_stayed_undersized", "trade_window_excursion_measured"],
      }),
      expected: expected(),
    },
    {
      id: "undersized_winner_stale",
      label: "Undersized winner is stale without sizing evidence",
      review: review({
        tradeId: "dry-run-trade-8-uwbad",
        fixFirstBehaviorId: "undersized_winner",
        insightIds: ["entry_had_constructive_location", "trade_window_excursion_measured"],
      }),
      expected: expected({ staleUndersizedWinnerFixFirstCount: 1 }),
    },
    {
      id: "captured_exit_clean",
      label: "Captured exit is not contradictory by itself",
      review: review({
        tradeId: "dry-run-trade-9-exitok",
        fixFirstBehaviorId: null,
        insightIds: ["exit_captured_trade_well", "trade_window_excursion_measured"],
      }),
      expected: expected(),
    },
    {
      id: "captured_exit_contradiction",
      label: "Captured exit contradicts failed protection on the same review",
      review: review({
        tradeId: "dry-run-trade-10-exitbad",
        fixFirstBehaviorId: null,
        insightIds: [
          "profit_protection_failed",
          "exit_captured_trade_well",
          "trade_window_excursion_measured",
        ],
      }),
      expected: expected({
        contradictoryProfitProtectionAndCapturedExitCount: 1,
      }),
    },
  ];
}

function report(
  review: CoachingBehaviorEvidenceMatrixCase["review"],
): DecisionReviewCalibrationReport {
  return {
    generatedAt: "2026-05-06T16:40:00.000Z",
    result: {
      importStatus: "ready",
      requestedTradeCount: 1,
      analyzableTradeCount: 1,
      completedReviewCount: 1,
      decisionReviews: [review],
      diagnostics: [],
      marketContextSourceCounts: {
        levels_system_daily_4h: 1,
      },
    },
  };
}

export function runCoachingBehaviorEvidenceMatrix(): CoachingBehaviorEvidenceMatrixResult[] {
  return buildCoachingBehaviorEvidenceMatrix().map((testCase) => {
    const summary = summarizeDecisionReviewCalibrationReadiness(
      report(testCase.review),
    );
    const failedExpectations: string[] = [];

    for (const key of Object.keys(testCase.expected) as Array<
      keyof CoachingBehaviorEvidenceMatrixCase["expected"]
    >) {
      if (summary[key] !== testCase.expected[key]) {
        failedExpectations.push(
          `${key}: expected ${testCase.expected[key]}, got ${summary[key]}`,
        );
      }
    }

    return {
      id: testCase.id,
      label: testCase.label,
      status: failedExpectations.length === 0 ? "pass" : "fail",
      failedExpectations,
      summary,
    };
  });
}
