"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { IndicatorExecutionKind, TrendMomentumProjection } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { TrendMomentumBandComparison } from "./trend-momentum-band-comparison";
import { analyzedIndicatorPopulation } from "@/src/lib/trade-candle-analysis/trend-momentum-display-population";

const kinds: Record<IndicatorExecutionKind, string> = { initial_entry: "Initial entry", add: "Add", re_entry: "Re-entry",
  partial_exit: "Partial exit", position_close: "Interim position closure", final_exit: "Final exit" };

export function TrendMomentumExecutionComparison({ projection, direction, money, moneyBasis, queryString, onQueryChange, offline }: {
  projection?: TrendMomentumProjection; direction: "long" | "short"; money: (value: string | null) => string;
  moneyBasis: "gross" | "net"; queryString?: string; onQueryChange?: (query: string) => void; offline: boolean;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = new URLSearchParams(queryString ?? localQuery);
  const requestedKind = query.get("indicator_execution");
  const kind: IndicatorExecutionKind = requestedKind && Object.hasOwn(kinds, requestedKind) ? requestedKind as IndicatorExecutionKind : "initial_entry";
  const interval = query.get("indicator_interval") === "5m" ? "5m" : "1m";
  const axis = query.get("indicator_entry_axis") === "rsiBand" ? "rsiBand" : "alignment";
  const change = (key: string, value: string) => { const next = new URLSearchParams(query); next.set(`indicator_${key}`, value);
    if (onQueryChange) onQueryChange(next.toString()); else setLocalQuery(next.toString()); };
  const records = projection?.records.filter((record) => record.direction === direction && record.executionKind === kind) ?? [];
  const detailQuery = new URLSearchParams(query);
  detailQuery.set("direction", direction);
  detailQuery.set("basis", moneyBasis);
  detailQuery.set("indicator_interval", interval);
  detailQuery.set("indicator_execution", kind);
  detailQuery.set(axis === "rsiBand" ? "indicator_rsiComparison" : "indicator_emaComparison", axis);
  detailQuery.delete("indicator_page");
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField select size="small" label="Execution" value={kind} onChange={(event) => change("execution", event.target.value)}>{Object.entries(kinds).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      <TextField select size="small" label="Candle timeframe" value={interval} onChange={(event) => change("interval", event.target.value)}><MenuItem value="1m">1 minute</MenuItem><MenuItem value="5m">5 minutes</MenuItem></TextField>
    </Stack>
    <TrendMomentumBandComparison analyzedTradeCount={projection ? analyzedIndicatorPopulation(projection).trades.filter((trade) => trade.direction === direction).length : 0} records={records} interval={interval} axes={["alignment", "rsiBand"]} axis={axis}
      onAxisChange={(value) => change("entry_axis", value)} money={money} basisLabel={moneyBasis === "net" ? "Net" : "Gross"} />
    <Typography color="text.secondary" variant="body2">Trades without the added indicator history stay unavailable here. Their other saved analysis remains readable.</Typography>
    <Button variant="outlined" href={`/analytics/trade-analyzer/day/trend-momentum${offline ? "" : `?${detailQuery}`}`}>{offline ? "Open saved Trend & Momentum" : "Detailed indicator comparisons"}</Button>
  </Stack>;
}
