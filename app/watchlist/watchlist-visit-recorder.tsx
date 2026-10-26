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
    const body = JSON.stringify({ eventId, pageKind });
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const record = async (attempt: number): Promise<void> => {
      if (disposed) return;
      try {
        const response = await fetch("/api/live-watchlist/visits", {
          body,
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            "x-traderlink-platform-mutation": "1",
          },
          keepalive: true,
          method: "POST",
        });
        // Do not repeat successful, invalid or unauthorized requests.
        if (response.ok || ![500, 502, 503, 504].includes(response.status)) return;
      } catch {
        // A lost response may follow a committed insert. Reuse the event ID.
      }
      if (!disposed && attempt < 2) {
        retryTimer = setTimeout(() => { void record(attempt + 1); }, attempt === 0 ? 1_000 : 3_000);
      }
    };

    void record(0);
    return () => {
      disposed = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [pageKey, pageKind]);

  return null;
}
