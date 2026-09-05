"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Decimal from "decimal.js";
import { useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { TradeAnalysisGreenToRedOpportunityRow } from
  "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

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

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator * 100;
}

function sum(rows: readonly TradeAnalysisGreenToRedOpportunityRow[], read: (row: TradeAnalysisGreenToRedOpportunityRow) => string): string {
  return rows.reduce((total, row) => total.plus(read(row)), new Decimal(0)).toString();
}

function zoneLabel(row: TradeAnalysisGreenToRedOpportunityRow): string {
  return row.peakZoneUpperBoundPercent === null
    ? `${row.peakZoneLowerBoundPercent}%+`
    : `${row.peakZoneLowerBoundPercent}–${row.peakZoneUpperBoundPercent}%`;
}

function zoneTime(value: number): string {
  if (value === 0) return "Under 1 min";
  return `${value} min`;
}

function clockTime(seconds: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(seconds * 1000));
}

function Metric({
  detail,
  help,
  label,
  tone,
  value,
}: {
  detail: string;
  help: string;
  label: string;
  tone?: string;
  value: string;
}) {
  return <Paper variant="outlined" sx={{ borderRadius: 2, minWidth: 0, p: 1.35 }}>
    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
      <Typography color="text.secondary" sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.035em", textTransform: "uppercase" }}>{label}</Typography>
      <Tooltip arrow title={help}>
        <IconButton aria-label={`Explain ${label}`} size="small" sx={{ color: "text.secondary", ml: "auto", p: 0.3 }}>
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Stack>
    <Typography sx={{ color: tone, fontSize: "1.18rem", fontVariantNumeric: "tabular-nums", fontWeight: 850, lineHeight: 1.25 }}>{value}</Typography>
    <Typography color="text.secondary" sx={{ display: "block", mt: 0.25 }} variant="caption">{detail}</Typography>
  </Paper>;
}

export function GreenToRedAnalysis({
  currency,
  direction,
  offline,
  rows,
  timezone,
  totalTradeCount,
}: {
  currency: string | null;
  direction: "long" | "short";
  offline: boolean;
  rows: readonly TradeAnalysisGreenToRedOpportunityRow[];
  timezone: string;
  totalTradeCount: number;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const endedRedRows = useMemo(() => rows.filter((row) => new Decimal(row.finalGrossPnlDecimal).isNegative()), [rows]);
  const turnedRedRows = useMemo(() => rows.filter((row) => row.firstRedAfterTwentyAtUtcSeconds !== null), [rows]);
  const profitTakenRows = useMemo(() => rows.filter((row) => new Decimal(row.profitSecuredGrossDecimal).isPositive()), [rows]);
  const noProfitEndedRedRows = useMemo(() => endedRedRows.filter((row) => !new Decimal(row.profitSecuredGrossDecimal).isPositive()), [endedRedRows]);
  const someProfitEndedRedRows = useMemo(() => endedRedRows.filter((row) => new Decimal(row.profitSecuredGrossDecimal).isPositive()), [endedRedRows]);
  const recoveredRows = useMemo(() => turnedRedRows.filter((row) => row.recoveredAfterTurningRed), [turnedRedRows]);
  const currentPage = boundedPage(page, endedRedRows.length, pageSize);
  const visibleRows = paginatedRows(endedRedRows, currentPage, pageSize);
  const directionLabel = direction === "long" ? "long" : "short";

  return <Stack spacing={1.75}>
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" } }}>
      <Metric
        detail={`${rows.length} of ${totalTradeCount} completed ${directionLabel} trades`}
        help="A trade is included when the stock price moved 20% or more in the trade's profitable direction while shares were still open. There is no time requirement."
        label="Reached +20%"
        value={percent(rate(rows.length, totalTradeCount))}
      />
      <Metric
        detail={`Across the ${rows.length} trades that reached +20%`}
        help="The sum of each trade's largest calculated Gross profit opportunity while shares were still open."
        label="Profit opportunity"
        tone={financialOutcomeColor(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal))}
        value={money(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal), currency)}
      />
      <Metric
        detail={`${profitTakenRows.length} of ${rows.length} trades took some profit`}
        help="Exact Gross profit realized on profitable exit executions in the trades that reached +20%."
        label="Profit taken"
        tone={financialOutcomeColor(sum(rows, (row) => row.profitSecuredGrossDecimal))}
        value={money(sum(rows, (row) => row.profitSecuredGrossDecimal), currency)}
      />
      <Metric
        detail={`${turnedRedRows.length} of ${rows.length} trades that reached +20%`}
        help="Trades whose total Gross P/L later moved below $0. Some subsequently recovered."
        label="Turned red"
        value={percent(rate(turnedRedRows.length, rows.length))}
      />
      <Metric
        detail={`${endedRedRows.length} of ${rows.length} · ${money(sum(endedRedRows, (row) => row.finalGrossPnlDecimal), currency)}`}
        help="Trades that reached +20% or more and completed with a negative Gross P/L."
        label="Finished red"
        tone={financialOutcomeColor(sum(endedRedRows, (row) => row.finalGrossPnlDecimal))}
        value={percent(rate(endedRedRows.length, rows.length))}
      />
    </Box>

    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" } }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>No profit taken</Typography>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>{noProfitEndedRedRows.length} finished red</Typography>
          <Typography color="text.secondary" variant="body2">Final Gross loss: {money(sum(noProfitEndedRedRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
        </Box>
        <Box sx={{ borderColor: "divider", borderLeft: { md: 1 }, pl: { md: 1.5 } }}>
          <Typography sx={{ fontWeight: 850 }}>Some profit taken</Typography>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>{someProfitEndedRedRows.length} finished red</Typography>
          <Typography color="text.secondary" variant="body2">Profit taken: {money(sum(someProfitEndedRedRows, (row) => row.profitSecuredGrossDecimal), currency)} · Final Gross loss: {money(sum(someProfitEndedRedRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
        </Box>
        <Box sx={{ borderColor: "divider", borderLeft: { md: 1 }, pl: { md: 1.5 } }}>
          <Typography sx={{ fontWeight: 850 }}>Recovered after turning red</Typography>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>{recoveredRows.length} of {turnedRedRows.length}</Typography>
          <Typography color="text.secondary" variant="body2">These trades moved above breakeven again after first turning red.</Typography>
        </Box>
      </Box>
    </Paper>

    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { xs: "flex-start", sm: "baseline" }, justifyContent: "space-between", mb: 0.75 }}>
        <Typography sx={{ fontWeight: 850 }}>Trades that reached +20% and finished red</Typography>
        <Typography color="text.secondary" variant="caption">{endedRedRows.length} exact record{endedRedRows.length === 1 ? "" : "s"}</Typography>
      </Stack>
      {endedRedRows.length === 0 ? <Typography color="text.secondary">No trades in this selection reached +20% and finished red.</Typography> : <Stack spacing={1}>
        <TradeAnalyzerTablePagination onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={endedRedRows.length} />
        <HorizontalScrollRegion label="Green-to-red trade records" minTableWidth={1300} stickyFirstColumn>
          <Table size="small"><TableHead><TableRow>
            <TableCell>Ticker</TableCell><TableCell align="right">Max price gain per share</TableCell><TableCell align="right">Profit opportunity</TableCell><TableCell>Peak zone</TableCell><TableCell align="right">Time in zone</TableCell><TableCell align="right">Profit taken</TableCell><TableCell align="right">Final Gross P/L</TableCell><TableCell align="right">Opportunity to final P/L</TableCell><TableCell />
          </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={row.roundTripId}>
            <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell>
            <TableCell align="right"><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">+{row.maximumGainPercent.toFixed(1)}%</Typography><Typography color="text.secondary" component="div" variant="caption">{clockTime(row.maximumGainAtUtcSeconds, timezone)}</Typography></TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.maximumGrossProfitOpportunityDecimal), fontWeight: 750 }}>{money(row.maximumGrossProfitOpportunityDecimal, currency)}</TableCell>
            <TableCell>{zoneLabel(row)}</TableCell>
            <TableCell align="right">{zoneTime(row.timeInPeakZoneMinutes)}</TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.profitSecuredGrossDecimal), fontWeight: 750 }}>{money(row.profitSecuredGrossDecimal, currency)}</TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.finalGrossPnlDecimal), fontWeight: 750 }}>{money(row.finalGrossPnlDecimal, currency)}</TableCell>
            <TableCell align="right">{money(row.profitOpportunityToFinalDifferenceDecimal, currency)}</TableCell>
            <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${row.trackerDate}` : `/trade-tracker/${row.trackerDate}?${new URLSearchParams({ interval: "1m", trade: row.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell>
          </TableRow>)}</TableBody></Table>
        </HorizontalScrollRegion>
      </Stack>}
    </Box>
  </Stack>;
}
