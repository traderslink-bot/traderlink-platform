/** Coalesces stream, timer and resume refreshes without overlapping requests. */
export function createWatchlistRefreshController(run: (signal: AbortSignal) => Promise<void>) {
  let active: AbortController | null = null;
  let stopped = false;
  let failures = 0;
  let retryAfter = 0;
  return {
    async refresh(): Promise<void> {
      if (stopped || active || document.visibilityState !== "visible" || !navigator.onLine || Date.now() < retryAfter) return;
      const controller = new AbortController();
      active = controller;
      const timeout = setTimeout(() => controller.abort(), 12_000);
      try {
        await run(controller.signal);
        failures = 0;
        retryAfter = 0;
      } catch {
        if (!stopped) {
          failures += 1;
          retryAfter = Date.now() + Math.min(60_000, 5_000 * 2 ** Math.min(failures - 1, 4));
        }
      } finally {
        clearTimeout(timeout);
        if (active === controller) active = null;
      }
    },
    dispose(): void {
      stopped = true;
      active?.abort();
    },
  };
}

/** Background push is independent; pause only this page's market-data stream. */
export function createVisibleWatchlistStream() {
  const listeners: Array<{ type: string; listener: (event: MessageEvent) => void }> = [];
  let stream: EventSource | null = null;
  function update() {
    if (document.visibilityState !== "visible" || !navigator.onLine) {
      stream?.close();
      stream = null;
    } else if (!stream) {
      stream = new EventSource("/api/live-watchlist/stream");
      for (const entry of listeners) stream.addEventListener(entry.type, entry.listener as EventListener);
    }
  }
  document.addEventListener("visibilitychange", update);
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
  return {
    addEventListener(type: string, listener: (event: MessageEvent) => void) {
      const safeListener = (event: MessageEvent) => {
        try { listener(event); } catch { /* Snapshot polling recovers a malformed stream event. */ }
      };
      listeners.push({ type, listener: safeListener });
      stream?.addEventListener(type, safeListener as EventListener);
    },
    close() {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      stream?.close();
      stream = null;
    },
  };
}
