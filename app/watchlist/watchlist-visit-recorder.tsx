"use client";

import { useEffect, useRef } from "react";

type WatchlistUsagePageKind = "detail" | "index";

export function WatchlistVisitRecorder({
  pageKey,
  pageKind,
}: {
  pageKey: string;
  pageKind: WatchlistUsagePageKind;
}) {
  const eventIds = useRef(new Map<string, string>());

  useEffect(() => {
    let eventId = eventIds.current.get(pageKey);
    if (!eventId) {
      eventId = crypto.randomUUID();
      eventIds.current.set(pageKey, eventId);
    }
    void fetch("/api/live-watchlist/visits", {
      body: JSON.stringify({ eventId, pageKind }),
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-traderlink-platform-mutation": "1",
      },
      keepalive: true,
      method: "POST",
    });
  }, [pageKey, pageKind]);

  return null;
}
