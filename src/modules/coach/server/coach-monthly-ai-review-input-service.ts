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
  COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2,
  type CoachMonthlyAiReviewInputV2,
  type CoachMonthlyAiReviewInput,
  type CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import type { CoachAiReviewDayMarketFactsV2 } from
  "../contracts/weekly-ai-review-input-contracts";
import { coachReflectionPeriodBounds, CoachReflectionService } from "./coach-reflection-service";
import type { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";

const EASTERN_TIMEZONE = "America/New_York" as const;

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

function addNullableDecimalsV2(values: readonly (string | null)[]): string | null {
  if (values.length === 0 || values.some((value) => value === null)) return null;
  return values.reduce<string>((total, value) => addExactDecimals(total, value!), "0");
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_PERIOD");
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type CoachMonthlyAiReviewAssemblyRequestV2 = Readonly<{
  calendarMonth: CoachMonthlyAiReviewInputV2["calendarMonth"];
  calendarMonthFactDays: readonly CoachAiReviewDayMarketFactsV2[];
  accountCoverage: Readonly<{
    legitimateOpenCount: number;
    needsDecisionCount: number;
    pendingDataDecisionCount: number;
  }>;
  reviewNarrativeContext: CoachMonthlyAiReviewInputV2["reviewNarrativeContext"];
  rawReflectionContext: CoachMonthlyAiReviewInputV2["rawReflectionContext"];
  reflectionCoverage: CoachMonthlyAiReviewInputV2["reflectionCoverage"];
  priorMonthlyReview: CoachMonthlyAiReviewInputV2["priorMonthlyReview"];
  currentFocuses: CoachMonthlyAiReviewInputV2["currentFocuses"];
  limitationReasonCodes?: readonly string[];
  calendar?: CoachUsEquitiesReviewCalendarService;
}>;

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

/**
 * Assembles the immutable monthly provider input from preselected,
 * account-scoped evidence. Only raw fact days inside the exact calendar-month
 * coverage can affect monthly statistics. Weekly/two-week prose and raw
 * reflections are validated as non-statistical narrative context and are
 * deduplicated by evidence reference.
 */
export function assembleCoachMonthlyAiReviewInputV2(
  request: CoachMonthlyAiReviewAssemblyRequestV2,
): CoachMonthlyAiReviewInputV2 {
  const calendar = request.calendar ?? new CoachUsEquitiesReviewCalendarService();
  const metadata = calendar.metadata();
  const month = request.calendarMonth;
  const exactMonth = coachReflectionPeriodBounds("monthly", month.calendarMonthEndDate);
  const validCoverage = month.coverageStartDate >= month.calendarMonthStartDate &&
    month.coverageStartDate <= month.calendarMonthEndDate &&
    month.coverageEndDate === month.calendarMonthEndDate;
  const expectedCoverage = month.coverageStartDate === month.calendarMonthStartDate
    ? "complete_month"
    : "partial_month";
  if (
    month.calendarMonthStartDate !== exactMonth.startDate ||
    month.calendarMonthEndDate !== exactMonth.endDate ||
    month.periodCoverage !== expectedCoverage ||
    !validCoverage ||
    month.calendarTimezone !== EASTERN_TIMEZONE ||
    month.calendarId !== metadata.calendarId ||
    month.calendarEvidenceDigestSha256 !== metadata.evidenceDigestSha256
  ) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_PERIOD");
  calendar.session(month.calendarMonthEndDate);
  const expectedSchedule = calendar.easternWallClockAtUtc(
    shiftDate(month.calendarMonthEndDate, 1),
    "08:00",
  );
  if (month.scheduledAtUtc !== expectedSchedule) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_SCHEDULE");
  }
  if (month.periodCoverage === "partial_month" && request.priorMonthlyReview) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_PARTIAL_PRIOR_CONTEXT");
  }

  for (const value of Object.values(request.accountCoverage)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_COVERAGE");
    }
  }
  const factDates = new Set<string>();
  const factDays = [...request.calendarMonthFactDays]
    .sort((left, right) => left.reviewMarketDate.localeCompare(right.reviewMarketDate))
    .map((day) => {
      if (
        day.reviewMarketDate < month.coverageStartDate ||
        day.reviewMarketDate > month.coverageEndDate ||
        factDates.has(day.reviewMarketDate)
      ) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_FACT_OUTSIDE_MONTH");
      factDates.add(day.reviewMarketDate);
      const session = calendar.session(day.reviewMarketDate);
      if (day.marketSessionState !== session.state ||
          day.marketSessionKind !== session.sessionKind ||
          day.readyClosedTradeCount !== day.trades.length) {
        throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_FACT_CALENDAR_MISMATCH");
      }
      if (Object.values(day.ruleReviews).some((value) =>
        !Number.isSafeInteger(value) || value < 0)) {
        throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_FACT_TOTAL_MISMATCH");
      }
      if (session.state === "closed" && (
        day.trades.length > 0 || day.netPnlDecimal !== null ||
        day.ruleReviews.followed + day.ruleReviews.broken + day.ruleReviews.notReviewed > 0
      )) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_CLOSED_SESSION_EVIDENCE");
      for (const trade of day.trades) {
        const closedAt = new Date(trade.closedAtUtc);
        if (!Number.isFinite(closedAt.getTime()) ||
            calendar.marketDateAt(closedAt) !== day.reviewMarketDate) {
          throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_FACT_OUTSIDE_MONTH");
        }
      }
      const calculatedDayPnl = addNullableDecimalsV2(
        day.trades.map((trade) => trade.netPnlDecimal),
      );
      const dayPnlMatches = calculatedDayPnl === null || day.netPnlDecimal === null
        ? calculatedDayPnl === day.netPnlDecimal
        : compareExactDecimals(calculatedDayPnl, day.netPnlDecimal) === 0;
      if (!dayPnlMatches) {
        throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_FACT_TOTAL_MISMATCH");
      }
      return Object.freeze({ ...day, trades: Object.freeze([...day.trades]) });
    });

  const ownerMonth = month.calendarMonthStartDate.slice(0, 7);
  const representedEvidenceRefs = new Set<string>();
  const reviewRefs = new Set<string>();
  const reviewNarrativeContext = request.reviewNarrativeContext.map((review) => {
    const periodStart = new Date(`${review.periodStartDate}T12:00:00.000Z`);
    const periodEnd = new Date(`${review.periodEndDate}T12:00:00.000Z`);
    const expectedDays = review.reviewKind === "weekly" ? 4 : 11;
    const elapsedDays = (periodEnd.getTime() - periodStart.getTime()) / 86_400_000;
    if (
      review.narrativeOwnerMonth !== ownerMonth ||
      review.periodEndDate.slice(0, 7) !== ownerMonth ||
      periodStart.getUTCDay() !== 1 || periodEnd.getUTCDay() !== 5 ||
      elapsedDays !== expectedDays || reviewRefs.has(review.reviewRef)
    ) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_NARRATIVE_OWNER_MISMATCH");
    reviewRefs.add(review.reviewRef);
    for (const evidenceRef of review.representedEvidenceRefs) {
      if (representedEvidenceRefs.has(evidenceRef)) {
        throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_DUPLICATE_EVIDENCE");
      }
      representedEvidenceRefs.add(evidenceRef);
    }
    return Object.freeze({
      ...review,
      representedEvidenceRefs: Object.freeze([...review.representedEvidenceRefs]),
      nextPeriodFocuses: Object.freeze([...review.nextPeriodFocuses]),
    });
  });
  const rawEvidenceRefs = new Set<string>();
  const rawReflectionContext = request.rawReflectionContext.map((context) => {
    const evidenceRef = context.reflection.evidenceRef;
    if (
      context.narrativeOwnerMonth !== ownerMonth ||
      context.reflection.reviewMarketDate < context.sourcePeriodStartDate ||
      context.reflection.reviewMarketDate > context.sourcePeriodEndDate ||
      representedEvidenceRefs.has(evidenceRef) || rawEvidenceRefs.has(evidenceRef)
    ) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_DUPLICATE_EVIDENCE");
    rawEvidenceRefs.add(evidenceRef);
    return Object.freeze({
      ...context,
      reflection: Object.freeze({
        ...context.reflection,
        tradeNotes: Object.freeze([...context.reflection.tradeNotes]),
      }),
    });
  });

  const coverageByDate = new Map(request.reflectionCoverage.map((coverage) =>
    [coverage.reviewMarketDate, coverage] as const));
  if (coverageByDate.size !== request.reflectionCoverage.length) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_DUPLICATE_COVERAGE");
  }
  for (
    let date = month.coverageStartDate;
    date <= month.coverageEndDate;
    date = shiftDate(date, 1)
  ) {
    const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const coverage = coverageByDate.get(date);
    if (!coverage) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_MISSING_COVERAGE");
    const session = calendar.session(date);
    if (
      coverage.marketSessionState !== session.state ||
      (session.state === "closed" && coverage.reflectionState !== "market_closed") ||
      (session.state === "open" && coverage.reflectionState === "market_closed")
    ) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_COVERAGE_MISMATCH");
  }
  for (const coverage of request.reflectionCoverage) {
    if (coverage.reviewMarketDate < month.coverageStartDate ||
        coverage.reviewMarketDate > month.coverageEndDate) {
      throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_COVERAGE_MISMATCH");
    }
  }

  const trades = factDays.flatMap((day) => day.trades);
  const pnlValues = trades.map((trade) => trade.netPnlDecimal);
  const eligibleOutcomes = pnlValues.filter((value): value is string => value !== null);
  const wins = eligibleOutcomes.filter((value) => compareExactDecimals(value, "0") > 0).length;
  const limitations = new Set(request.limitationReasonCodes ?? []);
  if (month.periodCoverage === "partial_month") limitations.add("partial_month_coverage");
  if (request.accountCoverage.legitimateOpenCount > 0) {
    limitations.add("legitimate_open_positions_excluded");
  }
  if (request.accountCoverage.needsDecisionCount > 0 ||
      request.accountCoverage.pendingDataDecisionCount > 0) {
    limitations.add("pending_data_decisions_excluded");
  }
  if (trades.some((trade) => trade.executionCount === null ||
      trade.realizedGrossPnlDecimal === null || trade.tradingSession === null)) {
    limitations.add("detailed_execution_facts_unavailable");
  }
  if (request.reflectionCoverage.some((coverage) =>
    coverage.marketSessionState === "open" && coverage.reflectionState !== "completed")) {
    limitations.add("incomplete_daily_reflection_coverage");
  }
  const limitationReasonCodes = Object.freeze([...limitations]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .sort((left, right) => left.localeCompare(right)));

  return Object.freeze({
    contractVersion: COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2,
    calendarMonth: Object.freeze({ ...month }),
    calendarMonthFacts: Object.freeze({
      tradingDayCount: factDays.filter((day) => day.readyClosedTradeCount > 0).length,
      readyClosedTradeCount: trades.length,
      netPnlDecimal: addNullableDecimalsV2(pnlValues),
      winRatePercentDecimal: eligibleOutcomes.length === 0
        ? null
        : percentageExactDecimals(String(wins), String(eligibleOutcomes.length)).roundedDecimal,
      accountLegitimateOpenCount: request.accountCoverage.legitimateOpenCount,
      accountNeedsDecisionCount: request.accountCoverage.needsDecisionCount,
      accountPendingDataDecisionCount: request.accountCoverage.pendingDataDecisionCount,
      days: Object.freeze(factDays),
    }),
    reviewNarrativeContext: Object.freeze(reviewNarrativeContext),
    rawReflectionContext: Object.freeze(rawReflectionContext),
    reflectionCoverage: Object.freeze([...request.reflectionCoverage]),
    priorMonthlyReview: request.priorMonthlyReview,
    currentFocuses: Object.freeze([...request.currentFocuses]),
    coverageNotice: Object.freeze({
      limitationReasonCodes,
      incompleteRecordRequired: limitationReasonCodes.length > 0,
    }),
  });
}
