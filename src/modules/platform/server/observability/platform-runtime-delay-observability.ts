import { constants, monitorEventLoopDelay, performance, PerformanceObserver } from "node:perf_hooks";

const stateKey = "__traderlinkRuntimeDelayObservabilityStarted" as const;
type ProcessState = typeof globalThis & { [stateKey]?: boolean };

/** Numeric process windows only; never observes requests, identities or payloads. */
export function startPlatformRuntimeDelayObservability(): void {
  const state = globalThis as ProcessState;
  if (process.env.NODE_ENV !== "production" || state[stateKey]) return;
  let histogram: ReturnType<typeof monitorEventLoopDelay> | undefined;
  let observer: PerformanceObserver | undefined;
  try {
    histogram = monitorEventLoopDelay({ resolution: 20 });
    const delay = histogram;
    let gcCount = 0, gcMajorCount = 0, gcTotalMs = 0, gcMaxMs = 0;
    observer = new PerformanceObserver(list => {
      try {
        for (const entry of list.getEntries()) {
          gcCount++;
          gcTotalMs += entry.duration;
          gcMaxMs = Math.max(gcMaxMs, entry.duration);
          const detail = "detail" in entry ? entry.detail : undefined;
          if (typeof detail === "object" && detail !== null && "kind" in detail &&
            typeof detail.kind === "number" && (detail.kind & constants.NODE_PERFORMANCE_GC_MAJOR)) gcMajorCount++;
        }
      } catch { /* A diagnostic callback cannot affect application work. */ }
    });
    observer.observe({ entryTypes: ["gc"] });
    delay.enable();
    let previousUtilization = performance.eventLoopUtilization();
    let windowStarted = performance.now();
    let lastLoggedAt = Number.NEGATIVE_INFINITY;
    const timer = setInterval(() => {
      try {
        const now = performance.now();
        const windowMs = now - windowStarted;
        const utilization = performance.eventLoopUtilization();
        const delta = performance.eventLoopUtilization(utilization, previousUtilization);
        previousUtilization = utilization;
        const maxMs = delay.max / 1_000_000;
        const p99Ms = delay.percentile(99) / 1_000_000;
        const gc = { count: gcCount, majorCount: gcMajorCount, totalMs: gcTotalMs, maxMs: gcMaxMs };
        delay.reset();
        gcCount = 0; gcMajorCount = 0; gcTotalMs = 0; gcMaxMs = 0;
        windowStarted = now;
        if (Math.max(maxMs, gc.maxMs) < 250 || now - lastLoggedAt < 60_000) return;
        lastLoggedAt = now;
        const memory = process.memoryUsage();
        console.info("platform_runtime_delay_timing", {
          timestamp_utc: new Date().toISOString(),
          window_ms: Math.round(windowMs),
          event_loop_delay_max_ms: Number(maxMs.toFixed(1)),
          event_loop_delay_p99_ms: Number(p99Ms.toFixed(1)),
          event_loop_utilization: Number(delta.utilization.toFixed(4)),
          gc_count: gc.count, gc_major_count: gc.majorCount,
          gc_total_ms: Number(gc.totalMs.toFixed(1)), gc_max_ms: Number(gc.maxMs.toFixed(1)),
          rss_bytes: memory.rss, heap_used_bytes: memory.heapUsed,
        });
      } catch { /* Observability cannot change request or worker behavior. */ }
    }, 10_000);
    timer.unref();
    state[stateKey] = true;
  } catch {
    observer?.disconnect();
    histogram?.disable();
  }
}
