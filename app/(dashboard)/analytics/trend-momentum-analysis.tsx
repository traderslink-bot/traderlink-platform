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
import { summarizeIndicatorRecords,
  type IndicatorExecutionKind, type TrendMomentumProjection } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import { paginatedRows, TradeAnalyzerTablePagination } from "./trade-analyzer-table-pagination";
import { parseIndicatorConditions, buildIndicatorSupportingPage, type IndicatorSupportingPage } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";
import { TrendMomentumConditions } from "./trend-momentum-conditions";
import { TrendMomentumBandComparison } from "./trend-momentum-band-comparison";
import { buildDuringStudy, summarizeDuringStudy } from "@/src/lib/trade-candle-analysis/trend-momentum-during-study";
import { INDICATOR_FILTER_OPTIONS } from "@/src/lib/trade-candle-analysis/trend-momentum-cohorts";

const kinds: Record<IndicatorExecutionKind, string> = { initial_entry: "Initial entry", re_entry: "Re-entry",
  add: "Add", partial_exit: "Partial exit", position_close: "Interim position closure", final_exit: "Final exit" };
const percent = (value: number | null) => value === null ? "Unavailable" : `${value.toFixed(1)}%`;
const labels: Record<string, string> = {
  rising: "Rising", falling: "Falling", little_change: "Little change", above: "Above", below: "Below",
  close: "Close together", expanding: "Widening", contracting: "Narrowing", below_30: "Below 30",
  "30_to_below_50": "30–49.9", "50_to_70": "50–70", above_70: "Above 70",
  standard: "Regularly spaced candles", sparse: "Less frequently traded candles",
  interrupted: "Interrupted history", coverage_incomplete: "Incomplete history", insufficient_bars: "Not enough candles",
};
const words = (value: string | null | undefined) => value == null ? "Unavailable" : labels[value] ?? "Unavailable";
const duringLabels = { alignment: "EMA 9 vs EMA 20", ema9Direction: "EMA 9 direction", ema20Direction: "EMA 20 direction",
  separation: "EMA separation", rsiBand: "RSI range", rsiDirection: "RSI direction", vwapSide: "Price vs VWAP", spacing: "Candle spacing" };
function Heading({ label, help }: { label: string; help: string }) {
  return <Stack component="span" direction="row" sx={{ alignItems: "center" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack>;
}
function Section({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return <Accordion defaultExpanded disableGutters variant="outlined">
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Heading label={title} help={help} /></AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>;
}

export function TrendMomentumAnalysis({ projection, direction, currency, timezone, offline = false, queryString, onQueryChange, supportingPage, moneyBasis = "gross" }: {
  projection: TrendMomentumProjection | undefined; direction: "long" | "short"; currency: string | null;
  timezone: string; offline?: boolean; queryString?: string; onQueryChange?: (query: string) => void;
  supportingPage?: IndicatorSupportingPage;
  moneyBasis?: "gross" | "net";
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = new URLSearchParams(queryString ?? localQuery);
  const interval = query.get("indicator_interval") === "5m" ? "5m" : "1m";
  const requestedKind = query.get("indicator_execution");
  const kind: IndicatorExecutionKind = requestedKind && Object.hasOwn(kinds, requestedKind) ? requestedKind as IndicatorExecutionKind : "initial_entry";
  const requestedReference = query.get("indicator_reference");
  const reference = requestedReference === "ema20" || requestedReference === "vwap" ? requestedReference : "ema9";
  const coverage = query.get("indicator_coverage") === "incomplete" ? "incomplete" : "complete";
  const requestedEmaAxis = query.get("indicator_emaComparison");
  const emaAxis = requestedEmaAxis === "ema9Direction" || requestedEmaAxis === "ema20Direction" || requestedEmaAxis === "separation" ? requestedEmaAxis : "alignment";
  const rsiAxis = query.get("indicator_rsiComparison") === "rsiDirection" ? "rsiDirection" : "rsiBand";
  const basisLabel = moneyBasis === "net" ? "Net" : "Gross";
  const changeQuery = (key: string, value: string) => {
    const next = new URLSearchParams(query);
    next.set(`indicator_${key}`, value);
    if (key !== "page") next.delete("indicator_page");
    if (onQueryChange) onQueryChange(next.toString()); else setLocalQuery(next.toString());
    setPage(1);
  };
  const setInterval = (value: string) => changeQuery("interval", value);
  const setKind = (value: string) => changeQuery("execution", value);
  const setReference = (value: string) => changeQuery("reference", value);
  const setCoverage = (value: string) => changeQuery("coverage", value);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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
  const studyEvent = query.get("indicator_event") === "reclaim" ? "reclaim" : "loss";
  const requestedGroup = query.get("indicator_during_group");
  const studyGroup = requestedGroup === "nonmatching" || requestedGroup === "unknown" ? requestedGroup : "matching";
  const requestedSide = query.get("indicator_ema20Side");
  const ema20Side = requestedSide === "above" || requestedSide === "below" || requestedSide === "neutral" ? requestedSide : "any";
  const studyFilters = parseIndicatorConditions({ get: (key) => query.get(key.replace("indicator_", "indicator_during_")) });
  const study = selected ? buildDuringStudy(selected, { interval, reference, event: studyEvent, filters: studyFilters, ema20Side }) : null;
  const studyGroups = study?.[coverage];
  const first = studyGroups?.[studyGroup] ?? [];
  const summary = summarizeDuringStudy(first, studyEvent);
  const occurrences = study?.occurrences.filter((row) => row.episode.firstEventCoverage === coverage &&
    (row.match === true ? "matching" : row.match === false ? "nonmatching" : "unknown") === studyGroup) ?? [];
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
    <Section title="EMA 9 & EMA 20" help="Compare the averages' alignment, direction or changing separation with completed trade results. Direction uses three returned candles. Regular and sparse observation spans stay separate, as do recent and older completed candles. These describe your saved trades, not an entry signal.">
      <TrendMomentumBandComparison records={records} interval={interval} axes={["alignment", "ema9Direction", "ema20Direction", "separation"]}
        axis={emaAxis} onAxisChange={(value) => changeQuery("emaComparison", value)} money={money} basisLabel={basisLabel} />
    </Section>
    <Section title="RSI" help="Compare RSI range or direction with your completed trade outcomes. Above 70 is commonly called overbought and below 30 oversold, but strong moves can stay there. RSI direction is not combined across different observation spans or older and recent candles.">
      <TrendMomentumBandComparison records={records} interval={interval} axes={["rsiBand", "rsiDirection"]}
        axis={rsiAxis} onAxisChange={(value) => changeQuery("rsiComparison", value)} money={money} basisLabel={basisLabel} />
    </Section>
    <Section title="Session VWAP" help="Compare your actual execution price with the volume-weighted price available from the same session. Near means within 0.02%. Unknown session history stays unavailable; it is not treated as below or above VWAP.">
      <TrendMomentumBandComparison records={records} interval={interval} axes={["vwapSide"]}
        axis="vwapSide" onAxisChange={() => {}} money={money} basisLabel={basisLabel} />
    </Section>
    <Section title="Combined conditions" help="Choose conditions that must all be present at one execution. A matching trade is counted once. A trade is nonmatching only when all required indicator data is available for its selected executions and none matches. Results describe your saved trades, not a forecast.">
      <Typography variant="body2" color="text.secondary">Completed {basisLabel} trade outcomes</Typography>
      <TrendMomentumConditions projection={selected} interval={interval} kind={kind} filters={parseIndicatorConditions(query)} onChange={changeQuery} money={money}
        query={query} direction={direction} timezone={timezone} offline={offline}
        supportingPage={offline ? buildIndicatorSupportingPage(selected, query, direction) : supportingPage} />
    </Section>
    <Section title="During the trade" help="Uses the first qualifying recorded-close event in each saved trade. Later events cannot replace it. Long trades study a move below the reference and return above it; short trades study the reverse. Events while no shares were held do not count.">
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField select size="small" label="Reference" value={reference} onChange={(e) => { setReference(e.target.value as typeof reference); setPage(1); }}>
            <MenuItem value="ema9">EMA 9</MenuItem><MenuItem value="ema20">EMA 20</MenuItem><MenuItem value="vwap">Session VWAP</MenuItem>
          </TextField>
          <TextField select size="small" label="Event" value={studyEvent} onChange={(e) => changeQuery("event", e.target.value)}>
            <MenuItem value="loss">{direction === "long" ? "Close below reference" : "Close above reference"}</MenuItem>
            <MenuItem value="reclaim">{direction === "long" ? "Return above reference" : "Return below reference"}</MenuItem>
          </TextField>
          <TextField select size="small" label="Earlier history" value={coverage} onChange={(e) => { setCoverage(e.target.value as typeof coverage); setPage(1); }}>
            <MenuItem value="complete">Complete before first event</MenuItem><MenuItem value="incomplete">First observed — earlier history incomplete</MenuItem>
          </TextField>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {(Object.keys(duringLabels) as (keyof typeof duringLabels)[]).map((key) => <TextField key={key} select size="small" label={duringLabels[key]}
            value={studyFilters[key]} onChange={(e) => changeQuery(`during_${key}`, e.target.value)}>
            {INDICATOR_FILTER_OPTIONS[key].map((value) => <MenuItem key={value} value={value}>{value === "any" ? "Any" : value === "near" ? "Near" : words(value)}</MenuItem>)}
          </TextField>)}
          <TextField select size="small" label="Close vs EMA 20" value={ema20Side} onChange={(e) => changeQuery("ema20Side", e.target.value)}>
            <MenuItem value="any">Any</MenuItem><MenuItem value="above">Above</MenuItem><MenuItem value="below">Below</MenuItem><MenuItem value="neutral">Near</MenuItem>
          </TextField>
          <TextField select size="small" label="Comparison group" value={studyGroup} onChange={(e) => changeQuery("during_group", e.target.value)}>
            <MenuItem value="matching">Matching conditions</MenuItem><MenuItem value="nonmatching">Not matching</MenuItem><MenuItem value="unknown">Context unavailable</MenuItem>
          </TextField>
        </Stack>
        <Typography color="text.secondary">Conditions are checked together at the first recorded event. A later event cannot replace it. {study?.noEventTradeIds.length ?? 0} trades had no recorded event with complete history; {study?.unknownPresenceTradeIds.length ?? 0} could not be checked.</Typography>
        <HorizontalScrollRegion label="Scroll to compare during-trade groups" minTableWidth={520}><Table size="small"><TableHead><TableRow>
          {[ ["Group", "Each trade is classified using its first selected event, before conditions are applied."], ["Trades", "Saved trades counted once in this group."], [`${basisLabel} P/L`, "Combined known completed results; missing P/L is not zero."], ["Average return", "Each saved trade with a known percentage result receives equal weight."] ].map(([label, help]) => <TableCell key={label}><Heading label={label} help={help} /></TableCell>)}
        </TableRow></TableHead><TableBody>{(["matching", "nonmatching", "unknown"] as const).map((group) => {
          const totals = summarizeDuringStudy(studyGroups?.[group] ?? [], studyEvent);
          return <TableRow key={group}><TableCell>{group === "matching" ? "Matching conditions" : group === "nonmatching" ? "Not matching" : "Context unavailable"}</TableCell><TableCell>{totals.tradeCount}</TableCell><TableCell>{money(totals.totalPnlDecimal)} ({totals.pnlTradeCount} with P/L)</TableCell><TableCell>{percent(totals.averageReturnPercent)}</TableCell></TableRow>;
        })}</TableBody></Table></HorizontalScrollRegion>
        <Typography>{summary.tradeCount} trades · {summary.observed} recorded returns · {summary.noRecorded} without a recorded return before closing · {summary.unknown} unknown</Typography>
        {studyEvent === "loss" ? <Stack direction="row"><Typography>Recorded return rate: {percent(summary.recordedReclaimRate)}</Typography><AnalyzerHelpTooltip label="recorded return rate" text="Recorded returns divided by episodes with known recovery outcomes. Unknown outcomes are excluded. Earlier incomplete history stays in its own selection even if a later return was observed." /></Stack> : <Typography color="text.secondary">This comparison includes observed returns only. It does not estimate how often a lost reference was recovered.</Typography>}
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
        <Typography>{occurrences.length} recorded events across {new Set(occurrences.map((row) => row.trade.tradeId)).size} saved trades and {new Set(occurrences.map((row) => `${row.trade.tradeId}:${row.episode.cycle}`)).size} held positions.</Typography>
        <HorizontalScrollRegion label="Scroll to inspect recorded events" minTableWidth={750}><Table size="small"><TableHead><TableRow>{[
          ["Ticker", "The traded symbol."], ["Event time", "Time of the selected loss or return recorded by a completed candle."],
          ["Position", "Opening-to-flat position number within your saved trade. Re-entering does not create another saved trade."],
          ["Return", "The first recorded close back across the reference while this position was still held and the data remained uninterrupted."],
          ["Full analysis", "Open this saved trade and its chart."],
        ].map(([label, help]) => <TableCell key={label}><Heading label={label} help={help} /></TableCell>)}</TableRow></TableHead>
          <TableBody>{paginatedRows(occurrences, page, pageSize).map(({ trade, episode, at }) => <TableRow key={`${trade.tradeId}:${episode.cycle}:${at}`}>
            <TableCell>{trade.symbol}</TableCell><TableCell>{date(at)}</TableCell><TableCell>{episode.cycle + 1}</TableCell>
            <TableCell>{episode.recovery === "observed_reclaim" ? `Recorded ${date(episode.reclaimedAt!)}` : episode.recovery === "unknown" ? "Unknown" : "No recorded return before closing"}</TableCell>
            <TableCell><Button size="small" variant="outlined" href={`/trade-tracker/${trade.trackerDate}${offline ? "" : `?${new URLSearchParams({ interval, trade: trade.representativeRoundTripId })}`}`}>{offline ? "Open saved day" : "Full analysis"}</Button></TableCell>
          </TableRow>)}</TableBody></Table></HorizontalScrollRegion>
        <TradeAnalyzerTablePagination rowCount={occurrences.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </Stack>
    </Section>
  </Stack>;
}
