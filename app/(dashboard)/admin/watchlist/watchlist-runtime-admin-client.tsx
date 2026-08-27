"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { WatchlistUsageAdminPanel } from "./watchlist-usage-admin-panel";
import type { WatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";

const MINIMUM_FRAME_HEIGHT = 900;

export function WatchlistRuntimeAdminClient({
  usage,
}: {
  usage: WatchlistUsageAdminSnapshot | null;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(MINIMUM_FRAME_HEIGHT);
  const [selectedSection, setSelectedSection] = useState<"runtime" | "usage">("runtime");

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
      const message = event.data as { source?: unknown; type?: unknown };
      if (
        message.source !== "traderslink-watchlist-admin" ||
        message.type !== "open-usage"
      ) return;
      selectUsage();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectUsage]);

  return (
    <>
      <Box hidden={selectedSection !== "usage"}>
        <WatchlistUsageAdminPanel active={selectedSection === "usage"} usage={usage} />
        <Button onClick={() => setSelectedSection("runtime")} sx={{ mt: 2 }} variant="outlined">
          Watchlist controls
        </Button>
      </Box>
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
