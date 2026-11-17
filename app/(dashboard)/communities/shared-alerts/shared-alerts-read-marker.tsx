"use client";

import { useEffect, useRef } from "react";
import { markSharedAlertRead } from "./shared-alerts-actions";

/** Only mounted, visible content advances read state; prefetching never does. */
export function SharedAlertsReadMarker({ communitySlug, requestId, messageSequence, eventSequence, onRead }: { communitySlug: string; requestId: string; messageSequence: number; eventSequence: number; onRead: () => void }) {
  const pending = useRef<{ key: string; result: Promise<boolean> } | null>(null);
  useEffect(() => {
    const detail = document.getElementById("sharing-detail");
    if (!detail || typeof IntersectionObserver === "undefined") return;
    const targets = [...detail.querySelectorAll("[data-shared-read-latest]")];
    if (!targets.length) return;
    const visible = new Set<Element>(), seen = new Set<Element>();
    let mounted = true, subscribed = false;
    const key = `${communitySlug}:${requestId}:${messageSequence}:${eventSequence}`;
    const mark = () => {
      if (!mounted || !visible.size || document.visibilityState !== "visible" || subscribed) return;
      visible.forEach(target => seen.add(target));
      if (seen.size !== targets.length) return;
      subscribed = true;
      // Reuse the same idempotent request across development effect remounts.
      if (pending.current?.key !== key) pending.current = { key, result: markSharedAlertRead({ communitySlug, requestId, messageSequence, eventSequence }) };
      void pending.current.result.then(saved => {
        if (!saved) { subscribed = false; if (pending.current?.key === key) pending.current = null; return; }
        // A read acknowledgement updates badges locally. Refreshing the route
        // here can reset focus, unsaved fields and confirmation checkboxes.
        if (mounted && new URL(window.location.href).searchParams.get("request") === requestId) onRead();
      }).catch(() => { subscribed = false; if (pending.current?.key === key) pending.current = null; });
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      mark();
    });
    targets.forEach(target => observer.observe(target));
    document.addEventListener("visibilitychange", mark);
    return () => { mounted = false; observer.disconnect(); document.removeEventListener("visibilitychange", mark); };
  }, [communitySlug, requestId, messageSequence, eventSequence, onRead]);
  return null;
}
