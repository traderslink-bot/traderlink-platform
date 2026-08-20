"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";
import type { DailyTradeChartInterval } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { MoomooMarketDataConnectionPrompt } from "../moomoo-market-data-connection-prompt";

const DailyTradeAnalyzerChart = dynamic(
  () => import("@/app/(dashboard)/trade-tracker/[sessionDate]/daily-trade-analyzer-chart")
    .then((module) => module.DailyTradeAnalyzerChart),
  { ssr: false },
);

export type AnalyticsTradeDetail = Readonly<{
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
  showMoomooConnectionGuidance: boolean;
  status: "loading" | "ready" | "error";
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

async function loadTrade(trade: AnalyticsTradeDetail): Promise<LoadedTrade> {
  try {
    const detailsUrl = `/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(trade.roundTripId)}`;
    const analysisUrl = `/api/platform/trade-analyzer/trade?roundTripId=${encodeURIComponent(trade.roundTripId)}&direction=${trade.direction}`;
    const marketDataAccessUrl = "/api/platform/moomoo-market-data-access";
    const [detailsResponse, analysisResponse, marketDataAccessResponse] = await Promise.all([
      fetch(detailsUrl, { cache: "no-store" }),
      fetch(analysisUrl, { cache: "no-store" }),
      fetch(marketDataAccessUrl, { cache: "no-store" }),
    ]);
    if (!detailsResponse.ok) throw new Error("details_unavailable");
    const details = await detailsResponse.json() as Readonly<{
      trades?: readonly Readonly<{ executions: readonly ExactExecution[]; roundTripId: string }>[];
    }>;
    const analysisPayload = await analysisResponse.json() as Readonly<{
      analysis?: DaySessionTradeAnalyzer;
      status?: string;
    }>;
    const marketDataAccess = marketDataAccessResponse.ok
      ? await marketDataAccessResponse.json() as Readonly<{ showConnectionGuidance?: boolean }>
      : null;
    return Object.freeze({
      analysis: analysisResponse.ok && analysisPayload.status === "ready"
        ? analysisPayload.analysis ?? null
        : null,
      executions: details.trades?.find((item) => item.roundTripId === trade.roundTripId)?.executions ?? [],
      showMoomooConnectionGuidance: marketDataAccess?.showConnectionGuidance === true,
      status: "ready" as const,
    });
  } catch {
    return Object.freeze({ analysis: null, executions: Object.freeze([]), showMoomooConnectionGuidance: false, status: "error" as const });
  }
}

export function AnalyticsTradeDetailDrawer({
  currency,
  error,
  hasMore,
  loading,
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
      [trade.roundTripId]: Object.freeze({ analysis: null, executions: Object.freeze([]), showMoomooConnectionGuidance: false, status: "loading" as const }),
    }));
    const result = await loadTrade(trade);
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
                        loaded.showMoomooConnectionGuidance ? <MoomooMarketDataConnectionPrompt compact surface="drawer" /> : (
                          <Typography color="text.secondary" variant="body2">
                            A saved Trade Analyzer chart is not available for this trade.
                          </Typography>
                        )
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
  onClose,
  open,
  startDate,
  ticker,
}: {
  endDate: string | null;
  onClose: () => void;
  open: boolean;
  startDate: string | null;
  ticker: string | null;
}) {
  const requestRevision = useRef(0);
  const [currency, setCurrency] = useState<string | null>(null);
  const [trades, setTrades] = useState<readonly AnalyticsTradeDetail[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (after: string | null, append: boolean) => {
    if (!ticker) return;
    const revision = ++requestRevision.current;
    if (!append) {
      setTrades([]);
      setNextCursor(null);
    }
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ symbol: ticker });
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
      }>;
      if (revision !== requestRevision.current) return;
      setCurrency(payload.currency);
      setTrades((current) => append ? Object.freeze([...current, ...payload.rows]) : payload.rows);
      setNextCursor(payload.nextCursor);
    } catch {
      if (revision === requestRevision.current) setError("Completed trades could not be loaded.");
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [endDate, startDate, ticker]);

  useEffect(() => {
    if (!open || !ticker) return;
    void fetchPage(null, false);
    return () => {
      requestRevision.current += 1;
    };
  }, [fetchPage, open, ticker]);

  return (
    <AnalyticsTradeDetailDrawer
      currency={currency}
      error={error}
      hasMore={nextCursor !== null}
      loading={loading}
      onClose={onClose}
      onLoadMore={() => void fetchPage(nextCursor, true)}
      open={open}
      title={ticker ?? "Ticker trades"}
      trades={trades}
    />
  );
}
