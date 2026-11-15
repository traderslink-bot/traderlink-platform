"use client";

import { useEffect, useState } from "react";
import { chartJournalAccountHeader, type ChartJournalPlot, type ChartJournalPlotMode } from "@/src/modules/journal/contracts/journal-chart-contracts";
import { sharedChartFetch } from "./shared-chart-data";

const updated = "traderlink:chart-journal-updated";
export function notifyChartJournalUpdate(account: string) {
  window.dispatchEvent(new CustomEvent(updated, { detail: account }));
}

export function useChartJournalPlot(account: string, symbol: string, day: string, mode: ChartJournalPlotMode | null) {
  const key = `${account}:${symbol}:${day}:${mode}`;
  const [reply, setReply] = useState<{ key: string; plot: ChartJournalPlot }>();
  useEffect(() => {
    if (!mode) return;
    let controller: AbortController | undefined;
    const params = new URLSearchParams({ symbol, day, plot: mode });
    const read = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      void sharedChartFetch(`/api/platform/journal/chart?${params}`, {
        credentials: "same-origin", cache: "no-store", signal: request.signal, headers: { [chartJournalAccountHeader]: account },
      }, key).then(async response => {
        if (!response.ok) {
          if ((response.status === 403 || response.status === 409) && !request.signal.aborted) {
            setReply({ key, plot: { fills: [], notes: [] } });
          }
          return;
        }
        const { plot } = await response.json() as { plot: ChartJournalPlot };
        if (!request.signal.aborted) setReply({ key, plot });
      }).catch(() => { /* The current marks remain visible during a transient failure. */ });
    };
    const onUpdate = (event: Event) => {
      if ((event as CustomEvent).detail === account) read();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") read(); };
    read();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(updated, onUpdate);
    return () => {
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(updated, onUpdate);
    };
  }, [account, day, key, mode, symbol]);
  return mode && reply?.key === key ? reply.plot : undefined;
}
