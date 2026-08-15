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

/** A generation has one shared factual-result budget. Results are never shortened to fit it. */
/** Across at most two tool steps; later model calls can receive this package twice. */
export const COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES = 64 * 1024;

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
      request.toolName !== "list_closed_trades") return request;
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
    }> = Object.freeze({}),
    private readonly analysisScope: CoachAiChatAnalysisScope = Object.freeze({ kind: "recent" }),
  ) {}

  dispatch(toolCallId: string, request: CoachAiChatFactualToolRequest): CoachAiChatFactualToolResponse {
    if (this.snapshots.length >= 4) throw new CoachAiChatFactualToolError("result_too_large");
    const enforcedAnalysisScope = resolveRecentScope(this.analysisScope, this.asOfUtc);
    request = applyScope(request, enforcedAnalysisScope);
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
