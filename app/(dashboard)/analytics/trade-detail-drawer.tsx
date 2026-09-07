"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalAnalyticsMoneyBasis } from "@/src/modules/journal-analytics/contracts/analytics-query";
import { JournalTagChip } from "@/app/(dashboard)/trade-tags/journal-tag-picker";

import type { DaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import type { DailyTradeChartInterval } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

const DailyTradeAnalyzerChart = dynamic(
  () => import("@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart")
    .then((module) => module.DailyTradeAnalyzerChart),
  { ssr: false },
);

export type AnalyticsTradeDetail = Readonly<{
  closeLocalDate?: string;
  closedAtUtc: string;
  direction: "long" | "short";
  openedAtUtc: string;
  roundTripId: string;
  selectedPnlDecimal: string | null;
  ticker: string;
  tradeClassification: "day_trade" | "multi_day_trade";
  uniqueExecutionCount: number;
}>;

type ExactExecution = Readonly<{
  execution_id: string;
  executed_at_utc: string;
  price_decimal: string | null;
  quantity_decimal: string;
  side: "buy" | "sell";
}>;

type LoadedTrade = Readonly<{
  analysis: DaySessionTradeAnalyzer | null;
  executions: readonly ExactExecution[];
  status: "loading" | "ready" | "error";
}>;

type TickerSupportingDetail = Readonly<{
  brokenRules: readonly string[];
  executions: readonly ExactExecution[];
  notes: readonly string[];
  roundTripId: string;
  ruleCount: number;
  tags: readonly string[];
}>;

function timestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function money(value: string | null, currency: string | null): string {
  return value === null ? "Unavailable" : formatJournalAnalyticsMoney(value, currency);
}

function signedMoney(value: string | null, currency: string | null): string {
  return value === null
    ? "Unavailable"
    : formatJournalAnalyticsMoney(value, currency, { showPositiveSign: true });
}

function pnlSign(value: string | null): -1 | 0 | 1 | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number < 0 ? -1 : number > 0 ? 1 : 0 : null;
}

function pnlTone(sign: -1 | 0 | 1 | null) {
  if (sign === -1) return {
    backgroundColor: (theme: Theme) => theme.palette.mode === "dark"
      ? alpha(theme.palette.error.main, 0.18)
      : "rgba(211, 47, 47, 0.10)",
    color: "error.main",
  };
  if (sign === 1) return {
    backgroundColor: (theme: Theme) => theme.palette.mode === "dark"
      ? alpha(theme.palette.success.main, 0.18)
      : "rgba(46, 125, 50, 0.11)",
    color: "success.main",
  };
  return {
    backgroundColor: (theme: Theme) => theme.palette.mode === "dark"
      ? theme.palette.action.selected
      : "rgba(1, 30, 86, 0.05)",
    color: "text.primary",
  };
}

function localDate(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateRangeLabel(startDate: string | null, endDate: string | null): string {
  return startDate && endDate
    ? startDate === endDate ? localDate(startDate) : `${localDate(startDate)} – ${localDate(endDate)}`
    : "All completed trade dates";
}

function executionTimestamp(value: string, timezone: string | null): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: timezone ?? undefined,
  }).format(new Date(value));
}

async function loadTrade(trade: AnalyticsTradeDetail, moneyBasis: JournalAnalyticsMoneyBasis): Promise<LoadedTrade> {
  try {
    const detailsUrl = `/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(trade.roundTripId)}`;
    const analysisUrl = `/api/platform/trade-analyzer/trade?roundTripId=${encodeURIComponent(trade.roundTripId)}&direction=${trade.direction}&basis=${moneyBasis}`;
    const [detailsResponse, analysisResponse] = await Promise.all([
      fetch(detailsUrl, { cache: "no-store" }),
      fetch(analysisUrl, { cache: "no-store" }),
    ]);
    if (!detailsResponse.ok) throw new Error("details_unavailable");
    const details = await detailsResponse.json() as Readonly<{
      trades?: readonly Readonly<{ executions: readonly ExactExecution[]; roundTripId: string }>[];
    }>;
    const analysisPayload = await analysisResponse.json() as Readonly<{
      analysis?: DaySessionTradeAnalyzer;
      status?: string;
    }>;
    return Object.freeze({
      analysis: analysisResponse.ok && analysisPayload.status === "ready"
        ? analysisPayload.analysis ?? null
        : null,
      executions: details.trades?.find((item) => item.roundTripId === trade.roundTripId)?.executions ?? [],
      status: "ready" as const,
    });
  } catch {
    return Object.freeze({ analysis: null, executions: Object.freeze([]), status: "error" as const });
  }
}

export function AnalyticsTradeDetailDrawer({
  currency,
  error,
  hasMore,
  loading,
  moneyBasis = "net",
  onClose,
  onLoadMore,
  open,
  title,
  trades,
}: {
  currency: string | null;
  error?: string | null;
  hasMore?: boolean;
  loading?: boolean;
  moneyBasis?: JournalAnalyticsMoneyBasis;
  onClose: () => void;
  onLoadMore?: () => void;
  open: boolean;
  title: string;
  trades: readonly AnalyticsTradeDetail[];
}) {
  const requestRevision = useRef(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadedById, setLoadedById] = useState<Readonly<Record<string, LoadedTrade>>>({});
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [interval, setInterval] = useState<DailyTradeChartInterval>("1m");

  function closeDrawer(): void {
    requestRevision.current += 1;
    setExpandedId(null);
    setLoadedById({});
    setSelectedExecutionId(null);
    setInterval("1m");
    onClose();
  }

  const toggleTrade = async (trade: AnalyticsTradeDetail) => {
    if (expandedId === trade.roundTripId) {
      setExpandedId(null);
      setSelectedExecutionId(null);
      return;
    }
    setExpandedId(trade.roundTripId);
    setSelectedExecutionId(null);
    setInterval("1m");
    if (loadedById[trade.roundTripId]) return;
    const revision = ++requestRevision.current;
    setLoadedById((current) => ({
      ...current,
      [trade.roundTripId]: Object.freeze({ analysis: null, executions: Object.freeze([]), status: "loading" as const }),
    }));
    const result = await loadTrade(trade, moneyBasis);
    if (revision !== requestRevision.current) return;
    setLoadedById((current) => ({ ...current, [trade.roundTripId]: result }));
  };

  return (
    <Drawer
      anchor="right"
      onClose={closeDrawer}
      open={open}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 620 } } } }}
    >
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">{title}</Typography>
            <Typography color="text.secondary" variant="body2">Completed trades and exact executions</Typography>
          </Box>
          <IconButton aria-label="Close trade details" onClick={closeDrawer} sx={{ minHeight: 44, minWidth: 44 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading && trades.length === 0 ? (
            <Stack spacing={1} sx={{ alignItems: "center", minHeight: 180, justifyContent: "center" }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Loading completed trades…</Typography>
            </Stack>
          ) : null}
          {!loading && !error && trades.length === 0 ? (
            <Typography color="text.secondary">No completed trades are available for this ticker and date range.</Typography>
          ) : null}
          <Stack divider={<Divider flexItem />}>
            {trades.map((trade) => {
              const expanded = expandedId === trade.roundTripId;
              const loaded = loadedById[trade.roundTripId];
              return (
                <Box key={trade.roundTripId} sx={{ py: 1.5 }}>
                  <Button
                    aria-expanded={expanded}
                    endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                    fullWidth
                    onClick={() => void toggleTrade(trade)}
                    sx={{ justifyContent: "space-between", minHeight: 56, textAlign: "left" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850 }}>{trade.ticker} · {trade.direction === "long" ? "Long" : "Short"}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {timestamp(trade.closedAtUtc)} · {trade.uniqueExecutionCount} execution{trade.uniqueExecutionCount === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                    <Typography color={trade.selectedPnlDecimal?.startsWith("-") ? "error.main" : "success.main"} sx={{ fontWeight: 850, ml: 1 }}>
                      {money(trade.selectedPnlDecimal, currency)}
                    </Typography>
                  </Button>
                  {expanded ? (
                    <Stack spacing={1.5} sx={{ pb: 1, pt: 1.5 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Box><Typography color="text.secondary" variant="caption">Opened</Typography><Typography variant="body2">{timestamp(trade.openedAtUtc)}</Typography></Box>
                        <Box><Typography color="text.secondary" variant="caption">Closed</Typography><Typography variant="body2">{timestamp(trade.closedAtUtc)}</Typography></Box>
                        <Box><Typography color="text.secondary" variant="caption">Trade type</Typography><Typography variant="body2">{trade.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade"}</Typography></Box>
                      </Stack>
                      {loaded?.status === "loading" ? <CircularProgress size={24} /> : null}
                      {loaded?.status === "error" ? <Alert severity="error">Exact executions could not be loaded.</Alert> : null}
                      {loaded?.status === "ready" && loaded.analysis && currency ? (
                        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                          <DailyTradeAnalyzerChart
                            analysis={loaded.analysis}
                            currency={currency}
                            direction={trade.direction}
                            interval={interval}
                            onIntervalChange={setInterval}
                            selectedEventId={selectedExecutionId}
                            symbol={trade.ticker}
                            tradeLabelColor={trade.selectedPnlDecimal?.startsWith("-") ? "error" : "success"}
                            tradeNumber={1}
                          />
                        </Box>
                      ) : null}
                      {loaded?.status === "ready" && !loaded.analysis ? (
                        <Typography color="text.secondary" variant="body2">
                          A saved Trade Analyzer chart is not available for this trade.
                        </Typography>
                      ) : null}
                      {loaded?.status === "ready" ? (
                        <Stack spacing={0.75}>
                          <Typography sx={{ fontWeight: 850 }}>Exact executions</Typography>
                          {loaded.executions.length === 0 ? <Typography color="text.secondary" variant="body2">No executions are available.</Typography> : null}
                          {loaded.executions.map((execution) => (
                            <Button
                              key={execution.execution_id}
                              onClick={() => setSelectedExecutionId(execution.execution_id)}
                              sx={{ border: 1, borderColor: selectedExecutionId === execution.execution_id ? "primary.main" : "divider", justifyContent: "space-between", minHeight: 48, textAlign: "left" }}
                              variant={selectedExecutionId === execution.execution_id ? "contained" : "text"}
                            >
                              <Box>
                                <Typography variant="body2">{execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantity_decimal)} shares</Typography>
                                <Typography color="text.secondary" variant="caption">{timestamp(execution.executed_at_utc)}</Typography>
                              </Box>
                              <Typography sx={{ fontWeight: 800 }}>{money(execution.price_decimal, currency)}</Typography>
                            </Button>
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
          {hasMore && onLoadMore ? (
            <Button disabled={loading} fullWidth onClick={onLoadMore} sx={{ mt: 2 }} variant="outlined">
              {loading ? "Loading…" : "Load more trades"}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Drawer>
  );
}

export function TickerTradeDetailDrawer({
  endDate,
  moneyBasis = "net",
  onClose,
  open,
  pnlDecimal,
  startDate,
  ticker,
}: {
  endDate: string | null;
  moneyBasis?: JournalAnalyticsMoneyBasis;
  onClose: () => void;
  open: boolean;
  pnlDecimal: string | null;
  startDate: string | null;
  ticker: string | null;
}) {
  const requestRevision = useRef(0);
  const [currency, setCurrency] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [trades, setTrades] = useState<readonly AnalyticsTradeDetail[]>([]);
  const [detailsById, setDetailsById] = useState<Readonly<Record<string, TickerSupportingDetail>>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportingDetailsError, setSupportingDetailsError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPage = useCallback(async (after: string | null, append: boolean) => {
    if (!ticker) return;
    const revision = ++requestRevision.current;
    if (!append) {
      setTrades([]);
      setDetailsById({});
      setNextCursor(null);
      setExpandedId(null);
    }
    setLoading(true);
    setError(null);
    setSupportingDetailsError(false);
    const query = new URLSearchParams({ symbol: ticker });
    query.set("basis", moneyBasis);
    if (startDate && endDate) {
      query.set("start", startDate);
      query.set("end", endDate);
    }
    if (after) query.set("after", after);
    try {
      const response = await fetch(`/api/platform/journal/analytics/trade-details?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("trade_details_unavailable");
      const payload = await response.json() as Readonly<{
        currency: string | null;
        nextCursor: string | null;
        rows: readonly AnalyticsTradeDetail[];
        timezone: string | null;
      }>;
      if (revision !== requestRevision.current) return;
      setCurrency(payload.currency);
      setTimezone(payload.timezone);
      setTrades((current) => append ? Object.freeze([...current, ...payload.rows]) : payload.rows);
      setNextCursor(payload.nextCursor);
      if (payload.rows.length > 0) {
        try {
          const detailResponse = await fetch(
            `/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(payload.rows.map((row) => row.roundTripId).join(","))}`,
            { cache: "no-store" },
          );
          if (!detailResponse.ok) throw new Error("supporting_details_unavailable");
          const detailPayload = await detailResponse.json() as Readonly<{
            trades?: readonly TickerSupportingDetail[];
          }>;
          if (revision !== requestRevision.current) return;
          setDetailsById((current) => Object.freeze({
            ...current,
            ...Object.fromEntries((detailPayload.trades ?? []).map((detail) => [detail.roundTripId, detail])),
          }));
        } catch {
          if (revision === requestRevision.current) setSupportingDetailsError(true);
        }
      }
    } catch {
      if (revision === requestRevision.current) setError("Completed trades could not be loaded.");
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [endDate, moneyBasis, startDate, ticker]);

  useEffect(() => {
    if (!open || !ticker) return;
    void fetchPage(null, false);
    return () => {
      requestRevision.current += 1;
    };
  }, [fetchPage, open, ticker]);

  const closeDrawer = () => {
    requestRevision.current += 1;
    setExpandedId(null);
    onClose();
  };

  return <Drawer
    anchor="right"
    onClose={closeDrawer}
    open={open}
    slotProps={{ paper: { sx: { p: { xs: 2, sm: 3 }, width: { xs: "100%", sm: 520 } } } }}
  >
    <Stack sx={{ minHeight: 0 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 900 }} variant="h5">{ticker ?? "Ticker"}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {dateRangeLabel(startDate, endDate)}
          </Typography>
        </Box>
        <Stack spacing={0.25} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
          <Button
            aria-label="Close ticker details"
            onClick={closeDrawer}
            size="small"
            startIcon={<CloseRoundedIcon />}
            sx={{ minHeight: 44 }}
          >
            Close
          </Button>
          <Typography
            color={pnlTone(pnlSign(pnlDecimal)).color}
            sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }}
          >
            {signedMoney(pnlDecimal, currency)}
          </Typography>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
      {supportingDetailsError ? (
        <Alert severity="warning" sx={{ mt: 2 }}>Saved trade notes, rules, tags or executions could not be loaded.</Alert>
      ) : null}
      {loading && trades.length === 0 ? (
        <Stack spacing={1} sx={{ alignItems: "center", minHeight: 180, justifyContent: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading completed trades…</Typography>
        </Stack>
      ) : null}
      {!loading && !error && trades.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>No completed trades are available for this ticker and date range.</Typography>
      ) : null}

      <Stack spacing={1} sx={{ mt: 2 }}>
        {trades.map((trade) => {
          const detail = detailsById[trade.roundTripId];
          const tone = pnlTone(pnlSign(trade.selectedPnlDecimal));
          const tradeDate = trade.closeLocalDate ?? trade.closedAtUtc.slice(0, 10);
          return <Accordion
            disableGutters
            elevation={0}
            expanded={expandedId === trade.roundTripId}
            key={trade.roundTripId}
            onChange={(_, isExpanded) => setExpandedId(isExpanded ? trade.roundTripId : null)}
            sx={{
              backgroundColor: tone.backgroundColor,
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              "&:before": { display: "none" },
              overflow: "hidden",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 1.5 }}>
              <Box sx={{ minWidth: 0, width: "100%" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between", pr: 1 }}>
                  <Typography sx={{ fontWeight: 850 }}>{localDate(tradeDate)}</Typography>
                  <Typography color={tone.color} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}>
                    {signedMoney(trade.selectedPnlDecimal, currency)}
                  </Typography>
                </Stack>
                {detail && (detail.notes.length > 0 || detail.ruleCount > 0 || detail.tags.length > 0) ? (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.75 }} useFlexGap>
                    {detail.notes.length > 0 ? <Chip label={detail.notes.length === 1 ? "Notes" : `Notes ${detail.notes.length}`} size="small" variant="outlined" /> : null}
                    {detail.ruleCount > 0 ? <Chip label={`Rules ${detail.ruleCount}`} size="small" variant="outlined" /> : null}
                    {detail.tags.length > 0 ? <Chip label={`${detail.tags.length} Tags`} size="small" variant="outlined" /> : null}
                  </Stack>
                ) : null}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {!detail && !supportingDetailsError ? <Typography color="text.secondary" variant="body2">Loading trade details…</Typography> : null}
              {detail?.brokenRules.length ? (
                <Box sx={{ mt: 0.75 }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Broken rules</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.5 }} useFlexGap>
                    {detail.brokenRules.map((rule) => <Chip color="error" key={rule} label={rule} size="small" variant="outlined" />)}
                  </Stack>
                </Box>
              ) : null}
              {detail?.tags.length ? (
                <Box sx={{ mt: 1.25 }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Tags</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.5 }} useFlexGap>
                    {detail.tags.map((tag) => <JournalTagChip key={tag} label={tag} />)}
                  </Stack>
                </Box>
              ) : null}
              {detail?.notes.length ? (
                <Box sx={{ mt: 1.25 }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Notes</Typography>
                  {detail.notes.map((note, index) => <Typography key={`${note}-${index}`} sx={{ mt: 0.5, whiteSpace: "pre-wrap" }} variant="body2">{note}</Typography>)}
                </Box>
              ) : null}
              {detail ? (
                <Accordion disableGutters elevation={0} sx={{ backgroundColor: "transparent", "&:before": { display: "none" }, mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ minHeight: 48, px: 0 }}>
                    Show executions ({detail.executions.length})
                  </AccordionSummary>
                  <AccordionDetails sx={{ pb: 1, pl: 1.5, pr: 0 }}>
                    {detail.executions.length === 0 ? <Typography color="text.secondary" variant="body2">No executions are available.</Typography> : null}
                    <Stack divider={<Divider flexItem />} spacing={0.75}>
                      {detail.executions.map((execution, index) => (
                        <Stack key={`${execution.execution_id}-${index}`} spacing={0.25} sx={{ py: 0.75 }}>
                          <Typography color="text.secondary" variant="caption">{executionTimestamp(execution.executed_at_utc, timezone)}</Typography>
                          <Typography variant="body2">
                            {execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantity_decimal)} shares @ {money(execution.price_decimal, currency)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </AccordionDetails>
          </Accordion>;
        })}
      </Stack>
      {nextCursor !== null ? (
        <Button disabled={loading} fullWidth onClick={() => void fetchPage(nextCursor, true)} sx={{ mt: 2 }} variant="outlined">
          {loading ? "Loading…" : "Load more trades"}
        </Button>
      ) : null}
    </Stack>
  </Drawer>;
}
