"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardMetricCard, DashboardPrimaryAction } from "@/app/dashboard-template";
import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import type {
  DailyTradeLongTermAnalyticsModel,
  TradeAnalysisExcursionBreakdownRow,
  TradeAnalysisExcursionRow,
  TradeAnalysisBreakdownRow,
  TradeAnalysisPatternRow,
  TradeAnalysisTradeRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { CandlePatternOccurrenceExplorer } from "./candle-pattern-occurrence-explorer";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

export type TradeAnalysisView = "day" | "entry-exit" | "mfe-mae" | "green-to-red" | "candle-patterns" | "trades";

function money(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value));
}

function percent(value: number | null): string {
  return value === null ? "Unavailable" : `${value.toFixed(1)}%`;
}

function friendlyPattern(value: string): string {
  return candlePatternName(value);
}

type PatternGroup = Readonly<{
  occurrenceCount: number;
  pattern: string;
  rows: readonly TradeAnalysisPatternRow[];
}>;

function groupPatternRows(rows: readonly TradeAnalysisPatternRow[]): readonly PatternGroup[] {
  const rowsByPattern = new Map<string, TradeAnalysisPatternRow[]>();
  for (const row of rows) {
    const patternRows = rowsByPattern.get(row.pattern) ?? [];
    patternRows.push(row);
    rowsByPattern.set(row.pattern, patternRows);
  }

  return [...rowsByPattern.entries()].map(([pattern, patternRows]) => ({
    occurrenceCount: patternRows.reduce((total, row) => total + row.occurrenceCount, 0),
    pattern,
    rows: [...patternRows].sort((left, right) =>
      left.timeframe.localeCompare(right.timeframe) ||
      left.executionSide.localeCompare(right.executionSide) ||
      left.location.localeCompare(right.location)),
  })).sort((left, right) =>
    right.occurrenceCount - left.occurrenceCount || friendlyPattern(left.pattern).localeCompare(friendlyPattern(right.pattern)));
}

function greenToRedLabel(value: TradeAnalysisTradeRow["greenToRedStatus"]): string {
  switch (value) {
    case "never_green": return "Never green";
    case "green_no_red": return "Green, stayed above breakeven";
    case "green_to_red_ended_red": return "Green to red, ended red";
    case "green_to_red_recovered": return "Green to red, recovered";
    case "green_to_red_ended_flat": return "Green to red, ended flat";
    case "unavailable": return "Unavailable";
  }
}

function BreakdownTable({
  rows,
  valueLabel,
  valueSuffix = "",
  currency,
  showOccurrences = true,
}: {
  rows: readonly TradeAnalysisBreakdownRow[];
  valueLabel?: string;
  valueSuffix?: string;
  currency: string | null;
  showOccurrences?: boolean;
}) {
  if (rows.length === 0) return <Typography color="text.secondary">Not enough analyzed evidence is available for this breakdown.</Typography>;
  return (
      <HorizontalScrollRegion label="Trade analysis comparison table" minTableWidth={valueLabel ? 1240 : 1120} stickyFirstColumn>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Group</TableCell>{showOccurrences ? <TableCell align="right">Executions</TableCell> : null}<TableCell align="right">Trades</TableCell><TableCell align="right">Opportunity trades</TableCell>
            <TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell><TableCell align="right">Avg result</TableCell>
            <TableCell align="right">Avg potential result</TableCell><TableCell align="right">Avg missed opportunity</TableCell>
            {valueLabel ? <TableCell align="right">{valueLabel}</TableCell> : null}
          </TableRow></TableHead>
          <TableBody>{rows.map((row) => (
            <TableRow hover key={row.label}>
              <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell>
              {showOccurrences ? <TableCell align="right">{row.occurrenceCount}</TableCell> : null}
              <TableCell align="right">{row.tradeCount}</TableCell>
              <TableCell align="right">{row.opportunityTradeCount}</TableCell>
              <TableCell align="right">{percent(row.winRatePercent)}</TableCell>
              <TableCell align="right" sx={{ color: row.averageReturnPercent !== null && row.averageReturnPercent < 0 ? "error.main" : undefined }}>{percent(row.averageReturnPercent)}</TableCell>
              <TableCell align="right">{money(row.averagePnlDecimal, currency)}</TableCell>
              <TableCell align="right">{money(row.averagePotentialPnlDecimal, currency)}</TableCell>
              <TableCell align="right">{money(row.averageAdditionalOpportunityDecimal, currency)}</TableCell>
              {valueLabel ? <TableCell align="right">{row.averageValue === null ? "Unavailable" : `${row.averageValue.toFixed(1)}${valueSuffix}`}</TableCell> : null}
            </TableRow>
          ))}</TableBody>
        </Table>
      </HorizontalScrollRegion>
  );
}

function Section({
  children,
  description,
  title,
  defaultExpanded = false,
}: {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  description: string;
  helpHref: string;
  title: string;
}) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ border: 1, borderColor: "divider", borderRadius: "8px !important", boxShadow: "none", overflow: "hidden", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minWidth: 0, px: { xs: 1.5, sm: 2.25 }, py: 0.5 }}>
        <Box><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{title}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 1.5, sm: 2.25 }, pb: 2.25, pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

type SortColumn = "symbol" | "closeDate" | "actual" | "return" | "opportunity" | "additional" | "capture" | "peakToExit";

function sortValue(row: TradeAnalysisTradeRow, column: SortColumn): string | number {
  switch (column) {
    case "symbol": return row.symbol;
    case "closeDate": return row.closeDate;
    case "actual": return Number(row.actualPnlDecimal);
    case "return": return row.returnPercent ?? Number.NEGATIVE_INFINITY;
    case "opportunity": return Number(row.sustainedOpportunityDecimal ?? Number.NEGATIVE_INFINITY);
    case "additional": return Number(row.additionalOpportunityDecimal ?? Number.NEGATIVE_INFINITY);
    case "capture": return row.capturedPercent ?? Number.NEGATIVE_INFINITY;
    case "peakToExit": return row.peakToExitMinutes ?? Number.NEGATIVE_INFINITY;
  }
}

function TradeTable({ model, offline = false }: { model: DailyTradeLongTermAnalyticsModel; offline?: boolean }) {
  const [ticker, setTicker] = useState("");
  const [outcome, setOutcome] = useState<"all" | TradeAnalysisTradeRow["greenToRedStatus"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<SortColumn>("closeDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const rows = useMemo(() => model.trades.filter((row) =>
    row.symbol.toUpperCase().includes(ticker.trim().toUpperCase()) &&
    (outcome === "all" || row.greenToRedStatus === outcome))
    .sort((left, right) => {
      const leftValue = sortValue(left, sortColumn);
      const rightValue = sortValue(right, sortColumn);
      const comparison = typeof leftValue === "string"
        ? leftValue.localeCompare(rightValue as string)
        : leftValue - (rightValue as number);
      return sortDirection === "asc" ? comparison : -comparison;
    }), [model.trades, outcome, sortColumn, sortDirection, ticker]);
  const currentPage = boundedPage(page, rows.length, pageSize);
  const visibleRows = paginatedRows(rows, currentPage, pageSize);
  const changeSort = (column: SortColumn) => {
    if (column === sortColumn) setSortDirection((value) => value === "asc" ? "desc" : "asc");
    else {
      setSortColumn(column);
      setSortDirection(column === "symbol" ? "asc" : "desc");
    }
    setPage(1);
  };
  const heading = (column: SortColumn, label: string) => (
    <TableSortLabel active={sortColumn === column} direction={sortColumn === column ? sortDirection : "asc"} onClick={() => changeSort(column)}>{label}</TableSortLabel>
  );
  const trackerHref = (row: TradeAnalysisTradeRow) =>
    offline
      ? `/trade-tracker/${row.trackerDate}`
      : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`;
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(1); }} size="small" value={ticker} />
        <TextField label="Green-to-red outcome" onChange={(event) => { setOutcome(event.target.value as typeof outcome); setPage(1); }} select size="small" sx={{ minWidth: { xs: 0, md: 230 }, width: { xs: "100%", md: "auto" } }} value={outcome}>
          <MenuItem value="all">All outcomes</MenuItem>
          <MenuItem value="never_green">Never green</MenuItem>
          <MenuItem value="green_no_red">Green, stayed above breakeven</MenuItem>
          <MenuItem value="green_to_red_ended_red">Green to red, ended red</MenuItem>
          <MenuItem value="green_to_red_recovered">Green to red, recovered</MenuItem>
          <MenuItem value="green_to_red_ended_flat">Green to red, ended flat</MenuItem>
        </TextField>
        <TextField
          label="Sort"
          onChange={(event) => {
            const [column, direction] = event.target.value.split(":") as [SortColumn, "asc" | "desc"];
            setSortColumn(column);
            setSortDirection(direction);
            setPage(1);
          }}
          select
          size="small"
          sx={{ display: { xs: "flex", md: "none" } }}
          value={`${sortColumn}:${sortDirection}`}
        >
          <MenuItem value="closeDate:desc">Newest closed</MenuItem>
          <MenuItem value="closeDate:asc">Oldest closed</MenuItem>
          <MenuItem value="symbol:asc">Ticker A–Z</MenuItem>
          <MenuItem value="symbol:desc">Ticker Z–A</MenuItem>
          <MenuItem value="actual:desc">Highest result</MenuItem>
          <MenuItem value="actual:asc">Lowest result</MenuItem>
          <MenuItem value="return:desc">Highest return</MenuItem>
          <MenuItem value="return:asc">Lowest return</MenuItem>
          <MenuItem value="opportunity:desc">Highest opportunity</MenuItem>
          <MenuItem value="additional:desc">Most additional opportunity</MenuItem>
          <MenuItem value="capture:desc">Highest captured</MenuItem>
          <MenuItem value="peakToExit:desc">Longest peak to exit</MenuItem>
        </TextField>
      </Stack>
      <TradeAnalyzerTablePagination
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }}
        page={currentPage}
        pageSize={pageSize}
        rowCount={rows.length}
      />
      {rows.length === 0 ? <Typography color="text.secondary">No analyzed trades match these filters.</Typography> : (
          <HorizontalScrollRegion label="Green-to-red trades table" minTableWidth={1520} stickyFirstColumn>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>{heading("symbol", "Ticker")}</TableCell><TableCell>Direction</TableCell><TableCell>{heading("closeDate", "Closed")}</TableCell>
                <TableCell align="right">{heading("actual", `${model.moneyBasis === "gross" ? "Gross" : "Net"} P/L`)}</TableCell><TableCell align="right">{heading("return", "Return")}</TableCell><TableCell align="right">{heading("opportunity", "Sustained opportunity")}</TableCell>
                <TableCell align="right">{heading("additional", "Additional opportunity")}</TableCell><TableCell align="right">{heading("capture", "Captured")}</TableCell>
                <TableCell align="right">{heading("peakToExit", "Peak to exit")}</TableCell><TableCell>Outcome</TableCell><TableCell align="right">Executions</TableCell><TableCell />
              </TableRow></TableHead>
              <TableBody>{visibleRows.map((row) => (
                <TableRow hover key={row.roundTripId}>
                  <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.closeDate}</TableCell>
                  <TableCell align="right" sx={{ color: Number(row.actualPnlDecimal) < 0 ? "error.main" : "success.main", fontWeight: 800 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell>
                  <TableCell align="right" sx={{ color: row.returnPercent !== null && row.returnPercent < 0 ? "error.main" : undefined }}>{percent(row.returnPercent)}</TableCell>
                  <TableCell align="right">{money(row.sustainedOpportunityDecimal, model.currency)}</TableCell><TableCell align="right">{money(row.additionalOpportunityDecimal, model.currency)}</TableCell>
                  <TableCell align="right">{percent(row.capturedPercent)}</TableCell><TableCell align="right">{row.peakToExitMinutes === null ? "Unavailable" : `${row.peakToExitMinutes} min`}</TableCell>
                  <TableCell>{greenToRedLabel(row.greenToRedStatus)}</TableCell><TableCell align="right">{row.executionCount}</TableCell>
                  <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={trackerHref(row)} size="small" variant="outlined">{offline ? "Open saved day" : "View full analysis"}</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </HorizontalScrollRegion>
      )}
    </Stack>
  );
}

function ExcursionBreakdownTable({
  currency,
  rows,
}: {
  currency: string | null;
  rows: readonly TradeAnalysisExcursionBreakdownRow[];
}) {
  if (rows.length === 0) return <Typography color="text.secondary">No measured entries or adds are available for these comparisons.</Typography>;
  return <HorizontalScrollRegion label="MFE and MAE comparison table" minTableWidth={760} stickyFirstColumn><Table size="small"><TableHead><TableRow>
      <TableCell>Group</TableCell><TableCell align="right">Measured</TableCell><TableCell align="right">Avg MFE</TableCell><TableCell align="right">Avg MAE</TableCell><TableCell align="right">Avg MFE %</TableCell><TableCell align="right">Avg MAE %</TableCell>
    </TableRow></TableHead><TableBody>{rows.map((row) => <TableRow hover key={row.label}>
      <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell><TableCell align="right">{row.measuredExecutionCount}</TableCell><TableCell align="right">{money(row.averageFavorableMoveDecimal, currency)}</TableCell><TableCell align="right">{money(row.averageAdverseMoveDecimal, currency)}</TableCell><TableCell align="right">{percent(row.averageFavorableMovePercent)}</TableCell><TableCell align="right">{percent(row.averageAdverseMovePercent)}</TableCell>
    </TableRow>)}</TableBody></Table></HorizontalScrollRegion>;
}

function MfeMaeTable({ model, offline = false }: { model: DailyTradeLongTermAnalyticsModel; offline?: boolean }) {
  const [ticker, setTicker] = useState("");
  const [entryType, setEntryType] = useState<"all" | TradeAnalysisExcursionRow["eventKind"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const rows = useMemo(() => model.excursions.filter((row) =>
    row.symbol.toUpperCase().includes(ticker.trim().toUpperCase()) &&
    (entryType === "all" || row.eventKind === entryType)), [entryType, model.excursions, ticker]);
  const currentPage = boundedPage(page, rows.length, pageSize);
  const visibleRows = paginatedRows(rows, currentPage, pageSize);
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(1); }} size="small" value={ticker} />
      <TextField label="Execution" onChange={(event) => { setEntryType(event.target.value as typeof entryType); setPage(1); }} select size="small" sx={{ minWidth: { xs: 0, sm: 160 }, width: { xs: "100%", sm: "auto" } }} value={entryType}>
        <MenuItem value="all">Entries and adds</MenuItem><MenuItem value="Entry">Entries</MenuItem><MenuItem value="Add">Adds</MenuItem>
      </TextField>
    </Stack>
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={rows.length} />
    {rows.length === 0 ? <Typography color="text.secondary">No measured entries or adds match these filters.</Typography> :
      <HorizontalScrollRegion label="Measured entries and adds table" minTableWidth={1420} stickyFirstColumn><Table size="small"><TableHead><TableRow>
        <TableCell>Ticker</TableCell><TableCell>Type</TableCell><TableCell>Direction</TableCell><TableCell>Closed</TableCell><TableCell align="right">Entry price</TableCell><TableCell align="right">MFE</TableCell><TableCell align="right">MAE</TableCell><TableCell align="right">MFE %</TableCell><TableCell align="right">MAE %</TableCell><TableCell align="right">Until flat</TableCell><TableCell align="right">Actual P/L</TableCell><TableCell />
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={`${row.roundTripId}-${row.executionSequence}`}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.eventKind}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.closeDate}</TableCell><TableCell align="right">{money(row.entryPriceDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "success.main", fontWeight: 750 }}>{money(row.favorableMoveDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "error.main", fontWeight: 750 }}>{money(row.adverseMoveDecimal, model.currency)}</TableCell><TableCell align="right">{percent(row.favorableMovePercent)}</TableCell><TableCell align="right">{percent(row.adverseMovePercent)}</TableCell><TableCell align="right">{row.minutesUntilFlat} min</TableCell><TableCell align="right" sx={{ color: Number(row.actualPnlDecimal) < 0 ? "error.main" : "success.main", fontWeight: 750 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell><TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">{offline ? "Open saved day" : "View full analysis"}</Button></TableCell>
      </TableRow>)}</TableBody></Table></HorizontalScrollRegion>}
  </Stack>;
}

function PatternRanking({ groups }: { groups: readonly PatternGroup[] }) {
  const rows = groups.slice(0, 10);
  const maximum = Math.max(1, ...rows.map((row) => row.occurrenceCount));
  if (rows.length === 0) return <Typography color="text.secondary">No qualifying saved candle patterns are available in this range.</Typography>;
  return (
    <Stack spacing={1.25}>
      {rows.map((row) => (
        <Box key={row.pattern}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">{friendlyPattern(row.pattern)}</Typography>
            <Typography color="text.secondary" variant="caption">{row.occurrenceCount} occurrence{row.occurrenceCount === 1 ? "" : "s"}</Typography>
          </Stack>
          <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: 999, height: 8, mt: 0.5, overflow: "hidden" }}>
            <Box sx={{ bgcolor: "primary.main", borderRadius: 999, height: "100%", width: `${Math.max(4, row.occurrenceCount / maximum * 100)}%` }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

const CAPABILITIES = Object.freeze([
  Object.freeze({ href: "/analytics/trade-analyzer/day/mfe-mae", title: "MFE & MAE", description: "Study favorable and adverse movement after every measured entry or add." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/entry-exit", title: "Entry & Exit", description: "Compare entry timing, favorable and adverse movement, market context and exit giveback." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/green-to-red", title: "Green-to-Red", description: "Review profit capture, reversals below breakeven, recoveries and risk-management behavior." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/candle-patterns", title: "Candle Patterns", description: "Compare saved one-minute and five-minute patterns observed on or before executions." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/trades", title: "Analyzed Trades", description: "Inspect the exact trades behind every summary and return to each Daily Trade Tracker replay." }),
]);

export function TradeAnalysisClient({
  evidenceQuery,
  model,
  offline = false,
  showMoomooConnectionGuidance = false,
  view,
}: {
  evidenceQuery: Readonly<{
    currency: string | null;
    endDate: string | null;
    moneyBasis: "gross" | "net";
    startDate: string | null;
  }>;
  model: DailyTradeLongTermAnalyticsModel;
  offline?: boolean;
  showMoomooConnectionGuidance?: boolean;
  view: TradeAnalysisView;
}) {
  const [patternPage, setPatternPage] = useState(1);
  const [patternPageSize, setPatternPageSize] = useState(10);
  const patternGroups = useMemo(() => groupPatternRows(model.patterns), [model.patterns]);
  const currentPatternPage = boundedPage(patternPage, patternGroups.length, patternPageSize);
  const visiblePatternGroups = paginatedRows(patternGroups, currentPatternPage, patternPageSize);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  if (model.eligibleDayTradeCount === 0) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No completed day trades</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          TradersLink Trade Analyzer analyzes trades that are manually submitted in the Daily Trade Tracker. While the app is in beta the Trade Analyzer uses market data provided by connected Moomoo accounts. A free moomoo account is all that is need to use the analyzer. If you already have a moomoo account TraderLink will connect your account quickly and securely using moomo&apos;s official OAuth.
        </Typography>
        <DashboardPrimaryAction href="/account/trading" sx={{ mt: 2 }}>
          Connect Moomoo
        </DashboardPrimaryAction>
      </Paper>
    );
  }
  if (model.analyzedTradeCount === 0) {
    return <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined"><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No trades have been analyzed.</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>TradersLink Trade Analyzer analyzes trades that are manually submitted in the Daily Trade Tracker.</Typography></Paper>;
  }
  return (
    <Stack spacing={2.5}>
      {view === "day" ? <Stack spacing={1.25}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Overall results</Typography>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Every saved buy and sell snapshot" label="Analyzed executions" value={String(model.analyzedExecutionCount)} />
        <DashboardMetricCard caption="Trades that finished above breakeven" label="Win rate" value={percent(model.winRatePercent)} />
        <DashboardMetricCard caption="Average percentage return per analyzed trade" label="Average return" value={percent(model.averageReturnPercent)} />
        <DashboardMetricCard caption={`Trade Tracker ${model.moneyBasis} P/L per analyzed trade`} label={`Average ${model.moneyBasis} result`} value={money(model.averagePnlDecimal, model.currency)} />
        <DashboardMetricCard caption={`Combined Trade Tracker ${model.moneyBasis} P/L`} label="Total actual result" value={money(model.profitCapture.totalActualPnlDecimal, model.currency)} />
        <DashboardMetricCard caption="Actual result plus measured additional opportunity" label="Result at sustained opportunities" value={money(model.profitCapture.totalPotentialPnlDecimal, model.currency)} />
        <DashboardMetricCard caption="Difference between actual and measured opportunity" label="Total missed opportunity" value={money(model.profitCapture.totalAdditionalOpportunityDecimal, model.currency)} />
        </Box>
      </Stack> : null}

      <Card sx={{ maxWidth: { xs: "100%", sm: 240 } }} variant="outlined">
        <CardActionArea component={Link} href="/analytics/trade-analyzer/day/trades">
          <CardContent>
            <Typography color="text.secondary" variant="caption">Analyzed trades</Typography>
            <Typography component="div" sx={{ fontSize: "1.75rem", fontWeight: 800, mt: 0.5 }}>
              {model.analyzedTradeCount}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      {view === "day" ? (
        <Stack spacing={1.25}>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Explore your analysis</Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
          {CAPABILITIES.map((capability) => (
            <Card key={capability.href} variant="outlined">
              <CardActionArea component={Link} href={capability.href} sx={{ height: "100%" }}>
                <CardContent sx={{ minHeight: 132 }}>
                  <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{capability.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{capability.description}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          </Box>
        </Stack>
      ) : null}

      {view === "green-to-red" ? <Section defaultExpanded description="Actual results compared with the strongest profit opportunities that remained available through completed candle closes." helpHref="/help/trade-analyzer/green-to-red-analysis#profit-capture" title="Profit capture">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption={`Combined Trade Tracker ${model.moneyBasis} P/L`} label="Total actual result" value={money(model.profitCapture.totalActualPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Actual result plus the measured additional opportunity" label="Result at best sustained opportunities" value={money(model.profitCapture.totalPotentialPnlDecimal, model.currency)} />
            <DashboardMetricCard caption={`${model.opportunityTradeCount} trades had a measured sustained opportunity`} label="Total additional opportunity" value={money(model.profitCapture.totalAdditionalOpportunityDecimal, model.currency)} />
            <DashboardMetricCard caption="Mean percentage retained" label="Average peak profit retained" value={percent(model.profitCapture.averageCapturedPercent)} />
            <DashboardMetricCard caption="Middle percentage retained" label="Median peak profit retained" value={percent(model.profitCapture.medianCapturedPercent)} />
            <DashboardMetricCard caption="Average drop from the measured peak to the final exit" label="Average peak-to-exit giveback" value={money(model.profitCapture.averagePeakToFinalGivebackDecimal, model.currency)} />
          </Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Time held after the profit peak</Typography><BreakdownTable currency={model.currency} rows={model.holding} showOccurrences={false} valueLabel="Avg peak-to-exit" valueSuffix=" min" /></Box>
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section defaultExpanded description="What happened after trades first moved above breakeven." helpHref="/help/trade-analyzer/green-to-red-analysis#green-to-red-outcomes" title="Green-to-red outcomes">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption="Moved above breakeven and later fell below it" label="Green-to-red trades" value={`${model.greenToRedTradeCount} of ${model.analyzedTradeCount}`} />
            <DashboardMetricCard caption="Average time from first green to first red" label="Time before turning red" value={model.greenToRedDamage.averageGreenToRedMinutes === null ? "Unavailable" : `${model.greenToRedDamage.averageGreenToRedMinutes.toFixed(1)} min`} />
            <DashboardMetricCard caption="Turned positive again after first going red" label="Recovery rate" value={percent(model.greenToRedDamage.recoveryRatePercent)} />
            <DashboardMetricCard caption="Average time from first red to first recovery" label="Recovery time" value={model.greenToRedDamage.averageRecoveryMinutes === null ? "Unavailable" : `${model.greenToRedDamage.averageRecoveryMinutes.toFixed(1)} min`} />
            <DashboardMetricCard caption="Average profit reversal before first turning red" label="Peak-to-red damage" value={money(model.greenToRedDamage.averagePeakToRedDamageDecimal, model.currency)} />
            <DashboardMetricCard caption="Average profit reversal from peak to final exit" label="Peak-to-exit damage" value={money(model.greenToRedDamage.averagePeakToFinalDamageDecimal, model.currency)} />
            <DashboardMetricCard caption={`${model.greenToRedDamage.endedRedTradeCount} trades finished red after first moving green`} label="Ended-red actual result" value={money(model.greenToRedDamage.endedRedActualPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Combined result at each trade's best sustained opportunity" label="Ended-red potential result" value={money(model.greenToRedDamage.endedRedPotentialPnlDecimal, model.currency)} />
            <DashboardMetricCard caption="Difference between the actual and potential results" label="Ended-red missed opportunity" value={money(model.greenToRedDamage.endedRedAdditionalOpportunityDecimal, model.currency)} />
          </Box>
          <BreakdownTable currency={model.currency} rows={model.greenToRed} showOccurrences={false} />
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section description="Observed outcomes when the trader added after a measured peak or reduced the position before a green trade turned red." helpHref="/help/trade-analyzer/green-to-red-analysis#risk-management-behavior" title="Risk-management behavior">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Adding after the peak</Typography><BreakdownTable currency={model.currency} rows={model.riskManagement.addedAfterPeak} showOccurrences={false} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Scaling out before red</Typography><BreakdownTable currency={model.currency} rows={model.riskManagement.partialExitBeforeRed} showOccurrences={false} /></Box>
          <Typography color="text.secondary" variant="body2">These are comparisons of what happened in your saved trades. They do not prove that adding or scaling out caused the result.</Typography>
        </Stack>
      </Section> : null}

      {view === "green-to-red" ? <Section description="The analyzed trades behind the profit-capture and Green-to-red comparisons." helpHref="/help/trade-analyzer/green-to-red-analysis#supporting-trades" title="Supporting trades">
        <TradeTable model={model} offline={offline} />
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description="How far price moved in favor of and against each entry or add before the position became flat." helpHref="/help/trade-analyzer/entry-exit-analysis#entry-opportunity-risk" title="Entry opportunity and risk">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption={`${model.entryOpportunityRisk.measuredExecutionCount} measured entry and add executions`} label="Average favorable move per share" value={money(model.entryOpportunityRisk.averageFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle favorable movement across measured executions" label="Median favorable move per share" value={money(model.entryOpportunityRisk.medianFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Average movement against the execution" label="Average adverse move per share" value={money(model.entryOpportunityRisk.averageAdverseMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle adverse movement across measured executions" label="Median adverse move per share" value={money(model.entryOpportunityRisk.medianAdverseMoveDecimal, model.currency)} />
        </Box>
      </Section> : null}

      {view === "mfe-mae" ? <Section defaultExpanded description="Complete-population favorable and adverse movement after each measured entry or add, before the position became flat." helpHref="/help/trade-analyzer/mfe-mae#overview" title="MFE & MAE">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption="Entries and adds with saved one-minute candle coverage" label="Measured executions" value={String(model.entryOpportunityRisk.measuredExecutionCount)} />
          <DashboardMetricCard caption="Average price movement in the trade's favor per share" label="Average MFE" value={money(model.entryOpportunityRisk.averageFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle favorable price movement per share" label="Median MFE" value={money(model.entryOpportunityRisk.medianFavorableMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Average price movement against the trade per share" label="Average MAE" value={money(model.entryOpportunityRisk.averageAdverseMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Middle adverse price movement per share" label="Median MAE" value={money(model.entryOpportunityRisk.medianAdverseMoveDecimal, model.currency)} />
          <DashboardMetricCard caption="Average favorable movement relative to the entry price" label="Average MFE %" value={percent(model.mfeMae.averageFavorableMovePercent)} />
          <DashboardMetricCard caption="Middle favorable movement relative to the entry price" label="Median MFE %" value={percent(model.mfeMae.medianFavorableMovePercent)} />
          <DashboardMetricCard caption="Average adverse movement relative to the entry price" label="Average MAE %" value={percent(model.mfeMae.averageAdverseMovePercent)} />
          <DashboardMetricCard caption="Middle adverse movement relative to the entry price" label="Median MAE %" value={percent(model.mfeMae.medianAdverseMovePercent)} />
        </Box>
      </Section> : null}

      {view === "mfe-mae" ? <Section description="Compare the same measured execution population by entry type and direction. These rows describe observed price movement; they do not prescribe a stop or target." helpHref="/help/trade-analyzer/mfe-mae#comparisons" title="Comparisons">
        <ExcursionBreakdownTable currency={model.currency} rows={model.mfeMae.breakdown} />
      </Section> : null}

      {view === "mfe-mae" ? <Section description="The individual saved Moomoo-candle observations behind the long-term MFE and MAE results. Ticker and execution filters apply before pagination." helpHref="/help/trade-analyzer/mfe-mae#measured-executions" title="Measured executions">
        <MfeMaeTable model={model} offline={offline} />
      </Section> : null}

      {view === "entry-exit" ? <Section description={`Results grouped by entry time and total holding duration in ${model.timezone}.`} helpHref="/help/trade-analyzer/entry-exit-analysis#timing-holding" title="Timing and holding">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Entry time</Typography><BreakdownTable currency={model.currency} rows={model.entryTime} showOccurrences={false} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Total holding time</Typography><BreakdownTable currency={model.currency} rows={model.holdingDuration} showOccurrences={false} valueLabel="Avg holding time" valueSuffix=" min" /></Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="Every entry and add, grouped by its saved Session VWAP, EMA 9 and relative-volume context." helpHref="/help/trade-analyzer/entry-exit-analysis#entry-execution-context" title="Entry execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from Session VWAP</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Relative volume</Typography><BreakdownTable currency={model.currency} rows={model.entryContext.relativeVolume} valueLabel="Avg relative volume" valueSuffix="x" /></Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="Every partial and final exit with a measurable giveback from its earlier favorable completed-candle price." helpHref="/help/trade-analyzer/entry-exit-analysis#exit-execution-context" title="Exit execution context">
        <BreakdownTable currency={model.currency} rows={model.exitContext} valueLabel="Avg giveback" valueSuffix="%" />
      </Section> : null}

      {view === "candle-patterns" ? <Section defaultExpanded description="The ten most frequently observed candle patterns." helpHref="/help/trade-analyzer/candle-patterns#ranked-patterns" title="Most observed patterns">
        <PatternRanking groups={patternGroups} />
      </Section> : null}

      {view === "candle-patterns" ? <Section defaultExpanded description="Each pattern groups its one-minute and five-minute results by execution and location." helpHref="/help/trade-analyzer/candle-patterns#pattern-results" title="Candle patterns">
        <TradeAnalyzerTablePagination
          onPageChange={setPatternPage}
          onPageSizeChange={(nextSize) => { setPatternPageSize(nextSize); setPatternPage(1); }}
          page={currentPatternPage}
          pageSize={patternPageSize}
          rowCount={patternGroups.length}
        />
        {patternGroups.length === 0 ? <Typography color="text.secondary">No qualifying saved candle patterns are available in this range.</Typography> : (
          <Stack spacing={1.5} sx={{ mt: patternGroups.length > 10 ? 1.5 : 0 }}>
            {visiblePatternGroups.map((group) => (
              <Paper key={group.pattern} sx={{ overflow: "hidden" }} variant="outlined">
                <Box sx={{ alignItems: { sm: "center" }, bgcolor: "rgba(1, 30, 86, 0.04)", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
                  <Box>
                    <Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">{friendlyPattern(group.pattern)}</Typography>
                    <Typography color="text.secondary" variant="body2">{group.occurrenceCount} total occurrence{group.occurrenceCount === 1 ? "" : "s"}</Typography>
                  </Box>
                  <Button
                    aria-label={`View ${group.occurrenceCount} ${friendlyPattern(group.pattern)} occurrences`}
                    disabled={offline}
                    onClick={() => setSelectedPattern(group.pattern)}
                    size="small"
                    variant={selectedPattern === group.pattern ? "contained" : "outlined"}
                  >
                    {offline ? "Reconnect for occurrences" : `View occurrences (${group.occurrenceCount})`}
                  </Button>
                </Box>
                <HorizontalScrollRegion label={`${friendlyPattern(group.pattern)} breakdown table`} minTableWidth={860} stickyFirstColumn>
                  <Table aria-label={`${friendlyPattern(group.pattern)} breakdown`} size="small">
                    <TableHead><TableRow><TableCell>Timeframe</TableCell><TableCell>Execution</TableCell><TableCell>Location</TableCell><TableCell align="right">Occurrences</TableCell><TableCell align="right">Trades</TableCell><TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell><TableCell align="right">Avg result</TableCell></TableRow></TableHead>
                    <TableBody>{group.rows.map((row) => <TableRow hover key={`${row.timeframe}-${row.executionSide}-${row.location}`}><TableCell sx={{ fontWeight: 750 }}>{row.timeframe}</TableCell><TableCell>{row.executionSide}</TableCell><TableCell>{row.location}</TableCell><TableCell align="right">{row.occurrenceCount}</TableCell><TableCell align="right">{row.tradeCount}</TableCell><TableCell align="right">{percent(row.winRatePercent)}</TableCell><TableCell align="right" sx={{ color: row.averageReturnPercent !== null && row.averageReturnPercent < 0 ? "error.main" : undefined }}>{percent(row.averageReturnPercent)}</TableCell><TableCell align="right">{money(row.averagePnlDecimal, model.currency)}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </HorizontalScrollRegion>
              </Paper>
            ))}
          </Stack>
        )}
      </Section> : null}

      {view === "candle-patterns" && !offline ? (
        <Drawer
          anchor="right"
          onClose={() => setSelectedPattern(null)}
          open={selectedPattern !== null}
          slotProps={{ paper: { sx: { maxWidth: "100%", width: { xs: "100%", md: 760 } } } }}
          sx={{ overflowX: "hidden" }}
        >
          {selectedPattern ? (
            <CandlePatternOccurrenceExplorer
              currency={evidenceQuery.currency}
              endDate={evidenceQuery.endDate}
              moneyBasis={evidenceQuery.moneyBasis}
              onClose={() => setSelectedPattern(null)}
              pattern={selectedPattern}
              showMoomooConnectionGuidance={showMoomooConnectionGuidance}
              startDate={evidenceQuery.startDate}
            />
          ) : null}
        </Drawer>
      ) : null}

      {model.malformedSnapshotCount > 0 ? <Typography color="warning.main" variant="body2">{model.malformedSnapshotCount} saved execution snapshots could not be read and were excluded from execution-level breakdowns.</Typography> : null}
    </Stack>
  );
}
