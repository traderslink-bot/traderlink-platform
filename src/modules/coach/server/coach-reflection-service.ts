import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import type { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import type { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import {
  addExactDecimals,
  compareExactDecimals,
  percentageExactDecimals,
} from "@/src/modules/journal-analytics/server/exact-analytics-math";

import {
  COACH_REFLECTION_CONTRACT_VERSION,
  type CoachReflectionDay,
  type CoachReflectionPeriod,
  type CoachReflectionPrompt,
  type CoachReflectionReadModel,
  type CoachReflectionRuleReviewCounts,
  type CoachReflectionTrade,
} from "../contracts/reflection-loop-contracts";
import type { CoachReflectionRequest } from "./coach-reflection-request";

const EMPTY_REVIEWS: CoachReflectionRuleReviewCounts = Object.freeze({
  followed: 0,
  broken: 0,
  notReviewed: 0,
});

function emptyCalendarInput(currency: string | null) {
  return Object.freeze({
    currency,
    startDate: null,
    endDate: null,
    symbol: null,
    direction: null,
    performance: null,
    pnlBand: null,
    tradeCountBand: null,
    session: null,
  });
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

function shiftDate(value: string, days: number): string {
  if (!validDate(value)) throw new Error("TRADERLINK_COACH_REFLECTION_INVALID_DATE");
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function coachReflectionPeriodBounds(
  period: CoachReflectionPeriod,
  anchorDate: string,
): Readonly<{ startDate: string; endDate: string }> {
  if (!validDate(anchorDate)) {
    throw new Error("TRADERLINK_COACH_REFLECTION_INVALID_DATE");
  }
  if (period === "daily") {
    return Object.freeze({ startDate: anchorDate, endDate: anchorDate });
  }
  const anchor = new Date(`${anchorDate}T12:00:00.000Z`);
  if (period === "weekly") {
    const weekday = anchor.getUTCDay();
    const sinceMonday = weekday === 0 ? 6 : weekday - 1;
    const startDate = shiftDate(anchorDate, -sinceMonday);
    return Object.freeze({ startDate, endDate: shiftDate(startDate, 6) });
  }
  const startDate = `${anchorDate.slice(0, 7)}-01`;
  const nextMonth = new Date(Date.UTC(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + 1,
    1,
    12,
  ));
  nextMonth.setUTCDate(0);
  return Object.freeze({
    startDate,
    endDate: nextMonth.toISOString().slice(0, 10),
  });
}

function reviewCounts(
  reviews: readonly Readonly<{ status: "followed" | "broken" | "not_reviewed" }>[],
): CoachReflectionRuleReviewCounts {
  return Object.freeze({
    followed: reviews.filter((review) => review.status === "followed").length,
    broken: reviews.filter((review) => review.status === "broken").length,
    notReviewed: reviews.filter((review) => review.status === "not_reviewed").length,
  });
}

function addReviewCounts(
  left: CoachReflectionRuleReviewCounts,
  right: CoachReflectionRuleReviewCounts,
): CoachReflectionRuleReviewCounts {
  return Object.freeze({
    followed: left.followed + right.followed,
    broken: left.broken + right.broken,
    notReviewed: left.notReviewed + right.notReviewed,
  });
}

function addNullableDecimals(values: readonly (string | null)[]): string | null {
  if (values.some((value) => value === null)) return null;
  return values.reduce<string>((total, value) =>
    addExactDecimals(total, value!), "0");
}

function prompts(input: Readonly<{
  pendingDecisions: number;
  daysWithoutNotes: number;
  tradesWithoutNotes: number;
  activeRules: number;
  focusRules: number;
  recordedRuleReviews: number;
}>): readonly CoachReflectionPrompt[] {
  const result: CoachReflectionPrompt[] = [];
  if (input.pendingDecisions > 0) {
    result.push(Object.freeze({
      code: "resolve_data_decisions",
      title: "Resolve factual data decisions",
      description: "Review incomplete execution or position facts before relying on analytics that need them.",
      href: "/data-decisions",
      count: input.pendingDecisions,
    }));
  }
  if (input.daysWithoutNotes > 0) {
    result.push(Object.freeze({
      code: "review_trading_days",
      title: "Finish trading-day reflections",
      description: "Record only what you remember and know about these trading days.",
      href: "/trade-tracker",
      count: input.daysWithoutNotes,
    }));
  }
  if (input.tradesWithoutNotes > 0) {
    result.push(Object.freeze({
      code: "review_round_trips",
      title: "Review completed trades",
      description: "Add trader-authored notes or tags to the stable round trips you choose to review.",
      href: "/trades/roundtrips",
      count: input.tradesWithoutNotes,
    }));
  }
  if (input.activeRules > 0 && input.recordedRuleReviews === 0) {
    result.push(Object.freeze({
      code: "review_trading_rules",
      title: "Review active trading rules",
      description: "Record whether your active rules were followed, broken or not reviewed.",
      href: "/rules",
      count: input.activeRules,
    }));
  }
  if (input.focusRules === 0) {
    result.push(Object.freeze({
      code: "choose_focus_rule",
      title: "Choose a focus rule",
      description: "Select the rule you want to keep most visible during the next trading session.",
      href: "/rules",
      count: 0,
    }));
  }
  return Object.freeze(result);
}

export class CoachReflectionService {
  constructor(
    private readonly dashboard: JournalDashboardReadModelService,
    private readonly annotations: JournalAnnotationService,
    private readonly products: JournalProductReadService,
  ) {}

  read(
    scope: WorkspaceAccessScope,
    request: CoachReflectionRequest,
  ): CoachReflectionReadModel {
    const accountId = scope.activeAccountId;
    if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
      throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const account = narrowWorkspaceAccessToAccount(scope, accountId);
    const available = this.dashboard.getCalendar(
      scope,
      emptyCalendarInput(request.currency),
    );
    const anchorDate = request.anchorDate ?? available.maximumDate;
    const bounds = coachReflectionPeriodBounds(request.period, anchorDate);
    const calendar = this.dashboard.getCalendar(scope, Object.freeze({
      ...emptyCalendarInput(available.currency),
      startDate: bounds.startDate,
      endDate: bounds.endDate,
    }));
    const activeRules = this.annotations.listRules(account)
      .filter((rule) => rule.lifecycleState === "active");
    let recordedRuleReviews = EMPTY_REVIEWS;
    let factSetRevisionSha256: string | null = null;
    const days = calendar.days.map((calendarDay): CoachReflectionDay => {
      const day = this.dashboard.getTradingDay(scope, {
        requestedDate: calendarDay.date,
        currency: calendar.currency,
      });
      factSetRevisionSha256 = day.factSetRevisionSha256;
      const roundTrips = day.tickers.flatMap((ticker) => ticker.roundTrips);
      const roundTripIds = roundTrips.map((trade) => trade.roundTripId);
      const tradingDayId = this.annotations.resolveTradingDayId(
        account,
        calendarDay.date,
      );
      const reviews = tradingDayId
        ? this.annotations.listRuleReviews(account, { tradingDayId, roundTripIds })
        : Object.freeze([]);
      const dayReviews = reviewCounts(reviews.filter((review) =>
        review.targetKind === "trading_day"));
      recordedRuleReviews = addReviewCounts(
        recordedRuleReviews,
        reviewCounts(reviews),
      );
      const tagsByRoundTrip = this.annotations.listTagsForRoundTrips(
        account,
        roundTripIds,
      );
      const notesByRoundTrip = this.annotations.readRoundTripNotes(
        account,
        roundTripIds,
      );
      const trades = roundTrips.map((trade): CoachReflectionTrade =>
        Object.freeze({
          roundTripId: trade.roundTripId,
          symbol: trade.symbol,
          direction: trade.direction,
          openedAtUtc: trade.entryAtUtc,
          closedAtUtc: trade.exitAtUtc,
          netPnlDecimal: trade.netPnlDecimal,
          noteSaved: Boolean(notesByRoundTrip[trade.roundTripId]),
          tagNames: Object.freeze((tagsByRoundTrip[trade.roundTripId] ?? [])
            .map((tag) => tag.name)),
          ruleReviews: reviewCounts(reviews.filter((review) =>
            review.targetKind === "round_trip" &&
            review.roundTripId === trade.roundTripId)),
        }));
      return Object.freeze({
        date: calendarDay.date,
        currency: calendar.currency ?? "",
        netPnlDecimal: calendarDay.pnlDecimal,
        tradeCount: trades.length,
        dailyNoteSaved: Boolean(this.annotations.readDailyNote(
          account,
          calendarDay.date,
        )),
        ruleReviews: dayReviews,
        trades: Object.freeze(trades),
      });
    });
    const trades = days.flatMap((day) => day.trades);
    const readyPnl = trades.map((trade) => trade.netPnlDecimal);
    const eligibleOutcomes = readyPnl.filter((value): value is string => value !== null);
    const wins = eligibleOutcomes.filter((value) =>
      compareExactDecimals(value, "0") > 0).length;
    const decisions = this.products.listDataDecisions(account);
    const focusRules = activeRules.filter((rule) => rule.isFocus).map((rule) =>
      Object.freeze({
        ruleId: rule.ruleId,
        title: rule.title,
        statement: rule.statement,
        reviewScope: rule.reviewScope,
      }));
    const dailyNotesSavedCount = days.filter((day) => day.dailyNoteSaved).length;
    const roundTripNotesSavedCount = trades.filter((trade) => trade.noteSaved).length;
    const taggedTradeCount = trades.filter((trade) => trade.tagNames.length > 0).length;
    const recordedRuleReviewCount = recordedRuleReviews.followed +
      recordedRuleReviews.broken + recordedRuleReviews.notReviewed;
    return Object.freeze({
      contractVersion: COACH_REFLECTION_CONTRACT_VERSION,
      source: "journal_facts",
      state: days.length > 0 ? "ready" : "empty",
      period: request.period,
      anchorDate,
      ...bounds,
      timezone: calendar.timezone,
      currency: calendar.currency,
      availableCurrencies: calendar.availableCurrencies,
      summary: Object.freeze({
        tradingDayCount: days.length,
        readyClosedTradeCount: trades.length,
        netPnlDecimal: addNullableDecimals(readyPnl),
        winRatePercentDecimal: eligibleOutcomes.length === 0
          ? null
          : percentageExactDecimals(String(wins), String(eligibleOutcomes.length))
            .roundedDecimal,
        dailyNotesSavedCount,
        roundTripNotesSavedCount,
        taggedTradeCount,
        ruleReviews: recordedRuleReviews,
        activeRuleCount: activeRules.length,
        focusRuleCount: focusRules.length,
        accountPendingDataDecisionCount: decisions.pending.length,
      }),
      coverage: Object.freeze({
        ...calendar.coverage,
        factSetRevisionSha256,
      }),
      focusRules: Object.freeze(focusRules),
      prompts: prompts({
        pendingDecisions: decisions.pending.length,
        daysWithoutNotes: days.length - dailyNotesSavedCount,
        tradesWithoutNotes: trades.length - roundTripNotesSavedCount,
        activeRules: activeRules.length,
        focusRules: focusRules.length,
        recordedRuleReviews: recordedRuleReviewCount,
      }),
      days: Object.freeze(days),
    });
  }
}
