import {
  assertCoachAiReviewOutputGrounded,
  assertCoachAiReviewOutputSafe,
  type CoachAiReviewGroundingInput,
} from "@/src/modules/coach/server/coach-ai-review-output-safety";

const providerPackage = JSON.stringify({
  period: { startDate: "2026-08-03", endDate: "2026-08-07" },
  reviewPeriodMarketFacts: {
    netPnlDecimal: "125.5",
    winRatePercentDecimal: "50",
    days: [{
      reviewMarketDate: "2026-08-03",
      trades: [
        { ticker: "AMD", netPnlDecimal: "125.5" },
        { ticker: "AAPL", netPnlDecimal: "-30.5" },
      ],
    }],
  },
  coverageNotice: { limitationReasonCodes: [], incompleteRecordRequired: false },
});

const accepted: CoachAiReviewGroundingInput = Object.freeze({
  providerPackage,
  priorFocuses: Object.freeze([]),
  previouslyIssuedFocuses: Object.freeze([]),
  focusFollowThroughMayBeUnavailable: false,
  reviewSummary: "The period ended at $125.50 with a 50% win rate; AAPL contributed -$30.50.",
  whatImproved: "No clear process improvement was established.",
  whatHeldYouBack: "The supplied evidence did not establish one dominant process issue.",
  focusFollowThrough: "No earlier issued focus was available.",
  nextFocuses: Object.freeze([
    "Review whether the AMD result matched the saved trade plan.",
  ]),
  incompleteRecord: null,
});

function expectRejected(
  code: string,
  input: CoachAiReviewGroundingInput,
): void {
  try {
    assertCoachAiReviewOutputGrounded(input);
  } catch (error) {
    if (error instanceof Error && error.message === code) return;
    throw error;
  }
  throw new Error(`coach_ai_review_grounding_expected_${code}`);
}

assertCoachAiReviewOutputGrounded(accepted);
assertCoachAiReviewOutputGrounded({
  ...accepted,
  reviewSummary: "The loss does not prove bad process.",
});

expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_COVERAGE_CLAIM", {
  ...accepted,
  providerPackage: JSON.stringify({
    ...JSON.parse(providerPackage) as object,
    coverageNotice: {
      limitationReasonCodes: ["Some Trade Tracker reviews were not marked complete."],
      incompleteRecordRequired: true,
    },
  }),
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_FOCUS_REFERENCE", {
  ...accepted,
  priorFocuses: ["Review whether AMD entries matched the saved plan."],
  focusFollowThrough: "A different focus was reviewed.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_FOCUS_REFERENCE", {
  ...accepted,
  focusFollowThrough: "A current-period focus was completed.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_RECORDKEEPING_PRAISE", {
  ...accepted,
  whatImproved: "The main improvement was the disciplined way you recorded every trade.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_IMPROVEMENT", {
  ...accepted,
  whatImproved: "Loss containment improved because stops were respected.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_OUTCOME_PROCESS_CLAIM", {
  ...accepted,
  reviewSummary: "The profitable result demonstrated strong execution.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_RECORDKEEPING_FRICTION", {
  ...accepted,
  whatHeldYouBack: "Missing trade notes were what held you back.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_DUPLICATE_FOCUSES", {
  ...accepted,
  nextFocuses: [
    "Review whether the AMD entry followed the saved plan.",
    "Review whether the AMD entry followed the saved plan",
  ],
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_REPEATED_FOCUS", {
  ...accepted,
  previouslyIssuedFocuses: ["Review whether the AMD entry followed the saved plan."],
  nextFocuses: ["Review whether the AMD entry followed the saved plan."],
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_DATE", {
  ...accepted,
  reviewSummary: "The period ended on 2026-08-04.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_MONEY", {
  ...accepted,
  reviewSummary: "The period ended at $999.00.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_PERCENTAGE", {
  ...accepted,
  reviewSummary: "The period had a 99% win rate.",
});
expectRejected("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_TICKER", {
  ...accepted,
  reviewSummary: "The strongest result came from ticker XYZ.",
});

try {
  assertCoachAiReviewOutputSafe({
    textFields: ["Next time, reduce position size after a loss."],
    nextFocuses: [],
  });
  throw new Error("coach_ai_review_direction_expected_rejection");
} catch (error) {
  if (!(error instanceof Error) ||
      error.message !== "TRADERLINK_COACH_OPENAI_UNSAFE_TRADING_DIRECTION") {
    throw error;
  }
}

process.stdout.write(`${JSON.stringify({
  status: "passed",
  acceptedCases: 2,
  rejectedCases: 14,
})}\n`);
