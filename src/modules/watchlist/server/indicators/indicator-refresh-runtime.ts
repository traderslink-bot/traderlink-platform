import "server-only";
import { IndicatorRequestCoordinator } from "@/src/lib/live-watchlist/indicators/indicator-request-coordinator";
import { fetchIndicatorHistory } from "@/src/lib/live-watchlist/indicators/indicator-history-provider";
import { IndicatorRefreshService } from "@/src/lib/live-watchlist/indicators/indicator-refresh-service";
import type { WatchlistIndicatorSnapshot } from "@/src/lib/live-watchlist/indicators/indicator-refresh-service";
import type { IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import calendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { withWatchlistIndicatorMoomooAccess } from "../moomoo-watchlist-candle-bridge";
import { watchlistIndicatorAuditStore } from "./indicator-audit-runtime";

type Access = Readonly<{ token: string; requestScope: string }>;
// Credentials exist only inside the authorized operation; they never enter snapshots or audit records.
const operationAccess = new Map<string, Access>();
const consumerAccess = new Map<string, Access>();
const pending = new Map<string, Promise<WatchlistIndicatorSnapshot>>();
let service: IndicatorRefreshService | null = null;

export function watchlistIndicatorRefreshService(): IndicatorRefreshService {
  if (!service) {
    const coordinator = new IndicatorRequestCoordinator({ audit: event => service?.recordTransport(event) });
    service = new IndicatorRefreshService({ calendar: calendar as IndicatorCalendar,
      record: record => {
        const access = operationAccess.get(`${record.symbol}:${record.activationId}`);
        if (access && record.outcome === "queued") consumerAccess.set(record.id, access);
        if (!["queued", "running"].includes(record.outcome)) consumerAccess.delete(record.id);
        try {
          const store = watchlistIndicatorAuditStore(); store.enqueue(record); void store.flush();
        } catch { /* Persistent configuration/audit failure does not stop market-data delivery. */ }
      },
      saveCalculation: evidence => watchlistIndicatorAuditStore().saveCalculation(evidence),
      load: async input => {
        const access = consumerAccess.get(input.consumer);
        if (input.provider === "moomoo" && !access) return { provider: "moomoo", adjustment: "moomoo-forward",
          bars: [], pages: 0, transportIds: [], outcome: "authentication", nextEnd: null };
        return fetchIndicatorHistory({ ...input, coordinator,
          scope: input.provider === "moomoo" ? access!.requestScope : "watchlist-yahoo-chart",
          ...(input.provider === "moomoo" ? { accessToken: access!.token } : {}) });
      },
    });
    try { void watchlistIndicatorAuditStore().reconcileRestart(service.runtimeInstanceId).catch(() => {}); }
    catch { /* Owner audit reports storage unavailability separately. */ }
  }
  return service;
}

/** Invoke from the single Watchlist scheduler, never from a member page request. */
export function refreshWatchlistIndicators(symbol: string, activationId: string): Promise<WatchlistIndicatorSnapshot> {
  const key = `${symbol}:${activationId}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const runtime = watchlistIndicatorRefreshService();
  let entered = false;
  const operation = withWatchlistIndicatorMoomooAccess(async access => {
    entered = true; operationAccess.set(key, access);
    try { return await runtime.refresh(symbol, activationId); }
    finally { operationAccess.delete(key); }
  }).catch(error => {
    if (entered) throw error;
    // No connected/authorized Moomoo quote source: record that primary failure and try Yahoo.
    return runtime.refresh(symbol, activationId);
  }).finally(() => { pending.delete(key); operationAccess.delete(key); });
  pending.set(key, operation);
  return operation;
}
