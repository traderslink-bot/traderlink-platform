import type { LevelQualityAuditReport } from "./level-quality-audit-runner.js";
export type LevelQualityFindingType = "limited_upside_extension_coverage" | "limited_downside_extension_coverage" | "missing_resistance_extension" | "missing_support_extension" | "clustered_levels_detected" | "possible_level_clutter" | "sparse_level_coverage" | "weak_context_levels_present" | "unenriched_levels_present" | "stale_levels_present" | "healthy_extension_coverage" | "no_engine_change_supported";
export type LevelQualityFindingSeverity = "info" | "watch" | "review";
export type LevelQualityFinding = {
    type: LevelQualityFindingType;
    severity: LevelQualityFindingSeverity;
    sampleCount: number;
    sampleSymbols: string[];
    evidence: string[];
    message: string;
};
export type LevelQualityRecommendedNextGate = "extension_coverage_review" | "cluster_cleanup_review" | "thin_liquidity_handling_review" | "stale_freshness_review" | "confluence_enrichment_review" | "no_engine_change_yet";
export type LevelQualityFindingsReport = {
    sampleCount: number;
    findings: LevelQualityFinding[];
    recurringFindings: LevelQualityFinding[];
    recommendedNextGates: LevelQualityRecommendedNextGate[];
    safety: {
        noRuntimeBehaviorChange: true;
        noScoringChange: true;
        reviewOnly: true;
    };
};
export declare function classifyLevelQualityFindings(input: LevelQualityAuditReport | LevelQualityAuditReport[]): LevelQualityFindingsReport;
//# sourceMappingURL=level-quality-findings-classifier.d.ts.map