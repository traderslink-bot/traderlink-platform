import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import {
  addExactDecimals,
  compareExactDecimals,
  percentageExactDecimals,
} from "@/src/modules/journal-analytics/server/exact-analytics-math";

import {
  COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
  type CoachMonthlyAiReviewInput,
  type CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { coachReflectionPeriodBounds, CoachReflectionService } from "./coach-reflection-service";
import type { CoachAiReviewRepository } from "./coach-ai-review-repository";

function holdingDurationMilliseconds(
  openedAtUtc: string,
  closedAtUtc: string,
): number | null {
  const openedAt = Date.parse(openedAtUtc);
  const closedAt = Date.parse(closedAtUtc);
  if (!Number.isFinite(openedAt) || !Number.isFinite(closedAt)) return null;
  const duration = closedAt - openedAt;
  return Number.isSafeInteger(duration) && duration >= 0 ? duration : null;
}

function focusRevisionKey(focus: Readonly<{
  tradingDate: string;
  revisionNumber: number;
}>): string {
  return `${focus.tradingDate}:${focus.revisionNumber}`;
}

function addNullableDecimals(values: readonly (string | null)[]): string | null {
  if (values.some((value) => value === null)) return null;
  return values.reduce<string>((total, value) =>
    addExactDecimals(total, value!), "0");
}

function validatePeriod(period: CoachMonthlyAiReviewPeriod): void {
  const calendarMonth = coachReflectionPeriodBounds("monthly", period.endDate);
  const isCompleteMonth = period.startDate === calendarMonth.startDate &&
    period.endDate === calendarMonth.endDate;
  const isPartialMonth = period.startDate > calendarMonth.startDate &&
    period.endDate === calendarMonth.endDate;
  if (
    (period.periodCoverage === "complete_month" && !isCompleteMonth) ||
    (period.periodCoverage === "partial_month" && !isPartialMonth)
  ) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_PERIOD");
  }
}

function inclusiveCalendarDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T12:00:00.000Z`);
  const end = Date.parse(`${endDate}T12:00:00.000Z`);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? Math.floor((end - start) / 86_400_000) + 1
    : 0;
}

export function assessCoachFirstPartialMonthEligibility(input: Readonly<{
  aiReviewsEnabledDate: string;
  period: CoachMonthlyAiReviewPeriod;
  reviewedTradingDayCount: number;
}>): Readonly<{
  eligible: boolean;
  calendarDayCount: number;
}> {
  validatePeriod(input.period);
  const isFirstPartialMonth = input.period.periodCoverage === "partial_month" &&
    input.aiReviewsEnabledDate === input.period.startDate;
  const calendarDayCount = inclusiveCalendarDays(
    input.period.startDate,
    input.period.endDate,
  );
  return Object.freeze({
    eligible: isFirstPartialMonth && calendarDayCount >= 7 &&
      input.reviewedTradingDayCount >= 3,
    calendarDayCount,
  });
}

export class CoachMonthlyAiReviewInputService {
  constructor(
    private readonly reflections: CoachReflectionService,
    private readonly annotations: JournalAnnotationService,
    private readonly tradingDayReviews: JournalTradingDayReviewService,
    private readonly reviews: Pick<CoachAiReviewRepository, "listIssuedWeeklyReviews">,
  ) {}

  read(
    scope: WorkspaceAccessScope,
    period: CoachMonthlyAiReviewPeriod,
  ): CoachMonthlyAiReviewInput {
    validatePeriod(period);
    const reflection = this.reflections.read(scope, {
      period: "monthly",
      anchorDate: period.endDate,
      currency: null,
    });
    const accountId = scope.activeAccountId;
    if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const focusRevisions = this.annotations.listDailyFocusRevisions(
      account,
      "0000-01-01",
      period.endDate,
    );
    const startingFocus = focusRevisions
      .filter((focus) => focus.tradingDate < period.startDate)
      .at(-1) ?? null;
    const datedFocusRevisions = focusRevisions.filter((focus) =>
      focus.tradingDate >= period.startDate);
    const currentFocuses = [
      ...(startingFocus ? [Object.freeze({
        effectiveFromDate: period.startDate,
        tradingDate: startingFocus.tradingDate,
        revisionNumber: startingFocus.revisionNumber,
        text: startingFocus.currentFocuses,
      })] : []),
      ...datedFocusRevisions
        .filter((focus) => !startingFocus ||
          focusRevisionKey(focus) !== focusRevisionKey(startingFocus))
        .map((focus) => Object.freeze({
          effectiveFromDate: focus.tradingDate,
          tradingDate: focus.tradingDate,
          revisionNumber: focus.revisionNumber,
          text: focus.currentFocuses,
        })),
    ];
    const days = reflection.days
      .filter((day) => day.date >= period.startDate && day.date <= period.endDate)
      .map((day) => {
        const dailyNote = this.annotations.readDailyNote(account, day.date);
        const roundTripIds = day.trades.map((trade) => trade.roundTripId);
        const notesByRoundTrip = this.annotations.readRoundTripNotes(account, roundTripIds);
        const tagsByRoundTrip = this.annotations.listTagsForRoundTrips(account, roundTripIds);
        return Object.freeze({
          date: day.date,
          reviewed: this.tradingDayReviews.read(account, day.date)?.status === "reviewed",
          netPnlDecimal: day.netPnlDecimal,
          ruleReviews: day.ruleReviews,
          notes: dailyNote ? Object.freeze({
            whatWorked: dailyNote.whatWorked,
            whatNeedsWork: dailyNote.whatNeedsWork,
            technicalRecap: dailyNote.technicalRecap,
            anythingElse: dailyNote.anythingElse,
          }) : null,
          trades: Object.freeze(day.trades.map((trade) => Object.freeze({
            ticker: trade.symbol,
            direction: trade.direction,
            openedAtUtc: trade.openedAtUtc,
            closedAtUtc: trade.closedAtUtc,
            executionCount: null,
            realizedGrossPnlDecimal: null,
            holdingDurationMilliseconds: holdingDurationMilliseconds(
              trade.openedAtUtc,
              trade.closedAtUtc,
            ),
            tradingSession: null,
            netPnlDecimal: trade.netPnlDecimal,
            ruleReviews: trade.ruleReviews,
            note: notesByRoundTrip[trade.roundTripId]?.tradeNote || null,
            tags: Object.freeze(
              (tagsByRoundTrip[trade.roundTripId] ?? [])
                .map((tag) => tag.name)
                .sort((left, right) => left.localeCompare(right)),
            ),
          }))),
        });
      });
    const trades = days.flatMap((day) => day.trades);
    const readyPnl = trades.map((trade) => trade.netPnlDecimal);
    const eligibleOutcomes = readyPnl.filter((value): value is string => value !== null);
    const wins = eligibleOutcomes.filter((value) =>
      compareExactDecimals(value, "0") > 0).length;
    const issuedWeeklyReviews = this.reviews.listIssuedWeeklyReviews(scope)
      .filter((review) => review.weekStartDate >= period.startDate &&
        review.weekEndDate <= period.endDate)
      .map((review) => Object.freeze({
        weekStartDate: review.weekStartDate,
        weekEndDate: review.weekEndDate,
        weeklyReview: review.output.weeklyReview,
        whatImproved: review.output.whatImproved,
        whatHeldYouBack: review.output.whatHeldYouBack,
        focusFollowThrough: review.output.focusFollowThrough,
        nextWeekFocuses: Object.freeze([...review.output.nextWeekFocuses]),
        incompleteRecord: review.output.incompleteRecord,
      }));
    return Object.freeze({
      contractVersion: COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
      month: Object.freeze({
        startDate: period.startDate,
        endDate: period.endDate,
        periodCoverage: period.periodCoverage,
        timezone: reflection.timezone,
        currency: reflection.currency,
      }),
      coverage: Object.freeze({
        periodReadyClosedCount: trades.length,
        accountLegitimateOpenCount: reflection.coverage.legitimateOpenCount,
        accountNeedsDecisionCount: reflection.coverage.needsDecisionCount,
        accountPendingDataDecisionCount: reflection.summary.accountPendingDataDecisionCount,
      }),
      summary: Object.freeze({
        tradingDayCount: days.length,
        readyClosedTradeCount: trades.length,
        netPnlDecimal: addNullableDecimals(readyPnl),
        winRatePercentDecimal: eligibleOutcomes.length === 0
          ? null
          : percentageExactDecimals(String(wins), String(eligibleOutcomes.length))
            .roundedDecimal,
      }),
      // Monthly issuance/read storage has no account-scoped preceding-month
      // reader yet, so prior context remains explicitly unavailable.
      priorMonthlyReview: null,
      issuedWeeklyReviews: Object.freeze(issuedWeeklyReviews),
      currentFocuses: Object.freeze(currentFocuses),
      days: Object.freeze(days),
    });
  }
}
