"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
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

function rate(numerator: number | null, denominator: number): number | null {
  return numerator === null || denominator === 0 ? null : numerator / denominator * 100;
}

function minutes(value: number | null): string {
  if (value === null) return "Unavailable";
  if (value < 1) return "Under 1 min";
  return `${value.toFixed(value < 10 ? 1 : 0)} min`;
}

function zoneLabel(lower: number, upper: number | null): string {
  return upper === null ? `${lower}% or more` : `${lower}% to under ${upper}%`;
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

  return <Stack spacing={1.75}>
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 1, sm: 1.25 } }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 0.75 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Profit zones</Typography>
          <Typography color="text.secondary" variant="caption">Each saved trade counts once · Profit-taking percentages use trades that reached the zone</Typography>
        </Box>
        <Tooltip arrow title={`This page uses ${totalTradeCount} analyzed user-defined ${direction} trades. A trade counts once even when it contains several entries, partial exits, full exits or re-entries. Partial profit, full exit and stopped here use only the trades that reached that zone. A trade can contain both a partial exit and a later full exit, so those two rates do not need to add to 100%. A full exit sold all remaining open shares; the saved trade may still contain a later re-entry.`}>
          <IconButton aria-label="Explain profit zones" size="small" sx={{ color: "text.secondary", ml: 0.25, p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: "92px 0.8fr 1.45fr 1.2fr 0.8fr", px: 1, pb: 0.5 }}>
        {[
          ["Zone", "Ten-point gain range."],
          ["Reached", "Share of all analyzed user-defined trades that reached this level."],
          ["Profit exits", "Share of trades reaching this zone with any profitable exit here, plus exact combined Gross profit. The breakdown separates partial exits from full exits and identifies trades that did both. A full exit sold all remaining open shares in the current position."],
          ["Stopped here", "Share of trades reaching the level that did not reach the next zone, plus their profit opportunity at this level."],
          ["Time in zone", "Median completed one-minute candles inside this exact zone."],
        ].map(([label, help]) => <Tooltip arrow key={label} title={help}><Typography color="text.secondary" sx={{ fontSize: "0.69rem", fontWeight: 800, letterSpacing: "0.035em", textTransform: "uppercase" }}>{label}</Typography></Tooltip>)}
      </Box>
      <Stack spacing={0.5}>
        {[...rows].reverse().map((row) => {
          const zoneIndex = rows.findIndex((candidate) => candidate.lowerBoundPercent === row.lowerBoundPercent);
          const hue = 210 - Math.max(0, zoneIndex) * 19;
          const stoppedRate = rate(row.didNotReachNextTradeCount, row.reachedTradeCount);
          const returnedFlatRate = rate(row.profitableFullExitTradeCount ?? 0, row.reachedTradeCount);
          return <ButtonBase
            aria-label={`Show exact trades for ${zoneLabel(row.lowerBoundPercent, row.upperBoundPercent)}`}
            key={row.lowerBoundPercent}
            onClick={() => { setSelectedLevel(row.lowerBoundPercent); setPage(1); }}
            sx={{
              background: (theme) => `linear-gradient(90deg, hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.06), hsla(${hue}, 68%, ${theme.palette.mode === "dark" ? 58 : 46}%, 0.16))`,
              border: 1,
              borderColor: selectedLevel === row.lowerBoundPercent ? "primary.main" : "divider",
              borderRadius: 1.5,
              display: "grid",
              gap: { xs: 0.65, md: 1 },
              gridTemplateColumns: { xs: "68px repeat(3, minmax(0, 1fr))", md: "92px 0.8fr 1.45fr 1.2fr 0.8fr" },
              minHeight: { xs: 68, md: 46 },
              px: 1,
              py: 0.55,
              textAlign: "left",
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 900 }}>{row.upperBoundPercent === null ? "100%+" : `${row.lowerBoundPercent}–${row.upperBoundPercent}%`}</Typography>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Reached</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{percent(row.reachRatePercent)}</Typography><Typography color="text.secondary" variant="caption">{row.reachedTradeCount} of {totalTradeCount} trades</Typography></Box>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Profit exits</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{(row.tookProfitTradeCount ?? 0) === 0 ? "None" : `${percent(row.tookProfitRateOfReachedPercent)} of reached trades`}</Typography><Typography color="text.secondary" variant="caption">{row.tookProfitTradeCount ?? 0} of {row.reachedTradeCount} · {money(row.profitTakenInZoneGrossDecimal ?? "0", currency)}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem", mt: 0.2 }}>Partial {percent(row.partialProfitRateOfReachedPercent)} · {money(row.partialProfitTakenInZoneGrossDecimal ?? "0", currency)}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>Full exit {percent(returnedFlatRate)} · {money(row.profitableFullExitInZoneGrossDecimal ?? "0", currency)}</Typography>{(row.partialAndReturnedFlatTradeCount ?? 0) > 0 ? <Typography color="text.secondary" sx={{ fontSize: "0.62rem" }}>Both: {percent(row.partialAndReturnedFlatRateOfReachedPercent)}</Typography> : null}</Box>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Stopped</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{row.upperBoundPercent === null ? "Top zone" : percent(stoppedRate)}</Typography><Typography color="text.secondary" variant="caption">{row.upperBoundPercent === null ? "No next zone" : `${row.didNotReachNextTradeCount} of ${row.reachedTradeCount} · ${money(row.profitAvailableDidNotReachNextGrossDecimal, currency)} opportunity`}</Typography></Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{minutes(row.medianCompletedMinutesInZone)}</Typography><Typography color="text.secondary" variant="caption">median</Typography></Box>
          </ButtonBase>;
        })}
      </Stack>
    </Paper>

    {selectedRow ? <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Exact trades reaching {selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}</Typography>
          <Typography color="text.secondary" variant="body2">{selectedRecords.length} trade record{selectedRecords.length === 1 ? "" : "s"} in this zone.</Typography>
        </Box>
        <Chip color="primary" label={zoneLabel(selectedRow.lowerBoundPercent, selectedRow.upperBoundPercent)} variant="outlined" />
      </Stack>
      {selectedRecords.length === 0 ? <Typography color="text.secondary">No analyzed trades reached this level in the selected date range.</Typography> : <Stack spacing={1.25}>
        <TradeAnalyzerTablePagination
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          page={currentPage}
          pageSize={pageSize}
          rowCount={selectedRecords.length}
        />
        <HorizontalScrollRegion label={`Exact trades reaching ${selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}`} minTableWidth={1500} stickyFirstColumn>
          <Table size="small"><TableHead><TableRow>
            <TableCell>Ticker</TableCell><TableCell>First reached</TableCell><TableCell align="right">Time to zone</TableCell><TableCell align="right">Time in zone</TableCell><TableCell align="right">Partial profit</TableCell><TableCell align="right">Full exit profit</TableCell><TableCell align="right">Gross opportunity</TableCell><TableCell>Next zone</TableCell><TableCell align="right">Final Gross P/L</TableCell><TableCell />
          </TableRow></TableHead><TableBody>{visibleRecords.map((record) => <TableRow hover key={record.tradeId}>
            <TableCell sx={{ fontWeight: 850 }}>{record.symbol}</TableCell>
            <TableCell><Typography component="div" variant="body2">{reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.firstReachSource === "completed_close" ? "Completed 1-minute candle close" : "Recorded sell execution"}</Typography></TableCell>
            <TableCell align="right">{minutes(record.minutesFromEntryToFirstReach)}</TableCell>
            <TableCell align="right">{minutes(record.totalCompletedMinutesInZone)}</TableCell>
            <TableCell align="right"><Typography component="div" sx={{ color: financialOutcomeColor(record.partialProfitTakenInZoneGrossDecimal ?? "0"), fontWeight: 750 }} variant="body2">{money(record.partialProfitTakenInZoneGrossDecimal ?? "0", currency)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.partialProfitTakingExitCount ?? 0} {(record.partialProfitTakingExitCount ?? 0) === 1 ? "partial exit" : "partial exits"} · {partialProfitTiming(record)}</Typography></TableCell>
            <TableCell align="right"><Typography component="div" sx={{ color: financialOutcomeColor(record.profitableFullExitInZoneGrossDecimal ?? "0"), fontWeight: 750 }} variant="body2">{Number(record.profitableFullExitInZoneGrossDecimal ?? "0") > 0 ? money(record.profitableFullExitInZoneGrossDecimal, currency) : "No"}</Typography><Typography color="text.secondary" component="div" variant="caption">Entire position sold at once with no earlier partial exit in that position cycle</Typography></TableCell>
            <TableCell align="right">{money(record.profitAvailableAtLevelGrossDecimal, currency)}</TableCell>
            <TableCell sx={{ maxWidth: 280, whiteSpace: "normal" }}>{nextLevelOutcome(record)}</TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(record.finalGrossPnlDecimal), fontWeight: 750 }}>{money(record.finalGrossPnlDecimal, currency)}</TableCell>
            <TableCell><Button endIcon={<OpenInNewIcon fontSize="small" />} href={offline ? `/trade-tracker/${record.trackerDate}` : `/trade-tracker/${record.trackerDate}?${new URLSearchParams({ interval: "1m", trade: record.roundTripId }).toString()}`} size="small" variant="outlined">Full analysis</Button></TableCell>
          </TableRow>)}</TableBody></Table>
        </HorizontalScrollRegion>
      </Stack>}
    </Box> : null}
  </Stack>;
}
