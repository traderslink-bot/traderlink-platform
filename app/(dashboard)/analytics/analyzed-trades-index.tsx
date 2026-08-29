"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
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
import { useEffect, useState } from "react";

import type { DailyTradeAnalyzedTradePage } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";

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

function trackerHref(row: DailyTradeAnalyzedTradePage["rows"][number]): string {
  const params = new URLSearchParams({ trade: row.roundTripId, interval: "1m" });
  if (row.firstExecutionId) params.set("event", row.firstExecutionId);
  return `/trade-tracker/${row.trackerDate}?${params.toString()}`;
}

export function AnalyzedTradesIndex({
  currency,
  endDate,
  initialPage = null,
  moneyBasis,
  offline = false,
  startDate,
}: {
  currency: string | null;
  endDate: string | null;
  initialPage?: DailyTradeAnalyzedTradePage | null;
  moneyBasis: "gross" | "net";
  offline?: boolean;
  startDate: string | null;
}) {
  const [draftTicker, setDraftTicker] = useState("");
  const [ticker, setTicker] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 1: null });
  const [result, setResult] = useState<DailyTradeAnalyzedTradePage | null>(initialPage);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(initialPage ? "ready" : "idle");

  useEffect(() => {
    if (offline) return;
    const timeout = window.setTimeout(() => {
      setTicker(draftTicker.trim());
      setPage(1);
      setCursors({ 1: null });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftTicker, offline]);

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
    queueMicrotask(() => {
      if (!controller.signal.aborted) setState("loading");
    });
    void fetch(`/api/platform/trade-analyzer/analyzed-trades?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      const payload = await response.json() as PageResponse;
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
  }, [currency, cursor, endDate, moneyBasis, offline, page, pageSize, startDate, ticker]);

  const resolvedState = currency ? state : "ready";
  const rows = currency
    ? (result?.rows ?? []).filter((row) => !offline || row.symbol.toUpperCase().includes(draftTicker.trim().toUpperCase()))
    : [];
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label="Ticker"
          onChange={(event) => setDraftTicker(event.target.value)}
          placeholder="Search ticker"
          size="small"
          value={draftTicker}
        />
      </Stack>
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
      {resolvedState === "loading" && !result ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 4 }}>
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading analyzed trades…</Typography>
        </Stack>
      ) : null}
      {resolvedState === "error" ? (
        <Alert severity="error">Analyzed trades could not be loaded. Try again.</Alert>
      ) : null}
      {resolvedState === "ready" && rows.length === 0 ? (
        <Typography color="text.secondary">
          {currency ? "No analyzed trades match these filters." : "No saved trade analyses are available."}
        </Typography>
      ) : null}

      {rows.length > 0 ? (
          <HorizontalScrollRegion label="Analyzed trades table" minTableWidth={1040} stickyFirstColumn>
            <Table aria-label="Analyzed trades" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Entry time</TableCell>
                  <TableCell>Exit time</TableCell>
                  <TableCell align="right">{moneyBasis === "gross" ? "Gross" : "Net"} result</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Executions</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const opened = dateTime(row.openedAtUtc, result!.timezone);
                  const closed = dateTime(row.closedAtUtc, result!.timezone);
                  return (
                    <TableRow hover key={row.roundTripId}>
                      <TableCell sx={{ fontWeight: 850 }}>{row.symbol}</TableCell>
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
                        <Button endIcon={<OpenInNewIcon />} href={offline ? `/trade-tracker/${row.trackerDate}` : trackerHref(row)} size="small" variant="outlined">
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
    </Stack>
  );
}
