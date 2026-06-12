import { type FormattedLevelIntelligenceReport } from "../levels/level-intelligence-report-formatter.js";
import type { LevelIntelligenceReport } from "../levels/level-intelligence-report.js";
export type LevelIntelligenceDiscordPreviewSection = {
    title: string;
    lines: string[];
    text: string;
    truncated: boolean;
};
export type LevelIntelligenceDiscordPreviewMessage = {
    index: number;
    text: string;
    truncated: boolean;
};
export type LevelIntelligenceDiscordPreview = {
    symbol: string;
    summary: string;
    sections: LevelIntelligenceDiscordPreviewSection[];
    messages: LevelIntelligenceDiscordPreviewMessage[];
    diagnostics: string[];
    safety: FormattedLevelIntelligenceReport["safety"];
    maxMessageLength: number;
    truncated: boolean;
};
export type LevelIntelligenceDiscordPreviewDetailMode = "compact" | "full";
export type FormatLevelIntelligenceDiscordPreviewOptions = {
    detailMode?: LevelIntelligenceDiscordPreviewDetailMode;
    maxMessageLength?: number;
    maxLineLength?: number;
    maxLinesPerSection?: number;
};
export declare function formatLevelIntelligenceDiscordPreview(input: LevelIntelligenceReport | FormattedLevelIntelligenceReport, options?: FormatLevelIntelligenceDiscordPreviewOptions): LevelIntelligenceDiscordPreview;
//# sourceMappingURL=level-intelligence-discord-preview.d.ts.map