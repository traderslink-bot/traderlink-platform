"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { FeatureHelpLink } from "../feature-help-link";

export type ResultsTickerRow = Readonly<{ ticker: string; netPnl: string; netPnlValue: number; winRate: string; winRateValue: number; profitFactor: string; profitFactorValue: number; trades: string; tradesValue: number; tradingDays: string; tradingDaysValue: number; averagePnl: string; averagePnlValue: number }>;

type SortColumn = "ticker" | "netPnl" | "winRate" | "profitFactor" | "trades" | "tradingDays" | "averagePnl";
const COLUMNS: readonly Readonly<{ id: SortColumn; label: string }>[] = [{ id: "ticker", label: "Ticker" }, { id: "netPnl", label: "Net P/L" }, { id: "winRate", label: "Win rate" }, { id: "profitFactor", label: "Profit factor" }, { id: "trades", label: "Trades" }, { id: "tradingDays", label: "Trading days" }, { id: "averagePnl", label: "Average P/L" }];

function sortableValue(row: ResultsTickerRow, column: SortColumn): number | string {
  switch (column) {
    case "ticker": return row.ticker;
    case "netPnl": return row.netPnlValue;
    case "winRate": return row.winRateValue;
    case "profitFactor": return row.profitFactorValue;
    case "trades": return row.tradesValue;
    case "tradingDays": return row.tradingDaysValue;
    case "averagePnl": return row.averagePnlValue;
  }
}

export function ResultsTickerTable({ rows }: { rows: readonly ResultsTickerRow[] }) {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("netPnl"); const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const visibleRows = useMemo(() => rows
    .filter((row) => row.ticker.toUpperCase().includes(search.trim().toUpperCase()))
    .sort((left, right) => {
      const leftValue = sortableValue(left, sortColumn);
      const rightValue = sortableValue(right, sortColumn);
      const comparison = typeof leftValue === "string"
        ? leftValue.localeCompare(rightValue as string)
        : leftValue - (rightValue as number);
      return sortDirection === "asc" ? comparison : -comparison;
    }), [rows, search, sortColumn, sortDirection]);
  const changeSort = (column: SortColumn) => { if (column === sortColumn) setSortDirection((value) => value === "asc" ? "desc" : "asc"); else { setSortColumn(column); setSortDirection(column === "ticker" ? "asc" : "desc"); } };
  return <Paper sx={{ overflow: "hidden" }} variant="outlined"><Box sx={{ alignItems: "center", display: "flex", gap: 0.5, p: { xs: 1.5, sm: 2.25 } }}><TextField label="Ticker" onChange={(event) => setSearch(event.target.value)} placeholder="Search tickers" size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }} value={search} /><FeatureHelpLink href="/help/core-analytics/compare-results-by-ticker#search-and-sort" label="Results search and sorting" /></Box>{visibleRows.length === 0 ? <Typography color="text.secondary" sx={{ px: 2.25, pb: 3 }}>No tickers match this date range.</Typography> : <TableContainer><Table size="small"><TableHead><TableRow>{COLUMNS.map((column) => <TableCell key={column.id}><TableSortLabel active={sortColumn === column.id} direction={sortColumn === column.id ? sortDirection : "asc"} hideSortIcon={false} onClick={() => changeSort(column.id)} slotProps={{ icon: { sx: { opacity: sortColumn === column.id ? 1 : 0.45 } } }}>{column.label}</TableSortLabel></TableCell>)}</TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={row.ticker}><TableCell sx={{ fontWeight: 850 }}>{row.ticker}</TableCell><TableCell sx={{ color: row.netPnlValue < 0 ? "error.main" : "success.main", fontWeight: 800 }}>{row.netPnl}</TableCell><TableCell>{row.winRate}</TableCell><TableCell>{row.profitFactor}</TableCell><TableCell>{row.trades}</TableCell><TableCell>{row.tradingDays}</TableCell><TableCell>{row.averagePnl}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}</Paper>;
}
