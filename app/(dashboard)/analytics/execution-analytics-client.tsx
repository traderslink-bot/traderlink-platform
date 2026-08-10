"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";

import { FeatureHelpLink } from "../feature-help-link";

type ExecutionMetricId = "net_pnl" | "win_rate" | "included_count";
type ChartId = "entered_quantity_bucket" | "maximum_position_bucket" | "holding_duration_bucket";
type ChartStyle = "columns" | "horizontal_bars";
type Point = Readonly<{ key: string; label: string; metrics: Readonly<Record<ExecutionMetricId, Readonly<{ display: string; value: number | null }>>> }>;
export type ExecutionChartData = Readonly<Record<ChartId, readonly Point[]>>;
export type ExecutionTradeRow = Readonly<{ roundTripId: string; ticker: string; direction: "long" | "short"; tradeType: string; tradeTypeValue: "day_trade" | "multi_day_trade"; opened: string; openedValue: string; closed: string; closedValue: string; executions: number; averageEntry: string; averageEntryValue: number; averageExit: string; averageExitValue: number; maximumPosition: string; maximumPositionValue: number; holdTime: string; holdTimeValue: number; netPnl: string; netPnlValue: number }>;

const CHARTS: readonly Readonly<{ id: ChartId; title: string }>[] = [
  { id: "entered_quantity_bucket", title: "Entry size" },
  { id: "maximum_position_bucket", title: "Maximum position" },
  { id: "holding_duration_bucket", title: "Hold time" },
];
const MEASURES: readonly Readonly<{ id: ExecutionMetricId; label: string }>[] = [
  { id: "net_pnl", label: "Net P/L" },
  { id: "win_rate", label: "Win rate" },
  { id: "included_count", label: "Trades" },
];
type SortColumn = "ticker" | "direction" | "tradeType" | "opened" | "closed" | "executions" | "averageEntry" | "averageExit" | "maximumPosition" | "holdTime" | "netPnl";
const COLUMNS: readonly Readonly<{ id: SortColumn; label: string }>[] = [
  { id: "ticker", label: "Ticker" }, { id: "direction", label: "Direction" }, { id: "tradeType", label: "Trade type" }, { id: "opened", label: "Opened" }, { id: "closed", label: "Closed" }, { id: "executions", label: "Executions" }, { id: "averageEntry", label: "Average entry" }, { id: "averageExit", label: "Average exit" }, { id: "maximumPosition", label: "Max shares" }, { id: "holdTime", label: "Hold time" }, { id: "netPnl", label: "Net P/L" },
];

function sortValue(row: ExecutionTradeRow, column: SortColumn): string | number {
  switch (column) {
    case "ticker": return row.ticker;
    case "direction": return row.direction;
    case "tradeType": return row.tradeType;
    case "opened": return row.openedValue;
    case "closed": return row.closedValue;
    case "executions": return row.executions;
    case "averageEntry": return row.averageEntryValue;
    case "averageExit": return row.averageExitValue;
    case "maximumPosition": return row.maximumPositionValue;
    case "holdTime": return row.holdTimeValue;
    case "netPnl": return row.netPnlValue;
  }
}

function Chart({ points, metricId, style }: { points: readonly Point[]; metricId: ExecutionMetricId; style: ChartStyle }) {
  if (points.length === 0) return <Typography color="text.secondary" sx={{ py: 8 }} variant="body2">No completed trades are available for this view.</Typography>;
  const values = points.map((point) => point.metrics[metricId].value ?? 0);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  if (style === "horizontal_bars") return <Stack spacing={1.15} sx={{ mt: 2.25 }}>{points.map((point) => { const value = point.metrics[metricId].value ?? 0; return <Stack direction="row" key={point.key} spacing={1} sx={{ alignItems: "center" }} title={`${point.label}: ${point.metrics[metricId].display}`}><Typography color="text.secondary" sx={{ flex: "0 0 96px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{point.label}</Typography><Box sx={{ bgcolor: "#edf1f6", borderRadius: 99, flex: 1, height: 14, overflow: "hidden" }}><Box sx={{ bgcolor: value < 0 ? "error.main" : "success.main", borderRadius: 99, height: "100%", width: `${Math.max(3, Math.abs(value) / max * 100)}%` }} /></Box><Typography sx={{ flex: "0 0 72px", fontSize: 12, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>{point.metrics[metricId].display}</Typography></Stack>; })}</Stack>;
  const width = 640;
  const baseline = 112;
  return <Box sx={{ mt: 2, overflowX: "auto" }}><Box component="svg" preserveAspectRatio="none" sx={{ display: "block", height: 230, minWidth: 480, width: "100%" }} viewBox={`0 0 ${width} 230`}><line stroke="#d9e1ec" strokeWidth="1" x1="20" x2="620" y1={baseline} y2={baseline} />{points.map((point, index) => { const value = point.metrics[metricId].value ?? 0; const barHeight = Math.max(2, Math.abs(value) / max * 88); const barWidth = Math.max(24, 440 / points.length); const x = 42 + index * (560 / points.length); return <g key={point.key}><title>{`${point.label}: ${point.metrics[metricId].display}`}</title><rect fill={value < 0 ? "#c62828" : "#00796b"} height={barHeight} rx="4" width={barWidth} x={x} y={value < 0 ? baseline : baseline - barHeight} /><text fill="#627083" fontSize="11" textAnchor="middle" x={x + barWidth / 2} y="211">{point.label.slice(0, 9)}</text></g>; })}</Box></Box>;
}

function ChartPanel({ chart, points, metricId }: { chart: (typeof CHARTS)[number]; points: readonly Point[]; metricId: ExecutionMetricId }) {
  const [style, setStyle] = useState<ChartStyle>("horizontal_bars");
  return <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined"><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{chart.title}</Typography><TextField aria-label={`${chart.title} chart type`} onChange={(event) => setStyle(event.target.value as ChartStyle)} select size="small" sx={{ minWidth: 150 }} value={style}><MenuItem value="horizontal_bars">Horizontal bars</MenuItem><MenuItem value="columns">Columns</MenuItem></TextField></Stack><Typography color="text.secondary" variant="body2">{MEASURES.find((measure) => measure.id === metricId)?.label}</Typography><Chart metricId={metricId} points={points} style={style} /></Paper>;
}

export function ExecutionAnalyticsClient({ chartData, rows }: { chartData: ExecutionChartData; rows: readonly ExecutionTradeRow[] }) {
  const [metricId, setMetricId] = useState<ExecutionMetricId>("net_pnl");
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<"all" | "long" | "short">("all");
  const [tradeType, setTradeType] = useState<"all" | "day_trade" | "multi_day_trade">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("closed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const visibleRows = useMemo(() => rows.filter((row) => row.ticker.toUpperCase().includes(ticker.trim().toUpperCase()) && (direction === "all" || row.direction === direction) && (tradeType === "all" || row.tradeTypeValue === tradeType)).sort((left, right) => { const leftValue = sortValue(left, sortColumn); const rightValue = sortValue(right, sortColumn); const comparison = typeof leftValue === "string" ? leftValue.localeCompare(rightValue as string) : leftValue - rightValue as number; return sortDirection === "asc" ? comparison : -comparison; }), [direction, rows, sortColumn, sortDirection, ticker, tradeType]);
  useEffect(() => { setPage(0); }, [ticker, direction, tradeType, sortColumn, sortDirection]);
  const paginatedRows = visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const changeSort = (column: SortColumn) => { if (column === sortColumn) setSortDirection((value) => value === "asc" ? "desc" : "asc"); else { setSortColumn(column); setSortDirection(column === "ticker" || column === "direction" || column === "tradeType" ? "asc" : "desc"); } };
  return <Stack spacing={2.5}><Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "center" }, justifyContent: "flex-end" }}><TextField label="Measure" onChange={(event) => setMetricId(event.target.value as ExecutionMetricId)} select size="small" sx={{ minWidth: 180 }} value={metricId}>{MEASURES.map((measure) => <MenuItem key={measure.id} value={measure.id}>{measure.label}</MenuItem>)}</TextField><FeatureHelpLink href="/help/core-analytics/timing-and-execution#read-execution" label="Execution measures" /></Stack><Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" } }}>{CHARTS.map((chart) => <ChartPanel chart={chart} key={chart.id} metricId={metricId} points={chartData[chart.id]} />)}</Box><Paper sx={{ overflow: "hidden" }} variant="outlined"><Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: { xs: 1.5, sm: 2.25 } }}><TextField label="Ticker" onChange={(event) => setTicker(event.target.value)} placeholder="Search tickers" size="small" sx={{ minWidth: { md: 210 } }} value={ticker} /><TextField label="Direction" onChange={(event) => setDirection(event.target.value as typeof direction)} select size="small" sx={{ minWidth: { md: 150 } }} value={direction}><MenuItem value="all">All directions</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem></TextField><TextField label="Trade type" onChange={(event) => setTradeType(event.target.value as typeof tradeType)} select size="small" sx={{ minWidth: { md: 170 } }} value={tradeType}><MenuItem value="all">All trade types</MenuItem><MenuItem value="day_trade">Day trades</MenuItem><MenuItem value="multi_day_trade">Multi-day trades</MenuItem></TextField><Box sx={{ flex: 1 }} /><TablePagination component="div" count={visibleRows.length} labelRowsPerPage="Rows per page:" onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[25, 50, 100]} sx={{ alignSelf: { md: "center" }, ml: { md: "auto" }, ".MuiTablePagination-toolbar": { minHeight: 36, pl: 0 }, ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: 12 } }} /></Stack>{visibleRows.length === 0 ? <Typography color="text.secondary" sx={{ px: 2.25, pb: 3 }}>No completed trades match these filters.</Typography> : <TableContainer><Table size="small"><TableHead><TableRow>{COLUMNS.map((column) => <TableCell key={column.id}><TableSortLabel active={sortColumn === column.id} direction={sortColumn === column.id ? sortDirection : "asc"} hideSortIcon={false} onClick={() => changeSort(column.id)} slotProps={{ icon: { sx: { opacity: sortColumn === column.id ? 1 : 0.45 } } }}>{column.label}</TableSortLabel></TableCell>)}</TableRow></TableHead><TableBody>{paginatedRows.map((row) => <TableRow hover key={row.roundTripId}><TableCell sx={{ fontWeight: 850 }}>{row.ticker}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.tradeType}</TableCell><TableCell>{row.opened}</TableCell><TableCell>{row.closed}</TableCell><TableCell>{row.executions}</TableCell><TableCell>{row.averageEntry}</TableCell><TableCell>{row.averageExit}</TableCell><TableCell>{row.maximumPosition}</TableCell><TableCell>{row.holdTime}</TableCell><TableCell sx={{ color: row.netPnlValue < 0 ? "error.main" : "success.main", fontWeight: 800 }}>{row.netPnl}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}</Paper></Stack>;
}
