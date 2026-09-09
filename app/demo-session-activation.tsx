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
    const ensure = async () => {
      if (running || completed || !navigator.onLine) return;
      running = true;
      try {
        const response = await fetch("/api/platform/journal/demo/ensure", {
          method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        });
        if (!response.ok) return;
        const result = await response.json() as { status?: string; changed?: boolean };
        completed = result.status === "ready" || result.status === "cleared";
        if (active && result.changed === true) router.refresh();
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
      window.removeEventListener("online", ensure);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router, scopeRef]);
  return null;
}
