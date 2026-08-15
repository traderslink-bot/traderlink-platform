import type Database from "better-sqlite3";

import {
  narrowWorkspaceAccessToAccount,
  type AccountScope,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDashboardReadModelService } from
  "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import type { JournalTradeTrackerReadService } from
  "@/src/modules/journal/server/product/journal-trade-tracker-read-service";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatCalendarPeriodRequest,
  type CoachAiChatDashboardContextResponse,
  type CoachAiChatPositionDetailRequest,
  type CoachAiChatPositionListRequest,
  type CoachAiChatTradingDayDetailsRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { CoachAiChatJournalContextService } from "./coach-ai-chat-journal-context-service";
import type { CoachAiChatSavedReviewService } from "./coach-ai-chat-saved-review-service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const TICKER_PATTERN = /^[A-Za-z0-9._-]{1,32}$/u;
const POSITION_REF_PATTERN = /^[0-9a-f]{64}$/u;
const MAX_CALENDAR_DAYS = 62;
const MAX_POSITIONS = 100;

type CalendarReviewRow = Readonly<{
  trading_date: string;
  review_status: "reviewed" | "incomplete";
}>;

type CalendarAnnotationRow = Readonly<{
  trading_date: string;
  normalized_symbol: string;
  note_count: number;
  rule_review_count: number;
  tag_count: number;
}>;

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function assertDate(value: string): void {
  if (!DATE_PATTERN.test(value) || !Number.isFinite(Date.parse(`${value}T12:00:00.000Z`))) invalid();
}

function dateSpan(startDate: string, endDate: string): number {
  return Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) -
    Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1;
}

function accountScope(
  scope: WorkspaceAccessScope,
  selectedAccountId: string,
): AccountScope {
  return narrowWorkspaceAccessToAccount(scope, selectedAccountId);
}

function positionSummary(position: Readonly<{
  positionRef: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  remainingQuantityDecimal: string;
  averageEntryPriceDecimal: string | null;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  style: unknown;
  latestSwingNote: unknown;
  reviewDateSwingNote: unknown;
}>): Readonly<Record<string, unknown>> {
  return Object.freeze({
    positionRef: position.positionRef,
    ticker: position.symbol,
    currency: position.currency,
    timezone: position.timezone,
    direction: position.direction,
    openedAtUtc: position.openedAtUtc,
    closedAtUtc: position.closedAtUtc,
    remainingQuantityDecimal: position.remainingQuantityDecimal,
    averageEntryPriceDecimal: position.averageEntryPriceDecimal,
    projectionState: position.projectionState,
    style: position.style,
    latestSwingNote: position.latestSwingNote,
    reviewDateSwingNote: position.reviewDateSwingNote,
  });
}

export class CoachAiChatDashboardContextService {
  constructor(
    private readonly database: Database.Database,
    private readonly dashboard: Pick<JournalDashboardReadModelService,
      "getCalendar" | "getOpenPositions" | "getTradingDay">,
    private readonly tracker: Pick<JournalTradeTrackerReadService,
      "listPositions" | "listSwings" | "positionDetail" | "swingDetail">,
    private readonly journalContext: Pick<CoachAiChatJournalContextService, "summarize">,
    private readonly savedReviews: Pick<CoachAiChatSavedReviewService, "list">,
  ) {}

  workspaceSummary(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    asOfUtc: string,
  ): CoachAiChatDashboardContextResponse {
    accountScope(scope, selectedAccountId);
    const latestDay = this.dashboard.getTradingDay(scope, {
      requestedDate: null,
      currency: null,
      asOfUtc,
    });
    const journal = this.journalContext.summarize(scope, {
      period: "daily",
      anchorDate: latestDay.date,
      ...(latestDay.currency ? { currency: latestDay.currency } : {}),
    });
    const latestReview = this.savedReviews.list(scope, { limit: 1 })[0] ?? null;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_workspace_summary",
      result: Object.freeze({
        asOfUtc,
        selectedJournalAccount: true,
        latestTradingDay: Object.freeze({
          date: latestDay.date,
          state: latestDay.state,
          currency: latestDay.currency,
          netPnlDecimal: latestDay.netPnlDecimal,
          tickerCount: latestDay.tickers.length,
          tradeCount: latestDay.tickers.reduce((total, ticker) => total + ticker.roundTrips.length, 0),
          coverage: latestDay.coverage,
        }),
        journal,
        latestSavedAiReview: latestReview,
        links: Object.freeze({
          dailyTradeTracker: `/trade-tracker/${latestDay.date}`,
          aiReviews: "/ai-reviews",
          workspace: "/workspace",
        }),
      }),
    });
  }

  tradingDayDetails(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradingDayDetailsRequest,
    asOfUtc: string,
  ): CoachAiChatDashboardContextResponse {
    accountScope(scope, selectedAccountId);
    assertDate(request.tradingDate);
    if (request.currency !== undefined && !CURRENCY_PATTERN.test(request.currency)) invalid();
    const day = this.dashboard.getTradingDay(scope, {
      requestedDate: request.tradingDate,
      currency: request.currency ?? null,
      asOfUtc,
    });
    const journal = this.journalContext.summarize(scope, {
      period: "daily",
      anchorDate: request.tradingDate,
      ...(request.currency ? { currency: request.currency } : {}),
    });
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        state: day.state,
        tradingDate: day.date,
        currency: day.currency,
        availableCurrencies: day.availableCurrencies,
        timezone: day.timezone,
        netPnlDecimal: day.netPnlDecimal,
        previousTradingDate: day.previousTradingDate,
        nextTradingDate: day.nextTradingDate,
        latestTradingDate: day.latestTradingDate,
        tickers: Object.freeze(day.tickers.map((ticker) => Object.freeze({
          ticker: ticker.symbol,
          currency: ticker.currency,
          netPnlDecimal: ticker.netPnlDecimal,
          gainLossPercentDecimal: ticker.gainLossPercentDecimal,
          trades: Object.freeze(ticker.roundTrips.map((trade) => Object.freeze({
            tradeRef: trade.roundTripId,
            direction: trade.direction,
            entryAtUtc: trade.entryAtUtc,
            exitAtUtc: trade.exitAtUtc,
            entryPriceDecimal: trade.entryPriceDecimal,
            exitPriceDecimal: trade.exitPriceDecimal,
            netPnlDecimal: trade.netPnlDecimal,
            gainLossPercentDecimal: trade.gainLossPercentDecimal,
          }))),
        }))),
        executions: Object.freeze(day.executionActivity.map((execution) => Object.freeze({
          ticker: execution.symbol,
          currency: execution.currency,
          executedAtUtc: execution.executedAtUtc,
          side: execution.side,
          quantityDecimal: execution.quantityDecimal,
          priceDecimal: execution.priceDecimal,
          projectionStates: execution.projectionStates,
          needsDecision: execution.needsDecision,
        }))),
        decisionActivity: Object.freeze(day.decisionActivity.map((decision) => Object.freeze({
          ticker: decision.symbol,
          currency: decision.currency,
          direction: decision.direction,
          openedAtUtc: decision.openedAtUtc,
          executionCountOnDate: decision.executionCountOnDate,
          reasonCodes: decision.reasonCodes,
        }))),
        openPositions: Object.freeze(day.openPositions.map((position) => Object.freeze({
          ticker: position.symbol,
          currency: position.currency,
          direction: position.direction,
          openedAtUtc: position.openedAtUtc,
          remainingQuantityDecimal: position.remainingQuantityDecimal,
          averageEntryPriceDecimal: position.averageEntryPriceDecimal,
        }))),
        week: day.week,
        coverage: day.coverage,
        journal,
        link: `/trade-tracker/${day.date}`,
      }),
    });
  }

  calendarPeriod(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatCalendarPeriodRequest,
  ): CoachAiChatDashboardContextResponse {
    accountScope(scope, selectedAccountId);
    assertDate(request.startDate);
    assertDate(request.endDate);
    if (request.startDate > request.endDate || dateSpan(request.startDate, request.endDate) > MAX_CALENDAR_DAYS) invalid();
    if (request.currency !== undefined && !CURRENCY_PATTERN.test(request.currency)) invalid();
    if (request.ticker !== undefined && !TICKER_PATTERN.test(request.ticker)) invalid();
    const calendar = this.dashboard.getCalendar(scope, {
      currency: request.currency ?? null,
      startDate: request.startDate,
      endDate: request.endDate,
      symbol: request.ticker?.toUpperCase() ?? null,
      direction: null,
      performance: null,
      pnlBand: null,
      tradeCountBand: null,
      session: null,
    });
    const reviews = new Map(this.database.prepare<[string, string, string, string], CalendarReviewRow>(`SELECT
 day.trading_date, review.review_status
FROM journal_trading_day_reviews review
JOIN journal_trading_days day
  ON day.workspace_id = review.workspace_id
 AND day.account_id = review.account_id
 AND day.trading_day_id = review.trading_day_id
WHERE review.workspace_id = ? AND review.account_id = ?
  AND day.trading_date >= ? AND day.trading_date <= ?`).all(
      scope.workspaceId,
      selectedAccountId,
      request.startDate,
      request.endDate,
    ).map((row) => [row.trading_date, row.review_status] as const));
    const annotations = this.calendarAnnotations(
      scope.workspaceId,
      selectedAccountId,
      request.startDate,
      request.endDate,
      calendar.timezone,
    );
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        state: calendar.state,
        currency: calendar.currency,
        availableCurrencies: calendar.availableCurrencies,
        timezone: calendar.timezone,
        startDate: request.startDate,
        endDate: request.endDate,
        summary: calendar.summary,
        coverage: calendar.coverage,
        days: Object.freeze(calendar.days.map((day) => Object.freeze({
          tradingDate: day.date,
          netPnlDecimal: day.pnlDecimal,
          tradeCount: day.tradeCount,
          winRatePercentDecimal: day.winRatePercentDecimal,
          reviewStatus: day.tradeCount > 0
            ? reviews.get(day.date) === "reviewed" ? "reviewed" : "not_completed"
            : null,
          tickers: Object.freeze(day.tickers.map((ticker) => {
            const annotation = annotations.get(`${day.date}\u001f${ticker.symbol}`);
            return Object.freeze({
              ticker: ticker.symbol,
              netPnlDecimal: ticker.pnlDecimal,
              tradeCount: ticker.trades.length,
              noteCount: annotation?.note_count ?? ticker.noteCount,
              ruleReviewCount: annotation?.rule_review_count ?? ticker.ruleReviewCount,
              tagCount: annotation?.tag_count ?? ticker.tagCount,
            });
          })),
          link: `/trade-tracker/${day.date}`,
        }))),
        link: `/calendar?view=month&month=${request.startDate.slice(0, 7)}`,
      }),
    });
  }

  positionList(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatPositionListRequest,
  ): CoachAiChatDashboardContextResponse {
    assertDate(request.reviewDate);
    if (request.ticker !== undefined && !TICKER_PATTERN.test(request.ticker)) invalid();
    const account = accountScope(scope, selectedAccountId);
    const result = request.toolName === "list_swing_positions"
      ? this.tracker.listSwings(account, request.reviewDate)
      : Object.freeze({
          active: Object.freeze(this.tracker.listPositions(account, request.reviewDate)
            .filter((position) => position.projectionState === "legitimate_open")
            .slice(0, MAX_POSITIONS)),
          completed: Object.freeze([]),
        });
    const ticker = request.ticker?.toUpperCase() ?? null;
    const active = ticker
      ? result.active.filter((position) => position.symbol === ticker)
      : result.active;
    const completed = ticker
      ? result.completed.filter((position) => position.symbol === ticker)
      : result.completed;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        reviewDate: request.reviewDate,
        active: Object.freeze(active.slice(0, MAX_POSITIONS).map(positionSummary)),
        completed: Object.freeze(completed.slice(0, 50).map(positionSummary)),
        truncated: active.length > MAX_POSITIONS,
        link: request.toolName === "list_swing_positions"
          ? "/trade-tracker/swings" : "/trades/open",
      }),
    });
  }

  positionDetail(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatPositionDetailRequest,
  ): CoachAiChatDashboardContextResponse {
    assertDate(request.reviewDate);
    if (!POSITION_REF_PATTERN.test(request.positionRef)) invalid();
    if (request.ticker !== undefined && !TICKER_PATTERN.test(request.ticker)) invalid();
    const account = accountScope(scope, selectedAccountId);
    const detail = request.toolName === "get_swing_position_details"
      ? this.tracker.swingDetail(account, request.positionRef, request.reviewDate)
      : this.tracker.positionDetail(account, request.positionRef, request.reviewDate);
    if (request.toolName === "get_open_position_details" &&
        detail.projectionState !== "legitimate_open") {
      throw new CoachAiChatFactualToolError("not_found");
    }
    if (request.ticker !== undefined &&
        detail.symbol !== request.ticker.toUpperCase()) {
      throw new CoachAiChatFactualToolError("not_found");
    }
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        ...positionSummary(detail),
        executions: Object.freeze(detail.executions.map((execution) => Object.freeze({
          executedAtUtc: execution.executedAtUtc,
          side: execution.side,
          quantityDecimal: execution.quantityDecimal,
          priceDecimal: execution.priceDecimal,
          feesDecimal: execution.feesDecimal,
          allocationRole: execution.allocationRole,
        }))),
        ...(request.toolName === "get_swing_position_details" && "notes" in detail
          ? { notes: detail.notes }
          : {}),
        link: request.toolName === "get_swing_position_details"
          ? `/trade-tracker/swings#position-${request.positionRef}`
          : "/trades/open",
      }),
    });
  }

  private calendarAnnotations(
    workspaceId: string,
    accountId: string,
    startDate: string,
    endDate: string,
    timezone: string | null,
  ): ReadonlyMap<string, CalendarAnnotationRow> {
    if (!timezone) return new Map();
    const rows = this.database.prepare<[string, string], Readonly<{
      normalized_symbol: string;
      closed_at_utc: string;
      note_count: number;
      rule_review_count: number;
      tag_count: number;
    }>>(`SELECT instrument.normalized_symbol, version.closed_at_utc,
 (SELECT COUNT(*) FROM journal_round_trip_notes note
   WHERE note.workspace_id = version.workspace_id AND note.account_id = version.account_id
     AND note.round_trip_id = version.round_trip_id) AS note_count,
 (SELECT COUNT(*) FROM journal_rule_reviews review
   WHERE review.workspace_id = version.workspace_id AND review.account_id = version.account_id
     AND review.round_trip_id = version.round_trip_id AND review.target_kind = 'round_trip') AS rule_review_count,
 (SELECT COUNT(*) FROM journal_round_trip_tag_assignments assignment
   WHERE assignment.workspace_id = version.workspace_id AND assignment.account_id = version.account_id
     AND assignment.round_trip_id = version.round_trip_id AND assignment.assignment_state = 'assigned') AS tag_count
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
 AND round_trip.lifecycle_state = 'active' AND version.projection_state = 'ready_closed'
 AND version.closed_at_utc IS NOT NULL`).all(workspaceId, accountId);
    const totals = new Map<string, CalendarAnnotationRow>();
    for (const row of rows) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric", month: "2-digit", day: "2-digit", timeZone: timezone,
      }).formatToParts(new Date(row.closed_at_utc));
      const part = (type: "year" | "month" | "day") =>
        parts.find((value) => value.type === type)?.value ?? "";
      const tradingDate = `${part("year")}-${part("month")}-${part("day")}`;
      if (tradingDate < startDate || tradingDate > endDate) continue;
      const key = `${tradingDate}\u001f${row.normalized_symbol}`;
      const current = totals.get(key);
      totals.set(key, Object.freeze({
        trading_date: tradingDate,
        normalized_symbol: row.normalized_symbol,
        note_count: (current?.note_count ?? 0) + row.note_count,
        rule_review_count: (current?.rule_review_count ?? 0) + row.rule_review_count,
        tag_count: (current?.tag_count ?? 0) + row.tag_count,
      }));
    }
    return totals;
  }
}
