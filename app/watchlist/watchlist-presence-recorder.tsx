"use client";

import { useEffect, useRef } from "react";

const PRESENCE_STORAGE_KEY = "traderslink_watchlist_presence_v1";
const HEARTBEAT_INTERVAL_MS = 60_000;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function newPresenceId(): string {
  return crypto.randomUUID();
}

function readPresenceId(): string {
  try {
    const existing = window.sessionStorage.getItem(PRESENCE_STORAGE_KEY);
    if (existing && UUID_V4_PATTERN.test(existing)) return existing;
    const created = newPresenceId();
    window.sessionStorage.setItem(PRESENCE_STORAGE_KEY, created);
    return created;
  } catch {
    return newPresenceId();
  }
}

export function WatchlistPresenceRecorder() {
  const presenceIdRef = useRef<string | null>(null);

  useEffect(() => {
    const presenceId = presenceIdRef.current ?? readPresenceId();
    presenceIdRef.current = presenceId;
    const sendHeartbeat = () => {
      void fetch("/api/live-watchlist/presence", {
        body: JSON.stringify({
          presenceId,
          visible: document.visibilityState === "visible",
        }),
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-traderlink-platform-mutation": "1",
        },
        keepalive: true,
        method: "POST",
      });
    };
    sendHeartbeat();
    const heartbeat = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", sendHeartbeat);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, []);

  return null;
}
