"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
import type {
  CandleReviewRecord,
  CandleReviewTarget,
} from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { FeatureHelpLink } from "../../feature-help-link";
import { formatJournalAnalyticsMoney } from
  "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";

function decimal(value: string | number): string {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "N/A";
}

function easternTime(value: string | number): string {
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(date);
}

function CandleChart({ currency, review }: { currency: string; review: CandleReviewRecord }) {
  const container = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!container.current || review.candles.length === 0) return;
    const chart = createChart(container.current, {
      autoSize: true,
      height: 420,
      layout: {
        background: { color: "#ffffff", type: ColorType.Solid },
        textColor: "#334155",
      },
      grid: {
        horzLines: { color: "#e2e8f0" },
        vertLines: { color: "#e2e8f0" },
      },
      rightPriceScale: { borderColor: "#cbd5e1" },
      timeScale: { borderColor: "#cbd5e1", timeVisible: true, secondsVisible: false },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#16845b",
      downColor: "#c43d4b",
      borderUpColor: "#16845b",
      borderDownColor: "#c43d4b",
      wickUpColor: "#16845b",
      wickDownColor: "#c43d4b",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    series.setData(review.candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: Number(candle.openDecimal),
      high: Number(candle.highDecimal),
      low: Number(candle.lowDecimal),
      close: Number(candle.closeDecimal),
    })));
    createSeriesMarkers(series, [
      {
        time: Math.floor(Date.parse(review.target.openedAtUtc) / 1000) as UTCTimestamp,
        position: review.target.direction === "long" ? "belowBar" : "aboveBar",
        color: "#011E56",
        shape: review.target.direction === "long" ? "arrowUp" : "arrowDown",
        text: `Entry ${formatJournalAnalyticsMoney(review.target.entryPriceDecimal, currency)}`,
      },
      {
        time: Math.floor(Date.parse(review.target.closedAtUtc) / 1000) as UTCTimestamp,
        position: review.target.direction === "long" ? "aboveBar" : "belowBar",
        color: "#7c3aed",
        shape: review.target.direction === "long" ? "arrowDown" : "arrowUp",
        text: `Exit ${formatJournalAnalyticsMoney(review.target.exitPriceDecimal, currency)}`,
      },
    ]);
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [currency, review]);
  return <Box ref={container} sx={{ height: 420, width: "100%" }} />;
}

export function TradeCandleReviewClient({
  currency,
  initialReview,
  offlineSavedAtUtc,
  selectionRef,
  trade,
}: {
  currency: string;
  initialReview: CandleReviewRecord | null;
  offlineSavedAtUtc?: string;
  selectionRef: string;
  trade: CandleReviewTarget;
}) {
  const [review, setReview] = useState(initialReview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/trade-candle-analysis/review", {
        body: JSON.stringify({
          roundTripId: trade.roundTripId,
          expectedAccountSelectionRef: selectionRef,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = await response.json() as {
        currency?: string;
        ok?: unknown;
        message?: unknown;
        record?: CandleReviewRecord;
      };
      if (!response.ok || body.ok !== true || !body.record) {
        setError(typeof body.message === "string"
          ? body.message
          : "Candle review could not be completed. Try again later.");
        return;
      }
      setReview(body.record);
    } catch {
      setError("Candle review could not be completed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      {offlineSavedAtUtc ? (
        <OfflineSavedViewStatus
          message="This saved candle review is available offline. Reconnect to analyze another trade or refresh market data."
          savedAtUtc={offlineSavedAtUtc}
        />
      ) : null}
      <DashboardPanel
        action={(
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <FeatureHelpLink href="/help/candle-review/run-and-read-review#analyze-on-demand" label="candle review action" />
            {offlineSavedAtUtc ? null : review === null ? (
          <DashboardPrimaryAction disabled={loading} onClick={analyze}>
            {loading ? "Analyzing trade…" : "Analyze this trade"}
          </DashboardPrimaryAction>
        ) : (
          <DashboardSecondaryAction disabled={loading} onClick={analyze}>
            {loading ? "Refreshing…" : "Refresh candle review"}
          </DashboardSecondaryAction>
            )}
          </Stack>
        )}
        title="Candle review"
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary" variant="body2">
            One-minute Yahoo candles are requested only when you use this action. Extended-hours candles are included. TraderLink saves normalized market facts and their verification digest, never the raw provider response.
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip label={`${trade.direction === "long" ? "Long" : "Short"} ${trade.symbol}`} size="small" />
            <Chip label={`Entry ${formatJournalAnalyticsMoney(trade.entryPriceDecimal, currency)} · ${easternTime(trade.openedAtUtc)}`} size="small" variant="outlined" />
            <Chip label={`Exit ${formatJournalAnalyticsMoney(trade.exitPriceDecimal, currency)} · ${easternTime(trade.closedAtUtc)}`} size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="caption">
            {review
              ? `${review.status.replaceAll("_", " ")} · reviewed ${easternTime(review.analyzedAtUtc)}`
              : "No market-data request has been made for this trade."}
          </Typography>
        </Stack>
      </DashboardPanel>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {review?.status === "provider_unavailable" ? (
        <Alert severity="warning">The market-data provider was unavailable. The failed request was recorded, but no chart or feedback was invented.</Alert>
      ) : null}
      {review?.status === "no_coverage" ? (
        <Alert severity="info">The required one-minute coverage was unavailable or incomplete. The trade remains valid Trade Tracker data; only this market-data-dependent review is unavailable.</Alert>
      ) : null}
      {review?.status === "unsupported" ? (
        <Alert severity="info">This longer-duration or non-stock trade needs a reviewed market-data interval before Candle Review can analyze it.</Alert>
      ) : null}

      {review && review.candles.length > 0 ? (
        <DashboardPanel action={<FeatureHelpLink href="/help/candle-review/run-and-read-review#read-price-path" label="price path" />} title="Price path">
          <CandleChart currency={currency} review={review} />
        </DashboardPanel>
      ) : null}

      {review ? (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { md: "repeat(3, minmax(0, 1fr))", xs: "1fr" } }}>
          {([
            ["Profit giveback", review.analysis.profitGiveback],
            ["Exit timing", review.analysis.exitTiming],
            ["Entry timing", review.analysis.entryTiming],
          ] as const).map(([title, feedback]) => (
            <DashboardPanel key={title} title={title}>
              <Typography sx={{ fontWeight: 700 }} variant="body2">{feedback.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{feedback.detail}</Typography>
            </DashboardPanel>
          ))}
        </Box>
      ) : null}

      {review && review.observations.length > 0 ? (
        <DashboardPanel title="Execution context">
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {review.observations.map((observation) => (
              <Chip
                key={`${observation.zone}-${observation.kind}-${observation.time}`}
                label={`${observation.zone.replace("_", " ")} · ${candlePatternName(observation.kind)} · ${easternTime(observation.time)}`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      {review && review.indicators.length > 0 ? (
        <DashboardPanel title="Indicator context">
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))", xs: "1fr" } }}>
            {review.indicators.map((snapshot) => (
              <Box key={snapshot.phase} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }} variant="body2">{snapshot.phase}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                  EMA 9 {snapshot.ema9 === null ? "—" : decimal(snapshot.ema9)} · EMA 20 {snapshot.ema20 === null ? "—" : decimal(snapshot.ema20)} · RSI 14 {snapshot.rsi14 === null ? "—" : decimal(snapshot.rsi14)}
                </Typography>
                <Typography color="text.secondary" sx={{ display: "block", mt: 0.5 }} variant="caption">
                  VWAP {snapshot.vwap === null ? "—" : decimal(snapshot.vwap)} · MACD {snapshot.macd === null ? "—" : decimal(snapshot.macd)} · ATR 14 {snapshot.atr14 === null ? "—" : decimal(snapshot.atr14)} · ADR 20 {snapshot.adr20 === null ? "—" : decimal(snapshot.adr20)}
                </Typography>
              </Box>
            ))}
          </Box>
        </DashboardPanel>
      ) : null}
    </Stack>
  );
}
