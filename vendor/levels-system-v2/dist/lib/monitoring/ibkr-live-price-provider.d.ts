import { IBApi } from "@stoqey/ib";
import type { LivePriceProvider, LivePriceListener } from "./live-price-types.js";
import type { WatchlistEntry } from "./monitoring-types.js";
export declare class IBKRLivePriceProvider implements LivePriceProvider {
    private readonly port;
    private readonly clientId;
    private readonly ib;
    private readonly host;
    private readonly ownsConnection;
    private readonly subscriptions;
    private listener?;
    private isConnected;
    private hasRegisteredHandlers;
    private nextTickerId;
    private unsubscribeReconnect?;
    private unsubscribeDisconnect?;
    private readonly handleConnected;
    private readonly handleDisconnected;
    private readonly handleError;
    private readonly handleTickPrice;
    private readonly handleTickSize;
    private readonly handleRuntimeReconnect;
    private readonly handleRuntimeDisconnect;
    constructor(ib: IBApi);
    constructor(host?: string, port?: number, clientId?: number);
    private get ibAny();
    private registerEventHandlers;
    private unregisterEventHandlers;
    private requestMarketDataForSubscription;
    private resubscribeAll;
    private waitForConnection;
    start(entries: WatchlistEntry[], onUpdate: LivePriceListener): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=ibkr-live-price-provider.d.ts.map