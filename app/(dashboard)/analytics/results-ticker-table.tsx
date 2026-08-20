"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { TickerTradeDetailDrawer } from "./trade-detail-drawer";

export type ResultsTickerRow = Readonly<{
  ticker: string;
  netPnl: string;
  netPnlValue: number;
  winRate: string;
  winRateValue: number;
  profitFactor: string;
  profitFactorValue: number;
  trades: string;
  tradesValue: number;
  tradingDays: string;
  tradingDaysValue: number;
  averagePnl: string;
  averagePnlValue: number;
}>;

type SortColumn =
  | "ticker"
  | "netPnl"
  | "winRate"
  | "profitFactor"
  | "trades"
  | "tradingDays"
  | "averagePnl";

const COLUMNS: readonly Readonly<{ id: SortColumn; label: string }>[] = [
  { id: "ticker", label: "Ticker" },
  { id: "netPnl", label: "Net P/L" },
  { id: "winRate", label: "Win rate" },
  { id: "profitFactor", label: "Profit factor" },
  { id: "trades", label: "Trades" },
  { id: "tradingDays", label: "Trading days" },
  { id: "averagePnl", label: "Average P/L" },
];
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

function sortableValue(
  row: ResultsTickerRow,
  column: SortColumn,
): number | string {
  switch (column) {
    case "ticker":
      return row.ticker;
    case "netPnl":
      return row.netPnlValue;
    case "winRate":
      return row.winRateValue;
    case "profitFactor":
      return row.profitFactorValue;
    case "trades":
      return row.tradesValue;
    case "tradingDays":
      return row.tradingDaysValue;
    case "averagePnl":
      return row.averagePnlValue;
  }
}

export function ResultsTickerTable({
  endDate,
  rows,
  startDate,
}: {
  endDate: string | null;
  rows: readonly ResultsTickerRow[];
  startDate: string | null;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("netPnl");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const visibleRows = useMemo(
    () => rows
      .filter((row) => row.ticker.toUpperCase().includes(search.trim().toUpperCase()))
      .sort((left, right) => {
        const leftValue = sortableValue(left, sortColumn);
        const rightValue = sortableValue(right, sortColumn);
        const comparison = typeof leftValue === "string"
          ? leftValue.localeCompare(rightValue as string)
          : leftValue - (rightValue as number);
        return sortDirection === "asc" ? comparison : -comparison;
      }),
    [rows, search, sortColumn, sortDirection],
  );
  const paginatedRows = useMemo(
    () => visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, visibleRows],
  );

  const changeSort = (column: SortColumn) => {
    setPage(0);
    if (column === sortColumn) {
      setSortDirection((value) => value === "asc" ? "desc" : "asc");
      return;
    }
    setSortColumn(column);
    setSortDirection(column === "ticker" ? "asc" : "desc");
  };

  return (
    <Paper sx={{ overflow: "hidden" }} variant="outlined">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{
          alignItems: { md: "center" },
          justifyContent: "space-between",
          p: { xs: 1.5, sm: 2.25 },
        }}
      >
        <TextField
          label="Ticker"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Search tickers"
          size="small"
          sx={{ width: { xs: "100%", md: 220 } }}
          value={search}
        />
        <TextField
          label="Rows per page"
          onChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          select
          size="small"
          sx={{ width: { xs: "100%", md: 140 } }}
          value={rowsPerPage}
        >
          {ROWS_PER_PAGE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Sort"
          onChange={(event) => {
            const [column, direction] = event.target.value.split(":") as [SortColumn, "asc" | "desc"];
            setSortColumn(column);
            setSortDirection(direction);
            setPage(0);
          }}
          select
          size="small"
          sx={{ display: { xs: "flex", md: "none" }, width: "100%" }}
          value={`${sortColumn}:${sortDirection}`}
        >
          {COLUMNS.flatMap((column) => (["desc", "asc"] as const).map((direction) => (
            <MenuItem key={`${column.id}:${direction}`} value={`${column.id}:${direction}`}>
              {column.label}: {column.id === "ticker"
                ? direction === "asc" ? "A–Z" : "Z–A"
                : direction === "desc" ? "high to low" : "low to high"}
            </MenuItem>
          )))}
        </TextField>
      </Stack>
      {visibleRows.length === 0 ? (
        <Typography color="text.secondary" sx={{ px: 2.25, pb: 3 }}>
          No tickers match this date range.
        </Typography>
      ) : (
        <HorizontalScrollRegion label="Ticker results table" minTableWidth={760} stickyFirstColumn>
          <Table size="small">
            <TableHead>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableCell key={column.id}>
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : "asc"}
                      hideSortIcon={false}
                      onClick={() => changeSort(column.id)}
                      slotProps={{
                        icon: {
                          sx: { opacity: sortColumn === column.id ? 1 : 0.45 },
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow
                  aria-label={`View ${row.ticker} completed trades`}
                  hover
                  key={row.ticker}
                  onClick={() => setSelectedTicker(row.ticker)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedTicker(row.ticker);
                    }
                  }}
                  role="button"
                  sx={{ cursor: "pointer" }}
                  tabIndex={0}
                >
                  <TableCell sx={{ fontWeight: 850 }}>{row.ticker}</TableCell>
                  <TableCell
                    sx={{
                      color: row.netPnlValue < 0 ? "error.main" : "success.main",
                      fontWeight: 800,
                    }}
                  >
                    {row.netPnl}
                  </TableCell>
                  <TableCell>{row.winRate}</TableCell>
                  <TableCell>{row.profitFactor}</TableCell>
                  <TableCell>{row.trades}</TableCell>
                  <TableCell>{row.tradingDays}</TableCell>
                  <TableCell>{row.averagePnl}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </HorizontalScrollRegion>
      )}
      <Box sx={{ borderTop: 1, borderColor: "divider" }}>
        <TablePagination
          component="div"
          count={visibleRows.length}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
          sx={{
            ".MuiTablePagination-spacer": { display: "none" },
            ".MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              gap: 0.5,
              justifyContent: "flex-end",
              minHeight: 52,
              px: { xs: 1, sm: 2 },
            },
          }}
        />
      </Box>
      <TickerTradeDetailDrawer
        endDate={endDate}
        onClose={() => setSelectedTicker(null)}
        open={selectedTicker !== null}
        startDate={startDate}
        ticker={selectedTicker}
      />
    </Paper>
  );
}
