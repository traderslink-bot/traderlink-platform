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
        <Typography sx={{ fontWeight: 850 }}>Profit zones</Typography>
        <Tooltip arrow title={`Percentages use all ${totalTradeCount} selected ${direction} trades. Profit taken includes partial and final position-reducing fills in that zone. Opportunity stopped here covers trades that did not reach the next zone.`}>
          <IconButton aria-label="Explain profit zones" size="small" sx={{ color: "text.secondary", ml: 0.25, p: 0.35 }}><InfoOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: "92px 0.8fr 1fr 1.2fr 0.8fr", px: 1, pb: 0.5 }}>
        {[
          ["Zone", "Ten-point gain range."],
          ["Reached", "Share of all selected trades that reached this level."],
          ["Profit taken", "Share of trades reaching the level where profit was taken inside the zone, plus exact Gross profit."],
          ["Stopped here", "Share of trades reaching the level that did not reach the next zone, plus their profit opportunity at this level."],
          ["Time in zone", "Median completed one-minute candles inside this exact zone."],
        ].map(([label, help]) => <Tooltip arrow key={label} title={help}><Typography color="text.secondary" sx={{ fontSize: "0.69rem", fontWeight: 800, letterSpacing: "0.035em", textTransform: "uppercase" }}>{label}</Typography></Tooltip>)}
      </Box>
      <Stack spacing={0.5}>
        {[...rows].reverse().map((row) => {
          const zoneIndex = rows.findIndex((candidate) => candidate.lowerBoundPercent === row.lowerBoundPercent);
          const hue = 210 - Math.max(0, zoneIndex) * 19;
          const stoppedRate = rate(row.didNotReachNextTradeCount, row.reachedTradeCount);
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
              gridTemplateColumns: { xs: "68px repeat(3, minmax(0, 1fr))", md: "92px 0.8fr 1fr 1.2fr 0.8fr" },
              minHeight: { xs: 68, md: 46 },
              px: 1,
              py: 0.55,
              textAlign: "left",
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 900 }}>{row.upperBoundPercent === null ? "100%+" : `${row.lowerBoundPercent}–${row.upperBoundPercent}%`}</Typography>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Reached</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{percent(row.reachRatePercent)}</Typography><Typography color="text.secondary" variant="caption">{row.reachedTradeCount} trades</Typography></Box>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Profit</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{row.tookProfitTradeCount === 0 ? "None" : percent(row.tookProfitRateOfReachedPercent)}</Typography><Typography color="text.secondary" variant="caption">{money(row.profitTakenInZoneGrossDecimal, currency)}</Typography></Box>
            <Box><Typography color="text.secondary" sx={{ display: { md: "none" }, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase" }}>Stopped</Typography><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{row.upperBoundPercent === null ? "Top zone" : percent(stoppedRate)}</Typography><Typography color="text.secondary" variant="caption">{row.upperBoundPercent === null ? "No next zone" : `${money(row.profitAvailableDidNotReachNextGrossDecimal, currency)} opportunity`}</Typography></Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}><Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{minutes(row.medianCompletedMinutesInZone)}</Typography><Typography color="text.secondary" variant="caption">median</Typography></Box>
          </ButtonBase>;
        })}
      </Stack>
    </Paper>

    {selectedRow ? <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>Exact trades reaching {selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}</Typography>
          <Typography color="text.secondary" variant="body2">{selectedRecords.length} record{selectedRecords.length === 1 ? "" : "s"} in this zone.</Typography>
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
        <HorizontalScrollRegion label={`Exact trades reaching ${selectedRow.upperBoundPercent === null ? `${selectedRow.lowerBoundPercent}% or more` : `+${selectedRow.lowerBoundPercent}%`}`} minTableWidth={1320} stickyFirstColumn>
          <Table size="small"><TableHead><TableRow>
            <TableCell>Ticker</TableCell><TableCell>First reached</TableCell><TableCell align="right">Time to zone</TableCell><TableCell align="right">Time in zone</TableCell><TableCell align="right">Gross profit taken</TableCell><TableCell align="right">Gross opportunity</TableCell><TableCell>Next zone</TableCell><TableCell align="right">Final Gross P/L</TableCell><TableCell />
          </TableRow></TableHead><TableBody>{visibleRecords.map((record) => <TableRow hover key={record.roundTripId}>
            <TableCell sx={{ fontWeight: 850 }}>{record.symbol}</TableCell>
            <TableCell><Typography component="div" variant="body2">{reachTime(record.firstReachedAtUtcSeconds, timezone)}</Typography><Typography color="text.secondary" component="div" variant="caption">{record.firstReachSource === "completed_close" ? "Completed 1-minute candle close" : "Recorded sell execution"}</Typography></TableCell>
            <TableCell align="right">{minutes(record.minutesFromEntryToFirstReach)}</TableCell>
            <TableCell align="right">{minutes(record.totalCompletedMinutesInZone)}</TableCell>
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
