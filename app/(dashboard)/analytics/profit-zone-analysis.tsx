"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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

  return <Stack spacing={2.5}>
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 1.5, sm: 2 } }}>
      <Stack spacing={1.75}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Trades reaching each profit level</Typography>
          <Typography color="text.secondary" variant="body2">
            Each bar is the share of all {totalTradeCount} analyzed {direction} trades that reached the level while shares were open. Levels are cumulative, so one trade can reach several levels.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Reached means a completed 1-minute candle closed at or above the level, or a recorded sell executed there. The 100% or more bar includes every move above 100% and has no next level.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ bgcolor: "success.main", borderRadius: 0.75, height: 10, width: 22 }} />
            <Typography color="text.secondary" variant="caption">Reached the next level</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ bgcolor: "warning.main", borderRadius: 0.75, height: 10, width: 22 }} />
            <Typography color="text.secondary" variant="caption">Did not reach the next level</Typography>
          </Stack>
        </Stack>
        {rows.map((row) => {
          const reachedWidth = Math.max(0, Math.min(100, row.reachRatePercent ?? 0));
          const nextShare = row.reachedNextTradeCount === null || row.reachedTradeCount === 0
            ? 100
            : row.reachedNextTradeCount / row.reachedTradeCount * 100;
          return <Box key={row.lowerBoundPercent}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Button
                aria-label={row.upperBoundPercent === null
                  ? "Show exact trades reaching 100% or more"
                  : `Show exact trades for the +${row.lowerBoundPercent}% level`}
                onClick={() => { setSelectedLevel(row.lowerBoundPercent); setPage(1); }}
                size="small"
                sx={{ fontWeight: 900, justifyContent: "flex-start", minWidth: 128, px: 0.5 }}
                variant={selectedLevel === row.lowerBoundPercent ? "contained" : "text"}
              >{row.upperBoundPercent === null ? `${row.lowerBoundPercent}% or more` : `+${row.lowerBoundPercent}%`}</Button>
              <Box sx={{ bgcolor: "action.hover", borderRadius: 999, flex: 1, height: 16, overflow: "hidden" }}>
                <Box sx={{ display: "flex", height: "100%", overflow: "hidden", width: `${reachedWidth}%` }}>
                  <Box sx={{ bgcolor: row.upperBoundPercent === null ? "primary.main" : "success.main", height: "100%", width: `${nextShare}%` }} />
                  {row.upperBoundPercent !== null ? <Box sx={{ bgcolor: "warning.main", flex: 1, height: "100%" }} /> : null}
                </Box>
              </Box>
              <Typography sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, minWidth: { xs: 72, sm: 118 }, textAlign: "right" }} variant="body2">
                {row.reachedTradeCount} · {percent(row.reachRatePercent)}
              </Typography>
            </Stack>
            {row.upperBoundPercent !== null && row.reachedTradeCount > 0 ? <Typography color="text.secondary" sx={{ ml: { xs: 0, sm: "81px" }, mt: 0.25 }} variant="caption">
              {row.reachedNextTradeCount} reached +{row.upperBoundPercent}% · {row.didNotReachNextTradeCount} did not
            </Typography> : null}
          </Box>;
        })}
      </Stack>
    </Paper>

    <Box>
      <Typography sx={{ fontWeight: 850, mb: 0.25 }}>Profit taken and opportunity by level</Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
        Sell fills count in one exclusive profit zone. Recorded profit and losses are exact Gross execution results; profit available at a level is calculated from the shares still open when that level was first reached.
      </Typography>
      <HorizontalScrollRegion label="Profit taking by price level matrix" minTableWidth={2240} stickyFirstColumn>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Profit zone</TableCell>
            <TableCell align="right">Trades reached</TableCell>
            <TableCell align="right">Median time to reach</TableCell>
            <TableCell align="right">Median longest time at or above</TableCell>
            <TableCell align="right">Median completed minutes in zone</TableCell>
            <TableCell align="right">Median total holding time</TableCell>
            <TableCell align="right">Took profit in zone</TableCell>
            <TableCell align="right">Shares sold in zone</TableCell>
            <TableCell align="right">Exact Gross profit taken</TableCell>
            <TableCell align="right">Reached next level</TableCell>
            <TableCell align="right">Did not reach next level</TableCell>
            <TableCell align="right">Calculated Gross profit available at level</TableCell>
            <TableCell align="right">Available on trades that did not advance</TableCell>
            <TableCell align="right">No profit in zone and ended red</TableCell>
            <TableCell align="right">Exact realized Gross losses</TableCell>
            <TableCell />
          </TableRow></TableHead>
          <TableBody>{rows.map((row) => <TableRow hover key={row.lowerBoundPercent} selected={selectedLevel === row.lowerBoundPercent}>
            <TableCell sx={{ fontWeight: 850 }}>{zoneLabel(row.lowerBoundPercent, row.upperBoundPercent)}</TableCell>
            <TableCell align="right">{row.reachedTradeCount} · {percent(row.reachRatePercent)}</TableCell>
            <TableCell align="right">{minutes(row.medianFirstReachMinutes)}</TableCell>
            <TableCell align="right">{minutes(row.medianLongestConsecutiveMinutesAtOrAbove)}</TableCell>
            <TableCell align="right">{minutes(row.medianCompletedMinutesInZone)}</TableCell>
            <TableCell align="right">{minutes(row.medianHoldingMinutes)}</TableCell>
            <TableCell align="right">{row.tookProfitTradeCount} · {percent(row.tookProfitRateOfReachedPercent)}</TableCell>
            <TableCell align="right">{row.quantitySoldInZoneDecimal}</TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.profitTakenInZoneGrossDecimal), fontWeight: 800 }}>{money(row.profitTakenInZoneGrossDecimal, currency)}</TableCell>
            <TableCell align="right">{row.reachedNextTradeCount ?? "—"}</TableCell>
            <TableCell align="right"><Typography component="div" variant="body2">{row.didNotReachNextTradeCount ?? "—"}</Typography>{row.droppedBeforeNextTradeCount !== null ? <Typography color="text.secondary" component="div" variant="caption">{row.droppedBeforeNextTradeCount} dropped below this level first</Typography> : null}</TableCell>
            <TableCell align="right">{money(row.profitAvailableAtLevelGrossDecimal, currency)}</TableCell>
            <TableCell align="right">{money(row.profitAvailableDidNotReachNextGrossDecimal, currency)}</TableCell>
            <TableCell align="right"><Typography component="div" variant="body2">{row.noProfitEndedRedTradeCount} · {percent(row.noProfitEndedRedRatePercent)}</Typography><Typography color="text.secondary" component="div" variant="caption">of trades taking no profit in this zone</Typography></TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(row.noProfitEndedRedGrossLossDecimal), fontWeight: 800 }}>{money(row.noProfitEndedRedGrossLossDecimal, currency)}</TableCell>
            <TableCell><Button onClick={() => { setSelectedLevel(row.lowerBoundPercent); setPage(1); }} size="small" variant="outlined">View trades</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </HorizontalScrollRegion>
    </Box>

    {selectedRow ? <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Exact trades reaching {selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}</Typography>
          <Typography color="text.secondary" variant="body2">{selectedRecords.length} record{selectedRecords.length === 1 ? "" : "s"} behind this matrix row.</Typography>
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
        <HorizontalScrollRegion label={`Exact trades reaching ${selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}`} minTableWidth={1840} stickyFirstColumn>
          <Table size="small"><TableHead><TableRow>
            <TableCell>Ticker</TableCell><TableCell>First level record</TableCell><TableCell align="right">Time from entry</TableCell><TableCell align="right">Longest time at or above</TableCell><TableCell align="right">Completed minutes in zone</TableCell><TableCell align="right">Total holding time</TableCell><TableCell align="right">Shares sold in zone</TableCell><TableCell align="right">Exact Gross profit taken in zone</TableCell><TableCell align="right">Calculated Gross profit available at level</TableCell><TableCell>Next-level outcome</TableCell><TableCell align="right">Final Gross P/L</TableCell><TableCell />
          </TableRow></TableHead><TableBody>{visibleRecords.map((record) => <TableRow hover key={record.roundTripId}>
            <TableCell sx={{ fontWeight: 850 }}>{record.symbol}</TableCell>
            <TableCell><Typography component="div" variant="body2">{reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.firstReachSource === "completed_close" ? "Completed 1-minute candle close" : "Recorded sell execution"}</Typography></TableCell>
            <TableCell align="right">{minutes(record.minutesFromEntryToFirstReach)}</TableCell>
            <TableCell align="right">{minutes(record.longestConsecutiveMinutesAtOrAbove)}</TableCell>
            <TableCell align="right">{minutes(record.totalCompletedMinutesInZone)}</TableCell>
            <TableCell align="right">{minutes(record.totalHoldingMinutes)}</TableCell>
            <TableCell align="right">{record.quantitySoldInZoneDecimal}</TableCell>
            <TableCell align="right" sx={{ color: financialOutcomeColor(record.profitTakenInZoneGrossDecimal), fontWeight: 750 }}>{money(record.profitTakenInZoneGrossDecimal, currency)}</TableCell>
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
