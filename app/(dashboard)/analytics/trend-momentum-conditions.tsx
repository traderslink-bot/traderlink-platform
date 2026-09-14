"use client";

import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { buildIndicatorCohorts, INDICATOR_FILTER_OPTIONS, type IndicatorConditionFilters } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import type { IndicatorExecutionKind, TrendMomentumProjection } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { TrendMomentumSupportingTrades } from "./trend-momentum-supporting-trades";
import type { IndicatorSupportingPage } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";

const fields: Record<keyof IndicatorConditionFilters, [string, string]> = {
  alignment: ["EMA 9 compared with EMA 20", "Compare the two averages at the same execution, using completed candles only."],
  ema9Direction: ["EMA 9 direction", "Direction over the last three returned candles. Less frequently traded candles can span more clock time."],
  ema20Direction: ["EMA 20 direction", "Direction over the last three returned candles. This describes the average, not a prediction."],
  separation: ["EMA spacing", "Whether the distance between EMA 9 and EMA 20 was widening, narrowing, or changing little."],
  rsiBand: ["RSI range", "RSI below 30 is commonly called oversold; above 70 is overbought. Neither means that price must reverse."],
  rsiDirection: ["RSI direction", "Whether RSI rose, fell, or changed by less than two points over three returned candles."],
  vwapSide: ["Execution price vs session VWAP", "Your actual execution price compared with volume-weighted price for that session. Near means within 0.02%."],
  spacing: ["Candle spacing", "Keep regularly spaced and less frequently traded candles separate when comparing results."],
};
const labels: Record<string, string> = { any: "Any", above: "Above", below: "Below", close: "Close together",
  rising: "Rising", falling: "Falling", little_change: "Little change", expanding: "Widening", contracting: "Narrowing",
  below_30: "Below 30", "30_to_below_50": "30 to below 50", "50_to_70": "50 to 70", above_70: "Above 70",
  near: "Near", standard: "Regularly spaced", sparse: "Less frequently traded" };
const columns = [
  ["Group", "Each trade belongs to only one group. All selected conditions must occur at the same execution."],
  ["Trades", "Distinct user-defined trades, counted once even when several executions qualify."],
  ["Executions", "Matching executions for matching trades; all selected-type executions for the other groups."],
  ["Known P/L", "Number of trades with a saved outcome in your selected reporting basis."],
  ["Wins / losses / breakeven", "Completed whole-trade outcomes above, below, or equal to zero. Missing P/L is not a loss."],
  ["Win rate", "Winning trades divided by trades with known P/L, including breakeven trades."],
  ["Total trade P/L", "Sum of completed whole-trade P/L, counting each trade once."],
  ["Average trade P/L", "Mean completed whole-trade P/L among trades with known outcomes."],
  ["Median trade P/L", "Middle completed whole-trade P/L, or the average of the middle two outcomes."],
  ["Average return", "Mean trade P/L divided by total entry value for each trade. Each trade has equal weight; missing returns are excluded."],
] as const;

export function TrendMomentumConditions({ projection, interval, kind, filters, onChange, money, supportingPage, query, direction, timezone, offline }: {
  projection: TrendMomentumProjection; interval: "1m" | "5m"; kind: IndicatorExecutionKind;
  filters: IndicatorConditionFilters; onChange: (key: string, value: string) => void;
  money: (value: string | null) => string;
  supportingPage?: IndicatorSupportingPage; query: URLSearchParams; direction: "long" | "short"; timezone: string; offline: boolean;
}) {
  const cohorts = buildIndicatorCohorts(projection, interval, kind, filters);
  const percent = (value: number | null) => value === null ? "Unavailable" : `${value.toFixed(1)}%`;
  return <Stack spacing={1.5}>
    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }} spacing={1}>
      {(Object.keys(fields) as (keyof IndicatorConditionFilters)[]).map((key) => <Stack key={key} direction="row" sx={{ alignItems: "center" }}>
        <TextField select size="small" label={fields[key][0]} value={filters[key]} onChange={(event) => onChange(key, event.target.value)} sx={{ minWidth: 180 }}>
          {INDICATOR_FILTER_OPTIONS[key].map((value) => <MenuItem key={value} value={value}>{labels[value]}</MenuItem>)}
        </TextField><AnalyzerHelpTooltip label={fields[key][0]} text={fields[key][1]} />
      </Stack>)}
    </Stack>
    <HorizontalScrollRegion label="Scroll to compare combined indicator conditions" minTableWidth={1250}>
      <Table size="small"><TableHead><TableRow>{columns.map(([label, help]) => <TableCell key={label}>
        <Stack component="span" direction="row" sx={{ alignItems: "center" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack>
      </TableCell>)}</TableRow></TableHead><TableBody>
        {(["matching", "nonmatching", "unknown"] as const).map((key) => {
          const result = cohorts[key].summary;
          const tradeQuery = new URLSearchParams(query); tradeQuery.set("indicator_group", key); tradeQuery.set("indicator_execution", kind); tradeQuery.set("indicator_interval", interval); tradeQuery.set("direction", direction);
          tradeQuery.delete("indicator_study"); tradeQuery.delete("cursor");
          for (const [field, value] of Object.entries(filters)) tradeQuery.set(`indicator_${field}`, value);
          return <TableRow key={key}><TableCell>{key === "matching" ? "Matches conditions" : key === "nonmatching" ? "Does not match" : "Required indicator data missing"}{!offline ? <Button size="small" href={`/analytics/trade-analyzer/day/trades?${tradeQuery}`}>View trades</Button> : null}</TableCell>
            <TableCell>{result.tradeCount}</TableCell><TableCell>{result.occurrenceCount}</TableCell><TableCell>{result.pnlTradeCount}</TableCell>
            <TableCell>{result.wins} / {result.losses} / {result.breakevens}</TableCell><TableCell>{percent(result.winRatePercent)}</TableCell>
            <TableCell>{money(result.totalPnlDecimal)}</TableCell><TableCell>{money(result.averagePnlDecimal)}</TableCell><TableCell>{money(result.medianPnlDecimal)}</TableCell>
            <TableCell>{percent(result.averageReturnPercent)} ({result.returnTradeCount} {result.returnTradeCount === 1 ? "trade" : "trades"})</TableCell></TableRow>;
        })}
      </TableBody></Table>
    </HorizontalScrollRegion>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>{projection.trades.length - cohorts.outsideTradeIds.length} of {projection.trades.length} analyzed trades have the selected execution type.</Typography>
    <TrendMomentumSupportingTrades page={supportingPage} query={query} direction={direction} timezone={timezone} offline={offline} onChange={onChange} money={money} />
  </Stack>;
}
