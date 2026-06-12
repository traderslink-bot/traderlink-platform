import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type FormattedLevelIntelligenceReport } from "./level-intelligence-report-formatter.js";
import { type LevelIntelligenceReport } from "./level-intelligence-report.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelIntelligenceReportRunnerFormat = "text" | "json";
export type LevelIntelligenceReportRunnerOptions = {
    levelOutputPath: string;
    outPath?: string;
    format: LevelIntelligenceReportRunnerFormat;
};
export type LevelIntelligenceReportRunnerResult = {
    levelOutputPath: string;
    outPath?: string;
    format: LevelIntelligenceReportRunnerFormat;
    report: LevelIntelligenceReport;
    formatted: FormattedLevelIntelligenceReport;
    content: string;
};
export type LevelIntelligenceReportRunnerFileSystem = {
    readFileSync: typeof readFileSync;
    writeFileSync: typeof writeFileSync;
    mkdirSync: typeof mkdirSync;
};
export declare function parseLevelIntelligenceReportRunnerArgs(args: string[]): LevelIntelligenceReportRunnerOptions;
export declare function loadLevelEngineOutputJson(filePath: string, fileSystem?: Pick<LevelIntelligenceReportRunnerFileSystem, "readFileSync">): LevelEngineOutput;
export declare function renderFormattedLevelIntelligenceReport(formatted: FormattedLevelIntelligenceReport): string;
export declare function buildLevelIntelligenceReviewResult(output: LevelEngineOutput, format?: LevelIntelligenceReportRunnerFormat): Omit<LevelIntelligenceReportRunnerResult, "levelOutputPath" | "outPath" | "format">;
export declare function runLevelIntelligenceReportRunner(options: LevelIntelligenceReportRunnerOptions, fileSystem?: LevelIntelligenceReportRunnerFileSystem): LevelIntelligenceReportRunnerResult;
//# sourceMappingURL=level-intelligence-report-runner.d.ts.map