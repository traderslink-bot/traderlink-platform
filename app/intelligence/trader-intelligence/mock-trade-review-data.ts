import type { TradeCoachingOutput } from "@/src/lib/coaching/types/trade-coaching-types";
import { buildUserFacingTradeReviewSummary } from "@/src/lib/user-facing-review/mappers/build-user-facing-trade-review-summary";
import type { UserFacingTradeReviewSummary } from "@/src/lib/user-facing-review/types/user-facing-trade-review-summary";

type MockCaseConfig = {
  id: string;
  label: string;
  behaviorId: string | null;
  behaviorLabel: string | null;
  confidence: TradeCoachingOutput["confidence"];
  grossPnlLabel: string;
  mode?: "auto" | "mixed" | "needs_more_data";
  patternIds: string[];
  resultLabel: string;
  sessionLabel: string;
  symbol: string;
};

function behavior(
  behaviorId: string | null,
  label: string | null,
): TradeCoachingOutput["mostImportantMistake"] {
  if (!behaviorId || !label) {
    return null;
  }

  return {
    behaviorId,
    label,
  } as TradeCoachingOutput["mostImportantMistake"];
}

function mockCoachingOutput(config: MockCaseConfig): Pick<
  TradeCoachingOutput,
  | "alignment"
  | "confidence"
  | "fixFirst"
  | "mostImportantMistake"
  | "mostImportantStrength"
  | "supportingEvidence"
  | "suppressedBehaviorIds"
> {
  const isStrength =
    config.behaviorId === "strong_profit_protection" ||
    config.behaviorId === "strong_winner_management" ||
    config.behaviorId === "structured_execution";
  const behaviorSignal = behavior(config.behaviorId, config.behaviorLabel);

  return {
    confidence: config.confidence,
    fixFirst:
      config.mode === "needs_more_data" || isStrength || !config.behaviorId
        ? null
        : ({
            behaviorId: config.behaviorId,
          } as TradeCoachingOutput["fixFirst"]),
    mostImportantMistake: isStrength ? null : behaviorSignal,
    mostImportantStrength: isStrength ? behaviorSignal : null,
    supportingEvidence: config.patternIds.map((patternId, index) => ({
      contributionScore: index === 0 ? 82 : 54,
      family: index === 0 ? "entry_quality" : "management_quality",
      patternId,
    })),
    suppressedBehaviorIds:
      config.mode === "needs_more_data"
        ? []
        : config.behaviorId === "poor_profit_protection"
          ? ["premature_exit"]
          : [],
    alignment: {
      dominantBehaviorIds: config.behaviorId ? [config.behaviorId] : [],
      dominantFamily: config.patternIds[0] ? "trade_management" : null,
      scoreBand:
        config.mode === "needs_more_data"
          ? "mixed"
          : isStrength
            ? "strong_positive"
            : config.mode === "mixed"
              ? "mixed"
              : "negative",
    },
  };
}

const mockCaseConfigs: MockCaseConfig[] = [
  {
    id: "chase-entry",
    label: "Chase entry",
    behaviorId: "chasing",
    behaviorLabel: "Chasing",
    confidence: "high",
    grossPnlLabel: "-$184",
    patternIds: ["overextended_chase_entry_structure", "breakout_chase_entry_structure"],
    resultLabel: "Loss",
    sessionLabel: "Market open",
    symbol: "ALTX",
  },
  {
    id: "poor-profit-protection",
    label: "Poor profit protection",
    behaviorId: "poor_profit_protection",
    behaviorLabel: "Poor Profit Protection",
    confidence: "high",
    grossPnlLabel: "+$42",
    patternIds: ["failed_profit_protection_structure", "peak_profit_giveback_structure"],
    resultLabel: "Small win",
    sessionLabel: "Late morning",
    symbol: "NVDA",
  },
  {
    id: "premature-exit",
    label: "Premature exit",
    behaviorId: "premature_exit",
    behaviorLabel: "Premature Exit",
    confidence: "moderate",
    grossPnlLabel: "+$96",
    patternIds: [
      "premature_final_exit_after_constructive_management",
      "missed_post_exit_continuation",
    ],
    resultLabel: "Win",
    sessionLabel: "Midday",
    symbol: "TSLA",
  },
  {
    id: "adding-into-weakness",
    label: "Adding into weakness",
    behaviorId: "adding_into_weakness",
    behaviorLabel: "Adding Into Weakness",
    confidence: "high",
    grossPnlLabel: "-$312",
    patternIds: ["add_into_weakness", "add_after_recent_drop"],
    resultLabel: "Loss",
    sessionLabel: "Market open",
    symbol: "AMD",
  },
  {
    id: "strong-profit-protection",
    label: "Strong profit protection",
    behaviorId: "strong_profit_protection",
    behaviorLabel: "Strong Profit Protection",
    confidence: "high",
    grossPnlLabel: "+$428",
    patternIds: [
      "profit_protection_present",
      "timely_risk_response_with_profit_protection",
    ],
    resultLabel: "Strong win",
    sessionLabel: "Afternoon",
    symbol: "META",
  },
  {
    id: "structured-execution",
    label: "Structured execution",
    behaviorId: "structured_execution",
    behaviorLabel: "Structured Execution",
    confidence: "high",
    grossPnlLabel: "+$211",
    patternIds: ["structured_position_building", "disciplined_defensive_exit"],
    resultLabel: "Clean review",
    sessionLabel: "Pre-market",
    symbol: "SPY",
  },
  {
    id: "mixed-moderate-confidence",
    label: "Mixed evidence",
    behaviorId: "premature_exit",
    behaviorLabel: "Premature Exit",
    confidence: "moderate",
    grossPnlLabel: "+$18",
    mode: "mixed",
    patternIds: [
      "balanced_management_with_premature_final_exit",
      "advantaged_entry_structure",
    ],
    resultLabel: "Mixed",
    sessionLabel: "Market open",
    symbol: "MARA",
  },
  {
    id: "needs-more-data",
    label: "Needs more data",
    behaviorId: null,
    behaviorLabel: null,
    confidence: "low",
    grossPnlLabel: "n/a",
    mode: "needs_more_data",
    patternIds: [],
    resultLabel: "Incomplete",
    sessionLabel: "Unknown",
    symbol: "ABCD",
  },
];

export type MockTradeReviewCase = {
  id: string;
  label: string;
  summary: UserFacingTradeReviewSummary;
};

export const mockTradeReviewCases: MockTradeReviewCase[] = mockCaseConfigs.map(
  (config) => ({
    id: config.id,
    label: config.label,
    summary: buildUserFacingTradeReviewSummary({
      tradeId: `mock-${config.id}`,
      symbol: config.symbol,
      sessionLabel: config.sessionLabel,
      resultLabel: config.resultLabel,
      grossPnlLabel: config.grossPnlLabel,
      coachingOutput: mockCoachingOutput(config),
      mode: config.mode,
    }),
  }),
);

export function getMockTradeReviewCase(
  id: string | undefined,
): MockTradeReviewCase {
  return (
    mockTradeReviewCases.find((reviewCase) => reviewCase.id === id) ??
    mockTradeReviewCases[0]
  );
}
