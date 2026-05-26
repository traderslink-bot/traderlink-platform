import type { RuntimeMarketStructureSnapshot } from "./monitoring-types.js";
export type MarketStructureStoryDecisionReason = "pending_fresh_structure" | "current_material_structure" | "quiet_structure";
export type MarketStructureStoryDecision = {
    snapshot: RuntimeMarketStructureSnapshot | null;
    includeStory: boolean;
    reason: MarketStructureStoryDecisionReason;
    keys: string[];
};
export type MarketStructureStoryMemoryOptions = {
    pendingTtlMs?: number;
    postedWindowMs?: number;
};
export type ExpiredMarketStructureStory = {
    key: string;
    snapshot: RuntimeMarketStructureSnapshot;
    capturedAt: number;
    expiresAt: number;
    expiredAt: number;
};
export type MarketStructureStoryMemorySnapshot = {
    version: 1;
    generatedAt: number;
    pending: Array<{
        symbol: string;
        key: string;
        snapshot: RuntimeMarketStructureSnapshot;
        capturedAt: number;
        expiresAt: number;
    }>;
    posted: Array<{
        symbol: string;
        key: string;
        postedAt: number;
    }>;
};
export declare function getMaterialMarketStructureStoryKeys(snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
export declare function getFreshFormalBosChochMarketStructureStoryKeys(snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
export declare class MarketStructureStoryMemory {
    private readonly pendingTtlMs;
    private readonly postedWindowMs;
    private readonly pendingBySymbol;
    private readonly postedBySymbol;
    constructor(options?: MarketStructureStoryMemoryOptions);
    capture(symbolInput: string, timestampInput: number, snapshot: RuntimeMarketStructureSnapshot | null | undefined): string[];
    decide(symbolInput: string, timestampInput: number, currentSnapshot: RuntimeMarketStructureSnapshot | null | undefined): MarketStructureStoryDecision;
    markPosted(symbolInput: string, timestampInput: number, snapshot: RuntimeMarketStructureSnapshot | null | undefined, keysInput?: string[]): string[];
    consumeExpired(symbolInput: string, timestampInput: number): ExpiredMarketStructureStory[];
    clear(symbolInput: string): void;
    clearAll(): void;
    toSnapshot(timestampInput?: number): MarketStructureStoryMemorySnapshot;
    hydrate(snapshot: unknown, timestampInput?: number): void;
    private prune;
    private wasPosted;
}
//# sourceMappingURL=market-structure-story-memory.d.ts.map