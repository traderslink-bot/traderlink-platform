import type { LevelIntelligenceReport } from "./level-intelligence-report.js";
export type FormattedLevelIntelligenceReportSection = {
    title: string;
    lines: string[];
};
export type FormattedLevelIntelligenceReport = {
    symbol: string;
    generatedAt: number;
    summary: string;
    sections: FormattedLevelIntelligenceReportSection[];
    diagnostics: string[];
    safety: LevelIntelligenceReport["safety"];
};
export declare function formatLevelIntelligenceReport(report: LevelIntelligenceReport): FormattedLevelIntelligenceReport;
//# sourceMappingURL=level-intelligence-report-formatter.d.ts.map