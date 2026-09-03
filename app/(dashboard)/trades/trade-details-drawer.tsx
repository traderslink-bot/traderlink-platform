"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState, type ReactNode } from "react";

import { financialOutcomeColor } from
  "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsDuration,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import { WorkspaceTradeAnalyzerPanel } from "../workspace/workspace-trade-analyzer-panel";
import { JournalTagChip } from "../trade-tags/journal-tag-picker";

type DetailTab = "details" | "analyzer";

type TradeDetailsBase = Readonly<{
  direction: "long" | "short";
  hasCurrentAnalyzerResult: boolean;
  notes: Readonly<{
    technicalNote: string;
    tradeNote: string;
  }> | null;
  performance: Readonly<{
    chargeCostDecimal: string | null;
    chargeCoverage: "complete" | "unavailable";
    chargeCreditDecimal: string | null;
    closedAtUtc: string;
    enteredQuantityDecimal: string;
    entryNotionalDecimal: string;
    executionCount: number;
    grossPnlDecimal: string;
    holdDurationMilliseconds: number;
    maximumPositionQuantityDecimal: string;
    openedAtUtc: string;
    tradeCurrency: string;
  }> | null;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  ruleReviews: readonly Readonly<{
    note: string;
    ruleTitle: string;
    status: "followed" | "broken" | "not_reviewed";
  }>[];
  style: Readonly<{
    tradeStyle: "day_trade" | "swing" | "other";
  }> | null;
  symbol: string;
  tags: readonly Readonly<{
    name: string;
  }>[];
  timezone: string;
}>;

type TradeDetails = TradeDetailsBase & (
  | Readonly<{
    executions: readonly Readonly<{
      executedAtUtc: string;
      feesDecimal: string | null;
      priceDecimal: string | null;
      quantityDecimal: string;
      side: "buy" | "sell";
    }>[];
    status: "ready";
    storyCopy:
    | Readonly<{
      chapters: readonly Readonly<{
        sentences: readonly string[];
        tradingDate: string;
      }>[];
      status: "ready";
    }>
    | Readonly<{
      reason: "position_flipped" | "position_reopened";
      status: "factual_timeline_required";
    }>;
  }>
  | Readonly<{ status: "summary_only" }>
);

type DetailState =
  | Readonly<{ status: "idle" | "loading" }>
  | Readonly<{ details: TradeDetails; status: "ready" }>
  | Readonly<{ status: "error" }>;

function tradeStyleLabel(style: TradeDetails["style"]): string {
  if (style?.tradeStyle === "swing") return "Swing Trade";
  if (style?.tradeStyle === "day_trade") return "Day Trade";
  return "Trade";
}

function dateTime(value: string, timezone: string): Readonly<{ date: string; time: string }> {
  const instant = new Date(value);
  return Object.freeze({
    date: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      timeZone: timezone,
      year: "numeric",
    }).format(instant),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(instant),
  });
}

function tradeTimeRange(details: TradeDetails): string {
  const openedAtUtc = details.performance?.openedAtUtc ??
    (details.status === "ready" ? details.executions[0]?.executedAtUtc : undefined);
  const closedAtUtc = details.performance?.closedAtUtc ??
    (details.status === "ready" ? details.executions.at(-1)?.executedAtUtc : undefined);
  if (!openedAtUtc) return "Time unavailable";
  const opened = dateTime(openedAtUtc, details.timezone);
  if (!closedAtUtc || closedAtUtc === openedAtUtc) return `${opened.date} · ${opened.time}`;
  const closed = dateTime(closedAtUtc, details.timezone);
  return opened.date === closed.date
    ? `${opened.date} · ${opened.time}–${closed.time}`
    : `${opened.date} ${opened.time} – ${closed.date} ${closed.time}`;
}

function reviewTone(status: TradeDetails["ruleReviews"][number]["status"]): "default" | "error" | "success" {
  if (status === "broken") return "error";
  if (status === "followed") return "success";
  return "default";
}

function reviewLabel(status: TradeDetails["ruleReviews"][number]["status"]): string {
  if (status === "broken") return "Broken";
  if (status === "followed") return "Followed";
  return "Not reviewed";
}

function SurfaceSection({ children, emphasizeHeader = false, outcomeTone, title }: Readonly<{ children: ReactNode; emphasizeHeader?: boolean; outcomeTone: "success" | "error" | null; title: string }>) {
  return <Box sx={(theme) => ({
    bgcolor: theme.palette.mode === "dark" && outcomeTone
      ? alpha(theme.palette[outcomeTone].main, 0.08)
      : "background.paper",
    border: 1,
    borderColor: "divider",
    borderRadius: 2,
    overflow: "hidden",
  })}>
    <Typography component="h3" sx={(theme) => {
      const useDarkOutcomeSurface = theme.palette.mode === "dark" && outcomeTone !== null;
      const useLightResultSurface = theme.palette.mode !== "dark" && emphasizeHeader && outcomeTone !== null;
      return {
        bgcolor: useDarkOutcomeSurface
          ? alpha(theme.palette[outcomeTone!].main, 0.18)
          : useLightResultSurface ? `${outcomeTone}.main` : "action.hover",
        color: useDarkOutcomeSurface || useLightResultSurface ? "common.white" : "text.primary",
        fontWeight: 850,
        px: 1.5,
        py: 1,
      };
    }} variant="body2">{title}</Typography>
    <Box sx={{ p: 1.5 }}>{children}</Box>
  </Box>;
}

export function TradeDetailsDrawer({
  analyzer,
  initialTab = "details",
  onClose,
  open,
  roundTripId,
}: Readonly<{
  analyzer: Readonly<{
    currency: string;
    direction: "long" | "short";
    executionCount: number;
    gainLossDecimal: string | null;
    symbol: string;
    timezone: string;
  }> | null;
  initialTab?: DetailTab;
  onClose: () => void;
  open: boolean;
  roundTripId: string | null;
}>) {
  const [state, setState] = useState<DetailState>({ status: "idle" });
  const [tab, setTab] = useState<DetailTab>(initialTab);

  useEffect(() => {
    if (!open || !roundTripId) return;
    const controller = new AbortController();
    setState({ status: "loading" });
    setTab(initialTab);
    void fetch(`/api/platform/journal/trade-details?roundTripId=${encodeURIComponent(roundTripId)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("trade_details_unavailable");
      return response.json() as Promise<TradeDetails>;
    }).then((details) => {
      setState({ details, status: "ready" });
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({ status: "error" });
    });
    return () => controller.abort();
  }, [initialTab, open, roundTripId]);

  const details = state.status === "ready" ? state.details : null;
  const performance = details?.performance ?? null;
  const resultColor = performance ? financialOutcomeColor(performance.grossPnlDecimal) : "text.primary";
  const outcomeTone = resultColor === "success.main" ? "success" : resultColor === "error.main" ? "error" : null;
  const resultValue = performance
    ? formatJournalAnalyticsMoney(performance.grossPnlDecimal, performance.tradeCurrency, { showPositiveSign: true })
    : details?.projectionState === "legitimate_open" ? "Open" : "—";

  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 680, lg: 720 }, maxWidth: "100vw" } } }}>
    <Stack sx={{ height: "100%" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Trade Details</Typography>
          {details ? <>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
              <Typography sx={{ fontWeight: 850 }}>{details.symbol} · {details.direction === "long" ? "Long" : "Short"} · {tradeStyleLabel(details.style)}</Typography>
              {details.projectionState === "legitimate_open" ? <Chip label="Open" size="small" variant="outlined" /> : null}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">{tradeTimeRange(details)}</Typography>
            {details.status === "summary_only" ? <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">Historical trade summary</Typography> : null}
          </> : null}
        </Box>
        <Stack sx={{ alignItems: "flex-end", flexShrink: 0 }}>
          {details ? <>
            <Typography color={resultColor} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 900 }} variant="h6">{resultValue}</Typography>
            <Typography color="text.secondary" variant="caption">{performance ? "Gross P/L" : "Position status"}</Typography>
          </> : null}
          <IconButton aria-label="Close trade details" onClick={onClose} sx={{ minHeight: 44, minWidth: 44, mt: 0.25 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Tabs aria-label="Trade details sections" onChange={(_event, value: DetailTab) => setTab(value)} sx={{ borderBottom: 1, borderColor: "divider", px: 1.5 }} value={tab} variant="fullWidth">
        <Tab label="Details" value="details" />
        <Tab label="Analyzer" value="analyzer" />
      </Tabs>

      {tab === "details" ? <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
        {state.status === "loading" ? <Stack spacing={1} sx={{ alignItems: "center", minHeight: 220, justifyContent: "center" }}><CircularProgress size={28} /><Typography color="text.secondary">Loading trade details…</Typography></Stack> : null}
        {state.status === "error" ? <Alert severity="error">Trade details could not be loaded. Refresh and try again.</Alert> : null}
        {details ? <Stack spacing={1.5}>
          <SurfaceSection emphasizeHeader outcomeTone={outcomeTone} title="Result">
            {performance ? <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" } }}>
              <Box><Typography color="text.secondary" variant="caption">Gross P/L</Typography><Typography color={resultColor} sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }}>{resultValue}</Typography></Box>
              <Box><Typography color="text.secondary" variant="caption">Fees</Typography><Typography sx={{ fontWeight: 800 }}>{performance.chargeCoverage === "complete" ? formatJournalAnalyticsMoney(performance.chargeCostDecimal, performance.tradeCurrency) : "N/A"}</Typography></Box>
              <Box><Typography color="text.secondary" variant="caption">Total shares</Typography><Typography sx={{ fontWeight: 800 }}>{formatJournalAnalyticsDecimal(performance.enteredQuantityDecimal)}</Typography></Box>
              <Box><Typography color="text.secondary" variant="caption">Executions</Typography><Typography sx={{ fontWeight: 800 }}>{performance.executionCount}</Typography></Box>
              <Box><Typography color="text.secondary" variant="caption">Entry value</Typography><Typography sx={{ fontWeight: 800 }}>{formatJournalAnalyticsMoney(performance.entryNotionalDecimal, performance.tradeCurrency)}</Typography></Box>
              <Box><Typography color="text.secondary" variant="caption">Hold</Typography><Typography sx={{ fontWeight: 800 }}>{formatJournalAnalyticsDuration(performance.holdDurationMilliseconds)}</Typography></Box>
            </Box> : <Typography color="text.secondary" variant="body2">This position is still open. Completed-trade P/L and fees will appear after it is fully exited.</Typography>}
          </SurfaceSection>

          <SurfaceSection outcomeTone={outcomeTone} title="Trade Story">
            {details.status === "summary_only" ? <Typography color="text.secondary" variant="body2">This historical trade keeps its verified result summary, but its full Journal execution timeline is not retained. A Trade Story cannot be composed without those executions.</Typography> : details.storyCopy.status === "ready" ? <Stack spacing={1.25}>{details.storyCopy.chapters.map((chapter) => <Box key={chapter.tradingDate}><Typography color="text.secondary" sx={{ fontWeight: 850 }} variant="caption">{new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: details.timezone, year: "numeric" }).format(new Date(`${chapter.tradingDate}T12:00:00Z`))}</Typography><Stack spacing={0.75} sx={{ mt: 0.5 }}>{chapter.sentences.map((sentence) => <Typography key={sentence} variant="body2">{sentence}</Typography>)}</Stack></Box>)}</Stack> : <Typography color="text.secondary" variant="body2">This trade contains a position transition that needs its exact execution timeline instead of a summarized story.</Typography>}
          </SurfaceSection>

          <SurfaceSection outcomeTone={outcomeTone} title="Journal">
            <Stack spacing={1.25}>
              {details.notes?.tradeNote.trim() ? <Box><Typography color="text.secondary" variant="caption">Trade note</Typography><Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{details.notes.tradeNote}</Typography></Box> : null}
              {details.notes?.technicalNote.trim() ? <Box><Typography color="text.secondary" variant="caption">Technical note</Typography><Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{details.notes.technicalNote}</Typography></Box> : null}
              {details.tags.length > 0 ? <Box><Typography color="text.secondary" variant="caption">Tags</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>{details.tags.map((tag) => <JournalTagChip key={tag.name} label={tag.name} />)}</Stack></Box> : null}
              {details.ruleReviews.length > 0 ? <Box><Typography color="text.secondary" variant="caption">Rules</Typography><Stack spacing={0.5} sx={{ mt: 0.5 }}>{details.ruleReviews.map((review, index) => <Stack direction="row" key={`${review.ruleTitle}-${index}`} spacing={0.75} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography sx={{ minWidth: 0 }} variant="body2">{review.ruleTitle}</Typography><Chip color={reviewTone(review.status)} label={reviewLabel(review.status)} size="small" /></Stack>)}</Stack></Box> : null}
              {!details.notes?.tradeNote.trim() && !details.notes?.technicalNote.trim() && details.tags.length === 0 && details.ruleReviews.length === 0 ? <Typography color="text.secondary" variant="body2">No notes, tags, or reviewed rules have been saved for this trade.</Typography> : null}
            </Stack>
          </SurfaceSection>

          <Accordion disableGutters elevation={0} sx={(theme) => ({ bgcolor: theme.palette.mode === "dark" && outcomeTone ? alpha(theme.palette[outcomeTone].main, 0.08) : "background.paper", border: 1, borderColor: "divider", borderRadius: 2, "&:before": { display: "none" }, overflow: "hidden" })}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={(theme) => ({ bgcolor: theme.palette.mode === "dark" && outcomeTone ? alpha(theme.palette[outcomeTone].main, 0.18) : "action.hover", color: theme.palette.mode === "dark" && outcomeTone ? "common.white" : "text.primary", px: 1.5 })}><Typography sx={{ fontWeight: 850 }}>Exact executions {details.status === "ready" ? `(${details.executions.length})` : null}</Typography></AccordionSummary>
            <AccordionDetails sx={{ p: details.status === "summary_only" ? 1.5 : 0 }}>{details.status === "summary_only" ? <Typography color="text.secondary" variant="body2">Exact executions are unavailable for this historical trade summary.</Typography> : <Stack divider={<Divider flexItem />}>{details.executions.map((execution, index) => <Stack direction="row" key={`${execution.executedAtUtc}-${execution.side}-${execution.quantityDecimal}-${index}`} sx={{ justifyContent: "space-between", p: 1.5 }}><Box><Typography sx={{ fontWeight: 800 }} variant="body2">{execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantityDecimal)} shares</Typography><Typography color="text.secondary" variant="caption">{dateTime(execution.executedAtUtc, details.timezone).date} · {dateTime(execution.executedAtUtc, details.timezone).time}</Typography></Box><Typography sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 800 }} variant="body2">{formatJournalAnalyticsMoney(execution.priceDecimal, performance?.tradeCurrency ?? null)}</Typography></Stack>)}</Stack>}</AccordionDetails>
          </Accordion>
        </Stack> : null}
      </Box> : analyzer && roundTripId ? <WorkspaceTradeAnalyzerPanel currency={analyzer.currency} direction={analyzer.direction} executionCount={analyzer.executionCount} gainLossDecimal={analyzer.gainLossDecimal} onClose={() => setTab("details")} open roundTripId={roundTripId} symbol={analyzer.symbol} timezone={analyzer.timezone} /> : <Box sx={{ p: 2 }}><Alert severity="info">Analyzer is unavailable for this trade.</Alert></Box>}
    </Stack>
  </Drawer>;
}
