import type { LivePriceProvider, LivePriceListener } from "./live-price-types.js";
import type { WatchlistEntry } from "./monitoring-types.js";
export declare class StubLivePriceProvider implements LivePriceProvider {
    private timer?;
    private tick;
    start(entries: WatchlistEntry[], onUpdate: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=live-price-provider.d.ts.map