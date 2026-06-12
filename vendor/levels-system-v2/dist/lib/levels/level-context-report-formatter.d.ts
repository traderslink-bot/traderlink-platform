import type { LevelContextReport } from "./level-context-report.js";
export type FormattedLevelContextReportSection = {
    title: string;
    lines: string[];
};
export type FormattedLevelContextReport = {
    symbol: string;
    generatedAt: number;
    summary: string;
    sections: FormattedLevelContextReportSection[];
    safety: LevelContextReport["safety"];
};
export declare function formatLevelContextReport(report: LevelContextReport): FormattedLevelContextReport;
//# sourceMappingURL=level-context-report-formatter.d.ts.map