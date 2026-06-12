import type { AdaptiveStabilityState } from "./adaptive-stability.js";
export type AdaptiveStatePersistenceConfig = {
    minMultiplier: number;
    maxMultiplier: number;
    filePath?: string;
};
export type PersistedAdaptiveEventTypeState = {
    multiplier: number;
    disabled: boolean;
    weakStreak: number;
};
export type PersistedAdaptiveState = {
    version: 1;
    lastUpdated: number;
    globalMultiplier: number;
    eventTypes: Record<string, PersistedAdaptiveEventTypeState>;
};
export declare class AdaptiveStatePersistence {
    private readonly config;
    private readonly filePath;
    constructor(config: AdaptiveStatePersistenceConfig);
    getFilePath(): string;
    load(): AdaptiveStabilityState | null;
    save(state: AdaptiveStabilityState): void;
}
export declare function createAdaptiveStatePersistence(config: AdaptiveStatePersistenceConfig): AdaptiveStatePersistence;
//# sourceMappingURL=adaptive-state-persistence.d.ts.map