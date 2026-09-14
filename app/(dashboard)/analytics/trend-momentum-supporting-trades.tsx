"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Fragment, useState } from "react";
import { indicatorSupportingSelection, type IndicatorSupportingPage } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";

const headers = [
  ["Ticker", "Symbol for the saved trade."],
  ["Execution time", "The exact saved execution time, shown in your account timezone."],
  ["Execution price per share", "Actual saved stock price for this execution, not a whole-position value."],
  ["Whole-trade P/L", "Completed trade P/L in the selected reporting basis. Repeated executions show the same trade result; do not add these rows together."],
  ["Indicator details", "Inspect the completed candle values available at this execution and open its saved trade analysis."],
] as const;
const number = (value: number | null | undefined) => value == null ? "Unavailable" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);

export function TrendMomentumSupportingTrades({ page, query, direction, timezone, offline, onChange, money }: {
  page?: IndicatorSupportingPage; query: URLSearchParams; direction: "long" | "short"; timezone: string; offline: boolean;
  onChange: (key: string, value: string) => void; money: (value: string | null) => string;
}) {
  const selection = indicatorSupportingSelection(query, direction);
  const current = page?.selectionKey === selection.key ? page : undefined;
  const [expanded, setExpanded] = useState<string | null>(null);
  const date = (utc: string) => new Intl.DateTimeFormat("en-US", { timeZone: timezone,
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(utc));
  return <Stack spacing={1}>
    <Stack direction="row" sx={{ alignItems: "center" }}><Typography component="h3" variant="h6">Supporting trades</Typography>
      <AnalyzerHelpTooltip label="Supporting trades" text="These executions support the selected comparison group. Counts use the complete filtered group, not just this page. One user-defined trade can have several executions." /></Stack>
    <TextField select size="small" label="Comparison group" value={selection.group} onChange={(event) => onChange("group", event.target.value)} sx={{ maxWidth: 310 }}>
      <MenuItem value="matching">Matches conditions</MenuItem><MenuItem value="nonmatching">Does not match</MenuItem><MenuItem value="unknown">Required indicator data missing</MenuItem>
    </TextField>
    {!current ? <Typography role="status" color="text.secondary">Loading supporting trades for this selection.</Typography> : <>
      <Typography variant="body2">{current.totalTrades} {current.totalTrades === 1 ? "trade" : "trades"} · {current.totalRows} {current.totalRows === 1 ? "execution" : "executions"}</Typography>
      <HorizontalScrollRegion label="Scroll to inspect supporting trades" minTableWidth={800}><Table size="small"><TableHead><TableRow>
        {headers.map(([label, help]) => <TableCell key={label}><Stack component="span" direction="row" sx={{ alignItems: "center" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack></TableCell>)}
      </TableRow></TableHead><TableBody>{current.rows.map((row) => {
        const key = `${current.selectionKey}:${row.tradeId}:${row.executionId}`;
        const context = row.context?.[selection.interval === "1m" ? "oneMinute" : "fiveMinute"];
        const details = [
          ["EMA 9 per share", number(context?.ema9), "Average of recent closing prices, with more weight on recent candles."],
          ["EMA 20 per share", number(context?.ema20), "The longer of the two moving averages."],
          ["RSI 14", number(context?.rsi14), "Recent upward versus downward momentum on a zero-to-100 scale."],
          ["Session VWAP per share", number(row.context?.sessionVwap?.value), "Volume-weighted price from this session, using available completed candles."],
          ["Last completed candle", context ? date(new Date(context.observedAt * 1000).toISOString()) : "Unavailable", "When the indicator candle completed. No later candle is used."],
          ["Candle age", context ? `${number(context.ageSeconds)} seconds` : "Unavailable", "Time between the last completed candle and this execution. This differs from the length of the direction comparison."],
          ["Direction observation span", context?.lookbackSpanSeconds == null ? "Unavailable" : `${number(context.lookbackSpanSeconds / 60)} minutes`, "Elapsed clock time across the three returned candles used to describe direction. Sparse candles span longer."],
          ["History candles", number(context?.historyBars), "Real returned candles available to initialize the indicator. Missing candles are not invented."],
        ];
        return <Fragment key={key}><TableRow><TableCell>{row.symbol}</TableCell><TableCell>{date(row.executedAtUtc)}</TableCell>
          <TableCell>{number(Number(row.executionPriceDecimal))}</TableCell><TableCell>{money(row.pnlDecimal)}</TableCell>
          <TableCell><Button variant="outlined" size="small" aria-expanded={expanded === key} onClick={() => setExpanded(expanded === key ? null : key)}>{expanded === key ? "Hide details" : "View details"}</Button></TableCell></TableRow>
          {expanded === key ? <TableRow><TableCell colSpan={5}><Stack spacing={1}>
            <Typography variant="body2">{selection.interval === "1m" ? "1-minute" : "5-minute"} indicator context at this execution</Typography>
            {details.map(([label, value, help]) => <Stack key={label} direction="row" sx={{ alignItems: "center" }}><Typography variant="body2">{label}: {value}</Typography><AnalyzerHelpTooltip label={label} text={help} /></Stack>)}
            {!context ? <Typography color="text.secondary">The required candle history was not saved for this timeframe. Other saved trade analysis remains available.</Typography> : null}
            <Button variant="outlined" size="small" href={`/trade-tracker/${row.trackerDate}${offline ? "" : `?${new URLSearchParams({ interval: selection.interval, trade: row.representativeRoundTripId, basis: query.get("basis") === "net" ? "net" : "gross" })}`}`}>{offline ? "Open saved day" : "Full analysis"}</Button>
          </Stack></TableCell></TableRow> : null}</Fragment>;
      })}</TableBody></Table></HorizontalScrollRegion>
      {current.totalRows === 0 ? <Typography color="text.secondary">No executions in this comparison group.</Typography> : null}
      <TradeAnalyzerTablePagination rowCount={current.totalRows} page={current.page} pageSize={current.pageSize}
        onPageChange={(value) => onChange("page", String(value))} onPageSizeChange={(value) => onChange("size", String(value))} />
    </>}
  </Stack>;
}
