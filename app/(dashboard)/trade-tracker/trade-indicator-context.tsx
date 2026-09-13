"use client";

import { AnalyzerDisclosureSection } from "../analytics/analyzer-disclosure-section";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { DaySessionTradeAnalyzer } from "./[sessionDate]/day-session-types";
import { AnalyzerHelpTooltip } from "../analytics/analyzer-help-tooltip";

const directions = { rising: "rising", falling: "falling", little_change: "showing little change" };
export function TradeIndicatorContext({ analysis, timeframe, currency, timezone }: {
  analysis: DaySessionTradeAnalyzer; timeframe: "1m" | "5m"; currency: string; timezone: string;
}) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const event = analysis.events.find((candidate) => candidate.eventId === selectedEvent) ?? analysis.events[0];
  const saved = analysis.trendMomentum?.executions.find((candidate) => candidate.eventId === event?.eventId);
  const context = saved?.[timeframe === "1m" ? "oneMinute" : "fiveMinute"];
  const vwap = saved?.sessionVwap;
  const price = (value: number | null | undefined) => value == null ? "Unavailable" : new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 2,
  }).format(value);
  const time = (at: number) => new Intl.DateTimeFormat("en-US", { timeZone: timezone,
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(at * 1000));
  const label = (candidate: DaySessionTradeAnalyzer["events"][number], index: number) =>
    `${index + 1}. ${{ entry: "Entry", add: "Add", partial_exit: "Partial exit", temporary_flat: "Position close", final_exit: "Final exit" }[candidate.kind]} · ${time(Date.parse(candidate.executedAt) / 1000)}`;
  const title = (name: string, help: string) => <Stack direction="row" sx={{ alignItems: "center" }}><Typography variant="subtitle2">{name}</Typography><AnalyzerHelpTooltip label={name} text={help} /></Stack>;
  const vwapSide = vwap?.value != null && event ? 100 * (Number(event.price) - vwap.value) / vwap.value : null;
  return <AnalyzerDisclosureSection title="Trend & Momentum" help="Indicator conditions from completed candles available before each execution. Changing the chart timeframe changes EMA and RSI to the matching timeframe. Session VWAP always uses this session's completed one-minute data. These descriptions do not grade the trade or predict its next move.">
    <Stack spacing={1.5}>
      {!analysis.trendMomentum ? <Typography color="text.secondary">{analysis.trendMomentumUnavailableReason
        ? "Earlier candle history could not be retrieved. The available trade analysis is still shown."
        : "This saved analysis does not include the newer indicator history. Analyze the trade again to request it."}</Typography> : <>
        {event ? <TextField select size="small" label="Execution" value={event.eventId} onChange={(e) => setSelectedEvent(e.target.value)}>
          {analysis.events.map((candidate, index) => <MenuItem key={candidate.eventId} value={candidate.eventId}>{label(candidate, index)}</MenuItem>)}
        </TextField> : null}
        <Typography variant="caption" color="text.secondary">{timeframe === "1m" ? "1-minute" : "5-minute"} candles{context ? ` · Last completed candle: ${time(context.observedAt)} · ${Math.round(context.ageSeconds)} seconds before the execution` : " · No eligible completed candle"}</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          <Box>{title("EMA 9 & EMA 20", "Exponential moving averages give more weight to recent closes. Direction compares each average across three returned candles. Wider separation describes the averages moving apart, not a guaranteed stronger trade.")}
            <Typography variant="body2">EMA 9: {price(context?.ema9)} per share · EMA 20: {price(context?.ema20)} per share</Typography>
            {context?.alignment ? <Typography variant="body2">EMA 9 is {context.alignment === "close" ? "close to" : context.alignment} EMA 20.</Typography> : null}
            {context?.ema9Direction ? <Typography variant="body2">EMA 9 is {directions[context.ema9Direction]}.</Typography> : null}
            {context?.ema20Direction ? <Typography variant="body2">EMA 20 is {directions[context.ema20Direction]}.</Typography> : null}
            {context?.separation ? <Typography variant="body2">Separation is {context.separation === "expanding" ? "widening" : context.separation === "contracting" ? "narrowing" : "showing little change"}.</Typography> : null}
            {context?.ema9 == null || context?.ema20 == null ? <Typography variant="caption" color="text.secondary">Not enough earlier candle data for {context?.ema9 == null && context?.ema20 == null ? "these averages" : context?.ema9 == null ? "EMA 9" : "EMA 20"}.</Typography> : null}
          </Box>
          <Box>{title("RSI", "Wilder RSI 14 compares recent gains with recent losses. Above 70 is commonly called overbought and below 30 oversold; either can persist during a strong move. Rising or falling describes the change across three returned candles.")}
            <Typography variant="body2">{context?.rsi14 == null ? "RSI unavailable" : `RSI 14: ${context.rsi14.toFixed(1)}${context.rsi14 > 70 ? " · Overbought range" : context.rsi14 < 30 ? " · Oversold range" : ""}`}</Typography>
            {context?.rsiDirection ? <Typography variant="body2">RSI is {directions[context.rsiDirection]}.</Typography> : null}
            {context?.rsi14 == null ? <Typography variant="caption" color="text.secondary">{context?.rsiUnavailableReason === "no_recent_price_change" ? "Recent candles had no price change, so the available history does not establish a reliable RSI reading." : "Not enough earlier candle data for RSI."}</Typography> : null}
          </Box>
          <Box>{title("Session VWAP", "Volume-weighted average price from the start of this extended-hours session through the last completed minute before the execution, using recorded traded value and volume. It does not include yesterday's trades or unfinished execution-minute data.")}
            <Typography variant="body2">{price(vwap?.value)} per share</Typography>
            {vwapSide !== null ? <Typography variant="body2">Execution price was {Math.abs(vwapSide) <= 0.02 ? "near" : vwapSide > 0 ? "above" : "below"} Session VWAP.</Typography> : <Typography variant="caption" color="text.secondary">{vwap?.unavailableReason === "turnover_incomplete" ? "Recorded traded value is incomplete, so Session VWAP is unavailable." : vwap?.unavailableReason === "no_traded_volume" ? "No traded volume was available in the returned session candles." : "Complete session candle data is not available for VWAP."}</Typography>}
            {vwap?.lastBarClosedAt ? <Typography variant="caption" color="text.secondary">Last completed minute: {time(vwap.lastBarClosedAt)}</Typography> : null}
          </Box>
        </Box>
        {context ? <Typography variant="caption" color="text.secondary">{context.spacing === "standard" ? "Regularly spaced candles" : context.spacing === "sparse" ? "Less frequently traded candles" : "Direction comparison unavailable across this history interruption"}{context.lookbackSpanSeconds != null ? ` · Direction lookback spans ${(context.lookbackSpanSeconds / 60).toFixed(1)} minutes` : ""}. {context.currentWordingEligible ? "" : "The last available candle was older than the current-context window; these are the last recorded values."}</Typography> : null}
        {analysis.trendMomentum.timingUnavailable ? <Typography color="text.secondary" variant="body2">Some position timings could not be ordered reliably. During-trade indicator crossings are unavailable; execution context remains available where candle history permits.</Typography> : null}
      </>}
    </Stack>
  </AnalyzerDisclosureSection>;
}
