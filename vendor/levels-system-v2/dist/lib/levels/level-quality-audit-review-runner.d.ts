import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type LevelQualityAuditReport } from "./level-quality-audit-runner.js";
import type { LevelIntelligenceReport } from "./level-intelligence-report.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelQualityAuditReviewFormat = "text" | "json";
export type LevelQualityAuditReviewRunnerOptions = {
    levelOutputPath: string;
    levelIntelligenceReportPath?: string;
    outPath?: string;
    format: LevelQualityAuditReviewFormat;
};
export type LevelQualityAuditReviewRunnerResult = {
    levelOutputPath: string;
    levelIntelligenceReportPath?: string;
    outPath?: string;
    format: LevelQualityAuditReviewFormat;
    report: LevelQualityAuditReport;
    content: string;
};
export type LevelQualityAuditReviewRunnerFileSystem = {
    readFileSync: typeof readFileSync;
    writeFileSync: typeof writeFileSync;
    mkdirSync: typeof mkdirSync;
};
export declare function parseLevelQualityAuditReviewRunnerArgs(args: string[]): LevelQualityAuditReviewRunnerOptions;
export declare function loadLevelQualityAuditLevelOutputJson(filePath: string, fileSystem?: Pick<LevelQualityAuditReviewRunnerFileSystem, "readFileSync">): LevelEngineOutput;
export declare function loadLevelQualityAuditIntelligenceReportJson(filePath: string, fileSystem?: Pick<LevelQualityAuditReviewRunnerFileSystem, "readFileSync">): LevelIntelligenceReport;
export declare function renderLevelQualityAuditReport(report: LevelQualityAuditReport): string;
export declare function buildLevelQualityAuditReviewResult(output: LevelEngineOutput, intelligenceReport: LevelIntelligenceReport | undefined, format?: LevelQualityAuditReviewFormat): Omit<LevelQualityAuditReviewRunnerResult, "levelOutputPath" | "levelIntelligenceReportPath" | "outPath" | "format">;
export declare function runLevelQualityAuditReviewRunner(options: LevelQualityAuditReviewRunnerOptions, fileSystem?: LevelQualityAuditReviewRunnerFileSystem): LevelQualityAuditReviewRunnerResult;
//# sourceMappingURL=level-quality-audit-review-runner.d.ts.map