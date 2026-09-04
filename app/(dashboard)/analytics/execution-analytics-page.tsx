import "server-only";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-template";
import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  JOURNAL_ANALYTICS_ENTRY_PRICE_COMPARISON_BANDS,
  JOURNAL_ANALYTICS_ENTRY_PRICE_BANDS,
  type JournalAnalyticsGrouping,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  createJournalAnalyticsExecutionOfflineViewModel,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMetric,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { compareExactDecimals, multiplyExactDecimals } from "@/src/modules/journal-analytics/server/exact-analytics-math";
import { toLogicalTradeAnalyticsTable } from "@/src/modules/journal-analytics/server/logical-trade-analytics-table";
import { buildJournalAnalyticsDashboardQuery, resolveJournalAnalyticsMoneyBasis, withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import {
  ExecutionAnalyticsClient,
  type EntryPriceComparison,
  type EntryPriceInsights,
  type EntryPriceResult,
  type ExecutionChartData,
  type ExecutionTradeRow,
} from "./execution-analytics-client";
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { DashboardAppearanceText } from "../dashboard-appearance-text";
import { FeatureHelpLink } from "../feature-help-link";

const CHART_GROUPINGS = ["entered_quantity_bucket", "maximum_position_bucket", "holding_duration_bucket"] as const satisfies readonly JournalAnalyticsGrouping[];
const GROUPINGS = [...CHART_GROUPINGS, "entry_price_bucket", "entry_price_comparison"] as const satisfies readonly JournalAnalyticsGrouping[];
function metricsFor(moneyBasis: "gross" | "net") {
  return [moneyBasis === "gross" ? "gross_pnl" : "net_pnl", "win_rate", "included_count", "win_count", "loss_count", "average_pnl"] as const;
}
const ENTRY_PRICE_MINIMUM_TOTAL_TRADES = 30;
const ENTRY_PRICE_MINIMUM_BAND_TRADES = 10;

function metricFor(metrics: readonly JournalAnalyticsMetricResult[], id: string) {
  return metrics.find((metric) => metric.metricId === id) ?? null;
}

function metricNumber(value: JournalAnalyticsExactValue | null): number | null {
  if (value === null || value.kind === "text" || value.kind === "duration") return null;
  return value.kind === "integer" ? value.value : Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
}

function metricDecimal(value: JournalAnalyticsExactValue | null): string | null {
  if (value === null || value.kind !== "decimal") return null;
  return value.valueDecimal;
}

function entryPriceResults(
  charts: JournalAnalyticsPartitionedResponse,
  pnlMetricId: "gross_pnl" | "net_pnl",
): readonly EntryPriceResult[] {
  const groups = charts.partitions.flatMap((partition) => partition.groups
    .filter((group) => group.grouping === "entry_price_bucket"));
  return Object.freeze(JOURNAL_ANALYTICS_ENTRY_PRICE_BANDS.map((band) => {
    const group = groups.find((candidate) => candidate.groupKey === band.key) ?? null;
    const read = (metricId: string) => metricFor(group?.metrics ?? [], metricId);
    const winRateValue = read("win_rate")?.value ?? null;
    return Object.freeze({
      averagePnl: read("average_pnl") ? formatJournalAnalyticsMetric(read("average_pnl")!) : "N/A",
      averagePnlDecimal: metricDecimal(read("average_pnl")?.value ?? null),
      entryPriceBand: band.label,
      key: band.key,
      losses: metricNumber(read("loss_count")?.value ?? null),
      lossesDisplay: read("loss_count") ? formatJournalAnalyticsMetric(read("loss_count")!) : "N/A",
      netPnl: read(pnlMetricId) ? formatJournalAnalyticsMetric(read(pnlMetricId)!) : "N/A",
      netPnlDecimal: metricDecimal(read(pnlMetricId)?.value ?? null),
      tradeCount: metricNumber(read("included_count")?.value ?? null),
      tradeCountDisplay: read("included_count") ? formatJournalAnalyticsMetric(read("included_count")!) : "N/A",
      winRate: read("win_rate") ? formatJournalAnalyticsMetric(read("win_rate")!) : "N/A",
      winRateDenominatorInteger: winRateValue?.kind === "rational" ? winRateValue.denominatorInteger : null,
      winRateNumeratorDecimal: winRateValue?.kind === "rational" ? winRateValue.numeratorDecimal : null,
      wins: metricNumber(read("win_count")?.value ?? null),
      winsDisplay: read("win_count") ? formatJournalAnalyticsMetric(read("win_count")!) : "N/A",
    });
  }));
}

function entryPriceComparison(charts: JournalAnalyticsPartitionedResponse): EntryPriceComparison {
  const groups = charts.partitions.flatMap((partition) => partition.groups
    .filter((group) => group.grouping === "entry_price_comparison"));
  const results = Object.freeze(JOURNAL_ANALYTICS_ENTRY_PRICE_COMPARISON_BANDS.map((band) => {
    const group = groups.find((candidate) => candidate.groupKey === band.key) ?? null;
    const read = (metricId: string) => metricFor(group?.metrics ?? [], metricId);
    const winRateValue = read("win_rate")?.value ?? null;
    return Object.freeze({
      averagePnl: read("average_pnl") ? formatJournalAnalyticsMetric(read("average_pnl")!) : "N/A",
      averagePnlDecimal: metricDecimal(read("average_pnl")?.value ?? null),
      entryPriceBand: band.label,
      key: band.key,
      tradeCount: metricNumber(read("included_count")?.value ?? null),
      tradeCountDisplay: read("included_count") ? formatJournalAnalyticsMetric(read("included_count")!) : "N/A",
      winRate: read("win_rate") ? formatJournalAnalyticsMetric(read("win_rate")!) : "N/A",
      winRateDenominatorInteger: winRateValue?.kind === "rational" ? winRateValue.denominatorInteger : null,
      winRateNumeratorDecimal: winRateValue?.kind === "rational" ? winRateValue.numeratorDecimal : null,
    });
  }));
  const underOne = results.find((result) => result.key === "under_1")!;
  const oneAndAbove = results.find((result) => result.key === "1_and_over")!;
  const underOneTradeCount = underOne.tradeCount ?? 0;
  const oneAndAboveTradeCount = oneAndAbove.tradeCount ?? 0;
  const totalTradeCount = underOneTradeCount + oneAndAboveTradeCount;
  const underOneTradesNeeded = Math.max(0, ENTRY_PRICE_MINIMUM_BAND_TRADES - underOneTradeCount);
  const oneAndAboveTradesNeeded = Math.max(0, ENTRY_PRICE_MINIMUM_BAND_TRADES - oneAndAboveTradeCount);
  const comparisonAvailable = underOneTradesNeeded === 0 && oneAndAboveTradesNeeded === 0;
  const relation = (value: number | null): "higher" | "lower" | "equal" | null => value === null
    ? null
    : value > 0 ? "higher" : value < 0 ? "lower" : "equal";
  const winRateComparison = !comparisonAvailable || underOne.winRateNumeratorDecimal === null || underOne.winRateDenominatorInteger === null || oneAndAbove.winRateNumeratorDecimal === null || oneAndAbove.winRateDenominatorInteger === null
    ? null
    : relation(compareExactDecimals(
      multiplyExactDecimals(underOne.winRateNumeratorDecimal, oneAndAbove.winRateDenominatorInteger),
      multiplyExactDecimals(oneAndAbove.winRateNumeratorDecimal, underOne.winRateDenominatorInteger),
    ));
  const averagePnlComparison = !comparisonAvailable || underOne.averagePnlDecimal === null || oneAndAbove.averagePnlDecimal === null
    ? null
    : relation(compareExactDecimals(underOne.averagePnlDecimal, oneAndAbove.averagePnlDecimal));
  const evidenceState = totalTradeCount < ENTRY_PRICE_MINIMUM_TOTAL_TRADES
    ? "needs_overall_history" as const
    : !comparisonAvailable || winRateComparison === null || averagePnlComparison === null
      ? "needs_comparison_history" as const
      : Math.min(underOneTradeCount, oneAndAboveTradeCount) * 2 < Math.max(underOneTradeCount, oneAndAboveTradeCount)
        ? "uneven_sample" as const
        : "comparable" as const;
  return Object.freeze({
    averagePnlComparison,
    evidenceState,
    oneAndAbove,
    oneAndAboveTradesNeeded,
    totalTradeCount,
    underOne,
    underOneTradesNeeded,
    winRateComparison,
  });
}

function entryPriceInsights(
  results: readonly EntryPriceResult[],
): EntryPriceInsights {
  const included = results.filter((result) => ["1_to_2", "2_to_3", "3_to_5"].includes(result.key) &&
    result.tradeCount !== null && result.tradeCount >= ENTRY_PRICE_MINIMUM_BAND_TRADES);
  const averagePnlRanked = included.filter((result) => result.averagePnlDecimal !== null);
  const winRateRanked = included.filter((result) => result.winRateNumeratorDecimal !== null &&
    result.winRateDenominatorInteger !== null);
  const compareWinRates = (left: EntryPriceResult, right: EntryPriceResult) => compareExactDecimals(
    multiplyExactDecimals(left.winRateNumeratorDecimal!, right.winRateDenominatorInteger!),
    multiplyExactDecimals(right.winRateNumeratorDecimal!, left.winRateDenominatorInteger!),
  );
  const highestAveragePnl = averagePnlRanked.sort((left, right) => compareExactDecimals(
    right.averagePnlDecimal!, left.averagePnlDecimal!,
  ))[0] ?? null;
  const lowestAveragePnl = averagePnlRanked.sort((left, right) => compareExactDecimals(
    left.averagePnlDecimal!, right.averagePnlDecimal!,
  ))[0] ?? null;
  const highestWinRate = winRateRanked.sort((left, right) => compareWinRates(right, left))[0] ?? null;
  const lowestWinRate = winRateRanked.sort(compareWinRates)[0] ?? null;
  return Object.freeze({
    highestWinRateKey: highestWinRate?.key ?? null,
    highestAveragePnlKey: highestAveragePnl?.key ?? null,
    lowestWinRateKey: lowestWinRate?.key ?? null,
    lowestAveragePnlKey: lowestAveragePnl?.key ?? null,
  });
}

function money(value: string | null, currency: string | null): string {
  if (value === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency);
}

function timestamp(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit",
    month: "2-digit", second: "2-digit", timeZone: timezone, year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

function duration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

function today(): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "America/New_York", year: "numeric" }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function range(input: Readonly<Record<string, string | string[] | undefined>>): OverviewDateRange {
  const kind = typeof input.range === "string" ? input.range : "all";
  const endDate = today();
  const addMonths = (count: number) => { const date = new Date(`${endDate}T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() - count); return date.toISOString().slice(0, 10); };
  if (kind === "3m" || kind === "6m" || kind === "12m") return { endDate, kind, startDate: addMonths(Number(kind.slice(0, -1))) };
  if (kind === "ytd") return { endDate, kind: "ytd", startDate: `${endDate.slice(0, 4)}-01-01` };
  const start = typeof input.start === "string" ? input.start : "";
  const end = typeof input.end === "string" ? input.end : "";
  return kind === "custom" && /^\d{4}-\d{2}-\d{2}$/u.test(start) && /^\d{4}-\d{2}-\d{2}$/u.test(end) && start <= end
    ? { endDate: end, kind: "custom", startDate: start }
    : { endDate: null, kind: "all", startDate: null };
}

export async function ExecutionAnalyticsPage({ searchParams }: { searchParams: Readonly<Record<string, string | string[] | undefined>> }) {
  const scope = await requireTraderLinkPlatformPageScope();
  const selectedRange = range(searchParams);
  const closingDateRange = selectedRange.startDate && selectedRange.endDate
    ? { endDate: selectedRange.endDate, kind: "inclusive_closing_date" as const, startDate: selectedRange.startDate }
    : { kind: "all_available" as const };
  const result = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ database, pnlReportingBasis, service }) => {
    const moneyBasis = resolveJournalAnalyticsMoneyBasis(searchParams.basis, pnlReportingBasis);
    const pnlMetricId = moneyBasis === "gross" ? "gross_pnl" : "net_pnl";
    const chartQuery = buildJournalAnalyticsDashboardQuery(scope, { closingDateRange, groupings: GROUPINGS, metricIds: metricsFor(moneyBasis), moneyBasis });
    const charts = service.getExecutionAnalytics(scope, chartQuery);
    const currency = charts.partitions[0]?.currency ?? null;
    const rawTrades = currency === null ? null : service.getRoundTripAnalyticsTable(scope, buildJournalAnalyticsDashboardQuery(scope, { closingDateRange, currency, metricIds: ["included_count"], moneyBasis, pageSize: 200 }));
    const trades = rawTrades === null ? null : toLogicalTradeAnalyticsTable(scope, database, rawTrades);
    return Object.freeze({ charts, moneyBasis, pnlMetricId, trades });
  });
  const chartData = Object.freeze(Object.fromEntries(CHART_GROUPINGS.map((grouping) => {
    const points = result.charts.partitions.flatMap((partition) => partition.groups
      .filter((group) => group.grouping === grouping)
      .map((group) => Object.freeze({
        key: group.groupKey,
        label: group.label,
        metrics: Object.freeze({
          included_count: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, "included_count")!), value: metricNumber(metricFor(group.metrics, "included_count")?.value ?? null) }),
          [result.pnlMetricId]: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, result.pnlMetricId)!), value: metricNumber(metricFor(group.metrics, result.pnlMetricId)?.value ?? null) }),
          win_rate: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, "win_rate")!), value: metricNumber(metricFor(group.metrics, "win_rate")?.value ?? null) }),
        }),
      })));
    return [grouping, Object.freeze(points)];
  }))) as ExecutionChartData;
  const priceResults = entryPriceResults(result.charts, result.pnlMetricId);
  const priceComparison = entryPriceComparison(result.charts);
  const priceInsights = entryPriceInsights(priceResults);
  const rows: readonly ExecutionTradeRow[] = result.trades?.rows.map((row) => ({ averageEntry: money(row.averageEntryPriceDecimal ?? null, result.trades?.currency ?? null), averageEntryValue: Number(row.averageEntryPriceDecimal ?? 0), averageExit: money(row.averageExitPriceDecimal ?? null, result.trades?.currency ?? null), averageExitValue: Number(row.averageExitPriceDecimal ?? 0), closed: timestamp(row.closedAtUtc, result.trades?.timezone ?? "UTC"), closedValue: row.closedAtUtc, direction: row.direction, executions: row.uniqueExecutionCount, maximumPosition: formatJournalAnalyticsDecimal(row.maximumPositionQuantityDecimal, 2, true), maximumPositionValue: Number(row.maximumPositionQuantityDecimal), netPnl: money(row.selectedPnlDecimal, result.trades?.currency ?? null), netPnlDecimal: row.selectedPnlDecimal, netPnlValue: Number(row.selectedPnlDecimal ?? 0), opened: timestamp(row.openedAtUtc, result.trades?.timezone ?? "UTC"), openedValue: row.openedAtUtc, roundTripId: row.roundTripId, ticker: row.displayedSymbol, tradeType: row.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade", tradeTypeValue: row.tradeClassification, holdTime: duration(row.holdingDurationMilliseconds), holdTimeValue: row.holdingDurationMilliseconds })) ?? [];
  const currency = result.trades?.currency ?? result.charts.partitions[0]?.currency ?? null;
  const offlineModel = createJournalAnalyticsExecutionOfflineViewModel({
    chartData,
    currency,
    dateRange: selectedRange,
    moneyBasis: result.moneyBasis,
    priceComparison,
    priceInsights,
    priceResults,
    rows,
  });
  return <><OfflineSavedViewCapture accountTimezone={result.trades?.timezone ?? result.charts.partitions[0]?.timezone ?? null} calculationVersion={`journal-analytics-${result.charts.registryVersion}`} coverage={journalAnalyticsOfflineRouteCoverage("analytics-execution")} generatedAtUtc={result.charts.generatedAtUtc} model={offlineModel} pathname="/analytics/execution" queryIdentity={`range:${selectedRange.kind}:${selectedRange.startDate ?? "all"}:${selectedRange.endDate ?? "all"}:basis:${result.moneyBasis}`} reportingCurrency={currency} routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION} viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["analytics-execution"]} /><DashboardPage><Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}><Box><DashboardAppearanceText lightColor="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</DashboardAppearanceText><Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Trade Breakdown</Typography><DashboardAppearanceText lightColor="text.secondary" sx={{ mt: 0.5 }}>See how your completed trades were entered, sized, held, and exited.</DashboardAppearanceText></Box><FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" /></Box><Box sx={{ alignItems: { sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 0.5 }}><OverviewDateRangeControl href="/analytics/execution" value={selectedRange} /><FeatureHelpLink href="/help/core-analytics/overview-and-date-range#set-a-date-range" label="Analytics date range" /></Box><ExecutionAnalyticsClient chartData={chartData} currency={currency} moneyBasis={result.moneyBasis} priceComparison={priceComparison} priceInsights={priceInsights} priceResults={priceResults} rows={rows} /></DashboardPage></>;
}
