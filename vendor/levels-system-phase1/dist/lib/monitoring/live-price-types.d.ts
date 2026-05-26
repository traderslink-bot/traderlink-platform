import type { LivePriceUpdate, WatchlistEntry } from "./monitoring-types.js";
export type LivePriceListener = (update: LivePriceUpdate) => void;
export interface LivePriceProvider {
    start(entries: WatchlistEntry[], onUpdate: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=live-price-types.d.ts.map