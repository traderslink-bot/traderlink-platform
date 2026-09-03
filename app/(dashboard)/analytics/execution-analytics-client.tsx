"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";

import { FeatureHelpLink } from "../feature-help-link";
import { HorizontalScrollHint, HorizontalScrollRegion } from "../horizontal-scroll-region";
import { AnalyticsTradeDetailDrawer, type AnalyticsTradeDetail } from "./trade-detail-drawer";

type ExecutionMetricId = "gross_pnl" | "net_pnl" | "win_rate" | "included_count";
type ChartId = "entered_quantity_bucket" | "maximum_position_bucket" | "holding_duration_bucket";
type ChartStyle = "columns" | "horizontal_bars";
type Point = Readonly<{ key: string; label: string; metrics: Readonly<Record<ExecutionMetricId, Readonly<{ display: string; value: number | null }>>> }>;
export type ExecutionChartData = Readonly<Record<ChartId, readonly Point[]>>;
export type ExecutionTradeRow = Readonly<{ roundTripId: string; ticker: string; direction: "long" | "short"; tradeType: string; tradeTypeValue: "day_trade" | "multi_day_trade"; opened: string; openedValue: string; closed: string; closedValue: string; executions: number; averageEntry: string; averageEntryValue: number; averageExit: string; averageExitValue: number; maximumPosition: string; maximumPositionValue: number; holdTime: string; holdTimeValue: number; netPnl: string; netPnlDecimal: string | null; netPnlValue: number }>;
export type EntryPriceResult = Readonly<{ averagePnl: string; averagePnlDecimal: string | null; entryPriceBand: string; key: string; losses: number | null; lossesDisplay: string; netPnl: string; netPnlDecimal: string | null; tradeCount: number | null; tradeCountDisplay: string; winRate: string; winRateDenominatorInteger: string | null; winRateNumeratorDecimal: string | null; wins: number | null; winsDisplay: string }>;
export type EntryPriceComparisonResult = Readonly<{ averagePnl: string; averagePnlDecimal: string | null; entryPriceBand: string; key: string; tradeCount: number | null; tradeCountDisplay: string; winRate: string; winRateDenominatorInteger: string | null; winRateNumeratorDecimal: string | null }>;
export type EntryPriceComparison = Readonly<{ averagePnlComparison: "higher" | "lower" | "equal" | null; evidenceState: "needs_overall_history" | "needs_comparison_history" | "uneven_sample" | "comparable"; oneAndAbove: EntryPriceComparisonResult; oneAndAboveTradesNeeded: number; totalTradeCount: number; underOne: EntryPriceComparisonResult; underOneTradesNeeded: number; winRateComparison: "higher" | "lower" | "equal" | null }>;
export type EntryPriceInsights = Readonly<{ highestAveragePnlKey: string | null; highestWinRateKey: string | null; lowestAveragePnlKey: string | null; lowestWinRateKey: string | null }>;

const CHARTS: readonly Readonly<{ id: ChartId; title: string }>[] = [
  { id: "entered_quantity_bucket", title: "Entry size" },
  { id: "maximum_position_bucket", title: "Maximum position" },
  { id: "holding_duration_bucket", title: "Hold time" },
];
function measures(pnlMetricId: "gross_pnl" | "net_pnl"): readonly Readonly<{ id: ExecutionMetricId; label: string }>[] {
  return [
  { id: pnlMetricId, label: pnlMetricId === "gross_pnl" ? "Gross P/L" : "Net P/L" },
  { id: "win_rate", label: "Win rate" },
  { id: "included_count", label: "Trades" },
  ];
}
type SortColumn = "ticker" | "direction" | "tradeType" | "opened" | "closed" | "executions" | "averageEntry" | "averageExit" | "maximumPosition" | "holdTime" | "netPnl";
function columns(moneyBasis: "gross" | "net"): readonly Readonly<{ id: SortColumn; label: string }>[] {
  return [
  { id: "ticker", label: "Ticker" }, { id: "direction", label: "Direction" }, { id: "tradeType", label: "Trade type" }, { id: "opened", label: "Opened" }, { id: "closed", label: "Closed" }, { id: "executions", label: "Executions" }, { id: "averageEntry", label: "Average entry" }, { id: "averageExit", label: "Average exit" }, { id: "maximumPosition", label: "Max shares" }, { id: "holdTime", label: "Hold time" }, { id: "netPnl", label: moneyBasis === "gross" ? "Gross P/L" : "Net P/L" },
  ];
}

function mobileSortLabel(column: Readonly<{ id: SortColumn; label: string }>, direction: "asc" | "desc"): string {
  if (column.id === "opened" || column.id === "closed") {
    return `${column.label}: ${direction === "desc" ? "newest" : "oldest"}`;
  }
  if (column.id === "ticker" || column.id === "direction" || column.id === "tradeType") {
    return `${column.label}: ${direction === "asc" ? "A–Z" : "Z–A"}`;
  }
  return `${column.label}: ${direction === "desc" ? "high to low" : "low to high"}`;
}

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
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const chart = theme.palette.traderLink.chart;
  if (points.length === 0) return <Typography color="text.secondary" sx={{ py: 8 }} variant="body2">No completed trades are available for this view.</Typography>;
  const values = points.map((point) => point.metrics[metricId].value ?? 0);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  if (style === "horizontal_bars") return <Stack spacing={1.15} sx={{ mt: 2.25 }}>{points.map((point) => { const value = point.metrics[metricId].value ?? 0; return <Stack direction="row" key={point.key} spacing={1} sx={{ alignItems: "center" }} title={`${point.label}: ${point.metrics[metricId].display}`}><Typography color="text.secondary" sx={{ flex: "0 0 96px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{point.label}</Typography><Box sx={{ bgcolor: dark ? "action.selected" : "#edf1f6", borderRadius: 99, flex: 1, height: 14, overflow: "hidden" }}><Box sx={{ bgcolor: value < 0 ? "error.main" : "success.main", borderRadius: 99, height: "100%", width: `${Math.max(3, Math.abs(value) / max * 100)}%` }} /></Box><Typography sx={{ flex: "0 0 72px", fontSize: 12, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>{point.metrics[metricId].display}</Typography></Stack>; })}</Stack>;
  const width = 640;
  const baseline = 112;
  return <><HorizontalScrollHint label="Swipe sideways to see the full chart" /><Box sx={{ WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { display: "none" }, mt: 0.5, overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "none" }}><Box component="svg" preserveAspectRatio="none" sx={{ display: "block", height: 230, minWidth: 480, width: "100%" }} viewBox={`0 0 ${width} 230`}><line stroke={dark ? chart.grid : "#d9e1ec"} strokeWidth="1" x1="20" x2="620" y1={baseline} y2={baseline} />{points.map((point, index) => { const value = point.metrics[metricId].value ?? 0; const barHeight = Math.max(2, Math.abs(value) / max * 88); const barWidth = Math.max(24, 440 / points.length); const x = 42 + index * (560 / points.length); return <g key={point.key}><title>{`${point.label}: ${point.metrics[metricId].display}`}</title><rect fill={value < 0 ? chart.loss : chart.win} height={barHeight} rx="4" width={barWidth} x={x} y={value < 0 ? baseline : baseline - barHeight} /><text fill={dark ? theme.palette.text.secondary : "#627083"} fontSize="11" textAnchor="middle" x={x + barWidth / 2} y="211">{point.label.slice(0, 9)}</text></g>; })}</Box></Box></>;
}

function ChartPanel({ chart, points, metricId, pnlMetricId }: { chart: (typeof CHARTS)[number]; points: readonly Point[]; metricId: ExecutionMetricId; pnlMetricId: "gross_pnl" | "net_pnl" }) {
  const [style, setStyle] = useState<ChartStyle>("horizontal_bars");
  return <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined"><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{chart.title}</Typography><TextField aria-label={`${chart.title} chart type`} onChange={(event) => setStyle(event.target.value as ChartStyle)} select size="small" sx={{ minWidth: 150 }} value={style}><MenuItem value="horizontal_bars">Horizontal bars</MenuItem><MenuItem value="columns">Columns</MenuItem></TextField></Stack><Typography color="text.secondary" variant="body2">{measures(pnlMetricId).find((measure) => measure.id === metricId)?.label}</Typography><Chart metricId={metricId} points={points} style={style} /></Paper>;
}

type EntryPriceInsightKind = "highest_win_rate" | "lowest_win_rate" | "highest_average_pnl" | "lowest_average_pnl";

function EntryPriceInsight({ kind, result }: { kind: EntryPriceInsightKind; result: EntryPriceResult | null }) {
  const isBest = kind === "highest_win_rate" || kind === "highest_average_pnl";
  const statement = kind === "highest_win_rate"
    ? "Highest recorded win rate for stocks entered:"
    : kind === "lowest_win_rate"
      ? "Lowest recorded win rate for stocks entered:"
      : kind === "highest_average_pnl"
        ? "Highest average P/L for stocks entered:"
        : "Lowest average P/L for stocks entered:";
  const resultLine = result === null
    ? null
    : kind === "highest_win_rate" || kind === "lowest_win_rate"
      ? `${result.winRate} winners from ${result.tradeCountDisplay} trades`
      : `${result.averagePnl} average P/L across ${result.tradeCountDisplay} trades`;
  const resultColor = isBest ? "success.main" : "error.main";
  return <Box sx={{ borderColor: isBest ? "success.main" : "error.main", borderLeft: 3, pl: 1.25 }}>
    <Typography color="text.secondary" variant="body2">{statement}</Typography>
    {result ? <><Typography sx={{ fontSize: { xs: 17, sm: 18 }, fontWeight: 850, lineHeight: 1.35, mt: 0.35 }}>{result.entryPriceBand}.</Typography><Typography color={resultColor} sx={{ mt: 0.25 }} variant="body2">{resultLine}</Typography></> : null}
  </Box>;
}

function EntryPriceComparison({ comparison }: { comparison: EntryPriceComparison }) {
  if (comparison.evidenceState === "needs_overall_history") {
    return <Stack spacing={0.75}><Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Build your entry-price history</Typography><Typography color="text.secondary" variant="body2">Add {30 - comparison.totalTradeCount} more completed {30 - comparison.totalTradeCount === 1 ? "trade" : "trades"} to reach 30. The table shows your recorded results, but there is not enough overall history to identify useful entry-price patterns.</Typography><Typography color="text.secondary" variant="body2">Once enough history is available, this section compares Under $1.00 with $1.00 and above, then highlights well-supported price ranges from $1.00 to under $5.00.</Typography></Stack>;
  }
  if (comparison.evidenceState === "needs_comparison_history") {
    const needs = [comparison.underOneTradesNeeded > 0 ? `Under $1.00 needs ${comparison.underOneTradesNeeded} more` : null, comparison.oneAndAboveTradesNeeded > 0 ? `$1.00 and above needs ${comparison.oneAndAboveTradesNeeded} more` : null].filter((value): value is string => value !== null);
    return <Stack spacing={0.75}><Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">More comparison history needed</Typography><Typography color="text.secondary" variant="body2">{needs.join(". ")}{needs.length > 0 ? "." : ""} Each side needs at least 10 completed trades before Trade Breakdown compares their results.</Typography></Stack>;
  }
  const winRate = comparison.winRateComparison === "higher" ? "higher" : comparison.winRateComparison === "lower" ? "lower" : "the same";
  const averagePnl = comparison.averagePnlComparison === "higher" ? "higher" : comparison.averagePnlComparison === "lower" ? "lower" : "the same";
  const sentence = `Under-$1.00 trades had ${winRate === "the same" ? "the same win rate" : `a ${winRate} win rate`} and ${averagePnl === "the same" ? "the same average P/L" : `${averagePnl} average P/L`} than $1.00+ trades.`;
  return <Stack spacing={0.75}><Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Under $1.00 compared with $1.00+</Typography><Typography color="text.secondary" variant="body2">{sentence}</Typography><Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}><Box><Typography sx={{ fontWeight: 800 }} variant="body2">Under $1.00</Typography><Typography color="text.secondary" variant="body2">{comparison.underOne.winRate} win rate · {comparison.underOne.averagePnl} avg P/L · {comparison.underOne.tradeCountDisplay} trades</Typography></Box><Box><Typography sx={{ fontWeight: 800 }} variant="body2">$1.00 and above</Typography><Typography color="text.secondary" variant="body2">{comparison.oneAndAbove.winRate} win rate · {comparison.oneAndAbove.averagePnl} avg P/L · {comparison.oneAndAbove.tradeCountDisplay} trades</Typography></Box></Box><Typography color={comparison.evidenceState === "uneven_sample" ? "warning.main" : "text.secondary"} variant="body2">{comparison.evidenceState === "uneven_sample" ? `Uneven sample: ${comparison.underOne.tradeCountDisplay} trades under $1.00 compared with ${comparison.oneAndAbove.tradeCountDisplay} trades at $1.00 and above. Treat this as direction, not a firm conclusion.` : "Comparable sample sizes support this historical comparison."}</Typography></Stack>;
}

function EntryPriceResults({ comparison, insights, moneyBasis, results }: { comparison: EntryPriceComparison; insights: EntryPriceInsights; moneyBasis: "gross" | "net"; results: readonly EntryPriceResult[] }) {
  const highestWinRate = results.find((result) => result.key === insights.highestWinRateKey) ?? null;
  const highestAveragePnl = results.find((result) => result.key === insights.highestAveragePnlKey) ?? null;
  const lowestWinRate = results.find((result) => result.key === insights.lowestWinRateKey) ?? null;
  const lowestAveragePnl = results.find((result) => result.key === insights.lowestAveragePnlKey) ?? null;
  const hasRangeInsights = [highestWinRate, highestAveragePnl, lowestWinRate, lowestAveragePnl].some((result) => result !== null);
  return <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined">
    <Stack spacing={1.5}>
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Entry Price Results</Typography>
      <EntryPriceComparison comparison={comparison} />
      {comparison.evidenceState === "needs_overall_history" ? null : hasRangeInsights ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}><Stack spacing={2}><EntryPriceInsight kind="highest_win_rate" result={highestWinRate} /><EntryPriceInsight kind="highest_average_pnl" result={highestAveragePnl} /></Stack><Stack spacing={2}><EntryPriceInsight kind="lowest_win_rate" result={lowestWinRate} /><EntryPriceInsight kind="lowest_average_pnl" result={lowestAveragePnl} /></Stack></Box> : <Typography color="text.secondary" variant="body2">No price range from $1.00 to under $5.00 has 10 completed trades yet. The table remains available while that history builds.</Typography>}
      <HorizontalScrollRegion label="Entry price results table" minTableWidth={720}>
        <Table size="small" sx={{ width: "auto", "& .MuiTableCell-root": { px: 0.875, whiteSpace: "nowrap" }, "& .MuiTableCell-root:first-of-type": { minWidth: 164 } }}><TableHead><TableRow><TableCell>Entry price</TableCell><TableCell align="right">{moneyBasis === "gross" ? "Gross" : "Net"} P/L</TableCell><TableCell align="right">Trades</TableCell><TableCell align="right">Wins</TableCell><TableCell align="right">Losses</TableCell><TableCell align="right">Win rate</TableCell><TableCell align="right">Avg P/L</TableCell></TableRow></TableHead><TableBody>{results.map((result) => <TableRow key={result.key}><TableCell sx={{ fontWeight: 800 }}>{result.entryPriceBand}</TableCell><TableCell align="right" sx={{ color: result.netPnlDecimal !== null && result.netPnlDecimal.startsWith("-") ? "error.main" : "success.main", fontWeight: 800 }}>{result.netPnl}</TableCell><TableCell align="right">{result.tradeCountDisplay}</TableCell><TableCell align="right">{result.winsDisplay}</TableCell><TableCell align="right">{result.lossesDisplay}</TableCell><TableCell align="right">{result.winRate}</TableCell><TableCell align="right">{result.averagePnl}</TableCell></TableRow>)}</TableBody></Table>
      </HorizontalScrollRegion>
      <Typography color="text.secondary" variant="body2">Includes completed trades in the selected date range.</Typography>
    </Stack>
  </Paper>;
}

export function ExecutionAnalyticsClient({ chartData, currency, moneyBasis, offline = false, priceComparison, priceInsights, priceResults, rows }: { chartData: ExecutionChartData; currency: string | null; moneyBasis: "gross" | "net"; offline?: boolean; priceComparison: EntryPriceComparison; priceInsights: EntryPriceInsights; priceResults: readonly EntryPriceResult[]; rows: readonly ExecutionTradeRow[] }) {
  const pnlMetricId = moneyBasis === "gross" ? "gross_pnl" : "net_pnl";
  const [metricId, setMetricId] = useState<ExecutionMetricId>(pnlMetricId);
  const columnsForBasis = columns(moneyBasis);
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<"all" | "long" | "short">("all");
  const [tradeType, setTradeType] = useState<"all" | "day_trade" | "multi_day_trade">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("closed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTrade, setSelectedTrade] = useState<ExecutionTradeRow | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const visibleRows = useMemo(() => rows.filter((row) => row.ticker.toUpperCase().includes(ticker.trim().toUpperCase()) && (direction === "all" || row.direction === direction) && (tradeType === "all" || row.tradeTypeValue === tradeType)).sort((left, right) => { const leftValue = sortValue(left, sortColumn); const rightValue = sortValue(right, sortColumn); const comparison = typeof leftValue === "string" ? leftValue.localeCompare(rightValue as string) : leftValue - (rightValue as number); return sortDirection === "asc" ? comparison : -comparison; }), [direction, rows, sortColumn, sortDirection, ticker, tradeType]);
  const paginatedRows = visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const changeSort = (column: SortColumn) => { setPage(0); if (column === sortColumn) setSortDirection((value) => value === "asc" ? "desc" : "asc"); else { setSortColumn(column); setSortDirection(column === "ticker" || column === "direction" || column === "tradeType" ? "asc" : "desc"); } };
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "center" }, justifyContent: "flex-start" }}>
        <TextField label="Measure" onChange={(event) => setMetricId(event.target.value as ExecutionMetricId)} select size="small" sx={{ minWidth: { sm: 180 } }} value={metricId}>
          {measures(pnlMetricId).map((measure) => <MenuItem key={measure.id} value={measure.id}>{measure.label}</MenuItem>)}
        </TextField>
        <FeatureHelpLink href="/help/core-analytics/timing-and-execution#read-execution" label="Trade Breakdown measures" />
      </Stack>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.25fr) minmax(0, 0.75fr)" } }}>
        <EntryPriceResults comparison={priceComparison} insights={priceInsights} moneyBasis={moneyBasis} results={priceResults} />
        <Stack spacing={2.5}>
          {[CHARTS[1], CHARTS[0], CHARTS[2]].map((chart) => <ChartPanel chart={chart} key={chart.id} metricId={metricId} pnlMetricId={pnlMetricId} points={chartData[chart.id]} />)}
        </Stack>
      </Box>
      <Paper sx={{ overflow: "hidden" }} variant="outlined">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: { xs: 1.5, sm: 2.25 } }}>
          <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(0); }} placeholder="Search tickers" size="small" sx={{ minWidth: { md: 210 } }} value={ticker} />
          <TextField label="Direction" onChange={(event) => { setDirection(event.target.value as typeof direction); setPage(0); }} select size="small" sx={{ minWidth: { md: 150 } }} value={direction}><MenuItem value="all">All directions</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem></TextField>
          <TextField label="Trade type" onChange={(event) => { setTradeType(event.target.value as typeof tradeType); setPage(0); }} select size="small" sx={{ minWidth: { md: 170 } }} value={tradeType}><MenuItem value="all">All trade types</MenuItem><MenuItem value="day_trade">Day trades</MenuItem><MenuItem value="multi_day_trade">Multi-day trades</MenuItem></TextField>
          <TextField
            label="Sort"
            onChange={(event) => {
              const [column, directionValue] = event.target.value.split(":") as [SortColumn, "asc" | "desc"];
              setSortColumn(column);
              setSortDirection(directionValue);
              setPage(0);
            }}
            select
            size="small"
            sx={{ display: { xs: "flex", md: "none" } }}
            value={`${sortColumn}:${sortDirection}`}
          >
            {columnsForBasis.flatMap((column) => (["desc", "asc"] as const).map((directionValue) => (
              <MenuItem key={`${column.id}:${directionValue}`} value={`${column.id}:${directionValue}`}>
                {mobileSortLabel(column, directionValue)}
              </MenuItem>
            )))}
          </TextField>
          <Box sx={{ flex: 1 }} />
        </Stack>
        {visibleRows.length === 0 ? (
          <Typography color="text.secondary" sx={{ px: 2.25, pb: 3 }}>No completed trades match these filters.</Typography>
        ) : (
          <HorizontalScrollRegion label="Execution trade table" minTableWidth={1280} stickyFirstColumn>
            <Table size="small"><TableHead><TableRow>{columnsForBasis.map((column) => <TableCell key={column.id}><TableSortLabel active={sortColumn === column.id} direction={sortColumn === column.id ? sortDirection : "asc"} hideSortIcon={false} onClick={() => changeSort(column.id)} slotProps={{ icon: { sx: { opacity: sortColumn === column.id ? 1 : 0.45 } } }}>{column.label}</TableSortLabel></TableCell>)}</TableRow></TableHead><TableBody>{paginatedRows.map((row) => <TableRow aria-label={offline ? undefined : `View ${row.ticker} trade details`} hover key={row.roundTripId} onClick={offline ? undefined : () => setSelectedTrade(row)} onKeyDown={(event) => { if (offline) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedTrade(row); } }} role={offline ? undefined : "button"} sx={{ cursor: offline ? "default" : "pointer" }} tabIndex={offline ? undefined : 0}><TableCell sx={{ fontWeight: 850 }}>{row.ticker}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.tradeType}</TableCell><TableCell>{row.opened}</TableCell><TableCell>{row.closed}</TableCell><TableCell>{row.executions}</TableCell><TableCell>{row.averageEntry}</TableCell><TableCell>{row.averageExit}</TableCell><TableCell>{row.maximumPosition}</TableCell><TableCell>{row.holdTime}</TableCell><TableCell sx={{ color: row.netPnlValue < 0 ? "error.main" : "success.main", fontWeight: 800 }}>{row.netPnl}</TableCell></TableRow>)}</TableBody></Table>
          </HorizontalScrollRegion>
        )}
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          <TablePagination
            component="div"
            count={visibleRows.length}
            labelRowsPerPage="Rows per page:"
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              ".MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 0.5, justifyContent: "flex-end", minHeight: 52 },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: 12 },
            }}
          />
        </Box>
      </Paper>
      {offline ? null : <AnalyticsTradeDetailDrawer
        currency={currency}
        moneyBasis={moneyBasis}
        onClose={() => setSelectedTrade(null)}
        open={selectedTrade !== null}
        title={selectedTrade ? `${selectedTrade.ticker} trade` : "Trade details"}
        trades={selectedTrade ? [Object.freeze({
          closedAtUtc: selectedTrade.closedValue,
          direction: selectedTrade.direction,
          openedAtUtc: selectedTrade.openedValue,
          roundTripId: selectedTrade.roundTripId,
          selectedPnlDecimal: selectedTrade.netPnlDecimal,
          ticker: selectedTrade.ticker,
          tradeClassification: selectedTrade.tradeTypeValue,
          uniqueExecutionCount: selectedTrade.executions,
        } satisfies AnalyticsTradeDetail)] : []}
      />}
    </Stack>
  );
}
