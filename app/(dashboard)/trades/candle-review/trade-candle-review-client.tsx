"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";

type Feedback = { detail: string; title: string };

type Review = {
  analysis: {
    entryTiming: Feedback;
    exitTiming: Feedback;
    profitGiveback: Feedback;
  };
  analyzedAt: string;
  indicators: readonly {
    adr20: number | null;
    atr14: number | null;
    ema9: number | null;
    ema20: number | null;
    macd: number | null;
    macdHistogram: number | null;
    macdSignal: number | null;
    phase: "entry" | "exit";
    rsi14: number | null;
    vwap: number | null;
  }[];
  observations: readonly { kind: string; time: number; zone: "entry" | "exit" | "held_peak" }[];
  refreshAvailableAt: string;
  status: "no_coverage" | "ready";
};

type Trade = {
  direction: "long" | "short";
  entryPrice: number;
  entryTime: number;
  exitPrice: number;
  exitTime: number;
  semanticRoundTripKey: string;
  symbol: string;
};

const PATTERN_LABELS: Record<string, string> = {
  compression: "Compression",
  compression_break_bearish: "Compression break lower",
  compression_break_bullish: "Compression break higher",
  engulfing_bearish: "Bearish engulfing",
  engulfing_bullish: "Bullish engulfing",
  expansion_bearish: "Bearish expansion",
  expansion_bullish: "Bullish expansion",
  high_volume_exhaustion: "High-volume exhaustion",
  rejection_lower: "Lower-wick rejection",
  rejection_upper: "Upper-wick rejection",
};

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  compression: "A contained pause, not a directional signal.",
  compression_break_bearish: "An active candle closed below the compressed range.",
  compression_break_bullish: "An active candle closed above the compressed range.",
  engulfing_bearish: "An observed short-term bearish control shift.",
  engulfing_bullish: "An observed short-term bullish control shift.",
  expansion_bearish: "A wide bearish candle closed near its low.",
  expansion_bullish: "A wide bullish candle closed near its high.",
  high_volume_exhaustion: "An extended move hit unusually high volume and stalled.",
  rejection_lower: "A dominant lower wick rejected lower prices.",
  rejection_upper: "A dominant upper wick rejected higher prices.",
};

function price(value: number): string {
  return `$${value.toFixed(4)}`;
}

function indicatorValue(value: number | null): string {
  return value === null ? "—" : value.toFixed(4);
}

function easternTime(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(new Date(value * 1000));
}

function refreshLabel(value: string): string {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(time))
    : "later";
}

export function TradeCandleReviewClient({
  initialReview,
  trade,
}: {
  initialReview: Review | null;
  trade: Trade;
}) {
  const [review, setReview] = useState(initialReview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/trade-candle-analysis/review", {
        body: JSON.stringify({ semanticRoundTripKey: trade.semanticRoundTripKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== "object" || body === null || Array.isArray(body)) {
        setError("Candle review could not be completed. Try again later.");
        return;
      }
      const record = body as Partial<Review> & { message?: string };
      if (!record.analysis || !record.status || !record.analyzedAt || !record.refreshAvailableAt) {
        setError(record.message ?? "Candle review could not be completed. Try again later.");
        return;
      }
      setReview({
        analysis: record.analysis,
        analyzedAt: record.analyzedAt,
        observations: record.observations ?? [],
        indicators: record.indicators ?? [],
        refreshAvailableAt: record.refreshAvailableAt,
        status: record.status,
      });
    } catch {
      setError("Candle review could not be completed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <DashboardPanel
        action={
          review === null ? (
            <DashboardPrimaryAction disabled={loading} onClick={analyze}>
              {loading ? "Analyzing trade…" : "Analyze this trade"}
            </DashboardPrimaryAction>
          ) : (
            <DashboardSecondaryAction disabled={loading} onClick={analyze}>
              {loading ? "Refreshing…" : "Refresh candle review"}
            </DashboardSecondaryAction>
          )
        }
        title="Candle review"
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary" variant="body2">
            Yahoo one-minute candles are requested only when you use this action. The first 30 minutes after exit are the primary review; the following 30 minutes are context. Raw provider candles are not saved.
          </Typography>
          <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
            <Chip label={`${trade.direction === "long" ? "Long" : "Short"} ${trade.symbol}`} size="small" />
            <Chip label={`Entry ${price(trade.entryPrice)} · ${easternTime(trade.entryTime)}`} size="small" variant="outlined" />
            <Chip label={`Exit ${price(trade.exitPrice)} · ${easternTime(trade.exitTime)}`} size="small" variant="outlined" />
          </Stack>
          {review ? (
            <Typography color="text.secondary" variant="caption">
              {review.status === "ready" ? "Review saved" : "No usable candle coverage saved"} · Yahoo refresh is available at {refreshLabel(review.refreshAvailableAt)} ET.
            </Typography>
          ) : (
            <Typography color="text.secondary" variant="caption">
              No Yahoo request has been made for this trade.
            </Typography>
          )}
        </Stack>
      </DashboardPanel>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {review ? (
        <>
          {review.status === "no_coverage" ? (
            <Alert severity="info">No feedback was saved because the required Yahoo candle coverage was unavailable or incomplete.</Alert>
          ) : null}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { md: "repeat(3, minmax(0, 1fr))", xs: "1fr" },
            }}
          >
            {[
              ["Profit giveback", review.analysis.profitGiveback],
              ["Exit timing", review.analysis.exitTiming],
              ["Entry timing", review.analysis.entryTiming],
            ].map(([title, feedback]) => (
              <DashboardPanel key={title} title={title as string}>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {(feedback as Feedback).title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                  {(feedback as Feedback).detail}
                </Typography>
              </DashboardPanel>
            ))}
          </Box>
          {review.observations.length > 0 ? (
            <DashboardPanel title="Execution context">
              <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                {review.observations.map((observation) => (
                  <Chip
                    key={`${observation.zone}-${observation.kind}-${observation.time}`}
                    label={`${observation.zone.replace("_", " ")} · ${PATTERN_LABELS[observation.kind] ?? observation.kind} · ${easternTime(observation.time)}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {review.observations.map((observation) => (
                  <Typography color="text.secondary" key={`definition-${observation.zone}-${observation.kind}-${observation.time}`} variant="caption">
                    {PATTERN_LABELS[observation.kind] ?? observation.kind}: {PATTERN_DESCRIPTIONS[observation.kind] ?? "Observed structure near this execution zone."}
                  </Typography>
                ))}
              </Stack>
            </DashboardPanel>
          ) : null}
          {review.indicators.length > 0 ? (
            <DashboardPanel title="Indicator context">
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))", xs: "1fr" },
                }}
              >
                {review.indicators.map((snapshot) => (
                  <Box key={snapshot.phase} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }} variant="body2">{snapshot.phase}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                      EMA 9 {indicatorValue(snapshot.ema9)} · EMA 20 {indicatorValue(snapshot.ema20)} · RSI 14 {indicatorValue(snapshot.rsi14)}
                    </Typography>
                    <Typography color="text.secondary" display="block" sx={{ mt: 0.5 }} variant="caption">
                      VWAP {indicatorValue(snapshot.vwap)} · MACD {indicatorValue(snapshot.macd)} · ATR 14 {indicatorValue(snapshot.atr14)} · ADR 20 {indicatorValue(snapshot.adr20)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DashboardPanel>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
