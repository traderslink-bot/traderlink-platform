"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
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
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { ProfitZoneAnalysis, ProfitZoneComparison } from "./profit-zone-analysis";
import { TradeAnalysisRangeAndBasisControls } from "./trade-analysis-range-and-basis-controls";
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

function ColumnHeading({
  align = "left",
  help,
  label,
}: {
  align?: "left" | "right";
  help: string;
  label: string;
}) {
  return <Stack
    component="span"
    direction="row"
    spacing={0.25}
    sx={{ alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start" }}
  >
    <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit" }}>{label}</Typography>
    <Tooltip arrow title={help}>
      <IconButton aria-label={`Explain ${label}`} size="small" sx={{ color: "text.secondary", p: 0.25 }}>
        <InfoOutlinedIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Tooltip>
  </Stack>;
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
  explainColumns = false,
}: {
  rows: readonly TradeAnalysisBreakdownRow[];
  valueLabel?: string;
  valueMultiplier?: number;
  valueSuffix?: string;
  currency: string | null;
  moneyBasis: "gross" | "net";
  showOccurrences?: boolean;
  explainColumns?: boolean;
}) {
  const heading = (label: string, help: string) => explainColumns ? <ColumnHeading label={label} help={help} /> : label;
  if (rows.length === 0) return <Typography color="text.secondary">Not enough analyzed evidence is available for this breakdown.</Typography>;
  return (
      <HorizontalScrollRegion label="Trade analysis comparison table" minTableWidth={valueLabel ? 1160 : 1040} stickyFirstColumn>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>{heading("Group", "Executions grouped by their type and the price, volume or indicator band shown. A trade can appear in more than one band.")}</TableCell>{showOccurrences ? <TableCell align="right">{heading("Executions", "The number of recorded fills in this group. Multiple fills can belong to the same trade.")}</TableCell> : null}<TableCell align="right">{heading("Trades", "Distinct analyzed saved trades represented in this row, counted once within the group. Do not add counts across groups; a trade can appear in several.")}</TableCell>
            <TableCell align="right">{heading(`${moneyBasis === "gross" ? "Gross" : "Net"} total`, "Combined final P/L of the trades in this group, not just profit from these particular executions. Gross is before fees; Net deducts recorded fees. Trades can repeat across groups.")}</TableCell><TableCell align="right">{heading(`Avg ${moneyBasis} result`, "The group's combined final P/L divided by its trade count. Large wins or losses can pull this average up or down.")}</TableCell><TableCell align="right">{heading(`Median ${moneyBasis} result`, "The middle final P/L after sorting the group's trades. With an even count, it is the average of the two middle amounts.")}</TableCell>
            <TableCell align="right">{heading("Win rate", "The percentage of trades in this group that finished with positive P/L under your Gross/Net selection. Breakeven trades are not wins.")}</TableCell><TableCell align="right">{heading("Avg return", "The average recorded percentage return across trades with a return value. Each trade has equal weight, regardless of size.")}</TableCell>
            {valueLabel ? <TableCell align="right">{heading(valueLabel, valueLabel === "Avg volume multiple" ? "Average execution-candle volume divided by the average volume of up to 20 prior one-minute candles. At least five prior candles are required. 2x means twice that recent average, not twice daily volume." : valueLabel === "Avg ATR" ? "Average saved 14-period one-minute Average True Range, expressed as a percentage of the execution price. It describes recent price movement, not your profit or loss." : valueLabel === "Avg candle position" ? "Average execution-price location inside its completed one-minute candle: 0% is the low and 100% is the high. The candle may continue after the fill." : "The average saved measurement across qualifying executions in this group.")}</TableCell> : null}
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

type ContextResult = Readonly<{
  amountDecimal: string;
  label: string;
  tradeCount: number;
}>;

type ContextSummaryFactor = Readonly<{
  factor: string;
  help?: string;
  rows: readonly TradeAnalysisBreakdownRow[];
}>;

function selectContextResult(
  rows: readonly TradeAnalysisBreakdownRow[],
  value: "average" | "largest-gain" | "largest-loss",
): ContextResult | null {
  const candidates = rows.flatMap((row): ContextResult[] => {
    const amountDecimal = value === "average" ? row.averagePnlDecimal : row.totalPnlDecimal ?? null;
    if (amountDecimal === null) return [];
    const amount = new Decimal(amountDecimal);
    if (value === "largest-gain" && !amount.isPositive()) return [];
    if (value === "largest-loss" && !amount.isNegative()) return [];
    return [{ amountDecimal, label: row.label, tradeCount: row.tradeCount }];
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((selected, candidate) => {
    const selectedAmount = new Decimal(selected.amountDecimal);
    const candidateAmount = new Decimal(candidate.amountDecimal);
    if (value === "largest-loss") return candidateAmount.lt(selectedAmount) ? candidate : selected;
    return candidateAmount.gt(selectedAmount) ? candidate : selected;
  });
}

function ContextResultCell({
  currency,
  result,
}: {
  currency: string | null;
  result: ContextResult | null;
}) {
  if (result === null) return <Typography color="text.secondary" variant="body2">None in this selection</Typography>;
  return <Box>
    <Typography sx={{ fontWeight: 750 }} variant="body2">{result.label}</Typography>
    <Typography color={financialOutcomeColor(result.amountDecimal)} sx={{ fontWeight: 800 }} variant="body2">
      {money(result.amountDecimal, currency)}
    </Typography>
    <Typography color="text.secondary" variant="caption">
      {result.tradeCount} {result.tradeCount === 1 ? "trade" : "trades"}
    </Typography>
  </Box>;
}

function EntryExitContextSummary({
  currency,
  factors,
  moneyBasis,
}: {
  currency: string | null;
  factors: readonly ContextSummaryFactor[];
  moneyBasis: "gross" | "net";
}) {
  const basis = moneyBasis === "gross" ? "Gross" : "Net";
  return <HorizontalScrollRegion label="Entry and exit context summary" minTableWidth={920} stickyFirstColumn>
    <Table size="small">
      <TableHead><TableRow>
        <TableCell><ColumnHeading label="Factor" help="The condition used to group records, such as entry time, distance from VWAP or holding time. The other columns pick groups within that factor; they do not rank the factors against each other." /></TableCell>
        <TableCell><ColumnHeading help={`The group with the highest positive combined ${basis} P/L.`} label={`Largest ${basis} gain`} /></TableCell>
        <TableCell><ColumnHeading help={`The group with the highest average ${basis} P/L. Use the trade count to judge how much data supports it.`} label={`Highest avg ${basis} P/L`} /></TableCell>
        <TableCell><ColumnHeading help={`The group with the largest combined ${basis} loss.`} label={`Largest ${basis} loss`} /></TableCell>
      </TableRow></TableHead>
      <TableBody>{factors.map((factor) => <TableRow hover key={factor.factor}>
        <TableCell sx={{ fontWeight: 850 }}>{factor.help ? <ColumnHeading label={factor.factor} help={factor.help} /> : factor.factor}</TableCell>
        <TableCell><ContextResultCell currency={currency} result={selectContextResult(factor.rows, "largest-gain")} /></TableCell>
        <TableCell><ContextResultCell currency={currency} result={selectContextResult(factor.rows, "average")} /></TableCell>
        <TableCell><ContextResultCell currency={currency} result={selectContextResult(factor.rows, "largest-loss")} /></TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </HorizontalScrollRegion>;
}

function Section({
  children,
  collapsible = true,
  description,
  headerActions,
  title,
  titleHelp,
  defaultExpanded = false,
}: {
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description: string;
  headerActions?: React.ReactNode;
  helpHref: string;
  title: string;
  titleHelp?: string;
}) {
  const heading = <Box sx={{ minWidth: 0 }}>
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", width: "fit-content" }}>
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{title}</Typography>
      {titleHelp ? <Tooltip arrow describeChild title={titleHelp}>
        <Box aria-label={`Explain ${title}`} component="span" tabIndex={0} sx={{ color: "text.secondary", display: "inline-flex" }}>
          <InfoOutlinedIcon sx={{ fontSize: 17 }} />
        </Box>
      </Tooltip> : null}
    </Stack>
    {description ? <Typography color="text.secondary" variant="body2">{description}</Typography> : null}
  </Box>;
  if (!collapsible) {
    return <Paper sx={{ borderRadius: 2, overflow: "hidden" }} variant="outlined">
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ alignItems: { lg: "center" }, justifyContent: "space-between", px: { xs: 1.5, sm: 2.25 }, py: 1.5 }}>
        {heading}
        {headerActions ? <Box sx={{ maxWidth: "100%", minWidth: 0 }}>{headerActions}</Box> : null}
      </Stack>
      <Box sx={{ px: { xs: 1.5, sm: 2.25 }, pb: 2.25 }}>{children}</Box>
    </Paper>;
  }
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ border: 1, borderColor: "divider", borderRadius: "8px !important", boxShadow: "none", overflow: "hidden", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minWidth: 0, px: { xs: 1.5, sm: 2.25 }, py: 0.5 }}>
        {heading}
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 1.5, sm: 2.25 }, pb: 2.25, pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

const PROFIT_ZONE_HOLD_PRESETS = Object.freeze([0, 1, 2, 5, 10, 15]);

function ProfitZoneHeaderControls({
  currentMinutes,
  dateRange,
  disabled,
  href,
}: {
  currentMinutes: number;
  dateRange: OverviewDateRange;
  disabled: boolean;
  href: string;
}) {
  const [selection, setSelection] = useState(() =>
    PROFIT_ZONE_HOLD_PRESETS.includes(currentMinutes) ? String(currentMinutes) : "custom");
  const [customMinutes, setCustomMinutes] = useState(() =>
    String(PROFIT_ZONE_HOLD_PRESETS.includes(currentMinutes) ? 20 : currentMinutes));
  const requestedMinutes = selection === "custom" ? Number(customMinutes) : Number(selection);
  const valid = Number.isSafeInteger(requestedMinutes) &&
    requestedMinutes >= (selection === "custom" ? 1 : 0) && requestedMinutes <= 120;
  return <Stack spacing={0.5} sx={{ alignItems: { lg: "flex-end" } }}>
    <Typography color="text.secondary" sx={{ alignSelf: "flex-end", fontWeight: 750, textAlign: "right" }} variant="caption">Results use Gross P/L</Typography>
    <OverviewDateRangeControl
      additionalControls={<>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.4 }}>
          <TextField
            disabled={disabled}
            label="Minimum time at +20%"
            onChange={(event) => setSelection(event.target.value)}
            select
            size="small"
            sx={{ minWidth: 205 }}
            value={selection}
          >
            <MenuItem value="0">Any reach (0 min)</MenuItem>
            <MenuItem value="1">1 minute</MenuItem>
            <MenuItem value="2">2 minutes</MenuItem>
            <MenuItem value="5">5 minutes</MenuItem>
            <MenuItem value="10">10 minutes</MenuItem>
            <MenuItem value="15">15 minutes</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </TextField>
          <Tooltip arrow title="Choose how long a trade must stay at or above +20% before it is included in this chart. Time is counted with consecutive completed 1-minute candle closes while the trade is active. Any reach keeps the current behavior. Once a trade qualifies, its complete journey through every higher zone remains in the chart. Reached percentages still use all analyzed trades in the selected date range.">
            <IconButton aria-label="Explain minimum time at plus 20 percent" size="small" sx={{ color: "text.secondary", p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
          </Tooltip>
        </Box>
        {selection === "custom" ? <TextField
          disabled={disabled}
          error={!valid}
          helperText={!valid ? "Enter 1–120" : undefined}
          label="Minutes"
          onChange={(event) => setCustomMinutes(event.target.value)}
          size="small"
          slotProps={{ htmlInput: { max: 120, min: 1, step: 1 } }}
          sx={{ width: 112 }}
          type="number"
          value={customMinutes}
        /> : null}
      </>}
      additionalSearchParams={{ basis: null, zoneHold: requestedMinutes === 0 ? null : String(requestedMinutes) }}
      href={href}
      showCaption={false}
      updateDisabled={disabled || !valid}
      value={dateRange}
    />
  </Stack>;
}

function ExplainedMetric({ label, value, help, wrapText = false, tone = "text.primary" }: {
  label: string; value: string; help: string; tone?: "success.main" | "error.main" | "text.primary";
  wrapText?: boolean;
}) {
  const card = <DashboardMetricCard caption="" hideCaption label={label} value={value} valueColor={tone} action={
    <Tooltip arrow title={help}><IconButton aria-label={`Explain ${label}`} size="small"><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
  } />;
  return wrapText ? <Box sx={{ minWidth: 0, height: "100%", "& > .MuiCard-root": { height: "100%" }, "& .MuiTypography-root": { whiteSpace: "normal", overflowWrap: "anywhere" } }}>{card}</Box> : card;
}

function EntryAddComparison({ rows }: { rows: readonly TradeAnalysisExcursionRow[] }) {
  return <HorizontalScrollRegion label="Initial entries versus adds" minTableWidth={600} stickyFirstColumn>
    <Table size="small"><TableHead><TableRow>
      <TableCell><ColumnHeading label="Entry type" help="Initial entries and later adds are measured separately from each execution's own price until the final exit. A trade with several buys contributes several measurements." /></TableCell>
      <TableCell align="right"><ColumnHeading label="Measured" help="Entries or adds with the required saved candles. Missing measurements are not treated as zero." /></TableCell>
      <TableCell align="right"><ColumnHeading label="Median MFE %" help="The middle maximum gain after these entries or adds. Each execution has equal weight, regardless of shares bought." /></TableCell>
      <TableCell align="right"><ColumnHeading label="Median MAE %" help="The middle maximum price drop for longs or price rise for shorts after these entries or adds. Each execution has equal weight. This is price movement, not realized loss." /></TableCell>
    </TableRow></TableHead><TableBody>{(["Entry", "Add"] as const).map((kind) => {
      const selected = rows.filter((row) => row.eventKind === kind);
      return <TableRow key={kind}><TableCell>{kind === "Entry" ? "Initial entries" : "Adds"}</TableCell><TableCell align="right">{selected.length}</TableCell><TableCell align="right" sx={{ color: "success.main" }}>{percent(median(selected.map((row) => row.favorableMovePercent)))}</TableCell><TableCell align="right" sx={{ color: "error.main" }}>{percent(median(selected.map((row) => row.adverseMovePercent)))}</TableCell></TableRow>;
    })}</TableBody></Table>
  </HorizontalScrollRegion>;
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
    {rows.length === 0 ? <Typography color="text.secondary">No measured entries or adds match these filters.</Typography> :
      <HorizontalScrollRegion label="Measured entries and adds table" minTableWidth={1420} stickyFirstColumn><Table size="small"><TableHead><TableRow>
<TableCell><ColumnHeading label="Ticker" help="The stock for this saved entry or add." /></TableCell><TableCell><ColumnHeading label="Type" help="Entry is the opening buy or short entry; Add increases an existing position." /></TableCell><TableCell><ColumnHeading label="Closed" help="The date the position closed. Each row measures a separate entry or add within that position." /></TableCell><TableCell align="right"><ColumnHeading label="Entry price" help="The price per share of this execution, not the average entry price of the whole position." /></TableCell><TableCell align="right"><ColumnHeading label="MFE per share" help="Maximum Favorable Excursion: the biggest price rise after a long entry, or price drop after a short entry, until the final exit. Dollars are per share, not whole-position profit." /></TableCell><TableCell align="right"><ColumnHeading label="MAE per share" help="Maximum Adverse Excursion: the biggest price drop after a long entry, or price rise after a short entry, until the final exit. Dollars are per share, not realized loss." /></TableCell><TableCell align="right"><ColumnHeading label="MFE %" help="The maximum profitable price move divided by this execution's entry price, shown as a percentage." /></TableCell><TableCell align="right"><ColumnHeading label="MAE %" help="The maximum losing price move divided by this execution's entry price, shown as a positive percentage describing the size of the decline." /></TableCell><TableCell align="right"><ColumnHeading label="Time to exit" help="Time from this entry or add to the final exit, rounded to the nearest minute. It is not time spent at the best or worst price." /></TableCell><TableCell align="right"><ColumnHeading label="Trade P/L" help="The whole trade's final profit or loss from all its executions, not the result of this individual entry or add. Gross is before broker fees; Net deducts recorded fees. This follows your Gross/Net selection. Unavailable means the full trade is not covered by this selection or its required fee records are missing. The same trade result can appear on several rows—do not add those repeated amounts together." /></TableCell><TableCell />
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={`${row.roundTripId}-${row.executionSequence}`}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.eventKind}</TableCell><TableCell>{row.closeDate}</TableCell><TableCell align="right">{money(row.entryPriceDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "success.main", fontWeight: 750 }}>{money(row.favorableMoveDecimal, model.currency)}</TableCell><TableCell align="right" sx={{ color: "error.main", fontWeight: 750 }}>{money(row.adverseMoveDecimal, model.currency)}</TableCell><TableCell align="right">{percent(row.favorableMovePercent)}</TableCell><TableCell align="right">{percent(row.adverseMovePercent)}</TableCell><TableCell align="right">{row.minutesUntilFlat} min</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.actualPnlDecimal), fontWeight: 750 }}>{money(row.actualPnlDecimal, model.currency)}</TableCell><TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">{offline ? "Open saved day" : "View full analysis"}</Button></TableCell>
      </TableRow>)}</TableBody></Table></HorizontalScrollRegion>}
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={rows.length} />
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
    <HorizontalScrollRegion label="Scaling out trades" minTableWidth={1780} stickyFirstColumn>
      <Table size="small"><TableHead><TableRow>
        <TableCell><ColumnHeading help="The stock for this saved trade. Its entries and exits stay together, even if you opened and closed the position more than once." label="Trade" /></TableCell>
        <TableCell><ColumnHeading help="The gain level the trade held long enough to meet this table’s rule. The number of closes tells you how many one-minute candles in a row had to close at or above that level. This sustained-level table uses different rules from the zone chart above." label="Level" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help="How many shares you closed for a profit through partial exits after meeting this table’s gain-and-time rule, before the trade first turned red afterward or finished." label="Profit shares" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help="The most shares you had open at any one time during this trade." label="Max shares" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help="Profit shares divided by Max shares. This compares shares closed through the qualifying profitable partial exits with your largest open position. Adds or re-entries can make it different from the percentage of your original shares sold." label="Reduced" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help="Shares left after the last profitable partial exit counted here. If there was no such exit, this shows shares open when the trade first met this table’s gain-and-time rule." label="Shares left" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help="Profit you took through the partial exits counted here, before fees. These exits happened after the trade met this table’s gain-and-time rule and before it first turned red afterward or finished." label="Profit taken" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help={`What the trade could have made by closing its open shares at the candle close that first met this table’s gain-and-time rule, including earlier realized gains and losses. Shown as ${basisLabel} P/L.`} label="Opportunity" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help={`What the whole trade finally made or lost, shown as ${basisLabel} P/L.`} label="Final P/L" /></TableCell>
        <TableCell align="right"><ColumnHeading align="right" help={`The opportunity shown here minus the trade’s final ${basisLabel} P/L. A positive amount means the opportunity was higher; a negative amount means the trade finished with more.`} label="Opportunity gap" /></TableCell>
        <TableCell><ColumnHeading help="Compares the profit from the shares you scaled out with what those same shares would have made at the recorded later exit prices. A comparison is shown only when the shares can be matched." label="Later exits" /></TableCell>
        <TableCell><ColumnHeading help="Open this trade’s full one-minute analysis." label="Analysis" /></TableCell>
      </TableRow></TableHead><TableBody>{visibleRows.map((row) => {
        const meaningful = meaningfulByTrade.get(row.roundTripId);
        return <TableRow hover key={row.roundTripId}>
        <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{row.thresholdPercent}% · {row.requiredCloseCount} closes</TableCell>
        <TableCell align="right">{row.scaledQuantityDecimal}</TableCell><TableCell align="right">{row.maximumOpenQuantityDecimal}</TableCell>
        <TableCell align="right">{percent(row.positionReducedPercent)}</TableCell><TableCell align="right"><Typography component="div" variant="body2">{row.remainingQuantityDecimal ?? "—"}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.scaledOutWhileGreen ? "After last profitable scale-out" : "At qualifying close"}</Typography></TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(row.profitSecuredGrossDecimal), fontWeight: 750 }}>{money(row.profitSecuredGrossDecimal, currency)}</TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(meaningful?.calculatedPotentialPnlDecimal ?? null), fontWeight: 750 }}>{money(meaningful?.calculatedPotentialPnlDecimal ?? null, currency)}</TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(row.actualPnlDecimal), fontWeight: 750 }}>{money(row.actualPnlDecimal, currency)}</TableCell>
        <TableCell align="right" sx={{ color: financialOutcomeColor(meaningful?.differenceDecimal ?? null), fontWeight: 750 }}>{money(meaningful?.differenceDecimal ?? null, currency)}</TableCell>
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
    <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={rows.length} />
  </Stack>;
}

type GroupedEventPath = Readonly<{
  event: TradeAnalysisEventPathRow;
  paths: ReadonlyMap<number, TradeAnalysisEventPathRow>;
}>;

function EventPathTable({
  currency,
  direction,
  explainColumns = false,
  kinds,
  model,
  offline,
  paginationAtBottom = false,
}: {
  currency: string | null;
  direction: "long" | "short";
  explainColumns?: boolean;
  kinds: readonly TradeAnalysisEventPathRow["eventKind"][];
  paginationAtBottom?: boolean;
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
    if (!eventPrice.gt(0)) return null;
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
    {grouped.length === 0 ? <Typography color="text.secondary">No saved price paths match this selection. You can clear or change the ticker above.</Typography> : <>
    {!paginationAtBottom ? <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={grouped.length} /> : null}
    <HorizontalScrollRegion label="Saved event price paths" minTableWidth={1540} stickyFirstColumn>
      <Table size="small"><TableHead><TableRow>
        {[
          ["Ticker", "The stock for this execution."],
          ["Execution", "Initial entry opens a position; Add increases it; Partial exit reduces it; Final exit closes the remaining shares. Each row starts from its own execution price."],
          ["Executed", "The recorded date and time of this execution. All four time windows use this execution as their starting point."],
          ["Session", "Whether the execution happened in premarket, regular hours or after-hours, using the account timezone."],
          ["Execution price", "The price per share of this execution, used to calculate the percentage moves in this row."],
        ].map(([label, help], index) => <TableCell align={index === 4 ? "right" : "left"} key={label}>{explainColumns ? <ColumnHeading label={label!} help={help!} /> : label}</TableCell>)}
        {[5, 15, 30, 60].map((minutes) => <TableCell align="right" key={minutes}>{explainColumns ? <ColumnHeading label={`High / low · ${minutes} min`} help={kinds.includes("Final exit") ? `The saved ${minutes}-minute price path after this exit, with high and low shown relative to its execution price. Only complete one-minute candles after the execution minute and completed by the window end are included. A partial exit may leave shares open. Any missing required minute makes the path unavailable, not zero. Larger windows overlap the smaller ones; do not add their moves together.` : `The saved high and low for the ${minutes}-minute path after this execution, with percentage changes from its price. Only full one-minute candles after the execution minute and completed by the window's end are included. These windows can continue after you exit; they are not while-held MFE/MAE. Unavailable means a saved value or a required minute is missing. Larger windows include the shorter ones.`} /> : <>High / low within {minutes} min</>}</TableCell>)}<TableCell />
      </TableRow></TableHead>
        <TableBody>{visibleRows.map(({ event, paths }) => <TableRow hover key={`${event.roundTripId}-${event.eventSequence}`}><TableCell sx={{ fontWeight: 850 }}>{event.symbol}</TableCell><TableCell>{event.eventKind}</TableCell><TableCell>{executionDateTime(event.executedAtUtc, model.timezone)}</TableCell><TableCell>{event.session}</TableCell><TableCell align="right">{money(event.eventPriceDecimal, currency)}</TableCell>{[5, 15, 30, 60].map((minutes) => {
          const prices = pathPrices(paths.get(minutes));
          return <TableCell align="right" key={minutes}>{prices ? <Box>
            <Typography component="div" sx={{ color: direction === "long" ? "success.main" : "error.main", fontWeight: 750 }} variant="body2">High {money(prices.high, currency)} · {percent(prices.highPercent)}</Typography>
            <Typography color={direction === "long" ? "error.main" : "success.main"} component="div" variant="caption">Low {money(prices.low, currency)} · {percent(prices.lowPercent)}</Typography>
          </Box> : "Unavailable"}</TableCell>;
        })}<TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${event.trackerDate}` : `/trade-tracker/${event.trackerDate}?${new URLSearchParams({ interval: "1m", trade: event.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell></TableRow>)}</TableBody>
      </Table>
    </HorizontalScrollRegion>
    {paginationAtBottom ? <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={grouped.length} /> : null}
    </>}
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
        <TableCell><ColumnHeading label="Ticker" help="The stock for this execution." /></TableCell><TableCell><ColumnHeading label="Execution" help="Initial entry opens a position; Add increases it; Partial exit reduces it; Final exit closes the remaining shares." /></TableCell><TableCell><ColumnHeading label="Executed" help="Recorded execution date and time, displayed in your account timezone." /></TableCell><TableCell><ColumnHeading label="Session" help="Premarket, regular hours or after-hours, based on the execution time and account timezone." /></TableCell><TableCell align="right"><ColumnHeading label="Price" help="The actual recorded execution price per share." /></TableCell><TableCell align="right"><ColumnHeading label="VWAP distance" help="Percentage above (+) or below (−) Session VWAP on the completed one-minute execution candle." /></TableCell><TableCell align="right"><ColumnHeading label="EMA 9 · 1 min" help="Percentage above (+) or below (−) EMA 9 on the completed one-minute execution candle." /></TableCell><TableCell align="right"><ColumnHeading label="EMA 9 · 5 min" help="Percentage above (+) or below (−) EMA 9 on the last completed five-minute candle at the execution." /></TableCell><TableCell align="right"><ColumnHeading label="Volume multiple" help="Completed execution-candle volume divided by the average of up to 20 prior one-minute candles, requiring at least five. 2x means twice that recent average." /></TableCell><TableCell align="right"><ColumnHeading label="ATR 14" help="Saved 14-period one-minute Average True Range as a percentage of the execution price. This is recent price volatility, not trade P/L." /></TableCell><TableCell align="right"><ColumnHeading label="Candle position" help="Execution-price location inside the completed one-minute candle: 0% at the low and 100% at the high." /></TableCell><TableCell align="right"><ColumnHeading label={`${model.moneyBasis === "gross" ? "Gross" : "Net"} P/L`} help="Final P/L of the saved trade containing this execution, including all of its round trips, not profit from this fill alone. Gross is before broker fees; Net deducts recorded fees. This result repeats across the trade's executions, so do not add these rows." /></TableCell><TableCell align="right"><ColumnHeading label="Return" help="The saved trade's final P/L divided by the combined entry cost of its round trips. This follows Gross/Net and is not the price move after this individual execution." /></TableCell><TableCell />
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
    return null;
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

function AnalyzedTradeCountCard({
  capabilityQuery,
  count,
}: {
  capabilityQuery: string;
  count: number;
}) {
  return <Card sx={{ maxWidth: { xs: "100%", sm: 240 }, width: "100%" }} variant="outlined">
    <CardActionArea component={Link} href={`/analytics/trade-analyzer/day/trades?${capabilityQuery}`}>
      <CardContent>
        <Tooltip
          arrow
          describeChild
          title={'This page only displays trades that were analyzed by TradersLink "Trade Analyzer" feature.'}
        >
          <Stack component="span" direction="row" spacing={0.4} sx={{ alignItems: "center", minWidth: 0 }}>
            <Typography component="span" sx={{ color: "warning.main", fontSize: "1.125rem", whiteSpace: "normal", overflowWrap: "anywhere" }} variant="caption">Results include analyzed trades only</Typography>
            <InfoOutlinedIcon sx={{ color: "text.secondary", fontSize: 14 }} />
          </Stack>
        </Tooltip>
        <Typography component="div" sx={{ color: "warning.main", fontSize: "1.75rem", fontWeight: 800, mt: 0.5 }}>{count}</Typography>
      </CardContent>
    </CardActionArea>
  </Card>;
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
    profitZoneMinimumHoldMinutes?: number;
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
  const profitZoneMinimumHoldMinutes = evidenceQuery.profitZoneMinimumHoldMinutes ?? 0;
  const profitZoneDateRange = Object.freeze({
    endDate: evidenceQuery.endDate,
    kind: evidenceQuery.rangeKind as OverviewDateRange["kind"],
    startDate: evidenceQuery.startDate,
  });
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
  const entryExitSnapshot = useMemo(() => {
    const trades = model.trades.filter((row) => row.direction === activeDirection);
    const executions = model.executionContextRows.filter((row) => row.direction === activeDirection);
    const addedTradeIds = new Set(executions.filter((row) => row.eventKind === "Add").map((row) => row.roundTripId));
    const partialExitTradeIds = new Set(executions.filter((row) => row.eventKind === "Partial exit").map((row) => row.roundTripId));
    const greenFinalExitTradeIds = new Set(executions.filter((row) =>
      row.eventKind === "Final exit" && row.isLastTradeExit !== false && row.executionGrossPnlDecimal !== null &&
      new Decimal(row.executionGrossPnlDecimal).gt(0)).map((row) => row.roundTripId));
    const averageTradePnl = (rows: typeof trades): string | null => rows.length === 0
      ? null
      : rows.reduce((sum, row) => sum.plus(row.actualPnlDecimal), new Decimal(0)).div(rows.length).toString();
    const profitablePartialExitGross = executions.filter((row) =>
      row.eventKind === "Partial exit" && row.executionGrossPnlDecimal !== null &&
      new Decimal(row.executionGrossPnlDecimal).gt(0)).reduce((sum, row) =>
        sum.plus(row.executionGrossPnlDecimal!), new Decimal(0));
    const profitGivebackPercentages = trades.flatMap((row) => row.capturedPercent === null
      ? [] : [Math.max(0, 100 - row.capturedPercent)]);
    return Object.freeze({
      addedAveragePnl: averageTradePnl(trades.filter((row) => addedTradeIds.has(row.roundTripId))),
      addedTradeCount: addedTradeIds.size,
      greenFinalExitTradeCount: greenFinalExitTradeIds.size,
      medianProfitGivebackPercent: median(profitGivebackPercentages),
      noAddAveragePnl: averageTradePnl(trades.filter((row) => !addedTradeIds.has(row.roundTripId))),
      partialExitGrossPnl: profitablePartialExitGross.toString(),
      partialExitTradeCount: partialExitTradeIds.size,
      tradeCount: trades.length,
    });
  }, [activeDirection, model.executionContextRows, model.trades]);
  const entryExitContextFactors = useMemo((): readonly ContextSummaryFactor[] => Object.freeze([
    Object.freeze({ factor: "Entry time", rows: model.entryTimeByDirection[activeDirection] }),
    Object.freeze({ factor: "Session VWAP", rows: model.entryContextByDirection[activeDirection].vwap }),
    Object.freeze({ factor: "EMA 9", rows: model.entryContextByDirection[activeDirection].ema9 }),
    Object.freeze({ factor: "Relative volume", rows: model.entryContextByDirection[activeDirection].relativeVolume }),
    Object.freeze({ factor: "Holding time", help: "Total time a position was open across the saved trade's round trips. Time spent flat between round trips is excluded.", rows: model.holdingDurationByDirection[activeDirection] }),
    Object.freeze({ factor: "Exit giveback", help: "The price move from the prior favorable price extreme to an exit, as a percentage of that extreme price. This groups executions by stock-price giveback. It is different from the top card, which measures the share of potential trade profit not retained.", rows: model.exitContextByDirection[activeDirection] }),
  ]), [activeDirection, model.entryContextByDirection, model.entryTimeByDirection, model.exitContextByDirection, model.holdingDurationByDirection]);
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
  if (model.eligibleDayTradeCount === 0 || model.analyzedTradeCount === 0) {
    return <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: view === "scaling-out" ? "flex-start" : "flex-end" }, justifyContent: "space-between" }}>
        <AnalyzedTradeCountCard capabilityQuery={capabilityQuery} count={0} />
        {view === "scaling-out" ? <ProfitZoneHeaderControls
          currentMinutes={profitZoneMinimumHoldMinutes}
          dateRange={profitZoneDateRange}
          disabled={offline}
          href={pathname}
        /> : <TradeAnalysisRangeAndBasisControls dateRange={profitZoneDateRange} moneyBasis={model.moneyBasis} />}
      </Stack>
      <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
          {model.eligibleDayTradeCount === 0 ? "No completed day trades" : "No trades have been analyzed."}
        </Typography>
        {model.eligibleDayTradeCount === 0 ? <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Trade Analysis will begin after completed day trades are available in this account.
        </Typography> : null}
      </Paper>
    </Stack>;
  }
  const directionLabel = activeDirection === "long" ? "long" : "short";
  const moneyBasisLabel = model.moneyBasis === "gross" ? "Gross" : "Net";
  const favorableMoneyLabel = activeDirection === "long" ? "price rise after long entry" : "price drop after short entry";
  const adverseMoneyLabel = activeDirection === "long" ? "price drop after long entry" : "price rise after short entry";
  const favorableMoveLabel = activeDirection === "long" ? "price rise" : "price drop";
  const adverseMoveLabel = activeDirection === "long" ? "price drop" : "price rise";
  const entryContext = model.entryContextByDirection[activeDirection];
  const exitContext = model.exitExecutionContextByDirection[activeDirection];
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: view === "scaling-out" ? "flex-start" : "flex-end" }, justifyContent: "space-between" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-start" } }}>
          <AnalyzedTradeCountCard
            capabilityQuery={capabilityQuery}
            count={view === "day" ? model.analyzedTradeCount : visibleDirectionCounts[activeDirection]}
          />
          {view !== "day" ? <DirectionControl activeDirection={activeDirection} counts={visibleDirectionCounts} onChange={(direction) => {
            setSelectedDirection(direction);
            if (offline) return;
            const params = new URLSearchParams(searchParams.toString());
            params.set("direction", direction);
            params.delete("page");
            router.replace(`${pathname}?${params.toString()}`);
          }} /> : null}
        </Stack>
        {view !== "scaling-out" ? <TradeAnalysisRangeAndBasisControls
          dateRange={profitZoneDateRange}
          moneyBasis={model.moneyBasis}
        /> : null}
      </Stack>

      {view === "day" ? <Stack spacing={1.25}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Selected-period records</Typography>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
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

      {view === "green-to-red" ? <Section defaultExpanded description="What happened after user-defined trades reached a gain of 20% or more while shares were open." helpHref="/help/trade-analyzer/green-to-red-analysis#profit-capture" title="Green-to-red trades" titleHelp="See how often trades offered a gain of at least 20%, how much profit you took, and which trades later turned red or finished at a loss. This page uses your saved Trade Analyzer candles and executions for the selected dates and direction, with no minimum time above +20%. Amounts use Gross P/L, before broker fees. Profit opportunity combines realized P/L with potential profit on shares still held at the trade's highest percentage gain. Use the summaries and individual records to review profit-taking and risk management. A recovery can be temporary, so check whether the trade finished green or red.">
        <GreenToRedAnalysis
          currency={model.currency}
          direction={activeDirection}
          offline={offline}
          rows={greenToRedOpportunityRows}
          timezone={model.timezone}
          totalTradeCount={greenToRedDirectionCounts[activeDirection]}
        />
      </Section> : null}

      {view === "scaling-out" ? <Section
        collapsible={false}
        description="Profit taking and opportunity across 10% gain zones."
        headerActions={<ProfitZoneHeaderControls
          currentMinutes={profitZoneMinimumHoldMinutes}
          dateRange={profitZoneDateRange}
          disabled={offline}
          href={pathname}
          key={`${evidenceQuery.rangeKind}:${evidenceQuery.startDate ?? "all"}:${evidenceQuery.endDate ?? "all"}:${profitZoneMinimumHoldMinutes}`}
        />}
        helpHref="/help/trade-analyzer/scaling-out#behavior"
        title="Profit taking by price zone"
        titleHelp={`This page uses ${profitZoneDirectionCounts[activeDirection]} analyzed user-defined ${activeDirection} trades. A trade counts once even when it contains several entries, partial exits, full exits or re-entries. Profit-taking and missed-opportunity percentages use only the trades that reached that zone. The partial/full breakdown uses only trades that took profit and always totals 100%: a trade that scaled out in the band is shown under Partial exits; an entire position sold in one order with no earlier scale-out is shown under Full exits.`}
      >
        <ProfitZoneAnalysis
          currency={model.currency}
          direction={activeDirection}
          key={`${evidenceQuery.rangeKind}:${evidenceQuery.startDate ?? "all"}:${evidenceQuery.endDate ?? "all"}:${activeDirection}:${profitZoneMinimumHoldMinutes}`}
          offline={offline}
          records={profitZoneRecords}
          rows={profitZoneRows}
          timezone={model.timezone}
          totalTradeCount={profitZoneDirectionCounts[activeDirection]}
        />
      </Section> : null}

      {view === "scaling-out" ? <Section defaultExpanded description="Profit-taking behavior on trades that held a meaningful-profit level, including profitable partial exits before reversal and qualifying trades where no shares were sold before a red finish." helpHref="/help/trade-analyzer/scaling-out#behavior" title="Scaling behavior">
        <Stack spacing={2.25}>
          <Typography variant="h6">Potential profit vs actual profit</Typography>
          <ProfitZoneComparison records={profitZoneRecords} rows={profitZoneRows} currency={model.currency} timezone={model.timezone} totalTradeCount={profitZoneDirectionCounts[activeDirection]} offline={offline}
            key={`${evidenceQuery.rangeKind}:${evidenceQuery.startDate ?? "all"}:${evidenceQuery.endDate ?? "all"}:${activeDirection}:${profitZoneMinimumHoldMinutes}`} />
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
            <DashboardMetricCard caption={`Completed ${directionLabel} trades with a qualifying sustained profit level${model.moneyBasis === "net" ? " and complete saved fee facts" : ""}`} label="Qualifying trades" value={String(scalingRows.length)} />
            <DashboardMetricCard caption="Share of qualifying trades with at least one profitable partial exit after the sustained-profit level and before the first red point or final exit" label="Scaled out while green" value={`${directionScalingSummary.scaledOut} · ${percent(scalingRows.length === 0 ? null : directionScalingSummary.scaledOut / scalingRows.length * 100)}`} />
            <DashboardMetricCard caption="Share of qualifying trades with no profitable partial exit after the sustained-profit level and before the first red point or final exit" label="No scale-out while green" value={`${directionScalingSummary.noScale} · ${percent(scalingRows.length === 0 ? null : directionScalingSummary.noScale / scalingRows.length * 100)}`} />
            <DashboardMetricCard caption="Share of no-scale trades whose completed result finished below zero" label="No scale-out, ended red" value={`${directionScalingSummary.noScaleEndedRed} · ${percent(directionScalingSummary.noScale === 0 ? null : directionScalingSummary.noScaleEndedRed / directionScalingSummary.noScale * 100)}`} />
          </Box>
          <ScalingOutTable currency={model.currency} meaningfulRows={meaningfulProfitRows} moneyBasis={model.moneyBasis} offline={offline} rows={scalingRows} />
          <Typography color="text.secondary" variant="body2">Profit taken on partial exits is shown as exact Gross realized P/L for the shares sold at those executions. Final trade P/L is also Gross.</Typography>
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

      {view === "entry-exit" ? <Section
        collapsible={false}
        description=""
        titleHelp="A summary of adds, partial exits, profitable final exits and profit given back for the selected dates and direction. Use the context table to find which entry and exit conditions accompanied stronger or weaker completed results, then open the detailed sections below. Each saved trade counts once, even when it contains multiple round trips. The selected dates use the trade's final closing date."
        helpHref="/help/trade-analyzer/entry-exit-analysis"
        title="Entry and exit snapshot"
      >
        <Stack spacing={2.25}>
          {model.entryExitExcludedTradeCount ? <Typography color="text.secondary" variant="body2">{model.entryExitExcludedTradeCount} analyzed trades lack complete matching execution, fee or currency data for these results. They remain in the analyzed count but are excluded from the comparisons below.</Typography> : null}
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
            <ExplainedMetric wrapText
              help={`Saved trades with at least one add: an execution that increased shares already held. Each saved trade counts once, even with several adds. Average ${moneyBasisLabel} P/L with adds: ${money(entryExitSnapshot.addedAveragePnl, model.currency)}; without adds: ${money(entryExitSnapshot.noAddAveragePnl, model.currency)}. These are completed trade results, not profit caused by adding.`}
              label="Trades with adds"
              value={`${entryExitSnapshot.addedTradeCount} of ${entryExitSnapshot.tradeCount} · ${percent(entryExitSnapshot.tradeCount === 0 ? null : entryExitSnapshot.addedTradeCount / entryExitSnapshot.tradeCount * 100)}`}
            />
            <ExplainedMetric wrapText
              help={`Saved trades with an exit that reduced shares without closing the position, whether that exit made or lost money. Each trade counts once. Profitable partial exits secured ${money(entryExitSnapshot.partialExitGrossPnl, model.currency)} in gross profit; this amount excludes losing partial exits and broker fees.`}
              label="Trades with partial exits"
              value={`${entryExitSnapshot.partialExitTradeCount} of ${entryExitSnapshot.tradeCount} · ${percent(entryExitSnapshot.tradeCount === 0 ? null : entryExitSnapshot.partialExitTradeCount / entryExitSnapshot.tradeCount * 100)}`}
            />
            <ExplainedMetric wrapText
              help="Saved trades whose last exit made a gross profit on the shares closed by that execution. Earlier exits or round trips may have made or lost money, so this does not necessarily mean the whole trade finished profitable. Final exit means closing the remaining shares, including after earlier partial exits."
              label="Exited while green"
              value={`${entryExitSnapshot.greenFinalExitTradeCount} of ${entryExitSnapshot.tradeCount} · ${percent(entryExitSnapshot.tradeCount === 0 ? null : entryExitSnapshot.greenFinalExitTradeCount / entryExitSnapshot.tradeCount * 100)}`}
            />
            <ExplainedMetric wrapText
              help="The middle percentage of calculated peak profit opportunity not retained in final P/L. For each eligible trade, the gap between opportunity and final P/L is divided by opportunity, then the middle percentage is shown. For example, $100 opportunity and $60 final profit gives 40% back. Finishing at a loss can put this above 100%. Opportunity and final P/L both follow your Gross/Net selection. Opportunity includes profit already secured plus potential profit on shares still held, using saved candle highs for longs and lows for shorts. Candles containing executions are excluded because their price order is unknown. Missing candles or nonpositive opportunities are excluded. This is a share of potential profit, not a percentage drop in the stock price."
              label="Median profit given back"
              value={percent(entryExitSnapshot.medianProfitGivebackPercent)}
              tone={entryExitSnapshot.medianProfitGivebackPercent === null || entryExitSnapshot.medianProfitGivebackPercent === 0 ? "text.primary" : "error.main"}
            />
          </Box>
          <Box>
            <Typography component="h3" sx={{ fontWeight: 850, mb: 0.25 }} variant="subtitle1">Context summary</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">The strongest and weakest groups from the detailed tables, with the trade count supporting each result.</Typography>
            <EntryExitContextSummary currency={model.currency} factors={entryExitContextFactors} moneyBasis={model.moneyBasis} />
          </Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section defaultExpanded description="" titleHelp="Counts your recorded initial entries, adds, partial exits and final exits for this selection. These are execution counts, not a count of saved trades. Several executions, and even multiple opening-to-flat positions, can belong to one saved trade." helpHref="/help/trade-analyzer/entry-exit-analysis#execution-mix" title="Execution mix">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <ExplainedMetric wrapText help="Executions that opened a position from zero shares. A later re-entry can be another initial entry within the same saved trade." label="Initial entries" value={String(directionEventCounts.initialEntries)} />
          <ExplainedMetric wrapText help="Executions that increased a position already open. This counts fills, not the number of shares bought or the number of trades." label="Adds" value={String(directionEventCounts.adds)} />
          <ExplainedMetric wrapText help="Executions that reduced shares but left the position open. They count whether that exit was profitable, breakeven or losing." label="Partial exits" value={String(directionEventCounts.partialExits)} />
          <ExplainedMetric wrapText help="Executions that closed all remaining shares and left the position flat. This can be the last part of a scale-out, not necessarily a single full-size exit." label="Final exits" value={String(directionEventCounts.finalExits)} />
        </Box>
      </Section> : null}

      {view === "entry-exit" ? <Section description="" titleHelp="Compare the completed results of saved trades entered or added to at different distances from Session VWAP and EMA 9, and under different volume and volatility conditions. Entries and adds are separated. Indicators from the completed execution candle can include prices or volume after the fill. A trade can appear in several groups, so their totals must not be added together." helpHref="/help/trade-analyzer/entry-exit-analysis#entry-execution-context" title="Entry execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Session VWAP distance" help="How far the execution price was above (+) or below (−) Session VWAP on its completed one-minute candle. The percentage uses VWAP as the reference. VWAP combines price and volume through that session." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="EMA 9 · 1 minute" help="How far the execution price was above (+) or below (−) the 9-period exponential moving average on the completed one-minute execution candle. This candle can finish after the execution." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="EMA 9 · 5 minutes" help="Execution-price distance from the EMA 9 on the last completed five-minute candle available at the execution. This is a separate timeframe from the one-minute EMA." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.ema9FiveMinute} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Relative volume · 1 minute" help="The completed execution candle's volume divided by average volume over up to 20 preceding one-minute candles. At least five prior candles are required. This measures recent candle activity, not full-day relative volume." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.relativeVolume} valueLabel="Avg volume multiple" valueSuffix="x" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="ATR 14 · 1 minute" help="Saved 14-period Average True Range as a percentage of the execution price. It describes recent one-minute price movement, including gaps, rather than the size of your position or profit." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.atr14Percent} valueLabel="Avg ATR" valueSuffix="%" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Position in candle" help="Where the execution price sits between its completed one-minute candle's low (0%) and high (100%). The candle can continue after the fill, so this is a review of the completed candle, not only what was known at the time." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={entryContext.candleLocation} valueLabel="Avg candle position" valueMultiplier={100} valueSuffix="%" /></Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 0.25 }}>Exact entry and add records</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">Signed distances show above (+) or below (−) the saved indicator. Candle position runs from 0% at the candle low to 100% at the candle high.</Typography>
            <ExecutionContextTable direction={activeDirection} kinds={["Initial entry", "Add"]} model={model} offline={offline} />
          </Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="" titleHelp="Compare the completed results of saved trades with partial or final exits in each indicator, volume and volatility band. These results belong to the whole saved trade, not just the exit shown. Partial exits leave shares open; final exits close the remaining shares. A trade can appear in several groups." helpHref="/help/trade-analyzer/entry-exit-analysis#exit-execution-context" title="Exit execution context">
        <Stack spacing={2.5}>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Session VWAP distance" help="How far the execution price was above (+) or below (−) Session VWAP on its completed one-minute candle. The percentage uses VWAP as the reference. VWAP combines price and volume through that session." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.vwap} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="EMA 9 · 1 minute" help="How far the execution price was above (+) or below (−) the 9-period exponential moving average on the completed one-minute execution candle. This candle can finish after the execution." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.ema9} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="EMA 9 · 5 minutes" help="Execution-price distance from the EMA 9 on the last completed five-minute candle available at the execution. This is a separate timeframe from the one-minute EMA." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.ema9FiveMinute} /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Relative volume · 1 minute" help="The completed execution candle's volume divided by average volume over up to 20 preceding one-minute candles. At least five prior candles are required. This measures recent candle activity, not full-day relative volume." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.relativeVolume} valueLabel="Avg volume multiple" valueSuffix="x" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="ATR 14 · 1 minute" help="Saved 14-period Average True Range as a percentage of the execution price. It describes recent one-minute price movement, including gaps, rather than the size of your position or profit." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.atr14Percent} valueLabel="Avg ATR" valueSuffix="%" /></Box>
          <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }}><ColumnHeading label="Position in candle" help="Where the execution price sits between its completed one-minute candle's low (0%) and high (100%). The candle can continue after the fill, so this is a review of the completed candle, not only what was known at the time." /></Typography><BreakdownTable explainColumns currency={model.currency} moneyBasis={model.moneyBasis} rows={exitContext.candleLocation} valueLabel="Avg candle position" valueMultiplier={100} valueSuffix="%" /></Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 0.25 }}>Exact partial and final exit records</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">Signed distances show above (+) or below (−) the saved indicator. Candle position runs from 0% at the candle low to 100% at the candle high.</Typography>
            <ExecutionContextTable direction={activeDirection} kinds={["Partial exit", "Final exit"]} model={model} offline={offline} />
          </Box>
        </Stack>
      </Section> : null}

      {view === "entry-exit" ? <Section description="" titleHelp="See how prices moved after each partial or final exit, using that execution price as the starting point. A partial exit may leave shares open. The Analyzer requests one-minute candles through 30 minutes after the last exit; longer windows depend on available saved data. These are later price ranges, not additional realized profit." helpHref="/help/trade-analyzer/entry-exit-analysis#after-exit" title="Price reached after exits">
        <EventPathTable explainColumns currency={model.currency} direction={activeDirection} kinds={["Partial exit", "Final exit"]} model={model} offline={offline} />
      </Section> : null}

      {view === "mfe-mae" ? <Section defaultExpanded description={`MFE and MAE measure price movement after each ${directionLabel} entry or add until the final exit. Dollars are per share.`} helpHref="/help/trade-analyzer/mfe-mae#overview" title="Room after entry · MFE / MAE" titleHelp="Review how much upside and downside followed your entries and adds while the position was open. Each execution starts from its own price and carries equal weight in the summaries. MFE is the largest profitable price move; MAE is the largest losing price move. Neither is a realized trade profit or loss. Measurements use saved one-minute candles and the final exit price. The entry and exit candles' full ranges are excluded because their highs and lows may have occurred outside your holding period.">
        <Stack spacing={1.5}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}>
            <ExplainedMetric label="Measured entries / adds" value={String(directionExcursions.length)} help="The number of entries and adds with usable MFE/MAE measurements. A trade can contribute more than one row. Any missing required minute excludes that measurement rather than counting it as zero. A position that opens and closes in the same minute can use its exact exit price without an interior candle." />
            <ExplainedMetric label="Median MFE %" value={percent(directionMovement.medianFavorablePercent)} tone="success.main" help="The middle maximum profitable price move across measured entries and adds, as a percentage of each execution price. Half the measurements are at or below this value and half at or above it." />
            <ExplainedMetric label="Median MAE %" value={percent(directionMovement.medianAdversePercent)} tone="error.main" help="The middle maximum losing price move across measured entries and adds, as a percentage of each execution price. The value describes the size of the move; it is not a realized loss." />
            <ExplainedMetric label="Average MFE %" value={percent(directionMovement.averageFavorablePercent)} tone="success.main" help="Adds the maximum profitable percentage move for each measured entry or add, then divides by the number of measurements. Each execution counts equally. Large moves can pull the average above the median." />
            <ExplainedMetric label="Average MAE %" value={percent(directionMovement.averageAdversePercent)} tone="error.main" help="Adds the maximum losing percentage move for each measured entry or add, then divides by the number of measurements. Each execution counts equally; this is not weighted by position size." />
            <ExplainedMetric label="Average MFE per share" value={money(directionMovement.averageFavorableMoney?.toString() ?? null, model.currency)} tone="success.main" help={`Average ${favorableMoneyLabel}. Each measurement is the largest ${favorableMoveLabel} from that execution's price until the final exit. These are dollars per share, not total trade profit.`} />
            <ExplainedMetric label="Median MFE per share" value={money(directionMovement.medianFavorableMoney?.toString() ?? null, model.currency)} tone="success.main" help={`The middle ${favorableMoneyLabel} when the measured maximum moves are ordered by size. Dollars are per share. Percentage measurements make it easier to compare stocks at different prices.`} />
            <ExplainedMetric label="Average MAE per share" value={money(directionMovement.averageAdverseMoney?.toString() ?? null, model.currency)} tone="error.main" help={`Average ${adverseMoneyLabel}. Each measurement is the largest ${adverseMoveLabel} from that execution's price until the final exit. This is price movement per share, not realized loss.`} />
            <ExplainedMetric label="Median MAE per share" value={money(directionMovement.medianAdverseMoney?.toString() ?? null, model.currency)} tone="error.main" help={`The middle ${adverseMoneyLabel} when measured maximum moves are ordered by size. Dollars are per share, not the amount lost on the position.`} />
          </Box>
          <Typography color="text.secondary" variant="body2">Measurements with missing required candles are excluded. Entries and adds count separately; the figures are not whole-trade profit or loss.</Typography>
          <EntryAddComparison rows={directionExcursions} />
        </Stack>
      </Section> : null}

      {view === "mfe-mae" ? <Section defaultExpanded description="Price movement within 5, 15, 30 and 60 minutes of each entry or add. These windows can continue after your final exit." helpHref="/help/trade-analyzer/mfe-mae#timed-paths" title="Price path after entry" titleHelp="Unlike the MFE/MAE summary, these fixed time windows do not stop at your exit. They start from each execution's price and use its saved one-minute price path. The Analyzer requests candles through 30 minutes after the final exit, so longer windows may be unavailable. Missing required candles also make a window unavailable. The windows overlap: 15 minutes includes the first 5 minutes, rather than showing only minutes 5 to 15.">
        <EventPathTable currency={model.currency} direction={activeDirection} explainColumns kinds={["Initial entry", "Add"]} model={model} offline={offline} paginationAtBottom />
      </Section> : null}

      {view === "mfe-mae" ? <Section description="Each row is an entry or add, measured until the final exit. Table filters do not change the summaries above." helpHref="/help/trade-analyzer/mfe-mae#measured-executions" title="Measured executions" titleHelp="See the entries and adds behind the MFE/MAE summary. Each starts at its own execution price, uses the interior one-minute candle ranges and final exit price, and excludes prices after the position closes. Use the ticker and execution filters to inspect these rows. Trade P/L is the whole trade's final result and may repeat across multiple rows.">
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
