"use client";
import { useEffect, useRef } from "react";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function SwingVisitRecorder({ ideaId, revision }: { ideaId: string; revision?: string | number }) {
  const event = useRef<{key:string;id:string} | null>(null);
  useEffect(() => {
    let sent = false;
    const record = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      const key=ideaId+':'+(revision??'original');
      if(event.current?.key!==key)event.current={key,id:crypto.randomUUID()};
      void fetch("/api/swings/visits", { method: "POST", credentials: "same-origin", cache: "no-store", keepalive: true,
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify({ ideaId, revision, eventId: event.current.id }) }).catch(() => {});
    };
    const restored = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    record(); document.addEventListener("visibilitychange", record); window.addEventListener("pageshow", restored);
    return () => { document.removeEventListener("visibilitychange", record); window.removeEventListener("pageshow", restored); };
  }, [ideaId,revision]);
  return null;
}
