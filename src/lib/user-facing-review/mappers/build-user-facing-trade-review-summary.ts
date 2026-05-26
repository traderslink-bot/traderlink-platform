import type {
  TradeCoachingOutput,
} from "../../coaching/types/trade-coaching-types";
import type { PatternScoringConfidence } from "../../pattern-scoring/types/pattern-scoring-result";
import type {
  UserFacingAdvancedDetails,
  UserFacingConfidenceLabel,
  UserFacingEducationLink,
  UserFacingInsightType,
  UserFacingReviewGradeLabel,
  UserFacingReviewOutcomeLabel,
  UserFacingSecondaryInsight,
  UserFacingTimelineEvidence,
  UserFacingTradeReviewSummary,
} from "../types/user-facing-trade-review-summary";

export type UserFacingReviewMode = "auto" | "mixed" | "needs_more_data";

export interface BuildUserFacingTradeReviewSummaryInput {
  tradeId: string;
  symbol: string;
  sessionLabel: string;
  sideLabel?: string;
  resultLabel?: string;
  grossPnlLabel?: string;
  coachingOutput: Pick<
    TradeCoachingOutput,
    | "confidence"
    | "fixFirst"
    | "mostImportantMistake"
    | "mostImportantStrength"
    | "supportingEvidence"
    | "suppressedBehaviorIds"
    | "alignment"
  >;
  mode?: UserFacingReviewMode;
  timelineEvidence?: UserFacingTimelineEvidence[];
  secondaryInsights?: UserFacingSecondaryInsight[];
}

type BehaviorCopy = {
  education: UserFacingEducationLink[];
  fixFirst: string;
  plainEnglishSummary: string;
  strength?: boolean;
  title: string;
  whyItMatters: string;
};

const EDUCATION = {
  chasing: {
    term: "Chasing",
    shortDefinition:
      "Entering after the stock has already moved enough that the trade has less room for error.",
    anchorId: "chasing",
  },
  profitProtection: {
    term: "Profit protection",
    shortDefinition:
      "Reducing risk or tightening the plan after a trade has already offered meaningful open profit.",
    anchorId: "profit-protection",
  },
  addingIntoWeakness: {
    term: "Adding into weakness",
    shortDefinition:
      "Increasing position size while the trade is moving against the plan or losing structure.",
    anchorId: "adding-into-weakness",
  },
  prematureExit: {
    term: "Premature exit",
    shortDefinition:
      "Leaving a trade before the original idea has clearly failed or reached a planned target.",
    anchorId: "premature-exit",
  },
  structuredExecution: {
    term: "Structured execution",
    shortDefinition:
      "Managing entries, adds, reductions, and exits from a planned trade structure.",
    anchorId: "structured-execution",
  },
} satisfies Record<string, UserFacingEducationLink>;

const BEHAVIOR_COPY: Record<string, BehaviorCopy> = {
  chasing: {
    title: "Main issue: You chased the entry.",
    plainEnglishSummary:
      "You entered after the stock had already extended. That gave the trade less room to work and made the exit harder to manage.",
    whyItMatters:
      "Late entries usually reduce risk/reward because the easy part of the move may already be gone.",
    fixFirst:
      "Before entering, wait for a pullback, reclaim, or clean breakout hold instead of buying the first strong push.",
    education: [EDUCATION.chasing],
  },
  failed_breakout_chasing: {
    title: "Main issue: The breakout entry did not have enough proof.",
    plainEnglishSummary:
      "You paid up for breakout continuation, but the trade did not show enough evidence that the breakout would hold.",
    whyItMatters:
      "A failed breakout can move against late buyers quickly because the entry is already far from the safer decision point.",
    fixFirst:
      "Require a cleaner breakout hold, reclaim, or lower-risk pullback before sizing into continuation.",
    education: [EDUCATION.chasing],
  },
  poor_profit_protection: {
    title: "Main issue: You gave back too much open profit.",
    plainEnglishSummary:
      "The trade offered profit, but the exit came after a large part of that opportunity had faded.",
    whyItMatters:
      "When a trade has already moved in your favor, protecting part of the gain can keep a winning idea from turning into a frustrating result.",
    fixFirst:
      "Create a profit-protection rule before entering. Decide when you will reduce or tighten risk if open profit starts to fade.",
    education: [EDUCATION.profitProtection],
  },
  premature_exit: {
    title: "Main issue: You exited before the trade had fully played out.",
    plainEnglishSummary:
      "Parts of the trade were managed well, but the final exit came before the move had clearly failed.",
    whyItMatters:
      "Cutting winners too early can limit the payoff from trades where the idea was actually working.",
    fixFirst:
      "Keep a final piece until structure fails or a planned target is reached.",
    education: [EDUCATION.prematureExit],
  },
  adding_into_weakness: {
    title: "Main issue: You added risk while the trade was weakening.",
    plainEnglishSummary:
      "Instead of reducing risk or waiting for structure to repair, the trade increased exposure while price action was getting worse.",
    whyItMatters:
      "Adding into weakness can turn a normal losing trade into a much larger problem.",
    fixFirst:
      "Only add when price is holding structure or proving strength. Do not add just to improve average price.",
    education: [EDUCATION.addingIntoWeakness],
  },
  averaging_down: {
    title: "Main issue: You increased risk lower.",
    plainEnglishSummary:
      "The trade added exposure after the position had already weakened instead of waiting for a cleaner repair.",
    whyItMatters:
      "Averaging down can make the loss larger while giving the trade no real proof that it is improving.",
    fixFirst:
      "Do not add just to improve average price. Wait for structure to repair or reduce risk.",
    education: [EDUCATION.addingIntoWeakness],
  },
  strong_profit_protection: {
    title: "Main strength: You protected profit well.",
    plainEnglishSummary:
      "You reduced risk after the trade offered open profit instead of letting the full gain fade.",
    whyItMatters:
      "Good profit protection helps keep winning trades from turning into avoidable frustration.",
    fixFirst:
      "Keep using a planned protection point once a trade has meaningful open profit.",
    education: [EDUCATION.profitProtection],
    strength: true,
  },
  strong_winner_management: {
    title: "Main strength: You managed the winner with structure.",
    plainEnglishSummary:
      "The trade showed patient winner management instead of rushing the full exit or giving back the whole move.",
    whyItMatters:
      "Structured winner management lets a working trade keep paying while still controlling giveback.",
    fixFirst:
      "Keep protecting and managing winners with the same patience when the trade continues to behave well.",
    education: [EDUCATION.profitProtection, EDUCATION.structuredExecution],
    strength: true,
  },
  strong_loss_containment: {
    title: "Main strength: You contained risk.",
    plainEnglishSummary:
      "When the trade weakened, risk was reduced before the loss became much larger.",
    whyItMatters:
      "Good loss containment keeps one bad idea from becoming a bigger account problem.",
    fixFirst:
      "Keep defending quickly when the trade breaks your plan.",
    education: [EDUCATION.structuredExecution],
    strength: true,
  },
  structured_execution: {
    title: "Main strength: Your execution was structured.",
    plainEnglishSummary:
      "The entry, sizing, reductions, and exit followed a more organized path than an impulsive trade.",
    whyItMatters:
      "Structured execution gives you cleaner evidence to review and makes the next decision easier.",
    fixFirst:
      "Keep using the same structure-first process on similar setups.",
    education: [EDUCATION.structuredExecution],
    strength: true,
  },
};

const DEFAULT_COPY: BehaviorCopy = {
  title: "Main takeaway: The trade needs one cleaner review note.",
  plainEnglishSummary:
    "The trade produced useful evidence, but no single behavior should be overstated from the first pass.",
  whyItMatters:
    "A balanced review is better than forcing a strong conclusion from mixed trade evidence.",
  fixFirst:
    "Write down the clearest entry, risk, or exit decision you would repeat or change next time.",
  education: [EDUCATION.structuredExecution],
};

function confidenceLabel(
  confidence: PatternScoringConfidence,
  mode: UserFacingReviewMode,
): UserFacingConfidenceLabel {
  if (mode === "needs_more_data") {
    return "Needs more data";
  }

  if (confidence === "high") {
    return "High";
  }

  if (confidence === "moderate") {
    return "Moderate";
  }

  return "Low";
}

function confidenceExplanation(
  confidence: PatternScoringConfidence,
  mode: UserFacingReviewMode,
): string {
  if (mode === "needs_more_data") {
    return "The trade can be logged, but there is not enough clean market or execution context for a reliable coaching takeaway.";
  }

  if (confidence === "high") {
    return "The evidence was consistent across the entry, trade path, and exit.";
  }

  if (confidence === "moderate") {
    return "The main behavior was visible, but some parts of the trade gave mixed evidence.";
  }

  return "The app found some signals, but the trade did not provide enough clean evidence for a strong conclusion.";
}

function evidenceExplanation(patternId: string): string {
  if (patternId.includes("profit") || patternId.includes("giveback")) {
    return "The trade offered open profit, and the review focused on how much of that opportunity was protected.";
  }

  if (patternId.includes("weakness") || patternId.includes("drop")) {
    return "The trade increased or held risk while the evidence was getting weaker.";
  }

  if (patternId.includes("premature") || patternId.includes("continuation")) {
    return "The final exit came before the trade had clearly finished its move.";
  }

  if (patternId.includes("chase") || patternId.includes("breakout")) {
    return "The entry came after a fast move higher, which reduced the margin for error.";
  }

  if (patternId.includes("disciplined") || patternId.includes("structured")) {
    return "The execution path showed planned risk control instead of a random sequence of decisions.";
  }

  return "This evidence supports the main review takeaway without needing raw engine labels.";
}

function defaultTimelineEvidence(
  input: BuildUserFacingTradeReviewSummaryInput,
): UserFacingTimelineEvidence[] {
  const evidence = input.coachingOutput.supportingEvidence.slice(0, 3);

  if (evidence.length === 0) {
    return [
      {
        label: "Review evidence",
        explanation:
          "The app needs more execution or market context before it can explain a stronger trade takeaway.",
      },
    ];
  }

  return evidence.map((item, index) => ({
    label: index === 0 ? "Primary evidence" : `Evidence ${index + 1}`,
    explanation: evidenceExplanation(item.patternId),
  }));
}

function primaryBehaviorId(input: BuildUserFacingTradeReviewSummaryInput): string | null {
  return (
    input.coachingOutput.fixFirst?.behaviorId ??
    input.coachingOutput.mostImportantMistake?.behaviorId ??
    input.coachingOutput.mostImportantStrength?.behaviorId ??
    null
  );
}

function outcomeFor(
  insightType: UserFacingInsightType,
  confidence: PatternScoringConfidence,
  mode: UserFacingReviewMode,
): {
  gradeLabel: UserFacingReviewGradeLabel;
  outcomeLabel: UserFacingReviewOutcomeLabel;
} {
  if (mode === "needs_more_data" || insightType === "inconclusive") {
    return { gradeLabel: "Needs more data", outcomeLabel: "Inconclusive" };
  }

  if (insightType === "strength") {
    return { gradeLabel: "A", outcomeLabel: "Strong" };
  }

  if (insightType === "mixed" || confidence === "moderate") {
    return { gradeLabel: "C", outcomeLabel: "Mixed" };
  }

  if (confidence === "low") {
    return { gradeLabel: "Needs more data", outcomeLabel: "Inconclusive" };
  }

  return { gradeLabel: "D", outcomeLabel: "Weak" };
}

function secondaryInsights(
  input: BuildUserFacingTradeReviewSummaryInput,
): UserFacingSecondaryInsight[] {
  if (input.secondaryInsights) {
    return input.secondaryInsights;
  }

  const strength = input.coachingOutput.mostImportantStrength;
  const mistake = input.coachingOutput.mostImportantMistake;
  const insights: UserFacingSecondaryInsight[] = [];

  if (mistake && mistake.behaviorId !== primaryBehaviorId(input)) {
    insights.push({
      title: `Also review: ${mistake.label}`,
      summary:
        "This behavior was present, but it was not the single most important takeaway for the first review pass.",
      priority: "medium",
    });
  }

  if (strength && strength.behaviorId !== primaryBehaviorId(input)) {
    insights.push({
      title: `Also keep: ${strength.label}`,
      summary:
        "This strength helped the trade and should stay visible while you work on the main issue.",
      priority: "medium",
    });
  }

  return insights;
}

function advancedDetails(
  input: BuildUserFacingTradeReviewSummaryInput,
  mode: UserFacingReviewMode,
): UserFacingAdvancedDetails {
  return {
    patternIds: input.coachingOutput.supportingEvidence.map((item) => item.patternId),
    dominantFamily: input.coachingOutput.alignment.dominantFamily,
    scoreBand: input.coachingOutput.alignment.scoreBand,
    suppressedBehaviorIds: input.coachingOutput.suppressedBehaviorIds,
    rawConfidence:
      mode === "needs_more_data" ? "needs_more_data" : input.coachingOutput.confidence,
  };
}

export function buildUserFacingTradeReviewSummary(
  input: BuildUserFacingTradeReviewSummaryInput,
): UserFacingTradeReviewSummary {
  const mode = input.mode ?? "auto";
  const behaviorId = primaryBehaviorId(input);
  const copy =
    mode === "needs_more_data"
      ? {
          title: "Review status: Needs more data.",
          plainEnglishSummary:
            "The trade was imported, but the app does not have enough clean context to produce a reliable coaching takeaway.",
          whyItMatters:
            "A weak conclusion can be worse than no conclusion. The app should not pretend to know more than the data supports.",
          fixFirst:
            "Add more complete candle data or review the trade manually before treating this as a coaching conclusion.",
          education: [],
        }
      : BEHAVIOR_COPY[behaviorId ?? ""] ?? DEFAULT_COPY;
  const inferredType: UserFacingInsightType =
    mode === "needs_more_data"
      ? "inconclusive"
      : mode === "mixed"
        ? "mixed"
        : copy.strength
          ? "strength"
          : "mistake";
  const confidence = input.coachingOutput.confidence;
  const outcome = outcomeFor(inferredType, confidence, mode);

  return {
    tradeId: input.tradeId,
    symbol: input.symbol,
    sessionLabel: input.sessionLabel,
    sideLabel: input.sideLabel ?? "Long",
    resultLabel: input.resultLabel ?? outcome.outcomeLabel,
    grossPnlLabel: input.grossPnlLabel ?? "n/a",
    reviewTitle: copy.title,
    gradeLabel: outcome.gradeLabel,
    outcomeLabel: outcome.outcomeLabel,
    primaryInsight: {
      type: inferredType,
      title: copy.title,
      plainEnglishSummary: copy.plainEnglishSummary,
      whyItMatters: copy.whyItMatters,
      fixFirst: copy.fixFirst,
      confidenceLabel: confidenceLabel(confidence, mode),
      confidenceExplanation: confidenceExplanation(confidence, mode),
    },
    secondaryInsights: secondaryInsights(input),
    timelineEvidence: input.timelineEvidence ?? defaultTimelineEvidence(input),
    educationLinks: copy.education,
    advancedDetails: advancedDetails(input, mode),
  };
}
