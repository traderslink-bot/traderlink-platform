"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_MULTIVIEW, singleChart, parseChartMultiview, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import { chartViews } from "./chart-view-memory";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function useChartMultiview(workspace: "main" | "scanner") {
  const [layout, setLayout] = useState<ChartMultiview>(EMPTY_MULTIVIEW);
  const [ready, setReady] = useState(false), [message, setMessage] = useState("");
  const owner = useRef(""), revision = useRef(0), alive = useRef(false), queue = useRef(Promise.resolve()), serial = useRef(0);
  useEffect(() => {
    alive.current = true; const controller = new AbortController();
    void fetch(`/api/charts/layout?workspace=${workspace}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error(); const result = await response.json();
      if (typeof result.ownerKey !== "string" || !Number.isSafeInteger(result.revision)) throw Error();
      owner.current = result.ownerKey; revision.current = result.revision;
      const next = parseChartMultiview(result.layout); chartViews.retain(result.ownerKey, workspace, workspace === "main" && !next.groups.length ? singleChart("NWGL") : next); setLayout(next); setReady(true);
    }).catch(() => { if (!controller.signal.aborted) setMessage("Saved view could not load. Reload to try again."); });
    return () => { alive.current = false; controller.abort(); };
  }, [workspace]);
  const change = useCallback((value: ChartMultiview) => {
    const next = parseChartMultiview(value); if (owner.current) chartViews.retain(owner.current, workspace, next); setLayout(next);
    if (!owner.current) return;
    const sequence = ++serial.current; setMessage("Saving view…");
    queue.current = queue.current.then(async () => {
      try {
        const response = await fetch(`/api/charts/layout?workspace=${workspace}`, { method: "POST", credentials: "same-origin", keepalive: true,
          headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
          body: JSON.stringify({ ownerKey: owner.current, revision: revision.current, layout: next }) });
        if (!response.ok) throw Error(response.status === 409 ? "View changed elsewhere. Reload before editing again." : "View was not saved. Make the change again to retry.");
        const result = await response.json(); revision.current = result.revision;
        if (alive.current && serial.current === sequence) setMessage("View saved");
      } catch (error) { if (alive.current && serial.current === sequence) setMessage(error instanceof Error ? error.message : "View was not saved."); }
    });
  }, [workspace]);
  return { layout, ready, message, change, clearViews: () => { if (owner.current) chartViews.clear(owner.current, workspace); } };
}
