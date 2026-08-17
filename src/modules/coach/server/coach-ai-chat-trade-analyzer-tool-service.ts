import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { JournalAnalyticsClosingDateRange } from
  "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsService } from
  "@/src/modules/journal-analytics/server/analytics-service";
import { buildJournalAnalyticsDashboardQuery } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  buildDailyTradeLongTermAnalytics,
  readDailyTradeAnalysisCurrencies,
  type DailyTradeLongTermAnalyticsModel,
  type TradeAnalysisTradeRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { CandleReviewRepository } from
  "@/src/modules/level-analysis/server/candle-review-repository";
import {
  narrowWorkspaceAccessToAccount,
  type AccountScope,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  journalReportingCurrencyAmount,
  journalReportingCurrencyMultiplier,
  type JournalReportingCurrencyContext,
} from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { reportCandleReviewRecord } from
  "@/src/modules/level-analysis/server/candle-review-reporting";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE,
  CoachAiChatFactualToolError,
  type CoachAiChatAnalyzedTradeListRequest,
  type CoachAiChatCandleReviewRequest,
  type CoachAiChatTradeAnalyzerFilters,
  type CoachAiChatTradeAnalyzerResponse,
  type CoachAiChatTradeAnalyzerResultsRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const TICKER_PATTERN = /^[A-Za-z0-9._-]{1,32}$/u;
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;
const MAX_ANALYZER_SOURCE_ROWS = 10_000;
const SOURCE_PAGE_SIZE = 200;

type AnalyzerAnalytics = Pick<JournalAnalyticsService, "getRoundTripAnalyticsTable">;

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function validDate(value: string): boolean {
  return DATE_PATTERN.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00.000Z`));
}

function closingRange(filters: CoachAiChatTradeAnalyzerFilters): JournalAnalyticsClosingDateRange {
  const hasStart = filters.startDate !== undefined;
  const hasEnd = filters.endDate !== undefined;
  if (hasStart !== hasEnd) invalid();
  if (!hasStart || !hasEnd) return Object.freeze({ kind: "all_available" as const });
  if (!validDate(filters.startDate!) || !validDate(filters.endDate!) ||
      filters.startDate! > filters.endDate!) invalid();
  return Object.freeze({
    kind: "inclusive_closing_date" as const,
    startDate: filters.startDate!,
    endDate: filters.endDate!,
  });
}

function accountScope(
  scope: WorkspaceAccessScope,
  selectedAccountId: string,
): AccountScope {
  const narrowed = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
  if (scope.activeAccountId !== selectedAccountId) invalid();
  return narrowed;
}

function opaqueTradeRef(scope: AccountScope, roundTripId: string): string {
  return createHash("sha256").update([
    "coach-analyzed-trade-ref-v1",
    scope.workspaceId,
    scope.accountId,
    roundTripId,
  ].join("\u001f"), "utf8").digest("hex");
}

function safeTrade(scope: AccountScope, trade: TradeAnalysisTradeRow) {
  return Object.freeze({
    tradeRef: opaqueTradeRef(scope, trade.roundTripId),
    ticker: trade.symbol,
    trackerDate: trade.trackerDate,
    closeDate: trade.closeDate,
    direction: trade.direction,
    actualPnlDecimal: trade.actualPnlDecimal,
    returnPercent: trade.returnPercent,
    executionCount: trade.executionCount,
    sustainedOpportunityDecimal: trade.sustainedOpportunityDecimal,
    additionalOpportunityDecimal: trade.additionalOpportunityDecimal,
    capturedPercent: trade.capturedPercent,
    greenToRedStatus: trade.greenToRedStatus,
    peakToExitMinutes: trade.peakToExitMinutes,
  });
}

function commonResult(model: DailyTradeLongTermAnalyticsModel) {
  return Object.freeze({
    currency: model.currency,
    moneyBasis: model.moneyBasis,
    timezone: model.timezone,
    eligibleDayTradeCount: model.eligibleDayTradeCount,
    analyzedTradeCount: model.analyzedTradeCount,
    analyzedExecutionCount: model.analyzedExecutionCount,
    coveragePercent: model.coveragePercent,
    averagePnlDecimal: model.averagePnlDecimal,
    averageReturnPercent: model.averageReturnPercent,
    winRatePercent: model.winRatePercent,
    malformedSavedSnapshotCount: model.malformedSnapshotCount,
  });
}

function analyzerView(
  scope: AccountScope,
  model: DailyTradeLongTermAnalyticsModel,
  view: CoachAiChatTradeAnalyzerResultsRequest["view"],
) {
  const common = commonResult(model);
  if (view === "day") {
    return Object.freeze({
      ...common,
      profitCapture: model.profitCapture,
      holdingDuration: model.holdingDuration,
      entryTime: model.entryTime,
    });
  }
  if (view === "entry_exit") {
    return Object.freeze({
      ...common,
      entryOpportunityRisk: model.entryOpportunityRisk,
      entryContext: model.entryContext,
      exitContext: model.exitContext,
      holding: model.holding,
      holdingDuration: model.holdingDuration,
      entryTime: model.entryTime,
      riskManagement: model.riskManagement,
    });
  }
  if (view === "mfe_mae") {
    return Object.freeze({
      ...common,
      mfeMae: model.mfeMae,
      excursions: Object.freeze(model.excursions.slice(0, 50).map((row) => Object.freeze({
        tradeRef: opaqueTradeRef(scope, row.roundTripId),
        ticker: row.symbol,
        trackerDate: row.trackerDate,
        closeDate: row.closeDate,
        direction: row.direction,
        eventKind: row.eventKind,
        executionSequence: row.executionSequence,
        entryPriceDecimal: row.entryPriceDecimal,
        favorableMoveDecimal: row.favorableMoveDecimal,
        favorableMovePercent: row.favorableMovePercent,
        adverseMoveDecimal: row.adverseMoveDecimal,
        adverseMovePercent: row.adverseMovePercent,
        minutesUntilFlat: row.minutesUntilFlat,
        actualPnlDecimal: row.actualPnlDecimal,
      }))),
      excursionRowCount: model.excursions.length,
    });
  }
  if (view === "green_to_red") {
    const statuses = new Set([
      "green_to_red_ended_red",
      "green_to_red_recovered",
      "green_to_red_ended_flat",
    ]);
    const trades = model.trades.filter((trade) => statuses.has(trade.greenToRedStatus));
    return Object.freeze({
      ...common,
      greenToRed: model.greenToRed,
      greenToRedDamage: model.greenToRedDamage,
      riskManagement: model.riskManagement,
      trades: Object.freeze(trades.slice(0, 50).map((trade) => safeTrade(scope, trade))),
      tradeRowCount: trades.length,
    });
  }
  return Object.freeze({ ...common, patterns: model.patterns });
}

export class CoachAiChatTradeAnalyzerToolService {
  private readonly candles: Pick<CandleReviewRepository, "findTarget" | "readCurrent">;
  private readonly readCurrencies: typeof readDailyTradeAnalysisCurrencies;
  private readonly buildModel: typeof buildDailyTradeLongTermAnalytics;
  private readonly resolveTrade: ((scope: AccountScope, tradeRef: string) => string | null) | null;
  private readonly reportingContext: JournalReportingCurrencyContext | null;

  constructor(
    private readonly database: Database.Database,
    private readonly analytics: AnalyzerAnalytics,
    dependencies: Readonly<{
      candles?: Pick<CandleReviewRepository, "findTarget" | "readCurrent">;
      readCurrencies?: typeof readDailyTradeAnalysisCurrencies;
      buildModel?: typeof buildDailyTradeLongTermAnalytics;
      resolveTrade?: (scope: AccountScope, tradeRef: string) => string | null;
      reportingContext?: JournalReportingCurrencyContext;
    }> = Object.freeze({}),
  ) {
    this.candles = dependencies.candles ?? new CandleReviewRepository(database);
    this.readCurrencies = dependencies.readCurrencies ?? readDailyTradeAnalysisCurrencies;
    this.buildModel = dependencies.buildModel ?? buildDailyTradeLongTermAnalytics;
    this.resolveTrade = dependencies.resolveTrade ?? null;
    this.reportingContext = dependencies.reportingContext ?? null;
  }

  results(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradeAnalyzerResultsRequest,
    asOfUtc: string,
  ): CoachAiChatTradeAnalyzerResponse {
    const selected = accountScope(scope, selectedAccountId);
    const model = this.model(scope, request.filters, asOfUtc);
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        view: request.view,
        analysis: analyzerView(selected, model, request.view),
        link: this.viewLink(request.view),
        savedAnalysisOnly: true,
      }),
    });
  }

  listTrades(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatAnalyzedTradeListRequest,
    asOfUtc: string,
  ): CoachAiChatTradeAnalyzerResponse {
    const selected = accountScope(scope, selectedAccountId);
    if (!Number.isSafeInteger(request.page) || request.page < 1 ||
        !Number.isSafeInteger(request.pageSize) || request.pageSize < 1 ||
        request.pageSize > COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE) invalid();
    const ticker = request.filters.ticker?.trim().toUpperCase();
    if (ticker !== undefined && !TICKER_PATTERN.test(ticker)) invalid();
    const greenToRedStatus = request.filters.greenToRedStatus?.trim();
    if (greenToRedStatus !== undefined && greenToRedStatus.length > 64) invalid();
    const model = this.model(scope, request.filters, asOfUtc);
    const filtered = model.trades.filter((trade) =>
      (ticker === undefined || trade.symbol.toUpperCase() === ticker) &&
      (greenToRedStatus === undefined || trade.greenToRedStatus === greenToRedStatus));
    const start = (request.page - 1) * request.pageSize;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        currency: model.currency,
        moneyBasis: model.moneyBasis,
        timezone: model.timezone,
        page: request.page,
        pageSize: request.pageSize,
        totalRows: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / request.pageSize)),
        rows: Object.freeze(filtered.slice(start, start + request.pageSize)
          .map((trade) => safeTrade(selected, trade))),
        link: "/analytics/trade-analyzer/day/trades",
        savedAnalysisOnly: true,
      }),
    });
  }

  savedCandleReview(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatCandleReviewRequest,
  ): CoachAiChatTradeAnalyzerResponse {
    const selected = accountScope(scope, selectedAccountId);
    if (!OPAQUE_REF_PATTERN.test(request.tradeRef)) invalid();
    const roundTripId = this.resolveRoundTripId(selected, request.tradeRef);
    if (roundTripId === null) throw new CoachAiChatFactualToolError("not_found");
    const target = this.candles.findTarget(selected, roundTripId);
    if (!target) throw new CoachAiChatFactualToolError("not_found");
    const review = this.candles.readCurrent(selected, target);
    const entryPriceDecimal = this.reportedAmount(
      target.roundTripId,
      target.entryPriceDecimal,
    );
    const exitPriceDecimal = this.reportedAmount(
      target.roundTripId,
      target.exitPriceDecimal,
    );
    const reportedReview = review && this.reportingContext
      ? reportCandleReviewRecord(review, this.reportingContext)
      : review;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        tradeRef: request.tradeRef,
        ticker: target.symbol,
        direction: target.direction,
        openedAtUtc: target.openedAtUtc,
        closedAtUtc: target.closedAtUtc,
        currency: this.reportingContext?.reportingCurrency ?? null,
        entryPriceDecimal,
        exitPriceDecimal,
        savedReviewAvailable: reportedReview !== null,
        review: reportedReview === null ? null : Object.freeze({
          status: reportedReview.status,
          analyzedAtUtc: reportedReview.analyzedAtUtc,
          entryTiming: reportedReview.analysis.entryTiming,
          exitTiming: reportedReview.analysis.exitTiming,
          profitGiveback: reportedReview.analysis.profitGiveback,
          observations: reportedReview.observations,
          indicators: reportedReview.indicators,
        }),
        candleSeriesIncluded: false,
        link: "/trades/candle-review",
        savedAnalysisOnly: true,
      }),
    });
  }

  private model(
    scope: WorkspaceAccessScope,
    filters: CoachAiChatTradeAnalyzerFilters,
    asOfUtc: string,
  ): DailyTradeLongTermAnalyticsModel {
    if (filters.moneyBasis !== "gross" && filters.moneyBasis !== "net") invalid();
    if (filters.currency !== undefined && !CURRENCY_PATTERN.test(filters.currency)) invalid();
    const range = closingRange(filters);
    const analyzedCurrencies = this.readCurrencies(this.database, scope);
    const currency = this.reportingContext?.reportingCurrency ??
      filters.currency ?? analyzedCurrencies[0] ?? null;
    if (!this.reportingContext && filters.currency !== undefined &&
        !analyzedCurrencies.includes(filters.currency)) {
      throw new CoachAiChatFactualToolError("not_found");
    }
    const rows = [];
    let cursor: string | null = null;
    let timezone = "America/New_York";
    if (currency !== null) do {
      const response = this.analytics.getRoundTripAnalyticsTable(scope,
        buildJournalAnalyticsDashboardQuery(scope, {
          afterCursor: cursor,
          asOfUtc,
          closingDateRange: range,
          currency,
          metricIds: ["included_count"],
          moneyBasis: filters.moneyBasis,
          pageSize: SOURCE_PAGE_SIZE,
        }));
      rows.push(...response.rows);
      if (rows.length > MAX_ANALYZER_SOURCE_ROWS) {
        throw new CoachAiChatFactualToolError("result_too_large");
      }
      timezone = response.timezone;
      cursor = response.continuationCursor;
    } while (cursor !== null);
    const reportingMultipliers = new Map<string, string>();
    if (this.reportingContext) {
      for (const [roundTripId, sourceCurrency] of
        this.reportingContext.sourceCurrencyByRoundTrip) {
        const sourceDate = this.reportingContext.sourceDateByRoundTrip.get(roundTripId);
        if (!sourceDate) continue;
        reportingMultipliers.set(
          roundTripId,
          journalReportingCurrencyMultiplier(
            sourceCurrency,
            sourceDate,
            this.reportingContext,
          ),
        );
      }
    }
    return this.buildModel(
      this.database,
      scope,
      Object.freeze(rows),
      filters.moneyBasis,
      currency,
      timezone,
      reportingMultipliers,
    );
  }

  private reportedAmount(roundTripId: string, amount: string): string {
    if (!this.reportingContext) return amount;
    const sourceCurrency = this.reportingContext.sourceCurrencyByRoundTrip
      .get(roundTripId);
    const sourceDate = this.reportingContext.sourceDateByRoundTrip.get(roundTripId);
    if (!sourceCurrency || !sourceDate) {
      throw new CoachAiChatFactualToolError("not_found");
    }
    try {
      return journalReportingCurrencyAmount(
        amount,
        sourceCurrency,
        this.reportingContext.reportingCurrency,
        sourceDate,
        this.reportingContext,
      );
    } catch {
      throw new CoachAiChatFactualToolError("not_found");
    }
  }

  private resolveRoundTripId(scope: AccountScope, tradeRef: string): string | null {
    if (this.resolveTrade) return this.resolveTrade(scope, tradeRef);
    const rows = this.database.prepare<[string, string], { round_trip_id: string }>(`
SELECT round_trip_id
FROM journal_round_trips
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'
ORDER BY round_trip_id`).all(scope.workspaceId, scope.accountId);
    return rows.find((row) => opaqueTradeRef(scope, row.round_trip_id) === tradeRef)
      ?.round_trip_id ?? null;
  }

  private viewLink(view: CoachAiChatTradeAnalyzerResultsRequest["view"]): string {
    return view === "day"
      ? "/analytics/trade-analyzer/day"
      : view === "entry_exit"
        ? "/analytics/trade-analyzer/day/entry-exit"
        : view === "mfe_mae"
          ? "/analytics/trade-analyzer/day/mfe-mae"
          : view === "green_to_red"
            ? "/analytics/trade-analyzer/day/green-to-red"
            : "/analytics/trade-analyzer/day/candle-patterns";
  }
}
