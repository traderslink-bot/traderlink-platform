"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import GpsFixedRounded from "@mui/icons-material/GpsFixedRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import NavigateBeforeRounded from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRounded from "@mui/icons-material/NavigateNextRounded";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, GlobalStyles, IconButton, MenuItem, Paper, Portal, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { chartJournalAccountHeader, chartJournalNoteLimit, type ChartJournalFill, type ChartJournalItem, type ChartJournalOverlay, type ChartJournalPlan, type ChartJournalSelection, type ChartJournalTrade } from "@/src/modules/journal/contracts/journal-chart-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type { ManualTradeSubmitResult } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import type { TradeExplorerReviewTarget } from "../analytics/trade-explorer/trade-review-model";
import { AddTradePanel, type ChartExecutionDraft } from "../workspace/workspace-add-trade-panel";
import { drawingStoragePrefix, readDrawings, serverDrawings, subscribeDrawings } from "./chart-drawings";
import { chartJournalDayAt, chartJournalLocalTime, matchingChartPlan, type ChartJournalFocus } from "./chart-journal-model";
import { chartJournalOpeningEvent, type JournalChartEvent } from "./chart-journal-bridge";
import type { useChartJournalDisplay } from "./chart-journal-display";
import { notifyChartJournalUpdate, useChartJournalPlot } from "./chart-journal-plot";
import { useChartJournalSession } from "./chart-journal-session";

const ReviewEditor = lazy(() => import("../analytics/trade-explorer/trade-review-editor").then((m) => ({ default: m.TradeExplorerReviewEditor })));
const TradeAnalyzer = lazy(() => import("../workspace/workspace-trade-analyzer-panel").then(m => ({ default: m.WorkspaceTradeAnalyzerPanel })));
const TradeEditor = lazy(() => import("../workspace/workspace-atomic-trade-edit-drawer").then((m) => ({ default: m.WorkspaceAtomicTradeEditDrawer })));

const tabItems = [
  ["execution", "Log"], ["fills", "Fills"], ["notes", "Notes"], ["plans", "Plan"], ["review", "Review"],
] as const;
type Section = (typeof tabItems)[number][0];
const emptyFills: readonly ChartJournalFill[] = [];
const emptyItems: readonly ChartJournalItem[] = [];
const seconds = (iso: string) => Date.parse(iso) / 1000;
const sessionTime = (iso: string) => chartJournalLocalTime(seconds(iso), "America/New_York").time;

function reviewTarget(trade: ChartJournalTrade, timezone: string): TradeExplorerReviewTarget {
  return {
    roundTripId: trade.roundTripId, displayedSymbol: trade.symbol, direction: trade.direction, closedAtUtc: trade.closedAt,
    closeLocalDate: trade.closedAt ? chartJournalLocalTime(seconds(trade.closedAt), timezone).date : null,
  };
}

function tradeLabel(trade: ChartJournalTrade) {
  return `${trade.symbol} · ${trade.direction === "long" ? "Long" : "Short"} · ${sessionTime(trade.openedAt)} ET`;
}

function FillList({ fills, onChoose, selected, describe = false }: {
  fills: readonly ChartJournalFill[]; onChoose?: (fill: ChartJournalFill) => void; selected?: string; describe?: boolean;
}) {
  return <Stack component="ul" spacing={0.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
    {fills.map((fill) => <Box component="li" key={fill.id}>
      {onChoose ? <Button fullWidth color="inherit" variant={selected === fill.id ? "outlined" : "text"} onClick={() => onChoose(fill)}
        sx={{ justifyContent: "flex-start", textTransform: "none", px: 0.75 }}>
        <FillLine fill={fill} describe={describe} />
      </Button> : <FillLine fill={fill} describe={describe} />}
    </Box>)}
  </Stack>;
}

function FillLine({ fill, describe }: { fill: ChartJournalFill; describe: boolean }) {
  return <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "baseline", fontVariantNumeric: "tabular-nums" }}>
    <Typography variant="body2" sx={{ color: fill.side === "buy" ? "success.main" : "error.main", fontWeight: 700 }}>
      {fill.side === "buy" ? "Buy" : "Sell"} {fill.quantity}
    </Typography>
    <Typography variant="body2">{fill.price ? `${fill.price} ${fill.currency}` : "Price unavailable"}</Typography>
    <Typography variant={describe ? "body2" : "caption"} color="text.secondary">{sessionTime(fill.executedAt)} ET</Typography>
  </Stack>;
}

type NoteDraft = {
  id: string; symbol: string; at: string; text: string; roundTripId: string | null; revision: number | null;
};

export default function ChartJournalPanel({
  accountRef, symbol, drawingOwner, open, onClose, onOpen, onReview, focusStatus, register, setOverlay, panelId, display, portalContainer, tradeContextActive, allowAnalyzer,
}: {
  accountRef: string; symbol: string; drawingOwner?: string; open: boolean;
  onClose: () => void; onOpen: () => void; onReview: (request: ChartJournalFocus) => void; focusStatus: string;
  register: (listener: ((event: JournalChartEvent) => boolean) | null) => void;
  setOverlay: (symbol: string, overlay: readonly ChartJournalOverlay[]) => void;
  panelId: string;
  display: ReturnType<typeof useChartJournalDisplay>;
  portalContainer: () => HTMLElement | null;
  tradeContextActive: boolean;
  allowAnalyzer: boolean;
}) {
  const [section, setSection] = useState<Section>("execution");
  const { showFills, showNotes } = display;
  const [initialDay] = useState(() => chartJournalDayAt(Date.now() / 1000));
  const day = display.day ?? initialDay;
  const setDay = (value: string) => display.change({ day: value });
  const resource = useChartJournalSession(accountRef, symbol, day, open);
  const plot = useChartJournalPlot(accountRef, symbol, day,
    !display.active ? null : showFills && !tradeContextActive ? showNotes ? "both" : "fills" : showNotes ? "notes" : null);
  const { session } = resource;
  const [pick, setPick] = useState<"execution" | "notes" | null>(null);
  const [selection, setSelection] = useState<{ symbol: string; candle: ChartJournalSelection }>();
  const candle = selection?.symbol === symbol ? selection.candle : null;
  const [entryDraft, setEntry] = useState<{ key: number; symbol: string; candle: ChartJournalSelection | null; position?: ChartJournalTrade; side?: "buy" | "sell" }>();
  const [entrySaving, setEntrySaving] = useState(false);
  const entry = entryDraft?.symbol === symbol ? entryDraft : undefined;
  const [openPositionId, setOpenPositionId] = useState("");
  const [fillId, setFillId] = useState("");
  const [markerFills, setMarkerFills] = useState<readonly string[] | null>(null);
  const [noteDraft, setNote] = useState<NoteDraft | null>(null);
  const note = noteDraft?.symbol === symbol ? noteDraft : null;
  const [planTradeId, setPlanTradeId] = useState("");
  const [drawingId, setDrawingId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [editingTrade, setEditingTrade] = useState<ChartJournalTrade>();
  const [analyzerTrade, setAnalyzerTrade] = useState<ChartJournalTrade>();
  const [reviewDirty, setReviewDirty] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const restoreFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const tradeActionTrigger = useRef<HTMLButtonElement>(null);
  const pendingPlanId = useRef<string | undefined>(undefined);
  const dayReviewKey = useRef<string | undefined>(undefined);

  const drawingKey = `${drawingStoragePrefix}${drawingOwner ?? "local"}:${symbol}`;
  const drawings = useSyncExternalStore(subscribeDrawings, () => readDrawings(drawingKey), serverDrawings);
  const plans = drawings.filter((item) => (item.tool === "longPosition" || item.tool === "shortPosition") && item.anchors.length === 3);
  const fills = session?.fills ?? emptyFills;
  const items = session?.items ?? emptyItems;
  const allTrades = useMemo(() => [...new Map([...(session?.trades ?? []), ...(session?.openPositions ?? [])]
    .map((trade) => [trade.id, trade])).values()], [session]);
  const tickerTrades = allTrades.filter((trade) => trade.symbol === symbol);
  const tickerPositions = session?.openPositions.filter((trade) => trade.symbol === symbol) ?? [];
  const chosenPosition = tickerPositions.find((position) => position.roundTripId === openPositionId);
  const selectedFill = fills.find((fill) => fill.id === fillId && fill.symbol === symbol);
  const fillTrades = selectedFill ? allTrades.filter((trade) => selectedFill.tradeIds.includes(trade.id)) : [];
  const planTrade = tickerTrades.find((trade) => trade.id === planTradeId);
  const currentPlan = matchingChartPlan(items, planTrade);
  const selectedDrawing = plans.find((drawing) => drawing.id === drawingId && planTrade?.direction === (drawing.tool === "longPosition" ? "long" : "short"));
  const reviewTrades = session?.trades ?? [];
  const reviewIndex = reviewTrades.findIndex((trade) => trade.id === reviewId);
  const reviewTrade = reviewTrades[reviewIndex];
  const displayFills = fills.filter((fill) => fill.symbol === symbol && (!markerFills || markerFills.includes(fill.id)));
  const noteRows = items.filter((item) => item.kind === "note" && item.symbol === symbol);
  const savedNote = noteRows.find((item) => item.id === note?.id);
  const noteDirty = Boolean(note?.text.trim() && (!savedNote || note.text.trim() !== savedNote.text || note.roundTripId !== savedNote.roundTripId));
  const hasDraft = reviewDirty || noteDirty || Boolean(entryDraft);
  useEffect(() => {
    if (!open) return;
    const leave = (event: Event) => {
      if ((event as CustomEvent).detail === panelId) return;
      if (hasDraft || busy || reviewSaving || entrySaving) {
        event.preventDefault();
        setNotice({ text: "Finish this Journal draft before opening another chart’s Journal.", error: true });
      } else {
        onClose();
      }
    };
    window.addEventListener(chartJournalOpeningEvent, leave);
    return () => window.removeEventListener(chartJournalOpeningEvent, leave);
  }, [busy, entrySaving, hasDraft, onClose, open, panelId, reviewSaving]);

  useEffect(() => {
    const executions = tradeContextActive ? [] : showFills ? plot?.fills ?? fills.filter(fill => fill.symbol === symbol)
      : (open && section === "review" && reviewId) ? fills.filter(fill => fill.symbol === symbol && fill.tradeIds.includes(reviewId)) : [];
    const chartNotes = showNotes ? plot?.notes ?? items.filter(item => item.kind === "note" && item.symbol === symbol && item.day === day) : [];
    setOverlay(symbol, [
      ...executions.map((fill) => ({ id: fill.id, time: seconds(fill.executedAt), kind: fill.side })),
      ...chartNotes.map((item) => ({ id: item.id, time: seconds(item.at), kind: "note" as const })),
    ]);
    return () => setOverlay(symbol, []);
  }, [day, fills, items, open, plot, reviewId, section, setOverlay, showFills, showNotes, symbol, tradeContextActive]);

  const close = useCallback(() => {
    setPick(null);
    setAnalyzerTrade(undefined);
    onClose();
    restoreFocus.current?.focus({ preventScroll: true });
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    if (document.activeElement instanceof HTMLElement && document.activeElement.getAttribute("aria-controls") === panelId) {
      restoreFocus.current = document.activeElement;
    }
    closeButton.current?.focus({ preventScroll: true });
  }, [open, panelId]);

  function restoreTradeAction() {
    const trigger = tradeActionTrigger.current;
    tradeActionTrigger.current = null;
    requestAnimationFrame(() => {
      (trigger?.isConnected ? trigger : closeButton.current)?.focus({ preventScroll: true });
    });
  }

  const [confirm, setConfirm] = useState<{ run: () => void }>();
  function navigate(run: () => void) {
    if (busy || reviewSaving || entrySaving) return;
    if (reviewDirty) setConfirm({ run });
    else run();
  }

  function closeRequested() {
    if (busy || reviewSaving || entrySaving) return;
    if (hasDraft) setConfirm({ run: () => { setEntry(undefined); setNote(null); close(); } });
    else close();
  }

  function changeNote(run: () => void) {
    if (busy) return;
    if (noteDirty) setConfirm({ run });
    else run();
  }

  function loadNote(item: ChartJournalItem) {
    setNote({ id: item.id, symbol: item.symbol, at: item.at, text: item.text, roundTripId: item.roundTripId, revision: item.revision });
  }

  useEffect(() => {
    register((event) => {
      if (event.kind === "marker") {
        if (reviewDirty || reviewSaving || noteDirty || busy || entrySaving) return true;
        if (event.type === "note") {
          const item = (plot?.notes ?? items).find((value) => event.ids.includes(value.id));
          if (item) loadNote(item);
          setSection("notes");
        } else {
          setMarkerFills(event.ids);
          setFillId(event.ids[0] ?? "");
          setSection("fills");
        }
        onOpen();
        return true;
      }
      if (!open) return false;
      setSelection({ symbol, candle: event.candle });
      if (pick === "execution") setEntry((old) => ({ ...(old?.symbol === symbol ? old : {}), key: (old?.key ?? 0) + 1, symbol, candle: event.candle }));
      if (pick === "notes") setNote((old) => old?.symbol === symbol && old.revision !== null ? old : {
        id: old?.symbol === symbol ? old.id : crypto.randomUUID(), symbol,
        at: new Date(event.candle.time * 1000).toISOString(), text: old?.symbol === symbol ? old.text : "",
        roundTripId: old?.symbol === symbol ? old.roundTripId : null, revision: null,
      });
      if (pick) {
        setPick(null);
        requestAnimationFrame(() => closeButton.current?.focus());
        return true;
      }
      return false;
    });
    return () => register(null);
  }, [busy, entrySaving, items, noteDirty, open, onOpen, pick, plot, register, reviewDirty, reviewSaving, symbol]);

  async function saveItem(input: Record<string, unknown>) {
    setBusy(true);
    setNotice(undefined);
    try {
      const response = await fetch("/api/platform/journal/chart", {
        method: "PUT", headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1", [chartJournalAccountHeader]: accountRef },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw Error(response.status === 409 ?
        "The Journal account or this entry changed. Refresh Journal before trying again." : "This Journal entry could not be saved.");
      const { item } = await response.json() as { item: ChartJournalItem };
      resource.reload();
      notifyChartJournalUpdate(accountRef);
      return item;
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "This Journal entry could not be saved.", error: true });
      return null;
    } finally { setBusy(false); }
  }

  async function saveNote() {
    if (!note) return;
    const item = await saveItem({
      ...note, symbol, kind: "note", expectedRevision: note.revision,
    });
    if (item) {
      setNote(null);
      display.change({ active: true, day: item.day });
      setNotice({ text: item.roundTripId ? "Note saved and attached." : "Chart note saved." });
    }
  }

  async function attachPlan(confirmedAt: number) {
    if (!planTrade || !selectedDrawing) return;
    const [entryAnchor, targetAnchor, stopAnchor] = selectedDrawing.anchors;
    const stringifyPrice = (value: number) => value.toFixed(12).replace(/0+$/u, "").replace(/\.$/u, "");
    const plan: ChartJournalPlan = {
      direction: planTrade.direction, drawingId: selectedDrawing.id,
      entry: stringifyPrice(entryAnchor.price), stop: stringifyPrice(stopAnchor.price), target: stringifyPrice(targetAnchor.price),
      priceBasisDate: chartJournalDayAt(confirmedAt / 1000),
    };
    const id = currentPlan?.id ?? pendingPlanId.current ?? crypto.randomUUID();
    pendingPlanId.current = id;
    const item = await saveItem({
      id, symbol, kind: "plan",
      at: currentPlan?.at ?? new Date(Math.min(entryAnchor.time * 1000, confirmedAt)).toISOString(),
      text: "", roundTripId: currentPlan?.roundTripId ?? planTrade.roundTripId,
      expectedRevision: currentPlan?.revision ?? null, plan,
    });
    if (item) { pendingPlanId.current = undefined; setNotice({ text: "Plan attached to trade." }); }
  }

  async function saveDayReview() {
    if (!session) return;
    setBusy(true);
    setNotice(undefined);
    try {
      const idempotencyKey = dayReviewKey.current ?? crypto.randomUUID();
      dayReviewKey.current = idempotencyKey;
      const response = await fetch(`/api/platform/journal/trading-days/${encodeURIComponent(day)}/review`, {
        method: "PUT", headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({
          status: session.dayReview?.status === "reviewed" ? "incomplete" : "reviewed",
          expectedRevision: session.dayReview?.revision ?? null, expectedAccountSelectionRef: accountRef, idempotencyKey,
        }),
      });
      if (!response.ok) throw Error("The day review could not be saved. Refresh Journal and try again.");
      dayReviewKey.current = undefined;
      resource.reload();
      setNotice({ text: session.dayReview?.status === "reviewed" ? "Day review reopened." : "Day marked reviewed." });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "The review could not be saved.", error: true });
    } finally { setBusy(false); }
  }

  async function savedExecution(result: ManualTradeSubmitResult | null) {
    setEntry(undefined);
    setNotice({ text: result ? `${result.acceptedExecutionCount} execution${result.acceptedExecutionCount === 1 ? "" : "s"} saved.` : "Execution queued for sync." });
    if (result) {
      display.change({ showFills: !display.active || showFills, active: true, day: result.affectedDates[0] ?? day });
      notifyChartJournalUpdate(accountRef);
      setMarkerFills(null);
      setSection("fills");
      resource.reload();
    }
  }

  function chooseReview(trade: ChartJournalTrade) {
    navigate(() => {
      setReviewId(trade.id);
      const times = fills.filter((fill) => fill.tradeIds.includes(trade.id)).map((fill) => seconds(fill.executedAt));
      const from = times.length ? Math.min(...times) : seconds(trade.openedAt);
      const to = times.length ? Math.max(...times) : trade.closedAt ? seconds(trade.closedAt) : from;
      onReview({ symbol: trade.symbol, from, to });
    });
  }

  function changeSection(value: Section) {
    navigate(() => { setSection(value); setPick(null); setNotice(undefined); });
  }

  const openEntry = (position?: ChartJournalTrade, reduce = false) => {
    const side = position ? ((position.direction === "long") !== reduce ? "buy" : "sell") : undefined;
    setEntry((old) => ({ key: (old?.key ?? 0) + 1, symbol, candle, position, side }));
  };
  const draft = entry && session ? {
    ...(entry.candle ? chartJournalLocalTime(entry.candle.time, session.accountTimezone) : { date: day, time: "" }),
    side: entry.side, positionRef: entry.position?.positionRef ?? undefined,
  } satisfies ChartExecutionDraft : undefined;

  if (!open) return null;

  return <Portal container={portalContainer}>
    {!pick && <GlobalStyles styles={{
      "@media (min-width: 900px) and (min-height: 601px), (min-width: 1201px)": {
        "[data-main-chart-workspace], [data-journal-workspace-chart], [data-journal-chart-drawer='chart-only'] [data-workspace-charts], [data-journal-chart-drawer='trade-context'] [data-trade-market-content]": { width: "calc(100% - 392px) !important" },
      },
    }} />}
    <Paper id={panelId} role="dialog" aria-modal={false} aria-label="Chart Journal" elevation={10}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented) return;
        event.stopPropagation();
        if (pick) setPick(null); else closeRequested();
      }}
      sx={{
        position: "fixed", zIndex: (theme) => theme.zIndex.modal, display: "flex", flexDirection: "column",
        visibility: analyzerTrade || editingTrade ? "hidden" : "visible",
        overflow: "hidden", border: 1, borderColor: "divider", borderRadius: 0,
        right: 0, top: { xs: "auto", md: 52 }, bottom: 0, left: { xs: 0, md: "auto" },
        width: { xs: "100%", md: 392 }, maxHeight: { xs: pick ? 50 : "55dvh", md: pick ? 50 : "calc(100dvh - 52px)" },
        "@media (orientation: landscape) and (max-height: 600px) and (max-width: 1200px)": {
          left: 0, top: "auto", width: "100%", maxHeight: pick ? 50 : "58dvh",
        },
        pb: "env(safe-area-inset-bottom, 0px)",
      }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 1, minHeight: 44, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>{pick ? "Tap a candle" : `Journal · ${symbol}`}</Typography>
          {!pick && session && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{session.accountName}</Typography>}
        </Box>
        {pick ? <Button size="small" onClick={() => setPick(null)}>Cancel</Button> : <>
          <Tooltip title="Refresh Journal"><IconButton aria-label="Refresh Journal" onClick={resource.reload} disabled={resource.loading || busy} size="small"><RefreshRounded fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Close Journal"><IconButton ref={closeButton} aria-label="Close Journal" onClick={closeRequested} disabled={busy || reviewSaving || entrySaving} size="small"><CloseRounded /></IconButton></Tooltip>
        </>}
      </Stack>
      <Box sx={{ display: pick ? "none" : "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
        <Tabs value={section} onChange={(_, value: Section) => changeSection(value)} variant="fullWidth" aria-label="Journal views"
          sx={{ minHeight: 36, flexShrink: 0, "& .MuiTab-root": { minHeight: 36, minWidth: 0, p: 0.5, textTransform: "none" } }}>
          {tabItems.map(([value, label]) => <Tab key={value} value={value} label={label} />)}
        </Tabs>
        <Stack spacing={1} sx={{ overflowY: "auto", minHeight: 0, p: 1.25 }}>
          {section !== "execution" && <TextField label="Session date (ET)" size="small" type="date" value={day}
            onChange={(event) => {
              const next = event.target.value;
              if (next) navigate(() => { setDay(next); setReviewId(""); setMarkerFills(null); setFillId(""); setNotice(undefined); dayReviewKey.current = undefined; });
            }} slotProps={{ inputLabel: { shrink: true } }} sx={{ alignSelf: "flex-start", width: 166 }} />}
          {notice && <Alert role={notice.error ? "alert" : "status"} severity={notice.error ? "error" : "success"} onClose={() => setNotice(undefined)}>{notice.text}</Alert>}
          {resource.error && <Alert severity="error" action={<Button size="small" onClick={resource.reload}>Retry</Button>}>{resource.error}</Alert>}
          {!session && resource.loading && <Stack direction="row" spacing={1} sx={{ alignItems: "center" }} role="status"><CircularProgress size={16} /><Typography variant="body2">Loading Journal…</Typography></Stack>}
          {session && <>
            {section === "execution" && !entry && <>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button variant="contained" size="small" onClick={() => openEntry()}>Log execution</Button>
                <Button variant="outlined" size="small" startIcon={<GpsFixedRounded />} onClick={() => setPick("execution")}>Pick candle</Button>
              </Stack>
              {candle && <Typography variant="caption" color="text.secondary">
                Selected {chartJournalDayAt(candle.time)} {sessionTime(new Date(candle.time * 1000).toISOString())} ET{candle.estimated ? " · carried candle" : ""}
              </Typography>}
              {tickerPositions.length > 0 && <>
                <TextField label="Open trade" size="small" select value={chosenPosition?.roundTripId ?? ""}
                  onChange={(event) => setOpenPositionId(event.target.value)} sx={{ width: 230, maxWidth: "100%" }}>
                  <MenuItem value="">Choose a trade</MenuItem>
                  {tickerPositions.map((trade) => <MenuItem key={trade.roundTripId} value={trade.roundTripId}>
                    {tradeLabel(trade)} ({trade.shareBalance} shares)
                  </MenuItem>)}
                </TextField>
                {chosenPosition && <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={() => openEntry(chosenPosition)}>Add shares</Button>
                  <Button variant="outlined" size="small" onClick={() => openEntry(chosenPosition, true)}>Reduce or exit</Button>
                </Stack>}
              </>}
            </>}
            <Box sx={{ display: section === "execution" && entry ? "block" : "none" }}>
              {entry && draft && <AddTradePanel key={`${symbol}:${entry.key}`} embedded
                accountCurrency={entry.position?.currency ?? session.accountCurrency} accountTimezone={session.accountTimezone} chartDraft={draft}
                expectedAccountSelectionRef={accountRef} fixedSymbol={symbol} initialWorkspaceStyle={entry.position?.style}
                offlineScopeRef={session.offlineScopeRef} onClose={() => setEntry(undefined)} onSaved={savedExecution} onWorkingChange={setEntrySaving} />}
            </Box>
            {section === "fills" && <>
              {!tradeContextActive && <FormControlLabel control={<Checkbox size="small" checked={showFills} onChange={(_, value) => display.change({ showFills: value, active: true })} />} label="Show My fills on chart" />}
              {markerFills && <Button size="small" variant="outlined" sx={{ alignSelf: "flex-start" }} onClick={() => setMarkerFills(null)}>Show all fills</Button>}
              <FillList fills={displayFills} selected={fillId} onChoose={(fill) => setFillId(fill.id)} />
              {!displayFills.length && <Typography color="text.secondary" variant="body2">No saved {symbol} fills for this session.</Typography>}
              {selectedFill && <Stack spacing={0.75} sx={{ p: 1, border: 1, borderColor: "divider" }}>
                <FillLine fill={selectedFill} describe />
                {fillTrades.map((trade) => <Stack key={trade.id} spacing={0.5}>
                  <Typography variant="caption">{tradeLabel(trade)}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {allowAnalyzer && trade.closedAt && <Button variant="outlined" size="small" onClick={event => { tradeActionTrigger.current = event.currentTarget; setAnalyzerTrade(trade); }}>Open Trade Analyzer</Button>}
                    <Button variant="outlined" size="small" onClick={event => { tradeActionTrigger.current = event.currentTarget; setEditingTrade(trade); }}>Edit trade</Button>
                    <Button variant="outlined" size="small" onClick={() => { setSection("review"); chooseReview(trade); }}>Trade review</Button>
                    <Button size="small" onClick={() => changeNote(() => {
                      setNote({ id: crypto.randomUUID(), symbol, at: selectedFill.executedAt, text: "", roundTripId: trade.roundTripId, revision: null });
                      setSection("notes");
                    })}>Add note</Button>
                  </Stack>
                </Stack>)}
              </Stack>}
            </>}
            {section === "notes" && <>
              <FormControlLabel control={<Checkbox size="small" checked={showNotes} onChange={(_, value) => display.change({ showNotes: value, active: true })} />} label="Show note pins on chart" />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button variant="outlined" size="small" onClick={() => changeNote(() => setNote({
                  id: crypto.randomUUID(), symbol, at: new Date(candle ? candle.time * 1000 : Date.now()).toISOString(),
                  text: "", roundTripId: null, revision: null,
                }))}>New note</Button>
                <Button variant="outlined" size="small" startIcon={<GpsFixedRounded />} onClick={() => setPick("notes")}>Pick candle</Button>
              </Stack>
              {note && <>
                <Typography color="text.secondary" variant="caption">{chartJournalDayAt(seconds(note.at))} · {sessionTime(note.at)} ET</Typography>
                <TextField label="Chart note" multiline minRows={2} maxRows={5} size="small" value={note.text}
                  onChange={(event) => setNote({ ...note, text: event.target.value })}
                  slotProps={{ htmlInput: { maxLength: chartJournalNoteLimit } }} />
                <TextField label="Attach to" size="small" select sx={{ maxWidth: 290 }} value={note.roundTripId ?? ""}
                  onChange={(event) => setNote({ ...note, roundTripId: event.target.value || null })}>
                  <MenuItem value="">Standalone note</MenuItem>
                  {note.roundTripId && !tickerTrades.some((trade) => trade.memberIds.includes(note.roundTripId!)) &&
                    <MenuItem value={note.roundTripId}>Currently attached trade</MenuItem>}
                  {tickerTrades.map((trade) => <MenuItem key={trade.id} value={trade.memberIds.includes(note.roundTripId ?? "") ? note.roundTripId! : trade.roundTripId}>{tradeLabel(trade)}</MenuItem>)}
                </TextField>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  <Button size="small" disabled={busy} onClick={() => setNote(null)}>Cancel</Button>
                  <Button size="small" variant="contained" disabled={busy || !note.text.trim()} onClick={() => void saveNote()}>Save note</Button>
                </Stack>
              </>}
              {noteRows.map((item) => <Button color="inherit" key={item.id} variant={item.id === note?.id ? "outlined" : "text"} onClick={() => { if (item.id !== note?.id) changeNote(() => loadNote(item)); }}
                sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography variant="caption" color="text.secondary">{sessionTime(item.at)} ET · {item.roundTripId ? "Attached to trade" : "Standalone"}</Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{item.text}</Typography>
              </Button>)}
            </>}
            {section === "plans" && <>
              <TextField label="Trade" size="small" select value={planTrade?.id ?? ""} sx={{ maxWidth: 280 }}
                onChange={(event) => { setPlanTradeId(event.target.value); setDrawingId(""); pendingPlanId.current = undefined; }}>
                <MenuItem value="">Choose a trade</MenuItem>
                {tickerTrades.map((trade) => <MenuItem key={trade.id} value={trade.id}>{tradeLabel(trade)}</MenuItem>)}
              </TextField>
              {planTrade && <>
                <TextField label="Position drawing" select size="small" value={selectedDrawing?.id ?? ""} sx={{ maxWidth: 280 }}
                  onChange={(event) => setDrawingId(event.target.value)}>
                  <MenuItem value="">Choose a drawing</MenuItem>
                  {plans.filter((drawing) => planTrade.direction === (drawing.tool === "longPosition" ? "long" : "short"))
                    .map((drawing) => <MenuItem key={drawing.id} value={drawing.id}>
                      {drawing.tool === "longPosition" ? "Long" : "Short"} · {drawing.anchors[0].price.toFixed(4)} · {chartJournalDayAt(drawing.anchors[0].time)}
                    </MenuItem>)}
                </TextField>
                {!plans.length && <Typography variant="body2" color="text.secondary">Draw a Long Position or Short Position on the chart to attach a plan.</Typography>}
                {selectedDrawing && <Typography variant="body2">Entry {selectedDrawing.anchors[0].price.toFixed(4)} · Stop {selectedDrawing.anchors[2].price.toFixed(4)} · Target {selectedDrawing.anchors[1].price.toFixed(4)}</Typography>}
                <Button size="small" variant="outlined" disabled={!selectedDrawing || busy} onClick={() => void attachPlan(Date.now())} sx={{ alignSelf: "flex-start" }}>
                  {currentPlan ? "Replace plan" : "Attach plan"}
                </Button>
                {currentPlan?.plan && <Stack spacing={0.5} sx={{ border: 1, borderColor: "divider", p: 1 }}>
                  <Typography variant="subtitle2">Attached plan</Typography>
                  <Typography variant="body2">Entry {currentPlan.plan.entry} · Stop {currentPlan.plan.stop} · Target {currentPlan.plan.target}</Typography>
                  <Typography variant="caption" color="text.secondary">Chart price basis {currentPlan.plan.priceBasisDate}</Typography>
                  <Typography variant="subtitle2">Actual fills · {day}</Typography>
                  <FillList fills={fills.filter((fill) => fill.tradeIds.includes(planTrade.id))} />
                  {!fills.some((fill) => fill.tradeIds.includes(planTrade.id)) && <Typography variant="caption">No fills for this trade on this date.</Typography>}
                </Stack>}
              </>}
            </>}
            {section === "review" && <>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <IconButton aria-label="Previous trade" disabled={reviewIndex <= 0 || reviewSaving} onClick={() => chooseReview(reviewTrades[reviewIndex - 1])}><NavigateBeforeRounded /></IconButton>
                <TextField label="Trade to review" select size="small" fullWidth value={reviewTrade?.id ?? ""} disabled={reviewSaving}
                  onChange={(event) => { const trade = reviewTrades.find((value) => value.id === event.target.value); if (trade) chooseReview(trade); }}>
                  <MenuItem value="">Choose a trade</MenuItem>
                  {reviewTrades.map((trade) => <MenuItem key={trade.id} value={trade.id}>{tradeLabel(trade)}</MenuItem>)}
                </TextField>
                <IconButton aria-label="Next trade" disabled={reviewIndex + 1 >= reviewTrades.length || reviewSaving}
                  onClick={() => chooseReview(reviewTrades[reviewIndex + 1])}><NavigateNextRounded /></IconButton>
              </Stack>
              {!reviewTrades.length && <Typography variant="body2" color="text.secondary">No reviewable trades for this session.</Typography>}
              {focusStatus && <Typography variant="caption" role="status" color="text.secondary">{focusStatus}</Typography>}
              {reviewTrade && <Suspense fallback={<CircularProgress size={18} />}>
                <ReviewEditor embedded open selectedRoundTripId={reviewTrade.roundTripId}
                  expectedAccountSelectionRef={accountRef} trades={[reviewTarget(reviewTrade, session.accountTimezone)]}
                  showTradeNavigation={false} onSelectTrade={() => {}} onClose={() => navigate(() => setReviewId(""))}
                  onDirtyChange={setReviewDirty} onSavingChange={setReviewSaving} />
              </Suspense>}
              <Button size="small" variant="outlined" onClick={() => void saveDayReview()} disabled={busy || reviewSaving || reviewDirty || !reviewTrades.length} sx={{ alignSelf: "flex-start" }}>
                {session.dayReview?.status === "reviewed" ? "Reopen day review" : "Mark day reviewed"}
              </Button>
            </>}
            {(section === "fills" || section === "notes" || section === "plans" || section === "review") &&
              (session.moreFills || session.moreNotes) && <Button size="small" variant="outlined" disabled={resource.loading}
                onClick={() => resource.error ? resource.reload() : resource.loadMore()} sx={{ alignSelf: "flex-start" }}>Load more</Button>}
          </>}
        </Stack>
      </Box>
      {analyzerTrade && session && <Suspense fallback={null}>
        <TradeAnalyzer currency={analyzerTrade.currency} direction={analyzerTrade.direction}
          expectedAccountSelectionRef={accountRef} gainLossDecimal={null}
          highlightExecution={selectedFill ? { id: selectedFill.id, at: selectedFill.executedAt } : undefined} onClose={() => { setAnalyzerTrade(undefined); restoreTradeAction(); }} open
          roundTripId={analyzerTrade.roundTripId} symbol={analyzerTrade.symbol} timezone={session.accountTimezone} />
      </Suspense>}
      {editingTrade && session && <Suspense fallback={null}>
        <TradeEditor open roundTripId={editingTrade.roundTripId} expectedAccountSelectionRef={accountRef}
          journalTarget={reviewTarget(editingTrade, session.accountTimezone)} startingTab="trade"
          onClose={() => { setEditingTrade(undefined); restoreTradeAction(); }} onSaved={() => { resource.reload(); notifyChartJournalUpdate(accountRef); }} />
      </Suspense>}
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(undefined)}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>Your unsaved Journal changes will be lost.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(undefined)}>Keep editing</Button>
          <Button color="error" onClick={() => { const next = confirm; setConfirm(undefined); setReviewDirty(false); next?.run(); }}>Discard</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  </Portal>;
}
