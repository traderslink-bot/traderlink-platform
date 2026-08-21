import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import Decimal from "decimal.js";
import type {
  JournalAnalyticsDirection,
  JournalAnalyticsMoneyBasis,
  JournalAnalyticsOutcome,
  JournalAnalyticsProvenanceGroup,
  JournalAnalyticsQuery,
  JournalAnalyticsTradeClassification,
  JournalAnalyticsWeekday,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  compareTradeExplorerMetricValues,
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerTableOrder,
  tradeExplorerTradeSortForOutcome,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import type { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import { buildJournalAnalyticsDashboardQuery } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE,
  COACH_AI_CHAT_TRADE_EXPLORER_GROUPINGS,
  COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS,
  COACH_AI_CHAT_TRADE_EXPLORER_TRADE_SORTS,
  CoachAiChatFactualToolError,
  type CoachAiChatAnalyticsAggregateSelection,
  type CoachAiChatAnalyticsPageRequest,
  type CoachAiChatAnalyticsPageResponse,
  type CoachAiChatFactualToolFilters,
  type CoachAiChatTradeExplorerRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const SYMBOL_PATTERN = /^[A-Za-z0-9._-]{1,32}$/u;
const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/u;
const TIME_BUCKET_PATTERN = /^\d{2}:\d{2}$/u;
const WEEKDAYS = Object.freeze([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const);

const TRADE_EXPLORER_VIEW_GROUPINGS = Object.freeze({
  trading_days: Object.freeze(["closing_day"] as const),
  tickers: Object.freeze(["instrument"] as const),
  entry_times: Object.freeze(["entry_time_bucket"] as const),
  holding_time: Object.freeze(["holding_duration_bucket"] as const),
  position_size: Object.freeze(["maximum_position_bucket"] as const),
  periods: Object.freeze([
    "closing_day", "closing_iso_week", "closing_month", "closing_year",
  ] as const),
});

const TRADE_EXPLORER_TRADE_RANK_METRICS = new Set<string>(
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
);
const TRADE_EXPLORER_DAY_RANK_METRICS = new Set<string>(
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
);

const PAGE_CONTRACTS = Object.freeze({
  get_analytics_overview: Object.freeze({
    groupings: Object.freeze(["closing_month"] as const),
    metricIds: Object.freeze([
      "net_pnl", "win_rate", "profit_factor", "expectancy",
      "average_winning_trade", "average_losing_trade", "best_trade",
      "worst_trade", "total_trades",
    ]),
    route: "/analytics",
  }),
  get_results_by_ticker: Object.freeze({
    groupings: Object.freeze(["instrument"] as const),
    metricIds: Object.freeze([
      "net_pnl", "win_rate", "profit_factor", "total_trades",
      "trading_day_count", "average_pnl",
    ]),
    route: "/analytics/results",
  }),
  get_timing_analytics: Object.freeze({
    groupings: Object.freeze([
      "entry_time_bucket", "exit_time_bucket", "entry_weekday", "entry_session",
    ] as const),
    metricIds: Object.freeze(["net_pnl", "average_pnl", "win_rate", "included_count"]),
    route: "/analytics/timing",
  }),
  get_execution_analytics: Object.freeze({
    groupings: Object.freeze([
      "entered_quantity_bucket", "maximum_position_bucket", "holding_duration_bucket",
    ] as const),
    metricIds: Object.freeze(["net_pnl", "win_rate", "included_count"]),
    route: "/analytics/execution",
  }),
});

type ExtendedFilters = NonNullable<CoachAiChatTradeExplorerRequest["filters"]>;

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function validDate(value: string): boolean {
  return DATE_PATTERN.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00.000Z`));
}

function validateBaseFilters(input: CoachAiChatFactualToolFilters | undefined): void {
  if (input?.closingDateRange && (!validDate(input.closingDateRange.startDate) ||
      !validDate(input.closingDateRange.endDate) ||
      input.closingDateRange.startDate > input.closingDateRange.endDate)) invalid();
  if (input?.currency !== undefined && !CURRENCY_PATTERN.test(input.currency)) invalid();
  if (input?.symbols && (input.symbols.length > 25 ||
      input.symbols.some((value) => !SYMBOL_PATTERN.test(value)))) invalid();
  if (input?.directions?.some((value) => value !== "long" && value !== "short")) invalid();
  if (input?.tradeClassifications?.some((value) =>
    value !== "day_trade" && value !== "multi_day_trade")) invalid();
  if (input?.provenance?.some((value) =>
    !["broker_only", "manual_only", "correction_only", "mixed", "unknown"].includes(value))) invalid();
  if (input?.outcomes?.some((value) => !["win", "loss", "flat"].includes(value))) invalid();
}

function decimal(value: string | undefined): string | null {
  if (value === undefined) return null;
  if (!DECIMAL_PATTERN.test(value)) invalid();
  return value;
}

function range(minimum: string | undefined, maximum: string | undefined) {
  const minimumInclusive = decimal(minimum);
  const maximumInclusive = decimal(maximum);
  if (minimumInclusive !== null && maximumInclusive !== null &&
      new Decimal(minimumInclusive).gt(maximumInclusive)) invalid();
  return Object.freeze({ minimumInclusive, maximumInclusive });
}

function groupMetric(
  group: JournalAnalyticsGroupResult,
  metricId: string,
): JournalAnalyticsMetricResult | null {
  return group.metrics.find((candidate) => candidate.metricId === metricId) ?? null;
}

function rankTradeExplorerGroups(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
  direction: "ascending" | "descending",
): JournalAnalyticsPartitionedResponse {
  return Object.freeze({
    ...response,
    partitions: Object.freeze(response.partitions.map((partition) => Object.freeze({
      ...partition,
      groups: Object.freeze([...partition.groups].sort((left, right) => {
        const leftValue = groupMetric(left, metricId)?.value ?? null;
        const rightValue = groupMetric(right, metricId)?.value ?? null;
        if (leftValue === null && rightValue === null) {
          return left.label.localeCompare(right.label);
        }
        if (leftValue === null) return 1;
        if (rightValue === null) return -1;
        const comparison = compareTradeExplorerMetricValues(leftValue, rightValue);
        if (comparison === null || comparison === 0) {
          return left.label.localeCompare(right.label);
        }
        return direction === "ascending" ? comparison : -comparison;
      })),
    }))),
  });
}

const AGGREGATE_SELECTION_GROUPINGS = Object.freeze({
  get_analytics_overview: Object.freeze(["closing_day"] as const),
  get_results_by_ticker: Object.freeze(["instrument"] as const),
  get_timing_analytics: Object.freeze([
    "entry_weekday", "entry_session", "entry_time_bucket", "exit_time_bucket",
  ] as const),
  get_execution_analytics: Object.freeze([] as const),
});

function aggregateSelection(
  request: CoachAiChatAnalyticsPageRequest,
): CoachAiChatAnalyticsAggregateSelection | null {
  const selection = request.aggregateSelection;
  if (!selection) return null;
  const supportedGroupings = AGGREGATE_SELECTION_GROUPINGS[request.toolName];
  if (!supportedGroupings.includes(selection.grouping as never) ||
      !["net_pnl", "total_trades", "win_rate"].includes(selection.metricId) ||
      (selection.rankDirection !== "ascending" && selection.rankDirection !== "descending")) {
    invalid();
  }
  return selection;
}

function boundedAggregateResponse(
  response: JournalAnalyticsPartitionedResponse,
  selection: CoachAiChatAnalyticsAggregateSelection,
): JournalAnalyticsPartitionedResponse {
  return Object.freeze({
    ...response,
    partitions: Object.freeze(response.partitions.map((partition) => {
      const ranked = partition.groups.flatMap((group) => {
        if (group.grouping !== selection.grouping) return [];
        const metric = groupMetric(group, selection.metricId);
        if (!metric || metric.value === null || metric.state === "empty" ||
            metric.state === "unavailable") return [];
        return [Object.freeze({ group, metric })];
      }).sort((left, right) => {
        const comparison = compareTradeExplorerMetricValues(left.metric.value!, right.metric.value!);
        if (comparison === null || comparison === 0) {
          return left.group.label.localeCompare(right.group.label);
        }
        return selection.rankDirection === "ascending" ? comparison : -comparison;
      });
      return Object.freeze({
        ...partition,
        groups: Object.freeze(ranked.slice(0, 1).map((item) => item.group)),
      });
    })),
  });
}

function queryWithFilters(
  scope: WorkspaceAccessScope,
  selectedAccountId: string,
  metricIds: readonly string[],
  groupings: JournalAnalyticsQuery["groupings"],
  moneyBasis: JournalAnalyticsMoneyBasis,
  filters: CoachAiChatFactualToolFilters | undefined,
  asOfUtc: string,
  pageSize = 50,
  afterCursor: string | null = null,
): JournalAnalyticsQuery {
  narrowWorkspaceAccessToAccount(scope, selectedAccountId);
  validateBaseFilters(filters);
  const base = buildJournalAnalyticsDashboardQuery(scope, {
    metricIds,
    groupings,
    moneyBasis,
    currency: filters?.currency ?? null,
    closingDateRange: filters?.closingDateRange
      ? Object.freeze({ kind: "inclusive_closing_date" as const, ...filters.closingDateRange })
      : Object.freeze({ kind: "all_available" as const }),
    asOfUtc,
    pageSize,
    afterCursor,
  });
  return Object.freeze({
    ...base,
    symbols: Object.freeze((filters?.symbols ?? []).map((value) => value.toUpperCase())),
    directions: Object.freeze([...(filters?.directions ?? [])]) as readonly JournalAnalyticsDirection[],
    tradeClassifications: Object.freeze([...(filters?.tradeClassifications ?? [])]) as readonly JournalAnalyticsTradeClassification[],
    provenance: Object.freeze([...(filters?.provenance ?? [])]) as readonly JournalAnalyticsProvenanceGroup[],
    outcomes: Object.freeze([...(filters?.outcomes ?? [])]) as readonly JournalAnalyticsOutcome[],
  });
}

export class CoachAiChatAnalyticsPageToolService {
  constructor(private readonly analytics: Pick<JournalAnalyticsService,
    "getAnalyticsOverview" | "getResultAnalytics" | "getTimingAnalytics" |
    "getExecutionAnalytics" | "getRoundTripAnalyticsTable">) {}

  readPage(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatAnalyticsPageRequest,
    asOfUtc: string,
  ): CoachAiChatAnalyticsPageResponse {
    const definition = PAGE_CONTRACTS[request.toolName];
    const selection = aggregateSelection(request);
    const query = queryWithFilters(
      scope,
      selectedAccountId,
      definition.metricIds,
      selection ? Object.freeze([selection.grouping]) : definition.groupings,
      request.moneyBasis,
      request.filters,
      asOfUtc,
    );
    const response = request.toolName === "get_results_by_ticker"
      ? this.analytics.getResultAnalytics(scope, query)
      : request.toolName === "get_timing_analytics"
        ? this.analytics.getTimingAnalytics(scope, query)
        : request.toolName === "get_execution_analytics"
          ? this.analytics.getExecutionAnalytics(scope, query)
          : this.analytics.getAnalyticsOverview(scope, query);
    const result = selection ? boundedAggregateResponse(response, selection) : response;
    const table = request.toolName === "get_execution_analytics" && result.partitions.length === 1
      ? this.analytics.getRoundTripAnalyticsTable(scope, Object.freeze({
          ...query,
          metricIds: Object.freeze(["included_count"]),
          currency: result.partitions[0]?.currency ?? query.currency,
          groupings: Object.freeze([]),
          table: Object.freeze({ pageSize: 50, afterCursor: null }),
        }))
      : null;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({ response: result, table, link: definition.route }),
    });
  }

  tradeExplorer(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatTradeExplorerRequest,
    asOfUtc: string,
  ): CoachAiChatAnalyticsPageResponse {
    const tradesView = request.resultView === "trades";
    const groupedView = Object.hasOwn(TRADE_EXPLORER_VIEW_GROUPINGS, request.resultView);
    const allowedGroupings = groupedView
      ? TRADE_EXPLORER_VIEW_GROUPINGS[
          request.resultView as keyof typeof TRADE_EXPLORER_VIEW_GROUPINGS
        ]
      : Object.freeze([]);
    const allowedRankMetrics = request.resultView === "trading_days"
      ? TRADE_EXPLORER_DAY_RANK_METRICS
      : TRADE_EXPLORER_TRADE_RANK_METRICS;
    if ((!tradesView && !groupedView) ||
        (tradesView && (
          request.metricId !== undefined || request.grouping !== undefined ||
          request.rankDirection !== undefined || request.tradeSort === undefined ||
          request.pageSize === undefined || request.afterCursor === undefined ||
          !COACH_AI_CHAT_TRADE_EXPLORER_TRADE_SORTS.includes(request.tradeSort)
        )) ||
        (groupedView && (
          request.metricId === undefined || request.grouping === undefined ||
          request.rankDirection === undefined || request.tradeSort !== undefined ||
          request.pageSize !== undefined || request.afterCursor !== undefined ||
          (request.rankDirection !== "ascending" &&
            request.rankDirection !== "descending") ||
          !COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS.includes(request.metricId) ||
          !COACH_AI_CHAT_TRADE_EXPLORER_GROUPINGS.includes(request.grouping) ||
          !new Set<string>(allowedGroupings).has(request.grouping) ||
          !allowedRankMetrics.has(request.metricId)
        )) ||
        (tradesView && (
          !Number.isSafeInteger(request.pageSize) || request.pageSize! < 1 ||
          request.pageSize! > COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE ||
          (request.afterCursor !== null && (typeof request.afterCursor !== "string" ||
            request.afterCursor.length === 0 || request.afterCursor.length > 4_096))
        ))) invalid();
    const filters: ExtendedFilters = request.filters ?? {};
    if ((filters.symbols?.length ?? 0) > 1 ||
        (filters.directions?.length ?? 0) > 1 ||
        (filters.tradeClassifications?.length ?? 0) > 1 ||
        (filters.outcomes?.length ?? 0) > 1 ||
        (filters.provenance?.length ?? 0) > 0 ||
        (filters.entryWeekdays?.length ?? 0) > 1 ||
        (filters.entryTimeBuckets?.length ?? 0) > 1) invalid();
    const outcome = filters.outcomes?.length === 1 ? filters.outcomes[0]! : null;
    const selectedMetricId = groupedView
      ? tradeExplorerMetricForOutcome(
          tradeExplorerMetricForMoneyBasis(request.metricId!, request.moneyBasis),
          outcome,
        )
      : null;
    const metricIds = Object.freeze([...new Set([
      "total_trades",
      request.moneyBasis === "gross" ? "gross_pnl" : "net_pnl",
      ...(outcome === null ? ["win_rate", "profit_factor"] : []),
      ...(selectedMetricId === null ? [] : [selectedMetricId]),
    ])].sort());
    const base = queryWithFilters(
      scope,
      selectedAccountId,
      metricIds,
      Object.freeze(groupedView ? [request.grouping!] : []),
      request.moneyBasis,
      filters,
      asOfUtc,
      tradesView ? request.pageSize! : COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE,
      tradesView ? request.afterCursor! : null,
    );
    const entryWeekdays = filters.entryWeekdays ?? [];
    if (entryWeekdays.some((value) => !WEEKDAYS.includes(value as typeof WEEKDAYS[number]))) invalid();
    const entryTimeBuckets = filters.entryTimeBuckets ?? [];
    if (entryTimeBuckets.some((value) => !TIME_BUCKET_PATTERN.test(value))) invalid();
    const minimumHolding = filters.minimumHoldingMilliseconds ?? null;
    const maximumHolding = filters.maximumHoldingMilliseconds ?? null;
    if ((minimumHolding !== null && (!Number.isSafeInteger(minimumHolding) || minimumHolding < 0)) ||
        (maximumHolding !== null && (!Number.isSafeInteger(maximumHolding) || maximumHolding < 0)) ||
        (minimumHolding !== null && maximumHolding !== null && minimumHolding > maximumHolding)) invalid();
    const query: JournalAnalyticsQuery = Object.freeze({
      ...base,
      entryWeekdays: Object.freeze([...entryWeekdays]) as readonly JournalAnalyticsWeekday[],
      entryTimeBuckets: Object.freeze([...entryTimeBuckets]),
      holdingDurationRange: Object.freeze({
        minimumMillisecondsInclusive: minimumHolding,
        maximumMillisecondsInclusive: maximumHolding,
      }),
      enteredQuantityRange: range(filters.minimumEnteredQuantity, filters.maximumEnteredQuantity),
      maximumPositionRange: range(filters.minimumPositionQuantity, filters.maximumPositionQuantity),
      entryNotionalRange: range(filters.minimumEntryNotional, filters.maximumEntryNotional),
    });
    const response = this.analytics.getAnalyticsOverview(scope, query);
    const rankedResponse = groupedView
      ? rankTradeExplorerGroups(response, selectedMetricId!, request.rankDirection!)
      : response;
    const tradeSort = tradesView
      ? tradeExplorerTradeSortForOutcome(request.tradeSort!, outcome)
      : null;
    const evidence = tradesView && response.partitions.length === 1
      ? this.analytics.getRoundTripAnalyticsTable(scope, Object.freeze({
          ...query,
          groupings: Object.freeze([]),
        }), tradeExplorerTableOrder(tradeSort!))
      : null;
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        resultView: request.resultView,
        selectedMetricId,
        grouping: groupedView ? request.grouping : null,
        tradeSort,
        rankDirection: groupedView ? request.rankDirection : null,
        response: rankedResponse,
        evidence,
        evidenceUnavailableReason: !tradesView || evidence
          ? null
          : "Choose one currency to view individual trades.",
        reviewWorkflow: Object.freeze({
          availableFor: "confirmed_completed_trade",
          savedFactsTool: "get_trade_annotations",
          combinedSaveInChat: false,
          saveLocation: "/analytics/trade-explorer",
          safeguards: Object.freeze([
            "One explicit Save writes the note, tags, and changed custom-rule reviews together.",
            "Preset rule results are factual and read-only.",
            "Stale or cross-account Review state is rejected.",
          ]),
        }),
        link: "/analytics/trade-explorer",
      }),
    });
  }
}
