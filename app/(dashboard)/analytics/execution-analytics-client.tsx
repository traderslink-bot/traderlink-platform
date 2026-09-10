"use client";

import Box from "@mui/material/Box";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Decimal from "decimal.js";
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
import { type ReactNode, useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";

import { FeatureHelpLink } from "../feature-help-link";
import { HorizontalScrollHint, HorizontalScrollRegion } from "../horizontal-scroll-region";
import { AnalyticsTradeDetailDrawer, type AnalyticsTradeDetail } from "./trade-detail-drawer";

type ExecutionMetricId = "gross_pnl" | "net_pnl" | "win_rate" | "included_count";
type ChartId = "entered_quantity_bucket" | "maximum_position_bucket" | "holding_duration_bucket";
type ChartStyle = "columns" | "horizontal_bars";
type Point = Readonly<{ key: string; label: string; metrics: Readonly<Record<ExecutionMetricId, Readonly<{ display: string; value: number | null }>>> }>;
export type ExecutionChartData = Readonly<Record<ChartId, readonly Point[]>>;
export type ExecutionTradeRow = Readonly<{ roundTripId: string; ticker: string; direction: "long" | "short"; tradeType: string; tradeTypeValue: "day_trade" | "multi_day_trade"; opened: string; openedValue: string; closed: string; closedValue: string; executions: number; averageEntry: string; averageEntryValue: number; averageExit: string; averageExitValue: number; maximumPosition: string; maximumPositionValue: number; holdTime: string; holdTimeValue: number; netPnl: string; netPnlDecimal: string | null; netPnlValue: number }>;
export type EntryPriceResult = Readonly<{ averageReturn?: string; averageReturnDecimal?: string | null; medianReturn?: string; averagePnl: string; averagePnlDecimal: string | null; entryPriceBand: string; key: string; losses: number | null; lossesDisplay: string; netPnl: string; netPnlDecimal: string | null; tradeCount: number | null; tradeCountDisplay: string; winRate: string; winRateDenominatorInteger: string | null; winRateNumeratorDecimal: string | null; wins: number | null; winsDisplay: string }>;
export type EntryPriceComparisonResult = Readonly<{ averagePnl: string; averagePnlDecimal: string | null; entryPriceBand: string; key: string; tradeCount: number | null; tradeCountDisplay: string; winRate: string; winRateDenominatorInteger: string | null; winRateNumeratorDecimal: string | null }>;
export type EntryPriceComparison = Readonly<{ averagePnlComparison: "higher" | "lower" | "equal" | null; evidenceState: "needs_overall_history" | "needs_comparison_history" | "uneven_sample" | "comparable"; oneAndAbove: EntryPriceComparisonResult; oneAndAboveTradesNeeded: number; totalTradeCount: number; underOne: EntryPriceComparisonResult; underOneTradesNeeded: number; winRateComparison: "higher" | "lower" | "equal" | null }>;
export type EntryPriceInsights = Readonly<{ highestAveragePnlKey: string | null; lowestAveragePnlKey: string | null }>;

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

function PriceHeading({ label, help }: { label: string; help: string }) {
  return <Stack component="span" direction="row" spacing={0.25} sx={{ alignItems: "center", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
    {label}<Tooltip arrow title={help}><IconButton size="small" aria-label={`Explain ${label}`} sx={{ p: 0.25 }}><InfoOutlinedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
  </Stack>;
}

function EntryPriceResults({ moneyBasis, results, resultsByDirection }: {
  moneyBasis: "gross" | "net";
  results: readonly EntryPriceResult[];
  resultsByDirection?: Readonly<Record<"long" | "short", readonly EntryPriceResult[]>>;
}) {
  const [selectedDirection, setSelectedDirection] = useState<"long" | "short">("long");
  const longCount = resultsByDirection?.long.reduce((sum, row) => sum + (row.tradeCount ?? 0), 0) ?? 0;
  const shortCount = resultsByDirection?.short.reduce((sum, row) => sum + (row.tradeCount ?? 0), 0) ?? 0;
  const direction = longCount === 0 && shortCount > 0 ? "short" : shortCount === 0 ? "long" : selectedDirection;
  const visible = resultsByDirection?.[direction] ?? results;
  const count = visible.reduce((sum, row) => sum + (row.tradeCount ?? 0), 0);
  const ranked = visible.filter((row) => (row.tradeCount ?? 0) > 0 && row.averageReturnDecimal != null)
    .sort((a, b) => new Decimal(b.averageReturnDecimal!).comparedTo(a.averageReturnDecimal!));
  const hasNewData = resultsByDirection !== undefined;
  const extreme = (highest: boolean) => {
    const value = (highest ? ranked[0] : ranked.at(-1))?.averageReturnDecimal;
    const matches = value == null ? [] : ranked.filter((row) => new Decimal(row.averageReturnDecimal!).equals(value));
    return <Box sx={{ borderLeft: 3, borderColor: "divider", pl: 1.25 }}>
      <Typography color="text.secondary" variant="body2">{highest ? "Highest average return" : "Lowest average return"}{matches.length > 1 ? " · tied" : ""}</Typography>
      {matches.map((row) => <Box key={row.key} sx={{ mt: 0.5 }}>
        <Typography sx={{ fontSize: { xs: 17, sm: 18 }, fontWeight: 850 }}>{row.entryPriceBand}</Typography>
        <Typography variant="body2" sx={{ color: financialOutcomeColor(row.averageReturnDecimal ?? null) }}>{row.averageReturn} average · {row.medianReturn} median · {row.tradeCountDisplay} trades</Typography>
      </Box>)}
    </Box>;
  };
  return <Paper sx={{ minWidth: 0, p: { xs: 1.5, sm: 2.25 } }} variant="outlined"><Stack spacing={1.5}>
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Entry Price Results</Typography>
      {longCount > 0 && shortCount > 0 ? <TextField label="Direction" select size="small" value={direction} onChange={(event) => setSelectedDirection(event.target.value as "long" | "short")} sx={{ minWidth: 135 }}><MenuItem value="long">Long trades</MenuItem><MenuItem value="short">Short trades</MenuItem></TextField> : shortCount > 0 ? <Typography variant="caption">Short trades</Typography> : null}
    </Stack>
    {!hasNewData ? <Typography color="text.secondary" variant="body2">Reconnect to update return comparisons.</Typography>
      : count < 30 ? <Typography color="text.secondary" variant="body2">Highest/lowest highlights start at 30 completed trades. Current selection: {count}. All price-band records remain below.</Typography>
      : ranked.length < 2 ? <Typography color="text.secondary" variant="body2">Average return is available for fewer than two price bands. Available records remain below.</Typography>
      : <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>{extreme(true)}{extreme(false)}</Box>}
    <HorizontalScrollRegion label="Entry price results table" minTableWidth={940}>
      <Table size="small" sx={{ "& .MuiTableCell-root": { px: 0.875, whiteSpace: "nowrap" } }}><TableHead><TableRow>
        <TableCell>Entry price</TableCell><TableCell align="right">{moneyBasis === "gross" ? "Gross" : "Net"} P/L</TableCell>
        <TableCell align="right">Trades</TableCell><TableCell align="right">Wins</TableCell><TableCell align="right">Losses</TableCell><TableCell align="right">Win rate</TableCell>
        <TableCell align="right"><PriceHeading label="Avg return" help={`Mean of each trade's ${moneyBasis} P/L divided by its total entry cost, multiplied by 100. Every trade has equal weight; unusually large percentage gains or losses can still affect the average.`} /></TableCell>
        <TableCell align="right"><PriceHeading label="Median return" help="The middle trade return after sorting. For an even number of trades, the average of the middle two. Less affected by a few extreme gains or losses." /></TableCell>
        <TableCell align="right"><PriceHeading label="Avg P/L" help={`Average ${moneyBasis} dollar profit or loss per trade. Position size affects this figure.`} /></TableCell>
      </TableRow></TableHead><TableBody>{visible.map((row) => <TableRow key={row.key}>
        <TableCell sx={{ fontWeight: 800 }}>{row.entryPriceBand}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.netPnlDecimal), fontWeight: 800 }}>{row.netPnl}</TableCell>
        <TableCell align="right">{row.tradeCountDisplay}</TableCell><TableCell align="right">{row.winsDisplay}</TableCell><TableCell align="right">{row.lossesDisplay}</TableCell><TableCell align="right">{row.winRate}</TableCell>
        <TableCell align="right">{row.averageReturn ?? "Unavailable"}</TableCell><TableCell align="right">{row.medianReturn ?? "Unavailable"}</TableCell><TableCell align="right">{row.averagePnl}</TableCell>
      </TableRow>)}</TableBody></Table>
    </HorizontalScrollRegion>
    <Typography color="text.secondary" variant="body2">Includes completed trades in the selected date range.</Typography>
    <Box component="details" sx={{ pt: 3, "&[open] .entry-price-help-chevron": { transform: "rotate(180deg)" } }}>
      <Box component="summary" sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", listStyle: "none", fontWeight: 750, fontSize: "0.875rem", minHeight: 44, borderRadius: 1, "&::-webkit-details-marker": { display: "none" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 } }}>
        <HelpOutlineIcon aria-hidden="true" sx={{ color: "text.secondary", fontSize: 20 }} />
        How to read these results
        <ExpandMoreIcon aria-hidden="true" className="entry-price-help-chevron" sx={{ ml: "auto", transition: "transform 150ms" }} />
      </Box>
      <Stack spacing={1.5} sx={{ pt: 1.5 }}>
        <Typography variant="body2" color="text.secondary">This table shows how your trades performed at different stock entry prices. Each trade goes into one price band based on its average entry price, including any shares you added.</Typography>
        <Typography variant="body2" color="text.secondary">The highlighted bands have the highest and lowest average percentage return—not the largest dollar profit. Each trade carries equal weight, so a bigger position doesn’t count more. A few unusually strong or weak trades can still affect the average, which is why median return is shown beside it. Median is the middle trade’s return.</Typography>
        <Typography variant="body2" color="text.secondary">Read those figures alongside the trade count, win rate and dollar profits to see which price bands have worked better for you during the selected period. Long and short trades are shown separately when you have both.</Typography>
      </Stack>
    </Box>
  </Stack></Paper>;
}

export function ExecutionAnalyticsClient({ chartData, currency, dateControls, moneyBasis, offline = false, priceResults, priceResultsByDirection, rows }: { chartData: ExecutionChartData; currency: string | null; dateControls?: ReactNode; moneyBasis: "gross" | "net"; offline?: boolean; priceComparison: EntryPriceComparison; priceInsights: EntryPriceInsights; priceResults: readonly EntryPriceResult[]; priceResultsByDirection?: Readonly<Record<"long" | "short", readonly EntryPriceResult[]>>; rows: readonly ExecutionTradeRow[] }) {
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "flex-start", flexWrap: "wrap", rowGap: 1 }}>
        <TextField label="Measure" onChange={(event) => setMetricId(event.target.value as ExecutionMetricId)} select size="small" sx={{ minWidth: { sm: 180 } }} value={metricId}>
          {measures(pnlMetricId).map((measure) => <MenuItem key={measure.id} value={measure.id}>{measure.label}</MenuItem>)}
        </TextField>
        {dateControls}
        <FeatureHelpLink href="/help/core-analytics/timing-and-execution#read-execution" label="Trade Breakdown measures" />
      </Stack>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.25fr) minmax(0, 0.75fr)" } }}>
        <EntryPriceResults moneyBasis={moneyBasis} results={priceResults} resultsByDirection={priceResultsByDirection} />
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
