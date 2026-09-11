"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, Button, CircularProgress, Drawer, IconButton, Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import type { DailyTradeChartInterval } from "../trade-tracker/[sessionDate]/daily-trade-analyzer-chart";
import type { DaySessionTradeAnalyzer } from "../trade-tracker/[sessionDate]/day-session-types";
import { WrittenTradeAnalysis } from "../trade-tracker/written-trade-analysis";

const DailyTradeAnalyzerChart = dynamic(
  () => import("../trade-tracker/[sessionDate]/daily-trade-analyzer-chart").then((module) => module.DailyTradeAnalyzerChart),
  { ssr: false },
);

type AnalyzerLoadState = "idle" | "loading" | "unavailable" | "error";
type AnalyzerEvent = DaySessionTradeAnalyzer["events"][number];
type AnalyzerPattern = AnalyzerEvent["patterns"][number];
type TradeAnalysisSection = Readonly<{ lines: readonly string[]; title: string }>;

export type WorkspaceTradeAnalyzerPanelProps = Readonly<{
  currency: string;
  direction: "long" | "short";
  executionCount: number;
  gainLossDecimal: string | null;
  onClose: () => void;
  open: boolean;
  roundTripId: string;
  symbol: string;
  timezone: string;
}>;

type AnalyzerPayload = Readonly<{ analysis?: DaySessionTradeAnalyzer; status?: string }>;

function panelOutcomeColor(gainLossDecimal: string | null): "error" | "success" {
  return gainLossDecimal?.startsWith("-") ? "error" : "success";
}

function unavailableMessage(state: AnalyzerLoadState): string | null {
  if (state === "unavailable") return "Saved chart analysis is not available for this trade.";
  if (state === "error") return "The saved analysis could not be loaded. You can try again.";
  return null;
}

function money(value: string | null, currency: string): string {
  if (value === null) return "N/A";
  const normalized = value.startsWith(".") ? `0${value}` : value.startsWith("-.") ? `-0${value.slice(1)}` : value;
  if (!/^(-?)(\d+)(?:\.(\d+))?$/u.test(normalized)) return "N/A";
  const symbol = new Intl.NumberFormat("en-US", { currency, currencyDisplay: "narrowSymbol", style: "currency" })
    .formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  const formatted = formatJournalAnalyticsDecimal(normalized);
  return `${formatted.startsWith("-") ? "-" : "+"}${symbol}${formatted.startsWith("-") ? formatted.slice(1) : formatted}`;
}

function price(value: string | null, currency: string): string {
  if (value === null) return "N/A";
  const formatted = money(value, currency).replace(/^\+/, "");
  const match = /^(-?[^.]+)(?:\.(\d+))?$/u.exec(formatted);
  return match ? `${match[1]}.${(match[2] ?? "").padEnd(2, "0")}` : formatted;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, notation: "compact" }).format(value);
}

function timeLabel(value: string, timezone: string): string {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone });
}


function weightedAverage(events: readonly AnalyzerEvent[], readValue: (event: AnalyzerEvent) => number | null): number | null {
  const valid = events.flatMap((event) => {
    const value = readValue(event);
    const quantity = Number(event.quantity);
    return value !== null && Number.isFinite(value) && Number.isFinite(quantity) && quantity > 0 ? [{ quantity, value }] : [];
  });
  const quantity = valid.reduce((total, item) => total + item.quantity, 0);
  return quantity > 0 ? valid.reduce((total, item) => total + item.value * item.quantity, 0) / quantity : null;
}

function eventSpanMinutes(events: readonly AnalyzerEvent[]): number {
  const first = events[0];
  const last = events.at(-1);
  return first && last ? Math.max(0, Math.round((Date.parse(last.executedAt) - Date.parse(first.executedAt)) / 60_000)) : 0;
}

function weightedReferenceText(events: readonly AnalyzerEvent[], reference: "ema9Distance" | "vwapDistance", label: string, currency: string): string | null {
  const distance = weightedAverage(events, (event) => {
    const value = event.metrics[reference];
    return value ? Number(value.signedDistance) : null;
  });
  const percent = weightedAverage(events, (event) => event.metrics[reference]?.signedDistancePercent ?? null);
  if (distance === null || percent === null) return null;
  const relation = distance > 0 ? "above" : distance < 0 ? "below" : "at";
  return relation === "at" ? `at ${label}` : `${price(String(Math.abs(distance)), currency)} (${Math.abs(percent).toFixed(2)}%) ${relation} ${label}`;
}

function fiveMinuteEmaText(events: readonly AnalyzerEvent[], currency: string): string | null {
  const distance = weightedAverage(events, event => {
    const value = event.fiveMinuteContext?.completedBeforeExecution?.ema9Distance?.signedDistance;
    return value == null ? null : Number(value);
  });
  const percent = weightedAverage(events, event => event.fiveMinuteContext?.completedBeforeExecution?.ema9Distance?.signedDistancePercent ?? null);
  if (distance === null || percent === null) return null;
  const reference = "the 5-minute EMA 9 from the last completed candle";
  return distance === 0 ? `at ${reference}` : `${price(String(Math.abs(distance)), currency)} (${Math.abs(percent).toFixed(2)}%) ${distance > 0 ? "above" : "below"} ${reference}`;
}

function combinedActivityText(events: readonly AnalyzerEvent[], label: string, currency: string): string | null {
  const candles = new Map<number, AnalyzerEvent>();
  for (const event of events) if (event.candleTime !== null && event.metrics.available) candles.set(event.candleTime, event);
  const unique = [...candles.values()];
  if (unique.length === 0) return null;
  const volume = unique.reduce((total, event) => total + Number(event.metrics.candleVolume ?? 0), 0);
  const turnoverAvailable = unique.every((event) => event.metrics.candleTurnover !== null);
  const turnover = unique.reduce((total, event) => total + Number(event.metrics.candleTurnover ?? 0), 0);
  return `${label} candle activity: ${compactNumber(volume)} shares${turnoverAvailable ? ` and ${price(String(turnover), currency)} turnover` : ""}${unique.length < events.length ? "; fills in the same minute are counted once" : ""}.`;
}

function patternText(pattern: AnalyzerPattern, eventKind: AnalyzerEvent["kind"], timezone: string): string {
  const fillName = eventKind === "entry" || eventKind === "add" ? "entry" : "exit";
  const rawName = `${/^[AEIOU]/u.test(candlePatternName(pattern.kind)) ? "an" : "a"} ${candlePatternName(pattern.kind)}`;
  const name = `${rawName[0]!.toUpperCase()}${rawName.slice(1)}`;
  const candlesBefore = pattern.candlesBeforeExecution === 0 ? `the same ${pattern.timeframe} candle as this ${fillName}` : `${pattern.candlesBeforeExecution === 1 ? "one" : "two"} candle${pattern.candlesBeforeExecution === 1 ? "" : "s"} before this ${fillName}`;
  const timestamp = timeLabel(new Date(pattern.time * 1000).toISOString(), timezone);
  if (pattern.availableAtExecution) return `${name} appeared on the ${timestamp} ${pattern.timeframe} candle, ${candlesBefore}. It was complete before the fill.`;
  if (pattern.candlesBeforeExecution === 0) return `${name} formed on the ${timestamp} ${pattern.timeframe} candle, ${candlesBefore}. That candle was still forming at the fill, so this is retrospective context.`;
  return `${name} appeared on the ${timestamp} ${pattern.timeframe} candle, ${candlesBefore}, but its required following-candle confirmation was not complete at the fill.`;
}

function closestPatternLine(events: readonly AnalyzerEvent[], timeframe: AnalyzerPattern["timeframe"], timezone: string, prefix: string): string | null {
  const selected = events.flatMap((event) => event.patterns.filter((pattern) => pattern.timeframe === timeframe).map((pattern) => ({ event, pattern })))
    .sort((left, right) => Number(right.pattern.availableAtExecution) - Number(left.pattern.availableAtExecution) || right.pattern.score - left.pattern.score || left.event.sequence - right.event.sequence)[0];
  return selected ? `${prefix}: ${patternText(selected.pattern, selected.event.kind, timezone)}` : null;
}

function combinedTradeAnalysisSections(analysis: DaySessionTradeAnalyzer, currency: string, timezone: string, timeframe: "1m" | "5m"): TradeAnalysisSection[] {
  const entries = analysis.events.filter((event) => event.kind === "entry" || event.kind === "add");
  const exits = analysis.events.filter((event) => event.kind === "partial_exit" || event.kind === "temporary_flat" || event.kind === "final_exit");
  if (entries.length === 0) return [];
  const entryQuantity = entries.reduce((total, event) => total + Number(event.quantity), 0);
  const exitQuantity = exits.reduce((total, event) => total + Number(event.quantity), 0);
  const averageEntry = weightedAverage(entries, (event) => Number(event.price));
  const averageExit = weightedAverage(exits, (event) => Number(event.price));
  const entryReferences = [weightedReferenceText(entries, "vwapDistance", "session VWAP through each execution minute", currency), timeframe === "5m" ? fiveMinuteEmaText(entries, currency) : weightedReferenceText(entries, "ema9Distance", "1-minute EMA 9", currency)].filter((line): line is string => line !== null);
  const exitReferences = [weightedReferenceText(exits, "vwapDistance", "session VWAP through each execution minute", currency), timeframe === "5m" ? fiveMinuteEmaText(exits, currency) : weightedReferenceText(exits, "ema9Distance", "1-minute EMA 9", currency)].filter((line): line is string => line !== null);
  const entryEdge = weightedAverage(entries, (event) => { const value = timeframe === "5m" ? event.fiveMinuteContext?.containingCandle?.executionEdgeDistance : event.metrics.executionEdgeDistance; return value == null ? null : Number(value); });
  const exitGiveback = weightedAverage(exits, (event) => event.metrics.givebackFromPriorFavorableExtreme === null ? null : Number(event.metrics.givebackFromPriorFavorableExtreme));
  const exitEdge = weightedAverage(exits, (event) => { const value = timeframe === "5m" ? event.fiveMinuteContext?.containingCandle?.executionEdgeDistance : event.metrics.executionEdgeDistance; return value == null ? null : Number(value); });
  const entryLines = [
    averageEntry === null ? `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares.` : `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares at a quantity-weighted average of ${price(String(averageEntry), currency)}${eventSpanMinutes(entries) > 0 ? ` over ${eventSpanMinutes(entries)} minutes` : ""}.`,
    entryReferences.length > 0 ? `Across the entry fills, the quantity-weighted execution was ${entryReferences.join(" and ")}.` : null,
    entryEdge === null ? null : `Average entry precision was ${price(String(entryEdge), currency)} from each fill's favorable edge inside its own ${timeframe === "5m" ? "5-minute" : "1-minute"} candle.`,
    combinedActivityText(entries, "Entry", currency),
  ].filter((line): line is string => line !== null);
  const exitLines = [
    exits.length === 0 ? "No reducing execution is available." : `${exits.length} exit execution${exits.length === 1 ? "" : "s"} closed ${compactNumber(exitQuantity)} shares${averageExit === null ? "" : ` at a quantity-weighted average of ${price(String(averageExit), currency)}`}${eventSpanMinutes(exits) > 0 ? ` over ${eventSpanMinutes(exits)} minutes` : ""}.`,
    exitReferences.length > 0 ? `Across the exit fills, the quantity-weighted execution was ${exitReferences.join(" and ")}.` : null,
    exitGiveback === null ? null : `Across the exits, the average giveback was ${price(String(exitGiveback), currency)} per share from the most favorable earlier completed 1-minute candle price. Larger exit fills carry more weight in this average.`,
    exitEdge === null ? null : `Average exit precision was ${price(String(exitEdge), currency)} from each fill's favorable edge inside its own ${timeframe === "5m" ? "5-minute" : "1-minute"} candle.`,
    combinedActivityText(exits, "Exit", currency),
  ].filter((line): line is string => line !== null);
  const patternLines = [closestPatternLine(entries, timeframe, timezone, "Entry"), closestPatternLine(exits, timeframe, timezone, "Exit")].filter((line): line is string => line !== null);
  return [{ lines: entryLines, title: "Combined entry" }, { lines: exitLines, title: "Combined exit" }, { lines: patternLines, title: `${timeframe === "5m" ? "5-minute" : "1-minute"} candle patterns` }].filter((section) => section.lines.length > 0);
}

function AnalysisBulletList({ color, lines, variant = "body2" }: Readonly<{ color?: string; lines: readonly string[]; variant?: "body2" | "caption" }>) {
  return <Box component="ul" sx={{ display: "grid", gap: 0.6, listStyleType: "disc", m: 0, pl: 2.5, "& li::marker": { color: "text.primary", fontSize: "0.9em" } }}>{lines.map((line, index) => <Box component="li" key={`${index}-${line}`} sx={{ pl: 0.25 }}><Typography color={color} variant={variant}>{line}</Typography></Box>)}</Box>;
}

function AnalysisSection({ section }: Readonly<{ section: TradeAnalysisSection }>) {
  return <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">{section.title}</Typography><AnalysisBulletList lines={section.lines} /></Box>;
}


function FullAnalysisEvidence({ analysis, currency, timezone, direction, interval }: Readonly<{ analysis: DaySessionTradeAnalyzer; currency: string; timezone: string; direction: "long" | "short"; interval: DailyTradeChartInterval }>) {
  const timeframe = interval === "5m" ? "5m" : "1m";
  const sections = combinedTradeAnalysisSections(analysis, currency, timezone, timeframe);
  return <Box sx={{ borderTop: 1, borderColor: "divider", p: { xs: 1.5, md: 2 } }}><WrittenTradeAnalysis analysis={analysis} currency={currency} timezone={timezone} direction={direction} timeframe={timeframe}><Stack spacing={1.25}>{sections.map(section => <AnalysisSection key={section.title} section={section} />)}</Stack></WrittenTradeAnalysis></Box>;
}

export function WorkspaceTradeAnalyzerPanel({ currency, direction, executionCount, gainLossDecimal, onClose, open, roundTripId, symbol, timezone }: WorkspaceTradeAnalyzerPanelProps) {
  const [analysis, setAnalysis] = useState<DaySessionTradeAnalyzer | null>(null);
  const [interval, setInterval] = useState<DailyTradeChartInterval>("1m");
  const [loadState, setLoadState] = useState<AnalyzerLoadState>("idle");
  const [availability, setAvailability] = useState<Readonly<{ enabled: boolean; dailyAvailable: number; periodAvailable: number; daysUntilReset: number; selectableAvailable: number }> | null>(null);
  const [requesting, setRequesting] = useState(false);
  const loadRequestRef = useRef(0);
  async function loadAnalysis(): Promise<void> {
    const request = ++loadRequestRef.current;
    setLoadState("loading");
    try {
      const response = await fetch(`/api/platform/trade-analyzer/trade?${new URLSearchParams({ direction, roundTripId })}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as AnalyzerPayload | null;
      if (request !== loadRequestRef.current) return;
      if (response.ok && payload?.status === "ready" && payload.analysis?.status === "pending") {
        setAnalysis(null); setLoadState("loading");
        window.setTimeout(() => {
          if (request === loadRequestRef.current) void loadAnalysis();
        }, 5_000);
        return;
      }
      if (response.ok && payload?.status === "ready" && payload.analysis?.status === "execution_mismatch") {
        setAnalysis(payload.analysis); setLoadState("idle");
        return;
      }
      if (!response.ok || payload?.status !== "ready" || !payload.analysis || payload.analysis.candles.length === 0) {
        setAnalysis(null); setLoadState("unavailable");
        const uses = await fetch("/api/platform/daily-trade-analyzer/allowance", { cache: "no-store" }).then((value) => value.json()).catch(() => null) as { availability?: typeof availability } | null;
        if (request === loadRequestRef.current) setAvailability(
          uses?.availability?.enabled === false ? null : uses?.availability ?? null,
        );
        return;
      }
      setAnalysis(payload.analysis); setLoadState("idle");
    } catch { if (request === loadRequestRef.current) { setAnalysis(null); setLoadState("error"); } }
  }
  useEffect(() => {
    if (!open) { loadRequestRef.current += 1; return; }
    setInterval("1m"); setAnalysis(null); void loadAnalysis();
    // The selected trade identity is the intentional loading boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, open, roundTripId]);
  async function requestAnalysis(): Promise<void> {
    if (!availability?.enabled || availability.selectableAvailable <= 0) {
      setLoadState("unavailable");
      return;
    }
    setRequesting(true);
    try {
      const response = await fetch("/api/platform/trade-analyzer/trade/request", {
        method: "POST", headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ roundTripId }),
      });
      const payload = await response.json() as { outcome?: string; availability?: typeof availability };
      setAvailability(payload.availability?.enabled === false ? null : payload.availability ?? availability);
      if (response.ok && (payload.outcome === "queued" || payload.outcome === "already_requested")) void loadAnalysis();
    } finally { setRequesting(false); }
  }
  const message = unavailableMessage(loadState);
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { maxWidth: "none", width: "100vw" } } }}><Stack sx={{ height: "100%" }}><Box sx={{ borderBottom: 1, borderColor: "divider", p: { xs: 1.25, md: 2 } }}><Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><InsightsRoundedIcon color="primary" /><Box><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Trade Analyzer</Typography><Typography color="text.secondary" variant="body2">{symbol} · {direction === "long" ? "Long" : "Short"} · {executionCount} execution{executionCount === 1 ? "" : "s"}</Typography></Box></Stack><IconButton aria-label="Close Trade Analyzer" onClick={onClose}><CloseRoundedIcon /></IconButton></Stack></Box><Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{loadState === "loading" ? <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center", minHeight: 320, p: 3 }}><CircularProgress /><Typography color="text.secondary" variant="body2">Loading saved chart analysis…</Typography></Stack> : null}{message && loadState !== "loading" ? <Stack spacing={1.5} sx={{ p: { xs: 1.5, md: 2 } }}><Alert severity={loadState === "error" ? "error" : "info"}>{message}</Alert>{availability ? <><Typography variant="body2">{availability.dailyAvailable} available today</Typography><Typography variant="body2">{availability.periodAvailable} available this period · resets in {availability.daysUntilReset} days</Typography><Button disabled={requesting} onClick={() => void requestAnalysis()} sx={{ alignSelf: "flex-start" }} variant="contained">Analyze Trade</Button>{availability.selectableAvailable <= 0 ? <Typography color="error.main" variant="body2">You have used all available Trade Analyzer uses.</Typography> : null}</> : null}<Button onClick={() => void loadAnalysis()} sx={{ alignSelf: "flex-start" }} variant="outlined">Try again</Button></Stack> : null}{analysis?.status === "execution_mismatch" && loadState !== "loading" ? <Stack spacing={1} sx={{ p: { xs: 1.5, md: 2 } }}><Alert severity="warning">Review the execution details and correct the highlighted time or price before Analyzer runs again.</Alert>{analysis.executionMismatches.map((mismatch) => <Typography key={mismatch.executionId} variant="body2">{mismatch.side.toUpperCase()} · {mismatch.executedAt} · entered {mismatch.enteredPrice} · candle {mismatch.candleLow}–{mismatch.candleHigh}</Typography>)}</Stack> : null}{analysis && analysis.status !== "execution_mismatch" && loadState !== "loading" ? <><DailyTradeAnalyzerChart analysis={analysis} currency={currency} direction={direction} interval={interval} onIntervalChange={setInterval} selectedEventId={null} symbol={symbol} tradeLabelColor={panelOutcomeColor(gainLossDecimal)} tradeNumber={1} /><FullAnalysisEvidence analysis={analysis} currency={currency} timezone={timezone} direction={direction} interval={interval} /></> : null}</Box></Stack></Drawer>;
}
