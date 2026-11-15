"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import type { ChartJournalOverlay, ChartJournalSelection } from "@/src/modules/journal/contracts/journal-chart-contracts";
import type { ChartJournalFocus } from "./chart-journal-model";

export const chartJournalOpeningEvent = "traderlink:chart-journal-opening";

export type JournalChartEvent =
  | Readonly<{ kind: "candle"; candle: ChartJournalSelection }>
  | Readonly<{ kind: "marker"; ids: readonly string[]; type: ChartJournalOverlay["kind"] }>;

type JournalChartEngine = Readonly<{
  symbol: string;
  renderOverlay: () => void;
  focus: () => Promise<void>;
}>;

export function useChartJournalBridge(accountRef: string | undefined, baseSymbol: string) {
  const panelId = useId();
  const scope = accountRef ? `${accountRef}:${baseSymbol}` : "";
  const [panel, setPanel] = useState<{ scope: string; open: boolean; reviewSymbol?: string }>();
  const current = panel?.scope === scope && scope ? panel : undefined;
  const [status, setStatus] = useState("");
  const engine = useRef<JournalChartEngine | null>(null);
  const interaction = useRef<((event: JournalChartEvent) => boolean) | null>(null);
  const overlay = useRef<{ scope: string; symbol: string; items: readonly ChartJournalOverlay[] } | null>(null);
  const pendingFocus = useRef<(ChartJournalFocus & { scope: string }) | null>(null);

  const register = useCallback((listener: ((event: JournalChartEvent) => boolean) | null) => {
    interaction.current = listener;
  }, []);

  const setOverlay = useCallback((symbol: string, items: readonly ChartJournalOverlay[]) => {
    overlay.current = { scope, symbol, items };
    engine.current?.renderOverlay();
  }, [scope]);

  const open = useCallback(() => {
    if (!scope || !window.dispatchEvent(new CustomEvent(chartJournalOpeningEvent, { cancelable: true, detail: panelId }))) return;
    setPanel((old) => ({ scope, open: true, reviewSymbol: old?.scope === scope ? old.reviewSymbol : undefined }));
  }, [scope, panelId]);

  const close = useCallback(() => {
    pendingFocus.current = null;
    setStatus("");
    setPanel({ scope, open: false });
  }, [scope]);

  const review = useCallback((target: ChartJournalFocus) => {
    pendingFocus.current = { ...target, scope };
    setStatus("Finding candles…");
    if (engine.current?.symbol === target.symbol) void engine.current.focus();
    setPanel({ scope, open: true, reviewSymbol: target.symbol === baseSymbol ? undefined : target.symbol });
  }, [scope, baseSymbol]);

  const refs = useMemo(() => ({ overlay, interaction, engine, pendingFocus, setStatus }), []);
  return { scope, panelId, refs, register, setOverlay, open, close, review, status, current };
}
