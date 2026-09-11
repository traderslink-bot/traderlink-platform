import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardMetricCard, DashboardPage } from "@/app/dashboard-template";
import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import type { JournalAnalyticsMoneyBasis } from "@/src/modules/journal-analytics/contracts/analytics-query";
import { financialSummaryMetricColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { formatJournalAnalyticsMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import { FeatureHelpLink } from "../feature-help-link";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { MonthlyPnlChart, type MonthlyPnlChartRow } from "./monthly-pnl-chart";
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";

export function analyticsOverviewMetrics(moneyBasis: JournalAnalyticsMoneyBasis) {
  return [
  { id: moneyBasis === "gross" ? "gross_pnl" : "net_pnl", label: `${moneyBasis === "gross" ? "Gross" : "Net"} P/L`, help: `Your combined ${moneyBasis} profit or loss across completed trades in the selected dates.` },
  { id: "win_rate", label: "Win rate", help: "The share of completed trades in the selected dates that finished profitable." },
  { id: "profit_factor", label: "Profit factor", help: `${moneyBasis === "gross" ? "Gross" : "Net"} winning results divided by ${moneyBasis} losing results. Above 1 means the combined wins were larger than the combined losses.` },
  { id: "expectancy", label: "Expectancy", help: `Your average ${moneyBasis} result per completed trade in the selected dates.` },
  { id: "average_winning_trade", label: "Average win", help: `Your average ${moneyBasis} profit across completed winning trades in the selected dates.` },
  { id: "average_losing_trade", label: "Average loss", help: `Your average ${moneyBasis} loss across completed losing trades in the selected dates.` },
  { id: "best_trade", label: "Largest win", help: `Your highest ${moneyBasis} profit on one completed trade in the selected dates.` },
  { id: "worst_trade", label: "Largest loss", help: `Your largest ${moneyBasis} loss on one completed trade in the selected dates.` },
  { id: "total_trades", label: "Completed trades", help: "Every closed trade included in the selected dates." },
  ] as const;
}

function metricFor(metrics: readonly JournalAnalyticsMetricResult[], metricId: string) {
  return metrics.find((metric) => metric.metricId === metricId) ?? null;
}

function numberValue(value: JournalAnalyticsExactValue | null): number | null {
  if (value === null || value.kind === "text" || value.kind === "duration") return null;
  if (value.kind === "integer") return value.value;
  return Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
}

function monthLabel(value: string): string {
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC", year: "numeric" }).format(date);
}

function MonthlyPnlChartForPartition({ moneyBasis, partition }: { moneyBasis: JournalAnalyticsMoneyBasis; partition: JournalAnalyticsResponse }) {
  const rows: readonly MonthlyPnlChartRow[] = partition.groups
    .filter((group) => group.grouping === "closing_month")
    .map((group) => {
      const metric = metricFor(group.metrics, moneyBasis === "gross" ? "gross_pnl" : "net_pnl");
      return {
        display: metric ? formatJournalAnalyticsMetric(metric) : "Unavailable",
        key: group.groupKey,
        label: monthLabel(group.label),
        value: numberValue(metric?.value ?? null) ?? 0,
      };
    });
  return <MonthlyPnlChart rows={rows} />;
}

function OverviewPartition({ moneyBasis, partition, showCurrency }: { moneyBasis: JournalAnalyticsMoneyBasis; partition: JournalAnalyticsResponse; showCurrency: boolean }) {
  return (
    <Stack spacing={2.5}>
      {showCurrency ? <Typography sx={{ fontWeight: 800 }}>{partition.currency ?? "Currency unavailable"}</Typography> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        {analyticsOverviewMetrics(moneyBasis).map((definition) => {
          const metric = metricFor(partition.metrics, definition.id);
          return <DashboardMetricCard action={<AnalyzerHelpTooltip label={definition.label} text={definition.help} />} caption="" hideCaption key={definition.id} label={definition.label} value={metric ? formatJournalAnalyticsMetric(metric) : "Unavailable"} valueColor={financialSummaryMetricColor(definition.id, metric?.value)} />;
        })}
      </Box>
      <MonthlyPnlChartForPartition moneyBasis={moneyBasis} partition={partition} />
    </Stack>
  );
}

export function AnalyticsOverviewView({ dateRange, moneyBasis, offlineSavedAtUtc, response }: {
  dateRange: OverviewDateRange;
  moneyBasis: JournalAnalyticsMoneyBasis;
  offlineSavedAtUtc?: string;
  response: JournalAnalyticsPartitionedResponse;
}) {
  return (
    <DashboardPage>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Overview</Typography>
        </Box>
        <FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" />
      </Stack>
      {offlineSavedAtUtc ? <OfflineSavedViewStatus savedAtUtc={offlineSavedAtUtc} /> : null}
      {offlineSavedAtUtc ? null : (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "center" } }}>
          <OverviewDateRangeControl value={dateRange} />
          <FeatureHelpLink href="/help/core-analytics/overview-and-date-range#set-a-date-range" label="Analytics date range" />
        </Stack>
      )}
      {response.partitions.map((partition) => <OverviewPartition key={partition.currency ?? "currency-unavailable"} moneyBasis={moneyBasis} partition={partition} showCurrency={response.partitions.length > 1} />)}
    </DashboardPage>
  );
}
