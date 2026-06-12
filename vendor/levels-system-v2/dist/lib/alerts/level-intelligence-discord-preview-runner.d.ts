import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type LevelIntelligenceDiscordPreview, type LevelIntelligenceDiscordPreviewMessage } from "./level-intelligence-discord-preview.js";
import type { LevelEngineOutput } from "../levels/level-types.js";
import type { MarketContextFactsBundle, MarketContextProfile } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
export type LevelIntelligenceDiscordPreviewRunnerFormat = "text" | "json";
export type LevelIntelligenceDiscordPreviewRunnerMode = "dry-run" | "send-test";
export type LevelIntelligenceDiscordPreviewRunnerOptions = {
    levelOutputPath: string;
    sessionFactsPath?: string;
    volumeFactsPath?: string;
    volumeShelvesPath?: string;
    marketContextPath?: string;
    factsBundlePath?: string;
    outPath?: string;
    format: LevelIntelligenceDiscordPreviewRunnerFormat;
    mode: LevelIntelligenceDiscordPreviewRunnerMode;
    testWebhookUrl?: string;
    maxMessageLength?: number;
};
export type LevelIntelligenceDiscordPreviewFactsInput = {
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
};
export type LevelIntelligenceDiscordPreviewSendRequest = {
    webhookUrl: string;
    message: LevelIntelligenceDiscordPreviewMessage;
    payload: {
        content: string;
    };
};
export type LevelIntelligenceDiscordPreviewSendResult = {
    messageIndex: number;
    ok: boolean;
    status?: number;
    dryRun: boolean;
};
export type LevelIntelligenceDiscordPreviewSender = (request: LevelIntelligenceDiscordPreviewSendRequest) => Promise<Omit<LevelIntelligenceDiscordPreviewSendResult, "messageIndex" | "dryRun">>;
export type LevelIntelligenceDiscordPreviewRunnerResult = {
    levelOutputPath: string;
    outPath?: string;
    format: LevelIntelligenceDiscordPreviewRunnerFormat;
    mode: LevelIntelligenceDiscordPreviewRunnerMode;
    reportSymbol: string;
    preview: LevelIntelligenceDiscordPreview;
    sendResults: LevelIntelligenceDiscordPreviewSendResult[];
    content: string;
};
export type LevelIntelligenceDiscordPreviewRunnerFileSystem = {
    readFileSync: typeof readFileSync;
    writeFileSync: typeof writeFileSync;
    mkdirSync: typeof mkdirSync;
};
export type LevelIntelligenceDiscordPreviewRunnerEnv = {
    LEVEL_INTELLIGENCE_TEST_DISCORD_WEBHOOK_URL?: string;
};
export declare function parseLevelIntelligenceDiscordPreviewRunnerArgs(args: string[], env?: LevelIntelligenceDiscordPreviewRunnerEnv): LevelIntelligenceDiscordPreviewRunnerOptions;
export declare function loadLevelIntelligenceDiscordPreviewFactsInput(options: Pick<LevelIntelligenceDiscordPreviewRunnerOptions, "sessionFactsPath" | "volumeFactsPath" | "volumeShelvesPath" | "marketContextPath" | "factsBundlePath">, fileSystem?: Pick<LevelIntelligenceDiscordPreviewRunnerFileSystem, "readFileSync">): LevelIntelligenceDiscordPreviewFactsInput;
export declare function buildLevelIntelligenceDiscordPreviewReviewResult(output: LevelEngineOutput, options: Pick<LevelIntelligenceDiscordPreviewRunnerOptions, "levelOutputPath" | "outPath" | "format" | "mode" | "maxMessageLength"> & {
    factsInput?: LevelIntelligenceDiscordPreviewFactsInput;
}): Omit<LevelIntelligenceDiscordPreviewRunnerResult, "sendResults" | "content">;
export declare function sendLevelIntelligenceDiscordPreviewWebhookMessage(request: LevelIntelligenceDiscordPreviewSendRequest): Promise<Omit<LevelIntelligenceDiscordPreviewSendResult, "messageIndex" | "dryRun">>;
export declare function runLevelIntelligenceDiscordPreviewRunner(options: LevelIntelligenceDiscordPreviewRunnerOptions, fileSystem?: LevelIntelligenceDiscordPreviewRunnerFileSystem, sender?: LevelIntelligenceDiscordPreviewSender): Promise<LevelIntelligenceDiscordPreviewRunnerResult>;
//# sourceMappingURL=level-intelligence-discord-preview-runner.d.ts.map