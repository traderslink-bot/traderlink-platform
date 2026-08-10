import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { subtractExactDecimals } from "@/src/modules/journal-analytics/server/exact-analytics-math";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const metadata: Metadata = {
  title: "Round Trips | TraderLink Platform",
};

export const dynamic = "force-dynamic";

type RoundTripSearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function timestamp(value: string): string {
  return value.replace("T", " ").replace(".000Z", " UTC");
}

function money(value: string | null): string {
  if (value === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(value, 2, true);
  return formatted.startsWith("-") ? `-$${formatted.slice(1)}` : `$${formatted}`;
}

function fees(cost: string | null, credit: string | null): string {
  return cost === null || credit === null
    ? "N/A"
    : money(subtractExactDecimals(cost, credit));
}

export default async function RoundTripsPage({
  searchParams,
}: {
  searchParams: RoundTripSearchParams;
}) {
  redirect("/analytics/execution");
  const params = await searchParams;
  const scope = await requireTraderLinkPlatformPageScope();
  const requestedCurrency = one(params, "currency")?.toUpperCase() ?? null;
  const instrumentId = one(params, "instrumentId") ?? null;
  const requestedDate = one(params, "date");
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/u.test(requestedDate)
    ? requestedDate
    : null;
  const afterCursor = one(params, "after") ?? null;
  const result = withJournalAnalyticsDashboardRuntime(scope, ({ service }) => {
    const overviewQuery = buildJournalAnalyticsDashboardQuery(scope, {
      metricIds: ["included_count"],
    });
    const overview = service.getAnalyticsOverview(scope, overviewQuery);
    const currencies = overview.partitions.flatMap((partition) =>
      partition.currency ? [partition.currency] : []);
    const currency = requestedCurrency && currencies.includes(requestedCurrency)
      ? requestedCurrency
      : currencies[0] ?? null;
    if (currency === null) {
      return Object.freeze({ overview, currency, table: null });
    }
    const tableQuery = buildJournalAnalyticsDashboardQuery(scope, {
      metricIds: ["included_count"],
      currency,
      closingDateRange: selectedDate
        ? Object.freeze({
            kind: "inclusive_closing_date" as const,
            startDate: selectedDate,
            endDate: selectedDate,
          })
        : undefined,
      instrumentIds: instrumentId ? Object.freeze([instrumentId]) : undefined,
      pageSize: 200,
      afterCursor,
    });
    const table = service.getRoundTripAnalyticsTable(scope, tableQuery);
    return Object.freeze({ overview, currency, table });
  });
  if (result.table === null || result.currency === null) {
    return (
      <DashboardPage>
        <DashboardPanel title="Round trips">
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Import trades"
            description="No analytics-ready round trips are available in Trade Tracker. No V3 or sample rows are substituted."
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const table = result.table;
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trades
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Round Trips
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          {instrumentId
            ? `Completed history for the selected stable instrument${selectedDate ? ` on ${selectedDate}` : ""}, reconstructed from the Trade Tracker execution history.`
            : "Completed trades are reconstructed from the Trade Tracker execution history."}
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        {result.overview.partitions.length > 1 ? result.overview.partitions.map((partition) => (
          <Chip
            color={partition.currency === result.currency ? "primary" : "default"}
            component="a"
            href={`/trades/roundtrips?currency=${encodeURIComponent(partition.currency ?? "")}`}
            key={`${partition.currency ?? "currency-unavailable"}-${partition.timezone ?? "timezone-unavailable"}`}
            label={partition.currency ?? "Currency unavailable"}
            size="small"
            variant={partition.currency === result.currency ? "filled" : "outlined"}
          />
        )) : null}
      </Stack>

      <DashboardPanel hideHeader
        eyebrow={`${table.currency ?? "Currency unavailable"} · ${table.timezone}`}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Closed</TableCell>
                <TableCell>Ticker</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Executions</TableCell>
                <TableCell>Gross P/L</TableCell>
                <TableCell>Net P/L</TableCell>
                <TableCell>Fees</TableCell>
                <TableCell>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row) => (
                <TableRow key={row.roundTripId}>
                  <TableCell>{timestamp(row.closedAtUtc)}</TableCell>
                  <TableCell>{row.displayedSymbol}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell>
                  <TableCell>{row.uniqueExecutionCount}</TableCell>
                  <TableCell>{money(row.grossPnlDecimal)}</TableCell>
                  <TableCell>{money(row.selectedPnlDecimal)}</TableCell>
                  <TableCell>{fees(row.chargeCostDecimal, row.chargeCreditDecimal)}</TableCell>
                  <TableCell>
                    <Button href={`/trades/candle-review?trade=${encodeURIComponent(row.roundTripId)}`} size="small" variant="outlined">
                      Candle Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
          {afterCursor ? (
            <Button href={`/trades/roundtrips?currency=${encodeURIComponent(result.currency)}${instrumentId ? `&instrumentId=${encodeURIComponent(instrumentId)}` : ""}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""}`} variant="outlined">
              First page
            </Button>
          ) : null}
          {table.continuationCursor ? (
            <Button
              href={`/trades/roundtrips?currency=${encodeURIComponent(result.currency)}${instrumentId ? `&instrumentId=${encodeURIComponent(instrumentId)}` : ""}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""}&after=${encodeURIComponent(table.continuationCursor)}`}
              variant="contained"
            >
              Next page
            </Button>
          ) : null}
        </Stack>
      </DashboardPanel>

    </DashboardPage>
  );
}
