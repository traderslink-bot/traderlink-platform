import { Buffer } from "node:buffer";

import type {
  CoachAiChatAnalysisScope,
  CoachAiChatFactualToolCallSnapshot,
} from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatFactualToolRequest,
  type CoachAiChatFactualToolResponse,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import type { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";
import type { CoachAiChatJournalContextService } from "./coach-ai-chat-journal-context-service";
import type { CoachAiChatProductHelpService } from "./coach-ai-chat-product-help-service";
import type { CoachAiChatSavedReviewService } from "./coach-ai-chat-saved-review-service";
import type { CoachAiChatDashboardContextService } from "./coach-ai-chat-dashboard-context-service";
import type { CoachAiChatAnalyticsPageToolService } from "./coach-ai-chat-analytics-page-tool-service";
import type { CoachAiChatProductContextService } from "./coach-ai-chat-product-context-service";
import type { CoachAiChatTradeAnalyzerToolService } from "./coach-ai-chat-trade-analyzer-tool-service";
import type { CoachAiChatAnnotationContextService } from "./coach-ai-chat-annotation-context-service";
import type { CoachAiChatSavedAnalysisService } from "./coach-ai-chat-saved-analysis-service";

/** A generation has one shared factual-result budget. Results are never shortened to fit it. */
/** Across at most two tool steps; later model calls can receive this package twice. */
// Keep the complete, cumulative result set large enough for bounded trade and
// analytics rows while leaving room for Chat's expanded tool inventory,
// structured output, trusted page context, and repeated model steps inside the
// immutable 256 KB provider-input ceiling.
export const COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES = 48 * 1024;

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function resolveRecentScope(
  scope: CoachAiChatAnalysisScope,
  asOfUtc: string,
): CoachAiChatAnalysisScope {
  if (scope.kind !== "recent") return scope;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(asOfUtc));
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const endDate = `${value("year")}-${value("month")}-${value("day")}`;
  const start = new Date(`${endDate}T12:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 89);
  return Object.freeze({ kind: "custom", startDate: isoDate(start), endDate });
}

function scopeDateRange(scope: CoachAiChatAnalysisScope): Readonly<{
  startDate: string;
  endDate: string;
}> | null {
  if (scope.kind === "day") return Object.freeze({ startDate: scope.date, endDate: scope.date });
  if (scope.kind === "custom") {
    return Object.freeze({ startDate: scope.startDate, endDate: scope.endDate });
  }
  if (scope.kind === "month") {
    const [year, month] = scope.month.split("-").map(Number);
    return Object.freeze({
      startDate: `${scope.month}-01`,
      endDate: isoDate(new Date(Date.UTC(year, month, 0))),
    });
  }
  if (scope.kind === "week") {
    const anchor = new Date(`${scope.anchorDate}T12:00:00.000Z`);
    const mondayOffset = (anchor.getUTCDay() + 6) % 7;
    const monday = new Date(anchor);
    monday.setUTCDate(anchor.getUTCDate() - mondayOffset);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return Object.freeze({ startDate: isoDate(monday), endDate: isoDate(sunday) });
  }
  return null;
}

function applyScope(
  request: CoachAiChatFactualToolRequest,
  scope: CoachAiChatAnalysisScope,
): CoachAiChatFactualToolRequest {
  if (request.toolName === "get_trading_day_details") {
    const selectedRange = scopeDateRange(scope);
    if (scope.kind === "day") return Object.freeze({ ...request, tradingDate: scope.date });
    if (selectedRange && (request.tradingDate < selectedRange.startDate ||
        request.tradingDate > selectedRange.endDate)) {
      throw new CoachAiChatFactualToolError("invalid_request");
    }
    return request;
  }
  if (request.toolName === "get_calendar_period") {
    const selectedRange = scopeDateRange(scope);
    const startDate = selectedRange && selectedRange.startDate > request.startDate
      ? selectedRange.startDate : request.startDate;
    const endDate = selectedRange && selectedRange.endDate < request.endDate
      ? selectedRange.endDate : request.endDate;
    if (startDate > endDate) throw new CoachAiChatFactualToolError("invalid_request");
    return Object.freeze({
      ...request,
      startDate,
      endDate,
      ...(scope.kind === "ticker" ? { ticker: scope.ticker } : {}),
    });
  }
  if (request.toolName === "list_open_positions" ||
      request.toolName === "list_swing_positions" ||
      request.toolName === "get_open_position_details" ||
      request.toolName === "get_swing_position_details") {
    return scope.kind === "ticker"
      ? Object.freeze({ ...request, ticker: scope.ticker })
      : request;
  }
  if (request.toolName === "list_data_decisions") {
    return scope.kind === "ticker"
      ? Object.freeze({ ...request, ticker: scope.ticker })
      : request;
  }
  if (request.toolName === "get_trade_analyzer_results" ||
      request.toolName === "list_analyzed_trades") {
    if (scope.kind === "ticker" && request.toolName === "get_trade_analyzer_results") {
      throw new CoachAiChatFactualToolError("invalid_request");
    }
    const selectedRange = scopeDateRange(scope);
    const requestedRange = request.filters.startDate && request.filters.endDate
      ? Object.freeze({
          startDate: request.filters.startDate,
          endDate: request.filters.endDate,
        })
      : null;
    const dateRange = selectedRange && requestedRange
      ? Object.freeze({
          startDate: selectedRange.startDate > requestedRange.startDate
            ? selectedRange.startDate : requestedRange.startDate,
          endDate: selectedRange.endDate < requestedRange.endDate
            ? selectedRange.endDate : requestedRange.endDate,
        })
      : selectedRange ?? requestedRange;
    if (dateRange && dateRange.startDate > dateRange.endDate) {
      throw new CoachAiChatFactualToolError("invalid_request");
    }
    return Object.freeze({
      ...request,
      filters: Object.freeze({
        ...request.filters,
        ...(dateRange ? dateRange : {}),
        ...(scope.kind === "ticker" && request.toolName === "list_analyzed_trades"
          ? { ticker: scope.ticker }
          : {}),
      }),
    });
  }
  if (request.toolName === "get_trading_rule_results") {
    const selectedRange = scopeDateRange(scope);
    if (!selectedRange) return request;
    const startDate = selectedRange.startDate > request.startDate
      ? selectedRange.startDate : request.startDate;
    const endDate = selectedRange.endDate < request.endDate
      ? selectedRange.endDate : request.endDate;
    if (startDate > endDate) throw new CoachAiChatFactualToolError("invalid_request");
    return Object.freeze({ ...request, startDate, endDate });
  }
  if (request.toolName === "summarize_journal_period") {
    if (scope.kind === "day") {
      return Object.freeze({ ...request, period: "daily", anchorDate: scope.date });
    }
    if (scope.kind === "week") {
      return Object.freeze({ ...request, period: "weekly", anchorDate: scope.anchorDate });
    }
    if (scope.kind === "month") {
      return Object.freeze({ ...request, period: "monthly", anchorDate: `${scope.month}-01` });
    }
    if (scope.kind === "ticker") {
      throw new CoachAiChatFactualToolError("invalid_request");
    }
    if (scope.kind === "custom") {
      const requestedRange = request.period === "daily"
        ? Object.freeze({ startDate: request.anchorDate, endDate: request.anchorDate })
        : scopeDateRange(request.period === "weekly"
          ? Object.freeze({ kind: "week", anchorDate: request.anchorDate })
          : Object.freeze({ kind: "month", month: request.anchorDate.slice(0, 7) }));
      if (!requestedRange || requestedRange.startDate < scope.startDate ||
          requestedRange.endDate > scope.endDate) {
        throw new CoachAiChatFactualToolError("invalid_request");
      }
    }
    return request;
  }
  if (request.toolName !== "summarize_closed_trades" &&
      request.toolName !== "group_closed_trades" &&
      request.toolName !== "list_closed_trades" &&
      request.toolName !== "get_analytics_overview" &&
      request.toolName !== "get_results_by_ticker" &&
      request.toolName !== "get_timing_analytics" &&
      request.toolName !== "get_execution_analytics" &&
      request.toolName !== "query_trade_explorer") return request;
  const selectedRange = scopeDateRange(scope);
  const requestedRange = request.filters?.closingDateRange;
  const closingDateRange = selectedRange && requestedRange
    ? Object.freeze({
        startDate: selectedRange.startDate > requestedRange.startDate
          ? selectedRange.startDate : requestedRange.startDate,
        endDate: selectedRange.endDate < requestedRange.endDate
          ? selectedRange.endDate : requestedRange.endDate,
      })
    : selectedRange ?? requestedRange;
  if (closingDateRange && closingDateRange.startDate > closingDateRange.endDate) {
    throw new CoachAiChatFactualToolError("invalid_request");
  }
  return Object.freeze({
    ...request,
    filters: Object.freeze({
      ...request.filters,
      ...(closingDateRange ? { closingDateRange } : {}),
      ...(scope.kind === "ticker" ? { symbols: Object.freeze([scope.ticker]) } : {}),
    }),
  });
}

function applyReportingCurrency(
  request: CoachAiChatFactualToolRequest,
  reportingCurrency: string | null,
): CoachAiChatFactualToolRequest {
  if (reportingCurrency === null) return request;
  if (request.toolName === "summarize_journal_period" ||
      request.toolName === "get_trading_day_details" ||
      request.toolName === "get_calendar_period") {
    return Object.freeze({ ...request, currency: reportingCurrency });
  }
  if (request.toolName === "summarize_closed_trades" ||
      request.toolName === "group_closed_trades" ||
      request.toolName === "list_closed_trades" ||
      request.toolName === "get_analytics_overview" ||
      request.toolName === "get_results_by_ticker" ||
      request.toolName === "get_timing_analytics" ||
      request.toolName === "get_execution_analytics" ||
      request.toolName === "query_trade_explorer") {
    return Object.freeze({
      ...request,
      filters: Object.freeze({
        ...request.filters,
        currency: reportingCurrency,
      }),
    });
  }
  if (request.toolName === "get_trade_analyzer_results" ||
      request.toolName === "list_analyzed_trades") {
    return Object.freeze({
      ...request,
      filters: Object.freeze({
        ...request.filters,
        currency: reportingCurrency,
      }),
    });
  }
  return request;
}

function unsupportedTool(request: never): never {
  void request;
  throw new CoachAiChatFactualToolError("invalid_request");
}

export class CoachAiChatFactualToolDispatcher {
  private readonly snapshots: CoachAiChatFactualToolCallSnapshot[] = [];
  private totalBytes = 0;

  constructor(
    private readonly tools: Pick<CoachAiChatFactualToolService,
      "summarizeClosedTrades" | "groupClosedTrades" | "listClosedTrades">,
    private readonly details: Pick<CoachAiChatTradeDetailService, "getClosedTradeDetails">,
    private readonly scope: WorkspaceAccessScope,
    private readonly selectedAccountId: string,
    private readonly asOfUtc: string,
    private readonly extensions: Readonly<{
      journalContext?: Pick<CoachAiChatJournalContextService, "summarize">;
      productHelp?: Pick<CoachAiChatProductHelpService, "search">;
      savedReviews?: Pick<CoachAiChatSavedReviewService, "list" | "read">;
      dashboardContext?: Pick<CoachAiChatDashboardContextService,
        "workspaceSummary" | "tradingDayDetails" | "calendarPeriod" |
        "positionList" | "positionDetail">;
      analyticsPages?: Pick<CoachAiChatAnalyticsPageToolService, "readPage" | "tradeExplorer">;
      productContext?: Pick<CoachAiChatProductContextService,
        "listImports" | "listDataDecisions" | "dataDecisionDetail" |
        "listNotifications" | "accountContext">;
      tradeAnalyzer?: Pick<CoachAiChatTradeAnalyzerToolService,
        "results" | "listTrades" | "savedCandleReview">;
      annotations?: Pick<CoachAiChatAnnotationContextService,
        "listRules" | "ruleResults" | "tradeAnnotations">;
      savedAnalysis?: Pick<CoachAiChatSavedAnalysisService,
        "listComparisons" | "listRuleIdeas">;
    }> = Object.freeze({}),
    private readonly analysisScope: CoachAiChatAnalysisScope = Object.freeze({ kind: "recent" }),
    private readonly reportingCurrency: string | null = null,
  ) {}

  dispatch(toolCallId: string, request: CoachAiChatFactualToolRequest): CoachAiChatFactualToolResponse {
    if (this.snapshots.length >= 4) throw new CoachAiChatFactualToolError("result_too_large");
    const enforcedAnalysisScope = resolveRecentScope(this.analysisScope, this.asOfUtc);
    request = applyScope(request, enforcedAnalysisScope);
    request = applyReportingCurrency(request, this.reportingCurrency);
    let result: CoachAiChatFactualToolResponse;
    switch (request.toolName) {
      case "summarize_closed_trades":
        result = this.tools.summarizeClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "group_closed_trades":
        result = this.tools.groupClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "list_closed_trades":
        result = this.tools.listClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "get_closed_trade_details":
        result = this.details.getClosedTradeDetails(
          this.scope,
          this.selectedAccountId,
          request,
          enforcedAnalysisScope,
        );
        break;
      case "summarize_journal_period":
        if (!this.extensions.journalContext) return unsupportedTool(request as never);
        result = Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: this.extensions.journalContext.summarize(this.scope, request),
        });
        break;
      case "list_saved_ai_reviews":
        if (!this.extensions.savedReviews) return unsupportedTool(request as never);
        result = Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: this.extensions.savedReviews.list(this.scope, request),
        });
        break;
      case "get_saved_ai_review":
        if (!this.extensions.savedReviews) return unsupportedTool(request as never);
        result = Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: this.extensions.savedReviews.read(this.scope, request.reviewId),
        });
        break;
      case "search_product_help":
        if (!this.extensions.productHelp) return unsupportedTool(request as never);
        result = Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: this.extensions.productHelp.search(request),
        });
        break;
      case "get_workspace_summary":
        if (!this.extensions.dashboardContext) return unsupportedTool(request as never);
        result = this.extensions.dashboardContext.workspaceSummary(
          this.scope,
          this.selectedAccountId,
          this.asOfUtc,
        );
        break;
      case "get_trading_day_details":
        if (!this.extensions.dashboardContext) return unsupportedTool(request as never);
        result = this.extensions.dashboardContext.tradingDayDetails(
          this.scope,
          this.selectedAccountId,
          request,
          this.asOfUtc,
        );
        break;
      case "get_calendar_period":
        if (!this.extensions.dashboardContext) return unsupportedTool(request as never);
        result = this.extensions.dashboardContext.calendarPeriod(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_open_positions":
      case "list_swing_positions":
        if (!this.extensions.dashboardContext) return unsupportedTool(request as never);
        result = this.extensions.dashboardContext.positionList(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_open_position_details":
      case "get_swing_position_details":
        if (!this.extensions.dashboardContext) return unsupportedTool(request as never);
        result = this.extensions.dashboardContext.positionDetail(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_analytics_overview":
      case "get_results_by_ticker":
      case "get_timing_analytics":
      case "get_execution_analytics":
        if (!this.extensions.analyticsPages) return unsupportedTool(request as never);
        result = this.extensions.analyticsPages.readPage(
          this.scope,
          this.selectedAccountId,
          request,
          this.asOfUtc,
        );
        break;
      case "query_trade_explorer":
        if (!this.extensions.analyticsPages) return unsupportedTool(request as never);
        result = this.extensions.analyticsPages.tradeExplorer(
          this.scope,
          this.selectedAccountId,
          request,
          this.asOfUtc,
        );
        break;
      case "list_saved_trade_comparisons":
        if (!this.extensions.savedAnalysis) return unsupportedTool(request as never);
        result = this.extensions.savedAnalysis.listComparisons(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_rule_ideas":
        if (!this.extensions.savedAnalysis) return unsupportedTool(request as never);
        result = this.extensions.savedAnalysis.listRuleIdeas(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_imports":
        if (!this.extensions.productContext) return unsupportedTool(request as never);
        result = this.extensions.productContext.listImports(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_data_decisions":
        if (!this.extensions.productContext) return unsupportedTool(request as never);
        result = this.extensions.productContext.listDataDecisions(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_data_decision_details":
        if (!this.extensions.productContext) return unsupportedTool(request as never);
        result = this.extensions.productContext.dataDecisionDetail(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_notifications":
        if (!this.extensions.productContext) return unsupportedTool(request as never);
        result = this.extensions.productContext.listNotifications(this.scope, request);
        break;
      case "get_account_profile":
      case "get_account_trading":
      case "get_account_preferences":
      case "get_account_ai_plan":
        if (!this.extensions.productContext) return unsupportedTool(request as never);
        result = this.extensions.productContext.accountContext(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_trade_analyzer_results":
        if (!this.extensions.tradeAnalyzer) return unsupportedTool(request as never);
        result = this.extensions.tradeAnalyzer.results(
          this.scope,
          this.selectedAccountId,
          request,
          this.asOfUtc,
        );
        break;
      case "list_analyzed_trades":
        if (!this.extensions.tradeAnalyzer) return unsupportedTool(request as never);
        result = this.extensions.tradeAnalyzer.listTrades(
          this.scope,
          this.selectedAccountId,
          request,
          this.asOfUtc,
        );
        break;
      case "get_saved_candle_review":
        if (!this.extensions.tradeAnalyzer) return unsupportedTool(request as never);
        result = this.extensions.tradeAnalyzer.savedCandleReview(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "list_trading_rules":
        if (!this.extensions.annotations) return unsupportedTool(request as never);
        result = this.extensions.annotations.listRules(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_trading_rule_results":
        if (!this.extensions.annotations) return unsupportedTool(request as never);
        result = this.extensions.annotations.ruleResults(
          this.scope,
          this.selectedAccountId,
          request,
        );
        break;
      case "get_trade_annotations":
        if (!this.extensions.annotations) return unsupportedTool(request as never);
        result = this.extensions.annotations.tradeAnnotations(
          this.scope,
          this.selectedAccountId,
          request,
          enforcedAnalysisScope,
        );
        break;
      default:
        return unsupportedTool(request);
    }
    const serializedResultBytes = Buffer.byteLength(JSON.stringify(result), "utf8");
    if (this.totalBytes + serializedResultBytes > COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES) {
      throw new CoachAiChatFactualToolError("result_too_large");
    }
    this.totalBytes += serializedResultBytes;
    this.snapshots.push(Object.freeze({
      toolCallId,
      toolName: request.toolName,
      request: Object.freeze({ ...request }),
      result,
      serializedResultBytes,
    }));
    return result;
  }

  snapshotsForPersistence(): readonly CoachAiChatFactualToolCallSnapshot[] {
    return Object.freeze([...this.snapshots]);
  }

  totalSerializedResultBytes(): number {
    return this.totalBytes;
  }
}
