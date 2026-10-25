import { subscribe, unsubscribe } from "node:diagnostics_channel";
import type { IncomingMessage, ServerResponse } from "node:http";
import { constants, monitorEventLoopDelay, performance, PerformanceObserver } from "node:perf_hooks";

const stateKey = "__traderlinkRuntimeDelayObservabilityStarted" as const;
const requestStateKey = "__traderlinkNodeRequestBoundaryObservabilityStarted" as const;
type ProcessState = typeof globalThis & {
  [stateKey]?: boolean;
  [requestStateKey]?: boolean;
};

type RouteKey = "workspace" | "health";
type RequestStart = Readonly<{
  route: RouteKey;
  requestId: string | null;
  edgeStartEpochMs: number | null;
  nodeReceivedEpochMs: number;
  nodeReceivedMonotonicMs: number;
}>;
type LogBucket = { count: number; dropped: number };

function observedRoute(request: IncomingMessage): RouteKey | null {
  if (request.method !== "GET" || !request.url) return null;
  const queryIndex = request.url.indexOf("?");
  const path = queryIndex < 0 ? request.url : request.url.slice(0, queryIndex);
  if (path === "/workspace" || path === "/workspace/") return "workspace";
  if (path === "/api/platform/health") return "health";
  return null;
}

function requestHeader(request: IncomingMessage, name: string): string | null {
  const value = request.headers[name];
  return typeof value === "string" ? value : null;
}

function startNodeRequestBoundaryObservability(state: ProcessState): void {
  if (state[requestStateKey]) return;
  const starts = new WeakMap<IncomingMessage, RequestStart>();
  const buckets: Record<RouteKey, LogBucket> = {
    workspace: { count: 0, dropped: 0 },
    health: { count: 0, dropped: 0 },
  };
  const onStart = (message: unknown): void => {
    try {
      const request = (message as { request?: IncomingMessage }).request;
      if (!request) return;
      const route = observedRoute(request);
      if (!route) return;
      const nodeReceivedEpochMs = Date.now();
      const rawId = requestHeader(request, "x-railway-request-id");
      const requestId = rawId && /^[A-Za-z0-9_-]{12,64}$/u.test(rawId) ? rawId : null;
      const rawEdgeStart = requestHeader(request, "x-request-start");
      const candidateEdgeStart = rawEdgeStart && /^\d{13}$/u.test(rawEdgeStart)
        ? Number(rawEdgeStart) : null;
      const edgeStartEpochMs = candidateEdgeStart !== null &&
        Number.isSafeInteger(candidateEdgeStart) &&
        nodeReceivedEpochMs - candidateEdgeStart >= 0 &&
        nodeReceivedEpochMs - candidateEdgeStart <= 600_000
        ? candidateEdgeStart : null;
      starts.set(request, {
        route, requestId, edgeStartEpochMs, nodeReceivedEpochMs,
        nodeReceivedMonotonicMs: performance.now(),
      });
    } catch { /* Request timing cannot change a response. */ }
  };
  const onFinish = (message: unknown): void => {
    try {
      const event = message as { request?: IncomingMessage; response?: ServerResponse };
      const request = event.request;
      if (!request) return;
      const start = starts.get(request);
      if (!start) return;
      starts.delete(request);
      const finishedMonotonicMs = performance.now();
      const finishedEpochMs = Date.now();
      const nodeDurationMs = finishedMonotonicMs - start.nodeReceivedMonotonicMs;
      const wallClockDriftMs = finishedEpochMs - start.nodeReceivedEpochMs - nodeDurationMs;
      const wallClockStable = Math.abs(wallClockDriftMs) <= 250;
      const edgeToNodeMs = wallClockStable && start.edgeStartEpochMs !== null
        ? start.nodeReceivedEpochMs - start.edgeStartEpochMs : null;
      if (start.route === "workspace" && (edgeToNodeMs ?? 0) < 500 && nodeDurationMs < 1_000) return;

      const bucket = buckets[start.route];
      if (bucket.count >= 12) {
        bucket.dropped++;
        return;
      }
      bucket.count++;
      console.info("platform_node_request_boundary_timing", {
        route: start.route,
        railway_request_id: start.requestId,
        edge_request_start_epoch_ms: start.edgeStartEpochMs,
        node_received_epoch_ms: start.nodeReceivedEpochMs,
        node_response_finish_epoch_ms: finishedEpochMs,
        edge_to_node_ms: edgeToNodeMs,
        node_duration_ms: Number(nodeDurationMs.toFixed(1)),
        wall_clock_drift_ms: Number(wallClockDriftMs.toFixed(1)),
        response_status: event.response?.statusCode ?? null,
      });
    } catch { /* Request timing cannot change a response. */ }
  };
  let startSubscribed = false;
  let finishSubscribed = false;
  let summaryTimer: ReturnType<typeof setInterval> | undefined;
  try {
    subscribe("http.server.request.start", onStart);
    startSubscribed = true;
    subscribe("http.server.response.finish", onFinish);
    finishSubscribed = true;
    let windowStartedEpochMs = Date.now();
    summaryTimer = setInterval(() => {
      try {
        const windowEndedEpochMs = Date.now();
        for (const route of ["workspace", "health"] as const) {
          const bucket = buckets[route];
          const dropped = bucket.dropped;
          bucket.count = 0;
          bucket.dropped = 0;
          if (dropped > 0) {
            try {
              console.info("platform_node_request_boundary_dropped", {
                route, window_start_epoch_ms: windowStartedEpochMs,
                window_end_epoch_ms: windowEndedEpochMs, dropped_count: dropped,
              });
            } catch { /* A diagnostic summary cannot affect application work. */ }
          }
        }
        windowStartedEpochMs = windowEndedEpochMs;
      } catch { /* A diagnostic summary cannot affect application work. */ }
    }, 60_000);
    summaryTimer.unref();
    state[requestStateKey] = true;
  } catch {
    if (summaryTimer) clearInterval(summaryTimer);
    if (finishSubscribed) {
      try { unsubscribe("http.server.response.finish", onFinish); }
      catch { /* Failure to observe cannot affect startup. */ }
    }
    if (startSubscribed) {
      try { unsubscribe("http.server.request.start", onStart); }
      catch { /* Failure to observe cannot affect startup. */ }
    }
  }
}

/** Numeric process windows and selected request boundaries; never reads identity or payloads. */
export function startPlatformRuntimeDelayObservability(): void {
  const state = globalThis as ProcessState;
  if (process.env.NODE_ENV !== "production") return;
  if (state[stateKey]) {
    try { startNodeRequestBoundaryObservability(state); }
    catch { /* A diagnostic subscriber cannot prevent startup. */ }
    return;
  }
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
    let windowStartedEpochMs = Date.now();
    const timer = setInterval(() => {
      try {
        const now = performance.now();
        const windowEndedEpochMs = Date.now();
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
        const startedEpochMs = windowStartedEpochMs;
        windowStartedEpochMs = windowEndedEpochMs;
        if (Math.max(maxMs, gc.maxMs) < 250) return;
        const memory = process.memoryUsage();
        console.info("platform_runtime_delay_timing", {
          timestamp_utc: new Date().toISOString(),
          window_start_epoch_ms: startedEpochMs,
          window_end_epoch_ms: windowEndedEpochMs,
          window_ms: Math.round(windowMs),
          wall_clock_drift_ms: Number((windowEndedEpochMs - startedEpochMs - windowMs).toFixed(1)),
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
  try { startNodeRequestBoundaryObservability(state); }
  catch { /* A diagnostic subscriber cannot prevent startup. */ }
}
