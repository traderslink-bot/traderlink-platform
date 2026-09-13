"use client";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { movementAlignmentOptions, movementRsiOptions, readMovementFilters } from "@/src/lib/trade-candle-analysis/trend-momentum-movement-filter";

export function MovementIndicatorFilters({ queryString, onChange, coverage }: {
  queryString: string; onChange: (query: string) => void;
  coverage: { matched: number; notMatched: number; unavailable: number };
}) {
  const query = new URLSearchParams(queryString), filters = readMovementFilters(query);
  const change = (key: string, value: string) => { const next = new URLSearchParams(query); next.set(`movement_${key}`, value); onChange(next.toString()); };
  return <Stack spacing={1}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField select size="small" label="Indicator timeframe" value={filters.interval} onChange={(e) => change("interval", e.target.value)} helperText="Saved context before the execution; movement still uses one-minute candles."><MenuItem value="1m">1 minute</MenuItem><MenuItem value="5m">5 minutes</MenuItem></TextField>
      <TextField select size="small" label="EMA alignment" value={filters.alignment} onChange={(e) => change("alignment", e.target.value)} helperText="Compares the faster EMA9 with EMA20.">{Object.entries(movementAlignmentOptions).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      <TextField select size="small" label="RSI range" value={filters.rsiBand} onChange={(e) => change("rsi", e.target.value)} helperText="Overbought or oversold does not mean price must reverse.">{Object.entries(movementRsiOptions).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
    </Stack>
    <Typography variant="body2" color="text.secondary">{coverage.matched} matching executions · {coverage.notMatched} outside these conditions · {coverage.unavailable} without the required indicator context. These filters apply to the movement cards and both tables.</Typography>
  </Stack>;
}
