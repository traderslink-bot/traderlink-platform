import { IBApi } from "@stoqey/ib";
type ReconnectInfo = {
    code: 1101 | 1102;
    requiresResubscribe: boolean;
};
export declare const DEFAULT_IBKR_HOST = "127.0.0.1";
export declare const DEFAULT_IBKR_PORT = 7497;
export declare const DEFAULT_IBKR_CLIENT_ID = 101;
export declare function initializeIbkrRuntime(ib: IBApi): IBApi;
export declare function createIbkrClient(clientId?: number, host?: string, port?: number): IBApi;
export declare function isIbkrConnected(ib: IBApi): boolean;
export declare function isIbkrReconnecting(ib: IBApi): boolean;
export declare function onIbkrReconnect(ib: IBApi, listener: (info: ReconnectInfo) => void): () => void;
export declare function onIbkrDisconnect(ib: IBApi, listener: () => void): () => void;
export {};
//# sourceMappingURL=ibkr-runtime.d.ts.map