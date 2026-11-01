"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readWatchlistConsoleRequest, sendWatchlistConsoleRequest, watchlistMutationDescription, type WatchlistConsoleRequest } from "@/src/lib/live-watchlist/watchlist-console-bridge";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import dynamic from "next/dynamic";
import type { LiveWatchlistCardContent } from "@/src/lib/live-watchlist/live-watchlist-types";
import { readAnalysisReviewPreview } from "@/src/lib/live-watchlist/analysis-review-preview";
import { readInlineAnalysisMessage } from "@/src/lib/live-watchlist/analysis-inline-edit";
import { WatchlistAnalysisEditor } from "./watchlist-analysis-editor";

const AnalysisPreviewCard = dynamic(() => import("@/app/watchlist/live-watchlist-client").then((module) => module.TradersLinkAiReadCard));
const DeferredAdminPanel = dynamic(() => import("./watchlist-deferred-admin-panel").then(module => module.WatchlistDeferredAdminPanel), { loading: () => <p role="status">Loading section…</p> });
const IndicatorAuditPanel = dynamic(() => import("./watchlist-indicator-audit-panel"));
const SetupAdminPanel = dynamic(() => import("./watchlist-setup-admin-panel"));
const GainStartingPoint = dynamic(() => import("./watchlist-gain-starting-point").then(m => m.WatchlistGainStartingPoint));
const PotentialGainPost = dynamic(() => import("./watchlist-potential-gain-post").then(module => module.WatchlistPotentialGainPost));
const ManualLossPost = dynamic(() => import("./watchlist-manual-loss-post").then(module => module.WatchlistManualLossPost));
const PreviousAnalyses = dynamic(() => import("./watchlist-analysis-history").then(module => module.WatchlistAnalysisHistory));
const RUNTIME_SECTIONS = [
  ["watchlist", "Watchlist"], ["runtime", "Runtime"], ["market-data", "Market Data"],
  ["ai-controls", "AI Controls"], ["discord-notifications", "Discord notifications"], ["live-website-controls", "Live Website Controls"],
  ["automatic-low-float-selection", "Automatic Low-Float Selection"],
] as const;

const MINIMUM_FRAME_HEIGHT = 900;

export function WatchlistRuntimeAdminClient() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const relayControllers = useRef(new Map<string, AbortController>());
  const relayEpoch = useRef(0);
  const relayGeneration = useRef<string | null>(null);
  const pendingMutationRef = useRef<WatchlistConsoleRequest | null>(null);
  const [pendingMutation, setPendingMutation] = useState<WatchlistConsoleRequest | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const clearRelay = useCallback(() => {
    relayEpoch.current += 1;
    for (const controller of relayControllers.current.values()) controller.abort();
    relayControllers.current.clear(); pendingMutationRef.current = null;
    setPendingMutation(null); setMutationBusy(false);
  }, []);
  const relayReply = useCallback((id: string, result: object) => {
    frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-relay-response", id, ...result }, "*");
  }, []);
  const performRelay = useCallback(async (input: WatchlistConsoleRequest) => {
    if (relayControllers.current.size >= 12 || relayControllers.current.has(input.id)) { relayReply(input.id, { error: "The console is busy. Try again." }); return; }
    const epoch = relayEpoch.current;
    const controller = new AbortController(); relayControllers.current.set(input.id, controller);
    const timeout = setTimeout(() => controller.abort(), 180000);
    try {
      const result = await sendWatchlistConsoleRequest(input, controller.signal);
      if (epoch === relayEpoch.current) relayReply(input.id, result);
    } catch {
      if (epoch === relayEpoch.current) relayReply(input.id, { error: "The request could not be completed." });
    } finally {
      clearTimeout(timeout); relayControllers.current.delete(input.id);
      if (epoch === relayEpoch.current && pendingMutationRef.current?.id === input.id) {
        pendingMutationRef.current = null; setPendingMutation(null); setMutationBusy(false);
      }
    }
  }, [relayReply]);
  const cancelMutation = useCallback(() => {
    const input = pendingMutationRef.current;
    if (input) { relayControllers.current.get(input.id)?.abort(); relayReply(input.id, { error: "Change cancelled." }); }
    pendingMutationRef.current = null; setPendingMutation(null); setMutationBusy(false);
  }, [relayReply]);
  const [height, setHeight] = useState(MINIMUM_FRAME_HEIGHT);
  const [selectedSection, setSelectedSection] = useState<"runtime" | "usage" | "recaps" | "indicator-audit" | "setups">("runtime");
  const [runtimeSection, setRuntimeSection] = useState<string>("watchlist");
  const [usageOpened, setUsageOpened] = useState(false);
  const [recapsOpened, setRecapsOpened] = useState(false);
  const selectRecaps = useCallback(() => { setRecapsOpened(true); setSelectedSection("recaps"); }, []);
  const [auditOpened, setAuditOpened] = useState(false);
  const runtimeSectionRef = useRef(runtimeSection);
  const selectRuntimeSection = useCallback((section: string) => {
    if (!RUNTIME_SECTIONS.some(([id]) => id === section)) return;
    runtimeSectionRef.current = section; setRuntimeSection(section); setSelectedSection("runtime");
    frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-admin-wrapper", type: "select-section", section }, "*");
  }, []);
  const syncNavigation = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-admin-wrapper", type: "select-section", section: runtimeSectionRef.current }, "*");
  }, []);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [historyRequest, setHistoryRequest] = useState<{symbol:string;cycleId:string} | null>(null);
  const [gainPostSymbol, setGainPostSymbol] = useState<string | null>(null);
  const [lossPostSymbol, setLossPostSymbol] = useState<string | null>(null);
  const [gainStartSymbol, setGainStartSymbol] = useState<string | null>(null);
  const [analysisPreview, setAnalysisPreview] = useState<{
    card: LiveWatchlistCardContent; dipBuyPlanVisible: boolean;
  } | null>(null);

  const handleLoad = useCallback(() => {
    syncNavigation();
  }, [syncNavigation]);

  const selectUsage = useCallback(() => {
    setUsageOpened(true);
    setSelectedSection("usage");
    window.requestAnimationFrame(() => {
      document.getElementById("watchlist-usage")?.focus({ preventScroll: true });
      document.getElementById("watchlist-usage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const controllers = relayControllers.current;
    return () => { relayEpoch.current += 1; for (const controller of controllers.values()) controller.abort(); controllers.clear(); };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== "null" || event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const relay = event.data as { source?: unknown; type?: unknown; id?: unknown; generation?: unknown };
      if (relay.source === "traderslink-watchlist-relay") {
        if (relay.type === "initialize" && typeof relay.generation === "string" && /^[a-f0-9-]{36}$/u.test(relay.generation)) {
          clearRelay(); relayGeneration.current = relay.generation; return;
        }
        if (!relayGeneration.current || typeof relay.id !== "string" || !relay.id.startsWith(relayGeneration.current + "-")) return;
        if (relay.type === "cancel" && typeof relay.id === "string") {
          relayControllers.current.get(relay.id)?.abort();
          if (pendingMutationRef.current?.id === relay.id) cancelMutation();
          return;
        }
        const input = relay.type === "request" ? readWatchlistConsoleRequest(event.data, window.location.origin) : null;
        if (!input) { if (typeof relay.id === "string" && relay.id.length <= 80) relayReply(relay.id, { error: "This console request is not allowed." }); return; }
        if (input.method === "POST") {
          if (pendingMutationRef.current) { relayReply(input.id, { error: "Review the pending change first." }); return; }
          pendingMutationRef.current = input; setPendingMutation(input);
        } else void performRelay(input);
        return;
      }
      const message = event.data as { source?: unknown; type?: unknown; height?: unknown; card?: unknown; dipBuyPlanVisible?: unknown; symbol?: unknown; cycleId?:unknown };
      if (message.source !== "traderslink-watchlist-admin") return;
      if (message.type === "frame-height" && typeof message.height === "number" && Number.isFinite(message.height)) { setHeight(Math.min(20000, Math.max(MINIMUM_FRAME_HEIGHT, message.height))); return; }
      if (message.type === "navigation-ready") { syncNavigation(); return; }
      if (message.type === "previous-analyses" && typeof message.symbol === "string" && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(message.symbol) && typeof message.cycleId==="string" && message.cycleId.length>0 && message.cycleId.length<=200) { setHistoryRequest({symbol:message.symbol,cycleId:message.cycleId}); return; }
      if (message.type === "gain-starting-point" && typeof message.symbol === "string" && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(message.symbol)) { setGainStartSymbol(message.symbol); return; }
      if (message.type === "post-potential-gain" && typeof message.symbol === "string" && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(message.symbol)) { setGainPostSymbol(message.symbol); return; }
      if (message.type === "post-manual-loss" && typeof message.symbol === "string" && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(message.symbol)) { setLossPostSymbol(message.symbol); return; }
      if (message.type === "open-usage") { selectUsage(); return; }
      if (message.type === "open-recaps") { selectRecaps(); return; }
      if (message.type === "open-indicator-audit") { setAuditOpened(true); setSelectedSection("indicator-audit"); return; }
      const symbol = readInlineAnalysisMessage(message);
      if (symbol) { setEditingSymbol(current => current ?? symbol); return; }
      const nextPreview = readAnalysisReviewPreview(message);
      if (nextPreview) setAnalysisPreview(nextPreview);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectUsage, selectRecaps, syncNavigation, cancelMutation, relayReply, performRelay, clearRelay]);

  return (
    <>
      <Dialog open={pendingMutation !== null} onClose={mutationBusy ? undefined : cancelMutation} fullWidth maxWidth="sm" aria-labelledby="watchlist-confirm-change-title">
        <DialogTitle id="watchlist-confirm-change-title">Confirm Watchlist change</DialogTitle>
        <DialogContent>
          <Box component="p">Review this change requested by the embedded Watchlist console before sending it.</Box>
          <Box component="p" sx={{ fontWeight: 700 }}>{pendingMutation ? watchlistMutationDescription(pendingMutation) : ""}</Box>
          <Box component="pre" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 320, overflow: "auto", bgcolor: "background.default", p: 2, borderRadius: 1 }}>{pendingMutation?.body ?? "No additional values."}</Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={mutationBusy} onClick={cancelMutation}>Cancel</Button>
          <Button variant="contained" disabled={mutationBusy || pendingMutation === null} onClick={() => { const input = pendingMutation; if (input && pendingMutationRef.current === input) { setMutationBusy(true); void performRelay(input); } }}>{mutationBusy ? "Sending…" : "Confirm change"}</Button>
        </DialogActions>
      </Dialog>
      {historyRequest && <PreviousAnalyses key={historyRequest.cycleId} symbol={historyRequest.symbol} expectedCycleId={historyRequest.cycleId} onClose={() => setHistoryRequest(null)} />}
      {gainStartSymbol && <GainStartingPoint key={gainStartSymbol} symbol={gainStartSymbol} onClose={() => setGainStartSymbol(null)} />}
      {gainPostSymbol && <PotentialGainPost key={gainPostSymbol} symbol={gainPostSymbol} onClose={() => setGainPostSymbol(null)} />}
      {lossPostSymbol && <ManualLossPost key={lossPostSymbol} symbol={lossPostSymbol} onClose={() => setLossPostSymbol(null)} />}
      {editingSymbol && <WatchlistAnalysisEditor key={editingSymbol} symbol={editingSymbol} onClose={() => setEditingSymbol(null)} onSaved={() => frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-editor", type: "saved" }, "*")} />}
      <Dialog open={analysisPreview !== null} onClose={() => setAnalysisPreview(null)} fullWidth maxWidth="lg" aria-labelledby="analysis-preview-title">
        <DialogTitle id="analysis-preview-title">Website analysis preview</DialogTitle>
        <DialogContent>
          {analysisPreview ? <AnalysisPreviewCard card={analysisPreview.card} symbol={{}} livePrice={null} dipBuyPlanVisible={analysisPreview.dipBuyPlanVisible} /> : null}
        </DialogContent>
        <DialogActions><Button onClick={() => setAnalysisPreview(null)}>Close</Button></DialogActions>
      </Dialog>
      <Box component="nav" aria-label="Watchlist Admin sections" sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {RUNTIME_SECTIONS.map(([id, title]) => <Button key={id} onClick={() => selectRuntimeSection(id)} aria-current={selectedSection === "runtime" && runtimeSection === id ? "page" : undefined} variant={selectedSection === "runtime" && runtimeSection === id ? "contained" : "outlined"}>{title}</Button>)}
        <Button onClick={selectUsage} aria-current={selectedSection === "usage" ? "page" : undefined} variant={selectedSection === "usage" ? "contained" : "outlined"}>Usage</Button>
        <Button onClick={selectRecaps} aria-current={selectedSection === "recaps" ? "page" : undefined} variant={selectedSection === "recaps" ? "contained" : "outlined"}>Daily Recaps</Button>
        <Button onClick={() => { setAuditOpened(true); setSelectedSection("indicator-audit"); }} aria-current={selectedSection === "indicator-audit" ? "page" : undefined} variant={selectedSection === "indicator-audit" ? "contained" : "outlined"}>Indicator Audit</Button>
        <Button onClick={() => setSelectedSection("setups")} aria-current={selectedSection === "setups" ? "page" : undefined} variant={selectedSection === "setups" ? "contained" : "outlined"}>Setup Detection</Button>
      </Box>
      <Box hidden={selectedSection !== "usage"}>
        {usageOpened && <DeferredAdminPanel section="usage" />}
      </Box>
      <Box hidden={selectedSection !== "recaps"}>{recapsOpened && <DeferredAdminPanel section="recaps" />}</Box>
      <Box hidden={selectedSection !== "indicator-audit"}>{auditOpened && <IndicatorAuditPanel />}</Box>
      {selectedSection === "setups" ? <SetupAdminPanel /> : null}
      <Box
        aria-hidden={selectedSection !== "runtime"}
        component="iframe"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        ref={frameRef}
        src="/api/admin/watchlist/console"
        sx={{ border: 0, display: selectedSection === "runtime" ? "block" : "none", height, width: "100%" }}
        title="Manual Watchlist Admin"
      />
    </>
  );
}
