"use client";

import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type {
  DailyTradePatternOccurrencePage,
  DailyTradePatternOccurrenceRow,
} from "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import type { DaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { DailyTradeChartInterval } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart";

import { TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";

const DailyTradeAnalyzerChart = dynamic(
  () => import("@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart")
    .then((module) => module.DailyTradeAnalyzerChart),
  {
    loading: () => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", p: 3 }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">Loading chart…</Typography>
      </Stack>
    ),
    ssr: false,
  },
);

type OccurrenceResponse = Readonly<{
  page?: DailyTradePatternOccurrencePage;
  status: string;
}>;

type ReplayResponse = Readonly<{
  analysis?: DaySessionTradeAnalyzer;
  occurrence?: DailyTradePatternOccurrenceRow;
  status: string;
}>;

function friendlyPattern(value: string): string {
  return candlePatternName(value);
}

function eventLabel(value: DailyTradePatternOccurrenceRow["eventKind"]): string {
  switch (value) {
    case "entry": return "Entry";
    case "add": return "Add";
    case "partial_exit": return "Partial exit";
    case "final_exit": return "Final exit";
  }
}

function locationLabel(value: number): string {
  if (value === 0) return "Execution candle";
  return `${value} candle${value === 1 ? "" : "s"} before`;
}

function dateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date(value));
}

function money(value: string | null, currency: string): string {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-CA", {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value));
}

function percent(value: string | null): string {
  return value === null ? "Unavailable" : `${Number(value).toFixed(2)}%`;
}

function trackerHref(row: DailyTradePatternOccurrenceRow): string {
  const params = new URLSearchParams({
    event: row.executionId,
    interval: row.timeframe,
    trade: row.roundTripId,
  });
  return `/trade-tracker/${row.trackerDate}?${params.toString()}`;
}

function OccurrenceSummary({
  occurrence,
  timezone,
}: {
  occurrence: DailyTradePatternOccurrenceRow;
  timezone: string;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
      <Box><Typography color="text.secondary" variant="caption">Execution</Typography><Typography variant="body2">{eventLabel(occurrence.eventKind)}</Typography></Box>
      <Box><Typography color="text.secondary" variant="caption">Timeframe</Typography><Typography variant="body2">{occurrence.timeframe}</Typography></Box>
      <Box><Typography color="text.secondary" variant="caption">Observed</Typography><Typography variant="body2">{dateTime(occurrence.executedAtUtc, timezone)}</Typography></Box>
      <Box><Typography color="text.secondary" variant="caption">Location</Typography><Typography variant="body2">{locationLabel(occurrence.candlesBeforeExecution)}</Typography></Box>
      <Box><Typography color="text.secondary" variant="caption">Trade result</Typography><Typography color={financialOutcomeColor(occurrence.resultDecimal)} sx={{ fontWeight: 800 }} variant="body2">{money(occurrence.resultDecimal, occurrence.currency)}</Typography></Box>
      <Box><Typography color="text.secondary" variant="caption">Return</Typography><Typography color={financialOutcomeColor(occurrence.returnPercentDecimal)} variant="body2">{percent(occurrence.returnPercentDecimal)}</Typography></Box>
    </Box>
  );
}

export function CandlePatternOccurrenceExplorer({
  currency,
  endDate,
  moneyBasis,
  onClose,
  pattern,
  startDate,
}: {
  currency: string | null;
  endDate: string | null;
  moneyBasis: "gross" | "net";
  onClose: () => void;
  pattern: string;
  startDate: string | null;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [draftTicker, setDraftTicker] = useState("");
  const [ticker, setTicker] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "1m" | "5m">("all");
  const [execution, setExecution] = useState<"all" | "entry" | "exit">("all");
  const [location, setLocation] = useState<"all" | "exact" | "before">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 1: null });
  const [result, setResult] = useState<DailyTradePatternOccurrencePage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);
  const [replayState, setReplayState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const selected = selectedIndex === null ? null : result?.rows[selectedIndex] ?? null;
  const [chartInterval, setChartInterval] = useState<DailyTradeChartInterval>("1m");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setTicker(draftTicker.trim());
      setPage(1);
      setCursors({ 1: null });
      setSelectedIndex(null);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftTicker]);

  const cursor = cursors[page] ?? null;

  useEffect(() => {
    if (!currency) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      basis: moneyBasis,
      currency,
      execution,
      location,
      pageSize: String(pageSize),
      pattern,
      ticker,
      timeframe,
    });
    if (startDate && endDate) {
      params.set("start", startDate);
      params.set("end", endDate);
    }
    if (cursor) params.set("cursor", cursor);
    queueMicrotask(() => {
      if (!controller.signal.aborted) setState("loading");
    });
    void fetch(`/api/platform/trade-analyzer/candle-patterns/occurrences?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      const payload = await response.json() as OccurrenceResponse;
      if (!response.ok || payload.status !== "ready" || !payload.page) {
        throw new Error("Pattern occurrences are unavailable.");
      }
      setResult(payload.page);
      setCursors((current) => current[page + 1] === payload.page!.continuationCursor
        ? current
        : { ...current, [page + 1]: payload.page!.continuationCursor });
      setState("ready");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Candle Pattern occurrences request failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setState("error");
    });
    return () => controller.abort();
  }, [currency, cursor, endDate, execution, location, moneyBasis, page, pageSize, pattern, startDate, ticker, timeframe]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ basis: moneyBasis, ref: selected.occurrenceRef });
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setReplayState("loading");
      setReplay(null);
    });
    void fetch(`/api/platform/trade-analyzer/candle-patterns/replay?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      const payload = await response.json() as ReplayResponse;
      if (!response.ok || payload.status !== "ready" || !payload.analysis) {
        throw new Error("Replay is unavailable.");
      }
      setReplay(payload);
      setReplayState("ready");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Candle Pattern replay request failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setReplayState("error");
    });
    return () => controller.abort();
  }, [moneyBasis, selected]);

  const resetPaging = () => {
    setPage(1);
    setCursors({ 1: null });
    setSelectedIndex(null);
  };
  const selectOccurrence = (index: number) => {
    const occurrence = result?.rows[index];
    if (occurrence) setChartInterval(occurrence.timeframe);
    setSelectedIndex(index);
  };
  const closeReplay = () => {
    setSelectedIndex(null);
    setReplay(null);
    setReplayState("idle");
  };
  const replayBody = selected ? (
    <Stack
      sx={{
        minHeight: 0,
        "@media (max-width: 899.95px)": {
          "& button, & a.MuiButtonBase-root": {
            minHeight: 44,
            minWidth: 44,
          },
          "& .MuiToggleButton-root": {
            minWidth: "44px !important",
          },
        },
      }}
    >
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", position: "sticky", top: 0, zIndex: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between", p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Candle Pattern</Typography>
            <Typography component="h2" noWrap sx={{ fontWeight: 900 }} variant="h6">{selected.symbol} · {friendlyPattern(selected.pattern)}</Typography>
          </Box>
          <IconButton aria-label="Close pattern replay" onClick={closeReplay}><CloseIcon /></IconButton>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ px: { xs: 1.5, sm: 2 }, pb: 1.5 }}>
          <Stack direction="row" spacing={1}>
            <Button disabled={selectedIndex === 0} onClick={() => { if (selectedIndex !== null) selectOccurrence(Math.max(0, selectedIndex - 1)); }} size="small" variant="outlined">Previous</Button>
            <Button disabled={selectedIndex === (result?.rows.length ?? 1) - 1} onClick={() => { if (selectedIndex !== null) selectOccurrence(Math.min((result?.rows.length ?? 1) - 1, selectedIndex + 1)); }} size="small" variant="outlined">Next</Button>
          </Stack>
          <Button endIcon={<OpenInNewIcon />} href={trackerHref(selected)} size="small" sx={{ ml: { sm: "auto !important" } }} variant="contained">Open Daily Trade Tracker</Button>
        </Stack>
      </Box>
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2 } }}>
        <OccurrenceSummary occurrence={selected} timezone={result?.timezone ?? "America/New_York"} />
        <Divider />
        {replayState === "loading" ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 4 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading the saved trade chart…</Typography></Stack> : null}
        {replayState === "error" ? <Alert severity="warning">The saved chart is unavailable. You can still open the full Daily Trade Tracker review.</Alert> : null}
        {replayState === "ready" && replay?.analysis ? (
          <DailyTradeAnalyzerChart
            analysis={replay.analysis}
            currency={selected.currency}
            direction={selected.direction}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
            selectedEventId={selected.executionId}
            symbol={selected.symbol}
            tradeLabelColor={selected.resultDecimal !== null && Number(selected.resultDecimal) < 0 ? "error" : "success"}
            tradeNumber={1}
          />
        ) : null}
      </Stack>
    </Stack>
  ) : null;

  const resolvedState = currency ? state : "ready";
  const rows = currency ? result?.rows ?? [] : [];
  return (
    <Paper square sx={{ border: 0, minHeight: "100%", p: { xs: 1.5, sm: 2.25 } }} variant="outlined">
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", bgcolor: "background.paper", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 3 }}>
          <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">
            {friendlyPattern(pattern)} occurrences
          </Typography>
          <IconButton aria-label="Close pattern occurrences" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseIcon /></IconButton>
        </Stack>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
          <TextField label="Ticker" onChange={(event) => setDraftTicker(event.target.value)} size="small" value={draftTicker} />
          <TextField label="Timeframe" onChange={(event) => { setTimeframe(event.target.value as typeof timeframe); resetPaging(); }} select size="small" value={timeframe}><MenuItem value="all">All timeframes</MenuItem><MenuItem value="1m">1 minute</MenuItem><MenuItem value="5m">5 minutes</MenuItem></TextField>
          <TextField label="Execution" onChange={(event) => { setExecution(event.target.value as typeof execution); resetPaging(); }} select size="small" value={execution}><MenuItem value="all">All executions</MenuItem><MenuItem value="entry">Entries and adds</MenuItem><MenuItem value="exit">Partial and final exits</MenuItem></TextField>
          <TextField label="Location" onChange={(event) => { setLocation(event.target.value as typeof location); resetPaging(); }} select size="small" value={location}><MenuItem value="all">All locations</MenuItem><MenuItem value="exact">Execution candle</MenuItem><MenuItem value="before">Before execution</MenuItem></TextField>
        </Box>
        {currency ? <TradeAnalyzerTablePagination onPageChange={(nextPage) => { if (nextPage < page || cursors[nextPage]) setPage(nextPage); }} onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1); setCursors({ 1: null }); }} page={page} pageSize={pageSize} rowCount={result?.totalRowCount ?? 0} /> : null}
        {resolvedState === "loading" && !result ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading occurrences…</Typography></Stack> : null}
        {resolvedState === "error" ? <Alert severity="error">Pattern occurrences could not be loaded. Try again.</Alert> : null}
        {resolvedState === "ready" && rows.length === 0 ? <Typography color="text.secondary">No occurrences match these filters.</Typography> : null}

        {rows.length > 0 ?
          <HorizontalScrollRegion label={`${friendlyPattern(pattern)} occurrences table`} minTableWidth={1060} stickyFirstColumn>
            <Table aria-label={`${friendlyPattern(pattern)} occurrences`} size="small">
              <TableHead><TableRow><TableCell>Ticker</TableCell><TableCell>Date and time</TableCell><TableCell>Direction</TableCell><TableCell>Timeframe</TableCell><TableCell>Execution</TableCell><TableCell>Location</TableCell><TableCell align="right">Result</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>{rows.map((row, index) => <TableRow hover key={row.occurrenceRef}><TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell><TableCell>{dateTime(row.executedAtUtc, result!.timezone)}</TableCell><TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell><TableCell>{row.timeframe}</TableCell><TableCell>{eventLabel(row.eventKind)}</TableCell><TableCell>{locationLabel(row.candlesBeforeExecution)}</TableCell><TableCell align="right" sx={{ color: financialOutcomeColor(row.resultDecimal), fontWeight: 800 }}>{money(row.resultDecimal, row.currency)}</TableCell><TableCell align="right"><Button onClick={() => selectOccurrence(index)} size="small" variant="outlined">View chart</Button></TableCell></TableRow>)}</TableBody>
            </Table>
          </HorizontalScrollRegion> : null}
      </Stack>

      {mobile ? (
        <Dialog fullScreen onClose={closeReplay} open={selected !== null}>
          <DialogContent sx={{ p: 0 }}>{replayBody}</DialogContent>
        </Dialog>
      ) : (
        <Drawer
          anchor="right"
          onClose={closeReplay}
          open={selected !== null}
          slotProps={{ paper: { sx: { width: "min(760px, 72vw)" } } }}
        >
          {replayBody}
        </Drawer>
      )}
    </Paper>
  );
}
