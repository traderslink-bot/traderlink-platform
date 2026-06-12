import type { WatchlistEntry } from "./monitoring-types.js";
export type PersistedWatchlistState = {
    version: 1;
    lastUpdated: number;
    entries: WatchlistEntry[];
};
export type WatchlistStatePersistenceConfig = {
    filePath?: string;
};
export declare class WatchlistStatePersistence {
    private readonly filePath;
    constructor(config?: WatchlistStatePersistenceConfig);
    getFilePath(): string;
    load(): WatchlistEntry[] | null;
    save(entries: WatchlistEntry[]): void;
}
//# sourceMappingURL=watchlist-state-persistence.d.ts.map