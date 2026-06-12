import { CandleFetchService } from "../market-data/candle-fetch-service.js";
import type { LevelEngineOutput } from "../levels/level-types.js";
import { type LevelIntelligenceDiscordPreview } from "../alerts/level-intelligence-discord-preview.js";
import { type DiscordAlertRouter } from "../alerts/alert-router.js";
import { LevelStore } from "./level-store.js";
import type { WatchlistEntry } from "./monitoring-types.js";
import { OpportunityRuntimeController } from "./opportunity-runtime-controller.js";
import { WatchlistMonitor } from "./watchlist-monitor.js";
import { WatchlistStatePersistence } from "./watchlist-state-persistence.js";
import { WatchlistStore } from "./watchlist-store.js";
export type ManualWatchlistRuntimeManagerOptions = {
    candleFetchService: CandleFetchService;
    levelStore: LevelStore;
    monitor: WatchlistMonitor;
    discordAlertRouter: DiscordAlertRouter;
    opportunityRuntimeController: OpportunityRuntimeController;
    watchlistStore?: WatchlistStore;
    watchlistStatePersistence?: WatchlistStatePersistence;
    seedSymbolLevels?: (symbol: string) => Promise<void>;
    levelIntelligenceAlertPreviewDryRun?: LevelIntelligenceAlertPreviewDryRunOptions;
};
export type ManualWatchlistActivationInput = {
    symbol: string;
    note?: string;
};
export declare const LEVEL_INTELLIGENCE_ALERT_PREVIEW_DRY_RUN_ENV = "LEVEL_INTELLIGENCE_ALERT_PREVIEW_DRY_RUN";
export type LevelIntelligenceAlertPreviewDryRunBuildOptions = {
    maxMessageLength?: number;
};
export type LevelIntelligenceAlertPreviewDryRunBuilder = (output: LevelEngineOutput, options: LevelIntelligenceAlertPreviewDryRunBuildOptions) => LevelIntelligenceDiscordPreview;
export type LevelIntelligenceAlertPreviewDryRunResult = {
    mode: "dry-run";
    symbol: string;
    timestamp: number;
    alertId: string;
    eventId: string;
    threadId: string;
    levelGeneratedAt: number;
    preview: LevelIntelligenceDiscordPreview;
    content: string;
};
export type LevelIntelligenceAlertPreviewDryRunErrorContext = {
    symbol: string;
    timestamp: number;
    alertId: string;
    eventId: string;
};
export type LevelIntelligenceAlertPreviewDryRunOptions = {
    enabled?: boolean;
    maxMessageLength?: number;
    buildPreview?: LevelIntelligenceAlertPreviewDryRunBuilder;
    onPreview?: (result: LevelIntelligenceAlertPreviewDryRunResult) => void;
    onError?: (error: Error, context: LevelIntelligenceAlertPreviewDryRunErrorContext) => void;
};
export declare function resolveLevelIntelligenceAlertPreviewDryRun(value?: string | null): boolean;
export declare class ManualWatchlistRuntimeManager {
    private readonly options;
    private readonly levelEngine;
    private readonly watchlistStore;
    private readonly watchlistStatePersistence;
    private readonly alertIntelligenceEngine;
    private readonly activeSnapshotState;
    private isStarted;
    constructor(options: ManualWatchlistRuntimeManagerOptions);
    private persistWatchlist;
    private buildLevelSnapshotPayload;
    private buildLevelExtensionPayload;
    private postLevelSnapshot;
    private postLevelExtension;
    private refreshLevelsIfNeeded;
    private shouldTriggerResistanceRefresh;
    private shouldTriggerSupportRefresh;
    private maybeRefreshLevelSnapshot;
    private seedLevelsForSymbol;
    private emitTraderFacingInterpretations;
    private ensureLevelsForActiveEntries;
    private emitLevelIntelligenceAlertPreviewDryRun;
    private handleMonitoringEvent;
    private handlePriceUpdate;
    private restartMonitoring;
    start(): Promise<void>;
    stop(): Promise<void>;
    getActiveEntries(): WatchlistEntry[];
    activateSymbol(input: ManualWatchlistActivationInput): Promise<WatchlistEntry>;
    deactivateSymbol(symbol: string): Promise<WatchlistEntry | null>;
}
//# sourceMappingURL=manual-watchlist-runtime-manager.d.ts.map