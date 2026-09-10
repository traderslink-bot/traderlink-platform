"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import { useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { TradeAnalysisGreenToRedOpportunityRow } from
  "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { TradeDetailsDrawer } from "../trades/trade-details-drawer";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

type EvidenceFilter = "all" | "finished_red" | "recovered" | "turned_red";

type PeakZoneOutcome = Readonly<{
  endedRedCount: number;
  finalGrossPnlDecimal: string;
  lowerBoundPercent: number;
  medianTimeInZoneMinutes: number;
  opportunityNotRetainedDecimal: string;
  profitOpportunityDecimal: string;
  profitTakenDecimal: string;
  tradeCount: number;
  turnedRedCount: number;
  upperBoundPercent: number | null;
}>;

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

function sum(
  rows: readonly TradeAnalysisGreenToRedOpportunityRow[],
  read: (row: TradeAnalysisGreenToRedOpportunityRow) => string,
): string {
  return rows.reduce((total, row) => total.plus(read(row)), new Decimal(0)).toString();
}

function zoneLabelFromBounds(lower: number, upper: number | null): string {
  return upper === null ? `${lower}%+` : `${lower}%–under ${upper}%`;
}

function zoneLabel(row: TradeAnalysisGreenToRedOpportunityRow): string {
  return zoneLabelFromBounds(row.peakZoneLowerBoundPercent, row.peakZoneUpperBoundPercent);
}

function minutes(value: number): string {
  if (value < 1) return "Under 1 min";
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} min`;
}

function elapsedMinutes(startSeconds: number, endSeconds: number): string {
  return minutes(Math.max(0, (endSeconds - startSeconds) / 60));
}

function clockTime(seconds: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  }).format(new Date(seconds * 1000));
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function HelpLabel({ help, label }: { help: string; label: string }) {
  return <Stack component="span" direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
    <span>{label}</span>
    <Tooltip arrow title={help}>
      <Box aria-label={`Explain ${label}`} component="span" sx={{ color: "text.secondary", display: "inline-flex" }}>
        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  </Stack>;
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

function DamagePanel({
  currency,
  emptyMessage,
  rows,
  title,
  totalTurnedRed,
}: {
  currency: string | null;
  emptyMessage?: string;
  rows: readonly TradeAnalysisGreenToRedOpportunityRow[];
  title: string;
  totalTurnedRed: number;
}) {
  return <Box>
    <Typography sx={{ fontWeight: 850 }}>{title}</Typography>
    <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>
      {percent(rate(rows.length, totalTurnedRed))} · {rows.length} of {totalTurnedRed}
    </Typography>
    {rows.length === 0 && emptyMessage ? <Typography color="text.secondary" sx={{ mt: 0.4 }} variant="body2">{emptyMessage}</Typography> : <Stack spacing={0.2} sx={{ mt: 0.4 }}>
      <Typography color="text.secondary" variant="body2">Maximum profit opportunity: {money(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal), currency)}</Typography>
      <Typography color="text.secondary" variant="body2">Profit taken: {money(sum(rows, (row) => row.profitSecuredGrossDecimal), currency)}</Typography>
      <Typography color="text.secondary" variant="body2">Final Gross loss: {money(sum(rows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
      <Typography color="text.secondary" variant="body2">Profit opportunity + realized loss: {money(sum(rows, (row) => row.profitOpportunityToFinalDifferenceDecimal), currency)}</Typography>
    </Stack>}
  </Box>;
}

function buildPeakZoneOutcomes(
  rows: readonly TradeAnalysisGreenToRedOpportunityRow[],
): readonly PeakZoneOutcome[] {
  const grouped = new Map<number, TradeAnalysisGreenToRedOpportunityRow[]>();
  rows.forEach((row) => {
    const existing = grouped.get(row.peakZoneLowerBoundPercent) ?? [];
    existing.push(row);
    grouped.set(row.peakZoneLowerBoundPercent, existing);
  });
  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([lowerBoundPercent, zoneRows]) => Object.freeze({
      endedRedCount: zoneRows.filter((row) => new Decimal(row.finalGrossPnlDecimal).isNegative()).length,
      finalGrossPnlDecimal: sum(zoneRows, (row) => row.finalGrossPnlDecimal),
      lowerBoundPercent,
      medianTimeInZoneMinutes: median(zoneRows.map((row) => row.timeInPeakZoneMinutes)),
      opportunityNotRetainedDecimal: sum(zoneRows, (row) => row.profitOpportunityToFinalDifferenceDecimal),
      profitOpportunityDecimal: sum(zoneRows, (row) => row.maximumGrossProfitOpportunityDecimal),
      profitTakenDecimal: sum(zoneRows, (row) => row.profitSecuredGrossDecimal),
      tradeCount: zoneRows.length,
      turnedRedCount: zoneRows.filter((row) => row.firstRedAfterTwentyAtUtcSeconds !== null).length,
      upperBoundPercent: zoneRows[0]?.peakZoneUpperBoundPercent ?? null,
    }));
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
  const [detailsTrade, setDetailsTrade] = useState<TradeAnalysisGreenToRedOpportunityRow | null>(null);
  const [filter, setFilter] = useState<EvidenceFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const endedRedRows = useMemo(() => rows.filter((row) => new Decimal(row.finalGrossPnlDecimal).isNegative()), [rows]);
  const turnedRedRows = useMemo(() => rows.filter((row) => row.firstRedAfterTwentyAtUtcSeconds !== null), [rows]);
  const profitTakenRows = useMemo(() => rows.filter((row) => new Decimal(row.profitSecuredGrossDecimal).gt(0)), [rows]);
  const noProfitEndedRedRows = useMemo(() => endedRedRows.filter((row) => !new Decimal(row.profitSecuredGrossDecimal).gt(0)), [endedRedRows]);
  const someProfitEndedRedRows = useMemo(() => endedRedRows.filter((row) => new Decimal(row.profitSecuredGrossDecimal).gt(0)), [endedRedRows]);
  const recoveredRows = useMemo(() => turnedRedRows.filter((row) => row.recoveredAfterTurningRed), [turnedRedRows]);
  const recoveredFinishedGreenRows = useMemo(() => recoveredRows.filter((row) => !new Decimal(row.finalGrossPnlDecimal).isNegative()), [recoveredRows]);
  const recoveredFinishedRedRows = useMemo(() => recoveredRows.filter((row) => new Decimal(row.finalGrossPnlDecimal).isNegative()), [recoveredRows]);
  const peakZoneOutcomes = useMemo(() => buildPeakZoneOutcomes(rows), [rows]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    if (filter === "turned_red") return row.firstRedAfterTwentyAtUtcSeconds !== null;
    if (filter === "finished_red") return new Decimal(row.finalGrossPnlDecimal).isNegative();
    if (filter === "recovered") return row.recoveredAfterTurningRed;
    return true;
  }), [filter, rows]);
  const currentPage = boundedPage(page, filteredRows.length, pageSize);
  const visibleRows = paginatedRows(filteredRows, currentPage, pageSize);
  const directionLabel = direction === "long" ? "long" : "short";

  return <Stack spacing={1.75}>
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" } }}>
      <Metric detail={`${rows.length} of ${totalTradeCount} completed ${directionLabel} trades`} help="A trade is included when the stock price moved 20% or more in the trade's profitable direction while shares were still open. There is no time requirement." label="Reached +20%" value={percent(rate(rows.length, totalTradeCount))} />
      <Metric detail={`Across the ${rows.length} trades that reached +20%`} help="The sum of each trade's largest calculated Gross profit opportunity while shares were still open." label="Profit opportunity" tone={financialOutcomeColor(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal))} value={money(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal), currency)} />
      <Metric detail={`${profitTakenRows.length} of ${rows.length} trades took some profit`} help="Exact Gross profit realized on profitable exit executions in the trades that reached +20%." label="Profit taken" tone={financialOutcomeColor(sum(rows, (row) => row.profitSecuredGrossDecimal))} value={money(sum(rows, (row) => row.profitSecuredGrossDecimal), currency)} />
      <Metric detail={`${turnedRedRows.length} of ${rows.length} trades that reached +20%`} help="Trades whose total Gross P/L later moved below $0. A later favorable candle or exit may show that the trade recovered." label="Turned red" value={percent(rate(turnedRedRows.length, rows.length))} />
      <Metric detail={`${percent(rate(endedRedRows.length, rows.length))} · ${endedRedRows.length} of ${rows.length} trades`} help="Combined realized Gross loss from trades that reached +20% or more but finished below $0. The percentage uses all trades that reached +20%." label="Finished red" tone={financialOutcomeColor(sum(endedRedRows, (row) => row.finalGrossPnlDecimal))} value={money(sum(endedRedRows, (row) => row.finalGrossPnlDecimal), currency)} />
    </Box>

    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", mb: 1.25 }}>
        <Typography sx={{ fontWeight: 850 }}>Profit opportunity that finished red</Typography>
        <Tooltip arrow title="Percentages in this section use only trades that turned red after reaching +20%. No profit taken and Some profit taken show those that finished red. Recovery also includes trades that recovered but later finished red, so these groups can overlap."><IconButton aria-label="Explain profit opportunity that finished red" size="small" sx={{ color: "text.secondary", p: 0.3 }}><InfoOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
      </Stack>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" } }}>
        <DamagePanel currency={currency} emptyMessage="No trades finished red without taking some profit." rows={noProfitEndedRedRows} title="No profit taken" totalTurnedRed={turnedRedRows.length} />
        <Box sx={{ borderColor: "divider", borderLeft: { md: 1 }, pl: { md: 1.5 } }}><DamagePanel currency={currency} rows={someProfitEndedRedRows} title="Some profit taken" totalTurnedRed={turnedRedRows.length} /></Box>
        <Box sx={{ borderColor: "divider", borderLeft: { md: 1 }, pl: { md: 1.5 } }}>
          <Typography sx={{ fontWeight: 850 }}>Recovered after turning red</Typography>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>{percent(rate(recoveredRows.length, turnedRedRows.length))} · {recoveredRows.length} of {turnedRedRows.length} recovered after turning red</Typography>
          <Stack spacing={0.2} sx={{ mt: 0.4 }}>
            <Typography color="text.secondary" variant="body2">{recoveredFinishedGreenRows.length} finished {recoveredFinishedGreenRows.some((row) => new Decimal(row.finalGrossPnlDecimal).isZero()) ? "green or flat" : "green"} · {money(sum(recoveredFinishedGreenRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
            <Typography color="text.secondary" variant="body2">{recoveredFinishedRedRows.length} recovered but later finished red · {money(sum(recoveredFinishedRedRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
            <Typography color="text.secondary" variant="body2">{turnedRedRows.length - recoveredRows.length} never recovered</Typography>
          </Stack>
        </Box>
      </Box>
    </Paper>

    <Box>
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", mb: 0.75 }}>
        <Typography sx={{ fontWeight: 850 }}>Outcomes by highest profit zone</Typography>
        <Tooltip arrow title="Each trade appears once in the highest 10% price-gain zone it reached while shares were open. These are not cumulative reached-zone totals."><IconButton aria-label="Explain outcomes by highest profit zone" size="small" sx={{ color: "text.secondary", p: 0.3 }}><InfoOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
      </Stack>
      {peakZoneOutcomes.length === 0 ? <Typography color="text.secondary">No trades in this selection reached +20%.</Typography> : <HorizontalScrollRegion label="Highest profit zone outcomes" minTableWidth={1120} stickyFirstColumn>
        <Table size="small"><TableHead><TableRow>
          <TableCell><HelpLabel help="The highest non-overlapping 10% gain zone reached by each trade while shares were open." label="Highest zone" /></TableCell>
          <TableCell align="right"><HelpLabel help="Trades whose highest gain ended in this zone, shown as a count and percentage of all trades that reached +20%." label="Trades" /></TableCell>
          <TableCell align="right"><HelpLabel help="Combined maximum calculated Gross profit opportunity for these trades." label="Profit opportunity" /></TableCell>
          <TableCell align="right"><HelpLabel help="Combined Gross profit realized on profitable exit executions in these trades." label="Profit taken" /></TableCell>
          <TableCell align="right"><HelpLabel help="Trades whose total Gross P/L moved below $0 after first reaching +20%. The percentage uses trades in this row." label="Turned red" /></TableCell>
          <TableCell align="right"><HelpLabel help="Trades that completed below $0. The percentage uses trades in this row." label="Finished red" /></TableCell>
          <TableCell align="right"><HelpLabel help="Combined final Gross P/L for every trade in this row." label="Final Gross P/L" /></TableCell>
          <TableCell align="right"><HelpLabel help="Combined maximum Gross profit opportunity minus combined final Gross P/L." label="Not retained" /></TableCell>
          <TableCell align="right"><HelpLabel help="Middle amount of completed one-minute candle time each trade spent inside its highest zone." label="Median in zone" /></TableCell>
        </TableRow></TableHead><TableBody>{peakZoneOutcomes.map((zone) => <TableRow hover key={zone.lowerBoundPercent}>
          <TableCell sx={{ fontWeight: 850 }}>{zoneLabelFromBounds(zone.lowerBoundPercent, zone.upperBoundPercent)}</TableCell>
          <TableCell align="right"><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">{zone.tradeCount} · {percent(rate(zone.tradeCount, rows.length))}</Typography></TableCell>
          <TableCell align="right" sx={{ color: financialOutcomeColor(zone.profitOpportunityDecimal), fontWeight: 750 }}>{money(zone.profitOpportunityDecimal, currency)}</TableCell>
          <TableCell align="right" sx={{ color: financialOutcomeColor(zone.profitTakenDecimal), fontWeight: 750 }}>{money(zone.profitTakenDecimal, currency)}</TableCell>
          <TableCell align="right">{zone.turnedRedCount} · {percent(rate(zone.turnedRedCount, zone.tradeCount))}</TableCell>
          <TableCell align="right">{zone.endedRedCount} · {percent(rate(zone.endedRedCount, zone.tradeCount))}</TableCell>
          <TableCell align="right" sx={{ color: financialOutcomeColor(zone.finalGrossPnlDecimal), fontWeight: 750 }}>{money(zone.finalGrossPnlDecimal, currency)}</TableCell>
          <TableCell align="right" sx={{ fontWeight: 750 }}>{money(zone.opportunityNotRetainedDecimal, currency)}</TableCell>
          <TableCell align="right">{minutes(zone.medianTimeInZoneMinutes)}</TableCell>
        </TableRow>)}</TableBody></Table>
      </HorizontalScrollRegion>}
    </Box>

    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 0.75 }}>
        <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 850 }}>Exact +20% trade records</Typography>
          <Tooltip arrow title="Every saved analyzed trade that reached +20% is available here. Filter the same exact records by what happened afterward."><IconButton aria-label="Explain exact plus 20 percent trade records" size="small" sx={{ color: "text.secondary", p: 0.3 }}><InfoOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        </Stack>
        <TextField label="Show" onChange={(event) => { setFilter(event.target.value as EvidenceFilter); setPage(1); }} select size="small" sx={{ minWidth: 190 }} value={filter}>
          <MenuItem value="all">All +20% trades</MenuItem>
          <MenuItem value="turned_red">Turned red</MenuItem>
          <MenuItem value="finished_red">Finished red</MenuItem>
          <MenuItem value="recovered">Recovered after red</MenuItem>
        </TextField>
      </Stack>
      {filteredRows.length === 0 ? <Typography color="text.secondary">No trades match this filter.</Typography> : <Stack spacing={1}>
        <HorizontalScrollRegion label="Green-to-red trade records" minTableWidth={1540} stickyFirstColumn>
          <Table size="small"><TableHead><TableRow>
            <TableCell><HelpLabel help="The saved analyzed trade. Multiple executions and round trips remain part of the same trade when the trader grouped them together." label="Trade" /></TableCell>
            <TableCell><HelpLabel help="When an exact exit or a completed one-minute candle first showed a gain of at least 20% while shares remained open." label="Reached +20%" /></TableCell>
            <TableCell align="right"><HelpLabel help="The largest price gain while shares remained open, with the stock price per share and time it occurred." label="Maximum gain" /></TableCell>
            <TableCell><HelpLabel help="The highest non-overlapping 10% gain zone reached and completed one-minute candle time spent in that zone." label="Peak zone" /></TableCell>
            <TableCell><HelpLabel help="The first later completed minute whose adverse price extreme, or an exact exit price, put total trade Gross P/L below $0. Same-candle high/low order is never assumed." label="Turned red" /></TableCell>
            <TableCell align="right"><HelpLabel help="Gross profit realized on profitable exit executions in this trade." label="Profit taken" /></TableCell>
            <TableCell align="right"><HelpLabel help="The trade's completed Gross P/L, without deducting broker fees." label="Final Gross P/L" /></TableCell>
            <TableCell align="right"><HelpLabel help="Maximum Gross profit opportunity minus final Gross P/L. A red finish can make this larger than the earlier profit opportunity." label="Opportunity not retained" /></TableCell>
            <TableCell />
          </TableRow></TableHead><TableBody>{visibleRows.map((row) => <TableRow hover key={row.tradeId}>
            <TableCell><Typography component="div" sx={{ fontWeight: 850 }} variant="body2">{row.symbol}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.closeDate} · {row.executionCount} {row.executionCount === 1 ? "execution" : "executions"}</Typography></TableCell>
            <TableCell><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">{clockTime(row.firstReachedTwentyAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">Held {minutes(row.totalHoldingMinutes)}</Typography></TableCell>
            <TableCell align="right"><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">+{row.maximumGainPercent.toFixed(1)}%</Typography><Typography color="text.secondary" component="div" variant="caption">{money(row.maximumGainPriceDecimal, currency)} per share · {clockTime(row.maximumGainAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">{money(row.maximumGrossProfitOpportunityDecimal, currency)} opportunity</Typography></TableCell>
            <TableCell><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">{zoneLabel(row)}</Typography><Typography color="text.secondary" component="div" variant="caption">{minutes(row.timeInPeakZoneMinutes)}</Typography></TableCell>
            <TableCell>{row.firstRedAfterTwentyAtUtcSeconds === null ? <Typography color="text.secondary" variant="body2">Did not turn red</Typography> : <><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">{clockTime(row.firstRedAfterTwentyAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">{elapsedMinutes(row.firstReachedTwentyAtUtcSeconds, row.firstRedAfterTwentyAtUtcSeconds)} after +20%</Typography><Typography color="text.secondary" component="div" variant="caption">{row.firstRecoveryAfterRedAtUtcSeconds !== null ? `Recovered ${clockTime(row.firstRecoveryAfterRedAtUtcSeconds, timezone)}` : "Never recovered"} · Finished {new Decimal(row.finalGrossPnlDecimal).lt(0) ? "red" : new Decimal(row.finalGrossPnlDecimal).gt(0) ? "green" : "flat"}</Typography></>}</TableCell>
            <TableCell align="right"><Typography component="div" sx={{ color: financialOutcomeColor(row.profitSecuredGrossDecimal), fontWeight: 750 }} variant="body2">{money(row.profitSecuredGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.profitTakingExitCount} profitable {row.profitTakingExitCount === 1 ? "exit" : "exits"}</Typography></TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.finalGrossPnlDecimal), fontWeight: 750 }}>{money(row.finalGrossPnlDecimal, currency)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 750 }}>{money(row.profitOpportunityToFinalDifferenceDecimal, currency)}</TableCell>
            <TableCell><Button disabled={offline} onClick={() => setDetailsTrade(row)} size="small" variant="outlined">Details</Button></TableCell>
          </TableRow>)}</TableBody></Table>
        </HorizontalScrollRegion>
        <TradeAnalyzerTablePagination alwaysVisible onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={currentPage} pageSize={pageSize} rowCount={filteredRows.length} />
      </Stack>}
    </Box>
    <TradeDetailsDrawer analyzer={detailsTrade && currency ? { currency, direction: detailsTrade.direction, executionCount: detailsTrade.executionCount, gainLossDecimal: detailsTrade.finalGrossPnlDecimal, symbol: detailsTrade.symbol, timezone } : null} initialTab="details" onClose={() => setDetailsTrade(null)} open={detailsTrade !== null} roundTripId={detailsTrade?.roundTripId ?? null} />
  </Stack>;
}
