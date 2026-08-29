import type { OverviewDateRange } from "@/app/(dashboard)/analytics/overview-date-range-control";
import type { EntryPriceComparison, EntryPriceInsights, EntryPriceResult, ExecutionChartData, ExecutionTradeRow } from "@/app/(dashboard)/analytics/execution-analytics-client";
import type { ResultsTickerRow } from "@/app/(dashboard)/analytics/results-ticker-table";
import type { TimingChartData } from "@/app/(dashboard)/analytics/timing/timing-analytics-client";
import type { TradeAnalysisView } from "@/app/(dashboard)/analytics/trade-analysis-client";
import type { JournalAnalyticsPartitionedResponse } from "./analytics-result";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import type { DailyTradeAnalyzedTradePage } from "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import type { DailyTradeLongTermAnalyticsModel } from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

export type JournalAnalyticsOfflineRouteKind =
  | "analytics-overview"
  | "analytics-results"
  | "analytics-timing"
  | "analytics-execution"
  | "trade-analyzer-day"
  | "trade-analyzer-entry-exit"
  | "trade-analyzer-mfe-mae"
  | "trade-analyzer-green-to-red"
  | "trade-analyzer-candle-patterns"
  | "trade-analyzer-trades";

export const JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION =
  "journal-analytics-route-view-v1" as const;

export const JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS: Readonly<
  Record<JournalAnalyticsOfflineRouteKind, string>
> = Object.freeze({
  "analytics-execution": "journal-analytics:execution:v2",
  "analytics-overview": "journal-analytics:overview:current",
  "analytics-results": "journal-analytics:results:current",
  "analytics-timing": "journal-analytics:timing:current",
  "trade-analyzer-candle-patterns": "journal-analytics:trade-analyzer:candle-patterns:current",
  "trade-analyzer-day": "journal-analytics:trade-analyzer:day:current",
  "trade-analyzer-entry-exit": "journal-analytics:trade-analyzer:entry-exit:current",
  "trade-analyzer-green-to-red": "journal-analytics:trade-analyzer:green-to-red:current",
  "trade-analyzer-mfe-mae": "journal-analytics:trade-analyzer:mfe-mae:current",
  "trade-analyzer-trades": "journal-analytics:trade-analyzer:trades:current",
});

type EvidenceQuery = Readonly<{
  currency: string | null;
  endDate: string | null;
  moneyBasis: "gross" | "net";
  startDate: string | null;
}>;

export type JournalAnalyticsOverviewOfflineViewModel = Readonly<{
  dateRange: OverviewDateRange;
  kind: "analytics-overview";
  response: JournalAnalyticsPartitionedResponse;
  version: 1;
}>;

export type JournalAnalyticsResultsOfflineViewModel = Readonly<{
  dateRange: OverviewDateRange;
  kind: "analytics-results";
  rows: readonly ResultsTickerRow[];
  version: 1;
}>;

export type JournalAnalyticsTimingOfflineViewModel = Readonly<{
  chartData: TimingChartData;
  completedTradeCount: number;
  kind: "analytics-timing";
  timezone: string;
  version: 1;
}>;

export type JournalAnalyticsExecutionOfflineViewModel = Readonly<{
  chartData: ExecutionChartData;
  currency: string | null;
  dateRange: OverviewDateRange;
  kind: "analytics-execution";
  priceComparison: EntryPriceComparison;
  priceInsights: EntryPriceInsights;
  priceResults: readonly EntryPriceResult[];
  rows: readonly ExecutionTradeRow[];
  version: 1;
}>;

export type JournalTradeAnalyzerOfflineViewModel = Readonly<{
  dateRange: OverviewDateRange;
  evidenceQuery: EvidenceQuery;
  kind:
    | "trade-analyzer-day"
    | "trade-analyzer-entry-exit"
    | "trade-analyzer-mfe-mae"
    | "trade-analyzer-green-to-red"
    | "trade-analyzer-candle-patterns";
  model: DailyTradeLongTermAnalyticsModel;
  version: 1;
  view: Exclude<TradeAnalysisView, "trades">;
}>;

export type JournalAnalyzedTradesOfflineViewModel = Readonly<{
  currency: string | null;
  dateRange: OverviewDateRange;
  kind: "trade-analyzer-trades";
  moneyBasis: "gross" | "net";
  page: DailyTradeAnalyzedTradePage | null;
  version: 1;
}>;

export type JournalAnalyticsOfflineViewModel =
  | JournalAnalyticsOverviewOfflineViewModel
  | JournalAnalyticsResultsOfflineViewModel
  | JournalAnalyticsTimingOfflineViewModel
  | JournalAnalyticsExecutionOfflineViewModel
  | JournalTradeAnalyzerOfflineViewModel
  | JournalAnalyzedTradesOfflineViewModel;

const ANALYZER_KIND_BY_VIEW: Readonly<
  Record<Exclude<TradeAnalysisView, "trades">, JournalTradeAnalyzerOfflineViewModel["kind"]>
> = Object.freeze({
  "candle-patterns": "trade-analyzer-candle-patterns",
  day: "trade-analyzer-day",
  "entry-exit": "trade-analyzer-entry-exit",
  "green-to-red": "trade-analyzer-green-to-red",
  "mfe-mae": "trade-analyzer-mfe-mae",
});

export function journalAnalyticsOfflineRouteCoverage(
  kind: JournalAnalyticsOfflineRouteKind,
): readonly PlatformOfflineCoverageFact[] {
  const analyzer = kind.startsWith("trade-analyzer");
  return Object.freeze([
    Object.freeze({
      key: kind,
      label: analyzer ? "Trade Analyzer saved results" : "Analytics saved results",
      reason: null,
      status: "available" as const,
    }),
    Object.freeze({
      key: `${kind}_live_details`,
      label: "Live details and updated results",
      reason: "Reconnect to change the date range, load trade details, or request updated results.",
      status: "unavailable" as const,
    }),
  ]);
}

function localTradeRef(index: number): string {
  return `offline-trade-${index + 1}`;
}

export function createJournalTradeAnalyzerOfflineViewModel(input: Readonly<{
  dateRange: OverviewDateRange;
  evidenceQuery: EvidenceQuery;
  model: DailyTradeLongTermAnalyticsModel;
  view: Exclude<TradeAnalysisView, "trades">;
}>): JournalTradeAnalyzerOfflineViewModel {
  const localRefByRoundTrip = new Map<string, string>();
  const localRef = (roundTripId: string) => {
    const existing = localRefByRoundTrip.get(roundTripId);
    if (existing) return existing;
    const value = localTradeRef(localRefByRoundTrip.size);
    localRefByRoundTrip.set(roundTripId, value);
    return value;
  };
  const model = Object.freeze({
    ...input.model,
    excursions: Object.freeze(input.model.excursions.map((row) => Object.freeze({
      ...row,
      roundTripId: localRef(row.roundTripId),
    }))),
    trades: Object.freeze(input.model.trades.map((row) => Object.freeze({
      ...row,
      roundTripId: localRef(row.roundTripId),
    }))),
  });
  return Object.freeze({
    dateRange: Object.freeze({ ...input.dateRange }),
    evidenceQuery: Object.freeze({ ...input.evidenceQuery }),
    kind: ANALYZER_KIND_BY_VIEW[input.view],
    model,
    version: 1,
    view: input.view,
  });
}

export function createJournalAnalyzedTradesOfflineViewModel(input: Readonly<{
  currency: string | null;
  dateRange: OverviewDateRange;
  moneyBasis: "gross" | "net";
  page: DailyTradeAnalyzedTradePage | null;
}>): JournalAnalyzedTradesOfflineViewModel {
  const page = input.page === null ? null : Object.freeze({
    ...input.page,
    continuationCursor: null,
    rows: Object.freeze(input.page.rows.map((row, index) => Object.freeze({
      ...row,
      firstExecutionId: null,
      roundTripId: localTradeRef(index),
    }))),
  });
  return Object.freeze({
    ...input,
    dateRange: Object.freeze({ ...input.dateRange }),
    kind: "trade-analyzer-trades",
    page,
    version: 1,
  });
}

export function createJournalAnalyticsExecutionOfflineViewModel(
  input: Omit<JournalAnalyticsExecutionOfflineViewModel, "kind" | "version">,
): JournalAnalyticsExecutionOfflineViewModel {
  return Object.freeze({
    ...input,
    dateRange: Object.freeze({ ...input.dateRange }),
    kind: "analytics-execution",
    rows: Object.freeze(input.rows.map((row, index) => Object.freeze({
      ...row,
      roundTripId: localTradeRef(index),
    }))),
    version: 1,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJournalAnalyticsOfflineViewModel(
  value: unknown,
  expectedKind: JournalAnalyticsOfflineRouteKind,
): value is JournalAnalyticsOfflineViewModel {
  if (!isRecord(value) || value.version !== 1 || value.kind !== expectedKind) return false;
  if (expectedKind === "analytics-overview") return isRecord(value.response) && isRecord(value.dateRange);
  if (expectedKind === "analytics-results") return Array.isArray(value.rows) && isRecord(value.dateRange);
  if (expectedKind === "analytics-timing") {
    return isRecord(value.chartData) && Number.isSafeInteger(value.completedTradeCount) &&
      typeof value.timezone === "string";
  }
  if (expectedKind === "analytics-execution") {
    return isRecord(value.chartData) && Array.isArray(value.priceResults) &&
      isRecord(value.priceComparison) && isRecord(value.priceInsights) &&
      Array.isArray(value.rows) && isRecord(value.dateRange);
  }
  if (expectedKind === "trade-analyzer-trades") {
    return isRecord(value.dateRange) && (value.page === null || isRecord(value.page));
  }
  return isRecord(value.dateRange) && isRecord(value.evidenceQuery) && isRecord(value.model) &&
    typeof value.view === "string";
}
