import "server-only";

import type Database from "better-sqlite3";

import { narrowWorkspaceAccessToAccount, type WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";

type WorkspaceRuleOutcome = Readonly<{
  ruleId: string;
  ruleTitle: string;
  status: "followed" | "broken";
}>;

export type WorkspaceReviewSummary = Readonly<{
  currentFocuses: string | null;
  focusRules: readonly Readonly<{
    ruleId: string;
    title: string;
    statement: string;
    reviewScope: "day" | "trade" | "both";
  }>[];
  previousReview: Readonly<{
    date: string;
    currency: string | null;
    netPnlDecimal: string | null;
    tradeCount: number;
    dayRuleOutcomes: readonly WorkspaceRuleOutcome[];
    trades: readonly Readonly<{
      roundTripId: string;
      symbol: string;
      direction: "long" | "short";
      netPnlDecimal: string | null;
      ruleOutcomes: readonly WorkspaceRuleOutcome[];
    }>[];
  }> | null;
}>;

function easternTradingDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function namedOutcomes(
  ruleNames: ReadonlyMap<string, string>,
  reviews: readonly Readonly<{
    ruleId: string;
    status: "followed" | "broken" | "not_reviewed";
  }>[],
): readonly WorkspaceRuleOutcome[] {
  return Object.freeze(reviews.flatMap((review) => {
    if (review.status === "not_reviewed") return [];
    const ruleTitle = ruleNames.get(review.ruleId);
    return ruleTitle ? [Object.freeze({
      ruleId: review.ruleId,
      ruleTitle,
      status: review.status,
    })] : [];
  }));
}

export function readWorkspaceReviewSummary(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  now = new Date(),
  dashboard?: Pick<JournalDashboardReadModelService, "getTradingDay">,
): WorkspaceReviewSummary {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  const account = narrowWorkspaceAccessToAccount(scope, accountId);
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  const rules = annotations.listRules(account);
  const ruleNames = new Map(rules.map((rule) => [rule.ruleId, rule.title]));
  const currentDate = easternTradingDate(now);
  const currentFocuses = annotations.readCurrentFocus(account, currentDate).trim() || null;
  const focusRules = Object.freeze(rules
    .filter((rule) => rule.lifecycleState === "active" && rule.isFocus)
    .map((rule) => Object.freeze({
      ruleId: rule.ruleId,
      title: rule.title,
      statement: rule.statement,
      reviewScope: rule.reviewScope,
    })));
  const previousReview = new JournalTradingDayReviewService(database)
    .latestReviewedBefore(account, currentDate);
  if (!previousReview) {
    return Object.freeze({ currentFocuses, focusRules, previousReview: null });
  }

  const facts = dashboard ? null : new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database),
  );
  const tradingDay = (dashboard ?? new JournalDashboardReadModelService(facts!)).getTradingDay(scope, {
    requestedDate: previousReview.tradingDate,
    currency: null,
  });
  const tradingDayId = annotations.resolveTradingDayId(account, previousReview.tradingDate);
  const trades = tradingDay.tickers.flatMap((ticker) => ticker.roundTrips);
  const reviews = tradingDayId
    ? annotations.listRuleReviews(account, {
      roundTripIds: trades.map((trade) => trade.roundTripId),
      tradingDayId,
    })
    : Object.freeze([]);
  const dayRuleOutcomes = namedOutcomes(
    ruleNames,
    reviews.filter((review) => review.targetKind === "trading_day"),
  );
  return Object.freeze({
    currentFocuses,
    focusRules,
    previousReview: Object.freeze({
      date: previousReview.tradingDate,
      currency: tradingDay.currency,
      netPnlDecimal: tradingDay.netPnlDecimal,
      tradeCount: trades.length,
      dayRuleOutcomes,
      trades: Object.freeze(trades.map((trade) => Object.freeze({
        roundTripId: trade.roundTripId,
        symbol: trade.symbol,
        direction: trade.direction,
        netPnlDecimal: trade.netPnlDecimal,
        ruleOutcomes: namedOutcomes(
          ruleNames,
          reviews.filter((review) =>
            review.targetKind === "round_trip" && review.roundTripId === trade.roundTripId),
        ),
      }))),
    }),
  });
}
