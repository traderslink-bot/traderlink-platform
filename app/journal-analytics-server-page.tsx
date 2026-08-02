import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
} from "./dashboard-template";
import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  formatJournalAnalyticsMetric,
  journalAnalyticsMetricCaption,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsDashboardService,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export type AnalyticsServerPageKind =
  | "overview"
  | "performance"
  | "results"
  | "timing"
  | "execution";

type PageDefinition = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  grouping: JournalAnalyticsGrouping;
  groupingTitle: string;
  metricIds: readonly string[];
}>;

const DEFINITIONS: Readonly<Record<AnalyticsServerPageKind, PageDefinition>> = {
  overview: {
    eyebrow: "Analytics",
    title: "Account overview",
    description: "Profitability, consistency, costs, and trade-population results calculated from accepted Journal executions.",
    grouping: "closing_month",
    groupingTitle: "Monthly breakdown",
    metricIds: ["net_pnl", "win_rate", "expectancy", "profit_factor", "included_count", "trading_day_count"],
  },
  performance: {
    eyebrow: "Analytics / Performance",
    title: "Performance over time",
    description: "Daily realized performance, path quality, outlier dependence, and drawdown derived from completed execution chains.",
    grouping: "closing_day",
    groupingTitle: "Daily breakdown",
    metricIds: ["net_pnl", "average_pnl", "median_pnl", "average_daily_pnl", "best_trading_day", "maximum_intraday_realized_drawdown"],
  },
  results: {
    eyebrow: "Analytics / Results",
    title: "Trade results",
    description: "Winning, losing, flat, average, expectancy, concentration, and gross-to-net results from analytics-ready round trips.",
    grouping: "direction",
    groupingTitle: "Direction breakdown",
    metricIds: ["total_winning_net_pnl", "total_losing_net_pnl", "average_winning_trade", "average_losing_trade", "expectancy", "profit_factor"],
  },
  timing: {
    eyebrow: "Analytics / Timing",
    title: "Timing",
    description: "Entry-time and holding-duration results calculated from the actual timestamps on accepted executions.",
    grouping: "entry_time_bucket",
    groupingTitle: "Entry-time breakdown",
    metricIds: ["net_pnl", "win_rate", "expectancy", "average_holding_time", "median_holding_time", "included_count"],
  },
  execution: {
    eyebrow: "Analytics / Execution",
    title: "Execution",
    description: "Direction, quantity, notional, provenance, and trading-cost results derived from accepted Journal execution records.",
    grouping: "direction",
    groupingTitle: "Direction breakdown",
    metricIds: ["included_count", "average_share_quantity", "average_entry_notional", "signed_charges", "net_pnl_per_100_shares", "return_on_entry_notional"],
  },
};

function metricById(
  metrics: readonly JournalAnalyticsMetricResult[],
  metricId: string,
): JournalAnalyticsMetricResult | null {
  return metrics.find((metric) => metric.metricId === metricId) ?? null;
}

function executePageQuery(
  page: AnalyticsServerPageKind,
  responseFactory: Readonly<{
    overview: () => JournalAnalyticsPartitionedResponse;
    performance: () => JournalAnalyticsPartitionedResponse;
    results: () => JournalAnalyticsPartitionedResponse;
    timing: () => JournalAnalyticsPartitionedResponse;
    execution: () => JournalAnalyticsPartitionedResponse;
  }>,
): JournalAnalyticsPartitionedResponse {
  return responseFactory[page]();
}

export async function AnalyticsServerPage({
  page,
}: {
  page: AnalyticsServerPageKind;
}) {
  const definition = DEFINITIONS[page];
  const scope = await requireTraderLinkPlatformPageScope();
  const query = buildJournalAnalyticsDashboardQuery(scope, {
    metricIds: definition.metricIds,
    groupings: [definition.grouping],
  });
  const response = withJournalAnalyticsDashboardService(scope, (service) =>
    executePageQuery(page, {
      overview: () => service.getAnalyticsOverview(scope, query),
      performance: () => service.getPerformanceAnalytics(scope, query),
      results: () => service.getResultAnalytics(scope, query),
      timing: () => service.getTimingAnalytics(scope, query),
      execution: () => service.getExecutionAnalytics(scope, query),
    }));
  const limitations = [...new Set([
    ...response.limitations,
    ...response.partitions.flatMap((partition) => partition.limitations),
  ])];

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          {definition.eyebrow}
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          {definition.title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          {definition.description}
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        {response.partitions.map((partition) => (
          <Chip
            key={`${partition.currency ?? "currency-unavailable"}-${partition.timezone ?? "timezone-unavailable"}`}
            label={`${partition.currency ?? "Currency unavailable"} · ${partition.timezone ?? "Timezone unavailable"}`}
            size="small"
            variant="outlined"
          />
        ))}
        <Chip
          label={`${response.crossPartitionCounts.readyClosedCount} analytics-ready round trips`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {response.crossPartitionCounts.needsDecisionCount > 0 || limitations.length > 0 ? (
        <Alert
          action={response.crossPartitionCounts.needsDecisionCount > 0 ? (
            <Button color="inherit" href="/data-decisions" size="small">
              Review Data Decisions
            </Button>
          ) : undefined}
          severity="warning"
        >
          {response.crossPartitionCounts.needsDecisionCount > 0
            ? `${response.crossPartitionCounts.needsDecisionCount} unresolved items are contained and excluded from dependent calculations. Unrelated valid trades remain visible.`
            : "Some results are unavailable because the required facts do not exist in the selected Journal scope."}
        </Alert>
      ) : null}

      {response.partitions.map((partition) => (
        <Box key={partition.currency ?? "currency-unavailable"}>
          {response.partitions.length > 1 ? (
            <Typography sx={{ fontWeight: 800, mb: 1 }}>
              {partition.currency ?? "Currency unavailable"}
            </Typography>
          ) : null}
          <Box sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
            },
          }}>
            {definition.metricIds.map((metricId) => {
              const metric = metricById(partition.metrics, metricId);
              return (
                <DashboardMetricCard
                  caption={metric ? journalAnalyticsMetricCaption(metric) : "Unavailable for this scope"}
                  key={metricId}
                  label={metric?.title ?? metricId}
                  value={metric ? formatJournalAnalyticsMetric(metric) : "Unavailable"}
                />
              );
            })}
          </Box>
        </Box>
      ))}

      <DashboardPanel
        action={<Chip
          label={`${response.partitions.reduce((count, partition) =>
            count + partition.groups.length, 0)} groups`}
          size="small"
          variant="outlined"
        />}
        eyebrow="Replacement Journal analytics"
        title={definition.groupingTitle}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {response.partitions.length > 1 ? <TableCell>Currency</TableCell> : null}
                <TableCell>Group</TableCell>
                {definition.metricIds.map((metricId) => (
                  <TableCell align="right" key={metricId}>
                    {response.partitions[0]?.metrics.find((metric) =>
                      metric.metricId === metricId)?.title ?? metricId}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {response.partitions.flatMap((partition) =>
                partition.groups.map((group) => (
                  <TableRow key={`${partition.currency ?? "currency-unavailable"}-${group.grouping}-${group.groupKey}`}>
                    {response.partitions.length > 1 ? (
                      <TableCell>{partition.currency ?? "Unavailable"}</TableCell>
                    ) : null}
                    <TableCell>{group.label}</TableCell>
                    {definition.metricIds.map((metricId) => {
                      const metric = metricById(group.metrics, metricId);
                      return (
                        <TableCell align="right" key={metricId}>
                          {metric ? formatJournalAnalyticsMetric(metric) : "Unavailable"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardPanel>
    </DashboardPage>
  );
}
