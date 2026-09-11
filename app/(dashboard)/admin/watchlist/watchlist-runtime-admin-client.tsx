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

const MINIMUM_FRAME_HEIGHT = 900;

export function WatchlistRuntimeAdminClient({
  dailyRecapsPanel,
  usagePanel,
}: {
  dailyRecapsPanel: ReactNode;
  usagePanel: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(MINIMUM_FRAME_HEIGHT);
  const [selectedSection, setSelectedSection] = useState<"runtime" | "usage" | "recaps">("runtime");
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
    resizeObserverRef.current?.disconnect();
    resizeFrame();
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;
    const observer = new ResizeObserver(resizeFrame);
    observer.observe(frameDocument.documentElement);
    if (frameDocument.body) observer.observe(frameDocument.body);
    resizeObserverRef.current = observer;
  }, [resizeFrame]);

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
      if (message.type === "open-usage") { selectUsage(); return; }
      const symbol = readInlineAnalysisMessage(message);
      if (symbol) { setEditingSymbol(current => current ?? symbol); return; }
      const nextPreview = readAnalysisReviewPreview(message);
      if (nextPreview) setAnalysisPreview(nextPreview);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectUsage]);

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
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Button onClick={() => setSelectedSection("runtime")} variant={selectedSection === "runtime" ? "contained" : "outlined"}>Watchlist controls</Button>
        <Button onClick={() => setSelectedSection("usage")} variant={selectedSection === "usage" ? "contained" : "outlined"}>Usage</Button>
        <Button onClick={() => setSelectedSection("recaps")} variant={selectedSection === "recaps" ? "contained" : "outlined"}>Daily Recaps</Button>
      </Box>
      <Box hidden={selectedSection !== "usage"}>
        {usagePanel}
      </Box>
      <Box hidden={selectedSection !== "recaps"}>{dailyRecapsPanel}</Box>
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
