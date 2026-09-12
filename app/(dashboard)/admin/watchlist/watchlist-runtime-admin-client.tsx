"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

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
const IndicatorAuditPanel = dynamic(() => import("./watchlist-indicator-audit-panel"));
const RUNTIME_SECTIONS = [
  ["watchlist", "Watchlist"], ["runtime", "Runtime"], ["market-data", "Market Data"],
  ["ai-controls", "AI Controls"], ["live-website-controls", "Live Website Controls"],
  ["automatic-low-float-selection", "Automatic Low-Float Selection"],
] as const;

const MINIMUM_FRAME_HEIGHT = 900;

export function WatchlistRuntimeAdminClient({
  dailyRecapsPanel,
  usagePanel,
}: {
  dailyRecapsPanel?: ReactNode;
  usagePanel: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(MINIMUM_FRAME_HEIGHT);
  const [selectedSection, setSelectedSection] = useState<"runtime" | "usage" | "recaps" | "indicator-audit">("runtime");
  const [runtimeSection, setRuntimeSection] = useState<string>("watchlist");
  const [auditOpened, setAuditOpened] = useState(false);
  const runtimeSectionRef = useRef(runtimeSection);
  const selectRuntimeSection = useCallback((section: string) => {
    if (!RUNTIME_SECTIONS.some(([id]) => id === section)) return;
    runtimeSectionRef.current = section; setRuntimeSection(section); setSelectedSection("runtime");
    frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-admin-wrapper", type: "select-section", section }, window.location.origin);
  }, []);
  const syncNavigation = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-admin-wrapper", type: "select-section", section: runtimeSectionRef.current }, window.location.origin);
  }, []);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [analysisPreview, setAnalysisPreview] = useState<{
    card: LiveWatchlistCardContent; dipBuyPlanVisible: boolean;
  } | null>(null);

  const resizeFrame = useCallback(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;
    setHeight(Math.max(
      MINIMUM_FRAME_HEIGHT,
      frameDocument.body?.scrollHeight ?? 0,
      frameDocument.documentElement?.scrollHeight ?? 0,
    ));
  }, []);

  const handleLoad = useCallback(() => {
    syncNavigation();
    resizeObserverRef.current?.disconnect();
    resizeFrame();
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;
    const observer = new ResizeObserver(resizeFrame);
    observer.observe(frameDocument.documentElement);
    if (frameDocument.body) observer.observe(frameDocument.body);
    resizeObserverRef.current = observer;
  }, [resizeFrame, syncNavigation]);

  const selectUsage = useCallback(() => {
    setSelectedSection("usage");
    window.requestAnimationFrame(() => {
      document.getElementById("watchlist-usage")?.focus({ preventScroll: true });
      document.getElementById("watchlist-usage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const message = event.data as { source?: unknown; type?: unknown; card?: unknown; dipBuyPlanVisible?: unknown };
      if (message.source !== "traderslink-watchlist-admin") return;
      if (message.type === "navigation-ready") { syncNavigation(); return; }
      if (message.type === "open-usage") { selectUsage(); return; }
      if (message.type === "open-recaps" && dailyRecapsPanel) { setSelectedSection("recaps"); return; }
      if (message.type === "open-indicator-audit") { setAuditOpened(true); setSelectedSection("indicator-audit"); return; }
      const symbol = readInlineAnalysisMessage(message);
      if (symbol) { setEditingSymbol(current => current ?? symbol); return; }
      const nextPreview = readAnalysisReviewPreview(message);
      if (nextPreview) setAnalysisPreview(nextPreview);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectUsage, syncNavigation, dailyRecapsPanel]);

  return (
    <>
      {editingSymbol && <WatchlistAnalysisEditor key={editingSymbol} symbol={editingSymbol} onClose={() => setEditingSymbol(null)} onSaved={() => frameRef.current?.contentWindow?.postMessage({ source: "traderslink-watchlist-editor", type: "saved" }, window.location.origin)} />}
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
        {dailyRecapsPanel && <Button onClick={() => setSelectedSection("recaps")} aria-current={selectedSection === "recaps" ? "page" : undefined} variant={selectedSection === "recaps" ? "contained" : "outlined"}>Daily Recaps</Button>}
        <Button onClick={() => { setAuditOpened(true); setSelectedSection("indicator-audit"); }} aria-current={selectedSection === "indicator-audit" ? "page" : undefined} variant={selectedSection === "indicator-audit" ? "contained" : "outlined"}>Indicator Audit</Button>
      </Box>
      <Box hidden={selectedSection !== "usage"}>
        {usagePanel}
      </Box>
      <Box hidden={selectedSection !== "recaps"}>{dailyRecapsPanel}</Box>
      <Box hidden={selectedSection !== "indicator-audit"}>{auditOpened && <IndicatorAuditPanel />}</Box>
      <Box
        aria-hidden={selectedSection !== "runtime"}
        component="iframe"
        onLoad={handleLoad}
        ref={frameRef}
        src="/api/admin/watchlist/console"
        sx={{ border: 0, display: selectedSection === "runtime" ? "block" : "none", height, width: "100%" }}
        title="Manual Watchlist Admin"
      />
    </>
  );
}
