"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";

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
    <AnalyzerHelpTooltip label={label} text={help} />
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
      <Box sx={{ ml: "auto" }}><AnalyzerHelpTooltip label={label} text={help} /></Box>
    </Stack>
    <Typography sx={{ color: tone, fontSize: "1.18rem", fontVariantNumeric: "tabular-nums", fontWeight: 850, lineHeight: 1.25 }}>{value}</Typography>
    <Typography color="text.secondary" sx={{ display: "block", mt: 0.25 }} variant="caption">{detail}</Typography>
  </Paper>;
}

function DamagePanel({
  currency,
  emptyMessage,
  help,
  rows,
  title,
  totalFinishedRed,
}: {
  currency: string | null;
  emptyMessage?: string;
  help: string;
  rows: readonly TradeAnalysisGreenToRedOpportunityRow[];
  title: string;
  totalFinishedRed: number;
}) {
  return <Box>
    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
      <Typography sx={{ fontWeight: 850 }}>{title}</Typography>
      <AnalyzerHelpTooltip label={title} text={help} />
    </Stack>
    <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>
      {percent(rate(rows.length, totalFinishedRed))} · {rows.length} of {totalFinishedRed}
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
  const [filter, setFilter] = useState<EvidenceFilter>("finished_red");
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
  const peakZoneOutcomes = useMemo(() => buildPeakZoneOutcomes(endedRedRows), [endedRedRows]);
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
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
      <Metric detail={`${rows.length} of ${totalTradeCount} completed ${directionLabel} trades`} help="The share price reached a gain of at least 20% compared with the average entry price of the shares still held. For longs, that means a price rise; for shorts, a price drop. No minimum time is required. The percentage uses the analyzed trades in your selected date range and direction." label="Reached +20%" value={percent(rate(rows.length, totalTradeCount))} />
      <Metric detail={`${endedRedRows.length} of ${rows.length} trades that reached +20%`} help="The percentage of trades that reached +20% or more but finished with a Gross loss. Temporary recoveries followed by red finishes are included once." label="Finished red" value={percent(rate(endedRedRows.length, rows.length))} />
      <Metric detail={`From those same ${endedRedRows.length} finished-red trades`} help="Combined Gross profit opportunity from only the trades that reached +20% and finished red. Each amount includes realized P/L plus potential profit on shares still held at that trade's highest percentage gain. Both this card and Actual losses use exactly the same trades." label="Profit opportunity before the loss" value={money(sum(endedRedRows, (row) => row.maximumGrossProfitOpportunityDecimal), currency)} />
      <Metric detail={`${percent(rate(endedRedRows.length, rows.length))} · ${endedRedRows.length} of ${rows.length} trades`} help="The final Gross loss from the same trades shown in Profit opportunity before the loss. This is money actually lost before broker fees. Any earlier profit taken is already included in final P/L; do not subtract it again." label="Actual losses" tone={financialOutcomeColor(sum(endedRedRows, (row) => row.finalGrossPnlDecimal))} value={money(sum(endedRedRows, (row) => row.finalGrossPnlDecimal), currency)} />
    </Box>

    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", mb: 1.25 }}>
        <Typography sx={{ fontWeight: 850 }}>Profit opportunity that finished red</Typography>
        <AnalyzerHelpTooltip label="profit opportunity that finished red" text="Looks only at trades that reached +20% and finished with a Gross loss. The two groups separate them by whether they took any profit: $0 goes in No profit taken; more than $0 goes in Some profit taken. Their percentages use only trades that finished red. Profit opportunity + realized loss adds the earlier opportunity to the size of the final loss. Recovery can be temporary: a trade that recovered and finished red is already counted in the finished-red groups, not an extra trade." />
      </Stack>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}>
        <DamagePanel currency={currency} emptyMessage="No trades finished red without taking some profit." help="Trades that reached +20% but finished with a Gross loss without taking any profit. Their profitable exits total $0. The percentage uses only trades that reached +20% and finished red, not all analyzed trades." rows={noProfitEndedRedRows} title="No profit taken" totalFinishedRed={endedRedRows.length} />
        <Box sx={{ borderColor: "divider", borderLeft: { md: 1 }, pl: { md: 1.5 } }}><DamagePanel currency={currency} help="Trades that reached +20% and took more than $0 in profit, but still finished with a Gross loss overall. Profit taken adds their profitable exits; Final Gross loss includes their losing exits too. Profit may have been taken before or after the trade turned red. The percentage uses only trades that reached +20% and finished red." emptyMessage="No finished-red trades took any profit." rows={someProfitEndedRedRows} title="Some profit taken" totalFinishedRed={endedRedRows.length} /></Box>
    </Box>
    </Paper>

    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: 850 }}>Recovered after turning red</Typography>
            <AnalyzerHelpTooltip label="Recovered after turning red" text="Trades whose total Gross P/L returned above $0 after turning red. The percentage uses all trades that turned red after reaching +20%. Recovery does not mean the trade finished green: the lines below separate those that finished green from those that later finished red again. Those red finishes are already included in the finished-red groups, so do not add them again." />
          </Stack>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>{percent(rate(recoveredRows.length, turnedRedRows.length))} · {recoveredRows.length} of {turnedRedRows.length} recovered after turning red</Typography>
          <Stack spacing={0.2} sx={{ mt: 0.4 }}>
            <Typography color="text.secondary" variant="body2">{recoveredFinishedGreenRows.length} finished {recoveredFinishedGreenRows.some((row) => new Decimal(row.finalGrossPnlDecimal).isZero()) ? "green or flat" : "green"} · {money(sum(recoveredFinishedGreenRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
            <Typography color="text.secondary" variant="body2">{recoveredFinishedRedRows.length} recovered but later finished red · {money(sum(recoveredFinishedRedRows, (row) => row.finalGrossPnlDecimal), currency)}</Typography>
            <Typography color="text.secondary" variant="body2">{turnedRedRows.length - recoveredRows.length} never recovered</Typography>
          </Stack>
        </Paper>
    <Box component="details" sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
      <Box component="summary" sx={{ cursor: "pointer", fontWeight: 850, minHeight: 32, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 } }}>All trades that reached +20%</Box>
      <Typography color="text.secondary" variant="body2" sx={{ my: 1 }}>Broader context across all {rows.length} trades, including those that finished green.</Typography>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" } }}>
      <Metric detail={`Across the ${rows.length} trades that reached +20%`} help="Adds each trade's Gross profit opportunity at its highest percentage gain. Each amount includes profit or loss already realized, plus the potential profit on shares still held at that price. Broker fees are not deducted." label="Profit opportunity" tone={financialOutcomeColor(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal))} value={money(sum(rows, (row) => row.maximumGrossProfitOpportunityDecimal), currency)} />
      <Metric detail={`${profitTakenRows.length} of ${rows.length} trades took some profit`} help="Adds the Gross gains from profitable exits in trades that reached +20%, including partial and full exits. Losing exits are not subtracted here; they are included in Final Gross P/L. A trade counts as taking profit only when it secured more than $0." label="Profit taken" tone={financialOutcomeColor(sum(rows, (row) => row.profitSecuredGrossDecimal))} value={money(sum(rows, (row) => row.profitSecuredGrossDecimal), currency)} />
      <Metric detail={`${turnedRedRows.length} of ${rows.length} trades that reached +20%`} help="Trades that reached +20% and later had a total Gross P/L below $0, including realized P/L and the value of shares still held. Some recovered; others finished red. The percentage uses all trades that reached +20%." label="Turned red" value={percent(rate(turnedRedRows.length, rows.length))} />
      </Box>
    </Box>

    <Box>
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", mb: 0.75 }}>
        <Typography sx={{ fontWeight: 850 }}>Outcomes by highest profit zone</Typography>
        <AnalyzerHelpTooltip label="outcomes by highest profit zone" text="Groups only finished-red trades by the highest percentage gain they reached while shares were held. A trade that peaked at +47% appears only in the 40%–under 50% row, not every lower zone. The final zone includes gains of 100% or more." />
      </Stack>
      {peakZoneOutcomes.length === 0 ? <Typography color="text.secondary">No trades that reached +20% finished red in this selection.</Typography> : <HorizontalScrollRegion label="Highest profit zone outcomes" minTableWidth={940} stickyFirstColumn>
        <Table size="small"><TableHead><TableRow>
          <TableCell><HelpLabel help="The highest gain band the trade reached while shares were held. For example, +30% belongs in 30%–under 40%, not 20%–under 30%. Gains of 100% or more share the top band." label="Highest zone" /></TableCell>
          <TableCell align="right"><HelpLabel help="Finished-red trades whose highest percentage gain was in this band. The percentage uses all finished-red trades that reached +20%. Each trade appears in one row." label="Finished red" /></TableCell>
          <TableCell align="right"><HelpLabel help="Adds these trades' Gross profit opportunities at their highest percentage gains, including realized P/L plus potential profit on shares still held. These are whole-trade amounts, not profit earned only inside this band." label="Profit opportunity" /></TableCell>
          <TableCell align="right"><HelpLabel help="Combined final Gross losses from the same finished-red trades used for this row’s profit opportunity." label="Actual losses" /></TableCell>
          <TableCell align="right"><HelpLabel help="The difference between these trades' combined profit opportunity and their combined final Gross P/L. For example, an $800 opportunity followed by a $300 loss gives a $1,100 difference. It is not $1,100 of profit opportunity." label="Not retained" /></TableCell>
          <TableCell align="right"><HelpLabel help="The middle value when these trades' times in their highest bands are ordered from shortest to longest. Time counts one-minute candle closes inside the band, including returns to it. It does not measure exact seconds spent there." label="Median in zone" /></TableCell>
        </TableRow></TableHead><TableBody>{peakZoneOutcomes.map((zone) => <TableRow hover key={zone.lowerBoundPercent}>
          <TableCell sx={{ fontWeight: 850 }}>{zoneLabelFromBounds(zone.lowerBoundPercent, zone.upperBoundPercent)}</TableCell>
          <TableCell align="right"><Typography component="div" sx={{ fontWeight: 750 }} variant="body2">{zone.tradeCount} · {percent(rate(zone.tradeCount, endedRedRows.length))}</Typography></TableCell>
          <TableCell align="right" sx={{ color: financialOutcomeColor(zone.profitOpportunityDecimal), fontWeight: 750 }}>{money(zone.profitOpportunityDecimal, currency)}</TableCell>
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
          <AnalyzerHelpTooltip label="exact plus 20 percent trade records" text="The individual trades behind the summaries above, within your selected dates and direction. The table opens with Finished red selected. Use Show to inspect all +20% trades, trades that turned red, or recoveries. This filter changes this table only. Details opens the trade on this page." />
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
            <TableCell><HelpLabel help="The trade as you saved it, with its closing date and number of executions. If you grouped several round trips into one trade, they stay together here." label="Trade" /></TableCell>
            <TableCell><HelpLabel help="When a saved one-minute candle or an exit price first showed a gain of at least 20% on the shares held. A candle high or low can qualify; it does not have to close at +20%. Candle times use the end of that minute, not the exact second the price was hit. Held shows the trade's total holding time." label="Reached +20%" /></TableCell>
            <TableCell align="right"><HelpLabel help="The highest percentage gain reached while shares were held, with the share price and time. The dollar opportunity combines realized P/L with the potential profit on shares still held at that price. Candle-based times identify the minute, not the exact second of the peak." label="Maximum gain" /></TableCell>
            <TableCell><HelpLabel help="The band containing the trade's highest percentage gain. Time counts one-minute candle closes inside that band, including later returns. Under 1 min means no full minute was counted there, not that the app measured how many seconds it lasted." label="Peak zone" /></TableCell>
            <TableCell><HelpLabel help="When the trade first went below $0 Gross after reaching +20%, and how long that took. Recovery means it later returned above $0; Finished green or Finished red tells you how it ended. Never recovered means it did not return above $0 afterward in its saved price path. Candle highs and lows from the same minute are not treated as a known sequence." label="Turned red" /></TableCell>
            <TableCell align="right"><HelpLabel help="Gross gains secured through profitable exits in this trade, including partial and full exits. The count is profitable exit executions, not separate trades. $0 means no profit was taken. Losing exits are included in Final Gross P/L." label="Profit taken" /></TableCell>
            <TableCell align="right"><HelpLabel help="The trade's final profit or loss from all its exits, before broker fees. Green is a profit; red is a loss." label="Final Gross P/L" /></TableCell>
            <TableCell align="right"><HelpLabel help="The trade's profit opportunity minus its final Gross P/L. An $800 opportunity and a $300 profit leave a $500 difference. An $800 opportunity and a $300 loss give a $1,100 difference: the opportunity plus the loss." label="Opportunity not retained" /></TableCell>
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
