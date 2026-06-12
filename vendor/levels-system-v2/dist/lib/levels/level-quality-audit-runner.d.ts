import type { LevelIntelligenceReport } from "./level-intelligence-report.js";
import { type LevelQualityDensityMetric } from "./level-quality-density-metric.js";
import { type LevelQualityDiagnosticDescription } from "./level-quality-audit-wording.js";
import type { FinalLevelZone, LevelEngineOutput, LevelDataFreshness } from "./level-types.js";
export type LevelQualityAuditBucket = "majorSupport" | "majorResistance" | "intermediateSupport" | "intermediateResistance" | "intradaySupport" | "intradayResistance" | "extensionSupport" | "extensionResistance";
export type LevelQualityAuditContextCounts = {
    session: number;
    volume: number;
    shelf: number;
    marketContext: number;
};
export type LevelQualityAuditItem = {
    levelId: string;
    symbol: string;
    kind: "support" | "resistance";
    bucket: LevelQualityAuditBucket;
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    strengthScore: number;
    strengthLabel: FinalLevelZone["strengthLabel"];
    auditScore: number;
    freshness: LevelDataFreshness;
    touchCount: number;
    confluenceCount: number;
    isExtension: boolean;
    hasEnrichedAnalysis: boolean;
    extensionSource?: NonNullable<FinalLevelZone["extensionMetadata"]>["extensionSource"];
    syntheticContinuationMap?: boolean;
    contextCounts: LevelQualityAuditContextCounts;
    distanceFromReferencePct?: number;
    diagnostics: string[];
};
export type LevelQualityEnrichmentBreakdown = {
    historical: {
        enriched: number;
        unenriched: number;
        unenrichedLevelIds: string[];
    };
    extension: {
        enriched: number;
        unenriched: number;
        unenrichedLevelIds: string[];
    };
    synthetic: {
        enriched: number;
        unenriched: number;
        unenrichedLevelIds: string[];
    };
};
export type LevelQualityCluster = {
    kind: "support" | "resistance" | "mixed";
    zoneLow: number;
    zoneHigh: number;
    representativePrices: number[];
    levelIds: string[];
    buckets: LevelQualityAuditBucket[];
    maxDistancePct: number;
    reason: string;
};
export type LevelQualityExtensionCoverage = {
    supportExtensions: number;
    resistanceExtensions: number;
    highestResistanceExtension?: number;
    lowestSupportExtension?: number;
    upsideCoveragePct?: number;
    downsideCoveragePct?: number;
    warnings: string[];
};
export type LevelQualityConfluenceSummary = {
    sessionConfluenceCount: number;
    volumeConfluenceCount: number;
    shelfConfluenceCount: number;
    marketContextConfluenceCount: number;
};
export type LevelQualityCoverageSummary = {
    referencePrice?: number;
    nearbySupportCount: number;
    nearbyResistanceCount: number;
    nearestSupport?: LevelQualityAuditItem;
    nearestResistance?: LevelQualityAuditItem;
    overheadResistanceGapPct?: number;
    downsideSupportGapPct?: number;
    warnings: string[];
};
export type LevelQualityAuditReport = {
    symbol: string;
    generatedAt: number;
    referencePrice?: number;
    summary: {
        totalLevels: number;
        supportCount: number;
        resistanceCount: number;
        extensionCount: number;
        freshCount: number;
        staleCount: number;
        enrichedCount: number;
        unenrichedCount: number;
    };
    strongestLevels: LevelQualityAuditItem[];
    weakestLevels: LevelQualityAuditItem[];
    staleLevels: LevelQualityAuditItem[];
    freshLevels: LevelQualityAuditItem[];
    strongConfluenceLevels: LevelQualityAuditItem[];
    weakContextLevels: LevelQualityAuditItem[];
    enrichedLevels: LevelQualityAuditItem[];
    unenrichedLevels: LevelQualityAuditItem[];
    enrichmentBreakdown?: LevelQualityEnrichmentBreakdown;
    possibleClutterLevels: LevelQualityAuditItem[];
    clusteredAreas: LevelQualityCluster[];
    extensionCoverage: LevelQualityExtensionCoverage;
    nearbyCoverage: LevelQualityCoverageSummary;
    confluenceSummary: LevelQualityConfluenceSummary;
    diagnostics: string[];
    diagnosticSemantics?: LevelQualityDiagnosticDescription[];
    densityMetric?: LevelQualityDensityMetric;
    safety: {
        levelOutputUnchanged: true;
        noRuntimeBehaviorChange: true;
        noScoringChange: true;
    };
};
export type BuildLevelQualityAuditReportRequest = {
    output: LevelEngineOutput;
    intelligenceReport?: LevelIntelligenceReport;
    clusterThresholdPct?: number;
    nearbyThresholdPct?: number;
    extensionCoverageWarningPct?: number;
    maxItems?: number;
};
export declare function buildLevelQualityAuditReport(request: BuildLevelQualityAuditReportRequest): LevelQualityAuditReport;
//# sourceMappingURL=level-quality-audit-runner.d.ts.map