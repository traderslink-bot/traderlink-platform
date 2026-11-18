"use client";

import { useCallback, useSyncExternalStore } from "react";

type Feature = "charts" | "scanners";
type Selection = { provider: "alpaca" | "moomoo"; revision: number; ready: boolean };
const initial: Selection = { provider: "alpaca", revision: 0, ready: false };
type Store = { current: Selection; listeners: Set<() => void>; timer?: ReturnType<typeof setInterval>; pending?: AbortController; refresh: () => void };
const stores = new Map<Feature, Store>();
function store(feature: Feature): Store {
  const saved = stores.get(feature);
  if (saved) return saved;
  const entry: Store = { current: initial, listeners: new Set(), refresh: () => { void refresh(feature, entry); } };
  stores.set(feature, entry);
  return entry;
}
async function refresh(feature: Feature, entry: Store) {
  if (entry.pending || document.hidden || !entry.listeners.size) return;
  const request = entry.pending = new AbortController();
  let next: Selection;
  try {
    const response = await fetch("/api/charts/provider?feature=" + feature, { cache: "no-store", credentials: "same-origin", signal: request.signal });
    if (!response.ok) throw Error("selection_unavailable");
    next = await response.json() as Selection;
    if (!["alpaca", "moomoo"].includes(next.provider) || !Number.isSafeInteger(next.revision) || next.revision < 0) throw Error("invalid_selection");
  } catch {
    if (request.signal.aborted) return;
    // Data routes independently verify the selected source before returning data.
    next = entry.current;
  } finally { if (entry.pending === request) entry.pending = undefined; }
  if (request.signal.aborted || !entry.listeners.size) return;
  if (entry.current.provider !== next.provider || entry.current.revision !== next.revision || !entry.current.ready) {
    entry.current = { ...next, ready: true };
    for (const listener of entry.listeners) listener();
  }
}
function subscribe(feature: Feature, listener: () => void) {
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
    }
  };
}
export function useMarketDataSelection(feature: Feature) {
  const subscribeFeature = useCallback((listener: () => void) => subscribe(feature, listener), [feature]);
  return useSyncExternalStore(subscribeFeature, () => store(feature).current, () => initial);
}
export function useChartMarketData() { return useMarketDataSelection("charts"); }
