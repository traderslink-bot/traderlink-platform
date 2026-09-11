"use client";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Decimal from "decimal.js";
import { useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type {
  TradeAnalysisProfitZoneRecord,
  TradeAnalysisProfitZoneSummaryRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { TradeDetailsDrawer } from "../trades/trade-details-drawer";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { boundedPage, paginatedRows, TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";

const ZONE_PAGE_SIZES = Object.freeze([20, 50, 100]);

export function ProfitZoneComparison({ records, rows, currency, timezone, totalTradeCount, offline }: {
  records: readonly TradeAnalysisProfitZoneRecord[];
  rows: readonly TradeAnalysisProfitZoneSummaryRow[];
  currency: string | null;
  timezone: string;
  totalTradeCount: number;
  offline: boolean;
}) {
  const [level, setLevel] = useState<number | null>(20);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailsTrade, setDetailsTrade] = useState<TradeAnalysisProfitZoneRecord | null>(null);
  const groups = useMemo(() => rows.map((zone) => {
    const included = records.filter((record) => record.lowerBoundPercent === zone.lowerBoundPercent &&
      record.comparisonGrossPnlDecimal != null);
    const potential = included.reduce((sum, record) => sum.plus(record.comparisonGrossPnlDecimal!), new Decimal(0));
    const actual = included.reduce((sum, record) => sum.plus(record.finalGrossPnlDecimal), new Decimal(0));
    return { zone, included, potential, actual, difference: potential.minus(actual) };
  }), [records, rows]);
  const selected = groups.find(({ zone }) => zone.lowerBoundPercent === level);
  const selectedRecords = selected?.included ?? [];
  const currentPage = boundedPage(page, selectedRecords.length, pageSize);
  const headings = [
    ["Zone", "Each row asks what your trades could have made if you closed the open shares at the first recorded price inside that band. The same trade can appear in several rows, so do not add the rows together."],
    ["Trades", "How many of your selected trades have a recorded price inside this band. The percentage is out of all selected analyzed trades. Trades must also meet any minimum time at +20% you selected. If the recorded prices skip a band, that trade is not included in its comparison."],
    ["Potential profit", "What the trade could have made by closing all shares still open at the first recorded price inside this band, before fees. Earlier realized gains and losses are included; later buys and re-entries are not. The price comes from a one-minute candle close or an actual exit—not the highest price in the band."],
    ["Actual P/L", "What these same trades actually made or lost before fees, including all their later buys and exits."],
    ["Difference", "Potential profit minus what the trade actually made or lost. A positive number means this exit scenario was higher. A negative number means the actual trade did better."],
  ];
  if (records.some((record) => record.comparisonGrossPnlDecimal === undefined)) {
    return <Typography color="text.secondary">Reconnect to update this comparison.</Typography>;
  }
  return <Stack spacing={1.5}>
    <Typography color="text.secondary" variant="caption">Gross P/L · First recorded price in each zone</Typography>
    <HorizontalScrollRegion label="Potential profit versus actual profit by zone" minTableWidth={740}>
      <Table size="small"><TableHead><TableRow>{headings.map(([label, help]) =>
        <TableCell key={label}><TableHeading label={label!} help={help!} /></TableCell>)}</TableRow></TableHead>
        <TableBody>{groups.map(({ zone, included, potential, actual, difference }) => <TableRow key={zone.lowerBoundPercent} selected={level === zone.lowerBoundPercent}>
          <TableCell><Button size="small" aria-expanded={level === zone.lowerBoundPercent} onClick={() => { setLevel(level === zone.lowerBoundPercent ? null : zone.lowerBoundPercent); setPage(1); }}
            startIcon={<KeyboardArrowDownRoundedIcon sx={{ transform: level === zone.lowerBoundPercent ? "rotate(180deg)" : "none" }} />}>{zoneLabel(zone.lowerBoundPercent, zone.upperBoundPercent)}</Button></TableCell>
          <TableCell><Typography sx={{ fontWeight: 850 }}>{percent(totalTradeCount ? included.length / totalTradeCount * 100 : null)}</Typography><Typography variant="caption" color="text.secondary">{included.length} of {totalTradeCount} trades</Typography></TableCell>
          <TableCell sx={{ fontWeight: 850, color: financialOutcomeColor(currency && included.length ? potential.toFixed() : null) }}>{included.length ? money(potential.toFixed(), currency) : "—"}</TableCell>
          <TableCell sx={{ color: financialOutcomeColor(currency && included.length ? actual.toFixed() : null) }}>{included.length ? money(actual.toFixed(), currency) : "—"}</TableCell>
          <TableCell sx={{ fontWeight: 850, color: financialOutcomeColor(currency && included.length ? difference.toFixed() : null) }}>{included.length ? money(difference.toFixed(), currency) : "—"}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </HorizontalScrollRegion>
    {selected ? <Stack spacing={1}>
      <Typography variant="subtitle2">{zoneLabel(selected.zone.lowerBoundPercent, selected.zone.upperBoundPercent)} · Trade details</Typography>
      {selectedRecords.length === 0 ? <Typography variant="body2" color="text.secondary">No recorded in-band prices for this comparison.</Typography> : <>
        <HorizontalScrollRegion label="Zone exit comparison trade details" minTableWidth={880}>
          <Table size="small"><TableHead><TableRow>{[
            ["Trade", "The trades included in this zone comparison. Each saved trade appears once, even if it contains several buys and sells."],
            ["Price / time", "The price and time used for this trade’s comparison, plus how many shares were still open. This is the first recorded price inside the band. The price is shown in the page’s reporting currency."],
            ...headings.slice(2), ["Details", "Open this trade’s details without leaving the page."],
          ].map(([label, help]) => <TableCell key={label}><TableHeading label={label!} help={help!} /></TableCell>)}</TableRow></TableHead>
            <TableBody>{paginatedRows(selectedRecords, currentPage, pageSize).map((record) => <TableRow key={record.tradeId}>
              <TableCell sx={{ fontWeight: 800 }}>{record.symbol}<Typography variant="caption" component="div" color="text.secondary">{record.closeDate}</Typography></TableCell>
              <TableCell>{money(record.comparisonPriceDecimal, currency)}<Typography variant="caption" component="div" color="text.secondary">{record.comparisonAtUtcSeconds == null ? "Unavailable" : reachTime(record.comparisonAtUtcSeconds, timezone)}</Typography><Typography variant="caption" component="div">{shares(record.comparisonQuantityDecimal)} shares</Typography></TableCell>
              <TableCell sx={{ color: financialOutcomeColor(currency ? record.comparisonGrossPnlDecimal : null) }}>{money(record.comparisonGrossPnlDecimal, currency)}</TableCell>
              <TableCell sx={{ color: financialOutcomeColor(currency ? record.finalGrossPnlDecimal : null) }}>{money(record.finalGrossPnlDecimal, currency)}</TableCell>
              <TableCell sx={{ color: financialOutcomeColor(currency ? new Decimal(record.comparisonGrossPnlDecimal!).minus(record.finalGrossPnlDecimal).toFixed() : null) }}>{money(new Decimal(record.comparisonGrossPnlDecimal!).minus(record.finalGrossPnlDecimal).toFixed(), currency)}</TableCell>
              <TableCell><Button size="small" disabled={offline} onClick={() => setDetailsTrade(record)}>Details</Button></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </HorizontalScrollRegion>
        <TradeAnalyzerTablePagination page={currentPage} pageSize={pageSize} pageSizeOptions={ZONE_PAGE_SIZES} rowCount={selectedRecords.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </>}
    </Stack> : null}
    <TradeDetailsDrawer analyzer={detailsTrade && currency ? { currency, direction: detailsTrade.direction, executionCount: detailsTrade.executionCount, gainLossDecimal: detailsTrade.finalGrossPnlDecimal, symbol: detailsTrade.symbol, timezone } : null} initialTab="details" onClose={() => setDetailsTrade(null)} open={detailsTrade !== null} roundTripId={detailsTrade?.roundTripId ?? null} />
  </Stack>;
}

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
    <AnalyzerHelpTooltip label={label} text={help} />
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
  if (record.firstDropBelowZoneAtUtcSeconds != null) {
    return record.firstRecoveryToZoneAtUtcSeconds != null
      ? `Dropped below +${record.lowerBoundPercent}%; recovered to +${record.lowerBoundPercent}%${record.reachedNextLevel && record.upperBoundPercent !== null ? ` and reached +${record.upperBoundPercent}%` : ""}`
      : `Dropped below +${record.lowerBoundPercent}%; did not recover before closing the position`;
  }
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
  offline,
  records,
  rows,
  timezone,
  totalTradeCount,
}: {
  currency: string | null;
  direction: "long" | "short";
  offline: boolean;
  records: readonly TradeAnalysisProfitZoneRecord[];
  rows: readonly TradeAnalysisProfitZoneSummaryRow[];
  timezone: string;
  totalTradeCount: number;
}) {
  const [expandedLevels, setExpandedLevels] = useState<ReadonlySet<number>>(() => new Set([20]));
  const [detailsTrade, setDetailsTrade] = useState<TradeAnalysisProfitZoneRecord | null>(null);
  const [paginationByLevel, setPaginationByLevel] = useState<Readonly<Record<number, { page: number; pageSize: number }>>>({});
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
        const opportunityOrder = leftTookProfit === 0 && rightTookProfit === 0
          ? new Decimal(right.missedOpportunityGrossDecimal ?? "0").comparedTo(left.missedOpportunityGrossDecimal ?? "0") ||
            new Decimal(right.maximumProfitOpportunityInZoneGrossDecimal).comparedTo(left.maximumProfitOpportunityInZoneGrossDecimal)
          : 0;
        return rightTookProfit - leftTookProfit || opportunityOrder ||
          right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol) ||
          left.tradeId.localeCompare(right.tradeId);
      });
    }
    return grouped;
  }, [records]);
  const entryOrderHelp = direction === "long"
    ? "The time it took the trade to reach this zone from the first buy order."
    : "The time it took the trade to reach this zone from the first short-sale order.";
  const exitAction = direction === "long" ? "selling" : "buying back";
  const exitTypeHelp = `How the trades that took profit here exited. Partial means ${exitAction} shares in stages, including the final exit after an earlier scale-out. Full exit means ${exitAction} the whole position in one order with no earlier scale-out. The percentages split the profit-taking trades, not all trades that reached the zone, and add up to 100% apart from rounding. A trade with both types in this zone is counted under Partial only. Dollars show each group’s profit taken here before fees. Closed here is part of the Partial group: its percentage is out of partial-exit trades, and its dollars are profit from their position-closing exits here.`;
  return <Stack spacing={1.75}>
    <Box sx={{ borderRadius: 2.5 }}>
      <Typography color="text.secondary" sx={{ display: { md: "none" }, mb: 0.5 }} variant="caption">Swipe horizontally to view all columns.</Typography>
      <Box sx={{ overflowX: { xs: "auto", md: "visible" }, pb: { xs: 0.5, md: 0 }, WebkitOverflowScrolling: "touch" }}>
      <Box sx={{ minWidth: { xs: 1200, md: 0 } }}>
      <Box sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        display: "grid",
        gap: 1,
        gridTemplateColumns: "112px 0.8fr 1.03fr 1.03fr 1.14fr 1.06fr 0.84fr",
        position: { xs: "static", md: "sticky" },
        px: 1,
        py: 0.75,
        top: 64,
        zIndex: 2,
      }}>
        {[
          ["Zone", "The gain on shares still open, compared with their average entry price. For example, 20%–29.99% starts at a 20% gain and ends just below 30%. The top band includes gains of 100% or more."],
          ["Reached", "How many of your selected trades reached this zone’s starting gain or higher. The percentage is out of all selected analyzed trades. If you set a minimum time at +20%, the trade must meet it too. A fast move can pass through several levels. Taking partial profit does not remove a trade if shares remain open."],
          ["Profit taken", "Of the trades that reached this zone, how many took some profit inside it. The dollars are the combined profit from those profitable exits, before fees—not the value of the shares sold. A trade can take partial profit here and still continue higher."],
          ["Exit type", exitTypeHelp],
          ["Missed opportunity", "Trades that took no profit in this zone and dropped below it before reaching the next level. The dollars add up their highest potential profit on the shares still open in this zone before that first drop, before fees. The percentage is out of all trades that reached the zone. Recovered means the position returned to this level or higher before it closed. The recovered and never-recovered dollar amounts split that earlier opportunity; they are not the dollars recovered. Any red-loss amount is what those trades finally lost. The same trade can contribute to several zones, so do not add zone totals together."],
          ["Next move", "What happened first to the trades that took no profit here: they reached the next level, dropped below this zone, or closed while still in it. These three percentages are out of the no-profit group and add up to 100%, apart from rounding. A trade can drop first and recover later. A later re-entry does not continue the closed position’s path. Exited in zone does not include trades that took profit here."],
          ["Time in zone", "The middle value of the trades’ total time in this zone, based on one-minute candle closes while shares were open. With an even number of trades, it averages the two middle values. Leaving and returning adds to each trade’s total. This is time inside the band, not time spent above its starting level."],
        ].map(([label, help], index) => <Box
          key={label}
          sx={{
            color: "text.secondary",
            fontSize: "1.1rem",
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
          const pagination = paginationByLevel[row.lowerBoundPercent] ?? { page: 1, pageSize: 20 };
          const currentPage = boundedPage(pagination.page, zoneRecords.length, pagination.pageSize);
          const visibleRecords = paginatedRows(zoneRecords, currentPage, pagination.pageSize);
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
                gridTemplateColumns: "112px 0.8fr 1.03fr 1.03fr 1.14fr 1.06fr 0.84fr",
                minHeight: 78,
                px: 1,
                py: 0.55,
                textAlign: "left",
                width: "100%",
              }}
            >
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", alignSelf: "stretch", bgcolor: { xs: "background.paper", md: "transparent" }, gridArea: "zone", left: 0, position: { xs: "sticky", md: "static" }, zIndex: 1 }}><Box sx={{ alignItems: "center", bgcolor: "action.selected", border: 1, borderColor: "divider", borderRadius: 1.25, color: "primary.main", display: "inline-flex", flexShrink: 0, height: 34, justifyContent: "center", width: 34 }}><KeyboardArrowDownRoundedIcon sx={{ fontSize: 30, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} /></Box><Typography sx={{ fontSize: "0.82rem", fontWeight: 850, lineHeight: 1.08 }}><ZoneRange lower={row.lowerBoundPercent} upper={row.upperBoundPercent} /></Typography></Stack>
              <Box sx={{ gridArea: "reached", pl: 1 }}><Typography color="text.secondary" sx={{ display: "none", fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Reached</Typography><Typography sx={{ fontSize: "0.84rem", fontWeight: 900 }}>{percent(row.reachRatePercent)}</Typography><Typography color="text.secondary" variant="caption">{row.reachedTradeCount} of {totalTradeCount} trades</Typography>{row.upperBoundPercent !== null ? <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.reachedNextTradeCount ?? 0} reached +{row.upperBoundPercent}% · {row.didNotReachNextTradeCount ?? 0} did not</Typography> : null}</Box>
              <Box sx={{ gridArea: "profit" }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{percent(row.tookProfitRateOfReachedPercent)}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.tookProfitTradeCount} of {row.reachedTradeCount} trades</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.tookProfitTradeCount > 0 ? `${shares(row.quantitySoldInZoneDecimal)} profitable shares · ` : ""}{money(row.profitTakenInZoneGrossDecimal, currency)} Gross profit</Typography></Box>
              <Box sx={{ gridArea: "exitType" }}>{row.tookProfitTradeCount > 0 ? <><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Partial exits {percent(row.partialExitShareOfProfitTakingPercent)} · {money(row.partialExitTradeProfitInZoneGrossDecimal, currency)}</Typography>{row.scaledExitClosedTradeCount > 0 ? <Typography color="text.secondary" sx={{ fontSize: "0.62rem", pl: 0.75 }}>↳ Closed here {percent(row.scaledExitClosedRateOfPartialExitTradesPercent)} · {row.scaledExitClosedTradeCount} of {row.partialProfitTradeCount} · {money(row.scaledExitClosingProfitGrossDecimal, currency)}</Typography> : null}<Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Full exits {percent(row.fullExitShareOfProfitTakingPercent)} · {money(row.fullExitOnlyTradeProfitInZoneGrossDecimal, currency)}</Typography></> : <Typography color="text.secondary" variant="caption">No profit-taking exits</Typography>}</Box>
              <Box sx={{ gridArea: "missed" }}>
                {typeof row.missedOpportunityTradeCount !== "number" ? <Typography color="text.secondary" variant="caption">Reconnect to update</Typography> : row.missedOpportunityTradeCount === 0 ? <>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>None</Typography>
                </> : <>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>{money(row.missedOpportunityGrossDecimal, currency)}</Typography>
                  <Typography color="text.secondary" component="div" variant="caption">{percent(row.missedOpportunityRateOfReachedPercent)} · {row.missedOpportunityTradeCount} of {row.reachedTradeCount} trades</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.missedOpportunityRecoveredTradeCount} recovered · {money(row.missedOpportunityRecoveredGrossDecimal, currency)}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.missedOpportunityTradeCount - row.missedOpportunityRecoveredTradeCount} never recovered · {money(row.missedOpportunityNeverRecoveredGrossDecimal, currency)}</Typography>
                  {row.missedOpportunityEndedRedTradeCount > 0 ? <Typography sx={{ color: financialOutcomeColor(row.missedOpportunityEndedRedGrossLossDecimal), fontSize: "0.65rem", fontWeight: 750 }}>{row.missedOpportunityEndedRedTradeCount} later ended red · {money(row.missedOpportunityEndedRedGrossLossDecimal, currency)}</Typography> : null}
                </>}
              </Box>
              <Box sx={{ gridArea: "nextMove" }}>{row.noProfitTradeCount === 0 ? <Typography color="text.secondary" variant="caption">Every trade took profit here</Typography> : <>
                <Typography color="text.secondary" sx={{ fontSize: "0.65rem", fontWeight: 750 }}>No profit here · {percent(row.noProfitRateOfReachedPercent)} · {row.noProfitTradeCount} of {row.reachedTradeCount}</Typography>
                {row.upperBoundPercent === null ? null : <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitReachedNextFirstTradeCount)} reached +{row.upperBoundPercent}% · {percent(row.noProfitReachedNextFirstRatePercent)}</Typography>}
                <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitDroppedBelowFirstTradeCount)} dropped below +{row.lowerBoundPercent}% · {percent(row.noProfitDroppedBelowFirstRatePercent)}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitExitedInZoneTradeCount)} {row.upperBoundPercent === null ? `exited at +${row.lowerBoundPercent}% or higher` : "exited in zone"} · {percent(row.noProfitExitedInZoneRatePercent)}</Typography>
              </>}</Box>
              <Box sx={{ display: "block", gridArea: "time" }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{minutes(row.medianCompletedMinutesInZone)}</Typography><Typography color="text.secondary" variant="caption">median</Typography></Box>
            </ButtonBase>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box id={zoneId} sx={{ bgcolor: "action.hover", border: 1, borderColor: "primary.main", borderRadius: "0 0 12px 12px", borderTop: 0, overflow: "hidden" }}>
                <Typography color="text.secondary" sx={{ px: 1.25, py: 0.85 }} variant="caption">{tradeCount(zoneRecords.length)} reached this zone · Profit-taking trades first, then largest missed opportunities</Typography>
                {zoneRecords.length === 0 ? <Typography color="text.secondary" sx={{ borderTop: 1, borderColor: "divider", p: 1.25 }} variant="body2">No analyzed trades reached this zone in the selected date range.</Typography> : <>
                  <Box sx={{ borderTop: 1, borderColor: "divider", color: "text.secondary", display: "grid", fontSize: { xs: "0.69rem", md: "0.8rem" }, fontWeight: 800, gap: 1, gridTemplateColumns: "minmax(120px, 0.9fr) minmax(220px, 1.55fr) minmax(190px, 1.35fr) minmax(130px, 0.85fr) minmax(105px, 0.7fr) 112px", letterSpacing: "0.035em", px: 1.25, py: 0.65, textTransform: "uppercase" }}>
                    <Box sx={{ bgcolor: { xs: "background.paper", md: "transparent" }, left: 0, position: { xs: "sticky", md: "static" }, zIndex: 2 }}><TableHeading help="The stock and when this trade first reached the zone’s starting gain or higher. The time comes from a one-minute candle close or an actual exit." label="Trade" /></Box>
                    <TableHeading help="Profit taken in this zone and the opportunity for this trade, before fees. Missed opportunity applies when no profit was taken here and the position dropped below the zone before reaching the next level. Otherwise, Zone opportunity shows the calculated open-share profit capped at this band’s top, except for 100%+. Sold so far and shares left are measured after the last exit in this zone, or when the level was first reached if there was no exit here." label="Zone activity" />
                    <TableHeading help="Where this position went after first reaching the level: higher, below the zone, or closed. A drop can be followed by a recovery. Once the position closes, a later re-entry is not counted as its continuation." label="Next move" />
                    <TableHeading help={`${entryOrderHelp} In zone adds up its one-minute candle closes inside this band while shares were open, including returns to the zone.`} label="Timing" />
                    <TableHeading help="What the whole trade finally made or lost before broker fees—not just the profit taken in this zone." label="Final P/L" />
                    <TableHeading help="Open this trade’s details without leaving Scaling Out." label="Details" />
                  </Box>
                  <Stack sx={{ "& > *": { borderTop: 1, borderColor: "divider" } }}>
                    {visibleRecords.map((record) => {
                      const partialProfit = Number(record.partialProfitTakenInZoneGrossDecimal) > 0;
                      const fullExitProfit = Number(record.profitableFullExitInZoneGrossDecimal) > 0;
                      return <Box key={record.tradeId} sx={{ display: "grid", gap: 1, gridTemplateAreas: '"trade activity next timing final details"', gridTemplateColumns: "minmax(120px, 0.9fr) minmax(220px, 1.55fr) minmax(190px, 1.35fr) minmax(130px, 0.85fr) minmax(105px, 0.7fr) 112px", px: 1.25, py: 1 }}>
                        <Box sx={{ bgcolor: { xs: "background.paper", md: "transparent" }, gridArea: "trade", left: 0, position: { xs: "sticky", md: "static" }, zIndex: 1 }}><Typography sx={{ fontWeight: 850 }}>{record.symbol}</Typography><Typography color="text.secondary" variant="caption">Reached {reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography></Box>
                        <Box sx={{ gridArea: "activity" }}>
                          {partialProfit ? <><Typography sx={{ color: financialOutcomeColor(record.partialProfitTakenInZoneGrossDecimal), fontWeight: 800 }} variant="body2">Partial profit · {money(record.partialProfitTakenInZoneGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.partialProfitTakingExitCount} profitable {record.partialProfitTakingExitCount === 1 ? "exit" : "exits"} · {shares(record.quantitySoldInZoneDecimal)} shares in zone</Typography><Typography color="text.secondary" component="div" variant="caption">{partialProfitTiming(record)}</Typography>{record.scaledPositionClosingExitCount > 0 ? <Typography color="text.secondary" component="div" sx={{ fontSize: "0.68rem", fontWeight: 750 }}>Closed remainder here · {money(record.scaledPositionClosingProfitGrossDecimal, currency)}</Typography> : null}</> : fullExitProfit ? <><Typography sx={{ color: financialOutcomeColor(record.profitableFullExitInZoneGrossDecimal), fontWeight: 800 }} variant="body2">Full exit · {money(record.profitableFullExitInZoneGrossDecimal, currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{shares(record.quantitySoldInZoneDecimal)} shares sold in one execution</Typography></> : <Typography sx={{ fontWeight: 800 }} variant="body2">No profit taken</Typography>}
                          <Typography color="text.secondary" component="div" variant="caption">{Number(record.missedOpportunityGrossDecimal) > 0 ? "Missed opportunity" : "Zone opportunity"} · {money(Number(record.missedOpportunityGrossDecimal) > 0 ? record.missedOpportunityGrossDecimal : record.maximumProfitOpportunityInZoneGrossDecimal, currency)}</Typography>
                          <Typography color="text.secondary" component="div" variant="caption">Sold so far · {shares(record.cumulativeQuantitySoldDecimal)} · {shares(record.remainingQuantityAfterZoneActivityDecimal)} left</Typography>
                        </Box>
                        <Box sx={{ gridArea: "next" }}><Typography color="text.secondary" variant="body2">{nextLevelOutcome(record)}</Typography></Box>
                        <Box sx={{ gridArea: "timing" }}><Typography sx={{ fontSize: "0.95rem", fontWeight: 850 }}>In zone · {minutes(record.totalCompletedMinutesInZone)}</Typography><Typography color="text.secondary" component="div" variant="caption">To zone · {minutes(record.minutesFromEntryToFirstReach)}</Typography></Box>
                        <Box sx={{ gridArea: "final" }}><Typography sx={{ color: financialOutcomeColor(record.finalGrossPnlDecimal), fontWeight: 800 }} variant="body2">{money(record.finalGrossPnlDecimal, currency)}</Typography><Typography color="text.secondary" variant="caption">Gross</Typography></Box>
                        <Box sx={{ gridArea: "details" }}><Button disabled={offline} onClick={() => setDetailsTrade(record)} size="small" variant="outlined">Details</Button></Box>
                      </Box>;
                    })}
                  </Stack>
                  <Box sx={{ left: 0, maxWidth: "100%", p: 1.25, position: { xs: "sticky", md: "static" }, width: "fit-content" }}>
                    <TradeAnalyzerTablePagination
                      alwaysVisible
                      onPageChange={(page) => setPaginationByLevel((current) => ({
                        ...current,
                        [row.lowerBoundPercent]: { page, pageSize: pagination.pageSize },
                      }))}
                      onPageSizeChange={(pageSize) => {
                        if (!ZONE_PAGE_SIZES.includes(pageSize)) return;
                        setPaginationByLevel((current) => ({
                          ...current,
                          [row.lowerBoundPercent]: { page: 1, pageSize },
                        }));
                      }}
                      page={currentPage}
                      pageSize={pagination.pageSize}
                      pageSizeOptions={ZONE_PAGE_SIZES}
                      rowCount={zoneRecords.length}
                    />
                  </Box>
                </>}
              </Box>
            </Collapse>
          </Box>;
        })}
      </Stack>
      </Box>
      </Box>
    </Box>
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
