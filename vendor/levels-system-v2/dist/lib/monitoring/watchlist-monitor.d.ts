import { type MonitoringConfig } from "./monitoring-config.js";
import type { LivePriceListener, LivePriceProvider } from "./live-price-types.js";
import type { MonitoringEvent, WatchlistEntry } from "./monitoring-types.js";
import { LevelStore } from "./level-store.js";
export type MonitoringEventListener = (event: MonitoringEvent) => void;
export declare class WatchlistMonitor {
    private readonly levelStore;
    private readonly livePriceProvider;
    private readonly config;
    private readonly symbolStates;
    private readonly emittedEventTimestamps;
    constructor(levelStore: LevelStore, livePriceProvider: LivePriceProvider, config?: MonitoringConfig);
    private ensureSymbolState;
    private reconcileSymbolState;
    private syncTrackedSymbols;
    private buildEventGateKey;
    private isEventOnCooldown;
    private markEventEmitted;
    private applyEmittedEventToState;
    private collectZoneEvents;
    private dedupeAndPrioritizeEvents;
    private emitPendingEvents;
    private handleUpdate;
    start(entries: WatchlistEntry[], listener: MonitoringEventListener, onPriceUpdate?: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=watchlist-monitor.d.ts.map