"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Drawer, IconButton, Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import type { DailyTradeChartInterval } from "../trade-tracker/[sessionDate]/daily-trade-analyzer-chart";
import type { DaySessionTradeAnalyzer } from "../trade-tracker/[sessionDate]/day-session-types";

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

function analysisTimestamp(seconds: number | null, timezone: string): string | null {
  return seconds === null ? null : timeLabel(new Date(seconds * 1000).toISOString(), timezone);
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

function combinedTradeAnalysisSections(analysis: DaySessionTradeAnalyzer, currency: string, timezone: string): TradeAnalysisSection[] {
  const entries = analysis.events.filter((event) => event.kind === "entry" || event.kind === "add");
  const exits = analysis.events.filter((event) => event.kind === "partial_exit" || event.kind === "final_exit");
  if (entries.length === 0) return [];
  const entryQuantity = entries.reduce((total, event) => total + Number(event.quantity), 0);
  const exitQuantity = exits.reduce((total, event) => total + Number(event.quantity), 0);
  const averageEntry = weightedAverage(entries, (event) => Number(event.price));
  const averageExit = weightedAverage(exits, (event) => Number(event.price));
  const entryReferences = [weightedReferenceText(entries, "vwapDistance", "session VWAP through each execution minute", currency), weightedReferenceText(entries, "ema9Distance", "1-minute EMA 9", currency)].filter((line): line is string => line !== null);
  const exitReferences = [weightedReferenceText(exits, "vwapDistance", "session VWAP through each execution minute", currency), weightedReferenceText(exits, "ema9Distance", "1-minute EMA 9", currency)].filter((line): line is string => line !== null);
  const entryEdge = weightedAverage(entries, (event) => event.metrics.executionEdgeDistance === null ? null : Number(event.metrics.executionEdgeDistance));
  const exitGiveback = weightedAverage(exits, (event) => event.metrics.givebackFromPriorFavorableExtreme === null ? null : Number(event.metrics.givebackFromPriorFavorableExtreme));
  const exitEdge = weightedAverage(exits, (event) => event.metrics.executionEdgeDistance === null ? null : Number(event.metrics.executionEdgeDistance));
  const entryLines = [
    averageEntry === null ? `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares.` : `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares at a quantity-weighted average of ${price(String(averageEntry), currency)}${eventSpanMinutes(entries) > 0 ? ` over ${eventSpanMinutes(entries)} minutes` : ""}.`,
    entryReferences.length > 0 ? `Across the entry fills, the quantity-weighted execution was ${entryReferences.join(" and ")}.` : null,
    entryEdge === null ? null : `Average entry precision was ${price(String(entryEdge), currency)} from each fill's favorable edge inside its own 1-minute candle.`,
    combinedActivityText(entries, "Entry", currency),
  ].filter((line): line is string => line !== null);
  const exitLines = [
    exits.length === 0 ? "No reducing execution is available." : `${exits.length} exit execution${exits.length === 1 ? "" : "s"} closed ${compactNumber(exitQuantity)} shares${averageExit === null ? "" : ` at a quantity-weighted average of ${price(String(averageExit), currency)}`}${eventSpanMinutes(exits) > 0 ? ` over ${eventSpanMinutes(exits)} minutes` : ""}.`,
    exitReferences.length > 0 ? `Across the exit fills, the quantity-weighted execution was ${exitReferences.join(" and ")}.` : null,
    exitGiveback === null ? null : `Across the exits, the average giveback was ${price(String(exitGiveback), currency)} per share from the most favorable earlier completed 1-minute candle price. Larger exit fills carry more weight in this average.`,
    exitEdge === null ? null : `Average exit precision was ${price(String(exitEdge), currency)} from each fill's favorable edge inside its own 1-minute candle.`,
    combinedActivityText(exits, "Exit", currency),
  ].filter((line): line is string => line !== null);
  const patternLines = [closestPatternLine(entries, "1m", timezone, "Entry"), closestPatternLine(exits, "1m", timezone, "Exit")].filter((line): line is string => line !== null);
  return [{ lines: entryLines, title: "Combined entry" }, { lines: exitLines, title: "Combined exit" }, { lines: patternLines, title: "1-minute candle patterns" }].filter((section) => section.lines.length > 0);
}

function AnalysisBulletList({ color, lines, variant = "body2" }: Readonly<{ color?: string; lines: readonly string[]; variant?: "body2" | "caption" }>) {
  return <Box component="ul" sx={{ display: "grid", gap: 0.6, listStyleType: "disc", m: 0, pl: 2.5, "& li::marker": { color: "text.primary", fontSize: "0.9em" } }}>{lines.map((line, index) => <Box component="li" key={`${index}-${line}`} sx={{ pl: 0.25 }}><Typography color={color} variant={variant}>{line}</Typography></Box>)}</Box>;
}

function AnalysisSection({ section }: Readonly<{ section: TradeAnalysisSection }>) {
  return <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">{section.title}</Typography><AnalysisBulletList lines={section.lines} /></Box>;
}

function greenToRedLabel(status: DaySessionTradeAnalyzer["greenToRed"]["status"]): string {
  if (status === "never_green") return "Never green";
  if (status === "green_no_red") return "Stayed green";
  if (status === "green_to_red_ended_red") return "Green → red, ended red";
  if (status === "green_to_red_recovered") return "Green → red, recovered";
  if (status === "green_to_red_ended_flat") return "Green → red, ended flat";
  return "Unavailable";
}

function ProfitOpportunitySummary({ currency, label, opportunity, timezone }: Readonly<{ currency: string; label: string; opportunity: DaySessionTradeAnalyzer["greenToRed"]["profitOpportunities"][number]; timezone: string }>) {
  const startedAt = analysisTimestamp(opportunity.startedAtUtcSeconds, timezone);
  const endedAt = analysisTimestamp(opportunity.endedAtUtcSeconds, timezone);
  const peakAt = analysisTimestamp(opportunity.peakAtUtcSeconds, timezone);
  const closeLabel = `${opportunity.completedCloseCount} completed close${opportunity.completedCloseCount === 1 ? "" : "s"}`;
  const duration = opportunity.durationMinutes === 0 ? `This period contains one completed close${startedAt ? ` at ${startedAt}` : ""}.` : `This period ran from ${startedAt ?? "an unavailable start time"} to ${endedAt ?? "an unavailable end time"} and covered ${opportunity.durationMinutes} minute${opportunity.durationMinutes === 1 ? "" : "s"} (${closeLabel}).`;
  return <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">{label}</Typography><AnalysisBulletList lines={[duration, opportunity.completedCloseCount === 1 ? `Calculated P/L at that completed close was ${money(opportunity.peakPnlDecimal, currency)}.` : `During this period, calculated P/L stayed between ${money(opportunity.lowestPnlDecimal, currency)} and ${money(opportunity.peakPnlDecimal, currency)}${peakAt ? `, reaching its highest level at ${peakAt}` : ""}.`, `From the highest calculated P/L in this period to the final calculated result, ${price(opportunity.peakToFinalReversalDecimal, currency)} was given back.`]} /></Box>;
}

function GreenToRedEvidence({ analysis, currency, timezone }: Readonly<{ analysis: DaySessionTradeAnalyzer["greenToRed"]; currency: string; timezone: string }>) {
  const [showOtherOpportunities, setShowOtherOpportunities] = useState(false);
  const firstGreenAt = analysisTimestamp(analysis.firstGreenAtUtcSeconds, timezone);
  const peakAt = analysisTimestamp(analysis.peakAtUtcSeconds, timezone);
  const firstRedAt = analysisTimestamp(analysis.firstRedAtUtcSeconds, timezone);
  const firstRecoveryAt = analysisTimestamp(analysis.firstRecoveryAtUtcSeconds, timezone);
  const transitionDetected = analysis.firstRedAtUtcSeconds !== null;
  const chipColor = analysis.status === "green_to_red_ended_red" ? "error" : analysis.status === "green_no_red" || analysis.status === "green_to_red_recovered" ? "success" : "default";
  const bestOpportunity = analysis.bestProfitOpportunityIndex === null ? null : analysis.profitOpportunities[analysis.bestProfitOpportunityIndex] ?? null;
  const otherOpportunities = analysis.profitOpportunities.filter((_, index) => index !== analysis.bestProfitOpportunityIndex);
  const actionFacts = [analysis.addedAfterPeakCount > 0 ? `${analysis.addedAfterPeakCount} add${analysis.addedAfterPeakCount === 1 ? "" : "s"} occurred after the peak.` : null, analysis.partialExitBeforeRedCount > 0 ? `${analysis.partialExitBeforeRedCount} partial exit${analysis.partialExitBeforeRedCount === 1 ? "" : "s"} occurred between the peak and the move below breakeven.` : null].filter((line): line is string => line !== null);
  return <Box sx={{ borderColor: "divider", borderLeft: { xs: 0, md: 1 }, borderTop: { xs: 1, md: 0 }, minWidth: 0, pl: { xs: 0, md: 2 }, pt: { xs: 2, md: 0 } }}><Stack spacing={1.1}>
    <Typography sx={{ fontWeight: 900 }} variant="body1">Green-to-red analysis</Typography><Chip color={chipColor} label={greenToRedLabel(analysis.status)} size="small" sx={{ alignSelf: "flex-start", fontWeight: 800 }} />
    {analysis.status === "unavailable" ? <AnalysisBulletList lines={["The complete saved candle and execution path needed for this analysis is unavailable."]} /> : analysis.status === "never_green" ? <AnalysisBulletList lines={["No completed one-minute candle close or exact execution showed a positive trade P/L before the position became flat."]} /> : <>
      <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">Profitable phase</Typography><AnalysisBulletList lines={[`The trade first moved into profit${firstGreenAt ? ` at ${firstGreenAt}` : ""}${analysis.peakPnlDecimal !== null ? ` and reached a peak calculated P/L of ${money(analysis.peakPnlDecimal, currency)}` : ""}${peakAt ? ` at ${peakAt}` : ""}.`]} /></Box>
      {bestOpportunity ? <Box><ProfitOpportunitySummary currency={currency} label="Best sustained profit opportunity" opportunity={bestOpportunity} timezone={timezone} />{otherOpportunities.length > 0 ? <><Button aria-expanded={showOtherOpportunities} onClick={() => setShowOtherOpportunities((current) => !current)} size="small" sx={{ alignSelf: "flex-start", mt: 0.55, px: 0, textTransform: "none" }} variant="text">{showOtherOpportunities ? "Hide other profit opportunities" : `View other profit opportunities (${otherOpportunities.length})`}</Button><Collapse in={showOtherOpportunities} timeout="auto" unmountOnExit><Stack spacing={1.25} sx={{ borderLeft: 2, borderColor: "divider", mt: 0.5, pl: 1.25 }}>{otherOpportunities.map((opportunity, index) => <ProfitOpportunitySummary currency={currency} key={`${opportunity.startedAtUtcSeconds}-${opportunity.endedAtUtcSeconds}`} label={`Other opportunity ${index + 1}`} opportunity={opportunity} timezone={timezone} />)}</Stack></Collapse></> : null}</Box> : null}
      <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">{transitionDetected ? "Move below breakeven" : "Price path result"}</Typography>{transitionDetected ? <AnalysisBulletList lines={[`The trade moved below breakeven${firstRedAt ? ` at ${firstRedAt}` : ""}${analysis.firstRedPnlDecimal !== null ? ` with a calculated P/L of ${money(analysis.firstRedPnlDecimal, currency)}` : ""}.`, ...(analysis.peakToRedReversalDecimal !== null ? [`From the peak to that red point, ${price(analysis.peakToRedReversalDecimal, currency)} reversed${analysis.minutesFromPeakToRed === null ? "" : ` over ${analysis.minutesFromPeakToRed} minute${analysis.minutesFromPeakToRed === 1 ? "" : "s"}`}.`] : []), ...(analysis.status === "green_to_red_recovered" && firstRecoveryAt ? [`The trade returned above breakeven at ${firstRecoveryAt}.`] : analysis.status === "green_to_red_ended_flat" ? ["The calculated price path finished flat."] : analysis.status === "green_to_red_ended_red" ? ["The calculated price path finished below breakeven."] : [])]} /> : <AnalysisBulletList lines={["After becoming profitable, the calculated trade path did not later move below breakeven before the final exit."]} />}</Box>
      {transitionDetected && analysis.positionQuantityAtPeakDecimal !== null && analysis.positionQuantityAtRedDecimal !== null ? <Box><Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">Position changes</Typography><AnalysisBulletList lines={[`Position size was ${compactNumber(Number(analysis.positionQuantityAtPeakDecimal))} shares at the peak and ${compactNumber(Number(analysis.positionQuantityAtRedDecimal))} shares when the trade moved below breakeven.`, ...actionFacts]} /></Box> : null}
    </>}
    {analysis.finalPnlDecimal !== null ? <AnalysisBulletList color="text.secondary" lines={[`Calculated final path P/L: ${money(analysis.finalPnlDecimal, currency)}.`]} variant="caption" /> : null}
    <Typography color="text.secondary" variant="caption">{analysis.feesComplete ? "The calculated path includes all reported execution fees." : "Unreported execution fees are unavailable and are not included in this calculated price path."} Transitions use completed one-minute closes and exact fills, not unknowable intraminute high/low order.</Typography>
  </Stack></Box>;
}

function FullAnalysisEvidence({ analysis, currency, timezone }: Readonly<{ analysis: DaySessionTradeAnalyzer; currency: string; timezone: string }>) {
  const sections = combinedTradeAnalysisSections(analysis, currency, timezone);
  return <Box sx={{ borderTop: 1, borderColor: "divider", p: { xs: 1.5, md: 2 } }}><Box sx={{ display: "grid", gap: { xs: 2, md: 0 }, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}><Stack spacing={1.25} sx={{ minWidth: 0, pr: { xs: 0, md: 2 } }}>{sections.map((section) => <AnalysisSection key={section.title} section={section} />)}</Stack><GreenToRedEvidence analysis={analysis.greenToRed} currency={currency} timezone={timezone} /></Box></Box>;
}

export function WorkspaceTradeAnalyzerPanel({ currency, direction, executionCount, gainLossDecimal, onClose, open, roundTripId, symbol, timezone }: WorkspaceTradeAnalyzerPanelProps) {
  const [analysis, setAnalysis] = useState<DaySessionTradeAnalyzer | null>(null);
  const [interval, setInterval] = useState<DailyTradeChartInterval>("1m");
  const [loadState, setLoadState] = useState<AnalyzerLoadState>("idle");
  const loadRequestRef = useRef(0);
  async function loadAnalysis(): Promise<void> {
    const request = ++loadRequestRef.current;
    setLoadState("loading");
    try {
      const response = await fetch(`/api/platform/trade-analyzer/trade?${new URLSearchParams({ direction, roundTripId })}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as AnalyzerPayload | null;
      if (request !== loadRequestRef.current) return;
      if (!response.ok || payload?.status !== "ready" || !payload.analysis || payload.analysis.candles.length === 0) { setAnalysis(null); setLoadState("unavailable"); return; }
      setAnalysis(payload.analysis); setLoadState("idle");
    } catch { if (request === loadRequestRef.current) { setAnalysis(null); setLoadState("error"); } }
  }
  useEffect(() => {
    if (!open) { loadRequestRef.current += 1; return; }
    setInterval("1m"); setAnalysis(null); void loadAnalysis();
    // The selected trade identity is the intentional loading boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, open, roundTripId]);
  const message = unavailableMessage(loadState);
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { maxWidth: "none", width: "100vw" } } }}><Stack sx={{ height: "100%" }}><Box sx={{ borderBottom: 1, borderColor: "divider", p: { xs: 1.25, md: 2 } }}><Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><InsightsRoundedIcon color="primary" /><Box><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Trade Analyzer</Typography><Typography color="text.secondary" variant="body2">{symbol} · {direction === "long" ? "Long" : "Short"} · {executionCount} execution{executionCount === 1 ? "" : "s"}</Typography></Box></Stack><IconButton aria-label="Close Trade Analyzer" onClick={onClose}><CloseRoundedIcon /></IconButton></Stack></Box><Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{loadState === "loading" ? <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center", minHeight: 320, p: 3 }}><CircularProgress /><Typography color="text.secondary" variant="body2">Loading saved chart analysis…</Typography></Stack> : null}{message && loadState !== "loading" ? <Stack spacing={1.5} sx={{ p: { xs: 1.5, md: 2 } }}><Alert severity={loadState === "error" ? "error" : "info"}>{message}</Alert><Button onClick={() => void loadAnalysis()} sx={{ alignSelf: "flex-start" }} variant="outlined">Try again</Button></Stack> : null}{analysis && loadState !== "loading" ? <><DailyTradeAnalyzerChart analysis={analysis} currency={currency} direction={direction} interval={interval} onIntervalChange={setInterval} selectedEventId={null} symbol={symbol} tradeLabelColor={panelOutcomeColor(gainLossDecimal)} tradeNumber={1} /><FullAnalysisEvidence analysis={analysis} currency={currency} timezone={timezone} /></> : null}</Box></Stack></Drawer>;
}
