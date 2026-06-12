import { type LevelCandidateInventoryGapClassification, type LevelCandidateInventoryNearest, type LevelCandidateInventorySide, type LevelCandidateInventoryStage, type LevelCandidateInventoryVisibility } from "./level-candidate-inventory-visibility.js";
import { type LevelCandidateInventoryReviewVisibilityWrapper } from "./level-candidate-inventory-review-wiring.js";
type SourceFiles = LevelCandidateInventoryVisibility["sourceFiles"];
export type LevelCandidateInventoryReviewAdapterInput = {
    symbol: string;
    provider?: string;
    asOfTimestamp?: number;
    asOfIso?: string;
    referencePrice?: number;
    sourceFiles?: SourceFiles;
    candidatePoolDiagnostics?: unknown;
    diagnostics?: unknown;
    limitations?: string[];
    truthfulGapDistancePct?: number;
};
export declare function extractNearestCandidateInventoryRows(params: {
    diagnostics: unknown;
    stage: LevelCandidateInventoryStage;
    referencePrice?: number;
}): Partial<Record<LevelCandidateInventorySide, LevelCandidateInventoryNearest>>;
export declare function deriveCandidateInventoryGapClassification(params: {
    side: LevelCandidateInventorySide;
    nearest: Record<LevelCandidateInventoryStage, Partial<Record<LevelCandidateInventorySide, LevelCandidateInventoryNearest>>>;
    unsurfacedCloserPresent: boolean;
    limitations?: string[];
    truthfulGapDistancePct?: number;
}): LevelCandidateInventoryGapClassification;
export declare function buildMissingCandidateInventoryReviewVisibility(params?: {
    limitations?: string[];
    diagnostics?: string[];
}): LevelCandidateInventoryReviewVisibilityWrapper;
export declare function buildLevelCandidateInventoryReviewVisibility(input: LevelCandidateInventoryReviewAdapterInput): LevelCandidateInventoryReviewVisibilityWrapper;
export {};
//# sourceMappingURL=level-candidate-inventory-review-adapter.d.ts.map