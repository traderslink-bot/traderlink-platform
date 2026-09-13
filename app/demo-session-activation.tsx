"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

/** Existing sessions receive demo upgrades without another OAuth login. */
export function DemoSessionActivation({ scopeRef }: { scopeRef: string }) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let running = false;
    let completed = false;
    let after: string | null = null;
    let changed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const ensure = async () => {
      if (!active || running || completed || !navigator.onLine || document.visibilityState !== "visible") return;
      running = true;
      try {
        const response = await fetch(`/api/platform/journal/demo/ensure${after ? `?after=${encodeURIComponent(after)}` : ""}`, {
          method: "POST", credentials: "same-origin", cache: "no-store",
          signal: controller.signal,
          headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        });
        if (!response.ok) return;
        const result = await response.json() as { status?: string; changed?: boolean; nextAfter?: string | null };
        if (!active) return;
        changed ||= result.changed === true;
        const next = typeof result.nextAfter === "string" ? result.nextAfter : null;
        if (next !== null && (after !== null && next <= after)) return;
        after = next;
        completed = result.status === "cleared" || (result.status === "ready" && after === null);
        if (completed && changed) router.refresh();
        else if (result.status === "ready" && after) timer = setTimeout(() => void ensure(), 500);
      } catch {
        // Keep normal account access usable; retry on reconnect/focus.
      } finally { running = false; }
    };
    const onFocus = () => { if (document.visibilityState === "visible") void ensure(); };
    void ensure();
    window.addEventListener("online", ensure);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", ensure);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router, scopeRef]);
  return null;
}
