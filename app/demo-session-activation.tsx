"use client";

import Typography from "@mui/material/Typography";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

const ANALYZER_PAGE = /^\/(?:trade-analyzer|analytics\/trade-analyzer)(?:\/|$)/u;
const JOURNAL_PAGE = /^\/(?:workspace|trade-tracker|quick-trade-entry|trades|calendar|analytics|imports|data-decisions|rules)(?:\/|$)/u;

export function DashboardDemoSetup({
  autoOpenDemo,
  ensureDemo,
  scopeRef,
  children,
}: {
  autoOpenDemo: Readonly<{ journal: boolean; analyzer: boolean }> | null;
  ensureDemo: boolean;
  scopeRef: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const openDemo = autoOpenDemo && (ANALYZER_PAGE.test(pathname)
    ? autoOpenDemo.analyzer
    : autoOpenDemo.journal && JOURNAL_PAGE.test(pathname));
  return openDemo || ensureDemo ? (
    <DemoSessionActivation key={openDemo ? "open" : "ensure"} openDemo={Boolean(openDemo)} scopeRef={scopeRef}>
      {children}
    </DemoSessionActivation>
  ) : <>{children}</>;
}

/** Select Demo on first Journal entry or refresh saved samples in the background. */
export function DemoSessionActivation({
  scopeRef,
  openDemo = false,
  children,
}: {
  scopeRef: string;
  openDemo?: boolean;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [showPage, setShowPage] = useState(!openDemo);
  useEffect(() => {
    let active = true;
    let running = false;
    let completed = false;
    let after: string | null = null;
    let changed = false;
    let busyRetries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const ensure = async () => {
      if (!active || running || completed || !navigator.onLine || document.visibilityState !== "visible") return;
      running = true;
      try {
        const endpoint = openDemo ? "/api/platform/journal/demo/activate" : "/api/platform/journal/demo/ensure";
        const response = await fetch(`${endpoint}${after ? `?after=${encodeURIComponent(after)}` : ""}`, {
          method: "POST", credentials: "same-origin", cache: "no-store",
          signal: controller.signal,
          headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        });
        if (response.status === 503 && response.headers.has("retry-after") && active && busyRetries < 60) {
          busyRetries += 1;
          timer = setTimeout(() => void ensure(), 3_000);
          return;
        }
        if (!active) return;
        if (!response.ok) {
          if (openDemo) setShowPage(true);
          return;
        }
        if (openDemo) {
          completed = true;
          router.refresh();
          return;
        }
        busyRetries = 0;
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
        if (active && openDemo) setShowPage(true);
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
  }, [openDemo, router, scopeRef]);
  return showPage ? <>{children}</> : <Typography role="status">Loading demo data…</Typography>;
}
