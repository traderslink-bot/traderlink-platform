import type { Metadata } from "next";

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
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
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

export default async function RoundTripsPage({
  searchParams,
}: {
  searchParams: RoundTripSearchParams;
}) {
  const params = await searchParams;
  const scope = await requireTraderLinkPlatformPageScope();
  const requestedCurrency = one(params, "currency")?.toUpperCase() ?? null;
  const instrumentId = one(params, "instrumentId") ?? null;
  const requestedDate = one(params, "date");
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/u.test(requestedDate)
    ? requestedDate
    : null;
  const afterCursor = one(params, "after") ?? null;
  const result = withJournalAnalyticsDashboardRuntime(scope, ({ facts, service }) => {
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
      return Object.freeze({ overview, currency, table: null, decisions: [] });
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
    const factSet = facts.getJournalAnalyticsFactSet(scope, {
      accountIds: overviewQuery.accountIds,
      closingDateRange: overviewQuery.closingDateRange,
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const decisions = factSet.roundTrips
      .filter((roundTrip) => roundTrip.projectionState === "needs_decision")
      .map((roundTrip) => Object.freeze({
        roundTripId: roundTrip.roundTripId,
        symbol: roundTrip.displayedSymbol,
        direction: roundTrip.direction,
        openedAtUtc: roundTrip.openedAtUtc,
        reasonCodes: roundTrip.pendingDecisionReasonCodes,
      }));
    return Object.freeze({ overview, currency, table, decisions });
  });

  if (result.table === null || result.currency === null) {
    return (
      <DashboardPage>
        <DashboardPanel title="Round trips">
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Import trades"
            description="No analytics-ready round trips are available in the replacement Journal. No V3 or sample rows are substituted."
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
            ? `Completed history for the selected stable instrument${selectedDate ? ` on ${selectedDate}` : ""}, reconstructed from the canonical Journal execution ledger.`
            : "Completed trades are reconstructed from the canonical Journal execution ledger. Items needing a factual trader decision are contained below and do not hide unrelated valid trades."}
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        {result.overview.partitions.map((partition) => (
          <Chip
            color={partition.currency === result.currency ? "primary" : "default"}
            component="a"
            href={`/trades/roundtrips?currency=${encodeURIComponent(partition.currency ?? "")}`}
            key={`${partition.currency ?? "currency-unavailable"}-${partition.timezone ?? "timezone-unavailable"}`}
            label={partition.currency ?? "Currency unavailable"}
            size="small"
            variant={partition.currency === result.currency ? "filled" : "outlined"}
          />
        ))}
        <Chip label={`${table.totalRowCount} ready closed`} size="small" variant="outlined" />
        <Chip label={`${result.decisions.length} need a decision`} size="small" variant="outlined" />
      </Stack>

      {result.decisions.length > 0 ? (
        <Alert
          action={(
            <Button color="inherit" href="/data-decisions" size="small">
              Review Data Decisions
            </Button>
          )}
          severity="warning"
        >
          {result.decisions.length} trade chains need factual review. They are excluded only from calculations that depend on those unresolved facts.
        </Alert>
      ) : null}

      <DashboardPanel
        action={<Chip label={`${table.rows.length} on this page`} size="small" variant="outlined" />}
        eyebrow={`${table.currency ?? "Currency unavailable"} · ${table.timezone}`}
        title="Analytics-ready closed trades"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Closed</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Gross P/L</TableCell>
                <TableCell align="right">Net P/L</TableCell>
                <TableCell>Fees</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row) => (
                <TableRow key={row.roundTripId}>
                  <TableCell>{timestamp(row.closedAtUtc)}</TableCell>
                  <TableCell>{row.displayedSymbol}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell>
                  <TableCell align="right">{formatJournalAnalyticsDecimal(row.enteredQuantityDecimal)}</TableCell>
                  <TableCell align="right">{table.currency} {formatJournalAnalyticsDecimal(row.grossPnlDecimal)}</TableCell>
                  <TableCell align="right">
                    {row.selectedPnlDecimal === null
                      ? "Unavailable"
                      : `${table.currency} ${formatJournalAnalyticsDecimal(row.selectedPnlDecimal)}`}
                  </TableCell>
                  <TableCell>{row.chargeCoverage === "complete" ? "Complete" : "Needs review"}</TableCell>
                  <TableCell>{row.provenance.replaceAll("_", " ")}</TableCell>
                  <TableCell align="right">
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

      <DashboardPanel
        action={<Chip label={`${result.decisions.length} contained`} size="small" variant="outlined" />}
        title="Needs a trader decision"
      >
        {result.decisions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No round-trip chain currently needs a trader decision.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Opened</TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.decisions.map((row) => (
                  <TableRow key={row.roundTripId}>
                    <TableCell>{timestamp(row.openedAtUtc)}</TableCell>
                    <TableCell>{row.symbol}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell>
                    <TableCell>Trader decision required</TableCell>
                    <TableCell>{row.reasonCodes.join(", ").replaceAll("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}
