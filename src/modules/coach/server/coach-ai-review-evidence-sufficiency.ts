import type { CoachMonthlyAiReviewInputV2 } from
  "../contracts/monthly-ai-review-input-contracts";
import type {
  CoachAiReviewDailyReflectionV2,
  CoachAiReviewDayMarketFactsV2,
  CoachPeriodicAiReviewInputV2,
} from "../contracts/weekly-ai-review-input-contracts";

export type CoachAiReviewEvidenceSufficiencyV2 = Readonly<{
  sufficient: boolean;
  reason: "multiple_ready_closed_trades" | "closed_trade_with_context" |
    "substantive_reflection" | "context_free_single_trade" | "no_meaningful_evidence";
  readyClosedTradeCount: number;
  substantiveReflectionCount: number;
  savedTagCount: number;
  reviewedRuleOutcomeCount: number;
  deferableSingleTrade: boolean;
}>;

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function isSubstantiveCoachAiReviewReflectionV2(
  reflection: CoachAiReviewDailyReflectionV2,
): boolean {
  return Boolean(reflection.dailyNotes && Object.values(reflection.dailyNotes).some(hasText)) ||
    reflection.tradeNotes.some((note) => hasText(note.note));
}

function factContext(days: readonly CoachAiReviewDayMarketFactsV2[]): Readonly<{
  savedTagCount: number;
  reviewedRuleOutcomeCount: number;
}> {
  let savedTagCount = 0;
  let reviewedRuleOutcomeCount = 0;
  for (const day of days) {
    reviewedRuleOutcomeCount += day.ruleReviews.followed + day.ruleReviews.broken;
    for (const trade of day.trades) {
      savedTagCount += trade.tags.length;
      reviewedRuleOutcomeCount += trade.ruleReviews.followed + trade.ruleReviews.broken;
    }
  }
  return Object.freeze({ savedTagCount, reviewedRuleOutcomeCount });
}

function assessment(input: Readonly<{
  readyClosedTradeCount: number;
  days: readonly CoachAiReviewDayMarketFactsV2[];
  substantiveReflectionCount: number;
}>): CoachAiReviewEvidenceSufficiencyV2 {
  const context = factContext(input.days);
  const hasContext = input.substantiveReflectionCount > 0 ||
    context.savedTagCount > 0 || context.reviewedRuleOutcomeCount > 0;
  const reason = input.readyClosedTradeCount >= 2
    ? "multiple_ready_closed_trades" as const
    : input.readyClosedTradeCount === 1 && hasContext
      ? "closed_trade_with_context" as const
      : input.substantiveReflectionCount > 0
        ? "substantive_reflection" as const
        : input.readyClosedTradeCount === 1
          ? "context_free_single_trade" as const
          : "no_meaningful_evidence" as const;
  const sufficient = reason === "multiple_ready_closed_trades" ||
    reason === "closed_trade_with_context" || reason === "substantive_reflection";
  return Object.freeze({
    sufficient,
    reason,
    readyClosedTradeCount: input.readyClosedTradeCount,
    substantiveReflectionCount: input.substantiveReflectionCount,
    savedTagCount: context.savedTagCount,
    reviewedRuleOutcomeCount: context.reviewedRuleOutcomeCount,
    deferableSingleTrade: reason === "context_free_single_trade",
  });
}

export function assessCoachPeriodicEvidenceSufficiencyV2(
  input: CoachPeriodicAiReviewInputV2,
): CoachAiReviewEvidenceSufficiencyV2 {
  return assessment({
    readyClosedTradeCount: input.reviewPeriodMarketFacts.readyClosedTradeCount,
    days: input.reviewPeriodMarketFacts.days,
    substantiveReflectionCount: [
      ...input.completedDailyReflections,
      ...(input.savedDailyReflections ?? []),
    ]
      .filter(isSubstantiveCoachAiReviewReflectionV2).length,
  });
}

export function assessCoachMonthlyEvidenceSufficiencyV2(
  input: CoachMonthlyAiReviewInputV2,
): CoachAiReviewEvidenceSufficiencyV2 {
  const rawReflectionCount = input.rawReflectionContext
    .filter((context) => isSubstantiveCoachAiReviewReflectionV2(context.reflection)).length;
  return assessment({
    readyClosedTradeCount: input.calendarMonthFacts.readyClosedTradeCount,
    days: input.calendarMonthFacts.days,
    // Weekly prose can provide non-statistical narrative context, but it must
    // never make an otherwise thin exact calendar month eligible by itself.
    substantiveReflectionCount: rawReflectionCount,
  });
}
