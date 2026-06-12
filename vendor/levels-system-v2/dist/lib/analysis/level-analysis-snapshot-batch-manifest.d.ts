import { type LevelAnalysisSnapshot, type LevelAnalysisSnapshotInputTimeframe, type LevelAnalysisSnapshotSafety } from "./level-analysis-snapshot.js";
export declare const LEVEL_ANALYSIS_SNAPSHOT_BATCH_MANIFEST_SCHEMA_VERSION = "level-analysis-snapshot-batch-manifest/v1";
export declare const LEVEL_ANALYSIS_SNAPSHOT_BATCH_MANIFEST_PRODUCER = "levels-system";
export type LevelAnalysisSnapshotBatchManifestStatus = "accepted" | "failed" | "skipped" | "quarantined";
export type LevelAnalysisSnapshotBatchManifestTimeframeCoverage = {
    provided: boolean;
    candleCount: number;
    filteredCandleCount: number;
    excludedFutureCandleCount: number;
    excludedPartialCandleCount: number;
};
export type LevelAnalysisSnapshotBatchManifestEntry = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice?: number;
    artifactPath: string;
    artifactExists?: boolean;
    fileSizeBytes?: number;
    checksumSha256?: string;
    snapshotSchemaVersion?: string;
    snapshotProducer?: string;
    status: LevelAnalysisSnapshotBatchManifestStatus;
    validationErrors: string[];
    diagnostics: string[];
    timeframeCoverage: Record<LevelAnalysisSnapshotInputTimeframe, LevelAnalysisSnapshotBatchManifestTimeframeCoverage>;
    has15mInput: boolean;
    missing15mInput: boolean;
    noLookaheadApplied?: boolean;
    syntheticExtensionsClearlyMarked?: boolean;
    safety: Partial<LevelAnalysisSnapshotSafety>;
};
export type LevelAnalysisSnapshotBatchManifestSummary = {
    totalEntries: number;
    acceptedCount: number;
    failedCount: number;
    skippedCount: number;
    quarantinedCount: number;
    missing15mInputCount: number;
    with15mInputCount: number;
    timeframeAvailability: Record<LevelAnalysisSnapshotInputTimeframe, number>;
    noLookaheadAppliedCount: number;
    syntheticExtensionsClearlyMarkedCount: number;
    uniqueDiagnostics: string[];
    uniqueValidationErrors: string[];
};
export type LevelAnalysisSnapshotBatchManifestSafety = {
    noLookaheadAppliedForAccepted: boolean;
    syntheticExtensionsClearlyMarkedForAccepted: boolean;
    noRuntimeBehaviorChange: true;
};
export type LevelAnalysisSnapshotBatchManifest = {
    schemaVersion: typeof LEVEL_ANALYSIS_SNAPSHOT_BATCH_MANIFEST_SCHEMA_VERSION;
    producer: typeof LEVEL_ANALYSIS_SNAPSHOT_BATCH_MANIFEST_PRODUCER;
    batchId: string;
    generatedAt: string;
    outputRoot?: string;
    runConfig?: Record<string, unknown>;
    entries: LevelAnalysisSnapshotBatchManifestEntry[];
    summary: LevelAnalysisSnapshotBatchManifestSummary;
    diagnostics: string[];
    safety: LevelAnalysisSnapshotBatchManifestSafety;
};
export type LevelAnalysisSnapshotBatchManifestEntryInput = {
    artifactPath: string;
    snapshot?: LevelAnalysisSnapshot;
    artifactExists?: boolean;
    fileSizeBytes?: number;
    content?: string;
    status?: LevelAnalysisSnapshotBatchManifestStatus;
    validationErrors?: string[];
    diagnostics?: string[];
};
export type LevelAnalysisSnapshotBatchManifestInput = {
    batchId: string;
    generatedAt: string;
    outputRoot?: string;
    runConfig?: Record<string, unknown>;
    entries: LevelAnalysisSnapshotBatchManifestEntryInput[];
    diagnostics?: string[];
};
export type LevelAnalysisSnapshotBatchManifestValidationResult = {
    valid: boolean;
    errors: string[];
};
export type LevelAnalysisSnapshotBatchManifestBuildResult = {
    manifest: LevelAnalysisSnapshotBatchManifest;
    validation: LevelAnalysisSnapshotBatchManifestValidationResult;
};
export type DeriveLevelAnalysisSnapshotArtifactPathInput = {
    outputRoot: string;
    symbol: string;
    asOfTimestamp: number;
    fileName?: string;
};
export declare function hashLevelAnalysisSnapshotArtifact(content: string): string;
export declare function deriveLevelAnalysisSnapshotArtifactPath(input: DeriveLevelAnalysisSnapshotArtifactPathInput): string;
export declare function buildLevelAnalysisSnapshotBatchManifestEntry(input: LevelAnalysisSnapshotBatchManifestEntryInput): LevelAnalysisSnapshotBatchManifestEntry;
export declare function summarizeLevelAnalysisSnapshotBatchManifest(entries: LevelAnalysisSnapshotBatchManifestEntry[]): LevelAnalysisSnapshotBatchManifestSummary;
export declare function buildLevelAnalysisSnapshotBatchManifest(input: LevelAnalysisSnapshotBatchManifestInput): LevelAnalysisSnapshotBatchManifestBuildResult;
export declare function validateLevelAnalysisSnapshotBatchManifest(manifest: unknown): LevelAnalysisSnapshotBatchManifestValidationResult;
//# sourceMappingURL=level-analysis-snapshot-batch-manifest.d.ts.map