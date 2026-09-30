"use client";

import { useEffect, useRef, useState } from "react";

/** Original responsive document at full size, with one outer page scroll. */
export function WatchlistCapturedPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(3400);
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;
    let cancelled = false;
    const connect = () => {
      observer?.disconnect();
      const content = iframe.contentDocument?.body.firstElementChild;
      if (!content) return;
      const resize = () => {
        if (cancelled) return;
        const next = Math.ceil(content.getBoundingClientRect().height);
        if (next > 0) setHeight(current => current === next ? current : next);
      };
      observer = new ResizeObserver(resize);
      observer.observe(content);
      resize();
      void iframe.contentDocument?.fonts.ready.then(resize);
    };
    iframe.addEventListener("load", connect);
    connect();
    return () => {
      cancelled = true;
      observer?.disconnect();
      iframe.removeEventListener("load", connect);
    };
  }, []);
  return <iframe ref={frame} src="/watchlist-preview/cntb.html"
    title="CNTB preview from Sep 30, 2026 — not live data"
    sandbox="allow-same-origin" tabIndex={-1} aria-hidden="true"
    style={{ display: "block", width: "100%", height, border: 0, pointerEvents: "none" }} />;
}
