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
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { withJournalAnalyticsDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const metadata: Metadata = {
  title: "Trades by Ticker | TraderLink Platform",
};

export const dynamic = "force-dynamic";

function money(currency: string, value: string | null): string {
  if (value === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(value, 2, true);
  return formatted.startsWith("-") ? `-$${formatted.slice(1)}` : `+$${formatted}`;
}

export default async function TradesByTickerPage() {
  redirect("/analytics/results");
  const scope = await requireTraderLinkPlatformPageScope();
  const result = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getTickerHistory(scope));
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trades
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Ticker History
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Chip label={`${result.coverage.readyClosedCount} analytics-ready closed trades`} size="small" variant="outlined" />
      </Stack>

      <DashboardPanel
        action={<Chip label={`${result.rows.length} ticker groups`} size="small" variant="outlined" />}
        title="Ticker results"
      >
        {result.rows.length === 0 ? (
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Import trades"
            description="No analytics-ready closed trades are available in Trade Tracker. No V3 or sample rows are substituted."
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell align="right">Trading days</TableCell>
                  <TableCell align="right">Round trips</TableCell>
                  <TableCell align="right">Long / short</TableCell>
                  <TableCell align="right">Net P/L</TableCell>
                  <TableCell align="right">Win rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={`${row.instrumentId}:${row.currency}`}>
                    <TableCell>
                      <Button href={`/trades/roundtrips?currency=${encodeURIComponent(row.currency)}&instrumentId=${encodeURIComponent(row.instrumentId)}`} size="small">
                        {row.symbol}
                      </Button>
                    </TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell align="right">{row.tradingDayCount}</TableCell>
                    <TableCell align="right">{row.roundTripCount}</TableCell>
                    <TableCell align="right">{row.longCount} / {row.shortCount}</TableCell>
                    <TableCell align="right" sx={{ color: row.netPnlSign === -1 ? "error.main" : row.netPnlSign === 1 ? "success.main" : "text.primary", fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}>
                      {money(row.currency, row.netPnlDecimal)}
                    </TableCell>
                    <TableCell align="right">{row.winRatePercentDecimal === null ? "N/A" : `${formatJournalAnalyticsDecimal(row.winRatePercentDecimal)}%`}</TableCell>
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
