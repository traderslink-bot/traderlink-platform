"use client";
import { useEffect, useRef } from "react";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function SwingVisitRecorder({ ideaId }: { ideaId: string }) {
  const event = useRef<string | null>(null);
  useEffect(() => {
    let sent = false;
    const record = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      event.current ??= crypto.randomUUID();
      void fetch("/api/swings/visits", { method: "POST", credentials: "same-origin", cache: "no-store", keepalive: true,
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify({ ideaId, eventId: event.current }) }).catch(() => {});
    };
    const restored = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    record(); document.addEventListener("visibilitychange", record); window.addEventListener("pageshow", restored);
    return () => { document.removeEventListener("visibilitychange", record); window.removeEventListener("pageshow", restored); };
  }, [ideaId]);
  return null;
}
