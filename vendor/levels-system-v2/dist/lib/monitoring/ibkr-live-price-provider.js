// 2026-04-14 11:39 PM America/Toronto
// IBKR live price provider for real-time watchlist monitoring.
// This file intentionally uses a few local type casts because @stoqey/ib
// exposes strict event typings that do not line up cleanly with runtime usage.
import { createIbkrClient, initializeIbkrRuntime, isIbkrConnected, onIbkrDisconnect, onIbkrReconnect, } from "../../scripts/shared/ibkr-runtime.js";
export class IBKRLivePriceProvider {
    port;
    clientId;
    ib;
    host;
    ownsConnection;
    subscriptions = new Map();
    listener;
    isConnected = false;
    hasRegisteredHandlers = false;
    nextTickerId = 1;
    unsubscribeReconnect;
    unsubscribeDisconnect;
    handleConnected = () => {
        this.isConnected = true;
        console.log(`IBKR connected on ${this.host}:${this.port} with clientId ${this.clientId}`);
    };
    handleDisconnected = () => {
        this.isConnected = false;
        console.log("IBKR disconnected");
    };
    handleError = (error, code, reqId) => {
        console.error("IBKR error:", {
            error,
            code,
            reqId,
        });
    };
    handleTickPrice = (tickerId, field, price) => {
        const subscription = this.subscriptions.get(tickerId);
        if (!subscription ||
            !this.listener ||
            price === undefined ||
            !Number.isFinite(price) ||
            price <= 0) {
            return;
        }
        // 2026-04-14 11:39 PM America/Toronto
        // IB field mapping:
        // 1 = bid
        // 2 = ask
        // 4 = last
        if (field === 1) {
            subscription.bid = price;
        }
        else if (field === 2) {
            subscription.ask = price;
        }
        else if (field === 4) {
            subscription.lastPrice = price;
        }
        else {
            return;
        }
        const derivedLastPrice = subscription.lastPrice ?? subscription.bid ?? subscription.ask;
        if (!derivedLastPrice || derivedLastPrice <= 0) {
            return;
        }
        this.listener({
            symbol: subscription.symbol,
            timestamp: Date.now(),
            lastPrice: derivedLastPrice,
            bid: subscription.bid,
            ask: subscription.ask,
            volume: subscription.volume,
        });
    };
    handleTickSize = (tickerId, field, size) => {
        const subscription = this.subscriptions.get(tickerId);
        if (!subscription ||
            !this.listener ||
            size === undefined ||
            !Number.isFinite(size)) {
            return;
        }
        // 2026-04-14 11:39 PM America/Toronto
        // IB field mapping:
        // 8 = volume
        if (field === 8) {
            subscription.volume = size;
        }
        else {
            return;
        }
        const derivedLastPrice = subscription.lastPrice ?? subscription.bid ?? subscription.ask;
        if (!derivedLastPrice || derivedLastPrice <= 0) {
            return;
        }
        this.listener({
            symbol: subscription.symbol,
            timestamp: Date.now(),
            lastPrice: derivedLastPrice,
            bid: subscription.bid,
            ask: subscription.ask,
            volume: subscription.volume,
        });
    };
    handleRuntimeReconnect = (info) => {
        this.isConnected = true;
        if (!info.requiresResubscribe || !this.listener) {
            return;
        }
        this.resubscribeAll();
    };
    handleRuntimeDisconnect = () => {
        this.isConnected = false;
    };
    constructor(ibOrHost = "127.0.0.1", port = 7497, clientId = 101) {
        this.port = port;
        this.clientId = clientId;
        if (typeof ibOrHost !== "string") {
            this.ib = initializeIbkrRuntime(ibOrHost);
            this.host = "injected";
            this.ownsConnection = false;
            this.isConnected = isIbkrConnected(this.ib);
            return;
        }
        this.host = ibOrHost;
        this.ownsConnection = true;
        this.ib = createIbkrClient(this.clientId, this.host, this.port);
        this.isConnected = isIbkrConnected(this.ib);
    }
    // 2026-04-14 11:39 PM America/Toronto
    // The package typings for .on(...) are stricter than the runtime event strings we use.
    // Casting only this small boundary keeps the rest of the file typed.
    get ibAny() {
        return this.ib;
    }
    registerEventHandlers() {
        if (this.hasRegisteredHandlers) {
            return;
        }
        this.hasRegisteredHandlers = true;
        this.ibAny.on("connected", this.handleConnected);
        this.ibAny.on("disconnected", this.handleDisconnected);
        this.ibAny.on("error", this.handleError);
        this.ibAny.on("tickPrice", this.handleTickPrice);
        this.ibAny.on("tickSize", this.handleTickSize);
        this.unsubscribeReconnect = onIbkrReconnect(this.ib, this.handleRuntimeReconnect);
        this.unsubscribeDisconnect = onIbkrDisconnect(this.ib, this.handleRuntimeDisconnect);
    }
    unregisterEventHandlers() {
        if (!this.hasRegisteredHandlers) {
            return;
        }
        this.ibAny.off("connected", this.handleConnected);
        this.ibAny.off("disconnected", this.handleDisconnected);
        this.ibAny.off("error", this.handleError);
        this.ibAny.off("tickPrice", this.handleTickPrice);
        this.ibAny.off("tickSize", this.handleTickSize);
        this.unsubscribeReconnect?.();
        this.unsubscribeReconnect = undefined;
        this.unsubscribeDisconnect?.();
        this.unsubscribeDisconnect = undefined;
        this.hasRegisteredHandlers = false;
    }
    requestMarketDataForSubscription(subscription) {
        this.ibAny.reqMktData(subscription.tickerId, {
            symbol: subscription.symbol,
            secType: "STK",
            exchange: "SMART",
            currency: "USD",
        }, "", false, false);
    }
    resubscribeAll() {
        for (const subscription of this.subscriptions.values()) {
            this.requestMarketDataForSubscription(subscription);
        }
    }
    async waitForConnection(timeoutMs = 10_000) {
        const start = Date.now();
        while (!this.isConnected && !isIbkrConnected(this.ib)) {
            if (Date.now() - start > timeoutMs) {
                throw new Error("Timed out waiting for IBKR connection.");
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.isConnected = true;
    }
    async start(entries, onUpdate) {
        await this.stop();
        this.listener = onUpdate;
        this.registerEventHandlers();
        if (!isIbkrConnected(this.ib)) {
            this.ibAny.connect();
            await this.waitForConnection();
        }
        else {
            this.isConnected = true;
        }
        const activeEntries = entries.filter((entry) => entry.active);
        activeEntries.forEach((entry, index) => {
            const tickerId = this.nextTickerId;
            this.nextTickerId += 1;
            const symbol = entry.symbol.toUpperCase();
            this.subscriptions.set(tickerId, {
                tickerId,
                symbol,
            });
            this.requestMarketDataForSubscription(this.subscriptions.get(tickerId));
        });
    }
    async stop() {
        for (const [tickerId] of this.subscriptions) {
            try {
                this.ibAny.cancelMktData(tickerId);
            }
            catch (error) {
                console.error("Failed to cancel market data subscription:", tickerId, error);
            }
        }
        this.subscriptions.clear();
        this.nextTickerId = 1;
        if (this.ownsConnection && this.isConnected) {
            this.ibAny.disconnect();
        }
        this.unregisterEventHandlers();
        this.listener = undefined;
        if (this.ownsConnection) {
            this.isConnected = false;
        }
    }
}
