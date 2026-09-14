"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

import type { DailyTradeAnalyzedTradePage } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { DashboardMetricCard } from "@/app/dashboard-template";

import type { OverviewDateRange } from "./overview-date-range-control";
import { TradeAnalysisRangeAndBasisControls } from "./trade-analysis-range-and-basis-controls";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";

type PageResponse = Readonly<{
  page?: DailyTradeAnalyzedTradePage;
  status: string;
}>;

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
  if (value === null) return "Unavailable";
  return `${Number(value).toFixed(2)}%`;
}

function dateTime(value: string, timezone: string): Readonly<{
  date: string;
  time: string;
}> {
  const instant = new Date(value);
  return Object.freeze({
    date: new Intl.DateTimeFormat("en-CA", {
      day: "numeric",
      month: "short",
      timeZone: timezone,
      year: "numeric",
    }).format(instant),
    time: new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(instant),
  });
}

export function analyzedTradeTrackerHref(row: DailyTradeAnalyzedTradePage["rows"][number], interval: "1m" | "5m", basis: "gross" | "net"): string {
  const params = new URLSearchParams({ trade: row.roundTripId, interval, basis });
  if (row.firstExecutionId) params.set("event", row.firstExecutionId);
  return `/trade-tracker/${row.trackerDate}?${params.toString()}`;
}

export function AnalyzedTradesIndex({
  currency,
  dateRange,
  endDate,
  initialPage = null,
  moneyBasis,
  offline = false,
  startDate,
  indicatorQuery = "",
}: {
  indicatorQuery?: string;
  currency: string | null;
  dateRange: OverviewDateRange;
  endDate: string | null;
  initialPage?: DailyTradeAnalyzedTradePage | null;
  moneyBasis: "gross" | "net";
  offline?: boolean;
  startDate: string | null;
}) {
  const theme = useTheme();
  const [draftTicker, setDraftTicker] = useState("");
  const [ticker, setTicker] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [cursors, setCursors] = useState<Record<number, string | null>>({
    1: null,
    2: initialPage?.continuationCursor ?? null,
  });
  const [result, setResult] = useState<DailyTradeAnalyzedTradePage | null>(initialPage);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(initialPage ? "ready" : "idle");

  useEffect(() => {
    if (offline || draftTicker.trim() === ticker) return;
    const timeout = window.setTimeout(() => {
      setTicker(draftTicker.trim());
      setPage(1);
      setCursors({ 1: null });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftTicker, offline, ticker]);

  const cursor = cursors[page] ?? null;

  useEffect(() => {
    if (offline) return;
    if (!currency) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      basis: moneyBasis,
      currency,
      pageSize: String(pageSize),
      ticker,
    });
    if (startDate && endDate) {
      params.set("start", startDate);
      params.set("end", endDate);
    }
    if (cursor) params.set("cursor", cursor);
    for (const [key, value] of new URLSearchParams(indicatorQuery)) {
      if (key.startsWith("indicator_") || key === "direction") params.set(key, value);
    }
    queueMicrotask(() => {
      if (!controller.signal.aborted) setState("loading");
    });
    void fetch(`/api/platform/trade-analyzer/analyzed-trades?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      const payload = await response.json() as PageResponse;
      if (controller.signal.aborted) return;
      if (!response.ok || payload.status !== "ready" || !payload.page) {
        throw new Error("Analyzed trades are unavailable.");
      }
      setResult(payload.page);
      setCursors((current) => current[page + 1] === payload.page!.continuationCursor
        ? current
        : { ...current, [page + 1]: payload.page!.continuationCursor });
      setState("ready");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Analyzed Trades request failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setState("error");
    });
    return () => controller.abort();
  }, [currency, cursor, endDate, moneyBasis, offline, page, pageSize, startDate, ticker, indicatorQuery]);

  const resolvedState = currency ? state : "ready";
  const rows = currency
    ? (result?.rows ?? []).filter((row) => !offline || row.symbol.toUpperCase().includes(draftTicker.trim().toUpperCase()))
    : [];
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}>
        <Box sx={{
          maxWidth: 240,
          width: "100%",
          "& .MuiCardContent-root > .MuiStack-root .MuiTypography-caption": { color: "warning.main", fontSize: "1.125rem" },
          "& .MuiCardContent-root > .MuiStack-root .MuiTypography-root:not(.MuiTypography-caption)": { color: "warning.main" },
        }}>
          <DashboardMetricCard
            action={<AnalyzerHelpTooltip label="analyzed trades" text="Ready Trade Analyzer records in the selected period." />}
            caption=""
            hideCaption
            label="Analyzed trades"
            value={String(result?.totalRowCount ?? 0)}
          />
        </Box>
        <TradeAnalysisRangeAndBasisControls dateRange={dateRange} moneyBasis={moneyBasis} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label="Ticker"
          onChange={(event) => setDraftTicker(event.target.value)}
          placeholder="Search ticker"
          size="small"
          value={draftTicker}
        />
      </Stack>
      {result?.indicatorSummary ? <Alert severity="info">{result.indicatorSummary}{!offline ? <Button size="small" href={`/analytics/trade-analyzer/day/trend-momentum?${indicatorQuery}`}>Change indicator conditions</Button> : null}</Alert> : null}
      {resolvedState === "loading" && !result ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 4 }}>
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading analyzed trades…</Typography>
        </Stack>
      ) : null}
      {resolvedState === "error" ? (
        <Alert severity="error">Analyzed trades could not be loaded. Try again.</Alert>
      ) : null}
      {resolvedState === "ready" && rows.length === 0 ? currency ? (
        <Typography color="text.secondary">No analyzed trades match these filters.</Typography>
      ) : (
        <Typography
          sx={{
            color: theme.palette.mode === "dark"
              ? theme.palette.text.primary
              : theme.palette.text.secondary,
          }}
        >
          No saved trade analyses are available.
        </Typography>
      ) : null}

      {rows.length > 0 ? (
          <HorizontalScrollRegion label="Analyzed trades table" minTableWidth={1040} stickyFirstColumn>
            <Table aria-label="Analyzed trades" size="small">
              <TableHead>
                <TableRow>
                  {[
                    ["Ticker", "The symbol for your saved trade. When indicator conditions are selected, the note explains why this trade appears."],
                    ["Date", "Final closing date of your saved trade, including all round trips you grouped together."],
                    ["Direction", "Whether your saved trade was long or short."],
                    ["Entry time", "Time of the first execution in the saved trade, in your account timezone."],
                    ["Exit time", "Time of the final closing execution in the saved trade, in your account timezone."],
                    [`${moneyBasis === "gross" ? "Gross" : "Net"} result`, "The whole saved trade's result, counted once. Unavailable does not mean zero or a loss."],
                    ["Return", "The saved trade's selected result divided by its total entry notional."],
                    ["Executions", "All saved executions in this trade, including re-entries and interim position closures."],
                  ].map(([label, help], index) => <TableCell key={label} align={index >= 5 ? "right" : "left"}><Stack component="span" direction="row" sx={{ alignItems: "center", justifyContent: index >= 5 ? "flex-end" : "flex-start" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack></TableCell>)}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const opened = dateTime(row.openedAtUtc, result!.timezone);
                  const closed = dateTime(row.closedAtUtc, result!.timezone);
                  return (
                    <TableRow hover key={row.roundTripId}>
                      <TableCell sx={{ fontWeight: 850 }}>{row.symbol}{row.whyIncluded ? <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 280 }}>{row.whyIncluded}</Typography> : null}</TableCell>
                      <TableCell>{closed.date}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{row.direction}</TableCell>
                      <TableCell>{opened.time}</TableCell>
                      <TableCell>{closed.time}</TableCell>
                      <TableCell align="right" sx={{ color: financialOutcomeColor(row.resultDecimal), fontWeight: 800 }}>
                        {money(row.resultDecimal, currency!)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: financialOutcomeColor(row.returnPercentDecimal) }}>{percent(row.returnPercentDecimal)}</TableCell>
                      <TableCell align="right">{row.executionCount}</TableCell>
                      <TableCell align="right">
                        <Button endIcon={<OpenInNewIcon />} href={offline ? `/trade-tracker/${row.trackerDate}` : analyzedTradeTrackerHref(row, new URLSearchParams(indicatorQuery).get("indicator_interval") === "5m" ? "5m" : "1m", moneyBasis)} size="small" variant="outlined">
                          {offline ? "Open saved day" : "View full analysis"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </HorizontalScrollRegion>
      ) : null}
      {currency && !offline ? (
        <TradeAnalyzerTablePagination
          onPageChange={(nextPage) => {
            if (nextPage < page || (cursors[nextPage] ?? null) !== null) setPage(nextPage);
          }}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
            setCursors({ 1: null });
          }}
          page={page}
          pageSize={pageSize}
          rowCount={result?.totalRowCount ?? 0}
        />
      ) : null}
    </Stack>
  );
}
