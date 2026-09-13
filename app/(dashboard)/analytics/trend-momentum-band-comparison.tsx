"use client";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { groupIndicatorRecords, type IndicatorComparisonAxis } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import type { TrendMomentumRecord } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { TrendMomentumOutcomeTable } from "./trend-momentum-outcome-table";

const names: Record<IndicatorComparisonAxis, string> = { alignment: "EMA 9 compared with EMA 20", ema9Direction: "EMA 9 direction",
  ema20Direction: "EMA 20 direction", separation: "EMA spacing", rsiBand: "RSI range", rsiDirection: "RSI direction", vwapSide: "Execution price vs session VWAP" };
const words: Record<string, string> = { above: "Above", below: "Below", close: "Close together", rising: "Rising", falling: "Falling",
  little_change: "Little change", expanding: "Widening", contracting: "Narrowing", below_30: "Below 30", "30_to_below_50": "30 to below 50",
  "50_to_70": "50 to 70", above_70: "Above 70", near: "Near", standard: "Regular spacing", sparse: "Sparse spacing",
  interrupted: "Interrupted history", coverage_incomplete: "Incomplete history", insufficient_bars: "Not enough candles", unavailable: "Unavailable" };
const range = (value: { min: number; max: number } | null, divisor = 1) => value === null ? "Unavailable"
  : value.min === value.max ? `${(value.min / divisor).toFixed(1)}` : `${(value.min / divisor).toFixed(1)}–${(value.max / divisor).toFixed(1)}`;

export function TrendMomentumBandComparison({ records, interval, axes, axis, onAxisChange, money, basisLabel, analyzedTradeCount }: {
  analyzedTradeCount: number;
  records: readonly TrendMomentumRecord[]; interval: "1m" | "5m"; axes: readonly IndicatorComparisonAxis[];
  axis: IndicatorComparisonAxis; onAxisChange: (value: string) => void; money: (value: string | null) => string; basisLabel: "Gross" | "Net";
}) {
  const groups = groupIndicatorRecords(records, interval, axis);
  return <Stack spacing={1.5}>
    {axes.length > 1 ? <TextField select size="small" label="Compare" value={axis} onChange={(event) => onAxisChange(event.target.value)} sx={{ maxWidth: 320 }}>
      {axes.map((value) => <MenuItem key={value} value={value}>{names[value]}</MenuItem>)}
    </TextField> : null}
    <Typography variant="body2">{groups.coveredTradeCount} of {analyzedTradeCount} analyzed trades have data for this comparison.</Typography>
    <TrendMomentumOutcomeTable basisLabel={basisLabel} money={money} rows={groups.rows.map((row) => ({ ...row, label: <Stack>
      <Typography variant="body2">{row.value === null ? "Indicator unavailable" : words[row.value] ?? "Unavailable"}</Typography>
      {row.spacing ? <Typography variant="caption" color="text.secondary">{words[row.spacing] ?? "Unavailable"} · observation span: {range(row.spanSeconds, 60)} minutes</Typography> : null}
      {row.freshness !== "session" ? <Typography variant="caption" color="text.secondary">{row.freshness === "current" ? "Recent completed candle" : row.freshness === "older" ? "Older completed candle" : "Candle time unavailable"} · age: {range(row.ageSeconds)} seconds</Typography> : null}
    </Stack> }))} />
    {!records.length ? <Typography color="text.secondary">No saved executions for this selection.</Typography> : null}
  </Stack>;
}
