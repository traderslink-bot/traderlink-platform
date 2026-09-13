"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
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
import { useMemo, useState, type ReactNode } from "react";
import { selectIndicatorStudy, summarizeIndicatorRecords, summarizeIndicatorStudy,
  type IndicatorExecutionKind, type TrendMomentumProjection } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { paginatedRows, TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";
import { parseIndicatorConditions } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import { TrendMomentumConditions } from "./trend-momentum-conditions";

const kinds: Record<IndicatorExecutionKind, string> = { initial_entry: "Initial entry", re_entry: "Re-entry",
  add: "Add", partial_exit: "Partial exit", position_close: "Position close", final_exit: "Final exit" };
const percent = (value: number | null) => value === null ? "Unavailable" : `${value.toFixed(1)}%`;
const labels: Record<string, string> = {
  rising: "Rising", falling: "Falling", little_change: "Little change", above: "Above", below: "Below",
  close: "Close together", expanding: "Widening", contracting: "Narrowing", below_30: "Below 30",
  "30_to_below_50": "30–49.9", "50_to_70": "50–70", above_70: "Above 70",
  standard: "Regularly spaced candles", sparse: "Less frequently traded candles",
  interrupted: "Interrupted history", coverage_incomplete: "Incomplete history", insufficient_bars: "Not enough candles",
};
const words = (value: string | null | undefined) => value == null ? "Unavailable" : labels[value] ?? "Unavailable";
function Heading({ label, help }: { label: string; help: string }) {
  return <Stack component="span" direction="row" sx={{ alignItems: "center" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack>;
}
function Section({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return <Accordion defaultExpanded disableGutters variant="outlined">
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Heading label={title} help={help} /></AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>;
}

export function TrendMomentumAnalysis({ projection, direction, currency, timezone, offline = false, queryString, onQueryChange }: {
  projection: TrendMomentumProjection | undefined; direction: "long" | "short"; currency: string | null;
  timezone: string; offline?: boolean; queryString?: string; onQueryChange?: (query: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = new URLSearchParams(queryString ?? localQuery);
  const interval = query.get("indicator_interval") === "5m" ? "5m" : "1m";
  const requestedKind = query.get("indicator_execution");
  const kind: IndicatorExecutionKind = requestedKind && Object.hasOwn(kinds, requestedKind) ? requestedKind as IndicatorExecutionKind : "initial_entry";
  const requestedReference = query.get("indicator_reference");
  const reference = requestedReference === "ema20" || requestedReference === "vwap" ? requestedReference : "ema9";
  const coverage = query.get("indicator_coverage") === "incomplete" ? "incomplete" : "complete";
  const changeQuery = (key: string, value: string) => {
    const next = new URLSearchParams(query);
    next.set(`indicator_${key}`, value);
    if (onQueryChange) onQueryChange(next.toString()); else setLocalQuery(next.toString());
    setPage(1);
  };
  const setInterval = (value: string) => changeQuery("interval", value);
  const setKind = (value: string) => changeQuery("execution", value);
  const setReference = (value: string) => changeQuery("reference", value);
  const setCoverage = (value: string) => changeQuery("coverage", value);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const selected = useMemo(() => projection ? { ...projection,
    trades: projection.trades.filter((t) => t.direction === direction),
    records: projection.records.filter((r) => r.direction === direction),
  } : null, [projection, direction]);
  const records = selected?.records.filter((r) => r.executionKind === kind) ?? [];
  const frame = interval === "1m" ? "oneMinute" : "fiveMinute";
  const money = (value: string | null) => value === null || currency === null ? "Unavailable"
    : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
  const date = (seconds: number) => new Intl.DateTimeFormat("en-US", { timeZone: timezone,
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(seconds * 1000));
  const groups = new Map<string, typeof records>();
  for (const record of records) {
    const context = record.context?.[frame];
    const label = context ? `EMA 9 ${words(context.alignment).toLowerCase()} EMA 20 · ${words(context.ema9Direction)} / ${words(context.ema20Direction)} · RSI ${words(context.rsiBand)} · ${words(context.spacing)}` : "Indicator history unavailable";
    const group = groups.get(label);
    if (group) group.push(record); else groups.set(label, [record]);
  }
  const first = selected ? selectIndicatorStudy(selected, interval, reference, true).filter((r) => r.episode.firstEventCoverage === coverage) : [];
  const summary = summarizeIndicatorStudy(first);
  const occurrences = selected ? selectIndicatorStudy(selected, interval, reference, false).filter((r) => r.episode.firstEventCoverage === coverage) : [];
  if (!selected) return <Typography color="text.secondary">Indicator results have not been saved for this view yet.</Typography>;
  return <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField select size="small" label="Candle timeframe" value={interval} onChange={(e) => { setInterval(e.target.value as "1m" | "5m"); setPage(1); }}>
        <MenuItem value="1m">1 minute</MenuItem><MenuItem value="5m">5 minutes</MenuItem>
      </TextField>
      <Typography color="text.secondary">{selected.trades.filter((t) => t.indicators !== null).length} of {selected.trades.length} trades have saved indicator context.</Typography>
    </Stack>
    <Section title="Execution context" help="Compare completed whole-trade results with the indicator conditions known at each execution. Only candles completed before the execution are used. One trade may appear in more than one group; do not add the groups together. Missing history does not remove the trade's other analysis.">
      <Stack spacing={1.5}>
        <TextField select size="small" label="Execution" value={kind} onChange={(e) => setKind(e.target.value as IndicatorExecutionKind)} sx={{ maxWidth: 260 }}>
          {Object.entries(kinds).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <HorizontalScrollRegion label="Scroll to compare execution results" minTableWidth={850}><Table size="small"><TableHead><TableRow>
          <TableCell><Heading label="Indicator conditions" help="EMA 9 compared with EMA 20, the direction of each average over three returned candles, and RSI's band. Less frequently traded candles are kept separate because the same number of bars spans more time." /></TableCell>
          <TableCell><Heading label="Trades" help="Distinct user-defined trades in this group, counted once even when several executions match." /></TableCell>
          <TableCell><Heading label="Executions" help="Recorded executions that match this group. Several can belong to one trade." /></TableCell>
          <TableCell><Heading label="Average trade P/L" help="Average completed whole-trade profit or loss using the selected reporting basis. Trades with unavailable P/L are excluded from this average, not from the indicator count." /></TableCell>
          <TableCell><Heading label="Profitable trades" help="Percentage of trades with known completed P/L that finished above zero. This describes your saved results, not the chance that a future trade will succeed." /></TableCell>
        </TableRow></TableHead><TableBody>{[...groups].map(([label, rows]) => { const result = summarizeIndicatorRecords(rows); return <TableRow key={label}>
          <TableCell>{label}</TableCell><TableCell>{result.tradeCount}</TableCell><TableCell>{result.occurrenceCount}</TableCell>
          <TableCell>{money(result.averagePnlDecimal)} ({result.pnlTradeCount} trades)</TableCell><TableCell>{percent(result.winRatePercent)}</TableCell>
        </TableRow>; })}</TableBody></Table></HorizontalScrollRegion>
        {!records.length ? <Typography color="text.secondary">No saved {kinds[kind].toLowerCase()} indicator records for this selection.</Typography> : null}
      </Stack>
    </Section>
    <Section title="Combined conditions" help="Choose conditions that must all be present at one execution. A matching trade is counted once. A trade is nonmatching only when all required indicator data is available for its selected executions and none matches. Results describe your saved trades, not a forecast.">
      <TrendMomentumConditions projection={selected} interval={interval} kind={kind} filters={parseIndicatorConditions(query)} onChange={changeQuery} money={money} />
    </Section>
    <Section title="During the trade" help="Uses the first qualifying recorded-close event in each saved trade. Later events cannot replace it. Long trades study a move below the reference and return above it; short trades study the reverse. Events while no shares were held do not count.">
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField select size="small" label="Reference" value={reference} onChange={(e) => { setReference(e.target.value as typeof reference); setPage(1); }}>
            <MenuItem value="ema9">EMA 9</MenuItem><MenuItem value="ema20">EMA 20</MenuItem><MenuItem value="vwap">Session VWAP</MenuItem>
          </TextField>
          <TextField select size="small" label="Earlier history" value={coverage} onChange={(e) => { setCoverage(e.target.value as typeof coverage); setPage(1); }}>
            <MenuItem value="complete">Complete before first event</MenuItem><MenuItem value="incomplete">First observed — earlier history incomplete</MenuItem>
          </TextField>
        </Stack>
        <Typography>{summary.tradeCount} trades · {summary.observed} recorded returns · {summary.noRecorded} without a recorded return before closing · {summary.unknown} unknown</Typography>
        <Stack direction="row"><Typography>Recorded return rate: {percent(summary.recordedReclaimRate)}</Typography><AnalyzerHelpTooltip label="recorded return rate" text="Recorded returns divided by episodes with known recovery outcomes. Unknown outcomes are excluded. Earlier incomplete history stays in its own selection even if a later return was observed." /></Stack>
        <HorizontalScrollRegion label="Scroll to inspect each follow-through time" minTableWidth={800}><Table size="small"><TableHead><TableRow>{[
          ["Time after event", "Clock time after the first qualifying event, not a count of returned candles."],
          ["Average price change", "Raw upward or downward percentage change to the exact endpoint. This is stock-price movement, not your trade P/L; upward movement is not automatically favourable to a short."],
          ["Measured", "Position still open with an exact one-minute close at this time and uninterrupted request coverage."],
          ["Closed before", "The position had already closed before this time; not included in the price-change average."],
          ["Closed at this time", "The closing execution occurred at the endpoint; kept separate from still-held movement."],
          ["Missing endpoint", "No eligible exact endpoint price or continuous coverage was available. No later price is substituted."],
          ["Timing unavailable", "The event or holding interval could not be placed reliably in time. Kept separate from a missing endpoint price."],
        ].map(([label, help]) => <TableCell key={label}><Heading label={label} help={help} /></TableCell>)}</TableRow></TableHead>
          <TableBody>{summary.horizons.map((h) => <TableRow key={h.minutes}><TableCell>{h.minutes} min</TableCell><TableCell>{percent(h.averageChangePercent)}</TableCell><TableCell>{h.counts.measured}</TableCell><TableCell>{h.counts.closed_before_horizon}</TableCell><TableCell>{h.counts.closed_at_horizon}</TableCell><TableCell>{h.counts.endpoint_unavailable}</TableCell><TableCell>{h.counts.timing_unavailable}</TableCell></TableRow>)}</TableBody>
        </Table></HorizontalScrollRegion>
      </Stack>
    </Section>
    <Section title="Recorded events" help="All qualifying episodes, including later events and later positions within the same saved trade. These are occurrence counts, not extra trades. Open the saved analysis to inspect the executions and chart.">
      <Stack spacing={1}>
        <HorizontalScrollRegion label="Scroll to inspect recorded events" minTableWidth={750}><Table size="small"><TableHead><TableRow>{[
          ["Ticker", "The traded symbol."], ["Event time", "Time of the completed candle that first moved to the adverse side."],
          ["Position", "Opening-to-flat position number within your saved trade. Re-entering does not create another saved trade."],
          ["Return", "The first recorded close back across the reference while this position was still held and the data remained uninterrupted."],
          ["Full analysis", "Open this saved trade and its chart."],
        ].map(([label, help]) => <TableCell key={label}><Heading label={label} help={help} /></TableCell>)}</TableRow></TableHead>
          <TableBody>{paginatedRows(occurrences, page, pageSize).map(({ trade, episode }) => <TableRow key={`${trade.tradeId}:${episode.cycle}:${episode.at}`}>
            <TableCell>{trade.symbol}</TableCell><TableCell>{date(episode.at)}</TableCell><TableCell>{episode.cycle + 1}</TableCell>
            <TableCell>{episode.recovery === "observed_reclaim" ? `Recorded ${date(episode.reclaimedAt!)}` : episode.recovery === "unknown" ? "Unknown" : "No recorded return before closing"}</TableCell>
            <TableCell><Button size="small" variant="outlined" href={`/trade-tracker/${trade.trackerDate}${offline ? "" : `?${new URLSearchParams({ interval, trade: trade.representativeRoundTripId })}`}`}>{offline ? "Open saved day" : "Full analysis"}</Button></TableCell>
          </TableRow>)}</TableBody></Table></HorizontalScrollRegion>
        <TradeAnalyzerTablePagination rowCount={occurrences.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </Stack>
    </Section>
  </Stack>;
}
