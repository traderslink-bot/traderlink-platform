"use client";

import Decimal from "decimal.js";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { TradeAnalysisGreenToRedOpportunityRow, TradeAnalysisProfitZoneRecord } from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import type { TrendMomentumProjection } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { compareIndicatorLandmarks, type IndicatorLandmarkCandidate } from "@/src/lib/trade-candle-analysis/trend-momentum-landmark-comparisons";
import type { IndicatorComparisonAxis } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import { TrendMomentumOutcomeTable } from "./trend-momentum-outcome-table";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";

const axes: Record<IndicatorComparisonAxis, string> = { alignment: "EMA 9 compared with EMA 20", ema9Direction: "EMA 9 direction",
  ema20Direction: "EMA 20 direction", separation: "EMA spacing", rsiBand: "RSI range", rsiDirection: "RSI direction", vwapSide: "Last completed close vs VWAP" };
const words: Record<string, string> = { above: "Above", below: "Below", close: "Close together", near: "Near", rising: "Rising", falling: "Falling",
  little_change: "Little change", expanding: "Widening", contracting: "Narrowing", below_30: "Below 30", "30_to_below_50": "30 to below 50", "50_to_70": "50 to 70", above_70: "Above 70",
  standard: "Regular spacing", sparse: "Sparse spacing", interrupted: "Interrupted history", coverage_incomplete: "Incomplete history", insufficient_bars: "Not enough candles", unavailable: "Unavailable" };

export function TrendMomentumLandmarkComparison({ mode, projection, greenRows, zoneRows, money, moneyBasis, queryString, onQueryChange }: {
  mode: "green-to-red" | "scaling-out"; projection?: TrendMomentumProjection;
  greenRows: readonly TradeAnalysisGreenToRedOpportunityRow[]; zoneRows: readonly TradeAnalysisProfitZoneRecord[];
  money: (value: string | null) => string; moneyBasis: "gross" | "net";
  queryString?: string; onQueryChange?: (query: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = new URLSearchParams(queryString ?? localQuery);
  const interval = query.get("indicator_interval") === "5m" ? "5m" : "1m";
  const requestedAxis = query.get("indicator_landmark_axis");
  const axis: IndicatorComparisonAxis = requestedAxis && Object.hasOwn(axes, requestedAxis) ? requestedAxis as IndicatorComparisonAxis : "alignment";
  const point = query.get("indicator_landmark_point") === "red" ? "red" : "twenty";
  const zones = [...new Set(zoneRows.map((row) => row.lowerBoundPercent))].sort((a, b) => a - b);
  const requestedZone = Number(query.get("indicator_landmark_zone"));
  const zone = zones.includes(requestedZone) ? requestedZone : zones[0] ?? 20;
  const change = (key: string, value: string) => { const next = new URLSearchParams(query); next.set(`indicator_${key}`, value);
    if (onQueryChange) onQueryChange(next.toString()); else setLocalQuery(next.toString()); };
  const candidates: IndicatorLandmarkCandidate[] = mode === "scaling-out" ? zoneRows.filter((row) => row.lowerBoundPercent === zone).map((row) => ({
    tradeId: row.tradeId, key: `zone:${zone}`, at: row.firstReachedAtUtcSeconds,
    outcome: new Decimal(row.profitTakenInZoneGrossDecimal).gt(0) ? "Recorded profit taking in zone" : "No recorded profit taking in zone",
  })) : greenRows.flatMap((row) => point === "red" && row.firstRedAfterTwentyAtUtcSeconds === null ? [] : [{
    tradeId: row.tradeId, key: point === "red" ? "red:after20" : "green:20",
    at: point === "red" ? row.firstRedAfterTwentyAtUtcSeconds! : row.firstReachedTwentyAtUtcSeconds,
    outcome: point === "red" ? row.recoveredAfterTurningRed ? "Recorded recovery after red" : "No recorded recovery after red"
      : row.firstRedAfterTwentyAtUtcSeconds === null ? "Did not later turn red" : "Later turned red",
  }]);
  const result = compareIndicatorLandmarks(projection, candidates, interval, axis);
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField select size="small" label="Candle timeframe" value={interval} onChange={(e) => change("interval", e.target.value)}><MenuItem value="1m">1 minute</MenuItem><MenuItem value="5m">5 minutes</MenuItem></TextField>
      {mode === "green-to-red" ? <TextField select size="small" label="Comparison point" value={point} onChange={(e) => change("landmark_point", e.target.value)}>
        <MenuItem value="twenty">First +20%</MenuItem><MenuItem value="red">First red after +20%</MenuItem></TextField>
        : <TextField select size="small" label="First zone reached" value={zone} onChange={(e) => change("landmark_zone", e.target.value)}>
          {(zones.length ? zones : [20]).map((value) => <MenuItem key={value} value={value}>+{value}%</MenuItem>)}</TextField>}
      <TextField select size="small" label="Indicator" value={axis} onChange={(e) => change("landmark_axis", e.target.value)}>{Object.entries(axes).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
    </Stack>
    <Stack direction="row" sx={{ alignItems: "center" }}><Typography variant="body2">{result.coveredTradeCount} of {result.tradeCount} qualifying trades have this indicator context saved.</Typography>
      <AnalyzerHelpTooltip label="Indicator coverage" text="The existing financial comparison decides which trades qualify. Missing indicator history remains visible and does not remove those trades. Candle-extreme points use only indicators completed before that minute; exact exit fills use their execution time." /></Stack>
    <TrendMomentumOutcomeTable money={money} basisLabel={moneyBasis === "net" ? "Net" : "Gross"} observations rows={result.rows.map((row) => ({ ...row,
      label: <Stack><Typography variant="body2">{row.value === null ? "Indicator unavailable" : words[row.value] ?? "Unavailable"} · {row.outcome}</Typography>
        {row.spacing ? <Typography variant="caption" color="text.secondary">{words[row.spacing] ?? "Unavailable"}</Typography> : null}
        {row.freshness === "older" ? <Typography variant="caption" color="text.secondary">Older completed candle</Typography> : null}</Stack>,
    }))} />
    {!candidates.length ? <Typography color="text.secondary">No qualifying trades for this comparison point.</Typography> : null}
  </Stack>;
}
