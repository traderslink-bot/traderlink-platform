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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Decimal from "decimal.js";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { DashboardMetricCard } from "@/app/dashboard-template";
import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type {
  DailyTradeLongTermAnalyticsV2Model,
  TradeAnalysisExcursionRow,
  TradeAnalysisExecutionContextRow,
  TradeAnalysisEventPathRow,
  TradeAnalysisMeaningfulProfitRow,
  TradeAnalysisScalingOutRow,
  TradeAnalysisBreakdownRow,
  TradeAnalysisPatternRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { CandlePatternOccurrenceExplorer } from "./candle-pattern-occurrence-explorer";
import { GreenToRedAnalysis } from "./green-to-red-analysis";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { ProfitZoneAnalysis } from "./profit-zone-analysis";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

export type TradeAnalysisView = "day" | "entry-exit" | "mfe-mae" | "green-to-red" | "scaling-out" | "candle-patterns" | "trades";

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

function signedPercent(value: number | null): string {
  return value === null ? "Unavailable" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function potentialDifferenceColor(value: string | null): "error.main" | "success.main" | "text.primary" {
  if (value === null) return "text.primary";
  const difference = new Decimal(value);
  if (difference.isPositive()) return "error.main";
  if (difference.isNegative()) return "success.main";
  return "text.primary";
}

function average(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
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

function BreakdownTable({
  rows,
  valueLabel,
  valueMultiplier = 1,
  valueSuffix = "",
  currency,
  moneyBasis,
  showOccurrences = true,
}: {
  rows: readonly TradeAnalysisBreakdownRow[];
  valueLabel?: string;
  valueMultiplier?: number;
  valueSuffix?: string;
  currency: string | null;
  moneyBasis: "gross" | "net";
  showOccurrences?: boolean;
}) {
  if (rows.length === 0) return <Typography color="text.secondary">Not enough analyzed evidence is available for this breakdown.</Typography>;
  return (
      <HorizontalScrollRegion label="Trade analysis comparison table" minTableWidth={valueLabel ? 1160 : 1040} stickyFirstColumn>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Group</TableCell>{showOccurrences ? <TableCell align="right">Executions</TableCell> : null}<TableCell align="right">Trades</TableCell>
            <TableCell align="right">{moneyBasis === "gross" ? "Gross" : "Net"} total</TableCell><TableCell align="right">Avg {moneyBasis} result</TableCell><TableCell align="right">Median {moneyBasis} result</TableCell>
            <TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell>
            {valueLabel ? <TableCell align="right">{valueLabel}</TableCell> : null}
          </TableRow></TableHead>
          <TableBody>{rows.map((row) => (
            <TableRow hover key={row.label}>
              <TableCell sx={{ fontWeight: 750 }}>{row.label}</TableCell>
              {showOccurrences ? <TableCell align="right">{row.occurrenceCount}</TableCell> : null}
              <TableCell align="right">{row.tradeCount}</TableCell>
              <TableCell align="right" sx={{ color: financialOutcomeColor(row.totalPnlDecimal ?? null), fontWeight: 750 }}>{money(row.totalPnlDecimal ?? null, currency)}</TableCell>
              <TableCell align="right" sx={{ color: financialOutcomeColor(row.averagePnlDecimal) }}>{money(row.averagePnlDecimal, currency)}</TableCell>
              <TableCell align="right" sx={{ color: financialOutcomeColor(row.medianPnlDecimal ?? null) }}>{money(row.medianPnlDecimal ?? null, currency)}</TableCell>
              <TableCell align="right">{percent(row.winRatePercent)}</TableCell>
              <TableCell align="right" sx={{ color: financialOutcomeColor(row.averageReturnPercent) }}>{percent(row.averageReturnPercent)}</TableCell>
              {valueLabel ? <TableCell align="right">{row.averageValue === null ? "Unavailable" : `${(row.averageValue * valueMultiplier).toFixed(1)}${valueSuffix}`}</TableCell> : null}
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

function MfeMaeTable({
  direction,
  model,
  offline = false,
}: {
  direction: "long" | "short";
  model: DailyTradeLongTermAnalyticsV2Model;
  offline?: boolean;
}) {
  const [ticker, setTicker] = useState("");
  const [entryType, setEntryType] = useState<"all" | TradeAnalysisExcursionRow["eventKind"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const rows = useMemo(() => model.excursions.filter((row) =>
    row.direction === direction &&
    row.symbol.toUpperCase().includes(ticker.trim().toUpperCase()) &&
    (entryType === "all" || row.eventKind === entryType)), [direction, entryType, model.excursions, ticker]);
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
        <TableCell>Ticker</TableCell><TableCell>Type</TableCell><TableCell>Closed</TableCell><TableCell align="right">Entry price</TableCell><TableCell align="right">{direction === "long" ? "Price rise per share after entry" : "Price drop per share after entry"}</TableCell><TableCell align="right">{direction === "long" ? "Price drop per share after entry" : "Price rise per share after entry"}</TableCell><TableCell align="right">{direction === "long" ? "Price rise %" : "Price drop %"}</TableCell><TableCell align="right">{direction === "long" ? "Price drop %" : "Price rise %"}</TableCell><TableCell align="right">Until flat</TableCell><TableCell align="right">Actual P/L</TableCell><TableCell />
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={`${row.roundTripId}-${row.executionSequence}`}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.eventKind}</TableCell><TableCell>{row.closeDate}</TableCell><TableCell align="right">{money(row.entryPriceDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "success.main", fontWeight: 750 }}>{money(row.favorableMoveDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "error.main", fontWeight: 750 }}>{money(row.adverseMoveDecimal, model.currency)}</TableCell><TableCell align="right">{percent(row.favorableMovePercent)}</TableCell><TableCell align="right">{percent(row.adverseMovePercent)}</TableCell><TableCell align="right">{row.minutesUntilFlat} min</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.actualPnlDecimal), fontWeight: 750 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell><TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">{offline ? "Open saved day" : "View full analysis"}</Button></TableCell>
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
          <Box sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.08)", borderRadius: 999, height: 8, mt: 0.5, overflow: "hidden" }}>
            <Box sx={{ bgcolor: "primary.main", borderRadius: 999, height: "100%", width: `${Math.max(4, row.occurrenceCount / maximum * 100)}%` }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function executionDateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date(value));
}

function ScalingOutTable({
  currency,
  meaningfulRows,
  moneyBasis,
  offline,
  rows,
}: {
  currency: string | null;
  meaningfulRows: readonly TradeAnalysisMeaningfulProfitRow[];
  moneyBasis: "gross" | "net";
  offline: boolean;
  rows: readonly TradeAnalysisScalingOutRow[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const basisLabel = moneyBasis === "gross" ? "Gross" : "Net";
  const currentPage = boundedPage(page, rows.length, pageSize);
  const visibleRows = paginatedRows(rows, currentPage, pageSize);
  const meaningfulByTrade = useMemo(() => new Map(
    meaningfulRows.map((row) => [row.roundTripId, row] as const),
  ), [meaningfulRows]);
  if (rows.length === 0) return <Typography color="text.secondary">No trades in this selection held one of the sustained profit levels.</Typography>;
  return <Stack spacing={1.25}>
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={rows.length} />
    <HorizontalScrollRegion label="Scaling out trades" minTableWidth={1780} stickyFirstColumn>
      <Table size="small"><TableHead><TableRow>
        <TableCell>Ticker</TableCell><TableCell>Profit level held</TableCell><TableCell align="right">Shares sold for profit after level</TableCell><TableCell align="right">Maximum position</TableCell><TableCell align="right">Exposure reduced after last scale-out</TableCell><TableCell align="right">Remaining shares</TableCell><TableCell align="right">Gross profit taken after level</TableCell><TableCell align="right">Calculated {basisLabel} profit opportunity</TableCell><TableCell align="right">Final {basisLabel} trade P/L</TableCell><TableCell align="right">Additional {basisLabel} profit opportunity</TableCell><TableCell>Recorded later-exit comparison</TableCell><TableCell />
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => {
        const meaningful = meaningfulByTrade.get(row.roundTripId);
        return <TableRow hover key={row.roundTripId}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.thresholdPercent}% · {row.requiredCloseCount} closes</TableCell>
        <TableCell align="right">{row.scaledQuantityDecimal}</TableCell><TableCell align="right">{row.maximumOpenQuantityDecimal}</TableCell>
        <TableCell align="right">{percent(row.positionReducedPercent)}</TableCell><TableCell align="right"><Typography component="div" variant="body2">{row.remainingQuantityDecimal ?? "—"}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.scaledOutWhileGreen ? "After last profitable scale-out" : "At qualifying close"}</Typography></TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(row.profitSecuredGrossDecimal), fontWeight: 750 }}>{money(row.profitSecuredGrossDecimal, currency)}</TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(meaningful?.calculatedPotentialPnlDecimal ?? null), fontWeight: 750 }}>{money(meaningful?.calculatedPotentialPnlDecimal ?? null, currency)}</TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(row.actualPnlDecimal), fontWeight: 750 }}>{money(row.actualPnlDecimal, currency)}</TableCell>
        <TableCell align="right" sx={{ color: potentialDifferenceColor(meaningful?.differenceDecimal ?? null), fontWeight: 750 }}>{money(meaningful?.differenceDecimal ?? null, currency)}</TableCell>
        <TableCell sx={{ maxWidth: 300, minWidth: 240, whiteSpace: "normal" }}>{row.profitProtection.status === "avoided_additional_loss"
          ? `${money(row.profitProtection.avoidedAdditionalLossDecimal, currency)} additional loss avoided versus the recorded later exits.`
          : row.profitProtection.status === "gave_up_additional_profit"
            ? `The recorded later exits would have added ${money(row.profitProtection.additionalProfitGivenUpDecimal, currency)} gross.`
            : row.profitProtection.status === "no_difference"
              ? "No gross difference at the recorded later exit prices."
              : row.profitProtection.status === "comparison_unavailable"
                ? "Exact later-exit comparison unavailable."
                : "No single-reduction comparison."}</TableCell>
        <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell>
      </TableRow>;
      })}</TableBody></Table>
    </HorizontalScrollRegion>
  </Stack>;
}

type GroupedEventPath = Readonly<{
  event: TradeAnalysisEventPathRow;
  paths: ReadonlyMap<number, TradeAnalysisEventPathRow>;
}>;

function EventPathTable({
  currency,
  direction,
  kinds,
  model,
  offline,
}: {
  currency: string | null;
  direction: "long" | "short";
  kinds: readonly TradeAnalysisEventPathRow["eventKind"][];
  model: DailyTradeLongTermAnalyticsV2Model;
  offline: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [ticker, setTicker] = useState("");
  const grouped = useMemo(() => {
    const values = new Map<string, { event: TradeAnalysisEventPathRow; paths: Map<number, TradeAnalysisEventPathRow> }>();
    for (const row of model.eventPaths) {
      if (row.direction !== direction || !kinds.includes(row.eventKind)) continue;
      const key = `${row.roundTripId}:${row.eventSequence}`;
      const current = values.get(key) ?? { event: row, paths: new Map() };
      current.paths.set(row.minutesAfterEvent, row);
      values.set(key, current);
    }
    return [...values.values()]
      .filter(({ event }) => event.symbol.toUpperCase().includes(ticker.trim().toUpperCase()))
      .map((value): GroupedEventPath => Object.freeze({ event: value.event, paths: value.paths }));
  }, [direction, kinds, model.eventPaths, ticker]);
  if (grouped.length === 0) return <Typography color="text.secondary">No saved 5-, 15-, 30- or 60-minute paths are available for this selection.</Typography>;
  const currentPage = boundedPage(page, grouped.length, pageSize);
  const visibleRows = paginatedRows(grouped, currentPage, pageSize);
  const pathPrices = (row: TradeAnalysisEventPathRow | undefined): Readonly<{
    high: string;
    highPercent: number;
    low: string;
    lowPercent: number;
  }> | null => {
    if (!row || row.favorableMoveDecimal === null || row.adverseMoveDecimal === null) return null;
    const eventPrice = new Decimal(row.eventPriceDecimal);
    if (!eventPrice.isPositive()) return null;
    const favorableMove = new Decimal(row.favorableMoveDecimal);
    const adverseMove = new Decimal(row.adverseMoveDecimal);
    const high = direction === "long" ? eventPrice.plus(favorableMove) : eventPrice.plus(adverseMove);
    const low = direction === "long" ? eventPrice.minus(adverseMove) : eventPrice.minus(favorableMove);
    return Object.freeze({
      high: high.toString(),
      highPercent: high.minus(eventPrice).div(eventPrice).mul(100).toNumber(),
      low: low.toString(),
      lowPercent: low.minus(eventPrice).div(eventPrice).mul(100).toNumber(),
    });
  };
  return <Stack spacing={1.25}>
    <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(1); }} size="small" sx={{ maxWidth: { sm: 220 } }} value={ticker} />
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={grouped.length} />
    <HorizontalScrollRegion label="Saved event price paths" minTableWidth={1540} stickyFirstColumn>
      <Table size="small"><TableHead><TableRow><TableCell>Ticker</TableCell><TableCell>Execution</TableCell><TableCell>Executed</TableCell><TableCell>Session</TableCell><TableCell align="right">Execution price</TableCell>{[5, 15, 30, 60].map((minutes) => <TableCell align="right" key={minutes}>High / low within {minutes} min</TableCell>)}<TableCell /></TableRow></TableHead>
        <TableBody>{visibleRows.map(({ event, paths }) => <TableRow hover key={`${event.roundTripId}-${event.eventSequence}`}><TableCell sx={{ fontWeight: 850 }}>{event.symbol}</TableCell><TableCell>{event.eventKind}</TableCell><TableCell>{executionDateTime(event.executedAtUtc, model.timezone)}</TableCell><TableCell>{event.session}</TableCell><TableCell align="right">{money(event.eventPriceDecimal, currency)}</TableCell>{[5, 15, 30, 60].map((minutes) => {
          const prices = pathPrices(paths.get(minutes));
          return <TableCell align="right" key={minutes}>{prices ? <Box>
            <Typography component="div" sx={{ color: direction === "long" ? "success.main" : "error.main", fontWeight: 750 }} variant="body2">High {money(prices.high, currency)} · {percent(prices.highPercent)}</Typography>
            <Typography color={direction === "long" ? "error.main" : "success.main"} component="div" variant="caption">Low {money(prices.low, currency)} · {percent(prices.lowPercent)}</Typography>
          </Box> : "Unavailable"}</TableCell>;
        })}<TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${event.trackerDate}` : `/trade-tracker/${event.trackerDate}?${new URLSearchParams({ interval: "1m", trade: event.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell></TableRow>)}</TableBody>
      </Table>
    </HorizontalScrollRegion>
  </Stack>;
}

function ExecutionContextTable({
  direction,
  kinds,
  model,
  offline,
}: {
  direction: "long" | "short";
  kinds: readonly TradeAnalysisExecutionContextRow["eventKind"][];
  model: DailyTradeLongTermAnalyticsV2Model;
  offline: boolean;
}) {
  const [executionKind, setExecutionKind] = useState<"all" | TradeAnalysisExecutionContextRow["eventKind"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [ticker, setTicker] = useState("");
  const rows = useMemo(() => model.executionContextRows.filter((row) =>
    row.direction === direction && kinds.includes(row.eventKind) &&
    (executionKind === "all" || row.eventKind === executionKind) &&
    row.symbol.toUpperCase().includes(ticker.trim().toUpperCase())),
  [direction, executionKind, kinds, model.executionContextRows, ticker]);
  const currentPage = boundedPage(page, rows.length, pageSize);
  const visibleRows = paginatedRows(rows, currentPage, pageSize);
  if (rows.length === 0 && ticker.length === 0 && executionKind === "all") {
    return <Typography color="text.secondary">No saved execution context is available for this selection.</Typography>;
  }
  return <Stack spacing={1.25}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField label="Ticker" onChange={(event) => { setTicker(event.target.value); setPage(1); }} size="small" value={ticker} />
      <TextField label="Execution" onChange={(event) => { setExecutionKind(event.target.value as typeof executionKind); setPage(1); }} select size="small" sx={{ minWidth: { sm: 170 } }} value={executionKind}>
        <MenuItem value="all">All shown executions</MenuItem>
        {kinds.map((kind) => <MenuItem key={kind} value={kind}>{kind}</MenuItem>)}
      </TextField>
    </Stack>
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={rows.length} />
    {rows.length === 0 ? <Typography color="text.secondary">No executions match these filters.</Typography> : <HorizontalScrollRegion label="Exact execution context records" minTableWidth={1740} stickyFirstColumn>
      <Table size="small"><TableHead><TableRow>
        <TableCell>Ticker</TableCell><TableCell>Execution</TableCell><TableCell>Executed</TableCell><TableCell>Session</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">From Session VWAP (execution candle)</TableCell><TableCell align="right">From EMA 9 (execution 1m candle)</TableCell><TableCell align="right">From EMA 9 (last completed 5m candle)</TableCell><TableCell align="right">Execution 1m volume multiple</TableCell><TableCell align="right">Execution 1m ATR 14</TableCell><TableCell align="right">Position in completed 1m candle</TableCell><TableCell align="right">{model.moneyBasis === "gross" ? "Gross" : "Net"} trade result</TableCell><TableCell align="right">Trade return</TableCell><TableCell />
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={`${row.roundTripId}-${row.eventSequence}`}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.eventKind}</TableCell><TableCell>{executionDateTime(row.executedAtUtc, model.timezone)}</TableCell><TableCell>{row.session}</TableCell><TableCell align="right">{money(row.eventPriceDecimal, model.currency)}</TableCell><TableCell align="right">{signedPercent(row.vwapDistancePercent)}</TableCell><TableCell align="right">{signedPercent(row.ema9DistancePercent)}</TableCell><TableCell align="right">{signedPercent(row.ema9FiveMinuteDistancePercent)}</TableCell><TableCell align="right">{row.relativeVolume === null ? "Unavailable" : `${row.relativeVolume.toFixed(1)}x`}</TableCell><TableCell align="right">{percent(row.atr14Percent)}</TableCell><TableCell align="right">{percent(row.candleLocationPercent)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.actualPnlDecimal), fontWeight: 750 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.returnPercent) }}>{percent(row.returnPercent)}</TableCell><TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell>
      </TableRow>)}</TableBody></Table>
    </HorizontalScrollRegion>}
  </Stack>;
}

const CAPABILITIES = Object.freeze([
  Object.freeze({ href: "/analytics/trade-analyzer/day/green-to-red", title: "Green to Red", description: "See trades that reached +20% or more and what happened before they finished." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/scaling-out", title: "Scaling Out", description: "See profit-taking after a sustained profit level—and qualifying trades with no profitable scale-out before a red finish." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/entry-exit", title: "Entries & Exits", description: "Review entries, adds and exits against Session VWAP, EMA 9 and later saved prices." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/mfe-mae", title: "Room After Entry", description: "See explicit price rises and drops after each entry or add, per share and by percentage." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/candle-patterns", title: "Candle Patterns", description: "Review the candle shapes observed around exact entries and exits." }),
  Object.freeze({ href: "/analytics/trade-analyzer/day/trades", title: "Analyzed Trades", description: "Open the exact trades and executions behind these results." }),
]);

function DirectionControl({
  activeDirection,
  counts,
  onChange,
}: {
  activeDirection: "long" | "short";
  counts: Readonly<{ long: number; short: number }>;
  onChange: (direction: "long" | "short") => void;
}) {
  const hasBothDirections = counts.long > 0 && counts.short > 0;
  if (!hasBothDirections) {
    const count = counts[activeDirection];
    return <Typography color="text.secondary" variant="body2">
      {activeDirection === "long" ? "Long" : "Short"} trades · {count} completed {count === 1 ? "trade" : "trades"}
    </Typography>;
  }
  return <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
    {(["long", "short"] as const).map((direction) => <Button
      key={direction}
      onClick={() => onChange(direction)}
      size="small"
      variant={activeDirection === direction ? "contained" : "outlined"}
    >
      {direction === "long" ? "Long" : "Short"} · {counts[direction]}
    </Button>)}
  </Stack>;
}

export function TradeAnalysisClient({
  evidenceQuery,
  model,
  offline = false,
  view,
}: {
  evidenceQuery: Readonly<{
    currency: string | null;
    endDate: string | null;
    direction: "long" | "short" | null;
    moneyBasis: "gross" | "net";
    rangeKind: string;
    startDate: string | null;
  }>;
  model: DailyTradeLongTermAnalyticsV2Model;
  offline?: boolean;
  view: TradeAnalysisView;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patternPage, setPatternPage] = useState(1);
  const [patternPageSize, setPatternPageSize] = useState(10);
  const greenToRedDirectionCounts = model.greenToRedOpportunity.tradeCountsByDirection ?? model.directionTradeCounts;
  const profitZoneDirectionCounts = model.profitZones.tradeCountsByDirection ?? model.directionTradeCounts;
  const visibleDirectionCounts = view === "green-to-red"
    ? greenToRedDirectionCounts
    : view === "scaling-out"
      ? profitZoneDirectionCounts
      : model.directionTradeCounts;
  const defaultDirection = evidenceQuery.direction && visibleDirectionCounts[evidenceQuery.direction] > 0
    ? evidenceQuery.direction
    : visibleDirectionCounts.long > 0 ? "long" as const : "short" as const;
  const [selectedDirection, setSelectedDirection] = useState<"long" | "short">(defaultDirection);
  const activeDirection = visibleDirectionCounts[selectedDirection] > 0 ? selectedDirection : defaultDirection;
  const meaningfulProfitRows = useMemo(() => model.meaningfulProfit.rows.filter((row) =>
    row.direction === activeDirection), [activeDirection, model.meaningfulProfit.rows]);
  const scalingRows = useMemo(() => model.scalingOut.rows.filter((row) =>
    row.direction === activeDirection), [activeDirection, model.scalingOut.rows]);
  const profitZoneRows = model.profitZones?.rowsByDirection[activeDirection] ?? [];
  const profitZoneRecords = model.profitZones?.recordsByDirection[activeDirection] ?? [];
  const greenToRedOpportunityRows = useMemo(() => model.greenToRedOpportunity.rows.filter((row) =>
    row.direction === activeDirection), [activeDirection, model.greenToRedOpportunity.rows]);
  const directionExcursions = useMemo(() => model.excursions.filter((row) =>
    row.direction === activeDirection), [activeDirection, model.excursions]);
  const directionMovement = useMemo(() => {
    const favorableMoney = directionExcursions.map((row) => Number(row.favorableMoveDecimal)).filter(Number.isFinite);
    const adverseMoney = directionExcursions.map((row) => Number(row.adverseMoveDecimal)).filter(Number.isFinite);
    const favorablePercent = directionExcursions.map((row) => row.favorableMovePercent).filter(Number.isFinite);
    const adversePercent = directionExcursions.map((row) => row.adverseMovePercent).filter(Number.isFinite);
    return Object.freeze({
      averageAdverseMoney: average(adverseMoney),
      averageAdversePercent: average(adversePercent),
      averageFavorableMoney: average(favorableMoney),
      averageFavorablePercent: average(favorablePercent),
      medianAdverseMoney: median(adverseMoney),
      medianAdversePercent: median(adversePercent),
      medianFavorableMoney: median(favorableMoney),
      medianFavorablePercent: median(favorablePercent),
    });
  }, [directionExcursions]);
  const directionPatterns = useMemo(() => model.patterns.filter((row) =>
    row.direction === activeDirection), [activeDirection, model.patterns]);
  const patternGroups = useMemo(() => groupPatternRows(directionPatterns), [directionPatterns]);
  const meaningfulSummary = useMemo(() => {
    const sum = (read: (row: TradeAnalysisMeaningfulProfitRow) => string) => meaningfulProfitRows.length === 0
      ? null
      : meaningfulProfitRows.reduce((total, row) => total.plus(read(row)), new Decimal(0)).toString();
    return Object.freeze({
      actual: sum((row) => row.actualPnlDecimal),
      difference: sum((row) => row.differenceDecimal),
      endedGreen: meaningfulProfitRows.filter((row) => row.outcome === "ended_green").length,
      endedRed: meaningfulProfitRows.filter((row) => row.outcome === "ended_red").length,
      noScaleEndedRedActual: sum((row) => !row.scaledOutWhileGreen && row.outcome === "ended_red" ? row.actualPnlDecimal : "0"),
      noScaleEndedRedDifference: sum((row) => !row.scaledOutWhileGreen && row.outcome === "ended_red" ? row.differenceDecimal : "0"),
      noScaleEndedRedPotential: sum((row) => !row.scaledOutWhileGreen && row.outcome === "ended_red" ? row.calculatedPotentialPnlDecimal : "0"),
      potential: sum((row) => row.calculatedPotentialPnlDecimal),
    });
  }, [meaningfulProfitRows]);
  const directionScalingSummary = useMemo(() => Object.freeze({
    noScale: scalingRows.filter((row) => !row.scaledOutWhileGreen).length,
    noScaleEndedRed: scalingRows.filter((row) =>
      !row.scaledOutWhileGreen && new Decimal(row.actualPnlDecimal).isNegative()).length,
    scaledOut: scalingRows.filter((row) => row.scaledOutWhileGreen).length,
  }), [scalingRows]);
  const noScaleEndedRedRows = useMemo(() => scalingRows.filter((row) =>
    !row.scaledOutWhileGreen && new Decimal(row.actualPnlDecimal).isNegative()), [scalingRows]);
  const directionEventCounts = useMemo(() => {
    const events = new Map<string, TradeAnalysisEventPathRow>();
    for (const row of model.eventPaths) {
      if (row.direction !== activeDirection) continue;
      events.set(`${row.roundTripId}:${row.eventSequence}`, row);
    }
    const rows = [...events.values()];
    return Object.freeze({
      adds: rows.filter((row) => row.eventKind === "Add").length,
      finalExits: rows.filter((row) => row.eventKind === "Final exit").length,
      initialEntries: rows.filter((row) => row.eventKind === "Initial entry").length,
      partialExits: rows.filter((row) => row.eventKind === "Partial exit").length,
    });
  }, [activeDirection, model.eventPaths]);
  const capabilityQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("basis", evidenceQuery.moneyBasis);
    params.set("direction", activeDirection);
    params.set("range", evidenceQuery.rangeKind);
    if (evidenceQuery.rangeKind === "custom" && evidenceQuery.startDate && evidenceQuery.endDate) {
      params.set("start", evidenceQuery.startDate);
      params.set("end", evidenceQuery.endDate);
    }
    return params.toString();
  }, [activeDirection, evidenceQuery.endDate, evidenceQuery.moneyBasis, evidenceQuery.rangeKind, evidenceQuery.startDate]);
  const currentPatternPage = boundedPage(patternPage, patternGroups.length, patternPageSize);
  const visiblePatternGroups = paginatedRows(patternGroups, currentPatternPage, patternPageSize);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  if (model.eligibleDayTradeCount === 0) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No completed day trades</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Trade Analysis will begin after completed day trades are available in this account.
        </Typography>
      </Paper>
    );
  }
  if (model.analyzedTradeCount === 0) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">No trades have been analyzed.</Typography>
      </Paper>
    );
  }
  const directionLabel = activeDirection === "long" ? "long" : "short";
  const moneyBasisLabel = model.moneyBasis === "gross" ? "Gross" : "Net";
  const favorableMoneyLabel = activeDirection === "long" ? "price rise after long entry" : "price drop after short entry";
  const adverseMoneyLabel = activeDirection === "long" ? "price drop after long entry" : "price rise after short entry";
  const entryContext = model.entryContextByDirection[activeDirection];
  const exitContext = model.exitExecutionContextByDirection[activeDirection];
  return (
    <Stack spacing={2.5}>
      {view !== "day" ? <DirectionControl activeDirection={activeDirection} counts={visibleDirectionCounts} onChange={(direction) => {
        setSelectedDirection(direction);
        if (offline) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("direction", direction);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`);
      }} /> : null}
      {view === "day" ? <Stack spacing={1.25}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Selected-period records</Typography>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption={`${model.analyzedExecutionCount} saved execution snapshots`} label="Analyzed day trades" value={String(model.analyzedTradeCount)} />
          <DashboardMetricCard caption={`${model.eligibleDayTradeCount} completed day trades checked`} label="Analyzer coverage" value={percent(model.coveragePercent)} />
          <DashboardMetricCard caption={`Combined completed ${moneyBasisLabel} P/L`} label={`${moneyBasisLabel} trade P/L`} value={money(model.profitCapture.totalActualPnlDecimal, model.currency)} valueColor={financialOutcomeColor(model.profitCapture.totalActualPnlDecimal)} />
          <DashboardMetricCard caption="Trades that held a meaningful profit level for its required number of completed 1-minute closes" label="Meaningful-profit scenarios" value={String(model.meaningfulProfit.tradeCount)} />
          <DashboardMetricCard caption={model.directionTradeCounts.long > 0 && model.directionTradeCounts.short > 0
            ? `${model.directionTradeCounts.long} long · ${model.directionTradeCounts.short} short`
            : model.directionTradeCounts.long > 0
              ? `${model.directionTradeCounts.long} long ${model.directionTradeCounts.long === 1 ? "trade" : "trades"}`
              : `${model.directionTradeCounts.short} short ${model.directionTradeCounts.short === 1 ? "trade" : "trades"}`} label="Trade direction" value={model.directionTradeCounts.long > 0 && model.directionTradeCounts.short > 0 ? "Long / Short" : model.directionTradeCounts.long > 0 ? "Long only" : "Short only"} />
          <DashboardMetricCard caption="Average percentage result for these trades" label="Average return" value={percent(model.averageReturnPercent)} valueColor={financialOutcomeColor(model.averageReturnPercent)} />
        </Box>
      </Stack> : null}

      <Card sx={{ maxWidth: { xs: "100%", sm: 240 } }} variant="outlined">
        <CardActionArea component={Link} href={`/analytics/trade-analyzer/day/trades?${capabilityQuery}`}>
          <CardContent>
            <Typography color="text.secondary" variant="caption">Analyzed trades</Typography>
            <Typography component="div" sx={{ fontSize: "1.75rem", fontWeight: 800, mt: 0.5 }}>
              {view === "day" ? model.analyzedTradeCount : visibleDirectionCounts[activeDirection]}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      {view === "day" ? (
        <Stack spacing={1.25}>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Choose a question</Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
          {CAPABILITIES.map((capability) => (
            <Card key={capability.href} variant="outlined">
              <CardActionArea component={Link} href={`${capability.href}?${capabilityQuery}`} sx={{ height: "100%" }}>
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

      {view === "green-to-red" ? <Section defaultExpanded description="What happened after user-defined trades reached a gain of 20% or more while shares were open." helpHref="/help/trade-analyzer/green-to-red-analysis#profit-capture" title="Green-to-red trades">
        <GreenToRedAnalysis
          currency={model.currency}
          direction={activeDirection}
          offline={offline}
          rows={greenToRedOpportunityRows}
          timezone={model.timezone}
          totalTradeCount={greenToRedDirectionCounts[activeDirection]}
        />
      </Section> : null}

      {view === "scaling-out" ? <Section defaultExpanded description="Profit taking and opportunity across 10% gain zones." helpHref="/help/trade-analyzer/scaling-out#behavior" title="Profit taking by price level">
        <ProfitZoneAnalysis
          currency={model.currency}
          direction={activeDirection}
          offline={offline}
          records={profitZoneRecords}
          rows={profitZoneRows}
          timezone={model.timezone}
          totalTradeCount={profitZoneDirectionCounts[activeDirection]}
        />
      </Section> : null}

      {view === "scaling-out" ? <Section defaultExpanded description="Profit-taking behavior on trades that held a meaningful-profit level, including profitable partial exits before reversal and qualifying trades where no shares were sold before a red finish." helpHref="/help/trade-analyzer/scaling-out#behavior" title="Scaling behavior">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption={`Completed ${directionLabel} trades with a qualifying sustained profit level${model.moneyBasis === "net" ? " and complete saved fee facts" : ""}`} label="Qualifying trades" value={String(scalingRows.length)} />
            <DashboardMetricCard caption="Share of qualifying trades with at least one profitable partial exit after the sustained-profit level and before the first red point or final exit" label="Scaled out while green" value={`${directionScalingSummary.scaledOut} · ${percent(scalingRows.length === 0 ? null : directionScalingSummary.scaledOut / scalingRows.length * 100)}`} />
            <DashboardMetricCard caption="Share of qualifying trades with no profitable partial exit after the sustained-profit level and before the first red point or final exit" label="No scale-out while green" value={`${directionScalingSummary.noScale} · ${percent(scalingRows.length === 0 ? null : directionScalingSummary.noScale / scalingRows.length * 100)}`} />
            <DashboardMetricCard caption="Share of no-scale trades whose completed result finished below zero" label="No scale-out, ended red" value={`${directionScalingSummary.noScaleEndedRed} · ${percent(directionScalingSummary.noScale === 0 ? null : directionScalingSummary.noScaleEndedRed / directionScalingSummary.noScale * 100)}`} />
          </Box>
          <ScalingOutTable currency={model.currency} meaningfulRows={meaningfulProfitRows} moneyBasis={model.moneyBasis} offline={offline} rows={scalingRows} />
          <Typography color="text.secondary" variant="body2">Profit taken on partial exits is shown as exact Gross realized P/L for the shares sold at those executions. Final trade P/L follows the selected {moneyBasisLabel} basis.</Typography>
        </Stack>
      </Section> : null}

      {view === "scaling-out" && directionScalingSummary.noScaleEndedRed > 0 ? <Section defaultExpanded description="The qualifying trades where no shares were sold for a profit and the completed result finished below zero." helpHref="/help/trade-analyzer/scaling-out#ended-red" title="No scale-out before a red finish">
        <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption={`${directionScalingSummary.noScaleEndedRed} qualifying ${directionLabel} trades`} label={`Calculated ${moneyBasisLabel} profit opportunity`} value={money(meaningfulSummary.noScaleEndedRedPotential, model.currency)} valueColor={financialOutcomeColor(meaningfulSummary.noScaleEndedRedPotential)} />
            <DashboardMetricCard caption={`Final ${moneyBasisLabel} P/L from the completed trades`} label={`Final ${moneyBasisLabel} trade P/L`} value={money(meaningfulSummary.noScaleEndedRedActual, model.currency)} valueColor={financialOutcomeColor(meaningfulSummary.noScaleEndedRedActual)} />
            <DashboardMetricCard caption={`Calculated ${moneyBasisLabel} profit opportunity minus final ${moneyBasisLabel} trade P/L`} label={`Additional ${moneyBasisLabel} profit opportunity`} value={money(meaningfulSummary.noScaleEndedRedDifference, model.currency)} valueColor={potentialDifferenceColor(meaningfulSummary.noScaleEndedRedDifference)} />
          </Box>
          <ScalingOutTable currency={model.currency} meaningfulRows={meaningfulProfitRows} moneyBasis={model.moneyBasis} offline={offline} rows={noScaleEndedRedRows} />
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description={`Saved ${directionLabel} executions and the market session in which each occurred.`} helpHref="/help/trade-analyzer/entry-exit-analysis#execution-mix" title="Execution mix">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption="Executions that opened a flat position" label="Initial entries" value={String(directionEventCounts.initialEntries)} />
          <DashboardMetricCard caption="Executions that increased an open position" label="Adds" value={String(directionEventCounts.adds)} />
          <DashboardMetricCard caption="Executions that reduced but did not close the position" label="Partial exits" value={String(directionEventCounts.partialExits)} />
          <DashboardMetricCard caption="Executions that returned the position to flat" label="Final exits" value={String(directionEventCounts.finalExits)} />
        </Box>
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description={`Initial entries and adds are separated in every row. Volume compares the execution's 1-minute candle with up to 20 preceding 1-minute candles and requires at least 5. A trade can appear in more than one row when its executions occurred in different bands.`} helpHref="/help/trade-analyzer/entry-exit-analysis#entry-execution-context" title="Entry execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from Session VWAP on the completed execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9 on the completed 1-minute execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9 on the last completed 5-minute candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.ema9FiveMinute} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Completed 1-minute execution-candle volume compared with prior candles</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.relativeVolume} valueLabel="Avg volume multiple" valueSuffix="x" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>ATR 14 on the completed 1-minute execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.atr14Percent} valueLabel="Avg ATR" valueSuffix="%" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Execution price inside the completed 1-minute candle range</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.candleLocation} valueLabel="Avg candle position" valueMultiplier={100} valueSuffix="%" /></Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 0.25 }}>Exact entry and add records</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">Signed distances show above (+) or below (−) the saved indicator. Candle position runs from 0% at the candle low to 100% at the candle high.</Typography>
            <ExecutionContextTable direction={activeDirection} kinds={["Initial entry", "Add"]} model={model} offline={offline} />
          </Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description={`Partial exits and final exits are separated in every row. Each row reports the completed results of the trades containing those exits; a trade can appear in more than one row when its exits occurred in different bands.`} helpHref="/help/trade-analyzer/entry-exit-analysis#exit-execution-context" title="Exit execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from Session VWAP on the completed execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9 on the completed 1-minute execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Distance from EMA 9 on the last completed 5-minute candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.ema9FiveMinute} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Completed 1-minute execution-candle volume compared with prior candles</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.relativeVolume} valueLabel="Avg volume multiple" valueSuffix="x" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>ATR 14 on the completed 1-minute execution candle</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.atr14Percent} valueLabel="Avg ATR" valueSuffix="%" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}>Execution price inside the completed 1-minute candle range</Typography><BreakdownTable currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.candleLocation} valueLabel="Avg candle position" valueMultiplier={100} valueSuffix="%" /></Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 0.25 }}>Exact partial and final exit records</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">Signed distances show above (+) or below (−) the saved indicator. Candle position runs from 0% at the candle low to 100% at the candle high.</Typography>
            <ExecutionContextTable direction={activeDirection} kinds={["Partial exit", "Final exit"]} model={model} offline={offline} />
          </Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description="The highest and lowest saved prices from each partial or final exit through 5, 15, 30 and 60 minutes. The execution price is the starting point. This is later price history, not a claim that those prices could have been captured." helpHref="/help/trade-analyzer/entry-exit-analysis#after-exit" title="Price reached after exits">
        <EventPathTable currency={model.currency} direction={activeDirection} kinds={["Partial exit", "Final exit"]} model={model} offline={offline} />
      </Section> : null}

      {view === "mfe-mae" ? <Section defaultExpanded description={`Explicit price movement after each ${directionLabel} entry or add while the position remained open. Dollar amounts are per share.`} helpHref="/help/trade-analyzer/mfe-mae#overview" title="Room after entry">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption="Entries and adds with saved one-minute candle coverage" label="Measured executions" value={String(directionExcursions.length)} />
          <DashboardMetricCard caption="Average dollar movement" label={`Average ${favorableMoneyLabel} per share`} value={money(directionMovement.averageFavorableMoney?.toString() ?? null, model.currency)} valueColor="success.main" />
          <DashboardMetricCard caption="Middle dollar movement" label={`Median ${favorableMoneyLabel} per share`} value={money(directionMovement.medianFavorableMoney?.toString() ?? null, model.currency)} valueColor="success.main" />
          <DashboardMetricCard caption="Average dollar movement" label={`Average ${adverseMoneyLabel} per share`} value={money(directionMovement.averageAdverseMoney?.toString() ?? null, model.currency)} valueColor="error.main" />
          <DashboardMetricCard caption="Middle dollar movement" label={`Median ${adverseMoneyLabel} per share`} value={money(directionMovement.medianAdverseMoney?.toString() ?? null, model.currency)} valueColor="error.main" />
          <DashboardMetricCard caption="Average movement relative to execution price" label={`${favorableMoneyLabel} %`} value={percent(directionMovement.averageFavorablePercent)} valueColor="success.main" />
          <DashboardMetricCard caption="Average movement relative to execution price" label={`${adverseMoneyLabel} %`} value={percent(directionMovement.averageAdversePercent)} valueColor="error.main" />
        </Box>
      </Section> : null}

      {view === "mfe-mae" ? <Section defaultExpanded description={`The highest and lowest saved prices from each ${directionLabel} entry or add through 5, 15, 30 and 60 minutes. The execution price is the starting point.`} helpHref="/help/trade-analyzer/mfe-mae#timed-paths" title="Price path after entry">
        <EventPathTable currency={model.currency} direction={activeDirection} kinds={["Initial entry", "Add"]} model={model} offline={offline} />
      </Section> : null}

      {view === "mfe-mae" ? <Section description="The individual saved candle observations behind these results. Ticker and execution filters apply before pagination." helpHref="/help/trade-analyzer/mfe-mae#measured-executions" title="Measured executions">
        <MfeMaeTable direction={activeDirection} model={model} offline={offline} />
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
                <Box sx={{ alignItems: { sm: "center" }, bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.04)", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
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
                    <TableHead><TableRow><TableCell>Timeframe</TableCell><TableCell>Execution</TableCell><TableCell>Location</TableCell><TableCell align="right">Occurrences</TableCell><TableCell align="right">Trades</TableCell><TableCell align="right">Total result</TableCell><TableCell align="right">Avg result</TableCell><TableCell align="right">Median result</TableCell><TableCell align="right">Win rate</TableCell><TableCell align="right">Avg return</TableCell></TableRow></TableHead>
                    <TableBody>{group.rows.map((row) => <TableRow hover key={`${row.timeframe}-${row.executionSide}-${row.location}`}><TableCell sx={{ fontWeight: 750 }}>{row.timeframe}</TableCell><TableCell>{row.executionSide}</TableCell><TableCell>{row.location}</TableCell><TableCell align="right">{row.occurrenceCount}</TableCell><TableCell align="right">{row.tradeCount}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.totalPnlDecimal ?? null), fontWeight: 750 }}>{money(row.totalPnlDecimal ?? null, model.currency)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.averagePnlDecimal) }}>{money(row.averagePnlDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.medianPnlDecimal ?? null) }}>{money(row.medianPnlDecimal ?? null, model.currency)}</TableCell><TableCell align="right">{percent(row.winRatePercent)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.averageReturnPercent) }}>{percent(row.averageReturnPercent)}</TableCell></TableRow>)}</TableBody>
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
              direction={activeDirection}
              endDate={evidenceQuery.endDate}
              moneyBasis={evidenceQuery.moneyBasis}
              onClose={() => setSelectedPattern(null)}
              pattern={selectedPattern}
              startDate={evidenceQuery.startDate}
            />
          ) : null}
        </Drawer>
      ) : null}

      {model.malformedSnapshotCount > 0 ? <Typography color="warning.main" variant="body2">{model.malformedSnapshotCount} saved execution snapshots could not be read and were excluded from execution-level breakdowns.</Typography> : null}
    </Stack>
  );
}
