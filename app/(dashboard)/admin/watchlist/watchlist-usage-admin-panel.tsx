"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { DashboardMetricCard, DashboardPanel } from "@/app/dashboard-template";
import type {
  WatchlistUsageAdminSnapshot,
  WatchlistUsagePresenceStatus,
} from "@/src/modules/watchlist/server/watchlist-usage-service";

const USAGE_REFRESH_INTERVAL_MS = 60_000;

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
  active,
  usage,
}: {
  active: boolean;
  usage: WatchlistUsageAdminSnapshot | null;
}) {
  const [currentUsage, setCurrentUsage] = useState(usage);

  useEffect(() => {
    setCurrentUsage(usage);
  }, [usage]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/admin/watchlist/usage", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const nextUsage = await response.json() as WatchlistUsageAdminSnapshot;
        if (!cancelled) setCurrentUsage(nextUsage);
      } catch {
        // Keep the most recently confirmed owner snapshot visible.
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), USAGE_REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [active]);

  return (
    <section id="watchlist-usage" tabIndex={-1}>
      <DashboardPanel title="Watchlist usage">
        {currentUsage ? (
          <>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <DashboardMetricCard caption="Recently confirmed visible in a Watchlist tab" label="Viewing now" value={count(currentUsage.viewingNowMembers)} />
              <DashboardMetricCard caption="Recently confirmed open in a Watchlist tab" label="Watchlist open" value={count(currentUsage.watchlistOpenMembers)} />
              <DashboardMetricCard caption="Unique members today" label="Today's distinct visitors" value={count(currentUsage.todayDistinctVisitors)} />
              <DashboardMetricCard caption="Confirmed page views today" label="Today's visits" value={count(currentUsage.todayVisits)} />
              <DashboardMetricCard caption="Confirmed page views since release" label="All recorded visits" value={count(currentUsage.allRecordedVisits)} />
              <DashboardMetricCard caption="Collection began after release" label="Data since" value={dateTime(currentUsage.dataSinceMs)} />
            </Box>
            <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
              Usage refreshes while this section is open. Presence is recent confirmation, not continuous device monitoring.
            </Typography>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", mt: 2 }}>
              <UsageTable title="Daily Watchlist activity" columns={["New York date", "Distinct visitors", "Visits"]} empty="No Watchlist visits have been recorded yet.">
                {currentUsage.daily.map((row) => (
                  <TableRow key={row.newYorkDate}>
                    <TableCell>{row.newYorkDate}</TableCell>
                    <TableCell>{count(row.distinctVisitors)}</TableCell>
                    <TableCell>{count(row.visits)}</TableCell>
                  </TableRow>
                ))}
              </UsageTable>
              <UsageTable title="Watchlist visitors" columns={["Member", "Current status", "Most recent visit", "Today's visits", "Recorded visits"]} empty="No Watchlist visitors have been recorded yet.">
                {currentUsage.visitors.map((row, index) => (
                  <TableRow key={`${row.displayName}-${row.mostRecentVisitMs}-${index}`}>
                    <TableCell>{row.displayName}</TableCell>
                    <TableCell>{presenceStatusLabel(row.presenceStatus)}</TableCell>
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

function presenceStatusLabel(status: WatchlistUsagePresenceStatus): string {
  switch (status) {
    case "viewing_now":
      return "Viewing now";
    case "watchlist_open":
      return "Watchlist open";
    default:
      return "Not currently open";
  }
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
