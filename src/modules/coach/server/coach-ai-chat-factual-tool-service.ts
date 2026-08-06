import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnalyticsQuery } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsRoundTripTableResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import type { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_METRICS,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_SYMBOLS,
  COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS,
  CoachAiChatFactualToolError,
  type CoachAiChatClosedTradeGroupingRequest,
  type CoachAiChatClosedTradeListRequest,
  type CoachAiChatClosedTradeSummaryRequest,
  type CoachAiChatFactualAnalyticsResponse,
  type CoachAiChatFactualToolFilters,
  type CoachAiChatFactualTradeListResponse,
} from "../contracts/coach-ai-chat-factual-tool-contracts";

type CoachAiChatFactualAnalyticsReader = Pick<
  JournalAnalyticsService,
  "getAnalyticsOverview" | "getRoundTripAnalyticsTable"
>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const SYMBOL_PATTERN = /^[A-Za-z0-9._-]{1,32}$/u;

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function onlyKeys(value: object, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function validateFilters(input: CoachAiChatFactualToolFilters | undefined): Required<
  Pick<JournalAnalyticsQuery, "closingDateRange" | "currency" | "symbols" | "directions" |
  "tradeClassifications" | "provenance" | "outcomes">
> {
  if (input !== undefined && (input === null || Array.isArray(input) || typeof input !== "object")) {
    invalid();
  }
  const filters = input ?? {};
  onlyKeys(filters, [
    "closingDateRange", "currency", "symbols", "directions", "tradeClassifications",
    "provenance", "outcomes",
  ]);
  const dateRange = filters.closingDateRange;
  if (dateRange !== undefined) {
    if (dateRange === null || Array.isArray(dateRange) || typeof dateRange !== "object") {
      invalid();
    }
    onlyKeys(dateRange, ["startDate", "endDate"]);
    if (typeof dateRange.startDate !== "string" || typeof dateRange.endDate !== "string" ||
        !DATE_PATTERN.test(dateRange.startDate) || !DATE_PATTERN.test(dateRange.endDate) ||
        dateRange.startDate > dateRange.endDate) invalid();
  }
  if (filters.currency !== undefined && !CURRENCY_PATTERN.test(filters.currency)) invalid();
  const symbols = filters.symbols === undefined ? [] : filters.symbols;
  if (!Array.isArray(symbols) || symbols.length > COACH_AI_CHAT_FACTUAL_TOOL_MAX_SYMBOLS ||
      symbols.some((symbol) => typeof symbol !== "string" || !SYMBOL_PATTERN.test(symbol))) invalid();
  const directions = filters.directions === undefined ? [] : filters.directions;
  if (!Array.isArray(directions) || directions.some((value) => !oneOf(value, ["long", "short"]))) invalid();
  const classifications = filters.tradeClassifications === undefined ? [] : filters.tradeClassifications;
  if (!Array.isArray(classifications) || classifications.some((value) =>
    !oneOf(value, ["day_trade", "multi_day_trade"]))) invalid();
  const provenance = filters.provenance === undefined ? [] : filters.provenance;
  if (!Array.isArray(provenance) || provenance.some((value) =>
    !oneOf(value, ["broker_only", "manual_only", "correction_only", "mixed", "unknown"]))) invalid();
  const outcomes = filters.outcomes === undefined ? [] : filters.outcomes;
  if (!Array.isArray(outcomes) || outcomes.some((value) => !oneOf(value, ["win", "loss", "flat"]))) invalid();
  return Object.freeze({
    closingDateRange: dateRange === undefined
      ? Object.freeze({ kind: "all_available" as const })
      : Object.freeze({ kind: "inclusive_closing_date" as const, ...dateRange }),
    currency: filters.currency ?? null,
    symbols: Object.freeze([...new Set(symbols)]),
    directions: Object.freeze([...new Set(directions)]),
    tradeClassifications: Object.freeze([...new Set(classifications)]),
    provenance: Object.freeze([...new Set(provenance)]),
    outcomes: Object.freeze([...new Set(outcomes)]),
  });
}

function validateMetrics(metricIds: readonly string[]): readonly string[] {
  if (!Array.isArray(metricIds) || metricIds.length === 0 ||
      metricIds.length > COACH_AI_CHAT_FACTUAL_TOOL_MAX_METRICS ||
      metricIds.some((metricId) => !COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS.includes(
        metricId as (typeof COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS)[number]))) invalid();
  return Object.freeze([...new Set(metricIds)]);
}

function validateMoneyBasis(value: unknown): "gross" | "net" {
  if (value !== "gross" && value !== "net") invalid();
  return value;
}

function serverQuery(
  selectedAccountId: string,
  moneyBasis: "gross" | "net",
  filters: CoachAiChatFactualToolFilters | undefined,
  metricIds: readonly string[],
  groupings: JournalAnalyticsQuery["groupings"],
  table: JournalAnalyticsQuery["table"],
  asOfUtc: string,
): JournalAnalyticsQuery {
  const validated = validateFilters(filters);
  return Object.freeze({
    queryVersion: "journal_analytics_query_v1",
    accountIds: Object.freeze([selectedAccountId]),
    metricIds,
    moneyBasis,
    closingDateRange: validated.closingDateRange,
    currency: validated.currency,
    instrumentIds: Object.freeze([]),
    symbols: validated.symbols,
    directions: validated.directions,
    tradeClassifications: validated.tradeClassifications,
    provenance: validated.provenance,
    outcomes: validated.outcomes,
    entryWeekdays: Object.freeze([]),
    entryTimeBuckets: Object.freeze([]),
    holdingDurationRange: Object.freeze({ minimumMillisecondsInclusive: null, maximumMillisecondsInclusive: null }),
    enteredQuantityRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    maximumPositionRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    entryNotionalRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    groupings,
    entryTimeBucketMinutes: 30,
    asOfUtc,
    table,
  });
}

export class CoachAiChatFactualToolService {
  constructor(private readonly analytics: CoachAiChatFactualAnalyticsReader) {}

  private overview(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    try {
      return this.analytics.getAnalyticsOverview(scope, query);
    } catch (error) {
      if (error instanceof CoachAiChatFactualToolError) throw error;
      return invalid();
    }
  }

  summarizeClosedTrades(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatClosedTradeSummaryRequest,
    asOfUtc: string,
  ): CoachAiChatFactualAnalyticsResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "summarize_closed_trades") invalid();
    onlyKeys(request, ["contractVersion", "toolName", "metricIds", "moneyBasis", "filters"]);
    narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const result = this.overview(scope, serverQuery(
      selectedAccountId, validateMoneyBasis(request.moneyBasis), request.filters,
      validateMetrics(request.metricIds), Object.freeze([]),
      Object.freeze({ pageSize: 1, afterCursor: null }), asOfUtc,
    ));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades",
      result,
    });
  }

  groupClosedTrades(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatClosedTradeGroupingRequest,
    asOfUtc: string,
  ): CoachAiChatFactualAnalyticsResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "group_closed_trades" ||
        !COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS.includes(request.grouping)) invalid();
    onlyKeys(request, ["contractVersion", "toolName", "metricIds", "grouping", "moneyBasis", "filters"]);
    narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    const result = this.overview(scope, serverQuery(
      selectedAccountId, validateMoneyBasis(request.moneyBasis), request.filters,
      validateMetrics(request.metricIds), Object.freeze([request.grouping]),
      Object.freeze({ pageSize: 1, afterCursor: null }), asOfUtc,
    ));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "group_closed_trades",
      result,
    });
  }

  listClosedTrades(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatClosedTradeListRequest,
    asOfUtc: string,
  ): CoachAiChatFactualTradeListResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "list_closed_trades" ||
        !Number.isSafeInteger(request.pageSize) || request.pageSize < 1 ||
        request.pageSize > COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE ||
        (request.afterCursor !== null && (typeof request.afterCursor !== "string" ||
          request.afterCursor.length === 0 || request.afterCursor.length > 512))) invalid();
    onlyKeys(request, ["contractVersion", "toolName", "moneyBasis", "pageSize", "afterCursor", "filters"]);
    narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    let result: JournalAnalyticsRoundTripTableResponse;
    try {
      result = this.analytics.getRoundTripAnalyticsTable(scope, serverQuery(
        selectedAccountId, validateMoneyBasis(request.moneyBasis), request.filters,
        Object.freeze([]), Object.freeze([]),
        Object.freeze({ pageSize: request.pageSize, afterCursor: request.afterCursor }), asOfUtc,
      ));
    } catch (error) {
      if (error instanceof CoachAiChatFactualToolError) throw error;
      invalid();
    }
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_closed_trades",
      result,
    });
  }
}
