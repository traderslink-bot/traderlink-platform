"use client";

import { useSyncExternalStore } from "react";

type JournalDisplay = Readonly<{ day?: string; showFills: boolean; showNotes: boolean; active: boolean }>;
const empty: JournalDisplay = { showFills: false, showNotes: true, active: false };
const prefix = "traderslink.chart-journal-display.v1:";
const subscriptions = new Set<() => void>();
const values = new Map<string, { raw: string | null; value: JournalDisplay }>();

function notify() {
  subscriptions.forEach((listener) => listener());
}

function receive(event: StorageEvent) {
  if (!event.key || event.key.startsWith(prefix)) {
    if (event.key) values.delete(event.key);
    else values.clear();
    notify();
  }
}

function subscribe(listener: () => void) {
  if (!subscriptions.size) window.addEventListener("storage", receive);
  subscriptions.add(listener);
  return () => {
    subscriptions.delete(listener);
    if (!subscriptions.size) window.removeEventListener("storage", receive);
  };
}

function read(key: string): JournalDisplay {
  const previous = values.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (previous?.raw === raw) return previous.value;
    const saved = raw ? JSON.parse(raw) : null;
    const value = saved ? {
      day: typeof saved.day === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(saved.day) ? saved.day : undefined,
      showFills: saved.showFills === true, showNotes: saved.showNotes !== false, active: saved.active === true,
    } : empty;
    values.set(key, { raw, value });
    return value;
  } catch {
    return previous?.value ?? empty;
  }
}

export function useChartJournalDisplay(account: string | undefined) {
  const key = account ? prefix + account : "";
  const value = useSyncExternalStore(subscribe, () => key ? read(key) : empty, () => empty);
  function change(patch: Partial<JournalDisplay>) {
    if (!key) return;
    const next = { ...read(key), ...patch };
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(key, raw);
      values.set(key, { raw, value: next });
    } catch {
      values.set(key, { raw: null, value: next });
    }
    notify();
  }
  return { ...value, change };
}
