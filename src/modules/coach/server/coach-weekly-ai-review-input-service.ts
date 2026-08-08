import { createHash } from "node:crypto";

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
  COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
  COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
  type CoachAiReviewCarryForwardEvidenceBundleV2,
  type CoachAiReviewPriorIssuedReviewV2,
  type CoachPeriodicAiReviewInputV2,
  type CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import { CoachReflectionService } from "./coach-reflection-service";
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

function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("TRADERLINK_COACH_REVIEW_INVALID_PERIOD");
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addNullableDecimalsV2(values: readonly (string | null)[]): string | null {
  if (values.length === 0 || values.some((value) => value === null)) return null;
  return values.reduce<string>((total, value) => addExactDecimals(total, value!), "0");
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function ruleCounts(
  reviews: readonly Readonly<{ status: "followed" | "broken" | "not_reviewed" }>[],
) {
  return Object.freeze({
    followed: reviews.filter((review) => review.status === "followed").length,
    broken: reviews.filter((review) => review.status === "broken").length,
    notReviewed: reviews.filter((review) => review.status === "not_reviewed").length,
  });
}

function dailyReflectionEvidenceRef(input: Readonly<{
  reviewMarketDate: string;
  reviewedStatusRevision: number;
  dailyNote: Readonly<{ dailyNoteId: string; revision: number }> | null;
  tradeNotes: readonly Readonly<{
    roundTripId: string;
    roundTripNoteId: string;
    revision: number;
  }>[];
}>): string {
  const digest = createHash("sha256").update(`${JSON.stringify({
    contract: "traderlink_daily_reflection_evidence_v1",
    reviewMarketDate: input.reviewMarketDate,
    reviewedStatusRevision: input.reviewedStatusRevision,
    dailyNote: input.dailyNote,
    tradeNotes: [...input.tradeNotes].sort((left, right) =>
      left.roundTripId.localeCompare(right.roundTripId)),
  })}\n`, "utf8").digest("hex");
  return `daily_reflection_sha256:${digest}`;
}

export type CoachPeriodicAiReviewBuildRequestV2 = Readonly<{
  period: Omit<CoachPeriodicAiReviewInputV2["period"], "currency">;
  reflectionEligibilityStartDate?: string;
  carryForwardEvidenceBundles?: readonly CoachAiReviewCarryForwardEvidenceBundleV2[];
  priorIssuedReview?: CoachAiReviewPriorIssuedReviewV2 | null;
  limitationReasonCodes?: readonly string[];
}>;

export class CoachWeeklyAiReviewInputService {
  constructor(
    private readonly reflections: CoachReflectionService,
    private readonly annotations: JournalAnnotationService,
    private readonly tradingDayReviews: JournalTradingDayReviewService,
    private readonly reviewCalendar: CoachUsEquitiesReviewCalendarService =
      new CoachUsEquitiesReviewCalendarService(),
  ) {}

  read(
    scope: WorkspaceAccessScope,
    anchorDate: string,
  ): CoachWeeklyAiReviewInput {
    const reflection = this.reflections.read(scope, {
      period: "weekly",
      anchorDate,
      currency: null,
    });
    const accountId = scope.activeAccountId;
    if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const focusRevisions = this.annotations.listDailyFocusRevisions(
      account,
      "0000-01-01",
      reflection.endDate,
    );
    const startingFocus = focusRevisions
      .filter((focus) => focus.tradingDate < reflection.startDate)
      .at(-1) ?? null;
    const datedFocusRevisions = focusRevisions.filter((focus) =>
      focus.tradingDate >= reflection.startDate);
    const currentFocuses = [
      ...(startingFocus ? [Object.freeze({
        effectiveFromDate: reflection.startDate,
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
    const days = reflection.days.map((day) => {
      const dailyNote = this.annotations.readDailyNote(account, day.date);
      const notesByRoundTrip = this.annotations.readRoundTripNotes(
        account,
        day.trades.map((trade) => trade.roundTripId),
      );
      const tagsByRoundTrip = this.annotations.listTagsForRoundTrips(
        account,
        day.trades.map((trade) => trade.roundTripId),
      );
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
          // The current Journal reflection read exposes timestamps but not the
          // underlying execution allocations, gross P/L, or market session.
          // Keep those facts unavailable instead of reconstructing them here.
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
    return Object.freeze({
      contractVersion: COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION,
      week: Object.freeze({
        startDate: reflection.startDate,
        endDate: reflection.endDate,
        timezone: reflection.timezone,
        currency: reflection.currency,
      }),
      coverage: Object.freeze({
        weekReadyClosedCount: days.reduce((count, day) => count + day.trades.length, 0),
        accountLegitimateOpenCount: reflection.coverage.legitimateOpenCount,
        accountNeedsDecisionCount: reflection.coverage.needsDecisionCount,
        accountPendingDataDecisionCount: reflection.summary.accountPendingDataDecisionCount,
      }),
      summary: Object.freeze({
        tradingDayCount: reflection.summary.tradingDayCount,
        readyClosedTradeCount: reflection.summary.readyClosedTradeCount,
        netPnlDecimal: reflection.summary.netPnlDecimal,
        winRatePercentDecimal: reflection.summary.winRatePercentDecimal,
      }),
      priorReview: null,
      currentFocuses: Object.freeze(currentFocuses),
      days: Object.freeze(days),
    });
  }

  readPeriodicV2(
    scope: WorkspaceAccessScope,
    request: CoachPeriodicAiReviewBuildRequestV2,
  ): CoachPeriodicAiReviewInputV2 {
    const accountId = scope.activeAccountId;
    if (!accountId) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const metadata = this.reviewCalendar.metadata();
    const expectedCohortCount = request.period.cadence === "weekly" ? 1 : 2;
    if (
      request.period.calendarTimezone !== EASTERN_TIMEZONE ||
      request.period.calendarId !== metadata.calendarId ||
      request.period.calendarEvidenceDigestSha256 !== metadata.evidenceDigestSha256 ||
      request.period.cohorts.length !== expectedCohortCount
    ) {
      throw new Error("TRADERLINK_COACH_REVIEW_CALENDAR_MISMATCH");
    }

    const authoritativeCohorts = request.period.cohorts.map((cohort, index) => {
      const authoritative = this.reviewCalendar.cohortStarting(cohort.mondayDate);
      if (
        cohort.fridayDate !== authoritative.fridayDate ||
        cohort.finalOpenSessionDate !== authoritative.finalOpenSessionDate ||
        cohort.sealedAtUtc !== authoritative.sealedAtUtc ||
        !sameStrings(cohort.openSessionDates, authoritative.openSessionDates) ||
        (index > 0 && cohort.mondayDate !==
          shiftIsoDate(request.period.cohorts[index - 1]!.mondayDate, 7))
      ) throw new Error("TRADERLINK_COACH_REVIEW_CALENDAR_MISMATCH");
      return authoritative;
    });
    if (
      request.period.startDate !== authoritativeCohorts[0]?.mondayDate ||
      request.period.endDate !== authoritativeCohorts.at(-1)?.fridayDate
    ) throw new Error("TRADERLINK_COACH_REVIEW_INVALID_PERIOD");

    const reflectionModels: ReturnType<CoachReflectionService["read"]>[] = [];
    for (const cohort of authoritativeCohorts) {
      const reflection = this.reflections.read(scope, {
        period: "weekly",
        anchorDate: cohort.mondayDate,
        currency: reflectionModels[0]?.currency ?? null,
      });
      if (
        reflection.timezone !== EASTERN_TIMEZONE ||
        reflection.startDate !== cohort.mondayDate ||
        (reflectionModels.length > 0 &&
          reflection.currency !== reflectionModels[0]!.currency)
      ) throw new Error("TRADERLINK_COACH_REVIEW_MARKET_DATE_MISMATCH");
      reflectionModels.push(reflection);
    }
    const dayByDate = new Map<string, ReturnType<CoachReflectionService["read"]>["days"][number]>();
    for (const day of reflectionModels.flatMap((reflection) => reflection.days)) {
      if (day.date < request.period.startDate || day.date > request.period.endDate) continue;
      if (dayByDate.has(day.date)) throw new Error("TRADERLINK_COACH_REVIEW_DUPLICATE_DAY");
      dayByDate.set(day.date, day);
    }

    const expectedDates = authoritativeCohorts.flatMap((cohort) =>
      Array.from({ length: 5 }, (_, index) => shiftIsoDate(cohort.mondayDate, index)));
    const completedDailyReflections: CoachPeriodicAiReviewInputV2["completedDailyReflections"][number][] = [];
    const reflectionCoverage: CoachPeriodicAiReviewInputV2["reflectionCoverage"][number][] = [];
    const factDays: CoachPeriodicAiReviewInputV2["reviewPeriodMarketFacts"]["days"][number][] = [];
    const limitations = new Set(request.limitationReasonCodes ?? []);

    for (const reviewMarketDate of expectedDates) {
      const session = this.reviewCalendar.session(reviewMarketDate);
      const day = dayByDate.get(reviewMarketDate);
      const reviewRecord = this.tradingDayReviews.read(account, reviewMarketDate);
      if (session.state === "closed") {
        if (day?.trades.length || reviewRecord) {
          throw new Error("TRADERLINK_COACH_REVIEW_CLOSED_SESSION_EVIDENCE");
        }
        reflectionCoverage.push(Object.freeze({
          reviewMarketDate,
          marketSessionState: "closed",
          reflectionState: "market_closed",
          noTradeReview: null,
        }));
        continue;
      }

      const roundTripIds = day?.trades.map((trade) => trade.roundTripId) ?? [];
      const tradingDayId = this.annotations.resolveTradingDayId(account, reviewMarketDate);
      const recordedRuleReviews = tradingDayId
        ? this.annotations.listRuleReviews(account, { tradingDayId, roundTripIds })
        : Object.freeze([]);
      const dayRuleCounts = day?.ruleReviews ?? ruleCounts(recordedRuleReviews.filter((review) =>
        review.targetKind === "trading_day"));
      const trades = Object.freeze((day?.trades ?? []).map((trade) => {
        const closedAt = new Date(trade.closedAtUtc);
        if (!Number.isFinite(closedAt.getTime()) ||
            this.reviewCalendar.marketDateAt(closedAt) !== reviewMarketDate) {
          throw new Error("TRADERLINK_COACH_REVIEW_MARKET_DATE_MISMATCH");
        }
        return Object.freeze({
          ticker: trade.symbol,
          direction: trade.direction,
          openedAtUtc: trade.openedAtUtc,
          closedAtUtc: trade.closedAtUtc,
          executionCount: null,
          realizedGrossPnlDecimal: null,
          netPnlDecimal: trade.netPnlDecimal,
          holdingDurationMilliseconds: holdingDurationMilliseconds(
            trade.openedAtUtc,
            trade.closedAtUtc,
          ),
          tradingSession: null,
          ruleReviews: trade.ruleReviews,
          tags: Object.freeze([...trade.tagNames].sort((left, right) =>
            left.localeCompare(right))),
        });
      }));
      if (day || dayRuleCounts.followed + dayRuleCounts.broken + dayRuleCounts.notReviewed > 0) {
        factDays.push(Object.freeze({
          reviewMarketDate,
          marketSessionState: "open",
          marketSessionKind: session.sessionKind,
          readyClosedTradeCount: trades.length,
          netPnlDecimal: day?.netPnlDecimal ?? null,
          ruleReviews: dayRuleCounts,
          trades,
        }));
      }

      const reflectionState = reviewRecord?.status === "reviewed"
        ? "completed" as const
        : reviewRecord?.status === "incomplete"
          ? "incomplete" as const
          : "not_created" as const;
      reflectionCoverage.push(Object.freeze({
        reviewMarketDate,
        marketSessionState: "open",
        reflectionState,
        noTradeReview: null,
      }));
      if (reflectionState !== "completed") {
        limitations.add("incomplete_daily_reflection_coverage");
        continue;
      }
      if (request.reflectionEligibilityStartDate &&
          reviewMarketDate < request.reflectionEligibilityStartDate) {
        limitations.add("pre_enable_reflection_excluded");
        continue;
      }
      if (!day || day.trades.length === 0) {
        limitations.add("no_trade_review_signal_unavailable");
      }

      const dailyNote = this.annotations.readDailyNote(account, reviewMarketDate);
      const notesByRoundTrip = this.annotations.readRoundTripNotes(account, roundTripIds);
      const evidenceTradeNotes = Object.entries(notesByRoundTrip).map(([roundTripId, note]) =>
        Object.freeze({
          roundTripId,
          roundTripNoteId: note.roundTripNoteId,
          revision: note.revision,
        }));
      const evidenceRef = dailyReflectionEvidenceRef({
        reviewMarketDate,
        reviewedStatusRevision: reviewRecord!.revision,
        dailyNote: dailyNote ? Object.freeze({
          dailyNoteId: dailyNote.dailyNoteId,
          revision: dailyNote.revision,
        }) : null,
        tradeNotes: evidenceTradeNotes,
      });
      completedDailyReflections.push(Object.freeze({
        evidenceRef,
        reviewMarketDate,
        reviewedStatusRevision: reviewRecord!.revision,
        dailyNotes: dailyNote ? Object.freeze({
          whatWorked: dailyNote.whatWorked,
          whatNeedsWork: dailyNote.whatNeedsWork,
          technicalRecap: dailyNote.technicalRecap,
          anythingElse: dailyNote.anythingElse,
        }) : null,
        tradeNotes: Object.freeze((day?.trades ?? []).flatMap((trade) => {
          const note = notesByRoundTrip[trade.roundTripId]?.tradeNote.trim();
          return note ? [Object.freeze({ ticker: trade.symbol, note })] : [];
        })),
      }));
    }

    const allTrades = factDays.flatMap((day) => day.trades);
    const pnlValues = allTrades.map((trade) => trade.netPnlDecimal);
    const eligibleOutcomes = pnlValues.filter((value): value is string => value !== null);
    const wins = eligibleOutcomes.filter((value) => compareExactDecimals(value, "0") > 0).length;
    const accountCoverage = reflectionModels.at(-1)!;
    if (accountCoverage.coverage.legitimateOpenCount > 0) {
      limitations.add("legitimate_open_positions_excluded");
    }
    if (accountCoverage.coverage.needsDecisionCount > 0 ||
        accountCoverage.summary.accountPendingDataDecisionCount > 0) {
      limitations.add("pending_data_decisions_excluded");
    }
    if (allTrades.length > 0) limitations.add("detailed_execution_facts_unavailable");

    const focusRevisions = this.annotations.listDailyFocusRevisions(
      account,
      "0000-01-01",
      request.period.endDate,
    );
    const startingFocus = focusRevisions
      .filter((focus) => focus.tradingDate < request.period.startDate)
      .at(-1) ?? null;
    const datedFocusRevisions = focusRevisions.filter((focus) =>
      focus.tradingDate >= request.period.startDate);
    const currentFocuses = [
      ...(startingFocus ? [Object.freeze({
        effectiveFromDate: request.period.startDate,
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
    const limitationReasonCodes = Object.freeze([...limitations]
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .sort((left, right) => left.localeCompare(right)));

    return Object.freeze({
      contractVersion: COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
      period: Object.freeze({
        ...request.period,
        currency: reflectionModels[0]?.currency ?? null,
        cohorts: Object.freeze(authoritativeCohorts.map((cohort) => Object.freeze({
          mondayDate: cohort.mondayDate,
          fridayDate: cohort.fridayDate,
          openSessionDates: Object.freeze([...cohort.openSessionDates]),
          finalOpenSessionDate: cohort.finalOpenSessionDate,
          sealedAtUtc: cohort.sealedAtUtc,
        }))),
      }),
      reviewPeriodMarketFacts: Object.freeze({
        tradingDayCount: factDays.filter((day) => day.readyClosedTradeCount > 0).length,
        readyClosedTradeCount: allTrades.length,
        netPnlDecimal: addNullableDecimalsV2(pnlValues),
        winRatePercentDecimal: eligibleOutcomes.length === 0
          ? null
          : percentageExactDecimals(String(wins), String(eligibleOutcomes.length)).roundedDecimal,
        accountLegitimateOpenCount: accountCoverage.coverage.legitimateOpenCount,
        accountNeedsDecisionCount: accountCoverage.coverage.needsDecisionCount,
        accountPendingDataDecisionCount:
          accountCoverage.summary.accountPendingDataDecisionCount,
        days: Object.freeze(factDays),
      }),
      completedDailyReflections: Object.freeze(completedDailyReflections),
      reflectionCoverage: Object.freeze(reflectionCoverage),
      carryForwardEvidenceBundles: Object.freeze([
        ...(request.carryForwardEvidenceBundles ?? []),
      ]),
      priorIssuedReview: request.priorIssuedReview ?? null,
      currentFocuses: Object.freeze(currentFocuses),
      coverageNotice: Object.freeze({
        limitationReasonCodes,
        incompleteRecordRequired: limitationReasonCodes.length > 0,
      }),
    });
  }
}
