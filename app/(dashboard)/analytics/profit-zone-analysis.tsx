"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
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
    ["Zone", "Each zone is a separate exit scenario. Do not add zone totals together."],
    ["Trades", "Included trades as a percentage of all selected analyzed trades. A recorded price must be inside this exact band; skipped bands are excluded."],
    ["Potential profit", "Gross P/L if all open shares were closed at the first recorded price inside this band, including all earlier realized gains and losses. Later buys and re-entries in the saved trade are excluded. Uses a completed one-minute candle close or an exact exit price, not the highest price in the band."],
    ["Actual P/L", "Final Gross P/L of these exact same saved trades, including their later executions."],
    ["Difference", "Potential profit minus actual P/L. A positive amount means the scenario was higher; a negative amount means the actual trade earned more."],
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
          <TableCell sx={{ fontWeight: 850 }}>{included.length ? money(potential.toFixed(), currency) : "—"}</TableCell>
          <TableCell>{included.length ? money(actual.toFixed(), currency) : "—"}</TableCell>
          <TableCell sx={{ fontWeight: 850 }}>{included.length ? money(difference.toFixed(), currency) : "—"}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </HorizontalScrollRegion>
    {selected ? <Stack spacing={1}>
      <Typography variant="subtitle2">{zoneLabel(selected.zone.lowerBoundPercent, selected.zone.upperBoundPercent)} · Trade details</Typography>
      {selectedRecords.length === 0 ? <Typography variant="body2" color="text.secondary">No recorded in-band prices for this comparison.</Typography> : <>
        <HorizontalScrollRegion label="Zone exit comparison trade details" minTableWidth={880}>
          <Table size="small"><TableHead><TableRow>{[
            ["Trade", "Each saved trade counts once in this zone."],
            ["Price / time", "First recorded price inside the band, its date and time, and shares open before the hypothetical exit. Price uses the displayed reporting currency."],
            ...headings.slice(2), ["Details", "Open the existing Trade Details drawer on this page."],
          ].map(([label, help]) => <TableCell key={label}><TableHeading label={label!} help={help!} /></TableCell>)}</TableRow></TableHead>
            <TableBody>{paginatedRows(selectedRecords, currentPage, pageSize).map((record) => <TableRow key={record.tradeId}>
              <TableCell sx={{ fontWeight: 800 }}>{record.symbol}<Typography variant="caption" component="div" color="text.secondary">{record.closeDate}</Typography></TableCell>
              <TableCell>{money(record.comparisonPriceDecimal, currency)}<Typography variant="caption" component="div" color="text.secondary">{record.comparisonAtUtcSeconds == null ? "Unavailable" : reachTime(record.comparisonAtUtcSeconds, timezone)}</Typography><Typography variant="caption" component="div">{shares(record.comparisonQuantityDecimal)} shares</Typography></TableCell>
              <TableCell>{money(record.comparisonGrossPnlDecimal, currency)}</TableCell>
              <TableCell>{money(record.finalGrossPnlDecimal, currency)}</TableCell>
              <TableCell>{money(new Decimal(record.comparisonGrossPnlDecimal!).minus(record.finalGrossPnlDecimal).toFixed(), currency)}</TableCell>
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
  const exitTypeHelp = direction === "long"
    ? "Tracks how profit-taking trades were exited. Partial = selling under 100% of shares in one execution and the remainder in following executions. Full exit = selling 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone."
    : "Tracks how profitable short trades were exited. Partial = buying back under 100% of shares in one execution and the remainder in following executions. Full exit = buying back 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone.";
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
          ["Zone", "Ten-point gain range."],
          ["Reached", "Share of all analyzed user-defined trades that reached this level. A trade can appear in several zones; scaling out does not remove it while shares remain open and the price reaches a higher zone."],
          ["Profit taken", "Percentage and count of zone-reaching trades with a profitable exit here, plus the profitable shares sold and exact combined Gross profit. A trade can take partial profit and continue into higher zones."],
          ["Exit type", exitTypeHelp],
          ["Missed opportunity", "Trades with no profit taken in this zone that dropped below it before reaching the next zone. Dollars sum each trade's highest potential Gross profit on the shares still open before that first drop. The percentage uses all trades that reached this zone. Recovered means the open position later returned to this zone or higher. Recovered and never-recovered dollars split the total opportunity before the drop; they do not measure how many dollars came back. Later red losses are final Gross P/L from these same missed-opportunity trades. Zone amounts overlap and should not be added together."],
          ["Next move", "All trades that took no profit in this zone, including those that continued higher. No profit here uses all trades that reached the zone. The three movement percentages use only those no-profit trades and total 100%. They describe the first move after reaching the zone; a trade that dropped can later recover."],
          ["Time in zone", "Median completed one-minute candles inside this exact zone."],
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
                    <Box sx={{ bgcolor: { xs: "background.paper", md: "transparent" }, left: 0, position: { xs: "sticky", md: "static" }, zIndex: 2 }}><TableHeading help="Ticker and the date and time this trade first reached the zone." label="Trade" /></Box>
                    <TableHeading help="Profit taken here and this trade's opportunity. Missed opportunity is the highest potential Gross profit before a drop below the zone, when no profit was taken here and the next zone had not yet been reached. Otherwise Zone opportunity is shown. Sold so far and shares left use the last zone exit, or first zone reach when there was no exit." label="Zone activity" />
                    <TableHeading help="Where this trade moved after reaching the zone: into the next zone, below this zone, or out of the position." label="Next move" />
                    <TableHeading help={`${entryOrderHelp} Also shows the trade's total active time inside this exact zone.`} label="Timing" />
                    <TableHeading help="Completed trade profit or loss before broker fees." label="Final P/L" />
                    <TableHeading help="Open the complete Trade Details drawer without leaving Scaling Out." label="Details" />
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
