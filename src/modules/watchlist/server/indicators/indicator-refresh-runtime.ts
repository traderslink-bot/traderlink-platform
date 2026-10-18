import "server-only";
import { IndicatorRequestCoordinator } from "@/src/lib/live-watchlist/indicators/indicator-request-coordinator";
import { fetchIndicatorHistory } from "@/src/lib/live-watchlist/indicators/indicator-history-provider";
import { IndicatorRefreshService } from "@/src/lib/live-watchlist/indicators/indicator-refresh-service";
import type { WatchlistIndicatorSnapshot, IndicatorRefreshDemand } from "@/src/lib/live-watchlist/indicators/indicator-refresh-service";
import type { IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import calendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { withWatchlistIndicatorMoomooAccess } from "../moomoo-watchlist-candle-bridge";
import { watchlistIndicatorAuditStore } from "./indicator-audit-runtime";
import { watchlistMoomooAdmission } from "../setups/setup-admission-runtime";

type Access = Readonly<{ token: string; requestScope: string }>;
// Credentials exist only inside the authorized operation; they never enter snapshots or audit records.
type RuntimeState = { operationAccess: Map<string, Access>; consumerAccess: Map<string, Access>;
  pending: Map<string, Promise<WatchlistIndicatorSnapshot>>; service: IndicatorRefreshService | null };
const processState = globalThis as typeof globalThis & { __watchlistIndicatorsV1?: RuntimeState };
const state = processState.__watchlistIndicatorsV1 ??= { operationAccess: new Map(), consumerAccess: new Map(), pending: new Map(), service: null };
const { operationAccess, consumerAccess, pending } = state;
const consumerPublications = new Map<string, { symbol: string; activationId: string }>();

/** Read-only member path: does not initialize a worker or request provider data. */
export function readCachedWatchlistIndicators(symbol: string, activationId: string): WatchlistIndicatorSnapshot | null {
  return state.service?.current(symbol, activationId) ?? null;
}

/** Authenticated runtime-only reuse; provider provenance is not part of the member payload. */
export function readSharedWatchlistIndicatorCandles(symbol: string, activationId: string) {
  return state.service?.sharedFiveMinute(symbol, activationId) ?? null;
}

export function reconcileWatchlistIndicatorPopulation(active: ReadonlyMap<string, string>): void {
  state.service?.reconcilePopulation(active);
}

export function watchlistIndicatorRefreshService(): IndicatorRefreshService {
  if (!state.service) {
    const coordinator = new IndicatorRequestCoordinator({ audit: event => state.service?.recordTransport(event), admission: watchlistMoomooAdmission() });
    state.service = new IndicatorRefreshService({ calendar: calendar as IndicatorCalendar,
      record: record => {
        if (record.outcome === "queued") consumerPublications.set(record.id, { symbol: record.symbol, activationId: record.activationId });
        if (!["queued", "running"].includes(record.outcome)) consumerPublications.delete(record.id);
        const access = operationAccess.get(`${record.symbol}:${record.activationId}`);
        if (access && record.outcome === "queued") consumerAccess.set(record.id, access);
        if (!["queued", "running"].includes(record.outcome)) consumerAccess.delete(record.id);
        try {
          const store = watchlistIndicatorAuditStore(); store.enqueue(record); void store.flush();
        } catch { /* Persistent configuration/audit failure does not stop market-data delivery. */ }
      },
      saveCalculation: async evidence => {
        const saved = await watchlistIndicatorAuditStore().saveCalculation(evidence);
        // Detection consumes this same accepted evidence, never another provider refresh.
        // Its failure cannot block the existing Indicators or publishing workflow.
        try {
          const { recordAcceptedWatchlistSetupCalculation } = await import("../setups/setup-runtime");
          await recordAcceptedWatchlistSetupCalculation(evidence);
        } catch { /* Setup Audit exposes missing/retained results separately. */ }
        return saved;
      },
      load: async input => {
        const { watchlistFeedDemandFor } = await import("../setups/setup-shared-feed-runtime");
        const publication = consumerPublications.get(input.consumer);
        const identity = publication?.symbol === input.request.symbol ? publication.activationId : null;
        const demand = identity ? await watchlistFeedDemandFor(input.request.symbol, identity) : null;
        const allowed = async () => {
          const latest = identity ? await watchlistFeedDemandFor(input.request.symbol, identity) : null;
          return Boolean(latest?.frames.includes(input.request.timeframe) && (input.provider !== "yahoo" || latest.frames.length > 2));
        };
        if (!demand?.frames.includes(input.request.timeframe) || input.provider === "yahoo" && demand.frames.length === 2) return { provider: input.provider,
          adjustment: input.provider === "moomoo" ? "moomoo-forward" : "yahoo-chart-native", bars: [], pages: 0,
          transportIds: [], outcome: "permission", nextEnd: null };
        const access = consumerAccess.get(input.consumer);
        if (input.provider === "moomoo" && !access) return { provider: "moomoo", adjustment: "moomoo-forward",
          bars: [], pages: 0, transportIds: [], outcome: "authentication", nextEnd: null };
        return fetchIndicatorHistory({ ...input, coordinator, requestAllowed: allowed, isCurrent: allowed, additionalDemand: demand.frames.length === 2,
          scope: input.provider === "moomoo" ? access!.requestScope : "watchlist-yahoo-chart",
          ...(input.provider === "moomoo" ? { accessToken: access!.token } : {}) });
      },
    });
    try { void watchlistIndicatorAuditStore().reconcileRestart(state.service.runtimeInstanceId).catch(() => {}); }
    catch { /* Owner audit reports storage unavailability separately. */ }
  }
  return state.service;
}

/** Invoke from the single Watchlist scheduler, never from a member page request. */
export function refreshWatchlistIndicators(symbol: string, activationId: string, demand?: IndicatorRefreshDemand): Promise<WatchlistIndicatorSnapshot> {
  const key = `${symbol}:${activationId}`;
  const existing = pending.get(key);
  if (existing) return existing.then(() => refreshWatchlistIndicators(symbol, activationId, demand));
  const runtime = watchlistIndicatorRefreshService();
  let entered = false;
  const operation = (async () => {
    if (!runtime.current(symbol, activationId)) {
      try {
        const evidence = await watchlistIndicatorAuditStore().latestCalculation(symbol, activationId);
        if (evidence) runtime.restore(symbol, activationId, evidence);
      } catch { /* Missing/invalid replay inputs require a fresh warm-up; no invented checkpoint. */ }
    }
    if (!runtime.needsRefresh(symbol, activationId, demand)) return runtime.refresh(symbol, activationId, demand);
    return withWatchlistIndicatorMoomooAccess(async access => {
      entered = true; operationAccess.set(key, access);
      try { return await runtime.refresh(symbol, activationId, demand); }
      finally { operationAccess.delete(key); }
    }).catch(error => {
      if (entered) throw error;
      // No connected/authorized Moomoo quote source: record that primary failure and try Yahoo.
      return runtime.refresh(symbol, activationId, demand);
    });
  })().then(async snapshot => {
    if (demand?.reuseCompletedFrames) {
      try {
        const { ensureWatchlistSetupsFromSavedCalculation } = await import("../setups/setup-runtime");
        await ensureWatchlistSetupsFromSavedCalculation(symbol, activationId);
      } catch { /* Independent setup status cannot withhold an Indicators snapshot. */ }
    }
    return snapshot;
  }).finally(() => { pending.delete(key); operationAccess.delete(key); });
  pending.set(key, operation);
  return operation;
}
