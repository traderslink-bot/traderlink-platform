"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type {
  TradeAnalysisProfitZoneRecord,
  TradeAnalysisProfitZoneSummaryRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { TradeDetailsDrawer } from "../trades/trade-details-drawer";

const PROFIT_ZONE_HOLD_PRESETS = Object.freeze([0, 1, 2, 5, 10, 15]);

function money(value: string | null | undefined, currency: string | null): string {
  if (value === null || value === undefined || currency === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value));
}

function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? "Unavailable" : `${value.toFixed(1)}%`;
}

function minutes(value: number | null): string {
  if (value === null) return "Unavailable";
  if (value < 1) return "Under 1 min";
  return `${value.toFixed(value < 10 ? 1 : 0)} min`;
}

function zoneLabel(lower: number, upper: number | null): string {
  return upper === null ? `${lower}% or more` : `${lower}%–${(upper - 0.01).toFixed(2)}%`;
}

function ZoneRange({ lower, upper }: { lower: number; upper: number | null }) {
  if (upper === null) return <>{lower}%<br />or more</>;
  return <>{lower}%–<br />{(upper - 0.01).toFixed(2)}%</>;
}

function tradeCount(count: number): string {
  return `${count} ${count === 1 ? "trade" : "trades"}`;
}

function shares(value: string | null | undefined): string {
  if (value === null || value === undefined) return "Unavailable";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(Number(value));
}

function TableHeading({
  help,
  label,
}: {
  help: string;
  label: string;
}) {
  return <Stack
    component="span"
    direction="row"
    spacing={0.25}
    sx={{ alignItems: "center", justifyContent: "flex-start" }}
  >
    <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit" }}>{label}</Typography>
    <Tooltip arrow title={help}>
      <IconButton aria-label={`Explain ${label}`} size="small" sx={{ color: "text.secondary", p: 0.25 }}>
        <InfoOutlinedIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Tooltip>
  </Stack>;
}

function reachTime(seconds: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(new Date(seconds * 1000));
}

function nextLevelOutcome(record: TradeAnalysisProfitZoneRecord): string {
  if (record.upperBoundPercent === null) return "Reached 100% or more";
  if (record.reachedNextLevel && record.observedOutcome === "dropped_before_next") {
    return `Dropped below +${record.lowerBoundPercent}%, then reached +${record.upperBoundPercent}%`;
  }
  if (record.reachedNextLevel) return `Reached +${record.upperBoundPercent}%`;
  if (record.observedOutcome === "dropped_before_next") {
    return `Dropped below +${record.lowerBoundPercent}%; did not reach +${record.upperBoundPercent}%`;
  }
  return `Exited before +${record.upperBoundPercent}%`;
}

function partialProfitTiming(record: TradeAnalysisProfitZoneRecord): string {
  const before = Number(record.partialProfitTakenBeforeNextGrossDecimal) > 0;
  const after = Number(record.partialProfitTakenAfterNextGrossDecimal) > 0;
  if (!before && !after) return "No partial profit";
  if (record.upperBoundPercent === null) return "Partial profit in top zone";
  if (before && after) return `Before and after reaching +${record.upperBoundPercent}%`;
  if (after) return `After reaching +${record.upperBoundPercent}%`;
  return record.reachedNextLevel
    ? `Before reaching +${record.upperBoundPercent}%`
    : `Partial profit; did not reach +${record.upperBoundPercent}%`;
}

export function ProfitZoneAnalysis({
  currency,
  direction,
  minimumHoldMinutes,
  onMinimumHoldMinutesChange,
  offline,
  records,
  rows,
  timezone,
  totalTradeCount,
}: {
  currency: string | null;
  direction: "long" | "short";
  minimumHoldMinutes: number;
  onMinimumHoldMinutesChange: (minutes: number) => void;
  offline: boolean;
  records: readonly TradeAnalysisProfitZoneRecord[];
  rows: readonly TradeAnalysisProfitZoneSummaryRow[];
  timezone: string;
  totalTradeCount: number;
}) {
  const [expandedLevels, setExpandedLevels] = useState<ReadonlySet<number>>(() => new Set([20]));
  const [detailsTrade, setDetailsTrade] = useState<TradeAnalysisProfitZoneRecord | null>(null);
  const [holdSelection, setHoldSelection] = useState(() =>
    PROFIT_ZONE_HOLD_PRESETS.includes(minimumHoldMinutes) ? String(minimumHoldMinutes) : "custom");
  const [customHoldMinutes, setCustomHoldMinutes] = useState(() =>
    String(PROFIT_ZONE_HOLD_PRESETS.includes(minimumHoldMinutes) ? 20 : minimumHoldMinutes));
  const recordsByLevel = useMemo(() => {
    const grouped = new Map<number, TradeAnalysisProfitZoneRecord[]>();
    for (const record of records) {
      const group = grouped.get(record.lowerBoundPercent) ?? [];
      group.push(record);
      grouped.set(record.lowerBoundPercent, group);
    }
    for (const group of grouped.values()) {
      group.sort((left, right) => {
        const leftTookProfit = Number(left.profitTakenInZoneGrossDecimal) > 0 ? 1 : 0;
        const rightTookProfit = Number(right.profitTakenInZoneGrossDecimal) > 0 ? 1 : 0;
        return rightTookProfit - leftTookProfit ||
          right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol);
      });
    }
    return grouped;
  }, [records]);
  const entryOrderHelp = direction === "long"
    ? "The time it took the trade to reach this zone from the first buy order."
    : "The time it took the trade to reach this zone from the first short-sale order.";
  const exitTypeHelp = direction === "long"
    ? "Tracks how profit-taking trades were exited. Partial = selling under 100% of shares in one execution and the remainder in following executions. Full exit = selling 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone."
    : "Tracks how profitable short trades were exited. Partial = buying back under 100% of shares in one execution and the remainder in following executions. Full exit = buying back 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone.";
  const customHoldValue = Number(customHoldMinutes);
  const requestedHoldMinutes = holdSelection === "custom" ? customHoldValue : Number(holdSelection);
  const validHoldSelection = Number.isSafeInteger(requestedHoldMinutes) &&
    requestedHoldMinutes >= (holdSelection === "custom" ? 1 : 0) && requestedHoldMinutes <= 120;
  const qualifyingTradeCount = rows.find((row) => row.lowerBoundPercent === 20)?.reachedTradeCount ?? 0;
  const qualificationSummary = minimumHoldMinutes === 0
    ? `${qualifyingTradeCount} of ${totalTradeCount} analyzed trades reached +20% or higher.`
    : `${qualifyingTradeCount} of ${totalTradeCount} analyzed trades held +20% or higher for at least ${minimumHoldMinutes} consecutive ${minimumHoldMinutes === 1 ? "minute" : "minutes"}.`;
  return <Stack spacing={1.75}>
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 1, sm: 1.25 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between", mb: 0.75 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ fontWeight: 850 }}>Profit zones</Typography>
            <Typography color="text.secondary" component="div" variant="caption">{qualificationSummary}</Typography>
          </Box>
          <Tooltip arrow title={`This page uses ${totalTradeCount} analyzed user-defined ${direction} trades. A trade counts once even when it contains several entries, partial exits, full exits or re-entries. Profit-taking and missed-opportunity percentages use only the trades that reached that zone. The partial/full breakdown uses only trades that took profit and always totals 100%: a trade that scaled out in the band is shown under Partial exits; an entire position sold in one order with no earlier scale-out is shown under Full exits.`}>
            <IconButton aria-label="Explain profit zones" size="small" sx={{ color: "text.secondary", ml: 0.25, p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
          </Tooltip>
        </Stack>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <TextField
            disabled={offline}
            label="Minimum time at +20%"
            onChange={(event) => setHoldSelection(event.target.value)}
            select
            size="small"
            sx={{ minWidth: 205 }}
            value={holdSelection}
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
          {holdSelection === "custom" ? <TextField
            disabled={offline}
            error={!validHoldSelection}
            helperText={!validHoldSelection ? "Enter 1–120" : undefined}
            label="Minutes"
            onChange={(event) => setCustomHoldMinutes(event.target.value)}
            size="small"
            slotProps={{ htmlInput: { max: 120, min: 1, step: 1 } }}
            sx={{ width: 112 }}
            type="number"
            value={customHoldMinutes}
          /> : null}
          <Button
            disabled={offline || !validHoldSelection || requestedHoldMinutes === minimumHoldMinutes}
            onClick={() => onMinimumHoldMinutesChange(requestedHoldMinutes)}
            size="small"
            variant="outlined"
          >Update</Button>
        </Box>
      </Stack>
      <Typography color="text.secondary" sx={{ display: { md: "none" }, mb: 0.5 }} variant="caption">Swipe horizontally to view all columns.</Typography>
      <Box sx={{ overflowX: { xs: "auto", md: "visible" }, pb: { xs: 0.5, md: 0 }, WebkitOverflowScrolling: "touch" }}>
      <Box sx={{ minWidth: { xs: 1040, md: 0 } }}>
      <Box sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        display: "grid",
        gap: 1,
        gridTemplateColumns: "78px 0.72fr 1.02fr 1.02fr 1.18fr 1.35fr 0.65fr",
        position: { xs: "static", md: "sticky" },
        px: 1,
        py: 0.75,
        top: 64,
        zIndex: 2,
      }}>
        {[
          ["Zone", "Ten-point gain range."],
          ["Reached", "Share of all analyzed user-defined trades that reached this level. A trade can appear in several zones; scaling out does not remove it while shares remain open and the price reaches a higher zone."],
          ["Profit taken", "Percentage and count of zone-reaching trades with a profitable exit here, plus the profitable shares sold and exact combined Gross profit. A trade can take partial profit and continue into higher zones."],
          ["Exit type", exitTypeHelp],
          ["Missed opportunity", "Trades that reached this zone but had no profitable exit in it. The large amount is their combined highest Gross profit opportunity on the remaining shares in this exact zone. Later red losses are final Gross P/L from that no-profit group."],
          ["Next move", "What happened first after a trade took no profit in this zone: it reached the next zone, dropped below this zone or exited here. Counts and percentages use only the no-profit trades and total 100%."],
          ["Time in zone", "Median completed one-minute candles inside this exact zone."],
        ].map(([label, help], index) => <Box
          key={label}
          sx={{
            color: "text.secondary",
            fontSize: "0.69rem",
            fontWeight: 800,
            letterSpacing: "0.035em",
            pl: index === 1 ? 1 : 0,
            ...(index === 0 ? {
              bgcolor: { xs: "background.paper", md: "transparent" },
              left: 0,
              position: { xs: "sticky", md: "static" },
              zIndex: 3,
            } : {}),
            textTransform: "uppercase",
          }}
        ><TableHeading help={help} label={label} /></Box>)}
      </Box>
      <Stack spacing={0.5}>
        {[...rows].reverse().map((row) => {
          const zoneIndex = rows.findIndex((candidate) => candidate.lowerBoundPercent === row.lowerBoundPercent);
          const hue = 210 - Math.max(0, zoneIndex) * 19;
          const isExpanded = expandedLevels.has(row.lowerBoundPercent);
          const zoneRecords = recordsByLevel.get(row.lowerBoundPercent) ?? [];
          const zoneId = `profit-zone-trades-${row.lowerBoundPercent}`;
          return <Box key={row.lowerBoundPercent}>
            <ButtonBase
              aria-controls={zoneId}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Hide" : "Show"} trades that reached ${zoneLabel(row.lowerBoundPercent, row.upperBoundPercent)}`}
              onClick={() => setExpandedLevels((current) => {
                const next = new Set(current);
                if (next.has(row.lowerBoundPercent)) next.delete(row.lowerBoundPercent);
                else next.add(row.lowerBoundPercent);
                return next;
              })}
              sx={{
                background: (theme) => `linear-gradient(90deg, hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.06), hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.16))`,
                border: 1,
                borderColor: isExpanded ? "primary.main" : "divider",
                borderRadius: isExpanded ? "12px 12px 0 0" : 1.5,
                display: "grid",
                gap: 1,
                gridTemplateAreas: '"zone reached profit exitType missed nextMove time"',
                gridTemplateColumns: "78px 0.72fr 1.02fr 1.02fr 1.18fr 1.35fr 0.65fr",
                minHeight: 78,
                px: 1,
                py: 0.55,
                textAlign: "left",
                width: "100%",
              }}
            >
              <Stack direction="row" spacing={0.2} sx={{ alignItems: "center", alignSelf: "stretch", bgcolor: { xs: "background.paper", md: "transparent" }, gridArea: "zone", left: 0, position: { xs: "sticky", md: "static" }, zIndex: 1 }}><KeyboardArrowDownRoundedIcon sx={{ flexShrink: 0, fontSize: 18, transform: isExpanded ? "none" : "rotate(-90deg)", transition: "transform 150ms ease" }} /><Typography sx={{ fontSize: "0.82rem", fontWeight: 850, lineHeight: 1.08 }}><ZoneRange lower={row.lowerBoundPercent} upper={row.upperBoundPercent} /></Typography></Stack>
              <Box sx={{ gridArea: "reached", pl: 1 }}><Typography color="text.secondary" sx={{ display: "none", fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Reached</Typography><Typography sx={{ fontSize: "0.84rem", fontWeight: 900 }}>{percent(row.reachRatePercent)}</Typography><Typography color="text.secondary" variant="caption">{row.reachedTradeCount} of {totalTradeCount} trades</Typography>{row.upperBoundPercent !== null ? <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.reachedNextTradeCount ?? 0} reached +{row.upperBoundPercent}% · {row.didNotReachNextTradeCount ?? 0} did not</Typography> : null}</Box>
              <Box sx={{ gridArea: "profit" }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{percent(row.tookProfitRateOfReachedPercent)}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.tookProfitTradeCount} of {row.reachedTradeCount} trades</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.tookProfitTradeCount > 0 ? `${shares(row.quantitySoldInZoneDecimal)} profitable shares · ` : ""}{money(row.profitTakenInZoneGrossDecimal, currency)} Gross profit</Typography></Box>
              <Box sx={{ gridArea: "exitType" }}>{row.tookProfitTradeCount > 0 ? <><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Partial exits {percent(row.partialExitShareOfProfitTakingPercent)} · {money(row.partialExitTradeProfitInZoneGrossDecimal, currency)}</Typography>{row.scaledExitClosedTradeCount > 0 ? <Typography color="text.secondary" sx={{ fontSize: "0.62rem", pl: 0.75 }}>↳ Closed here {percent(row.scaledExitClosedRateOfPartialExitTradesPercent)} · {row.scaledExitClosedTradeCount} of {row.partialProfitTradeCount} · {money(row.scaledExitClosingProfitGrossDecimal, currency)}</Typography> : null}<Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Full exits {percent(row.fullExitShareOfProfitTakingPercent)} · {money(row.fullExitOnlyTradeProfitInZoneGrossDecimal, currency)}</Typography></> : <Typography color="text.secondary" variant="caption">No profit-taking exits</Typography>}</Box>
              <Box sx={{ gridArea: "missed" }}>{row.noProfitTradeCount === 0 ? <><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>None</Typography><Typography color="text.secondary" variant="caption">Every reached trade took profit here</Typography></> : <><Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>{money(row.noProfitMaximumOpportunityGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">No profit in {percent(row.noProfitRateOfReachedPercent)} · {row.noProfitTradeCount} of {row.reachedTradeCount}</Typography>{row.noProfitEndedRedTradeCount > 0 ? <Typography sx={{ color: financialOutcomeColor(row.noProfitEndedRedGrossLossDecimal), fontSize: "0.65rem", fontWeight: 750 }}>{row.noProfitEndedRedTradeCount} later ended red · {money(row.noProfitEndedRedGrossLossDecimal, currency)}</Typography> : null}</>}</Box>
              <Box sx={{ gridArea: "nextMove" }}>{row.noProfitTradeCount === 0 ? <Typography color="text.secondary" variant="caption">No no-profit trades</Typography> : <>{row.upperBoundPercent === null ? null : <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitReachedNextFirstTradeCount)} reached +{row.upperBoundPercent}% · {percent(row.noProfitReachedNextFirstRatePercent)}</Typography>}<Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitDroppedBelowFirstTradeCount)} dropped below +{row.lowerBoundPercent}% · {percent(row.noProfitDroppedBelowFirstRatePercent)}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitExitedInZoneTradeCount)} {row.upperBoundPercent === null ? `exited at +${row.lowerBoundPercent}% or higher` : "exited in zone"} · {percent(row.noProfitExitedInZoneRatePercent)}</Typography></>}</Box>
              <Box sx={{ display: "block", gridArea: "time" }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{minutes(row.medianCompletedMinutesInZone)}</Typography><Typography color="text.secondary" variant="caption">median</Typography></Box>
            </ButtonBase>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box id={zoneId} sx={{ bgcolor: "action.hover", border: 1, borderColor: "primary.main", borderRadius: "0 0 12px 12px", borderTop: 0, overflow: "hidden" }}>
                <Typography color="text.secondary" sx={{ px: 1.25, py: 0.85 }} variant="caption">{tradeCount(zoneRecords.length)} reached this zone · Profit-taking trades are listed first</Typography>
                {zoneRecords.length === 0 ? <Typography color="text.secondary" sx={{ borderTop: 1, borderColor: "divider", p: 1.25 }} variant="body2">No analyzed trades reached this zone in the selected date range.</Typography> : <>
                  <Box sx={{ borderTop: 1, borderColor: "divider", color: "text.secondary", display: "grid", fontSize: { xs: "0.69rem", md: "0.8rem" }, fontWeight: 800, gap: 1, gridTemplateColumns: "minmax(120px, 0.9fr) minmax(220px, 1.55fr) minmax(190px, 1.35fr) minmax(130px, 0.85fr) minmax(105px, 0.7fr) 112px", letterSpacing: "0.035em", px: 1.25, py: 0.65, textTransform: "uppercase" }}>
                    <Box sx={{ bgcolor: { xs: "background.paper", md: "transparent" }, left: 0, position: { xs: "sticky", md: "static" }, zIndex: 2 }}><TableHeading help="Ticker and the date and time this trade first reached the zone." label="Trade" /></Box>
                    <TableHeading help="Profit taken in this exact zone, the trade's individual maximum Gross opportunity here, cumulative shares sold through its last exit in this zone and shares left after that exit. With no zone exit, the share snapshot is taken when the trade first reached the zone." label="Zone activity" />
                    <TableHeading help="Where this trade moved after reaching the zone: into the next zone, below this zone, or out of the position." label="Next move" />
                    <TableHeading help={`${entryOrderHelp} Also shows the trade's total active time inside this exact zone.`} label="Timing" />
                    <TableHeading help="Completed trade profit or loss before broker fees." label="Final P/L" />
                    <TableHeading help="Open the complete Trade Details drawer without leaving Scaling Out." label="Details" />
                  </Box>
                  <Stack sx={{ "& > *": { borderTop: 1, borderColor: "divider" } }}>
                    {zoneRecords.map((record) => {
                      const partialProfit = Number(record.partialProfitTakenInZoneGrossDecimal) > 0;
                      const fullExitProfit = Number(record.profitableFullExitInZoneGrossDecimal) > 0;
                      return <Box key={record.tradeId} sx={{ display: "grid", gap: 1, gridTemplateAreas: '"trade activity next timing final details"', gridTemplateColumns: "minmax(120px, 0.9fr) minmax(220px, 1.55fr) minmax(190px, 1.35fr) minmax(130px, 0.85fr) minmax(105px, 0.7fr) 112px", px: 1.25, py: 1 }}>
                        <Box sx={{ bgcolor: { xs: "background.paper", md: "transparent" }, gridArea: "trade", left: 0, position: { xs: "sticky", md: "static" }, zIndex: 1 }}><Typography sx={{ fontWeight: 850 }}>{record.symbol}</Typography><Typography color="text.secondary" variant="caption">Reached {reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography></Box>
                        <Box sx={{ gridArea: "activity" }}>
                          {partialProfit ? <><Typography sx={{ color: financialOutcomeColor(record.partialProfitTakenInZoneGrossDecimal), fontWeight: 800 }} variant="body2">Partial profit · {money(record.partialProfitTakenInZoneGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.partialProfitTakingExitCount} profitable {record.partialProfitTakingExitCount === 1 ? "exit" : "exits"} · {shares(record.quantitySoldInZoneDecimal)} shares in zone</Typography><Typography color="text.secondary" component="div" variant="caption">{partialProfitTiming(record)}</Typography>{record.scaledPositionClosingExitCount > 0 ? <Typography color="text.secondary" component="div" sx={{ fontSize: "0.68rem", fontWeight: 750 }}>Closed remainder here · {money(record.scaledPositionClosingProfitGrossDecimal, currency)}</Typography> : null}</> : fullExitProfit ? <><Typography sx={{ color: financialOutcomeColor(record.profitableFullExitInZoneGrossDecimal), fontWeight: 800 }} variant="body2">Full exit · {money(record.profitableFullExitInZoneGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{shares(record.quantitySoldInZoneDecimal)} shares sold in one execution</Typography></> : <Typography sx={{ fontWeight: 800 }} variant="body2">No profit taken</Typography>}
                          <Typography color="text.secondary" component="div" variant="caption">{partialProfit || fullExitProfit ? "Zone opportunity" : "Missed opportunity"} · {money(record.maximumProfitOpportunityInZoneGrossDecimal, currency)}</Typography>
                          <Typography color="text.secondary" component="div" variant="caption">Sold so far · {shares(record.cumulativeQuantitySoldDecimal)} · {shares(record.remainingQuantityAfterZoneActivityDecimal)} left</Typography>
                        </Box>
                        <Box sx={{ gridArea: "next" }}><Typography color="text.secondary" variant="body2">{nextLevelOutcome(record)}</Typography></Box>
                        <Box sx={{ gridArea: "timing" }}><Typography variant="body2">To zone · {minutes(record.minutesFromEntryToFirstReach)}</Typography><Typography color="text.secondary" component="div" variant="caption">In zone · {minutes(record.totalCompletedMinutesInZone)}</Typography></Box>
                        <Box sx={{ gridArea: "final" }}><Typography sx={{ color: financialOutcomeColor(record.finalGrossPnlDecimal), fontWeight: 800 }} variant="body2">{money(record.finalGrossPnlDecimal, currency)}</Typography><Typography color="text.secondary" variant="caption">Gross</Typography></Box>
                        <Box sx={{ gridArea: "details" }}><Button disabled={offline} onClick={() => setDetailsTrade(record)} size="small" variant="outlined">Details</Button></Box>
                      </Box>;
                    })}
                  </Stack>
                </>}
              </Box>
            </Collapse>
          </Box>;
        })}
      </Stack>
      </Box>
      </Box>
    </Paper>
    <TradeDetailsDrawer
      analyzer={detailsTrade && currency ? {
        currency,
        direction: detailsTrade.direction,
        executionCount: detailsTrade.executionCount,
        gainLossDecimal: detailsTrade.finalGrossPnlDecimal,
        symbol: detailsTrade.symbol,
        timezone,
      } : null}
      initialTab="details"
      onClose={() => setDetailsTrade(null)}
      open={detailsTrade !== null}
      roundTripId={detailsTrade?.roundTripId ?? null}
    />
  </Stack>;
}
