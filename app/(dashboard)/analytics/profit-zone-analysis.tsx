"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
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
import { useMemo, useState } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type {
  TradeAnalysisProfitZoneRecord,
  TradeAnalysisProfitZoneSummaryRow,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";

import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import {
  boundedPage,
  paginatedRows,
  TradeAnalyzerTablePagination,
} from "./trade-analyzer-table-pagination";

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
  const firstReachedLevel = rows.find((row) => row.reachedTradeCount > 0)?.lowerBoundPercent ?? 20;
  const [selectedLevel, setSelectedLevel] = useState(firstReachedLevel);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const selectedRow = rows.find((row) => row.lowerBoundPercent === selectedLevel) ?? rows[0] ?? null;
  const selectedRecords = useMemo(() => records.filter((record) =>
    record.lowerBoundPercent === selectedLevel), [records, selectedLevel]);
  const currentPage = boundedPage(page, selectedRecords.length, pageSize);
  const visibleRecords = paginatedRows(selectedRecords, currentPage, pageSize);
  const entryOrderHelp = direction === "long"
    ? "The time it took the trade to reach this zone from the first buy order."
    : "The time it took the trade to reach this zone from the first short-sale order.";
  const partialProfitHelp = direction === "long"
    ? "Gross profit secured through a scaled exit sequence in this zone. The row identifies when a later sell closed the remaining position here."
    : "Gross profit secured through a scaled cover sequence in this zone. The row identifies when a later buy-to-cover closed the remaining position here.";
  const fullExitProfitHelp = direction === "long"
    ? "You fully exited your position with one sell order."
    : "You fully exited your short position with one buy-to-cover order.";
  const exitTypeHelp = direction === "long"
    ? "Tracks how profit-taking trades were exited. Partial = selling under 100% of shares in one execution and the remainder in following executions. Full exit = selling 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone."
    : "Tracks how profitable short trades were exited. Partial = buying back under 100% of shares in one execution and the remainder in following executions. Full exit = buying back 100% of shares in one execution with no earlier scale-out. The indented percentage and count show partial-exit trades whose remaining position also closed in this zone.";
  const largestMissedOpportunity = rows.reduce<TradeAnalysisProfitZoneSummaryRow | null>((largest, row) => {
    if (row.noProfitTradeCount === 0 || Number(row.noProfitMaximumOpportunityGrossDecimal) <= 0) return largest;
    if (!largest || Number(row.noProfitMaximumOpportunityGrossDecimal) >
        Number(largest.noProfitMaximumOpportunityGrossDecimal)) return row;
    return largest;
  }, null);
  const longestMedianZone = rows.reduce<TradeAnalysisProfitZoneSummaryRow | null>((longest, row) => {
    if (row.reachedTradeCount === 0 || row.medianCompletedMinutesInZone === null) return longest;
    if (!longest || row.medianCompletedMinutesInZone > (longest.medianCompletedMinutesInZone ?? -1)) return row;
    return longest;
  }, null);

  return <Stack spacing={1.75}>
    {largestMissedOpportunity || longestMedianZone ? <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 1.25 }}>
      <Typography sx={{ fontWeight: 850, mb: 0.75 }}>Profit zone highlights</Typography>
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
        {largestMissedOpportunity ? <Box>
          <Typography color="text.secondary" variant="caption">Largest missed opportunity</Typography>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 900 }}>{money(largestMissedOpportunity.noProfitMaximumOpportunityGrossDecimal, currency)}</Typography>
          <Typography color="text.secondary" variant="body2">{zoneLabel(largestMissedOpportunity.lowerBoundPercent, largestMissedOpportunity.upperBoundPercent)} · {tradeCount(largestMissedOpportunity.noProfitTradeCount)} took no profit</Typography>
        </Box> : null}
        {longestMedianZone ? <Box>
          <Typography color="text.secondary" variant="caption">Longest median time in a zone</Typography>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 900 }}>{minutes(longestMedianZone.medianCompletedMinutesInZone)}</Typography>
          <Typography color="text.secondary" variant="body2">{zoneLabel(longestMedianZone.lowerBoundPercent, longestMedianZone.upperBoundPercent)} · {tradeCount(longestMedianZone.reachedTradeCount)}</Typography>
        </Box> : null}
      </Box>
    </Paper> : null}
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 1, sm: 1.25 } }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 0.75 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Profit zones</Typography>
          <Typography color="text.secondary" variant="caption">Each trade is counted once · Rates use only trades that reached the zone</Typography>
        </Box>
        <Tooltip arrow title={`This page uses ${totalTradeCount} analyzed user-defined ${direction} trades. A trade counts once even when it contains several entries, partial exits, full exits or re-entries. Profit-taking and missed-opportunity percentages use only the trades that reached that zone. The partial/full breakdown uses only trades that took profit and always totals 100%: a trade that scaled out in the band is shown under Partial exits; an entire position sold in one order with no earlier scale-out is shown under Full exits.`}>
          <IconButton aria-label="Explain profit zones" size="small" sx={{ color: "text.secondary", ml: 0.25, p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: "78px 0.72fr 1.02fr 1.02fr 1.18fr 1.35fr 0.65fr", px: 1, pb: 0.5 }}>
        {[
          ["Zone", "Ten-point gain range."],
          ["Reached", "Share of all analyzed user-defined trades that reached this level. A trade can appear in several zones; scaling out does not remove it while shares remain open and the price reaches a higher zone."],
          ["Profit taken", "Percentage and count of zone-reaching trades with a profitable exit here, plus the profitable shares sold and exact combined Gross profit. A trade can take partial profit and continue into higher zones."],
          ["Exit type", exitTypeHelp],
          ["Missed opportunity", "Trades that reached this zone but had no profitable exit in it. The large amount is their combined highest Gross profit opportunity on the remaining shares in this exact zone. Later red losses are final Gross P/L from that no-profit group."],
          ["Next move", "What happened first after a trade took no profit in this zone: it reached the next zone, dropped below this zone or exited here. Counts and percentages use only the no-profit trades and total 100%."],
          ["Time in zone", "Median completed one-minute candles inside this exact zone."],
        ].map(([label, help], index) => <Tooltip arrow key={label} title={help}><Typography color="text.secondary" sx={{ fontSize: "0.69rem", fontWeight: 800, letterSpacing: "0.035em", pl: index === 1 ? 1 : 0, textTransform: "uppercase" }}>{label}</Typography></Tooltip>)}
      </Box>
      <Stack spacing={0.5}>
        {[...rows].reverse().map((row) => {
          const zoneIndex = rows.findIndex((candidate) => candidate.lowerBoundPercent === row.lowerBoundPercent);
          const hue = 210 - Math.max(0, zoneIndex) * 19;
          return <ButtonBase
            aria-label={`Show exact trades that reached ${zoneLabel(row.lowerBoundPercent, row.upperBoundPercent)}`}
            key={row.lowerBoundPercent}
            onClick={() => { setSelectedLevel(row.lowerBoundPercent); setPage(1); }}
            sx={{
              background: (theme) => `linear-gradient(90deg, hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.06), hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.16))`,
              border: 1,
              borderColor: selectedLevel === row.lowerBoundPercent ? "primary.main" : "divider",
              borderRadius: 1.5,
              display: "grid",
              gap: { xs: 0.65, md: 1 },
              gridTemplateAreas: {
                xs: '"zone reached profit" "zone exitType missed" "zone nextMove nextMove"',
                md: '"zone reached profit exitType missed nextMove time"',
              },
              gridTemplateColumns: { xs: "62px repeat(2, minmax(0, 1fr))", md: "78px 0.72fr 1.02fr 1.02fr 1.18fr 1.35fr 0.65fr" },
              minHeight: { xs: 136, md: 78 },
              px: 1,
              py: 0.55,
              textAlign: "left",
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 850, gridArea: "zone", lineHeight: 1.08 }}><ZoneRange lower={row.lowerBoundPercent} upper={row.upperBoundPercent} /></Typography>
            <Box sx={{ gridArea: "reached", pl: { xs: 0.5, md: 1 } }}><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Reached</Typography><Typography sx={{ fontSize: "0.84rem", fontWeight: 900 }}>{percent(row.reachRatePercent)}</Typography><Typography color="text.secondary" variant="caption">{row.reachedTradeCount} of {totalTradeCount} trades</Typography>{row.upperBoundPercent !== null ? <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.reachedNextTradeCount ?? 0} reached +{row.upperBoundPercent}% · {row.didNotReachNextTradeCount ?? 0} did not</Typography> : null}</Box>
            <Box sx={{ gridArea: "profit" }}><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Profit taken</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{row.tookProfitTradeCount === 0 ? "No profit taken" : `Profit taken in ${percent(row.tookProfitRateOfReachedPercent)}`}</Typography><Typography color="text.secondary" component="div" variant="caption">{row.tookProfitTradeCount} of {row.reachedTradeCount} trades</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{row.tookProfitTradeCount > 0 ? `${shares(row.quantitySoldInZoneDecimal)} profitable shares · ` : ""}{money(row.profitTakenInZoneGrossDecimal, currency)} Gross profit</Typography></Box>
            <Box sx={{ gridArea: "exitType" }}><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Exit type</Typography>{row.tookProfitTradeCount > 0 ? <><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Partial exits {percent(row.partialExitShareOfProfitTakingPercent)} · {money(row.partialExitTradeProfitInZoneGrossDecimal, currency)}</Typography>{row.scaledExitClosedTradeCount > 0 ? <Typography color="text.secondary" sx={{ fontSize: "0.62rem", pl: 0.75 }}>↳ Closed here {percent(row.scaledExitClosedRateOfPartialExitTradesPercent)} · {row.scaledExitClosedTradeCount} of {row.partialProfitTradeCount} · {money(row.scaledExitClosingProfitGrossDecimal, currency)}</Typography> : null}<Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Full exits {percent(row.fullExitShareOfProfitTakingPercent)} · {money(row.fullExitOnlyTradeProfitInZoneGrossDecimal, currency)}</Typography></> : <Typography color="text.secondary" variant="caption">No profit-taking exits</Typography>}</Box>
            <Box sx={{ gridArea: "missed" }}><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Missed opportunity</Typography>{row.noProfitTradeCount === 0 ? <><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>No missed opportunities</Typography><Typography color="text.secondary" variant="caption">Every reached trade took profit here</Typography></> : <><Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>{money(row.noProfitMaximumOpportunityGrossDecimal, currency)} opportunity</Typography><Typography color="text.secondary" component="div" variant="caption">No profit in {percent(row.noProfitRateOfReachedPercent)} · {row.noProfitTradeCount} of {row.reachedTradeCount}</Typography>{row.noProfitEndedRedTradeCount > 0 ? <Typography sx={{ color: financialOutcomeColor(row.noProfitEndedRedGrossLossDecimal), fontSize: "0.65rem", fontWeight: 750 }}>{row.noProfitEndedRedTradeCount} later ended red · {money(row.noProfitEndedRedGrossLossDecimal, currency)}</Typography> : null}</>}</Box>
            <Box sx={{ gridArea: "nextMove" }}><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Next move</Typography>{row.noProfitTradeCount === 0 ? <Typography color="text.secondary" variant="caption">No no-profit trades</Typography> : <>{row.upperBoundPercent === null ? null : <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitReachedNextFirstTradeCount)} reached +{row.upperBoundPercent}% · {percent(row.noProfitReachedNextFirstRatePercent)}</Typography>}<Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitDroppedBelowFirstTradeCount)} dropped below +{row.lowerBoundPercent}% · {percent(row.noProfitDroppedBelowFirstRatePercent)}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{tradeCount(row.noProfitExitedInZoneTradeCount)} {row.upperBoundPercent === null ? `exited at +${row.lowerBoundPercent}% or higher` : "exited in zone"} · {percent(row.noProfitExitedInZoneRatePercent)}</Typography></>}</Box>
            <Box sx={{ display: { xs: "none", md: "block" }, gridArea: "time" }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{minutes(row.medianCompletedMinutesInZone)}</Typography><Typography color="text.secondary" variant="caption">median</Typography></Box>
          </ButtonBase>;
        })}
      </Stack>
    </Paper>

    {selectedRow ? <Box>
      <Stack spacing={0.25} sx={{ mb: 1 }}>
        <Box>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 850 }}>Trades that reached {zoneLabel(selectedRow.lowerBoundPercent, selectedRow.upperBoundPercent)}</Typography>
            <Tooltip arrow title={`Amount of your analyzed trades that reached gains in the ${zoneLabel(selectedRow.lowerBoundPercent, selectedRow.upperBoundPercent)} zone.`}>
              <IconButton aria-label="Explain trades that reached this zone" size="small" sx={{ color: "text.secondary", p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
            </Tooltip>
          </Stack>
          <Typography color="text.secondary" variant="body2">{selectedRecords.length} of your {totalTradeCount} analyzed trades reached this zone.</Typography>
        </Box>
      </Stack>
      {selectedRecords.length === 0 ? <Typography color="text.secondary">No analyzed trades reached this level in the selected date range.</Typography> : <Stack spacing={1.25}>
        <TradeAnalyzerTablePagination
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          page={currentPage}
          pageSize={pageSize}
          rowCount={selectedRecords.length}
        />
        <HorizontalScrollRegion label={`Trades that reached ${zoneLabel(selectedRow.lowerBoundPercent, selectedRow.upperBoundPercent)}`} minTableWidth={1220} stickyFirstColumn>
          <Table size="small" sx={{ tableLayout: "fixed", "& .MuiTableCell-root": { px: 1, verticalAlign: "top" } }}>
            <colgroup>
              <col style={{ width: 82 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 190 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 108 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <TableHead><TableRow>
            <TableCell>Ticker</TableCell>
            <TableCell><TableHeading help="Date and time the trade first reached this zone. For candle-based reaches, the displayed time is the close of the one-minute candle." label="Reached at" /></TableCell>
            <TableCell><TableHeading help={entryOrderHelp} label="To zone" /></TableCell>
            <TableCell><TableHeading help="Total time the active trade spent in this zone, including time before and after leaving the zone and returning." label="In zone" /></TableCell>
            <TableCell><TableHeading help={partialProfitHelp} label="Partial profit" /></TableCell>
            <TableCell><TableHeading help={fullExitProfitHelp} label="Full exit" /></TableCell>
            <TableCell><TableHeading help="The highest potential Gross profit opportunity in this exact zone." label="Opportunity" /></TableCell>
            <TableCell><TableHeading help="Whether the trade reached the next zone, dropped below this zone before later reaching it, or exited before the next zone." label="Next move" /></TableCell>
            <TableCell><TableHeading help="Your profit or loss for the completed trade without deducting fees charged by your broker." label="Final P/L" /></TableCell>
            <TableCell />
          </TableRow></TableHead><TableBody>{visibleRecords.map((record) => <TableRow hover key={record.tradeId}>
            <TableCell sx={{ fontWeight: 850 }}>{record.symbol}</TableCell>
            <TableCell><Typography component="div" variant="body2">{reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography></TableCell>
            <TableCell>{minutes(record.minutesFromEntryToFirstReach)}</TableCell>
            <TableCell>{minutes(record.totalCompletedMinutesInZone)}</TableCell>
            <TableCell><Typography component="div" sx={{ color: financialOutcomeColor(record.partialProfitTakenInZoneGrossDecimal ?? "0"), fontWeight: 750 }} variant="body2">{money(record.partialProfitTakenInZoneGrossDecimal ?? "0", currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.partialProfitTakingExitCount ?? 0} {(record.partialProfitTakingExitCount ?? 0) === 1 ? "scaled exit" : "scaled exits"} · {partialProfitTiming(record)}</Typography>{record.scaledPositionClosingExitCount > 0 ? <Typography color="text.secondary" component="div" sx={{ fontSize: "0.65rem" }}>Position closed here after scaling · {money(record.scaledPositionClosingProfitGrossDecimal, currency)}</Typography> : null}</TableCell>
            <TableCell><Typography component="div" sx={{ color: financialOutcomeColor(record.profitableFullExitInZoneGrossDecimal ?? "0"), fontWeight: 750 }} variant="body2">{Number(record.profitableFullExitInZoneGrossDecimal ?? "0") > 0 ? money(record.profitableFullExitInZoneGrossDecimal, currency) : "No"}</Typography></TableCell>
            <TableCell><Typography component="div" variant="body2">{money(record.maximumProfitOpportunityInZoneGrossDecimal, currency)}</Typography>{Number(record.profitTakenInZoneGrossDecimal) <= 0 ? <Typography color="text.secondary" component="div" variant="caption">No profit taken here</Typography> : null}</TableCell>
            <TableCell sx={{ maxWidth: 280, whiteSpace: "normal" }}><Typography color="text.secondary" component="div" variant="caption">{nextLevelOutcome(record)}</Typography></TableCell>
            <TableCell sx={{ color: financialOutcomeColor(record.finalGrossPnlDecimal), fontWeight: 750 }}>{money(record.finalGrossPnlDecimal, currency)}</TableCell>
            <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${record.trackerDate}` : `/trade-tracker/${record.trackerDate}?${new URLSearchParams({ interval: "1m", trade: record.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell>
          </TableRow>)}</TableBody></Table>
        </HorizontalScrollRegion>
      </Stack>}
    </Box> : null}
  </Stack>;
}
