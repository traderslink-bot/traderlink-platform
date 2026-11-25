"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useWorkspaceBrokerChart } from "./workspace-broker-chart-context";

type Feature = "charts" | "scanners";
type Source = Feature | "broker-charts";
type Selection = { generation: string; ready: boolean; message?: string };
const initial: Selection = { generation: "", ready: false };
type Store = { current: Selection; listeners: Set<() => void>; timer?: ReturnType<typeof setInterval>; pending?: AbortController; refresh: () => void };
const stores = new Map<Source, Store>();
const brokerChartBase = "/api/trading-workspace/broker/charts";
const defaultChartEndpoints = {
  bars: "/api/screeners/charts/bars",
  stream: "/api/screeners/charts/stream",
  calendar: "/api/charts/calendar",
  splits: "/api/charts/splits",
  vwapSeed: "/api/charts/vwap-seed",
};
const brokerChartEndpoints = {
  bars: brokerChartBase + "/bars",
  stream: brokerChartBase + "/stream",
  calendar: brokerChartBase + "/calendar",
  splits: brokerChartBase + "/splits",
  vwapSeed: brokerChartBase + "/vwap-seed",
};
function store(feature: Source): Store {
  const saved = stores.get(feature);
  if (saved) return saved;
  const entry: Store = { current: initial, listeners: new Set(), refresh: () => { void refresh(feature, entry); } };
  stores.set(feature, entry);
  return entry;
}
async function refresh(feature: Source, entry: Store) {
  if (entry.pending || document.hidden || !entry.listeners.size) return;
  const request = entry.pending = new AbortController();
  let next: Selection;
  try {
    const broker = feature === "broker-charts";
    const url = broker ? brokerChartBase + "/provider" : "/api/charts/provider?feature=" + feature;
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: request.signal });
    if (!response.ok) {
      if (!broker || ![401, 403].includes(response.status)) throw Error("selection_unavailable");
      next = { ...initial, message: "Moomoo chart access unavailable." };
    } else {
      const payload = await response.json() as { generation: string | null };
      if (broker && payload.generation === null) {
        next = { ...initial, message: "Connect Moomoo in Trading settings to load this chart." };
      } else {
        if (typeof payload.generation !== "string" || !/^[a-f0-9]{64}$/.test(payload.generation)) throw Error("invalid_selection");
        next = { generation: payload.generation, ready: true };
      }
    }
  } catch {
    if (request.signal.aborted) return;
    // Data routes independently verify the selected source before returning data.
    return;
  } finally { if (entry.pending === request) entry.pending = undefined; }
  if (request.signal.aborted || !entry.listeners.size) return;
  if (entry.current.generation !== next.generation || entry.current.ready !== next.ready || entry.current.message !== next.message) {
    entry.current = next;
    for (const listener of entry.listeners) listener();
  }
}
function subscribe(feature: Source, listener: () => void) {
  const entry = store(feature);
  entry.listeners.add(listener);
  if (entry.listeners.size === 1) {
    entry.refresh();
    entry.timer = setInterval(entry.refresh, 5_000);
    window.addEventListener("focus", entry.refresh); window.addEventListener("storage", entry.refresh);
    document.addEventListener("visibilitychange", entry.refresh);
  }
  return () => {
    entry.listeners.delete(listener);
    if (!entry.listeners.size) {
      clearInterval(entry.timer); entry.timer = undefined; entry.pending?.abort(); entry.pending = undefined;
      window.removeEventListener("focus", entry.refresh); window.removeEventListener("storage", entry.refresh);
      document.removeEventListener("visibilitychange", entry.refresh);
      if (feature === "broker-charts") entry.current = initial;
    }
  };
}
function useSourceSelection(feature: Source) {
  const subscribeFeature = useCallback((listener: () => void) => subscribe(feature, listener), [feature]);
  return useSyncExternalStore(subscribeFeature, () => store(feature).current, () => initial);
}
export function useMarketDataSelection(feature: Feature) { return useSourceSelection(feature); }

export function useChartMarketData() {
  const broker = useWorkspaceBrokerChart();
  const selection = useSourceSelection(broker ? "broker-charts" : "charts");
  return { ...selection, broker, endpoints: broker ? brokerChartEndpoints : defaultChartEndpoints };
}
