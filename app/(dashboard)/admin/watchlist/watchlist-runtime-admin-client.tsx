"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";

const MINIMUM_FRAME_HEIGHT = 900;

export function WatchlistRuntimeAdminClient() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(MINIMUM_FRAME_HEIGHT);

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

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  return (
    <Box
      component="iframe"
      onLoad={handleLoad}
      ref={frameRef}
      src="/api/admin/watchlist/console"
      sx={{ border: 0, display: "block", height, width: "100%" }}
      title="Manual Watchlist Admin"
    />
  );
}
