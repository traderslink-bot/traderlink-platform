"use client";

import { useEffect, useState } from "react";
import { formatAnalysisHistoryRow, type AnalysisHistoryRow } from "@/src/lib/live-watchlist/analysis-publication-history";
import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

export function AnalysisHistoryLines({ read, preview = false }: { read: TradersLinkAiReadPayload; preview?: boolean }) {
  const [history, setHistory] = useState<{ key: string; rows: AnalysisHistoryRow[] } | null>(null);
  const key = `${read.symbol}:${read.generatedAt}:${read.currentPrice}`;
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    void fetch(`/api/live-watchlist/symbols/${encodeURIComponent(read.symbol)}/analysis-history`, {
      credentials: "same-origin", signal: controller.signal,
    }).then(response => response.ok ? response.json() : null).then(value => {
      const rows: AnalysisHistoryRow[] = Array.isArray(value?.rows) ? value.rows.filter((row: AnalysisHistoryRow | null) =>
        row && Number.isFinite(row.generatedAt) && row.generatedAt > 0 && Number.isFinite(row.price) && row.price > 0) : [];
      // A delayed response must not attach another generation's timeline to this card.
      const last = rows.at(-1);
      if (!controller.signal.aborted && last?.generatedAt === read.generatedAt && last.price === read.currentPrice) setHistory({ key, rows });
    }).catch(() => { /* Keep the current analysis reference visible if history is unavailable. */ });
    return () => controller.abort();
  }, [key, preview, read.symbol, read.generatedAt, read.currentPrice]);
  const rows = history?.key === key ? history.rows : [];
  return <div className="watchlist-ai-read-eyebrow">
    {rows.length ? rows.map((row, index) => <div key={`${row.generatedAt}:${index}`}>{formatAnalysisHistoryRow(row, index)}</div>) :
      <div>{formatAnalysisHistoryRow({ generatedAt: read.generatedAt, price: read.currentPrice }, 0).replace("Analysis posted:", preview ? "Analysis preview:" : "Analysis:")}</div>}
  </div>;
}
