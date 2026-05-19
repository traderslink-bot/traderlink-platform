export type LevelRuntimeMode = "old" | "new" | "compare";
export type LevelRuntimeCompareActivePath = "old" | "new";
export type ResolvedLevelRuntimeSettings = {
    mode: LevelRuntimeMode;
    compareActivePath: LevelRuntimeCompareActivePath;
    compareLoggingEnabled: boolean;
    rawMode: string | null;
    rawCompareActivePath: string | null;
};
export declare const LEVEL_RUNTIME_MODE_ENV = "LEVEL_RUNTIME_MODE";
export declare const LEVEL_RUNTIME_COMPARE_ACTIVE_PATH_ENV = "LEVEL_RUNTIME_COMPARE_ACTIVE_PATH";
export declare function resolveLevelRuntimeMode(value?: string | null): LevelRuntimeMode;
export declare function resolveLevelRuntimeCompareActivePath(value?: string | null): LevelRuntimeCompareActivePath;
export declare function resolveLevelRuntimeSettings(env?: NodeJS.ProcessEnv): ResolvedLevelRuntimeSettings;
//# sourceMappingURL=level-runtime-mode.d.ts.map