import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { DashboardMetricCard, DashboardPanel } from "@/app/dashboard-template";
import type { WatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";

const newYorkDateTime = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "America/New_York",
  year: "numeric",
});

function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function dateTime(value: number | null): string {
  return value === null ? "No visits recorded yet" : `${newYorkDateTime.format(new Date(value))} ET`;
}

export function WatchlistUsageAdminPanel({
  usage,
}: {
  usage: WatchlistUsageAdminSnapshot | null;
}) {
  return (
    <section id="watchlist-usage" tabIndex={-1}>
      <DashboardPanel title="Watchlist usage">
        {usage ? (
          <>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <DashboardMetricCard caption="Unique members today" label="Today's distinct visitors" value={count(usage.todayDistinctVisitors)} />
              <DashboardMetricCard caption="Confirmed page views today" label="Today's visits" value={count(usage.todayVisits)} />
              <DashboardMetricCard caption="Confirmed page views since release" label="All recorded visits" value={count(usage.allRecordedVisits)} />
              <DashboardMetricCard caption="Collection began after release" label="Data since" value={dateTime(usage.dataSinceMs)} />
            </Box>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", mt: 2 }}>
              <UsageTable title="Daily Watchlist activity" columns={["New York date", "Distinct visitors", "Visits"]} empty="No Watchlist visits have been recorded yet.">
                {usage.daily.map((row) => (
                  <TableRow key={row.newYorkDate}>
                    <TableCell>{row.newYorkDate}</TableCell>
                    <TableCell>{count(row.distinctVisitors)}</TableCell>
                    <TableCell>{count(row.visits)}</TableCell>
                  </TableRow>
                ))}
              </UsageTable>
              <UsageTable title="Watchlist visitors" columns={["Member", "Most recent visit", "Today's visits", "Recorded visits"]} empty="No Watchlist visitors have been recorded yet.">
                {usage.visitors.map((row, index) => (
                  <TableRow key={`${row.displayName}-${row.mostRecentVisitMs}-${index}`}>
                    <TableCell>{row.displayName}</TableCell>
                    <TableCell>{dateTime(row.mostRecentVisitMs)}</TableCell>
                    <TableCell>{count(row.todayVisits)}</TableCell>
                    <TableCell>{count(row.recordedVisits)}</TableCell>
                  </TableRow>
                ))}
              </UsageTable>
            </Box>
          </>
        ) : <Typography color="text.secondary">Watchlist usage is unavailable right now.</Typography>}
      </DashboardPanel>
    </section>
  );
}

function UsageTable({
  children,
  columns,
  empty,
  title,
}: {
  children: ReactNode;
  columns: readonly string[];
  empty: string;
  title: string;
}) {
  const rows = Array.isArray(children) ? children : [children];
  return (
    <Box>
      <Typography component="h2" sx={{ fontSize: "1rem", fontWeight: 700, mb: 1 }} variant="h6">{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
          <TableBody>{rows.length > 0 ? rows : <TableRow><TableCell colSpan={columns.length}>{empty}</TableCell></TableRow>}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
