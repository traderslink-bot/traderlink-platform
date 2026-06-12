import type { WatchlistEntry, WatchlistLifecycleState } from "./monitoring-types.js";
export declare class WatchlistStore {
    private readonly entries;
    private normalizeEntry;
    private getNextPriority;
    setEntries(entries: WatchlistEntry[]): void;
    getEntries(): WatchlistEntry[];
    getEntry(symbol: string): WatchlistEntry | undefined;
    upsertManualEntry(input: {
        symbol: string;
        note?: string;
        discordThreadId?: string | null;
        active: boolean;
        lifecycle?: WatchlistLifecycleState;
        activatedAt?: number;
        lastLevelPostAt?: number;
        lastExtensionPostAt?: number;
        refreshPending?: boolean;
    }): WatchlistEntry;
    patchEntry(symbol: string, patch: Partial<WatchlistEntry>): WatchlistEntry | null;
    deactivateSymbol(symbol: string): WatchlistEntry | null;
    getActiveEntries(): WatchlistEntry[];
}
//# sourceMappingURL=watchlist-store.d.ts.map